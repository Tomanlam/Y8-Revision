import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Heart, BookOpen, GraduationCap, Languages, ChevronLeft, 
  CheckCircle2, XCircle, Trophy, Trash2, Lock, FileText, 
  Download, Star, Zap, Chrome, LayoutGrid, Info, ArrowRight, RefreshCw,
  QrCode, Edit, Database, LogOut, User, Users, Calendar as CalendarIcon, ChevronRight as ChevronRightIcon, Target,
  Crown, Calculator, Clock, Flame, Sparkles, ShieldCheck
} from 'lucide-react';
import { Unit, ChallengeRecord, ChallengeResponse, Question, UserProfile, Task, TaskSubmission } from '../../types';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, startOfDay } from 'date-fns';
import { User as FirebaseUser } from 'firebase/auth';

interface DashboardViewProps {
  showEasterNotice: boolean;
  setShowEasterNotice: (v: boolean) => void;
  easterNoticeAgreed: boolean;
  setEasterNoticeAgreed: (v: boolean) => void;
  proceedToEasterAssignment: () => void;
  isChallengeModeOpen: boolean;
  setIsChallengeModeOpen: (v: boolean) => void;
  startEasterAssignment: () => void;
  units: Unit[];
  challengeSelectedUnits: number[];
  setChallengeSelectedUnits: React.Dispatch<React.SetStateAction<number[]>>;
  challengeQuestionCount: number;
  setChallengeQuestionCount: (v: number) => void;
  generateChallengeQuiz: () => void;
  isChallengeQuizActive: boolean;
  setIsChallengeQuizActive: (v: boolean) => void;
  isEventMode: boolean;
  setIsEventMode: (v: boolean) => void;
  showExitConfirm: boolean;
  setShowExitConfirm: (v: boolean) => void;
  challengeCurrentIndex: number;
  challengeQuestions: Question[];
  handleChallengeAnswer: (answer: string) => void;
  shortResponseInput: string;
  setShortResponseInput: (v: string) => void;
  isAdminOpen: boolean;
  setIsAdminOpen: (v: boolean) => void;
  isAdminLoggedIn: boolean;
  setIsAdminLoggedIn: (v: boolean) => void;
  handleAdminLogin: (e: React.FormEvent) => void;
  adminUsername: string;
  setAdminUsername: (v: string) => void;
  adminPassword: string;
  setAdminPassword: (v: string) => void;
  adminError: string;
  challengeRecords: ChallengeRecord[];
  generatePDF: (records: ChallengeRecord[]) => void;
  deleteChallengeRecord: (id: string) => void;
  editingRecord: ChallengeRecord | null;
  setEditingRecord: (v: ChallengeRecord | null) => void;
  updateChallengeRecord: (record: ChallengeRecord) => void;
  currentEventMessageIndex: number;
  eventMessages: string[];
  randomConcept: string;
  refreshConcept: () => void;
  startQuiz: (unit: Unit) => void;
  startRevision: (unit: Unit) => void;
  startVocab: (unit: Unit) => void;
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loginWithGoogle: () => void;
  logout: () => void;
  allUsers: UserProfile[];
  selectedStudent: UserProfile | null;
  setSelectedStudent: (u: UserProfile | null) => void;
  tasks: Task[];
  onCreateTask: (taskData: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onStartTask: (task: Task) => void;
  setMode: (mode: any) => void;
  showCalculator: boolean;
  setShowCalculator: (v: boolean) => void;
  mySubmissions: TaskSubmission[];
  allSubmissions: TaskSubmission[];
}

const CalendarWidget = ({ tasks, mySubmissions }: { tasks: Task[], mySubmissions: TaskSubmission[] }) => {
  const unfinished = tasks.filter(t => t.status === 'active' && !mySubmissions.some(s => s.taskId === t.id));
  const today = startOfDay(new Date());
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getDayStatus = (day: Date) => {
    const dayTasks = unfinished.filter(t => {
      const taskDate = startOfDay(t.dueDate.includes('T') ? parseISO(t.dueDate) : new Date(t.dueDate + 'T00:00:00'));
      return isSameDay(taskDate, day);
    });
    const hasTest = dayTasks.some(t => t.type === 'test');
    const hasWorksheet = dayTasks.some(t => t.type === 'worksheet');
    if (hasTest) return 'bg-red-500';
    if (hasWorksheet) return 'bg-orange-500';
    return '';
  };

  const weekTasks = unfinished.filter(t => {
    const taskDate = startOfDay(t.dueDate.includes('T') ? parseISO(t.dueDate) : new Date(t.dueDate + 'T00:00:00'));
    return taskDate >= weekStart && taskDate <= weekEnd;
  });
  const weekTests = weekTasks.filter(t => t.type === 'test').length;
  const weekWorksheets = weekTasks.filter(t => t.type === 'worksheet').length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-5 sm:p-6 shadow-xl flex flex-col gap-6 h-full"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 h-full">
        {/* Month View */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-4 px-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{format(today, 'MMMM yyyy')}</p>
          </div>
          <div className="grid grid-cols-7 gap-1 flex-1">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <div key={i} className="text-[8px] font-black text-slate-300 text-center py-1">{d}</div>
            ))}
            {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => (
              <div key={`pad-${i}`} className="aspect-square" />
            ))}
            {monthDays.map((day, i) => {
              const status = getDayStatus(day);
              return (
                <div 
                  key={i} 
                  className={`aspect-square rounded-lg flex items-center justify-center text-[9px] font-bold transition-all relative ${
                    isSameDay(day, today) ? 'bg-slate-900 text-white z-10' : 'text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  {status && (
                    <div className={`absolute inset-0 rounded-lg ${status} opacity-20`} />
                  )}
                  {status && (
                    <div className={`absolute bottom-1 w-1 h-1 rounded-full ${status}`} />
                  )}
                  {format(day, 'd')}
                </div>
              );
            })}
          </div>
        </div>

        {/* Week Summary View - Bento Box Style */}
        <div className="flex flex-col border-t sm:border-t-0 sm:border-l border-slate-100 pt-6 sm:pt-0 sm:pl-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1">This Week's Load</p>
          <div className="grid grid-cols-1 gap-3 flex-1">
            <div className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-orange-100">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-orange-50 uppercase tracking-widest opacity-80">Worksheets</span>
                <span className="text-2xl font-black text-white leading-none mt-1">{weekWorksheets}</span>
              </div>
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm border border-white/20">
                <FileText size={20} className="text-white" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-red-400 to-red-500 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-red-100">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-red-50 text-white uppercase tracking-widest opacity-80">Assessments</span>
                <span className="text-2xl font-black text-white leading-none mt-1">{weekTests}</span>
              </div>
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm border border-white/20">
                <Target size={20} className="text-white" />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2 px-1">Weekly Pulse</p>
            <div className="h-3 bg-slate-50 rounded-full overflow-hidden flex p-0.5 border border-slate-100">
              {weekDays.map((day, i) => {
                const status = getDayStatus(day);
                return (
                  <div 
                    key={i} 
                    className={`flex-1 h-full rounded-sm transition-all ${status || 'bg-transparent'} ${i !== 6 ? 'mr-0.5' : ''}`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>

  );
};

const DashboardView: React.FC<DashboardViewProps> = (props) => {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const {
    showEasterNotice, setShowEasterNotice,
    easterNoticeAgreed, setEasterNoticeAgreed, proceedToEasterAssignment,
    isChallengeModeOpen, setIsChallengeModeOpen, startEasterAssignment, units,
    challengeSelectedUnits, setChallengeSelectedUnits, challengeQuestionCount,
    setChallengeQuestionCount, generateChallengeQuiz, isChallengeQuizActive,
    setIsChallengeQuizActive, isEventMode, setIsEventMode, showExitConfirm,
    setShowExitConfirm, challengeCurrentIndex, challengeQuestions,
    handleChallengeAnswer, shortResponseInput, setShortResponseInput,
    isAdminOpen, setIsAdminOpen, isAdminLoggedIn, setIsAdminLoggedIn,
    handleAdminLogin, adminUsername, setAdminUsername, adminPassword,
    setAdminPassword, adminError, challengeRecords, generatePDF,
    deleteChallengeRecord, editingRecord, setEditingRecord, updateChallengeRecord,
    currentEventMessageIndex, eventMessages, randomConcept, refreshConcept,
    startQuiz, startRevision, startVocab,
    currentUser, loginWithGoogle, logout, allUsers, selectedStudent, setSelectedStudent,
    tasks, onCreateTask, onDeleteTask, onStartTask, setMode,
    showCalculator, setShowCalculator, mySubmissions, allSubmissions
  } = props;

  const outstandingTasks = tasks.filter(t => t.status === 'active' && !mySubmissions.some(s => s.taskId === t.id));
  const gradedReports = mySubmissions.filter(s => s.feedback || s.generalFeedback);
  
  const nextTask = [...outstandingTasks].sort((a,b) => {
    const dateA = a.dueDate.includes('T') ? parseISO(a.dueDate) : new Date(a.dueDate + 'T00:00:00');
    const dateB = b.dueDate.includes('T') ? parseISO(b.dueDate) : new Date(b.dueDate + 'T00:00:00');
    return dateA.getTime() - dateB.getTime();
  })[0];

  const nextDeadline = nextTask ? format(nextTask.dueDate.includes('T') ? parseISO(nextTask.dueDate) : new Date(nextTask.dueDate + 'T00:00:00'), 'MMM do') : 'None';

  const [showStats, setShowStats] = React.useState(true);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white/5 backdrop-blur-md border-b border-white/10 p-4 sticky top-0 z-[100] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)]">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4">
          <div className="flex flex-col">
            <h1 className="font-black tracking-tighter leading-none flex items-baseline gap-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-600 text-[21px]">Science Pro</span>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest translate-y-0.5">By Toman</span>
            </h1>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">Powered by Google DeepMind</span>
              <div className="w-1 h-1 rounded-full bg-slate-200" />
              <div className="flex items-center gap-1">
                <Flame size={10} className="text-orange-500 fill-orange-500" />
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">Firebase Secure</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end">
                  <div className="flex items-center gap-1.5">
                    {isAdminLoggedIn ? (
                      <div className="bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full flex items-center gap-1 ring-1 ring-amber-500/20">
                        <ShieldCheck size={10} />
                        <span className="text-[8px] font-black uppercase tracking-widest">Admin</span>
                      </div>
                    ) : props.userProfile?.isParent ? (
                      <div className="bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded-full flex items-center gap-1 ring-1 ring-purple-500/20">
                        <Users size={10} />
                        <span className="text-[8px] font-black uppercase tracking-widest">Parent</span>
                      </div>
                    ) : (
                      <div className="bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full flex items-center gap-1 ring-1 ring-emerald-500/20">
                        <GraduationCap size={10} />
                        <span className="text-[8px] font-black uppercase tracking-widest">Student</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-slate-800 mt-1">{currentUser.displayName || currentUser.email}</span>
                </div>
                
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowStats(!showStats)}
                  className="relative cursor-pointer"
                >
                  {currentUser.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
                      alt="User" 
                      className="w-10 h-10 rounded-2xl border-2 border-white shadow-md ring-1 ring-slate-100" 
                      referrerPolicy="no-referrer" 
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black text-sm shadow-md border-2 border-white">
                      {currentUser.displayName?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                </motion.div>

                <button 
                  onClick={logout}
                  className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center border border-slate-100"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={loginWithGoogle}
                className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-slate-900/20 border border-slate-800"
              >
                <div className="bg-white/10 p-1.5 rounded-lg backdrop-blur-md">
                  <Chrome size={14} />
                </div>
                Login with Google
              </motion.button>
            )}
          </div>
        </div>
      </header>


      <AnimatePresence>
        {isChallengeModeOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative my-auto"
            >
              <button 
                onClick={() => setIsChallengeModeOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <XCircle size={24} />
              </button>
              <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight mb-6 flex items-center gap-2">
                <Trophy className="text-amber-500" /> Challenge Setup
              </h3>
              
              <div className="space-y-6">
                <button
                  onClick={startEasterAssignment}
                  className="w-full p-6 rounded-3xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-black text-xl uppercase tracking-widest shadow-[0_8px_0_0_#0891b2] active:shadow-none active:translate-y-1 transition-all flex flex-col items-center justify-center gap-2 group"
                >
                  <div className="flex items-center gap-3">
                    <Star className="animate-pulse group-hover:scale-125 transition-transform" size={28} />
                    <span>Easter Assignment</span>
                  </div>
                  <span className="text-[10px] opacity-80 font-bold">60 MCQs + 10 Short Responses (Units 1-7)</span>
                </button>

                <div className="relative flex items-center gap-4 py-2">
                  <div className="flex-1 h-px bg-gray-100"></div>
                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">OR CUSTOM CHALLENGE</span>
                  <div className="flex-1 h-px bg-gray-100"></div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Select Topics</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                    {units.map(unit => (
                      <button
                        key={unit.id}
                        onClick={() => {
                          setChallengeSelectedUnits(prev => 
                            prev.includes(unit.id) 
                              ? prev.filter(id => id !== unit.id)
                              : [...prev, unit.id]
                          );
                        }}
                        className={`p-2.5 rounded-xl border-2 font-black text-[10px] transition-all flex flex-col items-center gap-2 text-center ${
                          challengeSelectedUnits.includes(unit.id)
                            ? `${unit.color} border-transparent text-white shadow-[0_4px_0_0_rgba(0,0,0,0.2)]`
                            : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          challengeSelectedUnits.includes(unit.id) ? 'bg-white/20' : unit.color + ' text-white'
                        }`}>
                          {unit.id}
                        </div>
                        <span className="leading-tight uppercase">{unit.title}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-3">Number of Questions</label>
                  <div className="flex flex-wrap gap-2">
                    {[20, 40, 60, 80, 100].map(count => (
                      <button
                        key={count}
                        onClick={() => setChallengeQuestionCount(count)}
                        className={`flex-1 min-w-[60px] p-2 rounded-xl border-2 font-bold text-sm transition-all ${
                          challengeQuestionCount === count
                            ? 'bg-orange-500 border-orange-500 text-white shadow-[0_4px_0_0_#c2410c]'
                            : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  disabled={challengeSelectedUnits.length === 0}
                  onClick={generateChallengeQuiz}
                  className={`w-full py-4 rounded-2xl font-black text-xl uppercase tracking-widest transition-all ${
                    challengeSelectedUnits.length > 0
                      ? 'bg-emerald-500 text-white shadow-[0_6px_0_0_#059669] active:shadow-none active:translate-y-1'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Generate
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto p-4 space-y-2 pb-24">
        <AnimatePresence>
          {showStats && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                {/* At-a-glance Dashboard (Shared/Student View) */}
                <motion.div 
                  onClick={() => setMode('tasks')}
                  whileHover={{ scale: 1.005, cursor: 'pointer' }}
                  whileTap={{ scale: 0.995 }}
                  animate={outstandingTasks.length > 0 ? {
                    boxShadow: ["0 0 0 0px rgba(16, 185, 129, 0)", "0 0 0 10px rgba(16, 185, 129, 0.1)", "0 0 0 0px rgba(16, 185, 129, 0)"]
                  } : {}}
                  transition={outstandingTasks.length > 0 ? {
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  } : {}}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-[2.5rem] p-6 shadow-xl text-white relative overflow-hidden group lg:col-span-1"
                >
                  <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                    <Target size={80} />
                  </div>

                  <div className="flex flex-col justify-between h-full relative z-10">
                    <div className="mb-6">
                      <h2 className="text-xl font-black tracking-tight mb-0.5">
                        {currentUser 
                          ? (props.userProfile?.isParent 
                            ? `Welcome Back, Parent of ${props.userProfile.childName}` 
                            : `Welcome Back, ${currentUser.displayName?.split(' ')[0]}`) 
                          : 'Welcome Back'}
                      </h2>
                      <p className="text-emerald-100 font-bold text-[9px] uppercase tracking-widest opacity-80 mb-2">{format(new Date(), 'EEEE, MMMM do yyyy')}</p>
                      <div className="flex items-center">
                        {!currentUser ? (
                          <div className={`px-2 py-0.5 rounded-full flex items-center gap-1 scale-[1.1] origin-left border shadow-sm bg-slate-500/30 text-white border-slate-500/40`}>
                            <User size={10} />
                            <span className="text-[8px] font-black uppercase tracking-widest">Guest Account</span>
                          </div>
                        ) : isAdminLoggedIn ? (
                          <div className={`px-2 py-0.5 rounded-full flex items-center gap-1 scale-[1.1] origin-left border shadow-sm bg-amber-500/20 text-amber-50 border-amber-500/30`}>
                            <ShieldCheck size={10} />
                            <span className="text-[8px] font-black uppercase tracking-widest">Admin Account</span>
                          </div>
                        ) : props.userProfile?.isParent ? (
                          <div className={`px-2 py-0.5 rounded-full flex items-center gap-1 scale-[1.1] origin-left border shadow-sm bg-purple-500/30 text-white border-purple-500/40`}>
                            <Users size={10} />
                            <span className="text-[8px] font-black uppercase tracking-widest">Parent Account</span>
                          </div>
                        ) : (
                          <div className={`px-2 py-0.5 rounded-full flex items-center gap-1 scale-[1.1] origin-left border shadow-sm bg-emerald-500/30 text-white border-emerald-500/40`}>
                            <GraduationCap size={10} />
                            <span className="text-[8px] font-black uppercase tracking-widest">Student Account</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 w-full">
                      <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-md border border-white/10 flex flex-col justify-center">
                        <div className="flex items-center gap-1 mb-0.5 opacity-70">
                          <Target size={10} className="text-white" />
                          <span className="text-[7px] font-black uppercase tracking-widest">Tasks</span>
                        </div>
                        <div className="text-lg font-black">{outstandingTasks.length}</div>
                      </div>

                      <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-md border border-white/10 flex flex-col justify-center">
                        <div className="flex items-center gap-1 mb-0.5 opacity-70">
                          <CalendarIcon size={10} className="text-white" />
                          <span className="text-[7px] font-black uppercase tracking-widest">Next</span>
                        </div>
                        <div className="text-lg font-black">{nextDeadline}</div>
                      </div>

                      <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-md border border-white/10 flex flex-col justify-center">
                        <div className="flex items-center gap-1 mb-0.5 opacity-70">
                          <FileText size={10} className="text-white" />
                          <span className="text-[7px] font-black uppercase tracking-widest">Graded</span>
                        </div>
                        <div className="text-lg font-black">{gradedReports.length}</div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Right Side: Admin Dashboard OR Calendar Widget */}
                <div className="lg:col-span-2">
                  {isAdminLoggedIn ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
                      <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-5 shadow-sm flex flex-col justify-between"
                      >
                        <div className="bg-indigo-50 w-10 h-10 rounded-xl flex items-center justify-center text-indigo-500 mb-3">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Assignments</p>
                          <p className="text-2xl font-black text-slate-800">{tasks.length}</p>
                        </div>
                      </motion.div>

                      <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-5 shadow-sm flex flex-col justify-between"
                      >
                        <div className="bg-orange-50 w-10 h-10 rounded-xl flex items-center justify-center text-orange-500 mb-3">
                          <Edit size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pending Grading</p>
                          <p className="text-2xl font-black text-slate-800">
                            {allSubmissions.filter(s => !s.gradedAt && !s.feedback && !s.generalFeedback).length}
                          </p>
                        </div>
                      </motion.div>

                      <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className="sm:col-span-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-[2.5rem] p-5 shadow-lg text-white flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm border border-white/10">
                            <Sparkles size={24} />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-purple-100 uppercase tracking-widest opacity-80 leading-none mb-1">Large Language Model (LLM) Deployed</p>
                            <h3 className="text-lg font-black uppercase tracking-tight leading-none">Gemini 3.1 Flash Lite</h3>
                          </div>
                        </div>
                        <div className="bg-white/10 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10">
                          Active
                        </div>
                      </motion.div>
                    </div>
                  ) : (
                    <CalendarWidget tasks={tasks} mySubmissions={mySubmissions} />
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {units.map((unit) => (
            <motion.div 
              key={unit.id}
              whileHover={{ y: -4 }}
              className={`group ${unit.color} rounded-[2.5rem] p-5 shadow-xl text-white flex flex-col h-full relative overflow-hidden`}
            >
              <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md border border-white/20 shadow-lg group-hover:scale-110 transition-transform duration-500">
                    <span className="text-xl font-black leading-none">{unit.id}</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-sm sm:text-base tracking-tight leading-tight mb-0.5 uppercase truncate">{unit.title}</h3>
                    <div className="flex items-center gap-2">
                       <div className="w-1 h-1 rounded-full bg-white animate-pulse"></div>
                       <p className="text-white/60 font-bold text-[8px] uppercase tracking-widest leading-none">Topic Ready</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative z-10 mb-4">
                <div className="bg-white/10 rounded-2xl border border-white/10 p-3 backdrop-blur-sm group-hover:bg-white/15 transition-all">
                  <p className="text-white/90 text-[10px] sm:text-xs font-semibold leading-relaxed line-clamp-2">
                    {unit.description}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 relative z-10 mt-auto">
                <button 
                  onClick={() => startQuiz(unit)}
                  className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl bg-white/10 border border-white/20 text-white hover:bg-white hover:text-emerald-600 hover:border-white transition-all duration-300 shadow-sm group/btn"
                  title="Practice Quiz"
                >
                  <CheckCircle2 size={18} className="group-hover/btn:scale-110 transition-transform" />
                  <span className="text-[7px] font-black uppercase tracking-tight">Quiz</span>
                </button>
                <button 
                  onClick={() => startRevision(unit)}
                  className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl bg-white/10 border border-white/20 text-white hover:bg-white hover:text-blue-600 hover:border-white transition-all duration-300 shadow-sm group/btn"
                  title="Revision Notes"
                >
                  <BookOpen size={18} className="group-hover/btn:scale-110 transition-transform" />
                  <span className="text-[7px] font-black uppercase tracking-tight">Notes</span>
                </button>
                <button 
                  onClick={() => startVocab(unit)}
                  className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl bg-white/10 border border-white/20 text-white hover:bg-white hover:text-purple-600 hover:border-white transition-all duration-300 shadow-sm group/btn"
                  title="Vocabulary List"
                >
                  <Languages size={18} className="group-hover/btn:scale-110 transition-transform" />
                  <span className="text-[7px] font-black uppercase tracking-tight">Vocab</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Challenge Quiz Overlay */}
      {isChallengeQuizActive && (
        <div className="fixed inset-0 bg-white z-[150] flex flex-col">
          <header className="p-4 border-b-2 border-gray-100 flex items-center gap-4">
            <button 
              onClick={() => {
                if (isEventMode) {
                  setShowExitConfirm(true);
                } else if (confirm("Are you sure you want to quit the challenge? Progress will be lost.")) {
                  setIsChallengeQuizActive(false);
                }
              }} 
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle size={32} />
            </button>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">
                  {isEventMode ? "Event Mode" : "Challenge Mode"}
                </span>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Question {challengeCurrentIndex + 1} of {challengeQuestions.length}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${((challengeCurrentIndex + 1) / challengeQuestions.length) * 100}%` }}
                  className={`h-full ${isEventMode ? 'bg-cyan-500' : 'bg-orange-500'} rounded-full`}
                />
              </div>
            </div>
          </header>

          <main className="flex-1 max-w-2xl mx-auto w-full p-6 flex flex-col overflow-y-auto">
            <h2 className="text-2xl font-black text-gray-800 mb-8">{challengeQuestions[challengeCurrentIndex]?.text}</h2>
            
            {challengeQuestions[challengeCurrentIndex]?.options.length > 0 ? (
              <div className="space-y-4">
                {challengeQuestions[challengeCurrentIndex].options.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleChallengeAnswer(option)}
                    className="w-full p-4 text-left rounded-2xl border-2 border-gray-200 hover:bg-gray-50 text-gray-700 shadow-[0_4px_0_0_#e5e7eb] active:shadow-none active:translate-y-1 transition-all font-bold text-lg"
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="relative">
                  <textarea
                    value={shortResponseInput}
                    onChange={(e) => setShortResponseInput(e.target.value)}
                    placeholder="Type your response here..."
                    className="w-full p-6 rounded-2xl border-2 border-gray-200 font-bold text-lg focus:border-cyan-500 outline-none min-h-[150px] resize-none shadow-inner bg-gray-50"
                  />
                </div>
                <button
                  disabled={!shortResponseInput.trim()}
                  onClick={() => {
                    handleChallengeAnswer(shortResponseInput);
                    setShortResponseInput("");
                  }}
                  className={`w-full py-4 rounded-2xl font-black text-xl uppercase tracking-widest transition-all ${
                    shortResponseInput.trim()
                      ? 'bg-cyan-500 text-white shadow-[0_6px_0_0_#0891b2] active:shadow-none active:translate-y-1'
                      : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  Submit Answer
                </button>
              </div>
            )}
          </main>

          {showExitConfirm && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center"
              >
                <h3 className="text-xl font-black text-gray-800 mb-4">Progress will not be saved. Continue?</h3>
                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      setShowExitConfirm(false);
                      setIsChallengeQuizActive(false);
                      setIsEventMode(false);
                    }}
                    className="flex-1 bg-red-500 text-white py-3 rounded-xl font-black uppercase tracking-widest shadow-[0_4px_0_0_#b91c1c] active:shadow-none active:translate-y-1 transition-all"
                  >
                    No, exit
                  </button>
                  <button 
                    onClick={() => setShowExitConfirm(false)}
                    className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-black uppercase tracking-widest shadow-[0_4px_0_0_#059669] active:shadow-none active:translate-y-1 transition-all"
                  >
                    yes, continue
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      )}

      {isAdminOpen && (
        <div className="fixed inset-0 bg-gray-50 z-[300] flex flex-col overflow-hidden">
          <header className="bg-white border-b-2 border-gray-200 p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsAdminOpen(false)} className="text-gray-400 hover:text-gray-600">
                <ChevronLeft size={32} />
              </button>
              <h1 className="text-xl font-black text-gray-800 uppercase tracking-tight">Admin Dashboard</h1>
            </div>
            {isAdminLoggedIn && (
              <button 
                onClick={() => setIsAdminLoggedIn(false)}
                className="text-red-500 font-bold flex items-center gap-2 hover:bg-red-50 px-3 py-1 rounded-lg transition-colors"
              >
                <LogOut size={20} /> Logout
              </button>
            )}
          </header>

          <main className="flex-1 overflow-y-auto p-6">
            {!isAdminLoggedIn ? (
              <div className="max-w-sm mx-auto mt-20">
                <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-gray-100">
                  <div className="bg-emerald-100 w-16 h-16 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto mb-6">
                    <Lock size={32} />
                  </div>
                  <h2 className="text-2xl font-black text-center text-gray-800 uppercase mb-6">Admin Login</h2>
                  
                  <button 
                    type="button"
                    onClick={loginWithGoogle}
                    className="w-full bg-white border-4 border-emerald-500 text-emerald-600 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-50 transition-all shadow-[0_6px_0_0_#10b981] active:shadow-none active:translate-y-1 mb-6"
                  >
                    <Chrome size={24} />
                    Login with Admin Google
                  </button>

                  <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t-2 border-gray-100"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-black text-gray-300">
                      <span className="bg-white px-2 italic">Legacy Login</span>
                    </div>
                  </div>

                  <form onSubmit={handleAdminLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Username</label>
                      <input 
                        type="text" 
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        className="w-full p-3 rounded-xl border-2 border-gray-200 font-bold focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Password</label>
                      <input 
                        type="password" 
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="w-full p-3 rounded-xl border-2 border-gray-200 font-bold focus:border-emerald-500 outline-none"
                      />
                    </div>
                    {adminError && <p className="text-red-500 text-sm font-bold text-center">{adminError}</p>}
                    <button className="w-full bg-emerald-500 text-white py-3 rounded-xl font-black uppercase tracking-widest shadow-[0_4px_0_0_#059669] active:shadow-none active:translate-y-1 transition-all">
                      Login
                    </button>
                    
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t-2 border-gray-100"></div>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase font-black text-gray-400">
                        <span className="bg-white px-2">Or</span>
                      </div>
                    </div>

                    <button 
                      type="button"
                      onClick={handleAdminLogin}
                      className="w-full bg-white border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-gray-50 transition-all"
                    >
                      <Chrome size={20} />
                      Sign in with Google
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="max-w-5xl mx-auto space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-3xl border-2 border-gray-200 shadow-sm">
                    <p className="text-gray-400 font-black text-xs uppercase tracking-widest mb-2">Total Quizzes</p>
                    <p className="text-4xl font-black text-gray-800">{challengeRecords.length}</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border-2 border-gray-200 shadow-sm">
                    <p className="text-gray-400 font-black text-xs uppercase tracking-widest mb-2">Total Students</p>
                    <p className="text-4xl font-black text-emerald-500">
                      {allUsers.length}
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border-2 border-gray-200 shadow-sm">
                    <p className="text-gray-400 font-black text-xs uppercase tracking-widest mb-2">Event Records</p>
                    <p className="text-4xl font-black text-blue-500">
                      {new Set(challengeRecords.map(r => r.studentName)).size}
                    </p>
                  </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Registered Students</h2>
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Total: {allUsers.length}
                      </div>
                    </div>

                    <div className="bg-white rounded-[2rem] border-2 border-gray-200 overflow-hidden shadow-sm max-h-[600px] overflow-y-auto">
                      <div className="divide-y-2 divide-gray-100">
                        {allUsers.map(user => (
                          <button
                            key={user.userId}
                            onClick={() => setSelectedStudent(user)}
                            className={`w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors group ${selectedStudent?.userId === user.userId ? 'bg-emerald-50' : ''}`}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-black text-xl">
                                {user.displayName?.charAt(0) || 'S'}
                              </div>
                              <div>
                                <h3 className="font-black text-gray-800 uppercase tracking-tight leading-none mb-1">{user.displayName}</h3>
                                <p className="text-xs font-bold text-gray-400">{user.email}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Last online</p>
                              <p className="text-xs font-bold text-gray-600">
                                {new Date(user.lastSeen).toLocaleDateString()}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Student Details</h2>
                      {selectedStudent && (
                        <button 
                          onClick={() => setSelectedStudent(null)}
                          className="text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:underline"
                        >
                          Clear Selection
                        </button>
                      )}
                    </div>

                    {selectedStudent ? (
                      <div className="bg-white rounded-[2rem] border-2 border-gray-200 p-8 shadow-sm space-y-8">
                        <div className="flex items-center gap-6 pb-6 border-b-2 border-gray-50">
                          <div className="w-20 h-20 rounded-3xl bg-emerald-500 flex items-center justify-center text-white font-black text-4xl shadow-lg">
                            {selectedStudent.displayName?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tighter leading-none mb-2">{selectedStudent.displayName}</h2>
                            <span className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                              Active Student
                            </span>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Unit Progress</h3>
                          <div className="grid grid-cols-2 gap-4">
                            {units.map(unit => {
                              const unitProgress = selectedStudent.progress?.[unit.id] || { attemptedQuestions: [], masteredVocab: [] };
                              return (
                                <div key={unit.id} className="p-4 rounded-2xl bg-gray-50 border-2 border-gray-100 group hover:border-emerald-200 transition-colors">
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className={`w-8 h-8 ${unit.color} rounded-lg flex items-center justify-center text-white font-bold text-xs`}>
                                      {unit.id}
                                    </div>
                                    <span className="font-black text-[10px] text-gray-500 uppercase truncate">{unit.title}</span>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-[10px] font-bold text-gray-400 uppercase">Quiz</span>
                                      <span className="text-xs font-black text-emerald-600">{unitProgress.attemptedQuestions.length} of {unit.questions.length}</span>
                                    </div>
                                    <div className="h-1.5 bg-white rounded-full overflow-hidden border">
                                      <div 
                                        className="h-full bg-emerald-500 transition-all duration-1000"
                                        style={{ width: `${(unitProgress.attemptedQuestions.length / unit.questions.length) * 100}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-100 rounded-[2.5rem] border-4 border-dashed border-gray-200 flex flex-col items-center justify-center p-20 text-center">
                        <User size={64} className="text-gray-300 mb-4" />
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Select a student from the list to view detailed progress</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Historical Quiz Records</h2>
                  <button 
                    onClick={() => generatePDF(challengeRecords)}
                    className="bg-emerald-500 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_4px_0_0_#059669] hover:bg-emerald-600 transition-all active:shadow-none active:translate-y-1"
                  >
                    <Download size={20} /> Export History
                  </button>
                </div>

                <div className="bg-white rounded-[2rem] border-2 border-gray-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 border-b-2 border-gray-200">
                        <tr>
                          <th className="px-8 py-5 font-black text-gray-400 uppercase tracking-widest text-xs">Student</th>
                          <th className="px-8 py-5 font-black text-gray-400 uppercase tracking-widest text-xs">Score</th>
                          <th className="px-8 py-5 font-black text-gray-400 uppercase tracking-widest text-xs">Units</th>
                          <th className="px-8 py-5 font-black text-gray-400 uppercase tracking-widest text-xs">Date</th>
                          <th className="px-8 py-5 font-black text-gray-400 uppercase tracking-widest text-xs text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-gray-100">
                        {challengeRecords.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(record => (
                          <tr key={record.id} className="hover:bg-gray-50 transition-colors group">
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-black">
                                  {record.studentName.charAt(0).toUpperCase()}
                                </div>
                                <span className={`font-bold ${ (record.score / record.totalQuestions) < 0.6 ? 'text-red-500' : 'text-gray-800' }`}>
                                  {record.studentName}
                                </span>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex flex-col">
                                <span className={`font-black text-lg ${
                                  (record.score / record.totalQuestions) >= 0.8 ? 'text-emerald-500' :
                                  (record.score / record.totalQuestions) >= 0.5 ? 'text-orange-500' :
                                  'text-red-500'
                                }`}>
                                  {record.score} of {record.totalQuestions}
                                </span>
                                <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${
                                      (record.score / record.totalQuestions) >= 0.8 ? 'bg-emerald-500' :
                                      (record.score / record.totalQuestions) >= 0.5 ? 'bg-orange-500' :
                                      'bg-red-500'
                                    }`}
                                    style={{ width: `${(record.score / record.totalQuestions) * 100}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex flex-wrap gap-1">
                                {record.selectedUnits.map(uId => (
                                  <span key={uId} className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md text-[10px] font-black">
                                    U{uId}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-8 py-5 text-gray-500 text-sm font-medium">
                              {new Date(record.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </td>
                            <td className="px-8 py-5 text-right">
                              <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => generatePDF([record])}
                                  className="p-2.5 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
                                  title="Download PDF"
                                >
                                  <FileText size={20} />
                                </button>
                                <button 
                                  onClick={() => setEditingRecord(record)}
                                  className="p-2.5 text-amber-500 hover:bg-amber-50 rounded-xl transition-colors"
                                  title="Edit Record"
                                >
                                  <Edit size={20} />
                                </button>
                                <button 
                                  onClick={() => {
                                    if (confirm("Delete this record permanently?")) {
                                      deleteChallengeRecord(record.id);
                                    }
                                  }}
                                  className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                  title="Delete Record"
                                >
                                  <Trash2 size={20} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {challengeRecords.length === 0 && (
                    <div className="p-20 text-center">
                      <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                        <Database size={40} />
                      </div>
                      <p className="text-gray-400 font-black uppercase tracking-widest text-sm">No records found yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      )}

      {editingRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[400] flex items-center justify-center p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
          >
            <h3 className="text-2xl font-black text-gray-800 uppercase mb-6">Edit Record</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Student Name</label>
                <input 
                  type="text" 
                  value={editingRecord.studentName}
                  onChange={(e) => setEditingRecord({...editingRecord, studentName: e.target.value})}
                  className="w-full p-3 rounded-xl border-2 border-gray-200 font-bold focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Score</label>
                <input 
                  type="number" 
                  value={editingRecord.score}
                  onChange={(e) => setEditingRecord({...editingRecord, score: parseInt(e.target.value)})}
                  className="w-full p-3 rounded-xl border-2 border-gray-200 font-bold focus:border-emerald-500 outline-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setEditingRecord(null)}
                  className="flex-1 py-3 rounded-xl font-black uppercase tracking-widest border-2 border-gray-200 text-gray-400"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    updateChallengeRecord(editingRecord);
                    setEditingRecord(null);
                  }}
                  className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-black uppercase tracking-widest shadow-[0_4px_0_0_#059669]"
                >
                  Save
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DashboardView;
