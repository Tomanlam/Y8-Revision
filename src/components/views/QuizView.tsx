import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, CheckCircle2, XCircle, Trophy, RefreshCcw, 
  ArrowRight, ShieldCheck, Zap, Star, LayoutGrid, Timer
} from 'lucide-react';
import { Unit } from '../../types';

interface QuizViewProps {
  unit: Unit | undefined;
  onBack: () => void;
  sessionStats: any;
  setSessionStats: (stats: any | ((prev: any) => any)) => void;
}

const QuizView: React.FC<QuizViewProps> = ({ unit, onBack, sessionStats, setSessionStats }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [streak, setStreak] = useState(0);
  const [startTime] = useState(Date.now());

  if (!unit) return null;

  const currentQuestion = unit.questions[currentIndex];

  const handleAnswerSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedAnswer(index);
    setIsAnswered(true);

    const isCorrect = index === currentQuestion.correct;
    if (isCorrect) {
      setScore(prev => prev + 1);
      setStreak(prev => prev + 1);
    } else {
      setStreak(0);
    }

    // Record attempt
    setSessionStats((prev: any) => ({
      ...prev,
      [unit.id]: {
        ...prev[unit.id],
        attemptedQuestions: [...(prev[unit.id]?.attemptedQuestions || []), currentQuestion.id]
      }
    }));
  };

  const handleNext = () => {
    if (currentIndex < unit.questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      setShowResults(true);
    }
  };

  const progress = ((currentIndex + 1) / unit.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b-2 border-gray-100 p-4 sticky top-0 z-10">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
              <X size={24} />
            </button>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{unit.title}</span>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Question {currentIndex + 1} / {unit.questions.length}</span>
              </div>
              <div className="h-2 w-48 bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-blue-500 rounded-full"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="bg-orange-100 px-3 py-1 rounded-full text-orange-600 font-bold text-sm flex items-center gap-1.5">
               <Zap size={14} fill="currentColor" />
               {streak}
             </div>
             <div className="bg-blue-100 px-3 py-1 rounded-full text-blue-600 font-bold text-sm">
               {score}
             </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-4xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {!showResults ? (
            <motion.div
              key={currentIndex}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="w-full space-y-8"
            >
              <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-[0_8px_0_0_#e5e7eb] border-2 border-gray-100 text-center">
                <h2 className="text-2xl md:text-4xl font-black text-gray-800 leading-tight">
                  {currentQuestion.text}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = selectedAnswer === idx;
                  const isCorrect = idx === currentQuestion.correct;
                  
                  let stateStyle = 'border-gray-200 hover:border-blue-200 hover:bg-blue-50/50';
                  if (isAnswered) {
                    if (isCorrect) stateStyle = 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-[0_4px_0_0_#10b981]';
                    else if (isSelected) stateStyle = 'border-red-500 bg-red-50 text-red-700 shadow-[0_4px_0_0_#ef4444]';
                    else stateStyle = 'border-gray-100 opacity-50';
                  } else if (isSelected) {
                    stateStyle = 'border-blue-500 bg-blue-50 text-blue-700';
                  }

                  return (
                    <motion.button
                      key={idx}
                      whileTap={{ scale: 0.98 }}
                      disabled={isAnswered}
                      onClick={() => handleAnswerSelect(idx)}
                      className={`w-full p-5 text-left rounded-2xl border-2 font-bold transition-all flex items-center justify-between group ${stateStyle}`}
                    >
                      <span className="flex-1">{option}</span>
                      {isAnswered && isCorrect && <CheckCircle2 size={24} className="text-emerald-500" />}
                      {isAnswered && isSelected && !isCorrect && <XCircle size={24} className="text-red-500" />}
                    </motion.button>
                  );
                })}
              </div>

              {isAnswered && (
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  onClick={handleNext}
                  className="w-full py-4 rounded-2xl bg-blue-500 text-white font-black uppercase tracking-widest shadow-[0_6px_0_0_#2563eb] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-3"
                >
                  {currentIndex === unit.questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                  <ArrowRight size={20} />
                </motion.button>
              )}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center bg-white p-10 rounded-[3rem] shadow-2xl w-full border-4 border-blue-50"
            >
              <div className="bg-blue-100 w-28 h-28 rounded-3xl flex items-center justify-center text-blue-500 mx-auto mb-8 shadow-xl shadow-blue-100 group">
                <Trophy size={60} className="group-hover:rotate-12 transition-transform" />
              </div>
              <h2 className="text-4xl font-black text-gray-800 uppercase tracking-tighter mb-2">Quiz Complete!</h2>
              <p className="text-gray-400 font-bold mb-10">You've mastered the content for {unit.title}.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                <div className="bg-gray-50 p-6 rounded-3xl border-2 border-gray-100">
                  <div className="bg-white p-2 rounded-xl shadow-sm inline-block mb-3 text-blue-500">
                    <Star size={20} fill="currentColor" />
                  </div>
                  <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest mb-1">Score</p>
                  <p className="text-3xl font-black text-gray-800">{Math.round((score / unit.questions.length) * 100)}%</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-3xl border-2 border-gray-100">
                  <div className="bg-white p-2 rounded-xl shadow-sm inline-block mb-3 text-orange-500">
                    <Timer size={20} />
                  </div>
                  <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest mb-1">Time</p>
                  <p className="text-3xl font-black text-gray-800">{Math.floor((Date.now() - startTime) / 1000)}s</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-3xl border-2 border-gray-100">
                  <div className="bg-white p-2 rounded-xl shadow-sm inline-block mb-3 text-emerald-500">
                    <ShieldCheck size={20} fill="currentColor" />
                  </div>
                  <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest mb-1">Correct</p>
                  <p className="text-3xl font-black text-emerald-600">{score}/{unit.questions.length}</p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => {
                    setCurrentIndex(0);
                    setScore(0);
                    setShowResults(false);
                    setSelectedAnswer(null);
                    setIsAnswered(false);
                    setStreak(0);
                  }}
                  className="w-full py-5 rounded-2xl bg-blue-500 text-white font-black uppercase tracking-widest shadow-[0_6px_0_0_#2563eb] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-3"
                >
                  <RefreshCcw size={20} /> Try Again
                </button>
                <button 
                  onClick={onBack}
                  className="w-full py-5 rounded-2xl border-4 border-gray-100 text-gray-400 font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
                >
                  Back to Hub
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default QuizView;
