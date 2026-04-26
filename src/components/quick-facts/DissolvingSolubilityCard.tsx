import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Beaker, RefreshCcw } from 'lucide-react';

interface DissolvingSolubilityCardProps {
  chineseType?: 'traditional' | 'simplified' | null;
}

const DissolvingSolubilityCard: React.FC<DissolvingSolubilityCardProps> = ({ chineseType }) => {
  const [solute, setSolute] = useState<'sugar' | 'salt' | 'sand' | 'gold' | null>(null);
  const [added, setAdded] = useState(false);
  const [stirring, setStirring] = useState(false);
  
  const [concentrationSolute, setConcentrationSolute] = useState<'potassium' | 'copper' | 'iron'>('potassium');
  const [concAmount, setConcAmount] = useState(1);
  
  const [saturationAmount, setSaturationAmount] = useState(0); 

  const t = (en: string, sc: string, tc: string) => {
    if (chineseType === 'simplified') return sc;
    if (chineseType === 'traditional') return tc;
    return en;
  };

  const substances = {
    sugar: { name: t('Sugar', '糖', '糖'), solution: t('Sugar Solution', '糖溶液', '糖溶液'), soluble: true, color: 'bg-white/80' },
    salt: { name: t('Salt', '盐', '鹽'), solution: t('Salt Solution', '盐溶液', '鹽溶液'), soluble: true, color: 'bg-white/90' },
    sand: { name: t('Sand', '沙子', '沙子'), solution: t('Mix', '混合物', '混合物'), soluble: false, color: 'bg-orange-200' },
    gold: { name: t('Gold', '金子', '金子'), solution: t('Mix', '混合物', '混合物'), soluble: false, color: 'bg-yellow-400' },
  };

  const concSubstances = {
    potassium: { name: t('Potassium Permanganate', '高锰酸钾', '高錳酸鉀'), color: 'bg-purple-600', solutionColor: 'rgba(147, 51, 234, 0.4)' },
    copper: { name: t('Copper Sulfate', '硫酸铜', '硫酸銅'), color: 'bg-blue-500', solutionColor: 'rgba(59, 130, 246, 0.4)' },
    iron: { name: t('Iron Sulfate', '硫酸亚铁', '硫酸亞鐵'), color: 'bg-emerald-500', solutionColor: 'rgba(16, 185, 129, 0.4)' },
  };

  const handleAdd = () => {
    setAdded(true);
    setStirring(true);
    setTimeout(() => setStirring(false), 2000);
  };

  const resetSolubility = () => {
    setSolute(null);
    setAdded(false);
  };

  return (
    <div className="bg-white rounded-[2rem] border-2 border-gray-100 shadow-xl overflow-hidden w-full">
      <div className="bg-gradient-to-r from-blue-50 to-emerald-50 p-6 border-b-2 border-gray-100">
        <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-3">
          <Beaker className="text-blue-500" />
          {t('Dissolving & Solubility', '溶解与溶解度', '溶解與溶解度')}
        </h3>
        <p className="text-gray-500 font-bold text-sm mt-1">
          {t('Explore how substances mix with water and how concentration affects solutions.', '探索物质如何与水混合，以及浓度如何影响溶液。', '探索物質如何與水混合，以及濃度如何影響溶液。')}
        </p>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {/* Section 1: Dissolution Simulator */}
          <div className="space-y-6 bg-blue-50/30 p-6 rounded-[2.5rem] border-2 border-blue-100 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Part 1</span>
                <h4 className="text-lg font-black text-gray-800 uppercase">{t('Dissolution', '溶解过程', '溶解過程')}</h4>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-6">
                {Object.keys(substances).map((key) => (
                  <button
                    key={key}
                    disabled={stirring}
                    onClick={() => { setSolute(key as any); setAdded(false); }}
                    className={`p-3 rounded-xl border-2 transition-all text-left flex items-center gap-2 ${solute === key ? 'border-blue-500 bg-white shadow-sm' : 'border-gray-50 bg-white/50 hover:bg-white'}`}
                  >
                    <div className={`w-4 h-4 rounded shadow-inner ${substances[key as keyof typeof substances].color}`} />
                    <span className="font-black text-[9px] uppercase tracking-wider">{substances[key as keyof typeof substances].name}</span>
                  </button>
                ))}
              </div>

              <div className="relative h-56 bg-white rounded-3xl border-2 border-blue-100 overflow-hidden flex items-center justify-center shadow-inner">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-50/20 to-blue-200/20" />
                
                <AnimatePresence mode="wait">
                  {!solute ? (
                    <motion.div key="empty" className="text-[10px] font-black text-blue-300 uppercase tracking-widest animate-pulse">{t('Select solute', '选择溶质', '選擇溶質')}</motion.div>
                  ) : !added ? (
                    <motion.div 
                      key="hover"
                      initial={{ y: -100, opacity: 0 }}
                      animate={{ y: -60, opacity: 1 }}
                      transition={{ type: "spring", bounce: 0.4 }}
                      className={`w-16 h-16 rounded-2xl border-4 border-gray-200/50 shadow-2xl ${substances[solute].color}`}
                    />
                  ) : (
                    <motion.div key="added" className="absolute inset-0 flex items-center justify-center">
                      {substances[solute].soluble ? (
                        <div className="relative w-full h-full flex items-center justify-center">
                          {[...Array(stirring ? 32 : 1)].map((_, i) => (
                            <motion.div
                              key={i}
                              initial={stirring ? { x: 0, y: 0, scale: 1 } : { scale: 1.5 }}
                              animate={stirring ? {
                                x: (Math.random() - 0.5) * 180,
                                y: (Math.random() - 0.5) * 180,
                                scale: [1.2, 0.6, 0],
                                opacity: [1, 1, 0]
                              } : { scale: 1 }}
                              transition={{ 
                                duration: 2.5, 
                                ease: "easeOut", 
                                delay: i * 0.03,
                                repeat: 0
                              }}
                              className={`absolute ${stirring ? 'w-2 h-2' : 'w-12 h-12'} rounded-sm ${substances[solute].color} border border-white/50 shadow-sm`}
                            />
                          ))}
                        </div>
                      ) : (
                        <motion.div 
                          initial={{ y: -100, rotate: 0 }}
                          animate={{ y: 70, rotate: [0, 5, -5, 0] }}
                          transition={{ 
                            y: { type: "spring", stiffness: 40, damping: 20 },
                            rotate: { delay: 1, duration: 0.5, repeat: stirring ? Infinity : 0 }
                          }}
                          className={`w-14 h-14 rounded-2xl flex items-center justify-center border-4 border-gray-200/50 shadow-xl ${substances[solute].color}`}
                        >
                          {stirring && (
                            <motion.div 
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ repeat: Infinity, duration: 0.5 }}
                              className="text-white font-black text-[9px] opacity-60 uppercase tracking-tighter"
                            >{t('Intact', '完整', '完整')}</motion.div>
                          )}
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {added && !stirring && solute && substances[solute]?.soluble && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-4 inset-x-4 bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-blue-100 shadow-md text-center"
                  >
                    <div className="flex items-center justify-center gap-1.5 text-[9px] font-black uppercase tracking-tight text-gray-700">
                      <span className="text-blue-600">{substances[solute].name}</span>
                      <span>+</span>
                      <span className="text-blue-400">{t('Water', '水', '水')}</span>
                      <span>→</span>
                      <span className="text-emerald-500">{substances[solute].solution}</span>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            <div className="space-y-3 pt-6">
              <button
                disabled={!solute || stirring}
                onClick={handleAdd}
                className="w-full py-4 rounded-2xl bg-blue-500 text-white font-black text-sm uppercase tracking-widest shadow-[0_4px_0_0_#2563eb] hover:bg-blue-600 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:shadow-none"
              >
                {added ? t('Stir Again', '再次搅拌', '再次攪拌') : t('Dissolve it!', '开始溶解!', '開始溶解!')}
              </button>
              
              {added && (
                <button onClick={resetSolubility} className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest text-center hover:text-gray-600 flex items-center justify-center gap-2">
                  <RefreshCcw size={12} /> {t('Reset', '重置', '重置')}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-6 bg-purple-50/30 p-6 rounded-[2.5rem] border-2 border-purple-100 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Part 2</span>
                <h4 className="text-lg font-black text-gray-800 uppercase">{t('Light Absorbtion', '光的吸收', '光的吸收')}</h4>
              </div>

              <div className="flex gap-2 mb-6">
                {(Object.keys(concSubstances) as (keyof typeof concSubstances)[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => setConcentrationSolute(key)}
                    className={`flex-1 p-2 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${concentrationSolute === key ? 'border-purple-500 bg-white shadow-sm' : 'border-gray-50 bg-white/50 hover:bg-white'}`}
                  >
                    <div className={`w-5 h-5 rounded-full ${concSubstances[key].color} shadow-inner`} />
                    <span className="text-[8px] font-black uppercase text-center leading-tight">
                      {concSubstances[key].name.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>

              <div className="relative h-56 bg-gray-900 rounded-3xl border-2 border-purple-100 overflow-hidden flex items-center justify-center shadow-2xl">
                <div 
                  className="absolute inset-0 transition-all duration-500"
                  style={{ 
                    backgroundColor: concSubstances[concentrationSolute].solutionColor,
                    opacity: concAmount / 100 + 0.15
                  }}
                />
                
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-10 bg-gray-800 rounded-r-2xl border-r-4 border-yellow-400/50 shadow-[4px_0_15px_rgba(250,204,21,0.3)] z-20" />
                
                <motion.div 
                  animate={{ 
                    opacity: Math.max(0.05, 1 - (concAmount / 85)),
                    boxShadow: `0 0 ${20 + (100 - concAmount) / 5}px rgba(250, 204, 21, 0.4)`
                  }}
                  className="absolute left-6 top-1/2 -translate-y-1/2 h-5 bg-gradient-to-r from-yellow-100/40 via-yellow-200/20 to-transparent blur-[2px] origin-left z-10"
                  style={{ width: '130%' }}
                />
                
                <div className="absolute top-3 right-3 text-[9px] font-black text-white/50 uppercase tracking-widest">{t('Transmittance', '透光度', '透光度')}</div>
              </div>
            </div>

            <div className="space-y-4 pt-6">
              <div>
                <div className="flex justify-between mb-3 items-center">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('Concentration', '浓度', '濃度')}</span>
                  <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded-lg text-[10px] font-black">{concAmount}%</span>
                </div>
                <input 
                  type="range" min="1" max="100" value={concAmount}
                  onChange={(e) => setConcAmount(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
              <p className="text-[10px] font-bold text-gray-500 leading-tight bg-white/50 p-3 rounded-xl border border-purple-50 italic">
                "{t('Particles absorb light. The more solute, the less light passes through.', '微粒会吸收光。溶质越多，透过的光就越少。', '微粒會吸收光。溶質越多，透過的光就越少。')}"
              </p>
            </div>
          </div>

          <div className="space-y-6 bg-emerald-50/30 p-6 rounded-[2.5rem] border-2 border-emerald-100 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Part 3</span>
                <h4 className="text-lg font-black text-gray-800 uppercase">{t('Saturation Limit', '溶解度极限', '溶解度極限')}</h4>
              </div>

              <div className="relative h-56 bg-white rounded-3xl border-2 border-emerald-100 overflow-hidden flex items-center justify-center shadow-inner">
                  <div 
                    className="absolute bottom-0 w-full transition-all duration-500" 
                    style={{ 
                      backgroundColor: 'rgba(16, 185, 129, 0.8)', 
                      height: saturationAmount > 0 ? '80%' : '0%',
                      opacity: (saturationAmount / 160) + 0.2
                    }} 
                  />
                  
                  {saturationAmount > 80 && (
                    <div className="absolute bottom-0 w-full h-10 flex flex-wrap gap-1.5 justify-center items-end p-2 z-20">
                      {[...Array(Math.floor((saturationAmount - 80) / 3) + 2)].map((_, i) => (
                        <motion.div 
                          key={i} 
                          initial={{ y: -30, opacity: 0, rotate: 0 }}
                          animate={{ y: 0, opacity: 1, rotate: Math.random() * 45 }}
                          transition={{ type: "spring", delay: i * 0.05 }}
                          className="w-3 h-1.5 bg-emerald-800 rounded-sm shadow-sm" 
                        />
                      ))}
                    </div>
                  )}
                  
                  <AnimatePresence>
                    {saturationAmount === 0 && (
                      <motion.span 
                        key="pure"
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="text-[10px] font-black text-blue-200 uppercase tracking-[1em] vertical-text"
                      >{t('Pure', '纯净', '純淨')}</motion.span>
                    )}
                  </AnimatePresence>

                  <div className="absolute top-3 right-3 text-[9px] font-black text-emerald-600/30 uppercase tracking-widest">{t('Beaker', '烧杯', '燒杯')}</div>
              </div>
            </div>

            <div className="space-y-4 pt-6">
              <div>
                <div className="flex justify-between mb-3 items-center">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('Solute Mass', '溶质质量', '溶質質量')}</span>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${saturationAmount > 80 ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {saturationAmount > 80 ? t('Saturated', '饱和', '飽和') : t('Dissolving', '溶解中', '溶解中')}
                  </span>
                </div>
                <input 
                  type="range" min="0" max="100" value={saturationAmount}
                  onChange={(e) => setSaturationAmount(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
              <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                <p className="text-[10px] font-bold text-gray-600 leading-tight">
                  {saturationAmount > 80 
                    ? t('Excess crystals cannot dissolve and settle.', '多余的晶体无法溶解，沉入底部。', '多餘的晶體無法溶解，沈入底部。')
                    : t('Water has enough space to hold these particles.', '水有足够的空间可以容纳 these 微粒。', '水有足夠的空間可以容納 these 微粒。')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Metadata for sorting
(DissolvingSolubilityCard as any).UNIT = 2;
(DissolvingSolubilityCard as any).SUBJECT = 'CHEMISTRY';

export default DissolvingSolubilityCard;
