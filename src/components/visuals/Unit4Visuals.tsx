import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Wind, Droplets, Leaf, Bug, MousePointer2, ArrowRight, RefreshCcw, Info, AlertTriangle, ChevronRight, ChevronLeft, Activity, Maximize2 } from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

interface VisualProps {
  isAssistMode: boolean;
  chineseType: 'traditional' | 'simplified';
}

const t = (en: string, sc: string, tc: string, type: string) => {
  if (type === 'simplified') return sc;
  if (type === 'traditional') return tc;
  return en;
};

// 1. Photosynthesis Lab (Updated with Graph and Limiting Factors)
export const PhotosynthesisLab: React.FC<VisualProps> = ({ isAssistMode, chineseType }) => {
  const [light, setLight] = useState(50);
  const [co2, setCo2] = useState(50);
  const [graphVar, setGraphVar] = useState<'light' | 'co2'>('light');
  
  const calculateRate = (l: number, c: number) => {
    return Math.min(l, c) * 0.8;
  };

  const currentRate = calculateRate(light, co2);

  const points = Array.from({ length: 21 }, (_, i) => {
    const val = i * 5;
    const rate = graphVar === 'light' ? calculateRate(val, co2) : calculateRate(light, val);
    return { x: val, y: rate };
  });

  return (
    <div className="my-4 bg-green-50 rounded-2xl border-2 border-green-100 p-6 shadow-sm">
      <h4 className="font-black text-green-800 uppercase tracking-wider text-sm mb-4 flex flex-wrap gap-x-2">
        <span>Photosynthesis Lab</span>
        {isAssistMode && <span className="opacity-50 tracking-normal">{t("", "光合作用实验室", "光合作用實驗室", chineseType)}</span>}
      </h4>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="relative h-80 bg-white rounded-xl border-2 border-green-100 overflow-hidden flex flex-col items-center justify-center p-4 shadow-inner">
          <div className="relative z-10 mb-8">
            <Leaf size={80} className="text-emerald-500 fill-emerald-500/20" />
            <AnimatePresence>
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={`glucose-${i}`}
                  initial={{ y: 0, opacity: 0 }}
                  animate={{ y: -60, opacity: 1 }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 1 }}
                  className="absolute top-0 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm border border-emerald-100"
                >
                  <span className="text-[8px] font-black text-emerald-700">C₆H₁₂O₆</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="absolute inset-0 pointer-events-none">
            {[...Array(Math.ceil(light / 10))].map((_, i) => (
              <motion.div
                key={`light-${i}`}
                animate={{ opacity: [0, 1, 0], x: [-20, 20], y: [-20, 20] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                className="absolute top-4 left-4 w-1 h-12 bg-yellow-400 rotate-45 blur-[1px]"
                style={{ left: `${i * 15}%` }}
              />
            ))}
            {[...Array(Math.ceil(co2 / 10))].map((_, i) => (
              <motion.div
                key={`co2-${i}`}
                animate={{ 
                  x: [Math.random() * 300, Math.random() * 300], 
                  y: [200, 100],
                  opacity: [0, 1, 0] 
                }}
                transition={{ duration: 2, repeat: Infinity, delay: Math.random() * 2 }}
                className="absolute w-2 h-2 bg-red-500 rounded-full shadow-[0_0_5px_rgba(239,68,68,0.5)]"
              />
            ))}
          </div>

          <div className="absolute bottom-4 left-4 right-4 bg-white/80 backdrop-blur-md p-3 rounded-xl border border-green-100 shadow-sm">
            <div className="flex justify-between items-center flex-wrap gap-1">
              <span className="text-[10px] font-black text-green-700 uppercase flex flex-wrap gap-x-1">
                <span>O₂ Production Rate</span>
                {isAssistMode && <span className="opacity-50">{t("", "氧气产生速率", "氧氣產生速率", chineseType)}</span>}
              </span>
              <span className="text-lg font-black text-green-600">{currentRate.toFixed(1)}%</span>
            </div>
            <div className="w-full h-2 bg-green-100 rounded-full mt-2 overflow-hidden">
              <motion.div 
                animate={{ width: `${currentRate}%` }}
                className="h-full bg-green-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl border-2 border-green-100 shadow-sm">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-1">
              <label className="text-[10px] font-black text-yellow-600 uppercase tracking-widest flex flex-wrap gap-x-1">
                <span>Light Intensity</span>
                {isAssistMode && <span className="opacity-50">{t("", "光照强度", "光照強度", chineseType)}</span>}
              </label>
              <span className="text-xs font-black text-yellow-700">{light}%</span>
            </div>
            <input type="range" min="0" max="100" value={light} onChange={(e) => setLight(parseInt(e.target.value))} className="w-full h-2 bg-yellow-100 rounded-lg appearance-none cursor-pointer accent-yellow-500" />
          </div>

          <div className="bg-white p-4 rounded-xl border-2 border-green-100 shadow-sm">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-1">
              <label className="text-[10px] font-black text-red-600 uppercase tracking-widest flex flex-wrap gap-x-1">
                <span>CO₂ Concentration</span>
                {isAssistMode && <span className="opacity-50">{t("", "二氧化碳浓度", "二氧化碳濃度", chineseType)}</span>}
              </label>
              <span className="text-xs font-black text-red-700">{co2}%</span>
            </div>
            <input type="range" min="0" max="100" value={co2} onChange={(e) => setCo2(parseInt(e.target.value))} className="w-full h-2 bg-red-100 rounded-lg appearance-none cursor-pointer accent-red-500" />
          </div>

          <div className="bg-white p-4 rounded-xl border-2 border-green-100 shadow-sm h-48">
            <div className="flex justify-between items-center mb-2 flex-wrap gap-1">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex flex-wrap gap-x-1">
                <span>Rate vs Factor</span>
                {isAssistMode && <span className="opacity-50">{t("", "速率与因素", "速率與因素", chineseType)}</span>}
              </span>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            <button 
              onClick={() => setGraphVar('light')} 
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all flex flex-col items-center leading-none ${
                graphVar === 'light' 
                  ? 'bg-yellow-500 text-white shadow-[0_4px_0_0_#ca8a04]' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span>Light</span>
              {isAssistMode && <span className="text-[8px] opacity-70 font-bold lowercase">{t("", "光", "光", chineseType)}</span>}
            </button>
            <button 
              onClick={() => setGraphVar('co2')} 
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all flex flex-col items-center leading-none ${
                graphVar === 'co2' 
                  ? 'bg-red-500 text-white shadow-[0_4px_0_0_#b91c1c]' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span>CO₂</span>
              {isAssistMode && <span className="text-[8px] opacity-70 font-bold lowercase">{t("", "二氧化碳", "二氧化碳", chineseType)}</span>}
            </button>
          </div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="x" hide />
                <YAxis hide domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }}
                  labelFormatter={(val) => `${graphVar === 'light' ? 'Light' : 'CO2'}: ${val}%`}
                />
                <Line type="monotone" dataKey="y" stroke={graphVar === 'light' ? '#eab308' : '#ef4444'} strokeWidth={3} dot={false} animationDuration={500} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. Food Web Explorer (Updated with Chain/Web modes and energy arrows)
export const FoodWebExplorer: React.FC<VisualProps> = ({ isAssistMode, chineseType }) => {
  const [mode, setMode] = useState<'chain' | 'simple' | 'complex'>('chain');
  const [activeNode, setActiveNode] = useState<string | null>(null);

  const organisms = [
    { id: 'grass', name: t('Grass', '草', '草', chineseType), type: 'producer', x: 10, y: 50 },
    { id: 'rabbit', name: t('Rabbit', '兔子', '兔子', chineseType), type: 'herbivore', x: 40, y: 20 },
    { id: 'grasshopper', name: t('Grasshopper', '蚱蜢', '蚱蜢', chineseType), type: 'herbivore', x: 40, y: 80 },
    { id: 'fox', name: t('Fox', '狐狸', '狐狸', chineseType), type: 'carnivore', x: 80, y: 20 },
    { id: 'owl', name: t('Owl', '猫头鹰', '貓頭鷹', chineseType), type: 'carnivore', x: 80, y: 80 },
    { id: 'snake', name: t('Snake', '蛇', '蛇', chineseType), type: 'carnivore', x: 60, y: 50 },
  ];

  const connections = {
    chain: [
      { from: 'grass', to: 'rabbit' },
      { from: 'rabbit', to: 'fox' }
    ],
    simple: [
      { from: 'grass', to: 'rabbit' },
      { from: 'grass', to: 'grasshopper' },
      { from: 'rabbit', to: 'fox' },
      { from: 'grasshopper', to: 'owl' }
    ],
    complex: [
      { from: 'grass', to: 'rabbit' },
      { from: 'grass', to: 'grasshopper' },
      { from: 'rabbit', to: 'fox' },
      { from: 'rabbit', to: 'snake' },
      { from: 'grasshopper', to: 'snake' },
      { from: 'snake', to: 'owl' },
      { from: 'snake', to: 'fox' }
    ]
  };

  const currentConnections = connections[mode];
  const visibleNodes = organisms.filter(o => 
    mode === 'chain' ? ['grass', 'rabbit', 'fox'].includes(o.id) :
    mode === 'simple' ? ['grass', 'rabbit', 'grasshopper', 'fox', 'owl'].includes(o.id) :
    true
  );

  return (
    <div className="my-4 bg-orange-50 rounded-2xl border-2 border-orange-100 p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h4 className="font-black text-orange-800 uppercase tracking-wider text-sm flex flex-wrap gap-x-2">
          <span>Energy Flow Explorer</span>
          {isAssistMode && <span className="opacity-50 tracking-normal">{t("", "能量流动探索", "能量流動探索", chineseType)}</span>}
        </h4>
        <div className="bg-orange-100/50 p-1.5 rounded-2xl flex gap-1">
          {(['chain', 'simple', 'complex'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex flex-col items-center leading-none ${
                mode === m 
                  ? 'bg-orange-500 text-white shadow-[0_4px_0_0_#c2410c]' 
                  : 'text-orange-600 hover:bg-orange-100'
              }`}
            >
              <span>{m.charAt(0).toUpperCase() + m.slice(1)}</span>
              {isAssistMode && <span className="text-[8px] opacity-70 font-bold lowercase">{t("", m === 'chain' ? "食物链" : m === 'simple' ? "简单" : "复杂", m === 'chain' ? "食物鏈" : m === 'simple' ? "簡單" : "複雜", chineseType)}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="relative h-80 bg-white rounded-xl border-2 border-orange-100 overflow-hidden shadow-inner">
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#eab308" />
            </marker>
          </defs>
          {currentConnections.map((conn, i) => {
            const from = organisms.find(o => o.id === conn.from)!;
            const to = organisms.find(o => o.id === conn.to)!;
            const isActive = activeNode === from.id;
            return (
              <motion.line
                key={`${mode}-${i}`}
                x1={`${from.x}%`} y1={`${from.y}%`}
                x2={`${to.x}%`} y2={`${to.y}%`}
                stroke="#eab308"
                strokeWidth={isActive ? 4 : 2}
                strokeDasharray={isActive ? "none" : "5,5"}
                markerEnd="url(#arrowhead)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              />
            );
          })}
        </svg>

        {visibleNodes.map(node => (
          <motion.button
            key={node.id}
            layoutId={node.id}
            onClick={() => setActiveNode(node.id === activeNode ? null : node.id)}
            className={`absolute w-20 h-20 -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all shadow-sm ${
              activeNode === node.id ? 'bg-yellow-100 border-yellow-400 scale-110 z-20' : 'bg-white border-orange-100 z-10'
            }`}
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            <div className={`p-2 rounded-lg ${node.type === 'producer' ? 'bg-green-100 text-green-600' : node.type === 'herbivore' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
              {node.type === 'producer' ? <Leaf size={20} /> : node.type === 'herbivore' ? <Bug size={20} /> : <Activity size={20} />}
            </div>
            <span className="text-[8px] font-black uppercase text-gray-600 flex flex-col items-center leading-none">
              <span>{node.id.charAt(0).toUpperCase() + node.id.slice(1)}</span>
              {isAssistMode && <span className="opacity-60 font-bold">{t("", node.id === 'grass' ? "草" : node.id === 'rabbit' ? "兔子" : node.id === 'grasshopper' ? "蚱蜢" : node.id === 'fox' ? "狐狸" : node.id === 'owl' ? "猫头鹰" : "蛇", node.id === 'grass' ? "草" : node.id === 'rabbit' ? "兔子" : node.id === 'grasshopper' ? "蚱蜢" : node.id === 'fox' ? "狐狸" : node.id === 'owl' ? "貓頭鷹" : "蛇", chineseType)}</span>}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

// 3. Biomagnification Simulator (Updated with Toxin Particles and Thresholds)
export const BiomagnificationVisual: React.FC<VisualProps> = ({ isAssistMode, chineseType }) => {
  const [toxinLevel, setToxinLevel] = useState(1);
  const LETHAL_THRESHOLD = 1500;

  const levels = [
    { name: t('Plankton', '浮游生物', '浮游生物', chineseType), multiplier: 1, color: 'bg-emerald-100', icon: <Droplets size={16} /> },
    { name: t('Small Fish', '小鱼', '小魚', chineseType), multiplier: 10, color: 'bg-blue-100', icon: <Activity size={16} /> },
    { name: t('Large Fish', '大鱼', '大魚', chineseType), multiplier: 100, color: 'bg-indigo-100', icon: <Activity size={20} /> },
    { name: t('Osprey', '鱼鹰', '魚鷹', chineseType), multiplier: 1000, color: 'bg-purple-100', icon: <Wind size={20} /> },
  ];

  return (
    <div className="my-4 bg-red-50 rounded-2xl border-2 border-red-100 p-6 shadow-sm">
      <h4 className="font-black text-red-800 uppercase tracking-wider text-sm mb-6 flex flex-wrap gap-x-2">
        <span>Biomagnification Lab</span>
        {isAssistMode && <span className="opacity-50 tracking-normal">{t("", "生物放大作用实验室", "生物放大作用實驗室", chineseType)}</span>}
      </h4>

      <div className="bg-white p-4 rounded-xl border-2 border-red-100 shadow-sm mb-8">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-1">
          <label className="text-[10px] font-black text-red-600 uppercase tracking-widest flex flex-wrap gap-x-1">
            <span>Initial Toxin (ppm)</span>
            {isAssistMode && <span className="opacity-50 tracking-normal">{t("", "初始毒素 (ppm)", "初始毒素 (ppm)", chineseType)}</span>}
          </label>
          <span className="text-lg font-black text-red-700">{toxinLevel} ppm</span>
        </div>
        <input type="range" min="0.1" max="2" step="0.1" value={toxinLevel} onChange={(e) => setToxinLevel(parseFloat(e.target.value))} className="w-full h-2 bg-red-100 rounded-lg appearance-none cursor-pointer accent-red-500" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {levels.map((level, i) => {
          const concentration = toxinLevel * level.multiplier;
          const isLethal = concentration >= LETHAL_THRESHOLD;
          return (
            <motion.div
              key={i}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all shadow-sm ${isLethal ? 'bg-red-100 border-red-500' : 'bg-white border-red-100'}`}
            >
              <div className={`p-3 rounded-xl ${level.color} text-gray-700 relative overflow-hidden`}>
                {level.icon}
                {[...Array(Math.min(20, Math.ceil(concentration / 50)))].map((_, j) => (
                  <motion.div
                    key={j}
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, delay: j * 0.1 }}
                    className="absolute w-1 h-1 bg-red-500 rounded-full"
                    style={{ left: `${Math.random() * 80 + 10}%`, top: `${Math.random() * 80 + 10}%` }}
                  />
                ))}
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1 flex flex-col items-center">
                  <span>{['Plankton', 'Small Fish', 'Large Fish', 'Osprey'][i]}</span>
                  {isAssistMode && <span className="opacity-50">{t("", level.name, level.name, chineseType)}</span>}
                </p>
                <p className={`text-sm font-black ${isLethal ? 'text-red-600' : 'text-red-500'}`}>{concentration.toLocaleString()} ppm</p>
              </div>
              {isLethal && (
                <div className="flex items-center gap-1 text-[8px] font-black text-red-600 uppercase animate-pulse">
                  <AlertTriangle size={10} /> 
                  <span>Lethal</span>
                  {isAssistMode && <span className="opacity-60">({t("", "致命", "致命", chineseType)})</span>}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="bg-white p-4 rounded-xl border-2 border-red-100 shadow-sm h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={levels.map(l => ({ name: l.name, val: toxinLevel * l.multiplier }))}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 'bold' }} />
            <YAxis tick={{ fontSize: 10, fontWeight: 'bold' }} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }} />
            <Line type="monotone" dataKey="val" stroke="#ef4444" strokeWidth={4} dot={{ fill: '#ef4444', r: 6 }} />
            <Line type="monotone" dataKey={() => LETHAL_THRESHOLD} stroke="#000" strokeDasharray="5 5" strokeWidth={1} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// 4. Sampling Simulator (Updated with Zoom Animation)
export const SamplingSimulator: React.FC<VisualProps> = ({ isAssistMode, chineseType }) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const studyAreaSize = 25; // 5x5m
  const sampleSize = 1; // 1x1m
  
  const organisms = [
    { id: 'beetle', name: t('Beetle', '甲虫', '甲蟲', chineseType), color: 'bg-orange-500', count: 4 },
    { id: 'ant', name: t('Ant', '蚂蚁', '螞蟻', chineseType), color: 'bg-black', count: 12 },
  ];

  return (
    <div className="my-4 bg-blue-50 rounded-2xl border-2 border-blue-100 p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h4 className="font-black text-blue-800 uppercase tracking-wider text-sm flex flex-wrap gap-x-2">
          <span>Population Sampler</span>
          {isAssistMode && <span className="opacity-50 tracking-normal">{t("", "种群抽样器", "種群抽樣器", chineseType)}</span>}
        </h4>
        <button
          onClick={() => setIsZoomed(!isZoomed)}
          className="bg-blue-500 text-white px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest shadow-[0_4px_0_0_#1d4ed8] active:shadow-none active:translate-y-1 transition-all flex flex-col items-center leading-none"
        >
          <div className="flex items-center gap-2">
            <Maximize2 size={14} />
            <span>{isZoomed ? 'Zoom In' : 'Zoom Out'}</span>
          </div>
          {isAssistMode && <span className="text-[10px] opacity-70 mt-1 font-bold lowercase">{isZoomed ? t("", "放大", "放大", chineseType) : t("", "缩小", "縮小", chineseType)}</span>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="relative h-80 bg-white rounded-xl border-2 border-blue-100 overflow-hidden flex items-center justify-center shadow-inner">
          <motion.div 
            animate={{ scale: isZoomed ? 0.2 : 1 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="w-64 h-64 border-4 border-blue-400 border-dashed relative bg-blue-50/30"
          >
            <div className="absolute -top-6 left-0 text-[10px] font-black text-blue-500 uppercase">1m² {t('Sample', '样本', '樣本', chineseType)}</div>
            {organisms.map(org => (
              [...Array(org.count)].map((_, i) => (
                <motion.div
                  key={`${org.id}-${i}`}
                  className={`absolute w-2 h-2 rounded-full ${org.color}`}
                  style={{ left: `${Math.random() * 90 + 5}%`, top: `${Math.random() * 90 + 5}%` }}
                />
              ))
            ))}
          </motion.div>

          {isZoomed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 border-8 border-blue-100 pointer-events-none flex items-center justify-center"
            >
              <div className="text-[10px] font-black text-blue-200 uppercase tracking-[2em] rotate-45">25m² STUDY AREA</div>
            </motion.div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border-2 border-blue-100 shadow-sm">
            <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex flex-wrap gap-x-1">
              <span>Sample Data (1m²)</span>
              {isAssistMode && <span className="opacity-50">{t("", "样本数据 (1m²)", "樣本數據 (1m²)", chineseType)}</span>}
            </h5>
            <div className="space-y-4">
              {organisms.map(org => (
                <div key={org.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${org.color}`} />
                    <span className="text-xs font-bold text-gray-700 flex flex-col items-start leading-none">
                      <span>{org.id.charAt(0).toUpperCase() + org.id.slice(1)}</span>
                      {isAssistMode && <span className="text-[10px] opacity-60 font-medium">{t("", org.name, org.name, chineseType)}</span>}
                    </span>
                  </div>
                  <span className="text-lg font-black text-blue-600">{org.count}</span>
                </div>
              ))}
            </div>
          </div>

          <AnimatePresence>
            {isZoomed && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-500 p-6 rounded-xl text-white shadow-[0_4px_0_0_#1d4ed8]"
              >
                <h5 className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-80">{t('Estimated Total (25m²)', '预计总数 (25m²)', '預計總數 (25m²)', chineseType)}</h5>
                <div className="space-y-4">
                  {organisms.map(org => (
                    <div key={org.id} className="flex items-center justify-between">
                      <span className="text-xs font-bold">{org.name}</span>
                      <span className="text-2xl font-black">{org.count * studyAreaSize}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-[8px] font-bold italic opacity-70">
                  {t('Calculation: Sample Count × Total Area', '计算：样本数量 × 总面积', '計算：樣本數量 × 總面積', chineseType)}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
