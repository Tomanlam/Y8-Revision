import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, CheckCircle2, XCircle, Trophy, RefreshCcw, 
  ArrowRight, ShieldCheck, Zap, Star, LayoutGrid, Timer, Languages
} from 'lucide-react';
import { Unit } from '../../types';

interface QuizViewProps {
  unit: Unit | undefined;
  onBack: () => void;
  sessionStats: any;
  setSessionStats: (stats: any | ((prev: any) => any)) => void;
  onComplete?: (score: number, total: number) => void;
  isShadowing?: boolean;
}

const QuizView: React.FC<QuizViewProps> = ({ unit, onBack, sessionStats, setSessionStats, onComplete, isShadowing }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [status, setStatus] = useState<'idle' | 'selected' | 'checked'>('idle');
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [streak, setStreak] = useState(0);
  const [startTime] = useState(Date.now());
  
  const [assistMode, setAssistMode] = useState(false);
  const [assistLang, setAssistLang] = useState<'traditional' | 'simplified'>('traditional');

  if (!unit) return null;

  const currentQuestion = unit.questions[currentIndex];
  
  const getCorrectIndex = (q: any) => {
    if (typeof q.correct === 'number') return q.correct;
    if (!q.options || !q.correctAnswer) return -1;
    
    const target = q.correctAnswer.toString().trim().toLowerCase();
    return q.options.findIndex((opt: string) => 
      opt.toString().trim().toLowerCase() === target
    );
  };

  const correctIndex = getCorrectIndex(currentQuestion);
  const isCorrect = selectedAnswer === correctIndex;
  
  const currentTranslation = assistLang === 'traditional' ? {
    text: currentQuestion.textTraditional,
    options: currentQuestion.optionsTraditional,
    correctAnswer: currentQuestion.correctAnswerTraditional
  } : {
    text: currentQuestion.textSimplified,
    options: currentQuestion.optionsSimplified,
    correctAnswer: currentQuestion.correctAnswerSimplified
  };

  const handleAnswerSelect = (index: number) => {
    if (status === 'checked') return;
    setSelectedAnswer(index);
    setStatus('selected');
  };

  const handleCheck = () => {
    if (status !== 'selected' || selectedAnswer === null) return;
    
    setStatus('checked');
    const correct = selectedAnswer === correctIndex;
    
    if (correct) {
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
      setStatus('idle');
    } else {
      setShowResults(true);
    }
  };

  const progress = ((currentIndex + (status === 'checked' && isCorrect ? 1 : 0)) / unit.questions.length) * 100;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans selection:bg-teal-100">
      {!showResults && (
        <header className={`flex items-center justify-between px-4 py-4 md:px-8 max-w-5xl mx-auto w-full gap-4 sticky top-0 z-10 transition-all duration-500 ${isShadowing ? 'bg-emerald-500/15' : 'bg-white/[0.03]'} backdrop-blur-sm -mb-4`}>
          <button 
            onClick={onBack} 
            className="text-gray-400 hover:text-teal-600 transition-colors p-2 bg-white rounded-full shadow-sm"
          >
            <X size={24} />
          </button>
          <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden relative shadow-inner">
            <motion.div 
              initial={false}
              animate={{ width: `${progress}%` }}
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-500 ease-out"
            />
          </div>
          <div className="flex items-center gap-1.5 font-black text-orange-500 bg-white px-3 py-1.5 rounded-2xl shadow-sm">
            <Zap size={20} fill="currentColor" />
            <span className="text-lg">{streak}</span>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <button 
              onClick={() => setAssistMode(!assistMode)}
              className={`px-3 py-2 rounded-2xl border-2 transition-all font-black flex items-center gap-1.5 md:gap-2 uppercase tracking-widest text-xs md:text-sm ${assistMode ? 'bg-teal-50 border-teal-200 text-teal-700 shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:border-teal-200 hover:text-teal-600 shadow-[0_4px_0_0_rgba(0,0,0,0.05)] active:translate-y-1 active:shadow-none'}`}
              title="Assist Mode"
            >
              <Languages size={18} />
              <span className="hidden sm:inline">Assist</span>
            </button>
            {assistMode && (
              <button 
                onClick={() => setAssistLang(prev => prev === 'traditional' ? 'simplified' : 'traditional')}
                className="w-10 h-10 flex items-center justify-center rounded-2xl text-sm font-black border-2 border-gray-200 text-gray-600 bg-white hover:bg-gray-50 transition-all shadow-[0_4px_0_0_rgba(0,0,0,0.05)] active:translate-y-1 active:shadow-none"
              >
                {assistLang === 'traditional' ? '繁' : '简'}
              </button>
            )}
          </div>
        </header>
      )}

      <main className={`flex-1 flex flex-col items-center w-full mx-auto px-4 md:px-8 pb-32 pt-12 md:pt-20 transition-all duration-300 ${assistMode ? 'max-w-5xl' : 'max-w-3xl'}`}>
        <AnimatePresence mode="wait">
          {!showResults ? (
            <motion.div
              key={currentIndex}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className={`w-full mx-auto flex flex-col gap-8 ${assistMode ? 'max-w-4xl' : 'max-w-xl'}`}
            >
              <h2 className="w-full text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-[2rem] p-6 md:p-10 shadow-lg text-2xl md:text-3xl font-black tracking-tight leading-snug">
                {assistMode ? (
                  <div className="flex flex-col md:flex-row md:items-stretch gap-4">
                    <span className="flex-1">{currentQuestion.text}</span>
                    <div className="flex-1 bg-white/20 backdrop-blur-sm text-teal-50 p-4 md:p-6 rounded-2xl border border-white/20 shadow-inner">
                      {currentTranslation.text ? (
                        <span>{currentTranslation.text}</span>
                      ) : (
                        <span className="opacity-50">Translation unavailable in static data.</span>
                      )}
                    </div>
                  </div>
                ) : (
                  currentQuestion.text
                )}
              </h2>

              <div className="flex flex-col gap-3 md:gap-4 mt-2">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = selectedAnswer === idx;
                  const isChecked = status === 'checked';
                  const isOptionCorrect = idx === correctIndex;
                  
                  let stateStyle = 'bg-white border-2 border-gray-200 text-gray-700 hover:border-teal-300 shadow-[0_4px_0_0_rgba(0,0,0,0.05)] active:shadow-none active:translate-y-1 hover:shadow-md';
                  
                  if (isChecked) {
                    if (isOptionCorrect) {
                      stateStyle = 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-none translate-y-1';
                    } else if (isSelected) {
                      stateStyle = 'border-red-500 bg-red-50 text-red-800 shadow-none translate-y-1';
                    } else {
                      stateStyle = 'bg-white border-gray-200 text-gray-400 opacity-50 shadow-none translate-y-1';
                    }
                  } else if (isSelected) {
                    stateStyle = 'border-teal-500 bg-teal-50 text-teal-800 shadow-[0_4px_0_0_#14b8a6] ring-2 ring-teal-100/50';
                  }

                  return (
                    <button
                      key={idx}
                      disabled={isChecked}
                      onClick={() => handleAnswerSelect(idx)}
                      className={`w-full p-4 md:p-5 relative text-left rounded-3xl font-black transition-all ${stateStyle}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm transition-colors shrink-0 shadow-sm border ${
                          isChecked && isOptionCorrect ? 'bg-emerald-500 text-white border-emerald-600' :
                          isChecked && isSelected && !isOptionCorrect ? 'bg-red-500 text-white border-red-600' :
                          isSelected ? 'bg-teal-500 text-white border-teal-600' :
                          'bg-gray-100 text-gray-500 border-gray-200'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 text-lg">
                          {assistMode ? (
                            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 justify-between">
                              <span className="flex-1 text-gray-800 tracking-tight">{option}</span>
                              <div className="flex-1 text-sm md:text-base md:text-right text-teal-700/80 pt-1 md:pt-0 border-t md:border-t-0 md:border-l border-teal-200/50 md:pl-6 font-bold tracking-tight">
                                {currentTranslation.options && currentTranslation.options[idx] ? (
                                  currentTranslation.options[idx]
                                ) : (
                                  <span className="opacity-50 text-xs">...</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="tracking-tight text-gray-800">{option}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center w-full max-w-xl mx-auto pt-10"
            >
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 w-32 h-32 rounded-[2rem] flex items-center justify-center text-white mx-auto mb-8 shadow-lg shadow-orange-200 group">
                <Trophy size={64} className="group-hover:rotate-12 transition-transform" fill="currentColor" />
              </div>
              <h2 className="text-3xl font-black text-gray-800 mb-2 uppercase tracking-tight">Lesson Complete!</h2>
              <p className="text-gray-500 font-bold mb-10 text-lg">Great job finishing {unit.title}.</p>
              
              <div className="flex gap-4 mb-10">
                <div className="flex-1 bg-white border-2 border-gray-100 shadow-[0_4px_0_0_rgba(0,0,0,0.05)] p-6 rounded-3xl flex flex-col items-center">
                  <div className="text-orange-500 font-black text-sm uppercase tracking-widest mb-2">Total XP</div>
                  <div className="text-4xl font-black text-orange-500 flex items-center gap-1">
                    <Zap size={28} fill="currentColor" /> {score * 10}
                  </div>
                </div>
                <div className="flex-1 bg-white border-2 border-gray-100 shadow-[0_4px_0_0_rgba(0,0,0,0.05)] p-6 rounded-3xl flex flex-col items-center">
                  <div className="text-teal-500 font-black text-sm uppercase tracking-widest mb-2">Accuracy</div>
                  <div className="text-4xl font-black text-teal-500 flex items-center gap-1">
                    <ShieldCheck size={28} fill="currentColor" />
                    {Math.round((score / unit.questions.length) * 100)}%
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 w-full border-t border-gray-200 bg-white/90 backdrop-blur-md px-4 py-4 md:py-6 z-20">
        <div className="max-w-5xl mx-auto">
          {!showResults ? (
            status === 'checked' ? (
              <div className={`p-4 md:p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 w-full shadow-sm ${isCorrect ? 'bg-emerald-100 text-emerald-900 border-2 border-emerald-200' : 'bg-red-100 text-red-900 border-2 border-red-200'}`}>
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className={`p-3 rounded-2xl flex items-center justify-center text-white shadow-sm ${isCorrect ? 'bg-emerald-500' : 'bg-red-500'}`}>
                    {isCorrect ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
                  </div>
                  <div>
                    <h3 className="font-black text-xl md:text-2xl uppercase tracking-tight">
                      {isCorrect ? 'Excellent!' : 'Incorrect'}
                    </h3>
                    {!isCorrect && (
                      <div className="text-sm font-medium mt-1">
                        Correct answer: <span className="font-black text-red-700">{currentQuestion.options[correctIndex]}</span>
                        {assistMode && currentTranslation.correctAnswer && (
                          <span className="block text-red-800 mt-2 bg-red-50 font-bold p-3 rounded-xl border border-red-200 shadow-inner">{currentTranslation.correctAnswer}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleNext}
                  className={`w-full md:w-auto px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-lg transition-transform active:scale-95 shadow-sm hover:opacity-90 ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}
                >
                  Continue
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full max-w-3xl mx-auto">
                <button
                  onClick={() => {}}
                  className="px-6 py-4 rounded-2xl text-gray-400 font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors hidden md:block"
                >
                  Skip
                </button>
                <button
                  disabled={status !== 'selected'}
                  onClick={handleCheck}
                  className={`w-full md:w-48 py-4 rounded-2xl font-black uppercase tracking-widest text-lg transition-all ${
                    status === 'selected'
                      ? 'bg-teal-500 text-white hover:bg-teal-600 shadow-[0_4px_0_0_#0f766e] active:shadow-none active:translate-y-1'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Check
                </button>
              </div>
            )
          ) : (
            <div className="flex gap-4 w-full max-w-xl mx-auto">
              <button
                 onClick={() => {
                   setCurrentIndex(0);
                   setScore(0);
                   setShowResults(false);
                   setSelectedAnswer(null);
                   setStatus('idle');
                   setStreak(0);
                 }}
                 className="w-16 h-16 md:w-auto md:flex-1 py-4 flex items-center justify-center rounded-2xl border-2 border-gray-200 text-gray-500 font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-[0_4px_0_0_#e5e7eb] active:shadow-none active:translate-y-1"
               >
                 <RefreshCcw size={24} className="md:hidden" />
                 <span className="hidden md:inline">Practice Again</span>
               </button>
              <button
                onClick={() => {
                  if (onComplete) onComplete(score, unit.questions.length);
                  else onBack();
                }}
                className="flex-[3] md:flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-lg transition-all bg-emerald-500 text-white hover:bg-emerald-600 shadow-[0_4px_0_0_#059669] active:shadow-none active:translate-y-1"
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizView;
