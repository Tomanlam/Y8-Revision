import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, CheckCircle2, ListChecks, Users, Clock, Plus, Trash2, Layout, Calendar as CalendarIcon, ChevronLeft, ChevronRight as ChevronRightIcon, Target, List, FileText, Eye, ArrowRight, User, Download, Info, Copy, Sparkles, ShieldCheck, Lock, Timer, Send, RefreshCw, X, Edit, Inbox } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, startOfDay } from 'date-fns';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { db } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';

import { Task, TaskSubmission, Unit } from '../../types';
import { GoogleGenAI } from "@google/genai";

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

const CalendarSection = ({ tasks, selectedDate, setSelectedDate }: { tasks: Task[], selectedDate: Date, setSelectedDate: (d: Date) => void }) => {
  const [currentDate, setCurrentDate] = React.useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  return (
    <div className="bg-white border-2 border-gray-100 rounded-[2rem] p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100/50">
            <CalendarIcon size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-800 tracking-tight leading-none uppercase">{format(currentDate, 'MMM yyyy')}</h3>
            <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest leading-none">Schedule</span>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-100">
          <button onClick={prevMonth} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-400 hover:text-blue-500">
            <ChevronLeft size={16} />
          </button>
          <button onClick={nextMonth} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-400 hover:text-blue-500">
            <ChevronRightIcon size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={`cal-header-${day}-${i}`} className="text-center text-[8px] font-black text-gray-300 uppercase tracking-widest mb-1">
            {day}
          </div>
        ))}
        {calendarDays.map((day, idx) => {
          const dayTasks = (tasks || []).filter(t => {
            try {
              const taskDate = t.dueDate.includes('T') ? parseISO(t.dueDate) : new Date(t.dueDate + 'T00:00:00');
              return isSameDay(startOfDay(taskDate), startOfDay(day));
            } catch {
              return false;
            }
          });
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, monthStart);
          const hasTasks = dayTasks.length > 0;

          return (
            <button
              key={idx}
              onClick={() => setSelectedDate(day)}
              className={`
                group relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all text-[11px] font-bold
                ${isSelected ? 'bg-blue-500 text-white shadow-md z-10 scale-105' : isToday ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}
                ${!isCurrentMonth ? 'opacity-20 scale-90' : 'opacity-100'}
              `}
            >
              <span>{format(day, 'd')}</span>
              {hasTasks && !isSelected && (
                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

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
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [isCreatorOpen, setIsCreatorOpen] = React.useState(false);
  const [isTestCreatorOpen, setIsTestCreatorOpen] = React.useState(false);
  const [isPasscodeModalOpen, setIsPasscodeModalOpen] = React.useState(false);
  const [selectedTaskForPasscode, setSelectedTaskForPasscode] = React.useState<Task | null>(null);
  const [enteredPasscode, setEnteredPasscode] = React.useState('');
  const [passcodeError, setPasscodeError] = React.useState(false);
  const [showPasscode, setShowPasscode] = React.useState(false);

  const [activeTab, setActiveTab] = React.useState<'tasks' | 'submissions'>('tasks');
  const [submissionFilter, setSubmissionFilter] = React.useState('');
  const [nukeLevel, setNukeLevel] = React.useState(0);

  const [worksheetQuestionsJson, setWorksheetQuestionsJson] = React.useState('');
  const [markschemeContent, setMarkschemeContent] = React.useState('');
  const [showQuestionsPrompt, setShowQuestionsPrompt] = React.useState(false);
  const [showMarkschemePrompt, setShowMarkschemePrompt] = React.useState(false);

  const [editingTask, setEditingTask] = React.useState<Task | null>(null);

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

  const generateResponsePDF = (submission: TaskSubmission, task: Task, includeFeedback: boolean = false) => {
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

    const securityValue = isTest 
      ? (submission.results?.cheatLogs 
          ? Object.entries(submission.results.cheatLogs)
              .filter(([_, count]) => (count as number) > 0)
              .map(([key, count]) => `${securityMap[key] || key}: ${count}`)
              .join(', ') || 'NONE DETECTED'
          : `${submission.results?.tabSwitches || 0} Tab Switches Detected`)
      : 'OFF';

    autoTable(doc, {
      startY: currentY,
      body: [
        ['Student Name:', submission.studentName],
        [isTest ? 'Assessment Title:' : 'Assignment Title:', task.title],
        ['Completion Time:', format(new Date(submission.completedAt), 'PPP p')],
        ['Punctuality:', punctuality],
        ['Security Violations:', securityValue],
        ['Performance Metric:', submission.results ? `${submission.results.score} / ${submission.results.total} (${Math.round((submission.results.score/submission.results.total)*100)}%)` : 'Awaiting Grading']
      ],
      theme: 'grid',
      didParseCell: (data) => {
        // Handle Security Violations color (Row 4, Column 1 in info table)
        if (data.row.index === 4 && data.column.index === 1 && isTest && securityValue !== 'NONE DETECTED') {
          data.cell.styles.textColor = [220, 38, 38]; // Red
        }
        // Handle Punctuality color
        if (data.column.index === 1 && data.cell.text[0] === punctuality) {
          if (punctuality === "EARLY") data.cell.styles.textColor = [16, 185, 129] as any;
          if (punctuality === "LATE") data.cell.styles.textColor = [239, 68, 68] as any;
          if (punctuality === "ON-TIME") data.cell.styles.textColor = [245, 158, 11] as any;
        }
      },
      styles: { 
        fontSize: 10, 
        cellPadding: 4,
        lineColor: [230, 230, 230],
        lineWidth: 0.1
      },
      columnStyles: { 
        0: { fontStyle: 'bold', cellWidth: 45, fillColor: [249, 250, 251], textColor: [100, 116, 139] },
        1: { fillColor: [255, 255, 255], textColor: [15, 23, 42], fontStyle: 'bold' }
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 12;

    const tableData = task.worksheetQuestions?.map((q, idx) => {
      const qId = q.id.trim();
      let response = submission.responses?.[qId] || submission.responses?.[q.id];
      const feedback = submission.feedback?.[qId] || submission.feedback?.[q.id];
      
      if (q.type === 'table' && response && typeof response === 'object') {
        response = Object.entries(response)
          .map(([key, val]) => `${key}: ${val}`)
          .join('\n');
      } else if (typeof response === 'object' && response !== null) {
        response = JSON.stringify(response);
      }
      
      const row = [
        idx + 1,
        (q as any).question || (q as any).text || '---',
        response || '---'
      ];

      if (includeFeedback) {
        row.push(feedback ? `[Points: ${feedback.score}]\n${feedback.feedback}` : '---');
      }

      return row;
    }) || [];

    autoTable(doc, {
      startY: currentY,
      head: [includeFeedback ? ['#', 'Question Stem', 'Student Response', 'Targeted Feedback'] : ['#', 'Question Stem', 'Student Response']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: primaryColor, 
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      styles: { 
        fontSize: 9, 
        cellPadding: 5, 
        overflow: 'linebreak',
        lineColor: [255, 255, 255], 
        lineWidth: 1.5
      },
      columnStyles: includeFeedback ? {
        0: { cellWidth: 10, halign: 'center', fillColor: [248, 250, 252], textColor: [100, 116, 139] },
        1: { cellWidth: 50, fillColor: [248, 250, 252], textColor: [31, 41, 55], fontStyle: 'bold' },
        2: { cellWidth: 65, fillColor: [241, 245, 249], textColor: [30, 58, 138], fontStyle: 'bold' }, 
        3: { cellWidth: 65, fillColor: [254, 242, 242], textColor: [153, 27, 27], fontStyle: 'italic' } 
      } : {
        0: { cellWidth: 10, halign: 'center', fillColor: [248, 250, 252], textColor: [100, 116, 139] },
        1: { cellWidth: 80, fillColor: [248, 250, 252], textColor: [31, 41, 55], fontStyle: 'bold' },
        2: { cellWidth: 90, fillColor: [239, 246, 255], textColor: [30, 58, 138], fontStyle: 'bold' }
      }
    });

    doc.save(`${includeFeedback?'Report':'Raw_Submission'}_${submission.studentName.replace(/\s+/g, '_')}_${task.title.substring(0,15).replace(/\s+/g, '_')}.pdf`);
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
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-slate-900 px-10 py-12 rounded-[3.5rem] text-white shadow-[0_20px_50px_-12px_rgba(15,23,42,0.5)] relative overflow-hidden ring-1 ring-white/10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] -mr-64 -mt-64" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] -ml-56 -mb-56" />
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center gap-8 mb-4">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white shadow-2xl shadow-emerald-500/30 scale-110 ring-4 ring-emerald-500/20">
              <Layout size={40} className="drop-shadow-lg" />
            </div>
            <div>
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 rounded-full border border-emerald-500/30 backdrop-blur-md">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none">v4.5 Stable</span>
                </div>
                <div className="h-4 w-px bg-slate-700" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Deployment Active</span>
              </div>
              <h1 className="text-5xl font-black tracking-tighter leading-none mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-slate-400">
                Admin Command Center
              </h1>
            </div>
          </div>
          <p className="text-slate-400 text-lg font-medium px-1 max-w-xl leading-relaxed tracking-tight">
            Comprehensive system management interface. Monitor student progress metrics, deploy secure assessments, and organize pedagogical resources.
          </p>
        </div>
        
        <div className="flex items-center relative z-10 shrink-0">
          <div className="bg-slate-800/80 backdrop-blur-xl p-2 rounded-[2rem] flex items-center border border-white/5 shadow-2xl">
            <button 
              onClick={() => setActiveTab('tasks')}
              className={`px-10 py-4 rounded-[1.5rem] font-black uppercase tracking-wider transition-all flex items-center gap-3 text-[11px] ${
                activeTab === 'tasks' 
                  ? 'bg-white text-slate-900 shadow-[0_10px_20px_-5px_rgba(255,255,255,0.2)] scale-105' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <ListChecks size={18} className={activeTab === 'tasks' ? 'text-emerald-500' : ''} />
              Resources
            </button>
            <button 
              onClick={() => setActiveTab('submissions')}
              className={`px-10 py-4 rounded-[1.5rem] font-black uppercase tracking-wider transition-all flex items-center gap-3 text-[11px] ${
                activeTab === 'submissions' 
                  ? 'bg-white text-slate-900 shadow-[0_10px_20px_-5px_rgba(255,255,255,0.2)] scale-105' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users size={18} className={activeTab === 'submissions' ? 'text-blue-500' : ''} />
              Inbox
            </button>
          </div>
        </div>
      </header>

      {/* Admin Quick Stats Bar */}
      {isAdmin && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-50 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <ListChecks size={24} />
              </div>
              <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">ACTIVE</span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Assignments</p>
            <p className="text-3xl font-black text-slate-900 tracking-tight">{tasks.filter(t => t.type !== 'test').length}</p>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-50 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                <ShieldCheck size={24} />
              </div>
              <span className="text-[10px] font-black text-red-600 bg-red-50 px-2 py-1 rounded-lg">SECURE</span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Secure Assessments</p>
            <p className="text-3xl font-black text-slate-900 tracking-tight">{tasks.filter(t => t.type === 'test').length}</p>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-50 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                <Clock size={24} />
              </div>
              {allSubmissions.filter(s => !s.feedback).length > 0 && (
                <span className="text-[10px] font-black text-white bg-amber-500 px-2 py-1 rounded-lg animate-pulse">ACTION NEEDED</span>
              )}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pending Grading</p>
            <p className="text-3xl font-black text-slate-900 tracking-tight">
              {allSubmissions.filter(s => !s.feedback).length}
            </p>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
            <Sparkles className="absolute right-[-10px] bottom-[-10px] text-emerald-500/20" size={100} />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={16} className="text-emerald-400" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">AI Engine</span>
              </div>
              <p className="text-2xl font-black text-white tracking-tight">Gemini 3.1 Flash</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Autonomous Grading v2</p>
            </div>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => {
              setNewTask(prev => ({ ...prev, type: 'standard' }));
              setIsCreatorOpen(true);
            }}
            className="group bg-white border-2 border-emerald-100 p-4 rounded-2xl flex items-center gap-3 hover:bg-emerald-500 hover:border-emerald-500 transition-all shadow-sm"
          >
            <div className="w-10 h-10 bg-emerald-50 group-hover:bg-white/20 rounded-xl flex items-center justify-center text-emerald-600 group-hover:text-white transition-all">
              <Plus size={20} />
            </div>
            <span className="text-[10px] font-black text-emerald-700 group-hover:text-white uppercase tracking-widest">New Assignment</span>
          </button>

          <button 
            onClick={() => {
              setNewTask(prev => ({ ...prev, type: 'test' }));
              setIsTestCreatorOpen(true);
            }}
            className="group bg-white border-2 border-red-100 p-4 rounded-2xl flex items-center gap-3 hover:bg-red-500 hover:border-red-500 transition-all shadow-sm"
          >
            <div className="w-10 h-10 bg-red-50 group-hover:bg-white/20 rounded-xl flex items-center justify-center text-red-600 group-hover:text-white transition-all">
              <ShieldCheck size={20} />
            </div>
            <span className="text-[10px] font-black text-red-700 group-hover:text-white uppercase tracking-widest">New Secure Test</span>
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
              className={`ml-auto p-4 rounded-2xl flex items-center gap-3 transition-all border-2 border-dashed ${
                nukeLevel > 0 
                  ? 'bg-red-600 border-red-600 text-white shadow-lg' 
                  : 'bg-white border-red-100 text-red-500 hover:bg-red-50'
              }`}
            >
              <Trash2 size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                {nukeLevel === 0 ? "Purge System" : nukeLevel === 1 ? "Are you sure?" : "TERMINATE DATA"}
              </span>
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
Support Question Types:
1. "mcq" (Multiple Choice)
2. "short-response" (Open text)
3. "table" (requires tableData: array of arrays, and columnHeaders/rowHeaders)
4. "tick-cross" (Binary selection)
5. "reorder" (requires items: array of strings)

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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[600] flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border-4 border-red-50"
            >
              <div className="bg-red-50 w-20 h-20 rounded-3xl flex items-center justify-center text-red-500 mx-auto mb-8 shadow-inner">
                <Lock size={40} className="animate-bounce" />
              </div>
              
              <h2 className="text-2xl font-black text-center text-gray-800 uppercase tracking-tight mb-2">
                {isAdmin ? 'Assessment Controls' : 'Secure Assessment'}
              </h2>
              
              {isAdmin ? (
                <div className="space-y-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Time Limit</span>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => {
                          const newLimit = (selectedTaskForPasscode.timeLimit || 60) - 5;
                          if (newLimit > 0 && onUpdateTask) {
                            onUpdateTask(selectedTaskForPasscode.id, { timeLimit: newLimit });
                            setSelectedTaskForPasscode({...selectedTaskForPasscode, timeLimit: newLimit});
                          }
                        }}
                        className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                      >
                        -
                      </button>
                      <span className="text-xl font-black text-gray-800">{selectedTaskForPasscode.timeLimit}m</span>
                      <button 
                        onClick={() => {
                          const newLimit = (selectedTaskForPasscode.timeLimit || 60) + 5;
                          if (onUpdateTask) {
                            onUpdateTask(selectedTaskForPasscode.id, { timeLimit: newLimit });
                            setSelectedTaskForPasscode({...selectedTaskForPasscode, timeLimit: newLimit});
                          }
                        }}
                        className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex flex-col items-center gap-2">
                     <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Live Passcode</span>
                     {isEditingPasscode ? (
                       <div className="flex gap-2 w-full">
                         <input 
                           type="text"
                           value={editedPasscodeValue}
                           onChange={(e) => setEditedPasscodeValue(e.target.value.toUpperCase())}
                           className="flex-1 text-center font-black p-2 rounded-xl border-2 border-red-200 outline-none uppercase"
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
                           className="bg-red-500 text-white px-4 rounded-xl font-bold text-xs"
                         >
                           Save
                         </button>
                       </div>
                     ) : (
                       <div className="flex items-center gap-4">
                         <span className="text-3xl font-black text-red-600 tracking-tighter">{showPasscode ? selectedTaskForPasscode.passcode : '••••••'}</span>
                         <div className="flex items-center gap-1">
                            <button 
                              onClick={() => setShowPasscode(!showPasscode)}
                              className="p-2 hover:bg-red-100 rounded-lg text-red-500 transition-colors"
                            >
                              {showPasscode ? <Eye size={18} /> : <Eye size={18} className="opacity-40" />}
                            </button>
                            <button 
                              onClick={() => setIsEditingPasscode(true)}
                              className="p-2 hover:bg-red-100 rounded-lg text-red-500 transition-colors"
                            >
                              <Edit size={18} />
                            </button>
                         </div>
                       </div>
                     )}
                  </div>
                </div>
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
  }
]

Field Definitions:
- "id": "${workId}_f[number]" (Unique ID matching the internal ID)
- "question": Full text of the question.
- "type": "short-response", "mcq", or "table".
- "page": The page number in the PDF (CRITICAL for auto-scrolling).

Output ONLY the raw JSON array.`;
                          navigator.clipboard.writeText(prompt);
                          alert("Questions prompt copied!");
                        }}
                        className="flex items-center gap-1 text-[10px] uppercase font-black tracking-widest bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-100 transition-all"
                      >
                        <Copy size={12} /> Copy Prompt
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
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white rounded-[3rem] p-6 md:p-12 shadow-xl border-2 border-emerald-100 max-w-2xl w-full mx-auto mb-12 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center gap-6 mb-8">
            <div className="w-16 h-16 bg-emerald-50 rounded-[2rem] flex items-center justify-center text-emerald-500 shadow-inner">
              <Plus size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Edit Task Details</h2>
              <p className="text-gray-500 font-medium">Update the task name or due date instantly.</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Task Name</label>
              <input 
                type="text" 
                value={editingTask.title}
                onChange={e => setEditingTask({...editingTask, title: e.target.value})}
                className="w-full p-4 rounded-2xl border-2 border-gray-100 font-bold focus:border-emerald-500 outline-none text-xl"
              />
            </div>
            
            <div className="space-y-4">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Due Date</label>
              <input 
                type="date" 
                value={editingTask.dueDate.split('T')[0]}
                onChange={e => setEditingTask({...editingTask, dueDate: e.target.value})}
                className="w-full p-4 rounded-2xl border-2 border-gray-100 font-bold outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-4 mt-8">
              <button 
                type="button"
                onClick={() => setEditingTask(null)}
                className="px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs text-gray-400 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (onUpdateTask) {
                    await onUpdateTask(editingTask.id, { title: editingTask.title, dueDate: editingTask.dueDate });
                  }
                  setEditingTask(null);
                }}
                className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-[0_6px_0_0_#059669] active:translate-y-1 active:shadow-none transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </motion.div>
      )}
      
      {editingTask && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity" onClick={() => setEditingTask(null)} />}

      {activeTab === 'submissions' && isAdmin ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="flex flex-col md:flex-row items-center gap-6 bg-white p-8 rounded-[2.5rem] border-2 border-slate-50 shadow-sm">
             <div className="flex items-center gap-5 flex-1">
               <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner shrink-0 scale-110">
                 <Users size={32} />
               </div>
               <div>
                 <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Grading Inbox</h3>
                 <p className="text-slate-500 text-sm font-medium">Review, analyze, and grade student submissions across all active units.</p>
               </div>
             </div>
 
             <div className="w-full md:w-96 relative group">
               <input 
                 type="text"
                 placeholder="Search students or records..."
                 value={submissionFilter}
                 onChange={(e) => setSubmissionFilter(e.target.value)}
                 className="w-full pl-14 pr-6 py-5 rounded-2xl border-2 border-slate-100 font-bold focus:border-emerald-500 outline-none transition-all bg-slate-50/50 group-hover:bg-white shadow-inner focus:shadow-emerald-100/20"
               />
               <List className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-emerald-400 transition-colors" size={24} />
             </div>
           </div>
           
           <div className="space-y-8">
             {Object.keys(submissionsByTask).length === 0 ? (
               <div className="col-span-full py-24 flex flex-col items-center justify-center text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 shadow-inner">
                 <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mb-6">
                   <Inbox size={40} />
                 </div>
                 <h3 className="font-black text-slate-400 uppercase tracking-[0.2em] text-sm mb-2">No Submissions Recorded</h3>
                 <p className="text-slate-300 font-medium max-w-xs">Student work will automatically appear here once assignments are completed.</p>
               </div>
             ) : (Object.entries(submissionsByTask) as [string, TaskSubmission[]][]).map(([taskId, subs]) => {
               const task = tasks.find(t => t.id === taskId) || { id: taskId, title: `Unlinked Task (${taskId})`, dueDate: new Date().toISOString(), type: "worksheet" } as Task;
               
               const filteredSubs = subs.filter(s => 
                 s.studentName.toLowerCase().includes(submissionFilter.toLowerCase()) || 
                 task.title.toLowerCase().includes(submissionFilter.toLowerCase())
               );

               if (filteredSubs.length === 0) return null;

               const ungradedCount = filteredSubs.filter(s => !s.feedback).length;

               return (
                 <section key={taskId} className="space-y-8">
                   <div className="flex items-center justify-between border-b-4 border-emerald-50 pb-4">
                     <div className="flex items-center gap-4">
                       <div className="bg-emerald-500 p-3 rounded-2xl text-white shadow-lg shadow-emerald-100">
                         <Layout size={24} />
                       </div>
                       <div>
                         <h4 className="font-black text-gray-800 text-2xl uppercase tracking-tighter">
                           {task.title}
                         </h4>
                         <p className="text-gray-400 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                           <Clock size={12} /> Due: {format(new Date(task.dueDate), 'PPP')}
                         </p>
                       </div>
                     </div>
                     <div className="hidden md:flex gap-3">
                       <div className="flex flex-col gap-2 mr-2 justify-center">
                         <button 
                           onClick={() => filteredSubs.forEach(s => generateResponsePDF(s, task, false))}
                           className="text-[9px] uppercase font-black tracking-widest text-blue-600 bg-blue-50/50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 border border-blue-100"
                         >
                           <Download size={10} /> Raw PDFs
                         </button>
                         <button 
                           onClick={() => filteredSubs.filter(s => s.feedback).forEach(s => generateResponsePDF(s, task, true))}
                           className="text-[9px] uppercase font-black tracking-widest text-emerald-600 bg-emerald-50/50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 border border-emerald-100"
                         >
                           <Download size={10} /> Graded Reports
                         </button>
                       </div>
                       <div className="bg-emerald-50 border-2 border-emerald-100 px-4 py-2 rounded-2xl text-center">
                         <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Total</p>
                         <p className="text-xl font-black text-emerald-700">{filteredSubs.length}</p>
                       </div>
                       {ungradedCount > 0 && (
                         <div className="bg-orange-50 border-2 border-orange-100 px-4 py-2 rounded-2xl text-center">
                           <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Ungraded</p>
                           <p className="text-xl font-black text-orange-700">{ungradedCount}</p>
                         </div>
                       )}
                     </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                     <AnimatePresence mode="popLayout">
                       {filteredSubs.map((sub) => {
                         const isGraded = !!sub.feedback;
                         let statusColor = 'bg-emerald-50 text-emerald-600 border-emerald-100';
                         let statusText = 'On-time';
                         
                         if (task.dueDate) {
                           const dueEnd = new Date(task.dueDate);
                           dueEnd.setHours(23, 59, 59, 999);
                           const subDate = new Date(sub.completedAt);
                           if (subDate.getTime() > dueEnd.getTime()) {
                             statusColor = 'bg-red-50 text-red-600 border-red-100';
                             statusText = 'Late';
                           } else if (dueEnd.getTime() - subDate.getTime() > 24 * 60 * 60 * 1000) {
                             statusColor = 'bg-blue-50 text-blue-600 border-blue-100';
                             statusText = 'Early';
                           }
                         }
                         
                         return (
                           <motion.div 
                             key={sub.id}
                             layout
                             initial={{ opacity: 0, scale: 0.95 }}
                             animate={{ opacity: 1, scale: 1 }}
                             exit={{ opacity: 0, scale: 0.95 }}
                             whileHover={{ y: -4 }}
                             className={`group bg-white p-5 rounded-3xl border-2 transition-all relative flex flex-col justify-between shadow-sm overflow-hidden ${
                               isGraded ? 'border-emerald-100 hover:border-emerald-300' : 'border-gray-100 shadow-sm hover:border-orange-200'
                             }`}
                           >
                             {/* Sub-header info */}

                             <div>
                               <div className="flex justify-between items-start mb-4">
                                 <div className="flex items-center gap-2">
                                   <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors border-2 border-gray-100 shrink-0">
                                     <User size={20} />
                                   </div>
                                   <div>
                                     <h4 className="font-black text-gray-800 text-sm uppercase truncate max-w-[120px] tracking-tight">{sub.studentName}</h4>
                                     <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Student</p>
                                   </div>
                                 </div>
                                 <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border-2 ${statusColor}`}>
                                   {statusText}
                                 </div>
                               </div>

                               <div className="grid grid-cols-2 gap-3 mb-4">
                                 <div className="bg-gray-50/50 rounded-2xl p-2.5 border border-gray-100">
                                   <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5 text-center">Score</p>
                                   <p className={`text-base font-black text-center ${isGraded ? 'text-emerald-500' : 'text-gray-400 italic text-xs'}`}>
                                     {isGraded ? `${sub.results?.score} / ${sub.results?.total}` : 'Pending'}
                                   </p>
                                 </div>
                                 <div className="bg-gray-50/50 rounded-2xl p-2.5 border border-gray-100">
                                   <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5 text-center">Date</p>
                                   <p className="text-center font-black text-gray-700 text-xs">{format(new Date(sub.completedAt), 'MMM d')}</p>
                                 </div>
                               </div>
                             </div>

                             <div className="space-y-2 mt-2">
                               {onViewSubmission && (
                                 <button 
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     onViewSubmission(sub, task);
                                   }}
                                   className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${
                                     isGraded 
                                       ? 'bg-blue-50 text-blue-600 border-2 border-blue-100 hover:bg-blue-100' 
                                       : 'bg-emerald-500 text-white shadow-[0_4px_0_0_#059669] hover:bg-emerald-400 active:translate-y-1 active:shadow-none'
                                   }`}
                                 >
                                   {isGraded ? <Eye size={16} /> : <Target size={16} />}
                                   {isGraded ? 'Review' : 'Grade'}
                                 </button>
                               )}
                               
                               <div className="grid grid-cols-2 gap-3">
                                 <button 
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     generateResponsePDF(sub, task, false);
                                   }}
                                   className="flex items-center justify-center gap-2 py-2 rounded-xl font-black uppercase tracking-widest text-[8px] border-2 border-gray-100 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all"
                                 >
                                   <Download size={12} />
                                   Raw
                                 </button>
                                 {isGraded && (
                                   <button 
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       generateResponsePDF(sub, task, true);
                                     }}
                                     className="flex items-center justify-center gap-2 py-2 rounded-xl font-black uppercase tracking-widest text-[8px] border-2 border-emerald-100 text-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 transition-all shadow-sm"
                                   >
                                     <FileText size={12} />
                                     Report
                                    </button>
                                 )}
                               </div>

                               {isAdmin && onDeleteSubmission && (
                                 <button 
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     setDeleteConfirmation({ id: sub.id, type: 'submission', title: `${sub.studentName}'s submission` });
                                   }}
                                   className="flex items-center justify-center gap-2 py-2 text-red-300 hover:text-red-500 rounded-xl font-black uppercase tracking-widest text-[8px] transition-all w-full"
                                 >
                                   <Trash2 size={12} />
                                   Purge
                                 </button>
                               )}
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
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">                {tasks.map(task => {
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
                          setIsPasscodeModalOpen(true);
                        } else if (isAdmin && onUpdateTask) {
                          setEditingTask(task);
                        } else if (!isAdmin && isTest && !isCompleted) {
                          setSelectedTaskForPasscode(task);
                          setIsPasscodeModalOpen(true);
                        } else if (!isAdmin && !isCompleted) {
                          onStartTask(task);
                        }
                      }}
                      className={`rounded-[2.5rem] p-6 shadow-xl text-white cursor-pointer relative overflow-hidden group h-full flex flex-col min-h-[220px] transition-all border-b-4
                        ${isSelectedDate ? 'ring-4 ring-offset-4 ring-emerald-400' : ''}
                        ${isCompleted 
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-200 border-emerald-700' 
                          : isTest 
                            ? 'bg-red-600 shadow-red-200 border-red-800'
                            : 'bg-gradient-to-br from-orange-400 to-amber-600 shadow-orange-200 border-orange-700'}
                      `}
                    >
                      {isTest && !isCompleted && (
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-transparent to-red-500 animate-pulse opacity-50" />
                      )}
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        {isCompleted ? <CheckCircle2 size={100} /> : isTest ? <ShieldCheck size={100} /> : <Clock size={100} />}
                      </div>
                      
                      <div className="relative z-10 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`w-10 h-10 rounded-2xl backdrop-blur-md flex items-center justify-center border border-white/20 transition-transform group-hover:scale-110 ${isTest && !isCompleted ? 'bg-red-500 shadow-lg shadow-red-500/50' : 'bg-white/20'}`}>
                            {isCompleted ? <CheckCircle2 size={20} /> : isTest ? <ShieldCheck size={20} /> : <Target size={20} />}
                          </div>
                          <div className="flex items-center gap-2">
                             {isAdmin && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmation({ id: task.id, type: 'task', title: task.title });
                                }}
                                className="w-8 h-8 rounded-xl bg-white/20 hover:bg-red-500 flex items-center justify-center transition-all backdrop-blur-sm border border-white/10 group/trash"
                                title="Delete Assignment"
                              >
                                <Trash2 size={14} className="group-hover/trash:scale-110" />
                              </button>
                            )}
                             {isTest && (
                               <div className="bg-white/10 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md border border-white/10 flex items-center gap-1">
                                 <Timer size={10} className="text-red-400" /> {task.timeLimit}m
                               </div>
                             )}
                            {isAdmin && isTest && (
                              <div className="bg-red-600 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg border border-red-400/30">
                                KEY: {task.passcode}
                              </div>
                            )}
                            {isCompleted && (
                              <div className="bg-white/30 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md">
                                Done
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="flex flex-col gap-0.5 mb-1">
                            {isTest && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[8px] font-black uppercase bg-red-600 px-2 py-0.5 rounded text-white shadow-sm">Secure Examination</span>
                                {task.isABVersion && <span className="text-[8px] font-black uppercase bg-blue-600 px-2 py-0.5 rounded text-white italic">A/B</span>}
                              </div>
                            )}
                            <h3 className="text-xl font-black uppercase tracking-tight leading-none line-clamp-2 mt-1 group-hover:translate-x-1 transition-transform">{task.title}</h3>
                          </div>
                          <p className={`text-white/70 text-[10px] font-bold mb-6 line-clamp-2 uppercase tracking-wide italic ${isTest ? 'text-red-200' : ''}`}>
                            {task.description || (isTest ? "Standard Security Protocol Active" : "Active Assignment")}
                          </p>
                        </div>
                        
                        <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between">
                          <div className="flex items-center gap-2 bg-black/10 px-3 py-1.5 rounded-xl border border-white/5">
                            <CalendarIcon size={12} className="text-white/60" />
                            <span className="text-[9px] font-black uppercase tracking-widest">{format(taskDate, 'MMM d, yyyy')}</span>
                          </div>
                          {isCompleted ? (
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                 <p className="text-[8px] font-black text-white/50 uppercase tracking-widest mb-0.5">Grade</p>
                                 <p className="text-xs font-black">{submission?.results?.score !== undefined ? `${submission?.results?.score}/${submission?.results?.total}` : 'Pending'}</p>
                              </div>
                              {submission && submission.feedback && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    generateResponsePDF(submission, task, true);
                                  }}
                                  className="bg-white/20 text-white p-2 rounded-xl hover:bg-white hover:text-emerald-600 hover:scale-110 active:scale-95 transition-all shadow-sm backdrop-blur-sm border border-white/20"
                                  title="Download Graded Report"
                                >
                                  <FileText size={14} />
                                </button>
                              )}
                            </div>
                          ) : (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isTest) {
                                  setSelectedTaskForPasscode(task);
                                  setIsPasscodeModalOpen(true);
                                } else {
                                  onStartTask(task);
                                }
                              }}
                              className={`bg-white p-2 rounded-xl hover:scale-110 active:scale-95 transition-all shadow-sm ${isTest ? 'text-red-600' : 'text-blue-600'}`}
                            >
                              <ArrowRight size={14} />
                            </button>
                          )}
                        </div>


                      {/* Task Info Area */}
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

          <div className="w-full lg:w-80 lg:sticky lg:top-24 h-fit space-y-6">
            <CalendarSection tasks={tasks} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
          </div>
        </div>
      )}

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
    </div>
  );
};

export default TasksView;
