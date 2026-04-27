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
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewView, setReviewView] = useState<'cards' | 'list'>('cards');

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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-sans">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          className="bg-white/10 border border-white/20 p-12 rounded-[2.5rem] shadow-xl backdrop-blur-xl mb-8 flex flex-col items-center justify-center"
        >
          <Trophy size={120} className="text-yellow-400 mb-6 drop-shadow-lg" />
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-black text-white mb-4 uppercase tracking-tight"
          >
            All mastered! Good job!
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-white/60 text-xl font-medium mb-12"
          >
            You've learned all the key terms for this unit.
          </motion.p>
          <div className="flex w-full flex-col gap-4 max-w-xs mx-auto">
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={() => {
                setIsCompleted(false);
                setIsReviewMode(true);
              }}
              className="bg-white/10 text-white border border-white/20 px-12 py-4 rounded-[1.2rem] font-black text-xs uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all flex justify-center items-center group shadow-md"
            >
              Review All
            </motion.button>
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              onClick={onBack}
              className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-12 py-4 rounded-[1.2rem] font-black text-xs uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-md"
            >
              Back to Dashboard
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  const currentVocab = selectedUnit?.vocab[remainingIndices[0]];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col overflow-hidden font-sans">
      <header className="bg-white/5 border-b border-white/10 p-4 sticky top-0 z-10 backdrop-blur-md">
        <div className={`${isReviewMode ? 'max-w-6xl' : 'max-w-2xl'} mx-auto flex items-center justify-between transition-all duration-300`}>
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white border border-white/20 hover:text-slate-900 rounded-[1.2rem] text-white transition-all active:scale-95 group/btn">
              <ChevronLeft size={24} className="group-hover/btn:-translate-x-1 transition-transform" />
            </button>
            <div>
              <h1 className="text-lg font-black text-white uppercase tracking-tight leading-none">Vocab</h1>
              <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mt-1">{selectedUnit?.title}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right mr-2 flex flex-col items-end">
              <p className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-1">Progress</p>
              <div className="bg-white/10 px-3 py-1 rounded-[1.2rem] border border-white/10 text-xs font-black text-emerald-400">
                {masteredIndices.length} / {selectedUnit?.vocab.length}
              </div>
            </div>
            
            <div className="h-8 w-px bg-white/10 mx-1" />

            <button
              onClick={() => setIsSimplified(!isSimplified)}
              className="bg-purple-500/10 text-purple-400 px-4 py-2 rounded-[1.2rem] font-black text-[10px] uppercase tracking-widest border border-purple-500/20 flex items-center gap-2 hover:bg-purple-500/20 transition-colors"
            >
              <Languages size={14} />
              {isSimplified ? 'Simplified' : 'Traditional'}
            </button>

            <button
              onClick={() => setIsReviewMode(!isReviewMode)}
              className={`${isReviewMode ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-white/10 text-white border-white/20 hover:bg-white hover:text-slate-900'} px-4 py-2 rounded-[1.2rem] font-black text-[10px] uppercase tracking-widest transition-all border flex items-center gap-2`}
            >
              {isReviewMode ? <EyeOff size={14} /> : <Eye size={14} />}
              {isReviewMode ? 'Study' : 'Review'}
            </button>
          </div>
        </div>
      </header>

      {isReviewMode ? (
        <main className={`flex-1 overflow-y-auto p-4 md:p-8 ${isReviewMode ? 'max-w-6xl' : 'max-w-2xl'} mx-auto w-full transition-all duration-300 custom-scrollbar`}>
          <div className="flex justify-center mb-8 gap-2">
            <div className="bg-white/5 p-1.5 rounded-[1.2rem] border border-white/10 flex items-center gap-1.5 backdrop-blur-sm">
              <button
                onClick={() => setReviewView('cards')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-[1.2rem] font-black text-[10px] uppercase tracking-widest transition-all ${reviewView === 'cards' ? 'bg-white/20 text-white shadow-sm border border-white/20 scale-105' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
              >
                <LayoutGrid size={14} />
                Cards
              </button>
              <button
                onClick={() => setReviewView('list')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-[1.2rem] font-black text-[10px] uppercase tracking-widest transition-all ${reviewView === 'list' ? 'bg-white/20 text-white shadow-sm border border-white/20 scale-105' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
              >
                <List size={14} />
                List
              </button>
            </div>
          </div>

          {reviewView === 'cards' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {selectedUnit?.vocab.map((v, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={idx}
                  className="bg-white/5 border border-white/10 rounded-[2rem] p-6 shadow-xl backdrop-blur-xl relative overflow-hidden group hover:bg-white/10 transition-colors"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em] block mb-2">Term</span>
                      <h3 className="text-xl font-black text-white uppercase tracking-tight leading-none">{v.term}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em] block mb-2">Chinese</span>
                      <p className="text-[17px] font-black text-emerald-400 leading-none">{isSimplified ? v.simplified : v.traditional}</p>
                    </div>
                  </div>
                  <div className="h-px bg-white/10 w-full mb-6" />
                  <div>
                    <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em] block mb-2">Definition</span>
                    <p className="text-white/80 text-[13px] font-medium leading-relaxed">{v.definition}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden shadow-xl backdrop-blur-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    <th className="p-6 text-[10px] font-black text-white/50 uppercase tracking-widest w-1/3">Vocabulary</th>
                    <th className="p-6 text-[10px] font-black text-white/50 uppercase tracking-widest">Definition</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedUnit?.vocab.map((v, idx) => (
                    <tr key={idx} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                      <td className="p-6 align-top">
                        <p className="font-black text-white text-[15px] uppercase tracking-tight leading-none mb-2">{v.term}</p>
                        <p className="text-emerald-400 font-black text-[13px] leading-none">{isSimplified ? v.simplified : v.traditional}</p>
                      </td>
                      <td className="p-6 align-top text-[13px] text-white/80 font-medium leading-relaxed">
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
          <div className="w-full max-w-md aspect-[3/4] relative perspective-1000 mb-16">
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
                  className={`absolute inset-0 backface-hidden rounded-[2.5rem] flex flex-col items-center justify-center p-12 text-center bg-white/10 border border-white/20 backdrop-blur-xl shadow-2xl`}
                >
                  <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-6">English Term</span>
                  <h2 className="text-white text-5xl font-black uppercase tracking-tighter leading-tight drop-shadow-md">
                    {currentVocab?.term}
                  </h2>
                  <div className="absolute bottom-10 flex items-center gap-3 bg-white/10 px-5 py-2.5 rounded-[1.2rem] text-white/70 font-black text-[9px] uppercase tracking-widest border border-white/10">
                    <ArrowRight size={14} className="animate-pulse" /> Tap to flip
                  </div>
                </div>

                {/* Back */}
                <div 
                  className="absolute inset-0 backface-hidden rounded-[2.5rem] bg-slate-900 border border-white/10 flex flex-col items-center justify-center p-12 text-center rotate-y-180 shadow-2xl"
                >
                  <div className="space-y-10 w-full relative z-10">
                    <div className="bg-white/5 rounded-[2rem] p-6 border border-white/10">
                      <span className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em] block mb-3">Translation</span>
                      <h3 className="text-emerald-400 text-4xl font-black tracking-tight leading-none drop-shadow-sm">
                        {isSimplified ? currentVocab?.simplified : currentVocab?.traditional}
                      </h3>
                    </div>
                    
                    <div className="bg-white/5 rounded-[2rem] p-6 border border-white/10">
                      <span className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em] block mb-3 mt-1">Definition</span>
                      <p className="text-white/90 text-xl font-medium leading-relaxed drop-shadow-sm">
                        {currentVocab?.definition}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="w-full max-w-md flex justify-between px-8 absolute bottom-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-[4.5rem] h-[4.5rem] rounded-[1.5rem] bg-rose-500/10 border border-rose-500/20 flex flex-col items-center justify-center text-rose-500 shadow-lg backdrop-blur-md">
                <XCircle size={32} />
              </div>
              <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Revise Later</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-[4.5rem] h-[4.5rem] rounded-[1.5rem] bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center text-emerald-400 shadow-lg backdrop-blur-md">
                <CheckCircle2 size={32} />
              </div>
              <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Mastered</span>
            </div>
          </div>
        </main>
      )}

      {!isReviewMode && (
        <footer className="p-4 text-center absolute bottom-4 w-full">
          <p className="text-white/30 text-[9px] font-black uppercase tracking-[0.2em]">
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
