import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, CheckCircle2, AlertCircle, FileText, Layout, ArrowRight, X, 
  Calculator, Edit, Eye, Send, Trash2, Timer, RefreshCw, ShieldCheck
} from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Task, Question } from '../../types';
import { GoogleGenAI, Type } from "@google/genai";
import { db } from '../../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

// PDF worker setup
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface TaskTestViewProps {
  task: Task;
  onBack: () => void;
  onComplete: (responses: Record<string, any>, results?: any) => void;
  initialResponses?: Record<string, any>;
  initialFeedback?: Record<string, { score: string, feedback: string }>;
  initialGeneralFeedback?: string;
  readOnly?: boolean;
  isAdmin?: boolean;
  showCalculator: boolean;
  setShowCalculator: (v: boolean) => void;
}

import { rubrics } from '../../data/markschemes';

const COMMAND_TERMS: Record<string, string> = {
  state: "Give a specific name, value or other brief positive answer without explanation or calculation.",
  explain: "Give a detailed account including reasons or causes.",
  describe: "Give a detailed account.",
  compare: "Give an account of similarities and differences between two (or more) items.",
  evaluate: "Assess the implications and limitations.",
  calculate: "Find an answer using mathematical methods.",
  suggest: "Propose a hypothesis or other possible answer.",
  define: "Give the precise meaning of a word, phrase, concept or physical quantity.",
  analyze: "Break down in order to bring out the essential elements or structure.",
  analyse: "Break down in order to bring out the essential elements or structure.",
  outline: "Give a brief account or summary.",
  design: "Produce a plan, simulation or model.",
  identify: "Provide an answer from a number of possibilities.",
  justify: "Give valid reasons or evidence to support an answer or conclusion."
};

const QuestionTextWithCommandTerms = ({ text }: { text: string }) => {
  if (!text) return null;
  const regex = new RegExp(`\\b(${Object.keys(COMMAND_TERMS).join('|')})\\b`, 'gi');
  const parts = text.split(regex);

  return (
    <h4 className="font-black text-gray-800 text-lg leading-tight pt-1">
      {parts.map((part, i) => {
        const lowerPart = part.toLowerCase();
        if (COMMAND_TERMS[lowerPart]) {
          return (
            <span key={i} className="relative inline-block group">
              <span className="text-red-500 underline decoration-red-200 decoration-2 underline-offset-4 cursor-help">{part}</span>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-red-600 text-white text-xs font-bold rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 leading-relaxed text-center">
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-red-600"></div>
                {COMMAND_TERMS[lowerPart]}
              </div>
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </h4>
  );
};

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

const TaskTestView: React.FC<TaskTestViewProps> = ({ 
  task, onBack, onComplete, initialResponses, initialFeedback, initialGeneralFeedback, readOnly, isAdmin, showCalculator, setShowCalculator 
}) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [activePage, setActivePage] = useState(1);
  const [responses, setResponses] = useState<Record<string, any>>(initialResponses || {});
  const [submitted, setSubmitted] = useState(false);
  const [viewerWidth, setViewerWidth] = useState(window.innerWidth * 0.45);
  const [isValidating, setIsValidating] = useState(false);
  const [validationFeedback, setValidationFeedback] = useState<Record<string, { score: string, feedback: string }>>(initialFeedback || {});
  const [generalFeedback, setGeneralFeedback] = useState<string>(initialGeneralFeedback || "");
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState<number | null>((task.timeLimit || 60) * 60);
  const [isTimeUp, setIsTimeUp] = useState(false);

  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0 && !submitted && !readOnly) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev !== null && prev <= 1) {
            clearInterval(timer);
            setIsTimeUp(true);
            return 0;
          }
          return prev !== null ? prev - 1 : null;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, submitted, readOnly]);

   useEffect(() => {
    if (isTimeUp && !submitted && !readOnly) {
      handleFinalSubmit(); // Auto-submit when time is up
    }
  }, [isTimeUp]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const rightPaneRef = useRef<HTMLDivElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    if (initialFeedback) setValidationFeedback(initialFeedback);
    if (initialGeneralFeedback) setGeneralFeedback(initialGeneralFeedback);
  }, [initialFeedback, initialGeneralFeedback]);

  const [showConfirm, setShowConfirm] = useState(false);
  const taskKeyRaw = task.title.replace(/y8\s+/i, '').trim();
  const [markscheme, setMarkscheme] = useState<string>(
    task.markschemeContent || 
    rubrics[taskKeyRaw] || 
    rubrics[task.title] || 
    "Grade based on general scientific principles."
  );

  // Sync scroll from PDF to Questions - EXCLUSIVE Implementation for TestView
  useEffect(() => {
    if (!numPages || !pdfContainerRef.current) return;
    
    // Observer options for precise tracking
    const options = {
      root: pdfContainerRef.current,
      threshold: [0, 0.5, 1],
      rootMargin: '-5% 0px -40% 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.1) {
          const target = entry.target as HTMLElement;
          const pageNum = parseInt(target.getAttribute('data-page-index') || '1');
          
          if (pageNum !== activePage) {
            setActivePage(pageNum);
            
            // Sync with right pane
            const questionElement = document.getElementById(`test-questions-page-${pageNum}`);
            if (questionElement && rightPaneRef.current) {
              const elementTop = questionElement.offsetTop;
              rightPaneRef.current.scrollTo({
                top: elementTop - 10,
                behavior: 'smooth'
              });
            }
          }
        }
      });
    }, options);

    // Dynamic selection of pages
    const pageElements = pdfContainerRef.current.querySelectorAll('.pdf-page-container');
    pageElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [numPages, task.id, activePage]);

  const handleResponse = (questionId: string, value: any) => {
    if (readOnly || submitted) return;
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const handleFinalSubmit = async () => {
    if (isValidating) return;
    setShowConfirm(false);
    setIsValidating(true);
    
    try {
      if (isAdmin && readOnly) {
        setValidationFeedback({});
        
        const prompt = `Grade this student submission for the assessment "${task.title}".
        
        CRITICAL INSTRUCTION: You must provide a specific teacher's feedback for EVERY SINGLE QUESTION listed in the student responses.
        For EACH question:
        1. Explain EXPLICITLY why the answer is correct, partially correct, or incorrect.
        2. Reference the provided Markscheme/Rubric directly.
        3. Give context and feedback that helps the student understand their performance.

        MARKSCHEME/RUBRIC:
        ${markscheme}
        
        STUDENT RESPONSES:
        ${Object.entries(responses).map(([id, req]) => `${id}: ${req}`).join('\n')}
        
        GRADING PROTOCOL:
        1. Evaluate response strictly against markscheme.
        2. Score in "earned/total" format.
        3. Write concise, pedagogically helpful feedback for EVERY question.
        4. Return ONLY valid JSON.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite-preview",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                questions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      score: { type: Type.STRING },
                      feedback: { type: Type.STRING }
                    }
                  }
                },
                generalFeedback: { type: Type.STRING }
              }
            }
          }
        });

        if (!response.text) throw new Error("AI returned an empty response.");

        const parsed = JSON.parse(response.text);
        const rawFeedbackArray = Array.isArray(parsed.questions) ? parsed.questions : [];
        const generalResult = parsed.generalFeedback || "";
        
        const feedbackResult: Record<string, { score: string, feedback: string }> = {};
        task.worksheetQuestions?.forEach(q => {
          const targetId = q.id.trim();
          const targetIdLower = targetId.toLowerCase();
          
          let aiMatch = rawFeedbackArray.find((f: any) => f.id === targetId) || 
                        rawFeedbackArray.find((f: any) => f.id?.toLowerCase() === targetIdLower);
          
          if (aiMatch) {
            feedbackResult[targetId] = {
              score: aiMatch.score || "0/0",
              feedback: aiMatch.feedback || "Requirement met based on rubric."
            };
          } else {
            feedbackResult[targetId] = { score: "0/0", feedback: "Response not fully addressed in rubric." };
          }
        });
        
        setValidationFeedback(feedbackResult);
        setGeneralFeedback(generalResult);
        
        let computedTotal = 0;
        let computedEarned = 0;
        Object.values(feedbackResult).forEach((f: any) => {
          const parts = f.score.toString().split('/');
          if (parts.length === 2) {
            computedEarned += parseFloat(parts[0]);
            computedTotal += parseFloat(parts[1]);
          }
        });

        await onComplete(responses, {
          score: computedEarned,
          total: computedTotal || task.worksheetQuestions?.length || 0,
          feedback: feedbackResult,
          generalFeedback: generalResult
        });
      } else {
        await onComplete(responses);
        setSubmitted(true);
      }
    } catch (error: any) {
      console.error(error);
      alert("Submission failed. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  const questionsByPage = task.worksheetQuestions?.reduce((acc, q) => {
    const page = (q as any).page || 1;
    if (!acc[page]) acc[page] = [];
    acc[page].push(q);
    return acc;
  }, {} as Record<number, Question[]>) || {};

  return (
    <div className="fixed inset-0 bg-white z-[200] flex flex-col overflow-hidden font-sans">
      <header className="h-16 border-b border-red-100 px-6 flex items-center justify-between bg-white sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-red-50 rounded-xl transition-all text-gray-500">
            <ChevronLeft size={24} />
          </button>
          <div className="h-8 w-px bg-red-100 mx-2" />
          <div className="flex flex-col">
            <h2 className="text-sm font-black text-gray-800 uppercase tracking-tighter truncate max-w-[300px]">
              {task.title}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-red-600">Secure Assessment Mode</span>
              <span className="text-[10px] text-gray-300">•</span>
              <span className="text-[10px] items-center gap-1.5 px-2 py-0.5 rounded-md font-black uppercase tracking-widest bg-red-50 text-red-600 border border-red-100 flex">
                <Timer size={10} /> {formatTime(timeLeft || 0)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowCalculator(!showCalculator)}
            className={`p-2 rounded-xl transition-all ${showCalculator ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600'}`}
          >
            <Calculator size={20} />
          </button>
          
          {(!readOnly || isAdmin) && (
            <button
              disabled={isValidating}
              onClick={() => setShowConfirm(true)}
              className="bg-red-600 text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-[0_4px_0_0_#991b1b] active:shadow-none active:translate-y-1 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isValidating ? <RefreshCw className="animate-spin" size={14} /> : <Send size={14} />}
              {isValidating ? 'Grading...' : (isAdmin && readOnly ? 'Finalize Grading' : 'Submit Assessment')}
            </button>
          )}
        </div>
      </header>

      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
              <div className="bg-red-100 w-16 h-16 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-6">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-black text-gray-800 mb-2 uppercase">Ready to Submit?</h3>
              <p className="text-gray-500 font-bold mb-8">Your work will be finalized and sent for analysis. You cannot change your answers once submitted.</p>
              <div className="flex gap-4">
                <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 rounded-xl font-black uppercase text-xs text-gray-400 hover:bg-gray-50">Back</button>
                <button onClick={handleFinalSubmit} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-black uppercase text-xs shadow-[0_4px_0_0_#991b1b] active:shadow-none active:translate-y-1 transition-all">Submit Now</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="flex-1 flex overflow-hidden bg-gray-50">
        <div ref={pdfContainerRef} className="flex-1 overflow-y-auto custom-scrollbar p-8 flex justify-center bg-gray-100">
          <div className="max-w-4xl w-full">
            <Document
              file={task.pdfUrl || ''}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              loading={<div className="flex items-center justify-center py-20"><RefreshCw className="animate-spin text-red-500" size={32} /></div>}
            >
              {Array.from(new Array(numPages), (el, index) => (
                <div 
                  key={`page_${index + 1}`} 
                  data-page-index={index + 1}
                  className="mb-8 shadow-2xl rounded-sm overflow-hidden bg-white pdf-page-container"
                >
                  <Page pageNumber={index + 1} width={Math.min(viewerWidth, 800)} renderTextLayer={false} renderAnnotationLayer={false} />
                </div>
              ))}
            </Document>
          </div>
        </div>

        <div ref={rightPaneRef} className="w-[45%] border-l border-red-100 bg-white overflow-y-auto custom-scrollbar p-8">
          <div className="max-w-xl mx-auto space-y-12 pb-20">
            <div className="space-y-2 border-b border-red-50 pb-8">
              <h3 className="text-3xl font-black text-gray-800 tracking-tight uppercase">Formal Assessment</h3>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest italic flex items-center gap-2">
                <ShieldCheck size={14} className="text-red-500" /> Secure Protocol v3.1 Enabled
              </p>
            </div>

            {generalFeedback && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border-2 border-red-100 rounded-3xl p-6 space-y-3">
                <h4 className="text-xs font-black text-red-800 uppercase tracking-widest flex items-center gap-2">
                  <Eye size={16} /> Examiner summary
                </h4>
                <p className="text-sm font-bold text-gray-700 italic">"{generalFeedback}"</p>
              </motion.div>
            )}

            {Object.keys(questionsByPage).sort((a, b) => parseInt(a) - parseInt(b)).map(pageStr => {
              const pageNum = parseInt(pageStr);
              return (
                <div key={pageNum} id={`test-questions-page-${pageNum}`} className="space-y-6 scroll-mt-20">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-red-400 uppercase tracking-widest px-4 py-1 bg-red-50 rounded-lg border border-red-100/50">Questions for Page {pageNum}</span>
                    <div className="h-px flex-1 bg-red-50" />
                  </div>

                  {questionsByPage[pageNum].map((q, idx) => {
                    const typedQ = q as any;
                    return (
                      <motion.div 
                        key={typedQ.id}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className={`p-8 rounded-[2rem] border-2 transition-all ${
                          responses[typedQ.id] ? 'bg-red-50/10 border-red-200' : 'bg-white border-gray-100'
                        }`}
                      >
                        <div className="flex items-start gap-4 mb-6">
                          <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-xs">
                            {idx + 1}
                          </span>
                          <QuestionTextWithCommandTerms text={typedQ.question} />
                        </div>

                        {typedQ.type === 'mcq' && (
                          <div className="grid gap-2">
                            {typedQ.options?.map((opt: string, oIdx: number) => (
                              <button
                                key={oIdx}
                                onClick={() => handleResponse(typedQ.id, opt)}
                                className={`w-full text-left p-4 rounded-xl border-2 font-black text-sm transition-all ${
                                  responses[typedQ.id] === opt ? 'bg-red-600 border-red-600 text-white' : 'bg-white border-gray-50 text-gray-600 hover:border-red-200'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}

                        {typedQ.type === 'short-response' && (
                          <textarea
                            placeholder="Type assessment response..."
                            value={responses[typedQ.id] || ''}
                            readOnly={readOnly || submitted}
                            onChange={(e) => handleResponse(typedQ.id, e.target.value)}
                            className="w-full p-4 rounded-2xl border-2 border-gray-100 font-bold text-sm outline-none focus:border-red-500 min-h-[120px] bg-red-50/10"
                          />
                        )}

                        {(submitted || readOnly) && validationFeedback[typedQ.id] && (
                          <div className="mt-4 p-4 rounded-2xl bg-gray-50 border-2 border-gray-100">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Examiner Feedback</span>
                              <span className={`text-xs font-black ${validationFeedback[typedQ.id].score.startsWith('0/') ? 'text-red-500' : 'text-emerald-500'}`}>{validationFeedback[typedQ.id].score}</span>
                            </div>
                            <p className="text-xs font-bold text-gray-700 italic">"{validationFeedback[typedQ.id].feedback}"</p>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TaskTestView;
