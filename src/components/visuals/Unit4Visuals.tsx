import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Wind, Droplets, Leaf, Bug, MousePointer2, ArrowRight, RefreshCcw, Info, AlertTriangle, ChevronRight, ChevronLeft, Activity, Maximize2 } from 'lucide-react';

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
export const PhotosynthesisLab: React.FC<VisualProps> = ({ chineseType }) => {
  const [light, setLight] = useState(50);
  const [co2, setCo2] = useState(50);
  const [water, setWater] = useState(100); // Fixed for simplicity in graph
  const [graphVar, setGraphVar] = useState<'light' | 'co2'>('light');
  
  // Calculate rate based on limiting factors
  // Rate = min(light, co2) * efficiency
  const calculateRate = (l: number, c: number) => {
    return Math.min(l, c) * 0.8;
  };

  const currentRate = calculateRate(light, co2);

  // Generate graph points
  const points = Array.from({ length: 21 }, (_, i) => {
    const val = i * 5;
    const rate = graphVar === 'light' ? calculateRate(val, co2) : calculateRate(light, val);
    return { x: val, y: rate };
  });

  return (
    <div className="my-8 bg-white rounded-3xl border-2 border-gray-100 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-100 rounded-lg text-green-600">
          <Leaf size={20} />
        </div>
        <div>
          <h4 className="font-black text-gray-800 uppercase tracking-tight">
            {t('Photosynthesis Lab', '光合作用实验室', '光合作用實驗室', chineseType)}
          </h4>
          <p className="text-xs text-gray-500 font-bold">
            {t('Explore limiting factors and oxygen production.', '探索限制因素和氧气产生。', '探索限制因素和氧氣產生。', chineseType)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="relative h-80 bg-emerald-50 rounded-2xl border-2 border-emerald-100 overflow-hidden flex flex-col items-center justify-center p-4">
          {/* Plant & Molecules */}
          <div className="relative z-10 mb-8">
            <Leaf size={80} className="text-emerald-500 fill-emerald-500/20" />
            
            {/* Glucose Formula Bubbles */}
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

          {/* Animation Layer */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Light Rays (Yellow) */}
            {[...Array(Math.ceil(light / 10))].map((_, i) => (
              <motion.div
                key={`light-${i}`}
                animate={{ opacity: [0, 1, 0], x: [-20, 20], y: [-20, 20] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                className="absolute top-4 left-4 w-1 h-12 bg-yellow-400 rotate-45 blur-[1px]"
                style={{ left: `${i * 15}%` }}
              />
            ))}

            {/* CO2 Molecules (Red) */}
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

          {/* Graph Overlay */}
          <div className="w-full h-32 bg-white/50 backdrop-blur-sm rounded-xl border border-emerald-100 p-3 relative">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[8px] font-black text-emerald-700 uppercase tracking-widest">
                {t('Oxygen Production Rate', '氧气产生速率', '氧氣產生速率', chineseType)}
              </span>
              <select 
                value={graphVar} 
                onChange={(e) => setGraphVar(e.target.value as any)}
                className="text-[8px] bg-white border border-emerald-200 rounded px-1 font-bold"
              >
                <option value="light">{t('vs Light', '对 光照', '對 光照', chineseType)}</option>
                <option value="co2">{t('vs CO2', '对 二氧化碳', '對 二氧化碳', chineseType)}</option>
              </select>
            </div>
            
            <svg className="w-full h-20" viewBox="0 0 100 80" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                points={points.map(p => `${p.x},${80 - p.y}`).join(' ')}
              />
              {/* Current Point */}
              <motion.circle 
                cx={graphVar === 'light' ? light : co2} 
                cy={80 - currentRate} 
                r="3" 
                fill="#ef4444" 
              />
            </svg>
            <div className="absolute bottom-1 right-2 text-[6px] font-black text-gray-400 uppercase">
              {graphVar === 'light' ? t('Light Intensity', '光照强度', '光照強度', chineseType) : t('CO2 Conc.', 'CO2 浓度', 'CO2 濃度', chineseType)}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-yellow-50 p-4 rounded-2xl border-2 border-yellow-100">
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] font-black text-yellow-600 uppercase tracking-widest flex items-center gap-2">
                <Sun size={12} /> {t('Light Intensity', '光照强度', '光照強度', chineseType)}
              </label>
              <span className="text-xs font-bold text-yellow-700">{light}%</span>
            </div>
            <input type="range" min="0" max="100" value={light} onChange={(e) => setLight(parseInt(e.target.value))} className="w-full h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer accent-yellow-500" />
          </div>

          <div className="bg-red-50 p-4 rounded-2xl border-2 border-red-100">
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] font-black text-red-600 uppercase tracking-widest flex items-center gap-2">
                <Wind size={12} /> {t('CO2 Concentration', '二氧化碳浓度', '二氧化碳濃度', chineseType)}
              </label>
              <span className="text-xs font-bold text-red-700">{co2}%</span>
            </div>
            <input type="range" min="0" max="100" value={co2} onChange={(e) => setCo2(parseInt(e.target.value))} className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer accent-red-500" />
          </div>

          <div className="p-4 bg-emerald-50 rounded-2xl border-2 border-emerald-100">
            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-2">{t('Limiting Factor Analysis', '限制因素分析', '限制因素分析', chineseType)}</p>
            <p className="text-xs font-bold text-gray-600">
              {light < co2 
                ? t('Light is the limiting factor. Increasing CO2 won\'t help.', '光照是限制因素。增加二氧化碳没有帮助。', '光照是限制因素。增加二氧化碳沒有幫助。', chineseType)
                : t('CO2 is the limiting factor. Increasing light won\'t help.', '二氧化碳是限制因素。增加光照没有帮助。', '二氧化碳是限制因素。增加光照沒有幫助。', chineseType)
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. Food Web Explorer (Updated with Linear, Simple, and Complex modes)
export const FoodWebExplorer: React.FC<VisualProps> = ({ chineseType }) => {
  const [mode, setMode] = useState<'linear' | 'simple' | 'complex'>('linear');
  const [activeId, setActiveId] = useState<string | null>(null);

  const data = {
    linear: {
      organisms: [
        { id: 'grass', name: t('Grass', '草', '草', chineseType), pos: { x: 20, y: 50 } },
        { id: 'rabbit', name: t('Rabbit', '兔子', '兔子', chineseType), pos: { x: 50, y: 50 } },
        { id: 'fox', name: t('Fox', '狐狸', '狐狸', chineseType), pos: { x: 80, y: 50 } },
      ],
      connections: [
        { from: 'grass', to: 'rabbit' },
        { from: 'rabbit', to: 'fox' },
      ]
    },
    simple: {
      organisms: [
        { id: 'grass', name: t('Grass', '草', '草', chineseType), pos: { x: 50, y: 80 } },
        { id: 'rabbit', name: t('Rabbit', '兔子', '兔子', chineseType), pos: { x: 30, y: 50 } },
        { id: 'grasshopper', name: t('Grasshopper', '蚱蜢', '蚱蜢', chineseType), pos: { x: 70, y: 50 } },
        { id: 'hawk', name: t('Hawk', '老鹰', '老鷹', chineseType), pos: { x: 50, y: 20 } },
      ],
      connections: [
        { from: 'grass', to: 'rabbit' },
        { from: 'grass', to: 'grasshopper' },
        { from: 'rabbit', to: 'hawk' },
        { from: 'grasshopper', to: 'hawk' },
      ]
    },
    complex: {
      organisms: [
        { id: 'grass', name: t('Grass', '草', '草', chineseType), pos: { x: 30, y: 85 } },
        { id: 'shrub', name: t('Shrub', '灌木', '灌木', chineseType), pos: { x: 70, y: 85 } },
        { id: 'rabbit', name: t('Rabbit', '兔子', '兔子', chineseType), pos: { x: 20, y: 55 } },
        { id: 'grasshopper', name: t('Grasshopper', '蚱蜢', '蚱蜢', chineseType), pos: { x: 50, y: 55 } },
        { id: 'mouse', name: t('Mouse', '老鼠', '老鼠', chineseType), pos: { x: 80, y: 55 } },
        { id: 'snake', name: t('Snake', '蛇', '蛇', chineseType), pos: { x: 65, y: 25 } },
        { id: 'hawk', name: t('Hawk', '老鹰', '老鷹', chineseType), pos: { x: 35, y: 25 } },
      ],
      connections: [
        { from: 'grass', to: 'rabbit' },
        { from: 'grass', to: 'grasshopper' },
        { from: 'shrub', to: 'grasshopper' },
        { from: 'shrub', to: 'mouse' },
        { from: 'rabbit', to: 'hawk' },
        { from: 'grasshopper', to: 'hawk' },
        { from: 'grasshopper', to: 'snake' },
        { from: 'mouse', to: 'snake' },
        { from: 'snake', to: 'hawk' },
      ]
    }
  };

  const current = data[mode];

  return (
    <div className="my-8 bg-white rounded-3xl border-2 border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
            <RefreshCcw size={20} />
          </div>
          <div>
            <h4 className="font-black text-gray-800 uppercase tracking-tight">
              {t('Energy Flow Explorer', '能量流动探索', '能量流動探索', chineseType)}
            </h4>
            <p className="text-xs text-gray-500 font-bold">
              {t('Switch modes to see different complexities.', '切换模式观察不同复杂度的模型。', '切換模式觀察不同複雜度的模型。', chineseType)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {(['linear', 'simple', 'complex'] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setActiveId(null); }}
            className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${
              mode === m ? 'bg-orange-500 text-white shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
            }`}
          >
            {m === 'linear' ? t('Food Chain', '食物链', '食物鏈', chineseType) : 
             m === 'simple' ? t('Simple Web', '简单食物网', '簡單食物網', chineseType) : 
             t('Complex Web', '复杂食物网', '複雜食物網', chineseType)}
          </button>
        ))}
      </div>

      <div className="relative h-96 bg-gray-50 rounded-2xl border-2 border-gray-100 overflow-hidden">
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#fbbf24" />
            </marker>
          </defs>
          {current.connections.map((conn, i) => {
            const from = current.organisms.find(o => o.id === conn.from)!;
            const to = current.organisms.find(o => o.id === conn.to)!;
            const isActive = activeId === conn.from || activeId === conn.to;
            return (
              <g key={`${mode}-${i}`}>
                <motion.line
                  x1={`${from.pos.x}%`}
                  y1={`${from.pos.y}%`}
                  x2={`${to.pos.x}%`}
                  y2={`${to.pos.y}%`}
                  stroke={isActive ? '#fbbf24' : '#e5e7eb'}
                  strokeWidth={isActive ? 4 : 2}
                  markerEnd="url(#arrowhead)"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                />
                {isActive && (
                  <motion.circle
                    r="4"
                    fill="#fbbf24"
                    animate={{
                      cx: [`${from.pos.x}%`, `${to.pos.x}%`],
                      cy: [`${from.pos.y}%`, `${to.pos.y}%`],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </g>
            );
          })}
        </svg>

        {current.organisms.map((org) => (
          <motion.button
            key={org.id}
            onClick={() => setActiveId(org.id === activeId ? null : org.id)}
            whileHover={{ scale: 1.1 }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 px-4 py-2 rounded-xl border-2 transition-all shadow-sm ${
              activeId === org.id 
                ? 'bg-orange-500 border-orange-600 text-white z-20' 
                : 'bg-white border-gray-200 text-gray-700 z-10'
            }`}
            style={{ left: `${org.pos.x}%`, top: `${org.pos.y}%` }}
          >
            <span className="text-[10px] font-black uppercase tracking-tight">{org.name}</span>
          </motion.button>
        ))}

        <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-yellow-400 rounded-full" />
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{t('Energy Flow', '能量流动', '能量流動', chineseType)}</span>
          </div>
          <p className="text-[10px] font-bold text-gray-600 italic">
            {t('Yellow arrows show energy transfer.', '黄色箭头表示能量转移。', '黃色箭頭表示能量轉移。', chineseType)}
          </p>
        </div>
      </div>
    </div>
  );
};

// 3. Biomagnification Visual (Updated with Red Particles and Lethal Threshold)
export const BiomagnificationVisual: React.FC<VisualProps> = ({ chineseType }) => {
  const [toxinLevel, setToxinLevel] = useState(1);
  const LETHAL_THRESHOLD = 1500;

  const levels = [
    { name: t('Algae', '藻类', '藻類', chineseType), multiplier: 1, color: 'bg-emerald-400' },
    { name: t('Small Fish', '小鱼', '小魚', chineseType), multiplier: 10, color: 'bg-blue-400' },
    { name: t('Large Fish', '大鱼', '大魚', chineseType), multiplier: 100, color: 'bg-indigo-400' },
    { name: t('Osprey', '鱼鹰', '魚鷹', chineseType), multiplier: 1000, color: 'bg-purple-500' },
  ];

  return (
    <div className="my-8 bg-white rounded-3xl border-2 border-gray-100 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
          <AlertTriangle size={20} />
        </div>
        <div>
          <h4 className="font-black text-gray-800 uppercase tracking-tight">
            {t('Biomagnification Simulator', '生物放大作用模拟器', '生物放大作用模擬器', chineseType)}
          </h4>
          <p className="text-xs text-gray-500 font-bold">
            {t('Observe toxins accumulating to lethal levels.', '观察毒素如何累积到致死水平。', '觀察毒素如何累積到致死水平。', chineseType)}
          </p>
        </div>
      </div>

      <div className="space-y-8">
        <div className="bg-gray-50 p-6 rounded-2xl border-2 border-gray-100">
          <div className="flex justify-between mb-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {t('Initial Toxin (Red Particles)', '初始毒素 (红色粒子)', '初始毒素 (紅色粒子)', chineseType)}
            </label>
            <span className="text-xs font-black text-purple-600">{toxinLevel.toFixed(1)} ppm</span>
          </div>
          <input 
            type="range" 
            min="0.1" 
            max="2" 
            step="0.1" 
            value={toxinLevel} 
            onChange={(e) => setToxinLevel(parseFloat(e.target.value))} 
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500" 
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {levels.map((level, i) => {
            const currentToxin = toxinLevel * level.multiplier;
            const isLethal = currentToxin >= LETHAL_THRESHOLD;
            
            return (
              <div key={i} className={`bg-white p-4 rounded-2xl border-2 transition-colors flex flex-col items-center text-center shadow-sm ${isLethal ? 'border-red-500 bg-red-50' : 'border-gray-100'}`}>
                <div className={`relative w-16 h-16 ${level.color} rounded-2xl mb-3 flex items-center justify-center overflow-hidden`}>
                  {/* Red Toxin Particles */}
                  {[...Array(Math.min(50, Math.ceil(currentToxin / 10)))].map((_, j) => (
                    <motion.div
                      key={j}
                      animate={{ 
                        x: [Math.random() * 60 - 30, Math.random() * 60 - 30],
                        y: [Math.random() * 60 - 30, Math.random() * 60 - 30]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute w-1 h-1 bg-red-500 rounded-full"
                    />
                  ))}
                  <span className="relative z-10 text-white font-black text-xl">{i + 1}</span>
                </div>
                
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{level.name}</p>
                <p className={`text-lg font-black ${isLethal ? 'text-red-600' : 'text-purple-600'}`}>
                  {currentToxin.toLocaleString()} <span className="text-[10px]">ppm</span>
                </p>
                
                {isLethal && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="mt-2 flex items-center gap-1 text-red-600"
                  >
                    <AlertTriangle size={12} />
                    <span className="text-[8px] font-black uppercase">{t('Lethal!', '致死！', '致死！', chineseType)}</span>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>

        {/* Accumulation Graph */}
        <div className="bg-gray-900 p-6 rounded-2xl border-4 border-gray-800 relative h-48">
          <div className="absolute left-4 top-4 text-[8px] font-black text-white/30 uppercase tracking-widest vertical-text">
            {t('Toxin Concentration', '毒素浓度', '毒素濃度', chineseType)}
          </div>
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Lethal Line */}
            <line x1="0" y1="25" x2="100" y2="25" stroke="#ef4444" strokeWidth="1" strokeDasharray="4" />
            <text x="5" y="20" fill="#ef4444" fontSize="4" fontWeight="bold">{t('LETHAL THRESHOLD', '致死阈值', '致死閾值', chineseType)}</text>
            
            {/* Curve */}
            <path
              d={`M 0 100 Q 50 100 100 ${100 - (toxinLevel * 1000 / LETHAL_THRESHOLD * 25)}`}
              fill="none"
              stroke="#a855f7"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

// 4. Sampling Tools Simulator (Updated with Zoom Animation)
export const SamplingSimulator: React.FC<VisualProps> = ({ chineseType }) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [counts, setCounts] = useState({ beetles: 5, ants: 12 });

  return (
    <div className="my-8 bg-white rounded-3xl border-2 border-gray-100 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
          <Maximize2 size={20} />
        </div>
        <div>
          <h4 className="font-black text-gray-800 uppercase tracking-tight">
            {t('Sampling Scaler', '取样缩放器', '取樣縮放器', chineseType)}
          </h4>
          <p className="text-xs text-gray-500 font-bold">
            {t('See how small samples represent large areas.', '观察小样本如何代表大區域。', '觀察小樣本如何代表大區域。', chineseType)}
          </p>
        </div>
      </div>

      <div className="relative h-80 bg-emerald-900 rounded-2xl border-4 border-emerald-800 overflow-hidden flex items-center justify-center">
        {/* Large Area Grid */}
        <motion.div 
          animate={{ scale: isZoomed ? 1 : 0.15 }}
          transition={{ duration: 1.5, type: 'spring' }}
          className="relative w-[600px] h-[600px] bg-emerald-800/50 grid grid-cols-5 grid-rows-5 gap-1 p-1"
        >
          {[...Array(25)].map((_, i) => (
            <div key={i} className={`border border-emerald-700/30 rounded flex items-center justify-center relative ${i === 12 ? 'bg-emerald-600/50 border-white/50 border-2' : ''}`}>
              {/* Organisms in each quadrant */}
              {[...Array(counts.beetles)].map((_, j) => (
                <div key={`b-${j}`} className="absolute w-1 h-1 bg-black rounded-full" style={{ left: `${Math.random() * 80 + 10}%`, top: `${Math.random() * 80 + 10}%` }} />
              ))}
              {[...Array(counts.ants)].map((_, j) => (
                <div key={`a-${j}`} className="absolute w-0.5 h-0.5 bg-red-400 rounded-full" style={{ left: `${Math.random() * 80 + 10}%`, top: `${Math.random() * 80 + 10}%` }} />
              ))}
              
              {i === 12 && isZoomed && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white px-2 py-1 rounded text-[6px] font-black text-emerald-800 uppercase whitespace-nowrap shadow-lg">
                  {t('Sample Quadrant (1m²)', '取样方格 (1m²)', '取樣方格 (1m²)', chineseType)}
                </div>
              )}
            </div>
          ))}
        </motion.div>

        {/* UI Controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          <button 
            onClick={() => setIsZoomed(!isZoomed)}
            className="bg-white text-emerald-900 px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-emerald-50 transition-all flex items-center gap-2"
          >
            {isZoomed ? t('Zoom Out (Total Area)', '缩小 (总面积)', '縮小 (總面積)', chineseType) : t('Zoom In (Sample)', '放大 (样本)', '放大 (樣本)', chineseType)}
          </button>
        </div>

        {/* Stats Overlay */}
        <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-white min-w-[150px]">
          <p className="text-[8px] font-black uppercase tracking-widest mb-3 opacity-60">{t('Estimated Population', '估計種群數量', '估計種群數量', chineseType)}</p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold">{t('Beetles', '甲虫', '甲蟲', chineseType)}</span>
              <span className="text-sm font-black text-emerald-400">{isZoomed ? counts.beetles : counts.beetles * 25}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold">{t('Ants', '蚂蚁', '螞蟻', chineseType)}</span>
              <span className="text-sm font-black text-red-400">{isZoomed ? counts.ants : counts.ants * 25}</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-[6px] italic opacity-50">
              {isZoomed 
                ? t('Showing 1m² sample area.', '显示 1m² 样本区域。', '顯示 1m² 樣本區域。', chineseType)
                : t('Estimated for total 25m² area.', '估計總 25m² 區域。', '估計總 25m² 區域。', chineseType)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
