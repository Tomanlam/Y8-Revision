import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ArrowLeft, Move, RefreshCcw, Info, Activity, Maximize2, ChevronRight, ChevronLeft } from 'lucide-react';

interface VisualProps {
  isAssistMode: boolean;
  chineseType: 'traditional' | 'simplified';
}

const t = (en: string, sc: string, tc: string, type: string) => {
  if (type === 'simplified') return sc;
  if (type === 'traditional') return tc;
  return en;
};

// 1. Force Explorer (Drag & Drop for Weight/Normal Force)
export const ForceExplorer: React.FC<VisualProps> = ({ isAssistMode, chineseType }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ y: 50 });
  const [isOnSurface, setIsOnSurface] = useState(false);

  const handleDrag = (_: any, info: any) => {
    const newY = position.y + info.delta.y;
    setPosition({ y: newY });
    setIsOnSurface(newY > 140);
  };

  return (
    <div className="my-4 bg-gray-50 rounded-2xl border-2 border-gray-100 p-6 shadow-sm">
      <h4 className="font-black text-gray-800 uppercase tracking-wider text-sm mb-4 flex flex-wrap gap-x-2">
        <span>Force Explorer</span>
        {isAssistMode && <span className="opacity-50">{t("", "受力探索", "受力探索", chineseType)}</span>}
      </h4>

      <div className="relative h-64 bg-white rounded-xl border-2 border-dashed border-gray-200 overflow-hidden flex flex-col items-center">
        {/* Surface */}
        <div className="absolute bottom-0 w-full h-16 bg-gray-200 border-t-4 border-gray-300 flex items-center justify-center">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex flex-col items-center">
            <span>Surface</span>
            {isAssistMode && <span>{t("", "表面", "表面", chineseType)}</span>}
          </span>
        </div>

        {/* Box */}
        <motion.div
          drag="y"
          dragConstraints={{ top: 20, bottom: 150 }}
          onDrag={handleDrag}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setIsDragging(false)}
          animate={{ y: position.y }}
          className={`w-24 h-24 bg-orange-500 rounded-xl cursor-grab active:cursor-grabbing flex items-center justify-center shadow-lg z-10 ${isDragging ? 'scale-105' : ''}`}
        >
          <span className="text-white font-black text-xs uppercase flex flex-col items-center">
            <span>Box</span>
            {isAssistMode && <span className="text-[8px] leading-none opacity-80">{t("", "盒子", "盒子", chineseType)}</span>}
          </span>

          {/* Force Arrows */}
          <AnimatePresence>
            {/* Weight (Always present) */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 w-1 h-20 bg-red-500 origin-top"
            >
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-l-[6px] border-r-[6px] border-t-[10px] border-l-transparent border-r-transparent border-t-red-500" />
              <span className="absolute -right-20 top-1/2 -translate-y-1/2 text-[10px] font-black text-red-600 bg-white px-1 rounded shadow-sm flex flex-col items-center whitespace-nowrap min-w-[50px]">
                <span>Weight</span>
                {isAssistMode && <span className="text-[8px] opacity-70 leading-none">{t("", "重量", "重量", chineseType)}</span>}
              </span>
            </motion.div>

            {/* Normal Contact Force (Only on surface) */}
            {isOnSurface && (
              <motion.div 
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0, scaleY: 0 }}
                className="absolute bottom-1/2 left-1/2 -translate-x-1/2 w-1 h-20 bg-blue-500 origin-bottom"
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full border-l-[6px] border-r-[6px] border-b-[10px] border-l-transparent border-r-transparent border-b-blue-500" />
                <span className="absolute -left-20 top-1/2 -translate-y-1/2 text-[10px] font-black text-blue-600 bg-white px-1 rounded shadow-sm flex flex-col items-center whitespace-nowrap min-w-[50px]">
                  <span>Normal Force</span>
                  {isAssistMode && <span className="text-[8px] opacity-70 leading-none">{t("", "法向力", "法向力", chineseType)}</span>}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-gray-100 shadow-sm max-w-[150px]">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex flex-wrap gap-x-1">
            <span>Status</span>
            {isAssistMode && <span className="opacity-50 tracking-normal">{t("", "状态", "狀態", chineseType)}</span>}
          </p>
          <div className="text-xs font-bold text-gray-700 flex flex-col">
            <span>
              {isOnSurface ? 'Resting on surface (Balanced)' : 'Falling / Held (Unbalanced)'}
            </span>
            {isAssistMode && (
              <span className="text-[10px] text-gray-500 italic mt-1 border-t border-gray-100 pt-1">
                {isOnSurface 
                  ? t('', '停留在表面 (受力平衡)', '停留在表面 (受力平衡)', chineseType) 
                  : t('', '下落 / 被握住 (受力不平衡)', '下落 / 被握住 (受力不平衡)', chineseType)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. Resultant Force Lab (Interactive Sliders)
export const ResultantForceLab: React.FC<VisualProps> = ({ isAssistMode, chineseType }) => {
  const [leftForce, setLeftForce] = useState(50);
  const [rightForce, setRightForce] = useState(50);
  const [boxPos, setBoxPos] = useState(0);
  const [velocity, setVelocity] = useState(0);

  useEffect(() => {
    const netForce = rightForce - leftForce;
    const interval = setInterval(() => {
      setVelocity(v => {
        const newV = v + netForce * 0.001;
        return newV * 0.98;
      });
      setBoxPos(p => {
        const newP = p + velocity;
        if (newP > 150) return 150;
        if (newP < -150) return -150;
        return newP;
      });
    }, 16);
    return () => clearInterval(interval);
  }, [leftForce, rightForce, velocity]);

  const reset = () => {
    setBoxPos(0);
    setVelocity(0);
    setLeftForce(50);
    setRightForce(50);
  };

  const netForce = rightForce - leftForce;

  return (
    <div className="my-4 bg-blue-50 rounded-2xl border-2 border-blue-100 p-6 shadow-sm">
      <div className="flex flex-col md:flex-row items-baseline justify-between mb-6 gap-2">
        <h4 className="font-black text-blue-800 uppercase tracking-wider text-sm flex flex-wrap gap-x-2">
          <span>Resultant Force Lab</span>
          {isAssistMode && <span className="opacity-50">{t("", "合力实验室", "合力實驗室", chineseType)}</span>}
        </h4>
        <button 
          onClick={reset} 
          className="bg-blue-500 text-white px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-[0_4px_0_0_#1d4ed8] active:shadow-none active:translate-y-1 transition-all flex flex-col items-center leading-none"
        >
          <div className="flex items-center gap-2">
            <RefreshCcw size={14} />
            <span>Reset</span>
          </div>
          {isAssistMode && <span className="text-[8px] font-bold opacity-70 mt-0.5 lowercase">{t("", "重置", "重置", chineseType)}</span>}
        </button>
      </div>

      <div className="relative h-48 bg-gray-900 rounded-xl border-4 border-gray-800 overflow-hidden flex items-center justify-center">
        <div className="absolute bottom-10 w-full h-1 bg-gray-700" />
        <motion.div 
          animate={{ x: boxPos }}
          className="relative w-16 h-16 bg-emerald-500 rounded-lg shadow-lg flex items-center justify-center z-10"
        >
          <span className="text-white font-black text-[10px] uppercase">10kg</span>
        </motion.div>

        <div className="absolute left-1/2 -translate-x-1/2 flex items-center" style={{ transform: `translateX(${boxPos - 40 - leftForce/2}px)` }}>
          <motion.div 
            style={{ width: leftForce }}
            className="h-2 bg-blue-400 rounded-l-full relative"
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full border-l-[10px] border-t-[6px] border-b-[6px] border-l-blue-400 border-t-transparent border-b-transparent" />
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-blue-400 whitespace-nowrap">{leftForce}N</span>
          </motion.div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 flex items-center" style={{ transform: `translateX(${boxPos + 40 + rightForce/2}px)` }}>
          <motion.div 
            style={{ width: rightForce }}
            className="h-2 bg-red-400 rounded-r-full relative"
          >
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full border-r-[10px] border-t-[6px] border-b-[6px] border-r-red-400 border-t-transparent border-b-transparent" />
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-red-400 whitespace-nowrap">{rightForce}N</span>
          </motion.div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-xl border-2 border-blue-100 shadow-sm flex flex-col items-start">
            <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 flex flex-wrap gap-x-1">
              <span>Left Force</span>
              {isAssistMode && <span className="opacity-50">{t("", "左侧推力", "左側推力", chineseType)}</span>}
            </label>
            <input type="range" min="0" max="100" value={leftForce} onChange={(e) => setLeftForce(parseInt(e.target.value))} className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-500" />
          </div>
          <div className="bg-white p-4 rounded-xl border-2 border-red-100 shadow-sm flex flex-col items-start">
            <label className="block text-[10px] font-black text-red-600 uppercase tracking-widest mb-2 flex flex-wrap gap-x-1">
              <span>Right Force</span>
              {isAssistMode && <span className="opacity-50">{t("", "右侧推力", "右側推力", chineseType)}</span>}
            </label>
            <input type="range" min="0" max="100" value={rightForce} onChange={(e) => setRightForce(parseInt(e.target.value))} className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer accent-red-500" />
          </div>

        <div className="bg-white p-6 rounded-xl border-2 border-blue-100 flex flex-col justify-center items-center text-center shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex flex-wrap gap-x-1 justify-center">
            <span>Resultant Force</span>
            {isAssistMode && <span className="opacity-50">{t("", "合力", "合力", chineseType)}</span>}
          </p>
          <p className={`text-3xl font-black ${netForce === 0 ? 'text-emerald-500' : 'text-orange-500'}`}>
            {Math.abs(netForce)}N {netForce > 0 ? '→' : netForce < 0 ? '←' : ''}
          </p>
          <div className="flex flex-col items-center mt-2">
            <p className="text-sm font-bold text-gray-500">
               {netForce === 0 ? "Balanced: Constant velocity or stationary" : "Unbalanced: Object is accelerating"}
            </p>
            {isAssistMode && (
              <p className="text-xs text-gray-400 italic border-t border-gray-100 mt-1 pt-1 max-w-[200px]">
                {netForce === 0 
                  ? t('', '受力平衡：保持匀速或静止', '受力平衡：保持勻速或靜止', chineseType) 
                  : t('', '受力不平衡：物体正在加速', '受力不平衡：物體正在加速', chineseType)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 3. Distance-Time Graph Interactive
export const DistanceTimeInteractive: React.FC<VisualProps> = ({ isAssistMode, chineseType }) => {
  const [points, setPoints] = useState<{ t: number; d: number }[]>([]);
  const [isMoving, setIsMoving] = useState(false);
  const [time, setTime] = useState(0);
  const [distance, setDistance] = useState(0);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    if (!isMoving) return;
    const interval = setInterval(() => {
      setTime(t => t + 1);
      setDistance(d => d + speed);
      setPoints(prev => [...prev, { t: time, d: distance }].slice(-50));
    }, 100);
    return () => clearInterval(interval);
  }, [isMoving, time, distance, speed]);

  const reset = () => {
    setPoints([]);
    setTime(0);
    setDistance(0);
    setIsMoving(false);
  };

  return (
    <div className="my-4 bg-emerald-50 rounded-2xl border-2 border-emerald-100 p-6 shadow-sm">
      <div className="flex flex-col md:flex-row items-baseline justify-between mb-6 gap-2">
        <h4 className="font-black text-emerald-800 uppercase tracking-wider text-sm flex flex-wrap gap-x-2">
          <span>Live Motion Graph</span>
          {isAssistMode && <span className="opacity-50">{t("", "实时运动图表", "實時運動圖表", chineseType)}</span>}
        </h4>
        <button 
          onClick={reset} 
          className="bg-emerald-500 text-white px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-[0_4px_0_0_#047857] active:shadow-none active:translate-y-1 transition-all flex flex-col items-center leading-none"
        >
          <div className="flex items-center gap-2">
            <RefreshCcw size={14} />
            <span>Reset</span>
          </div>
          {isAssistMode && <span className="text-[8px] font-bold opacity-70 mt-0.5 lowercase">{t("", "重置", "重置", chineseType)}</span>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-900 rounded-xl p-6 flex flex-col justify-between relative overflow-hidden h-64 shadow-inner">
          <div className="flex justify-between items-center text-white/50 text-[10px] font-black uppercase tracking-widest">
            <span className="flex flex-col items-center">
              <span>0m</span>
              {isAssistMode && <span className="text-[8px] opacity-70 leading-none">{t("", "0米", "0米", chineseType)}</span>}
            </span>
            <span className="flex flex-col items-center">
              <span>Distance</span>
              {isAssistMode && <span className="text-[8px] opacity-70 leading-none">{t("", "距离", "距離", chineseType)}</span>}
            </span>
            <span className="flex flex-col items-center">
              <span>100m</span>
              {isAssistMode && <span className="text-[8px] opacity-70 leading-none">{t("", "100米", "100米", chineseType)}</span>}
            </span>
          </div>
          
          <div className="relative h-1 bg-gray-800 w-full my-auto">
            <motion.div 
              animate={{ left: `${(distance % 100)}%` }}
              className="absolute top-1/2 -translate-y-1/2 w-8 h-8 bg-emerald-500 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.5)] flex items-center justify-center"
            >
              <ChevronRight className="text-white" size={20} />
            </motion.div>
          </div>

            <button 
              onClick={() => setIsMoving(!isMoving)}
              className={`flex-1 py-3 rounded-xl font-black uppercase tracking-widest transition-all shadow-[0_4px_0_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-1 flex flex-col items-center leading-none ${isMoving ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}
            >
              <span>{isMoving ? 'Stop' : 'Start Moving'}</span>
              {isAssistMode && <span className="text-[9px] opacity-70 mt-1 font-bold lowercase">{isMoving ? t("", "停止", "停止", chineseType) : t("", "开始运动", "開始運動", chineseType)}</span>}
            </button>
            <div className="flex-1 bg-white/10 rounded-xl p-2 flex flex-col justify-center">
              <label className="text-[8px] text-white/50 font-black uppercase mb-1 flex flex-wrap gap-x-1">
                <span>Speed</span>
                {isAssistMode && <span className="opacity-50 tracking-normal font-bold lowercase">{t("", "速度", "速度", chineseType)}</span>}
              </label>
              <input type="range" min="0.5" max="5" step="0.5" value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))} className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
            </div>
        </div>

        <div className="bg-white rounded-xl p-6 border-2 border-emerald-100 h-64 relative shadow-sm">
          <div className="absolute left-4 top-4 text-[10px] font-black text-gray-400 uppercase vertical-text flex flex-col gap-2">
            <span>Distance (m)</span>
            {isAssistMode && <span className="opacity-50">{t("", "距离 (米)", "距離 (米)", chineseType)}</span>}
          </div>
          <div className="absolute right-4 bottom-4 text-[10px] font-black text-gray-400 uppercase flex gap-2">
            <span>Time (s)</span>
            {isAssistMode && <span className="opacity-50">{t("", "时间 (秒)", "時間 (秒)", chineseType)}</span>}
          </div>

          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line x1="0" y1="100" x2="100" y2="100" stroke="#e5e7eb" strokeWidth="1" />
            <line x1="0" y1="0" x2="0" y2="100" stroke="#e5e7eb" strokeWidth="1" />
            <polyline
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              points={points.map((p, i) => `${(i / 50) * 100},${100 - (p.d % 100)}`).join(' ')}
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

// 4. Seesaw Moment Simulation
export const SeesawMoment: React.FC<VisualProps> = ({ isAssistMode, chineseType }) => {
  const [leftWeight, setLeftWeight] = useState(2);
  const [leftDist, setLeftDist] = useState(3);
  const [rightWeight, setRightWeight] = useState(3);
  const [rightDist, setRightDist] = useState(2);

  const leftMoment = leftWeight * leftDist;
  const rightMoment = rightWeight * rightDist;
  const balance = rightMoment - leftMoment;
  const angle = Math.max(-15, Math.min(15, balance * 2));

  return (
    <div className="my-4 bg-purple-50 rounded-2xl border-2 border-purple-100 p-6 shadow-sm">
      <h4 className="font-black text-purple-800 uppercase tracking-wider text-sm mb-8 flex flex-wrap gap-x-2">
        <span>Moment Balancer</span>
        {isAssistMode && <span className="opacity-50">{t("", "力矩平衡器", "力矩平衡器", chineseType)}</span>}
      </h4>

      <div className="relative h-64 bg-white rounded-xl border-2 border-purple-100 flex flex-col items-center justify-center overflow-hidden shadow-inner">
        <div className="absolute bottom-12 w-8 h-12 bg-gray-400 clip-triangle z-0" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
        <motion.div 
          animate={{ rotate: angle }}
          className="relative w-4/5 h-2 bg-gray-800 rounded-full flex items-center justify-center z-10"
        >
          <motion.div 
            style={{ left: `${50 - leftDist * 15}%` }}
            className="absolute bottom-2 w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-md"
          >
            <span className="text-white font-black text-[10px]">{leftWeight}N</span>
          </motion.div>
          <motion.div 
            style={{ right: `${50 - rightDist * 15}%` }}
            className="absolute bottom-2 w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center shadow-md"
          >
            <span className="text-white font-black text-[10px]">{rightWeight}N</span>
          </motion.div>
        </motion.div>

        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <div className="bg-blue-100 px-3 py-1 rounded-full border border-blue-200">
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{t('Left Moment', '左侧力矩', '左側力矩', chineseType)}: {leftMoment}Nm</span>
          </div>
          <div className="bg-red-100 px-3 py-1 rounded-full border border-red-200">
            <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">{t('Right Moment', '右侧力矩', '右側力矩', chineseType)}: {rightMoment}Nm</span>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-4 rounded-xl border-2 border-purple-100 shadow-sm space-y-4">
          <div>
            <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 flex flex-wrap gap-x-1">
              <span>Left Weight (N)</span>
              {isAssistMode && <span className="opacity-50 tracking-normal">{t("", "左侧重量 (牛顿)", "左側重量 (牛頓)", chineseType)}</span>}
            </label>
            <input type="range" min="1" max="10" value={leftWeight} onChange={(e) => setLeftWeight(parseInt(e.target.value))} className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-500" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 flex flex-wrap gap-x-1">
              <span>Left Distance (m)</span>
              {isAssistMode && <span className="opacity-50 tracking-normal">{t("", "左侧距离 (米)", "左側距離 (米)", chineseType)}</span>}
            </label>
            <input type="range" min="1" max="3" step="0.5" value={leftDist} onChange={(e) => setLeftDist(parseFloat(e.target.value))} className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border-2 border-purple-100 shadow-sm space-y-4">
          <div>
            <label className="block text-[10px] font-black text-red-600 uppercase tracking-widest mb-2 flex flex-wrap gap-x-1">
              <span>Right Weight (N)</span>
              {isAssistMode && <span className="opacity-50 tracking-normal">{t("", "右侧重量 (牛顿)", "右側重量 (牛頓)", chineseType)}</span>}
            </label>
            <input type="range" min="1" max="10" value={rightWeight} onChange={(e) => setRightWeight(parseInt(e.target.value))} className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer accent-red-500" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-red-600 uppercase tracking-widest mb-2 flex flex-wrap gap-x-1">
              <span>Right Distance (m)</span>
              {isAssistMode && <span className="opacity-50 tracking-normal">{t("", "右侧距离 (米)", "右側距離 (米)", chineseType)}</span>}
            </label>
            <input type="range" min="1" max="3" step="0.5" value={rightDist} onChange={(e) => setRightDist(parseFloat(e.target.value))} className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer accent-red-500" />
          </div>
        </div>
      </div>

      <div className={`mt-6 p-4 rounded-xl border-2 text-center font-black uppercase tracking-widest flex flex-col gap-1 ${Math.abs(balance) < 0.1 ? 'bg-emerald-100 border-emerald-200 text-emerald-600' : 'bg-orange-100 border-orange-200 text-orange-600'}`}>
        <span>{Math.abs(balance) < 0.1 ? "Perfectly Balanced!" : "Unbalanced"}</span>
        {isAssistMode && (
          <span className="text-xs opacity-60 font-black border-t border-current/10 pt-1">
            {Math.abs(balance) < 0.1 ? t('', '完美平衡！', '完美平衡！', chineseType) : t('', '未平衡', '未平衡', chineseType)}
          </span>
        )}
      </div>
    </div>
  );
};

// 5. Pressure Visualizer (Area vs Pressure)
export const PressureVisualizer: React.FC<VisualProps> = ({ isAssistMode, chineseType }) => {
  const [area, setArea] = useState(50);
  const force = 100;
  const pressure = force / (area / 10);

  return (
    <div className="my-4 bg-pink-50 rounded-2xl border-2 border-pink-100 p-6 shadow-sm">
      <h4 className="font-black text-pink-800 uppercase tracking-wider text-sm mb-6">
        {t('Pressure Visualizer', '压力可视化', '壓力可視化', chineseType)}
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl p-8 flex flex-col items-center justify-center h-64 relative overflow-hidden shadow-inner border border-pink-100">
          <motion.div 
            animate={{ y: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-2 bg-red-500 h-20 relative mb-2"
          >
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-l-[10px] border-r-[10px] border-t-[15px] border-l-transparent border-r-transparent border-t-red-500" />
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-red-600 uppercase">100N</span>
          </motion.div>

          <motion.div 
            animate={{ width: area * 2 }}
            className="h-12 bg-gray-800 rounded-t-lg flex items-center justify-center"
          >
            <span className="text-white text-[8px] font-black uppercase">{area}cm²</span>
          </motion.div>

          <div className="w-full h-4 bg-gray-200 border-t-2 border-gray-300 relative">
            <motion.div 
              animate={{ 
                opacity: pressure / 20,
                scaleX: area / 50
              }}
              className="absolute inset-0 bg-red-500 blur-md"
            />
          </div>
        </div>

        <div className="flex flex-col justify-center space-y-6">
          <div className="bg-white p-6 rounded-xl border-2 border-pink-100 shadow-sm text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex flex-wrap justify-center gap-x-1">
              <span>Calculated Pressure</span>
              {isAssistMode && <span className="opacity-50">{t("", "计算压力", "計算壓力", chineseType)}</span>}
            </p>
            <p className="text-4xl font-black text-pink-500">{pressure.toFixed(1)} <span className="text-sm">N/cm²</span></p>
          </div>

          <div className="bg-white p-6 rounded-xl border-2 border-pink-100 shadow-sm">
            <label className="block text-[10px] font-black text-pink-600 uppercase tracking-widest mb-4 flex flex-wrap gap-x-1">
              <span>Contact Area</span>
              {isAssistMode && <span className="opacity-50 tracking-normal">{t("", "接触面积", "接觸面積", chineseType)}</span>}
              : {area}cm²
            </label>
            <input type="range" min="10" max="100" value={area} onChange={(e) => setArea(parseInt(e.target.value))} className="w-full h-2 bg-pink-200 rounded-lg appearance-none cursor-pointer accent-pink-500" />
            <div className="flex justify-between mt-2">
              <span className="text-[8px] font-black text-pink-400 uppercase flex flex-col items-center">
                <span>Sharp</span>
                {isAssistMode && <span className="opacity-60">{t("", "锋利", "鋒利", chineseType)}</span>}
              </span>
              <span className="text-[8px] font-black text-pink-400 uppercase flex flex-col items-center">
                <span>Blunt</span>
                {isAssistMode && <span className="opacity-60">{t("", "钝", "鈍", chineseType)}</span>}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 6. Liquid Pressure Depth
export const LiquidPressureDepth: React.FC<VisualProps> = ({ isAssistMode, chineseType }) => {
  const [depth, setDepth] = useState(50);
  const pressure = depth * 0.5;

  return (
    <div className="my-4 bg-blue-50 rounded-2xl border-2 border-blue-100 p-6 shadow-sm">
      <h4 className="font-black text-blue-800 uppercase tracking-wider text-sm mb-6">
        {t('Underwater Pressure', '水下压力', '水下壓力', chineseType)}
      </h4>

      <div className="relative h-80 bg-blue-900 rounded-xl border-4 border-blue-800 overflow-hidden shadow-inner">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-400/30 via-blue-600/50 to-blue-900" />
        <motion.div 
          animate={{ y: depth * 2.5 }}
          className="absolute left-1/2 -translate-x-1/2 z-20"
        >
          <div className="w-12 h-8 bg-orange-500 rounded-full relative flex items-center justify-center shadow-lg">
            <div className="w-4 h-4 bg-blue-200 rounded-full absolute right-1 top-1 border border-orange-700" />
            <span className="text-[6px] font-black text-white uppercase">DIVER</span>
          </div>
          <motion.div 
            animate={{ scale: 1 + pressure / 50 }}
            className="absolute inset-0 rounded-full border-2 border-white/20 -z-10"
          />
        </motion.div>

        <div className="absolute left-4 h-full flex flex-col justify-between py-4 text-[8px] font-black text-white/30 uppercase">
          <span>0m</span>
          <span>25m</span>
          <span>50m</span>
          <span>75m</span>
          <span>100m</span>
        </div>

        <div className="absolute bottom-6 right-6 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 text-white min-w-[120px]">
          <p className="text-[8px] font-black uppercase tracking-widest mb-1 opacity-60 flex flex-wrap gap-x-1">
            <span>Pressure</span>
            {isAssistMode && <span className="opacity-60 tracking-normal">{t("", "压力", "壓力", chineseType)}</span>}
          </p>
          <p className="text-2xl font-black">{pressure.toFixed(1)} <span className="text-xs">kPa</span></p>
          <div className="w-full h-1 bg-white/20 rounded-full mt-2 overflow-hidden">
            <motion.div 
              animate={{ width: `${pressure}%` }}
              className="h-full bg-blue-400 shadow-[0_0_10px_#60a5fa]"
            />
          </div>
        </div>

        <div className="absolute top-6 right-6 w-8 h-48 bg-white/10 rounded-full p-1 border border-white/20">
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={depth} 
            onChange={(e) => setDepth(parseInt(e.target.value))} 
            className="w-full h-full appearance-none bg-transparent cursor-pointer vertical-slider"
            style={{ writingMode: 'bt-lr' as any }}
          />
        </div>
      </div>
    </div>
  );
};

// 7. Diffusion Visual (Concentration Gradient)
export const DiffusionVisual: React.FC<VisualProps> = ({ isAssistMode, chineseType }) => {
  const [isDiffusing, setIsDiffusing] = useState(false);

  return (
    <div className="my-4 bg-emerald-50 rounded-2xl border-2 border-emerald-100 p-6 shadow-sm">
      <h4 className="font-black text-emerald-800 uppercase tracking-wider text-sm mb-6">
        {t('Diffusion Simulator', '扩散模拟器', '擴散模擬器', chineseType)}
      </h4>

      <div className="relative h-48 bg-white rounded-xl border-2 border-emerald-100 overflow-hidden flex items-center shadow-inner">
        <div className="w-1/2 h-full border-r-2 border-dashed border-emerald-100 relative">
          <div className="absolute top-2 left-2 text-[8px] font-black text-emerald-400 uppercase tracking-widest flex flex-col items-start leading-none">
            <span>High Concentration</span>
            {isAssistMode && <span className="opacity-60">{t("", "高浓度", "高濃度", chineseType)}</span>}
          </div>
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={`left-${i}`}
              animate={isDiffusing ? { 
                x: [0, Math.random() * 300], 
                y: [Math.random() * 150, Math.random() * 150],
                opacity: [1, 0.5]
              } : {}}
              transition={{ duration: 5, repeat: Infinity, repeatType: "reverse" }}
              className="absolute w-2 h-2 bg-emerald-500 rounded-full"
              style={{ 
                left: `${Math.random() * 80 + 10}%`, 
                top: `${Math.random() * 80 + 10}%` 
              }}
            />
          ))}
        </div>

        <div className="w-1/2 h-full relative">
          <div className="absolute top-2 right-2 text-[8px] font-black text-emerald-400 uppercase tracking-widest flex flex-col items-end leading-none">
            <span>Low Concentration</span>
            {isAssistMode && <span className="opacity-60">{t("", "低浓度", "低濃度", chineseType)}</span>}
          </div>
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={`right-${i}`}
              animate={{ 
                x: [0, (Math.random() - 0.5) * 20], 
                y: [0, (Math.random() - 0.5) * 20] 
              }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
              className="absolute w-2 h-2 bg-emerald-500 rounded-full"
              style={{ 
                left: `${Math.random() * 80 + 10}%`, 
                top: `${Math.random() * 80 + 10}%` 
              }}
            />
          ))}
        </div>

        <button 
          onClick={() => setIsDiffusing(!isDiffusing)}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest shadow-[0_4px_0_0_#047857] active:shadow-none active:translate-y-1 transition-all flex flex-col items-center leading-none"
        >
          <span>{isDiffusing ? 'Reset' : 'Start Diffusion'}</span>
          {isAssistMode && <span className="text-[10px] opacity-75 mt-1 font-bold lowercase">{isDiffusing ? t("", "重置", "重置", chineseType) : t("", "开始扩散", "開始擴散", chineseType)}</span>}
        </button>
      </div>
    </div>
  );
};
