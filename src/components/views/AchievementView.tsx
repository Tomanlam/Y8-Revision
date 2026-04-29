import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Target, Clock, TrendingUp, Award, Calendar, CheckCircle2, AlertCircle, PieChart as PieChartIcon, BarChart3, Sparkles, Star, Users, LayoutGrid, Activity, Database } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Task, TaskSubmission, UserProfile } from '../../types';
import StudentRegistry from './StudentRegistry';

interface AchievementViewProps {
  user: UserProfile | null;
  tasks: Task[];
  submissions: TaskSubmission[]; // This will be mySubmissions for students
  isAdmin: boolean;
  allUsers?: UserProfile[];
}

const AchievementView: React.FC<AchievementViewProps> = ({ user, tasks, submissions = [], isAdmin, allUsers = [] }) => {
  const [filterType, setFilterType] = useState<'all' | 'task' | 'test'>('all');
  const [filterTime, setFilterTime] = useState<'day' | 'month'>('day');
  const [isStudentRegistryOpen, setIsStudentRegistryOpen] = useState(false);

  // Use a more robust filtering for my own submissions
  const mySubmissions = React.useMemo(() => {
    if (!user) return [];
    // If it's already filtered in App.tsx (for students), this is mostly identity mapping
    // But for Admin, submissions is allSubmissions, so we MUST filter by user.userId
    return (submissions || []).filter(s => s.userId === user.userId);
  }, [submissions, user]);
  
  // Calculate XP and Stats
  const stats = React.useMemo(() => {
    let xp = 0;
    let excellence = 0;
    let totalAttainment = 0;
    let onTime = 0;
    let completed = 0;

    mySubmissions.forEach(sub => {
      if (!sub.results) return;
      
      const task = tasks.find(t => t.id === sub.taskId);
      if (!task) return;
      
      completed++;
      const isTest = task.type === 'test' || (task as any).isTest;
      const score = Number(sub.results.score || 0);
      const total = Number(sub.results.total || 1);
      const attainment = (score / total) * 100;
      totalAttainment += attainment;
      
      // XP Calculation
      let subXp = isTest ? 100 : 50;
      if (attainment >= 90) subXp += 50;
      else if (attainment >= 80) subXp += 20;
      xp += subXp;

      // Excellence Count (Outstanding)
      if (attainment >= 80) excellence++;

      // Timeliness
      if (task.dueDate && sub.completedAt) {
        const due = new Date(task.dueDate).getTime();
        const submitted = new Date(sub.completedAt).getTime();
        if (submitted <= due) onTime++;
      }
    });

    return {
      totalXP: xp,
      completedCount: completed,
      excellenceCount: excellence,
      avgAttainment: completed > 0 ? Math.round(totalAttainment / completed) : 0,
      reliabilityRate: completed > 0 ? Math.round((onTime / completed) * 100) : 0,
      onTimeCount: onTime
    };
  }, [mySubmissions, tasks]);

  // Admin Specific Calculations
  const adminStats = React.useMemo(() => {
    if (!isAdmin) return null;
    
    const activeStudentIds = new Set(submissions.map(s => s.userId));
    const activeTasks = tasks.filter(t => t.status === 'active').length;
    
    // Attainment by student
    const studentPerformanceMap: Record<string, { total: number, count: number, name: string }> = {};
    submissions.forEach(s => {
      if (!s.results) return;
      if (!studentPerformanceMap[s.userId]) {
        studentPerformanceMap[s.userId] = { total: 0, count: 0, name: s.studentName || 'Unknown' };
      }
      studentPerformanceMap[s.userId].total += (s.results.score / s.results.total) * 100;
      studentPerformanceMap[s.userId].count++;
    });
    
    const studentsPerfData = Object.entries(studentPerformanceMap).map(([id, data]) => ({
      name: data.name,
      avg: Math.round(data.total / data.count)
    })).sort((a, b) => b.avg - a.avg);

    // Attainment by task
    const taskPerformanceMap: Record<string, { total: number, count: number, title: string }> = {};
    submissions.forEach(s => {
      if (!s.results) return;
      if (!taskPerformanceMap[s.taskId]) {
        const task = tasks.find(t => t.id === s.taskId);
        taskPerformanceMap[s.taskId] = { total: 0, count: 0, title: task?.title || 'Unknown' };
      }
      taskPerformanceMap[s.taskId].total += (s.results.score / s.results.total) * 100;
      taskPerformanceMap[s.taskId].count++;
    });
    
    const tasksPerfData = Object.entries(taskPerformanceMap).map(([id, data]) => ({
      name: data.title,
      avg: Math.round(data.total / data.count)
    })).sort((a, b) => b.avg - a.avg);

    return {
      activeStudentsCount: activeStudentIds.size,
      activeTasksCount: activeTasks,
      totalUsers: allUsers.length,
      studentsPerfData,
      tasksPerfData
    };
  }, [isAdmin, submissions, tasks, allUsers]);

  // Filtered Grade Trajectory Data
  const timelinessData = React.useMemo(() => {
    let early = 0, onTime = 0, late = 0;
    mySubmissions.forEach(sub => {
      const task = tasks.find(t => t.id === sub.taskId);
      if (!task || !task.dueDate || !sub.completedAt) return;
      const due = new Date(task.dueDate).getTime();
      const submitted = new Date(sub.completedAt).getTime();
      const diff = (due - submitted) / (1000 * 60 * 60 * 24);
      if (diff > 1) early++;
      else if (diff < 0) late++;
      else onTime++;
    });

    return [
      { name: 'Early', value: early, color: '#10b981' },
      { name: 'On Time', value: onTime, color: '#3b82f6' },
      { name: 'Late', value: late, color: '#ef4444' }
    ].filter(d => d.value > 0);
  }, [mySubmissions, tasks]);

  // Filtered Grade Trajectory Data
  const trajectoryData = React.useMemo(() => {
    let filtered = mySubmissions.filter(sub => {
      const task = tasks.find(t => t.id === sub.taskId);
      if (!task) return false;
      const isTest = task.type === 'test' || (task as any).isTest;
      if (filterType === 'task' && isTest) return false;
      if (filterType === 'test' && !isTest) return false;
      return !!sub.results;
    });

    // Grouping
    if (filterTime === 'month') {
      const monthMap: Record<string, { total: number, count: number }> = {};
      filtered.forEach(sub => {
        const month = new Date(sub.completedAt).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        if (!monthMap[month]) monthMap[month] = { total: 0, count: 0 };
        monthMap[month].total += (sub.results!.score / sub.results!.total) * 100;
        monthMap[month].count++;
      });
      return Object.entries(monthMap).map(([name, val]) => ({ name, score: Math.round(val.total / val.count) }));
    } else {
      return filtered.map(sub => {
        const task = tasks.find(t => t.id === sub.taskId);
        return {
          name: new Date(sub.completedAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }),
          score: Math.round((sub.results!.score / sub.results!.total) * 100),
          title: task?.title || 'Unknown'
        };
      });
    }
  }, [mySubmissions, tasks, filterType, filterTime]);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 pb-32">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-600 rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-orange-200">
            <Trophy size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Achievement Hub</h1>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Award size={14} className="text-orange-500" /> Academic Success Tracking
            </p>
          </div>
        </div>

        <div className="bg-white px-6 py-4 rounded-[2rem] border-2 border-slate-100 shadow-sm flex items-center gap-8">
           <div className="text-right">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Score</p>
             <p className="text-xl font-black text-slate-800 flex items-center gap-2 justify-end">
               {stats.totalXP}
               <Sparkles size={16} className="text-amber-400" />
             </p>
           </div>
        </div>
      </div>

      {/* Admin Specific Dashboard */}
      {isAdmin && adminStats && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.button 
               onClick={() => setIsStudentRegistryOpen(true)}
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] p-8 text-white shadow-xl flex flex-col justify-between hover:shadow-2xl hover:scale-[1.02] transition-transform cursor-pointer text-left focus:outline-none"
            >
              <Users size={32} className="mb-4 opacity-70" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Active Students</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-black">{adminStats.activeStudentsCount}</p>
                  <p className="text-sm opacity-50">of {adminStats.totalUsers} registered</p>
                </div>
              </div>
            </motion.button>

            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 0.1 }}
               className="bg-gradient-to-br from-rose-500 to-orange-500 rounded-[2.5rem] p-8 text-white shadow-xl flex flex-col justify-between"
            >
              <LayoutGrid size={32} className="mb-4 opacity-70" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Live Assignments</p>
                <p className="text-4xl font-black">{adminStats.activeTasksCount}</p>
              </div>
            </motion.div>

            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 0.2 }}
               className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-[2.5rem] p-8 text-white shadow-xl flex flex-col justify-between"
            >
              <Activity size={32} className="mb-4 opacity-70" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Global Attainment</p>
                <p className="text-4xl font-black">
                  {submissions.length > 0 ? Math.round(submissions.reduce((acc, s) => acc + (s.results ? (s.results.score / s.results.total) * 100 : 0), 0) / submissions.length) : 0}%
                </p>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Student Performance Bar Chart */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-8 rounded-[3rem] border-4 border-slate-50 shadow-lg"
            >
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-8">
                <BarChart3 size={18} className="text-indigo-500" /> Student Attainment Analysis
              </h3>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={adminStats.studentsPerfData} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }}
                      width={100}
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="avg" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Task Performance Bar Chart */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-8 rounded-[3rem] border-4 border-slate-50 shadow-lg"
            >
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-8">
                <Database size={18} className="text-rose-500" /> Task Difficulty Index
              </h3>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={adminStats.tasksPerfData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fontWeight: 'bold', fill: '#64748b' }}
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }}
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="avg" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>
          
          <div className="h-px bg-slate-100 my-4" />
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Completed', value: stats.completedCount, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Excellence', value: stats.excellenceCount, icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Avg Grade', value: stats.avgAttainment + '%', icon: Target, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Consistency', value: stats.reliabilityRate + '%', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' }
        ].map((stat, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={idx}
            className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-50 shadow-sm relative overflow-hidden group"
          >
            <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
              <stat.icon size={20} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className={`text-2xl font-black text-slate-800`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Grade Trajectory Chart */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-8 rounded-[3rem] border-4 border-slate-50 shadow-lg"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <BarChart3 size={18} className="text-blue-500" /> Grade Trajectory
            </h3>
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                {(['all', 'task', 'test'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filterType === t ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                {(['day', 'month'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setFilterTime(t)}
                    className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filterTime === t ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            {trajectoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" debounce={100}>
                <BarChart data={trajectoryData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} 
                    dy={10}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="score" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50">
                <BarChart3 size={48} />
                <p className="text-[10px] font-black uppercase mt-4">No matching results found</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Timeliness Pie Chart */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-8 rounded-[3rem] border-4 border-slate-50 shadow-lg"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <PieChartIcon size={18} className="text-emerald-500" /> Reliability Sync
            </h3>
            <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
              Timeliness
            </div>
          </div>
          <div className="h-[300px] w-full flex items-center justify-center">
            {timelinessData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" debounce={100}>
                <PieChart>
                  <Pie
                    data={timelinessData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {timelinessData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50">
                <Clock size={48} />
                <p className="text-[10px] font-black uppercase mt-4">No timeliness data found</p>
              </div>
            )}
          </div>
          <div className="flex justify-center gap-6 mt-4">
             {timelinessData.map((d, i) => (
               <div key={i} className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{d.name}</span>
               </div>
             ))}
          </div>
        </motion.div>
      </div>

      {/* Progress Timeline */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight">Academic Momentum</h3>
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em]">Live progress tracking</p>
            </div>
            <Award className="text-amber-400" size={32} />
          </div>

          <div className="space-y-8">
            {tasks.slice(0, 3).map((task, idx) => {
              const isDone = mySubmissions.some(s => s.taskId === task.id);
              return (
                <div key={task.id} className="flex items-start gap-6">
                  <div className="flex flex-col items-center">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${isDone ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-white/20 text-white/20'}`}>
                      {isDone ? <CheckCircle2 size={12} /> : idx + 1}
                    </div>
                    {idx < 2 && <div className="w-0.5 h-12 bg-white/10 mt-2" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                       <h4 className={`text-sm font-black uppercase tracking-tight ${isDone ? 'text-white' : 'text-white/40'}`}>{task.title}</h4>
                       {isDone && <span className="text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">Verified</span>}
                    </div>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{formatTimely(task.dueDate)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <AnimatePresence>
        {isStudentRegistryOpen && (
          <StudentRegistry 
            onClose={() => setIsStudentRegistryOpen(false)}
            allUsers={allUsers}
            submissions={isAdmin ? submissions : mySubmissions}
            tasks={tasks}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const formatTimely = (date: string) => {
  try {
    return new Date(date).toLocaleDateString();
  } catch (e) {
    return date;
  }
};

export default AchievementView;
