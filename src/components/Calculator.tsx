import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Delete, Divide, Minus, Plus, X as Multiply, Equal } from 'lucide-react';

interface CalculatorProps {
  onClose: () => void;
}

const Calculator: React.FC<CalculatorProps> = ({ onClose }) => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [shouldReset, setShouldReset] = useState(false);

  const handleNumber = (n: string) => {
    if (display === '0' || shouldReset) {
      setDisplay(n);
      setShouldReset(false);
    } else {
      setDisplay(display + n);
    }
  };

  const handleOperator = (op: string) => {
    setEquation(display + ' ' + op + ' ');
    setShouldReset(true);
  };

  const calculate = () => {
    try {
      const result = eval(equation + display);
      setDisplay(String(result));
      setEquation('');
      setShouldReset(true);
    } catch {
      setDisplay('Error');
    }
  };

  const clear = () => {
    setDisplay('0');
    setEquation('');
  };

  const buttons = [
    { label: 'C', action: clear, className: 'bg-red-50 text-red-500 hover:bg-red-100' },
    { label: '/', action: () => handleOperator('/'), className: 'bg-gray-50 text-emerald-500 hover:bg-gray-100' },
    { label: '*', action: () => handleOperator('*'), className: 'bg-gray-50 text-emerald-500 hover:bg-gray-100' },
    { label: '-', action: () => handleOperator('-'), className: 'bg-gray-50 text-emerald-500 hover:bg-gray-100' },
    { label: '7', action: () => handleNumber('7') },
    { label: '8', action: () => handleNumber('8') },
    { label: '9', action: () => handleNumber('9') },
    { label: '+', action: () => handleOperator('+'), className: 'bg-gray-50 text-emerald-500 hover:bg-gray-100 row-span-2 h-full' },
    { label: '4', action: () => handleNumber('4') },
    { label: '5', action: () => handleNumber('5') },
    { label: '6', action: () => handleNumber('6') },
    { label: '1', action: () => handleNumber('1') },
    { label: '2', action: () => handleNumber('2') },
    { label: '3', action: () => handleNumber('3') },
    { label: '=', action: calculate, className: 'bg-emerald-500 text-white hover:bg-emerald-600 row-span-2 h-full shadow-[0_4px_0_0_#059669] active:shadow-none active:translate-y-1 transition-all' },
    { label: '0', action: () => handleNumber('0'), className: 'col-span-2' },
    { label: '.', action: () => handleNumber('.') },
  ];

  return (
    <motion.div 
      drag
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="fixed bottom-24 right-8 z-[1000] w-72 bg-white rounded-[2rem] shadow-2xl border-2 border-gray-100 overflow-hidden cursor-grab active:cursor-grabbing hover:shadow-emerald-100/50"
      style={{ touchAction: 'none' }} // Prevents scrolling while dragging
    >
      <div className="bg-gray-900 px-6 py-4 flex flex-col gap-1 items-end rounded-t-[1.8rem] m-1 border-b border-gray-800">
        <div className="flex w-full justify-between items-center mb-4">
          <div className="flex items-center gap-2 drag-handle">
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Casio 9000</span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors bg-white/10 rounded-full p-1 border border-white/5">
            <X size={14} />
          </button>
        </div>
        <div className="text-[10px] text-emerald-300 font-mono h-4 opacity-80">{equation}</div>
        <div className="text-4xl font-black text-white font-mono truncate w-full text-right tracking-tight">{display}</div>
      </div>
      
      <div className="p-5 bg-white grid grid-cols-4 gap-3 rounded-b-[2rem]">
        {buttons.map((btn, idx) => (
          <button
            key={idx}
            onClick={btn.action}
            className={`p-3 rounded-2xl font-black text-sm transition-all shadow-sm hover:shadow-md active:scale-95 ${btn.className || 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-100/50'} ${btn.label === '+' || btn.label === '=' ? '' : 'aspect-square'}`}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default Calculator;
