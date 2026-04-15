/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { useState, useEffect, useMemo, useRef, ErrorInfo, ReactNode, Component } from 'react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  getDocFromServer
} from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { db, auth } from './firebase';
import QuickFacts from './QuickFacts';

import Quiz from './Quiz';
import Notes from './Notes';

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

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Add these interfaces
interface ChallengeResponse {
  questionId: string;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

interface ChallengeRecord {
  id: string;
  studentName: string;
  score: number;
  totalQuestions: number;
  selectedUnits: number[];
  responses: ChallengeResponse[];
  timestamp: string;
}
import { 
  Heart, 
  BookOpen, 
  GraduationCap, 
  Languages, 
  ChevronLeft, 
  CheckCircle2, 
  XCircle, 
  Trophy,
  Trash2,
  User,
  Lock,
  FileText,
  Download,
  ChevronRight,
  X,
  Menu,
  Settings,
  LogOut,
  Plus,
  Minus,
  Save,
  Edit,
  Trash,
  Search,
  Filter,
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Award,
  Star,
  Thermometer,
  TestTube,
  Microscope,
  Magnet,
  Lightbulb,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudSnow,
  Waves,
  Mountain,
  Trees,
  Leaf,
  Flower,
  Bug,
  Bird,
  Fish,
  Dog,
  Cat,
  Rabbit,
  Turtle,
  Skull,
  Ghost,
  Activity,
  Stethoscope,
  Syringe,
  Pill,
  Brain,
  Hand,
  Footprints,
  Baby,
  Users,
  Briefcase,
  School,
  Library,
  Book,
  Pencil,
  Eraser,
  Ruler,
  Globe,
  Map,
  MapPin,
  Navigation,
  Flag,
  Calendar,
  Bell,
  Mail,
  Phone,
  MessageCircle,
  Share2,
  Link,
  Twitter,
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  Chrome,
  Terminal,
  Cpu,
  Database,
  Server,
  Wifi,
  Bluetooth,
  Nfc,
  Battery,
  BatteryCharging,
  BatteryFull,
  BatteryLow,
  BatteryMedium,
  BatteryWarning,
  HardDrive,
  Mouse,
  Keyboard,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Tv,
  Speaker,
  Headphones,
  Mic,
  Video,
  Camera,
  Image,
  Music,
  Film,
  Gamepad,
  Joystick,
  Dices,
  Puzzle,
  Medal,
  Target,
  Dumbbell,
  Car,
  Plane,
  Ship,
  Train,
  Truck,
  Bus,
  Rocket,
  Anchor,
  ArrowRight,
  ArrowRightLeft,
  Home,
  RefreshCw,
  Github,
  ExternalLink,
  Info,
  Zap,
  LayoutGrid,
  List,
  Eye,
  EyeOff,
  FlaskConical,
  Calculator,
  Atom,
  Variable,
  Dna,
  Beaker,
  Wind,
  Droplets,
  Flame,
  TrendingUp,
  QrCode,
  Shield
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { units, Unit, Question, Vocab } from './data';
import { getVisual } from './components/visuals/VisualRegistry';

type AppMode = 'splash' | 'dashboard' | 'quiz' | 'quiz-select' | 'revision' | 'vocab' | 'result' | 'user-stats' | 'about' | 'playground' | 'quick-facts';
type QuizSubMode = 'quick' | 'time-attack' | 'marathon';

interface SessionStats {
  [unitId: number]: {
    attemptedQuestions: string[];
    masteredVocab: string[];
  }
}

export default function App() {
  return (
    <AppErrorBoundary>
      <AppContent />
    </AppErrorBoundary>
  );
}

function AppContent() {
  const [mode, setMode] = useState<AppMode>('splash');
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [isY8Open, setIsY8Open] = useState(false);
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
  const [showEasterNotice, setShowEasterNotice] = useState(false);
  const [easterNoticeAgreed, setEasterNoticeAgreed] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [challengeRecords, setChallengeRecords] = useState<ChallengeRecord[]>([]);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAssistMode, setIsAssistMode] = useState(false);
  const [chineseType, setChineseType] = useState<'traditional' | 'simplified'>('traditional');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthReady(true);
      if (user && user.email === 'tomanlam@gmail.com') {
        setIsAdminLoggedIn(true);
      } else {
        setIsAdminLoggedIn(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthReady || !isAdminLoggedIn || !auth.currentUser) {
      setChallengeRecords([]);
      return;
    }

    const q = query(collection(db, 'challengeRecords'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records: ChallengeRecord[] = [];
      snapshot.forEach((doc) => {
        records.push(doc.data() as ChallengeRecord);
      });
      setChallengeRecords(records);
    }, (error) => {
      // Only handle error if we are supposed to be logged in
      if (isAdminLoggedIn && auth.currentUser) {
        handleFirestoreError(error, OperationType.LIST, 'challengeRecords');
      }
    });

    return () => unsubscribe();
  }, [isAuthReady, isAdminLoggedIn]);

  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    }
    testConnection();
  }, []);

  const saveChallengeRecord = async (record: ChallengeRecord) => {
    try {
      await setDoc(doc(db, 'challengeRecords', record.id), record);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `challengeRecords/${record.id}`);
    }
  };

  const deleteChallengeRecord = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'challengeRecords', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `challengeRecords/${id}`);
    }
  };

  const updateChallengeRecord = async (updatedRecord: ChallengeRecord) => {
    try {
      await setDoc(doc(db, 'challengeRecords', updatedRecord.id), updatedRecord);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `challengeRecords/${updatedRecord.id}`);
    }
  };

  const generateChallengeQuiz = () => {
    let allQuestions: Question[] = [];
    challengeSelectedUnits.forEach(unitId => {
      const unit = units.find(u => u.id === unitId);
      if (unit) {
        allQuestions = [...allQuestions, ...unit.questions];
      }
    });

    // Shuffle and pick N questions
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, challengeQuestionCount);

    setChallengeQuestions(selected);
    setChallengeCurrentIndex(0);
    setChallengeResponses([]);
    setIsChallengeQuizActive(true);
    setIsChallengeModeOpen(false);
    setShowChallengeResult(false);
    setIsEventMode(false);
  };

  const handleChallengeAnswer = (answer: string) => {
    const currentQuestion = challengeQuestions[challengeCurrentIndex];
    const isCorrect = currentQuestion.options.length > 0 
      ? answer === currentQuestion.correctAnswer
      : answer.trim().toLowerCase() === currentQuestion.correctAnswer.trim().toLowerCase();

    const newResponse: ChallengeResponse = {
      questionId: currentQuestion.id,
      questionText: currentQuestion.text,
      userAnswer: answer,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect: isCorrect
    };

    const updatedResponses = [...challengeResponses, newResponse];
    setChallengeResponses(updatedResponses);

    if (challengeCurrentIndex < challengeQuestions.length - 1) {
      setChallengeCurrentIndex(challengeCurrentIndex + 1);
    } else {
      setIsChallengeQuizActive(false);
      setShowChallengeResult(true);
    }
  };

  const finalizeChallenge = () => {
    if (!challengeStudentName.trim()) return;

    const score = challengeResponses.filter(r => r.isCorrect).length;
    const record: ChallengeRecord = {
      id: Math.random().toString(36).substr(2, 9),
      studentName: challengeStudentName,
      score,
      totalQuestions: challengeQuestions.length,
      selectedUnits: challengeSelectedUnits,
      responses: challengeResponses,
      timestamp: new Date().toISOString()
    };

    saveChallengeRecord(record);
    setShowChallengeResult(false);
    setChallengeStudentName("");
    setChallengeSelectedUnits([]);
    setChallengeQuestionCount(20);
  };
  const [isEventMode, setIsEventMode] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [eventMessages] = useState(["Easter assignment due 20th April"]);
  const [currentEventMessageIndex, setCurrentEventMessageIndex] = useState(0);

  useEffect(() => {
    if (eventMessages.length > 1) {
      const interval = setInterval(() => {
        setCurrentEventMessageIndex(prev => (prev + 1) % eventMessages.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [eventMessages]);

  const startEasterAssignment = () => {
    setShowEasterNotice(true);
    setEasterNoticeAgreed(false);
  };

  const proceedToEasterAssignment = () => {
    if (!easterNoticeAgreed) return;
    setShowEasterNotice(false);
    
    const eventUnits = [1, 2, 3, 4, 5, 6, 7];
    const mcqCount = 60;
    const shortResponseCount = 10;
    
    let allMcqs: Question[] = [];
    let allVocab: Vocab[] = [];
    
    eventUnits.forEach(unitId => {
      const unit = units.find(u => u.id === unitId);
      if (unit) {
        allMcqs = [...allMcqs, ...unit.questions];
        allVocab = [...allVocab, ...unit.vocab];
      }
    });

    // 60 random MCQs
    const shuffledMcqs = [...allMcqs].sort(() => 0.5 - Math.random());
    const selectedMcqs = shuffledMcqs.slice(0, mcqCount);

    // 10 random short responses
    const shuffledVocab = [...allVocab].sort(() => 0.5 - Math.random());
    const selectedVocab = shuffledVocab.slice(0, shortResponseCount);
    
    const shortResponseQuestions: Question[] = selectedVocab.map((v, i) => {
      if (i < 5) {
        // Ask for term (given definition)
        return {
          id: `sr-term-${v.term}-${i}`,
          text: `What is the term for: "${v.definition}"?`,
          options: [], // empty options means short response
          correctAnswer: v.term
        };
      } else {
        // Ask for definition (given term)
        return {
          id: `sr-def-${v.term}-${i}`,
          text: `Define the term: "${v.term}"`,
          options: [],
          correctAnswer: v.definition
        };
      }
    });

    const finalQuestions = [...selectedMcqs, ...shortResponseQuestions];

    setChallengeQuestions(finalQuestions);
    setChallengeCurrentIndex(0);
    setChallengeResponses([]);
    setChallengeSelectedUnits(eventUnits);
    setChallengeQuestionCount(finalQuestions.length);
    setIsChallengeQuizActive(true);
    setIsChallengeModeOpen(false);
    setIsEventMode(true);
    setShortResponseInput("");
  };

  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [editingRecord, setEditingRecord] = useState<ChallengeRecord | null>(null);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Legacy login (UI only, no database access)
    if (adminUsername === 'admin' && adminPassword === '1069') {
      setIsAdminLoggedIn(true);
      setAdminError("Note: Password login only grants UI access. Cloud records require Google Sign-In.");
      return;
    }

    try {
      setAdminError("");
      const provider = new GoogleAuthProvider();
      // Force account selection to help with multiple accounts
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      if (result.user.email === 'tomanlam@gmail.com') {
        setIsAdminLoggedIn(true);
        setAdminError("");
      } else {
        setAdminError("Access denied: " + result.user.email + " is not an authorized admin.");
        await signOut(auth);
      }
    } catch (error: any) {
      console.error("Login error", error);
      if (error.code === 'auth/popup-blocked') {
        setAdminError("Popup blocked! Please allow popups for this site.");
      } else if (error.code === 'auth/unauthorized-domain') {
        setAdminError("Domain not authorized in Firebase Console. Please add this URL to 'Authorized Domains'.");
      } else {
        setAdminError("Login failed: " + (error.message || "Unknown error"));
      }
    }
  };

  const generatePDF = (records: ChallengeRecord[]) => {
    const doc = new jsPDF();
    
    records.forEach((record, index) => {
      if (index > 0) doc.addPage();
      
      doc.setFontSize(20);
      doc.text("Quiz Challenge Report", 14, 22);
      
      doc.setFontSize(12);
      doc.text(`Student: ${record.studentName}`, 14, 32);
      
      const percentage = (record.score / record.totalQuestions) * 100;
      doc.text(`Score: ${record.score} / ${record.totalQuestions}`, 14, 40);
      
      // Add percentage with color
      if (percentage >= 60) {
        doc.setTextColor(16, 185, 129); // Green
      } else {
        doc.setTextColor(239, 68, 68); // Red
      }
      doc.text(`(${percentage.toFixed(1)}%)`, 50, 40);
      doc.setTextColor(0, 0, 0); // Reset to black

      doc.text(`Date: ${new Date(record.timestamp).toLocaleString()}`, 14, 48);
      doc.text(`Units: ${record.selectedUnits.join(", ")}`, 14, 56);

      const tableData = record.responses.map((r, i) => [
        i + 1,
        r.questionText,
        r.userAnswer,
        r.correctAnswer,
        r.isCorrect ? "Yes" : "No"
      ]);

      autoTable(doc, {
        startY: 64,
        head: [['#', 'Question', 'Your Answer', 'Correct Answer', 'Correct']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] }
      });
    });

    doc.save(`Quiz_Report_${new Date().getTime()}.pdf`);
  };
  const [sessionStats, setSessionStats] = useState<SessionStats>({});

  const allConcepts = useMemo(() => units.flatMap(unit => unit.concepts), []);
  const [randomConcept, setRandomConcept] = useState(() => 
    allConcepts[Math.floor(Math.random() * allConcepts.length)]
  );

  const refreshConcept = () => {
    let nextConcept;
    do {
      nextConcept = allConcepts[Math.floor(Math.random() * allConcepts.length)];
    } while (nextConcept === randomConcept && allConcepts.length > 1);
    setRandomConcept(nextConcept);
  };

  // Splash screen timeout
  useEffect(() => {
    if (mode === 'splash') {
      const timer = setTimeout(() => setMode('dashboard'), 3000);
      return () => clearTimeout(timer);
    }
  }, [mode]);

  const startQuiz = (unit: Unit) => {
    setSelectedUnit(unit);
    setMode('quiz');
  };

  const startRevision = (unit: Unit) => {
    setSelectedUnit(unit);
    setMode('revision');
  };

  const startVocab = (unit: Unit) => {
    setSelectedUnit(unit);
    setMode('vocab');
  };

  // Components
  const SplashScreen = () => (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="text-red-500 mb-8"
      >
        <Heart size={120} fill="currentColor" />
      </motion.div>
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-gray-800"
      >
        Made with love by Toman
      </motion.h1>
    </div>
  );

  const Y8Splash = ({ onClose }: { onClose: () => void }) => {
    const [activeEmojis, setActiveEmojis] = useState<{ id: number; emoji: string; x: number; y: number; size: number }[]>([]);
    
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

    const containerVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.05
        }
      }
    };

    const itemVariants = {
      hidden: { opacity: 0, x: -20 },
      visible: { opacity: 1, x: 0 }
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
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 max-w-4xl w-full"
        >
          {[
            "Edith", "Demi", "Hanson", "Dickson", "Helen", "Kiki", "Felix", "Hanna", 
            "Ariel", "Alex", "Silvio", "Tony", "Anka", "Kiyo", "Billy", "Samuel", 
            "Lawrence", "Xosox", "Chandler", "Mori", "Marli", "Hiro"
          ].map((name) => (
            <motion.button
              key={name}
              variants={itemVariants}
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

  const Dashboard = () => (
    <div className="min-h-screen bg-gray-50 pb-20">
      <AnimatePresence>
        {isY8Open && <Y8Splash onClose={() => setIsY8Open(false)} />}
      </AnimatePresence>

      <header className="bg-white border-b-2 border-gray-200 p-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black text-emerald-500 tracking-tight leading-none">Y8 Cambridge LS Science</h1>
            <span className="text-[10px] font-bold text-black uppercase tracking-widest mt-1">An app by Toman</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsQRModalOpen(true)}
              className="bg-gray-100 text-gray-600 p-2 rounded-full hover:bg-gray-200 transition-all"
              title="App QR Code"
            >
              <QrCode size={20} />
            </button>
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
        {showEasterNotice && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[500] flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl border-4 border-cyan-100"
            >
              <div className="bg-cyan-50 w-20 h-20 rounded-3xl flex items-center justify-center text-cyan-500 mx-auto mb-8">
                <Star size={40} className="animate-pulse" />
              </div>
              <h2 className="text-3xl font-black text-center text-gray-800 uppercase tracking-tight mb-6">Notice</h2>
              <div className="bg-gray-50 rounded-2xl p-6 mb-8 border-2 border-gray-100">
                <p className="text-gray-600 font-bold leading-relaxed text-center">
                  Welcome to the Easter assignment. Please read and answer these questions carefully. 
                  If your grade is below <span className="text-red-500 font-black">60%</span> or if you missed the assignment, 
                  you will have to sit for a written test paper on Tuesday so please answer the questions carefully. 
                  You will be asked to input your name at the end.
                </p>
              </div>
              
              <label className="flex items-center gap-4 mb-8 cursor-pointer group justify-center">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    checked={easterNoticeAgreed}
                    onChange={(e) => setEasterNoticeAgreed(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-8 h-8 rounded-xl border-4 transition-all flex items-center justify-center ${
                    easterNoticeAgreed ? 'bg-cyan-500 border-cyan-500' : 'border-gray-200 group-hover:border-cyan-200'
                  }`}>
                    {easterNoticeAgreed && <CheckCircle2 size={20} className="text-white" />}
                  </div>
                </div>
                <span className="text-gray-700 font-black uppercase tracking-widest text-sm">I agree to the terms</span>
              </label>

              <div className="flex gap-4">
                <button 
                  onClick={() => setShowEasterNotice(false)}
                  className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest border-2 border-gray-200 text-gray-400 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  disabled={!easterNoticeAgreed}
                  onClick={proceedToEasterAssignment}
                  className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${
                    easterNoticeAgreed 
                      ? 'bg-cyan-500 text-white shadow-[0_6px_0_0_#0891b2] active:shadow-none active:translate-y-1' 
                      : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  Start Quiz
                </button>
              </div>
            </motion.div>
          </div>
        )}

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
                {/* Easter Assignment Button */}
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
              <h2 className="text-2xl font-black text-gray-800 mb-8">{challengeQuestions[challengeCurrentIndex].text}</h2>
              
              {challengeQuestions[challengeCurrentIndex].options.length > 0 ? (
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
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
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
                  {/* Admin Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-3xl border-2 border-gray-200 shadow-sm">
                      <p className="text-gray-400 font-black text-xs uppercase tracking-widest mb-2">Total Quizzes</p>
                      <p className="text-4xl font-black text-gray-800">{challengeRecords.length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border-2 border-gray-200 shadow-sm">
                      <p className="text-gray-400 font-black text-xs uppercase tracking-widest mb-2">Avg. Performance</p>
                      <p className="text-4xl font-black text-emerald-500">
                        {challengeRecords.length > 0 
                          ? (challengeRecords.reduce((acc, r) => acc + (r.score / r.totalQuestions), 0) / challengeRecords.length * 100).toFixed(1)
                          : 0}%
                      </p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border-2 border-gray-200 shadow-sm">
                      <p className="text-gray-400 font-black text-xs uppercase tracking-widest mb-2">Active Students</p>
                      <p className="text-4xl font-black text-blue-500">
                        {new Set(challengeRecords.map(r => r.studentName)).size}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Quiz Records</h2>
                    <button 
                      onClick={() => generatePDF(challengeRecords)}
                      className="bg-emerald-500 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_4px_0_0_#059669] hover:bg-emerald-600 transition-all active:shadow-none active:translate-y-1"
                    >
                      <Download size={20} /> Export All
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
      </AnimatePresence>

      <main className="max-w-2xl mx-auto p-4 space-y-6 mt-4">
        {/* Event Mode Card */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsChallengeModeOpen(true)}
          className="bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl p-6 shadow-lg cursor-pointer relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
            <Star size={80} />
          </div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <Star className="text-white" size={32} />
            </div>
            <div className="flex-1 overflow-hidden">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Event Mode</h2>
              <div className="h-6 relative overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.p 
                    key={currentEventMessageIndex}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="text-white/90 font-medium absolute inset-0 truncate"
                  >
                    {eventMessages[currentEventMessageIndex]}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="bg-emerald-100 border-2 border-emerald-200 rounded-2xl p-6 flex items-center gap-6">
          <div className="bg-emerald-500 p-4 rounded-full text-white">
            <GraduationCap size={40} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-emerald-900 uppercase tracking-tight">Did you know?</h2>
              <motion.button
                whileHover={{ rotate: 180 }}
                whileTap={{ scale: 0.8 }}
                onClick={refreshConcept}
                className="text-emerald-600 hover:text-emerald-800 p-1 rounded-full hover:bg-emerald-200 transition-colors"
              >
                <RefreshCw size={20} />
              </motion.button>
            </div>
            <p className="text-emerald-700 font-medium leading-tight mt-1">
              {randomConcept.includes(': ') ? (
                <>
                  <span className="font-bold">{randomConcept.split(': ')[0]}:</span>
                  {randomConcept.substring(randomConcept.indexOf(': ') + 1)}
                </>
              ) : (
                randomConcept
              )}
            </p>
          </div>
        </div>

        <div className="grid gap-4">
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
          <button 
            onClick={() => setIsAdminOpen(true)}
            className="bg-red-500 text-white px-6 py-2 rounded-xl font-black uppercase tracking-widest text-xs shadow-[0_4px_0_0_#b91c1c] active:shadow-none active:translate-y-1 transition-all"
          >
            Admin Access
          </button>
        </footer>
      </main>
    </div>
  );



  const VocabView = () => {
    const [isFlipped, setIsFlipped] = useState(false);
    const [masteredIndices, setMasteredIndices] = useState<number[]>([]);
    const [remainingIndices, setRemainingIndices] = useState<number[]>([]);
    const [isSimplified, setIsSimplified] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [colorIndex, setColorIndex] = useState(0);
    const [isReviewMode, setIsReviewMode] = useState(false);
    const [reviewView, setReviewView] = useState<'cards' | 'list'>('cards');

    const duolingoColors = [
      'bg-[#58cc02]', // Green
      'bg-[#1cb0f6]', // Blue
      'bg-[#ff9600]', // Orange
      'bg-[#ff4b4b]', // Red
      'bg-[#ce82ff]', // Purple
    ];

    const duolingoShadows = [
      'shadow-[0_8px_0_0_#46a302]',
      'shadow-[0_8px_0_0_#1899d6]',
      'shadow-[0_8px_0_0_#e68700]',
      'shadow-[0_8px_0_0_#e64444]',
      'shadow-[0_8px_0_0_#b975e6]',
    ];

    useEffect(() => {
      if (selectedUnit) {
        const stats = sessionStats[selectedUnit.id] || { attemptedQuestions: [], masteredVocab: [] };
        const alreadyMasteredIndices = selectedUnit.vocab
          .map((v, i) => stats.masteredVocab.includes(v.term) ? i : -1)
          .filter(i => i !== -1);
        
        setMasteredIndices(alreadyMasteredIndices);

        // Only show cards NOT yet mastered in this session's initial queue
        const indices = selectedUnit.vocab
          .map((_, i) => i)
          .filter(i => !alreadyMasteredIndices.includes(i));

        // Shuffle indices for random order
        for (let i = indices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        setRemainingIndices(indices);
        setIsCompleted(indices.length === 0);
      }
    }, [selectedUnit]);

    const handleSwipe = (direction: 'left' | 'right') => {
      if (remainingIndices.length === 0) return;
      
      const currentVocabIdx = remainingIndices[0];
      const currentVocab = selectedUnit?.vocab[currentVocabIdx];
      
      if (!currentVocab) return;

      setIsFlipped(false);
      setColorIndex((prev) => (prev + 1) % duolingoColors.length);

      if (direction === 'right') {
        // Mastered
        setMasteredIndices(prev => [...prev, currentVocabIdx]);

        // Track mastered vocab in session stats
        setSessionStats(prev => {
          const unitStats = prev[selectedUnit!.id] || { attemptedQuestions: [], masteredVocab: [] };
          if (!unitStats.masteredVocab.includes(currentVocab.term)) {
            return {
              ...prev,
              [selectedUnit!.id]: {
                ...unitStats,
                masteredVocab: [...unitStats.masteredVocab, currentVocab.term]
              }
            };
          }
          return prev;
        });
        
        setRemainingIndices(prev => {
          const next = prev.slice(1);
          if (next.length === 0) {
            setIsCompleted(true);
          }
          return next;
        });
      } else {
        // Revise Later (Left) - Move to end of queue
        setRemainingIndices(prev => {
          if (prev.length <= 1) return prev;
          return [...prev.slice(1), prev[0]];
        });
      }
    };

    if (isCompleted) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            className="bg-white p-12 rounded-full shadow-2xl mb-8"
          >
            <Trophy size={120} className="text-yellow-400" />
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-black text-gray-800 mb-4 uppercase tracking-tight"
          >
            All mastered! Good job!
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-500 text-xl mb-12"
          >
            You've learned all the key terms for this unit.
          </motion.p>
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={() => {
                setIsCompleted(false);
                setIsReviewMode(true);
              }}
              className="bg-white text-emerald-500 border-2 border-emerald-500 px-12 py-4 rounded-2xl font-black text-xl uppercase tracking-widest shadow-[0_6px_0_0_#10b981] active:shadow-none active:translate-y-1 transition-all"
            >
              Review All
            </motion.button>
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              onClick={() => setMode('dashboard')}
              className="bg-emerald-500 text-white px-12 py-4 rounded-2xl font-black text-xl uppercase tracking-widest shadow-[0_6px_0_0_#059669] active:shadow-none active:translate-y-1 transition-all"
            >
              Back to Dashboard
            </motion.button>
          </div>
        </div>
      );
    }

    const currentVocab = selectedUnit?.vocab[remainingIndices[0]];

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col overflow-hidden">
        <header className="bg-white border-b-2 border-gray-200 p-4 sticky top-0 z-10">
          <div className={`${isReviewMode ? 'max-w-6xl' : 'max-w-2xl'} mx-auto flex items-center justify-between transition-all duration-300`}>
            <div className="flex items-center gap-4">
              <button onClick={() => setMode('dashboard')} className="text-gray-400 hover:text-gray-600">
                <ChevronLeft size={32} />
              </button>
              <div>
                <h1 className="text-lg font-black text-gray-800 uppercase tracking-tight leading-none">Vocab</h1>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{selectedUnit?.title}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="text-right mr-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Progress</p>
                <p className="text-sm font-black text-emerald-500">
                  {masteredIndices.length} / {selectedUnit?.vocab.length}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsSimplified(!isSimplified)}
                className="bg-purple-100 text-purple-600 px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider border-2 border-purple-200 flex items-center gap-2"
              >
                <Languages size={16} />
                {isSimplified ? 'Simplified' : 'Traditional'}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsReviewMode(!isReviewMode)}
                className={`${isReviewMode ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'} px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider border-2 flex items-center gap-2`}
              >
                {isReviewMode ? <EyeOff size={16} /> : <Eye size={16} />}
                {isReviewMode ? 'Study' : 'Review'}
              </motion.button>
            </div>
          </div>
        </header>

        {isReviewMode ? (
          <main className={`flex-1 overflow-y-auto p-4 ${isReviewMode ? 'max-w-6xl' : 'max-w-2xl'} mx-auto w-full transition-all duration-300`}>
            <div className="flex justify-center mb-6 gap-2">
              <button
                onClick={() => setReviewView('cards')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${reviewView === 'cards' ? 'bg-emerald-500 text-white shadow-[0_4px_0_0_#059669]' : 'bg-white text-gray-400 border-2 border-gray-200 hover:bg-gray-50'}`}
              >
                <LayoutGrid size={16} />
                Cards
              </button>
              <button
                onClick={() => setReviewView('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${reviewView === 'list' ? 'bg-emerald-500 text-white shadow-[0_4px_0_0_#059669]' : 'bg-white text-gray-400 border-2 border-gray-200 hover:bg-gray-50'}`}
              >
                <List size={16} />
                List
              </button>
            </div>

            {reviewView === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {selectedUnit?.vocab.map((v, idx) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={idx}
                    className="bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-[0_4px_0_0_rgba(0,0,0,0.05)]"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block mb-1">Term</span>
                        <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">{v.term}</h3>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block mb-1">Chinese</span>
                        <p className="text-lg font-black text-emerald-500">{isSimplified ? v.simplified : v.traditional}</p>
                      </div>
                    </div>
                    <div className="h-px bg-gray-100 w-full mb-4" />
                    <div>
                      <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block mb-1">Definition</span>
                      <p className="text-gray-600 text-sm font-medium leading-relaxed">{v.definition}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden shadow-[0_4px_0_0_rgba(0,0,0,0.05)]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b-2 border-gray-200">
                      <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Vocabulary</th>
                      <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Definition</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedUnit?.vocab.map((v, idx) => (
                      <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <p className="font-black text-gray-800 uppercase tracking-tight leading-tight">{v.term}</p>
                          <p className="text-emerald-500 font-black text-xs mt-1">{isSimplified ? v.simplified : v.traditional}</p>
                        </td>
                        <td className="p-4 text-sm text-gray-600 font-medium leading-relaxed">
                          {v.definition}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </main>
        ) : (
          <main className="flex-1 flex flex-col items-center justify-center p-6 relative">
          <div className="w-full max-w-sm aspect-[3/4] relative perspective-1000 mb-16">
            <AnimatePresence mode="wait">
              <motion.div
                key={remainingIndices[0]}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(_, info) => {
                  if (info.offset.x > 100) handleSwipe('right');
                  else if (info.offset.x < -100) handleSwipe('left');
                }}
                animate={{ 
                  rotateY: isFlipped ? 180 : 0,
                  x: 0,
                  opacity: 1,
                  scale: 1
                }}
                exit={{ 
                  x: 0,
                  opacity: 0,
                  scale: 0.8
                }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                onClick={() => setIsFlipped(!isFlipped)}
                className="w-full h-full cursor-pointer preserve-3d relative transition-shadow duration-300"
              >
                {/* Front */}
                <div 
                  className={`absolute inset-0 backface-hidden rounded-3xl flex flex-col items-center justify-center p-8 text-center ${duolingoColors[colorIndex]} ${duolingoShadows[colorIndex]}`}
                >
                  <span className="text-white/50 text-xs font-black uppercase tracking-[0.2em] mb-4">English Term</span>
                  <h2 className="text-white text-4xl font-black uppercase tracking-tight leading-tight">
                    {currentVocab?.term}
                  </h2>
                  <div className="absolute bottom-8 flex items-center gap-2 text-white/60 font-bold text-sm uppercase tracking-widest">
                    <ArrowRight size={16} className="animate-pulse" /> Tap to flip
                  </div>
                </div>

                {/* Back */}
                <div 
                  className="absolute inset-0 backface-hidden rounded-3xl bg-white flex flex-col items-center justify-center p-8 text-center rotate-y-180 border-4 border-gray-100 shadow-[0_8px_0_0_#e5e5e5]"
                >
                  <div className="space-y-8 w-full">
                    <div>
                      <span className="text-gray-300 text-[10px] font-black uppercase tracking-[0.2em] block mb-2">Translation</span>
                      <h3 className="text-gray-800 text-3xl font-black">
                        {isSimplified ? currentVocab?.simplified : currentVocab?.traditional}
                      </h3>
                    </div>
                    
                    <div className="h-px bg-gray-100 w-full" />
                    
                    <div>
                      <span className="text-gray-300 text-[10px] font-black uppercase tracking-[0.2em] block mb-2">Definition</span>
                      <p className="text-gray-600 text-lg font-medium leading-relaxed">
                        {currentVocab?.definition}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Swipe Indicators - Moved to normal flow to avoid overlapping */}
          <div className="w-full max-w-sm flex justify-between px-4">
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full bg-red-100 border-2 border-red-200 flex items-center justify-center text-red-500 shadow-[0_4px_0_0_#fecaca]">
                <XCircle size={28} />
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Revise Later</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full bg-emerald-100 border-2 border-emerald-200 flex items-center justify-center text-emerald-500 shadow-[0_4px_0_0_#a7f3d0]">
                <CheckCircle2 size={28} />
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mastered</span>
            </div>
          </div>
        </main>
      )}

      {!isReviewMode && (
        <footer className="p-6 text-center">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
            Swipe left to revise • Swipe right to master
          </p>
        </footer>
      )}

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};

  const PlaygroundView = () => {
    const [subMode, setSubMode] = useState<'select' | 'equations' | 'chemicals' | 'graphs' | 'simulations'>('select');
    const [selectedEquation, setSelectedEquation] = useState<any>(null);
    const [equationSubject, setEquationSubject] = useState<string>('');
    const [isPracticeMode, setIsPracticeMode] = useState(false);
    const [practiceQuestion, setPracticeQuestion] = useState<any>(null);
    const [practiceAnswer, setPracticeAnswer] = useState<string | null>(null);
    const [isPracticeChecked, setIsPracticeChecked] = useState(false);
    const [selectedChemical, setSelectedChemical] = useState<any>(null);
    const [selectedGraph, setSelectedGraph] = useState<string | null>(null);
    const [graphSpeed1, setGraphSpeed1] = useState(5);
    const [graphSpeed2, setGraphSpeed2] = useState(10);

    const equations = [
      {
        id: 'speed',
        name: 'Speed',
        formula: 'v = d / t',
        unit: 'm/s',
        variables: [
          { symbol: 'v', name: 'Speed', unit: 'm/s' },
          { symbol: 'd', name: 'Distance', unit: 'm' },
          { symbol: 't', name: 'Time', unit: 's' }
        ]
      },
      {
        id: 'pressure',
        name: 'Pressure',
        formula: 'P = F / A',
        unit: 'N/m²',
        variables: [
          { symbol: 'P', name: 'Pressure', unit: 'N/m²' },
          { symbol: 'F', name: 'Force', unit: 'N' },
          { symbol: 'A', name: 'Area', unit: 'm²' }
        ]
      },
      {
        id: 'moment',
        name: 'Moment',
        formula: 'M = F × d',
        unit: 'Nm',
        variables: [
          { symbol: 'M', name: 'Moment', unit: 'Nm' },
          { symbol: 'F', name: 'Force', unit: 'N' },
          { symbol: 'd', name: 'Distance', unit: 'm' }
        ]
      },
      {
        id: 'density',
        name: 'Density',
        formula: 'ρ = m / V',
        unit: 'g/cm³',
        variables: [
          { symbol: 'ρ', name: 'Density', unit: 'g/cm³' },
          { symbol: 'm', name: 'Mass', unit: 'g' },
          { symbol: 'V', name: 'Volume', unit: 'cm³' }
        ]
      },
      {
        id: 'concentration',
        name: 'Concentration',
        formula: 'C = n / V',
        unit: 'particles/unit volume',
        variables: [
          { symbol: 'C', name: 'Concentration', unit: '' },
          { symbol: 'n', name: 'Number of particles', unit: '' },
          { symbol: 'V', name: 'Volume', unit: '' }
        ]
      },
      {
        id: 'percentage',
        name: 'Percentage',
        formula: '% = (Part / Whole) × 100',
        unit: '%',
        variables: [
          { symbol: '%', name: 'Percentage', unit: '%' },
          { symbol: 'Part', name: 'Part', unit: '' },
          { symbol: 'Whole', name: 'Whole', unit: '' }
        ]
      }
    ];

    const equationRearrangements: Record<string, Record<string, string>> = {
      speed: { v: 'v = d / t', d: 'd = v × t', t: 't = d / v' },
      pressure: { P: 'P = F / A', F: 'F = P × A', A: 'A = F / P' },
      moment: { M: 'M = F × d', F: 'F = M / d', d: 'd = M / F' },
      density: { ρ: 'ρ = m / V', m: 'm = ρ × V', V: 'V = m / ρ' },
      concentration: { C: 'C = n / V', n: 'n = C × V', V: 'V = n / C' },
      percentage: { '%': '% = (Part / Whole) × 100', 'Part': 'Part = (% × Whole) / 100', 'Whole': 'Whole = (Part / %) × 100' }
    };

    const chemicals = [
      { 
        name: 'Water', 
        formula: 'H₂O', 
        details: 'A vital compound for all known forms of life.', 
        icon: <Droplets size={32} />, 
        color: 'bg-blue-500',
        state: 'liquid',
        composition: [
          { type: 'H', count: 2, color: 'bg-white border-blue-200 text-blue-500' },
          { type: 'O', count: 1, color: 'bg-red-500 text-white' }
        ]
      },
      { 
        name: 'Methane', 
        formula: 'CH₄', 
        details: 'A potent greenhouse gas and the primary component of natural gas.', 
        icon: <Flame size={32} />, 
        color: 'bg-orange-500',
        state: 'gas',
        composition: [
          { type: 'C', count: 1, color: 'bg-gray-800 text-white' },
          { type: 'H', count: 4, color: 'bg-white border-blue-200 text-blue-500' }
        ]
      },
      { 
        name: 'Carbon Dioxide', 
        formula: 'CO₂', 
        details: 'A greenhouse gas found in the atmosphere, essential for photosynthesis.', 
        icon: <Wind size={32} />, 
        color: 'bg-gray-500',
        state: 'gas',
        composition: [
          { type: 'C', count: 1, color: 'bg-gray-800 text-white' },
          { type: 'O', count: 2, color: 'bg-red-500 text-white' }
        ]
      },
      { 
        name: 'Nitrogen', 
        formula: 'N₂', 
        details: 'Makes up about 78% of Earth\'s atmosphere.', 
        icon: <Wind size={32} />, 
        color: 'bg-blue-300',
        state: 'gas',
        composition: [
          { type: 'N', count: 2, color: 'bg-blue-600 text-white' }
        ]
      },
      { 
        name: 'Ammonia', 
        formula: 'NH₃', 
        details: 'A colorless gas with a characteristic pungent smell, used in fertilizers.', 
        icon: <Atom size={32} />, 
        color: 'bg-purple-500',
        state: 'gas',
        composition: [
          { type: 'N', count: 1, color: 'bg-blue-600 text-white' },
          { type: 'H', count: 3, color: 'bg-white border-blue-200 text-blue-500' }
        ]
      },
      { 
        name: 'Oxygen', 
        formula: 'O₂', 
        details: 'Essential for respiration in most living organisms.', 
        icon: <Wind size={32} />, 
        color: 'bg-blue-400',
        state: 'gas',
        composition: [
          { type: 'O', count: 2, color: 'bg-red-500 text-white' }
        ]
      }
    ];

    const MolecularAnimation = ({ state, formula, color }: { state: 'gas' | 'liquid' | 'solid', formula: string, color: string }) => {
      const moleculeCount = state === 'gas' ? 6 : 15;
      const molecules = Array.from({ length: moleculeCount });

      return (
        <div className="relative w-full h-48 bg-gray-900 rounded-2xl overflow-hidden border-2 border-gray-800">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent" />
          {molecules.map((_, i) => (
            <motion.div
              key={i}
              className={`absolute flex items-center justify-center rounded-full text-[10px] font-bold text-white shadow-lg ${color}`}
              style={{
                width: 32,
                height: 32,
                left: `${Math.random() * 80 + 10}%`,
                top: `${Math.random() * 80 + 10}%`,
              }}
              animate={state === 'gas' ? {
                x: [0, Math.random() * 100 - 50, Math.random() * 100 - 50, 0],
                y: [0, Math.random() * 100 - 50, Math.random() * 100 - 50, 0],
                rotate: [0, 360],
              } : {
                x: [0, Math.random() * 20 - 10, Math.random() * 20 - 10, 0],
                y: [0, Math.random() * 10 - 5, Math.random() * 10 - 5, 0],
              }}
              transition={{
                duration: state === 'gas' ? 2 + Math.random() * 2 : 4 + Math.random() * 2,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              {formula}
            </motion.div>
          ))}
          <div className="absolute bottom-2 right-3">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
              State: {state === 'gas' ? 'Gas (g)' : 'Liquid (l)'}
            </span>
          </div>
        </div>
      );
    };

    const SimulationPlayground = () => {
      const [selectedSim, setSelectedSim] = useState<string | null>(null);
      
      // Diffusion State
      const [redLeft, setRedLeft] = useState(20);
      const [blueLeft, setBlueLeft] = useState(5);
      const [redRight, setRedRight] = useState(5);
      const [blueRight, setBlueRight] = useState(20);
      const [isPartitionRemoved, setIsPartitionRemoved] = useState(false);
      const [particles, setParticles] = useState<any[]>([]);

      // Energy Change State
      const [reactionType, setReactionType] = useState<'exothermic' | 'endothermic'>('exothermic');
      const [temp, setTemp] = useState(25);
      const [isEnergySimulating, setIsEnergySimulating] = useState(false);
      const [energyLabMode, setEnergyLabMode] = useState(false);
      const [selectedLabReaction, setSelectedLabReaction] = useState<string | null>(null);

      // Metal Reactivity Equations State
      const [metalEqMode, setMetalEqMode] = useState<'summary' | 'lab' | 'challenge'>('summary');
      const [metalEqMetalIdx, setMetalEqMetalIdx] = useState(0);
      const [metalEqReagentIdx, setMetalEqReagentIdx] = useState(0);
      const [metalEqChallenge, setMetalEqChallenge] = useState<{product: string, metal: string, reagent: string} | null>(null);
      const [metalEqUserMetal, setMetalEqUserMetal] = useState(0);
      const [metalEqUserReagent, setMetalEqUserReagent] = useState(0);
      const [metalEqFeedback, setMetalEqFeedback] = useState<'correct' | 'incorrect' | null>(null);
      const [metalEqIsActive, setMetalEqIsActive] = useState(false);
      const [metalEqProgress, setMetalEqProgress] = useState(0);

      useEffect(() => {
        let interval: any;
        if (metalEqIsActive && metalEqProgress < 100) {
          interval = setInterval(() => {
            setMetalEqProgress(prev => Math.min(100, prev + 2));
          }, 50);
        }
        return () => clearInterval(interval);
      }, [metalEqIsActive, metalEqProgress]);

      const metalEqMetals = [
        { id: 'K', name: 'Potassium', reactivity: 11 },
        { id: 'Na', name: 'Sodium', reactivity: 10 },
        { id: 'Ca', name: 'Calcium', reactivity: 9 },
        { id: 'Mg', name: 'Magnesium', reactivity: 8 },
        { id: 'Al', name: 'Aluminium', reactivity: 7 },
        { id: 'Zn', name: 'Zinc', reactivity: 6 },
        { id: 'Fe', name: 'Iron', reactivity: 5 },
        { id: 'Pb', name: 'Lead', reactivity: 4 },
        { id: 'Cu', name: 'Copper', reactivity: 3 },
        { id: 'Ag', name: 'Silver', reactivity: 2 },
        { id: 'Au', name: 'Gold', reactivity: 1 }
      ];

      const metalEqReagents = [
        { id: 'oxygen', name: 'Oxygen', limit: 8 }, // Cu is index 8
        { id: 'water', name: 'Water (Cold/Hot)', limit: 2 }, // Ca is index 2
        { id: 'steam', name: 'Steam', limit: 6 }, // Fe is index 6
        { id: 'acid', name: 'Dilute Acid', limit: 7 } // Pb is index 7
      ];

      const canReact = (mIdx: number, rId: string) => {
        if (rId === 'oxygen') return mIdx <= 8;
        if (rId === 'water') return mIdx <= 2;
        if (rId === 'steam') return mIdx <= 6;
        if (rId === 'acid') return mIdx <= 7;
        return false;
      };

      const generateChallenge = () => {
        const mIdx = Math.floor(Math.random() * metalEqMetals.length);
        const rIdx = Math.floor(Math.random() * metalEqReagents.length);
        const metal = metalEqMetals[mIdx];
        const reagent = metalEqReagents[rIdx];
        
        let product = 'No Reaction';
        if (canReact(mIdx, reagent.id)) {
          if (reagent.id === 'oxygen') product = `${metal.name} Oxide`;
          if (reagent.id === 'water') product = `${metal.name} Hydroxide + Hydrogen`;
          if (reagent.id === 'steam') product = `${metal.name} Oxide + Hydrogen`;
          if (reagent.id === 'acid') product = `${metal.name} Salt + Hydrogen`;
        }

        setMetalEqChallenge({ product, metal: metal.id, reagent: reagent.id });
        setMetalEqFeedback(null);
      };

      // Metal Reactivity State
      const [metalSimMode, setMetalSimMode] = useState<'compare' | 'experiment'>('compare');
      const [metalSimReagent, setMetalSimReagent] = useState<'oxygen' | 'water' | 'acid'>('oxygen');
      const [metalSimSelected, setMetalSimSelected] = useState<string[]>(['K', 'Mg']);
      const [metalSimWaterTemp, setMetalSimWaterTemp] = useState<'cold' | 'hot' | 'steam'>('cold');
      const [metalSimAcidType, setMetalSimAcidType] = useState<'HCl' | 'H2SO4' | 'CH3COOH'>('HCl');
      const [metalSimIsActive, setMetalSimIsActive] = useState(false);
      const [metalSimProgress, setMetalSimProgress] = useState(0);
      const [experimentMetals, setExperimentMetals] = useState<{id: string, name: string, reactivity: number}[]>([]);
      const [experimentResults, setExperimentResults] = useState<Record<string, any>>({});
      const [userGuessOrder, setUserGuessOrder] = useState<string[]>(['A', 'B', 'C']);

      const metals = [
        { id: 'K', name: 'Potassium', reactivity: 11, color: 'bg-yellow-400' },
        { id: 'Na', name: 'Sodium', reactivity: 10, color: 'bg-yellow-400' },
        { id: 'Ca', name: 'Calcium', reactivity: 9, color: 'bg-yellow-400' },
        { id: 'Mg', name: 'Magnesium', reactivity: 8, color: 'bg-yellow-400' },
        { id: 'Al', name: 'Aluminium', reactivity: 7, color: 'bg-yellow-400' },
        { id: 'Zn', name: 'Zinc', reactivity: 6, color: 'bg-yellow-400' },
        { id: 'Fe', name: 'Iron', reactivity: 5, color: 'bg-yellow-400' },
        { id: 'Pb', name: 'Lead', reactivity: 4, color: 'bg-yellow-400' },
        { id: 'Cu', name: 'Copper', reactivity: 3, color: 'bg-yellow-400' },
        { id: 'Ag', name: 'Silver', reactivity: 2, color: 'bg-yellow-400' },
        { id: 'Au', name: 'Gold', reactivity: 1, color: 'bg-yellow-400' }
      ];

      const getActualEquation = (mId: string, rId: string, waterTemp?: string, acidType?: string) => {
        const metal = metals.find(m => m.id === mId);
        if (!metal) return "";
        
        const m = metal.id;
        const name = metal.name;

        // Check reactivity limits
        let canReact = false;
        const mIdx = metals.findIndex(met => met.id === mId);
        if (rId === 'oxygen') canReact = mIdx <= 8; // K to Cu
        if (rId === 'water') canReact = mIdx <= 2; // K to Ca
        if (rId === 'steam') canReact = mIdx <= 6; // K to Fe
        if (rId === 'acid') canReact = mIdx <= 7; // K to Pb

        if (!canReact) return "No Reaction";

        if (rId === 'oxygen') {
          if (m === 'K') return "4K + O₂ → 2K₂O";
          if (m === 'Na') return "4Na + O₂ → 2Na₂O";
          if (m === 'Ca') return "2Ca + O₂ → 2CaO";
          if (m === 'Mg') return "2Mg + O₂ → 2MgO";
          if (m === 'Al') return "4Al + 3O₂ → 2Al₂O₃";
          if (m === 'Zn') return "2Zn + O₂ → 2ZnO";
          if (m === 'Fe') return "4Fe + 3O₂ → 2Fe₂O₃";
          if (m === 'Pb') return "2Pb + O₂ → 2PbO";
          if (m === 'Cu') return "2Cu + O₂ → 2CuO";
        }

        if (rId === 'water') {
          if (m === 'K') return "2K + 2H₂O → 2KOH + H₂";
          if (m === 'Na') return "2Na + 2H₂O → 2NaOH + H₂";
          if (m === 'Ca') return "Ca + 2H₂O → Ca(OH)₂ + H₂";
        }

        if (rId === 'steam') {
          if (m === 'K') return "2K + 2H₂O(g) → 2KOH + H₂";
          if (m === 'Na') return "2Na + 2H₂O(g) → 2NaOH + H₂";
          if (m === 'Ca') return "Ca + 2H₂O(g) → Ca(OH)₂ + H₂";
          if (m === 'Mg') return "Mg + H₂O(g) → MgO + H₂";
          if (m === 'Al') return "2Al + 3H₂O(g) → Al₂O₃ + 3H₂";
          if (m === 'Zn') return "Zn + H₂O(g) → ZnO + H₂";
          if (m === 'Fe') return "3Fe + 4H₂O(g) → Fe₃O₄ + 4H₂";
        }

        if (rId === 'acid') {
          const acid = acidType === 'HCl' ? 'HCl' : acidType === 'H2SO4' ? 'H₂SO₄' : 'CH₃COOH';
          const saltSuffix = acidType === 'HCl' ? 'Cl' : acidType === 'H2SO4' ? 'SO₄' : '(CH₃COO)';
          
          if (acidType === 'HCl') {
            if (m === 'K') return "2K + 2HCl → 2KCl + H₂";
            if (m === 'Na') return "2Na + 2HCl → 2NaCl + H₂";
            if (m === 'Ca') return "Ca + 2HCl → CaCl₂ + H₂";
            if (m === 'Mg') return "Mg + 2HCl → MgCl₂ + H₂";
            if (m === 'Al') return "2Al + 6HCl → 2AlCl₃ + 3H₂";
            if (m === 'Zn') return "Zn + 2HCl → ZnCl₂ + H₂";
            if (m === 'Fe') return "Fe + 2HCl → FeCl₂ + H₂";
            if (m === 'Pb') return "Pb + 2HCl → PbCl₂ + H₂";
          }
          if (acidType === 'H2SO4') {
            if (m === 'K') return "2K + H₂SO₄ → K₂SO₄ + H₂";
            if (m === 'Na') return "2Na + H₂SO₄ → Na₂SO₄ + H₂";
            if (m === 'Ca') return "Ca + H₂SO₄ → CaSO₄ + H₂";
            if (m === 'Mg') return "Mg + H₂SO₄ → MgSO₄ + H₂";
            if (m === 'Al') return "2Al + 3H₂SO₄ → Al₂(SO₄)₃ + 3H₂";
            if (m === 'Zn') return "Zn + H₂SO₄ → ZnSO₄ + H₂";
            if (m === 'Fe') return "Fe + H₂SO₄ → FeSO₄ + H₂";
            if (m === 'Pb') return "Pb + H₂SO₄ → PbSO₄ + H₂";
          }
          if (acidType === 'CH3COOH') {
            if (m === 'K') return "2K + 2CH₃COOH → 2CH₃COOK + H₂";
            if (m === 'Na') return "2Na + 2CH₃COOH → 2CH₃COONa + H₂";
            if (m === 'Ca') return "Ca + 2CH₃COOH → (CH₃COO)₂Ca + H₂";
            if (m === 'Mg') return "Mg + 2CH₃COOH → (CH₃COO)₂Mg + H₂";
            if (m === 'Al') return "2Al + 6CH₃COOH → 2(CH₃COO)₃Al + 3H₂";
            if (m === 'Zn') return "Zn + 2CH₃COOH → (CH₃COO)₂Zn + H₂";
            if (m === 'Fe') return "Fe + 2CH₃COOH → (CH₃COO)₂Fe + H₂";
            if (m === 'Pb') return "Pb + 2CH₃COOH → (CH₃COO)₂Pb + H₂";
          }
        }

        return "";
      };

      const initExperiment = () => {
        const shuffled = [...metals].sort(() => 0.5 - Math.random()).slice(0, 3);
        setExperimentMetals(shuffled.map((m, i) => ({ ...m, label: String.fromCharCode(65 + i) })));
        setExperimentResults({});
        setUserGuessOrder(['A', 'B', 'C']);
        setMetalSimProgress(0);
        setMetalSimIsActive(false);
      };

      useEffect(() => {
        if (selectedSim === 'metal-reactivity' && metalSimMode === 'experiment' && experimentMetals.length === 0) {
          initExperiment();
        }
      }, [selectedSim, metalSimMode]);

      useEffect(() => {
        if (!metalSimIsActive || selectedSim !== 'metal-reactivity') return;

        const interval = setInterval(() => {
          setMetalSimProgress(prev => {
            if (prev >= 100) {
              setMetalSimIsActive(false);
              return 100;
            }
            return prev + 1;
          });
        }, 50);

        return () => clearInterval(interval);
      }, [metalSimIsActive, selectedSim]);

      const labReactions = [
        { id: 'ammonium-nitrate', name: 'Ammonium Nitrate + Water', type: 'endothermic', targetTemp: 12, description: 'Dissolving ammonium nitrate in water absorbs heat.', icon: <Droplets size={20} className="text-blue-500" /> },
        { id: 'neutralization', name: 'Neutralization (Acid + Base)', type: 'exothermic', targetTemp: 45, description: 'The reaction between HCl and NaOH releases heat.', icon: <Flame size={20} className="text-orange-500" /> },
        { id: 'magnesium-acid', name: 'Magnesium + Hydrochloric Acid', type: 'exothermic', targetTemp: 55, description: 'Metal reacting with acid is typically exothermic.', icon: <Zap size={20} className="text-yellow-500" /> },
        { id: 'citric-bicarb', name: 'Citric Acid + Sodium Bicarbonate', type: 'endothermic', targetTemp: 15, description: 'This reaction absorbs heat from the surroundings.', icon: <Wind size={20} className="text-blue-300" /> }
      ];
      
      const simRef = useRef<HTMLDivElement>(null);

      const initParticles = () => {
        const newParticles = [];
        // Left side
        for (let i = 0; i < redLeft; i++) newParticles.push({ id: `rl-${i}`, type: 'red', x: Math.random() * 45, y: Math.random() * 90, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2 });
        for (let i = 0; i < blueLeft; i++) newParticles.push({ id: `bl-${i}`, type: 'blue', x: Math.random() * 45, y: Math.random() * 90, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2 });
        // Right side
        for (let i = 0; i < redRight; i++) newParticles.push({ id: `rr-${i}`, type: 'red', x: 55 + Math.random() * 40, y: Math.random() * 90, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2 });
        for (let i = 0; i < blueRight; i++) newParticles.push({ id: `br-${i}`, type: 'blue', x: 55 + Math.random() * 40, y: Math.random() * 90, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2 });
        setParticles(newParticles);
      };

      useEffect(() => {
        if (selectedSim === 'diffusion') initParticles();
      }, [selectedSim, redLeft, blueLeft, redRight, blueRight]);

      useEffect(() => {
        if (!isPartitionRemoved || selectedSim !== 'diffusion') return;

        const interval = setInterval(() => {
          setParticles(prev => prev.map(p => {
            let nx = p.x + p.vx;
            let ny = p.y + p.vy;
            let nvx = p.vx;
            let nvy = p.vy;

            if (nx < 0 || nx > 98) nvx *= -1;
            if (ny < 0 || ny > 98) nvy *= -1;

            return { ...p, x: nx, y: ny, vx: nvx, vy: nvy };
          }));
        }, 30);

        return () => clearInterval(interval);
      }, [isPartitionRemoved, selectedSim]);

      useEffect(() => {
        if (!isEnergySimulating || selectedSim !== 'energy-change') return;

        let targetTemp = reactionType === 'exothermic' ? 60 : 10;
        if (energyLabMode && selectedLabReaction) {
          const reaction = labReactions.find(r => r.id === selectedLabReaction);
          if (reaction) targetTemp = reaction.targetTemp;
        }

        const interval = setInterval(() => {
          setTemp(prev => {
            if (prev < targetTemp) {
              const next = +(prev + 0.2).toFixed(1);
              return next > targetTemp ? targetTemp : next;
            } else if (prev > targetTemp) {
              const next = +(prev - 0.2).toFixed(1);
              return next < targetTemp ? targetTemp : next;
            }
            return prev;
          });
        }, 50);

        return () => clearInterval(interval);
      }, [isEnergySimulating, reactionType, selectedSim, energyLabMode, selectedLabReaction]);

      const counts = useMemo(() => {
        const left = particles.filter(p => p.x < 50);
        const right = particles.filter(p => p.x >= 50);
        return {
          leftRed: left.filter(p => p.type === 'red').length,
          leftBlue: left.filter(p => p.type === 'blue').length,
          rightRed: right.filter(p => p.type === 'red').length,
          rightBlue: right.filter(p => p.type === 'blue').length,
        };
      }, [particles]);

      const netDiffusion = useMemo(() => {
        if (!isPartitionRemoved) return null;
        const redDiff = counts.leftRed - counts.rightRed;
        const blueDiff = counts.leftBlue - counts.rightBlue;
        
        if (Math.abs(redDiff) < 2 && Math.abs(blueDiff) < 2) return 'equilibrium';
        
        let msg = '';
        if (Math.abs(redDiff) >= 2) msg += `Red diffusing ${redDiff > 0 ? 'Right' : 'Left'}. `;
        if (Math.abs(blueDiff) >= 2) msg += `Blue diffusing ${blueDiff > 0 ? 'Right' : 'Left'}.`;
        return msg;
      }, [counts, isPartitionRemoved]);

      return (
        <div className="space-y-8">
          {!selectedSim ? (
            <div className="grid grid-cols-1 gap-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedSim('diffusion')}
                className="bg-white border-2 border-gray-200 p-8 rounded-3xl flex items-center gap-6 shadow-[0_6px_0_0_#e5e7eb] hover:border-orange-400 transition-all group"
              >
                <div className="bg-orange-100 text-orange-600 p-5 rounded-2xl group-hover:bg-orange-500 group-hover:text-white transition-colors">
                  <ArrowRightLeft size={40} />
                </div>
                <div className="text-left">
                  <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Diffusion Simulation</h3>
                  <p className="text-gray-500 font-medium">Observe how particles move from high to low concentration.</p>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedSim('energy-change')}
                className="bg-white border-2 border-gray-200 p-8 rounded-3xl flex items-center gap-6 shadow-[0_6px_0_0_#e5e7eb] hover:border-red-400 transition-all group"
              >
                <div className="bg-red-100 text-red-600 p-5 rounded-2xl group-hover:bg-red-500 group-hover:text-white transition-colors">
                  <Flame size={40} />
                </div>
                <div className="text-left">
                  <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Energy Change</h3>
                  <p className="text-gray-500 font-medium">Investigate exothermic and endothermic reactions.</p>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedSim('metal-reactivity')}
                className="bg-white border-2 border-gray-200 p-8 rounded-3xl flex items-center gap-6 shadow-[0_6px_0_0_#e5e7eb] hover:border-yellow-400 transition-all group"
              >
                <div className="bg-yellow-100 text-yellow-600 p-5 rounded-2xl group-hover:bg-yellow-500 group-hover:text-white transition-colors">
                  <Zap size={40} />
                </div>
                <div className="text-left">
                  <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Metal Reactivity</h3>
                  <p className="text-gray-500 font-medium">Compare how different metals react with oxygen, water, and acids.</p>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedSim('metal-equations')}
                className="bg-white border-2 border-gray-200 p-8 rounded-3xl flex items-center gap-6 shadow-[0_6px_0_0_#e5e7eb] hover:border-blue-400 transition-all group"
              >
                <div className="bg-blue-100 text-blue-600 p-5 rounded-2xl group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <BookOpen size={40} />
                </div>
                <div className="text-left">
                  <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Metal Reactivity: Equations</h3>
                  <p className="text-gray-500 font-medium">Learn word equations and experiment setups for metal reactions.</p>
                </div>
              </motion.button>


            </div>
          ) : (
            <div className="space-y-6">
              {selectedSim === 'diffusion' && (
                <div className="bg-white border-2 border-gray-200 p-8 rounded-3xl shadow-[0_6px_0_0_#e5e7eb]">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Diffusion Chamber</h3>
                      <p className="text-orange-500 font-black text-xl uppercase tracking-widest text-xs">Concentration Gradient</p>
                    </div>
                    <div className="bg-orange-100 text-orange-600 p-4 rounded-2xl">
                      <ArrowRightLeft size={32} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 mb-8">
                    <div className="space-y-4">
                      <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest">Left Side Setup</h4>
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-red-500 uppercase">Red Particles: {redLeft}</label>
                        <input type="range" min="0" max="50" value={redLeft} onChange={e => setRedLeft(parseInt(e.target.value))} disabled={isPartitionRemoved} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-500" />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-blue-500 uppercase">Blue Particles: {blueLeft}</label>
                        <input type="range" min="0" max="50" value={blueLeft} onChange={e => setBlueLeft(parseInt(e.target.value))} disabled={isPartitionRemoved} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest">Right Side Setup</h4>
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-red-500 uppercase">Red Particles: {redRight}</label>
                        <input type="range" min="0" max="50" value={redRight} onChange={e => setRedRight(parseInt(e.target.value))} disabled={isPartitionRemoved} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-500" />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-blue-500 uppercase">Blue Particles: {blueRight}</label>
                        <input type="range" min="0" max="50" value={blueRight} onChange={e => setBlueRight(parseInt(e.target.value))} disabled={isPartitionRemoved} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                      </div>
                    </div>
                  </div>

                  <div className="relative h-64 bg-gray-900 rounded-2xl overflow-hidden border-4 border-gray-200 mb-8" ref={simRef}>
                    {particles.map(p => (
                      <motion.div
                        key={p.id}
                        className={`absolute w-3 h-3 rounded-full ${p.type === 'red' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]'}`}
                        style={{ left: `${p.x}%`, top: `${p.y}%` }}
                      />
                    ))}
                    {!isPartitionRemoved && (
                      <div className="absolute inset-y-0 left-1/2 w-1 bg-white/30 backdrop-blur-sm -translate-x-1/2 z-10" />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-100 text-center">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Left Side</p>
                      <div className="flex justify-center gap-4">
                        <span className="text-red-500 font-black">R: {counts.leftRed}</span>
                        <span className="text-blue-500 font-black">B: {counts.leftBlue}</span>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-100 text-center">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Right Side</p>
                      <div className="flex justify-center gap-4">
                        <span className="text-red-500 font-black">R: {counts.rightRed}</span>
                        <span className="text-blue-500 font-black">B: {counts.rightBlue}</span>
                      </div>
                    </div>
                  </div>

                  {isPartitionRemoved && (
                    <div className={`p-4 rounded-xl mb-8 text-center font-black uppercase tracking-tight ${netDiffusion === 'equilibrium' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                      {netDiffusion === 'equilibrium' ? (
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle2 size={20} />
                          Dynamic Equilibrium Reached: No Net Diffusion
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw size={20} className="animate-spin" />
                          {netDiffusion}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-4">
                    {!isPartitionRemoved ? (
                      <button
                        onClick={() => setIsPartitionRemoved(true)}
                        className="flex-1 bg-orange-500 text-white py-4 rounded-2xl font-black text-xl uppercase tracking-widest shadow-[0_6px_0_0_#c2410c] active:shadow-none active:translate-y-1 transition-all"
                      >
                        Remove Partition
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setIsPartitionRemoved(false);
                          initParticles();
                        }}
                        className="flex-1 bg-gray-200 text-gray-500 py-4 rounded-2xl font-black text-xl uppercase tracking-widest hover:bg-gray-300 transition-all"
                      >
                        Reset Simulation
                      </button>
                    )}
                  </div>
                </div>
              )}

              {selectedSim === 'energy-change' && (
                <div className="bg-white border-2 border-gray-200 p-8 rounded-3xl shadow-[0_6px_0_0_#e5e7eb]">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Energy Change Simulation</h3>
                      <p className="text-red-500 font-black text-xl uppercase tracking-widest text-xs">Thermodynamics</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setEnergyLabMode(!energyLabMode);
                          setIsEnergySimulating(false);
                          setTemp(25);
                          setSelectedLabReaction(null);
                        }}
                        className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${energyLabMode ? 'bg-purple-500 text-white shadow-[0_4px_0_0_#7e22ce]' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                      >
                        {energyLabMode ? 'Exit Lab' : 'Lab Mode'}
                      </button>
                      <div className="bg-red-100 text-red-600 p-4 rounded-2xl">
                        <Flame size={32} />
                      </div>
                    </div>
                  </div>

                  {!energyLabMode ? (
                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <button
                        onClick={() => {
                          setReactionType('exothermic');
                          setIsEnergySimulating(false);
                          setTemp(25);
                        }}
                        className={`p-4 rounded-2xl border-2 font-black uppercase transition-all ${reactionType === 'exothermic' ? 'border-red-500 bg-red-50 text-red-600 shadow-[0_4px_0_0_#ef4444]' : 'border-gray-100 text-gray-400'}`}
                      >
                        Exothermic
                      </button>
                      <button
                        onClick={() => {
                          setReactionType('endothermic');
                          setIsEnergySimulating(false);
                          setTemp(25);
                        }}
                        className={`p-4 rounded-2xl border-2 font-black uppercase transition-all ${reactionType === 'endothermic' ? 'border-blue-500 bg-blue-50 text-blue-600 shadow-[0_4px_0_0_#3b82f6]' : 'border-gray-100 text-gray-400'}`}
                      >
                        Endothermic
                      </button>
                    </div>
                  ) : (
                    <div className="mb-8">
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Select Lab Experiment</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {labReactions.map(r => (
                          <button
                            key={r.id}
                            onClick={() => {
                              setSelectedLabReaction(r.id);
                              setReactionType(r.type as any);
                              setIsEnergySimulating(false);
                              setTemp(25);
                            }}
                            className={`p-4 text-left rounded-2xl border-2 transition-all flex items-center gap-4 ${selectedLabReaction === r.id ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-[0_4px_0_0_#a855f7]' : 'border-gray-100 text-gray-500 hover:bg-gray-50 shadow-[0_4px_0_0_#f3f4f6]'}`}
                          >
                            <div className={`p-2.5 rounded-xl ${selectedLabReaction === r.id ? 'bg-white shadow-sm' : 'bg-gray-50'}`}>
                              {r.icon}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-black text-sm uppercase leading-tight">{r.name}</h4>
                              <span className={`text-[10px] font-black uppercase tracking-widest ${r.type === 'exothermic' ? 'text-red-400' : 'text-blue-400'}`}>{r.type}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                      {selectedLabReaction && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-4 p-4 bg-purple-50 border-2 border-purple-100 rounded-2xl"
                        >
                          <div className="flex items-start gap-3">
                            <Info size={18} className="text-purple-500 mt-0.5" />
                            <p className="text-sm text-purple-700 font-medium">
                              {labReactions.find(r => r.id === selectedLabReaction)?.description}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}

                  <div className="relative h-80 bg-gray-50 rounded-3xl border-4 border-gray-200 overflow-hidden mb-8 flex items-center justify-center">
                    {/* Beaker */}
                    <div className="relative w-64 h-64 border-x-4 border-b-4 border-gray-300 rounded-b-3xl bg-white/50 flex flex-col items-center justify-end pb-8">
                      <div className={`absolute inset-x-0 bottom-0 rounded-b-2xl transition-all duration-1000 ${reactionType === 'exothermic' ? 'bg-red-100 h-4/5' : 'bg-blue-100 h-4/5'}`} />
                      
                      <div className="z-10 text-center">
                        <h4 className={`text-2xl font-black uppercase tracking-tighter ${reactionType === 'exothermic' ? 'text-red-500' : 'text-blue-500'}`}>
                          {reactionType} reaction
                        </h4>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                          {reactionType === 'exothermic' 
                            ? "Heat is released, temperature increases" 
                            : "Heat is absorbed, temperature decreases"}
                        </p>
                      </div>

                      {/* Pouring Animation for Lab Mode */}
                      <AnimatePresence>
                        {isEnergySimulating && energyLabMode && (
                          <motion.div
                            initial={{ opacity: 0, y: -50, rotate: -45 }}
                            animate={{ opacity: [0, 1, 1, 0], y: [-50, -20, -20, -50], rotate: [-45, -90, -90, -45] }}
                            transition={{ duration: 2, times: [0, 0.2, 0.8, 1] }}
                            className="absolute top-0 right-10 z-40 text-purple-500"
                          >
                            <FlaskConical size={40} />
                            <motion.div 
                              initial={{ height: 0 }}
                              animate={{ height: [0, 40, 40, 0] }}
                              transition={{ duration: 2, times: [0, 0.2, 0.8, 1] }}
                              className="absolute top-full left-1/2 -translate-x-1/2 w-2 bg-purple-300/50 rounded-full"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Thermometer */}
                      <div className="absolute left-6 top-4 w-8 h-48 bg-gray-200 rounded-full border-2 border-gray-300 z-20 flex flex-col items-center justify-end p-1">
                        <div className="w-full bg-white rounded-full flex-1 mb-1 relative overflow-hidden">
                          <motion.div 
                            className={`absolute bottom-0 w-full ${reactionType === 'exothermic' ? 'bg-red-500' : 'bg-blue-500'}`}
                            animate={{ height: `${(temp / 100) * 100}%` }}
                            transition={{ type: 'spring', stiffness: 50 }}
                          />
                        </div>
                        <div className={`w-6 h-6 rounded-full ${reactionType === 'exothermic' ? 'bg-red-500' : 'bg-blue-500'} border-2 border-gray-300`} />
                      </div>

                      {/* Temperature Readout */}
                      <div className="absolute top-4 right-4 bg-white border-2 border-gray-200 px-3 py-1 rounded-xl shadow-sm z-30">
                        <span className="text-xl font-black text-gray-800">{temp}°C</span>
                      </div>

                      {/* Heat Transfer Arrows */}
                      <AnimatePresence>
                        {isEnergySimulating && (
                          <>
                            {reactionType === 'exothermic' ? (
                              // Outward arrows
                              [0, 45, 135, 180, 225, 315].map(angle => (
                                <motion.div
                                  key={`exo-${angle}`}
                                  initial={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
                                  animate={{ 
                                    opacity: [0, 1, 0],
                                    x: Math.cos(angle * Math.PI / 180) * 100,
                                    y: Math.sin(angle * Math.PI / 180) * 100
                                  }}
                                  transition={{ duration: 1.5, repeat: Infinity, delay: angle / 360 }}
                                  className="absolute text-orange-500 z-30"
                                >
                                  <ArrowRight style={{ transform: `rotate(${angle}deg)` }} />
                                </motion.div>
                              ))
                            ) : (
                              // Inward arrows
                              [0, 45, 135, 180, 225, 315].map(angle => (
                                <motion.div
                                  key={`endo-${angle}`}
                                  initial={{ 
                                    opacity: 0,
                                    x: Math.cos(angle * Math.PI / 180) * 120,
                                    y: Math.sin(angle * Math.PI / 180) * 120
                                  }}
                                  animate={{ 
                                    opacity: [0, 1, 0],
                                    x: 0,
                                    y: 0
                                  }}
                                  transition={{ duration: 1.5, repeat: Infinity, delay: angle / 360 }}
                                  className="absolute text-orange-500 z-30"
                                >
                                  <ArrowRight style={{ transform: `rotate(${angle + 180}deg)` }} />
                                </motion.div>
                              ))
                            )}
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    {!isEnergySimulating ? (
                      <button
                        onClick={() => setIsEnergySimulating(true)}
                        disabled={energyLabMode && !selectedLabReaction}
                        className={`flex-1 py-4 rounded-2xl font-black text-xl uppercase tracking-widest transition-all ${energyLabMode && !selectedLabReaction ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-emerald-500 text-white shadow-[0_6px_0_0_#059669] active:shadow-none active:translate-y-1'}`}
                      >
                        {energyLabMode ? 'Add Chemicals & Start' : 'Start Simulation'}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setIsEnergySimulating(false);
                          setTemp(25);
                        }}
                        className="flex-1 bg-gray-200 text-gray-500 py-4 rounded-2xl font-black text-xl uppercase tracking-widest hover:bg-gray-300 transition-all"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              )}

              {selectedSim === 'metal-reactivity' && (
                <div className="bg-white border-2 border-gray-200 p-8 rounded-3xl shadow-[0_6px_0_0_#e5e7eb]">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Metal Reactivity Simulation</h3>
                      <p className="text-yellow-500 font-black text-xl uppercase tracking-widest text-xs">Reactivity Series</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setMetalSimMode(metalSimMode === 'compare' ? 'experiment' : 'compare');
                          setMetalSimIsActive(false);
                          setMetalSimProgress(0);
                        }}
                        className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${
                          metalSimMode === 'experiment' 
                            ? 'bg-purple-600 text-white shadow-[0_4px_0_0_#4c1d95] active:shadow-none active:translate-y-1' 
                            : 'bg-white border-2 border-purple-100 text-purple-600 hover:bg-purple-50 shadow-[0_4px_0_0_#f3e8ff]'
                        }`}
                      >
                        <FlaskConical size={16} />
                        {metalSimMode === 'experiment' ? 'Exit Lab' : 'Lab'}
                      </button>
                      <div className="bg-yellow-100 text-yellow-600 p-4 rounded-2xl">
                        <Zap size={32} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-8">
                    {['oxygen', 'water', 'acid'].map(r => (
                      <button
                        key={r}
                        onClick={() => {
                          setMetalSimReagent(r as any);
                          setMetalSimIsActive(false);
                          setMetalSimProgress(0);
                        }}
                        className={`p-3 rounded-xl border-2 font-black uppercase text-xs transition-all ${metalSimReagent === r ? 'border-yellow-500 bg-yellow-50 text-yellow-600 shadow-[0_4px_0_0_#eab308]' : 'border-gray-100 text-gray-400'}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>

                  {metalSimReagent === 'water' && (
                    <div className="flex gap-2 mb-8">
                      {['cold', 'hot', 'steam'].map(t => (
                        <button
                          key={t}
                          onClick={() => {
                            setMetalSimWaterTemp(t as any);
                            setMetalSimIsActive(false);
                            setMetalSimProgress(0);
                          }}
                          className={`flex-1 p-2 rounded-lg border-2 font-bold text-[10px] uppercase transition-all ${metalSimWaterTemp === t ? 'border-blue-400 bg-blue-50 text-blue-600' : 'border-gray-100 text-gray-400'}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}

                  {metalSimReagent === 'acid' && (
                    <div className="flex gap-2 mb-8">
                      {['HCl', 'H2SO4', 'CH3COOH'].map(a => (
                        <button
                          key={a}
                          onClick={() => {
                            setMetalSimAcidType(a as any);
                            setMetalSimIsActive(false);
                            setMetalSimProgress(0);
                          }}
                          className={`flex-1 p-2 rounded-lg border-2 font-bold text-[10px] uppercase transition-all ${metalSimAcidType === a ? 'border-emerald-400 bg-emerald-50 text-emerald-600' : 'border-gray-100 text-gray-400'}`}
                        >
                          {a === 'HCl' ? 'Hydrochloric' : a === 'H2SO4' ? 'Sulfuric' : 'Ethanoic'}
                        </button>
                      ))}
                    </div>
                  )}

                  {metalSimMode === 'compare' ? (
                    <div className="grid grid-cols-2 gap-8 mb-8">
                      {[0, 1].map(i => (
                        <div key={i} className="space-y-4">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Metal {i + 1}</label>
                            <span className="text-sm font-black text-yellow-600 uppercase">{metals.find(m => m.id === metalSimSelected[i])?.name}</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max={metals.length - 1} 
                            value={metals.findIndex(m => m.id === metalSimSelected[i])}
                            onChange={(e) => {
                              const newSelected = [...metalSimSelected];
                              newSelected[i] = metals[parseInt(e.target.value)].id;
                              setMetalSimSelected(newSelected);
                              setMetalSimIsActive(false);
                              setMetalSimProgress(0);
                            }}
                            className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                          />
                          <div className="flex justify-between text-[8px] font-black text-gray-300 uppercase">
                            <span>Most Reactive</span>
                            <span>Least Reactive</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mb-8 p-4 bg-purple-50 rounded-2xl border-2 border-purple-100 text-center">
                      <h4 className="font-black text-purple-700 uppercase mb-1">Lab</h4>
                      <p className="text-xs text-purple-600 font-medium">Test metals A, B, and C to find their reactivity order!</p>
                      <button 
                        onClick={initExperiment}
                        className="mt-3 text-[10px] font-black text-purple-500 uppercase hover:text-purple-700 flex items-center justify-center gap-1 mx-auto"
                      >
                        <RefreshCw size={12} /> New Metals
                      </button>
                    </div>
                  )}

                  <div className="relative h-64 bg-gray-50 rounded-3xl border-4 border-gray-200 overflow-hidden mb-8 flex items-center justify-around p-4">
                    {(metalSimMode === 'compare' ? metalSimSelected : experimentMetals).map((mIdOrObj, idx) => {
                      const metal = typeof mIdOrObj === 'string' ? metals.find(m => m.id === mIdOrObj)! : mIdOrObj;
                      const label = typeof mIdOrObj === 'string' ? metal.name : (mIdOrObj as any).label;
                      
                      // Calculate reaction intensity
                      let intensity = 0;
                      if (metalSimReagent === 'oxygen') {
                        intensity = metal.reactivity >= 3 ? (metal.reactivity - 2) * 0.1 : 0;
                      } else if (metalSimReagent === 'water') {
                        if (metalSimWaterTemp === 'cold') {
                          intensity = metal.reactivity >= 9 ? (metal.reactivity - 8) * 0.3 : 0;
                        } else if (metalSimWaterTemp === 'hot') {
                          intensity = metal.reactivity >= 9 ? (metal.reactivity - 8) * 0.5 : 0;
                        } else { // steam
                          intensity = metal.reactivity >= 5 ? (metal.reactivity - 4) * 0.2 : 0;
                        }
                      } else { // acid
                        const acidStrength = metalSimAcidType === 'CH3COOH' ? 0.4 : 1;
                        intensity = metal.reactivity >= 4 ? (metal.reactivity - 3) * 0.2 * acidStrength : 0;
                      }

                      const currentProgress = metalSimIsActive ? Math.min(100, metalSimProgress * intensity * 2) : 0;

                      return (
                        <div key={idx} className="flex flex-col items-center gap-4 flex-1">
                          <span className="text-xs font-black text-gray-400 uppercase">{label}</span>
                          
                          <div className="relative w-24 h-32 flex flex-col items-center justify-end">
                            {/* Reagent Container */}
                            {(metalSimReagent === 'water' || metalSimReagent === 'acid') && (
                              <div className={`absolute inset-0 border-x-2 border-b-2 border-gray-300 rounded-b-xl ${metalSimReagent === 'water' ? 'bg-blue-50/50' : 'bg-red-50/50'}`}>
                                <div className={`absolute inset-x-0 bottom-0 h-4/5 ${metalSimReagent === 'water' ? 'bg-blue-100/60' : 'bg-red-100/60'} rounded-b-lg`} />
                                
                                {/* Bubbles */}
                                {metalSimIsActive && intensity > 0 && (
                                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                    {[...Array(Math.floor(intensity * 15))].map((_, bi) => (
                                      <motion.div
                                        key={bi}
                                        initial={{ y: 100, opacity: 0, x: Math.random() * 80 + 10 }}
                                        animate={{ y: -20, opacity: [0, 1, 0] }}
                                        transition={{ 
                                          duration: 1 / (intensity + 0.1), 
                                          repeat: Infinity, 
                                          delay: Math.random() * 2,
                                          ease: "linear"
                                        }}
                                        className={`absolute w-1.5 h-1.5 bg-white rounded-full border ${metalSimReagent === 'water' ? 'border-blue-200' : 'border-red-200'}`}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Metal Block */}
                            <div className="relative w-16 h-16 bg-yellow-400 border-2 border-yellow-500 rounded-lg z-10 overflow-hidden">
                              {metalSimReagent === 'oxygen' && (
                                <motion.div 
                                  className="absolute inset-0 bg-gray-400"
                                  animate={{ opacity: currentProgress / 100 }}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Word Equation */}
                  <div className="bg-gray-900 p-6 rounded-3xl mb-8 text-center shadow-xl">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">Chemical Equations</p>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">General Equation</p>
                        <p className="text-white font-bold text-sm">
                          {metalSimReagent === 'oxygen' && "Metal + Oxygen → Metal Oxide"}
                          {metalSimReagent === 'water' && (
                            metalSimWaterTemp === 'steam' 
                              ? "Metal + Steam → Metal Oxide + Hydrogen"
                              : "Metal + Water → Metal Hydroxide + Hydrogen"
                          )}
                          {metalSimReagent === 'acid' && `Metal + ${metalSimAcidType === 'HCl' ? 'Hydrochloric' : metalSimAcidType === 'H2SO4' ? 'Sulfuric' : 'Ethanoic'} Acid → Metal ${metalSimAcidType === 'HCl' ? 'Chloride' : metalSimAcidType === 'H2SO4' ? 'Sulfate' : 'Ethanoate'} + Hydrogen`}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                        {(metalSimMode === 'compare' ? metalSimSelected : experimentMetals).map((mIdOrObj, idx) => {
                          const mId = typeof mIdOrObj === 'string' ? mIdOrObj : (mIdOrObj as any).id;
                          const label = typeof mIdOrObj === 'string' ? metals.find(m => m.id === mId)?.name : (mIdOrObj as any).label;
                          const equation = getActualEquation(mId, metalSimReagent, metalSimWaterTemp, metalSimAcidType);
                          
                          return (
                            <div key={idx}>
                              <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">{label}</p>
                              <p className={`text-xs font-mono font-bold ${equation === 'No Reaction' ? 'text-red-400' : 'text-yellow-400'}`}>
                                {equation}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {metalSimMode === 'experiment' && (
                    <div className="mb-8 p-6 bg-white border-2 border-purple-100 rounded-3xl relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 via-purple-300 to-purple-100" />
                      <h4 className="text-sm font-black text-purple-700 uppercase mb-6 text-center tracking-widest">Deduce the Order</h4>
                      
                      <div className="flex flex-col gap-3 max-w-xs mx-auto">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <div className="h-px flex-1 bg-purple-100" />
                          <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Most Reactive</span>
                          <div className="h-px flex-1 bg-purple-100" />
                        </div>

                        <Reorder.Group axis="y" values={userGuessOrder} onReorder={setUserGuessOrder} className="space-y-2">
                          {userGuessOrder.map((metalLabel) => (
                            <Reorder.Item
                              key={metalLabel}
                              value={metalLabel}
                              className="bg-white border-2 border-purple-100 p-4 rounded-2xl cursor-grab active:cursor-grabbing flex items-center justify-between group hover:border-purple-400 hover:shadow-md transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-600 text-white rounded-xl flex items-center justify-center font-black text-sm shadow-lg shadow-purple-200">
                                  {metalLabel}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-black text-purple-900 text-sm uppercase">Metal {metalLabel}</span>
                                  <span className="text-[9px] text-purple-400 font-bold uppercase tracking-tighter">Drag to reorder</span>
                                </div>
                              </div>
                              <List size={18} className="text-purple-200 group-hover:text-purple-500 transition-colors" />
                            </Reorder.Item>
                          ))}
                        </Reorder.Group>

                        <div className="flex items-center justify-center gap-2 mt-2">
                          <div className="h-px flex-1 bg-purple-100" />
                          <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Least Reactive</span>
                          <div className="h-px flex-1 bg-purple-100" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4">
                    {!metalSimIsActive ? (
                      <button
                        onClick={() => {
                          setMetalSimIsActive(true);
                          setMetalSimProgress(0);
                        }}
                        className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-5 rounded-3xl font-black text-xl uppercase tracking-widest shadow-[0_8px_0_0_#ca8a04] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-3 group"
                      >
                        <Zap size={24} className="group-hover:animate-pulse" />
                        Start Reaction
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setMetalSimIsActive(false);
                          setMetalSimProgress(0);
                        }}
                        className="flex-1 bg-white border-4 border-gray-200 text-gray-400 py-5 rounded-3xl font-black text-xl uppercase tracking-widest hover:bg-gray-50 hover:text-gray-600 transition-all flex items-center justify-center gap-3 shadow-[0_8px_0_0_#e5e7eb] active:shadow-none active:translate-y-1"
                      >
                        <RefreshCw size={24} />
                        Reset Lab
                      </button>
                    )}
                  </div>
                </div>
              )}

              {selectedSim === 'metal-equations' && (
                <div className="bg-white p-8 rounded-[40px] shadow-2xl border-4 border-blue-100">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Metal Reactivity: Equations</h3>
                      <p className="text-blue-500 font-black text-xl uppercase tracking-widest text-xs">Reactions & Word Equations</p>
                    </div>
                    <div className="flex gap-2">
                      {['summary', 'lab', 'challenge'].map(m => (
                        <button
                          key={m}
                          onClick={() => {
                            setMetalEqMode(m as any);
                            if (m === 'challenge') generateChallenge();
                          }}
                          className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                            metalEqMode === m 
                              ? 'bg-blue-600 text-white shadow-[0_4px_0_0_#1e40af]' 
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mode Content */}
                  {metalEqMode === 'summary' && (
                    <div className="space-y-6">
                      <div className="overflow-x-auto rounded-2xl border-2 border-gray-100">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-gray-50 border-b-2 border-gray-100">
                              <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Metal</th>
                              <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Oxygen</th>
                              <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cold/Hot Water</th>
                              <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Steam</th>
                              <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Dilute Acid</th>
                            </tr>
                          </thead>
                          <tbody>
                            {metalEqMetals.map((m, idx) => (
                              <tr key={m.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                                <td className="p-4 font-black text-gray-800">{m.name} ({m.id})</td>
                                <td className="p-4">
                                  {idx <= 8 ? <CheckCircle2 className="text-emerald-500" size={18} /> : <XCircle className="text-gray-200" size={18} />}
                                </td>
                                <td className="p-4">
                                  {idx <= 2 ? <CheckCircle2 className="text-emerald-500" size={18} /> : <XCircle className="text-gray-200" size={18} />}
                                </td>
                                <td className="p-4">
                                  {idx <= 6 ? <CheckCircle2 className="text-emerald-500" size={18} /> : <XCircle className="text-gray-200" size={18} />}
                                </td>
                                <td className="p-4">
                                  {idx <= 7 ? <CheckCircle2 className="text-emerald-500" size={18} /> : <XCircle className="text-gray-200" size={18} />}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-2xl border-2 border-blue-100 flex gap-3 items-center">
                        <Info className="text-blue-500 shrink-0" size={20} />
                        <p className="text-xs text-blue-700 font-medium leading-relaxed">
                          The reactivity series shows that metals like Potassium are highly reactive, while Gold is chemically inert. 
                          More reactive metals react with a wider range of substances and more vigorously.
                        </p>
                      </div>
                    </div>
                  )}

                  {metalEqMode === 'lab' && (
                    <div className="space-y-8">
                      {/* Sliders */}
                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Metal</label>
                            <span className="text-sm font-black text-blue-600 uppercase">{metalEqMetals[metalEqMetalIdx].name}</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max={metalEqMetals.length - 1} 
                            value={metalEqMetalIdx}
                            onChange={(e) => {
                              setMetalEqMetalIdx(parseInt(e.target.value));
                              setMetalEqIsActive(false);
                              setMetalEqProgress(0);
                            }}
                            className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                          <div className="flex justify-between text-[8px] font-black text-gray-300 uppercase">
                            <span>Most Reactive</span>
                            <span>Least Reactive</span>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Reagent</label>
                            <span className="text-sm font-black text-blue-600 uppercase">{metalEqReagents[metalEqReagentIdx].name}</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max={metalEqReagents.length - 1} 
                            value={metalEqReagentIdx}
                            onChange={(e) => {
                              setMetalEqReagentIdx(parseInt(e.target.value));
                              setMetalEqIsActive(false);
                              setMetalEqProgress(0);
                            }}
                            className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                          {metalEqReagents[metalEqReagentIdx].id === 'water' && (
                            <div className="flex gap-2 mt-2">
                              {['Cold', 'Hot'].map(t => (
                                <button
                                  key={t}
                                  onClick={() => {
                                    setMetalSimWaterTemp(t.toLowerCase() as any);
                                    setMetalEqIsActive(false);
                                    setMetalEqProgress(0);
                                  }}
                                  className={`flex-1 p-1 rounded border font-black text-[8px] uppercase transition-all ${
                                    metalSimWaterTemp === t.toLowerCase() ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-400 border-gray-100'
                                  }`}
                                >
                                  {t}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Experiment Setup Visualization */}
                      <div className="relative h-64 bg-gray-50 rounded-3xl border-4 border-gray-100 overflow-hidden flex items-center justify-center">
                        {/* Scientifically correct setups */}
                        {metalEqReagents[metalEqReagentIdx].id === 'oxygen' && (
                          <div className="flex flex-col items-center gap-4">
                            <div className="relative">
                              <div className="w-32 h-1 bg-gray-400 rounded-full" /> {/* Gauze */}
                              <div className="w-16 h-16 bg-yellow-400 border-2 border-yellow-500 rounded-lg mx-auto mt-[-8px] flex items-center justify-center relative overflow-hidden">
                                {canReact(metalEqMetalIdx, 'oxygen') && (
                                  <motion.div 
                                    className="absolute inset-0 bg-gray-600/60"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: metalEqIsActive ? metalEqProgress / 100 : 0 }}
                                  />
                                )}
                              </div>
                              <div className="absolute top-12 left-1/2 -translate-x-1/2">
                                <Flame className="text-orange-500 animate-pulse" size={32} />
                              </div>
                            </div>
                            <p className="text-[10px] font-black text-gray-400 uppercase mt-8">Heating metal in air/oxygen</p>
                          </div>
                        )}

                        {metalEqReagents[metalEqReagentIdx].id === 'water' && (
                          <div className="flex flex-col items-center gap-4">
                            <div className="relative w-24 h-32 border-x-2 border-b-2 border-gray-300 rounded-b-xl bg-blue-50/30">
                              <div className="absolute inset-x-0 bottom-0 h-3/4 bg-blue-200/40 rounded-b-lg" />
                              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-yellow-400 rounded shadow-sm" />
                              {canReact(metalEqMetalIdx, 'water') && metalEqIsActive && (
                                <div className="absolute inset-x-0 bottom-1/2 flex flex-wrap justify-center gap-1">
                                  {[...Array(metalSimWaterTemp === 'hot' ? 15 : 6)].map((_, i) => (
                                    <motion.div 
                                      key={i}
                                      animate={{ y: [-10, -50], opacity: [0, 1, 0] }}
                                      transition={{ 
                                        duration: metalSimWaterTemp === 'hot' ? 0.5 : 1, 
                                        repeat: Infinity, 
                                        delay: i * (metalSimWaterTemp === 'hot' ? 0.05 : 0.15) 
                                      }}
                                      className="w-1.5 h-1.5 bg-white rounded-full border border-blue-100"
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                            <p className="text-[10px] font-black text-gray-400 uppercase">Metal in water ({metalSimWaterTemp} water)</p>
                          </div>
                        )}

                        {metalEqReagents[metalEqReagentIdx].id === 'steam' && (
                          <div className="flex flex-col items-center gap-4">
                            <div className="flex items-center gap-0">
                              <div className="w-40 h-6 border-2 border-gray-300 rounded-full relative bg-gray-100/20"> {/* Boiling tube */}
                                <div className="absolute left-4 top-1 w-6 h-4 bg-blue-100 rounded-sm" /> {/* Damp mineral wool */}
                                <div className="absolute right-8 top-1 w-6 h-4 bg-yellow-400 rounded-sm relative overflow-hidden">
                                  {canReact(metalEqMetalIdx, 'steam') && (
                                    <motion.div 
                                      className="absolute inset-0 bg-gray-600/60"
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: metalEqIsActive ? metalEqProgress / 100 : 0 }}
                                    />
                                  )}
                                </div>
                                <div className="absolute left-4 top-6">
                                  <Flame className="text-orange-500 animate-pulse" size={16} />
                                </div>
                                <div className="absolute right-8 top-6">
                                  <Flame className="text-orange-500 animate-pulse" size={16} />
                                </div>
                                {metalEqIsActive && (
                                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    {[...Array(5)].map((_, i) => (
                                      <motion.div 
                                        key={i}
                                        animate={{ x: [0, 40], opacity: [0, 1, 0] }}
                                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                        className="w-1 h-1 bg-white/40 rounded-full"
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="w-12 h-1 bg-gray-300" /> {/* Delivery tube */}
                              <div className="w-16 h-20 border-x-2 border-b-2 border-gray-300 rounded-b-xl bg-blue-50/30 relative"> {/* Trough */}
                                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-blue-200/40 rounded-b-lg" />
                                <div className="absolute inset-x-2 bottom-0 h-16 border-x-2 border-t-2 border-gray-300 bg-white/20 flex flex-col items-center justify-end"> {/* Inverted test tube */}
                                  {canReact(metalEqMetalIdx, 'steam') && metalEqIsActive && (
                                    <motion.div 
                                      className="w-full bg-white/20"
                                      initial={{ height: 0 }}
                                      animate={{ height: `${metalEqProgress}%` }}
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                            <p className="text-[10px] font-black text-gray-400 uppercase">Reaction of metal with steam</p>
                          </div>
                        )}

                        {metalEqReagents[metalEqReagentIdx].id === 'acid' && (
                          <div className="flex flex-col items-center gap-4">
                            <div className="relative w-16 h-32 border-x-2 border-b-2 border-gray-300 rounded-b-xl bg-emerald-50/30">
                              <div className="absolute inset-x-0 bottom-0 h-2/3 bg-emerald-200/40 rounded-b-lg" />
                              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-6 h-6 bg-yellow-400 rounded shadow-sm" />
                              {canReact(metalEqMetalIdx, 'acid') && metalEqIsActive && (
                                <>
                                  <div className="absolute inset-x-0 bottom-1/2 flex flex-wrap justify-center gap-1">
                                    {[...Array(12)].map((_, i) => (
                                      <motion.div 
                                        key={i}
                                        animate={{ y: [-10, -60], opacity: [0, 1, 0] }}
                                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.08 }}
                                        className="w-1.5 h-1.5 bg-white rounded-full border border-emerald-100"
                                      />
                                    ))}
                                  </div>
                                  {/* Squeaky Pop Test */}
                                  {metalEqProgress > 60 && metalEqMetalIdx <= 3 && (
                                    <motion.div 
                                      className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center"
                                      initial={{ opacity: 0, scale: 0 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                    >
                                      <div className="w-1 h-12 bg-orange-200 rounded-full relative"> {/* Lighted splint */}
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2">
                                          <Flame className="text-orange-500 animate-pulse" size={12} />
                                        </div>
                                      </div>
                                      {metalEqProgress > 80 && (
                                        <motion.div 
                                          className="absolute -top-4 bg-yellow-400 text-gray-900 px-2 py-0.5 rounded-full font-black text-[8px] uppercase tracking-widest border border-yellow-500 shadow-lg"
                                          initial={{ scale: 0 }}
                                          animate={{ scale: [1, 1.5, 1], opacity: [1, 1, 0] }}
                                          transition={{ duration: 0.5 }}
                                        >
                                          POP!
                                        </motion.div>
                                      )}
                                    </motion.div>
                                  )}
                                </>
                              )}
                            </div>
                            <p className="text-[10px] font-black text-gray-400 uppercase">Metal in dilute acid (Test tube)</p>
                          </div>
                        )}
                      </div>

                      {/* Result & Equation */}
                      <div className="space-y-4">
                        <div className="flex gap-4">
                          {!metalEqIsActive ? (
                            <button
                              onClick={() => setMetalEqIsActive(true)}
                              className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-[0_6px_0_0_#1e40af] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2"
                            >
                              <Zap size={20} />
                              Start Reaction
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setMetalEqIsActive(false);
                                setMetalEqProgress(0);
                              }}
                              className="flex-1 bg-gray-100 text-gray-500 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                            >
                              <RefreshCw size={20} />
                              Reset Lab
                            </button>
                          )}
                        </div>

                        <div className="p-6 bg-gray-900 rounded-3xl text-center shadow-xl">
                          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">Word Equation</p>
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-center gap-3 text-white font-bold text-lg">
                              <span className="text-blue-400">{metalEqMetals[metalEqMetalIdx].name}</span>
                              <span className="text-white/40">+</span>
                              <span className="text-emerald-400">{metalEqReagents[metalEqReagentIdx].name}</span>
                              <ArrowRight size={20} className="text-white/20" />
                              <span className={canReact(metalEqMetalIdx, metalEqReagents[metalEqReagentIdx].id) ? 'text-yellow-400' : 'text-red-400'}>
                                {canReact(metalEqMetalIdx, metalEqReagents[metalEqReagentIdx].id) ? (
                                  <>
                                    {metalEqReagents[metalEqReagentIdx].id === 'oxygen' && `${metalEqMetals[metalEqMetalIdx].name} Oxide`}
                                    {metalEqReagents[metalEqReagentIdx].id === 'water' && `${metalEqMetals[metalEqMetalIdx].name} Hydroxide + Hydrogen`}
                                    {metalEqReagents[metalEqReagentIdx].id === 'steam' && `${metalEqMetals[metalEqMetalIdx].name} Oxide + Hydrogen`}
                                    {metalEqReagents[metalEqReagentIdx].id === 'acid' && `${metalEqMetals[metalEqMetalIdx].name} Salt + Hydrogen`}
                                  </>
                                ) : 'No Reaction'}
                              </span>
                            </div>
                            {!canReact(metalEqMetalIdx, metalEqReagents[metalEqReagentIdx].id) && (
                              <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">
                                {metalEqMetals[metalEqMetalIdx].name} is not reactive enough to react with {metalEqReagents[metalEqReagentIdx].name}.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {metalEqMode === 'challenge' && metalEqChallenge && (
                    <div className="space-y-8">
                      <div className="p-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[40px] text-center text-white shadow-2xl relative overflow-hidden border-4 border-white/20">
                        <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12">
                          <Trophy size={140} />
                        </div>
                        <div className="absolute bottom-0 left-0 p-6 opacity-10 -rotate-12">
                          <BookOpen size={100} />
                        </div>
                        
                        <div className="relative z-10">
                          <p className="text-xs font-black text-blue-200 uppercase tracking-[0.3em] mb-4">Backward Deduction</p>
                          <h4 className="text-4xl font-black mb-6 tracking-tight">Deduce the Reactants</h4>
                          
                          <div className="bg-white/10 backdrop-blur-md p-6 rounded-[32px] inline-block border border-white/20 shadow-inner">
                            <p className="text-xs font-bold text-blue-100 uppercase mb-2 tracking-widest">Target Products</p>
                            <p className="text-2xl font-black text-yellow-300 uppercase tracking-tight drop-shadow-sm">{metalEqChallenge.product}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Metal</label>
                          </div>
                          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto p-2 bg-gray-50 rounded-2xl border-2 border-gray-100 scrollbar-thin scrollbar-thumb-gray-200">
                            {metalEqMetals.map((m, idx) => (
                              <button
                                key={m.id}
                                onClick={() => {
                                  setMetalEqUserMetal(idx);
                                  setMetalEqFeedback(null);
                                }}
                                className={`p-3 rounded-xl border-2 font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 ${
                                  metalEqUserMetal === idx 
                                    ? 'border-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-100 -translate-y-0.5' 
                                    : 'border-white bg-white text-gray-400 hover:border-blue-200 hover:text-blue-400'
                                }`}
                              >
                                {m.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Reagent</label>
                          </div>
                          <div className="flex flex-col gap-2 p-2 bg-gray-50 rounded-2xl border-2 border-gray-100">
                            {metalEqReagents.map((r, idx) => (
                              <button
                                key={r.id}
                                onClick={() => {
                                  setMetalEqUserReagent(idx);
                                  setMetalEqFeedback(null);
                                }}
                                className={`p-4 rounded-xl border-2 font-black text-[10px] uppercase text-left transition-all flex items-center justify-between ${
                                  metalEqUserReagent === idx 
                                    ? 'border-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-100 -translate-y-0.5' 
                                    : 'border-white bg-white text-gray-400 hover:border-blue-200 hover:text-blue-400'
                                }`}
                              >
                                {r.name}
                                {metalEqUserReagent === idx && <CheckCircle2 size={14} />}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <button
                          onClick={() => {
                            const isCorrect = metalEqMetals[metalEqUserMetal].id === metalEqChallenge.metal && 
                                              metalEqReagents[metalEqUserReagent].id === metalEqChallenge.reagent;
                            
                            // Special case for "No Reaction"
                            const userCanReact = canReact(metalEqUserMetal, metalEqReagents[metalEqUserReagent].id);
                            const challengeCanReact = metalEqChallenge.product !== 'No Reaction';
                            
                            if (!challengeCanReact && !userCanReact) {
                              setMetalEqFeedback('correct');
                            } else if (isCorrect) {
                              setMetalEqFeedback('correct');
                            } else {
                              setMetalEqFeedback('incorrect');
                            }
                          }}
                          className="flex-1 bg-blue-600 text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-[0_8px_0_0_#1e40af] active:shadow-none active:translate-y-1 transition-all text-lg"
                        >
                          Check Answer
                        </button>
                        <button
                          onClick={() => {
                            generateChallenge();
                            setMetalEqFeedback(null);
                          }}
                          className="px-10 bg-gray-100 text-gray-400 py-5 rounded-3xl font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                        >
                          Skip
                        </button>
                      </div>

                      {metalEqFeedback && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-6 rounded-3xl text-center border-4 ${
                            metalEqFeedback === 'correct' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-3 mb-2">
                            {metalEqFeedback === 'correct' ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
                            <h5 className="text-2xl font-black uppercase">{metalEqFeedback === 'correct' ? 'Correct!' : 'Try Again'}</h5>
                          </div>
                          <p className="font-medium">
                            {metalEqFeedback === 'correct' 
                              ? `Well done! ${metalEqMetals[metalEqUserMetal].name} reacts with ${metalEqReagents[metalEqUserReagent].name} to produce ${metalEqChallenge.product}.` 
                              : `That's not quite right. Think about the products and the reactivity rules.`}
                          </p>
                          {metalEqFeedback === 'correct' && (
                            <button 
                              onClick={generateChallenge}
                              className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-xl font-black uppercase text-xs tracking-widest"
                            >
                              Next Challenge
                            </button>
                          )}
                        </motion.div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => setSelectedSim(null)}
                className="w-full bg-gray-200 text-gray-500 py-4 rounded-2xl font-black text-xl uppercase tracking-widest hover:bg-gray-300 transition-all"
              >
                Back to Simulations
              </button>
            </div>
          )}
        </div>
      );
    };

    const GraphPlayground = () => {
      const [isPractice, setIsPractice] = useState(false);
      const [practiceData, setPracticeData] = useState<any>(null);
      const [userAnswer, setUserAnswer] = useState('');
      const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

      const generatePractice = () => {
        const speed = Math.floor(Math.random() * 10) + 1;
        const data = [];
        for (let t = 0; t <= 10; t++) {
          data.push({ time: t, distance: speed * t });
        }
        setPracticeData({ speed, data });
        setUserAnswer('');
        setFeedback(null);
      };

      const checkAnswer = () => {
        if (parseInt(userAnswer) === practiceData.speed) {
          setFeedback('correct');
        } else {
          setFeedback('incorrect');
        }
      };

      const generateData = () => {
        const data = [];
        for (let t = 0; t <= 10; t++) {
          data.push({
            time: t,
            obj1: graphSpeed1 * t,
            obj2: graphSpeed2 * t
          });
        }
        return data;
      };

      const data = generateData();

      const ObjectAnimation = ({ speed, color }: { speed: number; color: string }) => {
        const duration = 10 / speed;
        return (
          <div className="relative h-12 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 mt-2">
            <motion.div
              key={speed}
              animate={{ left: ['0%', '100%'], x: ['0%', '-100%'] }}
              transition={{ duration, repeat: Infinity, ease: 'linear' }}
              className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full ${color} shadow-lg`}
            />
            <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none opacity-20">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="w-px h-4 bg-gray-400" />
              ))}
            </div>
          </div>
        );
      };

      return (
        <div className="space-y-8">
          {!selectedGraph ? (
            <div className="grid grid-cols-1 gap-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedGraph('speed')}
                className="bg-white border-2 border-gray-200 p-8 rounded-3xl flex items-center gap-6 shadow-[0_6px_0_0_#e5e7eb] hover:border-indigo-400 transition-all group"
              >
                <div className="bg-indigo-100 text-indigo-600 p-5 rounded-2xl group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                  <TrendingUp size={40} />
                </div>
                <div className="text-left">
                  <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Speed: Distance-time graph</h3>
                  <p className="text-gray-500 font-medium">Visualize how speed affects distance over time.</p>
                </div>
              </motion.button>
            </div>
          ) : isPractice ? (
            <div className="space-y-6">
              <div className="bg-white border-2 border-gray-200 p-8 rounded-3xl shadow-[0_6px_0_0_#e5e7eb]">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Practice: Calculate Speed</h3>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Find the slope (v = d / t)</p>
                  </div>
                  <button 
                    onClick={() => setIsPractice(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle size={32} />
                  </button>
                </div>

                {!practiceData ? (
                  <div className="text-center py-12">
                    <button
                      onClick={generatePractice}
                      className="bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black text-xl uppercase tracking-widest shadow-[0_6px_0_0_#4338ca] active:shadow-none active:translate-y-1 transition-all"
                    >
                      Start Practice
                    </button>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={practiceData.data}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="time" 
                            label={{ value: 'Time (s)', position: 'insideBottom', offset: -5, fontSize: 10, fontWeight: 'bold' }} 
                            tick={{ fontSize: 10, fontWeight: 'bold' }}
                          />
                          <YAxis 
                            label={{ value: 'Distance (m)', angle: -90, position: 'insideLeft', fontSize: 10, fontWeight: 'bold' }} 
                            tick={{ fontSize: 10, fontWeight: 'bold' }}
                          />
                          <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="distance" 
                            stroke="#6366f1" 
                            strokeWidth={4} 
                            dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-2xl border-2 border-gray-100">
                      <p className="text-sm font-black text-gray-500 uppercase tracking-widest mb-4">What is the speed of this object?</p>
                      <div className="flex gap-4">
                        <input
                          type="number"
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          placeholder="Enter speed..."
                          className="flex-1 bg-white border-2 border-gray-200 p-4 rounded-xl font-black text-xl focus:border-indigo-500 outline-none transition-all"
                        />
                        <div className="flex items-center text-gray-400 font-black text-xl">m/s</div>
                      </div>

                      {feedback && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`mt-4 p-4 rounded-xl flex items-center gap-3 ${
                            feedback === 'correct' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {feedback === 'correct' ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                          <span className="font-black uppercase tracking-tight">
                            {feedback === 'correct' ? 'Correct! Well done!' : 'Not quite. Try again!'}
                          </span>
                        </motion.div>
                      )}

                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <button
                          onClick={checkAnswer}
                          className="bg-indigo-500 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-[0_4px_0_0_#4338ca] active:shadow-none active:translate-y-1 transition-all"
                        >
                          Check
                        </button>
                        <button
                          onClick={generatePractice}
                          className="bg-white border-2 border-gray-200 text-gray-500 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
                        >
                          Next Graph
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white border-2 border-gray-200 p-8 rounded-3xl shadow-[0_6px_0_0_#e5e7eb]">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Distance-Time Graph</h3>
                    <p className="text-indigo-500 font-black text-xl">v = d / t</p>
                  </div>
                  <div className="bg-indigo-100 text-indigo-600 p-4 rounded-2xl">
                    <TrendingUp size={32} />
                  </div>
                </div>

                <div className="h-64 w-full mb-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="time" 
                        label={{ value: 'Time (s)', position: 'insideBottom', offset: -5, fontSize: 10, fontWeight: 'bold' }} 
                        tick={{ fontSize: 10, fontWeight: 'bold' }}
                      />
                      <YAxis 
                        label={{ value: 'Distance (m)', angle: -90, position: 'insideLeft', fontSize: 10, fontWeight: 'bold' }} 
                        tick={{ fontSize: 10, fontWeight: 'bold' }}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        labelStyle={{ fontWeight: 'bold' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="obj1" 
                        name="Object 1"
                        stroke="#3b82f6" 
                        strokeWidth={4} 
                        dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 8 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="obj2" 
                        name="Object 2"
                        stroke="#ef4444" 
                        strokeWidth={4} 
                        dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-black text-blue-500 uppercase tracking-widest">Object 1 Speed: {graphSpeed1} m/s</label>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="20" 
                      value={graphSpeed1} 
                      onChange={(e) => setGraphSpeed1(parseInt(e.target.value))}
                      className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <ObjectAnimation speed={graphSpeed1} color="bg-blue-500" />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-black text-red-500 uppercase tracking-widest">Object 2 Speed: {graphSpeed2} m/s</label>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="20" 
                      value={graphSpeed2} 
                      onChange={(e) => setGraphSpeed2(parseInt(e.target.value))}
                      className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                    />
                    <ObjectAnimation speed={graphSpeed2} color="bg-red-500" />
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsPractice(true);
                    generatePractice();
                  }}
                  className="w-full mt-8 bg-emerald-500 text-white py-4 rounded-2xl font-black text-xl uppercase tracking-widest shadow-[0_6px_0_0_#059669] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-3"
                >
                  <Zap size={24} />
                  Practice Mode
                </button>
              </div>

              <button
                onClick={() => setSelectedGraph(null)}
                className="w-full bg-gray-200 text-gray-500 py-4 rounded-2xl font-black text-xl uppercase tracking-widest hover:bg-gray-300 transition-all"
              >
                Back to Graphs
              </button>
            </div>
          )}
        </div>
      );
    };

    const generatePracticeQuestion = (equation: any) => {
      const v1 = Math.floor(Math.random() * 10) + 1;
      const v2 = Math.floor(Math.random() * 10) + 1;
      let questionText = '';
      let correctAnswer = 0;
      let unit = '';

      if (equation.id === 'speed') {
        const type = Math.random() > 0.5 ? 'v' : 'd';
        if (type === 'v') {
          questionText = `If Distance is ${v1 * v2}m and Time is ${v2}s, what is the Speed?`;
          correctAnswer = v1;
          unit = 'm/s';
        } else {
          questionText = `If Speed is ${v1}m/s and Time is ${v2}s, what is the Distance?`;
          correctAnswer = v1 * v2;
          unit = 'm';
        }
      } else if (equation.id === 'pressure') {
        questionText = `If Force is ${v1 * v2}N and Area is ${v2}m², what is the Pressure?`;
        correctAnswer = v1;
        unit = 'N/m²';
      } else if (equation.id === 'moment') {
        questionText = `If Force is ${v1}N and Distance is ${v2}m, what is the Moment?`;
        correctAnswer = v1 * v2;
        unit = 'Nm';
      } else if (equation.id === 'density') {
        questionText = `If Mass is ${v1 * v2}g and Volume is ${v2}cm³, what is the Density?`;
        correctAnswer = v1;
        unit = 'g/cm³';
      } else if (equation.id === 'concentration') {
        questionText = `If Number of particles is ${v1 * v2} and Volume is ${v2}L, what is the Concentration?`;
        correctAnswer = v1;
        unit = 'particles/L';
      } else {
        questionText = `If Part is ${v1} and Whole is ${v1 * 10}, what is the Percentage?`;
        correctAnswer = 10;
        unit = '%';
      }

      const options = [
        correctAnswer.toString(),
        (correctAnswer + 2).toString(),
        (correctAnswer * 2).toString(),
        (Math.max(1, correctAnswer - 1)).toString()
      ].sort(() => Math.random() - 0.5);

      setPracticeQuestion({ text: questionText, correctAnswer: correctAnswer.toString(), options, unit });
      setPracticeAnswer(null);
      setIsPracticeChecked(false);
    };

    if (subMode === 'select') {
      return (
        <div className="min-h-screen bg-gray-50 pb-24">
          <header className="bg-white border-b-2 border-gray-200 p-6 sticky top-0 z-10">
            <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Playground</h1>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-1">Interactive Learning</p>
          </header>
          <main className="max-w-2xl mx-auto p-6 space-y-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSubMode('equations')}
              className="w-full bg-white border-2 border-gray-200 p-8 rounded-3xl flex items-center gap-6 shadow-[0_6px_0_0_#e5e7eb] hover:border-blue-400 hover:shadow-[0_6px_0_0_#60a5fa] transition-all group"
            >
              <div className="bg-blue-100 text-blue-600 p-5 rounded-2xl group-hover:bg-blue-500 group-hover:text-white transition-colors">
                <Calculator size={40} />
              </div>
              <div className="text-left">
                <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Equation Playground</h2>
                <p className="text-gray-500 font-medium">Rearrange and practice key scientific formulas.</p>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSubMode('chemicals')}
              className="w-full bg-white border-2 border-gray-200 p-8 rounded-3xl flex items-center gap-6 shadow-[0_6px_0_0_#e5e7eb] hover:border-emerald-400 hover:shadow-[0_6px_0_0_#34d399] transition-all group"
            >
              <div className="bg-emerald-100 text-emerald-600 p-5 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <Atom size={40} />
              </div>
              <div className="text-left">
                <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Chemical Playground</h2>
                <p className="text-gray-500 font-medium">Explore common chemicals and their properties.</p>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSubMode('graphs')}
              className="w-full bg-white border-2 border-gray-200 p-8 rounded-3xl flex items-center gap-6 shadow-[0_6px_0_0_#e5e7eb] hover:border-indigo-400 hover:shadow-[0_6px_0_0_#818cf8] transition-all group"
            >
              <div className="bg-indigo-100 text-indigo-600 p-5 rounded-2xl group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                <TrendingUp size={40} />
              </div>
              <div className="text-left">
                <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Graph Playground</h2>
                <p className="text-gray-500 font-medium">Experiment with dynamic scientific graphs.</p>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSubMode('simulations')}
              className="w-full bg-white border-2 border-gray-200 p-8 rounded-3xl flex items-center gap-6 shadow-[0_6px_0_0_#e5e7eb] hover:border-orange-400 hover:shadow-[0_6px_0_0_#fb923c] transition-all group"
            >
              <div className="bg-orange-100 text-orange-600 p-5 rounded-2xl group-hover:bg-orange-500 group-hover:text-white transition-colors">
                <ArrowRightLeft size={40} />
              </div>
              <div className="text-left">
                <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Simulation Playground</h2>
                <p className="text-gray-500 font-medium">Interactive simulations for complex scientific concepts.</p>
              </div>
            </motion.button>
          </main>
        </div>
      );
    }

    if (subMode === 'simulations') {
      return (
        <div className="min-h-screen bg-gray-50 pb-24">
          <header className="bg-white border-b-2 border-gray-200 p-4 sticky top-0 z-10">
            <div className="max-w-2xl mx-auto flex items-center gap-4">
              <button onClick={() => setSubMode('select')} className="text-gray-400 hover:text-gray-600">
                <ChevronLeft size={32} />
              </button>
              <div>
                <h1 className="text-lg font-black text-gray-800 uppercase tracking-tight leading-none">Simulation Playground</h1>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Interactive Simulations</p>
              </div>
            </div>
          </header>

          <main className="max-w-2xl mx-auto p-6">
            <SimulationPlayground />
          </main>
        </div>
      );
    }

    if (subMode === 'equations') {
      return (
        <div className="min-h-screen bg-gray-50 pb-24">
          <header className="bg-white border-b-2 border-gray-200 p-4 sticky top-0 z-10">
            <div className="max-w-2xl mx-auto flex items-center gap-4">
              <button onClick={() => {
                if (isPracticeMode) setIsPracticeMode(false);
                else if (selectedEquation) setSelectedEquation(null);
                else setSubMode('select');
              }} className="text-gray-400 hover:text-gray-600">
                <ChevronLeft size={32} />
              </button>
              <div>
                <h1 className="text-lg font-black text-gray-800 uppercase tracking-tight leading-none">Equations</h1>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  {selectedEquation ? selectedEquation.name : 'Select a formula'}
                </p>
              </div>
            </div>
          </header>

          <main className="max-w-2xl mx-auto p-6">
            {isPracticeMode ? (
              <div className="space-y-8">
                <div className="bg-white border-2 border-gray-200 p-8 rounded-3xl shadow-[0_6px_0_0_#e5e7eb]">
                  <h2 className="text-2xl font-black text-gray-800 mb-6">{practiceQuestion.text}</h2>
                  <div className="grid gap-4">
                    {practiceQuestion.options.map((option: string) => (
                      <button
                        key={option}
                        disabled={isPracticeChecked}
                        onClick={() => setPracticeAnswer(option)}
                        className={`w-full p-4 text-left rounded-2xl border-2 transition-all font-bold text-lg
                          ${practiceAnswer === option 
                            ? 'border-blue-400 bg-blue-50 text-blue-600 shadow-[0_4px_0_0_#60a5fa]' 
                            : 'border-gray-200 hover:bg-gray-50 text-gray-700 shadow-[0_4px_0_0_#e5e7eb]'
                          }
                          ${isPracticeChecked && option === practiceQuestion.correctAnswer ? 'border-emerald-400 bg-emerald-50 text-emerald-600 shadow-[0_4px_0_0_#34d399]' : ''}
                          ${isPracticeChecked && practiceAnswer === option && practiceAnswer !== practiceQuestion.correctAnswer ? 'border-red-400 bg-red-50 text-red-600 shadow-[0_4px_0_0_#f87171]' : ''}
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <span>{option} {practiceQuestion.unit}</span>
                          {isPracticeChecked && option === practiceQuestion.correctAnswer && <CheckCircle2 size={24} />}
                          {isPracticeChecked && practiceAnswer === option && practiceAnswer !== practiceQuestion.correctAnswer && <XCircle size={24} />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (isPracticeChecked) generatePracticeQuestion(selectedEquation);
                    else setIsPracticeChecked(true);
                  }}
                  disabled={!practiceAnswer}
                  className={`w-full py-4 rounded-2xl font-black text-xl uppercase tracking-widest transition-all
                    ${!practiceAnswer ? 'bg-gray-200 text-gray-400' : 'bg-emerald-500 text-white shadow-[0_6px_0_0_#059669] active:shadow-none active:translate-y-1'}
                  `}
                >
                  {isPracticeChecked ? 'Next Question' : 'Check Answer'}
                </button>
              </div>
            ) : selectedEquation ? (
              <div className="space-y-8">
                <div className="bg-white border-2 border-gray-200 p-12 rounded-3xl shadow-[0_8px_0_0_#e5e7eb] text-center">
                  <span className="text-gray-400 text-xs font-black uppercase tracking-[0.2em] block mb-4">Rearrange the formula</span>
                  <div className="text-5xl font-black text-gray-800 mb-8 flex items-center justify-center gap-4 flex-wrap">
                    {equationRearrangements[selectedEquation.id][equationSubject || selectedEquation.variables[0].symbol].split(' ').map((part, i) => (
                      <span key={i} className={selectedEquation.variables.some((v: any) => v.symbol === part) ? 'text-blue-500' : ''}>
                        {part}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {selectedEquation.variables.map((v: any) => (
                      <button
                        key={v.symbol}
                        onClick={() => setEquationSubject(v.symbol)}
                        className={`p-4 rounded-2xl border-2 font-black text-xl transition-all
                          ${(equationSubject || selectedEquation.variables[0].symbol) === v.symbol 
                            ? 'bg-blue-500 text-white border-blue-600 shadow-[0_4px_0_0_#1e40af]' 
                            : 'bg-white text-gray-400 border-gray-200 hover:border-blue-300 shadow-[0_4px_0_0_#e5e7eb]'
                          }
                        `}
                      >
                        {v.symbol}
                      </button>
                    ))}
                  </div>
                  <p className="mt-8 text-gray-400 font-bold text-sm uppercase tracking-widest">Click a variable to make it the subject</p>
                </div>

                <div className="grid gap-4">
                  {selectedEquation.variables.map((v: any) => (
                    <div key={v.symbol} className="bg-white border-2 border-gray-200 p-4 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded-xl flex items-center justify-center font-black">
                          {v.symbol}
                        </div>
                        <div>
                          <p className="font-black text-gray-800 uppercase text-sm">{v.name}</p>
                          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Unit: {v.unit || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setIsPracticeMode(true);
                    generatePracticeQuestion(selectedEquation);
                  }}
                  className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-black text-xl uppercase tracking-widest shadow-[0_6px_0_0_#059669] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-3"
                >
                  <Zap size={24} />
                  Practice Mode
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {equations.map((eq) => (
                  <motion.button
                    key={eq.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedEquation(eq);
                      setEquationSubject(eq.variables[0].symbol);
                    }}
                    className="w-full bg-white border-2 border-gray-200 p-6 rounded-3xl flex items-center justify-between shadow-[0_4px_0_0_#e5e7eb] hover:border-blue-400 transition-all"
                  >
                    <div className="text-left">
                      <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">{eq.name}</h3>
                      <p className="text-blue-500 font-black text-lg">{eq.formula}</p>
                    </div>
                    <div className="bg-gray-100 text-gray-400 p-2 rounded-xl">
                      <ArrowRight size={24} />
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </main>
        </div>
      );
    }

    if (subMode === 'chemicals') {
      return (
        <div className="min-h-screen bg-gray-50 pb-24">
          <header className="bg-white border-b-2 border-gray-200 p-4 sticky top-0 z-10">
            <div className="max-w-2xl mx-auto flex items-center gap-4">
              <button onClick={() => {
                if (selectedChemical) setSelectedChemical(null);
                else setSubMode('select');
              }} className="text-gray-400 hover:text-gray-600">
                <ChevronLeft size={32} />
              </button>
              <div className="flex-1">
                <h1 className="text-lg font-black text-gray-800 uppercase tracking-tight leading-none">Chemicals</h1>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  {selectedChemical ? selectedChemical.name : 'Explore common compounds'}
                </p>
              </div>
            </div>
          </header>

          <main className="max-w-2xl mx-auto p-6">
            {selectedChemical ? (
              <div className="space-y-8">
                <div className="bg-white border-2 border-gray-200 p-8 rounded-3xl shadow-[0_6px_0_0_#e5e7eb]">
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <h2 className="text-4xl font-black text-gray-800 uppercase tracking-tight">{selectedChemical.name}</h2>
                      <p className="text-emerald-500 font-black text-2xl">{selectedChemical.formula}</p>
                    </div>
                    <div className={`${selectedChemical.color} text-white p-6 rounded-3xl shadow-xl`}>
                      {selectedChemical.icon}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Composition</h3>
                      <div className="flex flex-wrap gap-4">
                        {selectedChemical.composition.map((comp: any, i: number) => (
                          <div key={i} className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border-2 border-gray-100">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black border-2 ${comp.color}`}>
                              {comp.type}
                            </div>
                            <div>
                              <p className="font-black text-gray-800 text-xl">× {comp.count}</p>
                              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Atoms</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="pt-4">
                        <p className="text-gray-600 font-medium leading-relaxed">
                          {selectedChemical.details}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Molecular View</h3>
                      <MolecularAnimation 
                        state={selectedChemical.state} 
                        formula={selectedChemical.formula} 
                        color={selectedChemical.color} 
                      />
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">
                        {selectedChemical.state === 'gas' 
                          ? 'Molecules move rapidly and are far apart' 
                          : 'Molecules slide past each other and are close together'}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedChemical(null)}
                  className="w-full bg-gray-200 text-gray-500 py-4 rounded-2xl font-black text-xl uppercase tracking-widest hover:bg-gray-300 transition-all"
                >
                  Back to List
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {chemicals.map((chem, idx) => (
                  <motion.div
                    key={chem.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => setSelectedChemical(chem)}
                    className={`cursor-pointer bg-white border-2 border-gray-200 rounded-3xl p-6 shadow-[0_6px_0_0_#e5e7eb] transition-all relative overflow-hidden group hover:border-emerald-400`}
                  >
                    <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 transition-transform group-hover:scale-150 ${chem.color}`} />
                    
                    <div className="relative z-10">
                      <div className={`${chem.color} text-white p-4 rounded-2xl w-fit mb-4 shadow-lg`}>
                        {chem.icon}
                      </div>
                      <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight leading-none mb-1">{chem.name}</h3>
                      <p className="text-emerald-500 font-black text-xl">{chem.formula}</p>
                      <p className="text-gray-300 text-[10px] font-black uppercase tracking-widest mt-4">Tap to explore</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </main>
        </div>
      );
    }

    if (subMode === 'graphs') {
      return (
        <div className="min-h-screen bg-gray-50 pb-24">
          <header className="bg-white border-b-2 border-gray-200 p-4 sticky top-0 z-10">
            <div className="max-w-2xl mx-auto flex items-center gap-4">
              <button onClick={() => {
                if (selectedGraph) setSelectedGraph(null);
                else setSubMode('select');
              }} className="text-gray-400 hover:text-gray-600">
                <ChevronLeft size={32} />
              </button>
              <div>
                <h1 className="text-lg font-black text-gray-800 uppercase tracking-tight leading-none">Graph Playground</h1>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  {selectedGraph ? 'Speed: Distance-time' : 'Experiment with parameters'}
                </p>
              </div>
            </div>
          </header>

          <main className="max-w-2xl mx-auto p-6">
            <GraphPlayground />
          </main>
        </div>
      );
    }

    return null;
  };

  const UserDashboardView = () => {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <header className="bg-white border-b-2 border-gray-200 p-6 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Dashboard</h1>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-1">Session Statistics</p>
          </div>
        </header>

        <main className="max-w-2xl mx-auto p-4 space-y-6 mt-4">
          {units.map((unit) => {
            const stats = sessionStats[unit.id] || { attemptedQuestions: [], masteredVocab: [] };
            const attemptedCount = stats.attemptedQuestions.length;
            const totalQuestions = unit.questions.length;
            const notAttemptedCount = totalQuestions - attemptedCount;
            const masteredCount = stats.masteredVocab.length;
            const totalVocab = unit.vocab.length;
            const totalNotes = unit.concepts.length;

            return (
              <motion.div
                key={unit.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border-2 border-gray-200 rounded-3xl overflow-hidden shadow-[0_4px_0_0_rgba(0,0,0,0.05)]"
              >
                <div className={`${unit.color} p-4 text-white flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                      <BookOpen size={20} />
                    </div>
                    <h3 className="font-black uppercase tracking-wide">{unit.title}</h3>
                  </div>
                  <span className="text-xs font-black bg-black/10 px-3 py-1 rounded-full uppercase tracking-widest">Unit {unit.id}</span>
                </div>

                <div className="p-6 grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 border-2 border-blue-100 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-blue-500 mb-1">
                      <CheckCircle2 size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Quiz Attempted</span>
                    </div>
                    <p className="text-2xl font-black text-blue-700">{attemptedCount}</p>
                    <p className="text-[10px] text-blue-400 font-bold uppercase">Questions</p>
                  </div>

                  <div className="bg-orange-50 border-2 border-orange-100 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-orange-500 mb-1">
                      <XCircle size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Not Attempted</span>
                    </div>
                    <p className="text-2xl font-black text-orange-700">{notAttemptedCount}</p>
                    <p className="text-[10px] text-orange-400 font-bold uppercase">Questions</p>
                  </div>

                  <div className="bg-emerald-50 border-2 border-emerald-100 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-emerald-500 mb-1">
                      <GraduationCap size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Vocab Mastered</span>
                    </div>
                    <p className="text-2xl font-black text-emerald-700">{masteredCount} / {totalVocab}</p>
                    <p className="text-[10px] text-emerald-400 font-bold uppercase">Items</p>
                  </div>

                  <div className="bg-purple-50 border-2 border-purple-100 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-purple-500 mb-1">
                      <Languages size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Total Notes</span>
                    </div>
                    <p className="text-2xl font-black text-purple-700">{totalNotes}</p>
                    <p className="text-[10px] text-purple-400 font-bold uppercase">Concepts</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </main>
      </div>
    );
  };

  const AboutView = () => {
    const revisionNumber = "1.7.0";
    
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <header className="bg-white border-b-2 border-gray-200 p-6 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tight">About</h1>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-1">App Information</p>
          </div>
        </header>

        <main className="max-w-2xl mx-auto p-4 space-y-6 mt-4">
          {/* Creator Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border-2 border-gray-200 rounded-3xl overflow-hidden shadow-[0_4px_0_0_rgba(0,0,0,0.05)]"
          >
            <div className="bg-emerald-500 p-6 text-white">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                  <GraduationCap size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight">Creator</h3>
                  <p className="text-emerald-100 font-bold text-sm uppercase tracking-widest opacity-90">Mr. LAM</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="relative pl-6 border-l-2 border-emerald-100 space-y-1">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm" />
                <p className="text-gray-800 font-black text-sm uppercase tracking-tight">
                  Bachelor of Science
                </p>
                <p className="text-gray-500 font-bold text-xs uppercase tracking-wider">
                  Biochemistry major, Psychology Minor
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">
                    University of Hong Kong
                  </span>
                  <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">
                    2013
                  </span>
                </div>
              </div>

              <div className="relative pl-6 border-l-2 border-emerald-100 space-y-1">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm" />
                <p className="text-gray-800 font-black text-sm uppercase tracking-tight">
                  Post Graduate Certificate in Education
                </p>
                <p className="text-gray-500 font-bold text-xs uppercase tracking-wider">
                  Secondary Education
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">
                    University of Sunderland
                  </span>
                  <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">
                    2025
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* GitHub Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border-2 border-gray-200 rounded-3xl p-6 shadow-[0_4px_0_0_rgba(0,0,0,0.05)]"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-gray-100 p-3 rounded-2xl text-gray-800">
                <Github size={24} />
              </div>
              <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Repository</h3>
            </div>
            <a 
              href="https://github.com/Tomanlam/Y8-Revision" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-between bg-gray-900 text-white p-4 rounded-2xl hover:bg-gray-800 transition-colors group"
            >
              <span className="font-bold text-sm truncate mr-2">github.com/Tomanlam/Y8-Revision</span>
              <ExternalLink size={18} className="flex-shrink-0 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </a>
          </motion.div>

          {/* Tech Stack Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white border-2 border-gray-200 rounded-3xl p-6 shadow-[0_4px_0_0_rgba(0,0,0,0.05)]"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-orange-100 p-3 rounded-2xl text-orange-600">
                <Zap size={24} />
              </div>
              <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Tech Stack</h3>
            </div>
            <div className="bg-orange-50 border-2 border-orange-100 p-4 rounded-2xl text-center">
              <p className="text-xl font-black text-orange-700">Powered by React + Vite</p>
              <p className="text-orange-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Modern Web Technologies</p>
            </div>
          </motion.div>

          {/* Revision Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white border-2 border-gray-200 rounded-3xl p-6 shadow-[0_4px_0_0_rgba(0,0,0,0.05)]"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-blue-100 p-3 rounded-2xl text-blue-600">
                <RefreshCw size={24} />
              </div>
              <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Version</h3>
            </div>
            <div className="bg-blue-50 border-2 border-blue-100 p-4 rounded-2xl text-center">
              <p className="text-3xl font-black text-blue-700">v{revisionNumber}</p>
              <p className="text-blue-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Revision Number</p>
            </div>
          </motion.div>
        </main>
      </div>
    );
  };

  return (
    <div className="font-sans selection:bg-emerald-200">
      <AnimatePresence mode="wait">
        {mode === 'splash' && <SplashScreen key="splash" />}
        {mode === 'dashboard' && <Dashboard key="dashboard" />}
        {mode === 'quiz' && selectedUnit && (
          <Quiz 
            selectedUnit={selectedUnit} 
            onClose={() => setMode('dashboard')}
            onQuestionAttempted={(unitId, questionId) => {
              setSessionStats(prev => {
                const unitStats = prev[unitId] || { attemptedQuestions: [], masteredVocab: [] };
                if (!unitStats.attemptedQuestions.includes(questionId)) {
                  return {
                    ...prev,
                    [unitId]: {
                      ...unitStats,
                      attemptedQuestions: [...unitStats.attemptedQuestions, questionId]
                    }
                  };
                }
                return prev;
              });
            }}
          />
        )}
        {mode === 'revision' && selectedUnit && (
          <Notes 
            selectedUnit={selectedUnit}
            isAssistMode={isAssistMode}
            setIsAssistMode={setIsAssistMode}
            chineseType={chineseType}
            setChineseType={setChineseType}
            onClose={() => setMode('dashboard')}
            onStartQuiz={startQuiz}
          />
        )}
        {mode === 'vocab' && <VocabView key="vocab" />}
        {mode === 'user-stats' && <UserDashboardView key="user-stats" />}
        {mode === 'about' && <AboutView key="about" />}
        {mode === 'playground' && <PlaygroundView key="playground" />}
        {mode === 'quick-facts' && <QuickFacts key="quick-facts" />}
      </AnimatePresence>

      {/* Bottom Nav for Dashboard, User Stats, and About */}
      {['dashboard', 'playground', 'user-stats', 'about', 'quick-facts'].includes(mode) && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 p-4 z-20">
          <div className="max-w-2xl mx-auto flex justify-around items-center">
            <button 
              onClick={() => setMode('dashboard')}
              className={`flex flex-col items-center gap-1 transition-colors ${mode === 'dashboard' ? 'text-emerald-500' : 'text-gray-400 hover:text-emerald-400'}`}
            >
              <Home size={28} fill={mode === 'dashboard' ? "currentColor" : "none"} />
              <span className="text-[10px] font-black uppercase">Home</span>
            </button>
            <button 
              onClick={() => setMode('quick-facts')}
              className={`flex flex-col items-center gap-1 transition-colors ${mode === 'quick-facts' ? 'text-emerald-500' : 'text-gray-400 hover:text-emerald-400'}`}
            >
              <Zap size={28} fill={mode === 'quick-facts' ? "currentColor" : "none"} />
              <span className="text-[10px] font-black uppercase">Quick Facts</span>
            </button>
            <button 
              onClick={() => setMode('playground')}
              className={`flex flex-col items-center gap-1 transition-colors ${mode === 'playground' ? 'text-emerald-500' : 'text-gray-400 hover:text-emerald-400'}`}
            >
              <FlaskConical size={28} fill={mode === 'playground' ? "currentColor" : "none"} />
              <span className="text-[10px] font-black uppercase">Playground</span>
            </button>
            <button 
              onClick={() => setMode('user-stats')}
              className={`flex flex-col items-center gap-1 transition-colors ${mode === 'user-stats' ? 'text-emerald-500' : 'text-gray-400 hover:text-emerald-400'}`}
            >
              <Trophy size={28} fill={mode === 'user-stats' ? "currentColor" : "none"} />
              <span className="text-[10px] font-black uppercase">Dashboard</span>
            </button>
            <button 
              onClick={() => setMode('about')}
              className={`flex flex-col items-center gap-1 transition-colors ${mode === 'about' ? 'text-emerald-500' : 'text-gray-400 hover:text-emerald-400'}`}
            >
              <Info size={28} fill={mode === 'about' ? "currentColor" : "none"} />
              <span className="text-[10px] font-black uppercase">About</span>
            </button>
          </div>
        </nav>
      )}

      <AnimatePresence>
        {showChallengeResult && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center"
            >
              <Trophy className="text-yellow-500 mx-auto mb-4" size={64} />
              <h3 className="text-3xl font-black text-gray-800 uppercase tracking-tight mb-2">Challenge Complete!</h3>
              <p className="text-gray-500 text-lg mb-6">
                You scored <span className="text-emerald-500 font-black">{challengeResponses.filter(r => r.isCorrect).length}</span> out of {challengeQuestions.length}
              </p>
              
              <div className="space-y-4">
                <div className="text-left">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Enter Your Name</label>
                  <input 
                    type="text" 
                    value={challengeStudentName}
                    onChange={(e) => setChallengeStudentName(e.target.value)}
                    placeholder="Student Name"
                    className="w-full p-4 rounded-2xl border-2 border-gray-200 font-bold text-lg focus:border-emerald-500 outline-none transition-colors"
                  />
                </div>
                <button
                  disabled={!challengeStudentName.trim()}
                  onClick={finalizeChallenge}
                  className={`w-full py-4 rounded-2xl font-black text-xl uppercase tracking-widest transition-all ${
                    challengeStudentName.trim()
                      ? 'bg-emerald-500 text-white shadow-[0_6px_0_0_#059669] active:shadow-none active:translate-y-1'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Save Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
