import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCcw, Droplets, FlaskConical, Activity, Zap, Shield, Target } from 'lucide-react';

interface BloodCompositionCardProps {
  chineseType?: 'traditional' | 'simplified' | null;
}

const BloodCompositionCard: React.FC<BloodCompositionCardProps> = ({ chineseType }) => {
  const [stage, setStage] = useState<'initial' | 'spinning' | 'separated'>('initial');
  const [selectedCell, setSelectedCell] = useState<'wbc' | 'platelets' | 'rbc' | null>(null);
  const [wbcType, setWbcType] = useState<'phagocyte' | 'lymphocyte' | null>(null);

  const t = (en: string, sc: string, tc: string) => {
    if (chineseType === 'simplified') return sc;
    if (chineseType === 'traditional') return tc;
    return en;
  };

  const startCentrifuge = () => {
    setStage('spinning');
    setTimeout(() => {
      setStage('separated');
    }, 3000);
  };

  const reset = () => {
    setStage('initial');
    setSelectedCell(null);
    setWbcType(null);
  };

  return (
    <div className="bg-white rounded-[2rem] border-2 border-gray-100 shadow-xl overflow-hidden w-full">
      <div className="bg-gradient-to-r from-red-50 to-emerald-50 p-6 border-b-2 border-gray-100">
        <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-3">
          <Droplets className="text-red-500" />
          {t('Composition of Blood', '血液的组成', '血液的組成')}
        </h3>
        <p className="text-gray-500 font-bold text-sm mt-1">
          {t('Explore the components of blood and how they can be separated using a centrifuge.', '探索血液的组成部分以及如何使用离心机分离它们。', '探索血液的組成部分以及如何使用離心機分離它們。')}
        </p>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Simulation Area */}
          <div className="relative flex flex-col items-center">
            <div className="w-full aspect-square bg-gray-50 rounded-[3rem] border-4 border-gray-100 flex flex-col items-center justify-center relative overflow-hidden">
              <AnimatePresence mode="wait">
                {stage === 'initial' && (
                  <motion.div
                    key="initial"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    className="flex flex-col items-center gap-6"
                  >
                    <div className="w-16 h-48 bg-white border-4 border-gray-200 rounded-b-full rounded-t-xl relative overflow-hidden shadow-sm">
                      <div className="absolute inset-0 bg-red-500 opacity-80" />
                      <div className="absolute top-0 w-full h-4 bg-gray-200 border-b-2 border-gray-300" />
                    </div>
                    <button
                      onClick={startCentrifuge}
                      className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-[0_4px_0_0_#059669] hover:translate-y-[-2px] active:translate-y-1 active:shadow-none transition-all flex items-center gap-2"
                    >
                      <RefreshCcw size={20} />
                      {t('Start Centrifuge', '开始离心', '開始離心')}
                    </button>
                  </motion.div>
                )}

                {stage === 'spinning' && (
                  <motion.div
                    key="spinning"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-8"
                  >
                    <motion.div
                      animate={{ rotate: 360 * 5 }}
                      transition={{ duration: 3, ease: "easeInOut" }}
                      className="relative"
                    >
                      {[0, 120, 240].map((angle) => (
                        <div
                          key={angle}
                          style={{
                            transform: `rotate(${angle}deg) translateY(-80px)`,
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            marginLeft: '-12px',
                            marginTop: '-40px'
                          }}
                          className="w-6 h-24 bg-white border-2 border-gray-200 rounded-b-full rounded-t-lg overflow-hidden flex flex-col"
                        >
                          <motion.div 
                            animate={{ opacity: [1, 0.5, 1] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                            className="flex-1 bg-red-400" 
                          />
                        </div>
                      ))}
                    </motion.div>
                    <div className="text-gray-400 font-black uppercase tracking-widest text-xs animate-pulse">
                      {t('Separating Components...', '正在分离成分...', '正在分離成分...')}
                    </div>
                  </motion.div>
                )}

                {stage === 'separated' && (
                  <motion.div
                    key="separated"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-8 w-full max-w-sm"
                  >
                    <div className="flex gap-12 items-end h-64">
                      {/* Separated Tube */}
                      <div className="w-20 h-56 bg-white border-4 border-gray-200 rounded-b-full rounded-t-xl relative overflow-hidden flex flex-col shadow-xl">
                        {/* Plasma */}
                        <motion.div 
                          initial={{ height: '0%' }}
                          animate={{ height: '55%' }}
                          className="bg-yellow-100 relative group cursor-pointer border-b border-yellow-200"
                          onClick={() => setSelectedCell(null)} 
                        >
                           <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-yellow-200/20">
                             <span className="text-[8px] font-black uppercase text-yellow-700">Plasma</span>
                           </div>
                        </motion.div>
                        {/* Buffy Coat (WBC + Platelets) */}
                        <motion.div 
                          initial={{ height: '0%' }}
                          animate={{ height: '5%' }}
                          className="bg-gray-100 border-y border-gray-200 relative group cursor-pointer"
                        />
                        {/* RBC Pellet */}
                        <motion.div 
                          initial={{ height: '0%' }}
                          animate={{ height: '40%' }}
                          className="bg-red-700 relative group cursor-pointer"
                        />
                      </div>

                      {/* Labels and Interaction */}
                      <div className="flex-1 flex flex-col gap-4">
                        <motion.button
                          whileHover={{ x: 5 }}
                          className="text-left group"
                          onClick={() => setSelectedCell(null)}
                        >
                          <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">{t('Plasma (55%)', '血浆 (55%)', '血漿 (55%)')}</span>
                          <p className="text-[9px] font-bold text-gray-500">{t('Mainly water, contains proteins & nutrients.', '主要为水，包含蛋白质和营养物质。', '主要為水，包含蛋白質和營養物質。')}</p>
                        </motion.button>
                        
                        <div className="h-px bg-gray-100" />

                        <div className="space-y-4">
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('Formed Elements (45%)', '有形成分 (45%)', '有形成分 (45%)')}</p>
                           
                           <button 
                             onClick={() => setSelectedCell('rbc')}
                             className={`w-full p-3 rounded-xl border-2 transition-all text-left ${selectedCell === 'rbc' ? 'border-red-500 bg-red-50' : 'border-gray-50 hover:bg-gray-50'}`}
                           >
                             <div className="flex items-center gap-2 mb-1">
                               <div className="w-2 h-2 bg-red-500 rounded-full" />
                               <span className="text-xs font-black uppercase">{t('Red Blood Cells', '红细胞', '紅細胞')}</span>
                             </div>
                             <p className="text-[9px] text-gray-500 font-medium">{t('Transport oxygen using hemoglobin.', '利用血红蛋白运输氧气。', '利用血紅蛋白運輸氧氣。')}</p>
                           </button>

                           <button 
                             onClick={() => setSelectedCell('wbc')}
                             className={`w-full p-3 rounded-xl border-2 transition-all text-left ${selectedCell === 'wbc' ? 'border-blue-500 bg-blue-50' : 'border-gray-50 hover:bg-gray-50'}`}
                           >
                             <div className="flex items-center gap-2 mb-1">
                               <div className="w-2 h-2 bg-blue-500 rounded-full" />
                               <span className="text-xs font-black uppercase">{t('White Blood Cells', '白细胞', '白細胞')}</span>
                             </div>
                             <p className="text-[9px] text-gray-500 font-medium">{t('Part of the immune system.', '免疫系统的一部分。', '免疫系統的一部分。')}</p>
                           </button>

                           <button 
                             onClick={() => setSelectedCell('platelets')}
                             className={`w-full p-3 rounded-xl border-2 transition-all text-left ${selectedCell === 'platelets' ? 'border-orange-500 bg-orange-50' : 'border-gray-50 hover:bg-gray-50'}`}
                           >
                             <div className="flex items-center gap-2 mb-1">
                               <div className="w-2 h-2 bg-orange-500 rounded-full" />
                               <span className="text-xs font-black uppercase">{t('Platelets', '血小板', '血小板')}</span>
                             </div>
                             <p className="text-[9px] text-gray-500 font-medium">{t('Involved in blood clotting.', '参与血液凝固。', '參與血液凝固。')}</p>
                           </button>
                        </div>
                      </div>
                    </div>

                    <button onClick={reset} className="flex items-center gap-2 text-xs font-black text-gray-400 hover:text-gray-600 transition-colors">
                      <RefreshCcw size={14} />
                      {t('Reset Simulation', '重置模拟', '重置模擬')}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Details / Interactive Animation Area */}
          <div className="min-h-[400px]">
            <AnimatePresence mode="wait">
              {!selectedCell ? (
                 <motion.div 
                   key="no-selection"
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: -20 }}
                   className="h-full flex flex-col items-center justify-center text-center p-8 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200"
                 >
                   <FlaskConical size={48} className="text-gray-300 mb-4" />
                   <p className="text-gray-400 font-bold">
                     {stage === 'separated' 
                       ? t('Select a component to learn more about its function.', '选择一个成分以了解更多关于其功能的信息。', '選擇一個成分以瞭解更多關於其功能的信息。')
                       : t('Start the centrifuge to separate blood components.', '启动离心机以分离血液成分。', '啟動離心機以分離血液成分。')}
                   </p>
                 </motion.div>
              ) : selectedCell === 'rbc' ? (
                <motion.div 
                  key="rbc-detail"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-red-50 p-8 rounded-[2.5rem] border-2 border-red-100 h-full"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="bg-white p-3 rounded-2xl shadow-sm">
                      <Activity className="text-red-500" />
                    </div>
                    <h4 className="text-xl font-black text-red-700 uppercase tracking-tight">{t('Red Blood Cells', '红细胞', '紅細胞')}</h4>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-white/60 p-6 rounded-2xl border border-red-100 flex items-center justify-center py-12 relative overflow-hidden">
                       <motion.div 
                         animate={{ rotate: 360 }}
                         transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                         className="grid grid-cols-2 gap-4"
                       >
                         {[...Array(4)].map((_, i) => (
                           <motion.div 
                             key={i}
                             animate={{ scale: [1, 1.1, 1] }}
                             transition={{ duration: 2, delay: i * 0.5, repeat: Infinity }}
                             className="w-16 h-8 bg-red-500 rounded-full border-2 border-red-700 shadow-lg flex items-center justify-center text-[6px] font-black text-white/40"
                           >
                             RBC
                           </motion.div>
                         ))}
                       </motion.div>
                    </div>
                    <p className="text-sm font-bold text-red-800 leading-relaxed">
                      {t('Erythrocytes contain hemoglobin, which binds to oxygen in the lungs and releases it into body tissues.', '红细胞含有血红蛋白，它在肺部与氧气结合，并将其释放到身体组织中。', '紅細胞含有血紅蛋白，它在肺部與氧氣結合，並將其釋放到身體組織中。')}
                    </p>
                  </div>
                </motion.div>
              ) : selectedCell === 'platelets' ? (
                <motion.div 
                  key="platelets-detail"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-orange-50 p-8 rounded-[2.5rem] border-2 border-orange-100 h-full overflow-hidden"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="bg-white p-3 rounded-2xl shadow-sm">
                      <Zap className="text-orange-500" />
                    </div>
                    <h4 className="text-xl font-black text-orange-700 uppercase tracking-tight">{t('Platelets', '血小板', '血小板')}</h4>
                  </div>
                  
                  <div className="relative h-48 bg-white/60 rounded-3xl border border-orange-100 flex items-center justify-center mb-6 overflow-hidden">
                    <div className="absolute top-1/2 left-0 w-full h-12 bg-red-100/50 -translate-y-1/2 overflow-hidden">
                       <motion.div 
                         animate={{ x: [-100, 400] }}
                         transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                         className="flex gap-4 items-center h-full"
                       >
                         {[...Array(10)].map((_, i) => <div key={i} className="w-4 h-2 bg-red-400/30 rounded-full" />)}
                       </motion.div>
                       
                       <div className="absolute top-0 right-1/4 w-12 h-2 bg-orange-50 border-x border-orange-200" />
                       
                       <motion.div 
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         transition={{ delay: 1 }}
                         className="absolute top-0 right-1/4 w-12 h-2 flex flex-wrap gap-1 p-0.5"
                       >
                          {[...Array(6)].map((_, i) => (
                            <motion.div 
                              key={i}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 1 + (i * 0.2) }}
                              className="w-2 h-1 bg-orange-400 rounded-full"
                            />
                          ))}
                       </motion.div>
                    </div>
                    <div className="absolute top-2 left-4 text-[8px] font-black text-orange-400 uppercase tracking-widest">{t('Blood Clotting Simulation', '血液凝固模拟', '血液凝固模擬')}</div>
                  </div>
                  
                  <ul className="space-y-4">
                    <li className="flex gap-3">
                      <div className="bg-orange-200 p-1.5 rounded-lg h-fit"><Shield className="text-orange-700" size={14} /></div>
                      <p className="text-xs font-bold text-orange-800 leading-relaxed">
                        {t('Prevents excessive blood loss by forming clots at injury sites.', '通过在受伤部位形成血块来防止过度失血。', '通過在受傷部位形成血塊來防止過度失血。')}
                      </p>
                    </li>
                    <li className="flex gap-3">
                      <div className="bg-orange-200 p-1.5 rounded-lg h-fit"><Shield className="text-orange-700" size={14} /></div>
                      <p className="text-xs font-bold text-orange-800 leading-relaxed">
                        {t('Forms a barrier to prevent pathogen entry through open wounds.', '形成屏障以防止病原体通过开放性伤口进入。', '形成屏障以防止病原體通過開放性傷口進入。')}
                      </p>
                    </li>
                  </ul>
                </motion.div>
              ) : (
                <motion.div 
                  key="wbc-detail"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-blue-50 p-8 rounded-[2.5rem] border-2 border-blue-100 h-full flex flex-col"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="bg-white p-3 rounded-2xl shadow-sm">
                      <Shield className="text-blue-500" />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-blue-700 uppercase tracking-tight">{t('White Blood Cells', '白细胞', '白細胞')}</h4>
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{t('Immune System Defense', '免疫系统防御', '免疫系統防禦')}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <button 
                      onClick={() => setWbcType('phagocyte')}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${wbcType === 'phagocyte' ? 'bg-white border-blue-500 shadow-lg' : 'bg-white/60 border-transparent hover:bg-white'}`}
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        <Target size={20} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-center">{t('Phagocytes', '吞噬细胞', '吞噬細胞')}</span>
                    </button>
                    <button 
                      onClick={() => setWbcType('lymphocyte')}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${wbcType === 'lymphocyte' ? 'bg-white border-blue-500 shadow-lg' : 'bg-white/60 border-transparent hover:bg-white'}`}
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        <Zap size={20} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-center">{t('Lymphocytes', '淋巴细胞', '淋巴細胞')}</span>
                    </button>
                  </div>

                  <div className="flex-1 bg-white/60 rounded-3xl border border-blue-100 p-6 relative overflow-hidden">
                    <AnimatePresence mode="wait">
                      {!wbcType ? (
                        <motion.div 
                          key="select-wbc"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="h-full flex items-center justify-center text-center text-[10px] font-black text-blue-400 uppercase tracking-widest"
                        >
                          {t('Select a WBC type to see its action', '选择白细胞类型以查看其动作', '選擇白細胞類型以查看其動作')}
                        </motion.div>
                      ) : wbcType === 'phagocyte' ? (
                        <motion.div 
                          key="phagocyte-active"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="h-full flex flex-col items-center justify-around"
                        >
                           <div className="relative w-full h-32 flex items-center justify-center">
                              <motion.div 
                                animate={{ 
                                  borderRadius: ["50%", "40% 60% 40% 60%", "60% 40% 60% 40%", "50%"],
                                  x: [0, 40, 0]
                                }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="w-16 h-16 bg-blue-400/20 border-4 border-blue-300 relative"
                              >
                                 <div className="absolute inset-2 bg-blue-500/20 rounded-full blur-sm" />
                              </motion.div>
                              <motion.div 
                                animate={{ x: [80, 20], opacity: [1, 1, 0, 0] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="w-4 h-4 bg-emerald-500 rounded-full border-2 border-emerald-700"
                              />
                           </div>
                           <p className="text-[10px] font-bold text-blue-800 text-center leading-relaxed">
                             {t('Phagocytes engulf and digest pathogens through a process called phagocytosis.', '吞噬细胞通过一个叫做吞噬作用的过程来吞噬和消化病原体。', '吞噬細胞通過一個叫做吞噬作用的過程來吞噬和消化病原體。')}
                           </p>
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="lymphocyte-active"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="h-full flex flex-col items-center justify-around"
                        >
                           <div className="relative w-full h-32 flex items-center justify-center">
                              <motion.div 
                                className="w-16 h-16 bg-blue-100 border-4 border-blue-400 rounded-full flex items-center justify-center"
                              >
                                 <Zap className="text-blue-500" size={24} />
                              </motion.div>
                              {[...Array(5)].map((_, i) => (
                                <motion.div
                                  key={i}
                                  initial={{ x: 0, y: 0, opacity: 0 }}
                                  animate={{ x: 80, y: (i - 2) * 20, opacity: [0, 1, 0] }}
                                  transition={{ duration: 2, delay: i * 0.4, repeat: Infinity }}
                                  className="absolute text-blue-500 font-bold"
                                >
                                  Y
                                </motion.div>
                              ))}
                              <div className="absolute right-4 space-y-4">
                                <motion.div animate={{ scale: [1, 0.8, 1] }} transition={{ repeat: Infinity }} className="w-6 h-6 bg-red-400 rounded-full border-2 border-red-600 relative">
                                   <div className="absolute -top-2 -right-2 text-[8px] font-bold text-blue-600">Y</div>
                                </motion.div>
                              </div>
                           </div>
                           <p className="text-[10px] font-bold text-blue-800 text-center leading-relaxed">
                             {t('Lymphocytes produce specific antibodies that neutralize pathogens or mark them for destruction.', '淋巴细胞产生特定的抗体，这些抗体可以中和病原体，或将其标记为待销毁。', '淋巴細胞產生特定的抗體，這些抗體可以中和病原體，或將其標記為待銷毀。')}
                           </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

// Metadata for sorting
(BloodCompositionCard as any).UNIT = 1;
(BloodCompositionCard as any).SUBJECT = 'BIOLOGY';

export default BloodCompositionCard;
