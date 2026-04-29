import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, CheckCircle2, ListChecks, Users, Clock, Plus, Trash2, Layout, Calendar as CalendarIcon, ChevronLeft, ChevronRight as ChevronRightIcon, Target, List, FileText, Eye, ArrowRight, User, Download, Info, Copy, Sparkles, ShieldCheck, Lock, Timer, Send, RefreshCw, X, Edit, Inbox, Link2, BarChart3 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, startOfDay } from 'date-fns';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { db } from '../../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

import { Task, TaskSubmission, Unit } from '../../types';
import { GoogleGenAI, Type } from "@google/genai";
import { GOLDEN_STANDARD_WORKSHEET, GOLDEN_STANDARD_TEST } from '../../constants/goldenStandard';
import Analytics from './Analytics';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

interface TasksViewProps {
  key?: string;
  showEasterNotice: boolean;
  setShowEasterNotice: (val: boolean) => void;
  easterNoticeAgreed: boolean;
  setEasterNoticeAgreed: (val: boolean) => void;
  proceedToEasterAssignment: () => void;
  isAdmin?: boolean;
  tasks: Task[];
  mySubmissions: TaskSubmission[];
  allSubmissions: TaskSubmission[];
  currentUser: any;
  units: Unit[];
  onCreateTask: (task: Partial<Task>) => void;
  onUpdateTask?: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onStartTask: (task: Task) => void;
  onViewSubmission?: (sub: TaskSubmission, task: Task) => void;
  onDeleteSubmission?: (id: string) => void;
  onWipeCleanSlate?: () => void;
}
const TasksView = ({ 
  showEasterNotice,
  setShowEasterNotice,
  easterNoticeAgreed,
  setEasterNoticeAgreed,
  proceedToEasterAssignment,
  isAdmin,
  tasks,
  mySubmissions,
  allSubmissions,
  currentUser,
  units,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onStartTask,
  onViewSubmission,
  onDeleteSubmission,
  onWipeCleanSlate
}: TasksViewProps) => {
  const [batchGradingTask, setBatchGradingTask] = React.useState<string | null>(null);
  const [viewingRubricTask, setViewingRubricTask] = React.useState<Task | null>(null);
  const [rubricData, setRubricData] = React.useState<any>(null);
  const [isLoadingRubric, setIsLoadingRubric] = React.useState(false);
  const [revealedKeys, setRevealedKeys] = React.useState<Set<string>>(new Set());

  const openRubricViewer = async (task: Task) => {
    setViewingRubricTask(task);
    setIsLoadingRubric(true);
    setRubricData(null);
    try {
      const docRef = doc(db, 'processedRubrics', task.id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setRubricData(docSnap.data());
      }
    } catch (e) {
      console.error("Error fetching rubric:", e);
    } finally {
      setIsLoadingRubric(false);
    }
  };

  const doBatchGrade = async (task: Task, submissions: TaskSubmission[]) => {
    setBatchGradingTask(task.id);
    const ungraded = submissions.filter(s => !s.feedback);
    
    for (let i = 0; i < ungraded.length; i++) {
      const sub = ungraded[i];
      try {
        console.log("Checking for cached rubrics in Firestore...");
        let cachedRubric = null;
        try {
          const docRef = doc(db, 'processedRubrics', task.id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            cachedRubric = docSnap.data().rubrics;
            console.log("Using cached rubrics for batch grading.");
          }
        } catch (err) {
          console.log("Cache check failed, using raw markscheme.");
        }

        const markscheme = cachedRubric ? JSON.stringify(cachedRubric) : (task.markschemeContent || "No markscheme provided.");
        const responses = sub.responses || {};
        
        const cleanQuestions = (task.worksheetQuestions || []).map((q: any) => {
          const newQ = { ...q };
          if (newQ.type === 'table' && newQ.tableData) {
            newQ.tableData = newQ.tableData.map((r: any) => Array.isArray(r) ? r : (r.row || r));
          }
          return newQ;
        });

        const formattedResponses = cleanQuestions.map((q: any) => {
          let req = responses[q.id];
          let textReq = req;
          if (typeof req === 'string' && req.trim() === '') textReq = "[NO RESPONSE PROVIDED]";
          else if (req === undefined || req === null) textReq = "[NO RESPONSE PROVIDED]";
          else if (Array.isArray(req) && req.length === 0) textReq = "[NO RESPONSE PROVIDED]";
          else if (typeof req === 'object' && !Array.isArray(req) && Object.keys(req).length === 0) textReq = "[NO RESPONSE PROVIDED]";
          else if (q.type === 'table' && q.tableData && typeof req === 'object') {
            const tableMap: Record<string, string> = {};
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
          return `Question ID "${q.id}": ${textReq}`;
        }).join('\n');

        const questionsJsonString = JSON.stringify(cleanQuestions, null, 2);

        const prompt = `Perform 1-to-1 check of student response against rubric for ALL questions.
shorthand logic:
- [NO RESPONSE PROVIDED]/empty -> "No response." + ref answer | 0 marks
- Incorrect -> "Incorrect." + ref answer + reason
- Correct -> "Correct." + reason
---
RUBRIC: ${markscheme}
RESPONSES: ${formattedResponses}
---
JSON OUTPUT: { "questions": [{ "id": "string", "score": "X of X", "feedback": "string" }], "generalFeedback": "string" }`;

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

        let cleanText = response.text.replace(/\x60\x60\x60json/gi, '').replace(/\x60\x60\x60/g, '').trim();
        const parsed = JSON.parse(cleanText);
        const rawFeedbackArray = Array.isArray(parsed.questions) ? parsed.questions : [];
        const generalResult = parsed.generalFeedback || "";
        
        const feedbackResult: Record<string, { score: string, feedback: string }> = {};
        task.worksheetQuestions?.forEach(q => {
          const targetId = q.id.trim();
          const targetIdLower = targetId.toLowerCase();
          
          let aiFeedback = rawFeedbackArray.find(f => {
            if (!f.id) return false;
            const fIdOrig = String(f.id).trim();
            const fIdLower = fIdOrig.toLowerCase();
            return fIdLower === targetIdLower || fIdOrig === targetId || fIdOrig.includes(targetId) || targetId.includes(fIdOrig);
          });
          
          if (!aiFeedback) aiFeedback = { score: "0 of 1", feedback: "Could not evaluate response against markscheme." };
          feedbackResult[targetId] = { 
            score: String(aiFeedback.score), 
            feedback: String(aiFeedback.feedback)
              .replace(/\*\*/g, '')
              .replace(/Student Response: /gi, '')
              .replace(/Correct Response: /gi, '')
          };
        });

        let earned = 0; let total = 0;
        Object.values(feedbackResult).forEach(f => {
          const match = String(f.score).match(/(\d+(?:\.\d+)?)\s*(?:\/|of)\s*(\d+(?:\.\d+)?)/);
          if (match) { earned += parseFloat(match[1]); total += parseFloat(match[2]); }
        });
        
        const results = {
          score: earned,
          total: total || task.worksheetQuestions?.length || 0,
          feedback: feedbackResult,
          generalFeedback: generalResult,
          cheatLogs: sub.results?.cheatLogs,
        };
        
        // update sub locally and in db:
        const payload = { ...sub, feedback: "Graded", completedAt: sub.completedAt || new Date().toISOString(), results };
        
        if (typeof onUpdateTask === 'undefined') {
          // fallback update db doc directly? Actually, wait, TaskWorksheet uses onComplete which bubbles up.
        }
        
        // Let's just update the submission document.
        try {
           const subRef = doc(db, 'submissions', sub.id);
           await setDoc(subRef, payload, { merge: true });
        } catch(e) {
           console.error("Firebase update failed", e);
        }
        // mutate state if possible
        sub.feedback = "Graded";
        sub.results = results;
        
      } catch (err) {
        console.error("Batch grading failed for ", sub.id, err);
      }
    }
    
    setBatchGradingTask(null);
    alert('Batch grading complete for: ' + task.title);
  };

  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [isCreatorOpen, setIsCreatorOpen] = React.useState(false);
  const [isTestCreatorOpen, setIsTestCreatorOpen] = React.useState(false);
  const [isPasscodeModalOpen, setIsPasscodeModalOpen] = React.useState(false);
  const [selectedTaskForPasscode, setSelectedTaskForPasscode] = React.useState<Task | null>(null);
  const [enteredPasscode, setEnteredPasscode] = React.useState('');
  const [passcodeError, setPasscodeError] = React.useState(false);
  const [showPasscode, setShowPasscode] = React.useState(false);

  const [activeTab, setActiveTab] = React.useState<'tasks' | 'submissions' | 'analytics' | 'reports' | 'downloads'>(isAdmin ? 'analytics' : 'tasks');
  const [submissionFilter, setSubmissionFilter] = React.useState('');
  const [nukeLevel, setNukeLevel] = React.useState(0);
  const [showAnalyticsMap, setShowAnalyticsMap] = React.useState<Record<string, boolean>>({});
  const [chartModeMap, setChartModeMap] = React.useState<Record<string, 'distribution'|'students'>>({});
  const [cardAspectMap, setCardAspectMap] = React.useState<Record<string, 'default'|'tall'>>({});
  const [globalCardAspect, setGlobalCardAspect] = React.useState<'default'|'tall'>('default');

  const [worksheetQuestionsJson, setWorksheetQuestionsJson] = React.useState('');
  const [markschemeContent, setMarkschemeContent] = React.useState('');
  const [showQuestionsPrompt, setShowQuestionsPrompt] = React.useState(false);
  const [showMarkschemePrompt, setShowMarkschemePrompt] = React.useState(false);

  const [editingTask, setEditingTask] = React.useState<Task | null>(null);

  const [seedingStatus, setSeedingStatus] = React.useState<'idle' | 'seeding' | 'success'>('idle');

  const handleCopyGemInstructions = () => {
    const prompt = `you are a professional worksheet and test question JSON parser and markscheme analyzer

user will provide a PDF e.g. gs.pdf, which may be a notes, a test, a worksheet or equivalent.

PROMPT USER IF ONLY PDF IS PROVIDED for type of questions the test/worksheet required and their the type of output required:

Type of questions: MCQ, SHORT-RESPONSE, TICK-CROSS, TABLE, REORDER and FILE-UPLOAD type questions (user can choose 1 or multiple or all)
Type of output: question JSON only (qp), markscheme JSON only (ms) or both (both)

THE first part of "id" text string before the "_" string of the question and markscheme are randomly generated or there will be a data clash with database e.g. in "gs_q1", "gs" needs to changed to randomized letters. but that string needs to be consistent within a SINGLE JSON and between a pair of question JSON and markscheme JSON

For QUESTIONS (qp)
if it is not already a question set, parse the information from the PDF into questions of the following possible question types: MC, short response, reorder, tick-cross, fill in the blank(s) in a table, file-upload. OUTPUT RAW JSON output
if it is already a question set, parse the questions following the following example strictly. OUTPUT RAW JSON only
FOR "TABLE" type questions involving tables, each row of the table CANNOT have more than 1 blank that requires student input. also, there cannot be OTHER TEXTS in cells that requires user input


For MARKSCHEME (ms): Generate a markscheme JSON as rubric for the provided questions. It should contain detailed criteria for each question to guide the grading process. OUTPUT RAW JSON only


Sample PERFECT QUESTION JSON for MCQ, SHORT-RESPONSE, TICK-CROSS, TABLE, REORDER and FILE-UPLOAD type questions: (note that for table type questions, "" marks cells where student input is required and "x" that contains the text string x are cells that do not require student input as they are populated)

the "page": X tag means that question is found on page X on the PDF provided by the user. if the user did not provide a PDF, ignore and do not include this tag.

Also, DO NOT INCLUDE question number in the "question" tag in JSON when generating question JSON

[
  {
    "id": "gs_q1",
    "type": "mcq",
    "question": "Which of the following is a primary color in the additive color model (RGB)?",
    "options": [
      "Yellow",
      "Green",
      "Orange",
      "Purple"
    ],
    "page": 1
  },
  {
    "id": "gs_q2",
    "type": "short-response",
    "question": "Explain why the sky appears blue during a clear day. Use valid scientific terminology.",
    "page": 1
  },
  {
    "id": "gs_q3",
    "type": "table",
    "question": "Complete the following table tracking square roots of perfect squares.",
    "tableData": [
      [
        "Number (x)",
        "Square Root (√x)"
      ],
      [
        "4",
        ""
      ],
      [
        "9",
        "3"
      ],
      [
        "16",
        ""
      ]
    ],
    "page": 1
  },
  {
    "id": "gs_q4",
    "type": "tick-cross",
    "question": "The Sun is classified as a planet in our solar system.",
    "page": 1
  },
  {
    "id": "gs_q5",
    "type": "reorder",
    "question": "Order these historical events chronologically from EARLIEST to LATEST.",
    "items": [
      "Apollo 11 Moon Landing (1969)",
      "World War II Ends (1945)",
      "World War I Begins (1914)",
      "The Great Depression (1929)"
    ],
    "page": 1
  },
  {
    "id": "gs_q6",
    "type": "mcq",
    "question": "Which organelle is primarily responsible for ATP production in eukaryotic cells?",
    "options": [
      "Nucleus",
      "Ribosome",
      "Mitochondria",
      "Golgi Apparatus"
    ],
    "page": 1
  },
  {
    "id": "gs_q7",
    "type": "file-upload",
    "question": "Please upload a photo of your handwritten calculation.",
    "page": 1
  }
]

Sample PERFECT Markscheme JSON for MCQ, SHORT-RESPONSE, TICK-CROSS, TABLE, REORDER and FILE-UPLOAD type questions (refer to keys allowed for what keys are allowed, DO NOT INCLUDE ANY OTHER RANDOM TYPES OF KEYS!!!)

[
  {
    "id": "gs_q1",
    "type": "mcq",
    "question": "Which of the following is a primary color in the additive color model (RGB)?",
    "data": ["Yellow", "Green", "Orange", "Purple"],
    "correct_answer": "Green",
    "explanation": "In the RGB (additive) model, the primary colors are Red, Green, and Blue.",
    "page": 1
  },
  {
    "id": "gs_q2",
    "type": "short-response",
    "question": "Explain why the sky appears blue during a clear day. Use valid scientific terminology.",
    "correct_answer": "Rayleigh scattering",
    "rubric": "Score 1.0 if the student mentions 'Rayleigh scattering'. Score 0.5 if they describe shorter wavelengths (blue) being scattered more than longer wavelengths (red) without using the specific term.",
    "explanation": "Blue light has shorter wavelengths and is scattered more efficiently by atmospheric gases.",
    "page": 1
  },
  {
    "id": "gs_q3",
    "type": "table",
    "question": "Complete the following table tracking square roots of perfect squares.",
    "data": [
      ["Number (x)", "Square Root (√x)"],
      ["4", ""],
      ["9", "3"],
      ["16", ""]
    ],
    "correct_answer": [["4", "2"], ["16", "4"]],
    "explanation": "The square root of 4 is 2, and the square root of 16 is 4.",
    "page": 1
  },
  {
    "id": "gs_q4",
    "type": "tick-cross",
    "question": "The Sun is classified as a planet in our solar system.",
    "correct_answer": false,
    "explanation": "The Sun is a G-type main-sequence star, not a planet.",
    "page": 1
  },
  {
    "id": "gs_q5",
    "type": "reorder",
    "question": "Order these historical events chronologically from EARLIEST to LATEST.",
    "data": [
      "Apollo 11 Moon Landing (1969)",
      "World War II Ends (1945)",
      "World War I Begins (1914)",
      "The Great Depression (1929)"
    ],
    "correct_answer": [
      "World War I Begins (1914)",
      "The Great Depression (1929)",
      "World War II Ends (1945)",
      "Apollo 11 Moon Landing (1969)"
    ],
    "explanation": "Events follow the timeline of 1914, 1929, 1945, and 1969.",
    "page": 1
  },
  {
    "id": "gs_q6",
    "type": "mcq",
    "question": "Which organelle is primarily responsible for ATP production in eukaryotic cells?",
    "data": ["Nucleus", "Ribosome", "Mitochondria", "Golgi Apparatus"],
    "correct_answer": "Mitochondria",
    "explanation": "Mitochondria are the 'powerhouses' of the cell where ATP is generated through cellular respiration.",
    "page": 1
  },
  {
    "id": "gs_q7",
    "type": "file-upload",
    "question": "Please upload a photo of your handwritten calculation.",
    "rubric": "Score 1.0 if the calculation is fully correct. Score 0.5 if there's a minor arithmetic error but the method is correct. Score 0 if the method is incorrect.",
    "explanation": "Ensure all steps are shown.",
    "page": 1
  }
]`;
    navigator.clipboard.writeText(prompt);
    alert("GEM Instructions copied to clipboard!");
  };

  const seedGoldenStandardTasks = async () => {
    setSeedingStatus('seeding');
    try {
      const ts = Date.now();
      await onCreateTask({ ...GOLDEN_STANDARD_WORKSHEET, id: `gs_worksheet_${ts}` });
      await onCreateTask({ ...GOLDEN_STANDARD_TEST, id: `gs_test_${ts}` });
      setSeedingStatus('success');
      setTimeout(() => setSeedingStatus('idle'), 3000);
    } catch (error) {
      console.error("Manual seeding failed:", error);
      setSeedingStatus('idle');
    }
  };

  const [newTask, setNewTask] = React.useState<Partial<Task>>({
    title: '',
    description: '',
    units: [1],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'active',
    type: 'standard',
    passcode: '',
    timeLimit: 60,
    isABVersion: false
  });

  const [isEditingPasscode, setIsEditingPasscode] = React.useState(false);
  const [editedPasscodeValue, setEditedPasscodeValue] = React.useState('');
  const [editedTestTitle, setEditedTestTitle] = React.useState('');
  const [isEditingTestTitle, setIsEditingTestTitle] = React.useState(false);
  const [editedTestDate, setEditedTestDate] = React.useState('');
  const [isEditingTestDate, setIsEditingTestDate] = React.useState(false);
  const [isEditingPdfUrl, setIsEditingPdfUrl] = React.useState(false);
  const [editedPdfUrl, setEditedPdfUrl] = React.useState('');
  const [editingTaskQuestionsJson, setEditingTaskQuestionsJson] = React.useState('');
  const [editingTaskMarkscheme, setEditingTaskMarkscheme] = React.useState('');

  const submissionsByTask = React.useMemo(() => {
    const grouped: Record<string, TaskSubmission[]> = {};
    allSubmissions.forEach(sub => {
      if (!grouped[sub.taskId]) grouped[sub.taskId] = [];
      grouped[sub.taskId].push(sub);
    });
    return grouped;
  }, [allSubmissions]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse Questions JSON if provided
    let parsedQuestions = undefined;
    let finalMarkscheme = markschemeContent.trim() || undefined;

    if (worksheetQuestionsJson.trim()) {
      try {
        parsedQuestions = JSON.parse(worksheetQuestionsJson);
        // Fix Firebase nested array limitation: convert tableData arrays-of-arrays to array-of-objects
        if (Array.isArray(parsedQuestions)) {
          const existingIds = new Set<string>();
          tasks.forEach(t => {
            t.worksheetQuestions?.forEach(q => existingIds.add(q.id.trim()));
          });

          // Track replacements to also update the markscheme JSON/text globally
          const idReplacements: Record<string, string> = {};

          parsedQuestions.forEach((q: any) => {
            if (q.tableData && Array.isArray(q.tableData[0])) {
              q.tableData = q.tableData.map((row: any) => ({ row }));
            }
            if (q.id && existingIds.has(q.id.trim())) {
              const oldId = q.id.trim();
              const newId = `q_${Math.random().toString(36).substring(2,8)}_${oldId}`;
              q.id = newId;
              idReplacements[oldId] = newId;
            }
          });

          // If we had conflicts and we have a markscheme, try to replace the old IDs with the new ones globally.
          // This ensures that if the markscheme references "oldId", it will now reference "newId".
          if (Object.keys(idReplacements).length > 0 && finalMarkscheme) {
            for (const [oldId, newId] of Object.entries(idReplacements)) {
              // Replace all occurrences of oldId string literal, e.g. "q1" in JSON
              // We use a global regex that matches the exact string or key.
              finalMarkscheme = finalMarkscheme.replace(new RegExp(`"${oldId}"`, 'g'), `"${newId}"`);
              finalMarkscheme = finalMarkscheme.replace(new RegExp(`'${oldId}'`, 'g'), `'${newId}'`);
              finalMarkscheme = finalMarkscheme.replace(new RegExp(`\\b${oldId}\\b`, 'g'), newId);
            }
          }
        }
      } catch (err) {
        alert("Invalid JSON in Worksheet Questions. Please check your formatting.");
        return;
      }
    }

    const taskToCreate = {
      ...newTask,
      type: newTask.type === 'test' ? 'test' : ((newTask.pdfUrl || parsedQuestions) ? ('worksheet' as const) : undefined),
      worksheetQuestions: parsedQuestions,
      markschemeContent: finalMarkscheme
    };

    await onCreateTask(taskToCreate);
    
    // Save Markscheme to Firestore
    if (finalMarkscheme && taskToCreate.title) {
      try {
        const taskKey = taskToCreate.title.replace('y8 ', '');
        await setDoc(doc(db, 'markschemes', taskKey), { content: finalMarkscheme });
      } catch (err) {
        console.error("Failed to save markscheme:", err);
      }
    }

    setIsCreatorOpen(false);
    setIsTestCreatorOpen(false);
    setNewTask({
      title: '',
      description: '',
      units: [1],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active',
      type: 'standard',
      passcode: '',
      timeLimit: 60,
      isABVersion: false
    });
    setWorksheetQuestionsJson('');
    setMarkschemeContent('');
  };

  const generateResponsePDF = async (submission: TaskSubmission, task: Task, includeFeedback: boolean = false, returnBlob: boolean = false) => {
    const doc = new jsPDF();
    const isTest = task.type === 'test';
    const primaryColor: [number, number, number] = isTest ? [220, 38, 38] : (includeFeedback ? [16, 185, 129] : [59, 130, 246]); 
    
    // Top Color Bar (High-contrast aesthetic)
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 8, 'F');
    
    let currentY = 22;

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(31, 41, 55);
    const headerTitle = includeFeedback 
      ? (isTest ? "Secure Assessment Analysis" : "Performance Analysis Report")
      : (isTest ? "Assessment Submission Export" : "Submission Export");
    doc.text(headerTitle, 15, currentY);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(156, 163, 175);
    doc.text(`Generated on ${format(new Date(), 'PPP p')}`, 15, currentY + 6);
    
    currentY += 15;

    // Teacher's General Feedback at the START (if report)
    if (includeFeedback && submission.feedback) {
      const feedbackText = submission.generalFeedback || "Comprehensive review of accuracy, reasoning, and conceptual understanding demonstrated in this evaluation.";
      const splitFeedback = doc.splitTextToSize(feedbackText, 170);
      const textHeight = splitFeedback.length * 5;
      const boxHeight = 15 + textHeight + 5;

      doc.setFillColor(isTest ? 254 : 240, isTest ? 242 : 253, isTest ? 242 : 244); 
      doc.rect(15, currentY, 180, boxHeight, 'F');
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("Teacher's General Feedback", 20, currentY + 10);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(55, 65, 81);
      doc.text(splitFeedback, 20, currentY + 18);
      
      currentY += boxHeight + 10;
    }

    // Punctuality Logic
    const completedAt = new Date(submission.completedAt);
    const dueDateStr = task.dueDate.includes('T') ? task.dueDate : `${task.dueDate}T23:59:59`;
    const dueDate = new Date(dueDateStr);
    
    let punctuality = "ON-TIME";
    if (completedAt > dueDate) {
      punctuality = "LATE";
    } else if (dueDate.getTime() - completedAt.getTime() > 24 * 60 * 60 * 1000) {
      punctuality = "EARLY";
    }

    // Student & Task Info Box
    const securityMap: Record<string, string> = {
      tabSwitches: "Tab switching/opening",
      blur: "Window focus lost",
      copyPaste: "CMD+C or V",
      shortcutAttempts: "Shortcut attempts (Inspect/Save)",
      printAttempts: "Print/Screenshot attempts"
    };

    const effectiveCheatLogs = submission.results?.cheatLogs;
    const effectiveTabSwitches = submission.results?.tabSwitches || 0;

    const securityValue = isTest 
      ? (effectiveCheatLogs 
          ? Object.entries(effectiveCheatLogs)
              .filter(([_, count]) => (count as number) > 0)
              .map(([key, count]) => `${securityMap[key] || key}: ${count}`)
              .join(', ') || 'NONE DETECTED'
          : `${effectiveTabSwitches} Tab Switches Detected`)
      : 'OFF';

    const drawBentoCard = (x: number, y: number, w: number, label: string, value: string, valueColor: [number, number, number] = [31, 41, 55], bgColor: [number, number, number] = [248, 250, 252]) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      const splitValue = doc.splitTextToSize(value, w - 10);
      const textHeight = splitValue.length * 4.5;
      const h = Math.max(18, 10 + textHeight + 2);
  
      doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
      doc.roundedRect(x, y, w, h, 3, 3, 'F');
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(156, 163, 175);
      doc.text(label.toUpperCase(), x + 5, y + 6);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(valueColor[0], valueColor[1], valueColor[2]);
      doc.text(splitValue, x + 5, y + 12);
      
      return h;
    };

    const cardWidth = 87.5;
    
    // Row 1
    const perfString = submission.results ? `${submission.results.score} of ${submission.results.total} (${Math.round((submission.results.score/submission.results.total)*100)}%)` : 'Awaiting Grading';
    const h1 = drawBentoCard(15, currentY, cardWidth, "Student Name", submission.studentName);
    const h2 = drawBentoCard(107.5, currentY, cardWidth, "Performance Metric", perfString, primaryColor, [248, 250, 252]);
    currentY += Math.max(h1, h2) + 5;

    // Row 2
    const h3 = drawBentoCard(15, currentY, cardWidth, isTest ? 'Assessment Title' : 'Assignment Title', task.title);
    const h4 = drawBentoCard(107.5, currentY, cardWidth, "Completion Time", format(new Date(submission.completedAt), 'PPP p'));
    currentY += Math.max(h3, h4) + 5;

    // Row 3
    let pColor: [number, number, number] = [31, 41, 55];
    if (punctuality === "EARLY") pColor = [16, 185, 129];
    if (punctuality === "LATE") pColor = [239, 68, 68];
    if (punctuality === "ON-TIME") pColor = [245, 158, 11];

    const isSecurityBad = isTest && securityValue !== 'NONE DETECTED';
    const sColor: [number, number, number] = isSecurityBad ? [220, 38, 38] : [31, 41, 55];

    const h5 = drawBentoCard(15, currentY, cardWidth, "Punctuality", punctuality, pColor);
    const h6 = drawBentoCard(107.5, currentY, cardWidth, "Security Violations", securityValue, sColor);
    currentY += Math.max(h5, h6) + 12;

    const base64Images: Record<number, string[]> = {};
    
    const tablePromises = (task.worksheetQuestions || []).map(async (q, idx) => {
      const qId = q.id.trim();
      let response = submission.responses?.[qId] || submission.responses?.[q.id];
      const feedback = submission.feedback?.[qId] || submission.feedback?.[q.id];
      
      let responseText = '';
      if (q.type === 'file-upload' && response && Array.isArray(response)) {
        responseText = '[Attached Files Rendered Below]';
        base64Images[idx] = [];
        for (const file of response) {
          if (file.url && (file.url.endsWith('.png') || file.url.endsWith('.jpg') || file.url.endsWith('.jpeg'))) {
            try {
              const res = await fetch(file.url);
              const blob = await res.blob();
              const reader = new FileReader();
              const b64 = await new Promise<string>((resolve) => {
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              });
              base64Images[idx].push(b64);
            } catch (err) {
              console.error("Failed to load image for PDF", err);
            }
          } else if (file.name) {
            responseText += `\n[File: ${file.name}]`;
          }
        }
      } else if (q.type === 'table' && response && typeof response === 'object') {
        responseText = Object.entries(response)
          .map(([key, val]) => `${key}: ${val}`)
          .join('\n');
      } else if (typeof response === 'object' && response !== null) {
        responseText = JSON.stringify(response);
      } else {
        responseText = response || '---';
      }
      
      const row = [
        idx + 1,
        (q as any).question || (q as any).text || '---',
        responseText
      ];

      if (includeFeedback) {
        let cellContent = '---';
        let fillColor: [number, number, number] = [254, 242, 242]; // Default red
        let textColor: [number, number, number] = [153, 27, 27];

        if (feedback) {
          cellContent = `[Points: ${feedback.score}]\n${feedback.feedback}`;
          const lowerFeedback = feedback.feedback.toLowerCase();
          if (lowerFeedback.startsWith('correct')) {
            fillColor = [220, 252, 231]; // Green
            textColor = [22, 101, 52];
          } else if (lowerFeedback.startsWith('partially')) {
            fillColor = [255, 237, 213]; // Orange
            textColor = [154, 52, 18];
          }
        }
        
        row.push(feedback ? {
          content: cellContent,
          styles: { fillColor, textColor }
        } : '---');
      }

      return row;
    });

    const tableData = await Promise.all(tablePromises);

    autoTable(doc, {
      startY: currentY,
      head: [includeFeedback ? ['#', 'Question Stem', 'Student Response', 'Targeted Feedback'] : ['#', 'Question Stem', 'Student Response']],
      body: tableData,
      theme: 'plain',
      headStyles: { 
        fillColor: [255, 255, 255], 
        textColor: [100, 116, 139],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'left'
      },
      styles: { 
        fontSize: 9, 
        cellPadding: 6, 
        overflow: 'linebreak',
        lineColor: [255, 255, 255], 
        lineWidth: 2,
        valign: 'middle'
      },
      columnStyles: includeFeedback ? {
        0: { cellWidth: 10, halign: 'center', fillColor: [248, 250, 252], textColor: [100, 116, 139] },
        1: { cellWidth: 50, fillColor: [248, 250, 252], textColor: [31, 41, 55], fontStyle: 'bold' },
        2: { cellWidth: 65, fillColor: [241, 245, 249], textColor: [30, 58, 138], fontStyle: 'normal' }, 
        3: { cellWidth: 65, fillColor: [254, 242, 242], textColor: [153, 27, 27], fontStyle: 'italic' } 
      } : {
        0: { cellWidth: 10, halign: 'center', fillColor: [248, 250, 252], textColor: [100, 116, 139] },
        1: { cellWidth: 80, fillColor: [248, 250, 252], textColor: [31, 41, 55], fontStyle: 'bold' },
        2: { cellWidth: 90, fillColor: [239, 246, 255], textColor: [30, 58, 138], fontStyle: 'normal' }
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 2) {
          const images = base64Images[data.row.index];
          if (images && images.length > 0) {
            let imagesHeight = 0;
            images.forEach(imgData => {
              try {
                const props = doc.getImageProperties(imgData);
                const ratio = props.height / props.width;
                // data.cell.width may not be finalized if dynamic, but columnStyles defines it.
                const cellW = includeFeedback ? 65 : 90;
                
                const maxW = Math.min(cellW - 10, 80);
                const maxH = 100; // Cap image height to prevent breaking pages
                let finalW = maxW;
                let finalH = finalW * ratio;
                if (finalH > maxH) {
                  finalH = maxH;
                  finalW = finalH / ratio;
                }
                
                imagesHeight += finalH + 5;
              } catch (e) {
                console.error("Failed to parse image props for height padding", e);
              }
            });
            // Use cell padding to expand cell naturally
            if (typeof data.cell.styles.cellPadding === 'number') {
              const p = data.cell.styles.cellPadding;
              data.cell.styles.cellPadding = { top: p, left: p, right: p, bottom: p + imagesHeight };
            } else {
              const p = data.cell.styles.cellPadding as any;
              data.cell.styles.cellPadding = { 
                top: p.top || 6, 
                left: p.left || 6, 
                right: p.right || 6, 
                bottom: (p.bottom || 6) + imagesHeight 
              };
            }
          }
        }
      },
      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 2) {
          const images = base64Images[data.row.index];
          if (images && images.length > 0) {
            let totalImagesHeight = 0;
            
            // First calculate total height needed exactly to position properly
            const parsedImages = images.map(imgData => {
              let finalW = 0, finalH = 0, ratio = 1;
              try {
                const props = doc.getImageProperties(imgData);
                ratio = props.height / props.width;
                const cellW = includeFeedback ? 65 : 90;
                
                const maxW = Math.min(cellW - 10, 80);
                const maxH = 100;
                finalW = maxW;
                finalH = finalW * ratio;
                if (finalH > maxH) {
                  finalH = maxH;
                  finalW = finalH / ratio;
                }
                totalImagesHeight += finalH + 5;
              } catch (e) {
                console.error("error parsing inside didDrawCell");
              }
              return { imgData, finalW, finalH };
            });

            // The image starts at the bottom padding area
            let yOffset = data.cell.y + data.cell.height - totalImagesHeight - 2; 

            parsedImages.forEach(({ imgData, finalW, finalH }) => {
              try {
                if (finalW > 0 && finalH > 0) {
                  // Extract format from base64 string
                  const format = imgData.substring("data:image/".length, imgData.indexOf(";base64")).toUpperCase();
                  
                  // Center the image horizontally within the cell
                  const xOffset = data.cell.x + (data.cell.width - finalW) / 2;
                  
                  doc.addImage(imgData, format === 'JPEG' ? 'JPEG' : 'PNG', xOffset, yOffset, finalW, finalH);
                  yOffset += finalH + 5;
                }
              } catch (e) {
                console.error("Failed to draw image to PDF", e);
              }
            });
          }
        }
      }
    });

    if (returnBlob) {
      return doc.output('blob');
    }
    doc.save(`${includeFeedback?'Report':'Raw_Submission'}_${submission.studentName.replace(/\\s+/g, '_')}_${task.title.substring(0,15).replace(/\\s+/g, '_')}.pdf`);
  };

  const downloadSubmissionAttachments = async (submission: TaskSubmission, task: Task) => {
    let JSZip;
    try {
      JSZip = (await import('jszip')).default;
    } catch (e) {
      alert("JSZip not available.");
      return;
    }
    const zip = new JSZip();
    let fileCount = 0;
    
    if (submission.responses) {
      for (const key of Object.keys(submission.responses)) {
        if (Array.isArray(submission.responses[key])) {
          for (const file of submission.responses[key]) {
            if (file && file.url && file.name) {
              try {
                const res = await fetch(file.url);
                const blob = await res.blob();
                zip.file(file.name, blob);
                fileCount++;
              } catch (e) {
                console.error("Failed to fetch file for zip", file.name, e);
              }
            }
          }
        }
      }
    }
    
    if (fileCount === 0) {
      alert("No files to download.");
      return;
    }
    
    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(content);
    link.download = `${submission.studentName || 'Student'}_${task.title}_Attachments.zip`;
    link.click();
  };

  const downloadReportAndTaskPdf = async (submission: TaskSubmission, task: Task) => {
    let JSZip;
    try {
      JSZip = (await import('jszip')).default;
    } catch (e) {
      alert("JSZip not available.");
      return;
    }
    const zip = new JSZip();
    let fileCount = 0;

    // 1. Generate Report PDF
    try {
      const reportBlob = await generateResponsePDF(submission, task, true, true);
      if (reportBlob) {
        zip.file(`Report_${submission.studentName.replace(/\\s+/g, '_')}_${task.title.substring(0, 15).replace(/\\s+/g, '_')}.pdf`, reportBlob);
        fileCount++;
      }
    } catch (e) {
      console.error("Failed to generate report PDF", e);
    }

    // 2. Fetch Task PDF
    // Usually pdfUrl inside task
    const taskPdfUrl = task.pdfUrl;
    if (taskPdfUrl) {
      try {
        const res = await fetch(taskPdfUrl);
        const taskBlob = await res.blob();
        zip.file(`Task_${task.title.substring(0, 15).replace(/\\s+/g, '_')}.pdf`, taskBlob);
        fileCount++;
      } catch (e) {
        console.error("Failed to fetch task PDF", e);
      }
    }

    if (fileCount === 0) {
      alert("No files could be gathered.");
      return;
    }

    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(content);
    link.download = `${submission.studentName || 'Student'}_${task.title}_Report_and_Files.zip`;
    link.click();
  };

  const [deleteConfirmation, setDeleteConfirmation] = React.useState<{ id: string, type: 'task' | 'submission', title: string } | null>(null);

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmation) return;
    
    if (deleteConfirmation.type === 'task') {
      await onDeleteTask(deleteConfirmation.id);
    } else {
      if (onDeleteSubmission) await onDeleteSubmission(deleteConfirmation.id);
    }
    
    setDeleteConfirmation(null);
  };

  return (
    <div className="flex flex-col flex-1 h-full max-w-7xl mx-auto w-full p-4 md:p-8 space-y-10 pb-32 mt-4 bg-slate-50/50 rounded-[3rem] border border-slate-100">
      <AnimatePresence>
        {deleteConfirmation && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmation(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl border-2 border-red-50"
            >
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-6 mx-auto">
                <Trash2 size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 text-center mb-2 uppercase tracking-tight">Confirm Deletion</h3>
              <p className="text-slate-500 text-center font-medium mb-8">
                Are you sure you want to permanently remove <span className="text-slate-900 font-bold">"{deleteConfirmation.title}"</span>? This action is irreversible.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setDeleteConfirmation(null)}
                  className="flex-1 py-4 rounded-xl font-black uppercase tracking-widest text-xs text-slate-400 bg-slate-50 hover:bg-slate-100 transition-all border-2 border-slate-100"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteConfirm}
                  className="flex-1 py-4 rounded-xl font-black uppercase tracking-widest text-xs text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {isAdmin ? (
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-900 px-8 py-5 rounded-[2.5rem] text-white shadow-[0_20px_50px_-10px_rgba(0,0,0,0.4)] relative overflow-hidden ring-1 ring-white/10">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] -mr-80 -mt-80" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] -ml-64 -mb-64" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <div className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase tracking-[0.2em] rounded-full border border-emerald-500/20 backdrop-blur-md">
                   Control Terminal 02
                </div>
                <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
              </div>
              <h1 className="text-4xl font-black tracking-tighter leading-none text-white whitespace-nowrap">
                Command <span className="text-emerald-400">Center</span>
              </h1>
            </div>
          </div>
          
          <div className="flex items-center relative z-10 shrink-0">
            <div className="bg-white/5 backdrop-blur-3xl p-1.5 rounded-[2rem] flex items-center border border-white/10 shadow-2xl shadow-black/20">
              <button 
                onClick={() => setActiveTab('analytics')}
                className={`px-6 py-3 rounded-[1.25rem] font-black uppercase tracking-widest transition-all duration-500 flex items-center gap-3 text-[9px] ${
                  activeTab === 'analytics' 
                    ? 'bg-white text-slate-900 shadow-xl scale-105' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <BarChart3 size={16} className={activeTab === 'analytics' ? 'text-indigo-500' : ''} />
                Analytics
              </button>
              <button 
                onClick={() => setActiveTab('tasks')}
                className={`px-6 py-3 rounded-[1.25rem] font-black uppercase tracking-widest transition-all duration-500 flex items-center gap-3 text-[9px] ${
                  activeTab === 'tasks' 
                    ? 'bg-white text-slate-900 shadow-xl scale-105' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <ListChecks size={16} className={activeTab === 'tasks' ? 'text-emerald-500' : ''} />
                Deploy
              </button>
              <button 
                onClick={() => setActiveTab('submissions')}
                className={`px-6 py-3 rounded-[1.25rem] font-black uppercase tracking-widest transition-all duration-500 flex items-center gap-3 text-[9px] ${
                  activeTab === 'submissions' 
                    ? 'bg-white text-slate-900 shadow-xl scale-105' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Users size={16} className={activeTab === 'submissions' ? 'text-blue-500' : ''} />
                Inbox
              </button>
            </div>
          </div>
        </header>
      ) : (
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-emerald-900 px-8 py-5 rounded-[2.5rem] text-white shadow-[0_20px_50px_-10px_rgba(0,0,0,0.4)] relative overflow-hidden ring-1 ring-white/10">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[120px] -mr-80 -mt-80" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[100px] -ml-64 -mb-64" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">Core Mission</span>
                <div className="w-1 h-1 rounded-full bg-emerald-400/50" />
                <span className="text-[10px] font-black text-emerald-100/60 uppercase tracking-widest leading-none">Learning Path Alpha</span>
              </div>
              <h1 className="text-4xl font-black tracking-tighter leading-none text-white">
                Task <span className="text-emerald-400">Hub</span>
              </h1>
            </div>
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="bg-white/5 backdrop-blur-3xl p-1.5 rounded-[2rem] flex items-center border border-white/10 shadow-2xl shadow-black/20">
              <button 
                onClick={() => setActiveTab('tasks')}
                className={`px-6 py-3 rounded-[1.25rem] font-black uppercase tracking-widest transition-all duration-500 flex items-center gap-2 text-[9px] ${
                  activeTab === 'tasks' 
                    ? 'bg-white text-emerald-900 shadow-xl scale-105' 
                    : 'text-emerald-100/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <ListChecks size={16} />
                Tasks
              </button>
              <button 
                onClick={() => setActiveTab('reports')}
                className={`px-6 py-3 rounded-[1.25rem] font-black uppercase tracking-widest transition-all duration-500 flex items-center gap-2 text-[9px] ${
                  activeTab === 'reports' 
                    ? 'bg-white text-emerald-900 shadow-xl scale-105' 
                    : 'text-emerald-100/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <FileText size={16} />
                Reports
              </button>
              <button 
                onClick={() => setActiveTab('downloads')}
                className={`px-6 py-3 rounded-[1.25rem] font-black uppercase tracking-widest transition-all duration-500 flex items-center gap-2 text-[9px] ${
                  activeTab === 'downloads' 
                    ? 'bg-white text-emerald-900 shadow-xl scale-105' 
                    : 'text-emerald-100/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Download size={16} />
                Downloads
              </button>
            </div>
            
            <div className="flex gap-4">
              <div className="bg-white/5 backdrop-blur-md rounded-3xl p-4 border border-white/10 flex flex-col items-center justify-center min-w-[100px]">
                <span className="text-2xl font-black text-white leading-none">{tasks.length}</span>
                <span className="text-[8px] font-black text-emerald-100/50 uppercase tracking-[0.2em] mt-1">Total Goals</span>
              </div>
              <div className="bg-emerald-500/20 backdrop-blur-md rounded-3xl p-4 border border-emerald-500/30 flex flex-col items-center justify-center min-w-[100px]">
                <span className="text-2xl font-black text-emerald-300 leading-none">{tasks.filter(t => !mySubmissions.some(s => s.taskId === t.id)).length}</span>
                <span className="text-[8px] font-black text-emerald-400/80 uppercase tracking-[0.2em] mt-1">Pending</span>
              </div>
            </div>
          </div>
        </header>
      )}


      {/* Admin Quick Stats Bar */}
      {isAdmin && activeTab === 'tasks' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/40 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl transition-all duration-500 group">
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 bg-blue-500/10 text-blue-500 rounded-2xl group-hover:scale-110 transition-transform duration-500 shadow-inner">
                <ListChecks size={24} />
              </div>
              <span className="text-[9px] font-black text-blue-500 bg-blue-500/5 px-2.5 py-1 rounded-full border border-blue-500/10 uppercase tracking-widest">Active</span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Assignments</p>
            <p className="text-4xl font-black text-slate-900 tracking-tighter">{tasks.filter(t => t.type !== 'test').length}</p>
          </div>

          <div className="bg-white/40 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl transition-all duration-500 group">
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 bg-rose-500/10 text-rose-500 rounded-2xl group-hover:scale-110 transition-transform duration-500 shadow-inner">
                <ShieldCheck size={24} />
              </div>
              <span className="text-[9px] font-black text-rose-500 bg-rose-500/5 px-2.5 py-1 rounded-full border border-rose-500/10 uppercase tracking-widest">Secure</span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Secure Assessments</p>
            <p className="text-4xl font-black text-slate-900 tracking-tighter">{tasks.filter(t => t.type === 'test').length}</p>
          </div>

          <div className="bg-white/40 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl transition-all duration-500 group">
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 bg-amber-500/10 text-amber-500 rounded-2xl group-hover:scale-110 transition-transform duration-500 shadow-inner">
                <Clock size={24} />
              </div>
              {allSubmissions.filter(s => !s.feedback).length > 0 && (
                <span className="text-[9px] font-black text-white bg-amber-500 px-2.5 py-1 rounded-full shadow-lg shadow-amber-500/20 animate-pulse uppercase tracking-widest">Action</span>
              )}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Pending Grading</p>
            <p className="text-4xl font-black text-slate-900 tracking-tighter">
              {allSubmissions.filter(s => !s.feedback).length}
            </p>
          </div>

          <div className="bg-slate-900/90 backdrop-blur-3xl p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group border border-white/10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/20 transition-all duration-700" />
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400 border border-emerald-500/20">
                  <Sparkles size={18} className="animate-pulse" />
                </div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Large Language Model (LLM) Deployed</span>
              </div>
              <div>
                <p className="text-2xl font-black text-white tracking-tighter leading-none mb-1">Gemini 3.1 Flash</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-60">Autonomous Intelligence v2</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAdmin && activeTab === 'tasks' && (
        <div className="flex flex-wrap items-center gap-4">
          <button 
            onClick={() => {
              setNewTask(prev => ({ ...prev, type: 'standard' }));
              setIsCreatorOpen(true);
            }}
            className="group bg-white/40 backdrop-blur-2xl border border-white/20 p-5 rounded-[2rem] flex items-center gap-4 hover:bg-emerald-500 transition-all duration-500 shadow-sm hover:shadow-xl hover:shadow-emerald-500/20"
          >
            <div className="w-12 h-12 bg-emerald-500/10 group-hover:bg-white/20 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:text-white transition-all duration-500 shadow-inner">
              <Plus size={24} />
            </div>
            <div className="text-left">
              <span className="block text-[10px] font-black text-emerald-600/60 group-hover:text-white/60 uppercase tracking-widest leading-none mb-1">Deployment</span>
              <span className="block text-xs font-black text-slate-900 group-hover:text-white uppercase tracking-[0.1em]">New Assignment</span>
            </div>
          </button>

          <button 
            onClick={() => {
              setNewTask(prev => ({ ...prev, type: 'test' }));
              setIsTestCreatorOpen(true);
            }}
            className="group bg-white/40 backdrop-blur-2xl border border-white/20 p-5 rounded-[2rem] flex items-center gap-4 hover:bg-rose-500 transition-all duration-500 shadow-sm hover:shadow-xl hover:shadow-rose-500/20"
          >
            <div className="w-12 h-12 bg-rose-500/10 group-hover:bg-white/20 rounded-2xl flex items-center justify-center text-rose-600 group-hover:text-white transition-all duration-500 shadow-inner">
              <ShieldCheck size={24} />
            </div>
            <div className="text-left">
              <span className="block text-[10px] font-black text-rose-600/60 group-hover:text-white/60 uppercase tracking-widest leading-none mb-1">Security</span>
              <span className="block text-xs font-black text-slate-900 group-hover:text-white uppercase tracking-[0.1em]">New Secure Test</span>
            </div>
          </button>

          <button 
            onClick={seedGoldenStandardTasks}
            disabled={seedingStatus !== 'idle'}
            className={`group bg-white/40 backdrop-blur-2xl border p-5 rounded-[2rem] flex items-center gap-4 transition-all duration-500 shadow-sm hover:shadow-xl ${
              seedingStatus === 'success' 
                ? 'bg-amber-500 border-amber-500 text-white shadow-amber-500/20' 
                : seedingStatus === 'seeding'
                ? 'bg-amber-100 border-amber-200 text-amber-500 opacity-50 cursor-wait'
                : 'border-white/20 text-amber-600 hover:bg-amber-500 hover:border-amber-500'
            }`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner ${
              seedingStatus === 'success' ? 'bg-white/20' : 'bg-amber-500/10 group-hover:bg-white/20 text-amber-600 group-hover:text-white'
            }`}>
              {seedingStatus === 'success' ? <CheckCircle2 size={24} /> : seedingStatus === 'seeding' ? <RefreshCw size={24} className="animate-spin" /> : <Star size={24} />}
            </div>
            <div className="text-left">
              <span className={`block text-[10px] font-black uppercase tracking-widest leading-none mb-1 ${seedingStatus === 'success' ? 'text-white/60' : 'text-amber-600/60 group-hover:text-white/60'}`}>Reference</span>
              <span className={`block text-xs font-black uppercase tracking-[0.1em] ${seedingStatus === 'success' ? 'text-white' : 'text-slate-900 group-hover:text-white'}`}>
                {seedingStatus === 'success' ? 'Injected!' : seedingStatus === 'seeding' ? 'Seeding...' : 'Golden Standards'}
              </span>
            </div>
          </button>

          {onWipeCleanSlate && (
            <button 
              onClick={() => {
                if (nukeLevel < 2) {
                  setNukeLevel(prev => prev + 1);
                } else {
                  onWipeCleanSlate();
                  setNukeLevel(0);
                }
              }}
              onMouseLeave={() => {
                if (nukeLevel > 0) setNukeLevel(0);
              }}
              className={`ml-auto group bg-white/40 backdrop-blur-2xl border-2 border-dashed p-5 rounded-[2rem] flex items-center gap-4 transition-all duration-500 shadow-sm ${
                nukeLevel > 0 
                  ? 'bg-red-600 border-red-600 text-white shadow-xl shadow-red-600/20' 
                  : 'border-red-100 text-red-500 hover:bg-red-600 hover:border-red-600'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner ${
                nukeLevel > 0 ? 'bg-white/20' : 'bg-red-500/10 group-hover:bg-white/20 text-red-500 group-hover:text-white'
              }`}>
                <Trash2 size={24} />
              </div>
              <div className="text-left">
                <span className={`block text-[10px] font-black uppercase tracking-widest leading-none mb-1 ${nukeLevel > 0 ? 'text-white/60' : 'text-red-500/60 group-hover:text-white/60'}`}>Dangerous</span>
                <span className={`block text-xs font-black uppercase tracking-[0.1em] ${nukeLevel > 0 ? 'text-white' : 'text-slate-900 group-hover:text-white'}`}>
                  {nukeLevel === 0 ? "Purge System" : nukeLevel === 1 ? "Confirm?" : "TERMINATE"}
                </span>
              </div>
            </button>
          )}
        </div>
      )}

      {/* Test Creator Modal */}
      {isAdmin && isTestCreatorOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl border-4 border-red-100 shadow-xl fixed inset-0 md:inset-10 z-[300] overflow-y-auto"
        >
          <div className="flex justify-between items-center mb-8 border-b-2 border-red-50 pb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase text-gray-800 tracking-tight">Create New Assessment</h2>
                <p className="text-gray-500 font-bold text-sm">Design a secure interactive test for your students.</p>
              </div>
            </div>
            <button onClick={() => setIsTestCreatorOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
              <X size={24} className="text-gray-400 hover:text-red-500" />
            </button>
          </div>

          <form onSubmit={handleCreate} className="space-y-6 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Basic Info */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Test Title</label>
                  <input 
                    required
                    type="text" 
                    value={newTask.title}
                    onChange={e => setNewTask({...newTask, title: e.target.value})}
                    className="w-full p-4 rounded-2xl border-2 border-gray-100 font-bold focus:border-red-500 outline-none"
                    placeholder="e.g. End of Unit 2 Assessment"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Select Unit</label>
                    <select 
                      value={newTask.units?.[0]}
                      onChange={e => setNewTask({...newTask, units: [parseInt(e.target.value)]})}
                      className="w-full p-4 rounded-2xl border-2 border-gray-100 font-bold outline-none focus:border-red-500"
                    >
                      {units.map(u => (
                        <option key={u.id} value={u.id}>{u.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-4">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Test Date</label>
                    <input 
                      type="date" 
                      value={newTask.dueDate}
                      onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                      className="w-full p-4 rounded-2xl border-2 border-gray-100 font-bold outline-none focus:border-red-500"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Passcode (REQUIRED FOR SECURITY)</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      required
                      type="text" 
                      value={newTask.passcode}
                      onChange={e => setNewTask({...newTask, passcode: e.target.value})}
                      className="w-full pl-12 p-4 rounded-2xl border-2 border-gray-100 font-black tracking-widest focus:border-red-500 outline-none text-red-600"
                      placeholder="e.g. SCIENCE2024"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Time Limit (Mins)</label>
                    <div className="relative">
                      <Timer className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="number" 
                        value={newTask.timeLimit}
                        onChange={e => setNewTask({...newTask, timeLimit: parseInt(e.target.value)})}
                        className="w-full pl-12 p-4 rounded-2xl border-2 border-gray-100 font-bold focus:border-red-500 outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-4 flex flex-col justify-end">
                    <label className="flex items-center gap-3 cursor-pointer p-4 rounded-2xl border-2 border-gray-100 hover:border-blue-100 transition-all select-none">
                      <input 
                        type="checkbox" 
                        checked={newTask.isABVersion}
                        onChange={e => setNewTask({...newTask, isABVersion: e.target.checked})}
                        className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">A/B Testing Mode</span>
                    </label>
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Test PDF URL (Optional)</label>
                  <input 
                    type="url" 
                    value={newTask.pdfUrl || ''}
                    onChange={e => setNewTask({...newTask, pdfUrl: e.target.value})}
                    className="w-full p-4 rounded-2xl border-2 border-gray-100 font-bold focus:border-red-500 outline-none"
                    placeholder="https://.../assessment.pdf"
                  />
                </div>
              </div>

              {/* Right Column: Interactive Content */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Interactive Test Mode JSON</label>
                    <div className="flex gap-2">
                       <button
                        type="button"
                         onClick={async () => {
                           const prompt = `You are a curriculum expert. Generate a balanced set of 10 questions for unit ${newTask.units?.[0] || 1} in JSON format. include MCQ, Short Response, and Table types. use IDs like "test_${Date.now()}_q1".`;
                           try {
                             const response = await fetch('/api/generate-questions', {
                               method: 'POST',
                               headers: { 'Content-Type': 'application/json' },
                               body: JSON.stringify({ prompt })
                             });
                             
                             if (!response.ok) throw new Error("Failed to generate questions");
                             
                             const data = await response.json();
                             if (data.json) {
                               setWorksheetQuestionsJson(data.json);
                               alert("AI Generated sample questions!");
                             } else {
                               alert("AI failed to generate parseable JSON. Try again.");
                             }
                           } catch (err: any) {
                             alert("Error generating questions: " + err.message);
                           }
                         }}
                        disabled={!newTask.units?.length}
                        className="text-[10px] uppercase font-black tracking-widest bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-100 transition-all disabled:opacity-50"
                      >
                        AI Generate
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const workId = (newTask.title || 'test').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                          const prompt = `Generate interactive test JSON for: ${newTask.title || '[Untitled Test]'}
Instruction: Parse the questions from this PDF test.
CRITICAL REQUIREMENT for "page" field: You MUST accurately identify and include the exact integer page number (1-indexed) where each question is located in the PDF. Do NOT just default to 1. The page number must correctly match the PDF's pages.

Support Question Types:
1. "mcq" (requires "options": array of strings)
2. "short-response" (open text)
3. "table" (requires "tableData": 2D array of strings. Use "" for cells where user input is required, and pre-fill other cells with headers or data.)
4. "tick-cross" (binary selection of true/false or yes/no. Use ✓ or ✕)
5. "reorder" (requires "items": array of strings in random initial order)

JSON Schema Example:
[
  {
    "id": "${workId}_q1",
    "section": "Section A",
    "question": "Choose the correct answer...",
    "type": "mcq",
    "options": ["A", "B", "C", "D"],
    "page": 1
  },
  {
    "id": "${workId}_q2",
    "section": "Data Analysis",
    "question": "Complete the table:",
    "type": "table",
    "tableData": [
      ["Trial", "Time (s)", "Distance (m)"],
      ["1", "2.0", ""],
      ["2", "4.0", ""]
    ],
    "page": 1
  },
  {
    "id": "${workId}_q3",
    "section": "Section B",
    "question": "Mark whether the statement is true or false.",
    "type": "tick-cross",
    "page": 2
  },
  {
    "id": "${workId}_q4",
    "section": "Section B",
    "question": "Reorder the steps of photosynthesis:",
    "type": "reorder",
    "items": ["Absorb Light", "Split Water", "Fix Carbon"],
    "page": 2
  }
]
Output ONLY the JSON array.`;
                          navigator.clipboard.writeText(prompt);
                          alert("Test extraction prompt copied!");
                        }}
                        className="flex items-center gap-1 text-[10px] uppercase font-black tracking-widest bg-zinc-50 text-zinc-600 px-3 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 transition-all"
                      >
                        <Copy size={12} /> Copy Prompt
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyGemInstructions}
                        className="flex items-center gap-1 text-[10px] uppercase font-black tracking-widest bg-violet-50 text-violet-600 px-3 py-1.5 rounded-lg border border-violet-200 hover:bg-violet-100 transition-all"
                      >
                        <Copy size={12} /> Copy GEM Instructions
                      </button>
                    </div>
                  </div>
                  <textarea 
                    value={worksheetQuestionsJson}
                    onChange={e => setWorksheetQuestionsJson(e.target.value)}
                    className="w-full h-48 p-4 rounded-2xl border-2 border-gray-100 font-mono text-[10px] focus:border-red-500 outline-none resize-none custom-scrollbar bg-slate-50/30"
                    placeholder="Provide test questions JSON structure..."
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Marking Scheme (JSON or Text)</label>
                    <button
                        type="button"
                        onClick={() => {
                          const workId = (newTask.title || 'test').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                          const prompt = `Generate marking scheme mapping for test questions: ${worksheetQuestionsJson}
Include specific rubric per point.
Output ONLY the JSON object.`;
                          navigator.clipboard.writeText(prompt);
                          alert("Markscheme prompt copied!");
                        }}
                        className="flex items-center gap-1 text-[10px] uppercase font-black tracking-widest bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-all"
                      >
                        <Copy size={12} /> Sync Rubric Prompt
                      </button>
                  </div>
                  <textarea 
                    value={markschemeContent}
                    onChange={e => setMarkschemeContent(e.target.value)}
                    className="w-full h-48 p-4 rounded-2xl border-2 border-gray-100 font-mono text-[10px] focus:border-red-500 outline-none resize-none custom-scrollbar bg-slate-50/30"
                    placeholder="Provide marking rubric for AI grading..."
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-12 bg-white sticky bottom-0 pt-4 border-t-2 border-red-50">
              <button 
                type="button"
                onClick={() => setIsTestCreatorOpen(false)}
                className="px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs text-gray-400 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-[0_6px_0_0_#991b1b] active:translate-y-1 active:shadow-none transition-all flex items-center gap-2"
              >
                <ShieldCheck size={18} />
                Deploy Test
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Passcode Unlock Modal */}
      <AnimatePresence>
        {isPasscodeModalOpen && selectedTaskForPasscode && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[600] flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={isAdmin ? 'bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-[3rem] p-6 lg:p-10 shadow-xl max-w-6xl flex flex-col max-h-[95vh] w-full' : 'bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border-4 border-red-50'}
            >
              {isAdmin ? (
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 shrink-0 pb-6 border-b border-white/10">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-white/20 rounded-[1.5rem] border border-white/20 flex items-center justify-center text-white shadow-inner">
                      <Lock size={28} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight">Edit Test Details (Case sensitive)</h2>
                      <p className="text-white/60 font-medium text-[10px] tracking-widest uppercase">Update the test name, passcodes, questions, and markscheme.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <button 
                      type="button"
                      onClick={() => {
                        setIsPasscodeModalOpen(false);
                        setSelectedTaskForPasscode(null);
                        setEnteredPasscode('');
                        setPasscodeError(false);
                        setEditingTaskQuestionsJson('');
                        setEditingTaskMarkscheme('');
                      }}
                      className="flex-1 md:flex-none px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] text-white/60 hover:bg-white/10 hover:text-white border border-transparent transition-all"
                    >
                      Discard
                    </button>
                    <button 
                      onClick={async () => {
                        if (onUpdateTask && selectedTaskForPasscode) {
                          let parsedQ = selectedTaskForPasscode.worksheetQuestions;
                          try {
                            if (editingTaskQuestionsJson.trim()) {
                              parsedQ = JSON.parse(editingTaskQuestionsJson);
                            } else {
                              parsedQ = [];
                            }
                          } catch(e) { 
                            alert("Invalid JSON for questions. Saving other changes only."); 
                          }
                          await onUpdateTask(selectedTaskForPasscode.id, { 
                            worksheetQuestions: parsedQ,
                            markschemeContent: editingTaskMarkscheme || undefined
                          });
                          setSelectedTaskForPasscode({...selectedTaskForPasscode, worksheetQuestions: parsedQ, markschemeContent: editingTaskMarkscheme});
                          alert("Content Updated!");
                          
                          setIsPasscodeModalOpen(false);
                          setSelectedTaskForPasscode(null);
                          setEditingTaskQuestionsJson('');
                          setEditingTaskMarkscheme('');
                        }
                      }}
                      className="group/btn flex-1 md:flex-none bg-white/10 hover:bg-white text-white border border-white/20 hover:text-slate-900 px-6 py-2.5 rounded-2xl flex items-center justify-center transition-all duration-300"
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest">Save Questions & Markscheme</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center mb-8">
                  <div className="bg-red-50 w-20 h-20 rounded-3xl flex items-center justify-center text-red-500 shadow-inner mb-4">
                    <Lock size={40} className="animate-bounce" />
                  </div>
                  <h2 className="text-3xl font-black text-center text-gray-800 uppercase tracking-tight">
                    Secure Assessment
                  </h2>
                </div>
              )}
              
              {isAdmin ? (
                <>
                <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 mb-8">
                  {/* Left Column: Properties */}
                  <div className="w-full lg:w-1/3 flex flex-col gap-4 shrink-0">
                  {/* Title Edit */}
                  <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 flex flex-col items-center justify-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Test Title</span>
                    {isEditingTestTitle ? (
                       <div className="flex gap-2 w-full">
                         <input 
                           type="text"
                           value={editedTestTitle}
                           onChange={(e) => setEditedTestTitle(e.target.value)}
                           className="flex-1 text-center font-bold p-2 rounded-xl border-2 border-emerald-200 outline-none text-sm"
                           autoFocus
                         />
                         <button 
                           onClick={async () => {
                             if (onUpdateTask && selectedTaskForPasscode && editedTestTitle.trim()) {
                               await onUpdateTask(selectedTaskForPasscode.id, { title: editedTestTitle.trim() });
                               setSelectedTaskForPasscode({...selectedTaskForPasscode, title: editedTestTitle.trim()});
                               setIsEditingTestTitle(false);
                             }
                           }}
                           className="bg-emerald-500 text-white px-4 rounded-xl font-bold text-xs shadow-sm transition-transform active:scale-95"
                         >
                           Save
                         </button>
                       </div>
                     ) : (
                       <div className="flex items-center gap-2 w-full justify-between group">
                         <span className="text-lg font-black text-gray-800 text-center flex-1 truncate">{selectedTaskForPasscode.title}</span>
                         <button 
                           onClick={() => {
                             setEditedTestTitle(selectedTaskForPasscode.title);
                             setIsEditingTestTitle(true);
                           }}
                           className="p-2 hover:bg-gray-200 rounded-xl text-gray-400 hover:text-emerald-500 transition-colors shrink-0 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100"
                         >
                           <Edit size={16} />
                         </button>
                       </div>
                     )}
                  </div>

                  {/* Passcode Edit */}
                  <div className="bg-red-50 p-4 rounded-3xl border border-red-100 flex flex-col items-center justify-center gap-2">
                     <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Live Passcode</span>
                     {isEditingPasscode ? (
                       <div className="flex gap-2 w-full">
                         <input 
                           type="text"
                           value={editedPasscodeValue}
                           onChange={(e) => setEditedPasscodeValue(e.target.value.toUpperCase())}
                           className="flex-1 text-center font-black p-2 rounded-xl border-2 border-red-200 outline-none uppercase text-sm"
                           autoFocus
                         />
                         <button 
                           onClick={async () => {
                             if (onUpdateTask && selectedTaskForPasscode) {
                               await onUpdateTask(selectedTaskForPasscode.id, { passcode: editedPasscodeValue });
                               setSelectedTaskForPasscode({...selectedTaskForPasscode, passcode: editedPasscodeValue});
                               setIsEditingPasscode(false);
                             }
                           }}
                           className="bg-red-500 text-white px-4 rounded-xl font-bold text-xs shadow-sm transition-transform active:scale-95"
                         >
                           Save
                         </button>
                       </div>
                     ) : (
                       <div className="flex items-center gap-2 group justify-between w-full">
                         <span className={`text-2xl font-black text-red-600 tracking-tighter flex-1 text-center transition-all duration-300 ${!showPasscode ? 'blur-md opacity-70 select-none' : 'blur-none opacity-100'}`}>
                           {selectedTaskForPasscode.passcode}
                         </span>
                         <div className="flex items-center gap-1 shrink-0 md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                            <button 
                              onClick={() => setShowPasscode(!showPasscode)}
                              className="p-2 hover:bg-red-100 rounded-xl text-red-500 transition-colors"
                            >
                              <Eye size={16} className={showPasscode ? '' : 'opacity-40'} />
                            </button>
                            <button 
                              onClick={() => {
                                setEditedPasscodeValue(selectedTaskForPasscode.passcode || '');
                                setIsEditingPasscode(true);
                              }}
                              className="p-2 hover:bg-red-100 rounded-xl text-red-500 transition-colors"
                            >
                              <Edit size={16} />
                            </button>
                         </div>
                       </div>
                     )}
                  </div>

                  {/* Due Date Edit */}
                  <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 flex flex-col items-center justify-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Due Date</span>
                    {isEditingTestDate ? (
                       <div className="flex gap-2 w-full">
                         <input 
                           type="date"
                           value={editedTestDate}
                           onChange={(e) => setEditedTestDate(e.target.value)}
                           className="flex-1 text-center font-bold p-2 rounded-xl border-2 border-emerald-200 outline-none text-sm"
                           autoFocus
                         />
                         <button 
                           onClick={async () => {
                             if (onUpdateTask && selectedTaskForPasscode && editedTestDate) {
                               await onUpdateTask(selectedTaskForPasscode.id, { dueDate: editedTestDate });
                               setSelectedTaskForPasscode({...selectedTaskForPasscode, dueDate: editedTestDate});
                               setIsEditingTestDate(false);
                             }
                           }}
                           className="bg-emerald-500 text-white px-4 rounded-xl font-bold text-xs shadow-sm transition-transform active:scale-95"
                         >
                           Save
                         </button>
                       </div>
                     ) : (
                       <div className="flex items-center gap-2 justify-between w-full group">
                         <span className="text-lg font-black text-gray-800 text-center flex-1">
                           {format(selectedTaskForPasscode.dueDate.includes('T') ? parseISO(selectedTaskForPasscode.dueDate) : new Date(selectedTaskForPasscode.dueDate + 'T00:00:00'), 'MMM d, yyyy')}
                         </span>
                         <button 
                           onClick={() => {
                             setEditedTestDate(selectedTaskForPasscode.dueDate.split('T')[0]);
                             setIsEditingTestDate(true);
                           }}
                           className="p-2 hover:bg-gray-200 rounded-xl text-gray-400 hover:text-emerald-500 transition-colors shrink-0 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100"
                         >
                           <Edit size={16} />
                         </button>
                       </div>
                     )}
                  </div>
                  
                  {/* PDF URL Edit */}
                  <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 flex flex-col items-center justify-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">PDF URL</span>
                    {isEditingPdfUrl ? (
                       <div className="flex gap-2 w-full px-2">
                         <input 
                           type="text"
                           value={editedPdfUrl}
                           onChange={(e) => setEditedPdfUrl(e.target.value)}
                           className="flex-1 font-bold p-2 py-3 rounded-xl border-2 border-emerald-200 outline-none text-[10px] tracking-tight bg-white shadow-sm"
                           placeholder="https://..."
                           autoFocus
                         />
                         <button 
                           onClick={async () => {
                             if (onUpdateTask && selectedTaskForPasscode) {
                               await onUpdateTask(selectedTaskForPasscode.id, { pdfUrl: editedPdfUrl });
                               setSelectedTaskForPasscode({...selectedTaskForPasscode, pdfUrl: editedPdfUrl});
                               setIsEditingPdfUrl(false);
                             }
                           }}
                           className="bg-emerald-500 text-white px-4 rounded-xl font-bold text-[10px] shadow-sm transition-transform active:scale-95"
                         >
                           Save
                         </button>
                       </div>
                     ) : (
                       <div className="flex items-center gap-2 group justify-between w-full">
                         <div className="flex items-center gap-2 overflow-hidden flex-1 justify-center">
                            <Link2 size={12} className="text-gray-400" />
                            <span className="text-xs font-black text-gray-800 truncate max-w-[150px]">
                               {selectedTaskForPasscode.pdfUrl || 'No PDF Linked'}
                            </span>
                         </div>
                         <button 
                           onClick={() => {
                             setEditedPdfUrl(selectedTaskForPasscode.pdfUrl || '');
                             setIsEditingPdfUrl(true);
                           }}
                           className="p-2 hover:bg-gray-200 rounded-xl text-gray-400 hover:text-emerald-500 transition-colors shrink-0 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100"
                         >
                           <Edit size={16} />
                         </button>
                       </div>
                     )}
                  </div>
                  
                  {/* Time Limit Edit */}
                  <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 flex flex-col items-center justify-center gap-2 mb-auto">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Time Limit</span>
                    <div className="flex items-center justify-center w-full gap-4">
                      <button 
                        onClick={() => {
                          const newLimit = (selectedTaskForPasscode.timeLimit || 60) - 5;
                          if (newLimit > 0 && onUpdateTask) {
                            onUpdateTask(selectedTaskForPasscode.id, { timeLimit: newLimit });
                            setSelectedTaskForPasscode({...selectedTaskForPasscode, timeLimit: newLimit});
                          }
                        }}
                        className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors text-lg font-bold shrink-0 shadow-sm active:scale-95"
                      >
                        -
                      </button>
                      <span className="text-2xl font-black text-gray-800 w-16 text-center">{selectedTaskForPasscode.timeLimit}m</span>
                      <button 
                        onClick={() => {
                          const newLimit = (selectedTaskForPasscode.timeLimit || 60) + 5;
                          if (onUpdateTask) {
                            onUpdateTask(selectedTaskForPasscode.id, { timeLimit: newLimit });
                            setSelectedTaskForPasscode({...selectedTaskForPasscode, timeLimit: newLimit});
                          }
                        }}
                        className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors text-lg font-bold shrink-0 shadow-sm active:scale-95"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  
                  </div>
                  {/* Right Column: JSON Configs */}
                  <div className="w-full lg:w-2/3 flex flex-col md:flex-row gap-6 min-h-0">
                    <div className="flex-1 flex flex-col h-64 md:h-[400px]">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Questions JSON</label>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                               navigator.clipboard.writeText(`Generate a balanced set of 10 questions in JSON format. include MCQ, Short Response, and Table types. use IDs like "test_${Date.now()}_q1".\n1. "mcq" (requires "options": array of strings)\n2. "short-response"\n3. "table" (requires "tableData": 2D array of strings. Use "" for cells where user input is required, and pre-fill other cells with headers or data.)\n4. "tick-cross" (binary selection of ✓ or ✕)\n5. "reorder" (requires "items": array of strings in random initial order)\nOutput a STRICT JSON array.`);
                               alert('Prompt Copied!');
                            }}
                            className="flex items-center gap-1 text-[9px] font-black uppercase text-emerald-500 hover:bg-emerald-50 px-2 py-1 rounded-md transition-colors"
                          >
                            <Copy size={12} /> Prompt
                          </button>
                          <button
                            type="button"
                            onClick={handleCopyGemInstructions}
                            className="flex items-center gap-1 text-[9px] font-black uppercase text-violet-500 hover:bg-violet-50 px-2 py-1 rounded-md transition-colors"
                          >
                            <Copy size={12} /> GEM Instructions
                          </button>
                        </div>
                      </div>
                      <textarea 
                        value={editingTaskQuestionsJson}
                        onChange={e => setEditingTaskQuestionsJson(e.target.value)}
                        className="w-full flex-1 p-4 rounded-2xl border-2 border-gray-100 font-mono text-[10px] leading-relaxed focus:border-red-500 outline-none resize-none custom-scrollbar bg-slate-50/50 shadow-inner"
                        placeholder="[ { id: 'q1', type: 'short-response', ... } ]"
                      />
                    </div>
                    
                    <div className="flex-1 flex flex-col h-64 md:h-[400px]">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Markscheme</label>
                        <button 
                          onClick={() => {
                             navigator.clipboard.writeText(`Generate a markscheme for the provided questions. It should contain detailed criteria for each question to guide the grading process.`);
                             alert('Prompt Copied!');
                          }}
                          className="flex items-center gap-1 text-[9px] font-black uppercase text-emerald-500 hover:bg-emerald-50 px-2 py-1 rounded-md transition-colors"
                        >
                          <Copy size={12} /> Prompt
                        </button>
                      </div>
                      <textarea 
                        value={editingTaskMarkscheme}
                        onChange={e => setEditingTaskMarkscheme(e.target.value)}
                        className="w-full flex-1 p-4 rounded-2xl border-2 border-gray-100 font-mono text-[10px] leading-relaxed focus:border-red-500 outline-none resize-none custom-scrollbar bg-slate-50/50 shadow-inner"
                        placeholder="Content that AI will evaluate against"
                      />
                    </div>
                  </div>
                </div>
                
                
              </>
              ) : (
                <p className="text-gray-500 text-center text-sm font-bold mb-8 px-4">
                  This assessment is locked. Please enter the passcode provided by your instructor to begin.
                </p>
              )}

              <div className="space-y-6">
                {!isAdmin && (
                  <div className="space-y-2 text-center">
                    <input 
                      type="password"
                      value={enteredPasscode}
                      onChange={(e) => {
                        setEnteredPasscode(e.target.value.toUpperCase());
                        setPasscodeError(false);
                      }}
                      autoFocus
                      placeholder="••••••••"
                      className={`w-full text-center text-3xl font-black tracking-[0.5em] p-6 rounded-2xl border-4 outline-none transition-all ${
                        passcodeError ? 'border-red-500 bg-red-50' : 'border-gray-100 focus:border-red-200'
                      }`}
                    />
                    {passcodeError && (
                      <p className="text-red-500 text-[10px] font-black uppercase tracking-widest animate-pulse">Incorrect Passcode</p>
                    )}
                  </div>
                )}
              </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      setIsPasscodeModalOpen(false);
                      setSelectedTaskForPasscode(null);
                      setEnteredPasscode('');
                      setPasscodeError(false);
                    }}
                    className="flex-1 py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-xs text-gray-400 hover:bg-gray-50 bg-white border-2 border-gray-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      if (isAdmin || enteredPasscode === selectedTaskForPasscode.passcode) {
                        onStartTask(selectedTaskForPasscode);
                        setIsPasscodeModalOpen(false);
                        setSelectedTaskForPasscode(null);
                        setEnteredPasscode('');
                      } else {
                        setPasscodeError(true);
                      }
                    }}
                    className="flex-1 py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-xs text-white bg-red-600 shadow-[0_4px_0_0_#991b1b] active:translate-y-1 active:shadow-none transition-all"
                  >
                    {isAdmin ? 'Admin Entry' : 'Unlock'}
                  </button>
                </div>
                {isAdmin && (
                  <button 
                    onClick={async () => {
                      setDeleteConfirmation({ id: selectedTaskForPasscode!.id, type: 'task', title: selectedTaskForPasscode!.title });
                      setIsPasscodeModalOpen(false);
                    }}
                    className="w-full py-3 rounded-xl text-red-500 font-black uppercase text-[10px] tracking-widest hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 size={12} />
                    Revoke Assessment
                  </button>
                )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {isAdmin && isCreatorOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl border-4 border-emerald-100 shadow-xl fixed inset-0 md:inset-10 z-[300] overflow-y-auto"
        >
          <div className="flex justify-between items-center mb-8 border-b-2 border-emerald-50 pb-4">
            <div>
              <h2 className="text-2xl font-black uppercase text-gray-800 tracking-tight">Create New Task</h2>
              <p className="text-gray-500 font-bold text-sm">Fill in the details below to issue a new assignment.</p>
            </div>
            <button onClick={() => setIsCreatorOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
              <Trash2 className="text-gray-400 hover:text-red-500" />
            </button>
          </div>

          <form onSubmit={handleCreate} className="space-y-6 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Basic Info */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Task Title</label>
                  <input 
                    required
                    type="text" 
                    value={newTask.title}
                    onChange={e => setNewTask({...newTask, title: e.target.value})}
                    className="w-full p-4 rounded-2xl border-2 border-gray-100 font-bold focus:border-emerald-500 outline-none"
                    placeholder="e.g. Unit 1 Revision"
                  />
                </div>
                <div className="space-y-4">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Select Unit</label>
                  <select 
                    value={newTask.units?.[0]}
                    onChange={e => setNewTask({...newTask, units: [parseInt(e.target.value)]})}
                    className="w-full p-4 rounded-2xl border-2 border-gray-100 font-bold outline-none focus:border-emerald-500"
                  >
                    {units.map(u => (
                      <option key={u.id} value={u.id}>{u.title}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-4">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Due Date</label>
                  <input 
                    type="date" 
                    value={newTask.dueDate}
                    onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                    className="w-full p-4 rounded-2xl border-2 border-gray-100 font-bold outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-4">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Description</label>
                  <input 
                    type="text" 
                    value={newTask.description}
                    onChange={e => setNewTask({...newTask, description: e.target.value})}
                    className="w-full p-4 rounded-2xl border-2 border-gray-100 font-bold outline-none focus:border-emerald-500"
                    placeholder="Optional details..."
                  />
                </div>
                <div className="space-y-4">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Worksheet PDF URL (Optional)</label>
                  <input 
                    type="url" 
                    value={newTask.pdfUrl || ''}
                    onChange={e => setNewTask({...newTask, pdfUrl: e.target.value})}
                    className="w-full p-4 rounded-2xl border-2 border-gray-100 font-bold focus:border-purple-500 outline-none"
                    placeholder="https://.../sheet.pdf"
                  />
                </div>
              </div>

              {/* Right Column: Advanced Setup */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Interactive Worksheet Mode JSON</label>
                    <div className="flex gap-2">
                       <button
                        type="button"
                        onClick={() => setShowQuestionsPrompt(!showQuestionsPrompt)}
                        className="text-[10px] uppercase font-black tracking-widest bg-purple-50 text-purple-600 px-3 py-1.5 rounded-lg border border-purple-200 hover:bg-purple-100 transition-all"
                      >
                        {showQuestionsPrompt ? 'Hide Prompt' : 'Show Prompt'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const workId = (newTask.title || 'task').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                          const prompt = `You are an expert curriculum parser. Parse the questions from this worksheet.
Target Worksheet Title: ${newTask.title || '[Untitled Task]'}
Target Internal ID: ${workId}

Output a STRICT JSON array of question objects, adhering to this schema and examples:
[
  {
    "id": "${workId}_f1",
    "section": "Focus",
    "question": "1. What is the chemical name for rust?",
    "type": "short-response",
    "page": 1
  },
  {
    "id": "${workId}_f2",
    "section": "Focus",
    "question": "2. Choose the correct state of matter for water at 25°C.",
    "type": "mcq",
    "options": ["Solid", "Liquid", "Gas"],
    "page": 1
  },
  {
    "id": "${workId}_f3",
    "section": "Data Analysis",
    "question": "3. Complete the following table with the missing values.",
    "type": "table",
    "tableData": [
      ["Trial", "Time (s)", "Distance (m)"],
      ["1", "2.0", ""],
      ["2", "4.0", ""]
    ],
    "page": 2
  },
  {
    "id": "${workId}_f4",
    "section": "Practice",
    "question": "4. Mark whether the statements are true (✓) or false (✕).",
    "type": "tick-cross",
    "page": 2
  },
  {
    "id": "${workId}_f5",
    "section": "Practice",
    "question": "5. Reorder the following steps in the correct sequence.",
    "type": "reorder",
    "items": ["Absorb Light", "Split Water", "Fix Carbon"],
    "page": 3
  }
]

Field Definitions:
- "id": "${workId}_f[number]" (Unique ID matching the internal ID)
- "question": Full text of the question.
- "type": 
  * "short-response" (open text)
  * "mcq" (requires "options": array of strings)
  * "table" (requires "tableData": 2D array of strings. Use "" for cells where user input is required, and pre-fill other cells with headers or data.)
  * "tick-cross" (binary selection of ✓ or ✕)
  * "reorder" (requires "items": array of strings in random initial order)
- "page": The exact integer page number (1-indexed) in the PDF where this question is located. CRITICAL: You MUST accurately identify the page number from the PDF for each question and NOT simply default to 1.

Output ONLY the raw JSON array.`;
                          navigator.clipboard.writeText(prompt);
                          alert("Questions prompt copied!");
                        }}
                        className="flex items-center gap-1 text-[10px] uppercase font-black tracking-widest bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-100 transition-all"
                      >
                        <Copy size={12} /> Copy Prompt
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyGemInstructions}
                        className="flex items-center gap-1 text-[10px] uppercase font-black tracking-widest bg-violet-50 text-violet-600 px-3 py-1.5 rounded-lg border border-violet-200 hover:bg-violet-100 transition-all"
                      >
                        <Copy size={12} /> GEM Instructions
                      </button>
                    </div>
                  </div>

                  {showQuestionsPrompt && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 text-[10px] text-purple-900 font-mono whitespace-pre-wrap leading-relaxed shadow-inner mb-4">
                        {`Parse worksheet into questions array.
Example: { "id": "${(newTask.title || 'task').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}_f1", "question": "...", "type": "short-response", "page": 1 }`}
                      </div>
                    </motion.div>
                  )}

                  <div className="text-[10px] text-gray-400 mb-1 leading-tight">Provide a JSON array of questions to make the PDF interactive. <br/> Leave blank for standard non-interactive task.</div>
                  <textarea 
                    value={worksheetQuestionsJson}
                    onChange={e => setWorksheetQuestionsJson(e.target.value)}
                    className="w-full h-32 p-4 rounded-2xl border-2 border-gray-100 font-mono text-xs focus:border-purple-500 outline-none resize-none custom-scrollbar"
                    placeholder='[&#10;  { "id": "q1", "text": "What is...", "type": "short-response", "page": 1 }&#10;]'
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Markscheme JSON (or text)</label>
                    <div className="flex gap-2">
                       <button
                        type="button"
                        onClick={() => setShowMarkschemePrompt(!showMarkschemePrompt)}
                        className="text-[10px] uppercase font-black tracking-widest bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-all"
                      >
                        {showMarkschemePrompt ? 'Hide Prompt' : 'Show Prompt'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const workId = (newTask.title || 'task').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                          const prompt = `You are an expert examiner. Parse the markscheme for this worksheet.
Target Worksheet Title: ${newTask.title || '[Untitled Task]'}
Target Internal ID: ${workId}

Output a STRICT JSON object mapping question IDs to their grading criteria.
IDs MUST match the worksheet ones (e.g., "${workId}_f1").

Example:
{
  "${workId}_f1": {
    "correctAnswer": "Iron(III) oxide",
    "points": 1,
    "rubric": "1 mark for naming iron(III) oxide.",
    "keywords": ["iron", "oxide"]
  }
}

Output ONLY the raw JSON object. No markdown wrappers.`;
                          navigator.clipboard.writeText(prompt);
                          alert("Markscheme prompt copied!");
                        }}
                        className="flex items-center gap-1 text-[10px] uppercase font-black tracking-widest bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-100 transition-all"
                      >
                        <Copy size={12} /> Copy Prompt
                      </button>
                    </div>
                  </div>

                  {showMarkschemePrompt && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-[10px] text-emerald-900 font-mono whitespace-pre-wrap leading-relaxed shadow-inner mb-4">
                        {`Generate markscheme mapping for auto-grading.
Example Key: "${(newTask.title || 'task').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}_f1"`}
                      </div>
                    </motion.div>
                  )}

                  <div className="text-[10px] text-gray-400 mb-1 leading-tight">Used by the AI for auto-grading interactive worksheet submissions.</div>
                  <textarea 
                    value={markschemeContent}
                    onChange={e => setMarkschemeContent(e.target.value)}
                    className="w-full h-32 p-4 rounded-2xl border-2 border-gray-100 font-mono text-xs focus:border-purple-500 outline-none resize-none custom-scrollbar"
                    placeholder="Provide the grading rubric and answers here..."
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-12 bg-white sticky bottom-0 pt-4 border-t-2 border-emerald-50">
              <button 
                type="button"
                onClick={() => setIsCreatorOpen(false)}
                className="px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs text-gray-400 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-[0_6px_0_0_#059669] active:translate-y-1 active:shadow-none transition-all"
              >
                Launch Task
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {editingTask && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[600] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-[3rem] p-6 lg:p-10 shadow-xl max-w-6xl w-full mx-auto max-h-[95vh] flex flex-col overflow-y-auto"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 shrink-0 pb-6 border-b border-white/10">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-white/20 rounded-[1.5rem] border border-white/20 flex items-center justify-center text-white shadow-inner">
                  <Plus size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">Edit Worksheet Details</h2>
                  <p className="text-white/60 font-medium text-[10px] tracking-widest uppercase">Update the task name, dates, questions, and markscheme.</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                <button 
                  type="button"
                  onClick={() => {
                    setEditingTask(null);
                    setEditingTaskQuestionsJson('');
                    setEditingTaskMarkscheme('');
                  }}
                  className="flex-1 md:flex-none px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] text-white/60 hover:bg-white/10 hover:text-white border border-transparent transition-all"
                >
                  Discard
                </button>
              <button 
                onClick={async () => {
                 if (onUpdateTask) {
                   let parsedQ = editingTask.worksheetQuestions;
                   try {
                     if (editingTaskQuestionsJson.trim()) {
                       parsedQ = JSON.parse(editingTaskQuestionsJson);
                     } else {
                       parsedQ = [];
                     }
                   } catch(e) { 
                     alert("Invalid JSON for questions. Continuing without modifying questions block."); 
                   }
                   await onUpdateTask(editingTask.id, { 
                     title: editingTask.title, 
                     dueDate: editingTask.dueDate,
                     worksheetQuestions: parsedQ,
                     markschemeContent: editingTaskMarkscheme || undefined
                   });
                 }
                 setEditingTask(null);
                 setEditingTaskQuestionsJson('');
                 setEditingTaskMarkscheme('');
                }}
                className="flex-1 md:flex-none bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-[0_4px_0_0_#059669] active:translate-y-1 active:shadow-none transition-all"
              >
                Save
              </button>
            </div>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
            {/* Left Column: Properties */}
            <div className="w-full lg:w-1/3 flex flex-col gap-6 shrink-0">
              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex flex-col justify-center gap-3">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Task Name</label>
                <input 
                  type="text" 
                  value={editingTask.title}
                  onChange={e => setEditingTask({...editingTask, title: e.target.value})}
                  className="w-full p-4 rounded-2xl border-2 border-white font-bold bg-white focus:border-emerald-500 outline-none text-base shadow-sm"
                />
              </div>

              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex flex-col justify-center gap-3">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">PDF URL</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Link2 size={16} />
                  </div>
                  <input 
                    type="text" 
                    value={editingTask.pdfUrl || ''}
                    onChange={e => setEditingTask({...editingTask, pdfUrl: e.target.value})}
                    placeholder="https://example.com/file.pdf"
                    className="w-full p-4 pl-12 rounded-2xl border-2 border-white bg-white font-bold outline-none focus:border-emerald-500 shadow-sm text-sm"
                  />
                </div>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex flex-col justify-center gap-3">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Due Date</label>
                <input 
                  type="date" 
                  value={editingTask.dueDate.split('T')[0]}
                  onChange={e => setEditingTask({...editingTask, dueDate: e.target.value})}
                  className="w-full p-4 rounded-2xl border-2 border-white bg-white font-bold outline-none focus:border-emerald-500 shadow-sm"
                />
              </div>
            </div>

            {/* Right Column: JSON Configs */}
            <div className="w-full lg:w-2/3 flex flex-col md:flex-row gap-6 min-h-0">
              <div className="flex-1 flex flex-col h-64 md:h-[400px]">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Questions JSON</label>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                         navigator.clipboard.writeText(`Generate a balanced set of 10 questions in JSON format. include MCQ, Short Response, and Table types. use IDs like "test_${Date.now()}_q1".\n1. "mcq" (requires "options": array of strings)\n2. "short-response"\n3. "table" (requires "tableData": 2D array of strings. Use "" for cells where user input is required, and pre-fill other cells with headers or data.)\n4. "tick-cross" (binary selection of ✓ or ✕)\n5. "reorder" (requires "items": array of strings in random initial order)\nOutput a STRICT JSON array.`);
                         alert('Prompt Copied!');
                      }}
                      className="flex items-center gap-1 text-[9px] font-black uppercase text-emerald-500 hover:bg-emerald-50 px-2 py-1 rounded-md transition-colors"
                    >
                      <Copy size={12} /> Prompt
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyGemInstructions}
                      className="flex items-center gap-1 text-[9px] font-black uppercase text-violet-500 hover:bg-violet-50 px-2 py-1 rounded-md transition-colors"
                    >
                      <Copy size={12} /> GEM Instructions
                    </button>
                  </div>
                </div>
                <textarea 
                  value={editingTaskQuestionsJson}
                  onChange={e => setEditingTaskQuestionsJson(e.target.value)}
                  className="w-full flex-1 p-5 rounded-2xl border-2 border-gray-100 font-mono text-[10px] leading-relaxed focus:border-emerald-500 outline-none resize-none custom-scrollbar bg-slate-50/50 shadow-inner"
                  placeholder="[ { id: 'q1', type: 'short-response', ... } ]"
                />
              </div>
              
              <div className="flex-1 flex flex-col h-64 md:h-[400px]">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Markscheme Text/JSON</label>
                  <button 
                    onClick={() => {
                       navigator.clipboard.writeText(`Generate a markscheme for the provided questions. It should contain detailed criteria for each question to guide the grading process.`);
                       alert('Prompt Copied!');
                    }}
                    className="flex items-center gap-1 text-[9px] font-black uppercase text-emerald-500 hover:bg-emerald-50 px-2 py-1 rounded-md transition-colors"
                  >
                    <Copy size={12} /> Prompt
                  </button>
                </div>
                <textarea 
                  value={editingTaskMarkscheme}
                  onChange={e => setEditingTaskMarkscheme(e.target.value)}
                  className="w-full flex-1 p-5 rounded-2xl border-2 border-gray-100 font-mono text-[10px] leading-relaxed focus:border-emerald-500 outline-none resize-none custom-scrollbar bg-slate-50/50 shadow-inner"
                  placeholder="Content that AI will evaluate against"
                />
              </div>
            </div>
          </div>
        </motion.div>
        </div>
      )}
      
      {activeTab === 'analytics' && isAdmin ? (
        <Analytics tasks={tasks} allSubmissions={allSubmissions} />
      ) : activeTab === 'submissions' && isAdmin ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 bg-slate-950/80 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-transparent to-emerald-500/10 opacity-50 group-hover:opacity-80 transition-opacity duration-1000" />
              <div className="flex items-center gap-8 flex-1 relative z-10">
                <div>
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase tracking-[0.3em] rounded-lg border border-emerald-500/20">Administrative Intelligence</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,1)]" />
                  </div>
                  <h3 className="text-4xl font-black text-white tracking-tighter leading-none mb-1.5">Grading Inbox</h3>
                </div>
              </div>
  
              <div className="w-full md:w-[380px] relative group z-10">
                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                  <List className="text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={18} />
                </div>
                <input 
                  type="text"
                  placeholder="Filter by student or assessment..."
                  value={submissionFilter}
                  onChange={(e) => setSubmissionFilter(e.target.value)}
                  className="w-full pl-14 pr-8 py-4 rounded-[2rem] border border-white/10 font-black text-[10px] uppercase tracking-[0.2em] focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500/50 outline-none transition-all bg-white/5 backdrop-blur-xl text-white placeholder:text-slate-600 shadow-2xl"
                />
              </div>
            </div>
           
           <div className="space-y-12">
             {Object.keys(submissionsByTask).length === 0 ? (
               <div className="col-span-full py-40 flex flex-col items-center justify-center text-center bg-slate-900/50 backdrop-blur-3xl rounded-[4rem] border border-white/5 shadow-2xl">
                 <div className="w-32 h-32 bg-slate-950 rounded-[2.5rem] flex items-center justify-center text-slate-700 mb-10 border border-white/5 shadow-inner group transition-transform hover:scale-110 duration-700">
                   <Inbox size={64} className="group-hover:text-emerald-500 transition-colors" />
                 </div>
                 <h3 className="font-black text-white uppercase tracking-[0.3em] text-lg mb-4 leading-none">Vortex Status: Empty</h3>
                 <p className="text-slate-500 font-medium max-w-md leading-relaxed text-sm">Waiting for incoming student intelligence streams. Data will synchronize here automatically.</p>
               </div>
             ) : (Object.entries(submissionsByTask) as [string, TaskSubmission[]][]).map(([taskId, subs]) => {
               const task = tasks.find(t => t.id === taskId) || { id: taskId, title: `Unlinked Task (${taskId})`, dueDate: new Date().toISOString(), type: "worksheet" } as Task;
               
               const filteredSubs = subs.filter(s => 
                 s.studentName.toLowerCase().includes(submissionFilter.toLowerCase()) || 
                 task.title.toLowerCase().includes(submissionFilter.toLowerCase())
               );

               if (filteredSubs.length === 0) return null;
               const ungradedCount = filteredSubs.filter(s => !s.feedback).length;
               
               const gradedSubs = filteredSubs.filter(s => !!s.feedback && s.results?.score !== undefined && s.results?.total !== undefined);
               let avgScore = 0, avgPercent = 0, highScore = 0, highPercent = 0, lowScore = 0, lowPercent = 0;
               let chartData:any[] = [];
               if (gradedSubs.length > 0) {
                 const scores = gradedSubs.map(s => ({ score: s.results!.score, total: s.results!.total, percent: (s.results!.score / s.results!.total) * 100 }));
                 const scoreVals = scores.map(s => s.score);
                 const percentVals = scores.map(s => s.percent);
                 avgScore = scoreVals.reduce((a,b)=>a+b,0) / scores.length;
                 avgPercent = percentVals.reduce((a,b)=>a+b,0) / scores.length;
                 highScore = Math.max(...scoreVals);
                 highPercent = Math.max(...percentVals);
                 lowScore = Math.min(...scoreVals);
                 lowPercent = Math.min(...percentVals);

                 chartData = [
                   { name: '0-20%', count: percentVals.filter(p => p <= 20).length },
                   { name: '21-40%', count: percentVals.filter(p => p > 20 && p <= 40).length },
                   { name: '41-60%', count: percentVals.filter(p => p > 40 && p <= 60).length },
                   { name: '61-80%', count: percentVals.filter(p => p > 60 && p <= 80).length },
                   { name: '81-100%', count: percentVals.filter(p => p > 80 && p <= 100).length }
                 ];
               }
               const isAnalyticsShown = showAnalyticsMap[taskId] || false;
               const isStudentMode = chartModeMap[taskId] === 'students';
               const sortedSubs = [...gradedSubs].sort((a,b) => (a.results!.score - b.results!.score));
               const studentChartData = sortedSubs.map(s => ({
                 name: s.studentName,
                 score: s.results!.score,
                 percent: (s.results!.score / s.results!.total) * 100
               }));
 
               return (
                 <section key={taskId} className="space-y-16">
                   <div className="flex flex-col xl:flex-row xl:items-center justify-between border-b border-slate-200/80 pb-12 mb-4 gap-10">
                     <div className="flex items-center gap-10">
                       <div>
                         <div className="flex items-center gap-4 mb-3">
                            <div className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-[0.25em] rounded-lg border border-emerald-500/20">Protocol Active</div>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,1)] animate-pulse" />
                         </div>
                         <h4 className="font-black text-slate-950 text-[1.75rem] uppercase tracking-tighter leading-none mb-3">
                           {task.title}
                         </h4>
                         <div className="flex items-center gap-6">
                           <div className="flex items-center gap-3 text-slate-400">
                              <Clock size={18} className="text-blue-500" />
                              <span className="text-[11px] font-black uppercase tracking-[0.15em] opacity-60">Due date: {format(new Date(task.dueDate), 'PPP')}</span>
                           </div>
                         </div>
                       </div>
                     </div>

                     <div className="flex flex-wrap items-center gap-10">
                       <div className="flex flex-row flex-wrap gap-3">
                         <button 
                           onClick={() => filteredSubs.forEach(s => generateResponsePDF(s, task, false))}
                           className="bg-white/90 backdrop-blur-xl border border-slate-200 text-slate-500 hover:bg-slate-900 hover:text-white px-5 py-4 rounded-[1.2rem] transition-all duration-300 flex items-center justify-center gap-3 shadow-sm hover:shadow-xl group/cmd"
                         >
                           <div className="w-7 h-7 rounded-[0.6rem] bg-slate-100 group-hover/cmd:bg-white/20 flex items-center justify-center transition-colors text-current">
                             <Download size={14} /> 
                           </div>
                           <span className="text-[10px] uppercase font-black tracking-[0.2em] hidden sm:inline">Raw PDF</span>
                         </button>
                         <button 
                           onClick={() => filteredSubs.filter(s => s.feedback).forEach(s => generateResponsePDF(s, task, true))}
                           className="bg-emerald-50/90 backdrop-blur-xl border border-emerald-200 text-emerald-600 hover:bg-emerald-600 hover:border-emerald-500 hover:text-white px-5 py-4 rounded-[1.2rem] transition-all duration-300 flex items-center justify-center gap-3 shadow-sm hover:shadow-xl group/cmd"
                         >
                           <div className="w-7 h-7 rounded-[0.6rem] bg-emerald-100 group-hover/cmd:bg-emerald-500/80 group-hover/cmd:border-emerald-400 flex items-center justify-center transition-colors border border-emerald-200 text-current">
                             <Download size={14} /> 
                           </div>
                           <span className="text-[10px] uppercase font-black tracking-[0.2em] hidden sm:inline">Report PDF</span>
                         </button>
                         <button 
                           onClick={() => setShowAnalyticsMap(prev => ({...prev, [taskId]: !prev[taskId]}))}
                           className={`${isAnalyticsShown ? 'bg-indigo-600 border-indigo-500 text-white shadow-indigo-500/20 shadow-lg' : 'bg-indigo-50/90 border-indigo-200 text-indigo-600 hover:bg-indigo-100 shadow-sm hover:shadow-md'} backdrop-blur-xl border px-5 py-4 rounded-[1.2rem] transition-all duration-300 flex items-center justify-center gap-3 group/cmd`}
                         >
                           <div className={`w-7 h-7 rounded-[0.6rem] flex items-center justify-center transition-colors border text-current ${isAnalyticsShown ? 'bg-indigo-500/80 border-indigo-400' : 'bg-indigo-100 border-indigo-200 group-hover/cmd:bg-indigo-200'}`}>
                             <Target size={14} /> 
                           </div>
                           <span className="text-[10px] uppercase font-black tracking-[0.2em] hidden sm:inline">Analytics</span>
                         </button>
                       </div>

                       <div className="hidden xl:block h-24 w-px bg-slate-200/80" />

                        <div className="flex flex-col gap-2">
                          <div className="flex gap-3">
                            <div className="bg-white/80 backdrop-blur-xl px-6 py-4 rounded-[1.2rem] border border-slate-200 shadow-sm text-center min-w-[120px] flex flex-col justify-center transition-all hover:bg-white hover:shadow-md">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-70 whitespace-nowrap">Total</p>
                              <p className="text-3xl font-black text-slate-950 leading-none">{filteredSubs.length}</p>
                            </div>
                            {ungradedCount > 0 && (
                              <div className="bg-rose-50/80 backdrop-blur-xl px-6 py-4 rounded-[1.2rem] border border-rose-200 shadow-sm text-center min-w-[120px] flex flex-col justify-center transition-all hover:bg-rose-100 hover:shadow-md">
                                <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1 opacity-80">Pending</p>
                                <p className="text-3xl font-black text-rose-600 leading-none">{ungradedCount}</p>
                              </div>
                            )}
                          </div>
                          <button 
                            onClick={() => setCardAspectMap(prev => ({...prev, [taskId]: prev[taskId] === 'tall' ? 'default' : 'tall'}))}
                            className="text-[9px] uppercase font-black tracking-widest text-slate-500 hover:text-slate-900 border border-slate-200 bg-white/50 hover:bg-white/80 px-3 py-1.5 rounded-lg w-full transition-colors"
                          >
                            {cardAspectMap[taskId] === 'tall' ? 'Default View' : 'Tall Cards (3:4)'}
                          </button>
                        </div>
                     </div>
                   </div>

                   <AnimatePresence>
                     {isAnalyticsShown && gradedSubs.length > 0 && (
                       <motion.div
                         initial={{ opacity: 0, height: 0, scale: 0.95 }}
                         animate={{ opacity: 1, height: 'auto', scale: 1 }}
                         exit={{ opacity: 0, height: 0, scale: 0.95 }}
                         className="mb-8 overflow-hidden"
                       >
                         <div className="bg-white/80 backdrop-blur-xl border border-indigo-100 rounded-[2.5rem] p-8 shadow-xl flex flex-col xl:flex-row gap-8">
                           <div className="flex-1 xl:w-2/3 h-[300px] flex flex-col">
                             <div className="flex justify-between items-center mb-6">
                               <h4 className="font-black text-indigo-900 uppercase tracking-widest text-[9px]">
                                 {isStudentMode ? 'Score by Student' : 'Score Distribution'}
                               </h4>
                               <button 
                                 onClick={() => setChartModeMap(prev => ({...prev, [taskId]: isStudentMode ? 'distribution' : 'students'}))}
                                 className="text-[9px] px-3 py-1.5 bg-indigo-100 text-indigo-600 rounded-lg font-black uppercase tracking-widest hover:bg-indigo-200 transition-colors border border-indigo-200"
                               >
                                 Toggle View
                               </button>
                             </div>
                             <div className="flex-1 min-h-[250px]">
                               {isStudentMode ? (
                                 <ResponsiveContainer width="100%" height="100%">
                                   <BarChart data={studentChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E7FF" />
                                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6366F1', fontWeight: 600 }} dy={10} />
                                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6366F1', fontWeight: 600 }} />
                                     <Tooltip 
                                       cursor={{ fill: '#EEF2FF' }}
                                       contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                                     />
                                     <Bar dataKey="percent" radius={[8, 8, 0, 0]}>
                                       {
                                         studentChartData.map((entry, index) => {
                                           const studentColors = ['#F87171', '#FBBF24', '#34D399', '#60A5FA', '#A78BFA', '#F472B6', '#38BDF8', '#4ADE80'];
                                           return <Cell key={`cell-${index}`} fill={studentColors[index % studentColors.length]} />
                                         })
                                       }
                                     </Bar>
                                   </BarChart>
                                 </ResponsiveContainer>
                               ) : (
                                 <ResponsiveContainer width="100%" height="100%">
                                   <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E7FF" />
                                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6366F1', fontWeight: 600 }} dy={10} />
                                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6366F1', fontWeight: 600 }} />
                                     <Tooltip 
                                       cursor={{ fill: '#EEF2FF' }}
                                       contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                                     />
                                     <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                                       {
                                         chartData.map((entry, index) => {
                                           const categoryColors = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6'];
                                           return <Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />
                                         })
                                       }
                                     </Bar>
                                   </BarChart>
                                 </ResponsiveContainer>
                               )}
                             </div>
                           </div>
                           <div className="flex-1 xl:w-1/3 flex flex-col justify-center gap-4">
                             <h4 className="font-black text-indigo-900 uppercase tracking-widest text-[9px] mb-2">Performance Dashboard</h4>
                             <div className="bg-indigo-50/50 p-6 rounded-[1.5rem] border border-indigo-100 flex items-center justify-between">
                               <div>
                                 <p className="text-[9px] uppercase font-black tracking-[0.2em] text-indigo-400 mb-1">Average Performance</p>
                                 <div className="flex items-baseline gap-2">
                                   <span className="text-3xl font-black text-indigo-900">{avgScore.toFixed(1)}</span>
                                   <span className="text-sm font-bold text-indigo-500">pts</span>
                                   <span className="text-xl pl-2 font-black text-indigo-600">({(avgPercent).toFixed(1)}%)</span>
                                 </div>
                               </div>
                             </div>
                             
                             <div className="bg-emerald-50/50 p-6 rounded-[1.5rem] border border-emerald-100 flex items-center justify-between">
                               <div>
                                 <p className="text-[9px] uppercase font-black tracking-[0.2em] text-emerald-500 mb-1">Highest Score</p>
                                 <div className="flex items-baseline gap-2">
                                   <span className="text-3xl font-black text-emerald-900">{highScore}</span>
                                   <span className="text-sm font-bold text-emerald-600">pts</span>
                                   <span className="text-xl pl-2 font-black text-emerald-600">({(highPercent).toFixed(1)}%)</span>
                                 </div>
                               </div>
                             </div>

                             <div className="bg-rose-50/50 p-6 rounded-[1.5rem] border border-rose-100 flex items-center justify-between">
                               <div>
                                 <p className="text-[9px] uppercase font-black tracking-[0.2em] text-rose-400 mb-1">Lowest Score</p>
                                 <div className="flex items-baseline gap-2">
                                   <span className="text-3xl font-black text-rose-900">{lowScore}</span>
                                   <span className="text-sm font-bold text-rose-500">pts</span>
                                   <span className="text-xl pl-2 font-black text-rose-600">({(lowPercent).toFixed(1)}%)</span>
                                 </div>
                               </div>
                             </div>
                           </div>
                         </div>
                       </motion.div>
                     )}
                   </AnimatePresence>

                  <div className={`grid gap-6 ${cardAspectMap[taskId] === 'tall' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3'}`}>
                    <AnimatePresence mode="popLayout">
                      {filteredSubs.map((sub) => {
                        const isGraded = !!sub.feedback;
                        const statusText = task.type === 'test' ? 'TEST' : 'WORKSHEET';
                        const isTall = cardAspectMap[taskId] === 'tall';

                        return (
                          <motion.div 
                            key={sub.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            whileHover={{ y: -5, scale: 1.01 }}
                            className={`group relative ${isTall ? 'p-4 aspect-[3/4]' : 'p-5'} rounded-[2rem] transition-all duration-500 flex flex-col justify-between overflow-hidden shadow-xl text-white ${
                              task.type === 'test' 
                                ? 'bg-gradient-to-br from-red-600 to-rose-700' 
                                : 'bg-gradient-to-br from-orange-400 to-amber-600'
                            } border-b-4 ${task.type === 'test' ? 'border-red-900' : 'border-orange-700'}`}
                          >
                            <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-[80px] bg-white/5 opacity-0 group-hover:opacity-20 transition-opacity duration-700 z-10" />
                            
                            {isGraded && (
                              <div className="absolute inset-0 pointer-events-none z-0">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-[200%] h-full animate-[shine_3s_infinite_ease-in-out]" />
                              </div>
                            )}

                            <div className="relative z-10 flex flex-col h-full">
                              <div className={`flex items-start ${isTall ? 'flex-col gap-2 mb-2' : 'justify-between mb-4'}`}>
                                <div className="flex items-center gap-3 pr-2">
                                  <div className={`w-10 h-10 ${!isTall && 'sm:w-12 sm:h-12'} rounded-[1rem] flex items-center justify-center transition-colors duration-500 shrink-0 ${isGraded ? 'bg-white/20 text-white' : 'bg-white/10 text-white group-hover:bg-white group-hover:text-slate-900 border border-white/10 shadow-sm'}`}>
                                    <User size={18} />
                                  </div>
                                  <div>
                                    <h4 className={`font-black text-white uppercase line-clamp-2 tracking-tight ${isTall ? 'text-sm' : 'text-base'}`}>{sub.studentName}</h4>
                                    <p className="text-[8px] font-black text-white/60 uppercase tracking-[0.2em]">Subject</p>
                                  </div>
                                </div>
                                <div className={`flex flex-col ${isTall ? 'items-start' : 'items-end'} gap-2 shrink-0`}>
                                  {isGraded && (
                                    <div className="bg-white/10 backdrop-blur-md px-2 py-0.5 border border-white/20 rounded-lg text-white text-[8px] font-black uppercase tracking-widest shadow-sm">
                                      Graded
                                    </div>
                                  )}
                                </div>
                              </div>

                               <div className={`flex ${isTall ? 'flex-col flex-1 shrink min-h-0' : ''} gap-2 mb-2`}>
                                 <div className={`flex-1 bg-white/10 ${isTall ? 'rounded-xl p-2' : 'rounded-[1.2rem] p-3'} border border-white/10 flex flex-col justify-center transition-colors group-hover:bg-white/20`}>
                                   <p className="text-[8px] font-black text-white/60 uppercase tracking-[0.2em] mb-1 text-center">Score</p>
                                   <p className={`font-black text-center ${isTall ? 'text-base' : 'text-lg'} ${isGraded ? 'text-white' : 'text-white/40 italic text-xs'}`}>
                                     {isGraded ? `${sub.results?.score} of ${sub.results?.total}` : 'Pending'}
                                   </p>
                                 </div>
                                 <div className={`flex-1 bg-white/10 ${isTall ? 'rounded-xl p-2' : 'rounded-[1.2rem] p-3'} border border-white/10 flex flex-col justify-center transition-colors group-hover:bg-white/20`}>
                                   <p className="text-[8px] font-black text-white/60 uppercase tracking-[0.2em] mb-1 text-center">Date</p>
                                   <p className={`text-center font-black text-white tracking-tight ${isTall ? 'text-xs' : 'text-xs'}`}>{format(new Date(sub.completedAt), 'MMM d')}</p>
                                 </div>
                               </div>

                             <div className="space-y-2 mt-auto relative z-10">
                               {onViewSubmission && (
                                 <button 
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     onViewSubmission(sub, task);
                                   }}
                                   className={`w-full flex items-center justify-center gap-2 ${isTall ? 'py-1.5' : 'py-2.5'} rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white hover:text-slate-900 transition-all duration-300 shadow-sm group/btn`}
                                 >
                                   <div className={`w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center group-hover/btn:scale-110 transition-transform text-current`}>
                                     {isGraded ? <Eye size={12} /> : <Target size={12} />}
                                   </div>
                                   <span className="font-black uppercase tracking-[0.2em] text-[9px]">{isGraded ? 'GRADE' : 'Grade Intake'}</span>
                                 </button>
                               )}
                               
                               <div className="grid grid-cols-3 gap-1.5">
                                 <button 
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     generateResponsePDF(sub, task, false);
                                   }}
                                   className={`flex flex-col items-center justify-center gap-1 ${isTall ? 'py-1.5' : 'py-2.5'} rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white hover:text-slate-900 transition-all duration-300 shadow-sm group/btn`}
                                 >
                                   <div className="w-5 h-5 rounded-[0.4rem] bg-white/20 flex items-center justify-center group-hover/btn:scale-110 transition-transform text-current">
                                     <Download size={10} />
                                   </div>
                                   <span className="text-[6px] font-black uppercase tracking-tight">Raw PDF</span>
                                 </button>
                                 
                                 {isGraded ? (
                                   <button 
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       generateResponsePDF(sub, task, true);
                                     }}
                                     className={`flex flex-col items-center justify-center gap-1 ${isTall ? 'py-1.5' : 'py-2.5'} rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white hover:text-slate-900 transition-all duration-300 shadow-sm group/btn`}
                                   >
                                     <div className="w-5 h-5 rounded-[0.4rem] bg-white/20 flex items-center justify-center group-hover/btn:scale-110 transition-transform text-current">
                                       <FileText size={10} />
                                     </div>
                                     <span className="text-[6px] font-black uppercase tracking-tight">Report PDF</span>
                                     </button>
                                 ) : <div className="rounded-xl bg-white/5 border border-white/5" />}
                                 
                                 {isAdmin && onDeleteSubmission ? (
                                   <button 
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       setDeleteConfirmation({ id: sub.id, type: 'submission', title: `${sub.studentName}'s submission` });
                                     }}
                                     className={`flex flex-col items-center justify-center gap-1 ${isTall ? 'py-1.5' : 'py-2.5'} rounded-xl bg-white/10 border border-white/20 text-white hover:bg-rose-500 hover:text-white transition-all duration-300 shadow-sm group/btn`}
                                   >
                                     <div className="w-5 h-5 rounded-[0.4rem] bg-white/20 flex items-center justify-center group-hover/btn:scale-110 transition-transform text-current">
                                       <Trash2 size={10} />
                                     </div>
                                     <span className="text-[6px] font-black uppercase tracking-tight">Delete</span>
                                   </button>
                                 ) : <div className="rounded-xl bg-white/5 border border-white/5" />}
                               </div>
                             </div>
                            </div>
                          </motion.div>
                         );
                       })}
                     </AnimatePresence>
                   </div>
                 </section>
               );
             })}
           </div>
        </div>
      ) : activeTab === 'tasks' ? (
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6">                {tasks.map(task => {
                  const isCompleted = mySubmissions.some(sub => sub.taskId === task.id);
                  const submission = mySubmissions.find(sub => sub.taskId === task.id);
                  const taskDate = task.dueDate.includes('T') ? parseISO(task.dueDate) : new Date(task.dueDate + 'T00:00:00');
                  const isSelectedDate = isSameDay(startOfDay(taskDate), startOfDay(selectedDate));
                  const isTest = task.type === 'test';
                  
                  return (
                    <motion.div 
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -5 }}
                      onClick={() => {
                        if (isAdmin && isTest) {
                          setSelectedTaskForPasscode(task);
                          setEditingTaskQuestionsJson(task.worksheetQuestions && task.worksheetQuestions.length ? JSON.stringify(task.worksheetQuestions, null, 2) : '');
                          setEditingTaskMarkscheme(task.markschemeContent || '');
                          setIsPasscodeModalOpen(true);
                        } else if (isAdmin && onUpdateTask) {
                          setEditingTask(task);
                          setEditingTaskQuestionsJson(task.worksheetQuestions && task.worksheetQuestions.length ? JSON.stringify(task.worksheetQuestions, null, 2) : '');
                          setEditingTaskMarkscheme(task.markschemeContent || '');
                        } else if (!isAdmin && isTest && !isCompleted) {
                          setSelectedTaskForPasscode(task);
                          setIsPasscodeModalOpen(true);
                        } else if (!isAdmin && !isCompleted) {
                          onStartTask(task);
                        }
                      }}
                      className={`rounded-[2.5rem] p-6 shadow-xl text-white cursor-pointer relative overflow-hidden group h-full flex flex-col min-h-[220px] transition-all backdrop-blur-xl border border-white/20
                        ${isSelectedDate ? 'ring-4 ring-offset-4 ring-emerald-400' : ''}
                        ${isCompleted 
                          ? 'bg-gradient-to-br from-emerald-500/90 to-teal-600/90 shadow-emerald-500/20' 
                          : isTest 
                            ? 'bg-gradient-to-br from-red-500/90 to-rose-700/90 shadow-red-500/20'
                            : 'bg-gradient-to-br from-orange-400/90 to-amber-600/90 shadow-orange-500/20'}
                      `}
                    >
                      {isTest && !isCompleted && (
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-transparent to-red-500 animate-pulse opacity-50" />
                      )}
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        {isCompleted ? <CheckCircle2 size={100} /> : isTest ? <ShieldCheck size={100} /> : <Clock size={100} />}
                      </div>
                      
                      <div className="relative z-10 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3 pr-2">
                            <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center transition-colors duration-500 shrink-0 ${isCompleted ? 'bg-white/20 text-white border border-white/20' : 'bg-white/10 text-white group-hover:bg-white group-hover:text-slate-900 border border-white/10 shadow-sm'}`}>
                               {isCompleted ? <CheckCircle2 size={20} /> : isTest ? <ShieldCheck size={20} /> : <Target size={20} />}
                            </div>
                            <div>
                               <h4 className="font-black text-white text-base uppercase line-clamp-2 tracking-tight">{task.title}</h4>
                               <p className="text-[9px] font-black text-white/60 uppercase tracking-[0.2em]">{isTest ? (task.isABVersion ? 'SECURE EXAM A/B' : 'SECURE EXAM') : 'ASSIGNMENT'}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {isAdmin && isTest && (
                              <div 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRevealedKeys(prev => {
                                    const newSet = new Set(prev);
                                    if (newSet.has(task.id)) newSet.delete(task.id);
                                    else newSet.add(task.id);
                                    return newSet;
                                  });
                                }}
                                className="bg-red-600/50 hover:bg-red-600 text-white px-2 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest shadow-sm border border-red-400/30 cursor-pointer transition-colors whitespace-nowrap"
                              >
                                {revealedKeys.has(task.id) ? `KEY: ${task.passcode}` : 'CLICK TO REVEAL KEY'}
                              </div>
                            )}
                            <div className="px-3 py-1 rounded-xl border text-[8px] font-black uppercase tracking-[0.2em] shadow-sm bg-white/20 text-white border-white/20 whitespace-nowrap shrink-0">
                               {isCompleted ? 'DONE' : isTest ? 'TEST' : 'WORKSHEET'}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3 mb-2 flex-grow">
                          {isCompleted && submission?.feedback ? (
                            <div className="flex-1 bg-white/10 rounded-[1.2rem] p-3 border border-white/10 flex flex-col justify-center transition-colors group-hover:bg-white/20">
                              <p className="text-[9px] font-black text-white/60 uppercase tracking-[0.2em] mb-1 text-center">Score</p>
                              <p className="text-center font-black text-white tracking-tight text-lg">
                                {submission?.results?.score} of {submission?.results?.total}
                              </p>
                            </div>
                          ) : (
                            <>
                              <div className="flex-1 bg-white/10 rounded-[1.2rem] p-3 border border-white/10 flex flex-col justify-center transition-colors group-hover:bg-white/20">
                                <p className="text-[9px] font-black text-white/60 uppercase tracking-[0.2em] mb-1 text-center">Info</p>
                                <p className="text-center font-black text-white text-[10px] uppercase tracking-widest">{isTest ? `${task.timeLimit}m Limit` : 'No Limit'}</p>
                              </div>
                              <div className="flex-1 bg-white/10 rounded-[1.2rem] p-3 border border-white/10 flex flex-col justify-center transition-colors group-hover:bg-white/20">
                                <p className="text-[9px] font-black text-white/60 uppercase tracking-[0.2em] mb-1 text-center">Due</p>
                                <p className="text-center font-black text-white text-[10px] tracking-tight">{format(taskDate, 'MMM d')}</p>
                              </div>
                            </>
                          )}
                        </div>

                        {task.description && (
                          <p className={`text-white/70 text-[10px] font-bold mb-4 line-clamp-2 uppercase tracking-wide italic ${isTest ? 'text-red-200' : ''}`}>
                            {task.description}
                          </p>
                        )}



                        <div className="flex items-center gap-2 mt-auto pt-2">
                           {isAdmin && (
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setDeleteConfirmation({ id: task.id, type: 'task', title: task.title });
                               }}
                               className="w-[42px] h-[42px] flex flex-col items-center justify-center rounded-2xl bg-white/10 border border-white/20 text-white hover:bg-rose-500 hover:text-white transition-all duration-300 shadow-sm shrink-0 group/trash"
                               title="Delete Assignment"
                             >
                                <div className="w-7 h-7 rounded-[0.6rem] bg-white/20 flex items-center justify-center group-hover/trash:scale-110 transition-transform text-current">
                                  <Trash2 size={14} />
                                </div>
                             </button>
                           )}
                           
                           <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isCompleted && submission?.feedback) {
                                  generateResponsePDF(submission, task, true);
                                } else if (!isCompleted) {
                                  if (isTest) {
                                    setSelectedTaskForPasscode(task);
                                    setIsPasscodeModalOpen(true);
                                  } else {
                                    onStartTask(task);
                                  }
                                }
                              }}
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-white/10 border border-white/20 text-white hover:bg-white hover:text-slate-900 transition-all duration-300 shadow-sm group/btn h-[42px]"
                           >
                              <div className="w-7 h-7 rounded-[0.6rem] bg-white/20 flex items-center justify-center group-hover/btn:scale-110 transition-transform text-current">
                                 {isCompleted ? (submission?.feedback ? <FileText size={14} /> : <CheckCircle2 size={14} />) : <ArrowRight size={14} />}
                              </div>
                              <span className="font-black uppercase tracking-[0.2em] text-[10px]">
                                {isCompleted ? (submission?.feedback ? 'SEE REPORT' : 'PENDING GRADE') : 'START TASK'}
                              </span>
                           </button>
                        </div>
                      </div>
                  </motion.div>
                );
              })}

              {tasks.length === 0 && !isAdmin && (
                <div className="col-span-full py-12 flex flex-col items-center justify-center text-center bg-white rounded-3xl border-2 border-dashed border-gray-100">
                   <Clock size={48} className="text-gray-200 mb-4" />
                   <h3 className="font-black text-gray-300 uppercase tracking-widest text-xs">No tasks issued yet</h3>
                 </div>
               )}
            </div>
          </div>
        </div>
      ) : activeTab === 'reports' && !isAdmin ? (
        <div className="flex flex-col gap-6">
          <div className="bg-white/40 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/20 shadow-xl">
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-6">Completed Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mySubmissions.length === 0 ? (
                <div className="col-span-full py-12 flex flex-col items-center justify-center text-center">
                  <FileText size={48} className="text-slate-300 mb-4" />
                  <h3 className="font-black text-slate-400 uppercase tracking-widest text-xs">No reports available</h3>
                </div>
              ) : (
                mySubmissions.map(sub => {
                  const task = tasks.find(t => t.id === sub.taskId);
                  if (!task) return null;
                  const isGraded = !!sub.feedback;
                  
                  return (
                    <motion.div key={sub.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col">
                      <div className="flex items-start justify-between mb-4">
                        <div className="bg-blue-50 w-12 h-12 rounded-2xl flex items-center justify-center text-blue-500 shrink-0">
                          <FileText size={24} />
                        </div>
                        {isGraded && (
                          <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                            Graded
                          </div>
                        )}
                      </div>
                      <h3 className="text-lg font-black text-slate-800 mb-2">{task.title}</h3>
                      <div className="mt-auto pt-6 grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => generateResponsePDF(sub, task, false)}
                          className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 hover:bg-white hover:border-blue-200 hover:text-blue-600 transition-all shadow-sm"
                        >
                          <Download size={14} />
                          <span className="text-[8px] font-black uppercase tracking-widest">Raw Form</span>
                        </button>
                        {isGraded ? (
                          <button 
                            onClick={() => generateResponsePDF(sub, task, true)}
                            className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 hover:bg-white hover:border-emerald-200 hover:text-emerald-600 transition-all shadow-sm"
                          >
                            <FileText size={14} />
                            <span className="text-[8px] font-black uppercase tracking-widest">Report PDF</span>
                          </button>
                        ) : (
                          <div className="rounded-xl bg-slate-50 border border-slate-100 opacity-50 flex items-center justify-center">
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Pending Eval</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : activeTab === 'downloads' && !isAdmin ? (
        <div className="flex flex-col gap-6">
          <div className="bg-white/40 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/20 shadow-xl">
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-6">Task Downloads</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mySubmissions.length === 0 || !mySubmissions.some(sub => {
                const hasAttachments = Object.values(sub.responses || {}).some(val => Array.isArray(val) && val.some(file => file && file.url && file.name));
                const isGraded = !!sub.feedback;
                return hasAttachments || isGraded;
              }) ? (
                <div className="col-span-full py-12 flex flex-col items-center justify-center text-center">
                  <Download size={48} className="text-slate-300 mb-4" />
                  <h3 className="font-black text-slate-400 uppercase tracking-widest text-xs">No downloads available</h3>
                </div>
              ) : (
                mySubmissions.map(sub => {
                  const task = tasks.find(t => t.id === sub.taskId);
                  if (!task) return null;
                  
                  const hasAttachments = Object.values(sub.responses || {}).some(val => Array.isArray(val) && val.some(file => file && file.url && file.name));
                  const isGraded = !!sub.feedback;

                  if (!hasAttachments && !isGraded) return null;

                  return (
                    <motion.div key={sub.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="bg-indigo-50 w-12 h-12 rounded-2xl flex items-center justify-center text-indigo-500 shrink-0">
                          <Download size={24} />
                        </div>
                        <div className="flex-1 min-w-0 pr-4">
                          <h3 className="text-sm font-black text-slate-800 truncate">{task.title}</h3>
                          <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mt-1">Available Downloads</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {hasAttachments && (
                          <button 
                            onClick={() => downloadSubmissionAttachments(sub, task)}
                            className="w-full flex items-center justify-between p-4 bg-slate-50 text-slate-600 rounded-[1.25rem] hover:bg-indigo-500 hover:text-white transition-all shadow-sm group"
                          >
                             <div className="flex items-center gap-3">
                               <FileText size={18} className="text-indigo-400 group-hover:text-white" />
                               <span className="text-xs font-black uppercase tracking-widest">Attachments ZIP</span>
                             </div>
                             <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-indigo-500 group-hover:text-white">
                               <Download size={14} className="group-hover:scale-110 transition-transform" />
                             </div>
                          </button>
                        )}
                        {isGraded && (
                          <button 
                            onClick={() => downloadReportAndTaskPdf(sub, task)}
                            className="w-full flex items-center justify-between p-4 bg-slate-50 text-slate-600 rounded-[1.25rem] hover:bg-emerald-500 hover:text-white transition-all shadow-sm group"
                          >
                             <div className="flex items-center gap-3">
                               <Target size={18} className="text-emerald-400 group-hover:text-white" />
                               <span className="text-xs font-black uppercase tracking-widest">Report & Task ZIP</span>
                             </div>
                             <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-emerald-500 group-hover:text-white">
                               <Download size={14} className="group-hover:scale-110 transition-transform" />
                             </div>
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : null}

      <AnimatePresence>
        {showEasterNotice && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[500] flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl border-4 border-cyan-100"
            >
              <div className="bg-cyan-50 w-20 h-20 rounded-3xl flex items-center justify-center text-cyan-500 mx-auto mb-8">
                <Star size={40} className="animate-pulse" />
              </div>
              <h2 className="text-3xl font-black text-center text-gray-800 uppercase tracking-tight mb-6">Notice</h2>
              <div className="bg-gray-50 rounded-2xl p-6 mb-8 border-2 border-gray-100">
                <p className="text-gray-600 font-bold leading-relaxed text-center">
                  Welcome to the Easter assignment. Please read and answer these questions carefully. 
                  If your grade is below <span className="text-red-500 font-black">60%</span> or if you missed the assignment, 
                  you will have to sit for a written test paper on Tuesday so please answer the questions carefully. 
                  You will be asked to input your name at the end.
                </p>
              </div>
              
              <label className="flex items-center gap-4 mb-8 cursor-pointer group justify-center">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    checked={easterNoticeAgreed}
                    onChange={(e) => setEasterNoticeAgreed(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-8 h-8 rounded-xl border-4 transition-all flex items-center justify-center ${
                    easterNoticeAgreed ? 'bg-cyan-500 border-cyan-500' : 'border-gray-200 group-hover:border-cyan-200'
                  }`}>
                    {easterNoticeAgreed && <CheckCircle2 size={20} className="text-white" />}
                  </div>
                </div>
                <span className="text-gray-700 font-black uppercase tracking-widest text-sm">I agree to the terms</span>
              </label>

              <div className="flex gap-4">
                <button 
                  onClick={() => setShowEasterNotice(false)}
                  className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest border-2 border-gray-200 text-gray-400 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  disabled={!easterNoticeAgreed}
                  onClick={proceedToEasterAssignment}
                  className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${
                    easterNoticeAgreed 
                      ? 'bg-cyan-500 text-white shadow-[0_6px_0_0_#0891b2] active:shadow-none active:translate-y-1' 
                      : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  Start Quiz
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingRubricTask && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[700] flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[3rem] p-10 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border-4 border-emerald-50"
            >
              <div className="flex justify-between items-center mb-8 shrink-0 pb-6 border-b-2 border-emerald-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 shadow-inner">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Pre-processed Rubric</h2>
                    <p className="text-gray-500 font-medium text-xs">Review the AI-extracted grading criteria for {viewingRubricTask.title}.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setViewingRubricTask(null)}
                  className="p-3 hover:bg-gray-50 rounded-2xl transition-all text-gray-400 hover:text-red-500 group"
                >
                  <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 -mr-4 space-y-6 pb-4">
                {isLoadingRubric ? (
                   <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                     <RefreshCw size={40} className="animate-spin text-emerald-500" />
                     <p className="font-black uppercase tracking-[0.2em] text-[10px] text-emerald-600">Retrieving Rubric Data...</p>
                   </div>
                ) : rubricData ? (
                   <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-6">
                        <div className="bg-emerald-100/50 text-emerald-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-200">
                          Last Updated: {format(parseISO(rubricData.updatedAt), 'MMM d, yyyy HH:mm')}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4">
                        {Object.entries(rubricData.rubrics).map(([qId, rubricStr]: [string, any]) => {
                          const parsed = typeof rubricStr === 'string' ? JSON.parse(rubricStr) : rubricStr;
                          return (
                            <div key={qId} className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100 hover:border-emerald-200 transition-all group">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <span className="bg-slate-200 text-slate-600 text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-tight">Q: {qId}</span>
                                  <span className="text-emerald-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                    <Star size={10} fill="currentColor" /> {parsed.marks || 1} Marks
                                  </span>
                                </div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic group-hover:text-emerald-500 transition-colors">
                                  {rubricData.meta?.[qId]?.type || 'Standard'}
                                </div>
                              </div>
                              <div className="space-y-3">
                                <div>
                                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 flex items-center gap-1.5">
                                    <Target size={10} /> Correct Answer
                                  </h4>
                                  <div className="bg-white p-3 rounded-xl border border-slate-200 font-bold text-slate-700 text-xs shadow-sm">
                                    {typeof parsed.correct_answer === 'object' ? JSON.stringify(parsed.correct_answer) : parsed.correct_answer}
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 flex items-center gap-1.5">
                                    <ListChecks size={10} /> Grading Rubric
                                  </h4>
                                  <div className="bg-white p-3 rounded-xl border border-slate-200 font-medium text-slate-600 text-xs leading-relaxed shadow-sm">
                                    {parsed.rubric}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                   </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mb-2">
                       <Info size={40} />
                    </div>
                    <h3 className="font-black text-slate-700 uppercase tracking-tight">No Processed Rubric Found</h3>
                    <p className="text-slate-400 text-sm font-medium max-w-xs">A rubric will be automatically generated and cached once you grade any submission for this task.</p>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t-2 border-emerald-50 flex justify-end shrink-0">
                 <button 
                  onClick={() => setViewingRubricTask(null)}
                  className="bg-emerald-500 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-[0_4px_0_0_#059669] active:translate-y-1 active:shadow-none transition-all"
                >
                  Close Viewer
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TasksView;
