import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, ListChecks, FileText, Download, Clock, Star, ArrowRight, User, Info, CheckCircle2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { Task, TaskSubmission, Unit, AppMode } from '../../types';

interface TasksViewProps {
  key?: string;
  mode?: AppMode;
  showEasterNotice: boolean;
  setShowEasterNotice: (val: boolean) => void;
  easterNoticeAgreed: boolean;
  setEasterNoticeAgreed: (val: boolean) => void;
  proceedToEasterAssignment: () => void;
  tasks: Task[];
  mySubmissions: TaskSubmission[];
  currentUser: any;
  userProfile?: any;
  units: Unit[];
  onStartTask: (task: Task) => void;
}

const TasksView = ({ 
  mode,
  showEasterNotice,
  setShowEasterNotice,
  easterNoticeAgreed,
  setEasterNoticeAgreed,
  proceedToEasterAssignment,
  tasks,
  mySubmissions,
  userProfile,
  onStartTask
}: TasksViewProps) => {
  const [activeTab, setActiveTab] = React.useState<'tasks' | 'reports' | 'downloads'>('tasks');

  // Filter tasks
  const activeTasks = tasks;

  return (
    <div className="flex-1 flex flex-col gap-8 p-6 max-w-7xl mx-auto w-full pt-4 pb-24">
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
                <span className="text-2xl font-black text-white leading-none">{activeTasks.length}</span>
                <span className="text-[8px] font-black text-emerald-100/50 uppercase tracking-[0.2em] mt-1">Total Goals</span>
              </div>
              <div className="bg-emerald-500/20 backdrop-blur-md rounded-3xl p-4 border border-emerald-500/30 flex flex-col items-center justify-center min-w-[100px]">
                <span className="text-2xl font-black text-emerald-300 leading-none">{activeTasks.filter(t => !mySubmissions.some(s => s.taskId === t.id)).length}</span>
                <span className="text-[8px] font-black text-emerald-400/80 uppercase tracking-[0.2em] mt-1">Pending</span>
              </div>
            </div>
          </div>
        </header>

      {activeTab === 'tasks' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeTasks.map(task => {
            const isCompleted = mySubmissions.some(sub => sub.taskId === task.id);
            const submission = mySubmissions.find(sub => sub.taskId === task.id);
            
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/40 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/20 shadow-xl group hover:shadow-2xl transition-all duration-500 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className={`p-4 rounded-2xl ${task.type === 'test' ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                      {task.type === 'test' ? <CheckCircle2 size={32} /> : <Target size={32} />}
                    </div>
                    {isCompleted && (
                      <div className="px-3 py-1 bg-emerald-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-emerald-500/20">
                        <CheckCircle2 size={10} />
                        Completed
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2 leading-tight">
                    {task.title}
                  </h3>
                  <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest opacity-60 mb-6">
                    {task.type === 'test' ? 'Secure Assessment' : 'Standard Assignment'}
                  </p>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3 text-slate-500">
                      <Clock size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Due: {task.dueDate ? format(new Date(task.dueDate), 'MMM dd, yyyy') : 'No Date'}</span>
                    </div>
                  </div>
                </div>

                {isCompleted ? (
                  <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Attainment</span>
                      <span className="text-sm font-black text-emerald-700">{submission?.results?.score || 0} of {submission?.results?.total || 0}</span>
                    </div>
                    <div className="w-full h-1.5 bg-emerald-100 rounded-full overflow-hidden mb-4">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${((submission?.results?.score || 0) / (submission?.results?.total || 1)) * 100}%` }}
                        className="h-full bg-emerald-500" 
                      />
                    </div>
                    <button
                      onClick={() => onStartTask(task)}
                      className="w-full py-2 bg-white border border-emerald-200 text-emerald-600 rounded-xl font-black uppercase tracking-widest text-[8px] hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
                    >
                      <Eye size={12} />
                      View Record
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => !userProfile?.isParent && onStartTask(task)}
                    disabled={!!userProfile?.isParent}
                    className={`w-full py-4 border-2 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 ${
                      userProfile?.isParent 
                        ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed' 
                        : 'bg-slate-900 border-black text-white hover:bg-emerald-600 hover:border-emerald-400 shadow-lg active:scale-95'
                    }`}
                  >
                    {userProfile?.isParent ? 'Not Started' : 'Engage Mission'}
                    {!userProfile?.isParent && <ArrowRight size={16} />}
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      ) : activeTab === 'reports' ? (
        <div className="bg-white/40 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/20 shadow-xl min-h-[400px] flex flex-col items-center justify-center text-center">
            <div className="p-6 bg-slate-100 rounded-3xl text-slate-400 mb-6">
              <FileText size={48} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Post-Mission Reports</h3>
            <p className="text-slate-400 font-bold text-xs max-w-sm">
              Your detailed performance reports and feedback will appear here once missions are completed and analyzed.
            </p>
        </div>
      ) : (
        <div className="bg-white/40 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/20 shadow-xl min-h-[400px] flex flex-col items-center justify-center text-center">
            <div className="p-6 bg-slate-100 rounded-3xl text-slate-400 mb-6">
              <Download size={48} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Asset Downloads</h3>
            <p className="text-slate-400 font-bold text-xs max-w-sm">
              Static study materials and worksheets will be available for download here.
            </p>
        </div>
      )}

      {/* Easter Notice Modal */}
      <AnimatePresence>
        {showEasterNotice && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-6">
            <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }} 
               className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" 
            />
            <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="relative w-full max-w-2xl bg-white rounded-[3rem] p-10 shadow-2xl overflow-hidden border border-white/20"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 via-emerald-500 to-blue-500" />
              
              <div className="flex items-center gap-6 mb-8 text-amber-500">
                <div className="p-4 bg-amber-500/10 rounded-2xl">
                   <Star size={32} className="animate-pulse" />
                </div>
                <div>
                   <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">Special Assignment</h2>
                   <p className="text-amber-600 font-bold text-[10px] uppercase tracking-widest mt-2">Critical Assessment Protocol</p>
                </div>
              </div>

              <div className="space-y-6 text-slate-600 mb-10 leading-relaxed font-medium">
                <p>Welcome to the <span className="text-slate-900 font-black">Easter Special Assessment</span>. This is a secure mission designed to test your core competencies.</p>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
                  <Info className="flex-shrink-0 text-indigo-500" size={20} />
                  <p className="text-sm font-bold text-slate-500">You must read and acknowledge the operational requirements before accessing the task parameters.</p>
                </div>
              </div>

              <button 
                onClick={proceedToEasterAssignment}
                className="w-full py-5 bg-slate-900 border-2 border-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-600 hover:border-emerald-400 transition-all shadow-xl shadow-slate-900/10 active:scale-95"
              >
                Acknowledge and proceed
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TasksView;
