import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Pause, Play } from 'lucide-react';

interface MagnifiedRBCViewProps {
  zone: 'lungs' | 'cells' | 'transit';
  t: (en: string, sc: string, tc: string) => string;
}

const MagnifiedRBCView: React.FC<MagnifiedRBCViewProps> = ({ zone, t }) => {
  const bgColor = zone === 'lungs' ? 'bg-blue-50 border-blue-100' : zone === 'cells' ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50 border-gray-100';
  const textColor = zone === 'lungs' ? 'text-blue-600' : zone === 'cells' ? 'text-emerald-600' : 'text-gray-600';
  const label = zone === 'lungs' ? t('At Lungs', '在肺部', '在肺部') : zone === 'cells' ? t('At Body Cells', '在身体细胞', '在身体細胞') : t('In Transit', '运输中', '運輸中');
  const description = zone === 'lungs' 
    ? t('Oxygen enters, CO₂ leaves.', '氧气进入，二氧化碳离开。', '氧氣進入，二氧化碳離開。')
    : zone === 'cells'
    ? t('Oxygen leaves, CO₂ enters.', '氧气离开，二氧化碳进入。', '氧氣離開，二氧化碳進入。')
    : t('Gases being transported.', '气体正在运输中。', '氣體正在運輸中。');

  return (
    <div className={`${bgColor} p-4 rounded-2xl border-2 relative overflow-hidden`}>
      <h4 className={`text-[10px] font-black ${textColor} uppercase tracking-widest mb-2`}>{label}</h4>
      
      <div className="relative h-24 bg-white/50 rounded-xl border border-gray-100 overflow-hidden flex items-center justify-center">
        <div className="absolute top-0 left-0 w-full h-2 bg-red-200/30" />
        <div className="absolute bottom-0 left-0 w-full h-2 bg-red-200/30" />
        
        <motion.div 
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="w-20 h-12 bg-red-500 rounded-full border-2 border-red-700 relative z-10 flex items-center justify-center shadow-md"
        >
          <div className="text-[6px] font-black text-white/30 uppercase">RBC</div>
          
          <AnimatePresence>
            {zone === 'lungs' && (
              <>
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={`o2-in-${i}`}
                    initial={{ x: -40, y: -30, opacity: 0 }}
                    animate={{ x: 0, y: 0, opacity: 1 }}
                    transition={{ duration: 1, delay: i * 0.3, repeat: Infinity }}
                    className="absolute w-1.5 h-1.5 bg-blue-400 rounded-full shadow-[0_0_3px_#60a5fa]"
                  />
                ))}
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={`co2-out-${i}`}
                    initial={{ x: 0, y: 0, opacity: 1 }}
                    animate={{ x: 40, y: -30, opacity: 0 }}
                    transition={{ duration: 1, delay: i * 0.3, repeat: Infinity }}
                    className="absolute w-1.5 h-1.5 bg-red-300 rounded-full shadow-[0_0_3px_#f87171]"
                  />
                ))}
              </>
            )}
            {zone === 'cells' && (
              <>
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={`o2-out-${i}`}
                    initial={{ x: 0, y: 0, opacity: 1 }}
                    animate={{ x: 40, y: 30, opacity: 0 }}
                    transition={{ duration: 1, delay: i * 0.3, repeat: Infinity }}
                    className="absolute w-1.5 h-1.5 bg-blue-400 rounded-full shadow-[0_0_3px_#60a5fa]"
                  />
                ))}
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={`co2-in-${i}`}
                    initial={{ x: -40, y: 30, opacity: 0 }}
                    animate={{ x: 0, y: 0, opacity: 1 }}
                    transition={{ duration: 1, delay: i * 0.3, repeat: Infinity }}
                    className="absolute w-1.5 h-1.5 bg-red-300 rounded-full shadow-[0_0_3px_#f87171]"
                  />
                ))}
              </>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      <p className="text-[9px] font-bold text-gray-500 mt-2 leading-tight">{description}</p>
    </div>
  );
};

interface RespirationCardProps {
  isAssistMode?: boolean;
  chineseType?: 'traditional' | 'simplified' | null;
}

const RespirationCard: React.FC<RespirationCardProps> = ({ isAssistMode, chineseType }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRunning, setIsRunning] = useState(true);
  const [speed, setSpeed] = useState(1);
  
  const containerWidth = 800;
  const containerHeight = 400;
  const loopRadiusX = 300;
  const loopRadiusY = 120;
  const centerX = containerWidth / 2;
  const centerY = containerHeight / 2;

  const rbcCount = 15;
  const rbcs = useRef(Array.from({ length: rbcCount }, (_, i) => ({
    angle: (i / rbcCount) * Math.PI * 2,
    oxygenLevel: 0,
    co2Level: 1,
  })));

  const t = (en: string, sc: string, tc: string) => {
    if (chineseType === 'simplified') return sc;
    if (chineseType === 'traditional') return tc;
    return en;
  };

  useEffect(() => {
    if (!isRunning) return;

    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const update = () => {
      ctx.clearRect(0, 0, containerWidth, containerHeight);

      ctx.beginPath();
      ctx.ellipse(centerX, centerY, loopRadiusX, loopRadiusY, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.1)';
      ctx.lineWidth = 40;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.2)';
      ctx.lineWidth = 2;
      ctx.stroke();

      rbcs.current.forEach((rbc, idx) => {
        rbc.angle += 0.005 * speed;
        if (rbc.angle > Math.PI * 2) rbc.angle -= Math.PI * 2;

        const x = centerX + Math.cos(rbc.angle) * loopRadiusX;
        const y = centerY + Math.sin(rbc.angle) * loopRadiusY;

        const distToLungs = Math.sqrt(Math.pow(x - (centerX - loopRadiusX), 2) + Math.pow(y - centerY, 2));
        if (distToLungs < 80) {
          rbc.oxygenLevel = Math.min(1, rbc.oxygenLevel + 0.02);
          rbc.co2Level = Math.max(0, rbc.co2Level - 0.02);
        }

        const distToCells = Math.sqrt(Math.pow(x - (centerX + loopRadiusX), 2) + Math.pow(y - centerY, 2));
        if (distToCells < 80) {
          rbc.oxygenLevel = Math.max(0, rbc.oxygenLevel - 0.02);
          rbc.co2Level = Math.min(1, rbc.co2Level + 0.02);
        }

        ctx.save();
        ctx.translate(x, y);
        const rbcColor = `rgb(${150 + rbc.oxygenLevel * 105}, ${20 + rbc.oxygenLevel * 30}, ${40 + rbc.oxygenLevel * 20})`;
        ctx.fillStyle = rbcColor;
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 8, rbc.angle, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      ctx.fillStyle = '#3b82f6';
      ctx.font = 'bold 14px Inter';
      ctx.textAlign = 'center';
      
      const lungX = centerX - loopRadiusX;
      const lungY = centerY;
      ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
      ctx.beginPath();
      ctx.ellipse(lungX - 15, lungY, 20, 35, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(lungX + 15, lungY, 20, 35, -0.2, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#3b82f6';
      ctx.fillText(chineseType ? (chineseType === 'simplified' ? '肺部' : '肺部') : 'LUNGS', centerX - loopRadiusX, centerY - 80);
      
      const cellX = centerX + loopRadiusX;
      const cellY = centerY;
      ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        const ox = (i % 2 === 0 ? 15 : -15) * (i > 2 ? 1 : 0.5);
        const oy = (i - 2) * 20;
        ctx.arc(cellX + ox, cellY + oy, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.fillStyle = '#10b981';
      ctx.fillText(chineseType ? (chineseType === 'simplified' ? '身体细胞' : '身体細胞') : 'BODY CELLS', centerX + loopRadiusX, centerY - 80);

      animationFrameId = requestAnimationFrame(update);
    };

    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isRunning, speed, chineseType]);

  return (
    <div className="bg-white rounded-[2rem] border-2 border-gray-100 shadow-xl overflow-hidden w-full">
      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 p-6 border-b-2 border-gray-100">
        <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-3">
          <Activity className="text-emerald-500" />
          {t('Respiration & Gaseous Exchange', '呼吸与气体交换', '呼吸與氣體交換')}
        </h3>
        <p className="text-gray-500 font-bold text-sm mt-1">
          {t('The circulatory system transports oxygen to cells and removes carbon dioxide waste.', '循环系统将氧气输送到细胞并清除二氧化碳废物。', '循環系統將氧氣輸送至細胞並清除二氧化碳廢物。')}
        </p>
      </div>

      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <div className="relative bg-gray-50 rounded-[2.5rem] p-4 border-4 border-gray-100 shadow-inner overflow-hidden aspect-[2/1] w-full flex items-center justify-center">
              <canvas ref={canvasRef} width={containerWidth} height={containerHeight} className="w-full h-full max-w-full" />
            </div>

            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
              <button onClick={() => setIsRunning(!isRunning)} className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 text-gray-600 hover:bg-gray-100 transition-all">
                {isRunning ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <div className="flex-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('Flow Speed', '流动速度', '流動速度')}</label>
                <input type="range" min="0.1" max="3" step="0.1" value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <MagnifiedRBCView zone="lungs" t={t} />
            <MagnifiedRBCView zone="transit" t={t} />
            <MagnifiedRBCView zone="cells" t={t} />

            <div className="bg-blue-50 p-6 rounded-[2rem] border-2 border-blue-100">
              <h4 className="text-sm font-black text-blue-600 uppercase tracking-widest mb-4">{t('Quick Facts', '速览', '速覽')}</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1 flex-shrink-0" />
                  <p className="text-[10px] font-medium text-blue-800">{t('Iron is essential for hemoglobin.', '铁对血红蛋白至关重要。', '鐵對血紅蛋白至關重要。')}</p>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1 flex-shrink-0" />
                  <p className="text-[10px] font-medium text-blue-800">{t('Anemia causes tiredness due to low O₂.', '贫血因低氧导致疲劳。', '貧血因低氧導致疲勞。')}</p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Metadata for sorting
(RespirationCard as any).UNIT = 1;
(RespirationCard as any).SUBJECT = 'BIOLOGY';

export default RespirationCard;
