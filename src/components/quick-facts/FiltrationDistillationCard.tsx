import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FlaskConical, Sun, Info } from 'lucide-react';

interface FiltrationDistillationCardProps {
  chineseType?: 'traditional' | 'simplified' | null;
}

const FiltrationDistillationCard: React.FC<FiltrationDistillationCardProps> = ({ chineseType }) => {
  const [activeMode, setActiveMode] = useState<'filtration' | 'distillation'>('filtration');
  const [isFiltrationStarted, setIsFiltrationStarted] = useState(false);
  const [pourProgress, setPourProgress] = useState(0);
  
  const [greenBP, setGreenBP] = useState(78);
  const [orangeBP, setOrangeBP] = useState(100);
  const [currentTemp, setCurrentTemp] = useState(20);

  const t = (en: string, sc: string, tc: string) => {
    if (chineseType === 'simplified') return sc;
    if (chineseType === 'traditional') return tc;
    return en;
  };

  const resetFiltration = () => {
    setIsFiltrationStarted(false);
    setPourProgress(0);
  };

  useEffect(() => {
    if (isFiltrationStarted && pourProgress < 100) {
      const timer = setInterval(() => {
        setPourProgress(prev => Math.min(100, prev + 1));
      }, 50);
      return () => clearInterval(timer);
    }
  }, [isFiltrationStarted, pourProgress]);

  return (
    <div className="bg-white rounded-[2rem] border-2 border-gray-100 shadow-xl overflow-hidden w-full">
      <div className="bg-gradient-to-r from-blue-50 to-orange-50 p-6 border-b-2 border-gray-100">
        <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-3">
          <FlaskConical className="text-orange-500" />
          {t('Filtration & Distillation', '过滤与蒸馏', '過濾與蒸餾')}
        </h3>
        <p className="text-gray-500 font-bold text-sm mt-1">
          {t('Explore separation techniques based on physical properties.', '探索基于物理性质的分离技术。', '探索基於物理性質的分離技術。')}
        </p>
      </div>

      <div className="p-8">
        <div className="flex justify-center mb-8">
          <div className="flex bg-gray-100/80 p-1 rounded-2xl border border-gray-200 backdrop-blur-sm shadow-sm">
            <button 
              onClick={() => setActiveMode('filtration')}
              className={`px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeMode === 'filtration' ? 'bg-white text-blue-600 shadow-md ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {t('Filtration', '过滤', '過濾')}
            </button>
            <button 
              onClick={() => setActiveMode('distillation')}
              className={`px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeMode === 'distillation' ? 'bg-white text-orange-600 shadow-md ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {t('Distillation', '蒸馏', '蒸餾')}
            </button>
          </div>
        </div>
        <AnimatePresence mode="wait">
          {activeMode === 'filtration' ? (
            <motion.div 
              key="filtration"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="relative aspect-square md:aspect-video bg-gray-50 rounded-[3rem] border-4 border-gray-100 p-8 flex items-center justify-center overflow-hidden">
                  <div className="relative w-full h-full flex flex-col items-center justify-center scale-75 md:scale-100">
                    <div className="absolute left-1/4 bottom-10 w-2 h-64 bg-gray-300 rounded-full" />
                    <div className="absolute left-1/4 bottom-10 -translate-x-1/2 w-48 h-4 bg-gray-400 rounded-full" />
                    <div className="absolute left-1/4 top-1/3 w-32 h-2 bg-gray-400 rounded-full shadow-sm" />
                    
                    <div className="absolute bottom-10 w-24 h-24 border-x-4 border-b-4 border-blue-200 rounded-b-2xl overflow-hidden bg-white">
                       <motion.div 
                         initial={{ height: 0 }}
                         animate={{ height: `${pourProgress * 0.4}%` }}
                         className="absolute bottom-0 w-full bg-blue-400/40"
                       />
                    </div>

                    <div className="absolute top-[35%] w-32 flex flex-col items-center">
                      <div className="w-32 h-24 bg-gray-100/50 border-x-2 border-t-2 border-gray-200 rounded-b-[4rem] relative overflow-hidden">
                         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90%] h-full border-x-4 border-b-4 border-white/80 rounded-b-[3.8rem] z-10" />
                         
                         <div className="absolute inset-0 flex flex-wrap gap-1.5 p-6 justify-center items-center">
                            {[...Array(15)].map((_, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={pourProgress > i * 6 ? { opacity: 1, scale: 1 } : {}}
                                className="w-3 h-3 bg-red-500 rounded-full shadow-md z-20 border border-red-400/30"
                              />
                            ))}
                         </div>
                      </div>
                      <div className="w-4 h-12 bg-gray-100/50 border-x-2 border-gray-200 z-0" />
                      
                      {isFiltrationStarted && pourProgress < 100 && (
                        <motion.div 
                          animate={{ y: [0, 40], opacity: [1, 0], scale: [1, 0.8] }}
                          transition={{ repeat: Infinity, duration: 0.6 }}
                          className="w-2 h-4 bg-blue-400/60 rounded-full absolute -bottom-8 shadow-sm"
                        />
                      )}
                    </div>

                    <motion.div 
                      animate={isFiltrationStarted ? { rotate: -45, x: 20, y: -40 } : { rotate: 0, x: 80, y: -40 }}
                      className="absolute top-1/4 w-20 h-20 border-x-4 border-b-4 border-gray-200 rounded-b-xl overflow-hidden bg-white z-30"
                    >
                       <motion.div 
                         animate={isFiltrationStarted ? { height: `${100 - pourProgress}%` } : { height: '60%' }}
                         className="absolute bottom-0 w-full bg-blue-400/40 flex flex-wrap gap-1.5 p-3 items-end"
                       >
                          {[...Array(6)].map((_, i) => (
                            <div key={i} className="w-2 h-2 bg-red-500 rounded-full opacity-80 shadow-sm" />
                          ))}
                       </motion.div>
                       
                       {isFiltrationStarted && pourProgress < 100 && (
                         <motion.div 
                           className="absolute -top-10 left-0 w-1 h-20 bg-blue-400/40 -rotate-45 origin-bottom"
                         />
                       )}
                    </motion.div>
                  </div>

                  <div className="absolute bottom-6 left-6 right-6 flex gap-4">
                    <div className="flex-1 bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-blue-100 shadow-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('Residue', '滤渣', '濾渣')}</span>
                      </div>
                      <p className="text-xs font-black text-red-600">{t('Insoluble Solids', '不溶性固体', '不溶性固體')}</p>
                    </div>
                    <div className="flex-1 bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-blue-100 shadow-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('Filtrate', '滤液', '濾液')}</span>
                      </div>
                      <p className="text-xs font-black text-blue-600">{t('Liquid / Solution', '液体 / 溶液', '液體 / 溶液')}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-blue-50 p-8 rounded-[2.5rem] border-2 border-blue-100">
                    <h4 className="text-xl font-black text-blue-700 uppercase tracking-tight mb-4">{t('Separation by State', '按状态分离', '按狀態分離')}</h4>
                    <p className="text-gray-600 font-medium leading-relaxed mb-6">
                      {t('Filtration separates an insoluble solid from a liquid. The solid particles are too large to pass through the tiny holes in the filter paper, while the liquid (and dissolved substances) can pass through easily.', '过滤将不溶性固体从液体中分离。固体颗粒太大，无法通过滤纸上的小孔，而液体（和溶解物质）可以轻松通过。', '過濾將不溶性固體從液體中分離。固體顆粒太大，無法通過濾紙上的小孔，而液體（和溶解物質）可以輕鬆通過。')}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => setIsFiltrationStarted(true)}
                        disabled={isFiltrationStarted}
                        className="bg-blue-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-[0_4px_0_0_#1d4ed8] active:shadow-none active:translate-y-1 transition-all disabled:opacity-50"
                      >
                        {t('Pour Mixture', '倾倒混合物', '傾倒混合物')}
                      </button>
                      <button 
                        onClick={resetFiltration}
                        className="bg-white text-gray-500 border-2 border-gray-200 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
                      >
                        {t('Reset', '重置', '重置')}
                      </button>
                    </div>
                  </div>

                  <div className="bg-orange-50 p-6 rounded-3xl border-2 border-orange-100">
                    <div className="flex items-center gap-3 mb-3">
                      <Info className="text-orange-500" size={18} />
                      <span className="text-xs font-black text-orange-700 uppercase tracking-widest">{t('Common Use', '常见应用', '常見應用')}</span>
                    </div>
                    <p className="text-[10px] font-bold text-orange-800 leading-relaxed">
                      {t('Separating sand from water or coffee grounds from coffee. It works because sand is INSOLUBLE and coffee grounds are too big for the filter.', '将沙子从水中分离，或将咖啡渣从咖啡中分离。它之所以有效，是因为沙子是不溶的，咖啡渣对于过滤器来说太大了。', '將沙子從水中分離，或將咖啡渣從咖啡中分離。它之所以有效，是因為沙子是不溶的，咖啡渣對於過濾器來說太大了。')}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="distillation"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                  {/* Controls */}
                  <div className="bg-gray-50 p-8 rounded-[2.5rem] border-2 border-gray-100 space-y-8">
                    <div>
                      <div className="flex justify-between mb-4">
                        <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest">{t('Orange Particle BP', '橙色粒子沸点', '橙色粒子沸點')}</label>
                        <span className="text-[10px] font-black text-gray-600">{orangeBP}°C</span>
                      </div>
                      <input 
                        type="range" min="40" max="150" value={orangeBP}
                        onChange={(e) => setOrangeBP(parseInt(e.target.value))}
                        className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-4">
                        <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{t('Green Particle BP', '绿色粒子沸点', '綠色粒子沸點')}</label>
                        <span className="text-[10px] font-black text-gray-600">{greenBP}°C</span>
                      </div>
                      <input 
                        type="range" min="40" max="150" value={greenBP}
                        onChange={(e) => setGreenBP(parseInt(e.target.value))}
                        className="w-full h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex justify-between mb-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('Heating Temperature', '加热温度', '加熱溫度')}</label>
                        <div className="flex items-center gap-2">
                          <motion.div 
                            animate={currentTemp > 40 ? { scale: [1, 1.2, 1], color: ['#6b7280', '#ef4444'] } : {}}
                            transition={{ repeat: Infinity, duration: 1 }}
                          >
                            <Sun size={14} />
                          </motion.div>
                          <span className="text-xl font-black text-gray-800 tracking-tighter">{currentTemp}°C</span>
                        </div>
                      </div>
                      <input 
                        type="range" min="20" max="200" value={currentTemp}
                        onChange={(e) => setCurrentTemp(parseInt(e.target.value))}
                        className="w-full h-3 bg-red-100 rounded-lg appearance-none cursor-pointer accent-red-500"
                      />
                    </div>
                  </div>

                  <div className="bg-emerald-50 p-6 rounded-3xl border-2 border-emerald-100">
                    <h4 className="text-xs font-black text-emerald-700 uppercase tracking-widest mb-2">{t('How it works', '工作原理', '工作原理')}</h4>
                    <p className="text-[10px] font-bold text-emerald-800 leading-relaxed italic">
                      {t('Distillation separates liquids based on their different boiling points. The liquid with the lower BP boils first, turns into gas, travels down the condenser, and is cooled back into a pure liquid.', '蒸馏根据液体不同的沸点进行分离。沸点较低的液体首先沸腾，变成气体，沿着冷凝管移动，然后冷却回纯液体。', '蒸餾根據液體不同的沸點進行分離。沸點較低的液體首先沸騰，變成氣體，沿著冷凝管移動，然後冷卻回純液體。')}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  {/* Micro Close-up View */}
                  <div className="bg-slate-900 rounded-[2.5rem] p-8 border-8 border-slate-800 relative h-80 overflow-hidden shadow-2xl">
                     <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.1),transparent)]" />
                     
                     <div className="absolute top-4 left-6 z-20">
                        <span className="bg-white/10 backdrop-blur-md text-[10px] font-black text-white/70 px-3 py-1 rounded-full uppercase tracking-widest border border-white/10">
                           {t('Molecular View', '微观视角', '微觀視角')}
                        </span>
                     </div>

                     <div className="relative w-full h-full">
                        <div className="absolute bottom-0 inset-x-0 h-24 bg-blue-500/5 border-t border-white/5 rounded-t-xl" />

                        {[...Array(15)].map((_, i) => (
                           <motion.div
                               key={`green-${i}`}
                               initial={{ x: (Math.random() - 0.5) * 280, y: 20 + Math.random() * 60 }}
                               animate={currentTemp >= greenBP ? {
                                  x: [null, (Math.random() - 0.5) * 350, (Math.random() - 0.5) * 350],
                                  y: [null, 0, -350],
                                  scale: [1, 1.5, 0.5],
                                  opacity: [1, 1, 0]
                               } : {
                                  x: [(Math.random() - 0.5) * 260, (Math.random() - 0.5) * 260],
                                  y: [20 + Math.random() * 60, 20 + Math.random() * 60],
                                  rotate: [0, 360]
                               }}
                               transition={{ 
                                  duration: currentTemp >= greenBP ? 1 + Math.random() : 8 + Math.random() * 4, 
                                  repeat: Infinity,
                                  ease: "linear"
                               }}
                               className="absolute left-1/2 bottom-0 w-3 h-3 bg-emerald-400 rounded-full shadow-[0_0_15px_#10b981,inset_0_0_5px_rgba(255,255,255,0.5)] z-10"
                           />
                        ))}

                        {[...Array(15)].map((_, i) => (
                           <motion.div
                               key={`orange-${i}`}
                               initial={{ x: (Math.random() - 0.5) * 280, y: 20 + Math.random() * 60 }}
                               animate={currentTemp >= orangeBP ? {
                                  x: [null, (Math.random() - 0.5) * 350, (Math.random() - 0.5) * 350],
                                  y: [null, 0, -350],
                                  scale: [1, 1.5, 0.5],
                                  opacity: [1, 1, 0]
                               } : {
                                  x: [(Math.random() - 0.5) * 260, (Math.random() - 0.5) * 260],
                                  y: [20 + Math.random() * 60, 20 + Math.random() * 60],
                                  rotate: [0, -360]
                               }}
                               transition={{ 
                                  duration: currentTemp >= orangeBP ? 1 + Math.random() : 10 + Math.random() * 5, 
                                  repeat: Infinity,
                                  ease: "linear"
                               }}
                               className="absolute left-1/2 bottom-0 w-3 h-3 bg-orange-400 rounded-full shadow-[0_0_15px_#f59e0b,inset_0_0_5px_rgba(255,255,255,0.5)] z-10"
                           />
                        ))}
                        
                        {(currentTemp >= greenBP || currentTemp >= orangeBP) && [...Array(5)].map((_, i) => (
                           <motion.div
                             key={`bubble-${i}`}
                             animate={{ y: [180, 140], opacity: [0, 0.3, 0], scale: [0.5, 1.2] }}
                             transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.2 }}
                             className="absolute left-1/2 w-8 h-8 rounded-full border border-white/20 bg-white/5 blur-sm z-5"
                             style={{ marginLeft: `${(Math.random() - 0.5) * 100}px` }}
                           />
                        ))}
                     </div>

                     <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center text-[10px] font-black uppercase tracking-widest z-20">
                        <div className={`flex flex-col gap-1 transition-colors duration-500 font-sans ${currentTemp >= orangeBP ? 'text-orange-400' : 'text-orange-400/40'}`}>
                           <span>{t('Orange Particles', '橙色粒子', '橙色粒子')}</span>
                           <span className="text-[8px] opacity-80">{currentTemp >= orangeBP ? t('EVAPORATING', '正在蒸发', '正在蒸發') : t('LIQUID', '液态', '液態')}</span>
                        </div>
                        <div className={`flex flex-col gap-1 transition-colors duration-500 text-right font-sans ${currentTemp >= greenBP ? 'text-emerald-400' : 'text-emerald-400/40'}`}>
                           <span>{t('Green Particles', '绿色粒子', '綠色粒子')}</span>
                           <span className="text-[8px] opacity-80">{currentTemp >= greenBP ? t('EVAPORATING', '正在蒸发', '正在蒸發') : t('LIQUID', '液态', '液態')}</span>
                        </div>
                     </div>
                  </div>

                  {/* Distillation Visual */}
                  <div className="bg-gray-100 rounded-[2.5rem] p-4 border-2 border-gray-200 relative aspect-video overflow-hidden shadow-inner flex items-center justify-center">
                     <div className="relative w-full h-full transform scale-110 md:scale-125 lg:scale-140 flex items-center justify-center -mt-4">
                        <div className="relative w-[320px] h-[220px]">
                           <div className="absolute left-[5%] bottom-[60px] w-16 h-16 border-2 border-gray-400/50 rounded-full bg-white/40 backdrop-blur-sm flex flex-col items-center justify-end overflow-hidden z-20">
                              <div className="absolute top-0 w-6 h-6 bg-transparent border-x-2 border-gray-400/50 -translate-y-[70%]" />
                              
                              <motion.div 
                                 animate={{ height: `${Math.max(10, 50 - (currentTemp/8))}%` }}
                                 className="w-full bg-blue-100/30 relative flex flex-wrap gap-0.5 p-1 items-end justify-center"
                              >
                                 {[...Array(5)].map((_, i) => (
                                    <motion.div
                                       key={`flask-green-${i}`}
                                       animate={currentTemp >= greenBP ? { y: -100, opacity: 0 } : { y: 0, x: [0, 5, -5, 0] }}
                                       transition={{ repeat: Infinity, duration: 2 }}
                                       className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-sm"
                                    />
                                 ))}
                                 {[...Array(5)].map((_, i) => (
                                    <motion.div
                                       key={`flask-orange-${i}`}
                                       animate={currentTemp >= orangeBP ? { y: -100, opacity: 0 } : { y: 0, x: [0, -5, 5, 0] }}
                                       transition={{ repeat: Infinity, duration: 2.5 }}
                                       className="w-1.5 h-1.5 bg-orange-400 rounded-full shadow-sm"
                                    />
                                 ))}
                              </motion.div>
                           </div>
                           
                           <div className="absolute left-[5%] bottom-[125px] w-16 h-12 flex flex-col items-center z-10">
                              <div className="w-6 h-full bg-white/40 border-x-2 border-gray-400/50" />
                              <div className="absolute top-0 w-1.5 h-16 bg-red-100 border border-red-200 -translate-y-[60%] rounded-full z-30 shadow-sm">
                                 <div className="absolute bottom-1 w-full bg-red-500 rounded-full transition-all duration-300" 
                                      style={{ height: `${(currentTemp/200)*100}%` }} />
                              </div>
                           </div>

                           <div className="absolute left-[calc(5%+8px)] bottom-[calc(140px)] w-12 h-3 bg-white/40 border-y-2 border-r-2 border-gray-400/50 -rotate-[25deg] origin-left z-10" />

                           <div className="absolute left-[calc(5%+3.5rem)] bottom-[calc(125px)] w-36 h-8 bg-blue-50/40 border-2 border-blue-200 rounded-full -rotate-[25deg] origin-left flex items-center justify-center z-20 shadow-sm">
                              <div className="w-[105%] h-1.5 bg-white/60 border-y border-gray-300 rounded-full absolute -left-[2.5%]" />
                              <span className="text-[5px] font-black text-blue-500 uppercase tracking-widest relative z-30">{t('Condenser', '冷凝管', '冷凝管')}</span>
                              
                              <div className="absolute -top-1 left-4 w-1 h-3 bg-blue-300 rounded-full" />
                              <div className="absolute -bottom-1 right-4 w-1 h-3 bg-blue-300 rounded-full" />
                           </div>

                           <div className="absolute left-[calc(5%+3.5rem+7.8rem)] bottom-[calc(92px)] w-8 h-6 bg-white/40 border-l-2 border-b-2 border-gray-400/50 rotate-[65deg] z-10" />

                           <div className="absolute left-[calc(5%+3.5rem+8.2rem)] bottom-[60px] w-12 h-16 border-2 border-gray-300 rounded-b-xl bg-white/50 backdrop-blur-sm overflow-hidden flex flex-col justify-end z-20 shadow-sm">
                              <motion.div 
                                 animate={{ 
                                   height: currentTemp >= Math.min(greenBP, orangeBP) 
                                     ? (currentTemp >= Math.max(greenBP, orangeBP) ? '50%' : '25%') 
                                     : '0%' 
                                 }}
                                 className="w-full bg-blue-400/20 relative flex flex-wrap gap-1 p-1 items-end justify-center"
                              >
                                 {currentTemp >= greenBP && (
                                   <div className="w-2 h-2 bg-emerald-400/70 rounded-full shadow-sm" />
                                 )}
                                 {currentTemp >= orangeBP && (
                                   <div className="w-2 h-2 bg-orange-400/70 rounded-full shadow-sm" />
                                 )}
                              </motion.div>
                              
                              {currentTemp >= Math.min(greenBP, orangeBP) && (
                                <motion.div 
                                  animate={{ y: [-15, 60], opacity: [1, 0] }}
                                  transition={{ repeat: Infinity, duration: 0.8 }}
                                  className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-3 bg-blue-400/60 rounded-full z-30"
                                />
                              )}
                           </div>

                           <div className="absolute left-[5.5%] bottom-0 w-14 flex flex-col items-center">
                              <motion.div 
                                animate={currentTemp > 40 ? { scale: [1, 1.2, 1], opacity: [0.2, 0.6, 0.2] } : { opacity: 0.1 }}
                                className="w-full h-6 bg-blue-400/30 blur-lg rounded-t-full"
                              />
                              <div className="w-10 h-14 bg-gray-400 rounded-t-xl z-0 border-x border-t border-gray-500" />
                           </div>
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Metadata for sorting
(FiltrationDistillationCard as any).UNIT = 3;
(FiltrationDistillationCard as any).SUBJECT = 'CHEMISTRY';

export default FiltrationDistillationCard;
