import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, ListChecks, FileText, Download, Clock, Star, ArrowRight, User, Info, CheckCircle2, Eye, ShieldCheck, Archive, RefreshCw, BookOpen } from 'lucide-react';
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

import JSZip from 'jszip';

interface DownloadsTabProps {
  tasks: Task[];
  submissions: TaskSubmission[];
  units: Unit[];
  exportReportPDF: (sub: TaskSubmission, task: Task, isRaw: boolean, returnBlob?: boolean) => Promise<Blob | void>;
}

const ReportsTab = ({ tasks, submissions, exportReportPDF }: { tasks: Task[]; submissions: TaskSubmission[]; exportReportPDF: any }) => {
  const gradedSubmissions = tasks
    .filter(task => submissions.some(sub => sub.taskId === task.id && sub.results))
    .map(task => ({ task, submission: submissions.find(sub => sub.taskId === task.id)! }));

  if (gradedSubmissions.length === 0) {
    return (
      <div className="bg-white/40 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/20 shadow-xl min-h-[400px] flex flex-col items-center justify-center text-center">
        <div className="p-6 bg-slate-100 rounded-3xl text-slate-400 mb-6 font-black">
          <FileText size={48} />
        </div>
        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Reports</h3>
        <p className="text-slate-400 font-bold text-xs max-w-sm">
          Your detailed graded response reports and feedback will appear here once they are completed and analyzed.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {gradedSubmissions.map(({ task, submission }) => (
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
              <div className="flex flex-col items-end gap-1.5">
                <div className="px-3 py-1 bg-emerald-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 size={10} />
                  Graded
                </div>
              </div>
            </div>
            
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2 leading-tight">
              {task.title}
            </h3>
            <div className="flex items-center gap-3 mb-6">
              <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest opacity-60">
                {task.type === 'test' ? 'Secure Assessment' : 'Standard Assignment'}
              </p>
              <div className="w-1 h-1 rounded-full bg-slate-300" />
              <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest opacity-60">
                Unit {(task.units && task.units.length > 0) ? task.units[0] : 'N/A'}
              </p>
            </div>
          </div>

          <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex flex-col gap-3">
            <button
              onClick={() => exportReportPDF(submission, task, true)}
              className="w-full py-3 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[8px] hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
            >
              <Download size={14} />
              Raw PDF
            </button>
            <button
              onClick={() => exportReportPDF(submission, task, false)}
              className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[8px] hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10"
            >
              <FileText size={14} />
              Report PDF
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

const DownloadsTab = ({ tasks, submissions, units, exportReportPDF }: DownloadsTabProps) => {
  const [zippingUnitId, setZippingUnitId] = React.useState<number | null>(null);

  const downloadFile = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZipDownload = async (unit: Unit) => {
    setZippingUnitId(unit.id);
    try {
      const zip = new JSZip();
      const unitFolder = zip.folder(unit.title) || zip;
      
      // 1. Notes
      if (unit.pdfUrl) {
        try {
          const resp = await fetch(unit.pdfUrl);
          const blob = await resp.blob();
          unitFolder.file(`${unit.title}_Notes.pdf`, blob);
        } catch (e) {
          console.error("Failed to fetch notes PDF for zip", e);
        }
      }

      // 2. Graded Tasks (Worksheets and Tests)
      const unitTasks = tasks.filter(t => t.units.includes(unit.id));
      for (const task of unitTasks) {
        const sub = submissions.find(s => s.taskId === task.id);
        if (sub && sub.results) {
          // Task PDF (Raw)
          if (task.pdfUrl) {
            try {
              const resp = await fetch(task.pdfUrl);
              const blob = await resp.blob();
              unitFolder.file(`${task.title}_Source.pdf`, blob);
            } catch (e) {
              console.error(`Failed to fetch source PDF for ${task.title}`, e);
            }
          }

          // Report PDF (Graded)
          try {
            const reportBlob = await exportReportPDF(sub, task, false, true);
            if (reportBlob instanceof Blob) {
              unitFolder.file(`${task.title}_Report.pdf`, reportBlob);
            }
          } catch (e) {
            console.error(`Failed to generate report PDF for ${task.title}`, e);
          }
          
          // Raw Report PDF
          try {
            const rawBlob = await exportReportPDF(sub, task, true, true);
            if (rawBlob instanceof Blob) {
              unitFolder.file(`${task.title}_Raw_Capture.pdf`, rawBlob);
            }
          } catch (e) {
            console.error(`Failed to generate raw report PDF for ${task.title}`, e);
          }
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      downloadFile(url, `${unit.title}_Assets.zip`);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Failed to create zip", e);
      alert("Failed to create zip file.");
    } finally {
      setZippingUnitId(null);
    }
  };

  const worksheets = tasks.filter(t => t.type === 'worksheet');
  const tests = tasks.filter(t => t.type === 'test');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
      {/* Worksheets Column */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2 bg-emerald-50/50 p-4 rounded-3xl border border-emerald-100">
          <div className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20">
            <Target size={20} />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none">Worksheets</h4>
            <p className="text-[7px] font-black text-emerald-600 uppercase tracking-widest mt-1">Resource Cards</p>
          </div>
        </div>
        {worksheets.map(task => (
           <AssetCard key={task.id} task={task} type="Worksheet" submissions={submissions} />
        ))}
      </div>

      {/* Tests Column */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2 bg-rose-50/50 p-4 rounded-3xl border border-rose-100">
          <div className="p-2.5 bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-500/20">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none">Tests</h4>
            <p className="text-[7px] font-black text-rose-600 uppercase tracking-widest mt-1">Assessment Cards</p>
          </div>
        </div>
        {tests.map(task => (
           <AssetCard key={task.id} task={task} type="Test" submissions={submissions} />
        ))}
      </div>

      {/* Notes Column */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2 bg-indigo-50/50 p-4 rounded-3xl border border-indigo-100">
          <div className="p-2.5 bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20">
            <FileText size={20} />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none">Notes</h4>
            <p className="text-[7px] font-black text-indigo-600 uppercase tracking-widest mt-1">Study Materials</p>
          </div>
        </div>
        {units.map(unit => (
          <div key={unit.id} className="bg-white/40 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-white/20 shadow-lg group hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4 mb-5">
              <div className={`w-12 h-12 ${unit.color} rounded-2xl flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                <BookOpen size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="font-black text-slate-800 uppercase tracking-tight truncate leading-tight">Unit {unit.id}</h5>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] truncate mt-1">{unit.title}</p>
              </div>
            </div>
            <button
              onClick={() => unit.pdfUrl && downloadFile(unit.pdfUrl, `${unit.title}_Notes.pdf`)}
              disabled={!unit.pdfUrl}
              className={`w-full py-3.5 rounded-2xl font-black uppercase tracking-widest text-[9px] transition-all flex items-center justify-center gap-2 ${
                unit.pdfUrl 
                  ? 'bg-slate-900 text-white hover:bg-slate-800 active:scale-95' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Download size={14} />
              Download Notes
            </button>
          </div>
        ))}
      </div>

      {/* Units Column (Zip) */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2 bg-amber-50/50 p-4 rounded-3xl border border-amber-100">
          <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-500/20">
            <Archive size={20} />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none">Units</h4>
            <p className="text-[7px] font-black text-amber-600 uppercase tracking-widest mt-1">Bulk Zip Download</p>
          </div>
        </div>
        {units.map(unit => (
          <div key={unit.id} className="bg-white/40 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-white/20 shadow-lg relative overflow-hidden group hover:shadow-xl transition-all duration-300">
            {zippingUnitId === unit.id && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw size={32} className="text-amber-600 animate-spin" />
                  <span className="text-[8px] font-black text-amber-600 uppercase tracking-[0.2em]">Packing Zip...</span>
                </div>
              </div>
            )}
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform duration-300">
                <Download size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="font-black text-slate-800 uppercase tracking-tight truncate leading-tight">{unit.title}</h5>
                <p className="text-[9px] font-black text-amber-600/60 uppercase tracking-[0.2em] truncate mt-1">Master Bundle</p>
              </div>
            </div>
            <button
              onClick={() => handleZipDownload(unit)}
              className="w-full py-3.5 bg-amber-500 text-white rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-amber-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 active:scale-95"
            >
              <Download size={14} />
              Download ZIP
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const AssetCard = ({ task, type, submissions }: { task: Task; type: string; submissions: TaskSubmission[]; key?: string }) => {
  const submission = submissions.find(s => s.taskId === task.id);
  const isCompleted = !!submission;
  
  return (
    <div className="bg-white/40 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-white/20 shadow-lg group hover:shadow-xl transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${task.type === 'test' ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
          {task.type === 'test' ? <CheckCircle2 size={24} /> : <Target size={24} />}
        </div>
        {isCompleted && (
          <div className="px-2 py-0.5 bg-emerald-500 text-white rounded-full text-[6px] font-black uppercase tracking-widest">
            Completed
          </div>
        )}
      </div>

      <h5 className="font-black text-slate-800 uppercase tracking-tight mb-1 text-sm leading-tight">{task.title}</h5>
      <div className="flex items-center gap-2 mb-4">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
          {isCompleted ? 'Completed:' : 'Due:'}
        </p>
        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">
          {isCompleted 
            ? format(new Date(submission.completedAt || Date.now()), 'MMM dd')
            : (task.dueDate ? format(new Date(task.dueDate), 'MMM dd') : 'Soon')}
        </p>
      </div>

      <button
        onClick={() => {
          if (task.pdfUrl) {
            const link = document.createElement('a');
            link.href = task.pdfUrl;
            link.download = `${task.title}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        }}
        disabled={!task.pdfUrl}
        className={`w-full py-3.5 rounded-2xl font-black uppercase tracking-widest text-[9px] transition-all flex items-center justify-center gap-2 ${
          task.pdfUrl 
            ? 'bg-slate-900 text-white hover:bg-slate-800 active:scale-95' 
            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
        }`}
      >
        <Download size={14} />
        {type} PDF
      </button>
    </div>
  );
};

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
  units,
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

  const exportReportPDF = async (sub: TaskSubmission, task: Task, isRaw = false, returnBlob = false) => {
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

    const getImageUrlFromResponse = (resp: any) => {
      if (typeof resp === 'string') {
        if (resp.startsWith('data:image') || resp.match(/\.(jpeg|jpg|gif|png|webp|svg)/i) != null) return resp;
      } else if (Array.isArray(resp)) {
        const found = resp.find((f: any) => f.url && (f.url.startsWith('data:image') || f.url.match(/\.(jpeg|jpg|gif|png|webp|svg)/i)));
        if (found) return found.url;
      } else if (typeof resp === 'object' && resp !== null) {
        if (resp.url && (resp.url.startsWith('data:image') || resp.url.match(/\.(jpeg|jpg|gif|png|webp|svg)/i))) return resp.url;
      }
      return null;
    };

    // Pre-load all images to get dimensions and ensure they are ready for jspdf
    const imageCache: Record<string, HTMLImageElement> = {};
    const imageUrlsToLoad = new Set<string>();
    
    (task.worksheetQuestions || []).forEach((q: any) => {
      if (task.attachments?.[q.id]) imageUrlsToLoad.add(task.attachments[q.id]);
      const resUrl = getImageUrlFromResponse(sub.responses?.[q.id]);
      if (resUrl) imageUrlsToLoad.add(resUrl);
    });

    await Promise.all(Array.from(imageUrlsToLoad).map(url => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
          imageCache[url] = img;
          resolve();
        };
        img.onerror = () => {
          console.warn("Failed to load image for PDF:", url);
          resolve();
        };
        img.src = url;
      });
    }));

    const drawnImages = new Set<string>();

    doc.addPage();
    y = 20;

    const tableHeaders = isRaw ? ['Question Stem', 'Student Response'] : ['Question Stem', 'Student Response', 'Targeted Feedback'];
    
    let currentTableRows: any[] = [];
    
    const drawCurrentTable = () => {
      if (currentTableRows.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [tableHeaders],
          body: currentTableRows,
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
            0: { cellWidth: (pageWidth - 24) * 0.5, fontStyle: 'bold', fillColor: [239, 246, 255], textColor: [29, 78, 216] },
            1: { cellWidth: (pageWidth - 24) * 0.5, fillColor: [255, 255, 255], textColor: [30, 41, 59] }
          } : {
            0: { cellWidth: (pageWidth - 24) * 0.3, fontStyle: 'bold', fillColor: [239, 246, 255], textColor: [29, 78, 216] },
            1: { cellWidth: (pageWidth - 24) * 0.3, fillColor: [255, 255, 255], textColor: [30, 41, 59] },
            2: { cellWidth: (pageWidth - 24) * 0.4, fillColor: [248, 250, 252], textColor: [30, 41, 59] }
          },
          didParseCell: (data) => {
            if (data.section === 'body') {
              const raw = data.cell.raw as any;
              if (data.column.index === 0) {
                data.cell.styles.fillColor = [239, 246, 255];
                data.cell.styles.textColor = [29, 78, 216];
                if (raw) data.cell.text = [raw.content || ''];
              } else if (data.column.index === 1) {
                data.cell.styles.fillColor = [255, 255, 255];
                data.cell.styles.textColor = [30, 41, 59];
                if (raw && raw.image && imageCache[raw.image]) {
                  data.cell.styles.valign = 'top';
                  let content = raw.content || '';
                  if (content === 'Image' || typeof raw.content === 'undefined' || content === '[object Object]') content = '';
                  const padding = (data.cell.styles.cellPadding as number) || 8;
                  const textLines = content ? doc.splitTextToSize(content, data.cell.width - padding * 2) : [];
                  const textHeight = textLines.length > 0 ? textLines.length * (data.cell.styles.fontSize * 0.352778 * 1.2) : 0;
                  data.cell.styles.minCellHeight = textHeight + 50; 
                  data.cell.text = [content]; 
                } else if (raw) {
                  let content = typeof raw === 'object' ? (raw.content || '') : raw;
                  if (content === 'Image' || typeof content === 'undefined' || content === '[object Object]') content = '';
                  data.cell.text = [content];
                }
              } else if (!isRaw && data.column.index === 2) {
                data.cell.styles.fillColor = [248, 250, 252];
                data.cell.styles.textColor = [30, 41, 59];
                if (raw) {
                  data.cell.text = [raw.content || ''];
                  if (raw.isCorrect) { data.cell.styles.fillColor = [240, 253, 244]; data.cell.styles.textColor = [21, 128, 61]; }
                  else if (raw.isPartial) { data.cell.styles.fillColor = [255, 251, 235]; data.cell.styles.textColor = [180, 83, 9]; }
                  else if (raw.isIncorrect) { data.cell.styles.fillColor = [254, 242, 242]; data.cell.styles.textColor = [185, 28, 28]; }
                }
              }
            }
          },
          didDrawCell: (data) => {
            if (data.section === 'body' && data.column.index === 1) {
              const raw = data.cell.raw as any;
              const imgKey = `tbl-${y}-row-${data.row.index}-col-${data.column.index}`;
              if (raw && raw.image && imageCache[raw.image] && !drawnImages.has(imgKey)) {
                const img = imageCache[raw.image];
                const padding = (data.cell.styles.cellPadding as number) || 8;
                const maxW = data.cell.width - padding * 2;
                const maxH = 45;
  
                const imgRatio = img.width / img.height;
                const containerRatio = maxW / maxH;
                let renderW = maxW, renderH = maxW / imgRatio;
                if (imgRatio > containerRatio) { renderW = maxW; renderH = maxW / imgRatio; } 
                else { renderH = maxH; renderW = maxH * imgRatio; }
  
                const posX = data.cell.x + (data.cell.width - renderW) / 2;
                const posY = data.cell.y + data.cell.height - renderH - padding;
  
                try {
                  if (data.cell.height >= renderH + padding) {
                    doc.addImage(img, 'PNG', posX, posY, renderW, renderH);
                    drawnImages.add(imgKey);
                  }
                } catch (e) { console.error("PDF Img err", e); }
              }
            }
          }
        });
        y = (doc as any).lastAutoTable.finalY + 10;
        currentTableRows = [];
      }
    };

    (task.worksheetQuestions || []).forEach((q: any) => {
      const attachmentUrl = task.attachments?.[q.id];
      if (attachmentUrl && imageCache[attachmentUrl]) {
        drawCurrentTable();

        const img = imageCache[attachmentUrl];
        const padding = 12;
        const maxW = pageWidth - padding * 2;
        const maxH = 100;
        
        const imgRatio = img.width / img.height;
        const containerRatio = maxW / maxH;
        let renderW = maxW, renderH = maxW / imgRatio;
        if (imgRatio > containerRatio) { renderW = maxW; renderH = maxW / imgRatio; } 
        else { renderH = maxH; renderW = maxH * imgRatio; }

        if (y + renderH + 10 > doc.internal.pageSize.getHeight() - 20) {
           doc.addPage();
           y = 20;
        }

        const posX = (pageWidth - renderW) / 2;
        try {
          doc.addImage(img, 'PNG', posX, y, renderW, renderH);
          y += renderH + 10;
        } catch (e) { console.error("PDF Q Img err", e); }
      }

      const f = sub.results?.feedback?.[q.id];
      let scoreStr = (f?.score || "0").toString();
      if (!scoreStr.includes('of')) {
        scoreStr = `${scoreStr} of 1`;
      }
      
      const feedbackTextRaw = f?.feedback || "No feedback.";
      const isCorrect = feedbackTextRaw.trim().toLowerCase().startsWith('correct');
      const isIncorrect = feedbackTextRaw.trim().toLowerCase().startsWith('incorrect') || feedbackTextRaw.trim().toLowerCase().startsWith('no response');
      const isPartial = feedbackTextRaw.trim().toLowerCase().startsWith('partially');
      
      let rawResponse = sub.responses?.[q.id] || "No response";
      let responseText = "";
      const responseImageUrl = getImageUrlFromResponse(rawResponse);

      if (Array.isArray(rawResponse)) {
        responseText = rawResponse.map((f: any) => f.name || (typeof f === 'string' ? f : 'File')).join(', ');
      } else if (typeof rawResponse === 'object' && rawResponse !== null) {
        responseText = (rawResponse as any).name || (responseImageUrl ? 'Image' : 'Response');
      } else {
        responseText = String(rawResponse).replace(/→/g, '->').replace(/←/g, '<-').replace(/↑/g, '(up)').replace(/↓/g, '(down)');
      }
      
      const row = [
        {
          content: q.question || q.id
        } as any,
        {
          content: responseImageUrl ? (responseText === 'Image' ? '' : responseText) : responseText,
          image: responseImageUrl
        } as any
      ];
      
      if (!isRaw) {
        row.push({
          content: `[Points: ${scoreStr}]\n${feedbackTextRaw}`,
          isCorrect,
          isPartial,
          isIncorrect
        } as any);
      }
      
      currentTableRows.push(row);
    });

    drawCurrentTable();

    if (returnBlob) {
      return doc.output('blob');
    }

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
                    {userProfile?.isParent ? 'Not Started' : 'Start'}
                    {!userProfile?.isParent && <ArrowRight size={16} />}
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      ) : activeTab === 'reports' ? (
        <ReportsTab tasks={activeTasks} submissions={mySubmissions} exportReportPDF={exportReportPDF} />
      ) : (
        <DownloadsTab 
          tasks={activeTasks}
          submissions={mySubmissions}
          units={units}
          exportReportPDF={exportReportPDF}
        />
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
