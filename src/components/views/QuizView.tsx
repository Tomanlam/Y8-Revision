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
}

const QuizView: React.FC<QuizViewProps> = ({ unit, onBack, sessionStats, setSessionStats }) => {
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
  const correctIndex = currentQuestion.options.indexOf(currentQuestion.correctAnswer);
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
    <div className="flex flex-col min-h-screen bg-white font-sans selection:bg-blue-100">
      {!showResults && (
        <header className="flex items-center justify-between px-4 py-4 md:px-8 max-w-4xl mx-auto w-full gap-4">
          <button 
            onClick={onBack} 
            className="text-gray-400 hover:text-gray-600 transition-colors p-2"
          >
            <X size={28} />
          </button>
          <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden relative">
            <motion.div 
              initial={false}
              animate={{ width: `${progress}%` }}
              className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
            />
          </div>
          <div className="flex items-center gap-2 font-bold text-orange-500">
            <Zap size={24} fill="currentColor" />
            <span className="text-xl">{streak}</span>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <button 
              onClick={() => setAssistMode(!assistMode)}
              className={`p-2 rounded-xl border-2 transition-all font-bold flex items-center gap-1.5 md:gap-2 ${assistMode ? 'bg-blue-100 border-blue-400 text-blue-700 shadow-[0_2px_0_0_#60a5fa] translate-y-[2px]' : 'border-gray-200 text-gray-500 hover:bg-gray-50 shadow-[0_4px_0_0_#e5e7eb] active:translate-y-1 active:shadow-none'}`}
              title="Assist Mode"
            >
              <Languages size={20} />
              <span className="hidden sm:inline text-sm uppercase tracking-wider">Assist</span>
            </button>
            {assistMode && (
              <button 
                onClick={() => setAssistLang(prev => prev === 'traditional' ? 'simplified' : 'traditional')}
                className="w-10 h-10 rounded-xl text-sm font-black border-2 border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100 transition-all shadow-[0_4px_0_0_#e2e8f0] active:translate-y-1 active:shadow-none"
              >
                {assistLang === 'traditional' ? '繁' : '简'}
              </button>
            )}
          </div>
        </header>
      )}

      <main className={`flex-1 flex flex-col items-center w-full mx-auto px-4 md:px-8 pb-32 pt-4 md:pt-12 transition-all duration-300 ${assistMode ? 'max-w-5xl' : 'max-w-3xl'}`}>
        <AnimatePresence mode="wait">
          {!showResults ? (
            <motion.div
              key={currentIndex}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className={`w-full mx-auto flex flex-col gap-8 ${assistMode ? 'max-w-4xl' : 'max-w-xl'}`}
            >
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight leading-snug">
                {assistMode ? (
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <span className="flex-1">{currentQuestion.text}</span>
                    <div className="flex-1 bg-blue-50 text-blue-700 p-4 md:p-6 rounded-2xl border-2 border-blue-100 shadow-inner">
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

              <div className="flex flex-col gap-3 md:gap-4">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = selectedAnswer === idx;
                  const isChecked = status === 'checked';
                  const isOptionCorrect = idx === correctIndex;
                  
                  let stateStyle = 'border-gray-200 hover:bg-gray-50 text-gray-700 hover:border-gray-300 shadow-[0_4px_0_0_#e5e7eb] active:shadow-none active:translate-y-1';
                  
                  if (isChecked) {
                    if (isOptionCorrect) {
                      stateStyle = 'border-emerald-500 bg-emerald-100 text-emerald-700 shadow-none translate-y-1';
                    } else if (isSelected) {
                      stateStyle = 'border-red-500 bg-red-100 text-red-700 shadow-none translate-y-1';
                    } else {
                      stateStyle = 'border-gray-200 text-gray-400 opacity-50 shadow-none translate-y-1';
                    }
                  } else if (isSelected) {
                    stateStyle = 'border-blue-400 bg-blue-50 text-blue-700 shadow-[0_4px_0_0_#60a5fa] ring-2 ring-blue-100';
                  }

                  return (
                    <button
                      key={idx}
                      disabled={isChecked}
                      onClick={() => handleAnswerSelect(idx)}
                      className={`w-full p-4 relative text-left rounded-2xl border-2 font-bold transition-all ${stateStyle}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-colors shrink-0 ${
                          isChecked && isOptionCorrect ? 'bg-emerald-200 text-emerald-800' :
                          isChecked && isSelected && !isOptionCorrect ? 'bg-red-200 text-red-800' :
                          isSelected ? 'bg-blue-200 text-blue-800' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 text-lg">
                          {assistMode ? (
                            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 justify-between">
                              <span className="flex-1 font-bold">{option}</span>
                              <div className="flex-1 text-sm md:text-base md:text-right text-blue-700/80 pt-1 md:pt-0 border-t md:border-t-0 md:border-l border-blue-200/50 md:pl-6 font-medium">
                                {currentTranslation.options && currentTranslation.options[idx] ? (
                                  currentTranslation.options[idx]
                                ) : (
                                  <span className="opacity-50 text-xs">...</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            option
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
              <div className="bg-yellow-100 w-32 h-32 rounded-[2rem] flex items-center justify-center text-yellow-500 mx-auto mb-8 shadow-xl shadow-yellow-100 group">
                <Trophy size={64} className="group-hover:rotate-12 transition-transform" fill="currentColor" />
              </div>
              <h2 className="text-3xl font-black text-gray-800 mb-2">Lesson Complete!</h2>
              <p className="text-gray-500 font-bold mb-10 text-lg">Great job finishing {unit.title}.</p>
              
              <div className="flex gap-4 mb-10">
                <div className="flex-1 bg-orange-50 border-2 border-orange-200 p-4 rounded-3xl flex flex-col items-center">
                  <div className="text-orange-500 font-black text-sm uppercase tracking-widest mb-1">Total XP</div>
                  <div className="text-3xl font-black text-orange-600 flex items-center gap-1">
                    <Zap size={24} fill="currentColor" /> {score * 10}
                  </div>
                </div>
                <div className="flex-1 bg-emerald-50 border-2 border-emerald-200 p-4 rounded-3xl flex flex-col items-center">
                  <div className="text-emerald-500 font-black text-sm uppercase tracking-widest mb-1">Accuracy</div>
                  <div className="text-3xl font-black text-emerald-600 flex items-center gap-1">
                    <ShieldCheck size={24} fill="currentColor" />
                    {Math.round((score / unit.questions.length) * 100)}%
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 w-full border-t-2 bg-white px-4 py-4 md:py-6">
        <div className="max-w-4xl mx-auto">
          {!showResults ? (
            status === 'checked' ? (
              <div className={`p-4 md:p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 w-full ${isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className={`p-2 rounded-full ${isCorrect ? 'bg-emerald-200' : 'bg-red-200'}`}>
                    {isCorrect ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-xl md:text-2xl">
                      {isCorrect ? 'Excellent!' : 'Incorrect'}
                    </h3>
                    {!isCorrect && (
                      <div className="text-sm font-medium mt-1">
                        Correct answer: <span className="font-bold text-red-900">{currentQuestion.options[correctIndex]}</span>
                        {assistMode && currentTranslation.correctAnswer && (
                          <span className="block text-red-700 mt-1 bg-red-50 p-2 rounded-lg border border-red-200">{currentTranslation.correctAnswer}</span>
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
                  className="px-6 py-4 rounded-2xl text-gray-400 font-bold uppercase tracking-widest hover:bg-gray-100 hidden md:block"
                >
                  Skip
                </button>
                <button
                  disabled={status !== 'selected'}
                  onClick={handleCheck}
                  className={`w-full md:w-48 py-4 rounded-2xl font-black uppercase tracking-widest text-lg transition-all ${
                    status === 'selected'
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-[0_4px_0_0_#059669] active:shadow-none active:translate-y-1'
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
                onClick={onBack}
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
