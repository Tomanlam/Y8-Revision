import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Heart, BookOpen, GraduationCap, Languages, ChevronLeft, 
  CheckCircle2, XCircle, Trophy, Trash2, Lock, FileText, 
  Download, Star, Zap, Chrome, LayoutGrid, Info, ArrowRight, RefreshCw,
  QrCode, Edit, Database, LogOut, User, Calendar as CalendarIcon, ChevronRight as ChevronRightIcon, Target,
  Crown, Calculator, Clock
} from 'lucide-react';
import { Unit, ChallengeRecord, ChallengeResponse, Question, UserProfile, Task } from '../../types';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, startOfDay } from 'date-fns';
import { User as FirebaseUser } from 'firebase/auth';

interface DashboardViewProps {
  isY8Open: boolean;
  setIsY8Open: (v: boolean) => void;
  setIsQRModalOpen: (v: boolean) => void;
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
  isQRModalOpen: boolean;
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
}

const Y8Splash = ({ onClose }: { onClose: () => void }) => {
  const [activeEmojis, setActiveEmojis] = React.useState<{ id: number; emoji: string; x: number; y: number; size: number }[]>([]);
  
  const spawnEmoji = () => {
    const facialEmojis = ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿", "👹", "👺", "🤡", "💩", "👻", "💀", "☠️", "👽", "👾", "🤖", "🎃", "😺", "😸", "😻", "😼", "😽", "🙀", "😿", "😾"];
    const id = Date.now();
    const newEmoji = {
      id,
      emoji: facialEmojis[Math.floor(Math.random() * facialEmojis.length)],
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10,
      size: Math.random() * 60 + 40,
    };
    setActiveEmojis(prev => [...prev, newEmoji]);
    setTimeout(() => {
      setActiveEmojis(prev => prev.filter(e => e.id !== id));
    }, 1000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-orange-500 flex flex-col items-center justify-center p-8 overflow-y-auto"
    >
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors z-[120]"
      >
        <XCircle size={40} />
      </button>

      <motion.h2 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-white text-4xl font-black uppercase tracking-tighter mb-12 text-center"
      >
        Class of 2025-26
      </motion.h2>

      <motion.div 
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
        }}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 max-w-4xl w-full"
      >
        {[
          "Edith", "Demi", "Hanson", "Dickson", "Helen", "Kiki", "Felix", "Hanna", 
          "Ariel", "Alex", "Silvio", "Tony", "Anka", "Kiyo", "Billy", "Samuel", 
          "Lawrence", "Xosox", "Chandler", "Mori", "Marli", "Hiro"
        ].map((name) => (
          <motion.button
            key={name}
            variants={{
              hidden: { opacity: 0, x: -20 },
              visible: { opacity: 1, x: 0 }
            }}
            onClick={(e) => {
              e.stopPropagation();
              spawnEmoji();
            }}
            className="text-white text-2xl font-bold uppercase tracking-wide hover:scale-110 transition-transform text-center outline-none"
          >
            {name}
          </motion.button>
        ))}
      </motion.div>

      <AnimatePresence>
        {activeEmojis.map(emoji => (
          <motion.div
            key={emoji.id}
            initial={{ opacity: 0, scale: 0, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.5, y: -50 }}
            className="fixed pointer-events-none z-[110]"
            style={{ 
              left: `${emoji.x}%`, 
              top: `${emoji.y}%`, 
              fontSize: `${emoji.size}px` 
            }}
          >
            {emoji.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
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
    isY8Open, setIsY8Open, setIsQRModalOpen, showEasterNotice, setShowEasterNotice,
    easterNoticeAgreed, setEasterNoticeAgreed, proceedToEasterAssignment,
    isChallengeModeOpen, setIsChallengeModeOpen, startEasterAssignment, units,
    challengeSelectedUnits, setChallengeSelectedUnits, challengeQuestionCount,
    setChallengeQuestionCount, generateChallengeQuiz, isChallengeQuizActive,
    setIsChallengeQuizActive, isEventMode, setIsEventMode, showExitConfirm,
    setShowExitConfirm, challengeCurrentIndex, challengeQuestions,
    handleChallengeAnswer, shortResponseInput, setShortResponseInput,
    isQRModalOpen, isAdminOpen, setIsAdminOpen, isAdminLoggedIn, setIsAdminLoggedIn,
    handleAdminLogin, adminUsername, setAdminUsername, adminPassword,
    setAdminPassword, adminError, challengeRecords, generatePDF,
    deleteChallengeRecord, editingRecord, setEditingRecord, updateChallengeRecord,
    currentEventMessageIndex, eventMessages, randomConcept, refreshConcept,
    startQuiz, startRevision, startVocab,
    currentUser, loginWithGoogle, logout, allUsers, selectedStudent, setSelectedStudent,
    tasks, onCreateTask, onDeleteTask, onStartTask, setMode,
    showCalculator, setShowCalculator
  } = props;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <AnimatePresence>
        {isY8Open && <Y8Splash onClose={() => setIsY8Open(false)} />}
      </AnimatePresence>

      <header className="bg-white border-b-2 border-gray-200 p-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex justify-between items-center px-4">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black text-emerald-500 tracking-tight leading-none">Y8 Cambridge LS Science</h1>
            <span className="text-[10px] font-bold text-black uppercase tracking-widest mt-1">An app by Toman</span>
          </div>
          <div className="flex items-center gap-2">
            
            {currentUser ? (
              <div className="flex items-center gap-2 mr-2">
                <div className="hidden sm:flex flex-col items-end">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Logged in as</span>
                    {isAdminLoggedIn ? (
                      <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full">
                        <Crown size={10} className="text-amber-500 fill-amber-500" />
                        <span className="text-[9px] font-black text-amber-600 uppercase tracking-tight">God Mode</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <GraduationCap size={10} className="text-emerald-500" />
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tight">Student Mode</span>
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-bold text-gray-700 truncate max-w-[120px]">{currentUser.displayName || currentUser.email}</span>
                </div>
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="User" className="w-8 h-8 rounded-full border-2 border-emerald-100" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs">
                    {currentUser.displayName?.charAt(0) || 'U'}
                  </div>
                )}
                <button 
                  onClick={logout}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button 
                onClick={loginWithGoogle}
                className="group flex items-center gap-2 bg-white border-2 border-gray-100 hover:border-blue-400 px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest text-gray-700 shadow-[0_3px_0_0_#f3f4f6] hover:shadow-[0_3px_0_0_#dbeafe] active:shadow-none active:translate-y-0.5 transition-all mr-2"
              >
                <div className="flex items-center justify-center w-6 h-6 bg-white rounded-lg shadow-sm group-hover:scale-110 transition-transform font-black text-blue-500 text-sm">
                  G
                </div>
                <span>Login</span>
              </button>
            )}
            <button 
              onClick={() => setIsY8Open(true)}
              className="bg-orange-500 text-white px-4 py-1.5 rounded-full font-black text-sm uppercase tracking-widest shadow-[0_4px_0_0_#c2410c] active:shadow-none active:translate-y-1 transition-all"
            >
              Y8
            </button>
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

      <main className="max-w-7xl mx-auto p-6 space-y-8 mt-4 pb-24">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-[2rem] p-5 md:p-6 shadow-lg text-white">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight mb-1">At a Glance</h2>
              <p className="text-emerald-100 font-medium text-sm">{format(new Date(), 'EEEE, MMMM do yyyy')}</p>
            </div>
            <div className="flex items-center gap-3 bg-white/20 p-3 rounded-2xl backdrop-blur-sm border border-white/20">
              <div className="bg-white p-2 rounded-xl text-teal-600 shadow-sm">
                <Target size={24} />
              </div>
              <div>
                <div className="text-2xl font-black leading-none">{tasks.filter(t => t.status === 'active').length}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest mt-0.5 opacity-90 text-emerald-50">Active Tasks</div>
              </div>
            </div>
          </div>
          
          {tasks.filter(t => t.status === 'active').length > 0 && (
            <div className="mt-5 pt-5 border-t border-white/20">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-emerald-100">Next Deadlines</h3>
                <button 
                  onClick={() => setMode('tasks')}
                  className="text-[10px] font-bold uppercase tracking-widest hover:text-emerald-200 transition-colors flex items-center gap-1"
                >
                  View All <ChevronRightIcon size={12} />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {tasks.filter(t => t.status === 'active')
                  .sort((a,b) => {
                    const dateA = a.dueDate.includes('T') ? parseISO(a.dueDate) : new Date(a.dueDate + 'T00:00:00');
                    const dateB = b.dueDate.includes('T') ? parseISO(b.dueDate) : new Date(b.dueDate + 'T00:00:00');
                    return dateA.getTime() - dateB.getTime();
                  })
                  .slice(0, isMobile ? 1 : 3)
                  .map(task => {
                    const taskDate = task.dueDate.includes('T') ? parseISO(task.dueDate) : new Date(task.dueDate + 'T00:00:00');
                    return (
                      <div key={task.id} className="bg-white/10 hover:bg-white/20 transition-colors rounded-xl p-3 flex items-center justify-between gap-3 border border-white/10">
                        <div className="truncate flex-1">
                          <p className="font-bold truncate text-sm" title={task.title}>{task.title}</p>
                          <p className="text-[10px] font-semibold text-emerald-100 uppercase tracking-wider mt-0.5 flex items-center gap-1">
                            <Clock size={10} /> {format(taskDate, 'MMM do')}
                          </p>
                        </div>
                        <button
                          onClick={() => { setMode('tasks'); onStartTask(task); }}
                          className="bg-white text-teal-600 p-2 rounded-lg hover:scale-105 active:scale-95 transition-all shadow-sm"
                        >
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {units.map((unit) => (
            <motion.div 
              key={unit.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white border-2 border-gray-200 rounded-2xl p-5 shadow-[0_4px_0_0_rgba(0,0,0,0.05)] hover:border-emerald-400 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 ${unit.color} rounded-xl flex items-center justify-center text-white font-bold text-xl`}>
                    {unit.id}
                  </div>
                  <div>
                    <h3 className="font-black text-gray-800 text-lg uppercase tracking-wide">{unit.title}</h3>
                    <p className="text-gray-500 text-sm">{unit.description}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button 
                  onClick={() => startQuiz(unit)}
                  className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-emerald-50 text-emerald-600 border-2 border-emerald-100 hover:bg-emerald-100 transition-colors"
                >
                  <CheckCircle2 size={24} />
                  <span className="text-xs font-bold uppercase">Quiz</span>
                </button>
                <button 
                  onClick={() => startRevision(unit)}
                  className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-blue-50 text-blue-600 border-2 border-blue-100 hover:bg-blue-100 transition-colors"
                >
                  <BookOpen size={24} />
                  <span className="text-xs font-bold uppercase">Notes</span>
                </button>
                <button 
                  onClick={() => startVocab(unit)}
                  className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-purple-50 text-purple-600 border-2 border-purple-100 hover:bg-purple-100 transition-colors"
                >
                  <Languages size={24} />
                  <span className="text-xs font-bold uppercase">Vocab</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <footer className="max-w-2xl mx-auto p-8 text-center space-y-4">
          <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">
            Made with <Heart className="inline text-red-400 mx-1" size={16} fill="currentColor" /> for Y8 Students
          </p>
        </footer>
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

      {isQRModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center relative"
          >
            <button 
              onClick={() => setIsQRModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <XCircle size={24} />
            </button>
            <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight mb-2">App QR Code</h3>
            <p className="text-gray-500 font-medium mb-6">Scan to open the revision app on your mobile device!</p>
            <div className="bg-gray-50 p-6 rounded-2xl border-2 border-gray-100 flex justify-center mb-6">
              <QRCodeSVG value="https://y8rev.vercel.app" size={200} level="H" includeMargin={true} />
            </div>
            <p className="text-emerald-500 font-black text-sm uppercase tracking-widest">y8rev.vercel.app</p>
          </motion.div>
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
                                      <span className="text-xs font-black text-emerald-600">{unitProgress.attemptedQuestions.length} / {unit.questions.length}</span>
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
                                  {record.score} / {record.totalQuestions}
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
