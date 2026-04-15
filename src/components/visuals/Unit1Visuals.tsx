import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wind, Heart, ArrowRight, Shield, Bug, Zap, Activity, Microscope } from 'lucide-react';

interface VisualProps {
  isAssistMode: boolean;
  chineseType: 'traditional' | 'simplified';
}

export const ChemicalFormulas = ({ isAssistMode, chineseType }: VisualProps) => {
  const formulas = [
    { name: { en: "Glucose", zh: chineseType === 'traditional' ? "葡萄糖" : "葡萄糖" }, formula: "C₆H₁₂O₆", color: "text-emerald-600" },
    { name: { en: "Oxygen", zh: chineseType === 'traditional' ? "氧氣" : "氧气" }, formula: "O₂", color: "text-blue-600" },
    { name: { en: "Carbon Dioxide", zh: chineseType === 'traditional' ? "二氧化碳" : "二氧化碳" }, formula: "CO₂", color: "text-orange-600" },
    { name: { en: "Water", zh: chineseType === 'traditional' ? "水" : "水" }, formula: "H₂O", color: "text-cyan-600" }
  ];

  return (
    <div className="bg-white border-2 border-gray-100 rounded-3xl p-6 my-4 shadow-sm">
      <h4 className="text-gray-400 font-black uppercase tracking-widest text-[10px] mb-4 text-center">
        {isAssistMode ? (chineseType === 'traditional' ? "化學式" : "化学式") : "Chemical Formulas"}
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {formulas.map((f, i) => (
          <div key={i} className="flex flex-col items-center p-3 rounded-2xl bg-gray-50 border border-gray-100">
            <span className="text-[10px] font-bold text-gray-500 mb-1">{isAssistMode ? f.name.zh : f.name.en}</span>
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

  const t = {
    title: { en: "Breathing Mechanism", zh: chineseType === 'traditional' ? "呼吸機制" : "呼吸机制" },
    inhale: { en: "Inhalation: Diaphragm contracts (flattens), Lungs expand", zh: chineseType === 'traditional' ? "吸氣：橫膈膜收縮（變平），肺部擴張" : "吸气：横膈膜收缩（变平），肺部扩张" },
    exhale: { en: "Exhalation: Diaphragm relaxes (domes), Lungs shrink", zh: chineseType === 'traditional' ? "呼氣：橫膈膜放鬆（變拱形），肺部縮小" : "呼气：横膈膜放松（变拱形），肺部缩小" }
  };

  return (
    <div className="bg-white border-2 border-gray-200 rounded-3xl p-6 shadow-sm my-4">
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="relative w-40 h-56 bg-blue-50 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-blue-100 shrink-0">
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
          <h4 className="text-lg font-black text-gray-800 uppercase tracking-tight">
            {isAssistMode ? t.title.zh : t.title.en}
          </h4>
          <div className="space-y-2">
            <div className={`p-3 rounded-xl border-2 transition-all text-sm font-bold ${isInhaling ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
              {isAssistMode ? t.inhale.zh : t.inhale.en}
            </div>
            <div className={`p-3 rounded-xl border-2 transition-all text-sm font-bold ${!isInhaling ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
              {isAssistMode ? t.exhale.zh : t.exhale.en}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AlveoliExchange = ({ isAssistMode, chineseType }: VisualProps) => {
  const [view, setView] = useState<'alveoli' | 'cells'>('alveoli');

  const t = {
    title: { en: "Gas Exchange", zh: chineseType === 'traditional' ? "氣體交換" : "气体交换" },
    alveoli: { en: "In Lungs (Alveoli)", zh: chineseType === 'traditional' ? "在肺部（肺泡）" : "在肺部（肺泡）" },
    cells: { en: "In Body Cells", zh: chineseType === 'traditional' ? "在身體細胞" : "在身体细胞" },
    alveolus: { en: "Alveolus", zh: chineseType === 'traditional' ? "肺泡" : "肺泡" },
    bodyCell: { en: "Body Cell", zh: chineseType === 'traditional' ? "身體細胞" : "身体细胞" },
    capillary: { en: "Capillary", zh: chineseType === 'traditional' ? "微絲血管" : "微丝血管" },
    o2: { en: "Oxygen (O₂)", zh: chineseType === 'traditional' ? "氧氣 (O₂)" : "氧气 (O₂)" },
    co2: { en: "Carbon Dioxide (CO₂)", zh: chineseType === 'traditional' ? "二氧化碳 (CO₂)" : "二氧化碳 (CO₂)" },
    descAlveoli: { en: "O₂ enters blood, CO₂ enters lungs.", zh: chineseType === 'traditional' ? "氧氣進入血液，二氧化碳進入肺部。" : "氧气进入血液，二氧化碳进入肺部。" },
    descCells: { en: "O₂ enters cells, CO₂ enters blood.", zh: chineseType === 'traditional' ? "氧氣進入細胞，二氧化碳進入血液。" : "氧气进入细胞，二氧化碳进入血液。" }
  };

  return (
    <div className="bg-blue-50 border-2 border-blue-100 rounded-3xl p-6 my-4">
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-blue-800 font-black uppercase tracking-widest text-xs">
          {isAssistMode ? t.title.zh : t.title.en}
        </h4>
        <div className="flex gap-2">
          <button 
            onClick={() => setView('alveoli')}
            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight transition-all ${view === 'alveoli' ? 'bg-blue-500 text-white' : 'bg-white text-blue-400 border border-blue-100'}`}
          >
            {isAssistMode ? t.alveoli.zh : t.alveoli.en}
          </button>
          <button 
            onClick={() => setView('cells')}
            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight transition-all ${view === 'cells' ? 'bg-emerald-500 text-white' : 'bg-white text-emerald-400 border border-emerald-100'}`}
          >
            {isAssistMode ? t.cells.zh : t.cells.en}
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center gap-12">
        <div className="relative">
          <div className={`w-32 h-32 rounded-3xl border-4 border-dashed flex items-center justify-center relative transition-colors ${view === 'alveoli' ? 'border-blue-300 bg-white' : 'border-emerald-300 bg-emerald-50'}`}>
            <span className={`font-black text-[10px] uppercase ${view === 'alveoli' ? 'text-blue-400' : 'text-emerald-500'}`}>
              {view === 'alveoli' ? (isAssistMode ? t.alveolus.zh : t.alveolus.en) : (isAssistMode ? t.bodyCell.zh : t.bodyCell.en)}
            </span>
            
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
            <span className="rotate-90 text-red-300 font-black text-[8px] uppercase whitespace-nowrap">{isAssistMode ? t.capillary.zh : t.capillary.en}</span>
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
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-red-500 rounded-full shrink-0 border-2 border-white shadow-sm" />
              <p className="text-xs font-bold text-gray-600">{isAssistMode ? t.o2.zh : t.o2.en}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-blue-500 rounded-full shrink-0 border-2 border-white shadow-sm" />
              <p className="text-xs font-bold text-gray-600">{isAssistMode ? t.co2.zh : t.co2.en}</p>
            </div>
          </div>
          <p className="text-[11px] text-blue-700 font-bold bg-white/50 p-3 rounded-xl border border-blue-100">
            {view === 'alveoli' ? (isAssistMode ? t.descAlveoli.zh : t.descAlveoli.en) : (isAssistMode ? t.descCells.zh : t.descCells.en)}
          </p>
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

  const t = {
    title: { en: "The Heart & Vessels", zh: chineseType === 'traditional' ? "心臟與血管" : "心脏与血管" },
    desc: { en: "Arteries carry blood AWAY, Veins carry blood TOWARDS the heart.", zh: chineseType === 'traditional' ? "動脈將血液帶離，靜脈將血液帶回心臟。" : "动脉将血液带离，静脉将血液带回心脏。" },
    artery: { en: "Artery", zh: chineseType === 'traditional' ? "動脈" : "动脉" },
    vein: { en: "Vein", zh: chineseType === 'traditional' ? "靜脈" : "静脉" }
  };

  return (
    <div className="bg-red-50 border-2 border-red-100 rounded-3xl p-6 flex flex-col items-center my-4 overflow-hidden">
      <h4 className="text-red-800 font-black uppercase tracking-widest text-xs mb-8">{isAssistMode ? t.title.zh : t.title.en}</h4>
      
      <div className="relative w-full h-48 flex items-center justify-center">
        {/* Vessels */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 200">
          {/* Veins (Towards) */}
          <path d="M 50 100 Q 100 100 150 100" stroke="#3b82f6" strokeWidth="8" fill="none" strokeLinecap="round" />
          <path d="M 50 50 Q 100 50 150 80" stroke="#3b82f6" strokeWidth="8" fill="none" strokeLinecap="round" />
          
          {/* Arteries (Away) */}
          <path d="M 250 100 Q 300 100 350 100" stroke="#ef4444" strokeWidth="8" fill="none" strokeLinecap="round" />
          <path d="M 250 120 Q 300 150 350 150" stroke="#ef4444" strokeWidth="8" fill="none" strokeLinecap="round" />
        </svg>

        {/* Blood Flow Particles */}
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

        <div className="absolute left-10 top-1/2 -translate-y-12 text-[10px] font-black text-blue-500 uppercase tracking-tighter bg-white/80 px-2 py-1 rounded-lg border border-blue-100">
          {isAssistMode ? t.vein.zh : t.vein.en}
        </div>
        <div className="absolute right-10 top-1/2 translate-y-8 text-[10px] font-black text-red-500 uppercase tracking-tighter bg-white/80 px-2 py-1 rounded-lg border border-red-100">
          {isAssistMode ? t.artery.zh : t.artery.en}
        </div>
      </div>

      <p className="mt-6 text-red-700 font-bold text-xs text-center max-w-xs">{isAssistMode ? t.desc.zh : t.desc.en}</p>
    </div>
  );
};

export const ImmuneDefense = ({ isAssistMode, chineseType }: VisualProps) => {
  const t = {
    title: { en: "Immune Defense System", zh: chineseType === 'traditional' ? "免疫防禦系統" : "免疫防御系统" },
    lymphocyte: { en: "Lymphocyte", zh: chineseType === 'traditional' ? "淋巴細胞" : "淋巴细胞" },
    phagocyte: { en: "Phagocyte", zh: chineseType === 'traditional' ? "吞噬細胞" : "吞噬细胞" },
    antibodies: { en: "Produces Antibodies", zh: chineseType === 'traditional' ? "產生抗體" : "产生抗体" },
    engulf: { en: "Engulfs Pathogens", zh: chineseType === 'traditional' ? "吞噬病原體" : "吞噬病原体" }
  };

  return (
    <div className="bg-indigo-50 border-2 border-indigo-100 rounded-3xl p-6 my-4 overflow-hidden">
      <h4 className="text-indigo-800 font-black uppercase tracking-widest text-xs mb-8 text-center">{isAssistMode ? t.title.zh : t.title.en}</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Lymphocyte */}
        <div className="bg-white/50 rounded-2xl p-4 border border-indigo-100 flex flex-col items-center">
          <span className="text-[10px] font-black text-indigo-600 uppercase mb-4">{isAssistMode ? t.lymphocyte.zh : t.lymphocyte.en}</span>
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
          <p className="mt-4 text-[10px] font-bold text-indigo-400">{isAssistMode ? t.antibodies.zh : t.antibodies.en}</p>
        </div>

        {/* Phagocyte */}
        <div className="bg-white/50 rounded-2xl p-4 border border-indigo-100 flex flex-col items-center">
          <span className="text-[10px] font-black text-indigo-600 uppercase mb-4">{isAssistMode ? t.phagocyte.zh : t.phagocyte.en}</span>
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
          <p className="mt-4 text-[10px] font-bold text-indigo-400">{isAssistMode ? t.engulf.zh : t.engulf.en}</p>
        </div>
      </div>
    </div>
  );
};

export const RespirationEquation = ({ isAssistMode, chineseType }: VisualProps) => {
  const t = {
    title: { en: "The Chemical Process of Respiration", zh: chineseType === 'traditional' ? "呼吸作用的化學過程" : "呼吸作用的化学过程" },
    glucose: { en: "Glucose", zh: chineseType === 'traditional' ? "葡萄糖" : "葡萄糖" },
    oxygen: { en: "Oxygen", zh: chineseType === 'traditional' ? "氧氣" : "氧气" },
    co2: { en: "CO₂", zh: chineseType === 'traditional' ? "二氧化碳" : "二氧化碳" },
    water: { en: "Water", zh: chineseType === 'traditional' ? "水" : "水" },
    energy: { en: "ENERGY", zh: chineseType === 'traditional' ? "能量" : "能量" },
    desc: { en: "Occurs in the Mitochondria of every cell!", zh: chineseType === 'traditional' ? "發生在每個細胞的線粒體中！" : "发生在每个细胞的线粒体中！" }
  };

  return (
    <div className="bg-emerald-50 border-2 border-emerald-100 rounded-3xl p-6 text-center my-4">
      <h4 className="text-emerald-800 font-black uppercase tracking-widest text-xs mb-6">{isAssistMode ? t.title.zh : t.title.en}</h4>
      <div className="flex flex-wrap items-center justify-center gap-3 text-lg font-black text-emerald-700">
        <div className="bg-white px-3 py-1.5 rounded-xl shadow-sm border-2 border-emerald-200 flex flex-col">
          <span className="text-[8px] opacity-50">{isAssistMode ? t.glucose.zh : t.glucose.en}</span>
          <span>C₆H₁₂O₆</span>
        </div>
        <span>+</span>
        <div className="bg-white px-3 py-1.5 rounded-xl shadow-sm border-2 border-emerald-200 flex flex-col">
          <span className="text-[8px] opacity-50">{isAssistMode ? t.oxygen.zh : t.oxygen.en}</span>
          <span>6O₂</span>
        </div>
        <ArrowRight className="text-emerald-400" size={24} />
        <div className="bg-white px-3 py-1.5 rounded-xl shadow-sm border-2 border-emerald-200 flex flex-col">
          <span className="text-[8px] opacity-50">{isAssistMode ? t.co2.zh : t.co2.en}</span>
          <span>6CO₂</span>
        </div>
        <span>+</span>
        <div className="bg-white px-3 py-1.5 rounded-xl shadow-sm border-2 border-emerald-200 flex flex-col">
          <span className="text-[8px] opacity-50">{isAssistMode ? t.water.zh : t.water.en}</span>
          <span>6H₂O</span>
        </div>
        <span>+</span>
        <div className="bg-yellow-400 text-yellow-900 px-4 py-1.5 rounded-xl shadow-md border-2 border-yellow-500 animate-pulse">{isAssistMode ? t.energy.zh : t.energy.en}</div>
      </div>
      <p className="mt-6 text-emerald-600 font-bold italic text-xs">{isAssistMode ? t.desc.zh : t.desc.en}</p>
    </div>
  );
};

export const MitochondrionAnimation = ({ isAssistMode, chineseType }: VisualProps) => {
  const [stage, setStage] = useState<'mitochondrion' | 'cell'>('mitochondrion');

  useEffect(() => {
    const timer = setInterval(() => {
      setStage(prev => prev === 'mitochondrion' ? 'cell' : 'mitochondrion');
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const t = {
    title: { en: "Inside the Mitochondrion", zh: chineseType === 'traditional' ? "線粒體內部" : "线粒体内部" },
    cellTitle: { en: "Part of a Living Cell", zh: chineseType === 'traditional' ? "活細胞的一部分" : "活细胞的一部分" },
    glucose: "C₆H₁₂O₆",
    oxygen: "O₂",
    co2: "CO₂",
    water: "H₂O",
    energy: { en: "ENERGY", zh: chineseType === 'traditional' ? "能量" : "能量" }
  };

  return (
    <div className="bg-emerald-900 border-4 border-emerald-800 rounded-[3rem] p-8 my-4 overflow-hidden relative min-h-[300px] flex items-center justify-center">
      <motion.div 
        animate={{ scale: stage === 'mitochondrion' ? 1 : 0.2, opacity: stage === 'mitochondrion' ? 1 : 0.5 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        className="relative"
      >
        {/* Mitochondrion Shape */}
        <div className="w-64 h-32 bg-emerald-600 rounded-full border-4 border-emerald-400 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-2 border-2 border-emerald-300 rounded-full opacity-30" />
          {/* Inner Membrane (Cristae) */}
          <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 256 128">
            <path d="M 20 64 C 40 20, 60 100, 80 64 C 100 20, 120 100, 140 64 C 160 20, 180 100, 200 64 C 220 20, 240 100, 250 64" stroke="white" strokeWidth="4" fill="none" />
          </svg>
        </div>

        {/* Inputs */}
        <AnimatePresence>
          {stage === 'mitochondrion' && (
            <>
              <motion.div
                initial={{ x: -150, y: -50, opacity: 0 }}
                animate={{ x: -20, y: 0, opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute text-emerald-200 font-black text-xs bg-emerald-800/80 px-2 py-1 rounded-lg"
              >{t.glucose}</motion.div>
              <motion.div
                initial={{ x: -150, y: 50, opacity: 0 }}
                animate={{ x: -20, y: 0, opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                className="absolute text-blue-200 font-black text-xs bg-blue-800/80 px-2 py-1 rounded-lg"
              >{t.oxygen}</motion.div>

              {/* Outputs */}
              <motion.div
                initial={{ x: 20, y: 0, opacity: 0 }}
                animate={{ x: 150, y: -50, opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 2, delay: 1 }}
                className="absolute text-orange-200 font-black text-xs bg-orange-800/80 px-2 py-1 rounded-lg"
              >{t.co2}</motion.div>
              <motion.div
                initial={{ x: 20, y: 0, opacity: 0 }}
                animate={{ x: 150, y: 50, opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 2, delay: 1.5 }}
                className="absolute text-cyan-200 font-black text-xs bg-cyan-800/80 px-2 py-1 rounded-lg"
              >{t.water}</motion.div>

              {/* Energy Burst */}
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

      {/* Cell View (Zoomed Out) */}
      <AnimatePresence>
        {stage === 'cell' && (
          <motion.div
            initial={{ scale: 2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-80 h-80 border-8 border-emerald-700/30 rounded-[4rem] bg-emerald-800/10 flex items-center justify-center">
              <div className="w-24 h-24 bg-emerald-900 rounded-full border-4 border-emerald-700 flex items-center justify-center">
                <span className="text-emerald-500 font-black text-[10px] uppercase">Nucleus</span>
              </div>
              {/* Other Mitochondria */}
              <div className="absolute top-10 left-10 w-12 h-6 bg-emerald-600/50 rounded-full rotate-45" />
              <div className="absolute bottom-10 right-10 w-12 h-6 bg-emerald-600/50 rounded-full -rotate-12" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 font-black uppercase tracking-widest text-[10px]">
        {stage === 'mitochondrion' ? (isAssistMode ? t.title.zh : t.title.en) : (isAssistMode ? t.cellTitle.zh : t.cellTitle.en)}
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

  const t = {
    title: { en: "Blood Separation (Centrifuge)", zh: chineseType === 'traditional' ? "血液分離（離心機）" : "血液分离（离心机）" },
    spin: { en: "Spin Blood", zh: chineseType === 'traditional' ? "開始離心" : "开始离心" },
    plasma: { en: "Plasma (55%)", zh: chineseType === 'traditional' ? "血漿 (55%)" : "血浆 (55%)" },
    cells: { en: "Blood Cells (45%)", zh: chineseType === 'traditional' ? "血球 (45%)" : "血球 (45%)" },
    wbc: { en: "White Cells & Platelets", zh: chineseType === 'traditional' ? "白血球與血小板" : "白血球与血小板" },
    rbc: { en: "Red Blood Cells", zh: chineseType === 'traditional' ? "紅血球" : "红血球" }
  };

  return (
    <div className="bg-gray-50 border-2 border-gray-200 rounded-3xl p-6 my-4">
      <h4 className="text-gray-800 font-black uppercase tracking-widest text-xs mb-6 text-center">{isAssistMode ? t.title.zh : t.title.en}</h4>
      
      <div className="flex flex-col md:flex-row items-center justify-center gap-12">
        {/* Centrifuge Animation */}
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
            className="mt-6 px-4 py-2 bg-red-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-[0_4px_0_0_#b91c1c] active:shadow-none active:translate-y-1 disabled:opacity-50 transition-all"
          >
            {isAssistMode ? t.spin.zh : t.spin.en}
          </button>
        </div>

        {/* Labels */}
        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded shadow-sm" />
                <span className="text-xs font-black text-yellow-700">{isAssistMode ? t.plasma.zh : t.plasma.en}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-white border border-gray-300 rounded shadow-sm" />
                <span className="text-xs font-black text-gray-500">{isAssistMode ? t.wbc.zh : t.wbc.en}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-red-600 rounded shadow-sm" />
                <span className="text-xs font-black text-red-700">{isAssistMode ? t.rbc.zh : t.rbc.en}</span>
              </div>
              <div className="mt-4 p-3 bg-white rounded-xl border border-gray-100 text-[10px] font-bold text-gray-400 italic">
                {isAssistMode ? "血液經離心後分為血漿和血球。" : "Blood separates into plasma and cells after centrifugation."}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
