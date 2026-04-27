import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, CheckCircle2, AlertCircle, FileText, Layout, ArrowRight, X, 
  Calculator, Edit, Eye, Send, Trash2, Timer, RefreshCw, ShieldCheck, Terminal,
  Pen, Plus, Minus, RotateCcw
} from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Task, Question } from '../../types';
import { GoogleGenAI, Type } from "@google/genai";
import { db } from '../../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import Sketchpad from '../Sketchpad';

// PDF worker setup - Use unpkg for production reliability
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface TaskWorksheetViewProps {
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

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

const TaskWorksheetView: React.FC<TaskWorksheetViewProps> = ({ 
  task, onBack, onComplete, onProgress, initialResponses, initialFeedback, initialGeneralFeedback, readOnly, isAdmin, showCalculator, setShowCalculator 
}) => {
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
  const [showSketchpad, setShowSketchpad] = useState(false);
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
  const gradingConsoleContentRef = useRef<HTMLDivElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});

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


  const pdfOptions = useMemo(() => ({
    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`}), []);

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
         const worksheetEl = document.getElementById(`q-container-${q.id}`);
         const rubricEl = document.getElementById(`rubric-container-${q.id}`);
         
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

       const prompt = `Grade student response against rubric. Max 100 words feedback.
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

       console.log("GRADING PROMPT FOR QUESTION " + q.id + ":\n", prompt);

       try {
         addLog(`Requesting grade for ${q.id} from Gemini...`);
         const response = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite-preview",
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
         await onProgress({ feedback: currentFeedback, generalFeedback: overallComments, score: computedEarned, total: computedTotal });
      }
      setGradingPhase('done');
      setGradingProgress(100);
      setGradingComplete(true);
      addLog("All grading completed.");
      onComplete(responses, { feedback: currentFeedback, generalFeedback: overallComments, score: computedEarned, total: computedTotal });
    } catch (e: any) {
      addLog(`Overall feedback FAILED: ${e.message}`);
      setGradingPhase('done');
      setGradingProgress(100);
      setGradingComplete(true);
      onComplete(responses, { feedback: currentFeedback, generalFeedback: "Assessment graded generally.", score: computedEarned, total: computedTotal });
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
        await onComplete(responses, {  });
        setSubmitted(true);
      }
    } catch (error: any) {
      console.error(error);
      alert(isAdmin ? `Grading failed: ${error.message}` : `Submission failed. Please try again. ${error.message}`);
    } finally {
      setIsValidating(false);
    }
  };

    const handleEdit = () => { setSubmitted(false); setIsValidating(false); setValidationFeedback({}); };
  const questionsByPage = task.worksheetQuestions?.reduce((acc, q) => {
    const page = (q as any).page || 1;
    if (!acc[page]) acc[page] = [];
    acc[page].push(q);
    return acc;
  }, {} as Record<number, Question[]>) || {};

  return (
    <div className="fixed inset-0 bg-gray-50 z-[200] flex flex-col overflow-hidden font-sans">
      {/* Dynamic Header */}
      <header className="bg-white/5 backdrop-blur-md border-b border-white/10 p-4 shrink-0 sticky top-0 z-[100] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)]">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-5">
            <button 
              onClick={onBack}
              className="w-10 h-10 flex items-center justify-center bg-white hover:bg-slate-50 border-2 border-slate-200 hover:text-slate-900 rounded-[1.2rem] text-slate-500 transition-all active:scale-95 group/btn shadow-sm"
            >
              <ChevronLeft size={20} className="stroke-[3] group-hover/btn:-translate-x-1 transition-transform" />
            </button>
            <div className="h-8 w-px bg-slate-200 mx-1" />
            <div className="flex flex-col">
              <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none">{task.title}</h1>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`px-2 py-0.5 rounded-[0.4rem] text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm ${task.type === 'test' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                  {task.type === 'test' ? 'Secure Assessment' : 'Interactive Worksheet'}
                </span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">• Unit {task.unitId || 'General'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-4 bg-white/10 px-6 py-2.5 rounded-[1.2rem] border border-white/10 backdrop-blur-md">
               <div className="flex flex-col items-end">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Progress</span>
                  <span className="text-sm font-black text-slate-700 leading-none">
                    {Object.keys(responses).length}<span className="text-gray-300 mx-0.5">/</span>{task.worksheetQuestions?.length || 0}
                  </span>
               </div>
               <div className="w-px h-6 bg-slate-200/50" />
               <div className="flex flex-col items-end">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Page</span>
                  <span className="text-sm font-black text-slate-700 leading-none">
                    {activePage}<span className="text-gray-300 mx-0.5">/</span>{numPages || '?'}
                  </span>
               </div>
               {timeLeft !== null && (
                 <>
                   <div className="w-px h-6 bg-slate-200/50" />
                   <div className="flex flex-col items-end">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Time</span>
                      <span className={`text-sm font-black leading-none flex items-center gap-1.5 ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-slate-700'}`}>
                        <Timer size={12} /> {formatTime(timeLeft)}
                      </span>
                   </div>
                 </>
               )}
            </div>

            <div className="bg-slate-100 p-1.5 rounded-[1.2rem] border border-slate-200 flex items-center gap-1.5">
              <button 
                onClick={() => setShowSketchpad(!showSketchpad)}
                className={`flex items-center gap-2 px-4 py-2 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest transition-all ${showSketchpad ? 'bg-white text-emerald-500 shadow-sm border border-transparent scale-105' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`}
                title="Virtual Sketchpad"
              >
                <Pen size={14} className={showSketchpad ? 'text-emerald-500' : ''} /> Sketchpad
              </button>
              <button 
                onClick={() => setShowCalculator(!showCalculator)}
                className={`flex items-center gap-2 px-4 py-2 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest transition-all ${showCalculator ? 'bg-white text-emerald-500 shadow-sm border border-transparent scale-105' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`}
                title="Virtual Calculator"
              >
                <Calculator size={14} className={showCalculator ? 'text-emerald-500' : ''} /> Calc
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
                    : 'bg-emerald-600/90 border-emerald-400/50 text-white hover:bg-emerald-500 shadow-emerald-900/20'
                }`}
              >
                <div className="w-7 h-7 flex items-center justify-center bg-white/20 rounded-[0.6rem] group-hover/btn:scale-110 transition-transform text-current">{isValidating ? <RefreshCw className="animate-spin" size={14} /> : (isAdmin && readOnly && !isGradingWorkflow ? <CheckCircle2 size={14} /> : <Send size={14} />)}</div>
                <span>{isValidating ? 'Grading...' : (isAdmin && readOnly && !isGradingWorkflow ? 'Admin Grade' : (task.type === 'test' ? 'Submit assessment' : 'Submit worksheet'))}</span>
              </button>
            )}

            {submitted && isAdmin && !readOnly && (
               <button
                 onClick={handleEdit}
                 className="px-6 py-2.5 rounded-[1.2rem] font-black uppercase text-[10px] tracking-[0.2em] transition-all disabled:opacity-50 flex items-center gap-2 group/btn bg-orange-500 hover:bg-orange-600 text-white border-2 border-orange-600 shadow-[0_4px_0_0_#c2410c] active:shadow-none active:translate-y-1 ml-2"
               >
                 <div className="w-5 h-5 flex items-center justify-center bg-white/20 rounded-lg group-hover/btn:scale-110 transition-transform text-current"><Edit size={12} /></div>
                 <span>Edit</span>
               </button>
            )}
          </div>
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
                  onClick={isAdmin && readOnly && !isGradingWorkflow ? startGradingWorkflow : handleFinalSubmit}
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
        <div ref={pdfContainerRef} className={`${isGradingWorkflow ? (isGradingConsoleExpanded ? 'w-0 opacity-0 pointer-events-none p-0 overflow-hidden' : 'w-[20%]') : 'w-[50%]'}  overflow-y-auto custom-scrollbar p-10 flex flex-col items-center bg-gray-200/40 transition-all duration-700 ease-in-out relative`}>
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
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={(error) => console.error("PDF Load Error:", error)}
              onSourceError={(error) => console.error("PDF Source Error:", error)}
              options={pdfOptions}
              loading={
                <div className="flex flex-col items-center justify-center py-20 gap-6 bg-white/50 backdrop-blur-sm rounded-[3rem] border-2 border-dashed border-gray-200">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500 border-t-transparent shadow-xl"></div>
                    <div className="absolute inset-0 animate-ping rounded-full border-2 border-emerald-500/20"></div>
                  </div>
                  <p className="font-black text-xs text-emerald-600 uppercase tracking-[0.3em] animate-pulse">Initializing Assets...</p>
                </div>
              }
              error={
                <div className="bg-white p-12 rounded-[3rem] border-2 border-red-100 text-center shadow-xl">
                  <div className="bg-red-50 w-20 h-20 rounded-3xl flex items-center justify-center text-red-500 mx-auto mb-6">
                    <AlertCircle size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 uppercase mb-2 tracking-tight">Source Error</h3>
                  <p className="text-gray-500 font-bold max-w-xs mx-auto">The PDF document could not be rendered. Please refresh the page.</p>
                </div>
              }
            >
              {Array.from(new Array(numPages), (el, index) => (
                <motion.div 
                  key={`page_${index + 1}`} 
                  data-page-index={index + 1}
                  ref={el => pageRefs.current[index + 1] = el}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="mb-12 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-xl overflow-hidden bg-white pdf-page-container border border-gray-100"
                >
                  <Page 
                    pageNumber={index + 1} 
                    width={viewerWidth * pdfScale}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                </motion.div>
              ))}
            </Document>
          </div>
        </div>

        {/* Right Side: Interactive Worksheet */}
        <div ref={rightPaneRef} className={`${isGradingWorkflow ? (isGradingConsoleExpanded ? 'w-[40%]' : 'w-[40%]') : 'w-[50%]'}  border-l border-gray-100 bg-white overflow-y-auto custom-scrollbar p-10 transition-all duration-700 ease-in-out`}>
          <div className="max-w-7xl mx-auto space-y-24 pb-32">
            <header className="space-y-6">
              <div className="flex flex-col">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-1 bg-emerald-500 rounded-full" />
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Module Entry</span>
                </div>
                <h3 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-[0.9]">Worksheet Response</h3>
                <div className="flex items-center gap-2 mt-4">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Powered By</span>
                  <span className="px-3 py-1 bg-gray-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">{currentModel}</span>
                </div>
              </div>
              <div className="bg-gray-50 p-6 rounded-[2.5rem] border-2 border-gray-100/80 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-3xl -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-700" />
                <p className="text-sm text-gray-600 font-bold leading-relaxed italic relative z-10">
                  "Examine the source document provided on the left. Synthesize the information and formulate your responses in the designated interactive zones below."
                </p>
              </div>
            </header>

            {Object.keys(questionsByPage).sort((a, b) => parseInt(a) - parseInt(b)).map(pageStr => {
              const pageNum = parseInt(pageStr);
              return (
                <div key={pageNum} id={`questions-page-${pageNum}`} className="space-y-6 scroll-mt-24">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] whitespace-nowrap">Pagination 0{pageNum}</span>
                    <div className="h-px w-full bg-gray-100" />
                  </div>

                  {questionsByPage[pageNum].map((q, idx) => {
                    const typedQ = q as any;
                    const response = responses[typedQ.id];
                    const feedback = validationFeedback[typedQ.id];
                    
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
                      <React.Fragment key={typedQ.id}>
                        {typedQ.section && (idx === 0 || (idx > 0 && questionsByPage[pageNum][idx-1].section !== typedQ.section)) && (
                          <div className="pt-10 pb-4 space-y-4">
                            <div className="flex items-center gap-4">
                              <span className="bg-gray-900 text-white text-[10px] font-black uppercase tracking-[0.2em] px-5 py-2.5 rounded-2xl shadow-xl shadow-gray-200">
                                {typedQ.section}
                              </span>
                              <div className="h-px flex-1 bg-gray-100" />
                            </div>
                            {typedQ.instruction && (
                              <motion.div 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-emerald-50/30 p-6 rounded-[2rem] border-2 border-emerald-100/30 border-dashed"
                              >
                                <p className="text-xs font-bold text-emerald-800/80 leading-relaxed uppercase tracking-wider">
                                  {typedQ.instruction}
                                </p>
                              </motion.div>
                            )}
                          </div>
                        )}
                        <motion.div 
                          id={`q-container-${typedQ.id}`}
                          initial={{ opacity: 0, scale: 0.95 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          className={`rounded-[3rem] transition-all duration-500 relative group overflow-hidden flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:shadow-xl hover:-translate-y-1 ${
                            isProcessing ? 'ring-8 ring-emerald-500/10' : ''
                          }`}
                        >
                          <div className={`px-6 py-4 sm:px-8 sm:py-5 ${task.type === 'test' ? 'bg-red-600' : 'bg-emerald-600'}`}>
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center justify-between">
                                <div className={`inline-flex items-center px-3 py-1 rounded-[0.8rem] font-black text-[10px] uppercase tracking-widest shadow-sm bg-white/20 text-white border border-white/30 backdrop-blur-sm`}>
                                  Question {idx + 1}
                                </div>
                                {response && !feedback && <div className="w-5 h-5 bg-white text-emerald-500 rounded-full flex items-center justify-center shadow-lg"><CheckCircle2 size={12} className="stroke-[3]" /></div>}
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
                            <div className="relative z-10">
                            {typedQ.type === 'mcq' && (
                              <div className="grid gap-4">
                                {typedQ.options?.map((opt: string, oIdx: number) => (
                                  <button
                                    key={oIdx}
                                    onClick={() => !(readOnly || submitted) && handleResponse(typedQ.id, opt)}
                                    disabled={readOnly || submitted}
                                    className={`w-full text-left p-6 rounded-2xl border-2 font-helvetica font-black text-sm transition-all flex items-center justify-between group/btn ${
                                      responses[typedQ.id] === opt
                                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-2xl shadow-emerald-200'
                                        : 'bg-white border-gray-100 text-gray-600 hover:border-emerald-300 hover:bg-emerald-50/50'
                                    } ${(readOnly || submitted) && responses[typedQ.id] !== opt ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  >
                                    <span>{opt}</span>
                                    <div className={`p-1 rounded-full transition-all ${responses[typedQ.id] === opt ? 'bg-white text-emerald-500' : 'bg-gray-100 text-gray-300 opacity-0 group-hover/btn:opacity-100'}`}>
                                       <CheckCircle2 size={16} />
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}

                            {typedQ.type === 'tick-cross' && (
                              <div className="grid grid-cols-2 gap-6">
                                {[ {label: '✓', value: 'TRUE'}, {label: '✕', value: 'FALSE'} ].map((opt) => (
                                  <button
                                    key={opt.value}
                                    onClick={() => !(readOnly || submitted) && handleResponse(typedQ.id, opt.value)}
                                    disabled={readOnly || submitted}
                                    className={`p-10 rounded-[2.5rem] border-4 font-helvetica font-black text-4xl transition-all shadow-xl group/btn overflow-hidden relative ${
                                      responses[typedQ.id] === opt.value
                                        ? opt.value === 'TRUE' ? 'bg-emerald-500 border-emerald-600 text-white shadow-emerald-200' : 'bg-red-500 border-red-600 text-white shadow-red-200'
                                        : 'bg-white border-gray-100 text-gray-200 hover:border-emerald-300 hover:text-emerald-500'
                                    }`}
                                  >
                                    <span className="relative z-10">{opt.label}</span>
                                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                  </button>
                                ))}
                              </div>
                            )}

                            {typedQ.type === 'reorder' && typedQ.items && (
                              <div className="space-y-4">
                                {(responses[typedQ.id] || typedQ.items).map((item: string, iIdx: number) => (
                                  <motion.div
                                    key={`${typedQ.id}_item_${iIdx}`}
                                    layout
                                    className="flex items-center gap-5 bg-white p-5 rounded-2xl border-2 border-gray-100 shadow-sm group/item hover:border-emerald-200 transition-colors"
                                  >
                                    <span className="bg-gray-900 text-white w-8 h-8 rounded-xl flex items-center justify-center font-black text-[10px] shrink-0 group-hover/item:scale-110 transition-transform">
                                      {iIdx + 1}
                                    </span>
                                    <span className="flex-1 font-helvetica font-bold text-gray-700 text-sm tracking-tight">{item}</span>
                                    {!(readOnly || submitted) && (
                                      <div className="flex gap-1.5">
                                        <button
                                          onClick={() => {
                                            const currentArr = [...(responses[typedQ.id] || typedQ.items)];
                                            if (iIdx > 0) {
                                              [currentArr[iIdx], currentArr[iIdx-1]] = [currentArr[iIdx-1], currentArr[iIdx]];
                                              handleResponse(typedQ.id, currentArr);
                                            }
                                          }}
                                          className="p-2 hover:bg-emerald-500 hover:text-white rounded-xl text-gray-300 transition-all active:scale-95"
                                        >
                                          <ChevronLeft size={18} className="rotate-90" />
                                        </button>
                                        <button
                                          onClick={() => {
                                            const currentArr = [...(responses[typedQ.id] || typedQ.items)];
                                            if (iIdx < currentArr.length - 1) {
                                              [currentArr[iIdx], currentArr[iIdx+1]] = [currentArr[iIdx+1], currentArr[iIdx]];
                                              handleResponse(typedQ.id, currentArr);
                                            }
                                          }}
                                          className="p-2 hover:bg-emerald-500 hover:text-white rounded-xl text-gray-300 transition-all active:scale-95"
                                        >
                                          <ChevronLeft size={18} className="-rotate-90" />
                                        </button>
                                      </div>
                                    )}
                                  </motion.div>
                                ))}
                              </div>
                            )}

                            {typedQ.type === 'short-response' && (
                              <div className="relative">
                                <textarea
                                  placeholder="Formulate your response here..."
                                  value={responses[typedQ.id] || ''}
                                  readOnly={readOnly || submitted}
                                  onChange={(e) => handleResponse(typedQ.id, e.target.value)}
                                  className={`w-full p-8 rounded-[2rem] border-2 font-helvetica font-bold text-sm text-gray-800 focus:border-emerald-500 focus:bg-white outline-none transition-all resize-none min-h-[180px] shadow-sm tracking-tight leading-relaxed ${readOnly || submitted ? 'bg-gray-50 border-gray-100 shadow-none' : 'bg-gray-50/50 border-gray-100'} placeholder:text-gray-300`}
                                />
                                <div className="absolute bottom-6 right-6 px-3 py-1 bg-gray-900/5 rounded-lg">
                                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{responses[typedQ.id]?.length || 0} chars</span>
                                </div>
                              </div>
                            )}

                            {typedQ.type === 'table' && typedQ.tableData && (
                              <div className="overflow-hidden rounded-[2rem] border-2 border-emerald-100 bg-white shadow-xl shadow-emerald-50/30">
                                <table className="w-full border-collapse">
                                  <thead>
                                    <tr className="bg-gray-900">
                                      {typedQ.tableData[0].map((header: string, hIdx: number) => (
                                        <th key={hIdx} className="p-5 text-[10px] font-black text-white uppercase tracking-[0.2em] border-b-2 border-white/10 border-r border-white/5 last:border-r-0">
                                          {header}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {typedQ.tableData.slice(1).map((row: string[], rIdx: number) => (
                                      <tr key={rIdx} className="last:border-b-0 border-b border-gray-50 group/tr">
                                        {row.map((cell: string, cIdx: number) => {
                                          const isEditableCell = cell === "";
                                          return (
                                            <td key={cIdx} className={`p-0 border-r border-gray-50 last:border-r-0 ${!isEditableCell ? 'bg-gray-50/30' : 'bg-white'}`}>
                                              {!isEditableCell ? (
                                                <div className="p-5 text-xs font-helvetica font-black text-gray-900 opacity-60 uppercase tracking-tight">{cell}</div>
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
                                                  className={`w-full h-full p-5 text-sm font-helvetica font-black text-emerald-600 outline-none focus:bg-emerald-50 group-hover/tr:bg-gray-50/20 transition-colors placeholder:text-gray-200 ${readOnly || submitted ? 'bg-gray-50' : ''}`}
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

                            {/* Question Feedback Overlay (Bento Style) */}
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
                                <p className="text-sm font-helvetica font-black leading-relaxed whitespace-pre-wrap relative z-10">
                                  {validationFeedback[typedQ.id].feedback}
                                </p>
                              </motion.div>
                            )}
                          </div>
                          </div>
                        </motion.div>
                      </React.Fragment>
                    );
                  })}
                </div>
              );
            })}

            {task.worksheetQuestions && task.worksheetQuestions.length === 0 && (
              <div className="py-32 text-center space-y-8 bg-gray-50 rounded-[3rem] border-2 border-dotted border-gray-200">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-gray-200 mx-auto shadow-sm">
                  <Layout size={40} />
                </div>
                <div className="space-y-2">
                  <p className="text-gray-900 font-black text-lg uppercase tracking-tight">Structured View Disabled</p>
                  <p className="text-gray-400 font-bold text-sm">No interactive worksheet questions are defined for this asset.</p>
                </div>
              </div>
            )}

            {generalFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-900 border-2 border-gray-800 rounded-[3rem] p-12 space-y-8 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] -mr-32 -mt-32" />
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="bg-emerald-500 text-white p-3 rounded-2xl shadow-xl shadow-emerald-500/20">
                      <Send size={24} />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-white uppercase tracking-tight">Overall Comments</h4>
                    </div>
                  </div>
                  {readOnly && (
                    <div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-4 backdrop-blur-md">
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Aggregate</span>
                       <span className="text-2xl font-black text-emerald-400 tracking-tighter">
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
              <div className="sticky top-0 z-30 p-8 pb-6 space-y-8 bg-gray-200/80 backdrop-blur-md border-b border-gray-200/30 shadow-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-1 bg-emerald-500 rounded-full" />
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">Protocol Alpha</span>
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter leading-none">Grading Engine</h3>
                  <div className="flex items-center gap-2 pt-2">
                    <span className="bg-gray-900 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">Gemini 3.1 Flash Lite</span>
                  </div>
                </div>

                {/* Bento-style Progress Card */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 space-y-6">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Operational Status</span>
                      <span className="text-sm font-black text-emerald-600 uppercase">
                        {gradingPhase === 'extracting_rubrics' ? 'Pre-processing Rubrics' : 
                         gradingPhase === 'grading' ? `Live Analysis` :
                         gradingPhase === 'generating_overall' ? 'Compiling Data' : 'Engine Ready'}
                      </span>
                    </div>
                    <span className="text-3xl font-black text-gray-900 tracking-tighter">{Math.round(gradingProgress)}%</span>
                  </div>
                  <div className="h-4 bg-gray-100 rounded-2xl overflow-hidden p-1 border border-gray-200">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${gradingProgress}%` }}
                      className="h-full bg-emerald-500 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                    />
                  </div>
                </div>
              </div>
              
              <div ref={gradingConsoleContentRef} className="p-8 pt-4 space-y-4">
                {(task.worksheetQuestions || []).map((q, idx) => (
                   <motion.div 
                     key={q.id} 
                     id={`rubric-container-${q.id}`}
                     className={`p-6 rounded-[2rem] border-2 transition-all duration-500 scroll-mt-24 ${
                       currentlyProcessingId === q.id 
                         ? 'bg-white border-emerald-500 shadow-2xl scale-[1.02] ring-8 ring-emerald-500/5' 
                         : 'bg-white border-gray-100 shadow-sm opacity-60'
                     }`}
                   >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center font-black text-xs">
                            Q{idx + 1}
                          </span>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Marking Criteria</span>
                        </div>
                        {currentlyProcessingId === q.id && (
                           <div className="px-3 py-1 bg-emerald-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest animate-pulse">
                              Processing
                           </div>
                        )}
                      </div>
                      
                      <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                         <p className="text-xs font-bold text-gray-700 leading-relaxed italic">
                            {extractedRubrics[q.id] ? (extractedRubrics[q.id]) : "Initializing criteria..."}
                         </p>
                      </div>
                   </motion.div>
                 ))}
                 
                 {generalFeedback && (
                   <div className="p-8 rounded-[2rem] bg-gray-900 border border-gray-800 shadow-2xl space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500 rounded-lg text-white">
                           <Send size={16} />
                        </div>
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Overall Analysis</span>
                      </div>
                      <p className="text-sm font-bold text-gray-400 leading-relaxed italic">"{generalFeedback}"</p>
                   </div>
                 )}
              </div>
            </div>

            <div className="p-8 pt-0 border-t border-gray-100 bg-gray-50/80 backdrop-blur-md">
              {/* Grading Console Logs */}
              {gradingLogs.length > 0 && (
                <div 
                  onDoubleClick={() => setIsGradingConsoleExpanded(!isGradingConsoleExpanded)}
                  className={`my-6 bg-slate-900 rounded-[2rem] p-6 shadow-2xl border border-slate-800 flex flex-col transition-all duration-300 shrink-0 overflow-hidden ${
                    isGradingConsoleExpanded ? 'h-[300px]' : 'h-[180px]'
                  } ${isGradingConsoleExpanded ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                  title="Double click to expand console"
                >
                  <div className="flex items-center gap-3 mb-3 pb-3 border-b border-white/5">
                    <Terminal size={12} className="text-emerald-400" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Output Stream</span>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar font-mono text-[9px] leading-relaxed space-y-2 scroll-smooth">
                    {gradingLogs.map((log, i) => (
                      <div key={i} className="flex gap-3 text-slate-400">
                        <span className="text-slate-700 shrink-0">[{i+1}]</span>
                        <span className={`${log.includes('FAILED') || log.includes('CRITICAL') ? 'text-red-400' : log.includes('successfully') ? 'text-emerald-400' : ''}`}>
                          {log}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {gradingPhase === 'ready_to_grade' ? (
                <button onClick={gradeAgainstRubric} className="w-full bg-emerald-500 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-[0_6px_0_0_#059669] active:shadow-none active:translate-y-1.5 transition-all">
                  Initialize Grading Workflow
                </button>
              ) : gradingPhase === 'grading' ? (
                <button disabled className="w-full bg-emerald-400 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3">
                  <RefreshCw size={18} className="animate-spin" /> 
                  {currentlyProcessingIndex !== null ? `Processing Question ${currentlyProcessingIndex}` : 'Validating Output'}
                </button>
              ) : gradingPhase === 'generating_overall' ? (
                <button disabled className="w-full bg-emerald-400 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3">
                  <RefreshCw size={18} className="animate-spin" /> final_synthesis.sh
                </button>
              ) : gradingPhase === 'done' ? (
                <button disabled className="w-full bg-gray-800 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3">
                  <CheckCircle2 size={18} className="text-emerald-400" /> Data Compilation Complete
                </button>
              ) : gradingPhase === 'extracting_rubrics' ? (
                <button disabled className="w-full bg-emerald-400 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3">
                  <RefreshCw size={18} className="animate-spin" /> rubric_extraction.py
                </button>
              ) : null}
            </div>
          </div>
        )}
      </main>

      <AnimatePresence>
        {gradingComplete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-emerald-600/98 backdrop-blur-2xl z-[400] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: "spring", damping: 15 }}
              className="bg-white rounded-[4rem] p-16 max-w-xl w-full shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] text-center space-y-10 relative overflow-hidden"
            >
              <button 
                onClick={() => setGradingComplete(false)}
                className="absolute top-8 right-8 p-3 hover:bg-gray-50 rounded-2xl transition-colors text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>

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
                  Grading <br/> Completed
                </motion.h3>
                <motion.p 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   transition={{ delay: 0.6 }}
                   className="text-gray-500 font-bold text-lg"
                >
                  The Large Language Model (LLM) Deployed has successfully evaluated all responses and generated a comprehensive feedback report.
                </motion.p>
              </div>

              <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.8 }}
                 className="pt-4"
              >
                <button
                  onClick={onBack}
                  className="group relative w-full overflow-hidden rounded-3xl bg-gray-900 p-6 flex items-center justify-center gap-4 transition-all hover:bg-black active:scale-95 shadow-xl shadow-gray-200"
                >
                  <div className="relative z-10 flex items-center gap-3">
                    <span className="text-xl font-black text-white uppercase tracking-widest">Proceed to Report Generation</span>
                    <ArrowRight className="text-emerald-400 group-hover:translate-x-2 transition-transform" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSketchpad && (
          <Sketchpad onClose={() => setShowSketchpad(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {submitted && !gradingComplete && (
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
