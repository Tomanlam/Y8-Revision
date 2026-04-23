import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, CheckCircle2, ListChecks, Users, Clock, Plus, Trash2, Layout, Calendar as CalendarIcon, ChevronLeft, ChevronRight as ChevronRightIcon, Target, List, FileText, Eye, ArrowRight, User, Download } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, startOfDay } from 'date-fns';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { Task, TaskSubmission, Unit } from '../../types';

interface TasksViewProps {
  key?: string;
  currentEventMessageIndex: number;
  eventMessages: string[];
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

const CalendarSection = ({ tasks, onStartTask }: { tasks: Task[], onStartTask: (task: Task) => void }) => {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState(new Date());

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

  const tasksForSelectedDate = (tasks || []).filter(task => {
    try {
      const taskDate = task.dueDate.includes('T') ? parseISO(task.dueDate) : new Date(task.dueDate + 'T00:00:00');
      return isSameDay(startOfDay(taskDate), startOfDay(selectedDate));
    } catch {
      return false;
    }
  });

  return (
    <div className="bg-white border-2 border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Calendar Side */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                <CalendarIcon size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-800 tracking-tight leading-none uppercase">{format(currentDate, 'MMMM yyyy')}</h3>
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Upcoming Tasks</span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
              <button onClick={prevMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-500">
                <ChevronLeft size={20} />
              </button>
              <button onClick={nextMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-500">
                <ChevronRightIcon size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
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
              const isCurrentMonth = isSameMonth(day, monthStart);
              const hasTasks = dayTasks.length > 0;

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    group relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all
                    ${isSelected ? 'bg-blue-500 text-white shadow-lg shadow-blue-100 scale-105 z-10' : 'hover:bg-gray-50'}
                    ${!isCurrentMonth ? 'opacity-20 translate-y-1 scale-95' : 'opacity-100'}
                  `}
                >
                  <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                    {format(day, 'd')}
                  </span>
                  {hasTasks && (
                    <div className={`mt-1 flex gap-1 transform transition-transform group-hover:scale-125 ${isSelected ? 'opacity-100' : 'opacity-100'}`}>
                      {dayTasks.slice(0, 3).map((_, i) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-400'}`} />
                      ))}
                    </div>
                  )}
                  {isSelected && (
                    <motion.div layoutId="bubble" className="absolute inset-0 border-4 border-blue-500 rounded-2xl pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tasks Preview Side */}
        <div className="w-full md:w-80 bg-gray-50 rounded-3xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-black text-gray-800 uppercase text-xs tracking-widest">
              {isSameDay(selectedDate, new Date()) ? 'Today' : format(selectedDate, 'MMM d, yyyy')}
            </h4>
            <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              {tasksForSelectedDate.length} Tasks
            </span>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar max-h-[300px]">
            {tasksForSelectedDate.length > 0 ? (
              tasksForSelectedDate.map(task => (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={task.id}
                  className="bg-white p-5 rounded-2xl border-2 border-transparent hover:border-blue-200 transition-all cursor-pointer group shadow-sm"
                  onClick={() => onStartTask(task)}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center font-black group-hover:bg-blue-500 group-hover:text-white transition-all">
                      <Target size={20} />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-black text-gray-800 text-sm leading-tight mb-1">{task.title}</h5>
                      <p className="text-gray-500 text-[10px] font-bold uppercase truncate max-w-[120px]">
                        {task.description}
                      </p>
                    </div>
                    <div className="self-center">
                      <ChevronRightIcon size={16} className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="bg-white p-4 rounded-3xl shadow-sm mb-4">
                  <Layout size={32} className="text-gray-300" />
                </div>
                <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">No tasks scheduled for this day</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const TasksView = ({ 
  currentEventMessageIndex, 
  eventMessages, 
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
  const [viewType, setViewType] = React.useState<'agenda' | 'monthly'>('agenda');
  const [isCreatorOpen, setIsCreatorOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'tasks' | 'submissions'>('tasks');
  const [submissionFilter, setSubmissionFilter] = React.useState('');
  const [nukeLevel, setNukeLevel] = React.useState(0);
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
  };

  const generateResponsePDF = (submission: TaskSubmission, task: Task, includeFeedback: boolean = false) => {
    const doc = new jsPDF();
    const primaryColor = [16, 185, 129] as [number, number, number]; // Emerald 500
    
    // Top Color Bar
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 6, 'F');
    
    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(31, 41, 55);
    doc.text(includeFeedback ? "Marked Worksheet Report" : "Student Worksheet Submission", 15, 22);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(156, 163, 175);
    doc.text(`Generated on ${format(new Date(), 'PPP p')}`, 15, 28);
    
    // Student & Task Info Box
    autoTable(doc, {
      startY: 35,
      body: [
        ['Student Name:', submission.studentName],
        ['Task Title:', task.title],
        ['Date Submitted:', format(new Date(submission.completedAt), 'PPP p')],
        ['Overall Score:', submission.results ? `${submission.results.score} / ${submission.results.total}` : 'Pending Grading']
      ],
      theme: 'grid',
      styles: { 
        fontSize: 10, 
        cellPadding: 4,
        lineColor: [255, 255, 255],
        lineWidth: 1
      },
      columnStyles: { 
        0: { fontStyle: 'bold', cellWidth: 40, fillColor: [243, 244, 246], textColor: [55, 65, 81] },
        1: { fillColor: [249, 250, 251], textColor: [17, 24, 39] }
      }
    });

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
        row.push(feedback ? `[Score: ${feedback.score}]\n\n${feedback.feedback}` : '---');
      }

      return row;
    }) || [];

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [includeFeedback ? ['#', 'Question', 'Student Response', 'Teacher Feedback'] : ['#', 'Question', 'Student Response']],
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
        lineColor: [255, 255, 255], // White borders to create bubble effect
        lineWidth: 2
      },
      columnStyles: includeFeedback ? {
        0: { cellWidth: 10, halign: 'center', fillColor: [249, 250, 251], textColor: [100, 100, 100] },
        1: { cellWidth: 50, fillColor: [249, 250, 251], textColor: [31, 41, 55], fontStyle: 'bold' },
        2: { cellWidth: 65, fillColor: [239, 246, 255], textColor: [30, 58, 138], fontStyle: 'bold' }, // Blue bubble for student
        3: { cellWidth: 65, fillColor: [254, 242, 242], textColor: [153, 27, 27], fontStyle: 'italic' } // Red bubble for teacher
      } : {
        0: { cellWidth: 10, halign: 'center', fillColor: [249, 250, 251], textColor: [100, 100, 100] },
        1: { cellWidth: 80, fillColor: [249, 250, 251], textColor: [31, 41, 55], fontStyle: 'bold' },
        2: { cellWidth: 90, fillColor: [239, 246, 255], textColor: [30, 58, 138], fontStyle: 'bold' }
      }
    });

    if (includeFeedback && submission.feedback) {
      const finalY = (doc as any).lastAutoTable.finalY || 150;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(16, 185, 129);
      doc.text("Teacher's General Feedback", 15, finalY + 15);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(156, 163, 175);
      doc.text("All responses are verified using Gemini AI Lite according to official mark schemes.", 15, finalY + 22);
    }

    doc.save(`${includeFeedback?'Report':'Submission'}_${submission.studentName.replace(/\s+/g, '_')}_${task.title.substring(0,15).replace(/\s+/g, '_')}.pdf`);
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

          {activeTab === 'tasks' && (
            <div className="bg-gray-100/50 p-1 rounded-2xl flex items-center shadow-inner border border-gray-200">
              <button 
                onClick={() => setViewType('agenda')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  viewType === 'agenda' ? 'bg-white text-emerald-600 shadow-sm border border-emerald-100' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <List size={14} />
                List
              </button>
              <button 
                onClick={() => setViewType('monthly')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  viewType === 'monthly' ? 'bg-white text-emerald-600 shadow-sm border border-emerald-100' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <CalendarIcon size={14} />
                Monthly
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
            </div>
            <div className="flex justify-end gap-4 mt-6">
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

      {activeTab === 'submissions' && isAdmin ? (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="bg-white p-6 rounded-[2.5rem] border-2 border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-6">
             <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 shadow-inner">
               <Users size={32} />
             </div>
             <div className="flex-1 text-center md:text-left">
               <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Grading Queue</h3>
               <p className="text-gray-500 font-medium">Verify submissions and provide automated feedback with Gemini.</p>
             </div>
             <div className="w-full md:w-auto relative">
                <input 
                  type="text"
                  placeholder="Search students or tasks..."
                  value={submissionFilter}
                  onChange={(e) => setSubmissionFilter(e.target.value)}
                  className="w-full md:w-64 pl-12 pr-4 py-3 rounded-2xl border-2 border-gray-50 font-bold focus:border-emerald-500 outline-none transition-all bg-gray-50/50"
                />
                <List className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
             </div>
           </div>
           
           <div className="space-y-16">
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
                             whileHover={{ y: -8 }}
                             className={`group bg-white p-8 rounded-[2.5rem] border-2 transition-all relative flex flex-col justify-between shadow-sm overflow-hidden ${
                               isGraded ? 'border-emerald-100 hover:border-emerald-300' : 'border-gray-100 shadow-xl shadow-gray-100/50 hover:border-orange-200'
                             }`}
                           >
                             {/* Background Decoration */}
                             <div className={`absolute -top-12 -right-12 w-24 h-24 rounded-full opacity-5 group-hover:opacity-10 transition-opacity ${isGraded ? 'bg-emerald-500' : 'bg-orange-500'}`} />

                             <div>
                               <div className="flex justify-between items-start mb-6">
                                 <div className="flex items-center gap-3">
                                   <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors border-2 border-gray-100">
                                     <User size={24} />
                                   </div>
                                   <div>
                                     <h4 className="font-black text-gray-800 text-base uppercase truncate max-w-[150px] tracking-tight">{sub.studentName}</h4>
                                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Student</p>
                                   </div>
                                 </div>
                                 <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border-2 ${statusColor}`}>
                                   {statusText}
                                 </div>
                               </div>

                               <div className="grid grid-cols-2 gap-4 mb-4">
                                 <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 text-center">Score</p>
                                   <p className={`text-xl font-black text-center ${isGraded ? 'text-emerald-500' : 'text-gray-400 italic text-sm'}`}>
                                     {isGraded ? `${sub.results?.score} / ${sub.results?.total}` : 'Pending'}
                                   </p>
                                 </div>
                                 <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 text-center">Submitted</p>
                                   <p className="text-center font-black text-gray-700 text-sm">{format(new Date(sub.completedAt), 'MMM d')}</p>
                                 </div>
                               </div>
                             </div>

                             <div className="space-y-3 mt-6">
                               {onViewSubmission && (
                                 <button 
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     onViewSubmission(sub, task);
                                   }}
                                   className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${
                                     isGraded 
                                       ? 'bg-blue-50 text-blue-600 border-2 border-blue-100 hover:bg-blue-100 active:scale-95' 
                                       : 'bg-emerald-500 text-white shadow-[0_6px_0_0_#059669] hover:bg-emerald-400 active:translate-y-1 active:shadow-none'
                                   }`}
                                 >
                                   {isGraded ? <Eye size={18} /> : <Target size={18} />}
                                   {isGraded ? 'Review Work' : 'Grade Worksheet'}
                                 </button>
                               )}
                               
                               <div className="grid grid-cols-2 gap-3">
                                 <button 
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     generateResponsePDF(sub, task, false);
                                   }}
                                   className="flex items-center justify-center gap-2 py-3 rounded-2xl font-black uppercase tracking-widest text-[9px] border-2 border-gray-100 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all font-black"
                                 >
                                   <Download size={14} />
                                   Raw PDF
                                 </button>
                                 {isGraded && (
                                   <button 
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       generateResponsePDF(sub, task, true);
                                     }}
                                     className="flex items-center justify-center gap-2 py-3 rounded-2xl font-black uppercase tracking-widest text-[9px] border-2 border-emerald-100 text-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 transition-all shadow-sm font-black"
                                   >
                                     <FileText size={14} />
                                     Full Report
                                    </button>
                                 )}
                               </div>

                               {isAdmin && onDeleteSubmission && (
                                 <button 
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     onDeleteSubmission(sub.id);
                                   }}
                                   className="flex items-center justify-center gap-2 py-3 text-red-300 hover:text-red-500 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all w-full mt-2"
                                 >
                                   <Trash2 size={14} />
                                   Purge Submission
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
      ) : viewType === 'monthly' ? (
        <CalendarSection tasks={tasks} onStartTask={onStartTask} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Event Mode Card */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowEasterNotice(true)}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-[2rem] p-5 md:p-6 shadow-lg text-white cursor-pointer relative overflow-hidden group h-full flex flex-col"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Star size={100} />
            </div>
            <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 w-10 h-10 rounded-xl backdrop-blur-sm flex items-center justify-center border border-white/20">
                      <Star className="text-white" size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-black uppercase tracking-tight leading-none">Event Mode</h2>
                      <p className="text-emerald-100 font-bold text-[10px] uppercase tracking-widest mt-1 opacity-80">Special Content</p>
                    </div>
                  </div>
                  <div className="bg-white text-teal-600 p-2 rounded-xl shadow-sm">
                    <ArrowRight size={16} />
                  </div>
                </div>
                
                <div className="bg-white/10 rounded-2xl p-4 border border-white/10 backdrop-blur-sm flex-1 flex items-center min-h-[80px]">
                  <div className="relative w-full">
                    <AnimatePresence mode="wait">
                      <motion.p 
                        key={currentEventMessageIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="text-white font-medium text-sm leading-tight italic"
                      >
                        "{eventMessages[currentEventMessageIndex]}"
                      </motion.p>
                    </AnimatePresence>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-pulse" />
                  <span>Limited Time Event</span>
                </div>
            </div>
          </motion.div>

          {tasks.map(task => {
            const isCompleted = mySubmissions.some(sub => sub.taskId === task.id);
            const submission = mySubmissions.find(sub => sub.taskId === task.id);
            
            return (
              <motion.div 
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-3xl border-2 border-gray-100 shadow-sm relative group flex flex-col"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-500">
                    <Layout size={24} />
                  </div>
                  {isCompleted ? (
                    <div className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                        <CheckCircle2 size={12} /> Done
                    </div>
                  ) : (
                    <div className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                      Pending
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-2 truncate">{task.title}</h3>
                <p className="text-gray-400 text-sm font-bold mb-6 line-clamp-2">{task.description || "No additional instructions provided."}</p>
                
                <div className="flex items-center justify-between mt-auto">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Due Date</p>
                    <p className="text-sm font-black text-gray-600">{new Date(task.dueDate).toLocaleDateString()}</p>
                  </div>
                  {isCompleted ? (
                    <div className="text-right">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Score</p>
                      <p className="text-sm font-black text-emerald-600">{submission?.results?.score} / {submission?.results?.total}</p>
                    </div>
                  ) : (
                    <button 
                      onClick={() => onStartTask(task)}
                      className="bg-emerald-500 text-white px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-[0_4px_0_0_#059669] active:translate-y-1 active:shadow-none transition-all"
                    >
                      Start
                    </button>
                  )}
                </div>

                {isAdmin && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteTask(task.id);
                    }}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-xl z-[30] cursor-pointer hover:scale-110 active:scale-95"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </motion.div>
            );
          })}

           {tasks.length === 0 && !isAdmin && (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
               <Clock size={48} className="text-gray-300 mb-4" />
               <h3 className="font-black text-gray-400 uppercase tracking-tight">No tasks assigned yet</h3>
             </div>
           )}
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
