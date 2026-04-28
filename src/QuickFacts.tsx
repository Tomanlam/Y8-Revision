import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCcw, Info } from 'lucide-react';

// Import refactored card components
import MagneticFieldsCard from './components/quick-facts/MagneticFieldsCard';
import ForcesCard from './components/quick-facts/ForcesCard';
import PaperChromatographyCard from './components/quick-facts/PaperChromatographyCard';
import SolubilityCurveCard from './components/quick-facts/SolubilityCurveCard';
import FiltrationDistillationCard from './components/quick-facts/FiltrationDistillationCard';
import DissolvingSolubilityCard from './components/quick-facts/DissolvingSolubilityCard';
import BloodCompositionCard from './components/quick-facts/BloodCompositionCard';
import RespiratorySystemCard from './components/quick-facts/RespiratorySystemCard';
import DiffusionCard from './components/quick-facts/DiffusionCard';
import RespirationCard from './components/quick-facts/RespirationCard';

const QuickFacts: React.FC = () => {
  const [chineseType, setChineseType] = useState<'traditional' | 'simplified' | null>(null);
  const [showTranslate, setShowTranslate] = useState(false);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-12 pb-32 relative">
      {/* Translation Toggle */}
      <div className="absolute top-6 right-6 z-50 flex flex-col items-end gap-2">
        <button 
          onClick={() => setShowTranslate(!showTranslate)}
          className="bg-purple-600 text-white px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest shadow-lg hover:bg-purple-700 transition-all flex items-center gap-2"
        >
          <RefreshCcw size={14} className={showTranslate ? 'animate-spin' : ''} />
          Translate
        </button>
        
        <AnimatePresence>
          {showTranslate && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white p-2 rounded-2xl shadow-xl border-2 border-purple-100 flex gap-2"
            >
              <button 
                onClick={() => setChineseType(null)}
                className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase transition-all ${!chineseType ? 'bg-purple-100 text-purple-700' : 'text-gray-400 hover:bg-gray-50'}`}
              >
                EN
              </button>
              <button 
                onClick={() => setChineseType('simplified')}
                className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase transition-all ${chineseType === 'simplified' ? 'bg-purple-100 text-purple-700' : 'text-gray-400 hover:bg-gray-50'}`}
              >
                简
              </button>
              <button 
                onClick={() => setChineseType('traditional')}
                className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase transition-all ${chineseType === 'traditional' ? 'bg-purple-100 text-purple-700' : 'text-gray-400 hover:bg-gray-50'}`}
              >
                繁
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <header className="text-center space-y-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block bg-emerald-100 text-emerald-600 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest"
        >
          {chineseType ? (chineseType === 'simplified' ? '学习中心' : '學習中心') : 'Learning Hub'}
        </motion.div>
        <h2 className="text-4xl md:text-5xl font-black text-gray-800 uppercase tracking-tight">
          {chineseType ? (chineseType === 'simplified' ? '速览知识点' : '速覽知識點') : 'Quick Facts'}
        </h2>
        <p className="text-gray-500 font-bold max-w-2xl mx-auto">
          {chineseType 
            ? (chineseType === 'simplified' ? '互动概念卡片，助你直观掌握关键科学原理。' : '互動概念卡片，助你直觀掌握關鍵科學原理。') 
            : 'Interactive concept cards to help you visualize and master key scientific principles.'}
        </p>
      </header>

      <div className="space-y-12">
        <MagneticFieldsCard chineseType={chineseType} />
        <ForcesCard chineseType={chineseType} />
        <PaperChromatographyCard chineseType={chineseType} />
        <SolubilityCurveCard chineseType={chineseType} />
        <FiltrationDistillationCard chineseType={chineseType} />
        <DissolvingSolubilityCard chineseType={chineseType} />
        <BloodCompositionCard chineseType={chineseType} />
        <RespiratorySystemCard chineseType={chineseType} />
        <DiffusionCard chineseType={chineseType} />
        <RespirationCard chineseType={chineseType} />
        
        <div className="bg-gray-50 border-4 border-dashed border-gray-200 rounded-[3rem] p-12 text-center">
          <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center text-gray-300 mx-auto mb-4 shadow-sm">
            <Info size={32} />
          </div>
          <p className="text-gray-400 font-black uppercase tracking-widest text-sm">
            {chineseType ? (chineseType === 'simplified' ? '更多概念即将推出...' : '更多概念即將推出...') : 'More concepts coming soon...'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default QuickFacts;
