import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, CheckCircle2, ListChecks, Users, Clock, Plus, Trash2, Layout, Calendar as CalendarIcon, ChevronLeft, ChevronRight as ChevronRightIcon, Target, List, FileText, Eye, ArrowRight, User, Download, Info } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, startOfDay } from 'date-fns';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { GoogleGenAI } from "@google/genai";
import { db } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';

import { Task, TaskSubmission, Unit } from '../../types';

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
  onDeleteTask,
  onStartTask,
  onViewSubmission,
  onDeleteSubmission,
  onWipeCleanSlate
}: TasksViewProps) => {
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [isCreatorOpen, setIsCreatorOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'tasks' | 'submissions'>('tasks');
  const [submissionFilter, setSubmissionFilter] = React.useState('');
  const [nukeLevel, setNukeLevel] = React.useState(0);
  const [markschemePdfUrl, setMarkschemePdfUrl] = React.useState('');
  const [isParsing, setIsParsing] = React.useState(false);

  const [newTask, setNewTask] = React.useState<Partial<Task>>({
    title: '',
    description: '',
    units: [1],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'active'
  });

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
    await onCreateTask(newTask);
    setIsCreatorOpen(false);
    setNewTask({
      title: '',
      description: '',
      units: [1],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active'
    });
    setMarkschemePdfUrl('');
  };

  const handleParseAndLaunch = async () => {
    if (!newTask.title || !newTask.pdfUrl || !markschemePdfUrl) {
      alert("Please provide Task Title, Worksheet PDF URL, and Markscheme PDF URL.");
      return;
    }

    setIsParsing(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'undefined') {
        throw new Error("Gemini API Key is missing.");
      }
      const ai = new GoogleGenAI({ apiKey });

      // Fetch PDFs
      const fetchPdfAsBase64 = async (url: string) => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch PDF from ${url}`);
        const blob = await response.blob();
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      };

      const [worksheetBase64, markschemeBase64] = await Promise.all([
        fetchPdfAsBase64(newTask.pdfUrl),
        fetchPdfAsBase64(markschemePdfUrl)
      ]);

      // 1. Parse questions from worksheet
      const questionsPrompt = `
        You are an expert curriculum parser. Parse the questions from this worksheet PDF. 
        Output a STRICT JSON array of question objects, each with:
        - "id": string (e.g., "q1", "q2")
        - "text": string (the question text)
        - "type": string (e.g., "short-response", "table", "mcq")
        - "page": number (the page it appears on, usually 1 or 2)
        If the type is "table", include a "tableData" array of arrays representing the table structure (headers as the first array).
      `;
      const questionsResponse = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-preview",
        contents: [
          { inlineData: { data: worksheetBase64, mimeType: "application/pdf" } },
          { text: questionsPrompt }
        ],
        config: { responseMimeType: "application/json" }
      });
      const parsedQuestions = JSON.parse(questionsResponse.text || "[]");

      // 2. Parse markscheme
      const markschemePrompt = `
        You are an expert curriculum parser. Extract the full grading rubric and correct answers from this markscheme PDF.
        Output ONLY the raw markdown text for the final rubric string, no JSON structure. Do NOT wrap it in a JSON object.
        Ensure it is clear, well-formatted, and explicitly links to the worksheet questions.
      `;
      const markschemeResponse = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-preview",
        contents: [
          { inlineData: { data: markschemeBase64, mimeType: "application/pdf" } },
          { text: markschemePrompt }
        ]
      });
      const parsedMarkscheme = markschemeResponse.text || "Grade based on standard scientific principles.";

      // 3. Save markscheme to Firestore
      const taskKey = newTask.title.replace('y8 ', '');
      await setDoc(doc(db, 'markschemes', taskKey), { content: parsedMarkscheme });

      // 4. Create Task
      await onCreateTask({
        ...newTask,
        type: 'worksheet',
        worksheetQuestions: parsedQuestions
      });

      setIsCreatorOpen(false);
      setNewTask({
        title: '',
        description: '',
        units: [1],
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'active'
      });
      setMarkschemePdfUrl('');
    } catch (error: any) {
      console.error(error);
      alert("Parsing failed: " + error.message);
    } finally {
      setIsParsing(false);
    }
  };

  const generateResponsePDF = (submission: TaskSubmission, task: Task, includeFeedback: boolean = false) => {
    const doc = new jsPDF();
    const primaryColor: [number, number, number] = includeFeedback ? [16, 185, 129] : [59, 130, 246]; // Emerald for reports, Blue for raw submissions
    
    // Top Color Bar (High-contrast aesthetic)
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 8, 'F');
    
    let currentY = 22;

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(31, 41, 55);
    doc.text(includeFeedback ? "Performance Analysis Report" : "Submission Export", 15, currentY);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(156, 163, 175);
    doc.text(`Generated on ${format(new Date(), 'PPP p')}`, 15, currentY + 6);
    
    currentY += 15;

    // NEW: Teacher's General Feedback at the START (if report)
    if (includeFeedback && submission.feedback) {
      const feedbackText = submission.generalFeedback || "Comprehensive review of accuracy, reasoning, and conceptual understanding demonstrated in this task.";
      const splitFeedback = doc.splitTextToSize(feedbackText, 170);
      const textHeight = splitFeedback.length * 5;
      const boxHeight = 15 + textHeight + 5;

      doc.setFillColor(240, 253, 244); // Light emerald background
      doc.rect(15, currentY, 180, boxHeight, 'F');
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(16, 185, 129);
      doc.text("Teacher's General Feedback", 20, currentY + 10);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(55, 65, 81);
      doc.text(splitFeedback, 20, currentY + 18);
      
      currentY += boxHeight + 10;
    }

    // Student & Task Info Box
    autoTable(doc, {
      startY: currentY,
      body: [
        ['Student Name:', submission.studentName],
        ['Assignment:', task.title],
        ['Completion Time:', format(new Date(submission.completedAt), 'PPP p')],
        ['Performance Metric:', submission.results ? `${submission.results.score} / ${submission.results.total} (${Math.round((submission.results.score/submission.results.total)*100)}%)` : 'Awaiting Grading']
      ],
      theme: 'grid',
      styles: { 
        fontSize: 10, 
        cellPadding: 4,
        lineColor: [230, 230, 230],
        lineWidth: 0.1
      },
      columnStyles: { 
        0: { fontStyle: 'bold', cellWidth: 45, fillColor: [249, 250, 251], textColor: [100, 116, 139] },
        1: { fillColor: [255, 255, 255], textColor: [15, 23, 42], fontStyle: 'bold' }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 12;

    const tableData = task.worksheetQuestions?.map((q, idx) => {
      let response = submission.responses?.[q.id];
      const feedback = submission.feedback?.[q.id];
      
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

  return (
    <div className="flex flex-col flex-1 h-full max-w-7xl mx-auto w-full p-6 space-y-8 pb-24 mt-4">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${isAdmin ? 'bg-emerald-500 shadow-lg shadow-emerald-100' : 'bg-blue-500 shadow-lg shadow-blue-100'}`}>
              {isAdmin ? <Layout size={20} /> : <Target size={20} />}
            </div>
            <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tight">
              {isAdmin ? "Admin Command Center" : "Tasks Dashboard"}
            </h1>
          </div>
          <p className="text-gray-500 font-medium px-1">
            {isAdmin ? "Oversee performance, manage assignments, and review work." : "Your learning journey at a glance."}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {isAdmin && (
            <div className="bg-white p-1 rounded-2xl flex items-center border-2 border-gray-100 shadow-sm">
              <button 
                onClick={() => setActiveTab('tasks')}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  activeTab === 'tasks' ? 'bg-emerald-500 text-white shadow-md' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
              >
                <ListChecks size={14} />
                Assignments
              </button>
              <button 
                onClick={() => setActiveTab('submissions')}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  activeTab === 'submissions' ? 'bg-emerald-500 text-white shadow-md' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Users size={14} />
                Active Inbox
              </button>
            </div>
          )}

          {isAdmin && (
            <div className="flex gap-2">
              <button 
                onClick={() => setIsCreatorOpen(true)}
                className="bg-emerald-500 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 shadow-[0_4px_0_0_#059669] active:translate-y-1 active:shadow-none transition-all h-[42px]"
              >
                <Plus size={18} />
                New Task
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
                  className={`bg-red-500 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 shadow-[0_4px_0_0_#ef4444] active:translate-y-1 active:shadow-none transition-all h-[42px] ${nukeLevel > 0 ? 'animate-pulse' : ''}`}
                >
                  <Trash2 size={18} />
                  {nukeLevel === 0 ? "Purge" : nukeLevel === 1 ? "Confirm?" : "WIPE ALL!"}
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Admin Quick Stats Bar */}
      {isAdmin && (
        <div className="space-y-6">
          {tasks.some(t => t.title.toLowerCase() === 'y8 8.4' || t.title.toLowerCase() === 'y8 8.5') && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="bg-amber-50 border-2 border-amber-200 rounded-[2.5rem] p-6 flex flex-col md:flex-row items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 text-amber-700">
                <div className="bg-amber-200 p-3 rounded-2xl">
                  <Trash2 size={24} />
                </div>
                <div>
                  <p className="font-black uppercase tracking-tight">Legacy Tasks Detected</p>
                  <p className="text-sm font-medium opacity-80">Tasks y8 8.4 and/or y8 8.5 are still in your database. These were requested for deletion.</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  tasks.forEach(t => {
                    if (t.title.toLowerCase() === 'y8 8.4' || t.title.toLowerCase() === 'y8 8.5') {
                      onDeleteTask(t.id);
                    }
                  });
                }}
                className="bg-amber-500 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs shadow-[0_4px_0_0_#d97706] active:translate-y-1 active:shadow-none transition-all"
              >
                Purge Now
              </button>
            </motion.div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-[2rem] border-2 border-gray-100 shadow-sm">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Tasks</p>
              <p className="text-2xl font-black text-gray-800 tracking-tight">{tasks.length}</p>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border-2 border-gray-100 shadow-sm">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Submissions</p>
              <p className="text-2xl font-black text-blue-500 tracking-tight">{allSubmissions.length}</p>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border-2 border-gray-100 shadow-sm">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pending Grading</p>
              <p className="text-2xl font-black text-orange-500 tracking-tight">
                {allSubmissions.filter(s => !s.feedback).length}
              </p>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border-2 border-gray-100 shadow-sm">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Students Active</p>
              <p className="text-2xl font-black text-emerald-500 tracking-tight">
                {new Set(allSubmissions.map(s => s.userId)).size}
              </p>
            </div>
          </div>
        </div>
      )}

      {isAdmin && isCreatorOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl border-4 border-emerald-100 shadow-xl"
        >
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  className="w-full p-4 rounded-2xl border-2 border-gray-100 font-bold outline-none"
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
                  className="w-full p-4 rounded-2xl border-2 border-gray-100 font-bold outline-none"
                />
              </div>
              <div className="space-y-4">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Description</label>
                <input 
                  type="text" 
                  value={newTask.description}
                  onChange={e => setNewTask({...newTask, description: e.target.value})}
                  className="w-full p-4 rounded-2xl border-2 border-gray-100 font-bold outline-none"
                  placeholder="Optional details..."
                />
              </div>
              <div className="space-y-4 md:col-span-2">
                <div className="flex items-center gap-2 mb-2">
                   <div className="flex-1 h-px bg-gray-100"></div>
                   <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Interactive Worksheet Setup (Optional)</span>
                   <div className="flex-1 h-px bg-gray-100"></div>
                </div>
              </div>
              <div className="space-y-4">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Worksheet PDF URL</label>
                <input 
                  type="url" 
                  value={newTask.pdfUrl || ''}
                  onChange={e => setNewTask({...newTask, pdfUrl: e.target.value})}
                  className="w-full p-4 rounded-2xl border-2 border-gray-100 font-bold focus:border-emerald-500 outline-none"
                  placeholder="https://.../sheet.pdf"
                />
              </div>
              <div className="space-y-4">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Markscheme PDF URL</label>
                <input 
                  type="url" 
                  value={markschemePdfUrl}
                  onChange={e => setMarkschemePdfUrl(e.target.value)}
                  className="w-full p-4 rounded-2xl border-2 border-gray-100 font-bold focus:border-emerald-500 outline-none"
                  placeholder="https://.../markscheme.pdf"
                />
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button 
                type="button"
                onClick={() => setIsCreatorOpen(false)}
                className="px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs text-gray-400 hover:bg-gray-50"
                disabled={isParsing}
              >
                Cancel
              </button>
              {(newTask.pdfUrl && markschemePdfUrl) ? (
                <button 
                  type="button"
                  onClick={handleParseAndLaunch}
                  disabled={isParsing}
                  className="bg-purple-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-[0_6px_0_0_#a855f7] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 min-w-[240px]"
                >
                  {isParsing ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : "Parse PDF & Launch"}
                </button>
              ) : (
                <button 
                  type="submit"
                  className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-[0_6px_0_0_#059669] active:translate-y-1 active:shadow-none transition-all"
                >
                  Launch Task
                </button>
              )}
            </div>
          </form>
        </motion.div>
      )}

      {activeTab === 'submissions' && isAdmin ? (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="flex flex-col md:flex-row items-center gap-4">
             <div className="flex-1 bg-white p-4 rounded-[2rem] border-2 border-gray-100 shadow-sm flex items-center gap-4">
               <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 shadow-inner shrink-0">
                 <Users size={24} />
               </div>
               <div>
                 <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">Grading Queue</h3>
                 <p className="text-gray-500 text-xs font-medium">Review and grade student worksheet submissions.</p>
               </div>
             </div>

             <div className="w-full md:w-96 relative">
               <input 
                 type="text"
                 placeholder="Search students or tasks..."
                 value={submissionFilter}
                 onChange={(e) => setSubmissionFilter(e.target.value)}
                 className="w-full pl-12 pr-4 py-4 rounded-[2rem] border-2 border-gray-100 font-bold focus:border-emerald-500 outline-none transition-all bg-white shadow-sm"
               />
               <List className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
             </div>
           </div>
           
           <div className="space-y-8">
             {(Object.entries(submissionsByTask) as [string, TaskSubmission[]][]).map(([taskId, subs]) => {
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
                                     onDeleteSubmission(sub.id);
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
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
              {tasks.map(task => {
                const isCompleted = mySubmissions.some(sub => sub.taskId === task.id);
                const submission = mySubmissions.find(sub => sub.taskId === task.id);
                const taskDate = task.dueDate.includes('T') ? parseISO(task.dueDate) : new Date(task.dueDate + 'T00:00:00');
                const isSelectedDate = isSameDay(startOfDay(taskDate), startOfDay(selectedDate));
                
                return (
                  <motion.div 
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -5 }}
                    className={`rounded-[2rem] p-5 md:p-6 shadow-lg text-white cursor-pointer relative overflow-hidden group h-full flex flex-col min-h-[200px] transition-all
                      ${isSelectedDate ? 'ring-4 ring-offset-4 ring-emerald-400' : ''}
                      ${isCompleted 
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600' 
                        : 'bg-gradient-to-br from-orange-400 to-amber-600'}
                    `}
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      {isCompleted ? <CheckCircle2 size={80} /> : <Clock size={80} />}
                    </div>
                    
                    <div className="relative z-10 flex flex-col h-full">
                      <div className="flex items-center justify-between mb-4">
                        <div className="bg-white/20 w-10 h-10 rounded-xl backdrop-blur-sm flex items-center justify-center border border-white/20">
                          {isCompleted ? <CheckCircle2 size={20} /> : <Target size={20} />}
                        </div>
                        {isCompleted && (
                          <div className="bg-white/30 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-sm">
                            Done
                          </div>
                        )}
                      </div>

                      <h3 className="text-lg font-black uppercase tracking-tight leading-tight mb-2 line-clamp-2">{task.title}</h3>
                      <p className="text-white/70 text-[10px] font-bold mb-6 line-clamp-2 uppercase tracking-wide">
                        {task.description || "Active Assignment"}
                      </p>
                      
                      <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock size={12} className="text-white/60" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{format(taskDate, 'MMM d')}</span>
                        </div>
                        {isCompleted ? (
                          <div className="text-right">
                             <p className="text-[8px] font-black text-white/50 uppercase tracking-widest mb-0.5">Grade</p>
                             <p className="text-xs font-black">{submission?.results?.score}/{submission?.results?.total}</p>
                          </div>
                        ) : (
                          <button 
                            onClick={() => onStartTask(task)}
                            className="bg-white text-blue-600 p-2 rounded-xl hover:scale-110 active:scale-95 transition-all shadow-sm"
                          >
                            <ArrowRight size={14} />
                          </button>
                        )}
                      </div>

                      {isAdmin && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTask(task.id);
                          }}
                          className="absolute -top-1 -right-1 w-7 h-7 bg-white/20 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
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
