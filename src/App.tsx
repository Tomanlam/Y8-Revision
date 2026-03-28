/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  BookOpen, 
  GraduationCap, 
  Languages, 
  ChevronLeft, 
  CheckCircle2, 
  XCircle, 
  Trophy,
  ArrowRight,
  Home,
  RefreshCw
} from 'lucide-react';
import { units, Unit, Question, Vocab } from './data';

type AppMode = 'splash' | 'dashboard' | 'quiz' | 'quiz-select' | 'revision' | 'vocab' | 'result' | 'user-stats';
type QuizSubMode = 'quick' | 'time-attack' | 'marathon';

interface SessionStats {
  [unitId: number]: {
    attemptedQuestions: string[];
    masteredVocab: string[];
  }
}

export default function App() {
  const [mode, setMode] = useState<AppMode>('splash');
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [quizProgress, setQuizProgress] = useState(0);
  const [score, setScore] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [hearts, setHearts] = useState(5);
  const [quizSubMode, setQuizSubMode] = useState<QuizSubMode>('quick');
  const [timeLeft, setTimeLeft] = useState(30);
  const [isY8Open, setIsY8Open] = useState(false);
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

  // Time Attack timer
  useEffect(() => {
    if (mode === 'quiz' && quizSubMode === 'time-attack' && timeLeft > 0 && !isAnswerChecked) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setMode('result');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [mode, quizSubMode, timeLeft, isAnswerChecked]);

  const startQuiz = (unit: Unit) => {
    setSelectedUnit(unit);
    setMode('quiz-select');
  };

  const startQuizWithMode = (unit: Unit, subMode: QuizSubMode) => {
    setQuizSubMode(subMode);
    const shuffled = [...unit.questions].sort(() => 0.5 - Math.random());
    
    if (subMode === 'quick') {
      setQuizQuestions(shuffled.slice(0, 10));
    } else if (subMode === 'time-attack') {
      setQuizQuestions(shuffled);
      setTimeLeft(30);
    } else {
      setQuizQuestions(shuffled);
    }

    setCurrentQuestionIndex(0);
    setScore(0);
    setQuizProgress(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setHearts(5);
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

  const handleOptionSelect = (option: string) => {
    if (!isAnswerChecked) {
      setSelectedOption(option);
    }
  };

  const checkAnswer = () => {
    if (selectedOption && selectedUnit) {
      setIsAnswerChecked(true);
      
      // Track attempted question
      const qId = quizQuestions[currentQuestionIndex].id;
      setSessionStats(prev => {
        const unitStats = prev[selectedUnit.id] || { attemptedQuestions: [], masteredVocab: [] };
        if (!unitStats.attemptedQuestions.includes(qId)) {
          return {
            ...prev,
            [selectedUnit.id]: {
              ...unitStats,
              attemptedQuestions: [...unitStats.attemptedQuestions, qId]
            }
          };
        }
        return prev;
      });

      if (selectedOption === quizQuestions[currentQuestionIndex].correctAnswer) {
        setScore(prev => prev + 1);
      } else {
        setHearts(prev => Math.max(0, prev - 1));
      }
    }
  };

  const nextQuestion = () => {
    if (hearts <= 0) {
      setMode('result');
      return;
    }
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < quizQuestions.length) {
      setCurrentQuestionIndex(nextIndex);
      setSelectedOption(null);
      setIsAnswerChecked(false);
      setQuizProgress(((nextIndex) / quizQuestions.length) * 100);
    } else {
      if (quizSubMode === 'time-attack' || quizSubMode === 'marathon') {
        // Shuffle again and continue for time-attack or marathon if we run out of questions
        const reshuffled = [...selectedUnit!.questions].sort(() => 0.5 - Math.random());
        setQuizQuestions(prev => [...prev, ...reshuffled]);
        setCurrentQuestionIndex(nextIndex);
        setSelectedOption(null);
        setIsAnswerChecked(false);
      } else {
        setQuizProgress(100);
        setMode('result');
      }
    }
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
          <h1 className="text-2xl font-black text-emerald-500 tracking-tight">SCIENCE QUEST</h1>
          <button 
            onClick={() => setIsY8Open(true)}
            className="bg-orange-500 text-white px-4 py-1.5 rounded-full font-black text-sm uppercase tracking-widest shadow-[0_4px_0_0_#c2410c] active:shadow-none active:translate-y-1 transition-all"
          >
            Y8
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6 mt-4">
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
      </main>
    </div>
  );

  const QuizSelectView = () => (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tight mb-2">Choose Your Challenge</h2>
          <p className="text-gray-500 font-medium">{selectedUnit?.title}</p>
        </div>

        <div className="grid gap-4">
          <button
            onClick={() => startQuizWithMode(selectedUnit!, 'quick')}
            className="bg-white border-2 border-gray-200 p-6 rounded-3xl flex items-center gap-6 hover:border-emerald-400 transition-all group shadow-[0_4px_0_0_#e5e7eb] hover:shadow-[0_4px_0_0_#34d399]"
          >
            <div className="bg-emerald-100 text-emerald-600 p-4 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <CheckCircle2 size={32} />
            </div>
            <div className="text-left">
              <h3 className="font-black text-xl text-gray-800 uppercase">Quick Mode</h3>
              <p className="text-gray-500 text-sm">10 random questions to test your knowledge.</p>
            </div>
          </button>

          <button
            onClick={() => startQuizWithMode(selectedUnit!, 'time-attack')}
            className="bg-white border-2 border-gray-200 p-6 rounded-3xl flex items-center gap-6 hover:border-orange-400 transition-all group shadow-[0_4px_0_0_#e5e7eb] hover:shadow-[0_4px_0_0_#fb923c]"
          >
            <div className="bg-orange-100 text-orange-600 p-4 rounded-2xl group-hover:bg-orange-500 group-hover:text-white transition-colors">
              <Trophy size={32} />
            </div>
            <div className="text-left">
              <h3 className="font-black text-xl text-gray-800 uppercase">Time Attack</h3>
              <p className="text-gray-500 text-sm">Race against the clock! 30 seconds to answer as many as you can.</p>
            </div>
          </button>

          <button
            onClick={() => startQuizWithMode(selectedUnit!, 'marathon')}
            className="bg-white border-2 border-gray-200 p-6 rounded-3xl flex items-center gap-6 hover:border-blue-400 transition-all group shadow-[0_4px_0_0_#e5e7eb] hover:shadow-[0_4px_0_0_#60a5fa]"
          >
            <div className="bg-blue-100 text-blue-600 p-4 rounded-2xl group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <BookOpen size={32} />
            </div>
            <div className="text-left">
              <h3 className="font-black text-xl text-gray-800 uppercase">Marathon</h3>
              <p className="text-gray-500 text-sm">All questions in random order. No time limit.</p>
            </div>
          </button>
        </div>

        <button
          onClick={() => setMode('dashboard')}
          className="w-full mt-8 text-gray-400 font-bold uppercase tracking-widest hover:text-gray-600 transition-colors"
        >
          Go Back
        </button>
      </div>
    </div>
  );

  const QuizView = () => {
    const currentQuestion = quizQuestions[currentQuestionIndex];
    const isCorrect = selectedOption === currentQuestion.correctAnswer;

    return (
      <div className="min-h-screen bg-white flex flex-col">
        <header className="p-4 flex items-center gap-4 max-w-2xl mx-auto w-full">
          <button onClick={() => setMode('dashboard')} className="text-gray-400 hover:text-gray-600">
            <XCircle size={32} />
          </button>
          
          <div className="flex-1 flex flex-col gap-1">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {quizSubMode === 'time-attack' ? 'Time Attack' : quizSubMode === 'marathon' ? 'Marathon' : 'Quick Mode'}
              </span>
              {(quizSubMode === 'quick' || quizSubMode === 'marathon') && (
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                  Question {currentQuestionIndex + 1}
                </span>
              )}
              {quizSubMode === 'time-attack' && (
                <span className={`text-sm font-black uppercase tracking-widest ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-orange-500'}`}>
                  {timeLeft}s
                </span>
              )}
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: quizSubMode === 'time-attack' ? `${(timeLeft / 30) * 100}%` : `${quizProgress}%` }}
                className={`h-full rounded-full transition-all ${quizSubMode === 'time-attack' ? (timeLeft <= 5 ? 'bg-red-500' : 'bg-orange-500') : 'bg-emerald-500'}`}
              />
            </div>
          </div>

          <div className="flex items-center gap-1 text-red-500 font-bold">
            <Heart size={20} fill={hearts > 0 ? "currentColor" : "none"} />
            <span>{hearts}</span>
          </div>
        </header>

        <main className="flex-1 max-w-2xl mx-auto w-full p-6 flex flex-col">
          <h2 className="text-2xl font-black text-gray-800 mb-8">{currentQuestion.text}</h2>
          
          <div className="space-y-4 flex-1">
            {currentQuestion.options.map((option) => (
              <button
                key={option}
                disabled={isAnswerChecked}
                onClick={() => handleOptionSelect(option)}
                className={`w-full p-4 text-left rounded-2xl border-2 transition-all font-bold text-lg
                  ${selectedOption === option 
                    ? 'border-blue-400 bg-blue-50 text-blue-600 shadow-[0_4px_0_0_#60a5fa]' 
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700 shadow-[0_4px_0_0_#e5e7eb]'
                  }
                  ${isAnswerChecked && option === currentQuestion.correctAnswer ? 'border-emerald-400 bg-emerald-50 text-emerald-600 shadow-[0_4px_0_0_#34d399]' : ''}
                  ${isAnswerChecked && selectedOption === option && !isCorrect ? 'border-red-400 bg-red-50 text-red-600 shadow-[0_4px_0_0_#f87171]' : ''}
                `}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {isAnswerChecked && option === currentQuestion.correctAnswer && <CheckCircle2 size={24} />}
                  {isAnswerChecked && selectedOption === option && !isCorrect && <XCircle size={24} />}
                </div>
              </button>
            ))}
          </div>
        </main>

        <footer className={`p-6 border-t-2 transition-colors ${isAnswerChecked ? (isCorrect ? 'bg-emerald-100 border-emerald-200' : 'bg-red-100 border-red-200') : 'bg-white border-gray-100'}`}>
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            {isAnswerChecked ? (
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${isCorrect ? 'bg-white text-emerald-500' : 'bg-white text-red-500'}`}>
                  {isCorrect ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
                </div>
                <div>
                  <h3 className={`font-black text-xl ${isCorrect ? 'text-emerald-700' : 'text-red-700'}`}>
                    {isCorrect ? 'Excellent!' : 'Correct answer:'}
                  </h3>
                  {!isCorrect && <p className="text-red-600 font-bold">{currentQuestion.correctAnswer}</p>}
                </div>
              </div>
            ) : (
              <div />
            )}
            
            <button
              onClick={isAnswerChecked ? nextQuestion : checkAnswer}
              disabled={!selectedOption}
              className={`px-10 py-3 rounded-2xl font-black text-lg uppercase tracking-wider transition-all
                ${!selectedOption 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : isAnswerChecked 
                    ? (isCorrect ? 'bg-emerald-500 text-white shadow-[0_4px_0_0_#059669]' : 'bg-red-500 text-white shadow-[0_4px_0_0_#dc2626]')
                    : 'bg-emerald-500 text-white shadow-[0_4px_0_0_#059669]'
                }
              `}
            >
              {isAnswerChecked ? 'Continue' : 'Check'}
            </button>
          </div>
        </footer>
      </div>
    );
  };

  const ResultView = () => (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="bg-yellow-100 p-8 rounded-full text-yellow-500 mb-8"
      >
        <Trophy size={100} />
      </motion.div>
      <h2 className="text-4xl font-black text-gray-800 mb-2">
        {hearts > 0 ? (quizSubMode === 'time-attack' ? 'Time Up!' : 'Unit Complete!') : 'Out of Hearts!'}
      </h2>
      <p className="text-gray-500 text-xl mb-8">
        {hearts > 0 
          ? (quizSubMode === 'time-attack' ? `Great effort in Time Attack!` : `You've mastered some ${selectedUnit?.title} concepts!`)
          : `Don't give up! Review the notes and try again.`}
      </p>
      
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-12">
        <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-4">
          <p className="text-orange-400 font-bold uppercase text-xs">Score</p>
          <p className="text-orange-600 font-black text-2xl">
            {quizSubMode === 'time-attack' ? score : `${score} / ${quizQuestions.length}`}
          </p>
        </div>
        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4">
          <p className="text-blue-400 font-bold uppercase text-xs">Accuracy</p>
          <p className="text-blue-600 font-black text-2xl">
            {score > 0 ? Math.round((score / (currentQuestionIndex + (isAnswerChecked ? 1 : 0))) * 100) : 0}%
          </p>
        </div>
      </div>

      <button
        onClick={() => setMode('dashboard')}
        className="w-full max-w-sm bg-emerald-500 text-white py-4 rounded-2xl font-black text-xl uppercase tracking-widest shadow-[0_6px_0_0_#059669] active:shadow-none active:translate-y-1 transition-all"
      >
        Finish
      </button>
    </div>
  );

  const RevisionView = () => (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b-2 border-gray-200 p-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button onClick={() => setMode('dashboard')} className="text-gray-400 hover:text-gray-600">
            <ChevronLeft size={32} />
          </button>
          <h1 className="text-xl font-black text-gray-800 uppercase tracking-tight">{selectedUnit?.title} Notes</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6 space-y-6">
        <div className={`${selectedUnit?.color} rounded-3xl p-8 text-white shadow-lg`}>
          <h2 className="text-3xl font-black mb-2">{selectedUnit?.title}</h2>
          <p className="text-white/90 text-lg">{selectedUnit?.description}</p>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-black text-gray-400 uppercase tracking-widest">Key Concepts</h3>
          {selectedUnit?.concepts.map((concept, i) => (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              key={i} 
              className="bg-white border-2 border-gray-200 rounded-2xl p-5 flex gap-4 items-start shadow-[0_4px_0_0_rgba(0,0,0,0.05)]"
            >
              <div className="bg-blue-100 text-blue-600 p-2 rounded-lg mt-1">
                <CheckCircle2 size={20} />
              </div>
              <p className="text-gray-700 text-lg font-medium leading-relaxed">
                {concept.includes(': ') ? (
                  <>
                    <span className="font-black text-gray-900">{concept.split(': ')[0]}:</span>
                    {concept.substring(concept.indexOf(': ') + 1)}
                  </>
                ) : (
                  concept
                )}
              </p>
            </motion.div>
          ))}
        </div>

        <button
          onClick={() => startQuiz(selectedUnit!)}
          className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-black text-xl uppercase tracking-widest shadow-[0_6px_0_0_#059669] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-3"
        >
          Take the Quiz <ArrowRight size={24} />
        </button>
      </main>
    </div>
  );

  const VocabView = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [masteredIndices, setMasteredIndices] = useState<number[]>([]);
    const [remainingIndices, setRemainingIndices] = useState<number[]>([]);
    const [isSimplified, setIsSimplified] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [colorIndex, setColorIndex] = useState(0);

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
        setRemainingIndices(selectedUnit.vocab.map((_, i) => i));
        setMasteredIndices([]);
        setCurrentIndex(0);
        setIsCompleted(false);
      }
    }, [selectedUnit]);

    const handleSwipe = (direction: 'left' | 'right') => {
      const currentVocabIdx = remainingIndices[currentIndex];
      const currentVocab = selectedUnit?.vocab[currentVocabIdx];
      
      if (direction === 'right' && currentVocab) {
        // Mastered
        const newMastered = [...masteredIndices, currentVocabIdx];
        setMasteredIndices(newMastered);

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
        
        const newRemaining = remainingIndices.filter(idx => idx !== currentVocabIdx);
        setRemainingIndices(newRemaining);
        
        if (newRemaining.length === 0) {
          setIsCompleted(true);
          return;
        }
      }

      // Cycle to next
      setIsFlipped(false);
      setColorIndex((prev) => (prev + 1) % duolingoColors.length);
      
      // If we swiped left, the item stays in remainingIndices, so we just move to next index
      // If we swiped right, the item was removed, so the "next" item is now at the same index
      // unless we were at the end of the list.
      if (direction === 'left') {
        setCurrentIndex((prev) => (prev + 1) % remainingIndices.length);
      } else {
        // After removal, if we were at the last item, go back to 0
        if (currentIndex >= remainingIndices.length - 1) {
          setCurrentIndex(0);
        }
        // Otherwise currentIndex stays the same but points to a new item
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
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={() => setMode('dashboard')}
            className="bg-emerald-500 text-white px-12 py-4 rounded-2xl font-black text-xl uppercase tracking-widest shadow-[0_6px_0_0_#059669] active:shadow-none active:translate-y-1 transition-all"
          >
            Back to Dashboard
          </motion.button>
        </div>
      );
    }

    const currentVocab = selectedUnit?.vocab[remainingIndices[currentIndex]];

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col overflow-hidden">
        <header className="bg-white border-b-2 border-gray-200 p-4 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
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
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-6 relative">
          <div className="w-full max-w-sm aspect-[3/4] relative perspective-1000">
            <AnimatePresence mode="wait">
              <motion.div
                key={remainingIndices[currentIndex]}
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
                  x: 0, // We handle exit animation manually via swipe if needed, but AnimatePresence needs a key change
                  opacity: 0,
                  scale: 0.8
                }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                onClick={() => setIsFlipped(!isFlipped)}
                className={`w-full h-full cursor-pointer preserve-3d relative transition-shadow duration-300 ${!isFlipped ? duolingoShadows[colorIndex] : 'shadow-xl'}`}
              >
                {/* Front */}
                <div 
                  className={`absolute inset-0 backface-hidden rounded-3xl flex flex-col items-center justify-center p-8 text-center ${duolingoColors[colorIndex]}`}
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
                  className="absolute inset-0 backface-hidden rounded-3xl bg-white flex flex-col items-center justify-center p-8 text-center rotate-y-180 border-4 border-gray-100"
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

            {/* Swipe Indicators */}
            <div className="absolute -bottom-20 left-0 right-0 flex justify-between px-4">
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
          </div>
        </main>

        <footer className="p-6 text-center">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
            Swipe left to revise • Swipe right to master
          </p>
        </footer>

        <style>{`
          .perspective-1000 { perspective: 1000px; }
          .preserve-3d { transform-style: preserve-3d; }
          .backface-hidden { backface-visibility: hidden; }
          .rotate-y-180 { transform: rotateY(180deg); }
        `}</style>
      </div>
    );
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

  return (
    <div className="font-sans selection:bg-emerald-200">
      <AnimatePresence mode="wait">
        {mode === 'splash' && <SplashScreen key="splash" />}
        {mode === 'dashboard' && <Dashboard key="dashboard" />}
        {mode === 'quiz-select' && <QuizSelectView key="quiz-select" />}
        {mode === 'quiz' && <QuizView key="quiz" />}
        {mode === 'result' && <ResultView key="result" />}
        {mode === 'revision' && <RevisionView key="revision" />}
        {mode === 'vocab' && <VocabView key="vocab" />}
        {mode === 'user-stats' && <UserDashboardView key="user-stats" />}
      </AnimatePresence>

      {/* Bottom Nav for Dashboard and User Stats */}
      {['dashboard', 'user-stats'].includes(mode) && (
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
              onClick={() => setMode('user-stats')}
              className={`flex flex-col items-center gap-1 transition-colors ${mode === 'user-stats' ? 'text-emerald-500' : 'text-gray-400 hover:text-emerald-400'}`}
            >
              <Trophy size={28} fill={mode === 'user-stats' ? "currentColor" : "none"} />
              <span className="text-[10px] font-black uppercase">Dashboard</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-emerald-400 transition-colors">
              <GraduationCap size={28} />
              <span className="text-[10px] font-black uppercase">Profile</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
