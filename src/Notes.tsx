import * as React from 'react';
import { motion } from 'motion/react';
import { 
  ChevronLeft, 
  Languages, 
  CheckCircle2, 
  Activity, 
  ArrowRight 
} from 'lucide-react';
import { Unit } from './data';
import { getVisual } from './components/visuals/VisualRegistry';

interface NotesProps {
  selectedUnit: Unit;
  isAssistMode: boolean;
  setIsAssistMode: (val: boolean) => void;
  chineseType: 'traditional' | 'simplified';
  setChineseType: React.Dispatch<React.SetStateAction<'traditional' | 'simplified'>>;
  onClose: () => void;
  onStartQuiz: (unit: Unit) => void;
}

const highlightTerms = (text: string, keyTerms?: { [term: string]: string }) => {
  if (!keyTerms) return text;
  
  const terms = Object.keys(keyTerms).sort((a, b) => b.length - a.length);
  if (terms.length === 0) return text;

  const regex = new RegExp(`(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) => {
    const lowerPart = part.toLowerCase();
    const matchingKey = terms.find(t => t.toLowerCase() === lowerPart);
    if (matchingKey) {
      return (
        <span key={i} style={{ color: keyTerms[matchingKey], fontWeight: '800' }}>
          {part}
        </span>
      );
    }
    return part;
  });
};

export default function Notes({
  selectedUnit,
  isAssistMode,
  setIsAssistMode,
  chineseType,
  setChineseType,
  onClose,
  onStartQuiz
}: NotesProps) {
  const translatedTitle = chineseType === 'traditional' ? selectedUnit.titleTraditional : selectedUnit.titleSimplified;
  const translatedDesc = chineseType === 'traditional' ? selectedUnit.descriptionTraditional : selectedUnit.descriptionSimplified;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b-2 border-gray-200 p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <ChevronLeft size={32} />
            </button>
            <div className="flex flex-col">
              <h1 className="text-xl font-black text-gray-800 uppercase tracking-tight leading-none">
                {isAssistMode && translatedTitle ? translatedTitle : selectedUnit.title} Notes
              </h1>
              {isAssistMode && translatedTitle && (
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                  {selectedUnit.title}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAssistMode(!isAssistMode)}
              className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 border-2 ${
                isAssistMode 
                  ? 'bg-blue-500 text-white border-blue-600 shadow-[0_4px_0_0_#1d4ed8]' 
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Languages size={16} />
              Assist Mode
            </button>
            {isAssistMode && (
              <button
                onClick={() => setChineseType(prev => prev === 'traditional' ? 'simplified' : 'traditional')}
                className="px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest bg-white text-gray-500 border-2 border-gray-200 hover:bg-gray-50 transition-all"
              >
                {chineseType === 'traditional' ? '繁體' : '简体'}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className={`${isAssistMode ? 'max-w-6xl' : 'max-w-2xl'} mx-auto p-6 space-y-6`}>
        <div className={`${selectedUnit.color} rounded-3xl p-8 text-white shadow-lg relative overflow-hidden`}>
          <div className="relative z-10">
            <h2 className="text-3xl font-black mb-2">
              {isAssistMode && translatedTitle ? translatedTitle : selectedUnit.title}
            </h2>
            <p className="text-white/90 text-lg">
              {isAssistMode && translatedDesc ? translatedDesc : selectedUnit.description}
            </p>
            {isAssistMode && translatedTitle && (
              <div className="mt-4 pt-4 border-t border-white/20 text-white/70 text-sm font-bold italic">
                {selectedUnit.title}: {selectedUnit.description}
              </div>
            )}
          </div>
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Activity size={120} />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-black text-gray-400 uppercase tracking-widest">Key Concepts</h3>
          {selectedUnit.concepts.map((concept, i) => {
            const chineseConcept = chineseType === 'traditional' 
              ? selectedUnit.conceptsTraditional?.[i] 
              : selectedUnit.conceptsSimplified?.[i];

            return (
              <React.Fragment key={i}>
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`bg-white border-2 border-gray-200 rounded-2xl p-5 flex gap-4 items-start shadow-[0_4px_0_0_rgba(0,0,0,0.05)] ${isAssistMode ? 'flex-col md:flex-row' : ''}`}
                >
                  <div className="bg-blue-100 text-blue-600 p-2 rounded-lg mt-1 shrink-0">
                    <CheckCircle2 size={20} />
                  </div>
                  
                  <div className={`flex-1 grid ${isAssistMode ? 'grid-cols-1 md:grid-cols-2 gap-6' : 'grid-cols-1'}`}>
                    <div className="text-gray-700 text-lg font-medium leading-relaxed">
                      {concept.includes(': ') ? (
                        <>
                          <span className="font-black text-gray-900">{highlightTerms(concept.split(': ')[0], selectedUnit.keyTerms)}:</span>
                          {highlightTerms(concept.substring(concept.indexOf(': ') + 1), selectedUnit.keyTerms)}
                        </>
                      ) : (
                        highlightTerms(concept, selectedUnit.keyTerms)
                      )}
                    </div>
                    
                    {isAssistMode && chineseConcept && (
                      <div className="text-gray-500 text-lg font-medium leading-relaxed border-t-2 md:border-t-0 md:border-l-2 border-gray-100 pt-4 md:pt-0 md:pl-6 italic">
                        {chineseConcept.includes(': ') ? (
                          <>
                            <span className="font-black text-gray-700">{highlightTerms(chineseConcept.split(': ')[0], selectedUnit.keyTerms)}:</span>
                            {highlightTerms(chineseConcept.substring(chineseConcept.indexOf(': ') + 1), selectedUnit.keyTerms)}
                          </>
                        ) : (
                          highlightTerms(chineseConcept, selectedUnit.keyTerms)
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Inline Visuals */}
                {(() => {
                  const Visual = getVisual(selectedUnit.id, i);
                  return Visual ? <Visual isAssistMode={isAssistMode} chineseType={chineseType} /> : null;
                })()}
              </React.Fragment>
            );
          })}
        </div>

        <button
          onClick={() => onStartQuiz(selectedUnit)}
          className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-black text-xl uppercase tracking-widest shadow-[0_6px_0_0_#059669] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-3"
        >
          Take the Quiz <ArrowRight size={24} />
        </button>
      </main>
    </div>
  );
}
