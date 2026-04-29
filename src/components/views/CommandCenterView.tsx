import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ListChecks, Users, Plus, Trash2, ShieldCheck, Clock, Sparkles, Send, X, Edit, Eye, ArrowRight, BarChart3, List, FileText, Download, Copy, RefreshCw, Layers, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { db } from '../../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Task, TaskSubmission, Unit, AppMode } from '../../types';
import { GoogleGenAI, Type } from "@google/genai";
import { GOLDEN_STANDARD_WORKSHEET, GOLDEN_STANDARD_TEST } from '../../constants/goldenStandard';
import Analytics from './Analytics';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

interface CommandCenterViewProps {
  tasks: Task[];
  allSubmissions: TaskSubmission[];
  units: Unit[];
  onCreateTask: (task: Partial<Task>) => void;
  onUpdateTask?: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onViewSubmission: (sub: TaskSubmission, task: Task) => void;
  onDeleteSubmission: (id: string) => void;
  onWipeCleanSlate: () => void;
}

const CommandCenterView = ({ 
  tasks,
  allSubmissions,
  units,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onViewSubmission,
  onDeleteSubmission,
  onWipeCleanSlate
}: CommandCenterViewProps) => {
  const [activeTab, setActiveTab] = React.useState<'analytics' | 'tasks' | 'submissions'>('analytics');
  const [batchGradingTask, setBatchGradingTask] = React.useState<string | null>(null);
  const [viewingRubricTask, setViewingRubricTask] = React.useState<Task | null>(null);
  const [rubricData, setRubricData] = React.useState<any>(null);
  const [isLoadingRubric, setIsLoadingRubric] = React.useState(false);
  const [isCreatorOpen, setIsCreatorOpen] = React.useState(false);
  const [isTestCreatorOpen, setIsTestCreatorOpen] = React.useState(false);
  const [submissionFilter, setSubmissionFilter] = React.useState('');
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);
  const [worksheetQuestionsJson, setWorksheetQuestionsJson] = React.useState('');
  const [markschemeContent, setMarkschemeContent] = React.useState('');
  const [seedingStatus, setSeedingStatus] = React.useState<'idle' | 'seeding' | 'success'>('idle');
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);
  const [deleteSubConfirmId, setDeleteSubConfirmId] = React.useState<string | null>(null);
  const [wipeConfirmStep, setWipeConfirmStep] = React.useState(0);
  
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

  const submissionsByTask = React.useMemo(() => {
    const grouped: Record<string, TaskSubmission[]> = {};
    allSubmissions.forEach(sub => {
      if (!grouped[sub.taskId]) grouped[sub.taskId] = [];
      grouped[sub.taskId].push(sub);
    });
    return grouped;
  }, [allSubmissions]);

  const openRubricViewer = async (task: Task) => {
    setViewingRubricTask(task);
    setIsLoadingRubric(true);
    setRubricData(null);
    try {
      // First check if there is a processed rubric
      const docRef = doc(db, 'processedRubrics', task.id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setRubricData(docSnap.data());
      } else {
        // Fallback to raw markscheme from task
        setRubricData({ raw: task.markschemeContent });
      }
    } catch (e) {
      console.error("Error fetching rubric:", e);
      setRubricData({ raw: task.markschemeContent });
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
        let cachedRubric = null;
        try {
          const docRef = doc(db, 'processedRubrics', task.id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            cachedRubric = docSnap.data().rubrics;
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
        
        const payload = { ...sub, feedback: "Graded", completedAt: sub.completedAt || new Date().toISOString(), results };
        
        try {
           const subRef = doc(db, 'submissions', sub.id);
           await setDoc(subRef, payload, { merge: true });
        } catch(e) {
           console.error("Firebase update failed", e);
        }
        sub.feedback = "Graded";
        sub.results = results;
        
      } catch (err) {
        console.error("Batch grading failed for ", sub.id, err);
      }
    }
    
    setBatchGradingTask(null);
    alert('Batch grading complete for: ' + task.title);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let parsedQuestions = undefined;
    let finalMarkscheme = markschemeContent.trim() || undefined;

    if (worksheetQuestionsJson.trim()) {
      try {
        parsedQuestions = JSON.parse(worksheetQuestionsJson);
        if (Array.isArray(parsedQuestions)) {
          const existingIds = new Set<string>();
          tasks.forEach(t => {
            t.worksheetQuestions?.forEach(q => existingIds.add(q.id.trim()));
          });

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

          if (Object.keys(idReplacements).length > 0 && finalMarkscheme) {
            for (const [oldId, newId] of Object.entries(idReplacements)) {
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
      type: newTask.type === 'test' || isTestCreatorOpen ? 'test' : ((newTask.pdfUrl || parsedQuestions) ? ('worksheet' as const) : undefined),
      worksheetQuestions: parsedQuestions,
      markschemeContent: finalMarkscheme
    };

    await onCreateTask(taskToCreate);
    
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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    
    let parsedQuestions = editingTask.worksheetQuestions;
    try {
      if (worksheetQuestionsJson.trim()) {
        parsedQuestions = JSON.parse(worksheetQuestionsJson);
        if (Array.isArray(parsedQuestions)) {
          parsedQuestions.forEach((q: any) => {
            if (q.tableData && Array.isArray(q.tableData[0])) {
              q.tableData = q.tableData.map((row: any) => ({ row }));
            }
          });
        }
      }
    } catch (err) {
      alert("Invalid Questions JSON");
      return;
    }
    
    if (onUpdateTask) {
      await onUpdateTask(editingTask.id, {
        ...editingTask,
        worksheetQuestions: parsedQuestions,
        markschemeContent: markschemeContent.trim() || editingTask.markschemeContent
      });
    }
    setEditingTask(null);
    setWorksheetQuestionsJson('');
    setMarkschemeContent('');
  };

  const handleWipe = () => {
    if (wipeConfirmStep < 2) {
      setWipeConfirmStep(prev => prev + 1);
      return;
    }
    onWipeCleanSlate();
    setWipeConfirmStep(0);
  };

  const exportReportPDF = async (sub: TaskSubmission, task: Task) => {
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;
    
    const isTest = task.type === 'test';
    const primaryColor: [number, number, number] = isTest ? [225, 29, 72] : [16, 185, 129];
    const lightBgColor: [number, number, number] = isTest ? [254, 242, 242] : [240, 253, 244];
    const accentTextColor: [number, number, number] = isTest ? [190, 18, 60] : [5, 150, 105];

    // Header Bar
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 5, 'F');
    
    let y = 25;
    doc.setTextColor(30, 41, 59);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(24);
    doc.text("Graded Student Response Report", margin, y);
    y += 8;
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.setFont("Helvetica", "normal");
    doc.text(`Created on ${format(new Date(), 'MMMM do, yyyy h:mm a')} by Toman Lam`, margin, y);
    y += 12;
    
    // Teacher's General Feedback
    doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
    const feedbackText = sub.results?.generalFeedback || "No general feedback provided.";
    const splitFeedback = doc.splitTextToSize(feedbackText, pageWidth - (margin * 2) - 40);
    const boxHeight = Math.max(30, (splitFeedback.length * 5) + 20);
    
    doc.rect(margin, y, pageWidth - (margin * 2), boxHeight, 'F');
    doc.setTextColor(accentTextColor[0], accentTextColor[1], accentTextColor[2]);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Teacher's General Feedback", margin + 10, y + 12);
    
    doc.setTextColor(71, 85, 105);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.text(splitFeedback, margin + 10, y + 20);
    y += boxHeight + 8;
    
    // Info Cards
    const cardWidth = (pageWidth - (margin * 2) - 10) / 2;
    const cardHeight = 18;
    const stats = [
      { label: "STUDENT NAME", value: sub.studentName },
      { label: "PERFORMANCE METRIC", value: `${sub.results?.score} of ${sub.results?.total} (${Math.round((sub.results?.score || 0) / (sub.results?.total || 1) * 100)}%)`, isSuccess: true },
      { label: isTest ? "TEST TITLE" : "ASSIGNMENT TITLE", value: task.title },
      { label: "COMPLETION TIME", value: sub.completedAt ? format(new Date(sub.completedAt), 'MMMM do, yyyy h:mm a') : 'N/A' },
      { label: "PUNCTUALITY", value: "EARLY", isSuccess: true },
      { 
        label: "SECURITY VIOLATIONS", 
        value: (isTest && sub.cheatLog && sub.cheatLog.length > 0) ? sub.cheatLog.join(', ') : "OFF", 
        isViolation: isTest && sub.cheatLog && sub.cheatLog.length > 0,
        isSuccess: !(isTest && sub.cheatLog && sub.cheatLog.length > 0)
      }
    ];
    
    stats.forEach((stat: any, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cardX = margin + col * (cardWidth + 10);
      const cardY = y + row * (cardHeight + 4);
      
      doc.setFillColor(248, 250, 252);
      doc.rect(cardX, cardY, cardWidth, cardHeight, 'F');
      
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(7);
      doc.setFont("Helvetica", "bold");
      doc.text(stat.label, cardX + 8, cardY + 7);
      
      if (stat.isViolation) {
        doc.setTextColor(225, 29, 72); // Red-600
        doc.setFont("Helvetica", "bold");
      } else if (stat.isSuccess) {
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFont("Helvetica", "bold");
      } else {
        doc.setTextColor(30, 41, 59);
        doc.setFont("Helvetica", "bold");
      }
      doc.setFontSize(9);
      doc.text(stat.value, cardX + 8, cardY + 14);
    });
    
    y += (cardHeight + 4) * 3 + 12;

    // Attainment Chart - Anchored to bottom of first page to give headroom
    const chartHeight = 40;
    const chartWidth = pageWidth - (margin * 2);
    const chartY = doc.internal.pageSize.height - chartHeight - 35; 
    const questions = task.worksheetQuestions || [];
    const availableWidthForBars = chartWidth - 20;
    const barSpacing = 5;
    const barWidth = Math.min(15, (availableWidthForBars - (questions.length - 1) * barSpacing) / Math.max(1, questions.length));
    const totalBarsWidth = (questions.length * barWidth) + ((questions.length - 1) * barSpacing);
    const startX = margin + (chartWidth - totalBarsWidth) / 2;
    
    const chartColors = [
      [99, 102, 241], [244, 63, 94], [16, 185, 129], [245, 158, 11], 
      [139, 92, 246], [236, 72, 153], [20, 184, 166], [107, 114, 128]
    ];

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.setFont("Helvetica", "bold");
    doc.text("Attainment per Question (%)", margin, chartY - 4);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(margin, chartY, margin, chartY + chartHeight);
    doc.line(margin, chartY + chartHeight, margin + chartWidth, chartY + chartHeight);

    questions.forEach((q: any, i: number) => {
      const f = sub.results?.feedback?.[q.id];
      const attainment = (() => {
        const s = String(f?.score || "0");
        if (s.includes('of')) {
          const parts = s.split('of').map(p => parseFloat(p.trim()));
          if (parts.length === 2 && parts[1] > 0) return (parts[0] / parts[1]) * 100;
        }
        const val = parseFloat(s);
        return isNaN(val) ? 0 : val * 100; 
      })();

      const bH = (Math.min(100, Math.max(0, attainment)) / 100) * chartHeight;
      const bX = startX + (i * (barWidth + barSpacing));
      const bY = chartY + chartHeight - bH;
      
      const color = chartColors[i % chartColors.length];
      doc.setFillColor(color[0], color[1], color[2]);
      
      const finalH = Math.max(0.1, bH);
      doc.rect(bX, bY, barWidth, finalH, 'F');
      
      doc.setFontSize(6);
      doc.text(`Q${i+1}`, bX + (barWidth / 2), chartY + chartHeight + 4, { align: 'center' });
    });

    // Start table on new page
    doc.addPage();
    y = 20; 
    
    const tableData = (task.worksheetQuestions || []).map((q: any) => {
      const f = sub.results?.feedback?.[q.id];
      let scoreStr = (f?.score || "0").toString();
      if (!scoreStr.includes('of')) {
        scoreStr = `${scoreStr} of 1`;
      }
      
      const feedbackTextRaw = f?.feedback || "No feedback.";
      const isCorrect = feedbackTextRaw.trim().toLowerCase().startsWith('correct');
      const isIncorrect = feedbackTextRaw.trim().toLowerCase().startsWith('incorrect') || feedbackTextRaw.trim().toLowerCase().startsWith('no response');
      const isPartial = feedbackTextRaw.trim().toLowerCase().startsWith('partially');
      
      let response = sub.responses?.[q.id] || "No response";
      if (typeof response === 'string') {
        response = response.replace(/→/g, '->').replace(/←/g, '<-').replace(/↑/g, '(up)').replace(/↓/g, '(down)');
      }
      
      return [
        q.question || q.id,
        response,
        {
          content: `[Points: ${scoreStr}]\n${feedbackTextRaw}`,
          isCorrect,
          isPartial,
          isIncorrect
        }
      ];
    });
    
    autoTable(doc, {
      startY: y,
      head: [['Question Stem', 'Student Response', 'Targeted Feedback']],
      body: tableData,
      theme: 'grid',
      margin: { left: 12, right: 12, bottom: 20 },
      styles: {
        overflow: 'linebreak',
        cellPadding: 8,
        valign: 'middle',
        halign: 'left',
        fontSize: 8.5,
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
        minCellHeight: 30
      },
      headStyles: {
        fillColor: undefined,
        textColor: [30, 41, 59],
        fontSize: 9,
        fontStyle: 'bold',
        cellPadding: 4,
        minCellHeight: 0,
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: (pageWidth - 24) * 0.3, fontStyle: 'bold' },
        1: { cellWidth: (pageWidth - 24) * 0.3 },
        2: { cellWidth: (pageWidth - 24) * 0.4 }
      },
      didParseCell: (data) => {
        if (data.section === 'body') {
          if (data.column.index === 1) {
            const val = data.cell.raw as string;
            if (typeof val === 'string' && (val.startsWith('data:image') || val.match(/\.(jpeg|jpg|gif|png)$/) != null)) {
              data.cell.text = ['']; 
              data.cell.styles.minCellHeight = 55;
            }
          }
          if (data.column.index === 2) {
            const raw = data.cell.raw as any;
            data.cell.text = [raw.content];
          }
        }
      },
      didDrawCell: (data) => {
        if (data.section === 'body') {
          const cell = data.cell;
          let fill: [number, number, number] = [248, 250, 252];
          let textColor: [number, number, number] = [30, 41, 59];
          
          if (data.column.index === 0) {
            fill = [239, 246, 255];
            textColor = [29, 78, 216];
          } else if (data.column.index === 1) {
            fill = [255, 255, 255]; // White for response
            textColor = [30, 41, 59];
          } else if (data.column.index === 2) {
            const raw = cell.raw as any;
            if (raw.isCorrect) { fill = [240, 253, 244]; textColor = [21, 128, 61]; }
            else if (raw.isPartial) { fill = [255, 251, 235]; textColor = [180, 83, 9]; }
            else if (raw.isIncorrect) { fill = [254, 242, 242]; textColor = [185, 28, 28]; }
          }

          doc.setFillColor(fill[0], fill[1], fill[2]);
          doc.rect(cell.x + 0.2, cell.y + 0.2, cell.width - 0.4, cell.height - 0.4, 'F');

          if (data.column.index === 1) {
            const val = cell.raw as string;
            if (typeof val === 'string' && (val.startsWith('data:image') || val.match(/\.(jpeg|jpg|gif|png)$/) != null)) {
              const padding = 6;
              const imgW = Math.min(cell.width - padding * 2, 50);
              const imgH = Math.min(cell.height - padding * 2, 40);
              const posX = cell.x + (cell.width - imgW) / 2;
              const posY = cell.y + (cell.height - imgH) / 2;
              try {
                doc.addImage(val, 'PNG', posX, posY, imgW, imgH);
              } catch (e) {
                console.error("PDF Img err", e);
              }
              return;
            }
          }

          // Render text with proper alignment and vertical centering
          doc.setTextColor(textColor[0], textColor[1], textColor[2]);
          doc.setFontSize(cell.styles.fontSize);
          
          const textLines: string[] = doc.splitTextToSize(cell.text.join('\n'), cell.width - (cell.styles.cellPadding as number) * 2);
          const lineHeight = cell.styles.fontSize * 0.352778 * 1.2;
          const textHeight = textLines.length * lineHeight; 
          const startXPos = cell.x + (cell.styles.cellPadding as number);
          let startYPos = cell.y + (cell.height - textHeight) / 2 + (cell.styles.fontSize * 0.352778);

          let feedbackSentenceBolded = false;

          textLines.forEach((line: string) => {
            doc.setFont("Helvetica", "normal");
            
            if (data.column.index === 2 && !line.startsWith('[Points:')) {
              if (!feedbackSentenceBolded) {
                const firstPeriodIndex = line.indexOf('.');
                if (firstPeriodIndex !== -1) {
                  // Part before period is bold
                  const boldPart = line.substring(0, firstPeriodIndex + 1);
                  const normalPart = line.substring(firstPeriodIndex + 1);
                  
                  doc.setFont("Helvetica", "bold");
                  doc.text(boldPart, startXPos, startYPos);
                  
                  if (normalPart.length > 0) {
                    const boldWidth = doc.getTextWidth(boldPart);
                    doc.setFont("Helvetica", "normal");
                    doc.text(normalPart, startXPos + boldWidth, startYPos);
                  }
                  feedbackSentenceBolded = true;
                } else {
                  // No period in this line, but it's the start of feedback (after points)
                  // If it's a short line or we want to be safe, we could bold the whole thing, 
                  // but usually the first sentence has a period.
                  doc.setFont("Helvetica", "bold");
                  doc.text(line, startXPos, startYPos);
                }
              } else {
                doc.text(line, startXPos, startYPos);
              }
            } else {
              doc.text(line, startXPos, startYPos);
            }
            startYPos += lineHeight;
          });
        }
      }
    });

    doc.save(`Performance_Report_${sub.studentName}.pdf`);

  };

  return (
    <div className="flex-1 flex flex-col gap-8 p-6 max-w-7xl mx-auto w-full pt-4 pb-24">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-900 px-8 py-5 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] -mr-80 -mt-80 opacity-50 group-hover:opacity-80 transition-opacity duration-1000" />
        
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

      {/* Admin Stats & Tasks rendering logic */}
      {activeTab === 'analytics' ? (
        <Analytics tasks={tasks} allSubmissions={allSubmissions} />
      ) : activeTab === 'submissions' ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
           {/* Submissions Inbox UI (extracted from TasksView) */}
           <div className="bg-slate-950/80 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-transparent to-emerald-500/10 opacity-50 group-hover:opacity-80 transition-opacity duration-1000" />
              <div className="flex items-center gap-8 flex-1 relative z-10">
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">Assignment Inbox</h2>
                  <p className="text-slate-400 font-bold text-[9px] uppercase tracking-[0.2em] mt-1">Review student submissions and manage results</p>
                </div>
              </div>
           </div>

           <div className="grid grid-cols-1 gap-6">
             {tasks.map(task => {
                const subs = submissionsByTask[task.id] || [];
                const ungraded = subs.filter(s => !s.feedback);
                if (subs.length === 0) return null;

                return (
                  <section key={task.id} className="bg-white/40 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/20 shadow-xl">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-white/20">
                      <div className="flex items-center gap-6">
                        <div className={`p-4 rounded-2xl ${task.type === 'test' ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                          {task.type === 'test' ? <ShieldCheck size={32} /> : <ListChecks size={32} />}
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{task.title}</h3>
                          <div className="flex flex-wrap items-center gap-4 mt-2">
                             <div className="flex items-center gap-1.5 px-3 py-1 bg-white/50 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest border border-white/40">
                               <Users size={12} className="text-blue-500" />
                               {subs.length} Students
                             </div>
                             {ungraded.length > 0 && (
                               <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 rounded-lg text-[10px] font-black text-amber-600 uppercase tracking-widest border border-amber-500/20">
                                 <Clock size={12} className="animate-pulse" />
                                 {ungraded.length} New
                               </div>
                             )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => openRubricViewer(task)}
                          className="px-6 py-3 bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-indigo-600 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                        >
                          <FileText size={16} />
                          Review Rubric
                        </button>
                        <button 
                          disabled={batchGradingTask === task.id || ungraded.length === 0}
                          onClick={() => doBatchGrade(task, subs)}
                          className={`px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[9px] transition-all flex items-center gap-2 shadow-lg ${
                            batchGradingTask === task.id 
                            ? 'bg-slate-200 text-slate-400' 
                            : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20'
                          }`}
                        >
                          {batchGradingTask === task.id ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                          {batchGradingTask === task.id ? 'Grading...' : 'Batch Grade'}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {subs.map(sub => (
                        <div key={sub.id} className="bg-white/60 p-5 rounded-3xl border border-white/60 hover:shadow-2xl transition-all duration-500 group flex flex-col justify-between h-full">
                           <div className="flex justify-between items-start mb-4">
                             <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-[0.8rem] bg-slate-900 flex items-center justify-center text-white font-black text-sm uppercase ring-4 ring-slate-100">
                                 {(sub.studentName || 'U').charAt(0)}
                               </div>
                               <div>
                                 <p className="font-black text-slate-800 uppercase tracking-tight text-[11px] leading-none mb-1">{sub.studentName || 'Unknown Student'}</p>
                                 <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                   {sub.completedAt ? format(new Date(sub.completedAt), 'MMM d, HH:mm') : 'Pending'}
                                 </p>
                               </div>
                             </div>
                             <div className="flex items-center gap-1">
                               <button 
                                 onClick={() => setDeleteSubConfirmId(deleteSubConfirmId === sub.id ? null : sub.id)}
                                 className={`p-2 rounded-xl transition-all ${deleteSubConfirmId === sub.id ? 'bg-rose-500 text-white' : 'text-slate-300 hover:text-rose-500 hover:bg-rose-50'}`}
                               >
                                 <Trash2 size={14} />
                               </button>
                               {deleteSubConfirmId === sub.id && (
                                 <button 
                                   onClick={() => { onDeleteSubmission(sub.id); setDeleteSubConfirmId(null); }}
                                   className="bg-rose-600 text-white px-2 py-1 rounded-lg text-[8px] font-black uppercase animate-in fade-in slide-in-from-right-1"
                                 >
                                   Confirm
                                 </button>
                               )}
                             </div>
                           </div>

                           <div className="space-y-3 mb-6">
                             {sub.results && (
                               <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                 <div className="flex justify-between items-center mb-1">
                                   <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.15em]">Attainment</span>
                                   <span className="text-xs font-black text-slate-900">{sub.results.score} / {sub.results.total}</span>
                                 </div>
                                 <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                                   <motion.div 
                                     initial={{ width: 0 }}
                                     animate={{ width: `${(sub.results.score / sub.results.total) * 100}%` }}
                                     className="h-full bg-emerald-500" 
                                   />
                                 </div>
                               </div>
                             )}
                             {(sub.results?.cheatLogs?.length || 0) > 0 && (
                               <div className="px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600">
                                 <ShieldCheck size={10} />
                                 <span className="text-[8px] font-black uppercase tracking-widest">Security Flags: {sub.results?.cheatLogs?.length}</span>
                               </div>
                             )}
                           </div>

                           <div className="grid grid-cols-2 gap-2 mt-auto">
                             <button 
                               onClick={() => onViewSubmission(sub, task)}
                               className="w-full py-3 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[8px] hover:bg-slate-700 transition-all flex items-center justify-center gap-2 group-hover:scale-105"
                             >
                               <Eye size={12} />
                               Review
                             </button>
                             <button 
                               disabled={!sub.results}
                               onClick={() => exportReportPDF(sub, task)}
                               className={`w-full py-3 rounded-2xl font-black uppercase tracking-widest text-[8px] transition-all flex items-center justify-center gap-2 group-hover:scale-105 ${
                                 sub.results ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                               }`}
                             >
                               <Download size={12} />
                               Report PDF
                             </button>
                           </div>
                        </div>
                      ))}
                    </div>
                  </section>
                );
             })}
           </div>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Admin Tasks (Deploy) View logic */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Quick Stats Bar (as seen in TasksView) */}
            <div className="bg-white/40 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Assignments</p>
              <p className="text-4xl font-black text-slate-900 tracking-tighter">{tasks.filter(t => t.type !== 'test').length}</p>
            </div>
            {/* ... other stats ... */}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button onClick={() => setIsCreatorOpen(true)} className="px-6 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2">
              <Plus size={18} /> New Assignment
            </button>
            <button onClick={() => setIsTestCreatorOpen(true)} className="px-6 py-4 bg-rose-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2">
              <ShieldCheck size={18} /> New Secure Test
            </button>
            <button 
              onClick={handleWipe} 
              className={`px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 ml-auto transition-all ${
                wipeConfirmStep > 0 ? 'bg-rose-600 text-white animate-pulse shadow-xl shadow-rose-500/20' : 'bg-slate-900 text-white'
              }`}
            >
              <Trash2 size={18} /> 
              {wipeConfirmStep === 0 ? 'Wipe Submissions' : (wipeConfirmStep === 1 ? 'Confirm Wipe [1/2]' : 'DANGER: TRIPLE CONFIRM [2/2]')}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map(task => (
              <div key={task.id} className="bg-white/40 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/20 shadow-xl group hover:shadow-2xl transition-all duration-500">
                 <div className="flex justify-between items-start mb-6">
                    <div className={`p-4 rounded-2xl ${task.type === 'test' ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                      {task.type === 'test' ? <ShieldCheck size={24} /> : <ListChecks size={24} />}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => {
                        setEditingTask(task);
                        setWorksheetQuestionsJson(JSON.stringify(task.worksheetQuestions || [], null, 2));
                        setMarkschemeContent(task.markschemeContent || '');
                      }} className="p-2 text-slate-400 hover:text-indigo-500 rounded-xl hover:bg-indigo-50 transition-all">
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => setDeleteConfirmId(task.id)} 
                        className={`p-2 rounded-xl transition-all ${deleteConfirmId === task.id ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'}`}
                      >
                        {deleteConfirmId === task.id ? <CheckCircle2 size={16} /> : <Trash2 size={16} />}
                      </button>
                      {deleteConfirmId === task.id && (
                        <button 
                          onClick={() => { onDeleteTask(task.id); setDeleteConfirmId(null); }}
                          className="bg-rose-600 text-white px-3 py-1 rounded-lg text-[8px] font-black uppercase animate-in fade-in"
                        >
                          Confirm Delete
                        </button>
                      )}
                      {deleteConfirmId === task.id && (
                        <button 
                          onClick={() => setDeleteConfirmId(null)}
                          className="text-slate-400 hover:text-slate-600 p-1"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                 </div>
                 <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2 line-clamp-1">{task.title}</h3>
                 <p className="text-slate-500 font-bold text-[11px] uppercase tracking-widest opacity-60 mb-6">{task.type === 'test' ? 'Secure Assessment' : 'Standard Assignment'}</p>
                 
                 <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 bg-white/50 border border-white/50 rounded-2xl text-center">
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Submissions</p>
                     <p className="text-xl font-black text-slate-800">{(submissionsByTask[task.id] || []).length}</p>
                   </div>
                   <div className="p-4 bg-white/50 border border-white/50 rounded-2xl text-center">
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Unit</p>
                     <p className="text-xl font-black text-slate-800">{Array.isArray(task.units) ? task.units[0] : task.units}</p>
                   </div>
                 </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Creator Modals would go here (I'll implement them concisely) */}
      <AnimatePresence>
        {(isCreatorOpen || isTestCreatorOpen || editingTask) && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 sm:p-12">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setIsCreatorOpen(false); setIsTestCreatorOpen(false); setEditingTask(null); }} className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white w-full max-w-4xl h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-white/20">
              <div className="flex items-center justify-between p-8 border-b border-slate-100">
                 <div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{editingTask ? 'Edit Task' : (isTestCreatorOpen ? 'Launch Secure Test' : 'Deploy Assignment')}</h2>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Configure parameters and content resources</p>
                 </div>
                 <button onClick={() => { setIsCreatorOpen(false); setIsTestCreatorOpen(false); setEditingTask(null); }} className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all">
                   <X size={24} />
                 </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8">
                 <form onSubmit={editingTask ? handleUpdate : handleCreate} className="space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Task Title</label>
                       <input value={editingTask ? editingTask.title : newTask.title} onChange={e => editingTask ? setEditingTask({ ...editingTask, title: e.target.value }) : setNewTask({ ...newTask, title: e.target.value })} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-slate-800" required />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Due Date</label>
                         <input type="date" value={editingTask ? editingTask.dueDate : newTask.dueDate} onChange={e => editingTask ? setEditingTask({ ...editingTask, dueDate: e.target.value }) : setNewTask({ ...newTask, dueDate: e.target.value })} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold text-slate-800" />
                       </div>
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Units</label>
                         <select value={editingTask ? (Array.isArray(editingTask.units) ? editingTask.units[0] : editingTask.units) : newTask.units?.[0]} onChange={e => { const val = parseInt(e.target.value); editingTask ? setEditingTask({ ...editingTask, units: [val] }) : setNewTask({ ...newTask, units: [val] }); }} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl font-bold text-slate-800">
                           {units.map(u => <option key={u.id} value={u.id}>Unit {u.id}: {u.title}</option>)}
                         </select>
                       </div>
                     </div>
                     {(isTestCreatorOpen || (editingTask && editingTask.type === 'test')) && (
                       <div className="md:col-span-2 space-y-2">
                         <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest block ml-2">Security Passcode (Required for students)</label>
                         <input 
                           type="text" 
                           placeholder="Enter passcode to lock this test"
                           value={editingTask ? (editingTask.passcode || '') : (newTask.passcode || '')} 
                           onChange={e => editingTask ? setEditingTask({ ...editingTask, passcode: e.target.value }) : setNewTask({ ...newTask, passcode: e.target.value })} 
                           className="w-full bg-rose-50 border-2 border-rose-100 p-4 rounded-2xl font-mono focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all font-bold text-rose-900" 
                           required 
                         />
                       </div>
                     )}
                   </div>

                   <div className="space-y-4">
                     <div className="flex items-center justify-between">
                       <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block ml-2">Worksheet Questions (JSON)</label>
                       <button type="button" onClick={() => {
                          const sample = JSON.stringify([{ id: "q1", type: "mcq", question: "Sample?", options: ["A","B","C","D"], page: 1 }], null, 2);
                          setWorksheetQuestionsJson(sample);
                       }} className="text-[9px] font-black text-slate-400 hover:text-indigo-500 uppercase tracking-widest">Load Template</button>
                     </div>
                     <textarea value={worksheetQuestionsJson} onChange={e => setWorksheetQuestionsJson(e.target.value)} className="w-full bg-slate-900 text-emerald-400 p-6 rounded-[2rem] h-[300px] font-mono text-sm leading-relaxed border-2 border-slate-800 focus:border-indigo-500 transition-all shadow-inner" placeholder='[ { "id": "q1", ... } ]' />
                   </div>

                   <div className="space-y-4">
                     <div className="flex items-center justify-between">
                       <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block ml-2">Markscheme / Rubric (JSON or Text)</label>
                     </div>
                     <textarea value={markschemeContent} onChange={e => setMarkschemeContent(e.target.value)} className="w-full bg-slate-900 text-emerald-400 p-6 rounded-[2rem] h-[200px] font-mono text-sm leading-relaxed border-2 border-slate-800 focus:border-emerald-500 transition-all shadow-inner" placeholder='Detailed grading criteria...' />
                   </div>

                   <div className="flex gap-4 pt-4">
                     <button type="submit" className="flex-1 py-5 bg-slate-900 border-2 border-black text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-emerald-600 hover:border-emerald-400 transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-95">
                        {editingTask ? 'Apply Modifications' : 'Initiate Full Deployment'}
                     </button>
                     <button type="button" onClick={seedGoldenStandardTasks} className={`px-8 py-5 border-2 rounded-[1.5rem] font-black uppercase tracking-widest text-[9px] transition-all flex items-center gap-2 ${seedingStatus === 'success' ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-500 hover:text-indigo-500'}`}>
                       <RefreshCw size={14} className={seedingStatus === 'seeding' ? 'animate-spin' : ''} />
                       {seedingStatus === 'seeding' ? 'Seeding...' : (seedingStatus === 'success' ? 'Success' : 'Golden Standard')}
                     </button>
                   </div>
                 </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Rubric Viewer Modal */}
      <AnimatePresence>
        {viewingRubricTask && (
           <div className="fixed inset-0 z-[210] flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setViewingRubricTask(null)} className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white w-full max-w-2xl max-h-[80vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                   <div>
                     <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Rubric Intelligence</h3>
                     <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest mt-1">{viewingRubricTask.title}</p>
                   </div>
                   <button onClick={() => setViewingRubricTask(null)} className="p-3 bg-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-all"><X size={20} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                   {isLoadingRubric ? (
                     <div className="flex flex-col items-center justify-center p-12 gap-4">
                       <RefreshCw size={32} className="text-indigo-500 animate-spin" />
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Decrypting processed rubric...</p>
                     </div>
                   ) : Array.isArray(rubricData?.rubrics) ? (
                     rubricData.rubrics.map((r: any, idx: number) => (
                       <div key={idx} className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                         <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-2">Question {idx + 1}</p>
                         <p className="font-bold text-slate-800 mb-3">{r.question}</p>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-white rounded-xl border border-slate-100">
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Standard Answer</p>
                              <p className="text-xs font-bold text-slate-900">{r.correct_answer || 'N/A'}</p>
                            </div>
                            <div className="p-3 bg-white rounded-xl border border-slate-100">
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Grading Logic</p>
                              <p className="text-xs font-bold text-indigo-600">{r.rubric || 'Standard match'}</p>
                            </div>
                         </div>
                       </div>
                     ))
                   ) : rubricData?.raw || (viewingRubricTask && viewingRubricTask.markschemeContent) ? (
                      <div className="space-y-4">
                         <div className="flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Markscheme Content</p>
                         </div>
                         <div className="bg-slate-900 p-6 rounded-[2rem] border-2 border-slate-800 shadow-inner">
                            <pre className="font-mono text-xs text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                              {rubricData?.raw || viewingRubricTask.markschemeContent}
                            </pre>
                         </div>
                      </div>
                   ) : (
                     <div className="p-12 text-center flex flex-col items-center gap-4">
                       <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-300">
                          <FileText size={32} />
                       </div>
                       <p className="text-slate-400 font-bold text-sm tracking-tight">No Markscheme Associated With Operation</p>
                     </div>
                   )}
                </div>
              </motion.div>
           </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CommandCenterView;
