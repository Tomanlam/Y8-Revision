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
import { GOLDEN_STANDARD_WORKSHEET, GOLDEN_STANDARD_TEST } from './constants/goldenStandard';

// Components
import DashboardView from './components/views/DashboardView';
import QuizView from './components/views/QuizView';
import VocabView from './components/views/VocabView';
import RevisionNotesView from './components/views/RevisionNotesView';
import UserStatsView from './components/views/UserStatsView';
import AboutView from './components/views/AboutView';
import QuickFacts from './QuickFacts';
import TasksView from './components/views/TasksView';
import CommandCenterView from './components/views/CommandCenterView';
import AchievementView from './components/views/AchievementView';
import TaskWorksheetView from './components/views/TaskWorksheetView';
import TaskTestView from './components/views/TaskTestView';
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

const getAppNavItems = (isAdmin: boolean): NavItem[] => {
  const items: NavItem[] = [
    { mode: 'dashboard', icon: LayoutGrid, label: 'Hub' },
    { mode: 'tasks', icon: Target, label: 'Tasks' },
  ];
  if (isAdmin) {
    items.push({ mode: 'command-center' as AppMode, icon: ShieldCheck, label: 'Command Center' });
  }
  items.push(
    { mode: 'quick-facts', icon: Lightbulb, label: 'Facts' },
    { mode: 'about', icon: Info, label: 'About' }
  );
  return items;
};

const Sidebar = ({ currentMode, setMode, onQRClick, hasOutstandingTasks, user, isAdmin }: { currentMode: AppMode, setMode: (m: AppMode) => void, onQRClick: () => void, hasOutstandingTasks?: boolean, user: UserProfile | null, isAdmin: boolean }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={false}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={{ width: isHovered ? 280 : 88 }}
      className="fixed left-0 top-0 bottom-0 bg-white/5 backdrop-blur-md border-r border-white/10 z-[150] hidden md:flex flex-col py-8 transition-all duration-500 ease-in-out shadow-[0_0_50px_-12px_rgba(0,0,0,0.08)]"
    >
      <div className="px-4 mb-4 flex flex-col gap-3">
        <button 
          onClick={() => setMode('achievement')}
          className={`w-full flex items-center rounded-[1.5rem] transition-all relative group overflow-hidden h-14 border border-transparent
            ${currentMode === 'achievement' 
              ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20' 
              : `text-slate-400 hover:bg-slate-100 hover:text-slate-900 border-slate-50`
            }
          `}
        >
          <div className="w-[56px] h-full flex justify-center items-center flex-shrink-0">
            {user?.photoURL ? (
              <img 
                src={user.photoURL} 
                alt="Profile" 
                className={`w-10 h-10 rounded-xl border-2 shadow-sm transition-all duration-500 ${currentMode === 'achievement' ? 'border-white/40 scale-110' : 'border-slate-200'}`}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-sm transition-all duration-500 ${currentMode === 'achievement' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {user?.displayName?.charAt(0) || 'U'}
              </div>
            )}
          </div>
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-col items-start whitespace-nowrap overflow-hidden pr-4"
              >
                <span className={`text-xs font-black tracking-tight leading-none transition-colors ${currentMode === 'achievement' ? 'text-white' : 'text-slate-900'}`}>
                  {user?.displayName || 'Student'}
                </span>
                <span className={`text-[8px] font-black uppercase tracking-[0.2em] mt-1.5 opacity-70 ${currentMode === 'achievement' ? 'text-emerald-50' : 'text-slate-400'}`}>
                  {isAdmin ? 'System Administrator' : 'GUEST ACCOUNT'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        <div className="h-px bg-slate-100 mx-3 opacity-50" />
      </div>

      <div className="flex-1 px-4 space-y-3">
        {getAppNavItems(isAdmin).map((item) => {
          const Icon = item.icon;
          const isActive = currentMode === item.mode;
          const isTasks = item.mode === 'tasks';
          
          return (
            <button
              key={item.mode}
              onClick={() => setMode(item.mode)}
              className={`w-full flex items-center rounded-2xl transition-all duration-300 relative group h-14 overflow-hidden
                ${isActive 
                  ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/10' 
                  : 'text-slate-400 hover:bg-slate-100 hover:text-slate-900'
                }
              `}
            >
              <div className="w-[56px] h-full flex justify-center items-center flex-shrink-0 relative">
                <Icon size={22} className={`transition-all duration-500 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} fill={isActive ? "currentColor" : "none"} />
                {isTasks && hasOutstandingTasks && (
                  <span className="absolute top-[14px] right-[14px] w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white ring-2 ring-orange-500/20" />
                )}
              </div>
              <AnimatePresence>
                {isHovered && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="font-black uppercase tracking-[0.2em] text-[10px] whitespace-nowrap pl-1"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>


      <div className="px-4 mt-auto space-y-2">
        <button
          onClick={() => (window as any).toggleY8?.()}
          className="w-full flex items-center h-12 rounded-2xl bg-slate-900/5 hover:bg-slate-900/10 text-slate-600 transition-all group overflow-hidden border border-slate-200/50"
          title="Class of 2025-26"
        >
          <div className="w-[56px] h-full flex justify-center items-center flex-shrink-0">
            <GraduationCap size={18} className="group-hover:scale-110 transition-transform" />
          </div>
          <AnimatePresence>
            {isHovered && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap"
              >
                Class 25-26
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <button
          onClick={onQRClick}
          className="w-full flex items-center h-12 rounded-2xl bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 transition-all group overflow-hidden border border-emerald-500/20"
          title="App QR Code"
        >
          <div className="w-[56px] h-full flex justify-center items-center flex-shrink-0">
            <QrCode size={18} className="group-hover:scale-110 transition-transform" />
          </div>
          <AnimatePresence>
            {isHovered && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap"
              >
                QR code
              </motion.span>
            )}
          </AnimatePresence>
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

const PARENT_STUDENT_MAP: Record<string, {name: string, emails: string[]}> = {
  "p.fe@hanacademy.edu.hk": { name: "Y8 FU EDITH", emails: ["fe@hanacademy.edu.hk"] },
  "p.wxzx@hanacademy.edu.hk": { name: "Y8 WU XIZIXUAN", emails: ["wxzx@hanacademy.edu.hk"] },
  "p.ydyh@hanacademy.edu.hk": { name: "Y8 YOE HANSON & YOE DICKSON", emails: ["yh@hanacademy.edu.hk", "yd@hanacademy.edu.hk"] },
  "p.cy@hanacademy.edu.hk": { name: "Y8 CHANG YE", emails: ["cy@hanacademy.edu.hk"] },
  "p.zky@hanacademy.edu.hk": { name: "Y8 ZHU KEYU", emails: ["zky@hanacademy.edu.hk"] },
  "p.dhy1@hanacademy.edu.hk": { name: "Y8 DU HAOYANG", emails: ["dhy1@hanacademy.edu.hk"] },
  "p.ycw@hanacademy.edu.hk": { name: "Y8 YEUNG CHIN WA", emails: ["ycw@hanacademy.edu.hk"] },
  "p.lkl@hanacademy.edu.hk": { name: "Y8 LIM KA LOK", emails: ["lkl@hanacademy.edu.hk"] },
  "p.basr@hanacademy.edu.hk": { name: "Y8 BI ALEX SHANRUI", emails: ["basr@hanacademy.edu.hk"] },
  "p.hkys@hanacademy.edu.hk": { name: "Y8 HUNG KA YUI SILVIO", emails: ["hkys@hanacademy.edu.hk"] },
  "p.wzx@hanacademy.edu.hk": { name: "Y8 WANG ZEXUAN", emails: ["wzx@hanacademy.edu.hk"] },
  "p.yks@hanacademy.edu.hk": { name: "Y8 YAN KA SUEN", emails: ["yks@hanacademy.edu.hk"] },
  "p.xln@hanacademy.edu.hk": { name: "Y8 XIAO LONGNYU", emails: ["xln@hanacademy.edu.hk"] },
  "p.by@hanacademy.edu.hk": { name: "Y8 YAU BILLY", emails: ["by@hanacademy.edu.hk"] },
  "p.ckhs@hanacademy.edu.hk": { name: "Y8 CHENG KOK HANG SAMUEL", emails: ["ckhs@hanacademy.edu.hk"] },
  "p.zly@hanacademy.edu.hk": { name: "Y8 ZHENG LUYANG LAWRENCE", emails: ["zly@hanacademy.edu.hk"] },
  "p.lyy@hanacademy.edu.hk": { name: "Y8 LU YUANYAO", emails: ["lyy@hanacademy.edu.hk"] },
  "p.cc@hanacademy.edu.hk": { name: "Y8 CHAN CHANDLER", emails: ["cc@hanacademy.edu.hk"] },
  "p.wwp@hanacademy.edu.hk": { name: "Y8 WONG YAU YAT & WONG WO PING", emails: ["wyy@hanacademy.edu.hk", "wwp@hanacademy.edu.hk"] },
  "p.whh@hanacademy.edu.hk": { name: "Y8 WONG HIN HO", emails: ["whh@hanacademy.edu.hk"] }
};

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
  const [tasks, setTasks] = useState<Task[]>([]);
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

  // Expose Y8 toggle to global scope for Sidebar access
  useEffect(() => {
    (window as any).toggleY8 = () => setIsY8Open(true);
    return () => { delete (window as any).toggleY8; };
  }, []);

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

  const [activeEmojis, setActiveEmojis] = React.useState<{ id: number; emoji: string; x: number; y: number; size: number }[]>([]);

  const selectedUnit = useMemo(() => units.find(u => u.id === selectedUnitId), [selectedUnitId]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsAuthReady(true);
      
      if (user) {
        const userEmail = user.email ? user.email.trim().toLowerCase() : '';
        const isParent = !!PARENT_STUDENT_MAP[userEmail];
        const childInfo = isParent ? PARENT_STUDENT_MAP[userEmail] : undefined;
        const isAdmin = userEmail === ADMIN_EMAIL.toLowerCase();

        setIsAdminLoggedIn(isAdmin);

        try {
          // Sync/Fetch user profile
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const data = userSnap.data() as UserProfile;
            const updatedProfile = {
              ...data,
              lastSeen: new Date().toISOString(),
              photoURL: user.photoURL || data.photoURL || null,
              isAdmin: isAdmin,
              isParent: isParent,
              childName: childInfo?.name,
              childEmails: childInfo?.emails,
              isGuest: false
            };
            setUserProfile(updatedProfile);
            setSessionStats(data.progress || {});
            
            await updateDoc(userRef, updatedProfile);
          } else {
            // Initialize profile
            const newProfile: UserProfile = {
              userId: user.uid,
              email: user.email || '',
              displayName: user.displayName || (isParent ? 'Parent' : 'Student'),
              photoURL: user.photoURL || null,
              progress: {},
              lastSeen: new Date().toISOString(),
              isAdmin: isAdmin,
              isParent: isParent,
              childName: childInfo?.name,
              childEmails: childInfo?.emails,
              isGuest: false
            };
            await setDoc(userRef, newProfile);
            setUserProfile(newProfile);
            setSessionStats({});
          }
        } catch (error) {
          console.error("Error setting up user profile: ", error);
          // Fallback user profile so UI still works
          setUserProfile({
            userId: user.uid,
            email: userEmail,
            displayName: user.displayName || 'Unknown',
            photoURL: user.photoURL || null,
            progress: {},
            lastSeen: new Date().toISOString(),
            isAdmin: isAdmin,
            isParent: isParent,
            childName: childInfo?.name,
            childEmails: childInfo?.emails,
            isGuest: false
          });
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

  // Fetch all users for Admin and Parents
  useEffect(() => {
    if (!isAdminLoggedIn && !userProfile?.isParent) return;
    const q = query(collection(db, 'users'), orderBy('lastSeen', 'desc'));
    return onSnapshot(q, (snap) => {
      setAllUsers(snap.docs.map(d => d.data() as UserProfile));
    });
  }, [isAdminLoggedIn, userProfile]);

  useEffect(() => {
    if (!isAdminLoggedIn) return;
    const q = query(collection(db, 'challengeRecords'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snap) => {
      setChallengeRecords(snap.docs.map(d => ({ id: d.id, ...d.data() }) as ChallengeRecord));
    });
  }, [isAdminLoggedIn]);

  // Fetch Tasks for everyone
  useEffect(() => {
    if (!currentUser) {
      setTasks([]);
      return;
    }
    const q = query(collection(db, 'tasks'), orderBy('dueDate', 'asc'));
    return onSnapshot(q, (snap) => {
      const firestoreTasks = snap.docs.map(d => {
        const data = { id: d.id, ...d.data() } as Task;
        
        // Fix Firebase nested array limitation: restore array-of-arrays from array-of-objects
        if (data.worksheetQuestions) {
          data.worksheetQuestions.forEach(q => {
            if (q.tableData && Array.isArray(q.tableData) && (q.tableData[0] as any)?.row) {
              q.tableData = q.tableData.map((r: any) => r.row);
            }
          });
        }
        
        return data;
      });

      setTasks(firestoreTasks.filter((ft: any) => !ft.deleted));
    });
  }, [currentUser]);

  // Fetch Submissions for student
  useEffect(() => {
    if (!currentUser || isAdminLoggedIn || userProfile?.isParent) return;
    const q = query(collection(db, 'submissions'), where('userId', '==', currentUser.uid));
    return onSnapshot(q, (snap) => {
      const subs = snap.docs.map(d => ({ id: d.id, ...d.data() } as TaskSubmission));
      const fixedSubs = subs.map(sub => {
        const task = tasks.find(t => t.id === sub.taskId || (t as any).originalId === sub.taskId);
        if (task && task.id !== sub.taskId) {
           return { ...sub, taskId: task.id };
        }
        return sub;
      });
      setMySubmissions(fixedSubs);
    });
  }, [currentUser, isAdminLoggedIn, tasks, userProfile]);

  useEffect(() => {
    if (userProfile?.isParent && allUsers.length > 0 && allSubmissions.length > 0) {
      const childEmails = userProfile.childEmails || [];
      const childNames = userProfile.childName?.split(' & ') || [];
      
      const childUserIds = allUsers.filter(u => childEmails.includes(u.email)).map(u => u.userId);
      
      setMySubmissions(allSubmissions.filter(s => {
        if (childUserIds.includes(s.userId)) return true;
        // Fallback to name matching if id isn't bound properly
        const submissionName = (s.studentName || '').toLowerCase();
        return childNames.some(name => submissionName.includes(name.toLowerCase().replace('y8 ', '')));
      }));
    }
  }, [userProfile, allSubmissions, allUsers]);

  // Fetch all Submissions (Enabled for all to support class rank)
  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'submissions'), orderBy('completedAt', 'desc'));
    return onSnapshot(q, (snap) => {
        const subs = snap.docs.map(d => ({ id: d.id, ...d.data() } as TaskSubmission));
        // Fix up task IDs that might be using original/legacy IDs
        const fixedSubs = subs.map(sub => {
          const task = tasks.find(t => t.id === sub.taskId || (t as any).originalId === sub.taskId);
          if (task && task.id !== sub.taskId) {
            return { ...sub, taskId: task.id };
          }
          return sub;
        });
        setAllSubmissions(fixedSubs);
    }, (error) => {
      console.error("Submissions fetch failed:", error);
    });
  }, [currentUser, tasks]);

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
      const id = taskData.id || Date.now().toString();
      
      // Clone worksheetQuestions to avoid mutating the source (like constants)
      let finalQuestions = taskData.worksheetQuestions ? JSON.parse(JSON.stringify(taskData.worksheetQuestions)) : undefined;

      // Fix Firebase nested array limitation: convert tableData arrays-of-arrays to array-of-objects
      if (Array.isArray(finalQuestions)) {
        finalQuestions.forEach((q: any) => {
          if (q.tableData && Array.isArray(q.tableData) && Array.isArray(q.tableData[0])) {
            q.tableData = q.tableData.map((row: any) => ({ row }));
          }
        });
      }

      const task: Task = {
        id,
        title: taskData.title || "Untitled Task",
        description: taskData.description || "",
        units: taskData.units || [1],
        dueDate: taskData.dueDate || new Date().toISOString(),
        status: 'active',
        createdAt: new Date().toISOString(),
        ...(taskData.type && { type: taskData.type }),
        ...(taskData.pdfUrl && { pdfUrl: taskData.pdfUrl }),
        ...(taskData.markschemeContent && { markschemeContent: taskData.markschemeContent }),
        worksheetQuestions: finalQuestions,
        ...(taskData.passcode && { passcode: taskData.passcode }),
        ...(taskData.timeLimit && { timeLimit: taskData.timeLimit })
      };
      await setDoc(doc(db, 'tasks', id), task);
      console.log("Task created successfully:", id);
    } catch (e) {
      console.error("Error creating task:", e);
      // alert("Failed to create task. Check console for details.");
    }
  };


  const onUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const finalUpdates = { ...updates };

      // Fix Firebase nested array limitation if worksheetQuestions are being updated
      if (finalUpdates.worksheetQuestions && Array.isArray(finalUpdates.worksheetQuestions)) {
        // Deep clone to avoid mutating the source
        finalUpdates.worksheetQuestions = JSON.parse(JSON.stringify(finalUpdates.worksheetQuestions));
        finalUpdates.worksheetQuestions.forEach((q: any) => {
          if (q.tableData && Array.isArray(q.tableData) && Array.isArray(q.tableData[0])) {
            q.tableData = q.tableData.map((row: any) => ({ row }));
          }
        });
      }

      await setDoc(doc(db, 'tasks', taskId), finalUpdates, { merge: true });
    } catch (e) {
      console.error("Error updating task:", e);
      alert("Failed to update task. Check console for details.");
    }
  };

  const onDeleteTask = async (id: string) => {
    console.log("App.tsx: onDeleteTask called for id:", id, "isAdmin:", isAdminLoggedIn);
    if (!isAdminLoggedIn) {
      console.warn("App.tsx: onDeleteTask rejected - not admin");
      return;
    }
    try { 
      await deleteDoc(doc(db, 'tasks', id)); 
      setTasks(prev => prev.filter(t => t.id !== id)); // Immediate local UI update
      console.log("App.tsx: onDeleteTask success");
    }
    catch (e) { console.error("App.tsx: onDeleteTask error:", e); }
  };

  const handleDeleteSubmission = async (submissionId: string) => {
    console.log("App.tsx: handleDeleteSubmission called for id:", submissionId, "isAdmin:", isAdminLoggedIn);
    if (!isAdminLoggedIn) {
      console.warn("App.tsx: handleDeleteSubmission rejected - not admin");
      return;
    }
    try {
      await deleteDoc(doc(db, 'submissions', submissionId));
      // Immediate local UI update
      setAllSubmissions(prev => prev.filter(s => s.id !== submissionId));
      if (mySubmissions) {
        setMySubmissions(prev => prev.filter(s => s.id !== submissionId));
      }
      console.log("App.tsx: handleDeleteSubmission success");
    } catch (e) {
      console.error("App.tsx: handleDeleteSubmission error:", e);
    }
  };

  const handleWipeCleanSlate = async () => {
    console.log("App.tsx: handleWipeCleanSlate called", "isAdmin:", isAdminLoggedIn);
    if (!isAdminLoggedIn) {
      console.warn("App.tsx: handleWipeCleanSlate rejected - not admin");
      return;
    }
    try {
      for (const t of tasks) {
        console.log("App.tsx: deleting task", t.id);
        await deleteDoc(doc(db, 'tasks', t.id));
      }
      for (const s of allSubmissions) {
        console.log("App.tsx: deleting submission", s.id);
        await deleteDoc(doc(db, 'submissions', s.id));
      }
      setTasks([]);
      console.log("App.tsx: handleWipeCleanSlate success");
    } catch (e) {
      console.error("App.tsx: handleWipeCleanSlate error:", e);
    }
  };

  const onStartTask = (task: Task) => {
    setActiveTask(task);
    if (task.type === 'test') {
      setMode('test');
    } else if (task.type === 'worksheet' || task.worksheetQuestions || task.pdfUrl) {
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

  const outstandingTasks = useMemo(() => {
    if (!currentUser) return [];
    return tasks.filter(task => {
      const isSubmitted = mySubmissions.some(s => s.taskId === task.id);
      return !isSubmitted;
    });
  }, [tasks, mySubmissions, currentUser, isAdminLoggedIn]);

  return (
    <div className="font-sans selection:bg-emerald-200 min-h-screen bg-gray-50 flex">
      {['dashboard', 'user-stats', 'about', 'quick-facts', 'tasks', 'achievement', 'command-center'].includes(mode) && (
        <Sidebar 
          currentMode={mode} 
          setMode={setMode} 
          onQRClick={() => setIsQRModalOpen(true)} 
          hasOutstandingTasks={outstandingTasks.length > 0}
          user={userProfile}
          isAdmin={isAdminLoggedIn}
        />
      )}

      <div className={`flex-1 transition-all duration-300 ${['dashboard', 'user-stats', 'about', 'quick-facts', 'tasks', 'achievement', 'command-center'].includes(mode) ? 'md:pl-[80px]' : ''}`}>
        <AnimatePresence mode="wait">
          {mode === 'dashboard' && (
            <DashboardView 
              key="dashboard"
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
              setShortResponseInput={setShortResponseInput}
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
              startQuiz={startQuiz} startRevision={startRevision} startVocab={startVocab}
              currentUser={currentUser} userProfile={userProfile} loginWithGoogle={loginWithGoogle} logout={logout}
              allUsers={allUsers} selectedStudent={selectedStudent} setSelectedStudent={setSelectedStudent}
              tasks={tasks} onCreateTask={onCreateTask} onDeleteTask={onDeleteTask} onStartTask={onStartTask}
              setMode={setMode}
              showCalculator={showCalculator} setShowCalculator={setShowCalculator}
              mySubmissions={mySubmissions}
              allSubmissions={allSubmissions}
            />
          )}

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
              isAdmin={isAdminLoggedIn}
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
            mode={mode}
            showEasterNotice={showEasterNotice}
            setShowEasterNotice={setShowEasterNotice} 
            easterNoticeAgreed={easterNoticeAgreed}
            setEasterNoticeAgreed={setEasterNoticeAgreed}
            proceedToEasterAssignment={startEasterAssignment}
            tasks={tasks}
            mySubmissions={mySubmissions}
            currentUser={currentUser}
            userProfile={userProfile}
            units={units}
            onStartTask={onStartTask}
          />}

          {mode === 'command-center' && isAdminLoggedIn && <CommandCenterView 
            tasks={tasks}
            allSubmissions={allSubmissions}
            units={units}
            onCreateTask={onCreateTask}
            onUpdateTask={onUpdateTask}
            onDeleteTask={onDeleteTask}
            onViewSubmission={(sub, task) => {
              setViewedSubmission(sub);
              setActiveTask(task);
              setMode(task.type === 'test' ? 'test' : 'worksheet');
            }}
            onDeleteSubmission={handleDeleteSubmission}
            onWipeCleanSlate={handleWipeCleanSlate}
          />}
          {mode === 'worksheet' && activeTask && (
            <TaskWorksheetView 
              key={`worksheet_${activeTask.id}_${viewedSubmission?.id || 'submit'}`}
              task={activeTask}
              onBack={() => {
                setMode('tasks');
                setActiveTask(null);
                setViewedSubmission(null);
              }}
              initialResponses={viewedSubmission ? viewedSubmission.responses : mySubmissions.find(s => s.taskId === activeTask.id)?.responses}
              initialFeedback={viewedSubmission ? viewedSubmission.feedback : mySubmissions.find(s => s.taskId === activeTask.id)?.feedback}
              initialGeneralFeedback={viewedSubmission ? viewedSubmission.generalFeedback : mySubmissions.find(s => s.taskId === activeTask.id)?.generalFeedback}
              readOnly={!!viewedSubmission || (!isAdminLoggedIn && mySubmissions.some(s => s.taskId === activeTask.id)) || !!userProfile?.isParent}
              isAdmin={isAdminLoggedIn}
              showCalculator={showCalculator}
              setShowCalculator={setShowCalculator}
              
              onProgress={async (partialResults) => {
                if (isAdminLoggedIn && viewedSubmission) {
                  const updateData: any = {};
                  if (partialResults?.feedback !== undefined) updateData.feedback = partialResults.feedback;
                  if (partialResults?.generalFeedback !== undefined) updateData.generalFeedback = partialResults.generalFeedback;
                  
                  if (Object.keys(updateData).length > 0) {
                     await updateDoc(doc(db, 'submissions', viewedSubmission.id), updateData);
                     setViewedSubmission(prev => prev ? {
                       ...prev,
                       ...updateData
                     } : prev);
                  }
                }
              }}
              onComplete={async (responses, results) => {
                if (!currentUser) return;

                if (isAdminLoggedIn && viewedSubmission) {
                  // Admin is grading an existing submission
                  if (results && results.cheatLogs !== undefined) {
                    delete results.cheatLogs; // Fix overwriting
                  }
                  const updateData: any = {
                    gradedAt: new Date().toISOString()
                  };
                  if (results !== undefined) {
                    updateData.results = { ...(viewedSubmission.results || {}), ...results };
                  }
                  if (results?.feedback !== undefined) updateData.feedback = results.feedback;
                  if (results?.generalFeedback !== undefined) updateData.generalFeedback = results.generalFeedback;

                  await updateDoc(doc(db, 'submissions', viewedSubmission.id), updateData);
                  
                  setViewedSubmission({
                    ...viewedSubmission,
                    results: updateData.results || viewedSubmission.results,
                    feedback: results?.feedback,
                    generalFeedback: results?.generalFeedback
                  });
                  alert("Student responses graded successfully!");
                  return;
                }

                try {
                  const submissionId = `${activeTask.id}_${currentUser.uid}`.replace(/[^a-zA-Z0-9_\-]/g, '_');
                  const submissionToSave: any = {
                    id: submissionId,
                    taskId: activeTask.id,
                    userId: currentUser.uid,
                    studentName: currentUser.displayName || 'Student',
                    completedAt: new Date().toISOString(),
                    responses: responses
                  };
                  
                  if (results !== undefined) {
                    submissionToSave.results = results;
                  } else {
                    submissionToSave.results = { 
                      score: 0, 
                      total: activeTask.worksheetQuestions?.length || 0, 
                      unitId: (activeTask.units && activeTask.units.length > 0) ? activeTask.units[0] : 0
                    };
                  }

                  if (results?.feedback !== undefined) {
                    submissionToSave.feedback = results.feedback;
                  }
                  if (results?.generalFeedback !== undefined) {
                    submissionToSave.generalFeedback = results.generalFeedback;
                  }
                  
                  console.log("Saving submission to Firestore:", submissionId);
                  await setDoc(doc(db, 'submissions', submissionId), submissionToSave);
                  
                  // Optimistically update local state to show "Done" immediately
                  setMySubmissions(prev => {
                    const filtered = prev.filter(s => s.id !== submissionId);
                    return [...filtered, submissionToSave as TaskSubmission];
                  });
                  
                } catch (e) {
                  console.error("Firestore submission error:", e);
                  throw e; // Rethrow so it's caught in TaskWorksheetView and shows alert
                }
              }}
            />
          )}

          {mode === 'test' && activeTask && (
            <TaskTestView 
              key={`test_${activeTask.id}_${viewedSubmission?.id || 'submit'}`}
              task={activeTask}
              onBack={() => {
                setMode('tasks');
                setActiveTask(null);
                setViewedSubmission(null);
              }}
              initialResponses={viewedSubmission ? viewedSubmission.responses : mySubmissions.find(s => s.taskId === activeTask.id)?.responses}
              initialFeedback={viewedSubmission ? viewedSubmission.feedback : mySubmissions.find(s => s.taskId === activeTask.id)?.feedback}
              initialGeneralFeedback={viewedSubmission ? viewedSubmission.generalFeedback : mySubmissions.find(s => s.taskId === activeTask.id)?.generalFeedback}
              readOnly={!!viewedSubmission || (!isAdminLoggedIn && mySubmissions.some(s => s.taskId === activeTask.id)) || !!userProfile?.isParent}
              isAdmin={isAdminLoggedIn}
              showCalculator={showCalculator}
              setShowCalculator={setShowCalculator}
              
              onProgress={async (partialResults) => {
                if (isAdminLoggedIn && viewedSubmission) {
                  const updateData: any = {};
                  if (partialResults?.feedback !== undefined) updateData.feedback = partialResults.feedback;
                  if (partialResults?.generalFeedback !== undefined) updateData.generalFeedback = partialResults.generalFeedback;
                  
                  if (Object.keys(updateData).length > 0) {
                     await updateDoc(doc(db, 'submissions', viewedSubmission.id), updateData);
                     setViewedSubmission(prev => prev ? {
                       ...prev,
                       ...updateData
                     } : prev);
                  }
                }
              }}
              onComplete={async (responses, results) => {
                if (!currentUser) return;

                if (isAdminLoggedIn && viewedSubmission) {
                  // Admin is grading an existing submission
                  if (results && results.cheatLogs !== undefined) {
                    delete results.cheatLogs; // Fix overwriting
                  }
                  const updateData: any = {
                    gradedAt: new Date().toISOString()
                  };
                  if (results !== undefined) {
                    updateData.results = { ...(viewedSubmission.results || {}), ...results };
                  }
                  if (results?.feedback !== undefined) updateData.feedback = results.feedback;
                  if (results?.generalFeedback !== undefined) updateData.generalFeedback = results.generalFeedback;

                  await updateDoc(doc(db, 'submissions', viewedSubmission.id), updateData);
                  
                  setViewedSubmission({
                    ...viewedSubmission,
                    results: updateData.results || viewedSubmission.results,
                    feedback: results?.feedback,
                    generalFeedback: results?.generalFeedback
                  });
                  alert("Student responses graded successfully!");
                  return;
                }

                try {
                  const submissionId = `${activeTask.id}_${currentUser.uid}`.replace(/[^a-zA-Z0-9_\-]/g, '_');
                  const submissionToSave: any = {
                    id: submissionId,
                    taskId: activeTask.id,
                    userId: currentUser.uid,
                    studentName: currentUser.displayName || 'Student',
                    completedAt: new Date().toISOString(),
                    responses: responses
                  };
                  
                  if (results !== undefined) {
                    submissionToSave.results = results;
                  } else {
                    submissionToSave.results = { 
                      score: 0, 
                      total: activeTask.worksheetQuestions?.length || 0, 
                      unitId: (activeTask.units && activeTask.units.length > 0) ? activeTask.units[0] : 0,
                      tabSwitches: 0
                    };
                  }

                  if (results?.feedback !== undefined) {
                    submissionToSave.feedback = results.feedback;
                  }
                  if (results?.generalFeedback !== undefined) {
                    submissionToSave.generalFeedback = results.generalFeedback;
                  }
                  
                  // Security logging specific to test mode
                  if (results?.cheatLogs !== undefined) {
                    submissionToSave.results = {
                      ...(submissionToSave.results || {}),
                      cheatLogs: results.cheatLogs,
                      tabSwitches: results.cheatLogs.tabSwitches || 0
                    };
                  }
                  
                  console.log("Saving test submission to Firestore:", submissionId);
                  await setDoc(doc(db, 'submissions', submissionId), submissionToSave);
                  
                  // Optimistically update local state to show "Done" immediately
                  setMySubmissions(prev => {
                    const filtered = prev.filter(s => s.id !== submissionId);
                    return [...filtered, submissionToSave as TaskSubmission];
                  });

                  // Finalize Test Flow: Exit to tasks and show success
                  setMode('tasks');
                  setActiveTask(null);
                  setViewedSubmission(null);
                  alert("Your test result has been successfully recorded.");
                  
                } catch (e) {
                  console.error("Firestore test submission error:", e);
                  throw e; 
                }
              }}
            />
          )}

          {mode === 'achievement' && (
            <AchievementView 
              key="achievement"
              user={userProfile}
              tasks={tasks}
              submissions={isAdminLoggedIn ? allSubmissions : mySubmissions}
              isAdmin={isAdminLoggedIn}
              allUsers={allUsers}
            />
          )}

          {mode === 'user-stats' && <UserStatsView key="user-stats" units={units} sessionStats={sessionStats} />}
          {mode === 'about' && <AboutView key="about" />}
          {mode === 'quick-facts' && <QuickFacts key="quick-facts" />}
        </AnimatePresence>

        {/* Virtual Calculator global overlay - Moved outside wait container to fix warning */}
        <AnimatePresence>
          {showCalculator && <Calculator key="global-calc" onClose={() => setShowCalculator(false)} />}
        </AnimatePresence>

        {/* Global Modals */}
        <AnimatePresence>
          {isY8Open && (
            <div 
              className="fixed inset-0 z-[500] flex items-center justify-center p-6 backdrop-blur-[4px] cursor-pointer"
              onClick={() => setIsY8Open(false)}
            >
              <motion.div
                initial={{ scale: 0, x: -300, y: 200, rotate: -720, opacity: 0 }}
                animate={{ scale: 1, x: 0, y: 0, rotate: 0, opacity: 1 }}
                exit={{ scale: 0, x: -300, y: 200, rotate: -720, opacity: 0 }}
                transition={{ 
                  type: "spring", 
                  damping: 20, 
                  stiffness: 100,
                  duration: 0.8
                }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-[2.5rem] p-8 max-w-2xl w-full shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] relative text-white border border-white/20 flex flex-col items-center overflow-hidden cursor-default"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -ml-16 -mb-16" />

                <button 
                  onClick={() => setIsY8Open(false)}
                  className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors z-[120]"
                >
                  <XCircle size={32} />
                </button>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="relative z-10 text-center mb-8"
                >
                  <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/20">
                    <GraduationCap size={32} className="text-white" />
                  </div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter text-white">
                    Class 25-26
                  </h2>
                  <p className="text-orange-100 font-bold text-[10px] uppercase tracking-[0.2em] mt-1 opacity-80">Final Year Cohort</p>
                </motion.div>

                <motion.div 
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1, transition: { staggerChildren: 0.03, delayChildren: 0.4 } }
                  }}
                  className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full relative z-10 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar"
                >
                  {[
                    "Edith", "Demi", "Hanson", "Dickson", "Helen", "Kiki", "Felix", "Hanna", 
                    "Ariel", "Alex", "Silvio", "Tony", "Anka", "Kiyo", "Billy", "Samuel", 
                    "Lawrence", "Xosox", "Chandler", "Mori", "Marli", "Hiro"
                  ].map((name) => (
                    <motion.button
                      key={name}
                      variants={{
                        hidden: { opacity: 0, scale: 0.8 },
                        visible: { opacity: 1, scale: 1 }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        spawnEmoji();
                      }}
                      className="bg-white/10 hover:bg-white/20 border border-white/10 py-3 rounded-xl text-white text-xs font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 text-center outline-none"
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
                      className="fixed pointer-events-none z-[600]"
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
            </div>
          )}

          {isQRModalOpen && (
            <div 
              className="fixed inset-0 z-[500] flex items-center justify-center p-6 backdrop-blur-[4px] cursor-pointer"
              onClick={() => setIsQRModalOpen(false)}
            >
              <motion.div 
                initial={{ scale: 0, x: -300, y: 200, rotate: -720, opacity: 0 }}
                animate={{ scale: 1, x: 0, y: 0, rotate: 0, opacity: 1 }}
                exit={{ scale: 0, x: -300, y: 200, rotate: -720, opacity: 0 }}
                transition={{ 
                  type: "spring", 
                  damping: 20, 
                  stiffness: 100,
                  duration: 0.8
                }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2.5rem] p-8 max-w-sm w-full shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] relative text-white border border-white/20 cursor-default"
              >
                <button 
                  onClick={() => setIsQRModalOpen(false)}
                  className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
                >
                  <XCircle size={28} />
                </button>
                
                <div className="flex items-center gap-4 mb-8">
                  <div className="bg-white/20 p-3.5 rounded-[1.25rem] backdrop-blur-sm border border-white/20 text-teal-50 flex items-center justify-center">
                    <QrCode size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight leading-none text-white">Scan the QR code</h3>
                    <p className="text-emerald-100 font-bold text-[10px] uppercase tracking-widest mt-1 opacity-90">Device Connect</p>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-[2rem] border border-white/10 flex justify-center mb-6 shadow-xl group hover:scale-[1.02] transition-transform duration-500">
                  <QRCodeSVG value="https://y8rev.vercel.app" size={200} level="H" includeMargin={false} />
                </div>
                
                <div className="bg-white/10 text-white py-4 rounded-2xl border border-white/10 backdrop-blur-sm font-black text-[10px] uppercase tracking-[0.3em] shadow-sm text-center">
                  y8rev.vercel.app
                </div>
              </motion.div>
            </div>
          )}
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
      {['dashboard', 'user-stats', 'about', 'quick-facts', 'tasks', 'achievement', 'command-center'].includes(mode) && (
        <nav className="fixed bottom-6 left-4 right-4 bg-white/5 backdrop-blur-md border border-white/10 p-2 z-[150] md:hidden rounded-[2rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)]">
          <div className={`grid gap-1.5 ${isAdminLoggedIn ? 'grid-cols-6' : 'grid-cols-4'}`}>
            {getAppNavItems(isAdminLoggedIn).map((item) => {
              const Icon = item.icon;
              const isActive = mode === item.mode;
              return (
                <button 
                  key={item.mode}
                  onClick={() => setMode(item.mode)}
                  className={`flex flex-col items-center justify-center gap-1 py-3 rounded-2xl transition-all duration-300 ${
                    isActive 
                      ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' 
                      : 'bg-white/5 border border-white/10 text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Icon size={18} fill={isActive ? "currentColor" : "none"} />
                  <span className="text-[7px] font-black uppercase tracking-tight">{item.label}</span>
                </button>
              )
            })}
            <button 
              onClick={() => setMode('achievement')}
              className={`flex flex-col items-center justify-center gap-1 py-3 rounded-2xl transition-all duration-300 ${
                mode === 'achievement' 
                  ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20' 
                  : 'bg-white/5 border border-white/10 text-slate-400'
              }`}
            >
              {userProfile?.photoURL ? (
                <img src={userProfile.photoURL} alt="User" className="w-[18px] h-[18px] rounded-lg object-cover shadow-sm border border-white/20" />
              ) : (
                <div className={`w-[18px] h-[18px] rounded-lg flex items-center justify-center font-black text-[8px] ${mode === 'achievement' ? 'bg-white/20' : 'bg-emerald-500 text-white'}`}>
                  {userProfile?.displayName?.charAt(0) || 'U'}
                </div>
              )}
              <span className="text-[7px] font-black uppercase tracking-tight">Me</span>
            </button>
          </div>
        </nav>
      )}

    </div>
  );
}
