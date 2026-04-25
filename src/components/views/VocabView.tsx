import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, Trophy, Languages, EyeOff, Eye, LayoutGrid, List, 
  ArrowRight, XCircle, CheckCircle2 
} from 'lucide-react';
import { Unit, SessionStats } from '../../types';

interface VocabViewProps {
  unit: Unit | undefined;
  onBack: () => void;
  sessionStats: SessionStats;
  setSessionStats: React.Dispatch<React.SetStateAction<SessionStats>>;
}

const VocabView: React.FC<VocabViewProps> = ({ unit: selectedUnit, onBack, sessionStats, setSessionStats }) => {
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
        const temp = indices[i];
        indices[i] = indices[j];
        indices[j] = temp;
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
            onClick={onBack}
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
            <button onClick={onBack} className="text-gray-400 hover:text-gray-600">
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
                {masteredIndices.length} of {selectedUnit?.vocab.length}
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

export default VocabView;
