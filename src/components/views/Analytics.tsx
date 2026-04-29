import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { Task, TaskSubmission } from '../../types';
import { LayoutGrid, List } from 'lucide-react';
import { parseISO, format } from 'date-fns';

interface AnalyticsProps {
  tasks: Task[];
  allSubmissions: TaskSubmission[];
}

export default function Analytics({ tasks, allSubmissions }: AnalyticsProps) {
  const [layout, setLayout] = useState<'1col' | '2col'>('2col');

  // Group submissions by task
  const submissionsByTask = React.useMemo(() => {
    const grouped: Record<string, TaskSubmission[]> = {};
    allSubmissions.forEach(sub => {
      if (!grouped[sub.taskId]) grouped[sub.taskId] = [];
      grouped[sub.taskId].push(sub);
    });
    return grouped;
  }, [allSubmissions]);

  // Sort tasks chronologically, most recent near the top
  const sortedTasks = React.useMemo(() => {
    return [...tasks].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.dueDate).getTime();
      const dateB = new Date(b.createdAt || b.dueDate).getTime();
      return dateB - dateA;
    });
  }, [tasks]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between bg-slate-950/80 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-transparent to-purple-500/10 opacity-50 transition-opacity duration-1000" />
        <div className="flex items-center gap-4 relative z-10">
          <div>
            <h3 className="text-3xl font-black text-white tracking-tighter leading-none">Class Analytics</h3>
            <p className="text-white/60 text-xs font-medium tracking-widest uppercase mt-2">Performance Tracking</p>
          </div>
        </div>
        <div className="relative z-10 flex bg-white/5 p-1.5 rounded-2xl border border-white/10">
          <button 
            onClick={() => setLayout('1col')}
            className={`p-3 rounded-xl transition-all ${layout === '1col' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
          >
            <List size={20} />
          </button>
          <button 
            onClick={() => setLayout('2col')}
            className={`p-3 rounded-xl transition-all ${layout === '2col' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
          >
            <LayoutGrid size={20} />
          </button>
        </div>
      </div>

      <div className={`grid gap-8 ${layout === '2col' ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
        <AnimatePresence>
          {sortedTasks.map(task => {
            const subs = submissionsByTask[task.id] || [];
            const gradedSubs = subs.filter(s => s.results?.score !== undefined && s.results?.total !== undefined);
            
            if (gradedSubs.length === 0) return null;

            const sortedSubs = [...gradedSubs].sort((a,b) => (a.results!.score - b.results!.score));
            const chartData = sortedSubs.map(s => ({
              name: s.studentName,
              score: s.results!.score,
              percent: (s.results!.score / s.results!.total) * 100
            }));

            let highScore = 0;
            let lowScore = 1000000;
            let highPercent = 0;
            let lowPercent = 0;
            let highName = "";
            let lowName = "";

            if (sortedSubs.length > 0) {
              const maxSub = sortedSubs[sortedSubs.length - 1];
              const minSub = sortedSubs[0];
              highScore = maxSub.results!.score;
              highPercent = (highScore / maxSub.results!.total) * 100;
              highName = maxSub.studentName;

              lowScore = minSub.results!.score;
              lowPercent = (lowScore / minSub.results!.total) * 100;
              lowName = minSub.studentName;
            }

            return (
              <motion.div 
                key={task.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/80 backdrop-blur-xl border border-indigo-100 rounded-[2.5rem] p-6 shadow-xl flex flex-col"
              >
                <div className="mb-6 flex justify-between items-center">
                  <div>
                    <h4 className="font-black text-slate-800 text-lg leading-tight">{task.title}</h4>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-1">
                      {gradedSubs.length} Submissions • {format(new Date(task.createdAt || task.dueDate), 'PPP')}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-[250px]">
                  {/* Graph taking 8 parts */}
                  <div className="flex-[8] min-h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E7FF" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6366F1', fontWeight: 600 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6366F1', fontWeight: 600 }} />
                        <Tooltip 
                          cursor={{ fill: '#EEF2FF' }}
                          contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                        />
                        <Bar dataKey="percent" radius={[8, 8, 0, 0]}>
                          {chartData.map((entry, index) => {
                            const studentColors = ['#6366F1', '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B'];
                            return <Cell key={`cell-${index}`} fill={studentColors[index % studentColors.length]} />
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Metrics taking 2 parts */}
                  <div className="flex-[2] flex flex-row md:flex-col gap-4">
                    <div className="flex-1 bg-emerald-50 rounded-3xl p-4 border border-emerald-100 flex flex-col justify-center">
                      <p className="text-[9px] uppercase font-black tracking-[0.2em] text-emerald-500 mb-2">Highest Score</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-emerald-900">{highScore}</span>
                        <span className="text-xs font-bold text-emerald-600">pts</span>
                      </div>
                      <p className="text-lg font-black text-emerald-600 mb-1">{highPercent.toFixed(1)}%</p>
                      <p className="text-[10px] font-bold text-emerald-700 truncate" title={highName}>{highName}</p>
                    </div>

                    <div className="flex-1 bg-rose-50 rounded-3xl p-4 border border-rose-100 flex flex-col justify-center">
                      <p className="text-[9px] uppercase font-black tracking-[0.2em] text-rose-500 mb-2">Lowest Score</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-rose-900">{lowScore}</span>
                        <span className="text-xs font-bold text-rose-600">pts</span>
                      </div>
                      <p className="text-lg font-black text-rose-600 mb-1">{lowPercent.toFixed(1)}%</p>
                      <p className="text-[10px] font-bold text-rose-700 truncate" title={lowName}>{lowName}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {sortedTasks.every(t => !submissionsByTask[t.id] || submissionsByTask[t.id].filter(s => s.results?.score !== undefined).length === 0) && (
          <div className="col-span-full py-40 flex flex-col items-center justify-center text-center bg-slate-900/50 backdrop-blur-3xl rounded-[4rem] border border-white/5 shadow-2xl">
            <h3 className="font-black text-white uppercase tracking-[0.3em] text-lg mb-4 leading-none">No Analytics Data</h3>
            <p className="text-slate-500 font-medium max-w-md leading-relaxed text-sm">Graded submissions will appear here for insight tracking.</p>
          </div>
        )}
      </div>
    </div>
  );
}
