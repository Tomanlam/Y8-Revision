import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, RefreshCcw, Play, Info } from 'lucide-react';

interface PaperChromatographyCardProps {
  chineseType?: 'traditional' | 'simplified' | null;
}

const PaperChromatographyCard: React.FC<PaperChromatographyCardProps> = ({ chineseType }) => {
  const [selectedDye, setSelectedDye] = useState<'red' | 'blue' | 'purple' | 'black'>('purple');
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showRf, setShowRf] = useState(false);

  const t = (en: string, sc: string, tc: string) => {
    if (chineseType === 'simplified') return sc;
    if (chineseType === 'traditional') return tc;
    return en;
  };

  const dyes = {
    red: { name: t('Pure Red', '纯红', '純紅'), colors: ['#ef4444'], rf: [0.4], type: 'pure' },
    blue: { name: t('Pure Blue', '纯蓝', '純藍'), colors: ['#3b82f6'], rf: [0.7], type: 'pure' },
    purple: { name: t('Purple Mix', '紫色混合', '紫色混合'), colors: ['#ef4444', '#3b82f6'], rf: [0.4, 0.7], type: 'mixture' },
    black: { name: t('Black Ink', '黑墨水', '黑墨水'), colors: ['#eab308', '#ef4444', '#3b82f6'], rf: [0.2, 0.5, 0.85], type: 'mixture' }
  } as const;

  useEffect(() => {
    let interval: any;
    if (isRunning && progress < 100) {
      interval = setInterval(() => {
        setProgress(prev => Math.min(100, prev + 0.5));
      }, 50);
    } else if (progress >= 100) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, progress]);

  const reset = () => {
    setIsRunning(false);
    setProgress(0);
    setShowRf(false);
  };

  return (
    <div className="bg-white rounded-[2rem] border-2 border-gray-100 shadow-xl overflow-hidden w-full">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b-2 border-gray-100">
         <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-3">
            <Target className="text-purple-500" />
            {t('Paper Chromatography', '纸层析法', '紙層析法')}
         </h3>
         <p className="text-gray-500 font-bold text-sm mt-1">
            {t('Separate mixtures based on their affinity for the solvent vs the paper.', '根据对溶剂和纸张的亲和力分离混合物。', '根據對溶劑和紙張的親和力分離混合物。')}
         </p>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Main Simulation View */}
          <div className="bg-slate-50 p-8 rounded-[3rem] border-2 border-gray-100 flex items-center justify-center relative overflow-hidden h-[450px]">
            <div className="absolute left-[20%] top-10 bottom-10 w-2 bg-gray-300 rounded-full" />
            <div className="absolute left-[20%] top-[40px] w-24 h-2 bg-gray-300 rounded-full" />
            
            <div className="relative w-24 h-80 border-x-4 border-b-4 border-white/80 rounded-b-full bg-white/30 backdrop-blur-sm z-10 flex flex-col items-center">
               <div className="absolute bottom-0 w-full h-12 bg-blue-100/40 rounded-b-full border-t border-blue-200/50" />
               
               <div className="w-12 h-[90%] bg-white shadow-md relative mt-4 flex flex-col items-center p-1">
                  <motion.div 
                    animate={{ height: `${progress}%` }}
                    className="absolute bottom-0 left-0 right-0 bg-blue-100/20 border-t-2 border-blue-300 z-0"
                  />

                  <div className="absolute top-[80%] left-0 right-0 h-0.5 bg-gray-400 z-10" />
                  <span className="absolute top-[82%] right-[-30px] text-[8px] font-black text-gray-400 rotate-90">{t('ORIGIN', '原点', '原點')}</span>

                  {dyes[selectedDye].colors.map((color, i) => {
                    const finalRf = dyes[selectedDye].rf[i];
                    const startPos = 80;
                    const travelMax = 70; 
                    const currentPos = startPos - (progress / 100) * travelMax * finalRf;

                    return (
                      <motion.div 
                        key={i}
                        className="absolute w-3 h-3 rounded-full blur-[2px] opacity-80"
                        style={{ 
                          backgroundColor: color,
                          top: `${currentPos}%`,
                          left: '50%',
                          marginLeft: '-6px'
                        }}
                      />
                    );
                  })}
                  
                  {showRf && progress >= 100 && (
                    <div className="absolute inset-x-0 top-0 bottom-0 pointer-events-none">
                       <div className="absolute top-[10%] left-[-20px] h-px w-20 bg-blue-500 z-30">
                          <span className="absolute left-full ml-2 text-[8px] font-black text-blue-500 whitespace-nowrap">{t('Solvent Front', '溶剂前沿', '溶劑前沿')} (70mm)</span>
                       </div>
                       {dyes[selectedDye].colors.map((color, i) => {
                         const rf = dyes[selectedDye].rf[i];
                         const dist = Math.round(70 * rf);
                         const topPos = 80 - 70 * rf;
                         return (
                           <div key={i} className="absolute left-[-20px] h-px w-10 z-30" style={{ top: `${topPos}%`, backgroundColor: color }}>
                              <span className="absolute left-full ml-2 text-[8px] font-black whitespace-nowrap" style={{ color }}>{dist}mm</span>
                           </div>
                         );
                       })}
                    </div>
                  )}
               </div>
            </div>

            <div className="absolute bottom-6 left-6 right-6 flex justify-between z-20">
               <div className="bg-white/80 p-4 rounded-xl border border-gray-100 shadow-sm backdrop-blur-sm">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">{t('Stationary Phase', '固定相', '固定相')}</span>
                  <span className="text-sm font-black text-gray-800">{t('Filter Paper', '滤纸', '濾紙')}</span>
               </div>
               <div className="bg-white/80 p-4 rounded-xl border border-gray-100 shadow-sm backdrop-blur-sm text-right">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">{t('Mobile Phase', '流动相', '流動相')}</span>
                  <span className="text-sm font-black text-blue-600">{t('Solvent', '溶剂', '溶劑')}</span>
               </div>
            </div>
          </div>

          <div className="space-y-8">
             <div className="bg-gray-50 p-8 rounded-[2.5rem] border-2 border-gray-100 shadow-inner">
                <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 border-b pb-4">{t('Select Dye Sample', '选择染料样本', '選擇染料樣本')}</h4>
                <div className="grid grid-cols-2 gap-4 mb-8">
                   {(Object.keys(dyes) as Array<keyof typeof dyes>).map(key => (
                     <button 
                       key={key}
                       onClick={() => { setSelectedDye(key); reset(); }}
                       className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between group h-16 ${selectedDye === key ? 'border-purple-500 bg-white shadow-md ring-2 ring-purple-100' : 'border-gray-200 hover:border-purple-200 bg-transparent opacity-70 hover:opacity-100'}`}
                     >
                       <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full flex shadow-sm overflow-hidden border border-black/10`}>
                             {dyes[key].colors.map((c, idx) => (
                               <div key={idx} className="flex-1" style={{ backgroundColor: c }} />
                             ))}
                          </div>
                          <span className="text-xs font-black uppercase tracking-tight">{dyes[key].name}</span>
                       </div>
                       {dyes[key].type === 'mixture' && (
                         <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-black">{t('MIX', '混', '混')}</span>
                       )}
                     </button>
                   ))}
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <button 
                     onClick={() => setIsRunning(true)}
                     disabled={isRunning || progress >= 100}
                     className="bg-purple-600 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-[0_5px_0_0_#581c87] active:shadow-none active:translate-y-1 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                   >
                     <Play size={16} fill="currentColor" />
                     {t('Run', '运行', '運行')}
                   </button>
                   <button 
                     onClick={reset}
                     className="bg-white text-gray-400 border-2 border-gray-200 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-50 transition-all flex items-center justify-center gap-3 shadow-sm active:translate-y-0.5"
                   >
                     <RefreshCcw size={16} />
                     {t('Reset', '重置', '重置')}
                   </button>
                </div>
             </div>

             <AnimatePresence>
               {progress >= 100 && (
                 <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white p-8 rounded-[2.5rem] border-2 border-purple-100 shadow-2xl shadow-purple-500/10"
                 >
                    <div className="flex justify-between items-center mb-8 border-b pb-4">
                       <h4 className="text-sm font-black text-purple-600 uppercase tracking-widest">{t('Rf Value Analysis', 'Rf 值分析', 'Rf 值分析')}</h4>
                       <button 
                        onClick={() => setShowRf(!showRf)}
                        className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-sm ${showRf ? 'bg-purple-600 text-white shadow-purple-200' : 'bg-purple-50 text-purple-600 border border-purple-100'}`}
                       >
                         {showRf ? t('Hide Data', '隐藏数据', '隱藏數據') : t('Show Data', '显示数据', '顯示數據')}
                       </button>
                    </div>

                    <div className="space-y-6">
                       <div className="p-6 bg-purple-50/50 rounded-3xl font-sans text-xs border border-purple-100 leading-relaxed shadow-inner">
                          <div className="text-purple-900 font-black mb-4 flex items-center gap-2">
                             <div className="w-1.5 h-4 bg-purple-400 rounded-full" />
                             Rf = {t('Dist. Solute / Dist. Solvent', '溶质距离 / 溶剂距离', '溶質距離 / 溶劑距離')}
                          </div>
                          <div className="space-y-3">
                             {dyes[selectedDye].colors.map((color, i) => {
                               const rf = dyes[selectedDye].rf[i];
                               const solubility = rf > 0.7 ? t('High', '高', '高') : rf > 0.4 ? t('Medium', '中', '中') : t('Low', '低', '低');
                               return (
                                 <div key={i} className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-purple-100">
                                    <div className="flex items-center gap-3">
                                       <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: color }} />
                                       <div className="flex flex-col">
                                         <span className="font-black text-gray-800 tracking-tight">{t('Spot', '斑点', '斑點')} {i + 1}</span>
                                         <span className="text-[10px] font-bold text-gray-400">{t('Solubility:', '溶解度:', '溶解度:')} {solubility}</span>
                                       </div>
                                    </div>
                                    <div className="text-right">
                                       <span className="font-black text-purple-700 block text-sm">{rf.toFixed(2)}</span>
                                       <span className="text-[8px] font-bold text-gray-400 uppercase">{Math.round(70 * rf)}mm / 70mm</span>
                                    </div>
                                 </div>
                               );
                             })}
                          </div>
                       </div>
                       
                       <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                          {t('More soluble substances travel FURTHER. mixtures show multiple spots, while pure substances show only ONE.', '溶解度越大的物质移动距离越远。混合物显示多个斑点，而纯净物只显示一个。', '溶解度越大的物質移動距離越遠。混合物顯示多個斑點，而純淨物只顯示一個。')}
                       </p>
                    </div>
                 </motion.div>
               )}
             </AnimatePresence>

             {!isRunning && progress === 0 && (
               <div className="bg-blue-50/50 p-8 rounded-[2rem] border-2 border-blue-100 flex items-start gap-5 shadow-sm backdrop-blur-sm">
                  <div className="bg-blue-500 p-3 rounded-2xl text-white shadow-lg shadow-blue-500/20">
                    <Info size={20} />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-black text-blue-700 uppercase tracking-widest">{t('Lab Tip', '实验室贴士', '實驗室貼士')}</span>
                    <p className="text-xs font-semibold text-blue-800 leading-relaxed">
                      {t('A PENCIL line is used because graphite is INSOLUBLE. If you use ink, it will separate and interfere with the experiment.', '之所以使用铅笔线，是因为石墨是不溶的。如果使用墨水，它会分离并干扰实验。', '之所以使用鉛筆線，是因為石墨是不溶的。如果使用墨水，它會分離並干擾實驗。')}
                    </p>
                  </div>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Metadata for sorting
(PaperChromatographyCard as any).UNIT = 2;
(PaperChromatographyCard as any).SUBJECT = 'CHEMISTRY';

export default PaperChromatographyCard;
