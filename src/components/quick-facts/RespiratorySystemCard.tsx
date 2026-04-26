import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Activity, ArrowRight, ArrowLeft, ArrowDown, ArrowUp, Info, Droplets } from 'lucide-react';

interface RespiratorySystemCardProps {
  chineseType?: 'traditional' | 'simplified' | null;
}

const RespiratorySystemCard: React.FC<RespiratorySystemCardProps> = ({ chineseType }) => {
  const [isInhaling, setIsInhaling] = useState(true);
  const [showDetail, setShowDetail] = useState(false);

  const t = (en: string, sc: string, tc: string) => {
    if (chineseType === 'simplified') return sc;
    if (chineseType === 'traditional') return tc;
    return en;
  };

  const pathway = [
    { id: 'atmosphere', label: t('Atmosphere', '大气', '大氣'), color: 'bg-blue-100' },
    { id: 'nose', label: t('Nose', '鼻腔', '鼻腔'), color: 'bg-orange-100' },
    { id: 'trachea', label: t('Windpipe (Trachea)', '气管', '氣管'), color: 'bg-gray-100' },
    { id: 'bronchi', label: t('Bronchi', '支气管', '支氣管'), color: 'bg-gray-200' },
    { id: 'bronchiole', label: t('Bronchiole', '小支气管', '小支氣管'), color: 'bg-gray-300' },
    { id: 'alveoli', label: t('Air Sacs (Alveoli)', '肺泡', '肺泡'), color: 'bg-pink-100' },
  ];

  return (
    <div className="bg-white rounded-[2rem] border-2 border-gray-100 shadow-xl overflow-hidden w-full">
      <div className="bg-gradient-to-r from-blue-50 to-pink-50 p-6 border-b-2 border-gray-100 flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-3">
            <Activity className="text-blue-500" />
            {t('Respiratory System', '呼吸系统', '呼吸系統')}
          </h3>
          <p className="text-gray-500 font-bold text-sm mt-1">
            {t('Follow the journey of air through the respiratory pathway.', '跟随空气在呼吸道中的旅程。', '跟隨空氣在呼吸道中的旅程。')}
          </p>
        </div>
        <button 
          onClick={() => setIsInhaling(!isInhaling)}
          className={`px-6 py-3 rounded-2xl font-black uppercase tracking-widest transition-all shadow-[0_4px_0_0_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-1 flex items-center gap-2 ${
            isInhaling ? 'bg-blue-500 text-white shadow-[0_4px_0_0_#1d4ed8]' : 'bg-red-500 text-white shadow-[0_4px_0_0_#b91c1c]'
          }`}
        >
          {isInhaling ? <><ArrowRight size={20} /> {t('Inhalation', '吸气', '吸氣')}</> : <><ArrowLeft size={20} /> {t('Exhalation', '呼气', '呼氣')}</>}
        </button>
      </div>

      <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="relative h-[500px] bg-gray-50 rounded-[2.5rem] border-4 border-gray-100 p-8 flex flex-col items-center justify-between overflow-hidden">
            <motion.div 
              animate={{ 
                scale: isInhaling ? 1.05 : 0.95,
                backgroundColor: isInhaling ? 'rgba(59, 130, 246, 0.05)' : 'rgba(239, 68, 68, 0.05)'
              }}
              className="absolute inset-10 rounded-[3rem] border-4 border-dashed border-gray-200 -z-0"
            />

            {pathway.map((step, i) => (
              <div key={step.id} className="relative w-full flex flex-col items-center">
                <motion.div 
                  className={`px-6 py-3 rounded-xl border-2 border-gray-200 font-black text-xs uppercase tracking-widest z-10 shadow-sm ${step.color} text-gray-700`}
                  animate={{ y: isInhaling ? [0, 5, 0] : [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 2, delay: i * 0.2 }}
                >
                  {step.label}
                </motion.div>

                {i < pathway.length - 1 && (
                  <div className="h-8 flex items-center justify-center relative w-full">
                    <div className="w-1 h-full bg-gray-200" />
                    {[...Array(3)].map((_, j) => (
                      <motion.div
                        key={j}
                        initial={{ opacity: 0, y: isInhaling ? -20 : 20 }}
                        animate={{ 
                          opacity: [0, 1, 0], 
                          y: isInhaling ? [ -20, 20 ] : [ 20, -20 ] 
                        }}
                        transition={{ 
                          duration: 1.5, 
                          repeat: Infinity, 
                          delay: (i * 0.3) + (j * 0.5) 
                        }}
                        className={`absolute ${isInhaling ? 'text-blue-500' : 'text-red-500'}`}
                      >
                        {isInhaling ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('Thoracic Volume', '胸腔体积', '胸腔體積')}</span>
                <span className={`font-black uppercase ${isInhaling ? 'text-blue-600' : 'text-red-600'}`}>
                  {isInhaling ? t('Increasing', '增加', '增加') : t('Decreasing', '减少', '減少')}
                </span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('Air Pressure', '空气压力', '空氣壓力')}</span>
                <span className={`font-black uppercase ${isInhaling ? 'text-blue-600' : 'text-red-600'}`}>
                  {isInhaling ? t('Lower than Outside', '低于外部', '低於外部') : t('Higher than Outside', '高于外部', '高於外部')}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-50 p-8 rounded-[2.5rem] border-2 border-gray-100 relative overflow-hidden h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
                <Info className="text-blue-500" />
                {t('Windpipe Protection', '气管保護', '氣管保護')}
              </h4>
              <button 
                onClick={() => setShowDetail(!showDetail)}
                className="text-xs font-black text-blue-500 uppercase tracking-widest hover:underline"
              >
                {showDetail ? t('Hide Detail', '隐藏详情', '隱藏詳情') : t('Show Detail', '显示详情', '顯示詳情')}
              </button>
            </div>

            <div className="flex-1 bg-white rounded-3xl border-2 border-gray-100 p-6 relative overflow-hidden flex flex-col items-center justify-center">
              <div className="relative w-full h-48 bg-orange-50/30 rounded-2xl border-2 border-orange-100 overflow-hidden">
                <div className="absolute bottom-0 w-full flex justify-around">
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ rotate: [-10, 10, -10] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.05 }}
                      className="w-1 h-6 bg-orange-300 rounded-full origin-bottom"
                    />
                  ))}
                </div>

                <motion.div 
                  animate={{ x: [-10, 10, -10] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute bottom-4 w-[120%] h-4 bg-emerald-200/40 blur-sm rounded-full -left-[10%]"
                />

                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={`dust-${i}`}
                    initial={{ x: Math.random() * 300, y: 0, opacity: 0 }}
                    animate={{ 
                      x: [null, Math.random() * 300],
                      y: [0, 35],
                      opacity: [0, 1, 1, 0],
                      scale: [0.5, 1, 1, 0.5]
                    }}
                    transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                    className="absolute w-2 h-2 bg-gray-400 rounded-full"
                  />
                ))}

                <motion.div 
                  animate={{ x: [-200, 400] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute bottom-0 w-32 h-12 bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent"
                />
              </div>

              <div className="mt-6 space-y-4 w-full">
                <div className="flex items-start gap-4">
                  <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                    <Activity size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-800 uppercase tracking-widest">{t('Ciliated Cells', '纤毛细胞', '纖毛細胞')}</p>
                    <p className="text-[10px] font-medium text-gray-500 leading-relaxed">
                      {t('Tiny hair-like structures that sweep mucus upwards away from the lungs.', '微小的毛发状结构，将粘液向上扫离肺部。', '微小的毛髮狀結構，將粘液向上掃離肺部。')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                    <Droplets size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-800 uppercase tracking-widest">{t('Goblet Cells & Mucus', '杯状细胞与粘液', '杯狀細胞與粘液')}</p>
                    <p className="text-[10px] font-medium text-gray-500 leading-relaxed">
                      {t('Produce sticky mucus to trap dust and pathogens (bacteria/viruses).', '产生粘性粘液以捕获灰尘和病原体（细菌/病毒）。', '產生粘性粘液以捕獲灰塵和病原體（細菌/病毒）。')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-blue-500 p-4 rounded-2xl text-white">
              <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">{t('Did you know?', '你知道吗？', '你知道嗎？')}</p>
              <p className="text-xs font-bold leading-relaxed">
                {t('Smoking damages cilia, making it harder for the body to clear mucus and leading to "smoker\'s cough".', '吸烟会损害纤毛，使身体更难清除粘液，导致“烟民咳嗽”。', '吸煙會損害纖毛，使身體更難清除粘液，導致「煙民咳嗽」。')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Metadata for sorting
(RespiratorySystemCard as any).UNIT = 1;
(RespiratorySystemCard as any).SUBJECT = 'BIOLOGY';

export default RespiratorySystemCard;
