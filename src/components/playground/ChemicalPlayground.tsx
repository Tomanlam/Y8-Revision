import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Droplets, Flame, Wind, Atom, Info, ArrowRight 
} from 'lucide-react';

export const chemicals = [
  { 
    name: 'Water', 
    formula: 'H₂O', 
    details: 'A vital compound for all known forms of life.', 
    icon: <Droplets size={32} />, 
    color: 'bg-blue-500',
    state: 'liquid' as const,
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
    state: 'gas' as const,
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
    state: 'gas' as const,
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
    state: 'gas' as const,
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
    state: 'gas' as const,
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
    state: 'gas' as const,
    composition: [
      { type: 'O', count: 2, color: 'bg-red-500 text-white' }
    ]
  }
];

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

const ChemicalPlayground = () => {
  const [selectedChemical, setSelectedChemical] = useState<any>(null);

  if (selectedChemical) {
    return (
      <div className="space-y-8">
        <div className="bg-white border-2 border-gray-200 p-8 rounded-3xl shadow-[0_6px_0_0_#e5e7eb]">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h2 className="text-4xl font-black text-gray-800 uppercase tracking-tight">{selectedChemical.name}</h2>
              <p className="text-emerald-500 font-black text-2xl font-mono">{selectedChemical.formula}</p>
            </div>
            <div className={`${selectedChemical.color} text-white p-6 rounded-3xl shadow-xl`}>
              {selectedChemical.icon}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Composition</h3>
              <div className="flex flex-wrap gap-4">
                {selectedChemical.composition.map((comp: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border-2 border-gray-100">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black border-2 ${comp.color}`}>
                      {comp.type}
                    </div>
                    <div>
                      <p className="font-black text-gray-800 text-xl">× {comp.count}</p>
                      <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Atoms</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-4">
                <p className="text-gray-600 font-medium leading-relaxed">
                  {selectedChemical.details}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest text-center md:text-left">Molecular View</h3>
              <MolecularAnimation 
                state={selectedChemical.state} 
                formula={selectedChemical.formula} 
                color={selectedChemical.color} 
              />
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">
                {selectedChemical.state === 'gas' 
                  ? 'Molecules move rapidly and are far apart' 
                  : 'Molecules slide past each other and are close together'}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setSelectedChemical(null)}
          className="w-full bg-gray-200 text-gray-500 py-4 rounded-2xl font-black text-xl uppercase tracking-widest hover:bg-gray-300 transition-all shadow-[0_4px_0_0_#D1D5DB] active:shadow-none active:translate-y-1"
        >
          Back to List
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {chemicals.map((chem, idx) => (
        <motion.div
          key={chem.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          onClick={() => setSelectedChemical(chem)}
          className={`cursor-pointer bg-white border-2 border-gray-200 rounded-3xl p-6 shadow-[0_6px_0_0_#e5e7eb] transition-all relative overflow-hidden group hover:border-emerald-400`}
        >
          <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 transition-transform group-hover:scale-150 ${chem.color}`} />
          
          <div className="relative z-10">
            <div className={`${chem.color} text-white p-4 rounded-2xl w-fit mb-4 shadow-lg`}>
              {chem.icon}
            </div>
            <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight leading-none mb-1">{chem.name}</h3>
            <p className="text-emerald-500 font-black text-xl font-mono">{chem.formula}</p>
            <p className="text-gray-300 text-[10px] font-black uppercase tracking-widest mt-4">Tap to explore</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default ChemicalPlayground;
