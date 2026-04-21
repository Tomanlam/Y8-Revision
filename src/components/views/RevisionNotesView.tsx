import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, X, BookOpen, Languages, Sparkles, 
  MessageSquare, ChevronRight, Zap, Target,
  Star, Trophy, Info
} from 'lucide-react';
import { Unit } from '../../types';

interface RevisionNotesViewProps {
  unit: Unit | undefined;
  onBack: () => void;
  charType: 'simplified' | 'traditional';
  setCharType: (type: 'simplified' | 'traditional') => void;
}

const RevisionNotesView: React.FC<RevisionNotesViewProps> = ({ unit, onBack, charType, setCharType }) => {
  const [activeTab, setActiveTab] = useState<'notes' | 'vocab' | 'assist'>('notes');
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);

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
          <div className="flex items-center bg-gray-100 p-1 rounded-xl">
             <button 
               onClick={() => setCharType('simplified')}
               className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${charType === 'simplified' ? 'bg-white text-emerald-500 shadow-sm' : 'text-gray-400'}`}
             >
               Simp
             </button>
             <button 
               onClick={() => setCharType('traditional')}
               className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${charType === 'traditional' ? 'bg-white text-emerald-500 shadow-sm' : 'text-gray-400'}`}
             >
               Trad
             </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-6 space-y-8">
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          {[
            { id: 'notes', label: 'Key Concepts', icon: <BookOpen size={18} /> },
            { id: 'vocab', label: 'Terminology', icon: <Languages size={18} /> },
            { id: 'assist', label: 'AI Support', icon: <Sparkles size={18} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 whitespace-nowrap transition-all ${
                activeTab === tab.id ? 'bg-gray-800 text-white shadow-lg' : 'bg-white text-gray-400 border-2 border-gray-100'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'notes' && (
            <motion.div
              key="notes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 gap-4">
                {unit.concepts.map((concept, idx) => (
                  <div
                    key={idx}
                    className="p-6 bg-white rounded-3xl border-2 border-gray-100 hover:border-emerald-200 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center font-black text-lg">
                        {idx + 1}
                      </div>
                      <p className="text-gray-700 font-medium leading-relaxed pt-2 text-lg">
                        {concept as unknown as string}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'vocab' && (
            <motion.div
              key="vocab"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {unit.vocab.map((item, idx) => (
                <div key={idx} className="bg-white p-8 rounded-[2.5rem] border-2 border-gray-100 shadow-sm hover:border-emerald-200 transition-all flex items-center gap-6 group">
                   <div className="bg-emerald-50 w-20 h-20 rounded-3xl flex items-center justify-center text-emerald-500 text-3xl font-black shadow-sm group-hover:rotate-6 transition-transform">
                      {charType === 'simplified' ? item.simplified : item.traditional}
                   </div>
                   <div className="flex-1">
                      <h4 className="text-2xl font-black text-gray-800 uppercase tracking-tight mb-1">{item.term}</h4>
                      <p className="text-gray-500 font-medium text-sm leading-tight italic">{item.definition}</p>
                   </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'assist' && (
            <motion.div
              key="assist"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-gray-800 rounded-[3rem] p-12 text-center relative overflow-hidden shadow-2xl">
                 <div className="absolute top-0 right-0 p-12 text-emerald-400 opacity-10 -mr-16 -mt-16">
                    <Sparkles size={240} />
                 </div>
                 <div className="relative z-10">
                    <div className="bg-emerald-500 w-20 h-20 rounded-3xl flex items-center justify-center text-white mx-auto mb-8 shadow-xl shadow-emerald-500/20">
                       <Sparkles size={40} />
                    </div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Neural Learning AI</h2>
                    <p className="text-gray-400 font-medium text-lg leading-relaxed mb-10">
                       Need a custom study plan? Send your notes to our AI assistant for a personalized revision summary.
                    </p>
                    <button className="px-10 py-5 bg-white text-gray-800 rounded-3xl font-black uppercase tracking-widest shadow-xl flex items-center gap-3 mx-auto hover:bg-emerald-50 transition-colors">
                       <MessageSquare size={20} className="text-emerald-500" /> Start Assisting
                    </button>
                    <div className="mt-8 pt-8 border-t border-white/10 flex items-center justify-center gap-6">
                       <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                          <Zap size={14} fill="currentColor" /> Summarization
                       </div>
                       <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                          <Target size={14} fill="currentColor" /> Exam Prep
                       </div>
                    </div>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default RevisionNotesView;
