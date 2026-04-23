import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ArrowLeft, RefreshCcw, Play, Pause, Info, Activity, ArrowDown, ArrowUp, Droplets, FlaskConical, Shield, Zap, Target, CircleCheck, Beaker, Sun, FlaskRound } from 'lucide-react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: 'red' | 'blue';
}

const DiffusionCard: React.FC<{ chineseType?: 'traditional' | 'simplified' | null }> = ({ chineseType }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [redLeft, setRedLeft] = useState(20);
  const [blueRight, setBlueRight] = useState(20);
  const [isPartitionRemoved, setIsPartitionRemoved] = useState(false);
  const [isRunning, setIsRunning] = useState(true);
  const [particles, setParticles] = useState<Particle[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const [stats, setStats] = useState({
    redLeft: 0,
    redRight: 0,
    blueLeft: 0,
    blueRight: 0,
    netRed: 'None',
    netBlue: 'None'
  });

  const t = (en: string, sc: string, tc: string) => {
    if (chineseType === 'simplified') return sc;
    if (chineseType === 'traditional') return tc;
    return en;
  };

  const containerWidth = 600;
  const containerHeight = 300;

  // Initialize particles
  const initParticles = () => {
    const newParticles: Particle[] = [];
    const speed = 2;

    // Red particles on the left
    for (let i = 0; i < redLeft; i++) {
      newParticles.push({
        x: Math.random() * (containerWidth / 2 - 10),
        y: Math.random() * containerHeight,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        color: 'red'
      });
    }

    // Blue particles on the right
    for (let i = 0; i < blueRight; i++) {
      newParticles.push({
        x: containerWidth / 2 + 10 + Math.random() * (containerWidth / 2 - 10),
        y: Math.random() * containerHeight,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        color: 'blue'
      });
    }

    particlesRef.current = newParticles;
    setParticles(newParticles);
    setIsPartitionRemoved(false);
  };

  useEffect(() => {
    initParticles();
  }, [redLeft, blueRight]);

  useEffect(() => {
    if (!isRunning) return;

    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const update = () => {
      // Update particle positions in the ref
      particlesRef.current = particlesRef.current.map(p => {
        let nx = p.x + p.vx;
        let ny = p.y + p.vy;

        // Brownian-like random jitter
        p.vx += (Math.random() - 0.5) * 0.2;
        p.vy += (Math.random() - 0.5) * 0.2;

        // Limit speed
        const maxSpeed = 3;
        const currentSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (currentSpeed > maxSpeed) {
          p.vx = (p.vx / currentSpeed) * maxSpeed;
          p.vy = (p.vy / currentSpeed) * maxSpeed;
        }

        // Boundary collisions
        if (nx < 0) { nx = 0; p.vx *= -1; }
        if (nx > containerWidth) { nx = containerWidth; p.vx *= -1; }
        if (ny < 0) { ny = 0; p.vy *= -1; }
        if (ny > containerHeight) { ny = containerHeight; p.vy *= -1; }

        // Partition collision
        if (!isPartitionRemoved) {
          const mid = containerWidth / 2;
          if (p.x < mid && nx >= mid) {
            p.vx *= -1;
            nx = mid - 1;
          } else if (p.x > mid && nx <= mid) {
            p.vx *= -1;
            nx = mid + 1;
          }
        }

        return { ...p, x: nx, y: ny };
      });

      // Update stats for UI
      const mid = containerWidth / 2;
      const next = particlesRef.current;
      const s = {
        redLeft: next.filter(p => p.color === 'red' && p.x < mid).length,
        redRight: next.filter(p => p.color === 'red' && p.x >= mid).length,
        blueLeft: next.filter(p => p.color === 'blue' && p.x < mid).length,
        blueRight: next.filter(p => p.color === 'blue' && p.x >= mid).length,
        netRed: t('None', '无', '無'),
        netBlue: t('None', '无', '無')
      };

      if (s.redLeft > s.redRight + 2) s.netRed = t('Right', '向右', '向右');
      else if (s.redRight > s.redLeft + 2) s.netRed = t('Left', '向左', '向左');
      
      if (s.blueRight > s.blueLeft + 2) s.netBlue = t('Left', '向左', '向左');
      else if (s.blueLeft > s.blueRight + 2) s.netBlue = t('Right', '向右', '向右');

      setStats(s);

      // Draw
      ctx.clearRect(0, 0, containerWidth, containerHeight);
      
      // Draw partition if exists
      if (!isPartitionRemoved) {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.moveTo(containerWidth / 2, 0);
        ctx.lineTo(containerWidth / 2, containerHeight);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      particlesRef.current.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = p.color === 'red' ? '#ef4444' : '#3b82f6';
        ctx.fill();
        // Add a small glow
        ctx.shadowBlur = 5;
        ctx.shadowColor = p.color === 'red' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(59, 130, 246, 0.5)';
        ctx.closePath();
      });
      ctx.shadowBlur = 0;

      animationFrameId = requestAnimationFrame(update);
    };

    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isRunning, isPartitionRemoved, chineseType]);

  return (
    <div className="bg-white rounded-[2rem] border-2 border-gray-100 shadow-xl overflow-hidden w-full">
      <div className="bg-gradient-to-r from-red-50 to-blue-50 p-6 border-b-2 border-gray-100">
        <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-3">
          <RefreshCcw className="text-emerald-500" />
          {t('Diffusion', '扩散', '擴散')}
        </h3>
        <p className="text-gray-500 font-bold text-sm mt-1">
          {t('Observe how particles move from an area of high concentration to an area of low concentration.', '观察粒子如何从高浓度区域移动到低浓度区域。', '觀察粒子如何從高濃度區域移動到低濃度區域。')}
        </p>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls */}
          <div className="space-y-6">
            <div className="bg-red-50 p-6 rounded-3xl border-2 border-red-100">
              <label className="block text-xs font-black text-red-400 uppercase tracking-widest mb-4">
                {t('Red Particles (Left Side)', '红色粒子 (左侧)', '紅色粒子 (左側)')}: {redLeft}
              </label>
              <input 
                type="range" min="0" max="100" value={redLeft} 
                onChange={(e) => setRedLeft(parseInt(e.target.value))}
                className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
            </div>

            <div className="bg-blue-50 p-6 rounded-3xl border-2 border-blue-100">
              <label className="block text-xs font-black text-blue-400 uppercase tracking-widest mb-4">
                {t('Blue Particles (Right Side)', '蓝色粒子 (右侧)', '藍色粒子 (右側)')}: {blueRight}
              </label>
              <input 
                type="range" min="0" max="100" value={blueRight} 
                onChange={(e) => setBlueRight(parseInt(e.target.value))}
                className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setIsPartitionRemoved(!isPartitionRemoved)}
                className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-[0_4px_0_0_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-1 ${
                  isPartitionRemoved 
                  ? 'bg-gray-100 text-gray-500 border-2 border-gray-200' 
                  : 'bg-emerald-500 text-white shadow-[0_4px_0_0_#059669]'
                }`}
              >
                {isPartitionRemoved ? t('Reset Partition', '重置隔板', '重置隔板') : t('Remove Partition', '移除隔板', '移除隔板')}
              </button>
              <button 
                onClick={() => setIsRunning(!isRunning)}
                className="w-full py-4 rounded-2xl font-black uppercase tracking-widest border-2 border-gray-200 text-gray-600 flex items-center justify-center gap-2 hover:bg-gray-50"
              >
                {isRunning ? <><Pause size={20} /> {t('Pause', '暂停', '暫停')}</> : <><Play size={20} /> {t('Resume', '继续', '繼續')}</>}
              </button>
            </div>
          </div>

          {/* Simulation Stage */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="relative bg-gray-900 rounded-[2.5rem] p-4 border-8 border-gray-800 shadow-inner overflow-hidden aspect-[2/1] w-full">
              <canvas 
                ref={canvasRef} 
                width={containerWidth} 
                height={containerHeight}
                className="w-full h-full"
              />
            </div>

            {/* Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border-2 border-gray-100 text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('Red (Left)', '红 (左)', '紅 (左)')}</p>
                <p className="text-2xl font-black text-red-500">{stats.redLeft}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border-2 border-gray-100 text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('Red (Right)', '红 (右)', '紅 (右)')}</p>
                <p className="text-2xl font-black text-red-500">{stats.redRight}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border-2 border-gray-100 text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('Blue (Left)', '蓝 (左)', '藍 (左)')}</p>
                <p className="text-2xl font-black text-blue-500">{stats.blueLeft}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border-2 border-gray-100 text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('Blue (Right)', '蓝 (右)', '藍 (右)')}</p>
                <p className="text-2xl font-black text-blue-500">{stats.blueRight}</p>
              </div>
            </div>

            {/* Net Diffusion Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-red-50 p-4 rounded-2xl border-2 border-red-100 flex items-center justify-between">
                <span className="text-xs font-black text-red-600 uppercase tracking-widest">{t('Net Red Diffusion', '红色净扩散', '紅色淨擴散')}</span>
                <div className="flex items-center gap-2">
                  {stats.netRed === t('Right', '向右', '向右') && <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity }}><ArrowRight className="text-red-500" /></motion.div>}
                  {stats.netRed === t('Left', '向左', '向左') && <motion.div animate={{ x: [0, -5, 0] }} transition={{ repeat: Infinity }}><ArrowLeft className="text-red-500" /></motion.div>}
                  <span className="font-black text-red-700">{stats.netRed}</span>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-2xl border-2 border-blue-100 flex items-center justify-between">
                <span className="text-xs font-black text-blue-600 uppercase tracking-widest">{t('Net Blue Diffusion', '蓝色净扩散', '藍色淨擴散')}</span>
                <div className="flex items-center gap-2">
                  {stats.netBlue === t('Right', '向右', '向右') && <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity }}><ArrowRight className="text-blue-500" /></motion.div>}
                  {stats.netBlue === t('Left', '向左', '向左') && <motion.div animate={{ x: [0, -5, 0] }} transition={{ repeat: Infinity }}><ArrowLeft className="text-blue-500" /></motion.div>}
                  <span className="font-black text-blue-700">{stats.netBlue}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MagnifiedRBCView: React.FC<{ 
  zone: 'lungs' | 'cells' | 'transit'; 
  t: (en: string, sc: string, tc: string) => string;
}> = ({ zone, t }) => {
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
        {/* Vessel Wall */}
        <div className="absolute top-0 left-0 w-full h-2 bg-red-200/30" />
        <div className="absolute bottom-0 left-0 w-full h-2 bg-red-200/30" />
        
        {/* Magnified RBC */}
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

const RespirationCard: React.FC<{ isAssistMode?: boolean; chineseType?: 'traditional' | 'simplified' | null }> = ({ isAssistMode, chineseType }) => {
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

  useEffect(() => {
    if (!isRunning) return;

    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const update = () => {
      ctx.clearRect(0, 0, containerWidth, containerHeight);

      // Draw the loop (vessels)
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, loopRadiusX, loopRadiusY, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.1)';
      ctx.lineWidth = 40;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.2)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Update and draw RBCs
      rbcs.current.forEach((rbc, idx) => {
        rbc.angle += 0.005 * speed;
        if (rbc.angle > Math.PI * 2) rbc.angle -= Math.PI * 2;

        const x = centerX + Math.cos(rbc.angle) * loopRadiusX;
        const y = centerY + Math.sin(rbc.angle) * loopRadiusY;

        // Interaction logic
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

        // Draw RBC
        ctx.save();
        ctx.translate(x, y);
        const rbcColor = `rgb(${150 + rbc.oxygenLevel * 105}, ${20 + rbc.oxygenLevel * 30}, ${40 + rbc.oxygenLevel * 20})`;
        ctx.fillStyle = rbcColor;
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 8, rbc.angle, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });



      // Draw Labels
      ctx.fillStyle = '#3b82f6';
      ctx.font = 'bold 14px Inter';
      ctx.textAlign = 'center';
      
      // Draw Lungs Graphic
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
      
      // Draw Body Cells Graphic
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

  const t = (en: string, sc: string, tc: string) => {
    if (chineseType === 'simplified') return sc;
    if (chineseType === 'traditional') return tc;
    return en;
  };

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

const RespiratorySystemCard: React.FC<{ chineseType?: 'traditional' | 'simplified' | null }> = ({ chineseType }) => {
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
        {/* Main Pathway Visualization */}
        <div className="space-y-8">
          <div className="relative h-[500px] bg-gray-50 rounded-[2.5rem] border-4 border-gray-100 p-8 flex flex-col items-center justify-between overflow-hidden">
            {/* Thoracic Cavity Background */}
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
                    {/* Air Flow Arrows */}
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

            {/* Status Indicator */}
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

        {/* Windpipe Detail View */}
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
              {/* Cilia and Mucus Animation */}
              <div className="relative w-full h-48 bg-orange-50/30 rounded-2xl border-2 border-orange-100 overflow-hidden">
                {/* Cilia */}
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

                {/* Mucus Layer */}
                <motion.div 
                  animate={{ x: [-10, 10, -10] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute bottom-4 w-[120%] h-4 bg-emerald-200/40 blur-sm rounded-full -left-[10%]"
                />

                {/* Trapped Particles */}
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

                {/* Sweeping Movement */}
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

const DissolvingSolubilityCard: React.FC<{ chineseType?: 'traditional' | 'simplified' | null }> = ({ chineseType }) => {
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
                {/* Beaker water */}
                <div className="absolute inset-0 bg-gradient-to-b from-blue-50/20 to-blue-200/20" />
                
                {/* Particles / Substance Visual */}
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
                          {/* Large piece breaking into smaller ones */}
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

                {added && !stirring && substances[solute!]?.soluble && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-4 inset-x-4 bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-blue-100 shadow-md text-center"
                  >
                    <div className="flex items-center justify-center gap-1.5 text-[9px] font-black uppercase tracking-tight text-gray-700">
                      <span className="text-blue-600">{substances[solute!].name}</span>
                      <span>+</span>
                      <span className="text-blue-400">{t('Water', '水', '水')}</span>
                      <span>→</span>
                      <span className="text-emerald-500">{substances[solute!].solution}</span>
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

          {/* Section 2: Concentration & Light */}
          <div className="space-y-6 bg-purple-50/30 p-6 rounded-[2.5rem] border-2 border-purple-100 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Part 2</span>
                <h4 className="text-lg font-black text-gray-800 uppercase">{t('Light Absorbtion', '光的吸收', '光的吸收')}</h4>
              </div>

              <div className="flex gap-2 mb-6">
                {Object.keys(concSubstances).map((key) => (
                  <button
                    key={key}
                    onClick={() => setConcentrationSolute(key as any)}
                    className={`flex-1 p-2 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${concentrationSolute === key ? 'border-purple-500 bg-white shadow-sm' : 'border-gray-50 bg-white/50 hover:bg-white'}`}
                  >
                    <div className={`w-5 h-5 rounded-full ${concSubstances[key as keyof typeof concSubstances].color} shadow-inner`} />
                    <span className="text-[8px] font-black uppercase text-center leading-tight">
                      {concSubstances[key as keyof typeof concSubstances].name.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>

              <div className="relative h-56 bg-gray-900 rounded-3xl border-2 border-purple-100 overflow-hidden flex items-center justify-center shadow-2xl">
                {/* Solution */}
                <div 
                  className="absolute inset-0 transition-all duration-500"
                  style={{ 
                    backgroundColor: concSubstances[concentrationSolute].solutionColor,
                    opacity: concAmount / 100 + 0.15
                  }}
                />
                
                {/* Flashlight beam source */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-10 bg-gray-800 rounded-r-2xl border-r-4 border-yellow-400/50 shadow-[4px_0_15px_rgba(250,204,21,0.3)] z-20" />
                
                {/* Light streak through solution */}
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

          {/* Section 3: Saturation */}
          <div className="space-y-6 bg-emerald-50/30 p-6 rounded-[2.5rem] border-2 border-emerald-100 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Part 3</span>
                <h4 className="text-lg font-black text-gray-800 uppercase">{t('Saturation Limit', '溶解度极限', '溶解度極限')}</h4>
              </div>

              <div className="relative h-56 bg-white rounded-3xl border-2 border-emerald-100 overflow-hidden flex items-center justify-center shadow-inner">
                  {/* Liquid */}
                  <div 
                    className="absolute bottom-0 w-full transition-all duration-500" 
                    style={{ 
                      backgroundColor: 'rgba(16, 185, 129, 0.8)', 
                      height: saturationAmount > 0 ? '80%' : '0%',
                      opacity: (saturationAmount / 160) + 0.2
                    }} 
                  />
                  
                  {/* Settled Solids at the bottom */}
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
                    : t('Water has enough space to hold these particles.', '水有足够的空间可以容纳这些微粒。', '水有足夠的空間可以容納這些微粒。')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


const BloodCompositionCard: React.FC<{ chineseType?: 'traditional' | 'simplified' | null }> = ({ chineseType }) => {
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
            {/* Centrifuge Machine Visual (Placeholder for aesthetic) */}
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
                      {/* Spinning test tubes */}
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
                          onClick={() => setSelectedCell(null)} // Click plasma resets detail view
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
                    {/* Vessel wall with a break */}
                    <div className="absolute top-1/2 left-0 w-full h-12 bg-red-100/50 -translate-y-1/2 overflow-hidden">
                       {/* Blood flow */}
                       <motion.div 
                         animate={{ x: [-100, 400] }}
                         transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                         className="flex gap-4 items-center h-full"
                       >
                         {[...Array(10)].map((_, i) => <div key={i} className="w-4 h-2 bg-red-400/30 rounded-full" />)}
                       </motion.div>
                       
                       {/* The gap */}
                       <div className="absolute top-0 right-1/4 w-12 h-2 bg-orange-50 border-x border-orange-200" />
                       
                       {/* Clotting Animation */}
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
                              {/* Phagocyte */}
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
                              
                              {/* Pathogen */}
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
                              {/* Lymphocyte */}
                              <motion.div 
                                className="w-16 h-16 bg-blue-100 border-4 border-blue-400 rounded-full flex items-center justify-center"
                              >
                                 <Zap className="text-blue-500" size={24} />
                              </motion.div>
                              
                              {/* Antibodies */}
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
                              
                              {/* Pathogens with antibodies attached */}
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

const QuickFacts: React.FC = () => {
  const [chineseType, setChineseType] = useState<'traditional' | 'simplified' | null>(null);
  const [showTranslate, setShowTranslate] = useState(false);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-12 pb-32 relative">
      {/* Translation Toggle */}
      <div className="absolute top-6 right-6 z-50 flex flex-col items-end gap-2">
        <button 
          onClick={() => setShowTranslate(!showTranslate)}
          className="bg-purple-600 text-white px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest shadow-lg hover:bg-purple-700 transition-all flex items-center gap-2"
        >
          <RefreshCcw size={14} className={showTranslate ? 'animate-spin' : ''} />
          Translate
        </button>
        
        <AnimatePresence>
          {showTranslate && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white p-2 rounded-2xl shadow-xl border-2 border-purple-100 flex gap-2"
            >
              <button 
                onClick={() => setChineseType(null)}
                className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase transition-all ${!chineseType ? 'bg-purple-100 text-purple-700' : 'text-gray-400 hover:bg-gray-50'}`}
              >
                EN
              </button>
              <button 
                onClick={() => setChineseType('simplified')}
                className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase transition-all ${chineseType === 'simplified' ? 'bg-purple-100 text-purple-700' : 'text-gray-400 hover:bg-gray-50'}`}
              >
                简
              </button>
              <button 
                onClick={() => setChineseType('traditional')}
                className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase transition-all ${chineseType === 'traditional' ? 'bg-purple-100 text-purple-700' : 'text-gray-400 hover:bg-gray-50'}`}
              >
                繁
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <header className="text-center space-y-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block bg-emerald-100 text-emerald-600 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest"
        >
          {chineseType ? (chineseType === 'simplified' ? '学习中心' : '學習中心') : 'Learning Hub'}
        </motion.div>
        <h2 className="text-4xl md:text-5xl font-black text-gray-800 uppercase tracking-tight">
          {chineseType ? (chineseType === 'simplified' ? '速览知识点' : '速覽知識點') : 'Quick Facts'}
        </h2>
        <p className="text-gray-500 font-bold max-w-2xl mx-auto">
          {chineseType 
            ? (chineseType === 'simplified' ? '互动概念卡片，助你直观掌握关键科学原理。' : '互動概念卡片，助你直觀掌握關鍵科學原理。') 
            : 'Interactive concept cards to help you visualize and master key scientific principles.'}
        </p>
      </header>

      <div className="space-y-12">
        <DissolvingSolubilityCard chineseType={chineseType} />
        <BloodCompositionCard chineseType={chineseType} />
        <RespiratorySystemCard chineseType={chineseType} />
        <DiffusionCard chineseType={chineseType} />
        <RespirationCard chineseType={chineseType} />
        
        <div className="bg-gray-50 border-4 border-dashed border-gray-200 rounded-[3rem] p-12 text-center">
          <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center text-gray-300 mx-auto mb-4 shadow-sm">
            <Info size={32} />
          </div>
          <p className="text-gray-400 font-black uppercase tracking-widest text-sm">
            {chineseType ? (chineseType === 'simplified' ? '更多概念即将推出...' : '更多概念即將推出...') : 'More concepts coming soon...'}
          </p>
        </div>
      </div>
    </div>
  );
};


export default QuickFacts;
