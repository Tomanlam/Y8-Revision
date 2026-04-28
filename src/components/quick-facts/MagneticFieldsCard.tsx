import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Magnet, Info, MousePointer2 } from 'lucide-react';

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
    const distSq = dx*dx + dy*dy + 200; // Damping factor to prevent singularities
    const dist = Math.sqrt(distSq);
    const str = (p.type === 'N' ? 1 : -1) / distSq;
    bx += str * (dx / dist);
    by += str * (dy / dist);
  }
  return { bx, by };
};

const generatePaths = (type: 'bar' | 'horseshoe') => {
  const poles = type === 'bar' 
    ? [ {x: 120, y: 250, type: 'N'}, {x: 380, y: 250, type: 'S'} ]
    : [ {x: 170, y: 330, type: 'N'}, {x: 330, y: 330, type: 'S'} ];
    
  const paths = [];
  const startPoles = poles.filter(p => p.type === 'N');
  const numLines = type === 'bar' ? 24 : 36;
  
  for (const sp of startPoles) {
    for (let i=0; i<numLines; i++) {
      const angle = (i / numLines) * 2 * Math.PI;
      let x = sp.x + 10 * Math.cos(angle);
      let y = sp.y + 10 * Math.sin(angle);
      
      let points = [`M ${x.toFixed(2)} ${y.toFixed(2)}`];
      
      let steps = 0;
      for (let step=0; step<250; step++) {
        let {bx, by} = getBField(x, y, type);
        const mag = Math.sqrt(bx*bx + by*by);
        if (mag < 1e-6) break;
        
        const stepSize = 4;
        x += (bx / mag) * stepSize;
        y += (by / mag) * stepSize;
        points.push(`L ${x.toFixed(2)} ${y.toFixed(2)}`);
        steps++;
        
        const sPole = poles.find(p => p.type === 'S');
        if (sPole) {
          const dSq = (x - sPole.x)**2 + (y - sPole.y)**2;
          if (dSq < 200) break;
        }
        
        if (x < -100 || x > 600 || y < -100 || y > 600) break;
      }
      paths.push({ d: points.join(' '), steps });
    }
  }
  return paths;
};

const MagneticFieldsCard: React.FC<MagneticFieldsCardProps> = ({ chineseType }) => {
  const [activeTab, setActiveTab] = useState<'bar' | 'horseshoe'>('bar');
  const svgRef = useRef<SVGSVGElement>(null);
  const [compassPos, setCompassPos] = useState({ x: 250, y: 150 });
  const [isDragging, setIsDragging] = useState(false);

  // Automatically reset compass position when tab changes to avoid weirdness
  useEffect(() => {
    setCompassPos({ x: 250, y: 100 });
  }, [activeTab]);

  const t = (en: string, sc: string, tc: string) => {
    if (chineseType === 'simplified') return sc;
    if (chineseType === 'traditional') return tc;
    return en;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = 500 / rect.width;
    const scaleY = 500 / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    setCompassPos({ x, y });
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = 500 / rect.width;
    const scaleY = 500 / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    setCompassPos({ x, y });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as Element).releasePointerCapture(e.pointerId);
  };

  const paths = useMemo(() => generatePaths(activeTab), [activeTab]);
  const { bx, by } = useMemo(() => getBField(compassPos.x, compassPos.y, activeTab), [compassPos.x, compassPos.y, activeTab]);
  const compassAngle = useMemo(() => Math.atan2(by, bx) * 180 / Math.PI, [bx, by]);

  return (
    <div className="bg-white rounded-[2rem] border-2 border-gray-100 shadow-xl overflow-hidden w-full">
      <div className="bg-gradient-to-r from-emerald-50 via-white to-sky-50 p-6 border-b-2 border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-3">
            <Magnet className="text-emerald-500" />
            {t('Magnetic Fields', '磁场特性', '磁場特性')}
          </h3>
          <p className="text-gray-500 font-bold text-sm mt-1">
            {t('Trace the invisible lines of magnetic force.', '追踪看不见的磁力线。', '追蹤看不見的磁力線。')}
          </p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200 shadow-sm">
          <button 
            onClick={() => setActiveTab('bar')}
            className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'bar' ? 'bg-white shadow-md text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {t('Bar Magnet', '条形磁铁', '條形磁鐵')}
          </button>
          <button 
            onClick={() => setActiveTab('horseshoe')}
            className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'horseshoe' ? 'bg-white shadow-md text-sky-600' : 'text-gray-400 hover:text-gray-600'}`}
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
            className="w-full h-full cursor-crosshair touch-none select-none"
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
            </defs>

            {/* Background grid */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" stroke-width="1" stroke-opacity="0.3"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Field Lines */}
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

            {/* Magnets */}
            {activeTab === 'bar' && (
              <g>
                <rect x="96" y="206" width="308" height="88" fill="#0f172a" rx="4" />
                <rect x="100" y="210" width="150" height="80" fill="#ef4444" />
                <rect x="250" y="210" width="150" height="80" fill="#3b82f6" />
                <text x="175" y="250" fill="white" fontSize="32" fontWeight="900" textAnchor="middle" dominantBaseline="middle">N</text>
                <text x="325" y="250" fill="white" fontSize="32" fontWeight="900" textAnchor="middle" dominantBaseline="middle">S</text>
              </g>
            )}

            {activeTab === 'horseshoe' && (
              <g>
                <path d="M 126 354 L 126 200 A 124 124 0 0 1 374 200 L 374 354 L 286 354 L 286 200 A 36 36 0 0 0 214 200 L 214 354 Z" fill="#0f172a" />
                <path d="M 130 350 L 130 200 A 120 120 0 0 1 370 200 L 370 350 L 290 350 L 290 200 A 40 40 0 0 0 210 200 L 210 350 Z" fill="url(#horseshoeGrad)" />
                <text x="170" y="325" fill="white" fontSize="28" fontWeight="900" textAnchor="middle" dominantBaseline="middle">N</text>
                <text x="330" y="325" fill="white" fontSize="28" fontWeight="900" textAnchor="middle" dominantBaseline="middle">S</text>
              </g>
            )}

            {/* Compass */}
            <g transform={`translate(${compassPos.x}, ${compassPos.y})`} style={{ pointerEvents: 'none' }}>
              <circle r="30" fill="#f8fafc" stroke="#94a3b8" stroke-width="3" filter="drop-shadow(0 10px 15px rgba(0,0,0,0.5))" />
              <circle r="26" fill="rgba(255,255,255,0.2)" />
              <circle r="22" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" />
              
              <g style={{ transform: `rotate(${compassAngle}deg)`, transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                <path d="M 0 -6 L 18 0 L 0 6 Z" fill="#ef4444" />
                <path d="M 0 -6 L -18 0 L 0 6 Z" fill="#94a3b8" />
                <circle r="3" fill="#334155" />
              </g>
            </g>

            {/* Prompt Overlay */}
            <g transform="translate(250, 460)">
              <rect x="-100" y="-15" width="200" height="30" fill="#1e293b" opacity="0.8" rx="15" />
              <text x="0" y="0" fill="#94a3b8" fontSize="12" fontWeight="bold" dominantBaseline="middle" textAnchor="middle" letterSpacing="1">
                {isDragging ? t('TRACING...', '追踪中...', '追蹤中...') : t('DRAG TO TRACE FIELD', '拖动指南针以追踪磁场', '拖動指南針以追蹤磁場')}
              </text>
            </g>

          </svg>
        </div>

        {/* Controls Info */}
        <div className="flex flex-col justify-center space-y-6">
          <div className="bg-gray-50 p-8 rounded-[2.5rem] border-2 border-gray-100 shadow-inner space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl shadow-sm">
                <MousePointer2 size={24} />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">{t('Compass Tracer', '指南针追踪', '指南針追蹤')}</h4>
                <p className="text-xs font-bold text-slate-500">{t('Interactive Field Mapping', '交互式磁场映射', '交互式磁場映射')}</p>
              </div>
            </div>
            
            <div className="text-sm font-bold text-slate-600 leading-relaxed">
              {t(
                'A compass needle is a tiny magnet. Its North pole (red) follows the magnetic field lines, pointing away from the magnet\'s North pole and towards its South pole.',
                '指南针的指针是一个微型磁铁。它的北极（红色）总是顺着磁力线的方向，从源磁铁的北极指向南极。',
                '指南針的指針是一個微型磁鐵。它的北極（紅色）總是順著磁力線的方向，從源磁鐵的北極指向南極。'
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center transition-all hover:bg-slate-50">
                <div className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">{t('Source', '源头', '源頭')}</div>
                <div className="text-lg font-black text-slate-800">N Pole</div>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center transition-all hover:bg-slate-50">
                <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">{t('Destination', '终点', '終點')}</div>
                <div className="text-lg font-black text-slate-800">S Pole</div>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 p-6 rounded-[2rem] border-2 border-emerald-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Magnet size={64} />
            </div>
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="bg-emerald-200 p-2.5 rounded-xl text-emerald-700 shadow-inner">
                <Info size={18} />
              </div>
              <span className="text-xs font-black text-emerald-800 uppercase tracking-widest">{t('Field Properties', '磁场特性', '磁場特性')}</span>
            </div>
            <ul className="text-xs font-semibold text-emerald-700 leading-relaxed space-y-3 relative z-10">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0 shadow-sm" />
                {t('Lines never intersect or cross each other.', '磁力线永远不会相交或交叉。', '磁力線永遠不會相交或交叉。')}
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0 shadow-sm" />
                {t('The closer the lines, the stronger the magnetic field.', '磁力线越密，磁场越强。', '磁力線越密，磁場越強。')}
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0 shadow-sm" />
                {t('They form continuous, closed loops.', '它们形成连续的闭合回路。', '它們形成連續的閉合迴路。')}
              </li>
            </ul>
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
