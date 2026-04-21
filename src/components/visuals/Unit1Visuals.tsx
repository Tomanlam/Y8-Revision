import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wind, Heart, ArrowRight, Shield, Bug, Zap, Activity, Microscope, RefreshCw } from 'lucide-react';

interface VisualProps {
  isAssistMode: boolean;
  chineseType: 'traditional' | 'simplified';
}

const t = (en: string, sc: string, tc: string, type: string) => {
  if (type === 'simplified') return sc;
  if (type === 'traditional') return tc;
  return en;
};

export const ChemicalFormulas = ({ isAssistMode, chineseType }: VisualProps) => {
  const formulas = [
    { name: { en: "Glucose", zh: t("Glucose", "葡萄糖", "葡萄糖", chineseType) }, formula: "C₆H₁₂O₆", color: "text-emerald-600" },
    { name: { en: "Oxygen", zh: t("Oxygen", "氧气", "氧氣", chineseType) }, formula: "O₂", color: "text-blue-600" },
    { name: { en: "Carbon Dioxide", zh: t("Carbon Dioxide", "二氧化碳", "二氧化碳", chineseType) }, formula: "CO₂", color: "text-orange-600" },
    { name: { en: "Water", zh: t("Water", "水", "水", chineseType) }, formula: "H₂O", color: "text-cyan-600" }
  ];

  return (
    <div className="bg-gray-50 border-2 border-gray-100 rounded-2xl p-6 my-4 shadow-sm">
      <h4 className="font-black text-gray-800 uppercase tracking-wider text-sm mb-4 flex flex-wrap gap-x-2">
        <span>Chemical Formulas</span>
        {isAssistMode && <span className="text-emerald-600">{t("", "化学式", "化學式", chineseType)}</span>}
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {formulas.map((f, i) => (
          <div key={i} className="flex flex-col items-center p-3 rounded-xl bg-white border border-gray-100 shadow-sm h-full justify-center">
            <div className="flex flex-col items-center mb-1 text-center">
              <span className="text-[10px] font-bold text-gray-500 leading-tight">{f.name.en}</span>
              {isAssistMode && <span className="text-[10px] font-black text-emerald-600 leading-tight">{f.name.zh}</span>}
            </div>
            <span className={`text-xl font-black ${f.color}`}>{f.formula}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const BreathingSimulation = ({ isAssistMode, chineseType }: VisualProps) => {
  const [isInhaling, setIsInhaling] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => setIsInhaling(prev => !prev), 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-blue-50 border-2 border-blue-100 rounded-2xl p-6 shadow-sm my-4">
      <h4 className="font-black text-blue-800 uppercase tracking-wider text-sm mb-4 flex flex-wrap gap-x-2">
        <span>Breathing Mechanism</span>
        {isAssistMode && <span className="opacity-50">{t("", "呼吸机制", "呼吸機制", chineseType)}</span>}
      </h4>
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="relative w-40 h-56 bg-white rounded-xl flex items-center justify-center overflow-hidden border-2 border-blue-100 shrink-0">
          <motion.div 
            animate={{ y: isInhaling ? 20 : 0, height: isInhaling ? 10 : 30 }}
            className="absolute bottom-4 left-4 right-4 bg-blue-400 rounded-full opacity-50"
          />
          <div className="flex gap-2">
            <motion.div animate={{ scale: isInhaling ? 1.2 : 0.9 }} className="w-14 h-28 bg-red-400 rounded-t-full rounded-b-2xl" />
            <motion.div animate={{ scale: isInhaling ? 1.2 : 0.9 }} className="w-14 h-28 bg-red-400 rounded-t-full rounded-b-2xl" />
          </div>
          <motion.div
            animate={{ y: isInhaling ? [ -40, 20] : [20, -40], opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute top-10 text-blue-500"
          >
            <Wind size={32} />
          </motion.div>
        </div>
        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <div className={`p-3 rounded-xl border-2 transition-all text-sm font-bold flex flex-col ${isInhaling ? 'bg-blue-100 border-blue-200 text-blue-700' : 'bg-white border-gray-100 text-gray-400'}`}>
              <span>Inhalation: Diaphragm contracts, Lungs expand</span>
              {isAssistMode && <span className="text-xs opacity-70 mt-1 italic font-medium">{t("", "吸气：横膈膜收缩，肺部扩张", "吸氣：橫膈膜收縮，肺部擴張", chineseType)}</span>}
            </div>
            <div className={`p-3 rounded-xl border-2 transition-all text-sm font-bold flex flex-col ${!isInhaling ? 'bg-orange-100 border-orange-200 text-orange-700' : 'bg-white border-gray-100 text-gray-400'}`}>
              <span>Exhalation: Diaphragm relaxes, Lungs shrink</span>
              {isAssistMode && <span className="text-xs opacity-70 mt-1 italic font-medium">{t("", "呼气：横膈膜放松，肺部缩小", "呼氣：橫膈膜放鬆，肺部縮小", chineseType)}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AlveoliExchange = ({ isAssistMode, chineseType }: VisualProps) => {
  const [view, setView] = useState<'alveoli' | 'cells'>('alveoli');

  return (
    <div className="bg-cyan-50 border-2 border-cyan-100 rounded-2xl p-6 my-4">
      <div className="flex flex-col mb-6">
        <h4 className="font-black text-cyan-800 uppercase tracking-wider text-sm flex flex-wrap gap-x-2">
          <span>Gas Exchange</span>
          {isAssistMode && <span className="opacity-50">{t("", "气体交换", "氣體交換", chineseType)}</span>}
        </h4>
        <div className="flex gap-2 mt-4">
          <button 
            onClick={() => setView('alveoli')}
            className={`flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'alveoli' ? 'bg-cyan-500 text-white shadow-[0_4px_0_0_#0e7490]' : 'bg-white text-cyan-400 border border-cyan-100'}`}
          >
            <div className="flex flex-wrap gap-x-1 justify-center items-center">
              <span>Alveoli</span>
              {isAssistMode && <span className="text-[8px] opacity-70 font-bold lowercase">({t("", "肺泡", "肺泡", chineseType)})</span>}
            </div>
          </button>
          <button 
            onClick={() => setView('cells')}
            className={`flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'cells' ? 'bg-emerald-500 text-white shadow-[0_4px_0_0_#047857]' : 'bg-white text-emerald-400 border border-emerald-100'}`}
          >
            <div className="flex flex-wrap gap-x-1 justify-center items-center">
              <span>Cells</span>
              {isAssistMode && <span className="text-[8px] opacity-70 font-bold lowercase">({t("", "细胞", "細胞", chineseType)})</span>}
            </div>
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center gap-12">
        <div className="relative">
          <div className={`w-32 h-32 rounded-2xl border-4 border-dashed flex items-center justify-center relative transition-colors ${view === 'alveoli' ? 'border-cyan-300 bg-white' : 'border-emerald-300 bg-emerald-50'}`}>
            <div className="flex flex-col items-center justify-center leading-none">
              <span className={`font-black text-[10px] uppercase ${view === 'alveoli' ? 'text-cyan-400' : 'text-emerald-500'}`}>
                {view === 'alveoli' ? "Alveolus" : "Body Cell"}
              </span>
              {isAssistMode && (
                <span className={`text-[8px] font-black opacity-60 italic ${view === 'alveoli' ? 'text-cyan-400' : 'text-emerald-500'}`}>
                  {view === 'alveoli' ? t("", "肺泡", "肺泡", chineseType) : t("", "身体细胞", "身體細胞", chineseType)}
                </span>
              )}
            </div>
            
            <AnimatePresence mode="wait">
              {view === 'alveoli' ? (
                <React.Fragment key="alveoli-particles">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={`o2-in-${i}`}
                      initial={{ x: 0, y: 0, opacity: 0 }}
                      animate={{ x: 80, y: (i - 1) * 20, opacity: [0, 1, 0] }}
                      transition={{ repeat: Infinity, duration: 2, delay: i * 0.6 }}
                      className="absolute w-5 h-5 bg-red-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-[8px] text-white font-bold"
                    >O₂</motion.div>
                  ))}
                </React.Fragment>
              ) : (
                <React.Fragment key="cells-particles">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={`co2-in-${i}`}
                      initial={{ x: 0, y: 0, opacity: 0 }}
                      animate={{ x: 80, y: (i - 1) * 20, opacity: [0, 1, 0] }}
                      transition={{ repeat: Infinity, duration: 2, delay: i * 0.6 }}
                      className="absolute w-5 h-5 bg-blue-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-[8px] text-white font-bold"
                    >CO₂</motion.div>
                  ))}
                </React.Fragment>
              )}
            </AnimatePresence>
          </div>

          <div className="absolute -right-20 top-0 bottom-0 w-10 bg-red-100 border-x-4 border-red-200 flex flex-col items-center justify-around overflow-hidden rounded-full">
            <div className="flex flex-col items-center justify-center leading-none rotate-90">
              <span className="text-red-300 font-black text-[8px] uppercase whitespace-nowrap">Capillary</span>
              {isAssistMode && <span className="text-red-300/60 font-black text-[7px] uppercase whitespace-nowrap">{t("", "微丝血管", "微絲血管", chineseType)}</span>}
            </div>
            <AnimatePresence mode="wait">
              {view === 'alveoli' ? (
                <React.Fragment key="alveoli-cap-particles">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={`co2-out-${i}`}
                      initial={{ x: 0, y: 0, opacity: 0 }}
                      animate={{ x: -80, y: (i - 1) * 20, opacity: [0, 1, 0] }}
                      transition={{ repeat: Infinity, duration: 2, delay: i * 0.6 }}
                      className="absolute right-0 w-5 h-5 bg-blue-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-[8px] text-white font-bold"
                    >CO₂</motion.div>
                  ))}
                </React.Fragment>
              ) : (
                <React.Fragment key="cells-cap-particles">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={`o2-out-${i}`}
                      initial={{ x: 0, y: 0, opacity: 0 }}
                      animate={{ x: -80, y: (i - 1) * 20, opacity: [0, 1, 0] }}
                      transition={{ repeat: Infinity, duration: 2, delay: i * 0.6 }}
                      className="absolute right-0 w-5 h-5 bg-red-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-[8px] text-white font-bold"
                    >O₂</motion.div>
                  ))}
                </React.Fragment>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="max-w-xs space-y-4">
          <div className={`p-3 rounded-xl border border-cyan-100 flex flex-col gap-2 ${isAssistMode ? 'bg-white' : 'bg-white/50'}`}>
            <p className="text-[11px] text-cyan-700 font-bold">
              {view === 'alveoli' ? "O₂ enters blood, CO₂ enters lungs." : "O₂ enters cells, CO₂ enters blood."}
            </p>
            {isAssistMode && (
              <p className="text-[11px] text-cyan-500 font-bold italic border-t border-cyan-50 pt-2">
                {view === 'alveoli' 
                  ? t("", "氧气进入血液，二氧化碳进入肺部。", "氧氣進入血液，二氧化碳進入肺部。", chineseType)
                  : t("", "氧气进入细胞，二氧化碳进入血液。", "氧氣進入細胞，二氧化碳進入血液。", chineseType)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const HeartPump = ({ isAssistMode, chineseType }: VisualProps) => {
  const [heartBeat, setHeartBeat] = useState(false);
  useEffect(() => {
    const interval = setInterval(() => setHeartBeat(prev => !prev), 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-red-50 border-2 border-red-100 rounded-2xl p-6 flex flex-col items-center my-4 overflow-hidden">
      <h4 className="font-black text-red-800 uppercase tracking-wider text-sm mb-8 flex flex-wrap gap-x-2 justify-center">
        <span>The Heart & Vessels</span>
        {isAssistMode && <span className="opacity-50">{t("", "心脏与血管", "心臟與血管", chineseType)}</span>}
      </h4>
      
      <div className="relative w-full h-48 flex items-center justify-center">
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 200">
          <path d="M 50 100 Q 100 100 150 100" stroke="#3b82f6" strokeWidth="8" fill="none" strokeLinecap="round" />
          <path d="M 50 50 Q 100 50 150 80" stroke="#3b82f6" strokeWidth="8" fill="none" strokeLinecap="round" />
          <path d="M 250 100 Q 300 100 350 100" stroke="#ef4444" strokeWidth="8" fill="none" strokeLinecap="round" />
          <path d="M 250 120 Q 300 150 350 150" stroke="#ef4444" strokeWidth="8" fill="none" strokeLinecap="round" />
        </svg>

        {[...Array(4)].map((_, i) => (
          <motion.div
            key={`vein-flow-${i}`}
            animate={{ x: [-150, -50], opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 2, delay: i * 0.5 }}
            className="absolute w-3 h-3 bg-blue-400 rounded-full border border-white shadow-sm"
            style={{ left: '150px', top: i % 2 === 0 ? '100px' : '65px' }}
          />
        ))}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={`artery-flow-${i}`}
            animate={{ x: [50, 150], opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 2, delay: i * 0.5 }}
            className="absolute w-3 h-3 bg-red-400 rounded-full border border-white shadow-sm"
            style={{ left: '200px', top: i % 2 === 0 ? '100px' : '135px' }}
          />
        ))}

        <motion.div animate={{ scale: heartBeat ? 1.15 : 1 }} className="text-red-500 relative z-10 drop-shadow-lg">
          <Heart size={80} fill="currentColor" />
        </motion.div>

        <div className="absolute left-10 top-1/2 -translate-y-12 text-[10px] font-black text-blue-500 uppercase tracking-tighter bg-white/80 px-2 py-1 rounded-lg border border-blue-100 flex flex-col items-center leading-none">
          <span>Vein</span>
          {isAssistMode && <span className="text-[8px] opacity-60 font-bold">{t("", "静脉", "靜脈", chineseType)}</span>}
        </div>
        <div className="absolute right-10 top-1/2 translate-y-8 text-[10px] font-black text-red-500 uppercase tracking-tighter bg-white/80 px-2 py-1 rounded-lg border border-red-100 flex flex-col items-center leading-none">
          <span>Artery</span>
          {isAssistMode && <span className="text-[8px] opacity-60 font-bold">{t("", "动脉", "動脈", chineseType)}</span>}
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center gap-2">
        <p className="text-red-700 font-bold text-xs text-center max-w-xs italic leading-tight">
          Arteries carry blood AWAY, Veins carry blood TOWARDS the heart.
        </p>
        {isAssistMode && (
          <p className="text-red-500 font-medium text-[10px] text-center max-w-xs italic border-t border-red-100 pt-1 leading-tight">
            {t("", "动脉将血液带离，静脉将血液带回心脏。", "動脈將血液帶離，靜脈將血液帶回心臟。", chineseType)}
          </p>
        )}
      </div>
    </div>
  );
};

export const ImmuneDefense = ({ isAssistMode, chineseType }: VisualProps) => {
  return (
    <div className="bg-indigo-50 border-2 border-indigo-100 rounded-2xl p-6 my-4 overflow-hidden">
      <h4 className="font-black text-indigo-800 uppercase tracking-wider text-sm mb-8 text-center">
        {t("Immune Defense System", "免疫防御系统", "免疫防禦系統", chineseType)}
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl p-4 border border-indigo-100 flex flex-col items-center shadow-sm">
          <div className="flex flex-col items-center leading-none mb-4">
             <span className="text-[10px] font-black text-indigo-600 uppercase">Lymphocyte</span>
             {isAssistMode && <span className="text-[8px] font-black text-indigo-500/60 uppercase">{t("", "淋巴细胞", "淋巴細胞", chineseType)}</span>}
          </div>
          <div className="relative w-32 h-32 flex items-center justify-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full border-2 border-indigo-300 flex items-center justify-center relative z-10">
              <Shield className="text-indigo-500" size={24} />
            </div>
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={`antibody-${i}`}
                animate={{ 
                  x: [0, (i % 2 === 0 ? 60 : -60)], 
                  y: [0, (i < 2 ? -60 : 60)], 
                  opacity: [0, 1, 0],
                  rotate: [0, 45]
                }}
                transition={{ repeat: Infinity, duration: 2, delay: i * 0.5 }}
                className="absolute text-indigo-400 font-black text-lg"
              >Y</motion.div>
            ))}
          </div>
          <div className="mt-4 flex flex-col items-center leading-none text-center">
            <p className="text-[10px] font-bold text-indigo-400">Produces Antibodies</p>
            {isAssistMode && <p className="text-[8px] font-bold text-indigo-400/60 ">{t("", "产生抗体", "產生抗體", chineseType)}</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-indigo-100 flex flex-col items-center shadow-sm">
          <div className="flex flex-col items-center leading-none mb-4">
            <span className="text-[10px] font-black text-indigo-600 uppercase">Phagocyte</span>
            {isAssistMode && <span className="text-[8px] font-black text-indigo-500/60 uppercase">{t("", "吞噬细胞", "吞噬細胞", chineseType)}</span>}
          </div>
          <div className="relative w-32 h-32 flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.2, 1], borderRadius: ["40%", "60%", "40%"] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="w-20 h-20 bg-indigo-200 border-2 border-indigo-400 flex items-center justify-center relative z-10 overflow-hidden"
            >
              <motion.div
                animate={{ x: [40, -40], opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="text-red-400"
              >
                <Bug size={16} />
              </motion.div>
            </motion.div>
            <motion.div
              animate={{ x: [80, 0], opacity: [1, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="absolute right-0 text-red-400"
            >
              <Bug size={20} />
            </motion.div>
          </div>
          <div className="mt-4 flex flex-col items-center leading-none text-center">
            <p className="text-[10px] font-bold text-indigo-400">Engulfs Pathogens</p>
            {isAssistMode && <p className="text-[8px] font-bold text-indigo-400/60">{t("", "吞噬病原体", "吞噬病原體", chineseType)}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export const RespirationEquation = ({ isAssistMode, chineseType }: VisualProps) => {
  return (
    <div className="bg-emerald-50 border-2 border-emerald-100 rounded-2xl p-6 text-center my-4">
      <h4 className="font-black text-emerald-800 uppercase tracking-wider text-sm mb-6 flex flex-wrap gap-x-2 justify-center">
        <span>Respiration Equation</span>
        {isAssistMode && <span className="opacity-50">{t("", "呼吸作用方程式", "呼吸作用方程式", chineseType)}</span>}
      </h4>
      <div className="flex flex-wrap items-center justify-center gap-3 text-lg font-black text-emerald-700">
        <div className="bg-white px-3 py-1.5 rounded-xl shadow-sm border-2 border-emerald-200 flex flex-col">
          <div className="flex flex-col text-[8px] leading-tight mb-1">
            <span className="opacity-50 font-bold">Glucose</span>
            {isAssistMode && <span className="text-emerald-500">{t("", "葡萄糖", "葡萄糖", chineseType)}</span>}
          </div>
          <span>C₆H₁₂O₆</span>
        </div>
        <span>+</span>
        <div className="bg-white px-3 py-1.5 rounded-xl shadow-sm border-2 border-emerald-200 flex flex-col">
          <div className="flex flex-col text-[8px] leading-tight mb-1">
            <span className="opacity-50 font-bold">Oxygen</span>
            {isAssistMode && <span className="text-emerald-500">{t("", "氧气", "氧氣", chineseType)}</span>}
          </div>
          <span>6O₂</span>
        </div>
        <ArrowRight className="text-emerald-400" size={24} />
        <div className="bg-white px-3 py-1.5 rounded-xl shadow-sm border-2 border-emerald-200 flex flex-col">
          <div className="flex flex-col text-[8px] leading-tight mb-1">
            <span className="opacity-50 font-bold">CO₂</span>
            {isAssistMode && <span className="text-emerald-500">{t("", "二氧化碳", "二氧化碳", chineseType)}</span>}
          </div>
          <span>6CO₂</span>
        </div>
        <span>+</span>
        <div className="bg-white px-3 py-1.5 rounded-xl shadow-sm border-2 border-emerald-200 flex flex-col">
          <div className="flex flex-col text-[8px] leading-tight mb-1">
            <span className="opacity-50 font-bold">Water</span>
            {isAssistMode && <span className="text-emerald-500">{t("", "水", "水", chineseType)}</span>}
          </div>
          <span>6H₂O</span>
        </div>
        <span>+</span>
        <div className="bg-yellow-400 text-yellow-900 px-4 py-1.5 rounded-xl shadow-[0_4px_0_0_#ca8a04] border-2 border-yellow-500 animate-pulse flex flex-col">
           <span className="leading-none py-1">ENERGY</span>
           {isAssistMode && <span className="text-[10px] font-black border-t border-yellow-500/30 pt-1 mt-1">{t("", "能量", "能量", chineseType)}</span>}
        </div>
      </div>
      <div className="mt-6 flex flex-col items-center gap-1">
        <p className="text-emerald-600 font-bold italic text-xs">Occurs in the Mitochondria of every cell!</p>
        {isAssistMode && (
          <p className="text-emerald-500 font-medium italic text-[10px] border-t border-emerald-100 pt-1">
            {t("", "发生在每个细胞的线粒体中！", "發生在每個細胞的線粒體中！", chineseType)}
          </p>
        )}
      </div>
    </div>
  );
};

export const MitochondrionAnimation = ({ isAssistMode, chineseType }: VisualProps) => {
  const [stage, setStage] = useState<'mitochondrion' | 'cell'>('mitochondrion');

  useEffect(() => {
    const interval = setInterval(() => {
      setStage(prev => prev === 'mitochondrion' ? 'cell' : 'mitochondrion');
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-emerald-900 border-4 border-emerald-800 rounded-2xl p-8 my-4 overflow-hidden relative min-h-[300px] flex items-center justify-center shadow-xl">
      <motion.div 
        animate={{ scale: stage === 'mitochondrion' ? 1 : 0.2, opacity: stage === 'mitochondrion' ? 1 : 0.5 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        className="relative"
      >
        <div className="w-64 h-32 bg-emerald-600 rounded-full border-4 border-emerald-400 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-2 border-2 border-emerald-300 rounded-full opacity-30" />
          <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 256 128">
            <path d="M 20 64 C 40 20, 60 100, 80 64 C 100 20, 120 100, 140 64 C 160 20, 180 100, 200 64 C 220 20, 240 100, 250 64" stroke="white" strokeWidth="4" fill="none" />
          </svg>
        </div>

        <AnimatePresence>
          {stage === 'mitochondrion' && (
            <>
              <motion.div
                initial={{ x: -150, y: -50, opacity: 0 }}
                animate={{ x: -20, y: 0, opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute text-emerald-200 font-black text-xs bg-emerald-800/80 px-2 py-1 rounded-lg"
              >C₆H₁₂O₆</motion.div>
              <motion.div
                initial={{ x: -150, y: 50, opacity: 0 }}
                animate={{ x: -20, y: 0, opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                className="absolute text-blue-200 font-black text-xs bg-blue-800/80 px-2 py-1 rounded-lg"
              >O₂</motion.div>

              <motion.div
                initial={{ x: 20, y: 0, opacity: 0 }}
                animate={{ x: 150, y: -50, opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 2, delay: 1 }}
                className="absolute text-orange-200 font-black text-xs bg-orange-800/80 px-2 py-1 rounded-lg"
              >CO₂</motion.div>
              <motion.div
                initial={{ x: 20, y: 0, opacity: 0 }}
                animate={{ x: 150, y: 50, opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 2, delay: 1.5 }}
                className="absolute text-cyan-200 font-black text-xs bg-cyan-800/80 px-2 py-1 rounded-lg"
              >H₂O</motion.div>

              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="absolute top-0 left-1/2 -translate-x-1/2 text-yellow-400"
              >
                <Zap size={48} fill="currentColor" />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {stage === 'cell' && (
          <motion.div
            initial={{ scale: 2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-80 h-80 border-8 border-emerald-700/30 rounded-[3rem] bg-emerald-800/10 flex items-center justify-center">
              <div className="w-24 h-24 bg-emerald-900 rounded-full border-4 border-emerald-700 flex items-center justify-center">
                <span className="text-emerald-500 font-black text-[10px] uppercase">Nucleus</span>
              </div>
              <div className="absolute top-10 left-10 w-12 h-6 bg-emerald-600/50 rounded-full rotate-45" />
              <div className="absolute bottom-10 right-10 w-12 h-6 bg-emerald-600/50 rounded-full -rotate-12" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 font-black uppercase tracking-widest text-[10px] flex flex-col items-center leading-none">
        <span>{stage === 'mitochondrion' ? "Inside the Mitochondrion" : "Part of a Living Cell"}</span>
        {isAssistMode && <span className="text-[8px] opacity-60 font-bold">{stage === 'mitochondrion' ? t("", "线粒体内部", "線粒體內部", chineseType) : t("", "活细胞的一部分", "活細胞的一部分", chineseType)}</span>}
      </div>
    </div>
  );
};

export const BloodComponents = ({ isAssistMode, chineseType }: VisualProps) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const startCentrifuge = () => {
    setIsSpinning(true);
    setShowResult(false);
    setTimeout(() => {
      setIsSpinning(false);
      setShowResult(true);
    }, 3000);
  };

  return (
    <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-6 my-4">
      <h4 className="font-black text-gray-800 uppercase tracking-wider text-sm mb-6 text-center">
        {t("Blood Separation", "血液分离", "血液分離", chineseType)}
      </h4>
      
      <div className="flex flex-col md:flex-row items-center justify-center gap-12">
        <div className="relative w-32 h-48 flex flex-col items-center">
          <motion.div
            animate={isSpinning ? { rotate: 360 } : { rotate: 0 }}
            transition={isSpinning ? { repeat: Infinity, duration: 0.5, ease: "linear" } : {}}
            className="w-24 h-40 bg-white border-4 border-gray-300 rounded-b-full rounded-t-xl relative overflow-hidden shadow-inner"
          >
            {!showResult ? (
              <div className="absolute inset-0 bg-red-600 opacity-80" />
            ) : (
              <div className="flex flex-col h-full">
                <motion.div initial={{ height: 0 }} animate={{ height: '55%' }} className="bg-yellow-100 border-b border-yellow-200" />
                <motion.div initial={{ height: 0 }} animate={{ height: '5%' }} className="bg-white border-b border-gray-100" />
                <motion.div initial={{ height: 0 }} animate={{ height: '40%' }} className="bg-red-600" />
              </div>
            )}
          </motion.div>
          
          <button
            onClick={startCentrifuge}
            disabled={isSpinning}
            className="mt-6 px-4 py-1.5 bg-red-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-[0_4px_0_0_#b91c1c] active:shadow-none active:translate-y-1 disabled:opacity-50 transition-all"
          >
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <RefreshCw size={14} className={isSpinning ? 'animate-spin' : ''} />
              <div className="flex flex-wrap gap-x-1 items-baseline">
                <span>{isSpinning ? 'Spinning...' : 'Spin Blood'}</span>
                {isAssistMode && <span className="text-[8px] opacity-70 font-bold lowercase">({t("", "开始离心", "開始離心", chineseType)})</span>}
              </div>
            </div>
          </button>
        </div>

        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded shadow-sm" />
                <span className="text-xs font-black text-yellow-700">{t("Plasma (55%)", "血浆 (55%)", "血漿 (55%)", chineseType)}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-white border border-gray-300 rounded shadow-sm" />
                <span className="text-xs font-black text-gray-500">{t("White Cells & Platelets", "白血球与血小板", "白血球與血小板", chineseType)}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-red-600 rounded shadow-sm" />
                <span className="text-xs font-black text-red-700">{t("Red Blood Cells", "红血球", "紅血球", chineseType)}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
