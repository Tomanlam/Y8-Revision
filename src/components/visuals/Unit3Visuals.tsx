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
export const ForceExplorer: React.FC<VisualProps> = ({ chineseType }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ y: 50 });
  const [isOnSurface, setIsOnSurface] = useState(false);

  const handleDrag = (_: any, info: any) => {
    const newY = position.y + info.delta.y;
    setPosition({ y: newY });
    setIsOnSurface(newY > 140);
  };

  return (
    <div className="my-8 bg-white rounded-3xl border-2 border-gray-100 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
          <Move size={20} />
        </div>
        <div>
          <h4 className="font-black text-gray-800 uppercase tracking-tight">
            {t('Force Explorer', '受力探索', '受力探索', chineseType)}
          </h4>
          <p className="text-xs text-gray-500 font-bold">
            {t('Drag the box to see how forces change.', '拖动盒子观察受力变化。', '拖動盒子觀察受力變化。', chineseType)}
          </p>
        </div>
      </div>

      <div className="relative h-64 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden flex flex-col items-center">
        {/* Surface */}
        <div className="absolute bottom-0 w-full h-16 bg-gray-200 border-t-4 border-gray-300 flex items-center justify-center">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            {t('Surface', '表面', '表面', chineseType)}
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
          <span className="text-white font-black text-xs uppercase">{t('Box', '盒子', '盒子', chineseType)}</span>

          {/* Force Arrows */}
          <AnimatePresence>
            {/* Weight (Always present) */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 w-1 h-20 bg-red-500 origin-top"
            >
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-l-[6px] border-r-[6px] border-t-[10px] border-l-transparent border-r-transparent border-t-red-500" />
              <span className="absolute -right-16 top-1/2 -translate-y-1/2 text-[10px] font-black text-red-600 bg-white px-1 rounded shadow-sm">
                {t('Weight', '重量', '重量', chineseType)}
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
                <span className="absolute -left-20 top-1/2 -translate-y-1/2 text-[10px] font-black text-blue-600 bg-white px-1 rounded shadow-sm">
                  {t('Normal Force', '法向力', '法向力', chineseType)}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('Status', '状态', '狀態', chineseType)}</p>
          <p className="text-xs font-bold text-gray-700">
            {isOnSurface 
              ? t('Resting on surface (Balanced)', '停留在表面 (受力平衡)', '停留在表面 (受力平衡)', chineseType) 
              : t('Falling / Held (Unbalanced)', '下落 / 被握住 (受力不平衡)', '下落 / 被握住 (受力不平衡)', chineseType)}
          </p>
        </div>
      </div>
    </div>
  );
};

// 2. Force Balancer (Resultant Force & Movement)
export const ForceBalancer: React.FC<VisualProps> = ({ chineseType }) => {
  const [leftForce, setLeftForce] = useState(50);
  const [rightForce, setRightForce] = useState(50);
  const [boxPos, setBoxPos] = useState(0);
  const [velocity, setVelocity] = useState(0);

  useEffect(() => {
    const netForce = rightForce - leftForce;
    const interval = setInterval(() => {
      setVelocity(v => {
        const newV = v + netForce * 0.001;
        // Add some friction to stop eventually
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
    <div className="my-8 bg-white rounded-3xl border-2 border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
            <RefreshCcw size={20} />
          </div>
          <div>
            <h4 className="font-black text-gray-800 uppercase tracking-tight">
              {t('Resultant Force Lab', '合力实验室', '合力實驗室', chineseType)}
            </h4>
            <p className="text-xs text-gray-500 font-bold">
              {t('Adjust forces to see how the box moves.', '调整力度观察盒子如何运动。', '調整力度觀察盒子如何運動。', chineseType)}
            </p>
          </div>
        </div>
        <button onClick={reset} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <RefreshCcw size={18} className="text-gray-400" />
        </button>
      </div>

      <div className="relative h-48 bg-gray-900 rounded-2xl border-4 border-gray-800 overflow-hidden flex items-center justify-center">
        {/* Track */}
        <div className="absolute bottom-10 w-full h-1 bg-gray-700" />

        {/* Box */}
        <motion.div 
          animate={{ x: boxPos }}
          className="relative w-16 h-16 bg-emerald-500 rounded-lg shadow-lg flex items-center justify-center z-10"
        >
          <span className="text-white font-black text-[10px] uppercase">10kg</span>
        </motion.div>

        {/* Force Arrows */}
        {/* Left Force Arrow (Pushing Right) */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center" style={{ transform: `translateX(${boxPos - 40 - leftForce/2}px)` }}>
          <motion.div 
            style={{ width: leftForce }}
            className="h-2 bg-blue-400 rounded-l-full relative"
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full border-l-[10px] border-t-[6px] border-b-[6px] border-l-blue-400 border-t-transparent border-b-transparent" />
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-blue-400 whitespace-nowrap">{leftForce}N</span>
          </motion.div>
        </div>

        {/* Right Force Arrow (Pushing Left) */}
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
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-2xl border-2 border-blue-100">
            <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">{t('Left Force', '左侧推力', '左側推力', chineseType)}</label>
            <input type="range" min="0" max="100" value={leftForce} onChange={(e) => setLeftForce(parseInt(e.target.value))} className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-500" />
          </div>
          <div className="bg-red-50 p-4 rounded-2xl border-2 border-red-100">
            <label className="block text-[10px] font-black text-red-600 uppercase tracking-widest mb-2">{t('Right Force', '右侧推力', '右側推力', chineseType)}</label>
            <input type="range" min="0" max="100" value={rightForce} onChange={(e) => setRightForce(parseInt(e.target.value))} className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer accent-red-500" />
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-2xl border-2 border-gray-100 flex flex-col justify-center items-center text-center">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('Resultant Force', '合力', '合力', chineseType)}</p>
          <p className={`text-3xl font-black ${netForce === 0 ? 'text-emerald-500' : 'text-orange-500'}`}>
            {Math.abs(netForce)}N {netForce > 0 ? '→' : netForce < 0 ? '←' : ''}
          </p>
          <p className="text-xs font-bold text-gray-500 mt-2">
            {netForce === 0 
              ? t('Balanced: Constant velocity or stationary', '受力平衡：保持匀速或静止', '受力平衡：保持勻速或靜止', chineseType) 
              : t('Unbalanced: Object is accelerating', '受力不平衡：物体正在加速', '受力不平衡：物體正在加速', chineseType)}
          </p>
        </div>
      </div>
    </div>
  );
};

// 3. Distance-Time Graph Interactive
export const DistanceTimeInteractive: React.FC<VisualProps> = ({ chineseType }) => {
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
    <div className="my-8 bg-white rounded-3xl border-2 border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
            <Activity size={20} />
          </div>
          <div>
            <h4 className="font-black text-gray-800 uppercase tracking-tight">
              {t('Live Motion Graph', '实时运动图表', '實時運動圖表', chineseType)}
            </h4>
            <p className="text-xs text-gray-500 font-bold">
              {t('Move the object and watch the graph grow.', '移动物体并观察图表增长。', '移動物體並觀察圖表增長。', chineseType)}
            </p>
          </div>
        </div>
        <button onClick={reset} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <RefreshCcw size={18} className="text-gray-400" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Animation Area */}
        <div className="bg-gray-900 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden h-64">
          <div className="flex justify-between items-center text-white/50 text-[10px] font-black uppercase tracking-widest">
            <span>0m</span>
            <span>{t('Distance', '距离', '距離', chineseType)}</span>
            <span>100m</span>
          </div>
          
          <div className="relative h-1 bg-gray-800 w-full my-auto">
            <motion.div 
              animate={{ left: `${(distance % 100)}%` }}
              className="absolute top-1/2 -translate-y-1/2 w-8 h-8 bg-emerald-500 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.5)] flex items-center justify-center"
            >
              <ChevronRight className="text-white" size={20} />
            </motion.div>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => setIsMoving(!isMoving)}
              className={`flex-1 py-3 rounded-xl font-black uppercase tracking-widest transition-all ${isMoving ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}
            >
              {isMoving ? t('Stop', '停止', '停止', chineseType) : t('Start Moving', '开始运动', '開始運動', chineseType)}
            </button>
            <div className="flex-1 bg-white/10 rounded-xl p-2 flex flex-col justify-center">
              <label className="text-[8px] text-white/50 font-black uppercase mb-1">{t('Speed', '速度', '速度', chineseType)}</label>
              <input type="range" min="0.5" max="5" step="0.5" value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))} className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
            </div>
          </div>
        </div>

        {/* Graph Area */}
        <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-100 h-64 relative">
          <div className="absolute left-4 top-4 text-[10px] font-black text-gray-400 uppercase vertical-text">
            {t('Distance (m)', '距离 (米)', '距離 (米)', chineseType)}
          </div>
          <div className="absolute right-4 bottom-4 text-[10px] font-black text-gray-400 uppercase">
            {t('Time (s)', '时间 (秒)', '時間 (秒)', chineseType)}
          </div>

          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Grid */}
            <line x1="0" y1="100" x2="100" y2="100" stroke="#e5e7eb" strokeWidth="1" />
            <line x1="0" y1="0" x2="0" y2="100" stroke="#e5e7eb" strokeWidth="1" />
            
            {/* Path */}
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
export const SeesawMoment: React.FC<VisualProps> = ({ chineseType }) => {
  const [leftWeight, setLeftWeight] = useState(2);
  const [leftDist, setLeftDist] = useState(3);
  const [rightWeight, setRightWeight] = useState(3);
  const [rightDist, setRightDist] = useState(2);

  const leftMoment = leftWeight * leftDist;
  const rightMoment = rightWeight * rightDist;
  const balance = rightMoment - leftMoment;
  
  // Rotation angle based on balance
  const angle = Math.max(-15, Math.min(15, balance * 2));

  return (
    <div className="my-8 bg-white rounded-3xl border-2 border-gray-100 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
          <Maximize2 size={20} />
        </div>
        <div>
          <h4 className="font-black text-gray-800 uppercase tracking-tight">
            {t('Moment Balancer', '力矩平衡器', '力矩平衡器', chineseType)}
          </h4>
          <p className="text-xs text-gray-500 font-bold">
            {t('Balance the seesaw by changing weight and distance.', '通过改变重量和距离来平衡跷跷板。', '通過改變重量和距離來平衡蹺蹺板。', chineseType)}
          </p>
        </div>
      </div>

      <div className="relative h-64 bg-gray-50 rounded-2xl border-2 border-gray-100 flex flex-col items-center justify-center overflow-hidden">
        {/* Pivot */}
        <div className="absolute bottom-12 w-8 h-12 bg-gray-400 clip-triangle z-0" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />

        {/* Seesaw Plank */}
        <motion.div 
          animate={{ rotate: angle }}
          className="relative w-4/5 h-2 bg-gray-800 rounded-full flex items-center justify-center z-10"
        >
          {/* Left Weight */}
          <motion.div 
            style={{ left: `${50 - leftDist * 15}%` }}
            className="absolute bottom-2 w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-md"
          >
            <span className="text-white font-black text-[10px]">{leftWeight}N</span>
          </motion.div>

          {/* Right Weight */}
          <motion.div 
            style={{ right: `${50 - rightDist * 15}%` }}
            className="absolute bottom-2 w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center shadow-md"
          >
            <span className="text-white font-black text-[10px]">{rightWeight}N</span>
          </motion.div>
        </motion.div>

        {/* Stats Overlay */}
        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <div className="bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{t('Left Moment', '左侧力矩', '左側力矩', chineseType)}: {leftMoment}Nm</span>
          </div>
          <div className="bg-red-50 px-3 py-1 rounded-full border border-red-100">
            <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">{t('Right Moment', '右侧力矩', '右側力矩', chineseType)}: {rightMoment}Nm</span>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-2xl border-2 border-blue-100 space-y-4">
            <div>
              <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">{t('Left Weight (N)', '左侧重量 (牛顿)', '左側重量 (牛頓)', chineseType)}</label>
              <input type="range" min="1" max="10" value={leftWeight} onChange={(e) => setLeftWeight(parseInt(e.target.value))} className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-500" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">{t('Left Distance (m)', '左侧距离 (米)', '左側距離 (米)', chineseType)}</label>
              <input type="range" min="1" max="3" step="0.5" value={leftDist} onChange={(e) => setLeftDist(parseFloat(e.target.value))} className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-500" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-red-50 p-4 rounded-2xl border-2 border-red-100 space-y-4">
            <div>
              <label className="block text-[10px] font-black text-red-600 uppercase tracking-widest mb-2">{t('Right Weight (N)', '右侧重量 (牛顿)', '右側重量 (牛頓)', chineseType)}</label>
              <input type="range" min="1" max="10" value={rightWeight} onChange={(e) => setRightWeight(parseInt(e.target.value))} className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer accent-red-500" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-red-600 uppercase tracking-widest mb-2">{t('Right Distance (m)', '右侧距离 (米)', '右側距離 (米)', chineseType)}</label>
              <input type="range" min="1" max="3" step="0.5" value={rightDist} onChange={(e) => setRightDist(parseFloat(e.target.value))} className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer accent-red-500" />
            </div>
          </div>
        </div>
      </div>

      <div className={`mt-6 p-4 rounded-2xl border-2 text-center font-black uppercase tracking-widest ${Math.abs(balance) < 0.1 ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-orange-50 border-orange-100 text-orange-600'}`}>
        {Math.abs(balance) < 0.1 ? t('Perfectly Balanced!', '完美平衡！', '完美平衡！', chineseType) : t('Unbalanced', '未平衡', '未平衡', chineseType)}
      </div>
    </div>
  );
};

// 5. Pressure Visualizer (Area vs Pressure)
export const PressureVisualizer: React.FC<VisualProps> = ({ chineseType }) => {
  const [area, setArea] = useState(50);
  const force = 100;
  const pressure = force / (area / 10);

  return (
    <div className="my-8 bg-white rounded-3xl border-2 border-gray-100 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-pink-100 rounded-lg text-pink-600">
          <Info size={20} />
        </div>
        <div>
          <h4 className="font-black text-gray-800 uppercase tracking-tight">
            {t('Pressure Visualizer', '压力可视化', '壓力可視化', chineseType)}
          </h4>
          <p className="text-xs text-gray-500 font-bold">
            {t('See how area affects the pressure applied.', '观察面积如何影响施加的压力。', '觀察面積如何影響施加的壓力。', chineseType)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-50 rounded-2xl p-8 flex flex-col items-center justify-center h-64 relative overflow-hidden">
          {/* Force Arrow */}
          <motion.div 
            animate={{ y: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-2 bg-red-500 h-20 relative mb-2"
          >
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-l-[10px] border-r-[10px] border-t-[15px] border-l-transparent border-r-transparent border-t-red-500" />
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-red-600 uppercase">100N</span>
          </motion.div>

          {/* Contact Object */}
          <motion.div 
            animate={{ width: area * 2 }}
            className="h-12 bg-gray-800 rounded-t-lg flex items-center justify-center"
          >
            <span className="text-white text-[8px] font-black uppercase">{area}cm²</span>
          </motion.div>

          {/* Surface with Pressure Glow */}
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
          <div className="bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('Calculated Pressure', '计算压力', '計算壓力', chineseType)}</p>
            <p className="text-4xl font-black text-pink-500">{pressure.toFixed(1)} <span className="text-sm">N/cm²</span></p>
          </div>

          <div className="bg-pink-50 p-6 rounded-2xl border-2 border-pink-100">
            <label className="block text-[10px] font-black text-pink-600 uppercase tracking-widest mb-4">{t('Contact Area', '接触面积', '接觸面積', chineseType)}: {area}cm²</label>
            <input type="range" min="10" max="100" value={area} onChange={(e) => setArea(parseInt(e.target.value))} className="w-full h-2 bg-pink-200 rounded-lg appearance-none cursor-pointer accent-pink-500" />
            <div className="flex justify-between mt-2">
              <span className="text-[8px] font-black text-pink-400 uppercase">{t('Sharp', '锋利', '鋒利', chineseType)}</span>
              <span className="text-[8px] font-black text-pink-400 uppercase">{t('Blunt', '钝', '鈍', chineseType)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 6. Liquid Pressure Depth
export const LiquidPressureDepth: React.FC<VisualProps> = ({ chineseType }) => {
  const [depth, setDepth] = useState(50);
  const pressure = depth * 0.5;

  return (
    <div className="my-8 bg-white rounded-3xl border-2 border-gray-100 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
          <Activity size={20} />
        </div>
        <div>
          <h4 className="font-black text-gray-800 uppercase tracking-tight">
            {t('Underwater Pressure', '水下压力', '水下壓力', chineseType)}
          </h4>
          <p className="text-xs text-gray-500 font-bold">
            {t('See how pressure increases as you go deeper.', '观察压力如何随深度增加。', '觀察壓力如何隨深度增加。', chineseType)}
          </p>
        </div>
      </div>

      <div className="relative h-80 bg-blue-900 rounded-2xl border-4 border-blue-800 overflow-hidden">
        {/* Water Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-400/30 via-blue-600/50 to-blue-900" />

        {/* Diver */}
        <motion.div 
          animate={{ y: depth * 2.5 }}
          className="absolute left-1/2 -translate-x-1/2 z-20"
        >
          <div className="w-12 h-8 bg-orange-500 rounded-full relative flex items-center justify-center shadow-lg">
            <div className="w-4 h-4 bg-blue-200 rounded-full absolute right-1 top-1 border border-orange-700" />
            <span className="text-[6px] font-black text-white uppercase">DIVER</span>
          </div>
          
          {/* Pressure Indicator around diver */}
          <motion.div 
            animate={{ scale: 1 + pressure / 50 }}
            className="absolute inset-0 rounded-full border-2 border-white/20 -z-10"
          />
        </motion.div>

        {/* Depth Markings */}
        <div className="absolute left-4 h-full flex flex-col justify-between py-4 text-[8px] font-black text-white/30 uppercase">
          <span>0m</span>
          <span>25m</span>
          <span>50m</span>
          <span>75m</span>
          <span>100m</span>
        </div>

        {/* Pressure Gauge */}
        <div className="absolute bottom-6 right-6 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-white min-w-[120px]">
          <p className="text-[8px] font-black uppercase tracking-widest mb-1 opacity-60">{t('Pressure', '压力', '壓力', chineseType)}</p>
          <p className="text-2xl font-black">{pressure.toFixed(1)} <span className="text-xs">kPa</span></p>
          <div className="w-full h-1 bg-white/20 rounded-full mt-2 overflow-hidden">
            <motion.div 
              animate={{ width: `${pressure}%` }}
              className="h-full bg-blue-400 shadow-[0_0_10px_#60a5fa]"
            />
          </div>
        </div>

        {/* Control Slider Overlay */}
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
export const DiffusionVisual: React.FC<VisualProps> = ({ chineseType }) => {
  const [isDiffusing, setIsDiffusing] = useState(false);

  return (
    <div className="my-8 bg-white rounded-3xl border-2 border-gray-100 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
          <RefreshCcw size={20} />
        </div>
        <div>
          <h4 className="font-black text-gray-800 uppercase tracking-tight">
            {t('Diffusion Simulator', '扩散模拟器', '擴散模擬器', chineseType)}
          </h4>
          <p className="text-xs text-gray-500 font-bold">
            {t('Watch particles move from high to low concentration.', '观察粒子如何从高浓度向低浓度移动。', '觀察粒子如何從高濃度向低濃度移動。', chineseType)}
          </p>
        </div>
      </div>

      <div className="relative h-48 bg-gray-50 rounded-2xl border-2 border-gray-100 overflow-hidden flex items-center">
        {/* Left Side (High Concentration) */}
        <div className="w-1/2 h-full border-r-2 border-dashed border-gray-200 relative">
          <div className="absolute top-2 left-2 text-[8px] font-black text-gray-400 uppercase tracking-widest">
            {t('High Concentration', '高浓度', '高濃度', chineseType)}
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

        {/* Right Side (Low Concentration) */}
        <div className="w-1/2 h-full relative">
          <div className="absolute top-2 right-2 text-[8px] font-black text-gray-400 uppercase tracking-widest">
            {t('Low Concentration', '低浓度', '低濃度', chineseType)}
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
          className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white px-6 py-2 rounded-full border-2 border-emerald-500 text-emerald-600 font-black text-xs uppercase tracking-widest shadow-lg hover:bg-emerald-50 transition-all"
        >
          {isDiffusing ? t('Reset', '重置', '重置', chineseType) : t('Start Diffusion', '开始扩散', '開始擴散', chineseType)}
        </button>
      </div>
    </div>
  );
};
