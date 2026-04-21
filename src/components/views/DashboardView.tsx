import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Heart, BookOpen, GraduationCap, Languages, ChevronLeft, 
  CheckCircle2, XCircle, Trophy, Trash2, Lock, FileText, 
  Download, Star, Zap, Chrome, LayoutGrid, Info, ArrowRight, RefreshCw,
  QrCode, Edit, Database, LogOut
} from 'lucide-react';
import { Unit, ChallengeRecord, ChallengeResponse, Question } from '../../types';

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
    startQuiz, startRevision, startVocab
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
          <button 
            onClick={() => setIsAdminOpen(true)}
            className="bg-red-500 text-white px-6 py-2 rounded-xl font-black uppercase tracking-widest text-xs shadow-[0_4px_0_0_#b91c1c] active:shadow-none active:translate-y-1 transition-all"
          >
            Admin Access
          </button>
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
    </div>
  );
};

export default DashboardView;
