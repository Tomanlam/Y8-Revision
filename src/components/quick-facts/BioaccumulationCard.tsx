import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, AlertTriangle, Fish, Bird, Leaf, Skull } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

interface BioCardProps {
  chineseType: 'traditional' | 'simplified' | null;
}

const BioaccumulationCard: React.FC<BioCardProps> = ({ chineseType }) => {
  const [activeMode, setActiveMode] = useState<'accumulation' | 'magnification'>('accumulation');
  const [age, setAge] = useState(0); // For bioaccumulation animation (0 to 100)

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeMode === 'accumulation') {
      interval = setInterval(() => {
        setAge((prev) => (prev >= 100 ? 0 : prev + 1));
      }, 100); // 10 seconds for full lifecycle
    }
    return () => clearInterval(interval);
  }, [activeMode]);

  const t = (en: string, zhHans: string, zhHant: string) => {
    if (chineseType === 'simplified') return zhHans;
    if (chineseType === 'traditional') return zhHant;
    return en;
  };

  // Data for single organism over time
  const accumulationData = Array.from({ length: 20 }, (_, i) => {
    const time = i * 5;
    return {
      time,
      toxin: Math.pow(time / 20, 1.5) * 10, // Non-linear accumulation
    };
  });

  const magnificationData = [
    { level: t('Water', '水', '水'), value: 0.000003, color: '#93c5fd' }, // Water
    { level: t('Plankton', '浮游生物', '浮游生物'), value: 0.04, color: '#a7f3d0' }, // Zooplankton
    { level: t('Small Fish', '小鱼', '小魚'), value: 0.5, color: '#fde047' }, // Small Fish
    { level: t('Large Fish', '大鱼', '大魚'), value: 2.0, color: '#fb923c' }, // Large Fish
    { level: t('Eagle (Apex)', '老鹰(顶级)', '老鷹(頂級)'), value: 25.0, color: '#ef4444' }, // Birds of prey
  ];

  const currentToxinAcc = Math.pow(age / 20, 1.5) * 10;
  const isLethalAcc = currentToxinAcc > 35; // Lethal dose at 35

  return (
    <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-xl overflow-hidden w-full">
      <div className="bg-gradient-to-r from-red-50 via-rose-50 to-red-50 p-6 md:p-8 border-b-2 border-red-100 flex flex-col md:flex-row justify-between md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-500 text-white rounded-xl shadow-sm">
              <Skull size={20} />
            </div>
            <h3 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight leading-none">
              {t('Toxins in Ecosystem', '生态系统中的毒素', '生態系統中的毒素')}
            </h3>
          </div>
          <p className="text-slate-500 font-bold text-sm">
            {t('Bioaccumulation vs Biomagnification', '生物累积与生物放大', '生物累積與生物放大')}
          </p>
        </div>

        <div className="flex bg-white/50 p-1 md:p-1.5 rounded-2xl backdrop-blur-md border md:border-2 border-white pointer-events-auto">
          <button 
            onClick={() => { setActiveMode('accumulation'); setAge(0); }}
            className={`px-4 md:px-6 py-2.5 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all ${activeMode === 'accumulation' ? 'bg-white shadow-md text-red-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t('Bioaccumulation', '生物累积', '生物累積')}
          </button>
          <button 
            onClick={() => setActiveMode('magnification')}
            className={`px-4 md:px-6 py-2.5 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all ${activeMode === 'magnification' ? 'bg-white shadow-md text-red-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t('Biomagnification', '生物放大', '生物放大')}
          </button>
        </div>
      </div>

      <div className="p-6 md:p-10 bg-slate-50/50">
        <AnimatePresence mode="wait">
          {activeMode === 'accumulation' ? (
            <motion.div 
              key="accumulation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-sm flex flex-col md:flex-row gap-6 items-center">
                <div className="flex-1">
                  <h4 className="text-rose-600 font-black uppercase tracking-widest mb-2 text-sm flex items-center gap-2">
                    <Activity size={18} />
                    {t('Bioaccumulation (One Organism)', '生物累积 (单一生物)', '生物累積 (單一生物)')}
                  </h4>
                  <p className="text-slate-500 text-sm font-bold leading-relaxed">
                    {t('The gradual accumulation of non-biodegradable substances (like heavy metals or pesticides) in an organism over its lifetime. The toxin enters the organism faster than it can be broken down or excreted.', '不可降解物质（如重金属或农药）在生物体一生中的逐渐积累。毒素进入生物体的速度快于其被分解或排出的速度。', '不可降解物質（如重金屬或農藥）在生物體一生中的逐漸積累。毒素進入生物體的速度快於其被分解或排出的速度。')}
                  </p>
                </div>
                <div className="w-full md:w-64 bg-slate-100 rounded-2xl p-4 relative h-32 flex items-center justify-center overflow-hidden border-2 border-slate-200">
                  <motion.div
                    className="absolute inset-0 bg-rose-500 origin-bottom opacity-20"
                    style={{ height: `${age}%`, top: `${100 - age}%` }}
                  />
                  
                  {/* Fish visually acquiring toxins */}
                  <div className="relative z-10 flex flex-col items-center">
                    <motion.div
                      animate={isLethalAcc ? { rotate: [0, -10, 10, -10, 0], scale: [1, 1.1, 1] } : { y: [0, -5, 0] }}
                      transition={isLethalAcc ? { duration: 0.5, repeat: Infinity } : { duration: 2, repeat: Infinity }}
                      className={`text-6xl drop-shadow-md ${isLethalAcc ? 'text-slate-800' : ''}`}
                      style={{ filter: `hue-rotate(${-100 + age}deg) saturate(${100 + age}%)` }}
                    >
                      {isLethalAcc ? '☠️' : '🐟'}
                    </motion.div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-2 bg-white/80 px-2 rounded-full shadow-sm">
                      {t('Age: ', '年龄: ', '年齡: ')} {age} {t('days', '天', '天')}
                    </div>
                  </div>

                  {/* Incoming food/toxin particles */}
                  {Array.from({ length: 5 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-rose-500 rounded-full"
                      initial={{ x: 100, y: Math.random() * 80 - 40, opacity: 0 }}
                      animate={{ x: 0, opacity: [0, 1, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                      style={{ right: 0 }}
                    />
                  ))}
                  {isLethalAcc && (
                    <div className="absolute inset-0 border-4 border-red-500 rounded-2xl pointer-events-none" />
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={accumulationData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="time" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }}
                      tickFormatter={(val) => `${val}d`}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ color: '#64748b', fontWeight: 'bold' }}
                    />
                    <ReferenceLine y={35} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: t('Lethal Dose', '致死剂量', '致死劑量'), fill: '#ef4444', fontSize: 12, fontWeight: 'bold' }} />
                    <Area 
                      type="monotone" 
                      dataKey="toxin" 
                      stroke="#f43f5e" 
                      fill="#ffe4e6" 
                      strokeWidth={3}
                      name={t('Toxin Level', '毒素水平', '毒素水平')}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="magnification"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-sm">
                <h4 className="text-rose-600 font-black uppercase tracking-widest mb-2 text-sm flex items-center gap-2">
                  <AlertTriangle size={18} />
                  {t('Biomagnification (Along Food Chain)', '生物放大 (沿着食物链)', '生物放大 (沿著食物鏈)')}
                </h4>
                <p className="text-slate-500 text-sm font-bold leading-relaxed mb-6">
                  {t('The concentration of toxins increases at each successive trophic level. Because energy decreases (10% rule) but toxins do not break down, predators must eat many contaminated prey, accumulating massive doses.', '毒素的浓度在每一个连续的营养级中都会增加。因为能量在流动中递减（10%定律），但毒素不会分解，掠食者必须吃掉许多受污染的猎物，从而累积大量毒素。', '毒素的濃度在每一個連續的營養級中都會增加。因為能量在流動中遞減（10%定律），但毒素不會分解，掠食者必須吃掉許多受污染的獵物，從而累積大量毒素。')}
                </p>

                <div className="flex flex-col md:flex-row justify-between items-center gap-4 relative py-8 px-4 overflow-x-auto">
                  <div className="absolute inset-x-8 top-1/2 h-1 bg-slate-200 -z-10 hidden md:block" />
                  
                  {magnificationData.map((node, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.2 }}
                      className="flex flex-col items-center relative"
                    >
                      {/* Node circle representing organism */}
                      <div className="w-16 h-16 rounded-full flex items-center justify-center border-4 shadow-md bg-white relative z-10 transition-transform hover:scale-110" style={{ borderColor: node.color }}>
                        {i === 0 && <span className="text-2xl">💧</span>}
                        {i === 1 && <span className="text-2xl">🦠</span>}
                        {i === 2 && <span className="text-2xl">🐟</span>}
                        {i === 3 && <span className="text-2xl">🐟</span>}
                        {i === 4 && <span className="text-2xl">🦅</span>}
                        
                        {/* Dot representation of toxin density */}
                        <div className="absolute inset-1 rounded-full overflow-hidden flex items-center justify-center flex-wrap opacity-50 pointer-events-none gap-0.5">
                          {Array.from({ length: Math.min(20, Math.ceil(node.value * 2)) }).map((_, j) => (
                            <div key={j} className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                          ))}
                        </div>
                      </div>
                      
                      <div className="mt-4 text-center">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-700">{node.level}</div>
                        <div className="text-xs font-bold text-rose-500 mt-1">{node.value} ppm</div>
                      </div>

                      {i < magnificationData.length - 1 && (
                        <div className="hidden md:block absolute left-full top-[1.5rem] w-[calc(100%-4rem)] flex justify-center -translate-y-1/2">
                          <motion.div 
                            className="text-rose-300"
                            animate={{ x: [0, 5, 0] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            →
                          </motion.div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={magnificationData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="level" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }}
                      scale="log"
                      domain={['dataMin', 'dataMax']} // Log scale to show the massive difference
                    />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ color: '#64748b', fontWeight: 'bold' }}
                    />
                    <ReferenceLine y={10} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: t('Lethal Range for Apex', '顶级掠食者致死范围', '頂級掠食者致死範圍'), fill: '#ef4444', fontSize: 12, fontWeight: 'bold' }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} name={t('Toxin Concentration (ppm)', '毒素浓度(ppm)', '毒素濃度(ppm)')}>
                      {magnificationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

(BioaccumulationCard as any).UNIT = 4;
(BioaccumulationCard as any).SUBJECT = 'BIOLOGY';

export default BioaccumulationCard;
