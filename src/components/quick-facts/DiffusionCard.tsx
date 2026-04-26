import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCcw, Pause, Play, ArrowRight, ArrowLeft } from 'lucide-react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: 'red' | 'blue';
}

interface DiffusionCardProps {
  chineseType?: 'traditional' | 'simplified' | null;
}

const DiffusionCard: React.FC<DiffusionCardProps> = ({ chineseType }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [redLeft, setRedLeft] = useState(20);
  const [blueRight, setBlueRight] = useState(20);
  const [isPartitionRemoved, setIsPartitionRemoved] = useState(false);
  const [isRunning, setIsRunning] = useState(true);
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

  const initParticles = () => {
    const newParticles: Particle[] = [];
    const speed = 2;

    for (let i = 0; i < redLeft; i++) {
      newParticles.push({
        x: Math.random() * (containerWidth / 2 - 10),
        y: Math.random() * containerHeight,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        color: 'red'
      });
    }

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
      particlesRef.current = particlesRef.current.map(p => {
        let nx = p.x + p.vx;
        let ny = p.y + p.vy;

        p.vx += (Math.random() - 0.5) * 0.2;
        p.vy += (Math.random() - 0.5) * 0.2;

        const maxSpeed = 3;
        const currentSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (currentSpeed > maxSpeed) {
          p.vx = (p.vx / currentSpeed) * maxSpeed;
          p.vy = (p.vy / currentSpeed) * maxSpeed;
        }

        if (nx < 0) { nx = 0; p.vx *= -1; }
        if (nx > containerWidth) { nx = containerWidth; p.vx *= -1; }
        if (ny < 0) { ny = 0; p.vy *= -1; }
        if (ny > containerHeight) { ny = containerHeight; p.vy *= -1; }

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

      ctx.clearRect(0, 0, containerWidth, containerHeight);
      
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

          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="relative bg-gray-900 rounded-[2.5rem] p-4 border-8 border-gray-800 shadow-inner overflow-hidden aspect-[2/1] w-full">
              <canvas 
                ref={canvasRef} 
                width={containerWidth} 
                height={containerHeight}
                className="w-full h-full"
              />
            </div>

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

// Metadata for sorting
(DiffusionCard as any).UNIT = 1;
(DiffusionCard as any).SUBJECT = 'CHEMISTRY';

export default DiffusionCard;
