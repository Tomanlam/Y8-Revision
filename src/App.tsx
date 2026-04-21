/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { useState, useEffect, useMemo, useRef, ErrorInfo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  collection, doc, setDoc, deleteDoc, onSnapshot, 
  query, orderBy, getDocFromServer, getDoc, updateDoc, where
} from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser } from 'firebase/auth';
import { db, auth } from './firebase';

// Types
import { 
  AppMode, SessionStats, ChallengeResponse, ChallengeRecord, 
  OperationType, Unit, Question, NavItem, UserProfile,
  Task, TaskSubmission
} from './types';

// Constants
import { eventMessages, facts, navItems } from './constants';

// Data
import { units } from './data';
import { ExothermicReactionsWorksheet } from './data/worksheets/ExothermicReactions';

// Components
import DashboardView from './components/views/DashboardView';
import QuizView from './components/views/QuizView';
import VocabView from './components/views/VocabView';
import RevisionNotesView from './components/views/RevisionNotesView';
import UserStatsView from './components/views/UserStatsView';
import AboutView from './components/views/AboutView';
import QuickFacts from './QuickFacts';
import TasksView from './components/views/TasksView';
import TaskWorksheetView from './components/views/TaskWorksheetView';
import Calculator from './components/Calculator';

// Icons
import { 
  Heart, BookOpen, GraduationCap, Languages, ChevronLeft, 
  CheckCircle2, XCircle, Trophy, Trash2, User, Lock, FileText, 
  Download, ChevronRight, X, Menu, Settings, LogOut, Plus, 
  Minus, Save, Edit, Trash, Search, Filter, ArrowLeft, Play, 
  Pause, RotateCcw, Clock, Award, Star, Thermometer, TestTube, 
  Microscope, Magnet, Lightbulb, Sun, Moon, Cloud, Globe, Cpu,
  Activity, Zap, Chrome, BarChart3, Binary, LayoutGrid, Timer, 
  ShieldCheck, MessageSquare, Sparkles, Move, FlaskRound, Beaker,
  FlaskConical, Wind, Flame, Droplets, Atom, Info, ArrowRight, RefreshCw,
  QrCode, ArrowRightLeft, RefreshCcw, Target
} from 'lucide-react';

// Error Boundary Component
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AppErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public props: ErrorBoundaryProps;
  public state: ErrorBoundaryState;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong.";
      try {
        const parsed = JSON.parse(this.state.error?.message || "{}");
        if (parsed.error) errorMessage = `Firestore Error: ${parsed.error}`;
      } catch {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border-2 border-red-100">
            <XCircle className="text-red-500 mx-auto mb-4" size={64} />
            <h2 className="text-2xl font-black text-gray-800 mb-4 uppercase">System Error</h2>
            <p className="text-gray-600 font-bold mb-6">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-500 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest shadow-[0_4px_0_0_#b91c1c] active:shadow-none active:translate-y-1 transition-all"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const APP_NAV_ITEMS: NavItem[] = [
  { mode: 'dashboard', icon: LayoutGrid, label: 'Hub' },
  { mode: 'tasks', icon: Target, label: 'Tasks' },
  { mode: 'user-stats', icon: User, label: 'Stats' },
  { mode: 'quick-facts', icon: Lightbulb, label: 'Facts' },
  { mode: 'about', icon: Info, label: 'About' }
];

const Sidebar = ({ currentMode, setMode, onQRClick }: { currentMode: AppMode, setMode: (m: AppMode) => void, onQRClick: () => void }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={false}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={{ width: isHovered ? 300 : 80 }}
      className="fixed left-0 top-0 bottom-0 bg-white border-r-2 border-gray-100 z-50 hidden md:flex flex-col py-8 transition-all duration-300 ease-in-out shadow-xl"
    >
      <div className={`px-5 mb-10 flex items-center gap-4 overflow-hidden h-12 transition-all ${!isHovered ? 'justify-center' : ''}`}>
        <AnimatePresence>
          {isHovered ? (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-col whitespace-nowrap"
            >
              <h1 className="text-base font-black text-emerald-500 tracking-tight leading-none uppercase">Y8 Cambridge LS Science</h1>
              <span className="text-[8px] font-bold text-black uppercase tracking-widest mt-1">An app by Toman</span>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-emerald-500 w-10 h-10 rounded-xl flex items-center justify-center text-white"
            >
              <span className="font-black text-lg">Y8</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 px-4 space-y-2">
        {APP_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentMode === item.mode;
          
          return (
            <button
              key={item.mode}
              onClick={() => setMode(item.mode)}
              className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all relative group h-14
                ${isActive 
                  ? 'bg-emerald-50 text-emerald-600 shadow-[0_4px_0_0_#10b98133]' 
                  : 'text-gray-400 hover:bg-gray-50 hover:text-emerald-400'
                }
              `}
            >
              <div className="flex-shrink-0">
                <Icon size={24} fill={isActive ? "currentColor" : "none"} />
              </div>
              <AnimatePresence>
                {isHovered && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="font-black uppercase tracking-widest text-xs whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {!isHovered && isActive && (
                <motion.div 
                  layoutId="active-indicator"
                  className="absolute left-0 w-1 h-8 bg-emerald-500 rounded-r-full"
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="px-4 mt-auto">
        <button
          onClick={onQRClick}
          className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-gray-100 flex items-center justify-center gap-4 transition-all hover:bg-emerald-50 hover:border-emerald-100 group"
          title="App QR Code"
        >
          <div className="flex-shrink-0 text-gray-400 group-hover:text-emerald-500">
            <QrCode size={24} />
          </div>
        </button>
      </div>
    </motion.div>
  );
};

export default function App() {
  return (
    <AppErrorBoundary>
      <AppContent />
    </AppErrorBoundary>
  );
}

const ADMIN_EMAIL = 'tomanlam@gmail.com';

const INITIAL_TASKS: Task[] = [
    {
      id: 'task-1',
      title: 'Cells and Organisms Review',
      description: 'Complete the quiz to review the basic structures of plants and animal cells.',
      units: [1],
      dueDate: '2024-04-15',
      status: 'active',
      type: 'standard'
    },
    ExothermicReactionsWorksheet
  ];

function AppContent() {

  const [mode, setMode] = useState<AppMode>('dashboard');
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [sessionStats, setSessionStats] = useState<SessionStats>({});
  
  // Auth State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<UserProfile | null>(null);
  
  // Dashboard & Challenge States
  const [isY8Open, setIsY8Open] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [showEasterNotice, setShowEasterNotice] = useState(false);
  const [easterNoticeAgreed, setEasterNoticeAgreed] = useState(false);
  const [isChallengeModeOpen, setIsChallengeModeOpen] = useState(false);
  const [challengeSelectedUnits, setChallengeSelectedUnits] = useState<number[]>([]);
  const [challengeQuestionCount, setChallengeQuestionCount] = useState<number>(20);
  const [isChallengeQuizActive, setIsChallengeQuizActive] = useState(false);
  const [challengeQuestions, setChallengeQuestions] = useState<Question[]>([]);
  const [challengeCurrentIndex, setChallengeCurrentIndex] = useState(0);
  const [challengeResponses, setChallengeResponses] = useState<ChallengeResponse[]>([]);
  const [challengeStudentName, setChallengeStudentName] = useState("");
  const [showChallengeResult, setShowChallengeResult] = useState(false);
  const [shortResponseInput, setShortResponseInput] = useState("");
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [challengeRecords, setChallengeRecords] = useState<ChallengeRecord[]>([]);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [mySubmissions, setMySubmissions] = useState<TaskSubmission[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<TaskSubmission[]>([]);
  const [editingRecord, setEditingRecord] = useState<ChallengeRecord | null>(null);
  const [isEventMode, setIsEventMode] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [currentEventMessageIndex, setCurrentEventMessageIndex] = useState(0);
  const [randomConcept, setRandomConcept] = useState(facts[0]);
  const [chineseType, setChineseType] = useState<'traditional' | 'simplified'>('traditional');
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [viewedSubmission, setViewedSubmission] = useState<TaskSubmission | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);

  const selectedUnit = useMemo(() => units.find(u => u.id === selectedUnitId), [selectedUnitId]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsAuthReady(true);
      
      if (user) {
        // Sync/Fetch user profile
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const data = userSnap.data() as UserProfile;
          setUserProfile(data);
          setSessionStats(data.progress || {});
          
          // Update last seen
          await updateDoc(userRef, { lastSeen: new Date().toISOString() });
        } else {
          // Initialize profile
          const newProfile: UserProfile = {
            userId: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'Student',
            progress: {},
            lastSeen: new Date().toISOString(),
            isAdmin: user.email === ADMIN_EMAIL
          };
          await setDoc(userRef, newProfile);
          setUserProfile(newProfile);
          setSessionStats({});
        }
        
        if (user.email === ADMIN_EMAIL) {
          setIsAdminLoggedIn(true);
        } else {
          setIsAdminLoggedIn(false);
        }
      } else {
        setUserProfile(null);
        setIsAdminLoggedIn(false);
        setSessionStats({}); // Reset for guests
      }
    });
    return () => unsub();
  }, []);

  // Sync sessionStats to Firestore
  useEffect(() => {
    if (!currentUser || !userProfile) return;
    
    const syncTimer = setTimeout(async () => {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, { 
        progress: sessionStats,
        lastSeen: new Date().toISOString()
      });
    }, 2000); // Debounce sync

    return () => clearTimeout(syncTimer);
  }, [sessionStats, currentUser, userProfile]);

  // Fetch all users for Admin
  useEffect(() => {
    if (!isAdminLoggedIn) return;
    const q = query(collection(db, 'users'), orderBy('lastSeen', 'desc'));
    return onSnapshot(q, (snap) => {
      setAllUsers(snap.docs.map(d => d.data() as UserProfile));
    });
  }, [isAdminLoggedIn]);

  useEffect(() => {
    if (!isAdminLoggedIn) return;
    const q = query(collection(db, 'challengeRecords'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snap) => {
      setChallengeRecords(snap.docs.map(d => ({ id: d.id, ...d.data() }) as ChallengeRecord));
    });
  }, [isAdminLoggedIn]);

  // Fetch Tasks for everyone
  useEffect(() => {
    const q = query(collection(db, 'tasks'), orderBy('dueDate', 'asc'));
    return onSnapshot(q, (snap) => {
      const fetchedTasks = snap.docs.map(d => {
        const data = { id: d.id, ...d.data() } as Task;
        const normalize = (s: string) => s.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const initialMatch = INITIAL_TASKS.find(it => 
          it.id === d.id || normalize(it.title) === normalize(data.title)
        );
        // Merge complex worksheet objects from local definition if they exist
        if (initialMatch && initialMatch.type === 'worksheet') {
          return {
            ...initialMatch,
            ...data,
            type: initialMatch.type,
            worksheetQuestions: initialMatch.worksheetQuestions,
            pdfUrl: initialMatch.pdfUrl
          };
        }
        return data;
      });
      setTasks(fetchedTasks);
    });
  }, []);

  // Fetch Submissions for student
  useEffect(() => {
    if (!currentUser || isAdminLoggedIn) return;
    const q = query(collection(db, 'submissions'), where('userId', '==', currentUser.uid));
    return onSnapshot(q, (snap) => {
      setMySubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() }) as TaskSubmission));
    });
  }, [currentUser, isAdminLoggedIn]);

  // Fetch all Submissions for Admin
  useEffect(() => {
    if (!isAdminLoggedIn) return;
    const q = query(collection(db, 'submissions'), orderBy('completedAt', 'desc'));
    return onSnapshot(q, (snap) => {
      setAllSubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() }) as TaskSubmission));
    });
  }, [isAdminLoggedIn]);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error("Login failed", e);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setMode('dashboard');
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  const refreshConcept = () => setRandomConcept(facts[Math.floor(Math.random() * facts.length)]);

  const startQuiz = (unit: Unit) => {
    setSelectedUnitId(unit.id);
    setMode('quiz');
  };

  const startRevision = (unit: Unit) => {
    setSelectedUnitId(unit.id);
    setMode('revision');
  };

  const startVocab = (unit: Unit) => {
    setSelectedUnitId(unit.id);
    setMode('vocab');
  };

  const handleAdminLogin = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (adminUsername === 'admin' && adminPassword === 'science123') {
      setIsAdminLoggedIn(true);
      setAdminError("");
    } else {
      setAdminError("Invalid credentials");
    }
  };

  const generatePDF = (records: ChallengeRecord[]) => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['Student', 'Score', 'Total', 'Date']],
      body: records.map(r => [r.studentName, r.score, r.totalQuestions, new Date(r.timestamp).toLocaleString()])
    });
    doc.save('challenge_records.pdf');
  };

  const deleteChallengeRecord = async (id: string) => {
    try { await deleteDoc(doc(db, 'challengeRecords', id)); } 
    catch (e) { console.error(e); }
  };

  const updateChallengeRecord = async (record: ChallengeRecord) => {
    try { await setDoc(doc(db, 'challengeRecords', record.id), record); }
    catch (e) { console.error(e); }
  };

  const handleChallengeAnswer = (answer: string) => {
    const q = challengeQuestions[challengeCurrentIndex];
    const isCorrect = answer === q.correctAnswer;
    const resp = { questionId: q.id, questionText: q.text, userAnswer: answer, correctAnswer: q.correctAnswer, isCorrect };
    setChallengeResponses(prev => [...prev, resp]);
    if (challengeCurrentIndex < challengeQuestions.length - 1) setChallengeCurrentIndex(prev => prev + 1);
    else { setIsChallengeQuizActive(false); setShowChallengeResult(true); }
  };

  const startEasterAssignment = () => {
    setChallengeSelectedUnits([1, 2, 3, 4, 5, 6]);
    setChallengeQuestionCount(30);
    setIsEventMode(true);
    generateChallengeQuiz();
  };

  const generateChallengeQuiz = () => {
    let allQs: Question[] = [];
    challengeSelectedUnits.forEach(id => {
      const u = units.find(unit => unit.id === id);
      if (u) allQs = [...allQs, ...u.questions];
    });
    const shuffled = allQs.sort(() => 0.5 - Math.random()).slice(0, challengeQuestionCount);
    setChallengeQuestions(shuffled);
    setChallengeCurrentIndex(0);
    setChallengeResponses([]);
    setIsChallengeQuizActive(true);
    setIsChallengeModeOpen(false);
  };

  const finalizeChallenge = () => {
    const score = challengeResponses.filter(r => r.isCorrect).length;
    const finalName = challengeStudentName || currentUser?.displayName || 'Anonymous Student';
    const record: ChallengeRecord = {
      id: Date.now().toString(), 
      studentName: finalName,
      score, totalQuestions: challengeQuestions.length,
      selectedUnits: challengeSelectedUnits, responses: challengeResponses,
      timestamp: new Date().toISOString()
    };
    setDoc(doc(db, 'challengeRecords', record.id), record);

    // If it was a task completion from TaskView (Easter assignment)
    if (isEventMode) {
       // Optional: handle event submissions specifically if needed
    }

    setShowChallengeResult(false);
    setChallengeStudentName("");
    setIsEventMode(false);
  };

  const onCreateTask = async (taskData: Partial<Task>) => {
    try {
      const id = Date.now().toString();
      const task: Task = {
        id,
        title: taskData.title || "Untitled Task",
        description: taskData.description || "",
        units: taskData.units || [1],
        dueDate: taskData.dueDate || new Date().toISOString(),
        status: 'active',
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'tasks', id), task);
      console.log("Task created successfully:", id);
    } catch (e) {
      console.error("Error creating task:", e);
      alert("Failed to create task. Check console for details.");
    }
  };

  const onDeleteTask = async (id: string) => {
    try { 
      await deleteDoc(doc(db, 'tasks', id)); 
      setTasks(prev => prev.filter(t => t.id !== id)); // Immediate local UI update
    }
    catch (e) { console.error(e); }
  };

  const onStartTask = (task: Task) => {
    setActiveTask(task);
    if (task.type === 'worksheet' || task.worksheetQuestions || task.pdfUrl) {
      setMode('worksheet');
    } else {
      setSelectedUnitId(task.units[0]);
      setMode('quiz');
    }
  };

  const handleQuizCompleteForTask = async (score: number, total: number, unitId: number) => {
     if (!activeTask || !currentUser) return;
     
     const submission: TaskSubmission = {
       id: `${activeTask.id}_${currentUser.uid}`,
       taskId: activeTask.id,
       userId: currentUser.uid,
       studentName: currentUser.displayName || 'Student',
       completedAt: new Date().toISOString(),
       results: { score, total, unitId },
       responses: {}
     };
     
     await setDoc(doc(db, 'submissions', submission.id), submission);
     setActiveTask(null);
     setMode('tasks');
  };

  return (
    <div className="font-sans selection:bg-emerald-200 min-h-screen bg-gray-50 flex">
      {['dashboard', 'user-stats', 'about', 'quick-facts', 'tasks'].includes(mode) && (
        <Sidebar currentMode={mode} setMode={setMode} onQRClick={() => setIsQRModalOpen(true)} />
      )}

      <div className={`flex-1 transition-all duration-300 ${['dashboard', 'user-stats', 'about', 'quick-facts', 'tasks'].includes(mode) ? 'md:pl-[80px]' : ''}`}>
        <AnimatePresence mode="wait">
          {mode === 'dashboard' && (
            <DashboardView 
              key="dashboard"
              isY8Open={isY8Open} setIsY8Open={setIsY8Open}
              setIsQRModalOpen={setIsQRModalOpen}
              showEasterNotice={showEasterNotice} setShowEasterNotice={setShowEasterNotice}
              easterNoticeAgreed={easterNoticeAgreed} setEasterNoticeAgreed={setEasterNoticeAgreed}
              proceedToEasterAssignment={startEasterAssignment}
              isChallengeModeOpen={isChallengeModeOpen} setIsChallengeModeOpen={setIsChallengeModeOpen}
              startEasterAssignment={startEasterAssignment} units={units}
              challengeSelectedUnits={challengeSelectedUnits} setChallengeSelectedUnits={setChallengeSelectedUnits}
              challengeQuestionCount={challengeQuestionCount} setChallengeQuestionCount={setChallengeQuestionCount}
              generateChallengeQuiz={generateChallengeQuiz} isChallengeQuizActive={isChallengeQuizActive}
              setIsChallengeQuizActive={setIsChallengeQuizActive} isEventMode={isEventMode} setIsEventMode={setIsEventMode}
              showExitConfirm={showExitConfirm} setShowExitConfirm={setShowExitConfirm}
              challengeCurrentIndex={challengeCurrentIndex} challengeQuestions={challengeQuestions}
              handleChallengeAnswer={handleChallengeAnswer} shortResponseInput={shortResponseInput}
              setShortResponseInput={setShortResponseInput} isQRModalOpen={isQRModalOpen}
              isAdminOpen={isAdminOpen} setIsAdminOpen={setIsAdminOpen}
              isAdminLoggedIn={isAdminLoggedIn} setIsAdminLoggedIn={setIsAdminLoggedIn}
              handleAdminLogin={handleAdminLogin} adminUsername={adminUsername}
              setAdminUsername={setAdminUsername} adminPassword={adminPassword}
              setAdminPassword={setAdminPassword} adminError={adminError}
              challengeRecords={challengeRecords} generatePDF={generatePDF}
              deleteChallengeRecord={deleteChallengeRecord} editingRecord={editingRecord}
              setEditingRecord={setEditingRecord} updateChallengeRecord={updateChallengeRecord}
              currentEventMessageIndex={currentEventMessageIndex} eventMessages={eventMessages}
              randomConcept={randomConcept} refreshConcept={refreshConcept}
              setMode={setMode} setSelectedUnitId={setSelectedUnitId}
              startQuiz={startQuiz} startRevision={startRevision} startVocab={startVocab}
              currentUser={currentUser} loginWithGoogle={loginWithGoogle} logout={logout}
              allUsers={allUsers} selectedStudent={selectedStudent} setSelectedStudent={setSelectedStudent}
              tasks={tasks} onCreateTask={onCreateTask} onDeleteTask={onDeleteTask} onStartTask={onStartTask}
              showCalculator={showCalculator} setShowCalculator={setShowCalculator}
            />
          )}

          {/* Virtual Calculator global overlay */}
          <AnimatePresence>
            {showCalculator && <Calculator key="global-calc" onClose={() => setShowCalculator(false)} />}
          </AnimatePresence>

          {mode === 'quiz' && (
            <QuizView 
              key="quiz"
              unit={selectedUnit}
              onBack={() => {
                setMode(activeTask ? 'tasks' : 'dashboard');
                setActiveTask(null);
              }}
              sessionStats={sessionStats}
              setSessionStats={setSessionStats}
              onComplete={(score, total) => {
                if (activeTask) {
                  handleQuizCompleteForTask(score, total, selectedUnitId || 0);
                } else {
                  setMode('dashboard');
                }
              }}
            />
          )}

          {mode === 'revision' && (
            <RevisionNotesView 
              key="revision"
              unit={selectedUnit}
              onBack={() => setMode('dashboard')}
              charType={chineseType}
              setCharType={setChineseType}
            />
          )}

          {mode === 'vocab' && (
            <VocabView 
              key="vocab"
              unit={selectedUnit}
              onBack={() => setMode('dashboard')}
              sessionStats={sessionStats}
              setSessionStats={setSessionStats}
            />
          )}

          {mode === 'tasks' && <TasksView 
            key="tasks"
            currentEventMessageIndex={currentEventMessageIndex} 
            eventMessages={eventMessages} 
            showEasterNotice={showEasterNotice}
            setShowEasterNotice={setShowEasterNotice} 
            easterNoticeAgreed={easterNoticeAgreed}
            setEasterNoticeAgreed={setEasterNoticeAgreed}
            proceedToEasterAssignment={startEasterAssignment}
            isAdmin={isAdminLoggedIn}
            tasks={tasks}
            mySubmissions={mySubmissions}
            allSubmissions={allSubmissions}
            currentUser={currentUser}
            units={units}
            onCreateTask={onCreateTask}
            onDeleteTask={onDeleteTask}
            onStartTask={onStartTask}
            onViewSubmission={(sub, task) => {
              setViewedSubmission(sub);
              setActiveTask(task);
              setMode('worksheet');
            }}
          />}
          {mode === 'worksheet' && activeTask && (
            <TaskWorksheetView 
              key="worksheet"
              task={activeTask}
              onBack={() => {
                setMode('tasks');
                setActiveTask(null);
                setViewedSubmission(null);
              }}
              initialResponses={viewedSubmission ? viewedSubmission.responses : mySubmissions.find(s => s.taskId === activeTask.id)?.responses}
              readOnly={!!viewedSubmission}
              showCalculator={showCalculator}
              setShowCalculator={setShowCalculator}
              onComplete={async (responses) => {
                if (!currentUser || viewedSubmission) return;
                const submission: TaskSubmission = {
                  id: `${activeTask.id}_${currentUser.uid}`,
                  taskId: activeTask.id,
                  userId: currentUser.uid,
                  studentName: currentUser.displayName || 'Student',
                  completedAt: new Date().toISOString(),
                  results: { score: 0, total: activeTask.worksheetQuestions?.length || 0, unitId: activeTask.units[0] },
                  responses: responses
                };
                await setDoc(doc(db, 'submissions', submission.id), submission);
              }}
            />
          )}
          {mode === 'user-stats' && <UserStatsView key="user-stats" units={units} sessionStats={sessionStats} />}
          {mode === 'about' && <AboutView key="about" />}
          {mode === 'quick-facts' && <QuickFacts key="quick-facts" />}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showChallengeResult && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[500] flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl text-center border-4 border-emerald-50"
            >
              <Trophy className="text-yellow-500 mx-auto mb-6" size={80} />
              <h3 className="text-3xl font-black text-gray-800 uppercase tracking-tighter mb-2">Challenge Over!</h3>
              <p className="text-gray-500 text-lg mb-8 font-medium">
                Score: <span className="text-emerald-500 font-black">{challengeResponses.filter(r => r.isCorrect).length} / {challengeQuestions.length}</span>
              </p>
              
              <div className="space-y-4">
                <input 
                  type="text" 
                  value={challengeStudentName}
                  onChange={(e) => setChallengeStudentName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full p-4 rounded-2xl border-2 border-gray-100 font-black text-center focus:border-emerald-500 outline-none transition-all uppercase tracking-widest text-sm"
                />
                <button
                  disabled={!challengeStudentName.trim()}
                  onClick={finalizeChallenge}
                  className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-black uppercase tracking-widest shadow-[0_6px_0_0_#059669] active:shadow-none active:translate-y-1 transition-all"
                >
                  Save Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Nav */}
      {['dashboard', 'user-stats', 'about', 'quick-facts', 'tasks'].includes(mode) && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 px-2 py-1 z-40 md:hidden h-20">
          <div className="max-w-md mx-auto flex justify-between items-stretch h-full">
            {APP_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = mode === item.mode;
              return (
              <button 
                key={item.mode}
                onClick={() => setMode(item.mode)}
                className={`flex-1 flex flex-col items-center justify-center transition-all ${isActive ? 'text-emerald-500' : 'text-gray-400'}`}
              >
                <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center transition-all ${isActive ? 'bg-emerald-50' : ''}`}>
                  <Icon size={24} fill={isActive ? "currentColor" : "none"} />
                </div>
                <span className={`text-[8px] font-bold uppercase tracking-widest leading-none mt-1 ${isActive ? 'text-emerald-700' : 'text-gray-400'}`}>
                  {item.label}
                </span>
              </button>
            )})}
          </div>
        </nav>
      )}
    </div>
  );
}
