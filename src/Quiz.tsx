import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  XCircle, 
  CheckCircle2, 
  Heart, 
  Trophy, 
  BookOpen, 
  ChevronLeft 
} from 'lucide-react';
import { Unit, Question } from './data';

type QuizSubMode = 'quick' | 'time-attack' | 'marathon';

interface QuizProps {
  selectedUnit: Unit;
  onClose: () => void;
  onQuestionAttempted: (unitId: number, questionId: string) => void;
}

export default function Quiz({ selectedUnit, onClose, onQuestionAttempted }: QuizProps) {
  const [quizMode, setQuizMode] = useState<'select' | 'quiz' | 'result'>('select');
  const [quizSubMode, setQuizSubMode] = useState<QuizSubMode>('quick');
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [quizProgress, setQuizProgress] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [hearts, setHearts] = useState(5);
  const [timeLeft, setTimeLeft] = useState(30);

  // Time Attack timer
  useEffect(() => {
    if (quizMode === 'quiz' && quizSubMode === 'time-attack' && timeLeft > 0 && !isAnswerChecked) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setQuizMode('result');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [quizMode, quizSubMode, timeLeft, isAnswerChecked]);

  const startQuizWithMode = (subMode: QuizSubMode) => {
    setQuizSubMode(subMode);
    const shuffled = [...selectedUnit.questions].sort(() => 0.5 - Math.random());
    
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
    setQuizMode('quiz');
  };

  const handleOptionSelect = (option: string) => {
    if (!isAnswerChecked) {
      setSelectedOption(option);
    }
  };

  const checkAnswer = () => {
    if (selectedOption) {
      setIsAnswerChecked(true);
      
      const qId = quizQuestions[currentQuestionIndex].id;
      onQuestionAttempted(selectedUnit.id, qId);

      if (selectedOption === quizQuestions[currentQuestionIndex].correctAnswer) {
        setScore(prev => prev + 1);
      } else {
        setHearts(prev => Math.max(0, prev - 1));
      }
    }
  };

  const nextQuestion = () => {
    if (hearts <= 0) {
      setQuizMode('result');
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
        const reshuffled = [...selectedUnit.questions].sort(() => 0.5 - Math.random());
        setQuizQuestions(prev => [...prev, ...reshuffled]);
        setCurrentQuestionIndex(nextIndex);
        setSelectedOption(null);
        setIsAnswerChecked(false);
        setQuizProgress(((nextIndex) / (quizQuestions.length + reshuffled.length)) * 100);
      } else {
        setQuizMode('result');
      }
    }
  };

  const QuizSelectView = () => (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl w-full space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tight mb-2">Choose Your Challenge</h2>
          <p className="text-gray-500 font-medium">{selectedUnit.title}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <button
            onClick={() => startQuizWithMode('quick')}
            className="bg-white border-2 border-gray-200 p-8 rounded-3xl flex flex-col items-center gap-6 hover:border-emerald-400 transition-all group shadow-[0_4px_0_0_#e5e7eb] hover:shadow-[0_4px_0_0_#34d399] text-center"
          >
            <div className="bg-emerald-100 text-emerald-600 p-5 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <CheckCircle2 size={40} />
            </div>
            <div>
              <h3 className="font-black text-xl text-gray-800 uppercase mb-2">Quick Mode</h3>
              <p className="text-gray-500 text-sm">10 random questions to test your knowledge.</p>
            </div>
          </button>

          <button
            onClick={() => startQuizWithMode('time-attack')}
            className="bg-white border-2 border-gray-200 p-8 rounded-3xl flex flex-col items-center gap-6 hover:border-orange-400 transition-all group shadow-[0_4px_0_0_#e5e7eb] hover:shadow-[0_4px_0_0_#fb923c] text-center"
          >
            <div className="bg-orange-100 text-orange-600 p-5 rounded-2xl group-hover:bg-orange-500 group-hover:text-white transition-colors">
              <Trophy size={40} />
            </div>
            <div>
              <h3 className="font-black text-xl text-gray-800 uppercase mb-2">Time Attack</h3>
              <p className="text-gray-500 text-sm">Race against the clock! 30s to answer as many as you can.</p>
            </div>
          </button>

          <button
            onClick={() => startQuizWithMode('marathon')}
            className="bg-white border-2 border-gray-200 p-8 rounded-3xl flex flex-col items-center gap-6 hover:border-blue-400 transition-all group shadow-[0_4px_0_0_#e5e7eb] hover:shadow-[0_4px_0_0_#60a5fa] text-center"
          >
            <div className="bg-blue-100 text-blue-600 p-5 rounded-2xl group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <BookOpen size={40} />
            </div>
            <div>
              <h3 className="font-black text-xl text-gray-800 uppercase mb-2">Marathon</h3>
              <p className="text-gray-500 text-sm">All questions in random order. No time limit.</p>
            </div>
          </button>
        </div>

        <button
          onClick={onClose}
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
        <header className="p-4 flex items-center gap-4 max-w-4xl mx-auto w-full">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle size={40} />
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
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: quizSubMode === 'time-attack' ? `${(timeLeft / 30) * 100}%` : `${quizProgress}%` }}
                className={`h-full rounded-full transition-all ${quizSubMode === 'time-attack' ? (timeLeft <= 5 ? 'bg-red-500' : 'bg-orange-500') : 'bg-emerald-500'}`}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-red-500 font-bold bg-red-50 px-4 py-2 rounded-2xl">
            <Heart size={24} fill={hearts > 0 ? "currentColor" : "none"} />
            <span className="text-xl">{hearts}</span>
          </div>
        </header>

        <main className="flex-1 max-w-4xl mx-auto w-full p-6 flex flex-col justify-center">
          <h2 className="text-3xl font-black text-gray-800 mb-12 text-center">{currentQuestion.text}</h2>
          
          <div className="grid md:grid-cols-2 gap-4 flex-1 content-start">
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

        <footer className={`p-8 border-t-2 transition-colors ${isAnswerChecked ? (isCorrect ? 'bg-emerald-100 border-emerald-200' : 'bg-red-100 border-red-200') : 'bg-white border-gray-100'} z-10`}>
          <div className="max-w-4xl mx-auto flex items-center justify-between">
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
          ? (quizSubMode === 'time-attack' ? `Great effort in Time Attack!` : `You've mastered some ${selectedUnit.title} concepts!`)
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
        onClick={onClose}
        className="w-full max-w-sm bg-emerald-500 text-white py-4 rounded-2xl font-black text-xl uppercase tracking-widest shadow-[0_6px_0_0_#059669] active:shadow-none active:translate-y-1 transition-all"
      >
        Finish
      </button>
    </div>
  );

  return (
    <AnimatePresence mode="wait">
      {quizMode === 'select' && <QuizSelectView key="select" />}
      {quizMode === 'quiz' && <QuizView key="quiz" />}
      {quizMode === 'result' && <ResultView key="result" />}
    </AnimatePresence>
  );
}
