import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Sparkles, Star, Languages
} from 'lucide-react';
import { Unit } from '../../types';

interface RevisionNotesViewProps {
  unit: Unit | undefined;
  onBack: () => void;
  charType: 'simplified' | 'traditional';
  setCharType: (type: 'simplified' | 'traditional') => void;
}

const RevisionNotesView: React.FC<RevisionNotesViewProps> = ({ unit, onBack, charType, setCharType }) => {
  const [assistMode, setAssistMode] = useState(false);

  if (!unit) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      <header className="bg-white border-b-2 border-gray-100 p-6 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
              <X size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight leading-none">{unit.title}</h1>
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Revision Guide</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
                onClick={() => setCharType(charType === 'traditional' ? 'simplified' : 'traditional')}
                className="w-10 h-10 rounded-xl text-sm font-black border-2 border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100 transition-all shadow-[0_4px_0_0_#e2e8f0] active:translate-y-1 active:shadow-none"
              >
                {charType === 'traditional' ? '繁' : '简'}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-6 space-y-8">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {unit.concepts.map((concept, idx) => {
              const translation = charType === 'traditional' 
                ? unit.conceptsTraditional?.[idx] 
                : unit.conceptsSimplified?.[idx];

              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={idx}
                  className={`p-6 bg-white rounded-3xl border-2 transition-all duration-300 ${
                    assistMode ? 'border-emerald-100 shadow-sm' : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center font-black text-lg transition-colors ${
                      assistMode ? 'bg-emerald-500 text-white' : 'bg-gray-50 text-gray-400'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className={`flex flex-col ${assistMode ? 'md:flex-row md:items-start gap-6' : ''}`}>
                        <p className={`text-gray-800 font-medium leading-relaxed pt-2 text-lg flex-1`}>
                          {concept as unknown as string}
                        </p>
                        
                        <AnimatePresence>
                          {assistMode && translation && (
                            <motion.div
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              className="flex-1 pt-2 md:pl-6 md:border-l border-emerald-100"
                            >
                              <p className="text-emerald-600 font-bold text-lg leading-relaxed">
                                {translation}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default RevisionNotesView;
