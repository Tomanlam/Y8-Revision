import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, Calculator, FlaskConical, BarChart3, Binary, 
  HelpCircle, CheckCircle2, XCircle, Info, RefreshCw, 
  ArrowRight, Flame, Droplets, Wind, Atom, Zap, Thermometer,
  Microscope, Layers, Move, FlaskRound, Beaker, Play, RotateCcw
} from 'lucide-react';

const MolecularAnimation = ({ state, formula, color }: { state: 'gas' | 'liquid' | 'solid', formula: string, color: string }) => {
  const moleculeCount = state === 'gas' ? 6 : 15;
  const molecules = Array.from({ length: moleculeCount });

  return (
    <div className="relative w-full h-48 bg-gray-900 rounded-2xl overflow-hidden border-2 border-gray-800">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent" />
      {molecules.map((_, i) => (
        <motion.div
          key={i}
          className={`absolute flex items-center justify-center rounded-full text-[10px] font-bold text-white shadow-lg ${color}`}
          style={{
            width: 32,
            height: 32,
            left: `${Math.random() * 80 + 10}%`,
            top: `${Math.random() * 80 + 10}%`,
          }}
          animate={state === 'gas' ? {
            x: [0, Math.random() * 100 - 50, Math.random() * 100 - 50, 0],
            y: [0, Math.random() * 100 - 50, Math.random() * 100 - 50, 0],
            rotate: [0, 360],
          } : {
            x: [0, Math.random() * 20 - 10, Math.random() * 20 - 10, 0],
            y: [0, Math.random() * 10 - 5, Math.random() * 10 - 5, 0],
          }}
          transition={{
            duration: state === 'gas' ? 2 + Math.random() * 2 : 4 + Math.random() * 2,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          {formula}
        </motion.div>
      ))}
      <div className="absolute bottom-2 right-3">
        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
          State: {state === 'gas' ? 'Gas (g)' : 'Liquid (l)'}
        </span>
      </div>
    </div>
  );
};

const ReactionTube = ({ isActive, reagent }: { isActive: boolean, reagent: string }) => (
  <div className="relative w-32 h-64 bg-white/5 border-4 border-white/20 rounded-b-full overflow-hidden mx-auto shadow-[inset_0_-10px_20px_rgba(0,0,0,0.5)]">
     {/* Reagent Liquid/Gas */}
     <motion.div 
       className={`absolute bottom-0 left-0 right-0 ${
         reagent === 'liquid' ? 'bg-blue-400/60' :
         reagent === 'acid' ? 'bg-yellow-400/60' :
         reagent === 'gas' ? 'bg-gray-400/20' : 'bg-transparent'
       }`}
       initial={{ height: '0%' }}
       animate={{ height: reagent === 'gas' ? '100%' : '60%' }}
       transition={{ duration: 0.5 }}
     />
     {/* Metal Sample */}
     <motion.div 
       className="absolute bottom-4 left-1/2 -translate-x-1/2 w-12 h-12 bg-gray-400 rounded-lg shadow-lg"
       animate={isActive ? { y: [-2, 2, -2], rotate: [-2, 2, -2] } : {}}
       transition={{ repeat: Infinity, duration: 0.2 }}
     />
     {/* Bubbles / Reaction Effect */}
     <AnimatePresence>
       {isActive && (
         <>
           {Array.from({ length: 20 }).map((_, i) => (
             <motion.div
               key={i}
               className="absolute bottom-16 bg-white/60 rounded-full"
               style={{
                 width: Math.random() * 8 + 4,
                 height: Math.random() * 8 + 4,
                 left: `${Math.random() * 80 + 10}%`
               }}
               animate={{ y: -200, opacity: [0, 1, 0], x: (Math.random() - 0.5) * 40 }}
               transition={{ repeat: Infinity, duration: 0.5 + Math.random() * 1, delay: Math.random() }}
             />
           ))}
           <motion.div 
             className="absolute inset-x-0 bottom-4 h-16 bg-gradient-to-t from-orange-500/50 to-transparent blur-md mix-blend-overlay"
             animate={{ opacity: [0.5, 1, 0.5] }}
             transition={{ repeat: Infinity, duration: 0.4 }}
           />
         </>
       )}
     </AnimatePresence>
  </div>
);

const PlaygroundView = () => {
    const [subMode, setSubMode] = useState<'select' | 'equations' | 'chemicals' | 'graphs' | 'simulations'>('select');
    const [selectedEquation, setSelectedEquation] = useState<any>(null);
    const [equationSubject, setEquationSubject] = useState<string>('');
    const [isPracticeMode, setIsPracticeMode] = useState(false);
    const [practiceQuestion, setPracticeQuestion] = useState<any>(null);
    const [practiceAnswer, setPracticeAnswer] = useState<string | null>(null);
    const [isPracticeChecked, setIsPracticeChecked] = useState(false);
    const [selectedChemical, setSelectedChemical] = useState<any>(null);
    const [selectedGraph, setSelectedGraph] = useState<string | null>(null);
    const [graphSpeed1, setGraphSpeed1] = useState(5);
    const [graphSpeed2, setGraphSpeed2] = useState(10);

    const equations = [
      {
        id: 'speed',
        name: 'Speed',
        formula: 'v = d / t',
        unit: 'm/s',
        variables: [
          { symbol: 'v', name: 'Speed', unit: 'm/s' },
          { symbol: 'd', name: 'Distance', unit: 'm' },
          { symbol: 't', name: 'Time', unit: 's' }
        ]
      },
      {
        id: 'pressure',
        name: 'Pressure',
        formula: 'P = F / A',
        unit: 'N/m²',
        variables: [
          { symbol: 'P', name: 'Pressure', unit: 'N/m²' },
          { symbol: 'F', name: 'Force', unit: 'N' },
          { symbol: 'A', name: 'Area', unit: 'm²' }
        ]
      },
      {
        id: 'moment',
        name: 'Moment',
        formula: 'M = F × d',
        unit: 'Nm',
        variables: [
          { symbol: 'M', name: 'Moment', unit: 'Nm' },
          { symbol: 'F', name: 'Force', unit: 'N' },
          { symbol: 'd', name: 'Distance', unit: 'm' }
        ]
      },
      {
        id: 'density',
        name: 'Density',
        formula: 'ρ = m / V',
        unit: 'g/cm³',
        variables: [
          { symbol: 'ρ', name: 'Density', unit: 'g/cm³' },
          { symbol: 'm', name: 'Mass', unit: 'g' },
          { symbol: 'V', name: 'Volume', unit: 'cm³' }
        ]
      },
      {
        id: 'concentration',
        name: 'Concentration',
        formula: 'C = n / V',
        unit: 'particles/unit volume',
        variables: [
          { symbol: 'C', name: 'Concentration', unit: '' },
          { symbol: 'n', name: 'Number of particles', unit: '' },
          { symbol: 'V', name: 'Volume', unit: '' }
        ]
      },
      {
        id: 'percentage',
        name: 'Percentage',
        formula: '% = (Part / Whole) × 100',
        unit: '%',
        variables: [
          { symbol: '%', name: 'Percentage', unit: '%' },
          { symbol: 'Part', name: 'Part', unit: '' },
          { symbol: 'Whole', name: 'Whole', unit: '' }
        ]
      }
    ];

    const equationRearrangements: Record<string, Record<string, string>> = {
      speed: { v: 'v = d / t', d: 'd = v × t', t: 't = d / v' },
      pressure: { P: 'P = F / A', F: 'F = P × A', A: 'A = F / P' },
      moment: { M: 'M = F × d', F: 'F = M / d', d: 'd = M / F' },
      density: { ρ: 'ρ = m / V', m: 'm = ρ × V', V: 'V = m / ρ' },
      concentration: { C: 'C = n / V', n: 'n = C × V', V: 'V = n / C' },
      percentage: { '%': '% = (Part / Whole) × 100', 'Part': 'Part = (% × Whole) / 100', 'Whole': 'Whole = (Part / %) × 100' }
    };

    const chemicals = [
      { 
        name: 'Water', 
        formula: 'H₂O', 
        details: 'A vital compound for all known forms of life.', 
        icon: <Droplets size={32} />, 
        color: 'bg-blue-500',
        state: 'liquid',
        composition: [
          { type: 'H', count: 2, color: 'bg-white border-blue-200 text-blue-500' },
          { type: 'O', count: 1, color: 'bg-red-500 text-white' }
        ]
      },
      { 
        name: 'Methane', 
        formula: 'CH₄', 
        details: 'A potent greenhouse gas and the primary component of natural gas.', 
        icon: <Flame size={32} />, 
        color: 'bg-orange-500',
        state: 'gas',
        composition: [
          { type: 'C', count: 1, color: 'bg-gray-800 text-white' },
          { type: 'H', count: 4, color: 'bg-white border-blue-200 text-blue-500' }
        ]
      },
      { 
        name: 'Carbon Dioxide', 
        formula: 'CO₂', 
        details: 'A greenhouse gas found in the atmosphere, essential for photosynthesis.', 
        icon: <Wind size={32} />, 
        color: 'bg-gray-500',
        state: 'gas',
        composition: [
          { type: 'C', count: 1, color: 'bg-gray-800 text-white' },
          { type: 'O', count: 2, color: 'bg-red-500 text-white' }
        ]
      },
      { 
        name: 'Nitrogen', 
        formula: 'N₂', 
        details: 'Makes up about 78% of Earth\'s atmosphere.', 
        icon: <Wind size={32} />, 
        color: 'bg-blue-300',
        state: 'gas',
        composition: [
          { type: 'N', count: 2, color: 'bg-blue-600 text-white' }
        ]
      },
      { 
        name: 'Ammonia', 
        formula: 'NH₃', 
        details: 'A colorless gas with a characteristic pungent smell, used in fertilizers.', 
        icon: <Atom size={32} />, 
        color: 'bg-purple-500',
        state: 'gas',
        composition: [
          { type: 'N', count: 1, color: 'bg-blue-600 text-white' },
          { type: 'H', count: 3, color: 'bg-white border-blue-200 text-blue-500' }
        ]
      },
      { 
        name: 'Oxygen', 
        formula: 'O₂', 
        details: 'Essential for respiration in most living organisms.', 
        icon: <Wind size={32} />, 
        color: 'bg-blue-400',
        state: 'gas',
        composition: [
          { type: 'O', count: 2, color: 'bg-red-500 text-white' }
        ]
      }
    ];

    return (
        <div className="flex-1 w-full bg-gray-50 flex flex-col p-4 md:p-8 overflow-y-auto">
            <SimulationPlayground />
        </div>
    );
};

const SimulationPlayground = () => {
  const [selectedSim, setSelectedSim] = useState<string | null>(null);
  
  // Diffusion State
  const [redLeft, setRedLeft] = useState(20);
  const [blueLeft, setBlueLeft] = useState(5);
  const [redRight, setRedRight] = useState(5);
  const [blueRight, setBlueRight] = useState(20);
  const [isPartitionRemoved, setIsPartitionRemoved] = useState(false);
  const [particles, setParticles] = useState<any[]>([]);

  // Energy Change State
  const [reactionType, setReactionType] = useState<'exothermic' | 'endothermic'>('exothermic');
  const [temp, setTemp] = useState(25);
  const [isEnergySimulating, setIsEnergySimulating] = useState(false);
  const [energyLabMode, setEnergyLabMode] = useState(false);
  const [selectedLabReaction, setSelectedLabReaction] = useState<string | null>(null);

  // Metal Reactivity Equations State
  const [metalEqMode, setMetalEqMode] = useState<'summary' | 'lab' | 'challenge'>('summary');
  const [metalEqMetalIdx, setMetalEqMetalIdx] = useState(0);
  const [metalEqReagentIdx, setMetalEqReagentIdx] = useState(0);
  const [metalEqChallenge, setMetalEqChallenge] = useState<{product: string, metal: string, reagent: string} | null>(null);
  const [metalEqUserMetal, setMetalEqUserMetal] = useState(0);
  const [metalEqUserReagent, setMetalEqUserReagent] = useState(0);
  const [metalEqFeedback, setMetalEqFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [metalEqIsActive, setMetalEqIsActive] = useState(false);
  const [metalEqProgress, setMetalEqProgress] = useState(0);

  useEffect(() => {
    let interval: any;
    if (metalEqIsActive && metalEqProgress < 100) {
      interval = setInterval(() => {
        setMetalEqProgress(prev => Math.min(100, prev + 2));
      }, 50);
    }
    return () => clearInterval(interval);
  }, [metalEqIsActive, metalEqProgress]);

  const metalEqMetals = [
    { id: 'K', name: 'Potassium', reactivity: 11 },
    { id: 'Na', name: 'Sodium', reactivity: 10 },
    { id: 'Ca', name: 'Calcium', reactivity: 9 },
    { id: 'Mg', name: 'Magnesium', reactivity: 8 },
    { id: 'Al', name: 'Aluminium', reactivity: 7 },
    { id: 'Zn', name: 'Zinc', reactivity: 6 },
    { id: 'Fe', name: 'Iron', reactivity: 5 },
    { id: 'Pb', name: 'Lead', reactivity: 4 },
    { id: 'Cu', name: 'Copper', reactivity: 3 },
    { id: 'Ag', name: 'Silver', reactivity: 2 },
    { id: 'Au', name: 'Gold', reactivity: 1 }
  ];

  const metalEqReagents = [
    { id: 'oxygen', name: 'Oxygen', limit: 8 }, 
    { id: 'water', name: 'Water (Cold/Hot)', limit: 2 }, 
    { id: 'steam', name: 'Steam', limit: 6 }, 
    { id: 'acid', name: 'Dilute Acid', limit: 7 } 
  ];

  const canReact = (mIdx: number, rId: string) => {
    if (rId === 'oxygen') return mIdx <= 8;
    if (rId === 'water') return mIdx <= 2;
    if (rId === 'steam') return mIdx <= 6;
    if (rId === 'acid') return mIdx <= 7;
    return false;
  };

  const generateChallenge = () => {
    const mIdx = Math.floor(Math.random() * metalEqMetals.length);
    const rIdx = Math.floor(Math.random() * metalEqReagents.length);
    const metal = metalEqMetals[mIdx];
    const reagent = metalEqReagents[rIdx];
    
    let product = 'No Reaction';
    if (canReact(mIdx, reagent.id)) {
      if (reagent.id === 'oxygen') product = `${metal.name} Oxide`;
      if (reagent.id === 'water') product = `${metal.name} Hydroxide + Hydrogen`;
      if (reagent.id === 'steam') product = `${metal.name} Oxide + Hydrogen`;
      if (reagent.id === 'acid') product = `${metal.name} Salt + Hydrogen`;
    }

    setMetalEqChallenge({ product, metal: metal.id, reagent: reagent.id });
    setMetalEqFeedback(null);
    setMetalEqUserMetal(0);
    setMetalEqUserReagent(0);
  };

  const checkChallenge = () => {
    if (!metalEqChallenge) return;
    const userM = metalEqMetals[metalEqUserMetal];
    const userR = metalEqReagents[metalEqUserReagent];
    
    let userProduct = 'No Reaction';
    if (canReact(metalEqUserMetal, userR.id)) {
      if (userR.id === 'oxygen') userProduct = `${userM.name} Oxide`;
      if (userR.id === 'water') userProduct = `${userM.name} Hydroxide + Hydrogen`;
      if (userR.id === 'steam') userProduct = `${userM.name} Oxide + Hydrogen`;
      if (userR.id === 'acid') userProduct = `${userM.name} Salt + Hydrogen`;
    }

    if (userProduct === metalEqChallenge.product && userM.id === metalEqChallenge.metal && userR.id === metalEqChallenge.reagent) {
      setMetalEqFeedback('correct');
      setTimeout(generateChallenge, 2000);
    } else {
      setMetalEqFeedback('incorrect');
    }
  };

  const getActualEquation = (mId: string, rId: string, waterTemp?: string, acidType?: string) => {
    if (rId === 'oxygen') return `${mId} + O₂ → ${mId}O *`;
    if (rId === 'water' && waterTemp === 'cold') return `${mId} + H₂O(l) → ${mId}OH + H₂ *`;
    if (rId === 'water' && waterTemp === 'hot') return `${mId} + H₂O(l) → ${mId}OH + H₂ *`;
    if (rId === 'steam') return `${mId} + H₂O(g) → ${mId}O + H₂ *`;
    if (rId === 'acid' && acidType === 'HCl') return `${mId} + HCl → ${mId}Cl + H₂ *`;
    if (rId === 'acid' && acidType === 'H2SO4') return `${mId} + H₂SO₄ → ${mId}SO₄ + H₂ *`;
    return 'Detailed balanced equations will depend on the specific valency of the metal.';
  };

  const initExperiment = () => {
    setMetalEqIsActive(true);
    setMetalEqProgress(0);
    setTimeout(() => {
      setMetalEqIsActive(false);
    }, 2500);
  };

  const initParticles = () => {
    const newParticles: any[] = [];
    for(let i=0; i<redLeft; i++) newParticles.push({ id: `rl${i}`, type: 'red', x: Math.random() * 45, y: Math.random() * 90 + 5 });
    for(let i=0; i<blueLeft; i++) newParticles.push({ id: `bl${i}`, type: 'blue', x: Math.random() * 45, y: Math.random() * 90 + 5 });
    for(let i=0; i<redRight; i++) newParticles.push({ id: `rr${i}`, type: 'red', x: Math.random() * 45 + 50, y: Math.random() * 90 + 5 });
    for(let i=0; i<blueRight; i++) newParticles.push({ id: `br${i}`, type: 'blue', x: Math.random() * 45 + 50, y: Math.random() * 90 + 5 });
    setParticles(newParticles);
  };

  useEffect(() => {
    if (!isPartitionRemoved) initParticles();
  }, [redLeft, blueLeft, redRight, blueRight, isPartitionRemoved]);

  useEffect(() => {
    let animationFrame: number;
    if (isPartitionRemoved) {
      const update = () => {
        setParticles(prev => prev.map(p => {
          let nx = p.x + (Math.random() - 0.5) * 4;
          let ny = p.y + (Math.random() - 0.5) * 4;
          if (nx < 2) nx = 2; if (nx > 98) nx = 98;
          if (ny < 2) ny = 2; if (ny > 98) ny = 98;
          return { ...p, x: nx, y: ny };
        }));
        animationFrame = requestAnimationFrame(update);
      };
      animationFrame = requestAnimationFrame(update);
    }
    return () => cancelAnimationFrame(animationFrame);
  }, [isPartitionRemoved]);

  useEffect(() => {
    if (selectedSim === 'energy-change' && isEnergySimulating) {
      const target = reactionType === 'exothermic' ? temp + 15 : temp - 10;
      const step = reactionType === 'exothermic' ? 1 : -1;
      let current = temp;
      const interval = setInterval(() => {
        current += step;
        setTemp(current);
        if ((step > 0 && current >= target) || (step < 0 && current <= target)) {
          clearInterval(interval);
          setIsEnergySimulating(false);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isEnergySimulating, reactionType, selectedSim]);

  const resetEnergySim = () => {
    setTemp(25);
    setIsEnergySimulating(false);
    setSelectedLabReaction(null);
  };

  const sims = [
    { id: 'diffusion', name: 'Diffusion', icon: <Move size={24} />, color: 'bg-emerald-500', description: 'Simulate how particles spread across a partition.' },
    { id: 'energy-change', name: 'Energy Change', icon: <Thermometer size={24} />, color: 'bg-orange-500', description: 'Observe temperature changes in exo/endo reactions.' },
    { id: 'metal-reactivity', name: 'Metal Reactivity', icon: <FlaskRound size={24} />, color: 'bg-blue-500', description: 'Compare how different metals react with reagents.' },
    { id: 'metal-equations', name: 'Chemical Equations', icon: <Binary size={24} />, color: 'bg-purple-500', description: 'Predict and visualize metal reaction products.' }
  ];

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {!selectedSim ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {sims.map(sim => (
              <motion.button
                key={sim.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedSim(sim.id)}
                className="bg-white p-6 rounded-3xl border-2 border-gray-200 shadow-[0_4px_0_0_rgba(0,0,0,0.05)] hover:border-gray-300 text-left group"
              >
                <div className={`${sim.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-4 group-hover:rotate-6 transition-transform`}>
                  {sim.icon}
                </div>
                <h4 className="text-xl font-black text-gray-800 uppercase mb-2">{sim.name}</h4>
                <p className="text-gray-500 font-medium text-sm leading-relaxed">{sim.description}</p>
              </motion.button>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            className="bg-white rounded-[2rem] border-2 border-gray-200 overflow-hidden shadow-xl"
          >
            <div className="bg-gray-50 p-4 border-b-2 border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedSim(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <ChevronLeft size={24} />
                </button>
                <h4 className="font-black text-gray-800 uppercase">{sims.find(s => s.id === selectedSim)?.name}</h4>
              </div>
            </div>

            <div className="p-8">
              {selectedSim === 'diffusion' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                       <div>
                         <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Red Particles</label>
                         <div className="flex items-center gap-4">
                           <input type="range" min="0" max="50" value={redLeft} onChange={(e) => setRedLeft(parseInt(e.target.value))} className="flex-1 accent-red-500" />
                           <span className="font-black text-red-500 w-8">{redLeft}</span>
                         </div>
                       </div>
                       <div>
                         <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Blue Particles</label>
                         <div className="flex items-center gap-4">
                           <input type="range" min="0" max="50" value={blueRight} onChange={(e) => setBlueRight(parseInt(e.target.value))} className="flex-1 accent-blue-500" />
                           <span className="font-black text-blue-500 w-8">{blueRight}</span>
                         </div>
                       </div>
                       <button 
                        onClick={() => {
                          setIsPartitionRemoved(!isPartitionRemoved);
                          if (!isPartitionRemoved) initParticles();
                        }}
                        className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${
                          isPartitionRemoved ? 'bg-red-500 text-white shadow-[0_4px_0_0_#b91c1c]' : 'bg-emerald-500 text-white shadow-[0_4px_0_0_#059669]'
                        }`}
                       >
                         {isPartitionRemoved ? 'Restore Partition' : 'Remove Partition'}
                       </button>
                    </div>
                    
                    <div className="relative aspect-[4/3] bg-gray-900 rounded-3xl overflow-hidden border-4 border-gray-800 shadow-inner">
                      {particles.map(p => (
                        <motion.div
                          key={p.id}
                          className={`absolute w-3 h-3 rounded-full blur-[1px] ${p.type === 'red' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'}`}
                          style={{ left: `${p.x}%`, top: `${p.y}%` }}
                        />
                      ))}
                      <AnimatePresence>
                        {!isPartitionRemoved && (
                          <motion.div 
                            initial={{ scaleY: 0 }}
                            animate={{ scaleY: 1 }}
                            exit={{ scaleY: 0 }}
                            className="absolute inset-y-0 left-1/2 w-4 -translate-x-1/2 bg-gray-600 border-x-2 border-gray-500 z-10"
                          />
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              )}

              {selectedSim === 'energy-change' && (
                <div className="space-y-8">
                  <div className="flex gap-4 mb-6 relative">
                     <button
                       onClick={() => setEnergyLabMode(false)}
                       className={`flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${
                         !energyLabMode ? 'bg-orange-500 text-white shadow-[0_4px_0_0_#c2410c]' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                       }`}
                     >
                       Concept Visualizer
                     </button>
                     <button
                       onClick={() => setEnergyLabMode(true)}
                       className={`flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${
                         energyLabMode ? 'bg-orange-500 text-white shadow-[0_4px_0_0_#c2410c]' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                       }`}
                     >
                       Virtual Lab
                     </button>
                  </div>

                  {energyLabMode ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                           <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-4">Select Reaction</h3>
                           <div className="space-y-3">
                              <button
                                onClick={() => { setSelectedLabReaction('combustion'); setReactionType('exothermic'); resetEnergySim(); }}
                                className={`w-full p-4 rounded-2xl border-2 text-left font-bold transition-all ${selectedLabReaction === 'combustion' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
                              >
                                Combustion of Magnesium
                              </button>
                              <button
                                onClick={() => { setSelectedLabReaction('neutralization'); setReactionType('exothermic'); resetEnergySim(); }}
                                className={`w-full p-4 rounded-2xl border-2 text-left font-bold transition-all ${selectedLabReaction === 'neutralization' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
                              >
                                Acid + Alkali Neutralization
                              </button>
                              <button
                                onClick={() => { setSelectedLabReaction('decomposition'); setReactionType('endothermic'); resetEnergySim(); }}
                                className={`w-full p-4 rounded-2xl border-2 text-left font-bold transition-all ${selectedLabReaction === 'decomposition' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
                              >
                                Thermal Decomposition
                              </button>
                              <button
                                onClick={() => { setSelectedLabReaction('citric-baking'); setReactionType('endothermic'); resetEnergySim(); }}
                                className={`w-full p-4 rounded-2xl border-2 text-left font-bold transition-all ${selectedLabReaction === 'citric-baking' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
                              >
                                Citric Acid + Baking Soda
                              </button>
                           </div>
                           <button 
                            disabled={!selectedLabReaction || isEnergySimulating}
                            onClick={() => setIsEnergySimulating(true)}
                            className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${
                              !selectedLabReaction || isEnergySimulating ? 'bg-gray-200 text-gray-400 cursor-not-allowed' :
                              reactionType === 'exothermic' ? 'bg-orange-500 text-white shadow-[0_4px_0_0_#c2410c] active:translate-y-1 active:shadow-none' : 
                              'bg-blue-500 text-white shadow-[0_4px_0_0_#1d4ed8] active:translate-y-1 active:shadow-none'
                            }`}
                           >
                             Run Experiment
                           </button>
                        </div>
                        <div className="relative h-80 bg-gray-900 rounded-3xl overflow-hidden border-4 border-gray-800 shadow-inner flex flex-col items-center justify-end pb-8">
                            {/* Thermometer */}
                            <div className="absolute right-8 bottom-8 w-12 h-48 bg-white/10 rounded-full border-2 border-white/20 p-1 flex justify-end flex-col relative z-20">
                               <div className="w-full bg-red-500 rounded-full transition-all duration-1000 ease-in-out" style={{ height: `${(temp / 80) * 100}%` }} />
                               <div className="absolute -left-12 top-1/2 -translate-y-1/2 text-white font-black font-mono bg-black/50 px-2 py-1 rounded">
                                 {temp}°C
                               </div>
                            </div>
                            
                            {/* Reaction Vessel */}
                            {selectedLabReaction && (
                              <div className="relative w-40 h-40 bg-white/5 border-4 border-white/20 rounded-b-full overflow-hidden shadow-[inset_0_-10px_20px_rgba(0,0,0,0.5)]">
                                 <motion.div 
                                   className={`absolute bottom-0 left-0 right-0 ${
                                     selectedLabReaction === 'combustion' ? 'bg-orange-500/80' :
                                     selectedLabReaction === 'neutralization' ? 'bg-purple-400/60' :
                                     selectedLabReaction === 'citric-baking' ? 'bg-blue-300/60' :
                                     'bg-gray-400/40' // decomposition
                                   }`}
                                   initial={{ height: '30%' }}
                                   animate={{ height: isEnergySimulating ? '60%' : '30%' }}
                                   transition={{ duration: 1 }}
                                 />
                                 <AnimatePresence>
                                   {isEnergySimulating && (
                                     <>
                                       {selectedLabReaction === 'combustion' && (
                                         <motion.div 
                                           className="absolute inset-0 bg-yellow-400/50 mix-blend-overlay"
                                           animate={{ opacity: [0.3, 1, 0.3] }}
                                           transition={{ repeat: Infinity, duration: 0.2 }}
                                         />
                                       )}
                                       {selectedLabReaction === 'citric-baking' && Array.from({ length: 40 }).map((_, i) => (
                                         <motion.div
                                           key={i}
                                           className="absolute bottom-10 bg-white/80 rounded-full"
                                           style={{ width: Math.random() * 6 + 2, height: Math.random() * 6 + 2, left: `${Math.random() * 80 + 10}%` }}
                                           animate={{ y: -150, opacity: [0, 1, 0] }}
                                           transition={{ repeat: Infinity, duration: 0.3 + Math.random() * 0.5, delay: Math.random() }}
                                         />
                                       ))}
                                     </>
                                   )}
                                 </AnimatePresence>
                              </div>
                            )}
                            {!selectedLabReaction && (
                               <div className="text-gray-500 font-black uppercase tracking-widest z-10 mb-20 text-center">
                                 <FlaskConical size={48} className="mx-auto mb-4 opacity-50" />
                                 Select an experiment
                               </div>
                            )}
                        </div>
                     </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-6">
                         <div className="flex gap-4">
                           <button 
                             onClick={() => { setReactionType('exothermic'); setTemp(25); }}
                             className={`flex-1 py-3 rounded-xl font-bold transition-all ${reactionType === 'exothermic' ? 'bg-orange-500 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                           >
                             Exothermic
                           </button>
                           <button 
                             onClick={() => { setReactionType('endothermic'); setTemp(25); }}
                             className={`flex-1 py-3 rounded-xl font-bold transition-all ${reactionType === 'endothermic' ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                           >
                             Endothermic
                           </button>
                         </div>
                         
                         <div className="bg-gray-50 p-6 rounded-2xl border-2 border-gray-100">
                           <h4 className="font-black text-gray-800 uppercase tracking-tight mb-2">Energy Profile</h4>
                           <p className="text-sm font-medium text-gray-600 mb-4">
                             {reactionType === 'exothermic' 
                               ? 'Energy is released to the surroundings. Products have less energy than reactants. Temperature goes UP.' 
                               : 'Energy is absorbed from the surroundings. Products have more energy than reactants. Temperature goes DOWN.'}
                           </p>
                           <div className="h-40 w-full relative border-l-2 border-b-2 border-gray-300">
                             <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                               {reactionType === 'exothermic' ? (
                                 <path d="M 0 30 L 30 30 Q 50 10 60 50 T 80 80 L 100 80" fill="none" stroke="#f97316" strokeWidth="3" />
                               ) : (
                                 <path d="M 0 80 L 30 80 Q 50 10 60 50 T 80 30 L 100 30" fill="none" stroke="#3b82f6" strokeWidth="3" />
                               )}
                               <text x="5" y={reactionType === 'exothermic' ? 25 : 75} className="text-[6px] fill-gray-500 font-bold">Reactants</text>
                               <text x="75" y={reactionType === 'exothermic' ? 75 : 25} className="text-[6px] fill-gray-500 font-bold">Products</text>
                             </svg>
                           </div>
                         </div>
  
                         <button 
                          disabled={isEnergySimulating}
                          onClick={() => setIsEnergySimulating(true)}
                          className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${
                            isEnergySimulating ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 
                            reactionType === 'exothermic' ? 'bg-orange-500 text-white shadow-[0_4px_0_0_#c2410c] active:shadow-none active:translate-y-1' : 'bg-blue-500 text-white shadow-[0_4px_0_0_#1d4ed8] active:shadow-none active:translate-y-1'
                          }`}
                         >
                           {isEnergySimulating ? 'Simulating...' : 'Trigger Reaction'}
                         </button>
                       </div>
                       
                       <div className="relative aspect-[4/3] bg-gray-900 rounded-3xl overflow-hidden border-4 border-gray-800 shadow-inner flex items-center justify-center">
                         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/5 to-transparent" />
                         
                         {/* Environment Background Color */}
                         <motion.div 
                           className="absolute inset-0"
                           animate={{ backgroundColor: temp > 30 ? 'rgba(239,68,68,0.2)' : temp < 20 ? 'rgba(59,130,246,0.2)' : 'transparent' }}
                           transition={{ duration: 1 }}
                         />
  
                         {/* Central Reaction Area */}
                         <motion.div 
                           className="relative z-10 w-32 h-32 rounded-full border-4 shadow-2xl flex items-center justify-center overflow-hidden"
                           animate={{
                             borderColor: reactionType === 'exothermic' ? '#f97316' : '#3b82f6',
                             backgroundColor: reactionType === 'exothermic' ? 'rgba(249,115,22,0.1)' : 'rgba(59,130,246,0.1)'
                           }}
                         >
                           <AnimatePresence>
                             {isEnergySimulating && (
                               <>
                                 {reactionType === 'exothermic' ? (
                                   // Emanating heat waves
                                   Array.from({ length: 3 }).map((_, i) => (
                                     <motion.div
                                       key={`exo-${i}`}
                                       className="absolute inset-0 rounded-full border-2 border-orange-500"
                                       initial={{ scale: 0.5, opacity: 1 }}
                                       animate={{ scale: 2.5, opacity: 0 }}
                                       transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.5 }}
                                     />
                                   ))
                                 ) : (
                                   // Inward shrinking cold waves
                                   Array.from({ length: 3 }).map((_, i) => (
                                     <motion.div
                                       key={`endo-${i}`}
                                       className="absolute inset-0 rounded-full border-2 border-blue-500"
                                       initial={{ scale: 2.5, opacity: 0 }}
                                       animate={{ scale: 0.5, opacity: 1 }}
                                       transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.5 }}
                                     />
                                   ))
                                 )}
                                 <motion.div
                                   className="absolute inset-0 bg-white mix-blend-overlay"
                                   animate={{ opacity: [0, 0.8, 0] }}
                                   transition={{ duration: 0.2, repeat: Infinity }}
                                 />
                               </>
                             )}
                           </AnimatePresence>
                         </motion.div>
                         
                         {/* Digital Thermometer */}
                         <div className="absolute right-6 top-1/2 -translate-y-1/2 bg-gray-800 p-4 rounded-2xl border-2 border-gray-700 shadow-2xl z-20">
                           <div className="text-gray-400 font-bold text-xs uppercase mb-1 flex items-center gap-2">
                             <Thermometer size={16} className={temp > 30 ? 'text-red-500' : temp < 20 ? 'text-blue-500' : 'text-gray-400'} />
                             Temp
                           </div>
                           <motion.div 
                             className={`text-4xl font-black font-mono tabular-nums ${temp > 30 ? 'text-red-500' : temp < 20 ? 'text-blue-500' : 'text-white'}`}
                           >
                             {temp.toFixed(1)}°C
                           </motion.div>
                         </div>
                       </div>
                    </div>
                  )}
                </div>
              )}

              {selectedSim === 'metal-reactivity' && (
                <div className="space-y-4">
                   <div className="bg-blue-50 p-6 rounded-3xl border-2 border-blue-100 mb-6">
                      <h4 className="font-black text-blue-800 uppercase tracking-tight mb-2">Reactivity Series</h4>
                      <div className="flex flex-col gap-2">
                         <div className="flex justify-between text-xs font-black uppercase text-blue-400 px-4">
                           <span>Most Reactive</span>
                           <span>Least Reactive</span>
                         </div>
                         <div className="flex gap-1 overflow-x-auto pb-4 custom-scrollbar px-4">
                            {metalEqMetals.map((m) => (
                              <div key={m.id} className="flex flex-col items-center gap-2 min-w-[60px]">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-white shadow-sm transition-transform hover:-translate-y-2 ${
                                  m.reactivity > 8 ? 'bg-red-500' : m.reactivity > 4 ? 'bg-orange-500' : 'bg-gray-400'
                                }`}>
                                  {m.id}
                                </div>
                                <span className="text-[10px] font-bold text-gray-600 truncate max-w-full">{m.name}</span>
                              </div>
                            ))}
                         </div>
                         <div className="h-1 bg-gradient-to-r from-red-500 via-orange-500 to-gray-400 rounded-full mt-2 mx-4" />
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-6 bg-white p-6 rounded-3xl border-2 border-gray-200">
                        <h4 className="font-black text-gray-800 uppercase tracking-tight mb-4">Set up Experiment</h4>
                        <div>
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">1. Select Metal</label>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {metalEqMetals.map((m, idx) => (
                              <button
                                key={m.id}
                                onClick={() => setMetalEqMetalIdx(idx)}
                                className={`p-2 rounded-xl border-2 font-bold text-sm transition-all ${metalEqMetalIdx === idx ? 'bg-blue-500 border-blue-500 text-white' : 'hover:border-blue-300'}`}
                              >
                                {m.id}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">2. Select Reagent</label>
                          <div className="grid grid-cols-2 gap-2">
                             {metalEqReagents.map((r, idx) => (
                               <button
                                 key={r.id}
                                 onClick={() => setMetalEqReagentIdx(idx)}
                                 className={`p-3 rounded-xl border-2 font-bold text-sm transition-all ${metalEqReagentIdx === idx ? 'bg-purple-500 border-purple-500 text-white' : 'hover:border-purple-300'}`}
                               >
                                 {r.name}
                               </button>
                             ))}
                          </div>
                        </div>
                        <button
                          disabled={metalEqIsActive}
                          onClick={initExperiment}
                          className="w-full py-4 rounded-2xl bg-gray-900 text-white font-black uppercase tracking-widest shadow-[0_4px_0_0_#1f2937] active:shadow-none active:translate-y-1 transition-all disabled:opacity-50"
                        >
                          {metalEqIsActive ? 'Reacting...' : 'Observe Reaction'}
                        </button>
                     </div>

                     <div className="bg-gray-900 rounded-3xl p-6 relative overflow-hidden shadow-inner border-4 border-gray-800 flex flex-col justify-end min-h-[400px]">
                        <ReactionTube 
                          isActive={metalEqIsActive && canReact(metalEqMetalIdx, metalEqReagents[metalEqReagentIdx].id)} 
                          reagent={metalEqReagents[metalEqReagentIdx].id === 'oxygen' ? 'gas' : metalEqReagents[metalEqReagentIdx].id === 'acid' ? 'acid' : 'liquid'}
                        />
                        
                        <AnimatePresence>
                          {!metalEqIsActive && (
                             <motion.div 
                               initial={{ opacity: 0, y: 20 }}
                               animate={{ opacity: 1, y: 0 }}
                               className="absolute inset-x-6 top-6 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-white text-center"
                             >
                                <h4 className="font-black uppercase tracking-widest text-emerald-400 mb-1">
                                  {canReact(metalEqMetalIdx, metalEqReagents[metalEqReagentIdx].id) ? 'Reaction Occurred' : 'No Reaction'}
                                </h4>
                                <p className="font-medium text-sm">
                                  {metalEqMetals[metalEqMetalIdx].name} + {metalEqReagents[metalEqReagentIdx].name}
                                </p>
                             </motion.div>
                          )}
                        </AnimatePresence>
                     </div>
                   </div>
                </div>
              )}

              {selectedSim === 'metal-equations' && (
                <div className="space-y-6">
                   <div className="flex gap-4 mb-6 relative">
                     <button
                       onClick={() => setMetalEqMode('summary')}
                       className={`flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${
                         metalEqMode === 'summary' ? 'bg-purple-500 text-white shadow-[0_4px_0_0_#9333ea]' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                       }`}
                     >
                       Rules Summary
                     </button>
                     <button
                       onClick={() => setMetalEqMode('lab')}
                       className={`flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${
                         metalEqMode === 'lab' ? 'bg-purple-500 text-white shadow-[0_4px_0_0_#9333ea]' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                       }`}
                     >
                       Equation Lab
                     </button>
                     <button
                       onClick={() => { setMetalEqMode('challenge'); generateChallenge(); }}
                       className={`flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${
                         metalEqMode === 'challenge' ? 'bg-orange-500 text-white shadow-[0_4px_0_0_#c2410c]' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                       }`}
                     >
                       Challenge
                     </button>
                   </div>

                   {metalEqMode === 'summary' && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-red-50 border-2 border-red-100 p-6 rounded-3xl">
                          <h4 className="font-black text-red-800 uppercase tracking-tight mb-4 flex items-center gap-2">
                             <Flame size={24} /> Reaction with Oxygen
                          </h4>
                          <code className="block bg-white p-4 rounded-xl font-mono text-red-600 font-bold mb-4 shadow-sm border border-red-100">
                             Metal + Oxygen → Metal Oxide
                          </code>
                          <ul className="list-disc pl-5 text-sm font-medium text-red-700 space-y-2">
                            <li>Almost all metals react with oxygen (except Ag, Au).</li>
                            <li>Highly reactive metals burn brightly.</li>
                            <li>Less reactive metals tarnish or form a surface oxide layer slowly.</li>
                          </ul>
                        </div>
                        <div className="bg-blue-50 border-2 border-blue-100 p-6 rounded-3xl">
                          <h4 className="font-black text-blue-800 uppercase tracking-tight mb-4 flex items-center gap-2">
                             <Droplets size={24} /> Reaction with Water
                          </h4>
                          <code className="block bg-white p-4 rounded-xl font-mono text-blue-600 font-bold mb-4 shadow-sm border border-blue-100">
                             Metal + Cold Water → Metal Hydroxide + Hydrogen
                          </code>
                          <code className="block bg-white p-4 rounded-xl font-mono text-blue-600 font-bold mb-4 shadow-sm border border-blue-100">
                             Metal + Steam → Metal Oxide + Hydrogen
                          </code>
                          <ul className="list-disc pl-5 text-sm font-medium text-blue-700 space-y-2">
                            <li>Only the most reactive metals (K, Na, Ca) react with cold water.</li>
                            <li>Mg, Al, Zn, Fe react with steam but not cold water.</li>
                          </ul>
                        </div>
                        <div className="bg-yellow-50 border-2 border-yellow-100 p-6 rounded-3xl md:col-span-2">
                          <h4 className="font-black text-yellow-800 uppercase tracking-tight mb-4 flex items-center gap-2">
                             <Zap size={24} /> Reaction with Dilute Acids
                          </h4>
                          <code className="block bg-white p-4 rounded-xl font-mono text-yellow-700 font-bold mb-4 shadow-sm border border-yellow-200">
                             Metal + Acid → Salt + Hydrogen
                          </code>
                          <ul className="list-disc pl-5 text-sm font-medium text-yellow-800 space-y-2">
                            <li>Metals above Hydrogen in the reactivity series react with dilute acids (e.g., HCl, H2SO4).</li>
                            <li>The salt formed depends on the acid: <br/> Hydrochloric acid → Chlorides <br/> Sulfuric acid → Sulfates.</li>
                          </ul>
                        </div>
                     </div>
                   )}

                   {metalEqMode === 'lab' && (
                     <div className="space-y-8 bg-gray-50 p-8 rounded-[2rem] border-2 border-dashed border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div>
                              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Metal (M)</label>
                              <select 
                                value={metalEqMetalIdx}
                                onChange={(e) => setMetalEqMetalIdx(Number(e.target.value))}
                                className="w-full p-4 rounded-xl border-2 border-gray-200 font-bold focus:border-purple-500 outline-none bg-white font-mono text-lg"
                              >
                                {metalEqMetals.map((m, idx) => (
                                  <option key={m.id} value={idx}>{m.id} ({m.name})</option>
                                ))}
                              </select>
                           </div>
                           <div>
                              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Reagent</label>
                              <select 
                                value={metalEqReagentIdx}
                                onChange={(e) => setMetalEqReagentIdx(Number(e.target.value))}
                                className="w-full p-4 rounded-xl border-2 border-gray-200 font-bold focus:border-purple-500 outline-none bg-white font-mono text-lg"
                              >
                                {metalEqReagents.map((r, idx) => (
                                  <option key={r.id} value={idx}>{r.name}</option>
                                ))}
                              </select>
                           </div>
                        </div>

                        <div className="bg-white p-8 rounded-3xl border-2 border-purple-100 shadow-xl text-center relative overflow-hidden">
                           <div className="absolute top-0 left-0 w-2 h-full bg-purple-500"></div>
                           <h4 className="font-black text-gray-400 uppercase tracking-widest text-xs mb-6">Balanced Equation</h4>
                           
                           {canReact(metalEqMetalIdx, metalEqReagents[metalEqReagentIdx].id) ? (
                             <div className="space-y-4 text-left">
                               <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl overflow-x-auto">
                                 <span className="font-black text-purple-600 uppercase tracking-widest whitespace-nowrap text-sm">Word Eq:</span>
                                 <span className="font-bold text-gray-800 whitespace-nowrap">
                                   {getActualEquation(metalEqMetals[metalEqMetalIdx].name, metalEqReagents[metalEqReagentIdx].id, 'cold', 'HCl').split('→')[0]} → 
                                   <span className="text-emerald-600 ml-2">
                                     {metalEqReagents[metalEqReagentIdx].id === 'oxygen' ? `${metalEqMetals[metalEqMetalIdx].name} Oxide` :
                                      metalEqReagents[metalEqReagentIdx].id === 'water' ? `${metalEqMetals[metalEqMetalIdx].name} Hydroxide + Hydrogen` :
                                      metalEqReagents[metalEqReagentIdx].id === 'steam' ? `${metalEqMetals[metalEqMetalIdx].name} Oxide + Hydrogen` :
                                      `${metalEqMetals[metalEqMetalIdx].name} Chloride + Hydrogen`}
                                   </span>
                                 </span>
                               </div>
                               <div className="flex items-center gap-4 bg-gray-900 p-4 rounded-2xl overflow-x-auto">
                                 <span className="font-black text-purple-400 uppercase tracking-widest whitespace-nowrap text-sm">Chem Eq:</span>
                                 <code className="text-xl font-bold font-mono text-white whitespace-nowrap">
                                   {getActualEquation(metalEqMetals[metalEqMetalIdx].id, metalEqReagents[metalEqReagentIdx].id, 'cold', 'HCl')}
                                 </code>
                               </div>
                               <p className="text-xs font-medium text-gray-400 text-center mt-4">
                                 * Note: Equations are simplified. Exact stoichiometry depends on the metal's valency.
                               </p>
                             </div>
                           ) : (
                             <div className="py-8">
                               <XCircle size={48} className="text-red-400 mx-auto mb-4" />
                               <p className="text-xl font-black text-gray-800 uppercase">No Reaction</p>
                               <p className="text-gray-500 font-medium mt-2">
                                 {metalEqMetals[metalEqMetalIdx].name} is not reactive enough to displace {metalEqReagents[metalEqReagentIdx].name}.
                               </p>
                             </div>
                           )}
                        </div>
                     </div>
                   )}

                   {metalEqMode === 'challenge' && metalEqChallenge && (
                     <div className="max-w-2xl mx-auto space-y-8">
                        <div className="bg-orange-500 p-8 rounded-[2rem] text-white text-center shadow-lg relative overflow-hidden">
                           <div className="absolute top-0 right-0 p-4 opacity-20"><HelpCircle size={80} /></div>
                           <h4 className="text-orange-200 font-black uppercase tracking-widest text-sm mb-4 relative z-10">Identify the Reactants</h4>
                           <p className="text-2xl font-medium mb-6 relative z-10">Which metal and reagent react to produce:</p>
                           <div className="bg-white/20 p-6 rounded-2xl backdrop-blur-sm border-2 border-white/30 relative z-10 font-mono">
                             <span className="text-3xl font-black tracking-tight">{metalEqChallenge.product} ?</span>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                           <div>
                              <select 
                                value={metalEqUserMetal}
                                onChange={(e) => { setMetalEqUserMetal(Number(e.target.value)); setMetalEqFeedback(null); }}
                                className={`w-full p-4 rounded-2xl border-4 font-bold outline-none bg-white text-lg transition-all ${metalEqFeedback === 'incorrect' ? 'border-red-300' : 'border-gray-200 focus:border-orange-500'}`}
                              >
                                {metalEqMetals.map((m, idx) => (
                                  <option key={m.id} value={idx}>{m.name}</option>
                                ))}
                              </select>
                           </div>
                           <div>
                              <select 
                                value={metalEqUserReagent}
                                onChange={(e) => { setMetalEqUserReagent(Number(e.target.value)); setMetalEqFeedback(null); }}
                                className={`w-full p-4 rounded-2xl border-4 font-bold outline-none bg-white text-lg transition-all ${metalEqFeedback === 'incorrect' ? 'border-red-300' : 'border-gray-200 focus:border-orange-500'}`}
                              >
                                {metalEqReagents.map((r, idx) => (
                                  <option key={r.id} value={idx}>{r.name}</option>
                                ))}
                              </select>
                           </div>
                        </div>

                        <AnimatePresence mode="wait">
                          {metalEqFeedback === 'correct' && (
                            <motion.div 
                              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                              className="bg-emerald-100 border-2 border-emerald-500 text-emerald-700 p-6 rounded-2xl flex items-center justify-center gap-4 shadow-xl"
                            >
                              <CheckCircle2 size={32} />
                              <span className="text-xl font-black uppercase tracking-widest">Correct! Next challenge...</span>
                            </motion.div>
                          )}
                          {metalEqFeedback === 'incorrect' && (
                            <motion.div 
                              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                              className="bg-red-50 text-red-600 p-4 rounded-2xl text-center font-bold"
                            >
                              Not quite right. Think about the rules of reactivity and standard products.
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <button
                          onClick={checkChallenge}
                          disabled={metalEqFeedback === 'correct'}
                          className="w-full py-5 rounded-2xl bg-gray-900 text-white font-black text-xl uppercase tracking-widest shadow-[0_6px_0_0_#1f2937] active:shadow-none active:translate-y-1 transition-all disabled:opacity-50"
                        >
                          Check Answer
                        </button>
                     </div>
                   )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlaygroundView;
