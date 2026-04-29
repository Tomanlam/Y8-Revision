import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, TaskSubmission, Task } from '../../types';
import { XCircle, User, Activity, Clock, Trophy, Target, Sparkles, X, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, PieChart, Pie, AreaChart, Area, LineChart, Line, Legend } from 'recharts';

interface StudentRegistryProps {
  onClose: () => void;
  allUsers: UserProfile[];
  submissions: TaskSubmission[];
  tasks: Task[];
}

export default function StudentRegistry({ onClose, allUsers, submissions, tasks }: StudentRegistryProps) {
  const [selectedStudent, setSelectedStudent] = useState<UserProfile | null>(null);

  // Exclude admin themselves if needed, here we'll just show active students (ones without isAdmin maybe, or all)
  const students = allUsers.filter(u => !u.isAdmin);

  // compute global stats for selected student
  const studentSubmissions = selectedStudent ? submissions.filter(s => s.userId === selectedStudent.userId) : [];
  
  let averageGrade = 0;
  let totalXP = 0;
  let onTimePct = 0;
  let earlyPct = 0;
  let latePct = 0;
  let attainment = 0;

  if (selectedStudent && studentSubmissions.length > 0) {
    let totalScore = 0;
    let totalMax = 0;
    let early = 0;
    let onTime = 0;
    let late = 0;

    studentSubmissions.forEach(s => {
      if (s.results && s.results.score !== undefined && s.results.total !== undefined) {
        totalScore += s.results.score;
        totalMax += s.results.total;
        totalXP += s.results.score * 10;
      }

      const task = tasks.find(t => t.id === s.taskId);
      if (task?.dueDate) {
        const dueTime = new Date((task.dueDate.includes('T') ? task.dueDate : task.dueDate + 'T23:59:59')).getTime();
        const compTime = new Date(s.completedAt || new Date().toISOString()).getTime();
        if (compTime > dueTime) late++;
        else if (dueTime - compTime >= 24 * 3600 * 1000) early++;
        else onTime++;
      }
    });

    const count = studentSubmissions.length;
    if (totalMax > 0 && count > 0) {
      averageGrade = totalScore / count;
      earlyPct = Math.round(early * 100 / count);
      onTimePct = Math.round(onTime * 100 / count);
      latePct = Math.round(late * 100 / count);
    }
    attainment = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;
  }

  const chartData = studentSubmissions.map(s => {
    const task = tasks.find(t => t.id === s.taskId);
    return {
      name: task?.title || 'Unknown',
      percent: s.results?.total ? (s.results.score / s.results.total) * 100 : 0,
      score: s.results?.score || 0
    };
  });

  const punctualityData = [
    { name: 'Early', value: earlyPct, color: '#3B82F6' },
    { name: 'On-time', value: onTimePct, color: '#10B981' },
    { name: 'Late', value: latePct, color: '#EF4444' }
  ].filter(d => d.value > 0);

  let cumulativeXP = 0;
  const trendData = studentSubmissions.map((s, idx) => {
    const task = tasks.find(t => t.id === s.taskId);
    const xpEarned = (s.results?.score || 0) * 10;
    cumulativeXP += xpEarned;
    return {
      index: idx + 1,
      name: task?.title || `Task ${idx + 1}`,
      attainment: s.results?.total ? (s.results.score / s.results.total) * 100 : 0,
      xpEarned,
      cumulativeXP
    };
  });

  return (
    <div 
      className="fixed inset-0 z-[500] flex items-center justify-center p-4 md:p-6 backdrop-blur-sm bg-black/40"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0, x: -300, y: 200, rotate: -720, opacity: 0 }}
        animate={{ scale: 1, x: 0, y: 0, rotate: 0, opacity: 1 }}
        exit={{ scale: 0, x: -300, y: 200, rotate: -720, opacity: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 100, duration: 0.8 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-[2.5rem] p-6 lg:p-10 w-[95vw] max-w-[1600px] shadow-2xl relative border border-white/20 flex flex-col h-[90vh] overflow-hidden"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors z-[120]"
        >
          <XCircle size={32} />
        </button>

        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

        <div className="mb-8 relative z-10 flex flex-col sm:flex-row items-center gap-4">
           <h2 className="text-4xl font-black text-white transition-colors drop-shadow-[0_0_25px_rgba(255,255,255,1)]">
             Active Students
           </h2>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 relative z-10">
          <div className="flex-1 lg:w-1/4 bg-white/5 rounded-3xl p-6 border border-white/10 overflow-y-auto custom-scrollbar flex flex-col gap-3">
             {students.map(student => (
               <button
                 key={student.userId}
                 onClick={() => setSelectedStudent(student)}
                 className={`w-full text-left p-4 rounded-2xl flex items-center gap-4 transition-all duration-300 border ${selectedStudent?.userId === student.userId ? 'bg-orange-500/20 border-orange-500/50 backdrop-blur-md' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
               >
                 {student.photoURL ? (
                    <img src={student.photoURL} alt={student.displayName} className="w-12 h-12 rounded-full border-2 border-yellow-400 shadow-md" />
                 ) : (
                    <div className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center text-white border-2 border-yellow-400 font-bold text-lg shadow-md">
                      {student.displayName ? student.displayName.substring(0,2).toUpperCase() : 'U'}
                    </div>
                 )}
                 <div>
                    <h3 className="text-white font-black">{student.displayName || student.email}</h3>
                    <p className="text-yellow-400 text-sm font-black tracking-widest">{submissions.filter(s => s.userId === student.userId).length} Submissions</p>
                 </div>
               </button>
             ))}
             {students.length === 0 && (
                <div className="text-center py-20 text-white/50">
                   <p>No active students found.</p>
                </div>
             )}
          </div>

          <div className="flex-[3] lg:w-3/4 bg-white/5 rounded-3xl p-6 border border-white/10 flex flex-col overflow-y-auto custom-scrollbar">
             {selectedStudent ? (
               <AnimatePresence mode="wait">
                 <motion.div
                   key={selectedStudent.userId}
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: -20 }}
                   className="flex-1 flex flex-col"
                 >
                    <div className="flex items-center gap-6 mb-8">
                      {selectedStudent.photoURL ? (
                        <img src={selectedStudent.photoURL} alt={selectedStudent.displayName} className="w-24 h-24 rounded-[1.5rem] border-4 border-orange-500 shadow-xl" />
                      ) : (
                        <div className="w-24 h-24 rounded-[1.5rem] bg-orange-500 flex items-center justify-center text-white border-4 border-orange-400 font-black text-4xl shadow-xl">
                          {selectedStudent.displayName ? selectedStudent.displayName.substring(0,2).toUpperCase() : 'U'}
                        </div>
                      )}
                      <div>
                        <h3 className="text-3xl font-black text-white">{selectedStudent.displayName}</h3>
                        <p className="text-yellow-400 text-sm font-black tracking-widest">{selectedStudent.email}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                       <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-col justify-center">
                          <p className="text-[10px] text-white/50 uppercase font-black mb-1">% Attainment</p>
                          <p className="text-2xl font-black text-white">{attainment.toFixed(1)}%</p>
                       </div>
                       <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-col justify-center">
                          <p className="text-[10px] text-white/50 uppercase font-black mb-1">Avg Grade</p>
                          <p className="text-2xl font-black text-white">{averageGrade.toFixed(1)}pts</p>
                       </div>
                       <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-col justify-center">
                          <p className="text-[10px] text-white/50 uppercase font-black mb-1">Completed</p>
                          <p className="text-2xl font-black text-white">{studentSubmissions.length}</p>
                       </div>
                       <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-col justify-center">
                          <p className="text-[10px] text-white/50 uppercase font-black mb-1">Total XP</p>
                          <p className="text-2xl font-black text-white flex items-center gap-1">{totalXP} <Sparkles size={14} className="text-amber-400" /></p>
                       </div>
                       <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-col justify-center">
                          <p className="text-[10px] text-white/50 uppercase font-black mb-1">Punctuality</p>
                          <p className="text-2xl font-black text-white text-sm">{onTimePct}% On-time</p>
                       </div>
                    </div>

                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 auto-rows-fr">
                       {/* Punctuality Chart */}
                       <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-col min-h-[220px]">
                          <h4 className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-4">
                            <Clock size={14} /> Punctuality
                          </h4>
                          <div className="flex-1 w-full h-full min-h-[150px]">
                            {punctualityData.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie data={punctualityData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                                    {punctualityData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Pie>
                                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '1rem', border: '1px solid #334155', color: '#fff', fontWeight: 'bold' }} />
                                  <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', fill: '#fff' }} iconType="circle" />
                                </PieChart>
                              </ResponsiveContainer>
                            ) : (
                               <div className="w-full h-full flex flex-col items-center justify-center text-white/40"><p>No data</p></div>
                            )}
                          </div>
                       </div>

                       {/* Attainment Trend */}
                       <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-col min-h-[220px]">
                          <h4 className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-4">
                            <Target size={14} /> Attainment Trend (%)
                          </h4>
                          <div className="flex-1 w-full h-full min-h-[150px]">
                            {trendData.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff20" />
                                  <XAxis dataKey="index" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#fff' }} dy={5} />
                                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#fff' }} />
                                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '1rem', border: '1px solid #334155', color: '#fff', fontWeight: 'bold' }} />
                                  <Area type="monotone" dataKey="attainment" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.3} />
                                </AreaChart>
                              </ResponsiveContainer>
                            ) : (
                               <div className="w-full h-full flex flex-col items-center justify-center text-white/40"><p>No data</p></div>
                            )}
                          </div>
                       </div>

                       {/* Cumulative XP */}
                       <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-col min-h-[220px]">
                          <h4 className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-4">
                            <Sparkles size={14} /> Cumulative XP Growth
                          </h4>
                          <div className="flex-1 w-full h-full min-h-[150px]">
                            {trendData.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff20" />
                                  <XAxis dataKey="index" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#fff' }} dy={5} />
                                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#fff' }} />
                                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '1rem', border: '1px solid #334155', color: '#fff', fontWeight: 'bold' }} />
                                  <Line type="monotone" dataKey="cumulativeXP" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 4, fill: '#8B5CF6' }} />
                                </LineChart>
                              </ResponsiveContainer>
                            ) : (
                               <div className="w-full h-full flex flex-col items-center justify-center text-white/40"><p>No data</p></div>
                            )}
                          </div>
                       </div>

                       {/* Score by Task BarChart */}
                       <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-col min-h-[220px]">
                          <h4 className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-4">
                            <BarChart3 size={14} /> Score by Task (%)
                          </h4>
                          <div className="flex-1 w-full h-full min-h-[150px]">
                            {chartData.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff20" />
                                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#fff' }} dy={5} tickFormatter={(val) => val.substring(0, 10) + '...'} />
                                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#fff' }} />
                                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '1rem', border: '1px solid #334155', color: '#fff', fontWeight: 'bold' }} />
                                  <Bar dataKey="percent" radius={[4, 4, 0, 0]} fill="#10B981" />
                                </BarChart>
                              </ResponsiveContainer>
                            ) : (
                               <div className="w-full h-full flex flex-col items-center justify-center text-white/40"><p>No data</p></div>
                            )}
                          </div>
                       </div>
                    </div>
                 </motion.div>
               </AnimatePresence>
             ) : (
               <div className="w-full h-full flex flex-col items-center justify-center text-white/50">
                  <User size={64} className="mb-4 opacity-30" />
                  <p className="text-lg font-black uppercase tracking-widest">Select a Student</p>
                  <p className="text-sm">Click on a student card to view detailed analytics</p>
               </div>
             )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
