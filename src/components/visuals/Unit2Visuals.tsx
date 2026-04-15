import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Beaker, 
  Thermometer, 
  Scale, 
  Filter, 
  Flame, 
  Droplets,
  Plus,
  Minus,
  RefreshCw
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

interface VisualProps {
  isAssistMode: boolean;
  chineseType: 'traditional' | 'simplified';
}

// 1. Dissolving Animation (Concept 1)
export const DissolvingAnimation: React.FC<VisualProps> = ({ isAssistMode, chineseType }) => {
  const [isDissolving, setIsDissolving] = useState(false);
  
  return (
    <div className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-100 my-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-black text-blue-800 uppercase tracking-wider text-sm">
          {isAssistMode ? (chineseType === 'traditional' ? '溶解過程演示' : '溶解过程演示') : 'Dissolving Process'}
        </h4>
        <button 
          onClick={() => setIsDissolving(!isDissolving)}
          className="bg-blue-500 text-white px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest shadow-[0_4px_0_0_#1d4ed8] active:shadow-none active:translate-y-1 transition-all flex items-center gap-2"
        >
          <RefreshCw size={14} className={isDissolving ? 'animate-spin' : ''} />
          {isDissolving ? 'Reset' : 'Start Dissolving'}
        </button>
      </div>
      
      <div className="relative h-48 bg-white rounded-xl border-2 border-blue-200 overflow-hidden flex items-center justify-center">
        {/* Solvent Particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={`solvent-${i}`}
            className="absolute w-2 h-2 bg-blue-300 rounded-full opacity-60"
            animate={{
              x: [Math.random() * 300 - 150, Math.random() * 300 - 150],
              y: [Math.random() * 200 - 100, Math.random() * 200 - 100],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "linear"
            }}
          />
        ))}

        {/* Solute (Solid) */}
        {!isDissolving ? (
          <motion.div 
            className="grid grid-cols-4 gap-1 p-2 bg-red-400 rounded-lg shadow-lg z-10"
            layoutId="solute"
          >
            {[...Array(16)].map((_, i) => (
              <div key={i} className="w-4 h-4 bg-red-500 rounded-sm border border-red-600" />
            ))}
          </motion.div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            {[...Array(16)].map((_, i) => (
              <motion.div
                key={`particle-${i}`}
                className="absolute w-4 h-4 bg-red-500 rounded-sm border border-red-600 z-10"
                initial={{ 
                  x: (i % 4 - 1.5) * 20, 
                  y: (Math.floor(i / 4) - 1.5) * 20 
                }}
                animate={{
                  x: Math.random() * 400 - 200,
                  y: Math.random() * 200 - 100,
                  rotate: Math.random() * 360,
                  opacity: [1, 0.8, 0.4, 0],
                  scale: [1, 0.8, 0.5, 0.2]
                }}
                transition={{
                  duration: 3,
                  delay: i * 0.1,
                  repeat: Infinity,
                  repeatDelay: 1
                }}
              />
            ))}
          </div>
        )}
      </div>
      <p className="mt-4 text-xs text-blue-600 font-bold text-center italic">
        {isAssistMode 
          ? (chineseType === 'traditional' ? '溶劑粒子撞擊溶質固體，將其拆散成微小粒子。' : '溶剂粒子撞击溶质固体，将其拆散成微小粒子。')
          : 'Solvent particles collide with the solute solid, breaking it into tiny particles.'}
      </p>
    </div>
  );
};

// 2. Conservation of Mass (Concept 6)
export const MassConservation: React.FC<VisualProps> = ({ isAssistMode, chineseType }) => {
  const [step, setStep] = useState(0); // 0: Separate, 1: Mixed
  
  const soluteMass = 10;
  const solventMass = 90;
  const totalMass = soluteMass + solventMass;

  return (
    <div className="bg-emerald-50 rounded-2xl p-6 border-2 border-emerald-100 my-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-black text-emerald-800 uppercase tracking-wider text-sm">
          {isAssistMode ? (chineseType === 'traditional' ? '質量守恆定律' : '质量守恒定律') : 'Conservation of Mass'}
        </h4>
        <button 
          onClick={() => setStep(step === 0 ? 1 : 0)}
          className="bg-emerald-500 text-white px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest shadow-[0_4px_0_0_#059669] active:shadow-none active:translate-y-1 transition-all"
        >
          {step === 0 ? 'Dissolve Solute' : 'Reset'}
        </button>
      </div>

      <div className="flex flex-col items-center gap-8">
        <div className="relative flex items-end justify-center gap-12 h-40 w-full">
          {/* Scale Base */}
          <div className="absolute bottom-0 w-48 h-4 bg-gray-300 rounded-full" />
          
          {/* Beaker 1 (Solvent) */}
          <motion.div 
            className="relative w-24 h-32 border-4 border-gray-400 border-t-0 rounded-b-xl overflow-hidden bg-white"
            animate={{ x: step === 1 ? 20 : 0 }}
          >
            <div className="absolute bottom-0 w-full bg-blue-200" style={{ height: '70%' }} />
            {step === 1 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute bottom-0 w-full bg-blue-400 opacity-30"
                style={{ height: '70%' }}
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center font-black text-gray-400 text-xs">
              {solventMass}g
            </div>
          </motion.div>

          {/* Solute (Separate) */}
          <AnimatePresence>
            {step === 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ y: -50, opacity: 0, scale: 0.5 }}
                className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center text-white font-black text-xs shadow-md"
              >
                {soluteMass}g
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scale Reading */}
          <div className="absolute -bottom-10 bg-white border-2 border-gray-200 px-6 py-2 rounded-full shadow-sm">
            <span className="font-black text-gray-800 text-xl">
              {step === 0 ? solventMass : totalMass}g
            </span>
          </div>
        </div>
        
        <div className="mt-8 text-center space-y-1">
          <p className="text-sm font-black text-emerald-700">
            {step === 0 
              ? `${solventMass}g (Solvent) + ${soluteMass}g (Solute)` 
              : `${solventMass}g + ${soluteMass}g = ${totalMass}g (Solution)`}
          </p>
          <p className="text-xs text-emerald-600 italic">
            {isAssistMode 
              ? (chineseType === 'traditional' ? '溶解前後的總質量保持不變。' : '溶解前后的总质量保持不变。')
              : 'Total mass remains the same before and after dissolving.'}
          </p>
        </div>
      </div>
    </div>
  );
};

// 3. Concentration Visualizer (Concept 7)
export const ConcentrationVisualizer: React.FC<VisualProps> = ({ isAssistMode, chineseType }) => {
  const [concentration, setConcentration] = useState(50);

  return (
    <div className="bg-purple-50 rounded-2xl p-6 border-2 border-purple-100 my-4">
      <h4 className="font-black text-purple-800 uppercase tracking-wider text-sm mb-4">
        {isAssistMode ? (chineseType === 'traditional' ? '濃度演示' : '浓度演示') : 'Concentration Visualizer'}
      </h4>

      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="relative w-32 h-40 border-4 border-gray-400 border-t-0 rounded-b-2xl overflow-hidden bg-white shadow-inner">
          <motion.div 
            className="absolute bottom-0 w-full bg-purple-600"
            animate={{ 
              height: '80%',
              opacity: concentration / 100 + 0.1
            }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white drop-shadow-md">
            <span className="font-black text-2xl">{concentration}%</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">
              {concentration > 70 ? 'Concentrated' : concentration < 30 ? 'Dilute' : 'Medium'}
            </span>
          </div>
        </div>

        <div className="flex-1 w-full space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-black text-purple-600 uppercase tracking-widest">
              <span>Dilute (稀)</span>
              <span>Concentrated (濃)</span>
            </div>
            <input 
              type="range" 
              min="5" 
              max="100" 
              value={concentration} 
              onChange={(e) => setConcentration(parseInt(e.target.value))}
              className="w-full h-3 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
          </div>

          <div className="bg-white p-4 rounded-xl border-2 border-purple-100 text-xs text-purple-700 leading-relaxed font-medium">
            {isAssistMode ? (
              chineseType === 'traditional' 
                ? '濃溶液含有大量的溶質，而稀溶液含有的溶質很少。' 
                : '浓溶液含有大量的溶质，而稀溶液含有的溶质很少。'
            ) : (
              'A concentrated solution has a large amount of solute, while a dilute solution has very little.'
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 4. Solubility Curve (Concept 11)
export const SolubilityCurve: React.FC<VisualProps> = ({ isAssistMode, chineseType }) => {
  const data = [
    { temp: 0, salt: 35.7, sugar: 180, kno3: 13 },
    { temp: 20, salt: 36.0, sugar: 204, kno3: 32 },
    { temp: 40, salt: 36.6, sugar: 238, kno3: 64 },
    { temp: 60, salt: 37.3, sugar: 287, kno3: 110 },
    { temp: 80, salt: 38.4, sugar: 362, kno3: 169 },
    { temp: 100, salt: 39.8, sugar: 487, kno3: 246 },
  ];

  return (
    <div className="bg-orange-50 rounded-2xl p-6 border-2 border-orange-100 my-4">
      <h4 className="font-black text-orange-800 uppercase tracking-wider text-sm mb-4">
        {isAssistMode ? (chineseType === 'traditional' ? '溶解度曲線' : '溶解度曲线') : 'Solubility Curve'}
      </h4>

      <div className="h-64 w-full bg-white rounded-xl p-2 border-2 border-orange-100">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#fed7aa" />
            <XAxis 
              dataKey="temp" 
              label={{ value: 'Temp (°C)', position: 'insideBottom', offset: -5, fontSize: 10, fontWeight: 'bold' }} 
              tick={{ fontSize: 10 }}
            />
            <YAxis 
              label={{ value: 'g / 100g water', angle: -90, position: 'insideLeft', fontSize: 10, fontWeight: 'bold' }}
              tick={{ fontSize: 10 }}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
            />
            <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} />
            <Line type="monotone" dataKey="sugar" name="Sugar" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="kno3" name="KNO₃" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="salt" name="Salt" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <p className="mt-4 text-xs text-orange-600 font-bold text-center italic">
        {isAssistMode 
          ? (chineseType === 'traditional' ? '大多數固體的溶解度隨溫度升高而增加。' : '大多数固体的溶解度随温度升高而增加。')
          : 'Solubility of most solids increases as temperature rises.'}
      </p>
    </div>
  );
};

// 5. Separation Techniques (Concept 16)
export const SeparationTechniques: React.FC<VisualProps> = ({ isAssistMode, chineseType }) => {
  const [mode, setMode] = useState<'filtration' | 'evaporation'>('filtration');

  return (
    <div className="bg-cyan-50 rounded-2xl p-6 border-2 border-cyan-100 my-4">
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-black text-cyan-800 uppercase tracking-wider text-sm">
          {isAssistMode ? (chineseType === 'traditional' ? '分離技術' : '分离技术') : 'Separation Techniques'}
        </h4>
        <div className="flex bg-white rounded-xl p-1 border-2 border-cyan-200 shadow-sm">
          <button 
            onClick={() => setMode('filtration')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'filtration' ? 'bg-cyan-500 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            Filtration
          </button>
          <button 
            onClick={() => setMode('evaporation')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'evaporation' ? 'bg-cyan-500 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            Evaporation
          </button>
        </div>
      </div>

      <div className="h-48 bg-white rounded-xl border-2 border-cyan-200 relative overflow-hidden flex items-center justify-center">
        {mode === 'filtration' ? (
          <div className="relative flex flex-col items-center">
            {/* Funnel */}
            <div className="w-24 h-16 border-x-4 border-b-4 border-gray-400 rounded-b-[40px] relative">
              <div className="absolute top-0 left-0 w-full h-2 bg-gray-200" />
              {/* Filter Paper */}
              <div className="absolute inset-2 border-2 border-dashed border-gray-300 rounded-b-[30px]" />
              {/* Residue */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                <div className="w-2 h-2 bg-brown-500 rounded-full" />
                <div className="w-2 h-2 bg-brown-500 rounded-full" />
                <div className="w-2 h-2 bg-brown-500 rounded-full" />
              </div>
            </div>
            <div className="w-2 h-8 bg-gray-400" />
            {/* Beaker */}
            <div className="w-20 h-16 border-x-4 border-b-4 border-gray-400 rounded-b-lg mt-2 relative">
              <motion.div 
                className="absolute bottom-0 w-full bg-blue-200"
                animate={{ height: ['10%', '60%'] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              {/* Drops */}
              <motion.div 
                className="absolute -top-4 left-1/2 -translate-x-1/2 w-1.5 h-3 bg-blue-300 rounded-full"
                animate={{ y: [0, 20], opacity: [1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
            </div>
          </div>
        ) : (
          <div className="relative flex flex-col items-center">
            {/* Evaporating Dish */}
            <div className="w-24 h-10 border-4 border-gray-400 rounded-b-full relative bg-white overflow-hidden">
              <motion.div 
                className="absolute bottom-0 w-full bg-blue-300"
                animate={{ height: ['80%', '5%'] }}
                transition={{ duration: 5, repeat: Infinity }}
              />
              {/* Solute Crystals appearing */}
              <motion.div 
                className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1"
                animate={{ opacity: [0, 1] }}
                transition={{ duration: 5, repeat: Infinity }}
              >
                <div className="w-2 h-2 bg-white border border-gray-300 rotate-45" />
                <div className="w-2 h-2 bg-white border border-gray-300 rotate-12" />
              </motion.div>
            </div>
            {/* Tripod & Bunsen */}
            <div className="w-28 h-12 border-x-4 border-gray-300 mt-1" />
            <div className="relative">
              <Flame className="text-orange-500 animate-pulse" size={32} />
              <motion.div 
                className="absolute -top-12 left-1/2 -translate-x-1/2 text-gray-300"
                animate={{ y: [0, -40], opacity: [0.5, 0], scale: [1, 1.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Droplets size={16} />
              </motion.div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-white p-3 rounded-xl border-2 border-cyan-100">
          <span className="block text-[10px] font-black text-cyan-600 uppercase mb-1">Separates</span>
          <p className="text-[11px] font-bold text-gray-700">
            {mode === 'filtration' ? 'Insoluble solids' : 'Soluble solids'}
          </p>
        </div>
        <div className="bg-white p-3 rounded-xl border-2 border-cyan-100">
          <span className="block text-[10px] font-black text-cyan-600 uppercase mb-1">Recovers</span>
          <p className="text-[11px] font-bold text-gray-700">
            {mode === 'filtration' ? 'Filtrate (Liquid)' : 'Solute (Solid)'}
          </p>
        </div>
      </div>
    </div>
  );
};

// 6. Chromatography Animation (Concept 17)
export const ChromatographyAnimation: React.FC<VisualProps> = ({ isAssistMode, chineseType }) => {
  const [isRunning, setIsRunning] = useState(false);

  const dyes = [
    { color: '#ef4444', speed: 0.8, name: 'Red' },
    { color: '#3b82f6', speed: 0.4, name: 'Blue' },
    { color: '#f59e0b', speed: 0.6, name: 'Yellow' },
    { color: '#10b981', speed: 0.2, name: 'Green' },
  ];

  return (
    <div className="bg-pink-50 rounded-2xl p-6 border-2 border-pink-100 my-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-black text-pink-800 uppercase tracking-wider text-sm">
          {isAssistMode ? (chineseType === 'traditional' ? '色層分析演示' : '色层分析演示') : 'Chromatography Demo'}
        </h4>
        <button 
          onClick={() => setIsRunning(!isRunning)}
          className="bg-pink-500 text-white px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest shadow-[0_4px_0_0_#db2777] active:shadow-none active:translate-y-1 transition-all"
        >
          {isRunning ? 'Reset' : 'Start Solvent'}
        </button>
      </div>

      <div className="relative h-64 bg-white rounded-xl border-2 border-pink-200 flex items-end justify-center pb-4 overflow-hidden">
        {/* Solvent Line */}
        <motion.div 
          className="absolute bottom-0 w-full bg-blue-100 opacity-50"
          animate={{ height: isRunning ? '90%' : '10%' }}
          transition={{ duration: 10, ease: "linear" }}
        />
        
        {/* Paper Strip */}
        <div className="w-48 h-full bg-gray-50 border-x-2 border-gray-200 relative flex justify-around items-end pb-8">
          <div className="absolute bottom-8 w-full border-t-2 border-gray-300 border-dashed" />
          
          {dyes.map((dye, i) => (
            <div key={i} className="relative flex flex-col items-center h-full justify-end">
              <motion.div 
                className="w-4 h-4 rounded-full shadow-sm z-10"
                style={{ backgroundColor: dye.color }}
                animate={{ 
                  y: isRunning ? -180 * dye.speed : 0,
                  scale: isRunning ? [1, 1.2, 1] : 1,
                  opacity: isRunning ? [1, 0.8, 1] : 1
                }}
                transition={{ duration: 10, ease: "linear" }}
              />
              <span className="text-[8px] font-black text-gray-400 uppercase mt-2">{dye.name}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs text-pink-600 font-bold text-center italic leading-relaxed">
        {isAssistMode 
          ? (chineseType === 'traditional' ? '不同的染料根據其在溶劑中的溶解度以不同的速度移動。' : '不同的染料根据其在溶剂中的溶解度以不同的速度移动。')
          : 'Different dyes travel at different speeds based on their solubility in the solvent.'}
      </p>
    </div>
  );
};
