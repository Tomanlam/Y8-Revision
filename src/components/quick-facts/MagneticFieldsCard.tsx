import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Magnet, Info, MousePointer2, Activity, Zap } from 'lucide-react';

interface MagneticFieldsCardProps {
  chineseType?: 'traditional' | 'simplified' | null;
}

const getBField = (x: number, y: number, type: 'bar' | 'horseshoe') => {
  const poles = type === 'bar' 
    ? [ {x: 120, y: 250, type: 'N'}, {x: 380, y: 250, type: 'S'} ]
    : [ {x: 170, y: 330, type: 'N'}, {x: 330, y: 330, type: 'S'} ];

  let bx = 0, by = 0;
  for (const p of poles) {
    const dx = x - p.x;
    const dy = y - p.y;
    const distSq = dx*dx + dy*dy + 400; // Damping parameter
    const dist = Math.sqrt(distSq);
    const str = (p.type === 'N' ? 1 : -1) / distSq;
    bx += str * (dx / dist);
    by += str * (dy / dist);
  }
  return { bx, by };
};

const generatePaths = (type: 'bar' | 'horseshoe', strengthPercent: number) => {
  const poles = type === 'bar' 
    ? [ {x: 120, y: 250, type: 'N'}, {x: 380, y: 250, type: 'S'} ]
    : [ {x: 170, y: 330, type: 'N'}, {x: 330, y: 330, type: 'S'} ];
    
  const paths: {d: string, steps: number}[] = [];
  
  const baseLines = type === 'bar' ? 24 : 36;
  const numLines = Math.max(4, Math.floor(baseLines * (strengthPercent / 100)));
  
  if (numLines === 0) return paths;

  const nPoles = poles.filter(p => p.type === 'N');
  const sPoles = poles.filter(p => p.type === 'S');
  
  for (const sp of nPoles) {
    for (let i=0; i<numLines; i++) {
      const angle = (i / numLines) * 2 * Math.PI;
      let x = sp.x + 10 * Math.cos(angle);
      let y = sp.y + 10 * Math.sin(angle);
      const startX = x, startY = y;
      
      let points = [];
      let steps = 0;
      let hitS = false;
      
      for (let step=0; step<250; step++) {
        let {bx, by} = getBField(x, y, type);
        const mag = Math.sqrt(bx*bx + by*by);
        if (mag < 1e-6) break;
        
        const stepSize = 4;
        x += (bx / mag) * stepSize;
        y += (by / mag) * stepSize;
        points.push({tx: x, ty: y});
        steps++;
        
        const sPole = sPoles[0];
        if (sPole) {
          const dSq = (x - sPole.x)**2 + (y - sPole.y)**2;
          if (dSq < 200) { hitS = true; break; }
        }
        
        if (x < -150 || x > 650 || y < -150 || y > 650) break;
      }
      
      if (points.length > 5) {
        let d = `M ${startX.toFixed(2)} ${startY.toFixed(2)}`;
        points.forEach(p => { d += ` L ${p.tx.toFixed(2)} ${p.ty.toFixed(2)}`; });
        paths.push({ d, steps });
      }
    }
  }

  for (const sp of sPoles) {
    for (let i=0; i<numLines; i++) {
      const angle = (i / numLines) * 2 * Math.PI;
      let x = sp.x + 10 * Math.cos(angle);
      let y = sp.y + 10 * Math.sin(angle);
      
      let points = [];
      let steps = 0;
      let hitN = false;
      
      for (let step=0; step<250; step++) {
        let {bx, by} = getBField(x, y, type);
        const mag = Math.sqrt(bx*bx + by*by);
        if (mag < 1e-6) break;
        
        const stepSize = 4;
        x -= (bx / mag) * stepSize; // Backward
        y -= (by / mag) * stepSize;
        points.push({tx: x, ty: y});
        steps++;
        
        const nPole = nPoles[0];
        if (nPole) {
          const dSq = (x - nPole.x)**2 + (y - nPole.y)**2;
          if (dSq < 200) { hitN = true; break; }
        }
        
        if (x < -150 || x > 650 || y < -150 || y > 650) break;
      }
      
      if (!hitN && points.length > 5) {
        points.reverse();
        let startX = points[0].tx, startY = points[0].ty;
        let d = `M ${startX.toFixed(2)} ${startY.toFixed(2)}`;
        for(let j=1; j<points.length; j++) {
           d += ` L ${points[j].tx.toFixed(2)} ${points[j].ty.toFixed(2)}`;
        }
        d += ` L ${(sp.x + 10 * Math.cos(angle)).toFixed(2)} ${(sp.y + 10 * Math.sin(angle)).toFixed(2)}`;
        paths.push({ d, steps: steps + 1 });
      }
    }
  }

  return paths;
};

const MagneticFieldsCard: React.FC<MagneticFieldsCardProps> = ({ chineseType }) => {
  const [activeTab, setActiveTab] = useState<'bar' | 'horseshoe'>('bar');
  const [simMode, setSimMode] = useState<'compass' | 'filings' | 'strength'>('compass');
  const [isElectroOn, setIsElectroOn] = useState(true);
  const [strength, setStrength] = useState(100);

  const svgRef = useRef<SVGSVGElement>(null);
  const [compassPos, setCompassPos] = useState({ x: 250, y: 150 });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setCompassPos({ x: 250, y: 100 });
  }, [activeTab]);

  const t = (en: string, sc: string, tc: string) => {
    if (chineseType === 'simplified') return sc;
    if (chineseType === 'traditional') return tc;
    return en;
  };

  const initialFilingsData = useMemo(() => {
    return Array.from({length: 1500}).map(() => ({
      x: Math.random() * 500,
      y: Math.random() * 500,
      randAngle: Math.random() * Math.PI * 2,
      seedSize: 1 + Math.random() * 2
    }));
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (simMode !== 'compass') return;
    setIsDragging(true);
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (500 / rect.width);
    const y = (e.clientY - rect.top) * (500 / rect.height);
    setCompassPos({ x, y });
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || simMode !== 'compass' || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (500 / rect.width);
    const y = (e.clientY - rect.top) * (500 / rect.height);
    setCompassPos({ x, y });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (simMode !== 'compass') return;
    setIsDragging(false);
    (e.target as Element).releasePointerCapture(e.pointerId);
  };

  const activeStrength = simMode === 'strength' ? strength : (simMode === 'compass' || isElectroOn ? 100 : 0);
  const paths = useMemo(() => generatePaths(activeTab, activeStrength), [activeTab, activeStrength]);
  
  const { bx, by } = useMemo(() => getBField(compassPos.x, compassPos.y, activeTab), [compassPos.x, compassPos.y, activeTab]);
  const compassAngle = useMemo(() => Math.atan2(by, bx) * 180 / Math.PI, [bx, by]);

  const filingsList = useMemo(() => {
    return initialFilingsData.map((pt, i) => {
      if (!isElectroOn) {
        return <line key={i} x1={pt.x} y1={pt.y} x2={pt.x + pt.seedSize * 2 * Math.cos(pt.randAngle)} y2={pt.y + pt.seedSize * 2 * Math.sin(pt.randAngle)} stroke="rgba(255,255,255,0.4)" strokeWidth={1} />
      }
      
      let {bx, by} = getBField(pt.x, pt.y, activeTab);
      const m = Math.sqrt(bx*bx + by*by);
      const alignPow = Math.min(1, m * 25000); 
      const angle = Math.atan2(by, bx);
      
      const finalAngle = alignPow > 0.05 ? angle : pt.randAngle;
      const opacity = 0.15 + 0.85 * alignPow;
      const len = alignPow > 0.05 ? pt.seedSize * 5 : pt.seedSize * 2;
      
      return <line key={i} x1={pt.x} y1={pt.y} x2={pt.x + len * Math.cos(finalAngle)} y2={pt.y + len * Math.sin(finalAngle)} stroke={`rgba(230,240,250,${opacity})`} strokeWidth={1.5} />
    });
  }, [initialFilingsData, isElectroOn, activeTab]);

  return (
    <div className="bg-white rounded-[2rem] border-2 border-gray-100 shadow-xl overflow-hidden w-full">
      <div className="bg-gradient-to-r from-emerald-50 via-white to-sky-50 p-6 border-b-2 border-gray-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-3">
            <Magnet className="text-emerald-500" />
            {t('Magnetic Fields', '磁场特性', '磁場特性')}
          </h3>
          <p className="text-gray-500 font-bold text-sm mt-1">
            {t('Trace the invisible lines of magnetic force.', '追踪看不见的磁力线。', '追蹤看不見的磁力線。')}
          </p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200 shadow-sm shrink-0 overflow-x-auto w-full xl:w-auto">
          <button 
            onClick={() => setActiveTab('bar')}
            className={`px-4 py-2 flex-1 xl:flex-none whitespace-nowrap rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'bar' ? 'bg-white shadow-md text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {t('Bar Magnet', '条形磁铁', '條形磁鐵')}
          </button>
          <button 
            onClick={() => setActiveTab('horseshoe')}
            className={`px-4 py-2 flex-1 xl:flex-none whitespace-nowrap rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'horseshoe' ? 'bg-white shadow-md text-sky-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {t('Horseshoe Magnet', '马蹄形磁铁', '馬蹄形磁鐵')}
          </button>
        </div>
      </div>

      <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* SVG Canvas */}
        <div className="relative rounded-[3rem] border-8 border-slate-800 aspect-square flex items-center justify-center overflow-hidden bg-slate-900 group">
          <svg
            ref={svgRef}
            viewBox="0 0 500 500"
            className={`w-full h-full touch-none select-none ${simMode === 'compass' ? 'cursor-crosshair' : 'cursor-default'}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <defs>
              <filter id="glowMag" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <linearGradient id="horseshoeGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="49%" stopColor="#ef4444" />
                <stop offset="51%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
              <style>
                {`
                  @keyframes flowLines {
                    from { stroke-dashoffset: 14; }
                    to { stroke-dashoffset: 0; }
                  }
                  .mag-line {
                    fill: none;
                    stroke: #4ade80;
                    stroke-width: 2.5;
                    stroke-opacity: 0.9;
                    stroke-dasharray: 6 8;
                    animation: flowLines 1.2s linear infinite;
                  }
                `}
              </style>
              <pattern id="coil" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <path d="M 0 0 L 0 10" stroke="#000" strokeWidth="2" strokeOpacity="0.2"/>
              </pattern>
            </defs>

            {/* Background grid */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" strokeWidth="1" strokeOpacity="0.3"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Filings layer */}
            {simMode === 'filings' && (
              <g>
                {filingsList}
              </g>
            )}

            {/* Field Lines layer */}
            {simMode !== 'filings' && paths.length > 0 && (
              <g filter="url(#glowMag)">
                {paths.map((pObj, i) => (
                  <g key={i}>
                    <path d={pObj.d} className="mag-line" />
                    {pObj.steps > 10 && (
                      <polygon points="-6,-4 6,0 -6,4" fill="#4ade80">
                        <animateMotion
                          dur={`${Math.max(1, pObj.steps * 0.04)}s`}
                          repeatCount="indefinite"
                          rotate="auto"
                          path={pObj.d}
                          begin={`-${(i % 10) * 0.4}s`}
                        />
                      </polygon>
                    )}
                  </g>
                ))}
              </g>
            )}

            {/* Magnets */}
            {activeTab === 'bar' && (
              <g>
                <rect x="96" y="206" width="308" height="88" fill="#0f172a" rx="4" />
                <rect x="100" y="210" width="150" height="80" fill="#ef4444" />
                <rect x="250" y="210" width="150" height="80" fill="#3b82f6" />
                {simMode !== 'compass' && <rect x="100" y="210" width="300" height="80" fill="url(#coil)" />}
                <text x="175" y="250" fill="white" fontSize="32" fontWeight="900" textAnchor="middle" dominantBaseline="middle">N</text>
                <text x="325" y="250" fill="white" fontSize="32" fontWeight="900" textAnchor="middle" dominantBaseline="middle">S</text>
              </g>
            )}

            {activeTab === 'horseshoe' && (
              <g>
                <path d="M 126 354 L 126 200 A 124 124 0 0 1 374 200 L 374 354 L 286 354 L 286 200 A 36 36 0 0 0 214 200 L 214 354 Z" fill="#0f172a" />
                <path d="M 130 350 L 130 200 A 120 120 0 0 1 370 200 L 370 350 L 290 350 L 290 200 A 40 40 0 0 0 210 200 L 210 350 Z" fill="url(#horseshoeGrad)" />
                {simMode !== 'compass' && (
                  <path d="M 130 350 L 130 200 A 120 120 0 0 1 370 200 L 370 350 L 290 350 L 290 200 A 40 40 0 0 0 210 200 L 210 350 Z" fill="url(#coil)" />
                )}
                <text x="170" y="325" fill="white" fontSize="28" fontWeight="900" textAnchor="middle" dominantBaseline="middle">N</text>
                <text x="330" y="325" fill="white" fontSize="28" fontWeight="900" textAnchor="middle" dominantBaseline="middle">S</text>
              </g>
            )}

            {/* Compass */}
            {simMode === 'compass' && (
              <g transform={`translate(${compassPos.x}, ${compassPos.y})`} style={{ pointerEvents: 'none' }}>
                <circle r="30" fill="#f8fafc" stroke="#94a3b8" strokeWidth="3" filter="drop-shadow(0 10px 15px rgba(0,0,0,0.5))" />
                <circle r="26" fill="rgba(255,255,255,0.2)" />
                <circle r="22" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
                
                <g style={{ transform: `rotate(${compassAngle}deg)`, transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                  <path d="M 0 -6 L 18 0 L 0 6 Z" fill="#ef4444" />
                  <path d="M 0 -6 L -18 0 L 0 6 Z" fill="#94a3b8" />
                  <circle r="3" fill="#334155" />
                </g>
              </g>
            )}

            {/* Prompt Overlay */}
            {simMode === 'compass' && (
              <g transform="translate(250, 460)">
                <rect x="-100" y="-15" width="200" height="30" fill="#1e293b" opacity="0.8" rx="15" />
                <text x="0" y="0" fill="#94a3b8" fontSize="12" fontWeight="bold" dominantBaseline="middle" textAnchor="middle" letterSpacing="1">
                  {isDragging ? t('TRACING...', '追踪中...', '追蹤中...') : t('DRAG TO TRACE FIELD', '拖动指南针以追踪磁场', '拖動指南針以追蹤磁場')}
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Controls Info */}
        <div className="flex flex-col justify-start space-y-6">
          <div className="flex gap-2 p-1.5 bg-slate-50 rounded-[1.5rem] mb-2 shadow-inner border border-slate-200 hide-scrollbar overflow-x-auto">
            <button onClick={()=>setSimMode('compass')} className={`flex-1 min-w-[100px] py-3 px-2 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-[1.2rem] transition-all ${simMode === 'compass' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400 hover:text-slate-700'}`}>
              {t('Compass', '指南针', '指南針')}
            </button>
            <button onClick={()=>setSimMode('filings')} className={`flex-1 min-w-[100px] py-3 px-2 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-[1.2rem] transition-all ${simMode === 'filings' ? 'bg-white shadow-sm text-sky-600' : 'text-slate-400 hover:text-slate-700'}`}>
              {t('Filings', '铁粉', '鐵粉')}
            </button>
            <button onClick={()=>setSimMode('strength')} className={`flex-1 min-w-[100px] py-3 px-2 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-[1.2rem] transition-all ${simMode === 'strength' ? 'bg-white shadow-sm text-purple-600' : 'text-slate-400 hover:text-slate-700'}`}>
              {t('Strength', '强度', '強度')}
            </button>
          </div>

          <div className="bg-gray-50 p-8 rounded-[2.5rem] border-2 border-gray-100 shadow-inner space-y-6 min-h-[300px]">
            {simMode === 'compass' && (
              <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}}>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl shadow-sm">
                    <MousePointer2 size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">{t('Compass Tracer', '指南针追踪', '指南針追蹤')}</h4>
                    <p className="text-xs font-bold text-slate-500">{t('Interactive Field Mapping', '交互式磁场映射', '交互式磁場映射')}</p>
                  </div>
                </div>
                
                <div className="text-sm font-bold text-slate-600 leading-loose mt-6">
                  {t(
                    'A compass needle is a tiny magnet. Its North pole (red) follows the magnetic field lines, pointing away from the magnet\'s North pole and towards its South pole.',
                    '指南针的指针是一个微型磁铁。它的北极（红色）总是顺着磁力线的方向，从源磁铁的北极指向南极。',
                    '指南針的指針是一個微型磁鐵。它的北極（紅色）總是順著磁力線的方向，從源磁鐵的北極指向南極。'
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center transition-all hover:bg-slate-50">
                    <div className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">{t('Source', '源头', '源頭')}</div>
                    <div className="text-lg font-black text-slate-800">N Pole</div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center transition-all hover:bg-slate-50">
                    <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">{t('Destination', '终点', '終點')}</div>
                    <div className="text-lg font-black text-slate-800">S Pole</div>
                  </div>
                </div>
              </motion.div>
            )}

            {simMode === 'filings' && (
              <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}}>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-sky-100 text-sky-600 rounded-2xl shadow-sm">
                    <Activity size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">{t('Iron Filings', '铁粉显影', '鐵粉顯影')}</h4>
                    <p className="text-xs font-bold text-slate-500">{t('Particle Alignment', '微粒排列', '微粒排列')}</p>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between bg-white p-5 rounded-[1.5rem] shadow-sm border border-sky-100">
                  <span className="text-sm font-black text-slate-700 uppercase tracking-widest">{t('Electromagnet', '电磁铁', '電磁鐵')}</span>
                  <button 
                    onClick={() => setIsElectroOn(o => !o)}
                    className={`relative w-16 h-8 rounded-full transition-colors duration-300 shadow-inner ${isElectroOn ? 'bg-sky-500' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform duration-300 shadow-sm ${isElectroOn ? 'left-9' : 'left-1'}`} />
                  </button>
                </div>
                
                <div className="text-sm font-bold text-slate-600 leading-loose mt-6">
                  {t(
                    'Iron filings are tiny pieces of magnetic material. When the electromagnet is ON, each filing becomes a temporary magnet and aligns with the field, revealing the invisible shape of the magnetic field over the entire area!',
                    '铁粉是微小的磁性物质。当电磁铁开启时，每个铁粉都会暂时磁化并与磁场对齐，从而在整个区域内揭示出看不见的磁场形状！',
                    '鐵粉是微小的磁性物質。當電磁鐵開啟時，每個鐵粉都會暫時磁化並與磁場對齊，從而在整個區域內揭示出看不見的磁場形狀！'
                  )}
                </div>
              </motion.div>
            )}

            {simMode === 'strength' && (
              <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}}>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl shadow-sm">
                    <Zap size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">{t('Field Strength', '磁场强度', '磁場強度')}</h4>
                    <p className="text-xs font-bold text-slate-500">{t('Current Controls Power', '电流控制强度', '電流控制強度')}</p>
                  </div>
                </div>

                <div className="mt-8 bg-white p-6 rounded-[1.5rem] shadow-sm border border-purple-100">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{t('Current', '电流', '電流')}</span>
                    <span className="text-lg font-black text-purple-600">{strength}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="100" 
                    value={strength} 
                    onChange={(e) => setStrength(parseInt(e.target.value))}
                    className="w-full h-3 bg-purple-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="flex justify-between mt-2 text-[10px] font-black text-slate-400 uppercase">
                    <span>{t('Low', '低', '低')}</span>
                    <span>{t('High', '高', '高')}</span>
                  </div>
                </div>
                
                <div className="text-sm font-bold text-slate-600 leading-loose mt-6">
                  {t(
                    'Increasing the electrical current inside the electromagnet makes the surrounding magnetic field stronger. A visibly stronger magnetic field is represented by field lines that are drawn denser and closer together.',
                    '增加电磁铁内的电流会使周围的磁场更强。更强的磁场由绘制得更加密集、更加靠近的磁力线表示。',
                    '增加電磁鐵內的電流會使周圍的磁場更強。更強的磁場由繪製得更加密集、更加靠近的磁力線表示。'
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Metadata for sorting if dynamically loaded
(MagneticFieldsCard as any).UNIT = 3;
(MagneticFieldsCard as any).SUBJECT = 'PHYSICS';

export default MagneticFieldsCard;

