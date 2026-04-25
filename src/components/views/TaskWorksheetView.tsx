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
import { GoogleGenAI, Type } from "@google/genai";
import { db } from '../../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

// PDF worker setup - Use unpkg for production reliability
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface TaskWorksheetViewProps {
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
              <span className="text-orange-500 underline decoration-orange-200 decoration-2 underline-offset-4 cursor-help">{part}</span>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-orange-500 text-white text-xs font-bold rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 leading-relaxed text-center">
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-orange-500"></div>
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

const TaskWorksheetView: React.FC<TaskWorksheetViewProps> = ({ 
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
  const [timeLeft, setTimeLeft] = useState<number | null>(task.type === 'test' ? (task.timeLimit || 60) * 60 : null);
  const [isTimeUp, setIsTimeUp] = useState(false);

  useEffect(() => {
    if (task.type === 'test' && timeLeft !== null && timeLeft > 0 && !submitted && !readOnly) {
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
  }, [task.type, timeLeft, submitted, readOnly]);

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
  const [showMarkschemeEditor, setShowMarkschemeEditor] = useState(false);
  const taskKeyRaw = task.title.replace(/y8\s+/i, '').trim();
  const [markscheme, setMarkscheme] = useState<string>(
    task.markschemeContent || 
    rubrics[taskKeyRaw] || 
    rubrics[task.title] || 
    "Grade based on general scientific principles."
  );
  const [editingMarkscheme, setEditingMarkscheme] = useState<string>("");
  const [isSavingMarkscheme, setIsSavingMarkscheme] = useState(false);

  const [showQuestionsEditor, setShowQuestionsEditor] = useState(false);
  const [editingQuestions, setEditingQuestions] = useState<string>("");
  const [isSavingQuestions, setIsSavingQuestions] = useState(false);

  useEffect(() => {
    // If the task already has a markscheme embedded, we use that first
    if (task.markschemeContent) {
      setMarkscheme(task.markschemeContent);
      return;
    }

    if (isAdmin) {
      const loadMarkscheme = async () => {
        try {
          // Try both variants for backwards compatibility
          const docRef = doc(db, 'markschemes', taskKeyRaw);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            setMarkscheme(snap.data().content);
          } else {
            // Fallback to title with y8 if that's how it was saved
            const docRefAlt = doc(db, 'markschemes', task.title);
            const snapAlt = await getDoc(docRefAlt);
            if (snapAlt.exists()) {
              setMarkscheme(snapAlt.data().content);
            }
          }
        } catch (e) {
          console.error("Error loading markscheme:", e);
        }
      };
      loadMarkscheme();
    }
  }, [isAdmin, taskKeyRaw, task.title, task.markschemeContent]);

  const handleSaveMarkscheme = async () => {
    setIsSavingMarkscheme(true);
    try {
      await updateDoc(doc(db, 'tasks', task.id), { markschemeContent: editingMarkscheme });
      // Also save to legacy collection just in case
      await setDoc(doc(db, 'markschemes', taskKeyRaw), { content: editingMarkscheme });
      setMarkscheme(editingMarkscheme);
      setShowMarkschemeEditor(false);
    } catch (e) {
      console.error(e);
      alert("Failed to save markscheme.");
    } finally {
      setIsSavingMarkscheme(false);
    }
  };

  const handleSaveQuestions = async () => {
    setIsSavingQuestions(true);
    try {
      const parsedQuestions = JSON.parse(editingQuestions);
      if (Array.isArray(parsedQuestions)) {
        parsedQuestions.forEach((q: any) => {
          if (q.tableData && Array.isArray(q.tableData[0])) {
            q.tableData = q.tableData.map((row: any) => ({ row }));
          }
        });
      }
      await setDoc(doc(db, 'tasks', task.id), { worksheetQuestions: parsedQuestions }, { merge: true });
      setShowQuestionsEditor(false);
      // It will auto-refresh via App.tsx task listener, but let's notify user
    } catch (e) {
      console.error(e);
      alert("Failed to save questions. Please ensure valid JSON formatting.");
    } finally {
      setIsSavingQuestions(false);
    }
  };

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

  // Sync scroll from PDF to Questions (Aggressive Observer for better sync)
  useEffect(() => {
    if (!numPages) return;
    
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
              const rect = questionElement.getBoundingClientRect();
              const parentRect = rightPaneRef.current.getBoundingClientRect();
              const offset = rect.top - parentRect.top;
              
              rightPaneRef.current.scrollTo({
                top: rightPaneRef.current.scrollTop + offset - 20,
                behavior: 'smooth'
              });
            }
          }
        });
      },
      { 
        root: pdfContainerRef.current,
        threshold: 0, 
        rootMargin: '-10% 0px -80% 0px'
      }
    );

    // Observe all pages
    const pageElements = document.querySelectorAll('.pdf-page-container');
    pageElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [numPages, task.id]); // Re-run if task changes

  const handleResponse = (questionId: string, value: any) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const handleFinalSubmit = async () => {
    if (isValidating) return;
    setShowConfirm(false);
    setIsValidating(true);
    
    try {
      if (isAdmin && readOnly) {
        setValidationFeedback({});
        
        const prompt = `Grade this student submission for the worksheet "${task.title}".
        
        CRITICAL INSTRUCTION: You must provide specific feedback for EVERY SINGLE QUESTION listed.
        
        GRADING LOGIC:
        You MUST strictly grade the student's response against the MARKSCHEME/RUBRIC provided below. Do not output generic messages like "Detailed feedback provided in report."
        
        - IF RESPONSE IS MISSING (empty string or whitespace): 
          * Score: 0 of Total
          * Feedback: Must start with "No response. " then provide the correct answer according to the rubric.
        - IF RESPONSE IS INCORRECT (error or incomplete): 
          * Score: Partial or 0 of Total
          * Feedback: Must start with "Incorrect. " then provide the correct answer and a brief explanation according to the rubric.
        - IF RESPONSE IS CORRECT: 
          * Score: Full marks (e.g., 1 of 1, 2 of 2)
          * Feedback: Must start with "Correct. " then provide a brief explanation.
        
        For EACH question:
        1. Evaluate response strictly against the markscheme.
        2. DO NOT INCLUDE <cite> tags or HTML in the feedback. Use plain text.

        MARKSCHEME/RUBRIC:
        ${markscheme}
        
        STUDENT RESPONSES (Format: QuestionID: Response):
        ${Object.entries(responses).map(([id, req]) => `${id}: ${req}`).join('\n')}
        
        GRADING PROTOCOL:
        1. FIRST grade individual questions strictly against the provided markscheme.
        2. THEN, based on the student's performance, generate an 'Overall comments' section (generalFeedback field) AT THE END detailing how the student did overall in the worksheet, including their strengths and what could be improved.
        3. Assign a score in "earned of total" format (e.g. "2 of 2", "0.5 of 1", "0 of 3").
        4. Case-sensitive matching of QuestionID is mandatory.
        5. The JSON must have an array of "questions" and a string "generalFeedback" for the Overall comments. Return ONLY valid JSON.`;

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

        if (!response.text) {
          throw new Error("AI returned an empty response.");
        }

        let cleanText = response.text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanText);
        const rawFeedbackArray = Array.isArray(parsed.questions) ? parsed.questions : [];
        const generalResult = parsed.generalFeedback || "";
        
        const feedbackResult: Record<string, { score: string, feedback: string }> = {};
        task.worksheetQuestions?.forEach(q => {
          const targetId = q.id.trim();
          const targetIdLower = targetId.toLowerCase();
          
          let aiMatch = rawFeedbackArray.find((f: any) => f.id === targetId) || 
                        rawFeedbackArray.find((f: any) => f.id?.toLowerCase() === targetIdLower);
          
          if (!aiMatch) {
            aiMatch = rawFeedbackArray.find((f: any) => {
              const k = (f.id || "").toString().trim().toLowerCase();
              return k.length > 2 && (k.includes(targetIdLower) || targetIdLower.includes(k));
            });
          }
          
          if (aiMatch) {
            feedbackResult[targetId] = {
              score: aiMatch.score || "0 of 0",
              feedback: aiMatch.feedback || "Detailed feedback provided in report."
            };
          } else {
            feedbackResult[targetId] = { 
              score: "0 of 0", 
              feedback: "Question not addressed. The correct answer should be derived from the provided markscheme." 
            };
          }
        });
        
        setValidationFeedback(feedbackResult);
        setGeneralFeedback(generalResult);
        
        let computedTotal = 0;
        let computedEarned = 0;
        Object.values(feedbackResult).forEach((f: any) => {
          if (f && f.score) {
            const parts = f.score.toString().split(/\s*(?:\/|of)\s*/i);
            if (parts.length === 2) {
              computedEarned += parseFloat(parts[0]);
              computedTotal += parseFloat(parts[1]);
            } else {
              const num = parseFloat(f.score);
              if (!isNaN(num)) {
                computedEarned += num;
                computedTotal += 1;
              }
            }
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
      console.error("Operation failed:", error);
      alert(isAdmin ? `Grading failed: ${error.message}` : `Submission failed: ${error.message}`);
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
              <span className={`text-[10px] font-black uppercase tracking-widest ${task.type === 'test' ? 'text-red-500' : 'text-emerald-500'}`}>
                {task.type === 'test' ? 'Secure Assessment' : 'Interactive Worksheet'}
              </span>
              <span className="text-[10px] text-gray-300">•</span>
              <span className="text-[10px] font-bold text-gray-400">
                Page {activePage} of {numPages || '?'}
              </span>
              {timeLeft !== null && (
                <>
                  <span className="text-[10px] text-gray-300">•</span>
                  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md font-black text-[10px] uppercase tracking-widest border transition-all ${
                    timeLeft < 300 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-orange-50 text-orange-600 border-orange-200'
                  }`}>
                    <Timer size={12} />
                    {formatTime(timeLeft)}
                  </div>
                </>
              )}
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
              {Object.keys(responses).length} of {task.worksheetQuestions?.length || 0} Answered
            </span>
          </div>
          
        {(isAdmin || (!readOnly && !submitted)) && (
          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <button
                  onClick={() => {
                    setEditingQuestions(JSON.stringify(task.worksheetQuestions || [], null, 2));
                    setShowQuestionsEditor(true);
                  }}
                  className={`${task.type === 'test' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-purple-50 text-purple-600 border-purple-200'} px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:brightness-95 transition-all shadow-sm active:translate-y-1 block`}
                >
                  Edit Questions
                </button>
                <button
                  onClick={() => {
                    setEditingMarkscheme(markscheme);
                    setShowMarkschemeEditor(true);
                  }}
                  className={`${task.type === 'test' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-blue-50 text-blue-600 border-blue-200'} px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:brightness-95 transition-all shadow-sm active:translate-y-1 block`}
                >
                  Edit Markscheme
                </button>
              </>
            )}
            {(!readOnly || isAdmin) && (
              <button
                disabled={isValidating}
                onClick={() => setShowConfirm(true)}
                className={`${task.type === 'test' ? 'bg-red-600 shadow-[0_4px_0_0_#991b1b]' : 'bg-emerald-500 shadow-[0_4px_0_0_#059669]'} text-white px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest active:shadow-none active:translate-y-1 transition-all disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none flex items-center gap-2`}
              >
                {isValidating ? (
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : <Send size={14} />}
                {isValidating ? 'Grading...' : (isAdmin && readOnly ? 'Finish Review' : (task.type === 'test' ? 'Submit Assessment' : 'Submit Worksheet'))}
              </button>
            )}
          </div>
        )}
          {submitted && isAdmin && !readOnly && (
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
        {showQuestionsEditor && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 p-2 rounded-xl text-purple-500">
                    <Layout size={24} />
                  </div>
                  <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Edit Worksheet Questions</h3>
                </div>
                <button onClick={() => setShowQuestionsEditor(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={24} />
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-4 font-medium italic">
                Edit the JSON payload for the questions directly. Ensure the format adheres to the required schema.
              </p>
              <textarea
                value={editingQuestions}
                onChange={(e) => setEditingQuestions(e.target.value)}
                className="w-full flex-1 min-h-[300px] p-6 rounded-2xl border-2 border-slate-100 font-mono text-xs leading-relaxed resize-none focus:border-purple-500 outline-none custom-scrollbar mb-6 bg-slate-50/50 text-gray-800"
                placeholder="Enter the questions JSON here..."
              />
              <div className="flex justify-end gap-4 shrink-0">
                <button
                  onClick={() => setShowQuestionsEditor(false)}
                  className="px-6 py-3 rounded-xl font-black uppercase text-xs text-gray-400 hover:bg-gray-50 hover:text-gray-600 tracking-widest transition-colors"
                  disabled={isSavingQuestions}
                >
                  Discard Changes
                </button>
                <button
                  onClick={handleSaveQuestions}
                  className="px-8 py-3 bg-purple-500 text-white rounded-xl font-black uppercase text-xs shadow-[0_4px_0_0_#9333ea] active:shadow-none active:translate-y-1 transition-all tracking-widest flex items-center justify-center gap-2 min-w-[160px]"
                  disabled={isSavingQuestions}
                >
                  {isSavingQuestions ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMarkschemeEditor && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-xl text-blue-500">
                    <FileText size={24} />
                  </div>
                  <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Edit Markscheme</h3>
                </div>
                <button onClick={() => setShowMarkschemeEditor(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={24} />
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-4 font-medium italic">
                Changes will be saved for this specific task <span className="font-bold text-gray-700">({task.title})</span> and used for future grading. Both JSON and plain-text markschemes are supported.
              </p>
              <textarea
                value={editingMarkscheme}
                onChange={(e) => setEditingMarkscheme(e.target.value)}
                className="w-full flex-1 min-h-[300px] p-6 rounded-2xl border-2 border-slate-100 font-mono text-sm leading-relaxed resize-none focus:border-blue-500 outline-none custom-scrollbar mb-6 bg-slate-50/50 text-gray-800"
                placeholder="Enter the markscheme or rubric here..."
              />
              <div className="flex justify-end gap-4 shrink-0">
                <button
                  onClick={() => setShowMarkschemeEditor(false)}
                  className="px-6 py-3 rounded-xl font-black uppercase text-xs text-gray-400 hover:bg-gray-50 hover:text-gray-600 tracking-widest transition-colors"
                  disabled={isSavingMarkscheme}
                >
                  Discard Changes
                </button>
                <button
                  onClick={handleSaveMarkscheme}
                  className="px-8 py-3 bg-blue-500 text-white rounded-xl font-black uppercase text-xs shadow-[0_4px_0_0_#2563eb] active:shadow-none active:translate-y-1 transition-all tracking-widest flex items-center justify-center gap-2 min-w-[160px]"
                  disabled={isSavingMarkscheme}
                >
                  {isSavingMarkscheme ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
              <h3 className="text-xl font-black text-gray-800 mb-2 uppercase">
                {isAdmin && readOnly ? 'Confirm Grading?' : 'Ready to Submit?'}
              </h3>
              <p className="text-gray-500 font-bold mb-8">
                {isAdmin && readOnly 
                  ? 'This will use AI to analyze student responses against the markscheme.' 
                  : (Object.keys(responses).length < (task.worksheetQuestions?.length || 0) 
                     ? `WARNING: You have only answered ${Object.keys(responses).length} out of ${task.worksheetQuestions?.length || 0} questions. Your work is incomplete! Are you sure you want to submit?`
                     : 'Your work will now be submitted and graded by the teacher. You won\'t be able to edit your answers after this.')}
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
                  {isAdmin && readOnly ? 'Start Grading' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Split View */}
      <main className="flex-1 flex overflow-hidden bg-gray-50">
        {/* Left Side: PDF Viewer */}
        <div 
          ref={pdfContainerRef}
          className="flex-1 overflow-y-auto custom-scrollbar p-8 flex justify-center bg-gray-200/50"
        >
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
                  className="mb-8 shadow-2xl rounded-sm overflow-hidden bg-white pdf-page-container"
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
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mt-2">Powered by Gemini 3.1 Flash Lite Preview</span>
              </div>
              <p className="text-sm text-gray-500 font-medium leading-relaxed bg-gray-50 p-4 rounded-2xl border-2 border-gray-100/50 italic">
                Refer to the document on the left and provide your answers below. Your progress is saved automatically.
              </p>
            </div>

            {generalFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-50 border-2 border-emerald-100 rounded-[2rem] p-8 space-y-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-500 text-white p-2 rounded-xl">
                      <Send size={18} />
                    </div>
                    <h4 className="text-sm font-black text-emerald-800 uppercase tracking-widest">Overall comments</h4>
                  </div>
                  {readOnly && (
                    <div className="bg-white px-4 py-2 rounded-2xl border border-emerald-100 flex items-center gap-2">
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Score</span>
                       <span className="text-lg font-black text-emerald-600">
                          {Math.round(Object.values(validationFeedback as any).reduce<number>((acc, f: any) => {
                             const p = f.score?.toString().split(/\s*(?:\/|of)\s*/i);
                             return acc + (p?.[0] ? parseFloat(p[0]) : 0);
                          }, 0))} / {
                            Object.values(validationFeedback as any).reduce<number>((acc, f: any) => {
                              const p = f.score?.toString().split(/\s*(?:\/|of)\s*/i);
                              return acc + (p?.[1] ? parseFloat(p[1]) : 1);
                           }, 0)
                          }
                       </span>
                    </div>
                  )}
                </div>
                <p className="text-sm font-bold text-gray-700 leading-relaxed italic">
                  "{generalFeedback}"
                </p>
              </motion.div>
            )}
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
                            <QuestionTextWithCommandTerms text={typedQ.question} />
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
                                    validationFeedback[typedQ.id].score.includes('of 0') || validationFeedback[typedQ.id].score.startsWith('0 of') 
                                      ? 'bg-red-50 border-red-100 text-red-800' 
                                      : 'bg-emerald-50 border-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest">Teacher's Feedback</span>
                                    <span className="text-xs font-black">{validationFeedback[typedQ.id].score}</span>
                                  </div>
                                  <p className="text-xs font-medium whitespace-pre-wrap">{validationFeedback[typedQ.id].feedback}</p>
                                </motion.div>
                              )}
                            </div>
                          )}

                          {typedQ.type === 'tick-cross' && (
                            <div className="grid grid-cols-2 gap-4">
                              {['✓', '✕'].map((opt) => (
                                <button
                                  key={opt}
                                  onClick={() => !(readOnly || submitted) && handleResponse(typedQ.id, opt)}
                                  disabled={readOnly || submitted}
                                  className={`p-8 rounded-3xl border-4 font-black text-3xl transition-all shadow-sm ${
                                    responses[typedQ.id] === opt
                                      ? opt === '✓' ? 'bg-emerald-500 border-emerald-600 text-white shadow-emerald-100' : 'bg-red-500 border-red-600 text-white shadow-red-100'
                                      : 'bg-white border-gray-100 text-gray-300 hover:border-gray-200'
                                  }`}
                                >
                                  {opt}
                                </button>
                              ))}
                              {(submitted || readOnly) && validationFeedback[typedQ.id] && (
                                <motion.div 
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className={`col-span-2 p-4 rounded-2xl border ${
                                    validationFeedback[typedQ.id].score.includes('of 0') || validationFeedback[typedQ.id].score.startsWith('0 of') 
                                      ? 'bg-red-50 border-red-100 text-red-800' 
                                      : 'bg-emerald-50 border-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest">Teacher's Feedback</span>
                                    <span className="text-xs font-black">{validationFeedback[typedQ.id].score}</span>
                                  </div>
                                  <p className="text-xs font-medium whitespace-pre-wrap">{validationFeedback[typedQ.id].feedback}</p>
                                </motion.div>
                              )}
                            </div>
                          )}

                          {typedQ.type === 'reorder' && typedQ.items && (
                            <div className="space-y-3">
                              {(responses[typedQ.id] || typedQ.items).map((item: string, iIdx: number) => (
                                <motion.div
                                  key={`${typedQ.id}_item_${iIdx}`}
                                  layout
                                  className="flex items-center gap-4 bg-white p-4 rounded-2xl border-2 border-gray-100 shadow-sm"
                                >
                                  <span className="bg-gray-100 text-gray-500 w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0">
                                    {iIdx + 1}
                                  </span>
                                  <span className="flex-1 font-bold text-gray-700">{item}</span>
                                  {!(readOnly || submitted) && (
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => {
                                          const currentArr = [...(responses[typedQ.id] || typedQ.items)];
                                          if (iIdx > 0) {
                                            [currentArr[iIdx], currentArr[iIdx-1]] = [currentArr[iIdx-1], currentArr[iIdx]];
                                            handleResponse(typedQ.id, currentArr);
                                          }
                                        }}
                                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-emerald-500 transition-colors"
                                      >
                                        <ChevronLeft size={16} className="rotate-90" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          const currentArr = [...(responses[typedQ.id] || typedQ.items)];
                                          if (iIdx < currentArr.length - 1) {
                                            [currentArr[iIdx], currentArr[iIdx+1]] = [currentArr[iIdx+1], currentArr[iIdx]];
                                            handleResponse(typedQ.id, currentArr);
                                          }
                                        }}
                                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-emerald-500 transition-colors"
                                      >
                                        <ChevronLeft size={16} className="-rotate-90" />
                                      </button>
                                    </div>
                                  )}
                                </motion.div>
                              ))}
                              {(submitted || readOnly) && validationFeedback[typedQ.id] && (
                                <motion.div 
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className={`p-4 rounded-2xl border mt-2 ${
                                    validationFeedback[typedQ.id].score.includes('of 0') || validationFeedback[typedQ.id].score.startsWith('0 of') 
                                      ? 'bg-red-50 border-red-100 text-red-800' 
                                      : 'bg-emerald-50 border-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest">Teacher's Feedback</span>
                                    <span className="text-xs font-black">{validationFeedback[typedQ.id].score}</span>
                                  </div>
                                  <p className="text-xs font-medium whitespace-pre-wrap">{validationFeedback[typedQ.id].feedback}</p>
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
                                    validationFeedback[typedQ.id].score.includes('of 0') || validationFeedback[typedQ.id].score.startsWith('0 of') 
                                      ? 'bg-red-50 border-red-100 text-red-800' 
                                      : 'bg-emerald-50 border-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest">Teacher's Feedback</span>
                                    <span className="text-xs font-black">{validationFeedback[typedQ.id].score}</span>
                                  </div>
                                  <p className="text-xs font-medium whitespace-pre-wrap">{validationFeedback[typedQ.id].feedback}</p>
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
                                      validationFeedback[typedQ.id].score.includes('of 0') || validationFeedback[typedQ.id].score.startsWith('0 of') 
                                        ? 'bg-red-50 border-red-100 text-red-800' 
                                        : 'bg-emerald-50 border-emerald-100 text-emerald-800'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-[10px] font-black uppercase tracking-widest">Teacher's Feedback</span>
                                      <span className="text-xs font-black">{validationFeedback[typedQ.id].score}</span>
                                    </div>
                                    <p className="text-xs font-medium whitespace-pre-wrap">{validationFeedback[typedQ.id].feedback}</p>
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
