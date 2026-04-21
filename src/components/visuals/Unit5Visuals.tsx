import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Atom, 
  Thermometer, 
  Wind, 
  Waves, 
  Gem, 
  Mountain,
  Zap,
  Layers,
  Info,
  ChevronRight,
  TrendingDown,
  TrendingUp
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

// 1. Atomic Structure Explorer (Concept 2)
export const AtomicStructureExplorer: React.FC<VisualProps> = ({ isAssistMode, chineseType }) => {
  const [protons, setProtons] = useState(2);
  const [neutrons, setNeutrons] = useState(2);
  const [electrons, setElectrons] = useState(2);

  const elements = [
    { name: 'Hydrogen', symbol: 'H', p: 1 },
    { name: 'Helium', symbol: 'He', p: 2 },
    { name: 'Lithium', symbol: 'Li', p: 3 },
    { name: 'Beryllium', symbol: 'Be', p: 4 },
    { name: 'Boron', symbol: 'B', p: 5 },
    { name: 'Carbon', symbol: 'C', p: 6 },
  ];

  const currentElement = elements.find(e => e.p === protons) || { name: 'Unknown', symbol: '?', p: protons };

  return (
    <div className="bg-red-50 border-2 border-red-100 rounded-2xl p-6 my-4 shadow-sm">
      <h4 className="font-black text-red-800 uppercase tracking-wider text-sm mb-4 flex items-center gap-2 flex-wrap">
        <Atom size={18} className="text-red-600 animate-spin-slow" />
        <div className="flex flex-wrap gap-x-2">
          <span>Atomic Structure Explorer</span>
          {isAssistMode && <span className="opacity-50 tracking-normal">{t("", "原子结构探险", "原子結構探險", chineseType)}</span>}
        </div>
      </h4>
Equivalent to:
      <h4 className="font-black text-red-800 uppercase tracking-wider text-sm mb-4 flex items-center gap-2 flex-wrap">
        <Atom size={18} className="text-red-600 animate-spin-slow" />
        <div className="flex flex-wrap gap-x-2">
          <span>Atomic Structure Explorer</span>
          {isAssistMode && <span className="opacity-50 tracking-normal">{t("", "原子结构探险", "原子結構探險", chineseType)}</span>}
        </div>
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="relative h-64 bg-slate-900 rounded-2xl border-4 border-slate-800 flex items-center justify-center overflow-hidden">
          {/* Electron Shells */}
          <div className="absolute w-48 h-48 border border-slate-700 rounded-full" />
          <div className="absolute w-32 h-32 border border-slate-700 rounded-full" />
          
          {/* Nucleus */}
          <div className="relative z-10 flex flex-wrap w-16 h-16 items-center justify-center gap-0.5">
            {[...Array(protons)].map((_, i) => (
              <motion.div 
                key={`p-${i}`} 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }}
                className="w-4 h-4 bg-red-500 rounded-full shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.3)] flex items-center justify-center text-[6px] font-bold text-white"
              >+</motion.div>
            ))}
            {[...Array(neutrons)].map((_, i) => (
              <motion.div 
                key={`n-${i}`} 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }}
                className="w-4 h-4 bg-slate-400 rounded-full shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.3)]"
              />
            ))}
          </div>

          {/* Electrons orbiting */}
          {[...Array(electrons)].map((_, i) => {
            const shellIndex = i < 2 ? 0 : 1;
            const radius = shellIndex === 0 ? 64 : 96;
            const angleSpeed = (i + 1) * 2;
            return (
              <motion.div
                key={`e-${i}`}
                className="absolute w-2.5 h-2.5 bg-blue-400 rounded-full shadow-[0_0_8px_#60a5fa] z-20"
                animate={{
                   rotate: 360,
                }}
                transition={{
                  duration: 5 / angleSpeed,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{
                  transformOrigin: `50% 50%`,
                  marginLeft: radius,
                }}
              />
            );
          })}

          {/* Element Badge */}
          <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/20 text-center min-w-[60px]">
             <span className="block text-2xl font-black text-white">{currentElement.symbol}</span>
             <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest">{currentElement.name}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-red-100 flex flex-col gap-3">
          <div>
            <div className="flex justify-between items-center mb-1 flex-wrap gap-1">
              <span className="text-[10px] font-black text-red-600 uppercase flex flex-wrap gap-x-1">
                <span>Protons (+)</span>
                {isAssistMode && <span className="opacity-50">{t("", "质子 (+)", "質子 (+)", chineseType)}</span>}
              </span>
              <span className="text-xs font-black">{protons}</span>
            </div>
            <div className="flex gap-1">
              <button 
                onClick={() => setProtons(Math.max(1, protons - 1))} 
                className="w-8 h-8 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 font-black shadow-[0_2px_0_0_rgba(220,38,38,0.2)] active:shadow-none active:translate-y-0.5 transition-all text-xs"
              >-</button>
              <button 
                onClick={() => setProtons(Math.min(6, protons + 1))} 
                className="w-8 h-8 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 font-black shadow-[0_2px_0_0_rgba(220,38,38,0.2)] active:shadow-none active:translate-y-0.5 transition-all text-xs"
              >+</button>
              <div className="flex-1 text-[8px] text-slate-500 italic flex flex-wrap items-center ml-2 leading-none gap-x-1">
                <span>Determines element!</span>
                {isAssistMode && <span className="opacity-70">{t("", "决定元素！", "決定元素！", chineseType)}</span>}
              </div>
            </div>
          </div>
            <div>
              <div className="flex justify-between items-center mb-1 flex-wrap gap-1">
                <span className="text-[10px] font-black text-slate-500 uppercase flex flex-wrap gap-x-1">
                  <span>Neutrons (0)</span>
                  {isAssistMode && <span className="opacity-50">{t("", "中子 (0)", "中子 (0)", chineseType)}</span>}
                </span>
                <span className="text-xs font-black">{neutrons}</span>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => setNeutrons(Math.max(0, neutrons - 1))} 
                  className="w-8 h-8 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 font-black shadow-[0_2px_0_0_rgba(71,85,105,0.2)] active:shadow-none active:translate-y-0.5 transition-all text-xs"
                >-</button>
                <button 
                  onClick={() => setNeutrons(Math.min(6, neutrons + 1))} 
                  className="w-8 h-8 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 font-black shadow-[0_2px_0_0_rgba(71,85,105,0.2)] active:shadow-none active:translate-y-0.5 transition-all text-xs"
                >+</button>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1 flex-wrap gap-1">
                <span className="text-[10px] font-black text-blue-600 uppercase flex flex-wrap gap-x-1">
                  <span>Electrons (-)</span>
                  {isAssistMode && <span className="opacity-50">{t("", "电子 (-)", "電子 (-)", chineseType)}</span>}
                </span>
                <span className="text-xs font-black">{electrons}</span>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => setElectrons(Math.max(0, electrons - 1))} 
                  className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 font-black shadow-[0_2px_0_0_rgba(37,99,235,0.2)] active:shadow-none active:translate-y-0.5 transition-all text-xs"
                >-</button>
                <button 
                  onClick={() => setElectrons(Math.min(6, electrons + 1))} 
                  className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 font-black shadow-[0_2px_0_0_rgba(37,99,235,0.2)] active:shadow-none active:translate-y-0.5 transition-all text-xs"
                >+</button>
                <div className="flex-1 text-[8px] text-slate-500 italic flex flex-wrap items-center ml-2 leading-none gap-x-1">
                   <span>{electrons === protons ? 'Neutral Atom' : 'Ion'}</span>
                   {isAssistMode && (
                     <span className="opacity-70">
                       {electrons === protons ? t('', '中性原子', '中性原子', chineseType) : t('', '离子', '離子', chineseType)}
                     </span>
                   )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-red-100 flex flex-col gap-1">
            <p className="text-[10px] text-red-900 leading-tight italic font-bold">
              Atoms contain a small nucleus (protons & neutrons) and orbiting electrons. Protons have positive charge (+), electrons have negative charge (-).
            </p>
            {isAssistMode && (
              <p className="text-[9px] text-red-700 leading-tight italic border-t border-red-50 pt-1">
                {chineseType === 'traditional' 
                  ? '原子包含一個小原子核（質子和中子）和圍繞軌道運行的電子。質子帶有正電荷 (+)，電子帶有負電荷 (-)。' 
                  : '原子包含一个小原子核（质子和中子）和围绕轨道运行的电子。质子带有正电荷 (+)，电子带有负电荷 (-)。'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. Purity Visualizer (Concept 3)
export const PurityCalculator: React.FC<VisualProps> = ({ isAssistMode, chineseType }) => {
  const [carat, setCarat] = useState(24);
  const purity = (carat / 24) * 100;

  return (
    <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-6 my-4 shadow-sm">
      <h4 className="font-black text-amber-800 uppercase tracking-wider text-sm mb-4 flex items-center gap-2 flex-wrap">
        <Gem size={18} className="text-amber-600" />
        <div className="flex flex-wrap gap-x-2">
          <span>Gold Purity Guide</span>
          {isAssistMode && <span className="opacity-50 tracking-normal">{t("", "黄金纯度指南", "黃金純度指南", chineseType)}</span>}
        </div>
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="relative h-48 bg-white rounded-2xl border-2 border-amber-200 p-4 flex flex-wrap content-start gap-1 justify-center overflow-hidden">
           {[...Array(24)].map((_, i) => (
             <motion.div
               key={i}
               className={`w-8 h-8 rounded-lg flex items-center justify-center text-[8px] font-black border transition-all ${
                 i < carat ? 'bg-amber-400 border-amber-500 text-amber-900 shadow-sm' : 'bg-slate-100 border-slate-200 text-slate-400'
               }`}
             >
                {i < carat ? 'Au' : 'Cu'}
             </motion.div>
           ))}
           <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent pointer-events-none" />
        </div>

        <div className="space-y-4">
           <div className="bg-white p-5 rounded-2xl shadow-sm border border-amber-100 text-center flex flex-col items-center">
              <span className="text-[10px] font-black uppercase text-amber-600 tracking-widest flex flex-wrap gap-x-1">
                <span>Current Setting</span>
                {isAssistMode && <span className="opacity-50">{t("", "当前设置", "當前設置", chineseType)}</span>}
              </span>
              <h1 className="text-4xl font-black text-amber-600 my-1">{carat}K</h1>
              <div className="w-full bg-amber-100 h-2 rounded-full overflow-hidden mt-2">
                 <motion.div animate={{ width: `${carat / 24 * 100}%` }} className="h-full bg-amber-500" />
              </div>
              <div className="flex flex-col items-center mt-2">
                <p className="text-xs font-bold text-amber-800">{purity.toFixed(1)}% Gold Purity</p>
                {isAssistMode && <p className="text-[10px] text-amber-600 font-medium italic border-t border-amber-50 mt-1 pt-1">{t("", "黄金纯度", "黃金純度", chineseType)}</p>}
              </div>
           </div>

           <div className="flex gap-2">
              {[12, 18, 24].map(k => (
                <button
                  key={k}
                  onClick={() => setCarat(k)}
                  className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                    carat === k ? 'bg-amber-500 text-white shadow-[0_4px_0_0_#b45309]' : 'bg-white text-amber-600 border border-amber-100 hover:bg-amber-50'
                  } active:shadow-none active:translate-y-1`}
                >
                  {k}K
                </button>
              ))}
           </div>

           <p className="text-[10px] text-amber-700 leading-tight italic">
             {t(
               'Pure gold is 24K (100%). 18K gold contains 18 parts gold and 6 parts other metals (usually copper or silver) to make it harder.',
               '纯金为 24K (100%)。18K 金含有 18 份黄金和 6 份其他金属（通常是铜或银），以使其更硬。',
               '純金為 24K (100%)。18K 金含有 18 份黃金和 6 份其他金屬（通常是銅或銀），以使其更硬。',
               chineseType
             )}
           </p>
        </div>
      </div>
    </div>
  );
};

// 3. Climate Records (Concept 6 - Glaciers)
export const ClimateChangeEvidence: React.FC<VisualProps> = ({ isAssistMode, chineseType }) => {
  const [year, setYear] = useState(0); // 0 = Past (Ice Age), 100 = Present

  return (
    <div className="bg-blue-50 border-2 border-blue-100 rounded-2xl p-6 my-4 shadow-sm">
      <h4 className="font-black text-blue-800 uppercase tracking-wider text-sm mb-4 flex items-center gap-2 flex-wrap">
        <Mountain size={18} className="text-blue-600" />
        <div className="flex flex-wrap gap-x-2">
          <span>Glacial Records: Climate Evidence</span>
          {isAssistMode && <span className="opacity-50 tracking-normal">{t("", "冰川记录：气候证据", "冰川記錄：氣候證據", chineseType)}</span>}
        </div>
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="relative h-64 bg-slate-200 rounded-2xl border-4 border-white shadow-xl overflow-hidden group">
           {/* Arctic Landscape */}
           <div className="absolute inset-0 bg-blue-200">
              <div className="absolute bottom-0 w-full h-24 bg-blue-900/10" />
           </div>

           {/* Glacier Layer */}
           <motion.div 
             animate={{ 
               clipPath: `inset(0 ${year}% 0 0)`, // Retreating glacier
               scale: 1 + (year * 0.002)
             }}
             className="absolute inset-0 bg-gradient-to-br from-white via-cyan-50 to-blue-100 z-10"
           >
              {/* Ice details */}
              <div className="absolute top-1/2 left-1/4 w-32 h-1 bg-blue-200/50 rounded-full rotate-45" />
              <div className="absolute top-1/3 left-1/2 w-48 h-2 bg-blue-200/50 rounded-full -rotate-12" />
           </motion.div>

           {/* Modern Ocean / Ground Evidence Below */}
           <div className="absolute bottom-4 left-4 z-20 bg-white/40 p-2 rounded-lg backdrop-blur-sm border border-white/50">
               <span className="text-[10px] font-black text-blue-800 uppercase flex flex-col items-center leading-none">
                  <span>{year < 50 ? 'Glacial Period (Ice Age)' : 'Interglacial (Present)'}</span>
                  {isAssistMode && <span className="opacity-70 mt-1 font-bold lowercase">{year < 50 ? t('', '冰期（冰河时代）', '冰期（冰河時代）', chineseType) : t('', '间冰期（现在）', '間冰期（現在）', chineseType)}</span>}
               </span>
           </div>

           {/* Core Sample Sideview */}
           <div className="absolute top-4 right-4 w-12 h-48 bg-slate-700 rounded-full border-2 border-white shadow-lg overflow-hidden flex flex-col z-30">
              {[...Array(6)].map((_, i) => (
                  <div 
                    key={i} 
                    className="flex-1 border-t border-slate-600/30 text-[6px] font-bold text-white flex flex-col items-center justify-center p-0.5 leading-none"
                    style={{ backgroundColor: `rgb(${50 + i * 20}, ${70 + i * 15}, ${100 + i * 10})` }}
                  >
                    <span>{i === 0 ? 'ICE' : 'POLLEN'}</span>
                    {isAssistMode && <span className="opacity-70 mt-0.5">{i === 0 ? t("", "冰", "冰", chineseType) : t("", "花粉", "花粉", chineseType)}</span>}
                  </div>
              ))}
           </div>
        </div>

        <div className="flex flex-col justify-center gap-6">
           <div className="bg-white p-5 rounded-2xl shadow-sm border border-blue-100">
              <div className="flex justify-between items-center mb-6">
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-blue-500 flex flex-wrap gap-x-1">
                      <span>Global Temp</span>
                      {isAssistMode && <span className="opacity-50 tracking-normal text-[8px]">{t("", "全球气温", "全球氣溫", chineseType)}</span>}
                    </span>
                    <div className="flex items-center gap-1 font-black text-lg">
                       <TrendingUp size={16} className={year > 50 ? 'text-red-500' : 'text-blue-500'} />
                       <span className={year > 50 ? 'text-red-600' : 'text-blue-600'}>
                          {year > 50 ? '+1.5°C' : '-10.0°C'}
                       </span>
                    </div>
                 </div>
                 <div className="flex flex-col text-right">
                    <span className="text-[10px] font-black uppercase text-blue-500 flex flex-wrap gap-x-1">
                      <span>Sea Level</span>
                      {isAssistMode && <span className="opacity-50 tracking-normal text-[8px]">{t("", "海平面", "海平面", chineseType)}</span>}
                    </span>
                    <span className="text-lg font-black text-slate-700 leading-none">
                       {year > 50 ? 'HIGH' : 'LOW'}
                    </span>
                    {isAssistMode && <span className="text-[10px] font-black text-slate-400 opacity-70 leading-none">{year > 50 ? t("", "高", "高", chineseType) : t("", "低", "低", chineseType)}</span>}
                 </div>
              </div>

              <input 
                type="range" min="0" max="100" value={year} 
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="w-full h-3 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between mt-2 text-[9px] font-black text-blue-400 uppercase tracking-widest">
                 <span className="flex flex-col items-start leading-none gap-1">
                   <span>Ancient</span>
                   {isAssistMode && <span className="opacity-70 font-bold lowercase tracking-normal">{t("", "古代", "古代", chineseType)}</span>}
                 </span>
                 <span className="flex flex-col items-end leading-none gap-1">
                   <span>Modern</span>
                   {isAssistMode && <span className="opacity-70 font-bold lowercase tracking-normal">{t("", "现代", "現代", chineseType)}</span>}
                 </span>
              </div>
           </div>

           <div className="p-4 bg-blue-500 rounded-2xl text-white shadow-lg relative overflow-hidden flex flex-col gap-2">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Wind size={40} /></div>
              <p className="text-xs font-bold leading-relaxed">
                 Core samples from glaciers and peat bogs act like a time machine. Deeper layers are older and contain pollen, helping scientists trace climate history.
              </p>
              {isAssistMode && (
                <p className="text-[11px] font-medium leading-relaxed italic border-t border-white/20 pt-2 opacity-90">
                  {chineseType === 'traditional'
                    ? '冰川和泥炭沼澤的岩芯樣本就像一台時光機。更深的地層更古老，含有花粉，幫助科學家追踪氣候歷史。'
                    : '冰川和泥炭沼泽的岩芯样本就像一台时光机。更深的地层更古老，含有花粉，帮助科学家追踪气候历史。'}
                </p>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};
