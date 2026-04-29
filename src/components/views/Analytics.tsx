import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { Task, TaskSubmission } from '../../types';
import { LayoutGrid, List, Download } from 'lucide-react';
import { parseISO, format } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AnalyticsProps {
  tasks: Task[];
  allSubmissions: TaskSubmission[];
}

export default function Analytics({ tasks, allSubmissions }: AnalyticsProps) {
  const [layout, setLayout] = useState<'1col' | '2col'>('2col');

  const generateAnalyticsPDF = async (task: Task, subs: TaskSubmission[]) => {
    const doc = new jsPDF();
    const primaryColor: [number, number, number] = [139, 92, 246]; // Purple
    
    // Top Color Bar
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 8, 'F');
    
    let currentY = 22;

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(31, 41, 55);
    doc.text("Analytics Report", 15, currentY);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(156, 163, 175);
    doc.text(`Generated on ${format(new Date(), 'PPP p')}`, 15, currentY + 6);
    
    currentY += 15;

    // We gather stats
    const gradedSubs = subs.filter(s => s.results?.score !== undefined && s.results?.total !== undefined);
    const sortedSubs = [...gradedSubs].sort((a,b) => (a.results!.score - b.results!.score));
    
    let highScore = 0; let lowScore = 0; let avgScore = 0; let totalScoreMax = 1;
    if (sortedSubs.length > 0) {
      highScore = sortedSubs[sortedSubs.length - 1].results!.score;
      lowScore = sortedSubs[0].results!.score;
      avgScore = sortedSubs.reduce((acc, s) => acc + s.results!.score, 0) / sortedSubs.length;
      totalScoreMax = sortedSubs[0].results!.total || 1;
    }
    
    // Punctuality
    let early = 0, onTime = 0, late = 0;
    const dueTime = new Date((task.dueDate.includes('T') ? task.dueDate : task.dueDate + 'T23:59:59')).getTime();
    subs.forEach(s => {
      const compTime = new Date(s.completedAt || new Date().toISOString()).getTime();
      if (compTime > dueTime) late++;
      else if (dueTime - compTime >= 24 * 3600 * 1000) early++;
      else onTime++;
    });
    
    const count = subs.length;
    const earlyPct = count ? Math.round(early*100/count) : 0;
    const onTimePct = count ? Math.round(onTime*100/count) : 0;
    const latePct = count ? Math.round(late*100/count) : 0;

    // Security violations (if test)
    let cheatCount = 0;
    subs.forEach(s => {
       if (s.results?.tabSwitches && s.results.tabSwitches > 0) cheatCount++;
       if (s.results?.cheatLogs && Object.keys(s.results.cheatLogs).length > 0) cheatCount++;
    });

    // Write Info Section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Assignment Overview", 15, currentY);
    currentY += 8;

    const tDue = format(new Date(task.dueDate.includes('T') ? task.dueDate : task.dueDate + 'T00:00:00'), 'PPP');
    
    autoTable(doc, {
      startY: currentY,
      theme: 'plain',
      headStyles: { 
        fillColor: [255, 255, 255], 
        textColor: [100, 116, 139],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'left'
      },
      styles: { 
        fontSize: 8, 
        cellPadding: 3, 
        overflow: 'linebreak',
        lineColor: [255, 255, 255], 
        lineWidth: 1,
        valign: 'middle'
      },
      columnStyles: {
        0: { cellWidth: 50, fillColor: [248, 250, 252], textColor: [31, 41, 55], fontStyle: 'bold' },
        1: { cellWidth: 140, fillColor: [241, 245, 249], textColor: [30, 58, 138], fontStyle: 'normal' }
      },
      head: [['Metric', 'Value']],
      body: [
        ['Assignment Title', task.title],
        ['Unit(s)', task.units?.join(', ') || 'N/A'],
        ['Task Type', task.type === 'test' ? 'Test' : task.type === 'worksheet' ? 'Worksheet' : 'Standard'],
        ['Task Due Date', tDue],
        ['Total Submissions', `${count}`],
        ['Punctuality', `Early: ${earlyPct}% | On-Time: ${onTimePct}% | Late: ${latePct}%`],
        ['Security Violations', task.type === 'test' ? `${cheatCount} flagged submissions` : 'N/A (Not a test)']
      ],
      margin: { left: 15 },
      tableWidth: 190,
    });
    currentY = (doc as any).lastAutoTable.finalY + 10;

    // Performance Data Table
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Performance Metrics", 15, currentY);
    currentY += 8;

    autoTable(doc, {
      startY: currentY,
      theme: 'plain',
      headStyles: { 
        fillColor: [255, 255, 255], 
        textColor: [100, 116, 139],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'left'
      },
      styles: { 
        fontSize: 8, 
        cellPadding: 3, 
        overflow: 'linebreak',
        lineColor: [255, 255, 255], 
        lineWidth: 1,
        valign: 'middle'
      },
      columnStyles: {
        0: { cellWidth: 'auto', fillColor: [248, 250, 252], textColor: [31, 41, 55], fontStyle: 'bold' },
        1: { cellWidth: 'auto', fillColor: [241, 245, 249], textColor: [30, 58, 138], fontStyle: 'normal' },
        2: { cellWidth: 'auto', fillColor: [248, 250, 252], textColor: [31, 41, 55], fontStyle: 'bold' }
      },
      head: [['Highest Score', 'Lowest Score', 'Average Score']],
      body: [
        [
         sortedSubs.length > 0 ? `${highScore} (${Math.round(highScore / totalScoreMax * 100)}%)` : 'N/A', 
         sortedSubs.length > 0 ? `${lowScore} (${Math.round(lowScore / totalScoreMax * 100)}%)` : 'N/A', 
         sortedSubs.length > 0 ? `${avgScore.toFixed(1)} (${Math.round(avgScore / totalScoreMax * 100)}%)` : 'N/A'
        ]
      ],
      margin: { left: 15 },
      tableWidth: 190,
    });
    currentY = (doc as any).lastAutoTable.finalY + 10;

    // Then chart
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Score by Student Graph", 15, currentY);
    currentY += 8;

    const chartData = sortedSubs.map(s => ({
      name: s.studentName.split(' ')[0], // First name for compactness
      percent: (s.results!.score / s.results!.total) * 100
    }));

    const chartHeight = 60;
    const chartWidth = 180;
    const startX = 15;
    const startY = currentY;
    
    // Draw grid
    doc.setDrawColor(224, 231, 255); // #E0E7FF
    doc.setLineWidth(0.5);
    for (let i = 0; i <= 4; i++) {
        const y = startY + (i * chartHeight / 4);
        doc.line(startX, y, startX + chartWidth, y);
    }
    
    // Draw labels for Y axis
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(99, 102, 241);
    doc.text("100%", startX - 2, startY + 2, { align: 'right' });
    doc.text("0%", startX - 2, startY + chartHeight + 2, { align: 'right' });

    const studentColors = [[99, 102, 241], [139, 92, 246], [59, 130, 246], [16, 185, 129], [245, 158, 11]];
    if (chartData.length > 0) {
        const barWidth = Math.min((chartWidth / chartData.length) * 0.6, 20);
        const gap = (chartWidth - (barWidth * chartData.length)) / (chartData.length + 1);
        
        chartData.forEach((data, index) => {
            const barHeight = (data.percent / 100) * chartHeight;
            const x = startX + gap + (index * (barWidth + gap));
            const y = startY + chartHeight - barHeight;
            
            // Draw Bar
            const color = studentColors[index % studentColors.length];
            doc.setFillColor(color[0], color[1], color[2]);
            doc.rect(x, y, barWidth, barHeight, 'F');
            
            // Draw Label (student name)
            const nameSegments = doc.splitTextToSize(data.name, barWidth + gap + 4);
            doc.text(nameSegments[0], x + barWidth / 2, startY + chartHeight + 5, { align: 'center' });
        });
    }

    currentY += chartHeight + 15;
    
    doc.save(`analytics_${task.id}.pdf`);
  };

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
                <div className="mb-6 flex justify-between items-start md:items-center">
                  <div>
                    <h4 className="font-black text-slate-800 text-lg leading-tight">{task.title}</h4>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-1">
                      {gradedSubs.length} Submissions • {format(new Date(task.createdAt || task.dueDate), 'PPP')}
                    </p>
                  </div>
                  <button 
                    onClick={() => generateAnalyticsPDF(task, subs)}
                    className="bg-purple-50 hover:bg-purple-600 text-purple-600 hover:text-white border border-purple-200 hover:border-purple-500 px-4 py-2.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-sm hover:shadow-md group/pdf shrink-0"
                  >
                    <Download size={14} className="group-hover/pdf:scale-110 transition-transform" />
                    <span className="text-[10px] uppercase font-black tracking-widest hidden sm:inline">Report PDF</span>
                  </button>
                </div>

                <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-[250px]">
                  {/* Graph taking 8 parts */}
                  <div className="flex-[8] min-h-[200px]" id={`chart-${task.id}`}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E7FF" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6366F1', fontWeight: 600 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6366F1', fontWeight: 600 }} />
                        <Tooltip 
                          cursor={{ fill: '#EEF2FF' }}
                          contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                        />
                        <Bar dataKey="percent" radius={[8, 8, 0, 0]} isAnimationActive={false}>
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
