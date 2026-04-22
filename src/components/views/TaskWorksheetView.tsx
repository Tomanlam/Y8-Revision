import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, CheckCircle2, AlertCircle, FileText, Layout, ArrowRight, X, 
  Calculator, Edit, Eye, Send, Trash2, Timer, RefreshCw 
} from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Task, Question } from '../../types';
import { GoogleGenAI } from "@google/genai";

// PDF worker setup - Use unpkg for production reliability
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface TaskWorksheetViewProps {
  task: Task;
  onBack: () => void;
  onComplete: (responses: Record<string, any>, results?: any) => void;
  initialResponses?: Record<string, any>;
  readOnly?: boolean;
  isAdmin?: boolean;
  showCalculator: boolean;
  setShowCalculator: (v: boolean) => void;
}

import { rubrics } from '../../data/markschemes';

const TaskWorksheetView: React.FC<TaskWorksheetViewProps> = ({ task, onBack, onComplete, initialResponses, readOnly, isAdmin, showCalculator, setShowCalculator }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [activePage, setActivePage] = useState(1);
  const [responses, setResponses] = useState<Record<string, any>>(initialResponses || {});
  const [submitted, setSubmitted] = useState(false);
  const [viewerWidth, setViewerWidth] = useState(window.innerWidth * 0.45);
  const [isValidating, setIsValidating] = useState(false);
  const [validationFeedback, setValidationFeedback] = useState<Record<string, { score: string, feedback: string }>>({});
  
  const rightPaneRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Handle resize debounced
  useEffect(() => {
    const handleResize = () => setViewerWidth(window.innerWidth * 0.45);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const pdfOptions = useMemo(() => ({
    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
  }), []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  // Sync scroll from PDF to Questions
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            const pageNum = parseInt(target.getAttribute('data-page-index') || '1');
            setActivePage(pageNum);
            
            // Scroll matching questions into view on the right
            const questionElement = document.getElementById(`questions-page-${pageNum}`);
            if (questionElement && rightPaneRef.current) {
              questionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    Object.values(pageRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref as Element);
    });

    return () => observer.disconnect();
  }, [numPages]);

  const [showConfirm, setShowConfirm] = useState(false);

  const handleResponse = (questionId: string, value: string) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const handleFinalSubmit = async () => {
    setShowConfirm(false);
    setIsValidating(true);
    setValidationFeedback({});
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      const taskKey = task.title.replace('y8 ', '');
      const rubricText = rubrics[taskKey] || "Grade based on general scientific principles.";

      const prompt = `
        You are an expert science teacher. 
        I am providing you with:
        1. An official grading rubric (below).
        2. A list of student responses to specific questions from a worksheet.
        
        Task: Grade the student's responses based STRICTLY on the provided rubric for y8 ${taskKey}.
        
        Grading Rubric for y8 ${taskKey}:
        ${rubricText}
        
        Student Responses:
        ${JSON.stringify(responses, null, 2)}
        
        Worksheet Questions and Context:
        ${JSON.stringify(task.worksheetQuestions, null, 2)}
        
        Output Requirements:
        Return your response in a structured JSON format where each key is the question ID and the value is an object with "score" (a string like "1/1" or "0/1") and "feedback" (a brief helpful comment).
      `;

      const aiResponse = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-preview",
        contents: [{ text: prompt }],
        config: { responseMimeType: "application/json" },
      });

      let feedback = {};
      if (aiResponse.text) {
        feedback = JSON.parse(aiResponse.text);
        setValidationFeedback(feedback);
      }

      // Calculate numeric score from feedback
      let totalPoints = 0;
      let earnedPoints = 0;
      Object.values(feedback as any).forEach((f: any) => {
        const parts = f.score.split('/');
        if (parts.length === 2) {
          earnedPoints += parseFloat(parts[0]);
          totalPoints += parseFloat(parts[1]);
        }
      });

      setSubmitted(true);
      onComplete(responses, {
        score: earnedPoints,
        total: totalPoints || task.worksheetQuestions?.length || 0,
        feedback: feedback
      });
    } catch (error) {
      console.error("Submission/Validation failed:", error);
      alert("Something went wrong during grading. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleEdit = () => {
    setSubmitted(false);
  };


  const questionsByPage = task.worksheetQuestions?.reduce((acc, q) => {
    const page = (q as any).page || 1;
    if (!acc[page]) acc[page] = [];
    acc[page].push(q);
    return acc;
  }, {} as Record<number, Question[]>) || {};

  return (
    <div className="fixed inset-0 bg-white z-[200] flex flex-col overflow-hidden font-sans">
      {/* Dynamic Header */}
      <header className="h-16 border-b border-gray-100 px-6 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-50 rounded-xl transition-all text-gray-500"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="h-8 w-px bg-gray-100 mx-2" />
          <div className="flex flex-col">
            <h2 className="text-sm font-black text-gray-800 uppercase tracking-tighter truncate max-w-[300px]">
              {task.title}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                Interactive Worksheet
              </span>
              <span className="text-[10px] text-gray-300">•</span>
              <span className="text-[10px] font-bold text-gray-400">
                Page {activePage} of {numPages || '?'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowCalculator(!showCalculator)}
            className={`p-2 rounded-xl transition-all ${showCalculator ? 'bg-emerald-500 text-white shadow-lg' : 'bg-emerald-50 text-emerald-500 hover:bg-emerald-100'}`}
            title="Virtual Calculator"
          >
            <Calculator size={20} />
          </button>
          {readOnly && (
            <div className="hidden md:flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
              <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">
                Reviewing Submission
              </span>
            </div>
          )}
          <div className="hidden md:flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
            <CheckCircle2 size={14} className="text-emerald-500" />
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
              {Object.keys(responses).length} / {task.worksheetQuestions?.length || 0} Answered
            </span>
          </div>
          
          {(isAdmin || (!readOnly && !submitted)) && (
            <div className="flex items-center gap-2">
              <button
                disabled={isValidating || Object.keys(responses).length === 0}
                onClick={() => setShowConfirm(true)}
                className="bg-emerald-500 text-white px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-[0_4px_0_0_#059669] active:shadow-none active:translate-y-1 transition-all disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none flex items-center gap-2"
              >
                {isValidating ? (
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : <CheckCircle2 size={14} />}
                {isValidating ? 'Grading...' : 'Submit and Grade'}
              </button>
            </div>
          )}
          {submitted && isAdmin && (
            <button
              onClick={handleEdit}
              className="bg-amber-500 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-[0_4px_0_0_#d97706] active:shadow-none active:translate-y-1 transition-all flex items-center gap-2"
            >
              <Edit size={14} /> Edit as Admin
            </button>
          )}
        </div>
      </header>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center"
            >
              <div className="bg-amber-100 w-16 h-16 rounded-2xl flex items-center justify-center text-amber-500 mx-auto mb-6">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-black text-gray-800 mb-2 uppercase">Ready to Submit?</h3>
              <p className="text-gray-500 font-bold mb-8">
                Your work will now be submitted and graded by the teacher. You won't be able to edit your answers after this.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 rounded-xl font-black uppercase text-xs text-gray-400 hover:bg-gray-50 tracking-widest"
                >
                  Go Back
                </button>
                <button
                  onClick={handleFinalSubmit}
                  className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-black uppercase text-xs shadow-[0_4px_0_0_#059669] active:shadow-none active:translate-y-1 transition-all tracking-widest"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Split View */}
      <main className="flex-1 flex overflow-hidden bg-gray-50">
        {/* Left Side: PDF Viewer */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 flex justify-center bg-gray-200/50">
          <div className="max-w-4xl w-full">
            <Document
              file={task.pdfUrl || ''}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={(error) => console.error("PDF Load Error:", error)}
              onSourceError={(error) => console.error("PDF Source Error:", error)}
              options={pdfOptions}
              loading={
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent shadow-lg"></div>
                  <p className="font-black text-xs text-emerald-600 uppercase tracking-widest animate-pulse">Loading Source Material...</p>
                </div>
              }
              error={
                <div className="bg-white p-8 rounded-3xl border-2 border-red-100 text-center">
                  <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
                  <h3 className="font-black text-gray-800 uppercase mb-2">Error Loading PDF</h3>
                  <p className="text-gray-500 text-sm">Please check your connection or try again later.</p>
                </div>
              }
            >
              {Array.from(new Array(numPages), (el, index) => (
                <div 
                  key={`page_${index + 1}`} 
                  data-page-index={index + 1}
                  ref={el => pageRefs.current[index + 1] = el}
                  className="mb-8 shadow-2xl rounded-sm overflow-hidden bg-white"
                >
                  <Page 
                    pageNumber={index + 1} 
                    width={Math.min(viewerWidth, 800)}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                </div>
              ))}
            </Document>
          </div>
        </div>

        {/* Right Side: Interactive Worksheet */}
        <div 
          ref={rightPaneRef}
          className="w-[45%] border-l border-gray-200 bg-white overflow-y-auto custom-scrollbar p-8"
        >
          <div className="max-w-xl mx-auto space-y-12 pb-20">
            <div className="space-y-4 border-b border-gray-100 pb-8">
              <div className="flex flex-col">
                <h3 className="text-3xl font-black text-gray-800 tracking-tight uppercase leading-none">Interactive Worksheet</h3>
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mt-2">Powered by Gemini 3.1 Pro</span>
              </div>
              <p className="text-sm text-gray-500 font-medium leading-relaxed bg-gray-50 p-4 rounded-2xl border-2 border-gray-100/50 italic">
                Refer to the document on the left and provide your answers below. Your progress is saved automatically.
              </p>
            </div>

            {Object.keys(questionsByPage).sort((a, b) => parseInt(a) - parseInt(b)).map(pageStr => {
              const pageNum = parseInt(pageStr);
              return (
                <div key={pageNum} id={`questions-page-${pageNum}`} className="space-y-4 scroll-mt-24">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-emerald-100/50" />
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest px-4 py-1 bg-emerald-50 rounded-lg border border-emerald-100/50">Page {pageNum} Content</span>
                    <div className="h-px flex-1 bg-emerald-100/50" />
                  </div>

                  {questionsByPage[pageNum].map((q, idx) => {
                    const typedQ = q as any;
                    return (
                      <React.Fragment key={typedQ.id}>
                        {typedQ.section && (idx === 0 || (idx > 0 && questionsByPage[pageNum][idx-1].section !== typedQ.section)) && (
                          <div className="pt-6 pb-2 space-y-4">
                            <div className="flex items-center gap-3">
                              <span className="bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl shadow-lg shadow-emerald-100">
                                {typedQ.section}
                              </span>
                              <div className="h-1 flex-1 bg-emerald-50 rounded-full" />
                            </div>
                            {typedQ.instruction && (
                              <motion.div 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-emerald-50/50 p-6 rounded-[2rem] border-2 border-emerald-100/50"
                              >
                                <p className="text-sm text-emerald-800 leading-relaxed">
                                  {typedQ.instruction}
                                </p>
                              </motion.div>
                            )}
                          </div>
                        )}
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          className={`p-8 rounded-[2.5rem] border-2 transition-all duration-500 ${
                            responses[typedQ.id] ? 'bg-emerald-50/20 border-emerald-200 shadow-sm' : 'bg-white border-gray-100 hover:border-emerald-100'
                          }`}
                        >
                          <div className="flex items-start gap-4 mb-6">
                            <span className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gray-900 text-white flex items-center justify-center font-black text-sm shadow-xl shadow-gray-200">
                              {idx + 1}
                            </span>
                            <h4 className="font-black text-gray-800 text-lg leading-tight pt-1">
                              {typedQ.question}
                            </h4>
                          </div>

                          {typedQ.type === 'mcq' && (
                            <div className="grid gap-3">
                              {typedQ.options?.map((opt: string, oIdx: number) => (
                                <button
                                  key={oIdx}
                                  onClick={() => !(readOnly || submitted) && handleResponse(typedQ.id, opt)}
                                  disabled={readOnly || submitted}
                                  className={`w-full text-left p-5 rounded-2xl border-2 font-black text-sm transition-all flex items-center justify-between group ${
                                    responses[typedQ.id] === opt
                                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-xl shadow-emerald-100'
                                      : 'bg-white border-gray-50 text-gray-600 hover:border-emerald-200 hover:bg-emerald-50/30'
                                  } ${(readOnly || submitted) && responses[typedQ.id] !== opt ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  <span>{opt}</span>
                                  {responses[typedQ.id] === opt && <CheckCircle2 size={20} />}
                                </button>
                              ))}
                              {(submitted || readOnly) && validationFeedback[typedQ.id] && (
                                <motion.div 
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className={`p-4 rounded-2xl border mt-2 ${
                                    validationFeedback[typedQ.id].score.includes('/0') || validationFeedback[typedQ.id].score.startsWith('0/') 
                                      ? 'bg-red-50 border-red-100 text-red-800' 
                                      : 'bg-emerald-50 border-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest">Teacher Feedback</span>
                                    <span className="text-xs font-black">{validationFeedback[typedQ.id].score}</span>
                                  </div>
                                  <p className="text-xs font-medium italic">"{validationFeedback[typedQ.id].feedback}"</p>
                                </motion.div>
                              )}
                            </div>
                          )}

                          {typedQ.type === 'short-response' && (
                            <div className="space-y-4">
                              <textarea
                                placeholder="Type your detailed response here..."
                                value={responses[typedQ.id] || ''}
                                readOnly={readOnly || submitted}
                                onChange={(e) => handleResponse(typedQ.id, e.target.value)}
                                className={`w-full p-6 rounded-3xl border-2 border-slate-100 font-bold text-sm text-gray-800 focus:border-emerald-500 focus:bg-white outline-none transition-all resize-none min-h-[140px] ${readOnly || submitted ? 'bg-gray-100' : 'bg-slate-50/50'} placeholder:text-gray-300`}
                              />
                              {(submitted || readOnly) && validationFeedback[typedQ.id] && (
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className={`p-4 rounded-2xl border ${
                                    validationFeedback[typedQ.id].score.includes('/0') || validationFeedback[typedQ.id].score.startsWith('0/') 
                                      ? 'bg-red-50 border-red-100 text-red-800' 
                                      : 'bg-emerald-50 border-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest">Teacher Feedback</span>
                                    <span className="text-xs font-black">{validationFeedback[typedQ.id].score}</span>
                                  </div>
                                  <p className="text-xs font-medium italic">"{validationFeedback[typedQ.id].feedback}"</p>
                                </motion.div>
                              )}
                            </div>
                          )}

                          {typedQ.type === 'table' && typedQ.tableData && (
                            <>
                              <div className="overflow-hidden rounded-3xl border-2 border-emerald-100 bg-white">
                                <table className="w-full border-collapse">
                                  <thead>
                                    <tr className="bg-emerald-50">
                                      {typedQ.tableData[0].map((header: string, hIdx: number) => (
                                        <th key={hIdx} className="p-4 text-[10px] font-black text-emerald-800 uppercase tracking-widest border-b-2 border-emerald-100 border-r border-emerald-100 last:border-r-0">
                                          {header}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {typedQ.tableData.slice(1).map((row: string[], rIdx: number) => (
                                      <tr key={rIdx} className="last:border-b-0 border-b border-emerald-50">
                                        {row.map((cell: string, cIdx: number) => {
                                          const isReadOnly = cIdx < 3; // First 3 columns are headers/labels in worksheet 8.1
                                          const cellId = `${typedQ.id}_${rIdx}_${cIdx}`;
                                          return (
                                            <td key={cIdx} className={`p-0 border-r border-emerald-50 last:border-r-0 ${isReadOnly ? 'bg-gray-50/50' : 'bg-white'}`}>
                                              {isReadOnly ? (
                                                <div className="p-4 text-xs font-bold text-gray-600">{cell}</div>
                                              ) : (
                                                <input
                                                  type="text"
                                                  placeholder="..."
                                                  readOnly={readOnly}
                                                  value={responses[typedQ.id]?.[`${rIdx}_${cIdx}`] || ''}
                                                  onChange={(e) => {
                                                    const newTableResponse = { ...(responses[typedQ.id] || {}) };
                                                    newTableResponse[`${rIdx}_${cIdx}`] = e.target.value;
                                                    handleResponse(typedQ.id, newTableResponse);
                                                  }}
                                                  className={`w-full h-full p-4 text-xs font-black text-emerald-600 outline-none focus:bg-emerald-50/30 transition-colors placeholder:text-gray-200 ${readOnly ? 'bg-gray-50' : ''}`}
                                                />
                                              )}
                                            </td>
                                          );
                                        })}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                              {(submitted || readOnly) && validationFeedback[typedQ.id] && (
                                  <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-4 rounded-2xl border mt-3 ${
                                      validationFeedback[typedQ.id].score.includes('/0') || validationFeedback[typedQ.id].score.startsWith('0/') 
                                        ? 'bg-red-50 border-red-100 text-red-800' 
                                        : 'bg-emerald-50 border-emerald-100 text-emerald-800'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-[10px] font-black uppercase tracking-widest">Teacher Feedback</span>
                                      <span className="text-xs font-black">{validationFeedback[typedQ.id].score}</span>
                                    </div>
                                    <p className="text-xs font-medium italic">"{validationFeedback[typedQ.id].feedback}"</p>
                                  </motion.div>
                                )}
                            </>
                          )}
                        </motion.div>
                      </React.Fragment>
                    );
                  })}
                </div>
              );
            })}

            {task.worksheetQuestions && task.worksheetQuestions.length === 0 && (
              <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-300 mx-auto">
                  <Layout size={32} />
                </div>
                <p className="text-gray-400 font-black text-xs uppercase tracking-widest">No interactive questions found for this task.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <AnimatePresence>
        {submitted && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-emerald-500/95 backdrop-blur-xl z-[300] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl text-center space-y-8"
            >
              <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-500 mx-auto">
                <CheckCircle2 size={48} />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-gray-800 tracking-tight uppercase">Great Work!</h3>
                <p className="text-gray-500 font-medium">Your worksheet has been submitted successfully.</p>
              </div>
              <button
                onClick={onBack}
                className="w-full py-4 rounded-2xl bg-gray-900 text-white font-black uppercase tracking-widest hover:bg-black transition-all"
              >
                Back to Dashboard
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TaskWorksheetView;
