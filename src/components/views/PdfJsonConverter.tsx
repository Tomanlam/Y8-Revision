import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, Download, RefreshCw, Upload, Save, CheckCircle2, Copy, ShieldCheck } from 'lucide-react';
import { GoogleGenAI, Schema } from '@google/genai';
import autoTable from 'jspdf-autotable';

interface PdfJsonConverterProps {
  onClose: () => void;
  onAppendToWorksheet: (questions: any[], markscheme: any) => void;
  onAppendToSecureTest: (questions: any[], markscheme: any) => void;
}

export default function PdfJsonConverter({ onClose, onAppendToWorksheet, onAppendToSecureTest }: PdfJsonConverterProps) {
  const [qJson, setQJson] = useState('');
  const [mJson, setMJson] = useState('');
  const [step, setStep] = useState<'input' | 'compiled' | 'reprocessing' | 'done'>('input');
  
  const [compiledPdfUrl, setCompiledPdfUrl] = useState<string | null>(null);
  const [compiledPdfBlob, setCompiledPdfBlob] = useState<Blob | null>(null);
  
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  
  const [reprocessedQJson, setReprocessedQJson] = useState('');
  const [reprocessedMJson, setReprocessedMJson] = useState('');

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleCompile = () => {
    try {
      const questions = JSON.parse(qJson);
      
      const doc = new jsPDF();
      let y = 20;
      doc.setFontSize(16);
      doc.text("Generated Assessment", 105, y, { align: 'center' });
      y += 15;
      doc.setFontSize(11);
      
      questions.forEach((q: any, i: number) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        
        doc.setFont('helvetica', 'bold');
        const qText = doc.splitTextToSize(`Q${i + 1}. ${q.question || ''}`, 180);
        doc.text(qText, 14, y);
        y += qText.length * 6 + 4;
        
        doc.setFont('helvetica', 'normal');
        
        if (q.type === 'mcq' && Array.isArray(q.options)) {
          q.options.forEach((opt: string, oIdx: number) => {
            const letter = String.fromCharCode(65 + oIdx);
            doc.text(`[ ] ${letter}) ${opt}`, 20, y);
            y += 7;
          });
          y += 5;
        } else if (q.type === 'short-response') {
          for (let j = 0; j < 5; j++) {
            doc.line(14, y, 196, y);
            y += 8;
          }
          y += 5;
        } else if (q.type === 'file-upload' || q.type === 'annotate') {
          doc.rect(14, y, 182, 60);
          doc.setTextColor(150);
          doc.text(q.type === 'annotate' ? "Diagram area (awaiting attachment) / Annotation Space" : "Sketch / Upload space", 105, y + 30, { align: 'center' });
          doc.setTextColor(0);
          y += 65;
        } else if (q.type === 'tick-cross') {
          doc.text("[ ] TRUE    [ ] FALSE", 20, y);
          y += 10;
        } else if (q.type === 'table') {
          const tRows = q.tableData || [['Column 1', 'Column 2'], ['', ''], ['', '']];
          autoTable(doc, {
            startY: y,
            body: tRows.slice(1).map(r => r.map(c => ' ')), // empty cells
            head: [tRows[0]],
            theme: 'grid',
            styles: { minCellHeight: 15 }
          });
          y = (doc as any).lastAutoTable.finalY + 10;
        } else if (q.type === 'reorder') {
          const items = q.items || [];
          items.forEach((item: string, idx: number) => {
             doc.text(`__ ${item}`, 20, y);
             y += 8;
          });
          y += 5;
        } else {
          for (let j = 0; j < 3; j++) {
            doc.line(14, y, 196, y);
            y += 8;
          }
          y += 5;
        }
      });
      
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      setCompiledPdfBlob(blob);
      setCompiledPdfUrl(url);
      setStep('compiled');
      
    } catch (e: any) {
      alert("Error parsing JSON or compiling PDF: " + e.message);
    }
  };

  const handleReprocess = async () => {
    if (!compiledPdfBlob) return;
    setStep('reprocessing');
    setLogs([]);
    setProgress(10);
    addLog("Converting PDF to base64...");
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(compiledPdfBlob);
      reader.onloadend = async () => {
        const base64data = (reader.result as string).split(',')[1];
        addLog("Base64 conversion complete. Sending to Gemini...");
        setProgress(30);
        
        try {
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
          const result = await ai.models.generateContent({
             model: 'gemini-3.1-flash-lite-preview',
             contents: [
                {
                   role: 'user',
                   parts: [
                      {
                         text: `Extract questions from this assessment PDF and output a JSON array of objects.
Utilize these supported question types: 'mcq' (requires 'options' array), 'short-response', 'table' (requires 'tableData' 2D array of strings for initial state), 'tick-cross' (True/False), 'reorder' (requires 'items' array of strings to order), 'file-upload', 'annotate' (annotate a diagram).

Generate random unique IDs for each question using prefix "reproc_" to avoid collision.

Example format:
[
  { "id": "reproc_1abc", "type": "mcq", "question": "What is the capital of France?", "options": ["Paris", "London", "Berlin", "Madrid"] },
  { "id": "reproc_2xyz", "type": "annotate", "question": "Annotate the provided diagram of a cell." }
]
Output strictly the JSON array without markdown formatting.`
                      },
                      {
                         inlineData: {
                            data: base64data,
                            mimeType: 'application/pdf'
                         }
                      }
                   ]
                }
             ],
             config: {
                temperature: 0.2
             }
          });
          
          setProgress(70);
          addLog("Received response from Gemini.");
          
          const text = result.text;
          if (!text) throw new Error("No text returned");
          
          const jsonStr = text.replace(/\\`\\`\\`(json)?/g, '').trim();
          addLog("Parsing Gemini response...");
          let newQuestions = JSON.parse(jsonStr);
          if (!Array.isArray(newQuestions)) {
             newQuestions = [newQuestions];
          }
          
          addLog("Response parsed successfully. Aligning Mark Schemes...");
          setProgress(90);
          
          try {
             // We need to remap the mark scheme to the newly generated IDs.
             // We'll assume the same number of questions in the same order, so we zip them.
             const oldMJson = JSON.parse(mJson);
             const oldQuestions = JSON.parse(qJson);
             
             const newMObj: any = {};
             
             // Map old IDs to new IDs by index
             newQuestions.forEach((nq: any, i: number) => {
                 if (oldQuestions[i]) {
                     const oldId = oldQuestions[i].id;
                     if (oldMJson[oldId]) {
                         newMObj[nq.id] = oldMJson[oldId];
                     } else {
                         // Default mark scheme if missing
                         newMObj[nq.id] = { marks: 1, rubric: "Auto-generated mark scheme", correct_answer: "" };
                     }
                 } else {
                     newMObj[nq.id] = { marks: 1, rubric: "Auto-generated mark scheme", correct_answer: "" };
                 }
             });
             
             setReprocessedQJson(JSON.stringify(newQuestions, null, 2));
             setReprocessedMJson(JSON.stringify(newMObj, null, 2));
             
             setStep('done');
             addLog("Processing completed!");
             setProgress(100);
          } catch (e: any) {
             throw new Error("Failed to map Mark Scheme JSON: " + e.message);
          }
          
        } catch (e: any) {
          addLog("Gemini extraction failed: " + e.message);
          alert("Extraction failed.");
          setStep('compiled'); 
        }
      };
    } catch (e: any) {
      addLog("Failed to read blob: " + e.message);
      setStep('compiled');
    }
  };

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-6">
       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" />
       
       <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white w-full max-w-6xl h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
         <div className="p-6 border-b border-slate-100 flex items-center justify-between">
           <div>
             <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">PDF Converter Engine</h3>
             <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest mt-1">Compile JSON to PDF & Reprocess via Gemini</p>
           </div>
           <button onClick={onClose} className="p-3 bg-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-all"><X size={20} /></button>
         </div>
         
         <div className="flex-1 overflow-hidden flex">
           
           {step === 'input' && (
             <div className="flex-1 flex flex-col p-6 gap-4">
                <div className="grid grid-cols-2 gap-4 flex-1">
                   <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Question JSON</label>
                      <textarea value={qJson} onChange={e => setQJson(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-4 font-mono text-xs w-full resize-none focus:ring-2 focus:ring-indigo-500" placeholder="[{ 'id': '...', 'type': 'mcq', ... }]" />
                   </div>
                   <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Mark Scheme JSON</label>
                      <textarea value={mJson} onChange={e => setMJson(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-4 font-mono text-xs w-full resize-none focus:ring-2 focus:ring-indigo-500" placeholder="{ 'qId': { 'marks': 1, 'rubric': '...' } }" />
                   </div>
                </div>
                <button onClick={handleCompile} disabled={!qJson || !mJson} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold uppercase tracking-widest disabled:opacity-50 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                   <FileText size={18} /> Compile PDF
                </button>
             </div>
           )}

           {step === 'compiled' && compiledPdfUrl && (
             <div className="flex-1 flex p-6 gap-6">
                <div className="flex-1 bg-slate-100 rounded-2xl overflow-hidden shadow-inner hidden md:block">
                   <iframe src={compiledPdfUrl} className="w-full h-full" title="Compiled PDF" />
                </div>
                <div className="w-full md:w-80 flex flex-col gap-4">
                   <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">Compilation Success</h4>
                   <p className="text-sm text-slate-500 mb-4">Your JSON Assessment has been compiled directly into a printable format.</p>
                   
                   <a href={compiledPdfUrl} download="Generated_Assessment.pdf" className="w-full p-4 bg-slate-800 text-white rounded-2xl font-bold uppercase text-[11px] tracking-widest flex items-center justify-center gap-2 hover:bg-slate-900 transition-colors">
                      <Download size={16} /> Download PDF
                   </a>
                   
                   <div className="my-2 border-t border-slate-200" />
                   
                   <button onClick={handleReprocess} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                      <RefreshCw size={18} /> Reprocess JSON
                   </button>
                   
                   <button onClick={() => setStep('input')} className="w-full py-3 bg-red-50 text-red-600 rounded-2xl font-bold uppercase tracking-widest hover:bg-red-100 transition-colors text-[11px]">
                      Cancel & Go Back
                   </button>
                </div>
             </div>
           )}

           {step === 'reprocessing' && (
             <div className="flex-1 flex flex-col items-center justify-center p-12 max-w-2xl mx-auto w-full">
                <div className="w-32 h-32 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-500 mb-8 animate-pulse">
                  <RefreshCw size={64} className="animate-spin" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight text-center mb-8">Reprocessing with Gemini</h3>
                
                <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden mb-8">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-indigo-500"
                  />
                </div>

                <div className="w-full bg-slate-900 rounded-2xl p-6 font-mono text-[10px] text-green-400 h-64 overflow-y-auto space-y-2 shadow-inner">
                  {logs.map((log, i) => (
                     <div key={i}>{log}</div>
                  ))}
                </div>
             </div>
           )}

           {step === 'done' && (
             <div className="flex-1 flex flex-col p-6 gap-4">
                <div className="flex items-center gap-3 mb-2">
                   <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                     <CheckCircle2 size={24} />
                   </div>
                   <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Reprocessed Successfully</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4 flex-1">
                   <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">New Question JSON (with new IDs)</label>
                      <textarea readOnly value={reprocessedQJson} className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-4 font-mono text-[10px] w-full resize-none" />
                   </div>
                   <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">New Mark Scheme JSON (ID aligned)</label>
                      <textarea readOnly value={reprocessedMJson} className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-4 font-mono text-[10px] w-full resize-none" />
                   </div>
                </div>
                
                <div className="flex gap-4 mt-4">
                   <button onClick={() => {
                        try {
                           onAppendToWorksheet(JSON.parse(reprocessedQJson), JSON.parse(reprocessedMJson));
                           onClose();
                        } catch(e: any) { alert("Error parsing JSON: " + e.message); }
                     }} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                      <FileText size={18} /> Append to New Worksheet
                   </button>
                   <button onClick={() => {
                        try {
                           onAppendToSecureTest(JSON.parse(reprocessedQJson), JSON.parse(reprocessedMJson));
                           onClose();
                        } catch(e: any) { alert("Error parsing JSON: " + e.message); }
                     }} className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-rose-600 transition-colors flex items-center justify-center gap-2">
                      <ShieldCheck size={18} /> Append to New Secure Test
                   </button>
                </div>
             </div>
           )}

         </div>
       </motion.div>
    </div>
  );
}
