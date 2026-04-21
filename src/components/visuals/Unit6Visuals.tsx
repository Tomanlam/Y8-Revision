import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sun, 
  Orbit, 
  Zap,
  ChevronRight,
  Eye,
  Circle,
  Telescope,
  Wind,
  Settings2,
  Info,
  Star
} from 'lucide-react';

interface VisualProps {
  isAssistMode: boolean;
  chineseType: 'traditional' | 'simplified';
}

const t = (en: string, sc: string, tc: string, type: string) => {
  if (type === 'simplified') return sc;
  if (type === 'traditional') return tc;
  return en;
}

// 1. Reflection Simulator
export const ReflectionSimulator: React.FC<VisualProps> = ({ isAssistMode, chineseType }) => {
  const [angle, setAngle] = useState(45); // Angle from normal

  const darkColor = '#b45309';

  return (
    <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-6 my-4 shadow-sm">
      <h4 className="font-black text-amber-800 uppercase tracking-wider text-sm mb-4 flex flex-wrap gap-x-2">
        <span>Reflection Simulator</span>
        {isAssistMode && <span className="opacity-50 tracking-normal">{t("", "反射模拟器", "反射模擬器", chineseType)}</span>}
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative h-64 bg-slate-900 rounded-xl overflow-hidden border-2 border-slate-700 shadow-inner">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            {/* Mirror Surface */}
            <rect x="20" y="175" width="160" height="8" fill="#94a3b8" rx="2" />
            <rect x="20" y="183" width="160" height="4" fill="#475569" rx="1" />
            
            <line x1="20" y1="175" x2="180" y2="175" stroke="#f1f5f9" strokeWidth="1" strokeOpacity="0.5" />

            {/* Normal */}
            <line x1="100" y1="20" x2="100" y2="175" stroke="#64748b" strokeWidth="1" strokeDasharray="4" />
            <text x="102" y="30" fill="#64748b" fontSize="6" className="font-bold">
              NORMAL {isAssistMode && t("", "(法线)", "(法線)", chineseType)}
            </text>
            
            {/* Incident Ray */}
            <motion.line 
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              x1={100 - Math.tan((angle * Math.PI) / 180) * 155} 
              y1="20" 
              x2="100" 
              y2="175" 
              stroke="#fcd34d" 
              strokeWidth="3" 
              strokeLinecap="round"
            />
            
            {/* Reflected Ray */}
            <motion.line 
               initial={{ pathLength: 0 }}
               animate={{ pathLength: 1 }}
               key={angle}
               x1="100" 
               y1="175" 
               x2={100 + Math.tan((angle * Math.PI) / 180) * 155} 
               y2="20" 
               stroke="#fbbf24" 
               strokeWidth="3" 
               strokeLinecap="round"
            />

            {/* Angles Visual */}
            <path 
              d={`M 100 135 A 40 40 0 0 0 ${100 - Math.sin((angle * Math.PI) / 180) * 40} ${175 - Math.cos((angle * Math.PI) / 180) * 40}`}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="1"
              strokeOpacity="0.4"
            />
            <path 
              d={`M 100 135 A 40 40 0 0 1 ${100 + Math.sin((angle * Math.PI) / 180) * 40} ${175 - Math.cos((angle * Math.PI) / 180) * 40}`}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="1"
              strokeOpacity="0.4"
            />

            {/* Labels */}
            <text x={85 - Math.tan((angle * Math.PI) / 180) * 20} y="150" fill="#fcd34d" fontSize="10" className="font-black" textAnchor="middle">
              <tspan x={85 - Math.tan((angle * Math.PI) / 180) * 20} dy="0">i = {angle}°</tspan>
              {isAssistMode && <tspan x={85 - Math.tan((angle * Math.PI) / 180) * 20} dy="10" fontSize="6" opacity="0.7">({t("", "入射角", "入射角", chineseType)})</tspan>}
            </text>
            <text x={115 + Math.tan((angle * Math.PI) / 180) * 20} y="150" fill="#fbbf24" fontSize="10" className="font-black" textAnchor="middle">
              <tspan x={115 + Math.tan((angle * Math.PI) / 180) * 20} dy="0">r = {angle}°</tspan>
              {isAssistMode && <tspan x={115 + Math.tan((angle * Math.PI) / 180) * 20} dy="10" fontSize="6" opacity="0.7">({t("", "反射角", "反射角", chineseType)})</tspan>}
            </text>
            
            {/* Glow at contact */}
            <circle cx="100" cy="175" r="4" fill="#fbbf24" className="animate-pulse" />
          </svg>
        </div>

        <div className="flex flex-col justify-center gap-4">
          <div className="p-4 bg-white rounded-xl border border-amber-100 flex gap-3 items-start shadow-sm">
             <div className="p-2 bg-amber-100 rounded-lg shrink-0">
                <Info size={16} className="text-amber-600" />
             </div>
             <div className="text-xs text-amber-900 leading-relaxed">
              <span className="font-black uppercase flex flex-wrap gap-x-1 mb-1">
                <span>The Law</span>
                {isAssistMode && <span className="opacity-50 text-[10px] items-center flex">({t("", "反射定律", "反射定律", chineseType)})</span>}
              </span>
              <div className="flex flex-col gap-1">
                <span>Angle of Incidence (i) = Angle of Reflection (r). Light bounces off a mirror exactly as it enters.</span>
                {isAssistMode && (
                  <span className="opacity-80 italic border-t border-amber-100 pt-1 text-[11px]">
                    {t(
                      '',
                      '入射角 (i) = 反射角 (r)。光线从镜子反射的角度与进入的角度完全相同。',
                      '入射角 (i) = 反射角 (r)。光線從鏡子反射的角度與進入的角度完全相同。',
                      chineseType
                    )}
                  </span>
                )}
              </div>
             </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm">
            <div className="flex justify-between items-center mb-2 flex-wrap gap-1">
              <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex flex-wrap gap-x-1">
                <span>Adjust Incidence</span>
                {isAssistMode && <span className="opacity-50">{t("", "调整入射角", "調整入射角", chineseType)}</span>}
              </label>
              <span className="text-xs font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">{angle}°</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="80" 
              value={angle} 
              onChange={(e) => setAngle(parseInt(e.target.value))}
              className="w-full h-2 bg-amber-100 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          <div className="flex gap-2">
            {[30, 45, 60].map(a => (
              <button
                key={a}
                onClick={() => setAngle(a)}
                className={`flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex flex-col items-center leading-none ${
                  angle === a 
                    ? 'bg-amber-500 text-white shadow-[0_4px_0_0_#b45309]' 
                    : 'bg-white text-amber-600 border border-amber-100 hover:bg-amber-50'
                } active:shadow-none active:translate-y-1`}
              >
                <span>{a}°</span>
                {isAssistMode && <span className="text-[8px] opacity-70 font-bold lowercase">({t("", "度", "度", chineseType)})</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. Refraction Simulator
export const RefractionSimulator: React.FC<VisualProps> = ({ isAssistMode, chineseType }) => {
  const [angle, setAngle] = useState(45);
  const [media1, setMedia1] = useState('air');
  const [media2, setMedia2] = useState('water');

  const refIndex: Record<string, number> = {
    air: 1.0,
    water: 1.33,
    glass: 1.5
  };

  const n1 = refIndex[media1];
  const n2 = refIndex[media2];
  
  const sinSet = (Math.sin(angle * Math.PI / 180) * n1) / n2;
  const refractionAngle = sinSet > 1 ? 90 : (Math.asin(sinSet) * 180) / Math.PI;
  const isTotalInternalReflection = sinSet > 1;

  const behavior = n1 < n2 ? 'towards' : n1 > n2 ? 'away' : 'none';
  const speedLabel = (n: number) => {
    if (n === 1.0) return { label: 'FASTEST', color: 'text-emerald-500', bg: 'bg-emerald-50' };
    if (n === 1.33) return { label: 'MEDIUM', color: 'text-amber-500', bg: 'bg-amber-50' };
    return { label: 'SLOWEST', color: 'text-red-500', bg: 'bg-red-50' };
  };

  const s1 = speedLabel(n1);
  const s2 = speedLabel(n2);

  return (
    <div className="bg-cyan-50 border-2 border-cyan-100 rounded-2xl p-6 my-4 shadow-sm">
      <h4 className="font-black text-cyan-800 uppercase tracking-wider text-sm mb-4 flex flex-wrap gap-x-2">
        <span>Refraction & Speed Bending</span>
        {isAssistMode && <span className="opacity-50 tracking-normal">{t("", "折射与速度弯曲", "折射與速度彎曲", chineseType)}</span>}
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative h-72 bg-white rounded-xl overflow-hidden border-2 border-cyan-200">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            {/* Background for Media 2 */}
            <rect x="0" y="100" width="200" height="100" fill={media2 === 'water' ? '#e0f2fe' : media2 === 'glass' ? '#f1f5f9' : '#ffffff'} />
            
            {/* Interface line */}
            <line x1="0" y1="100" x2="200" y2="100" stroke="#0891b2" strokeWidth="2" />
            
            {/* Normal */}
            <line x1="100" y1="20" x2="100" y2="180" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4" />
            <text x="105" y="30" fill="#94a3b8" fontSize="5" className="font-bold">
              NORMAL {isAssistMode && t("", "(法线)", "(法線)", chineseType)}
            </text>

            {/* Speed Badges */}
            <rect x="5" y="10" width="45" height="15" rx="4" fill="white" fillOpacity="0.8" />
            <text x="10" y="18" fontSize="5" className={`font-black uppercase ${s1.color}`}>
              <tspan x="10" dy="0">SPEED: {s1.label}</tspan>
              {isAssistMode && <tspan x="10" dy="6" fontSize="4">{t("", `(速度: ${t("", "快", "快", chineseType)})`, `(速度: ${t("", "快", "快", chineseType)})`, chineseType)}</tspan>}
            </text>
            
            <rect x="5" y="175" width="45" height="15" rx="4" fill="white" fillOpacity="0.8" />
            <text x="10" y="183" fontSize="5" className={`font-black uppercase ${s2.color}`}>
              <tspan x="10" dy="0">SPEED: {s2.label}</tspan>
              {isAssistMode && <tspan x="10" dy="6" fontSize="4">{t("", `(速度: ${t("", "慢", "慢", chineseType)})`, `(速度: ${t("", "慢", "慢", chineseType)})`, chineseType)}</tspan>}
            </text>

            {/* Incident Ray */}
            <motion.line 
              animate={{ pathLength: [0, 1] }}
              x1={100 - Math.tan(angle * Math.PI / 180) * 80} 
              y1="20" 
              x2="100" 
              y2="100" 
              stroke="#0891b2" 
              strokeWidth="2.5" 
              strokeLinecap="round"
            />

            {/* Refracted or Reflected Ray */}
            {!isTotalInternalReflection ? (
              <motion.line 
                key={`${media1}-${media2}-${angle}`}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                x1="100" 
                y1="100" 
                x2={100 + Math.tan(refractionAngle * Math.PI / 180) * 80} 
                y2="180" 
                stroke="#0891b2" 
                strokeWidth="2.5" 
                strokeLinecap="round"
              />
            ) : (
              <motion.line 
                key="tir"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                x1="100" 
                y1="100" 
                x2={100 + Math.tan(angle * Math.PI / 180) * 80} 
                y2="20" 
                stroke="#ef4444" 
                strokeWidth="2.5" 
                strokeLinecap="round"
              />
            )}

            {/* Labels */}
            <text x="150" y="20" fontSize="7" className="font-black fill-cyan-400 uppercase">
              <tspan x="150" dy="0">{media1}</tspan>
              {isAssistMode && <tspan x="150" dy="8" fontSize="5">({t("Air", "空气", "空氣", chineseType)})</tspan>}
            </text>
            <text x="150" y="180" fontSize="7" className="font-black fill-cyan-400 uppercase">
              <tspan x="150" dy="0">{media2}</tspan>
              {isAssistMode && <tspan x="150" dy="8" fontSize="5">({t("Water", "水", "水", chineseType)})</tspan>}
            </text>
            
            <text x={95 - Math.tan(angle * Math.PI / 180) * 40} y="60" fontSize="8" className="font-bold fill-cyan-600">{angle}°</text>
            <text x={105 + Math.tan(refractionAngle * Math.PI / 180) * 40} y="140" fontSize="8" className="font-bold fill-cyan-600">
              {isTotalInternalReflection ? 'TIR' : `${refractionAngle.toFixed(1)}°`}
            </text>

            {/* Direction Badge */}
            <g transform="translate(100, 100)">
               <motion.path 
                 animate={{ rotate: behavior === 'towards' ? -15 : behavior === 'away' ? 15 : 0 }}
                 d="M 0 0 L 0 30"
                 stroke="#0891b2"
                 strokeWidth="1"
                 strokeDasharray="2"
                 opacity="0.3"
               />
            </g>
          </svg>
          
          {/* Legend Overlay */}
          <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
            {behavior === 'towards' && (
              <div className="bg-emerald-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm">
                {t('Towards Normal', '向法线弯曲', '向法線彎曲', chineseType)}
              </div>
            )}
            {behavior === 'away' && (
              <div className="bg-amber-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm">
                {t('Away from Normal', '背离法线弯曲', '背離法線彎曲', chineseType)}
              </div>
            )}
            {isTotalInternalReflection && (
              <div className="bg-red-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm">
                {t('Total Internal Reflection', '全内反射', '全內反射', chineseType)}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded-xl border border-cyan-100 flex flex-col items-start">
              <label className="block text-[10px] font-black text-cyan-600 uppercase mb-2 flex items-center gap-1 flex-wrap">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Incident Medium</span>
                {isAssistMode && <span className="text-[8px] opacity-60">({t("", "入射介质", "入射介質", chineseType)})</span>}
              </label>
              <select 
                value={media1} 
                onChange={(e) => setMedia1(e.target.value)}
                className="w-full text-xs p-2 rounded-lg bg-slate-50 border border-cyan-100 outline-none font-bold text-cyan-800"
              >
                <option value="air">Air (Fastest)</option>
                <option value="water">Water (Medium)</option>
                <option value="glass">Glass (Slowest)</option>
              </select>
            </div>
            <div className="bg-white p-3 rounded-xl border border-cyan-100 flex flex-col items-start">
              <label className="block text-[10px] font-black text-cyan-600 uppercase mb-2 flex items-center gap-1 flex-wrap">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Refraction Medium</span>
                {isAssistMode && <span className="text-[8px] opacity-60">({t("", "折射介质", "折射介質", chineseType)})</span>}
              </label>
              <select 
                value={media2} 
                onChange={(e) => setMedia2(e.target.value)}
                className="w-full text-xs p-2 rounded-lg bg-slate-50 border border-cyan-100 outline-none font-bold text-cyan-800"
              >
                <option value="air">Air (Fastest)</option>
                <option value="water">Water (Medium)</option>
                <option value="glass">Glass (Slowest)</option>
              </select>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-cyan-100">
            <div className="flex justify-between items-center mb-2 flex-wrap gap-1">
              <label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest flex flex-wrap gap-x-1">
                <span>Angle of Incidence</span>
                {isAssistMode && <span className="opacity-50">{t("", "入射角", "入射角", chineseType)}</span>}
              </label>
              <span className="text-xs font-black text-cyan-600">{angle}°</span>
            </div>
            <input 
              type="range" min="0" max="85" value={angle} 
              onChange={(e) => setAngle(parseInt(e.target.value))}
              className="w-full h-2 bg-cyan-100 rounded-lg appearance-none cursor-pointer accent-cyan-600"
            />
          </div>

          <div className="bg-white p-4 rounded-xl border border-cyan-100 shadow-sm relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full ${behavior === 'towards' ? 'bg-emerald-500' : behavior === 'away' ? 'bg-amber-500' : 'bg-slate-300'}`} />
            <div className="text-[11px] text-cyan-900 leading-relaxed font-bold flex flex-col gap-1">
              {behavior === 'towards' ? (
                <>
                  <p><strong>FAST to SLOW:</strong> Light enters a denser medium, slows down, and bends TOWARDS the normal.</p>
                  {isAssistMode && <p className="text-[10px] font-medium italic opacity-70 border-t border-cyan-50 pt-1"><strong>{t("由快變慢：", "由快变慢：", "由快變慢：", chineseType)}</strong> {t("光進入更稠密的介質，速度減慢，並向法線彎曲。", "光进入更稠密的介质，速度减慢，并向法线弯曲。", "光進入更稠密的介質，速度減慢，並向法線彎曲。", chineseType)}</p>}
                </>
              ) : behavior === 'away' ? (
                <>
                  <p><strong>SLOW to FAST:</strong> Light enters a less dense medium, speeds up, and bends AWAY from the normal.</p>
                  {isAssistMode && <p className="text-[10px] font-medium italic opacity-70 border-t border-cyan-50 pt-1"><strong>{t("由慢變快：", "由慢变快：", "由慢變快：", chineseType)}</strong> {t("光進入密度較低的介質，加速，並偏離法線。", "光进入密度较低的介质，加速，并偏离法线。", "光進入密度較低的介質，加速，並偏離法線。", chineseType)}</p>}
                </>
              ) : (
                <>
                  <p>No change in speed, no bending.</p>
                  {isAssistMode && <p className="text-[10px] font-medium italic opacity-70 border-t border-cyan-50 pt-1">{t("速度沒有變化，沒有彎曲。", "速度没有变化，没有弯曲。", "速度沒有變化，沒有彎曲。", chineseType)}</p>}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 3. Solar System Model (Linear Slice View)
export const SolarSystemModel: React.FC<VisualProps> = ({ isAssistMode, chineseType }) => {
  const [hovered, setHovered] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const planets = [
    { name: 'Mercury', sc: '水星', tc: '水星', color: '#94a3b8', size: 10, offset: 120, fact: 'Smallest planet, closest to Sun' },
    { name: 'Venus', sc: '金星', tc: '金星', color: '#fcd34d', size: 18, offset: 200, fact: 'Hottest planet due to thick atmosphere' },
    { name: 'Earth', sc: '地球', tc: '地球', color: '#3b82f6', size: 20, offset: 300, fact: 'Our home, only known planet with life' },
    { name: 'Mars', sc: '火星', tc: '火星', color: '#ef4444', size: 15, offset: 400, fact: 'The Red Planet, home to Olympus Mons' },
    { name: 'Jupiter', sc: '木星', tc: '木星', color: '#f97316', size: 55, offset: 550, fact: 'Gas giant, largest planet in solar system' },
    { name: 'Saturn', sc: '土星', tc: '土星', color: '#eab308', size: 48, offset: 700, fact: 'Famous for its prominent ring system' },
    { name: 'Uranus', sc: '天王星', tc: '天王星', color: '#22d3ee', size: 32, offset: 850, fact: 'Ice giant, rotates on its side' },
    { name: 'Neptune', sc: '海王星', tc: '海王星', color: '#6366f1', size: 30, offset: 1000, fact: 'Windiest planet, furthest from Sun' },
  ];

  return (
    <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 my-4 shadow-2xl text-white overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
         <Orbit size={120} className="rotate-12" />
      </div>

      <div className="flex justify-between items-end mb-6">
        <div>
          <h4 className="font-black text-indigo-300 uppercase tracking-widest text-sm flex items-center gap-2 flex-wrap">
            <Star className="text-yellow-400 fill-yellow-400" size={16} />
            <div className="flex flex-wrap gap-x-2">
              <span>Solar System Explorer</span>
              {isAssistMode && <span className="text-indigo-400/50 tracking-normal">{t("", "太阳系探险", "太陽系探險", chineseType)}</span>}
            </div>
          </h4>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1 flex flex-col">
            <span>A linear slice view of our planetary neighbors</span>
            {isAssistMode && <span className="opacity-50 border-t border-slate-800 pt-0.5 mt-0.5 font-medium">{t("", "邻近行星的线性剖面视图", "鄰近行星的線性剖面視圖", chineseType)}</span>}
          </div>
        </div>
        <div className="flex gap-2 text-[10px] font-black text-slate-500">
           <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-500" /> SUN</span>
           <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-500" /> PLANETS</span>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="relative h-72 bg-black/50 rounded-2xl overflow-x-auto border border-slate-800 shadow-inner flex items-center scrollbar-hide cursor-grab active:cursor-grabbing"
      >
        <div className="flex-shrink-0 relative h-full flex items-center px-10 min-w-[1200px]">
          {/* Sun (Massive Left Slice) */}
          <div className="absolute -left-[450px] w-[600px] h-[600px] bg-yellow-400 rounded-full blur-[2px] shadow-[0_0_120px_rgba(250,204,21,0.5)] z-0 overflow-hidden">
             <motion.div 
               animate={{ rotate: 360 }}
               transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
               className="w-full h-full bg-[radial-gradient(circle_at_center,_#fbbf24_0%,_#f59e0b_30%,_#d97706_70%,_#78350f_100%)] opacity-90" 
             />
          </div>
          
          <div className="absolute left-6 z-10 flex flex-col items-start translate-y-[-80px]">
            <div className="text-[12px] font-black text-yellow-500 bg-black/40 px-2 py-0.5 rounded-lg border border-yellow-500/30 backdrop-blur-sm whitespace-nowrap flex flex-col items-center">
              <span>THE SUN</span>
              {isAssistMode && <span className="text-[10px] opacity-70 border-t border-yellow-500/20 mt-1 pt-0.5">{t("", "太阳", "太陽", chineseType)}</span>}
            </div>
          </div>

          {/* Scale Lines */}
          {[...Array(12)].map((_, i) => (
             <div key={i} className="absolute h-full w-px bg-slate-800/30" style={{ left: `${i * 100 + 50}px` }} />
          ))}

          {/* Planets */}
          {planets.map((p) => (
            <div 
              key={p.name}
              className="absolute flex flex-col items-center group cursor-pointer transition-transform"
              style={{ left: `${p.offset}px` }}
              onMouseEnter={() => setHovered(p.name)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Name Display Effect */}
              <AnimatePresence>
                {hovered === p.name && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: -p.size/2 - 45 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute bg-white text-black p-2 rounded-lg shadow-xl z-20 pointer-events-none"
                  >
                     <p className="text-[10px] font-black uppercase text-indigo-600 leading-none">{t(p.name, p.sc, p.tc, chineseType)}</p>
                     <p className="text-[8px] text-slate-500 whitespace-nowrap mt-1 font-medium">{p.fact}</p>
                     <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45" />
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.span 
                 animate={{ 
                   opacity: hovered === p.name ? 1 : 0.4, 
                   scale: hovered === p.name ? 1.4 : 1,
                   color: hovered === p.name ? '#facc15' : '#94a3b8',
                   textShadow: hovered === p.name ? '0 0 10px rgba(234, 179, 8, 0.8)' : 'none'
                 }}
                 className={`absolute text-[10px] font-black uppercase tracking-widest pointer-events-none transition-colors`}
                 style={{ top: hovered === p.name ? -p.size/2 - 30 : -p.size/2 - 15 }}
              >
                {t(p.name, p.sc, p.tc, chineseType)}
              </motion.span>

              {/* Planet Body */}
              <motion.div 
                animate={{ 
                  boxShadow: hovered === p.name ? `0 0 30px ${p.color}88` : '0 0 10px rgba(255,255,255,0.05)',
                  scale: hovered === p.name ? 1.15 : 1
                }}
                className="rounded-full relative"
                style={{ 
                  width: `${p.size}px`, 
                  height: `${p.size}px`, 
                  backgroundColor: p.color,
                  backgroundImage: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 70%)`
                }}
              >
                 {p.name === 'Saturn' && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220%] h-[15%] border-[1.5px] border-white/30 rounded-full rotate-[-20deg]" />
                 )}
              </motion.div>
            </div>
          ))}

          {/* Asteroid Belt */}
          <div className="absolute left-[450px] h-full w-24 flex flex-wrap gap-2 items-center justify-center pointer-events-none opacity-30">
             {[...Array(40)].map((_, i) => (
               <motion.div 
                 key={i} 
                 animate={{ x: [0, 2, -2, 0], y: [0, -2, 2, 0] }}
                 transition={{ duration: 3 + Math.random() * 3, repeat: Infinity }}
                 className="w-0.5 h-0.5 bg-slate-500 rounded-full" 
               />
             ))}
             <span className="absolute top-4 text-[7px] font-black text-slate-600 uppercase tracking-widest">Asteroid Belt</span>
          </div>
        </div>
      </div>
      
      <div className="mt-4 flex justify-between items-center bg-slate-800/40 p-3 rounded-2xl border border-slate-800">
         <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
               <Eye size={14} className="text-indigo-400" />
            </div>
            <div className="text-[10px] text-slate-300 font-medium max-w-md leading-tight flex flex-col gap-1">
               <p>The Solar System is within the Milky Way Galaxy. Each planet is unique in composition and climate.</p>
               {isAssistMode && (
                 <p className="opacity-50 italic border-t border-slate-700 pt-1">
                   {t("", "太阳系位于银河系内。每个行星的成分和气候都是独特的。", "太陽系位於銀河系內。每個行星的成分和氣候都是獨特的。", chineseType)}
                 </p>
               )}
            </div>
         </div>
         <div className="flex gap-2">
            <button className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors border border-slate-600/50">
               <ChevronRight size={14} className="text-slate-400" />
            </button>
         </div>
      </div>
    </div>
  );
};

// 4. Asteroid vs Comet Comparison
export const AsteroidCometComparison: React.FC<VisualProps> = ({ isAssistMode, chineseType }) => {
  const [view, setView] = useState<'asteroid' | 'comet'>('asteroid');

  return (
    <div className="bg-zinc-50 border-2 border-zinc-200 rounded-2xl p-6 my-4 shadow-sm overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h4 className="font-black text-zinc-900 uppercase tracking-wider text-sm flex flex-wrap gap-x-2">
             <span>Small Celestial Bodies</span>
             {isAssistMode && <span className="opacity-50 tracking-normal">{t("", "小型天体", "小型天體", chineseType)}</span>}
           </h4>
           <div className="h-1 w-12 bg-indigo-500 rounded-full mt-1" />
        </div>
          <div className="bg-zinc-200/50 p-1.5 rounded-2xl flex gap-1 border border-zinc-200 flex-wrap">
          <button 
            onClick={() => setView('asteroid')}
            className={`flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex flex-col items-center leading-none ${
              view === 'asteroid' ? 'bg-white text-indigo-600 shadow-sm border border-zinc-200' : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <span>Asteroid</span>
            {isAssistMode && <span className="text-[8px] opacity-70 font-bold lowercase">{t("", "小行星", "小行星", chineseType)}</span>}
          </button>
          <button 
            onClick={() => setView('comet')}
            className={`flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex flex-col items-center leading-none ${
              view === 'comet' ? 'bg-white text-indigo-600 shadow-sm border border-zinc-200' : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <span>Comet</span>
            {isAssistMode && <span className="text-[8px] opacity-70 font-bold lowercase">{t("", "彗星", "彗星", chineseType)}</span>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="relative h-64 bg-slate-950 rounded-3xl overflow-hidden flex items-center justify-center border-4 border-zinc-300 shadow-2xl group">
          {/* Parallax Stars */}
          <div className="absolute inset-0 z-0">
             {[...Array(30)].map((_, i) => (
               <motion.div 
                key={i}
                animate={{ opacity: [0.1, 0.4, 0.1], scale: [1, 1.2, 1] }}
                transition={{ duration: 1 + Math.random() * 3, repeat: Infinity }}
                className="absolute bg-white rounded-full"
                style={{ 
                  top: `${Math.random()*100}%`, 
                  left: `${Math.random()*100}%`,
                  width: Math.random() < 0.2 ? '1.5px' : '0.5px',
                  height: Math.random() < 0.2 ? '1.5px' : '0.5px'
                }}
               />
             ))}
          </div>

          <AnimatePresence mode="wait">
            {view === 'asteroid' ? (
              <motion.div
                key="asteroid"
                initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.3, rotate: 45 }}
                className="relative z-10"
              >
                <motion.div 
                  animate={{ 
                    rotate: 360,
                    x: [0, 5, -5, 0],
                    y: [0, -5, 5, 0]
                  }}
                  transition={{ 
                    rotate: { duration: 30, repeat: Infinity, ease: "linear" },
                    x: { duration: 10, repeat: Infinity, ease: "easeInOut" },
                    y: { duration: 12, repeat: Infinity, ease: "easeInOut" }
                  }}
                  className="w-32 h-28 bg-[#52525b] rounded-[45%_55%_65%_35%/40%_50%_60%_70%] shadow-[inset_-10px_-10px_20px_rgba(0,0,0,0.5)] border-4 border-[#3f3f46] relative"
                >
                   {/* Craters */}
                   <div className="absolute top-6 left-8 w-6 h-6 bg-black/30 rounded-full shadow-inner" />
                   <div className="absolute top-16 left-16 w-4 h-4 bg-black/30 rounded-full shadow-inner" />
                   <div className="absolute bottom-6 left-10 w-3 h-3 bg-black/30 rounded-full shadow-inner" />
                   <div className="absolute top-4 right-6 w-5 h-5 bg-white/5 rounded-full" />
                </motion.div>
                
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                   <span className="text-[10px] font-black text-indigo-400 bg-indigo-950/80 px-3 py-1 rounded-full border border-indigo-500/30 backdrop-blur-sm uppercase">
                     {t('Solid Rock & Metal', '固体岩石与金属', '固體岩石與金屬', chineseType)}
                   </span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="comet"
                initial={{ opacity: 0, x: -150, y: -20 }}
                animate={{ opacity: 1, x: 20, y: 0 }}
                exit={{ opacity: 0, x: 150, y: 20 }}
                transition={{ duration: 1.2, ease: "circOut" }}
                className="relative flex items-center z-10"
              >
                <div className="relative flex items-center pr-10">
                  {/* Glowing Tail */}
                  <motion.div 
                    animate={{ 
                      width: [180, 200, 180],
                      opacity: [0.6, 0.8, 0.6],
                      skewX: [-2, 2, -2]
                    }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="absolute right-4 w-[200px] h-[50px] bg-gradient-to-l from-transparent via-cyan-400/20 to-white/60 blur-xl rounded-l-full -z-10" 
                  />
                  
                  {/* Particle streamers */}
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ 
                         x: [-20, -150],
                         y: [(i-4)*2, (i-4)*15],
                         opacity: [1, 0]
                      }}
                      transition={{ duration: 0.5 + Math.random(), repeat: Infinity, delay: i * 0.1 }}
                      className="absolute right-10 w-0.5 h-0.5 bg-cyan-200 rounded-full blur-[0.5px]"
                    />
                  ))}
                  
                  {/* Comet Nucleus (Dirty Snowball) */}
                  <motion.div 
                    animate={{ 
                       boxShadow: ["0 0 20px rgba(255,255,255,0.2)", "0 0 40px rgba(255,255,255,0.4)", "0 0 20px rgba(255,255,255,0.2)"]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-16 h-16 bg-white rounded-full flex items-center justify-center p-1 border-2 border-cyan-100 shadow-[inset_0_0_15px_rgba(34,211,238,0.5)]"
                  >
                     <div className="w-full h-full bg-zinc-200 rounded-full overflow-hidden relative">
                        <div className="absolute top-2 left-2 w-4 h-4 bg-zinc-400/30 rounded-full" />
                        <div className="absolute bottom-2 right-3 w-6 h-6 bg-zinc-400/30 rounded-full" />
                     </div>
                  </motion.div>
                </div>
                
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                   <span className="text-[10px] font-black text-cyan-400 bg-cyan-950/80 px-3 py-1 rounded-full border border-cyan-500/30 backdrop-blur-sm uppercase">
                     {t('Ice, Dust & Tail', '冰、尘埃与尾部', '冰、塵埃與尾部', chineseType)}
                   </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-200">
            <h5 className="font-black text-zinc-900 uppercase text-xs mb-3 flex items-center gap-2 flex-wrap">
              <div className={`w-2 h-2 rounded-full ${view === 'asteroid' ? 'bg-zinc-500' : 'bg-cyan-400'}`} />
              <div className="flex flex-wrap gap-x-1">
                <span>{view === 'asteroid' ? "The Space Rock" : "The Dirty Snowball"}</span>
                {isAssistMode && <span className="opacity-50">({view === 'asteroid' ? t("", "太空岩石", "太空岩石", chineseType) : t("", "脏雪球", "髒雪球", chineseType)})</span>}
              </div>
            </h5>
            <div className="text-xs text-zinc-600 leading-relaxed font-bold flex flex-col gap-2">
              <p>
                {view === 'asteroid' 
                  ? 'Asteroids are chunks of metal and rock that failed to form into planets. Many orbit in the belt between Mars and Jupiter.'
                  : 'Comets are made of ice and dust. When they approach the Sun, the ice vaporizes, creating a glowing coma and a spectacular tail.'}
              </p>
              {isAssistMode && (
                <p className="opacity-70 font-medium italic border-t border-zinc-100 pt-2">
                  {view === 'asteroid'
                    ? t('', '小行星是未能形成行星的金属和岩石块。许多在火星和木星之间的地带运行。', '小行星是未能形成行星的金屬和岩石塊。許多在火星和木星之間的地帶運行。', chineseType)
                    : t('', '彗星由冰和尘埃组成。当它们靠近太阳时，冰会蒸发，产生发光的彗发和壮观的尾巴。', '彗星由冰和塵埃組成。當它們靠近太陽時，冰會蒸發，產生發光的彗髮和壯觀的尾巴。', chineseType)}
                </p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-100 p-3 rounded-2xl flex flex-col items-center gap-1 border border-zinc-200">
                <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest leading-none flex flex-col items-center">
                  <span>Main Area</span>
                  {isAssistMode && <span className="opacity-50">{t("", "主要区域", "主要區域", chineseType)}</span>}
                </span>
                <span className="text-xs font-black text-zinc-600 uppercase tracking-tighter flex flex-col items-center">
                  <span>{view === 'asteroid' ? 'Asteroid Belt' : 'Kuiper / Oort'}</span>
                  {isAssistMode && (
                    <span className="text-[10px] opacity-60">
                      {view === 'asteroid' ? t("", "小行星带", "小行星帶", chineseType) : t("", "柯伊伯带 / 奥尔特云", "柯伊伯帶 / 奧爾特雲", chineseType)}
                    </span>
                  )}
                </span>
              </div>
              <div className="bg-zinc-100 p-3 rounded-2xl flex flex-col items-center gap-1 border border-zinc-200">
                <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest leading-none flex flex-col items-center">
                  <span>Brightness</span>
                  {isAssistMode && <span className="opacity-50">{t("", "亮度", "亮度", chineseType)}</span>}
                </span>
                <span className="text-xs font-black text-zinc-600 uppercase tracking-tighter flex flex-col items-center">
                   <span>{view === 'asteroid' ? 'Dim' : 'Vibrant'}</span>
                   {isAssistMode && <span className="text-[10px] opacity-60">{view === 'asteroid' ? t("", "昏暗", "昏暗", chineseType) : t("", "明亮", "明亮", chineseType)}</span>}
                </span>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 5. Light Mixing Simulator
export const LightMixingSimulator: React.FC<VisualProps> = ({ isAssistMode, chineseType }) => {
  const [red, setRed] = useState(255);
  const [green, setGreen] = useState(255);
  const [blue, setBlue] = useState(255);

  const rgb = `rgb(${red}, ${green}, ${blue})`;

  return (
    <div className="bg-slate-950 border-2 border-slate-800 rounded-3xl p-6 my-4 shadow-2xl text-white relative overflow-hidden">
      <div className="absolute bottom-[-50px] left-[-50px] w-64 h-64 bg-indigo-600/10 blur-[100px] pointer-events-none" />
      
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-10 gap-4">
        <div>
           <h4 className="font-black text-indigo-300 uppercase tracking-widest text-sm flex flex-wrap gap-x-2">
             <span>Primary Colors of Light</span>
             {isAssistMode && <span className="opacity-50 tracking-normal">{t("", "光的三原色", "光的三原色", chineseType)}</span>}
           </h4>
           <div className="flex gap-1 mt-1">
              <div className="w-3 h-1 bg-red-500 rounded-full" />
              <div className="w-3 h-1 bg-green-500 rounded-full" />
              <div className="w-3 h-1 bg-blue-500 rounded-full" />
           </div>
        </div>
        <div className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-tighter flex flex-wrap gap-x-1">
           <span>Additive Mixing</span>
           {isAssistMode && <span className="opacity-50">{t("", "加法混色", "加法混色", chineseType)}</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="relative h-64 flex items-center justify-center p-8 bg-black/40 rounded-3xl border border-slate-800/50 shadow-inner">
          <div className="relative w-48 h-48">
            {/* Red Circle */}
            <motion.div 
              className="absolute w-28 h-28 rounded-full mix-blend-screen blur-[1px] shadow-[0_0_20px_rgba(239,68,68,0.3)]"
              style={{ 
                backgroundColor: `rgb(${red}, 0, 0)`,
                top: '0', left: '50%',
                marginLeft: '-56px'
              }}
              animate={{ y: [0, -2, 2, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            {/* Green Circle */}
            <motion.div 
              className="absolute w-28 h-28 rounded-full mix-blend-screen blur-[1px] shadow-[0_0_20px_rgba(34,197,94,0.3)]"
              style={{ 
                backgroundColor: `rgb(0, ${green}, 0)`,
                bottom: '15px', left: '15px'
              }}
              animate={{ x: [0, 2, -2, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }}
            />
            {/* Blue Circle */}
            <motion.div 
              className="absolute w-28 h-28 rounded-full mix-blend-screen blur-[1px] shadow-[0_0_20px_rgba(59,130,246,0.3)]"
              style={{ 
                backgroundColor: `rgb(0, 0, ${blue})`,
                bottom: '15px', right: '15px'
              }}
              animate={{ x: [0, -2, 2, 0] }}
              transition={{ duration: 3.8, repeat: Infinity, delay: 1 }}
            />

            {/* Labels for mixed areas */}
            {red > 100 && green > 100 && blue < 50 && (
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60px] flex flex-col items-center justify-center leading-none">
                  <span className="text-[8px] font-black text-black uppercase">Yellow</span>
                  {isAssistMode && <span className="text-[8px] font-black text-black/60 italic">{t("", "黄", "黃", chineseType)}</span>}
               </div>
            )}
            {green > 100 && blue > 100 && red < 50 && (
               <div className="absolute bottom-[40px] left-1/2 -translate-x-[60px] flex flex-col items-center justify-center leading-none">
                  <span className="text-[8px] font-black text-black uppercase">Cyan</span>
                  {isAssistMode && <span className="text-[8px] font-black text-black/60 italic">{t("", "青", "青", chineseType)}</span>}
               </div>
            )}
            {red > 100 && blue > 100 && green < 50 && (
               <div className="absolute bottom-[40px] right-1/2 translate-x-[60px] flex flex-col items-center justify-center leading-none">
                  <span className="text-[8px] font-black text-black uppercase">Magenta</span>
                  {isAssistMode && <span className="text-[8px] font-black text-black/60 italic">{t("", "洋红", "洋紅", chineseType)}</span>}
               </div>
            )}
            {red === 255 && green === 255 && blue === 255 && (
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="flex flex-col items-center justify-center leading-none">
                    <span className="text-[10px] font-black uppercase text-black drop-shadow-sm">White</span>
                    {isAssistMode && <span className="text-[9px] font-black text-black/60 italic drop-shadow-sm">{t("", "白色", "白色", chineseType)}</span>}
                  </div>
               </div>
            )}
          </div>
        </div>

        <div className="flex flex-col justify-center gap-8">
          <div className="space-y-6">
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
              <div className="flex justify-between items-center mb-3 flex-wrap gap-x-2">
                <label className="text-[10px] font-black uppercase text-red-500 tracking-widest flex flex-wrap gap-x-1">
                  <span>Red Intensity</span>
                  {isAssistMode && <span className="opacity-50">{t("", "红色强度", "紅色強度", chineseType)}</span>}
                </label>
                <span className="text-xs font-mono font-black text-red-400">{red}</span>
              </div>
              <input 
                type="range" min="0" max="255" value={red} 
                onChange={(e) => setRed(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
            </div>
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
              <div className="flex justify-between items-center mb-3 flex-wrap gap-x-2">
                <label className="text-[10px] font-black uppercase text-green-500 tracking-widest flex flex-wrap gap-x-1">
                  <span>Green Intensity</span>
                  {isAssistMode && <span className="opacity-50">{t("", "绿色强度", "綠色強度", chineseType)}</span>}
                </label>
                <span className="text-xs font-mono font-black text-green-400">{green}</span>
              </div>
              <input 
                type="range" min="0" max="255" value={green} 
                onChange={(e) => setGreen(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-green-500"
              />
            </div>
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
              <div className="flex justify-between items-center mb-3 flex-wrap gap-x-2">
                <label className="text-[10px] font-black uppercase text-blue-500 tracking-widest flex flex-wrap gap-x-1">
                  <span>Blue Intensity</span>
                  {isAssistMode && <span className="opacity-50">{t("", "蓝色强度", "藍色強度", chineseType)}</span>}
                </label>
                <span className="text-xs font-mono font-black text-blue-400">{blue}</span>
              </div>
              <input 
                type="range" min="0" max="255" value={blue} 
                onChange={(e) => setBlue(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>

          <div className="p-4 rounded-[2rem] border-2 border-slate-800 bg-slate-900 shadow-xl group hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-4">
              <motion.div 
                animate={{ boxShadow: `0 0 30px ${rgb}44` }}
                className="w-14 h-14 rounded-2xl border-4 border-slate-800 shrink-0"
                style={{ backgroundColor: rgb }}
              />
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1">{t('Mixed Light Result', '混合光结果', '混合光結果', chineseType)}</span>
                <span className="text-lg font-black uppercase tracking-tight text-white leading-none">
                   {red === 0 && green === 0 && blue === 0 ? 'Black (OFF)' : 
                    red === 255 && green === 255 && blue === 255 ? 'Pure White' :
                    rgb}
                </span>
                <div className="flex gap-1 mt-2">
                   {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-4 h-1 rounded-full bg-slate-800 overflow-hidden">
                         <motion.div 
                           animate={{ x: i * 10 }}
                           className="w-full h-full bg-indigo-500/30" 
                         />
                      </div>
                   ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-[10px] text-indigo-300 italic font-medium">
         {t('This is Additive Mixing used in screens. Subtractive mixing (paints) is different — mixing all colors in paint makes black!', '这是在屏幕中使用的加法混色。减法混色（颜料）是不同的——在颜料中混合所有颜色会变成黑色！', '這是在屏幕中使用的加法混色。減法混色（顏料）是不同的——在顏料中混合所有顏色會變成黑色！', chineseType)}
      </div>
    </div>
  );
};
