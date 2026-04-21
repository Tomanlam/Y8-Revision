import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, CheckCircle2, ListChecks, Users, Clock, Plus, Trash2, Layout } from 'lucide-react';

import { Task, TaskSubmission, Unit } from '../../types';

interface TasksViewProps {
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
}

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
  onStartTask
}: TasksViewProps) => {
  const [isCreatorOpen, setIsCreatorOpen] = React.useState(false);
  const [newTask, setNewTask] = React.useState<Partial<Task>>({
    title: '',
    description: '',
    units: [1],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'active'
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateTask(newTask);
    setIsCreatorOpen(false);
  };

  return (
    <div className="flex flex-col flex-1 h-full max-w-7xl mx-auto w-full p-6 space-y-8 pb-24 mt-4">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Tasks</h1>
          <p className="text-gray-500 font-medium mt-2">Complete assignments and special events.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setIsCreatorOpen(true)}
            className="bg-emerald-500 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 shadow-[0_4px_0_0_#059669] active:translate-y-1 active:shadow-none transition-all"
          >
            <Plus size={18} />
            Create Task
          </button>
        )}
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

      {isAdmin && (
        <div className="bg-white p-8 rounded-3xl border-2 border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
              <Users size={20} />
            </div>
            <h3 className="font-black text-gray-800 uppercase tracking-tight">Recent Completions</h3>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {allSubmissions.length > 0 ? (
              allSubmissions.map(sub => (
                <div key={sub.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border-2 border-gray-100">
                  <div>
                    <p className="font-black text-gray-800 uppercase text-sm">{sub.studentName}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Unit {sub.results?.unitId} • {new Date(sub.completedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-emerald-600 text-lg">{sub.results?.score} / {sub.results?.total}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Result</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center p-8 text-gray-400 font-bold uppercase text-xs">
                No submissions yet
              </div>
            )}
          </div>
        </div>
      )}

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
                  onClick={() => onDeleteTask(task.id)}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
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
