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
  query, orderBy, getDocFromServer 
} from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { db, auth } from './firebase';

// Types
import { 
  AppMode, SessionStats, ChallengeResponse, ChallengeRecord, 
  OperationType, Unit, Question, NavItem 
} from './types';

// Constants
import { eventMessages, facts, navItems } from './constants';
import { units } from './data';

// Components
import SplashScreen from './components/views/SplashScreen';
import DashboardView from './components/views/DashboardView';
import QuizView from './components/views/QuizView';
import VocabView from './components/views/VocabView';
import RevisionNotesView from './components/views/RevisionNotesView';
import PlaygroundView from './components/views/PlaygroundView';
import UserStatsView from './components/views/UserStatsView';
import AboutView from './components/views/AboutView';
import QuickFacts from './QuickFacts';
import TasksView from './components/views/TasksView';

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
  { mode: 'playground', icon: FlaskRound, label: 'Play' },
  { mode: 'user-stats', icon: User, label: 'Stats' },
  { mode: 'quick-facts', icon: Lightbulb, label: 'Facts' },
  { mode: 'about', icon: Info, label: 'About' }
];

const Sidebar = ({ currentMode, setMode }: { currentMode: AppMode, setMode: (m: AppMode) => void }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={false}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={{ width: isHovered ? 240 : 80 }}
      className="fixed left-0 top-0 bottom-0 bg-white border-r-2 border-gray-100 z-50 hidden md:flex flex-col py-8 transition-all duration-300 ease-in-out shadow-xl"
    >
      <div className="px-5 mb-10 flex items-center gap-4 overflow-hidden h-10">
        <div className="bg-emerald-500 p-2 rounded-xl text-white flex-shrink-0">
          <GraduationCap size={24} />
        </div>
        <AnimatePresence>
          {isHovered && (
            <motion.h2
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="font-black text-gray-800 uppercase tracking-tight whitespace-nowrap"
            >
              Y8 Science
            </motion.h2>
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
        <div className={`p-4 rounded-2xl bg-gray-50 border-2 border-gray-100 flex items-center gap-3 overflow-hidden ${!isHovered && 'justify-center p-3'}`}>
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0 font-black">
            L
          </div>
          {isHovered && (
            <div className="overflow-hidden">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Instructor</p>
              <p className="font-black text-gray-800 uppercase tracking-tight truncate">Mr. LAM</p>
            </div>
          )}
        </div>
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

function AppContent() {
  const [mode, setMode] = useState<AppMode>('splash');
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [sessionStats, setSessionStats] = useState<SessionStats>({});
  
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
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [challengeRecords, setChallengeRecords] = useState<ChallengeRecord[]>([]);
  const [editingRecord, setEditingRecord] = useState<ChallengeRecord | null>(null);
  const [isEventMode, setIsEventMode] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [currentEventMessageIndex, setCurrentEventMessageIndex] = useState(0);
  const [randomConcept, setRandomConcept] = useState(facts[0]);
  const [chineseType, setChineseType] = useState<'traditional' | 'simplified'>('traditional');

  const selectedUnit = useMemo(() => units.find(u => u.id === selectedUnitId), [selectedUnitId]);

  useEffect(() => {
    const timer = setTimeout(() => setMode('dashboard'), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsAuthReady(true);
      if (user?.email === 'tomanlam@gmail.com') setIsAdminLoggedIn(true);
      else setIsAdminLoggedIn(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!isAdminLoggedIn) return;
    const q = query(collection(db, 'challengeRecords'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snap) => {
      setChallengeRecords(snap.docs.map(d => ({ id: d.id, ...d.data() }) as ChallengeRecord));
    });
  }, [isAdminLoggedIn]);

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
    const record: ChallengeRecord = {
      id: Date.now().toString(), studentName: challengeStudentName,
      score, totalQuestions: challengeQuestions.length,
      selectedUnits: challengeSelectedUnits, responses: challengeResponses,
      timestamp: new Date().toISOString()
    };
    setDoc(doc(db, 'challengeRecords', record.id), record);
    setShowChallengeResult(false);
    setChallengeStudentName("");
  };

  return (
    <div className="font-sans selection:bg-emerald-200 min-h-screen bg-gray-50 flex">
      {['dashboard', 'playground', 'user-stats', 'about', 'quick-facts', 'tasks'].includes(mode) && (
        <Sidebar currentMode={mode} setMode={setMode} />
      )}

      <div className={`flex-1 transition-all duration-300 ${['dashboard', 'playground', 'user-stats', 'about', 'quick-facts', 'tasks'].includes(mode) ? 'md:pl-[80px]' : ''}`}>
        <AnimatePresence mode="wait">
          {mode === 'splash' && <SplashScreen key="splash" />}
          
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
            />
          )}

          {mode === 'quiz' && (
            <QuizView 
              key="quiz"
              unit={selectedUnit}
              onBack={() => setMode('dashboard')}
              sessionStats={sessionStats}
              setSessionStats={setSessionStats}
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

          {mode === 'playground' && <PlaygroundView key="playground" />}
          {mode === 'tasks' && <TasksView 
            currentEventMessageIndex={currentEventMessageIndex} 
            eventMessages={eventMessages} 
            showEasterNotice={showEasterNotice}
            setShowEasterNotice={setShowEasterNotice} 
            easterNoticeAgreed={easterNoticeAgreed}
            setEasterNoticeAgreed={setEasterNoticeAgreed}
            proceedToEasterAssignment={startEasterAssignment}
          />}
          {mode === 'user-stats' && <UserStatsView units={units} sessionStats={sessionStats} />}
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
      {['dashboard', 'playground', 'user-stats', 'about', 'quick-facts', 'tasks'].includes(mode) && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t-2 border-gray-100 p-4 z-40 md:hidden">
          <div className="max-w-2xl mx-auto flex justify-around items-center">
            {APP_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
              <button 
                key={item.mode}
                onClick={() => setMode(item.mode)}
                className={`flex flex-col items-center gap-1 transition-colors ${mode === item.mode ? 'text-emerald-500' : 'text-gray-400'}`}
              >
                <div className={`p-2 rounded-xl transition-all ${mode === item.mode ? 'bg-emerald-50' : ''}`}>
                  <Icon size={24} fill={mode === item.mode ? "currentColor" : "none"} />
                  <span className="text-[10px] font-black uppercase tracking-widest block text-center mt-1">{item.label}</span>
                </div>
              </button>
            )})}
          </div>
        </nav>
      )}
    </div>
  );
}
