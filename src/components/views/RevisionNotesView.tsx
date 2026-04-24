import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Sparkles, Star, Languages, Download, FileText
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b-2 border-gray-100 p-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
              <X size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight leading-none">{unit.title}</h1>
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Revision & Resources</span>
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
                {charType === 'traditional' ? '繁' : '簡'}
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden h-[calc(100vh-88px)]">
        {/* Left Half: PDF Reader */}
        <div className="w-full md:w-1/2 flex flex-col border-r-2 border-gray-100 bg-gray-100/30">
          <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="text-emerald-500" size={18} />
              <span className="text-xs font-black uppercase tracking-widest text-gray-400">Unit Notes PDF</span>
            </div>
            {unit.pdfUrl && (
              <a 
                href={unit.pdfUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                download
                className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors shadow-sm"
              >
                <Download size={12} /> Download PDF
              </a>
            )}
          </div>
          <div className="flex-1 p-2 md:p-4">
            {unit.pdfUrl ? (
              <iframe 
                src={`${unit.pdfUrl}#toolbar=0`} 
                className="w-full h-full rounded-2xl border-2 border-gray-200 shadow-inner bg-white"
                title="Unit Notes PDF"
              />
            ) : (
              <div className="w-full h-full rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-white/50">
                <p className="text-gray-400 font-bold uppercase tracking-widest">No PDF available for this unit</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Half: Interactive Notes */}
        <div className="w-full md:w-1/2 flex flex-col bg-gray-50 overflow-y-auto custom-scrollbar">
          <div className="p-4 bg-white border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Sparkles className="text-blue-500" size={18} />
              <span className="text-xs font-black uppercase tracking-widest text-gray-400">Interactive Summary</span>
            </div>
          </div>
          <div className="p-6 space-y-6 pb-20">
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
                  className={`p-6 bg-white rounded-[2rem] border-2 transition-all duration-300 ${
                    assistMode ? 'border-blue-100 shadow-sm' : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-8 h-8 flex-shrink-0 rounded-xl flex items-center justify-center font-black text-sm transition-colors ${
                      assistMode ? 'bg-blue-500 text-white' : 'bg-gray-50 text-gray-400'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col gap-4">
                        <p className="text-gray-800 font-bold leading-relaxed text-base">
                          {concept as unknown as string}
                        </p>
                        
                        <AnimatePresence>
                          {assistMode && translation && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="pt-4 border-t border-blue-50">
                                <p className="text-blue-600 font-bold text-sm leading-relaxed">
                                  {translation}
                                </p>
                              </div>
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
      </div>
    </div>
  );
};

export default RevisionNotesView;
