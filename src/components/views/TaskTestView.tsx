import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, CheckCircle2, AlertCircle, FileText, Layout, ArrowRight, X, 
  Calculator, Edit, Eye, Send, Trash2, Timer, RefreshCw, ShieldCheck, Terminal
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
  onProgress?: (partialResults: any) => Promise<void>;
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
  task, onBack, onComplete, onProgress, initialResponses, initialFeedback, initialGeneralFeedback, readOnly, isAdmin, showCalculator, setShowCalculator 
}) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [activePage, setActivePage] = useState(1);
  const [responses, setResponses] = useState<Record<string, any>>(initialResponses || {});
  const [submitted, setSubmitted] = useState(false);
  const [viewerWidth, setViewerWidth] = useState(window.innerWidth * 0.45);
  const [isValidating, setIsValidating] = useState(false);
  const [validationFeedback, setValidationFeedback] = useState<Record<string, { score: string, feedback: string }>>(initialFeedback || {});
  const [generalFeedback, setGeneralFeedback] = useState<string>(initialGeneralFeedback || "");

  const [isGradingWorkflow, setIsGradingWorkflow] = useState(false);
  const [gradingPhase, setGradingPhase] = useState('idle');
  const [extractedRubrics, setExtractedRubrics] = useState<Record<string, string>>({});
  const [rubricMeta, setRubricMeta] = useState<Record<string, { type: string, marks: string }>>({});
  const [currentlyProcessingId, setCurrentlyProcessingId] = useState<string | null>(null);
  const [currentlyProcessingIndex, setCurrentlyProcessingIndex] = useState<number | null>(null);
  const [gradingLogs, setGradingLogs] = useState<string[]>([]);

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

  const pdfOptions = useMemo(() => ({
    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
  }), []);

  // Anti-Cheat State
  const [tabSwitchesCount, setTabSwitchesCount] = useState(0);
  const [cheatLogs, setCheatLogs] = useState<Record<string, number>>({
    tabSwitches: 0,
    blur: 0,
    copyPaste: 0,
    shortcutAttempts: 0,
    printAttempts: 0
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
      // Prevent Print, Save, Inspect, PrintScreen
      if (e.key === 'PrintScreen') {
        logCheat('printAttempts');
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 's' || e.key === 'u' || e.key === 'c' || e.key === 'v')) {
        e.preventDefault();
        logCheat('shortcutAttempts');
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
      const extractionPrompt = `You are a specialist in parsing educational markschemes.
      GOAL: Extract the specific grading rubric, correct answer, and marks for EACH question provided below.
      
      MARK SCHEME CONTENT:
      ${markscheme}
      
      QUESTIONS TO MAP:
      ${JSON.stringify(cleanQuestions.map(q => ({ id: q.id, type: q.type, text: q.prompt })), null, 2)}
      
      RETURN A JSON OBJECT where keys are the Question IDs and values are objects:
      {
        "q_id": {
          "rubric": "string showing how to grade",
          "correct_answer": "the actual correct answer",
          "marks": 1,
          "explanation": "brief reasoning"
        }
      }`;

      addLog("Sending extraction request to Gemini...");
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
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
        const tableMap = {};
        for (const [key, val] of Object.entries(req)) {
          const [rStr, cStr] = key.split('_');
          const r = parseInt(rStr, 10);
          const c = parseInt(cStr, 10);
          if (!isNaN(r) && !isNaN(c) && q.tableData[r] && q.tableData[0]) {
             tableMap[`${q.tableData[0][c]} of ${q.tableData[r][0]}`] = String(val);
          } else {
             tableMap[key] = String(val);
          }
        }
        textReq = JSON.stringify(tableMap);
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
    
    for (const q of task.worksheetQuestions || []) {
       setCurrentlyProcessingId(q.id);
       setCurrentlyProcessingIndex(gradingIdx++);
       addLog(`Grading question ${q.id} (${gradingIdx} of ${task.worksheetQuestions.length})...`);
       
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

       const prompt = `Grade this student response based on the provided correct answer, explanation, and rubric.

CRITICAL INSTRUCTION: You MUST strictly limit your text feedback to under 150 words.

QUESTION IDENTIFIER: ${q.id}
QUESTION TYPE: ${q.type}

STUDENT ANSWER:
${textReq}

CORRECT ANSWER (from markscheme):
${strAns}

EXPLANATION:
${typeof explanation === 'object' ? JSON.stringify(explanation) : explanation}

RUBRIC:
${strRubric}

GRADING LOGIC:
Compare the student answer to the correct answer. 
1. If the student answer is empty or "[NO RESPONSE PROVIDED]", start your feedback with "No response." and award 0 marks.
2. If the student answer is incorrect, start your feedback with "Incorrect." Provide a brief explanation based on the rubric/explanation.
3. If the student answer is correct or partially correct, start your feedback with "Correct." or "Partially correct." Provide a brief explanation based on the rubric/explanation.
Note: For "reorder" questions, the correct answer might sometimes be the initial order itself.

RETURN EXACTLY A JSON OBJECT in this format:
{
  "earned_marks": number,
  "total_marks": number,
  "feedback": "Your brief teacher's feedback here."
}

Return ONLY valid JSON.`;

       console.log("GRADING PROMPT FOR QUESTION " + q.id + ":\n", prompt);

       try {
         addLog(`Requesting grade for ${q.id} from Gemini...`);
         const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
            }
         });
         
         const rawText = response.text || "";
         addLog(`Received response for ${q.id}.`);
         console.log("GRADING RESPONSE FOR QUESTION " + q.id + ":\n", rawText);
         
         let cleanText = rawText.replace(/\`\`\`json/gi, '').replace(/\`\`\`/g, '').trim();
         const parsed = JSON.parse(cleanText);
         
         computedEarned += (parsed.earned_marks || 0);
         computedTotal += (parsed.total_marks || total_marks);
         
         const formattedParsed = {
           score: `${parsed.earned_marks || 0} of ${parsed.total_marks || total_marks}`,
           feedback: (parsed.feedback || '').replace(/\*\*/g, '')
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
      const overallPrompt = `Based on the following grading results for all questions, provide an overall comment on the student's performance, strengths, and weaknesses. Return ONLY a plain text paragraph.\n\nGrading Results:\n${JSON.stringify(currentFeedback, null, 2)}`;
      const overallResponse = await ai.models.generateContent({
         model: "gemini-3-flash-preview",
         contents: overallPrompt
      });
      
      const overallComments = overallResponse.text || "Assessment graded successfully.";
      addLog("Overall feedback generated.");
      setGeneralFeedback(overallComments);
      
      if (onProgress) {
         await onProgress({ feedback: currentFeedback, generalFeedback: overallComments, score: computedEarned, total: computedTotal, cheatLogs: (typeof cheatLogs !== 'undefined' ? cheatLogs : undefined) });
      }
      setGradingPhase('done');
      addLog("All grading completed.");
      onComplete(responses, { feedback: currentFeedback, generalFeedback: overallComments, score: computedEarned, total: computedTotal, cheatLogs: (typeof cheatLogs !== 'undefined' ? cheatLogs : undefined) });
    } catch (e: any) {
      addLog(`Overall feedback FAILED: ${e.message}`);
      setGradingPhase('done');
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
            className="fixed inset-0 bg-red-600/90 backdrop-blur-md z-[1000] flex flex-col items-center justify-center p-12 text-center"
          >
            <div className="bg-white p-8 rounded-full mb-8 animate-pulse">
              <AlertCircle size={80} className="text-red-600" />
            </div>
            <h1 className="text-5xl font-black text-white mb-4 uppercase tracking-tighter text-shadow-lg">Security Protocol Warning</h1>
            <p className="text-white/80 text-xl font-bold max-w-lg mb-12">
              Suspicious behavior (focus loss, copy-paste, or shortcut usage) has been detected and logged.
            </p>
            <button 
              onClick={() => {
                setCheatDetected(false);
                stopSiren();
              }}
              className="bg-white text-red-600 px-12 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-100 transition-colors shadow-2xl active:scale-95"
            >
              Resume Test
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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

          {isAdmin && (
            <>
              <button
                onClick={() => {
                  setEditingQuestions(JSON.stringify(task.worksheetQuestions || [], null, 2));
                  setShowQuestionsEditor(true);
                }}
                className="bg-purple-50 text-purple-600 border border-purple-200 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:brightness-95 transition-all shadow-sm active:translate-y-1"
              >
                Edit Questions
              </button>
              <button
                onClick={() => {
                  setEditingMarkscheme(markscheme);
                  setShowMarkschemeEditor(true);
                }}
                className="bg-blue-50 text-blue-600 border border-blue-200 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:brightness-95 transition-all shadow-sm active:translate-y-1"
              >
                Edit Markscheme
              </button>
            </>
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
                <button onClick={isAdmin && readOnly && !isGradingWorkflow ? startGradingWorkflow : handleFinalSubmit} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-black uppercase text-xs shadow-[0_4px_0_0_#991b1b] active:shadow-none active:translate-y-1 transition-all">{isAdmin && readOnly && !isGradingWorkflow ? "Finalize Grading" : "Submit Now"}</button>
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
        <div ref={pdfContainerRef} className={`${isGradingWorkflow ? 'w-[30%]' : 'flex-1'} overflow-y-auto custom-scrollbar p-8 flex justify-center bg-gray-100 transition-all duration-500`}>
          <div className="max-w-4xl w-full">
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
                  <Page pageNumber={index + 1} width={Math.min(viewerWidth, 800)} renderTextLayer={false} renderAnnotationLayer={false} />
                </div>
              ))}
            </Document>
          </div>
        </div>

        <div ref={rightPaneRef} className={`${isGradingWorkflow ? 'w-[35%]' : 'w-[45%]'}  border-l border-red-100 bg-white overflow-y-auto custom-scrollbar p-8"`}>
          <div className="max-w-xl mx-auto space-y-12 pb-20">
            <div className="space-y-4 border-b border-red-50 pb-8">
              <div className="space-y-1">
                <h3 className="text-3xl font-black text-gray-800 tracking-tight uppercase">Formal Assessment</h3>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest italic flex items-center gap-2">
                  <ShieldCheck size={14} className="text-red-500" /> Secure Protocol v3.1 Enabled
                </p>
              </div>
              <div className="bg-red-50 border border-red-100 p-4 rounded-2xl">
                <p className="text-[10px] font-black text-red-700 uppercase tracking-widest leading-relaxed">
                  <AlertCircle size={10} className="inline mr-1 -mt-0.5" /> 
                  You are now under exam conditions. Any suspicious behavior will be logged and subject to review. 
                  If you attempt to cheat, your results may be disqualified.
                </p>
              </div>
            </div>

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
                                onClick={() => !(readOnly || submitted) && handleResponse(typedQ.id, opt)}
                                disabled={readOnly || submitted}
                                className={`w-full text-left p-4 rounded-xl border-2 font-black text-sm transition-all ${
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
                            {['✓', '✕'].map((opt) => (
                              <button
                                key={opt}
                                onClick={() => !(readOnly || submitted) && handleResponse(typedQ.id, opt)}
                                disabled={readOnly || submitted}
                                className={`p-8 rounded-3xl border-4 font-black text-3xl transition-all shadow-sm ${
                                  responses[typedQ.id] === opt
                                    ? opt === '✓' ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-red-500 border-red-600 text-white'
                                    : 'bg-white border-gray-100 text-gray-300 hover:border-gray-200'
                                }`}
                              >
                                {opt}
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
                                            <div className="p-4 text-xs font-bold text-gray-600">{cell}</div>
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
                                              className="w-full h-full p-4 text-xs font-black text-red-600 outline-none focus:bg-red-50/30 transition-colors placeholder:text-gray-200"
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
                          <textarea
                            placeholder="Type assessment response..."
                            value={responses[typedQ.id] || ''}
                            readOnly={readOnly || submitted}
                            onChange={(e) => handleResponse(typedQ.id, e.target.value)}
                            className="w-full p-4 rounded-2xl border-2 border-gray-100 font-bold text-sm outline-none focus:border-red-500 min-h-[120px] bg-red-50/10"
                          />
                        )}

                        {(submitted || readOnly) && validationFeedback[typedQ.id] && (
                          <div className="mt-6 space-y-3 bg-red-50/30 p-6 rounded-3xl border border-red-100/50">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-[10px] font-black text-red-800 uppercase tracking-widest">Teacher's Feedback</span>
                              </div>
                              <div className="bg-white px-3 py-1 rounded-full border border-red-100 shadow-sm">
                                <span className={`text-[10px] font-black uppercase tracking-tight ${validationFeedback[typedQ.id].score.startsWith('0 of') ? 'text-red-500' : 'text-emerald-500'}`}>
                                  Awarded: {validationFeedback[typedQ.id].score}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs font-bold text-gray-700 italic leading-relaxed">
                              "{validationFeedback[typedQ.id].feedback}"
                            </p>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              );
            })}

            {generalFeedback && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border-2 border-red-100 rounded-3xl p-6 space-y-3">
                <h4 className="text-xs font-black text-red-800 uppercase tracking-widest flex items-center gap-2">
                  <Eye size={16} /> Overall comments
                </h4>
                <p className="text-sm font-bold text-gray-700 italic">"{generalFeedback}"</p>
              </motion.div>
            )}



          </div>
        </div>
      
        {isGradingWorkflow && (
          <div className="w-[35%] border-l-4 border-emerald-500 bg-emerald-50 overflow-y-auto custom-scrollbar p-8 flex flex-col shadow-[-10px_0_20px_rgba(0,0,0,0.05)] z-10 transition-all duration-500">
            <h3 className="text-2xl font-black text-emerald-800 uppercase tracking-tight mb-6">Markscheme & Grading</h3>
            
            <div className="flex-1 space-y-6">
               {(task.worksheetQuestions || []).map((q, idx) => (
                 <div key={q.id} className={`p-4 rounded-xl border-2 transition-all ${currentlyProcessingId === q.id ? 'bg-white border-emerald-500 ring-4 ring-emerald-500/20 shadow-xl scale-[1.02]' : 'bg-white/50 border-emerald-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                       <div className="flex items-center gap-2">
                         <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs"><ShieldCheck size={12} className="mr-1"/> Q{idx + 1}</span>
                         <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Rubric</span>
                       </div>
                       {rubricMeta && rubricMeta[q.id] && (
                         <div className="flex items-center gap-2 text-[9px] font-black uppercase text-emerald-500 tracking-wider">
                            {rubricMeta[q.id].type && <span className="bg-emerald-50 px-2 py-1 rounded">TYPE: {String(rubricMeta[q.id].type)}</span>}
                            {rubricMeta[q.id].marks && <span className="bg-emerald-50 px-2 py-1 rounded">PTS: {String(rubricMeta[q.id].marks)}</span>}
                         </div>
                       )}
                    </div>
                    <div className="text-sm font-medium text-emerald-900 bg-emerald-50 p-3 rounded-lg whitespace-pre-wrap">
                       {gradingPhase === 'extracting_rubrics' && currentlyProcessingId === q.id ? (
                         <div className="flex items-center text-emerald-600 gap-2"><RefreshCw size={14} className="animate-spin" /> Extracting rubric from markscheme...</div>
                       ) : extractedRubrics[q.id] ? (
                         extractedRubrics[q.id]
                       ) : gradingPhase === 'extracting_rubrics' ? (
                         <span className="text-emerald-400">Waiting...</span>
                       ) : "Extracted rubric will appear here."}
                    </div>
                    
                    {/* Removed Redundant AI Feedback in third panel */}
                 </div>
               ))}
               
               {generalFeedback && (
                 <div className="p-4 rounded-xl bg-purple-50 border-2 border-purple-200 mt-6">
                    <span className="text-xs font-black text-purple-600 uppercase tracking-widest mb-2 block">Overall Comments</span>
                    <p className="text-sm text-purple-900 leading-relaxed">{generalFeedback}</p>
                 </div>
               )}
            </div>

            <div className="mt-8 pt-6 border-t-2 border-emerald-200 sticky bottom-0 bg-emerald-50 pb-4">
              {/* Grading Console Logs */}
              {gradingLogs.length > 0 && (
                <div className="mb-6 bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-inner overflow-hidden flex flex-col max-h-48">
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
                    <Terminal size={14} className="text-emerald-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Grading Console</span>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar font-mono text-[10px] leading-relaxed space-y-1.5 scroll-smooth">
                    {gradingLogs.map((log, i) => (
                      <div key={i} className="flex gap-2 group">
                        <span className="text-slate-600 shrink-0 select-none">[{i+1}]</span>
                        <span className={`${log.includes('FAILED') || log.includes('CRITICAL') ? 'text-red-400 font-bold' : log.includes('successfully') ? 'text-emerald-400' : 'text-slate-300'}`}>
                          {log}
                        </span>
                      </div>
                    ))}
                    {gradingPhase !== 'done' && (
                       <div className="animate-pulse flex items-center gap-1 mt-1">
                         <span className="w-1 h-1 bg-emerald-400 rounded-full"></span>
                         <span className="text-emerald-400 opacity-70">Processing...</span>
                       </div>
                    )}
                  </div>
                </div>
              )}

              {gradingPhase === 'ready_to_grade' ? (
                <button onClick={gradeAgainstRubric} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black uppercase text-sm tracking-widest shadow-[0_4px_0_0_#059669] active:shadow-none active:translate-y-1 transition-all">
                  Grade Against Rubric
                </button>
              ) : gradingPhase === 'grading' ? (
                <button disabled className="w-full bg-emerald-400 text-white py-4 rounded-xl font-black uppercase text-sm tracking-widest flex items-center justify-center gap-2">
                  <RefreshCw size={18} className="animate-spin" /> {currentlyProcessingIndex !== null ? `Grading Question ${currentlyProcessingIndex}...` : 'Grading Responses...'}
                </button>
              ) : gradingPhase === 'generating_overall' ? (
                <button disabled className="w-full bg-emerald-400 text-white py-4 rounded-xl font-black uppercase text-sm tracking-widest flex items-center justify-center gap-2">
                  <RefreshCw size={18} className="animate-spin" /> Generating Report...
                </button>
              ) : gradingPhase === 'done' ? (
                <button disabled className="w-full bg-slate-800 text-white py-4 rounded-xl font-black uppercase text-sm tracking-widest">
                  Grading Completed
                </button>
              ) : gradingPhase === 'extracting_rubrics' ? (
                <button disabled className="w-full bg-emerald-400 text-white py-4 rounded-xl font-black uppercase text-sm tracking-widest flex items-center justify-center gap-2">
                  <RefreshCw size={18} className="animate-spin" /> Extracting Rubrics...
                </button>
              ) : null}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TaskTestView;
