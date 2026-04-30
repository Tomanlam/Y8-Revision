import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, CheckCircle2, AlertCircle, FileText, Layout, ArrowRight, X, 
  Calculator, Edit, Eye, Send, Trash2, Timer, RefreshCw, ShieldCheck, Terminal,
  Maximize2, Minimize2, Pen, Plus, Minus, RotateCcw
} from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Task, Question } from '../../types';
import { GoogleGenAI, Type } from "@google/genai";
import { db } from '../../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import Sketchpad from '../Sketchpad';
import { FileUpload } from '../FileUpload';

// PDF worker setup
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface TaskTestViewProps {
  task: Task;
  onBack: () => void;
  onComplete: (responses: Record<string, any>, results?: any) => void;
  onProgress?: (partialResults: any) => Promise<void>;
  initialResponses?: Record<string, any>;
  initialFeedback?: Record<string, { score: string, feedback: string }>;
  initialGeneralFeedback?: string;
  initialCheatLogs?: Record<string, number>;
  readOnly?: boolean;
  isAdmin?: boolean;
  isBatchMode?: boolean;
  batchQueue?: { id: string, studentName: string }[];
  currentBatchIndex?: number;
  showCalculator: boolean;
  setShowCalculator: (v: boolean) => void;
  studentName?: string;
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

const QuestionTextWithCommandTerms = ({ text, className }: { text: string, className?: string }) => {
  if (!text) return null;
  const regex = new RegExp(`\\b(${Object.keys(COMMAND_TERMS).join('|')})\\b`, 'gi');
  const parts = text.split(regex);

  return (
    <h4 className={`font-helvetica font-black text-lg leading-tight pt-1 ${className || 'text-gray-800'}`}>
      {parts.map((part, i) => {
        const lowerPart = part.toLowerCase();
        if (COMMAND_TERMS[lowerPart]) {
          return (
            <span 
              key={i} 
              className="relative inline-block group cursor-help"
            >
              <span className={`font-black border-b-2 transition-all ${className ? 'text-white border-white/40 group-hover:border-white' : 'text-orange-500 border-orange-200 group-hover:border-orange-500 group-hover:text-orange-600'}`}>
                {part}
              </span>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 pointer-events-none z-[100] transition-all duration-200 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-1">
                <div className="bg-orange-600 text-white p-3 rounded-2xl shadow-xl text-center relative">
                  <p className="text-[10px] font-helvetica font-bold leading-relaxed">
                    {COMMAND_TERMS[lowerPart]}
                  </p>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-3 h-3 bg-orange-600 rotate-45 -mt-1.5" />
                </div>
              </div>
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </h4>
  );
};

const TypewriterRubric = ({ text, isActive, isPast }: { text: string, isActive: boolean, isPast: boolean }) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    if (isPast) {
      setDisplayedText(text);
      return;
    }
    if (isActive) {
      let currentString = "";
      let i = 0;
      const interval = setInterval(() => {
        if (i < text.length) {
          currentString += text[i];
          setDisplayedText(currentString);
          i++;
        } else {
          clearInterval(interval);
        }
      }, 8);
      return () => clearInterval(interval);
    } else {
      setDisplayedText(""); 
    }
  }, [text, isActive, isPast]);

  if (!isActive && !isPast) return <span className="text-slate-600">Waiting for processing...</span>;

  return (
    <span className={`${isActive ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'text-emerald-500'}`}>
      {displayedText}
      {isActive && displayedText.length < text.length && <span className="animate-pulse">_</span>}
    </span>
  );
};

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

const TaskTestView: React.FC<TaskTestViewProps> = ({ 
  task, onBack, onComplete, onProgress, initialResponses, initialFeedback, initialGeneralFeedback, initialCheatLogs, readOnly, isAdmin, isBatchMode, batchQueue, currentBatchIndex, showCalculator, setShowCalculator, studentName
}) => {
  const studentCardRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    if (isBatchMode && currentBatchIndex !== undefined && studentCardRefs.current[currentBatchIndex]) {
      studentCardRefs.current[currentBatchIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [isBatchMode, currentBatchIndex]);

  const [numPages, setNumPages] = useState<number | null>(null);
  const [activePage, setActivePage] = useState(1);
  const [responses, setResponses] = useState<Record<string, any>>(initialResponses || {});
  const [submitted, setSubmitted] = useState(false);
  const [viewerWidth, setViewerWidth] = useState(window.innerWidth * 0.48);
  const [pdfScale, setPdfScale] = useState(1.0);
  const [isValidating, setIsValidating] = useState(false);
  const [validationFeedback, setValidationFeedback] = useState<Record<string, { score: string, feedback: string }>>(initialFeedback || {});
  const [generalFeedback, setGeneralFeedback] = useState<string>(initialGeneralFeedback || "");

  const [isGradingWorkflow, setIsGradingWorkflow] = useState(false);
  const [isGradingConsoleExpanded, setIsGradingConsoleExpanded] = useState(false);
  const [gradingPhase, setGradingPhase] = useState('idle');
  const [showSketchpad, setShowSketchpad] = useState<boolean | string>(false);
  const [gradingProgress, setGradingProgress] = useState(0);
  const [gradingComplete, setGradingComplete] = useState(false);
  const [extractedRubrics, setExtractedRubrics] = useState<Record<string, string>>({});
  const [rubricMeta, setRubricMeta] = useState<Record<string, { type: string, marks: string }>>({});
  const [currentlyProcessingId, setCurrentlyProcessingId] = useState<string | null>(null);
  const [currentlyProcessingIndex, setCurrentlyProcessingIndex] = useState<number | null>(null);
  const [gradingLogs, setGradingLogs] = useState<string[]>([]);
  const currentModel = "Gemini 3.1 Flash Lite";

  const addLog = (msg: string) => {
    console.log("[GradingLog]", msg);
    setGradingLogs(prev => [...prev.slice(-19), msg]);
  };
  
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState<number | null>((task.timeLimit || 60) * 60);
  const [isTimeUp, setIsTimeUp] = useState(false);

  // Admin Features
  const [showMarkschemeEditor, setShowMarkschemeEditor] = useState(false);
  const [editingMarkscheme, setEditingMarkscheme] = useState<string>("");
  const [isSavingMarkscheme, setIsSavingMarkscheme] = useState(false);

  const [showQuestionsEditor, setShowQuestionsEditor] = useState(false);
  const [editingQuestions, setEditingQuestions] = useState<string>("");
  const [isSavingQuestions, setIsSavingQuestions] = useState(false);

  const pdfContainerRef = useRef<HTMLDivElement>(null);

  // Handle resize via ResizeObserver on the actual container
  useEffect(() => {
    if (!pdfContainerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.contentRect.width > 0) {
          setViewerWidth(entry.contentRect.width);
        }
      }
    });
    
    observer.observe(pdfContainerRef.current);
    return () => observer.disconnect();
  }, []);

  const pdfOptions = useMemo(() => ({
    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
  }), []);

  // Anti-Cheat State
  const [tabSwitchesCount, setTabSwitchesCount] = useState(0);
  const [cheatLogs, setCheatLogs] = useState<Record<string, number>>(initialCheatLogs || {
    tabSwitches: 0,
    blur: 0,
    copyPaste: 0,
    shortcutAttempts: 0,
    printAttempts: 0,
    tabOpenAttempts: 0
  });
  const [cheatDetected, setCheatDetected] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sirenIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sirenVolumeRef = useRef(0.1);

  // Siren Sound Synthesis
  const playSiren = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.5);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 1.0);

      gain.gain.setValueAtTime(sirenVolumeRef.current, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.0);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 1.0);
      
      // Increase volume for next time, cap at 0.8
      sirenVolumeRef.current = Math.min(sirenVolumeRef.current + 0.1, 0.8);
    } catch (e) {
      console.warn("Audio Context failed", e);
    }
  };

  const startRepeatedSiren = () => {
    if (sirenIntervalRef.current) return;
    sirenVolumeRef.current = 0.2;
    playSiren();
    sirenIntervalRef.current = setInterval(playSiren, 1200);
  };

  const stopSiren = () => {
    if (sirenIntervalRef.current) {
      clearInterval(sirenIntervalRef.current);
      sirenIntervalRef.current = null;
    }
  };

  useEffect(() => {
    if (readOnly || submitted) return;

    const logCheat = (category: string) => {
      setCheatLogs(prev => ({ ...prev, [category]: (prev[category] || 0) + 1 }));
      setCheatDetected(true);
      startRepeatedSiren();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        logCheat('tabSwitches');
      }
    };

    const handleBlur = () => {
      logCheat('blur');
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      logCheat('copyPaste');
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      logCheat('copyPaste');
    };

    const handleBeforePrint = () => {
      logCheat('printAttempts');
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Print, Save, Inspect, PrintScreen, New Tab
      if (e.key === 'PrintScreen') {
        logCheat('printAttempts');
      }
      if ((e.ctrlKey || e.metaKey)) {
        if (e.key === 'c' || e.key === 'v') {
          e.preventDefault();
          logCheat('copyPaste');
        } else if (e.key === 't' || e.key === 'n') {
          e.preventDefault();
          logCheat('tabOpenAttempts');
        } else if (e.key === 'p' || e.key === 's' || e.key === 'u') {
          e.preventDefault();
          logCheat('shortcutAttempts');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('contextmenu', handleContextMenu as any);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    window.addEventListener('beforeprint', handleBeforePrint);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('contextmenu', handleContextMenu as any);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      window.removeEventListener('beforeprint', handleBeforePrint);
      stopSiren();
    };
  }, [readOnly, submitted]);

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
  const gradingConsoleContentRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    if (initialFeedback) setValidationFeedback(initialFeedback);
    if (initialGeneralFeedback) setGeneralFeedback(initialGeneralFeedback);
  }, [initialFeedback, initialGeneralFeedback]);

  useEffect(() => {
    if (isBatchMode && isAdmin && !gradingComplete && gradingPhase === 'idle' && !isGradingWorkflow) {
      setIsGradingWorkflow(true);
      setIsGradingConsoleExpanded(false);
      startGradingWorkflow();
    }
  }, [isBatchMode, isAdmin, gradingPhase, gradingComplete, isGradingWorkflow]);

  useEffect(() => {
    if (isBatchMode && isAdmin && gradingPhase === 'ready_to_grade') {
      gradeAgainstRubric();
    }
  }, [isBatchMode, isAdmin, gradingPhase]);

  const [showConfirm, setShowConfirm] = useState(false);
  const taskKeyRaw = task.title.replace(/y8\s+/i, '').trim();
  const [markscheme, setMarkscheme] = useState<string>(
    task.markschemeContent || 
    rubrics[taskKeyRaw] || 
    rubrics[task.title] || 
    "Grade based on general scientific principles."
  );

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
    } catch (e) {
      console.error(e);
      alert("Failed to save questions. Please ensure valid JSON formatting.");
    } finally {
      setIsSavingQuestions(false);
    }
  };

  // Sync scroll from PDF to Questions (Matching Worksheet Logic)
  useEffect(() => {
    if (!numPages || !pdfContainerRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            const pageNum = parseInt(target.getAttribute('data-page-index') || '1');
            setActivePage(pageNum);
            
            // Sync with right pane using robust coordinate calculation
            const questionElement = document.getElementById(`test-questions-page-${pageNum}`);
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
  }, [numPages, task.id]);

  const getUploadPaths = (qId?: string) => {
    if (!studentName || isAdmin) return undefined;
    const makeSafe = (s: string) => s.replace(/[^a-zA-Z0-9 _-]/g, '').trim();
    const safeStudentName = makeSafe(studentName);
    const safeTaskTitle = makeSafe(task.title);
    if (!safeStudentName || !safeTaskTitle) return undefined;
    const baseName = `${safeStudentName} ${safeTaskTitle} ${qId ? qId : 'Attachment'}`;
    return [
      `STUDENTS/${safeStudentName}/${baseName}`,
      `TASKS/${safeTaskTitle}/${baseName}`
    ];
  };

  const handleResponse = (questionId: string, value: any) => {
    if (readOnly || submitted) return;
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  
  const startGradingWorkflow = async () => {
    setIsGradingWorkflow(true);
    setGradingPhase('extracting_rubrics');
    
    addLog("Checking for cached rubrics in Firestore...");
    try {
      const docRef = doc(db, 'processedRubrics', task.id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        addLog("Found cached rubrics! Reusing pre-processed data.");
        setExtractedRubrics(data.rubrics || {});
        setRubricMeta(data.meta || {});
        setCurrentlyProcessingId(null);
        setCurrentlyProcessingIndex(null);
        setGradingPhase('ready_to_grade');
        return;
      }
    } catch (err: any) {
      addLog(`Cache check failed: ${err.message}`);
    }

    const cleanQuestions = (task.worksheetQuestions || []).map((q) => {
      const newQ = { ...q };
      if (newQ.type === 'table' && newQ.tableData) {
        newQ.tableData = newQ.tableData.map((r) => Array.isArray(r) ? r : (r.row || r));
      }
      return newQ;
    });

    const newRubrics: Record<string, string> = {};
    const extractedUiInfo: Record<string, { type: string, marks: string }> = {};

    addLog("Starting extraction phase...");
    if (!process.env.GEMINI_API_KEY) {
      addLog("CRITICAL: GEMINI_API_KEY is undefined.");
    }

    try {
      const extractionPrompt = `Extract rubric, correct answer, and marks for each question.
For 'tick-cross' type questions, explicitly set the correct_answer to "TRUE" or "FALSE". Rubric should specify that "TRUE" corresponds to a checkmark and "FALSE" to a cross.
For 'table' type questions, extract the rubric values as "INDEX CORRECT_VALUE" (e.g. 0 CC, 1 PC) where INDEX is the row index starting from 0 (excluding headers). Ensure the list is ordered by INDEX ascending.
---
MARK SCHEME:
${markscheme}
---
QUESTIONS:
${JSON.stringify(cleanQuestions.map(q => ({ id: q.id, type: q.type, text: q.prompt })))}
---
JSON OUTPUT: { "q_id": { "rubric": "...", "correct_answer": "...", "marks": number, "explanation": "..." } }`;

      addLog("Sending extraction request to Gemini...");
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-preview",
        contents: extractionPrompt,
        config: { responseMimeType: "application/json" }
      });

      addLog("Extraction response received.");
      const cleanText = response.text!.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsedResults = JSON.parse(cleanText);

      cleanQuestions.forEach(q => {
        const result = parsedResults[q.id] || parsedResults[q.id.toLowerCase()] || null;
        if (result) {
          addLog(`Mapped question ${q.id} successfully.`);
          newRubrics[q.id] = JSON.stringify(result);
          extractedUiInfo[q.id] = { type: q.type, marks: String(result.marks || 1) };
        } else {
          addLog(`Warning: No specific mapping for ${q.id}.`);
          newRubrics[q.id] = JSON.stringify({ rubric: "Grade based on general accuracy.", correct_answer: "Not explicitly found", marks: 1 });
          extractedUiInfo[q.id] = { type: q.type, marks: "1" };
        }
      });

      if (isAdmin) {
        addLog("Caching extracted rubrics to Firestore...");
        try {
          await setDoc(doc(db, 'processedRubrics', task.id), {
            taskId: task.id,
            rubrics: newRubrics,
            meta: extractedUiInfo,
            updatedAt: new Date().toISOString()
          });
          addLog("Cache saved successfully.");
        } catch (cacheErr: any) {
          addLog(`Caching failed: ${cacheErr.message}`);
        }
      }
    } catch (e: any) {
       addLog(`Extraction FAILED: ${e.message}`);
       console.error("Extraction failed, falling back to basic mapping", e);
    }

    addLog("Extraction phase complete. Ready to grade.");
    setExtractedRubrics(newRubrics);
    setRubricMeta(extractedUiInfo);
    setCurrentlyProcessingId(null);
    setCurrentlyProcessingIndex(null);
    setGradingPhase('ready_to_grade');
  };

  const getStudentOriginalResponse = (q) => {
      let req = responses[q.id];
      let textReq = req;
      if (typeof req === 'string' && req.trim() === '') textReq = "[NO RESPONSE PROVIDED]";
      else if (req === undefined || req === null) textReq = "[NO RESPONSE PROVIDED]";
      else if (Array.isArray(req) && req.length === 0) textReq = "[NO RESPONSE PROVIDED]";
      else if (typeof req === 'object' && !Array.isArray(req) && Object.keys(req).length === 0) textReq = "[NO RESPONSE PROVIDED]";
      else if (q.type === 'table' && q.tableData && typeof req === 'object') {
        const tableLines: string[] = [];
        // Sort keys to ensure consistent order by row (r) then column (c)
        const sortedKeys = Object.keys(req).sort((a, b) => {
          const [rA, cA] = a.split('_').map(Number);
          const [rB, cB] = b.split('_').map(Number);
          if (rA !== rB) return rA - rB;
          return cA - cB;
        });

        for (const key of sortedKeys) {
          const val = req[key];
          const [rStr, cStr] = key.split('_');
          const r = parseInt(rStr, 10);
          const c = parseInt(cStr, 10);
          if (!isNaN(r) && !isNaN(c) && q.tableData[r] && q.tableData[0]) {
             tableLines.push(`${r}_${c}: ${String(val)}`);
          } else {
             tableLines.push(`${key}: ${String(val)}`);
          }
        }
        textReq = tableLines.join('\n');
      }
      else if (typeof req === 'object') textReq = JSON.stringify(req);
      return textReq;
  };

  const gradeAgainstRubric = async () => {
    if (!isAdmin || !task.worksheetQuestions || task.worksheetQuestions.length === 0) return;
    
    setIsGradingWorkflow(true);
    setGradingPhase('grading');
    addLog("Starting individual question grading...");
    let currentFeedback = { ...validationFeedback };
    let gradingIdx = 0;
    
    let computedTotal = 0;
    let computedEarned = 0;
    
    const totalQuestions = task.worksheetQuestions?.length || 0;
    
    for (const q of task.worksheetQuestions || []) {
       setCurrentlyProcessingId(q.id);
       setCurrentlyProcessingIndex(gradingIdx++);
       setGradingProgress((gradingIdx / totalQuestions) * 100);
       
       // Auto-scroll sync
       setTimeout(() => {
         const worksheetEl = document.getElementById(`test-q-container-${q.id}`);
         const rubricEl = document.getElementById(`test-rubric-container-${q.id}`);
         
         if (worksheetEl && rightPaneRef.current) {
           worksheetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
         }
         
         if (rubricEl && gradingConsoleContentRef.current) {
           rubricEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
         }
       }, 100);

       addLog(`Grading question ${q.id} (${gradingIdx} of ${totalQuestions})...`);
       
       const textReq = getStudentOriginalResponse(q);
       const rubricString = extractedRubrics[q.id] || JSON.stringify({ rubric: "Grade based on general correctness against subject matter.", correct_answer: "Unknown", marks: 1 });
       let parsedRubricObj = null;
       try { parsedRubricObj = JSON.parse(rubricString); } catch(e) {}
       
       let correct_answer = "Derived from rubric";
       let specific_rubric = rubricString;
       let explanation = "See rubric";
       let total_marks = 1;

       if (parsedRubricObj && typeof parsedRubricObj === 'object') {
          correct_answer = parsedRubricObj.correct_answer || parsedRubricObj.answer || correct_answer;
          specific_rubric = parsedRubricObj.rubric || parsedRubricObj.grading_instructions || specific_rubric;
          explanation = parsedRubricObj.explanation || explanation;
          total_marks = typeof parsedRubricObj.marks !== 'undefined' ? Number(parsedRubricObj.marks) : 1;
       }

       const strAns = typeof correct_answer === 'object' ? JSON.stringify(correct_answer) : correct_answer;
       const strRubric = typeof specific_rubric === 'object' ? JSON.stringify(specific_rubric) : specific_rubric;

       const promptText = `Grade student response against rubric. Max 100 words feedback.
STRICT GRADING RULES:
1. For 'tick-cross' type: Student response is "TRUE" (checkmark) or "FALSE" (cross). Comparison must be CASE-INSENSITIVE against the rubric's "TRUE"/"FALSE" value.
2. For 'table' type: 
   - STUDENT RESPONSE: Lines in "R_C: VALUE" format.
   - RUBRIC: Lines in "INDEX CORRECT_VALUE" format.
   - ACTION: Sort student response by row index R ascending. Ignore column index C.
   - COMPARISON: Match student's R with rubric's INDEX. Compare 'VALUE' with 'CORRECT_VALUE'.
   - SCORING: Each correct pair match = 1 mark. Sum these for final score.
   - NOTE: If a student's R matches the rubric's INDEX and the VALUE matches CORRECT_VALUE, it is CORRECT. Ignore any perceived 'rubric structure mapping' mismatch if the values themselves align perfectly for each index.
3. logic:
- empty/[NO RESPONSE PROVIDED] -> "No response." + ref answer | 0 marks
- incorrect -> "Incorrect." + ref answer + reason
- correct/partial -> "Correct."/"Partially correct." + reason
---
ID: ${q.id} | TYPE: ${q.type}
REF ANSWER: ${strAns}
RUBRIC: ${strRubric}
STUDENT ANSWER: ${textReq}
---
JSON OUTPUT: { "earned_marks": float, "total_marks": float, "feedback": "string" }`;

       console.log("GRADING PROMPT FOR QUESTION " + q.id + ":\n", promptText);

       try {
         addLog(`Requesting grade for ${q.id} from Gemini...`);
         
         const parts: any[] = [{ text: promptText }];
         
         if (q.type === 'file-upload' && Array.isArray(responses[q.id])) {
            const files = responses[q.id];
            for (const f of files) {
               try {
                  const r = await fetch(f.url);
                  const arrayBuffer = await r.arrayBuffer();
                  const uint8Array = new Uint8Array(arrayBuffer);
                  let binary = '';
                  for (let i = 0; i < uint8Array.byteLength; i++) {
                     binary += String.fromCharCode(uint8Array[i]);
                  }
                  const base64Data = window.btoa(binary);
                  const mimeType = f.name.endsWith('.pdf') ? 'application/pdf' : f.name.endsWith('.png') ? 'image/png' : 'image/jpeg';
                  parts.push({
                     inlineData: {
                        mimeType,
                        data: base64Data
                     }
                  });
               } catch (fetchErr) {
                  console.error("Failed to fetch file for grading:", fetchErr);
                  addLog("Failed to fetch file for grading: " + f.name);
               }
            }
         }

         const typingDurationMs = (extractedRubrics[q.id]?.length || 0) * 8;
         const typingPromise = new Promise(r => setTimeout(r, typingDurationMs + 500));

         const responsePromise = ai.models.generateContent({
            model: "gemini-3.1-flash-lite-preview",
            contents: { role: 'user', parts },
            config: {
              responseMimeType: "application/json",
            }
         });
         
         const [response] = await Promise.all([responsePromise, typingPromise]);
         
         const rawText = response.text || "";
         addLog(`Received response for ${q.id}.`);
         console.log("GRADING RESPONSE FOR QUESTION " + q.id + ":\n", rawText);
         
         let cleanText = rawText.replace(/\`\`\`json/gi, '').replace(/\`\`\`/g, '').trim();
         const parsed = JSON.parse(cleanText);
         
         computedEarned += (parsed.earned_marks || 0);
         computedTotal += (parsed.total_marks || total_marks);
         
         const formattedParsed = {
           score: `${parsed.earned_marks || 0} of ${parsed.total_marks || total_marks}`,
           feedback: (parsed.feedback || '')
              .replace(/\*\*/g, '')
              .replace(/Student Response: /gi, '')
              .replace(/Correct Response: /gi, '')
         };
         currentFeedback[q.id] = formattedParsed;
         setValidationFeedback(prev => ({ ...prev, [q.id]: formattedParsed }));
         
         if (onProgress) {
            try {
              await onProgress({ feedback: currentFeedback });
            } catch (err) {
              console.error("onProgress failed:", err);
            }
         }
       } catch (e: any) {
          addLog(`Grading question ${q.id} FAILED: ${e.message}`);
          console.error("Error from AI grading for question", q.id, ":", e);
          computedTotal += total_marks;
          currentFeedback[q.id] = { score: "0 of 1", feedback: "Error grading this question. " + e.message };
          setValidationFeedback(prev => ({ ...prev, [q.id]: currentFeedback[q.id] }));
          if (onProgress) {
             try { await onProgress({ feedback: currentFeedback }); } catch (err) {}
          }
       }
    }
    
    addLog("Generating overall feedback...");
    setGradingPhase('generating_overall');
    setCurrentlyProcessingId(null);
    setCurrentlyProcessingIndex(null);
    
    // Generate overall feedback
    try {
      const overallPrompt = `Analyze results. Brief overall comment on performance, strengths, weaknesses.
---
DATA: ${JSON.stringify(currentFeedback)}
---
OUTPUT: Plain text paragraph.`;
      const overallResponse = await ai.models.generateContent({
         model: "gemini-3.1-flash-lite-preview",
         contents: overallPrompt
      });
      
      const overallComments = overallResponse.text || "Assessment graded successfully.";
      addLog("Overall feedback generated.");
      setGeneralFeedback(overallComments);
      
      if (onProgress) {
         await onProgress({ feedback: currentFeedback, generalFeedback: overallComments, score: computedEarned, total: computedTotal, cheatLogs: (typeof cheatLogs !== 'undefined' ? cheatLogs : undefined) });
      }
      setGradingPhase('done');
      setGradingProgress(100);
      setGradingComplete(true);
      addLog("All grading completed.");
      onComplete(responses, { feedback: currentFeedback, generalFeedback: overallComments, score: computedEarned, total: computedTotal, cheatLogs: (typeof cheatLogs !== 'undefined' ? cheatLogs : undefined) });
    } catch (e: any) {
      addLog(`Overall feedback FAILED: ${e.message}`);
      setGradingPhase('done');
      setGradingProgress(100);
      setGradingComplete(true);
      onComplete(responses, { feedback: currentFeedback, generalFeedback: "Assessment graded generally.", score: computedEarned, total: computedTotal, cheatLogs: (typeof cheatLogs !== 'undefined' ? cheatLogs : undefined) });
    }
  };
  
  const handleFinalSubmit = async () => {
    if (isValidating) return;
    setShowConfirm(false);
    setIsValidating(true);
    
    try {
      if (isAdmin && readOnly) {
        await gradeAgainstRubric();
        setSubmitted(true);
      } else {
        await onComplete(responses, { cheatLogs: (typeof cheatLogs !== 'undefined' ? cheatLogs : undefined) });
        setSubmitted(true);
      }
    } catch (error: any) {
      console.error(error);
      alert(isAdmin ? `Grading failed: ${error.message}` : `Submission failed. Please try again. ${error.message}`);
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
      <AnimatePresence>
        {cheatDetected && !submitted && !readOnly && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-red-600/95 backdrop-blur-2xl z-[1000] flex flex-col items-center justify-center p-12 text-center"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[3rem] p-12 max-w-lg w-full shadow-[0_32px_64px_-12px_rgba(220,38,38,0.4)] space-y-8"
            >
              <div className="bg-red-100 w-24 h-24 rounded-[2rem] flex items-center justify-center text-red-600 mx-auto animate-bounce">
                <AlertCircle size={64} />
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter leading-none">Security Alert</h1>
                <p className="text-gray-500 font-bold text-lg leading-relaxed">
                  Focus loss, shortcut usage, or copy-paste attempts have been detected. This event has been logged for teacher review.
                </p>
              </div>
              <button 
                onClick={() => {
                  setCheatDetected(false);
                  stopSiren();
                }}
                className="w-full bg-red-600 text-white py-6 rounded-2xl font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-100 active:scale-95"
              >
                Resume Assessment
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="bg-white/5 backdrop-blur-md border-b border-white/10 p-4 shrink-0 sticky top-0 z-[100] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)]">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-5">
            <button 
              onClick={onBack}
              className="w-10 h-10 flex items-center justify-center bg-white hover:bg-red-50 border-2 border-slate-200 hover:border-red-200 hover:text-red-600 rounded-[1.2rem] text-slate-500 transition-all active:scale-95 group/btn shadow-sm"
            >
              <ChevronLeft size={20} className="stroke-[3] group-hover/btn:-translate-x-1 transition-transform" />
            </button>
            <div className="h-8 w-px bg-slate-200 mx-1" />
            <div className="flex flex-col">
              <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none">{task.title}</h1>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[9px] font-black text-red-600 uppercase tracking-[0.2em] px-2 py-0.5 bg-red-50 rounded-md border border-red-100">Secure Assessment</span>
                {task.subject && <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">• {task.subject}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="hidden md:flex items-center gap-4 bg-white/10 px-6 py-2.5 rounded-[1.2rem] border border-white/10 backdrop-blur-md">
                <div className="flex flex-col items-end">
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Time Remaining</span>
                   <span className={`text-sm font-black tracking-widest leading-none flex items-center gap-1.5 ${timeLeft && timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-slate-700'}`}>
                     <Timer size={12} /> {formatTime(timeLeft || 0)}
                   </span>
                </div>
             </div>

             <div className="bg-slate-100 p-1.5 rounded-[1.2rem] border border-slate-200 flex items-center gap-1.5">
               <button 
                 onClick={() => setShowSketchpad(showSketchpad ? false : true)}
                 className={`flex items-center gap-2 px-4 py-2 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest transition-all ${showSketchpad ? 'bg-white text-indigo-500 shadow-sm border border-transparent scale-105' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`}
                 title="Virtual Sketchpad"
               >
                 <Pen size={14} className={showSketchpad ? 'text-indigo-500' : ''} /> Sketchpad
               </button>
               <button 
                 onClick={() => setShowCalculator(!showCalculator)}
                 className={`flex items-center gap-2 px-4 py-2 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest transition-all ${showCalculator ? 'bg-white text-indigo-500 shadow-sm border border-transparent scale-105' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`}
                 title="Calculator"
               >
                 <Calculator size={14} className={showCalculator ? 'text-indigo-500' : ''} /> Calc
               </button>
             </div>

              {isAdmin && (
                <div className="bg-slate-100 p-1.5 rounded-[1.2rem] border border-slate-200 flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setEditingQuestions(JSON.stringify(task.worksheetQuestions || [], null, 2));
                      setShowQuestionsEditor(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest transition-all text-slate-400 hover:text-emerald-600 hover:bg-white border border-transparent hover:border-slate-200 shadow-none hover:shadow-sm"
                  >
                    Questions
                  </button>
                  <button
                    onClick={() => {
                      setEditingMarkscheme(markscheme);
                      setShowMarkschemeEditor(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest transition-all text-slate-400 hover:text-blue-600 hover:bg-white border border-transparent hover:border-slate-200 shadow-none hover:shadow-sm"
                  >
                    Markscheme
                  </button>
                </div>
              )}

             {(!readOnly || isAdmin) && (
               <button
                 disabled={isValidating}
                 onClick={() => {
                   if (isAdmin && readOnly && !isGradingWorkflow) {
                     startGradingWorkflow();
                   } else if (!isGradingWorkflow) {
                     setShowConfirm(true);
                   }
                 }}
                 className={`ml-3 px-6 py-2.5 rounded-[1.2rem] font-black uppercase text-[10px] tracking-[0.2em] transition-all duration-300 disabled:opacity-50 flex items-center gap-2 group/btn shadow-xl backdrop-blur-xl border ${
                   isAdmin && readOnly && !isGradingWorkflow
                     ? 'bg-indigo-600/90 border-indigo-400/50 text-white hover:bg-indigo-500 shadow-indigo-900/20'
                     : 'bg-red-600/90 border-red-400/50 text-white hover:bg-red-500 shadow-red-900/20'
                 }`}
               >
                 <div className="w-7 h-7 flex items-center justify-center bg-white/20 rounded-[0.6rem] group-hover/btn:scale-110 transition-transform text-current">{isValidating ? <RefreshCw className="animate-spin" size={14} /> : (isAdmin && readOnly && !isGradingWorkflow ? <CheckCircle2 size={14} /> : <Send size={14} />)}</div>
                 <span>{isValidating ? 'Validating...' : (isAdmin && readOnly && !isGradingWorkflow ? 'Admin Grade' : 'Final Submit')}</span>
               </button>
             )}
          </div>
        </div>
      </header>

      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl text-center space-y-8">
              <div className="bg-red-50 w-24 h-24 rounded-[2rem] flex items-center justify-center text-red-600 mx-auto">
                <AlertCircle size={48} />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-gray-900 mb-2 uppercase tracking-tighter">Ready to Submit?</h3>
                <p className="text-gray-500 font-bold px-4">Your responses will be locked and sent for assessment. Double check your work before finalizing.</p>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setShowConfirm(false)} className="flex-1 py-4 rounded-2xl font-black uppercase text-[10px] text-gray-400 hover:bg-gray-50 tracking-widest transition-colors">Back to Test</button>
                <button onClick={isAdmin && readOnly && !isGradingWorkflow ? startGradingWorkflow : handleFinalSubmit} className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] shadow-xl shadow-red-100 hover:bg-red-700 active:translate-y-1 active:shadow-none transition-all tracking-widest">{isAdmin && readOnly && !isGradingWorkflow ? "Start Grading" : "Confirm Submit"}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                  <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Edit Assessment Questions</h3>
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
                  className="px-6 py-3 rounded-xl font-black uppercase text-xs text-gray-400 hover:bg-gray-50 tracking-widest transition-colors"
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
                Changes will be used for future grading.
              </p>
              <textarea
                value={editingMarkscheme}
                onChange={(e) => setEditingMarkscheme(e.target.value)}
                className="w-full flex-1 min-h-[300px] p-6 rounded-2xl border-2 border-slate-100 font-mono text-sm leading-relaxed resize-none focus:border-blue-500 outline-none custom-scrollbar mb-6 bg-slate-50/50 text-gray-800"
                placeholder="Enter the markscheme here..."
              />
              <div className="flex justify-end gap-4 shrink-0">
                <button
                  onClick={() => setShowMarkschemeEditor(false)}
                  className="px-6 py-3 rounded-xl font-black uppercase text-xs text-gray-400 hover:bg-gray-50 tracking-widest transition-colors"
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

      <main className="flex-1 flex overflow-hidden bg-gray-50">
        {/* Left Side: PDF Viewer OR Grading Queue */}
        <div ref={pdfContainerRef} className={`${isGradingWorkflow ? (isGradingConsoleExpanded ? 'w-0 opacity-0 pointer-events-none p-0 overflow-hidden' : 'w-[20%]') : (isBatchMode ? 'w-[40%]' : 'w-[50%]')} overflow-y-auto custom-scrollbar p-10 flex flex-col items-center bg-gray-200/40 transition-all duration-700 ease-in-out relative`}>
          {isBatchMode ? (
            <div className="w-full h-full flex flex-col gap-8 max-w-2xl mx-auto">
               <div className="flex items-center gap-4 mb-2">
                  <div className="w-10 h-1 bg-rose-500 rounded-full" />
                  <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em]">Assessment Queue</span>
               </div>
               <div className="space-y-4">
                 {batchQueue?.map((student, idx) => {
                    const isActive = idx === currentBatchIndex;
                    const isGraded = idx < currentBatchIndex;
                    const isPending = idx > currentBatchIndex;
                    
                    return (
                      <motion.div
                        key={student.id}
                        ref={el => studentCardRefs.current[idx] = el}
                        initial={false}
                        animate={{
                          scale: isActive ? 1.02 : 1,
                          opacity: isGraded ? 0.8 : (isPending ? 0.6 : 1),
                          y: isActive ? 0 : (isGraded ? -10 : 10)
                        }}
                        className={`p-8 rounded-[2rem] border-2 transition-all duration-500 relative overflow-hidden ${
                          isActive 
                            ? 'bg-white border-rose-500 shadow-2xl shadow-rose-500/20' 
                            : 'bg-white/50 border-gray-100'
                        }`}
                      >
                        {isActive && (
                          <motion.div 
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-rose-400/20 to-transparent"
                            animate={{
                              x: ['-100%', '100%']
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "linear"
                            }}
                            style={{ width: '100%' }}
                          />
                        )}
                        <div className="flex items-center justify-between relative z-10">
                          <div className="flex items-center gap-6">
                             <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl transition-all duration-500 ${
                               isActive 
                                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' 
                                : (isGraded ? 'bg-rose-50/50 text-rose-300' : 'bg-gray-100 text-gray-400')
                             }`}>
                               {idx + 1}
                             </div>
                             <div>
                               <h4 className={`text-xl font-black uppercase tracking-tight transition-all duration-500 ${
                                 isActive ? 'text-gray-900 translate-x-2' : (isGraded ? 'text-gray-400' : 'text-gray-500')
                               }`}>
                                 {student.studentName}
                               </h4>
                               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                 {isActive ? 'Active Processing...' : (isGraded ? 'Grading Successful' : 'Waiting in Queue')}
                               </p>
                             </div>
                          </div>
                          {isGraded && (
                            <motion.div 
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="flex items-center gap-2 px-4 py-1.5 bg-rose-50 text-rose-600 rounded-full border border-rose-100"
                            >
                               <CheckCircle2 size={12} className="fill-rose-600 text-white" />
                               <span className="text-[10px] font-black uppercase tracking-widest">Graded</span>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    );
                 })}
               </div>
            </div>
          ) : (
            <>
          <div className="sticky top-0 z-30 mb-6 flex gap-2 bg-white/80 backdrop-blur-md p-2 rounded-2xl border border-gray-200 shadow-sm">
            <button 
              onClick={() => setPdfScale(prev => Math.max(0.5, prev - 0.1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
              title="Zoom Out"
            >
              <Minus size={18} />
            </button>
            <span className="flex items-center px-2 text-[10px] font-black text-gray-400 uppercase tracking-widest min-w-[60px] justify-center">
              {Math.round(pdfScale * 100)}%
            </span>
            <button 
              onClick={() => setPdfScale(prev => Math.min(3, prev + 0.1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
              title="Zoom In"
            >
              <Plus size={18} />
            </button>
            <button 
              onClick={() => setPdfScale(1.0)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
              title="Reset Zoom"
            >
              <RotateCcw size={18} />
            </button>
          </div>

          <div className="max-w-4xl w-full flex justify-center">
            <Document
              file={task.pdfUrl || ''}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              options={pdfOptions}
              loading={<div className="flex items-center justify-center py-20"><RefreshCw className="animate-spin text-red-500" size={32} /></div>}
            >
              {Array.from(new Array(numPages), (el, index) => (
                <div 
                  key={`page_${index + 1}`} 
                  data-page-index={index + 1}
                  ref={el => pageRefs.current[index + 1] = el}
                  className="mb-8 shadow-2xl rounded-sm overflow-hidden bg-white pdf-page-container"
                >
                  <Page pageNumber={index + 1} width={viewerWidth * pdfScale} renderTextLayer={false} renderAnnotationLayer={false} />
                </div>
              ))}
            </Document>
          </div>
          </>)}
        </div>

        <div ref={rightPaneRef} className={`${isGradingWorkflow ? (isGradingConsoleExpanded ? 'w-[40%]' : 'w-[40%]') : 'w-[50%]'} border-l border-red-50 bg-gray-50/50 overflow-y-auto custom-scrollbar p-10 transition-all duration-500`}>
          <div className="max-w-6xl mx-auto space-y-12 pb-32">
            <div className="space-y-6 border-b border-red-100 pb-12">
              <div className="space-y-2">
                <h3 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none">Formal Assessment</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest italic flex items-center gap-2">
                  <ShieldCheck size={16} className="text-red-600" /> Secure Protocol v3.1 Active
                </p>
              </div>
              <div className="bg-red-600 rounded-[2rem] p-6 shadow-lg shadow-red-100 overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
                <p className="text-[11px] font-black text-white uppercase tracking-widest leading-relaxed relative z-10 flex items-start gap-3">
                  <AlertCircle size={18} className="shrink-0" /> 
                  <span>
                    Exam conditions enforced. All interactions are monitored. Focus loss or unauthorized input will be flagged immediately.
                  </span>
                </p>
              </div>
            </div>

            {(submitted || readOnly) && cheatLogs && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-blue-600/[0.03] backdrop-blur-3xl border-2 border-blue-500/10 rounded-[3rem] p-12 space-y-8 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/[0.07] rounded-full blur-[120px] -mr-48 -mt-48" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/[0.05] rounded-full blur-[100px] -ml-32 -mb-32" />
                
                <div className="flex items-center gap-4 relative z-10">
                  <div className={`p-3 rounded-2xl shadow-xl glass-morphism ${
                    (Object.values(cheatLogs) as number[]).some(v => v > 0) 
                      ? 'bg-rose-600/20 text-rose-600 border border-rose-500/30' 
                      : 'bg-blue-600/20 text-blue-600 border border-blue-500/30'
                  }`}>
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">Security Audit Log</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                       {(Object.values(cheatLogs) as number[]).some(v => v > 0) ? 'Violations Detected During Exam' : 'No Critical Violations Detected'}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 relative z-10">
                   {[
                     { label: 'Tab Switches', value: cheatLogs.tabSwitches },
                     { label: 'Window Blurs', value: cheatLogs.blur },
                     { label: 'Copy / Paste', value: cheatLogs.copyPaste },
                     { label: 'Shortcuts', value: cheatLogs.shortcutAttempts },
                     { label: 'Print Attempts', value: cheatLogs.printAttempts },
                     { label: 'Tab Opens', value: cheatLogs.tabOpenAttempts },
                   ].map((log, i) => (
                     <div key={i} className={`p-6 rounded-2xl border backdrop-blur-md transition-all duration-300 ${
                       log.value > 0 
                         ? 'bg-rose-500/[0.05] border-rose-500/20 shadow-lg shadow-rose-500/5' 
                         : 'bg-blue-500/[0.03] border-blue-500/10 shadow-lg shadow-blue-500/5'
                     }`}>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{log.label}</div>
                        <div className={`text-3xl font-black tracking-tighter ${log.value > 0 ? 'text-rose-600' : 'text-blue-600'}`}>{log.value || 0}</div>
                     </div>
                   ))}
                </div>
              </motion.div>
            )}

            {Object.keys(questionsByPage).sort((a, b) => parseInt(a) - parseInt(b)).map(pageStr => {
              const pageNum = parseInt(pageStr);
              return (
                <div key={pageNum} id={`test-questions-page-${pageNum}`} className="space-y-10 scroll-mt-24">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-red-600 uppercase tracking-widest px-5 py-2 bg-white rounded-full border border-red-100 shadow-sm">Page {pageNum} Questions</span>
                    <div className="h-px flex-1 bg-red-100/50" />
                  </div>

                  {questionsByPage[pageNum].map((q, idx) => {
                    const typedQ = q as any;
                    const response = responses[typedQ.id];
                    const feedback = validationFeedback[typedQ.id];
                    const isAnswered = !!response;

                    // Enhanced Scoring Logic
                    const scoreText = feedback?.score || "";
                    const scoreParts = scoreText.split(/\s*(?:\/|of)\s*/i);
                    const awarded = parseFloat(scoreParts[0]);
                    const total = parseFloat(scoreParts[1]);
                    const isCorrect = feedback && awarded === total && total > 0;
                    const isPartial = feedback && awarded > 0 && awarded < total;
                    const isIncorrect = feedback && awarded === 0;

                    const isProcessing = currentlyProcessingId === typedQ.id;

                    return (
                      <motion.div 
                        key={typedQ.id}
                        id={`test-q-container-${typedQ.id}`}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className={`rounded-[3rem] transition-all duration-300 relative group overflow-hidden flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:shadow-xl hover:-translate-y-1 ${
                          isProcessing ? 'ring-8 ring-red-500/10' : ''
                        }`}
                      >
                        <div className="px-6 py-4 sm:px-8 sm:py-5 bg-red-600">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <div className={`inline-flex items-center px-3 py-1 rounded-[0.8rem] font-black text-[10px] uppercase tracking-widest shadow-sm bg-white/20 text-white border border-white/30 backdrop-blur-sm`}>
                                Question {idx + 1}
                              </div>
                              {isAnswered && !feedback && <div className="w-5 h-5 bg-white text-red-500 rounded-full flex items-center justify-center shadow-lg"><CheckCircle2 size={12} className="stroke-[3]" /></div>}
                            </div>
                            <div className="text-white pt-1">
                              <QuestionTextWithCommandTerms text={typedQ.question} className="text-white drop-shadow-sm" />
                            </div>
                          </div>
                        </div>

                        <div className={`px-6 py-5 sm:px-8 sm:py-6 bg-white relative transition-colors duration-500 ${
                          feedback ? (
                            isCorrect ? 'bg-emerald-50/10' : 
                            isPartial ? 'bg-orange-50/10' :
                            'bg-red-50/10'
                          ) : ''
                        }`}>
                          {(isAnswered || feedback) && (
                            <div className="absolute top-0 right-0 p-6 z-20">
                              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className={`p-2 rounded-full ${isCorrect ? 'bg-emerald-100 text-emerald-600' : isPartial ? 'bg-orange-100 text-orange-600' : 'bg-red-50 text-red-600'}`}>
                                {isCorrect ? <CheckCircle2 size={16} /> : isPartial ? <AlertCircle size={16} /> : <X size={16} />}
                              </motion.div>
                            </div>
                          )}

                          <div className="relative z-10">

                        {typedQ.type === 'mcq' && (
                          <div className="grid gap-2">
                            {typedQ.options?.map((opt: string, oIdx: number) => (
                              <button
                                key={oIdx}
                                onClick={() => !(readOnly || submitted) && handleResponse(typedQ.id, opt)}
                                disabled={readOnly || submitted}
                                className={`w-full text-left p-4 rounded-xl border-2 font-helvetica font-black text-sm transition-all ${
                                  responses[typedQ.id] === opt ? 'bg-red-600 border-red-600 text-white' : 'bg-white border-gray-50 text-gray-600 hover:border-red-200'
                                } ${(readOnly || submitted) && responses[typedQ.id] !== opt ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}

                        {typedQ.type === 'tick-cross' && (
                          <div className="grid grid-cols-2 gap-4">
                            {[ {label: '✓', value: 'TRUE'}, {label: '✕', value: 'FALSE'} ].map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => !(readOnly || submitted) && handleResponse(typedQ.id, opt.value)}
                                disabled={readOnly || submitted}
                                className={`p-8 rounded-3xl border-4 font-helvetica font-black text-3xl transition-all shadow-sm ${
                                  responses[typedQ.id] === opt.value
                                    ? opt.value === 'TRUE' ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-red-500 border-red-600 text-white'
                                    : 'bg-white border-gray-100 text-gray-300 hover:border-gray-200'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
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
                                <span className="flex-1 font-helvetica font-bold text-gray-700">{item}</span>
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
                                      className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
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
                                      className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                      <ChevronLeft size={16} className="-rotate-90" />
                                    </button>
                                  </div>
                                )}
                              </motion.div>
                            ))}
                          </div>
                        )}

                        {typedQ.type === 'table' && typedQ.tableData && (
                          <div className="overflow-hidden rounded-3xl border-2 border-red-100 bg-white">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="bg-red-50">
                                  {typedQ.tableData[0].map((header: string, hIdx: number) => (
                                    <th key={hIdx} className="p-4 text-[10px] font-black text-red-800 uppercase tracking-widest border-b-2 border-red-100 border-r border-red-100 last:border-r-0">
                                      {header}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {typedQ.tableData.slice(1).map((row: string[], rIdx: number) => (
                                  <tr key={rIdx} className="last:border-b-0 border-b border-red-50">
                                    {row.map((cell: string, cIdx: number) => {
                                      const isEditableCell = cell === "";
                                      return (
                                        <td key={cIdx} className={`p-0 border-r border-red-50 last:border-r-0 ${!isEditableCell ? 'bg-gray-50/50' : 'bg-white'}`}>
                                          {!isEditableCell ? (
                                            <div className="p-4 text-xs font-helvetica font-bold text-gray-600">{cell}</div>
                                          ) : (
                                            <input
                                              type="text"
                                              placeholder="..."
                                              readOnly={readOnly || submitted}
                                              value={responses[typedQ.id]?.[`${rIdx}_${cIdx}`] || ''}
                                              onChange={(e) => {
                                                const newTableResponse = { ...(responses[typedQ.id] || {}) };
                                                newTableResponse[`${rIdx}_${cIdx}`] = e.target.value;
                                                handleResponse(typedQ.id, newTableResponse);
                                              }}
                                              className="w-full h-full p-4 text-xs font-helvetica font-black text-red-600 outline-none focus:bg-red-50/30 transition-colors placeholder:text-gray-200"
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
                        )}

                        {typedQ.type === 'short-response' && (
                          <div className="relative">
                            <textarea
                              placeholder="Formulate your assessment response here..."
                              value={responses[typedQ.id] || ''}
                              readOnly={readOnly || submitted}
                              onChange={(e) => handleResponse(typedQ.id, e.target.value)}
                              className={`w-full p-8 rounded-[2rem] border-2 font-helvetica font-bold text-sm text-gray-800 focus:border-red-500 focus:bg-white outline-none transition-all resize-none min-h-[180px] shadow-sm tracking-tight leading-relaxed ${readOnly || submitted ? 'bg-gray-50 border-gray-100 shadow-none' : 'bg-red-50/10 border-gray-100'} placeholder:text-gray-300`}
                            />
                            <div className="absolute bottom-6 right-6 px-3 py-1 bg-gray-900/5 rounded-lg">
                               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{responses[typedQ.id]?.length || 0} chars</span>
                            </div>
                          </div>
                        )}

                        {typedQ.type === 'file-upload' && (
                          <div className="bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-8 flex flex-col gap-6">
                            <div>
                              <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-2">Upload Required File</h4>
                              <p className="text-xs text-slate-500 font-medium">Please attach your work file. You can also use the sketchpad to generate an image to be submitted with this question.</p>
                            </div>
                            <div className="flex gap-4 items-center">
                              <FileUpload 
                                disabled={readOnly || submitted}
                                uploadPaths={getUploadPaths(typedQ.id)}
                                onUpload={(url, name) => {
                                  const existing = responses[typedQ.id] || [];
                                  handleResponse(typedQ.id, [...existing, { url, name }]);
                                }}
                              />
                              {!readOnly && !submitted && (
                                <button 
                                  onClick={() => setShowSketchpad(typedQ.id)}
                                  className="px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-100 transition-colors border border-red-100"
                                >
                                  Create Sketch
                                </button>
                              )}
                            </div>
                            {responses[typedQ.id]?.length > 0 && (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {responses[typedQ.id].map((file: any, i: number) => {
                                  const isImage = file.name.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) || file.url.match(/\.(jpeg|jpg|gif|png|webp|svg)/i) || file.name.startsWith('sketch_');
                                  return (
                                    <div key={i} className="flex flex-col rounded-[1.5rem] border border-slate-200 bg-white overflow-hidden shadow-sm relative group w-full">
                                      {isImage && (
                                        <div className="h-40 bg-slate-100 flex items-center justify-center overflow-hidden border-b border-slate-200 w-full relative">
                                          <img src={file.url} alt={file.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                                        </div>
                                      )}
                                      <a href={file.url} target="_blank" rel="noopener noreferrer" className="flex flex-col gap-1 p-4 hover:bg-slate-50 transition-colors flex-grow">
                                        <span className="text-sm font-black text-slate-700 truncate" title={file.name}>{file.name}</span>
                                        <span className="text-[10px] uppercase font-black tracking-widest text-red-600">Attached</span>
                                      </a>
                                      {!readOnly && !submitted && (
                                        <button 
                                          onClick={(e) => {
                                            e.preventDefault();
                                            const existing = responses[typedQ.id] || [];
                                            handleResponse(typedQ.id, existing.filter((_: any, idx: number) => idx !== i));
                                          }}
                                          className="absolute top-3 right-3 w-8 h-8 bg-red-500 text-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md hover:scale-110 hover:bg-red-600"
                                          title="Remove file"
                                        >
                                          <X size={16} />
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        {(submitted || readOnly) && validationFeedback[typedQ.id] && (
                          <motion.div 
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`mt-8 p-8 rounded-[2rem] border-2 relative overflow-hidden ${
                              isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 
                              isPartial ? 'bg-orange-50 border-orange-200 text-orange-900' :
                              'bg-red-50 border-red-100 text-red-900'
                            }`}
                          >
                            <div className="absolute top-0 right-0 p-4">
                               {isCorrect ? <CheckCircle2 className="text-emerald-500/20" size={80} /> : 
                                isPartial ? <AlertCircle className="text-orange-500/20" size={80} /> :
                                <AlertCircle className="text-red-500/20" size={80} />}
                            </div>
                            <div className="flex items-center justify-between mb-6 relative z-10">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl bg-white shadow-sm ${
                                  isCorrect ? 'text-emerald-600' : 
                                  isPartial ? 'text-orange-600' : 
                                  'text-red-600'
                                }`}>
                                  <ShieldCheck size={20} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Teacher's Feedback</span>
                              </div>
                              <span className={`px-4 py-1.5 rounded-full text-xs font-black shadow-lg ${
                                isCorrect ? 'bg-emerald-500 text-white' : 
                                isPartial ? 'bg-orange-500 text-white' :
                                'bg-red-500 text-white'
                              } relative z-20`}>
                                {validationFeedback[typedQ.id].score}
                              </span>
                            </div>
                            <p className="text-sm font-helvetica font-black leading-relaxed whitespace-pre-wrap relative z-10 text-gray-700">
                              {validationFeedback[typedQ.id].feedback}
                            </p>
                          </motion.div>
                        )}
                        </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              );
            })}

            {((responses._attachments && responses._attachments.length > 0) || (!isAdmin && !readOnly && !submitted)) && (
               <div className="bg-white p-8 rounded-[2rem] border-2 border-slate-100 mt-12 space-y-6">
                 <div className="flex justify-between items-start">
                   <div>
                     <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Test Attachments</h4>
                     {(!isAdmin && !readOnly && !submitted) && <p className="text-xs font-medium text-slate-500">Upload any reference material, answer sheets, or work files required for this task.</p>}
                   </div>
                 </div>
                 
                 {(!isAdmin && !readOnly && !submitted) && (
                   <FileUpload 
                     uploadPaths={getUploadPaths()}
                     onUpload={(url, name) => {
                       setResponses(prev => {
                         const next = { ...prev };
                         const attachments = Array.isArray(next._attachments) ? next._attachments : [];
                         next._attachments = [...attachments, { url, name }];
                         return next;
                       });
                     }} 
                   />
                 )}
                 {responses._attachments?.length > 0 && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                     {responses._attachments.map((file: any, i: number) => (
                       <div key={i} className="flex overflow-hidden rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
                         <a href={file.url} target="_blank" rel="noopener noreferrer" className="flex flex-col gap-1 p-4 flex-grow">
                           <span className="text-sm font-black text-slate-700 truncate">{file.name}</span>
                           <span className="text-[10px] uppercase font-black tracking-widest text-red-600">Attached</span>
                         </a>
                         {(!readOnly && !submitted) && (
                           <button
                             onClick={() => {
                               setResponses(prev => {
                                 const next = { ...prev };
                                 next._attachments = next._attachments.filter((_: any, idx: number) => idx !== i);
                                 return next;
                               });
                             }}
                             className="p-4 bg-red-50 hover:bg-red-500 hover:text-white text-red-500 transition-colors flex items-center justify-center shrink-0"
                             title="Remove attachment"
                           >
                             <Trash2 size={16} />
                           </button>
                         )}
                       </div>
                     ))}
                   </div>
                 )}
               </div>
            )}

            {generalFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-900 border-2 border-gray-800 rounded-[3rem] p-12 space-y-8 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-[100px] -mr-32 -mt-32" />
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="bg-red-600 text-white p-3 rounded-2xl shadow-xl shadow-red-600/20">
                      <Send size={24} />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-white uppercase tracking-tight">Overall Comments</h4>
                    </div>
                  </div>
                  {readOnly && (
                    <div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-4 backdrop-blur-md">
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Aggregate</span>
                       <span className="text-2xl font-black text-red-400 tracking-tighter">
                          {Math.round(Object.values(validationFeedback as any).reduce<number>((acc, f: any) => {
                             const p = f.score?.toString().split(/\s*(?:\/|of)\s*/i);
                             return acc + (p?.[0] ? parseFloat(p[0]) : 0);
                          }, 0))} <span className="text-gray-600 text-lg">/</span> {
                            Object.values(validationFeedback as any).reduce<number>((acc, f: any) => {
                              const p = f.score?.toString().split(/\s*(?:\/|of)\s*/i);
                              return acc + (p?.[1] ? parseFloat(p[1]) : 1);
                           }, 0)
                          }
                       </span>
                    </div>
                  )}
                </div>
                <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 relative z-10">
                  <p className="text-lg font-bold text-gray-300 leading-relaxed italic tracking-tight">
                    "{generalFeedback}"
                  </p>
                </div>
              </motion.div>
            )}

          </div>
        </div>
      
      {isGradingWorkflow && (
        <div className={`${isGradingConsoleExpanded ? 'w-[60%]' : 'w-[40%]'} bg-gray-50 overflow-hidden flex flex-col z-10 transition-all duration-500 border-l border-gray-100`}>
          <div className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth relative">
            {/* Sticky Header with Gradient Background */}
            <div className="sticky top-0 z-30 p-5 flex items-center justify-between gap-6 bg-gradient-to-b from-gray-200/95 via-gray-200/50 to-transparent backdrop-blur-md border-b border-gray-200/30 shadow-sm relative">
              <div className="space-y-1 shrink-0">
                <div className="flex items-center gap-3 mb-0.5">
                  <div className="w-6 h-1 bg-red-600 rounded-full" />
                  <span className="text-[9px] font-black text-red-600 uppercase tracking-[0.3em]">Protocol Alpha</span>
                </div>
                <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none">Grading Engine</h3>
                <div className="flex items-center gap-2 pt-1">
                  <span className="bg-gray-900 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">Gemini 3.1 Flash Lite</span>
                </div>
              </div>

              {/* Bento Progress Card */}
              <div className="flex-1 bg-white/90 p-4 rounded-[1.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 space-y-2">
                <div className="flex justify-between items-end">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Operational Status</span>
                    <span className="text-xs font-black text-red-600 uppercase leading-none block mt-0.5">
                      {gradingPhase === 'extracting_rubrics' ? 'Pre-processing Rubrics' : 
                       gradingPhase === 'grading' ? `Live Analysis` :
                       gradingPhase === 'generating_overall' ? 'Compiling Scores' : 'Engine Ready'}
                    </span>
                  </div>
                  <span className="text-xl font-black text-gray-900 tracking-tighter leading-none">{Math.round(gradingProgress)}%</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-2xl overflow-hidden p-[2px] border border-gray-200">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${gradingProgress}%` }}
                    className="h-full bg-red-600 rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                  />
                </div>
              </div>
            </div>
            
            <div ref={gradingConsoleContentRef} className="p-8 pt-4 space-y-4">
               {(task.worksheetQuestions || []).map((q, idx) => (
                 <motion.div 
                   key={q.id} 
                   id={`test-rubric-container-${q.id}`}
                   className={`p-6 rounded-[2rem] border-2 transition-all duration-500 scroll-mt-24 relative overflow-hidden ${
                     currentlyProcessingId === q.id 
                       ? 'bg-white border-red-500 shadow-2xl scale-[1.02] ring-8 ring-red-500/5' 
                       : 'bg-white border-gray-100 shadow-sm opacity-60'
                   }`}
                 >
                   {/* Shimmer Effect */}
                   {currentlyProcessingId === q.id && (
                     <motion.div
                       initial={{ x: '-100%' }}
                       animate={{ x: '100%' }}
                       transition={{
                         repeat: Infinity,
                         duration: 1.5,
                         ease: "linear"
                       }}
                       className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-red-500/10 to-transparent pointer-events-none"
                     />
                   )}
                   
                   <div className="relative z-10 w-full">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center font-black text-xs">
                          Q{idx + 1}
                        </span>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Marking Criteria</span>
                      </div>
                      {currentlyProcessingId === q.id && (
                         <div className="px-3 py-1 bg-red-600 text-white rounded-full text-[8px] font-black uppercase tracking-widest animate-pulse">
                            Analyzing
                         </div>
                      )}
                    </div>
                    
                    <div className="w-full bg-slate-900 p-6 rounded-[2rem] font-mono text-sm leading-relaxed border-2 border-slate-800 transition-all shadow-inner whitespace-pre-wrap">
                       {extractedRubrics[q.id] ? (
                         <TypewriterRubric 
                           text={extractedRubrics[q.id]} 
                           isActive={currentlyProcessingId === q.id} 
                           isPast={gradingComplete || (currentlyProcessingIndex !== null && idx < currentlyProcessingIndex)} 
                         />
                       ) : "Initializing criteria..."}
                    </div>
                  </div>
                 </motion.div>
               ))}
               
               {generalFeedback && (
                 <div className="p-8 rounded-[2rem] bg-gray-900 border border-gray-800 shadow-2xl space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-600 rounded-lg text-white">
                         <Eye size={16} />
                      </div>
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">Overall Commentary</span>
                    </div>
                    <p className="text-sm font-bold text-gray-400 leading-relaxed italic">"{generalFeedback}"</p>
                 </div>
               )}
            </div>
          </div>

          <div className="p-8 pt-0 border-t border-gray-100 bg-gray-50/80 backdrop-blur-md">
            {/* Console Log for Tests */}
            {gradingLogs.length > 0 && (
                <div 
                  onDoubleClick={() => setIsGradingConsoleExpanded(!isGradingConsoleExpanded)}
                  className={`my-6 bg-gray-900 rounded-[2rem] p-6 shadow-2xl border border-gray-800 flex flex-col transition-all duration-300 shrink-0 overflow-hidden ${
                    isGradingConsoleExpanded ? 'h-[300px]' : 'h-[180px]'
                  } ${isGradingConsoleExpanded ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                  title="Double click to expand console"
                >
                  <div className="flex items-center gap-3 mb-3 pb-3 border-b border-white/5">
                    <Terminal size={12} className="text-red-400" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Output Stream</span>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar font-mono text-[9px] leading-relaxed space-y-2 scroll-smooth">
                    {gradingLogs.map((log, i) => (
                      <div key={i} className="flex gap-3 text-gray-400">
                        <span className="text-gray-700 shrink-0">[{i + 1}]</span>
                        <span className={`${log.includes('FAILED') || log.includes('CRITICAL') ? 'text-red-400' : log.includes('successfully') ? 'text-emerald-400' : ''}`}>
                          {log}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
            )}

            {gradingPhase === 'ready_to_grade' ? (
              <button onClick={gradeAgainstRubric} className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-[0_6px_0_0_#991b1b] active:shadow-none active:translate-y-1.5 transition-all">
                Begin Automated Grading
              </button>
            ) : gradingPhase === 'grading' ? (
              <button disabled className="w-full bg-red-400 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3">
                <RefreshCw size={18} className="animate-spin" /> 
                {currentlyProcessingIndex !== null ? `Evaluating Question ${currentlyProcessingIndex}` : 'Finalizing Output'}
              </button>
            ) : gradingPhase === 'generating_overall' ? (
              <button disabled className="w-full bg-red-400 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3">
                <RefreshCw size={18} className="animate-spin" /> data_compilation.sh
              </button>
            ) : gradingPhase === 'done' ? (
              <button disabled className="w-full bg-gray-800 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3">
                <CheckCircle2 size={18} className="text-emerald-400" /> All Criteria Evaluated
              </button>
            ) : gradingPhase === 'extracting_rubrics' ? (
              <button disabled className="w-full bg-red-400 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3">
                <RefreshCw size={18} className="animate-spin" /> criterion_extraction.py
              </button>
            ) : null}
          </div>
        </div>
      )}
      </main>
      <AnimatePresence>
        {showSketchpad && (
          <Sketchpad 
            onClose={() => setShowSketchpad(false)} 
            uploadPaths={typeof showSketchpad === 'string' ? getUploadPaths(showSketchpad) : getUploadPaths()}
            onSave={typeof showSketchpad === 'string' ? (url, name) => {
              const qId = showSketchpad;
              setResponses(prev => {
                 const existing = prev[qId] || [];
                 return { ...prev, [qId]: [...existing, { url, name }] };
              });
            } : undefined}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {gradingComplete && !isBatchMode && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-emerald-600/98 backdrop-blur-2xl z-[400] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: "spring", damping: 15 }}
              className="bg-white rounded-[4rem] p-16 max-w-xl w-full shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] text-center space-y-10"
            >
              <div className="relative">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1.2 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="w-32 h-32 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-500 mx-auto"
                >
                  <CheckCircle2 size={64} />
                </motion.div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-400/20 rounded-full blur-3xl -z-10 animate-pulse" />
              </div>
              
              <div className="space-y-4">
                <motion.h3 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-5xl font-black text-gray-900 tracking-tighter uppercase leading-none"
                >
                  Assessment <br/> Graded
                </motion.h3>
                <motion.p 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   transition={{ delay: 0.6 }}
                   className="text-gray-500 font-bold text-lg"
                >
                  The Large Language Model (LLM) Deployed has successfully evaluated all test responses. Performance metrics and cheat logs have been compiled into the final report.
                </motion.p>
              </div>

              <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.8 }}
                 className="pt-4 space-y-4"
              >
                <button
                  onClick={onBack}
                  className="group relative w-full overflow-hidden rounded-3xl bg-gray-900 p-6 flex items-center justify-center gap-4 transition-all hover:bg-black active:scale-95"
                >
                  <div className="relative z-10 flex items-center gap-3">
                    <span className="text-xl font-black text-white uppercase tracking-widest">Proceed to report generation</span>
                    <ArrowRight className="text-emerald-400 group-hover:translate-x-2 transition-transform" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </button>
                <button
                  onClick={() => setGradingComplete(false)}
                  className="w-full py-4 rounded-2xl font-black uppercase text-xs text-gray-400 hover:bg-gray-50 tracking-widest transition-colors flex items-center justify-center gap-2"
                >
                  <X size={16} /> Close Preview
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TaskTestView;
