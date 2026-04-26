import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Zap, Info } from 'lucide-react';

interface ForcesCardProps {
  chineseType?: 'traditional' | 'simplified' | null;
}

const ForcesCard: React.FC<ForcesCardProps> = ({ chineseType }) => {
  const [activeTab, setActiveTab] = useState<'box' | 'plane'>('plane');
  const [boxForces, setBoxForces] = useState({ up: 50, down: 50, left: 50, right: 50 });
  const [planeForces, setPlaneForces] = useState({ lift: 50, weight: 50, thrust: 50, drag: 50 });

  const t = (en: string, sc: string, tc: string) => {
    if (chineseType === 'simplified') return sc;
    if (chineseType === 'traditional') return tc;
    return en;
  };

  const currentForces = activeTab === 'box' 
    ? { up: boxForces.up, down: boxForces.down, left: boxForces.left, right: boxForces.right }
    : { up: planeForces.lift, down: planeForces.weight, left: planeForces.drag, right: planeForces.thrust };

  const balanced = currentForces.up === currentForces.down && currentForces.left === currentForces.right;
  const netX = currentForces.right - currentForces.left;
  const netY = currentForces.down - currentForces.up;

  const getPlaneState = () => {
    if (activeTab !== 'plane') return null;
    const { lift, weight, thrust, drag } = planeForces;
    let states = [];
    if (lift > weight) states.push(t('Rising', '上升', '上升'));
    else if (weight > lift) states.push(t('Falling', '下降', '下降'));
    
    if (thrust > drag) states.push(t('Accelerating Forward', '向前加速', '向前加速'));
    else if (drag > thrust) states.push(t('Decelerating', '减速', '減速'));
    else if (thrust === 0 && drag === 0 && lift < weight) states.push(t('Stalling', '失速', '失速'));

    return states.length > 0 ? states.join(' & ') : t('Steady Flight', '平稳飞行', '平穩飛行');
  };

  return (
    <div className="bg-white rounded-[2rem] border-2 border-gray-100 shadow-xl overflow-hidden w-full">
      <div className="bg-gradient-to-r from-blue-50 via-white to-green-50 p-6 border-b-2 border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-3">
            <Zap className="text-yellow-500" />
            {t('Balanced & Unbalanced Forces', '平衡力与非平衡力', '平衡力與非平衡力')}
          </h3>
          <p className="text-gray-500 font-bold text-sm mt-1">
            {t('Explore how resultant forces affect motion.', '探索合力如何影响运动。', '探索合力如何影響運動。')}
          </p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200 shadow-sm">
          <button 
            onClick={() => setActiveTab('box')}
            className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'box' ? 'bg-white shadow-md text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {t('Box Simulator', '方块模拟器', '方塊模擬器')}
          </button>
          <button 
            onClick={() => setActiveTab('plane')}
            className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'plane' ? 'bg-white shadow-md text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {t('Plane Simulator', '飞机模拟器', '飛機模擬器')}
          </button>
        </div>
      </div>

      <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Simulator View */}
        <div className={`relative rounded-[3rem] border-8 border-slate-800 aspect-square flex items-center justify-center overflow-hidden transition-colors duration-700 ${activeTab === 'plane' ? 'bg-sky-400' : 'bg-slate-900'}`}>
          {/* Environment Backgrounds */}
          {activeTab === 'box' ? (
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          ) : (
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-10 right-10 w-20 h-20 bg-yellow-200 rounded-full blur-2xl opacity-40 shrink-0" />
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ x: 400 + i * 150 }}
                  animate={{ x: -100 }}
                  transition={{ 
                    duration: 10 + Math.random() * 5, 
                    repeat: Infinity, 
                    ease: "linear",
                    delay: i * 2 
                  }}
                  className="absolute w-24 h-8 bg-white/40 rounded-full blur-md"
                  style={{ top: `${15 + i * 20}%` }}
                />
              ))}
            </div>
          )}
          
          <div className="absolute top-6 left-6 flex items-center gap-3 bg-slate-800/80 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 z-40">
            <div className={`w-4 h-4 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)] ${balanced ? 'bg-green-500 shadow-[0_0_15px_#22c55e]' : 'bg-red-500 shadow-[0_0_15px_#ef4444]'}`} />
            <span className="text-xs font-black text-white uppercase tracking-widest">
              {balanced ? t('Balanced', '平衡', '平衡') : t('Unbalanced', '非平衡', '非平衡')}
            </span>
          </div>

          {activeTab === 'plane' && (
            <div className="absolute bottom-6 right-6 text-right z-40 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
              <span className="text-[10px] font-black text-white px-2 py-0.5 bg-sky-600 rounded mb-1 inline-block uppercase tracking-widest">
                {t('Flight Status', '飞行状态', '飛行狀態')}
              </span>
              <span className="text-xl font-black text-white italic uppercase tracking-tight block drop-shadow-md">
                {getPlaneState()}
              </span>
            </div>
          )}

          {/* Forces Diagram */}
          <div className="relative flex items-center justify-center">
            {/* The Object (Box or Plane) */}
            <motion.div 
              animate={{ 
                x: balanced ? 0 : netX * 0.6,
                y: balanced ? 0 : netY * 0.6,
                rotate: activeTab === 'plane' ? (netY * 0.1) : 0
              }}
              transition={{ type: 'spring', damping: 12, stiffness: 100 }}
              className={`relative z-20 w-24 h-24 flex items-center justify-center`}
            >
              {activeTab === 'box' ? (
                <div className="w-16 h-16 bg-orange-500 rounded-xl shadow-[0_8px_0_0_#c2410c] border-2 border-orange-400/30 z-10 flex items-center justify-center relative">
                   <div className="w-[80%] h-px bg-orange-400/50" />
                   <div className="absolute inset-2 border border-white/10 rounded-sm" />
                </div>
              ) : (
                <div className="relative z-10 w-24 h-16 flex items-center justify-center filter drop-shadow-2xl scale-x-[-1]">
                   <div className="w-20 h-6 bg-slate-200 rounded-full relative shadow-inner">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-20 bg-slate-300 rounded-full -rotate-6 shadow-md" />
                      <div className="absolute right-1 -top-4 w-4 h-6 bg-slate-300 rounded-t-full skew-x-12" />
                      <div className="absolute top-1 left-4 flex gap-1">
                         <div className="w-1 h-1 bg-sky-900/30 rounded-full" />
                         <div className="w-1 h-1 bg-sky-900/30 rounded-full" />
                         <div className="w-1 h-1 bg-sky-900/30 rounded-full" />
                      </div>
                      <div className="absolute left-0 w-4 h-6 bg-slate-400/20 rounded-l-full" />
                   </div>
                </div>
              )}

              {/* Force Arrows - Up (Red) */}
              <div 
                className="absolute bottom-full left-1/2 -translate-x-1/2 flex flex-col items-center"
                style={{ height: `${currentForces.up}px` }}
              >
                <div className="text-[11px] font-black text-red-500 mb-2 absolute -top-8 whitespace-nowrap uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded backdrop-blur-sm">
                  {activeTab === 'box' ? t('Up', '向上', '向上') : t('Lift', '升力', '升力')}
                </div>
                <div className="w-4 h-full bg-red-500 rounded-t-full relative shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-6 border-l-4 border-t-4 border-red-500 rotate-45" />
                </div>
              </div>

              {/* Force Arrows - Down (Yellow) */}
              <div 
                className="absolute top-full left-1/2 -translate-x-1/2 flex flex-col items-center"
                style={{ height: `${currentForces.down}px` }}
              >
                <div className="w-4 h-full bg-yellow-400 rounded-b-full relative shadow-[0_0_15px_rgba(234,179,8,0.4)]">
                   <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-6 border-r-4 border-b-4 border-yellow-400 rotate-45" />
                </div>
                <div className="text-[11px] font-black text-yellow-600 mt-2 absolute -bottom-8 whitespace-nowrap uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded backdrop-blur-sm">
                  {activeTab === 'box' ? t('Down', '向下', '向下') : t('Weight', '重力', '重力')}
                </div>
              </div>

              {/* Force Arrows - Left (Blue) */}
              <div 
                className="absolute right-full top-1/2 -translate-y-1/2 flex items-center justify-end"
                style={{ width: `${currentForces.left}px` }}
              >
                <div className="text-[11px] font-black text-blue-500 mr-2 absolute -left-20 whitespace-nowrap uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded backdrop-blur-sm">
                  {activeTab === 'box' ? t('Left', '向左', '向左') : t('Drag', '阻力', '阻力')}
                </div>
                <div className="h-4 w-full bg-blue-500 rounded-l-full relative shadow-[0_0_15px_rgba(59,130,246,0.4)]">
                   <div className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 border-l-4 border-b-4 border-blue-500 rotate-45" />
                </div>
              </div>

              {/* Force Arrows - Right (Green) */}
              <div 
                className="absolute left-full top-1/2 -translate-y-1/2 flex items-center justify-start"
                style={{ width: `${currentForces.right}px` }}
              >
                <div className="h-4 w-full bg-emerald-500 rounded-r-full relative shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                   <div className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 border-r-4 border-t-4 border-emerald-500 rotate-45" />
                </div>
                <div className="text-[11px] font-black text-emerald-600 ml-2 absolute -right-20 whitespace-nowrap uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded backdrop-blur-sm">
                  {activeTab === 'box' ? t('Right', '向右', '向右') : t('Thrust', '推力', '推力')}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Controls Layout - 2x2 Grid with larger labels */}
        <div className="flex flex-col justify-center space-y-6">
          <div className="bg-gray-50 p-8 rounded-[2.5rem] border-2 border-gray-100 shadow-inner">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 border-b pb-4">
              {activeTab === 'box' ? t('Force Magnitudes (N)', '受力大小 (N)', '受力大小 (N)') : t('Flight Parameter Control', '飞行参数控制', '飛行參數控制')}
            </h4>
            
            <div className="grid grid-cols-2 gap-x-8 gap-y-10">
              {/* Force 1 (Up/Lift) */}
              <div className="space-y-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-red-400 uppercase tracking-widest leading-none mb-1">
                      {activeTab === 'box' ? t('Vertical', '纵向', '縱向') : t('Aerodynamic', '空气动力', '空氣動力')}
                    </span>
                    <span className="text-xs font-black text-red-600 uppercase tracking-tight">
                      {activeTab === 'box' ? t('Upward', '向上', '向上') : t('Lift', '升力', '升力')}
                    </span>
                  </div>
                  <span className="font-black text-lg text-gray-900 tracking-tighter">{activeTab === 'box' ? boxForces.up : planeForces.lift}<span className="text-[10px] ml-0.5 text-gray-400">N</span></span>
                </div>
                <input 
                  type="range" min="0" max="150" 
                  value={activeTab === 'box' ? boxForces.up : planeForces.lift}
                  onChange={(e) => activeTab === 'box' ? setBoxForces({...boxForces, up: parseInt(e.target.value)}) : setPlaneForces({...planeForces, lift: parseInt(e.target.value)})}
                  className="w-full h-2.5 bg-red-50 rounded-lg appearance-none cursor-pointer accent-red-500 border border-red-100"
                />
              </div>

              {/* Force 2 (Down/Weight) */}
              <div className="space-y-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest leading-none mb-1">
                      {activeTab === 'box' ? t('Vertical', '纵向', '縱向') : t('Gravitational', '引力', '引力')}
                    </span>
                    <span className="text-xs font-black text-yellow-600 uppercase tracking-tight">
                      {activeTab === 'box' ? t('Downward', '向下', '向下') : t('Weight', '重力', '重力')}
                    </span>
                  </div>
                  <span className="font-black text-lg text-gray-900 tracking-tighter">{activeTab === 'box' ? boxForces.down : planeForces.weight}<span className="text-[10px] ml-0.5 text-gray-400">N</span></span>
                </div>
                <input 
                  type="range" min="0" max="150" 
                  value={activeTab === 'box' ? boxForces.down : planeForces.weight}
                  onChange={(e) => activeTab === 'box' ? setBoxForces({...boxForces, down: parseInt(e.target.value)}) : setPlaneForces({...planeForces, weight: parseInt(e.target.value)})}
                  className="w-full h-2.5 bg-yellow-50 rounded-lg appearance-none cursor-pointer accent-yellow-400 border border-yellow-100"
                />
              </div>

              {/* Force 3 (Left/Drag) */}
              <div className="space-y-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">
                      {activeTab === 'box' ? t('Horizontal', '横向', '橫向') : t('Resistance', '阻力', '阻力')}
                    </span>
                    <span className="text-xs font-black text-blue-600 uppercase tracking-tight">
                      {activeTab === 'box' ? t('Leftward', '向左', '向左') : t('Drag', '阻力', '阻力')}
                    </span>
                  </div>
                  <span className="font-black text-lg text-gray-900 tracking-tighter">{activeTab === 'box' ? boxForces.left : planeForces.drag}<span className="text-[10px] ml-0.5 text-gray-400">N</span></span>
                </div>
                <input 
                  type="range" min="0" max="150" 
                  value={activeTab === 'box' ? boxForces.left : planeForces.drag}
                  onChange={(e) => activeTab === 'box' ? setBoxForces({...boxForces, left: parseInt(e.target.value)}) : setPlaneForces({...planeForces, drag: parseInt(e.target.value)})}
                  className="w-full h-2.5 bg-blue-50 rounded-lg appearance-none cursor-pointer accent-blue-500 border border-blue-100"
                />
              </div>

              {/* Force 4 (Right/Thrust) */}
              <div className="space-y-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1">
                      {activeTab === 'box' ? t('Horizontal', '横向', '橫向') : t('Propulsion', '推进力', '推進力')}
                    </span>
                    <span className="text-xs font-black text-emerald-600 uppercase tracking-tight">
                      {activeTab === 'box' ? t('Rightward', '向右', '向右') : t('Thrust', '推力', '推力')}
                    </span>
                  </div>
                  <span className="font-black text-lg text-gray-900 tracking-tighter">{activeTab === 'box' ? boxForces.right : planeForces.thrust}<span className="text-[10px] ml-0.5 text-gray-400">N</span></span>
                </div>
                <input 
                  type="range" min="0" max="150" 
                  value={activeTab === 'box' ? boxForces.right : planeForces.thrust}
                  onChange={(e) => activeTab === 'box' ? setBoxForces({...boxForces, right: parseInt(e.target.value)}) : setPlaneForces({...planeForces, thrust: parseInt(e.target.value)})}
                  className="w-full h-2.5 bg-emerald-50 rounded-lg appearance-none cursor-pointer accent-emerald-500 border border-emerald-100"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm">
             <div className="flex items-center gap-3 mb-4">
               <div className="bg-slate-200 p-2.5 rounded-xl text-slate-600 shadow-inner">
                 <Info size={18} />
               </div>
               <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{t('Physics Insights', '物理小知识', '物理小知識')}</span>
             </div>
             <p className="text-xs font-semibold text-slate-600 leading-relaxed italic">
               {balanced 
                ? t('When forces are balanced, the net force is ZERO. According to Newton\'s 1st Law, the object remains stationary or moves at constant velocity.', '当受力平衡时，合力为零。根据牛顿第一定律，物体保持静止或匀速直线运动。', '當受力平衡時，合力為零。根據牛頓第一定律，物體保持靜止或勻速直線運動。')
                : t('Unbalanced forces result in ACCELERATION. The object changes its speed or direction of motion.', '非平衡力会导致加速度。物体改变其速度或运动方向。', '非平衡力會導致加速度。物體改變其速度或運動方向。')}
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Metadata for sorting
(ForcesCard as any).UNIT = 3;
(ForcesCard as any).SUBJECT = 'PHYSICS';

export default ForcesCard;
