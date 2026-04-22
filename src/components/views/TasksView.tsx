import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, CheckCircle2, ListChecks, Users, Clock, Plus, Trash2, Layout, Calendar as CalendarIcon, ChevronLeft, ChevronRight as ChevronRightIcon, Target, List, FileText, Eye } from 'lucide-react';
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
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(31, 41, 55);
    doc.text(includeFeedback ? "Marked Worksheet Report" : "Student Worksheet Submission", 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(156, 163, 175);
    doc.text(`Generated on ${format(new Date(), 'PPP p')}`, 20, 28);
    
    // Student & Task Info Box
    autoTable(doc, {
      startY: 35,
      body: [
        ['Student Name:', submission.studentName],
        ['Task Title:', task.title],
        ['Date Submitted:', format(new Date(submission.completedAt), 'PPP p')],
        ['Overall Score:', submission.results ? `${submission.results.score} / ${submission.results.total}` : 'Pending Grading']
      ],
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 1 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } }
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
        row.push(feedback ? `[${feedback.score}]\n${feedback.feedback}` : '---');
      }

      return row;
    }) || [];

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [includeFeedback ? ['#', 'Question', 'Student Response', 'Teacher Feedback'] : ['#', 'Question', 'Student Response']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] },
      columnStyles: includeFeedback ? {
        0: { cellWidth: 10 },
        1: { cellWidth: 50 },
        2: { cellWidth: 60, textColor: [168, 85, 247], fontStyle: 'bold' },
        3: { cellWidth: 60, textColor: [239, 68, 68] }
      } : {
        0: { cellWidth: 10 },
        1: { cellWidth: 80 },
        2: { cellWidth: 90, textColor: [168, 85, 247], fontStyle: 'bold' }
      },
      styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' }
    });

    if (includeFeedback && submission.feedback) {
      const finalY = (doc as any).lastAutoTable.finalY || 150;
      doc.setFontSize(14);
      doc.setTextColor(16, 185, 129);
      doc.text("Teacher's General Feedback", 20, finalY + 15);
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text("All responses are verified using Gemini AI Lite according to official mark schemes.", 20, finalY + 25);
    }

    doc.save(`${includeFeedback?'Report':'Submission'}_${submission.studentName}_${task.title.substring(0,15)}.pdf`);
  };

  return (
    <div className="flex flex-col flex-1 h-full max-w-7xl mx-auto w-full p-6 space-y-8 pb-24 mt-4">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tight">
            {isAdmin ? "Admin Dashboard" : "Tasks"}
          </h1>
          <p className="text-gray-500 font-medium mt-2">
            {isAdmin ? "Review student submissions and manage assignments." : "Complete assignments and special events."}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {isAdmin && (
            <div className="bg-gray-100 p-1.5 rounded-2xl flex items-center shadow-inner mr-2">
              <button 
                onClick={() => setActiveTab('tasks')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  activeTab === 'tasks' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Target size={14} />
                Tasks
              </button>
              <button 
                onClick={() => setActiveTab('submissions')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  activeTab === 'submissions' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Users size={14} />
                Submissions
              </button>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="bg-gray-100 p-1.5 rounded-2xl flex items-center shadow-inner">
              <button 
                onClick={() => setViewType('agenda')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  viewType === 'agenda' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <List size={14} />
                Agenda
              </button>
              <button 
                onClick={() => setViewType('monthly')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  viewType === 'monthly' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
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
                Create Task
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
                    // Reset nuke level if mouse leaves to be extra safe
                    if (nukeLevel > 0) setNukeLevel(0);
                  }}
                  className={`bg-red-500 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 shadow-[0_4px_0_0_#ef4444] active:translate-y-1 active:shadow-none transition-all h-[42px] ${nukeLevel > 0 ? 'animate-pulse' : ''}`}
                >
                  <Trash2 size={18} />
                  {nukeLevel === 0 ? "Nuke Data" : nukeLevel === 1 ? "Are you sure?" : "TRIPLE CONFIRM!"}
                </button>
              )}
            </div>
          )}
        </div>
      </header>

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
        <div className="space-y-8">
           <div className="flex items-center gap-4 bg-white p-6 rounded-3xl border-2 border-gray-100 shadow-sm">
             <div className="flex-1 relative">
                <input 
                  type="text"
                  placeholder="Search students or tasks..."
                  value={submissionFilter}
                  onChange={(e) => setSubmissionFilter(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-gray-50 font-bold focus:border-emerald-500 outline-none transition-all bg-gray-50/50"
                />
                <List className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
             </div>
           </div>
           
           <div className="space-y-12">
             {(Object.entries(submissionsByTask) as [string, TaskSubmission[]][]).map(([taskId, subs]) => {
               const task = tasks.find(t => t.id === taskId) || { id: taskId, title: `Unlinked Task (${taskId})`, dueDate: new Date().toISOString(), type: "worksheet" } as Task;
               
               const filteredSubs = subs.filter(s => 
                 s.studentName.toLowerCase().includes(submissionFilter.toLowerCase()) || 
                 task.title.toLowerCase().includes(submissionFilter.toLowerCase())
               );

               if (filteredSubs.length === 0) return null;

               return (
                 <div key={taskId} className="space-y-6">
                   <h4 className="font-black text-gray-800 text-lg uppercase border-b-2 border-gray-100 pb-2 flex items-center gap-2">
                     <Layout className="text-emerald-500" size={20} />
                     {task.title}
                   </h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {filteredSubs.map((sub) => {
                       let statusColor = 'bg-emerald-50 text-emerald-600';
                       let statusText = 'Completed';
                       
                       if (task.dueDate) {
                         const dueEnd = new Date(task.dueDate);
                         dueEnd.setHours(23, 59, 59, 999);
                         const subDate = new Date(sub.completedAt);
                         if (subDate.getTime() > dueEnd.getTime()) {
                           statusColor = 'bg-red-50 text-red-600';
                           statusText = 'Late';
                         } else if (dueEnd.getTime() - subDate.getTime() > 24 * 60 * 60 * 1000) {
                           statusColor = 'bg-blue-50 text-blue-600';
                           statusText = 'Early';
                         } else {
                           statusColor = 'bg-emerald-50 text-emerald-600';
                           statusText = 'On-time';
                         }
                       }
                       
                       return (
                         <motion.div 
                           key={sub.id}
                           whileHover={{ y: -5 }}
                           className="bg-white p-6 rounded-[2rem] border-2 border-gray-50 shadow-sm space-y-6 flex flex-col justify-between relative"
                         >
                           <div>
                             <div className="flex justify-between items-start mb-4">
                               <div>
                                 <h4 className="font-black text-gray-800 text-sm uppercase truncate max-w-[180px]">{sub.studentName}</h4>
                                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Student</span>
                               </div>
                               <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${statusColor}`}>{statusText}</span>
                             </div>

                             <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                               <div className="flex items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                 <span>Date Submitted</span>
                                 <span className="text-gray-800">{format(new Date(sub.completedAt), 'MMM d, yyyy')}</span>
                               </div>
                               <div className="flex items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                 <span>Score</span>
                                 <span className="text-emerald-600 font-black text-base">{sub.results?.score} / {sub.results?.total}</span>
                               </div>
                             </div>
                           </div>

                           <div className="flex flex-col gap-2 mt-auto">
                             {onViewSubmission && (
                               <button 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   onViewSubmission(sub, task);
                                 }}
                                 className="w-full flex items-center justify-center gap-2 py-3 bg-blue-500 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-[0_4px_0_0_#2563eb] active:shadow-none active:translate-y-1 transition-all"
                               >
                                 <Eye size={16} />
                                 Review & Grade
                               </button>
                             )}
                             
                             <div className="flex flex-col gap-2">
                               <div className="grid grid-cols-2 gap-2">
                                 <button 
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     generateResponsePDF(sub, task, false);
                                   }}
                                   className="flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-600 rounded-xl font-black uppercase tracking-widest text-[10px] border-2 border-emerald-100 hover:bg-emerald-100 transition-all font-black"
                                 >
                                   <FileText size={14} />
                                   Student PDF
                                 </button>
                                 {sub.feedback ? (
                                   <button 
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       generateResponsePDF(sub, task, true);
                                     }}
                                     className="flex items-center justify-center gap-2 py-3 bg-amber-50 text-amber-600 rounded-xl font-black uppercase tracking-widest text-[10px] border-2 border-amber-100 hover:bg-amber-100 transition-all shadow-sm font-black"
                                   >
                                     <FileText size={14} />
                                     Marked Report
                                    </button>
                                  ) : (
                                    <div className="flex items-center justify-center py-3 bg-gray-50 text-gray-300 rounded-xl font-black uppercase tracking-widest text-[10px] border-2 border-gray-100 italic">
                                      Not Graded
                                    </div>
                                  )}
                               </div>

                                {isAdmin && onDeleteSubmission && (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteSubmission(sub.id);
                                    }}
                                    className="flex items-center justify-center gap-2 py-3 bg-red-50 text-red-500 rounded-xl font-black uppercase tracking-widest text-[10px] border-2 border-red-100 hover:bg-red-100 hover:border-red-200 transition-all w-full"
                                  >
                                    <Trash2 size={14} />
                                    Delete Submission
                                  </button>
                                )}
                             </div>
                           </div>
                         </motion.div>
                       );
                     })}
                   </div>
                 </div>
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
            className="bg-gradient-to-br from-cyan-400 to-blue-500 rounded-3xl p-6 shadow-xl cursor-pointer relative overflow-hidden group border-4 border-cyan-300 h-full"
          >
            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
              <Star size={80} />
            </div>
            <div className="relative z-10">
                <div className="bg-white/20 w-12 h-12 rounded-xl backdrop-blur-sm flex items-center justify-center mb-4">
                  <Star className="text-white" size={24} />
                </div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight mb-1">Event Mode</h2>
                <div className="h-10 relative overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.p 
                      key={currentEventMessageIndex}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      className="text-white/90 font-medium absolute inset-0 text-sm leading-tight"
                    >
                      {eventMessages[currentEventMessageIndex]}
                    </motion.p>
                  </AnimatePresence>
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
