import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, ListChecks, FileText, Download, Clock, Star, ArrowRight, User, Info, CheckCircle2, Eye, ShieldCheck } from 'lucide-react';
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
  const [passcodeAttempt, setPasscodeAttempt] = React.useState('');
  const [passcodeError, setPasscodeError] = React.useState(false);
  const [pendingTask, setPendingTask] = React.useState<Task | null>(null);

  const handleStartTask = (task: Task) => {
    if (task.type === 'test' && task.passcode && !userProfile?.isAdmin) {
      setPendingTask(task);
      setPasscodeAttempt('');
      setPasscodeError(false);
    } else {
      onStartTask(task);
    }
  };

  const verifyPasscode = () => {
    if (pendingTask && pendingTask.passcode === passcodeAttempt) {
      onStartTask(pendingTask);
      setPendingTask(null);
    } else {
      setPasscodeError(true);
    }
  };

  const exportReportPDF = async (sub: TaskSubmission, task: Task, isRaw = false) => {
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;
    
    const isTest = task.type === 'test';
    const primaryColor: [number, number, number] = isTest ? [225, 29, 72] : [16, 185, 129];
    const lightBgColor: [number, number, number] = isTest ? [254, 242, 242] : [240, 253, 244];
    const accentTextColor: [number, number, number] = isTest ? [190, 18, 60] : [5, 150, 105];

    // Header Bar
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 5, 'F');
    
    let y = 25;
    doc.setTextColor(30, 41, 59);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(24);
    doc.text(isRaw ? "Raw Student Response Report" : "Graded Student Response Report", margin, y);
    y += 8;
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.setFont("Helvetica", "normal");
    doc.text(`Created on ${format(new Date(), 'MMMM do, yyyy h:mm a')} by Toman Lam`, margin, y);
    y += 12;
    
    if (!isRaw) {
      // Teacher's General Feedback (Graded Reports Only)
      doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
      const feedbackText = sub.results?.generalFeedback || "No general feedback provided.";
      const splitFeedback = doc.splitTextToSize(feedbackText, pageWidth - (margin * 2) - 40);
      const boxHeight = Math.max(30, (splitFeedback.length * 5) + 20);
      
      doc.rect(margin, y, pageWidth - (margin * 2), boxHeight, 'F');
      doc.setTextColor(accentTextColor[0], accentTextColor[1], accentTextColor[2]);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Teacher's General Feedback", margin + 10, y + 12);
      
      doc.setTextColor(71, 85, 105);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.text(splitFeedback, margin + 10, y + 20);
      y += boxHeight + 8;
    }
    
    // Info Cards
    const cardWidth = (pageWidth - (margin * 2) - 10) / 2;
    const cardHeight = 18;
    
    // Determine stats for the info cards
    const stats: any[] = [
      { label: "STUDENT NAME", value: sub.studentName }
    ];

    if (!isRaw) {
      const metricValue = sub.results ? `${sub.results.score} of ${sub.results.total} (${Math.round((sub.results.score || 0) / (sub.results.total || 1) * 100)}%)` : 'N/A';
      stats.push({ label: "PERFORMANCE METRIC", value: metricValue, isSuccess: true });
    }

    stats.push(
      { label: isTest ? "TEST TITLE" : "ASSIGNMENT TITLE", value: task.title },
      { label: "COMPLETION TIME", value: sub.completedAt ? format(new Date(sub.completedAt), 'MMMM do, yyyy h:mm a') : 'N/A' },
      { label: "PUNCTUALITY", value: "EARLY", isSuccess: true }
    );

    if (!isRaw) {
      stats.push({ 
        label: "SECURITY VIOLATIONS", 
        value: (isTest && sub.cheatLog && sub.cheatLog.length > 0) ? sub.cheatLog.join(', ') : "OFF", 
        isViolation: isTest && sub.cheatLog && sub.cheatLog.length > 0,
        isSuccess: !(isTest && sub.cheatLog && sub.cheatLog.length > 0)
      });
    }
    
    stats.forEach((stat: any, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cardX = margin + col * (cardWidth + 10);
      const cardY = y + row * (cardHeight + 4);
      
      doc.setFillColor(248, 250, 252);
      doc.rect(cardX, cardY, cardWidth, cardHeight, 'F');
      
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(7);
      doc.setFont("Helvetica", "bold");
      doc.text(stat.label, cardX + 8, cardY + 7);
      
      if (stat.isViolation) {
        doc.setTextColor(225, 29, 72); // Red-600
        doc.setFont("Helvetica", "bold");
      } else if (stat.isSuccess) {
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFont("Helvetica", "bold");
      } else {
        doc.setTextColor(30, 41, 59);
        doc.setFont("Helvetica", "bold");
      }
      doc.setFontSize(9);
      doc.text(String(stat.value), cardX + 8, cardY + 14);
    });
    
    // Adjust y for the table
    const rowCount = Math.ceil(stats.length / 2);
    y += (cardHeight + 4) * rowCount + 12;

    if (!isRaw) {
      // Attainment Chart - Anchored to bottom of first page to give headroom
      const chartHeight = 40;
      const chartWidth = pageWidth - (margin * 2);
      const chartY = doc.internal.pageSize.height - chartHeight - 35; 
      const questionsForChart = task.worksheetQuestions || [];
      const availableWidthForBars = chartWidth - 20;
      const barSpacing = 5;
      const barWidth = Math.min(15, (availableWidthForBars - (questionsForChart.length - 1) * barSpacing) / Math.max(1, questionsForChart.length));
      const totalBarsWidth = (questionsForChart.length * barWidth) + ((questionsForChart.length - 1) * barSpacing);
      const startX = margin + (chartWidth - totalBarsWidth) / 2;

      const chartColors = [
        [99, 102, 241], [244, 63, 94], [16, 185, 129], [245, 158, 11], 
        [139, 92, 246], [236, 72, 153], [20, 184, 166], [107, 114, 128]
      ];

      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.setFont("Helvetica", "bold");
      doc.text("Attainment per Question (%)", margin, chartY - 4);

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(margin, chartY, margin, chartY + chartHeight);
      doc.line(margin, chartY + chartHeight, margin + chartWidth, chartY + chartHeight);

      questionsForChart.forEach((q: any, i: number) => {
        const f = sub.results?.feedback?.[q.id];
        const attainment = (() => {
          const s = String(f?.score || "0");
          if (s.includes('of')) {
            const parts = s.split('of').map(p => parseFloat(p.trim()));
            if (parts.length === 2 && parts[1] > 0) return (parts[0] / parts[1]) * 100;
          }
          const val = parseFloat(s);
          return isNaN(val) ? 0 : val * 100; 
        })();

        const bH = (Math.min(100, Math.max(0, attainment)) / 100) * chartHeight;
        const bX = startX + (i * (barWidth + barSpacing));
        const bY = chartY + chartHeight - bH;
        
        const color = chartColors[i % chartColors.length];
        doc.setFillColor(color[0], color[1], color[2]);
        
        const finalH = Math.max(0.1, bH);
        doc.rect(bX, bY, barWidth, finalH, 'F');
        
        doc.setFontSize(6);
        doc.text(`Q${i+1}`, bX + (barWidth / 2), chartY + chartHeight + 4, { align: 'center' });
      });
    }

    // Start table on new page
    doc.addPage();
    y = 20;

    const tableHeaders = isRaw ? ['Question Stem', 'Student Response'] : ['Question Stem', 'Student Response', 'Targeted Feedback'];
    const tableData = (task.worksheetQuestions || []).map((q: any) => {
      const f = sub.results?.feedback?.[q.id];
      let scoreStr = (f?.score || "0").toString();
      if (!scoreStr.includes('of')) {
        scoreStr = `${scoreStr} of 1`;
      }
      
      const feedbackTextRaw = f?.feedback || "No feedback.";
      const isCorrect = feedbackTextRaw.trim().toLowerCase().startsWith('correct');
      const isIncorrect = feedbackTextRaw.trim().toLowerCase().startsWith('incorrect') || feedbackTextRaw.trim().toLowerCase().startsWith('no response');
      const isPartial = feedbackTextRaw.trim().toLowerCase().startsWith('partially');
      
      let response = sub.responses?.[q.id] || "No response";
      if (typeof response === 'string') {
        response = response.replace(/→/g, '->').replace(/←/g, '<-').replace(/↑/g, '(up)').replace(/↓/g, '(down)');
      }
      
      const row = [q.question || q.id, response];
      
      if (!isRaw) {
        row.push({
          content: `[Points: ${scoreStr}]\n${feedbackTextRaw}`,
          isCorrect,
          isPartial,
          isIncorrect
        } as any);
      }
      
      return row;
    });

    autoTable(doc, {
      startY: y,
      head: [tableHeaders],
      body: tableData,
      theme: 'grid',
      margin: { left: 12, right: 12, bottom: 20 },
      styles: {
        overflow: 'linebreak',
        cellPadding: 8,
        valign: 'middle',
        halign: 'left',
        fontSize: 8.5,
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
        minCellHeight: 30
      },
      headStyles: {
        fillColor: undefined,
        textColor: [30, 41, 59],
        fontSize: 9,
        fontStyle: 'bold',
        cellPadding: 4,
        minCellHeight: 0,
        halign: 'center'
      },
      columnStyles: isRaw ? {
        0: { cellWidth: (pageWidth - 24) * 0.5, fontStyle: 'bold' },
        1: { cellWidth: (pageWidth - 24) * 0.5 }
      } : {
        0: { cellWidth: (pageWidth - 24) * 0.3, fontStyle: 'bold' },
        1: { cellWidth: (pageWidth - 24) * 0.3 },
        2: { cellWidth: (pageWidth - 24) * 0.4 }
      },
      didParseCell: (data) => {
        if (data.section === 'body') {
          if (data.column.index === 1) {
            const val = data.cell.raw as string;
            if (typeof val === 'string' && (val.startsWith('data:image') || val.match(/\.(jpeg|jpg|gif|png)$/) != null)) {
              data.cell.text = ['']; 
              data.cell.styles.minCellHeight = 55;
            }
          }
          if (!isRaw && data.column.index === 2) {
            const raw = data.cell.raw as any;
            if (raw) data.cell.text = [raw.content];
          }
        }
      },
      didDrawCell: (data) => {
        if (data.section === 'body') {
          const cell = data.cell;
          let fill: [number, number, number] = [248, 250, 252];
          let textColor: [number, number, number] = [30, 41, 59];
          
          if (data.column.index === 0) {
            fill = [239, 246, 255];
            textColor = [29, 78, 216];
          } else if (data.column.index === 1) {
            fill = [255, 255, 255]; // White for response
            textColor = [30, 41, 59];
          } else if (!isRaw && data.column.index === 2) {
            const raw = cell.raw as any;
            if (raw) {
              if (raw.isCorrect) { fill = [240, 253, 244]; textColor = [21, 128, 61]; }
              else if (raw.isPartial) { fill = [255, 251, 235]; textColor = [180, 83, 9]; }
              else if (raw.isIncorrect) { fill = [254, 242, 242]; textColor = [185, 28, 28]; }
            }
          }

          doc.setFillColor(fill[0], fill[1], fill[2]);
          doc.rect(cell.x + 0.2, cell.y + 0.2, cell.width - 0.4, cell.height - 0.4, 'F');

          if (data.column.index === 1) {
            const val = cell.raw as string;
            if (typeof val === 'string' && (val.startsWith('data:image') || val.match(/\.(jpeg|jpg|gif|png)$/) != null)) {
              const padding = 6;
              const imgW = Math.min(cell.width - padding * 2, 50);
              const imgH = Math.min(cell.height - padding * 2, 40);
              const posX = cell.x + (cell.width - imgW) / 2;
              const posY = cell.y + (cell.height - imgH) / 2;
              try {
                doc.addImage(val, 'PNG', posX, posY, imgW, imgH);
              } catch (e) {
                console.error("PDF Img err", e);
              }
              return;
            }
          }

          // Render text with proper alignment and vertical centering
          doc.setTextColor(textColor[0], textColor[1], textColor[2]);
          doc.setFontSize(cell.styles.fontSize);
          
          const textLines: string[] = doc.splitTextToSize(cell.text.join('\n'), cell.width - (cell.styles.cellPadding as number) * 2);
          const lineHeight = cell.styles.fontSize * 0.352778 * 1.2;
          const textHeight = textLines.length * lineHeight; 
          const startXPos = cell.x + (cell.styles.cellPadding as number);
          let startYPos = cell.y + (cell.height - textHeight) / 2 + (cell.styles.fontSize * 0.352778);

          let feedbackSentenceBolded = false;

          textLines.forEach((line: string) => {
            doc.setFont("Helvetica", "normal");
            
            if (!isRaw && data.column.index === 2 && !line.startsWith('[Points:')) {
              if (!feedbackSentenceBolded) {
                const firstPeriodIndex = line.indexOf('.');
                if (firstPeriodIndex !== -1) {
                  const boldPart = line.substring(0, firstPeriodIndex + 1);
                  const normalPart = line.substring(firstPeriodIndex + 1);
                  
                  doc.setFont("Helvetica", "bold");
                  doc.text(boldPart, startXPos, startYPos);
                  
                  if (normalPart.length > 0) {
                    const boldWidth = doc.getTextWidth(boldPart);
                    doc.setFont("Helvetica", "normal");
                    doc.text(normalPart, startXPos + boldWidth, startYPos);
                  }
                  feedbackSentenceBolded = true;
                } else {
                  doc.setFont("Helvetica", "bold");
                  doc.text(line, startXPos, startYPos);
                }
              } else {
                doc.text(line, startXPos, startYPos);
              }
            } else {
              doc.text(line, startXPos, startYPos);
            }
            startYPos += lineHeight;
          });
        }
      }
    });

    doc.save(`${isRaw ? 'Raw_Capture' : 'Performance_Report'}_${sub.studentName}.pdf`);

  };

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
                    {submission?.results && (
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Attainment</span>
                        <span className="text-sm font-black text-emerald-700">{submission.results.score} of {submission.results.total}</span>
                      </div>
                    )}
                    <div className="flex flex-col gap-3 mt-4">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => onStartTask(task)}
                          className="py-3 bg-white border border-emerald-200 text-emerald-600 rounded-2xl font-black uppercase tracking-widest text-[8px] hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
                        >
                          <Eye size={14} />
                          View
                        </button>
                        <button
                          onClick={() => exportReportPDF(submission!, task, true)}
                          className="py-3 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[8px] hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                        >
                          <Download size={14} />
                          Raw PDF
                        </button>
                      </div>
                      {submission?.results && (
                        <button
                          onClick={() => exportReportPDF(submission!, task, false)}
                          className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[8px] hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10"
                        >
                          <FileText size={14} />
                          Report PDF
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => !userProfile?.isParent && handleStartTask(task)}
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

      {/* Passcode Modal */}
      <AnimatePresence>
        {pendingTask && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPendingTask(null)} className="absolute inset-0 bg-slate-950/90 backdrop-blur-3xl" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white w-full max-w-md rounded-[3rem] p-10 shadow-3xl text-center border border-white/20">
               <div className="w-20 h-20 bg-rose-500/10 text-rose-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                 <ShieldCheck size={40} />
               </div>
               <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-2">Alpha Secure</h2>
               <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-8">Access code required for engagement</p>
               
               <div className="space-y-4">
                 <input 
                   type="password" 
                   value={passcodeAttempt}
                   onChange={e => { setPasscodeAttempt(e.target.value); setPasscodeError(false); }}
                   placeholder="ENTER PASSCODE"
                   className={`w-full bg-slate-50 border-2 p-6 rounded-2xl text-center font-black tracking-[0.3em] text-xl transition-all ${passcodeError ? 'border-rose-500 bg-rose-50' : 'border-slate-100 focus:border-emerald-500'}`}
                   onKeyDown={e => e.key === 'Enter' && verifyPasscode()}
                 />
                 {passcodeError && (
                   <p className="text-rose-600 font-black text-[9px] uppercase tracking-widest animate-bounce">Access Denied: Invalid Code</p>
                 )}
                 <button onClick={verifyPasscode} className="w-full py-5 bg-slate-900 border-2 border-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-600 hover:border-emerald-400 transition-all active:scale-95 shadow-xl">
                   Authenticate
                 </button>
                 <button onClick={() => setPendingTask(null)} className="w-full py-4 text-slate-400 font-black uppercase tracking-widest text-[9px]">
                   Abort Mission
                 </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
