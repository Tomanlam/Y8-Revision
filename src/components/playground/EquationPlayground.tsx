import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Calculator, CheckCircle2, XCircle, ArrowRight, Zap, Info 
} from 'lucide-react';

export const equations = [
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

export const equationRearrangements: Record<string, Record<string, string>> = {
  speed: { v: 'v = d / t', d: 'd = v × t', t: 't = d / v' },
  pressure: { P: 'P = F / A', F: 'F = P × A', A: 'A = F / P' },
  moment: { M: 'M = F × d', F: 'F = M / d', d: 'd = M / F' },
  density: { ρ: 'ρ = m / V', m: 'm = ρ × V', V: 'V = m / ρ' },
  concentration: { C: 'C = n / V', n: 'n = C × V', V: 'V = n / C' },
  percentage: { '%': '% = (Part / Whole) × 100', 'Part': 'Part = (% × Whole) / 100', 'Whole': 'Whole = (Part / %) × 100' }
};

const EquationPlayground = () => {
  const [selectedEquation, setSelectedEquation] = useState<any>(null);
  const [equationSubject, setEquationSubject] = useState<string>('');
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [practiceQuestion, setPracticeQuestion] = useState<any>(null);
  const [practiceAnswer, setPracticeAnswer] = useState<string | null>(null);
  const [isPracticeChecked, setIsPracticeChecked] = useState(false);

  const generatePracticeQuestion = (equation: any) => {
    const v1 = Math.floor(Math.random() * 10) + 1;
    const v2 = Math.floor(Math.random() * 10) + 1;
    let questionText = '';
    let correctAnswer = 0;
    let unit = '';

    if (equation.id === 'speed') {
      const type = Math.random() > 0.5 ? 'v' : 'd';
      if (type === 'v') {
        questionText = `If Distance is ${v1 * v2}m and Time is ${v2}s, what is the Speed?`;
        correctAnswer = v1;
        unit = 'm/s';
      } else {
        questionText = `If Speed is ${v1}m/s and Time is ${v2}s, what is the Distance?`;
        correctAnswer = v1 * v2;
        unit = 'm';
      }
    } else if (equation.id === 'pressure') {
      questionText = `If Force is ${v1 * v2}N and Area is ${v2}m², what is the Pressure?`;
      correctAnswer = v1;
      unit = 'N/m²';
    } else if (equation.id === 'moment') {
      questionText = `If Force is ${v1}N and Distance is ${v2}m, what is the Moment?`;
      correctAnswer = v1 * v2;
      unit = 'Nm';
    } else if (equation.id === 'density') {
      questionText = `If Mass is ${v1 * v2}g and Volume is ${v2}cm³, what is the Density?`;
      correctAnswer = v1;
      unit = 'g/cm³';
    } else if (equation.id === 'concentration') {
      questionText = `If Number of particles is ${v1 * v2} and Volume is ${v2}L, what is the Concentration?`;
      correctAnswer = v1;
      unit = 'particles/L';
    } else {
      questionText = `If Part is ${v1} and Whole is ${v1 * 10}, what is the Percentage?`;
      correctAnswer = 10;
      unit = '%';
    }

    const options = [
      correctAnswer.toString(),
      (correctAnswer + 2).toString(),
      (correctAnswer * 2).toString(),
      (Math.max(1, correctAnswer - 1)).toString()
    ].sort(() => Math.random() - 0.5);

    setPracticeQuestion({ text: questionText, correctAnswer: correctAnswer.toString(), options, unit });
    setPracticeAnswer(null);
    setIsPracticeChecked(false);
  };

  if (isPracticeMode) {
    return (
      <div className="space-y-8">
        <div className="bg-white border-2 border-gray-200 p-8 rounded-3xl shadow-[0_6px_0_0_#e5e7eb]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-gray-800">{practiceQuestion?.text}</h2>
            <button 
              onClick={() => setIsPracticeMode(false)}
              className="text-gray-400 hover:text-gray-600 font-black uppercase text-xs tracking-widest"
            >
              Exit Practice
            </button>
          </div>
          <div className="grid gap-4">
            {practiceQuestion?.options.map((option: string) => (
              <button
                key={option}
                disabled={isPracticeChecked}
                onClick={() => setPracticeAnswer(option)}
                className={`w-full p-4 text-left rounded-2xl border-2 transition-all font-bold text-lg
                  ${practiceAnswer === option 
                    ? 'border-blue-400 bg-blue-50 text-blue-600 shadow-[0_4px_0_0_#60a5fa]' 
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700 shadow-[0_4px_0_0_#e5e7eb]'
                  }
                  ${isPracticeChecked && option === practiceQuestion.correctAnswer ? 'border-emerald-400 bg-emerald-50 text-emerald-600 shadow-[0_4px_0_0_#34d399]' : ''}
                  ${isPracticeChecked && practiceAnswer === option && practiceAnswer !== practiceQuestion.correctAnswer ? 'border-red-400 bg-red-50 text-red-600 shadow-[0_4px_0_0_#f87171]' : ''}
                `}
              >
                <div className="flex items-center justify-between">
                  <span>{option} {practiceQuestion.unit}</span>
                  {isPracticeChecked && option === practiceQuestion.correctAnswer && <CheckCircle2 size={24} />}
                  {isPracticeChecked && practiceAnswer === option && practiceAnswer !== practiceQuestion.correctAnswer && <XCircle size={24} />}
                </div>
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => {
            if (isPracticeChecked) generatePracticeQuestion(selectedEquation);
            else setIsPracticeChecked(true);
          }}
          disabled={!practiceAnswer}
          className={`w-full py-4 rounded-2xl font-black text-xl uppercase tracking-widest transition-all
            ${!practiceAnswer ? 'bg-gray-200 text-gray-400' : 'bg-emerald-500 text-white shadow-[0_6px_0_0_#059669] active:shadow-none active:translate-y-1'}
          `}
        >
          {isPracticeChecked ? 'Next Question' : 'Check Answer'}
        </button>
      </div>
    );
  }

  if (selectedEquation) {
    return (
      <div className="space-y-8">
        <div className="bg-white border-2 border-gray-200 p-12 rounded-3xl shadow-[0_8px_0_0_#e5e7eb] text-center relative">
          <button 
            onClick={() => setSelectedEquation(null)}
            className="absolute top-6 left-6 text-gray-400 hover:text-gray-600"
          >
            <ArrowRight className="rotate-180" size={24} />
          </button>
          <span className="text-gray-400 text-xs font-black uppercase tracking-[0.2em] block mb-4">Rearrange the formula</span>
          <div className="text-5xl font-black text-gray-800 mb-8 flex items-center justify-center gap-4 flex-wrap">
            {equationRearrangements[selectedEquation.id][equationSubject || selectedEquation.variables[0].symbol].split(' ').map((part, i) => (
              <span key={i} className={selectedEquation.variables.some((v: any) => v.symbol === part) ? 'text-blue-500' : ''}>
                {part}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {selectedEquation.variables.map((v: any) => (
              <button
                key={v.symbol}
                onClick={() => setEquationSubject(v.symbol)}
                className={`p-4 rounded-2xl border-2 font-black text-xl transition-all
                  ${(equationSubject || selectedEquation.variables[0].symbol) === v.symbol 
                    ? 'bg-blue-500 text-white border-blue-600 shadow-[0_4px_0_0_#1e40af]' 
                    : 'bg-white text-gray-400 border-gray-200 hover:border-blue-300 shadow-[0_4px_0_0_#e5e7eb]'
                  }
                `}
              >
                {v.symbol}
              </button>
            ))}
          </div>
          <p className="mt-8 text-gray-400 font-bold text-sm uppercase tracking-widest">Click a variable to make it the subject</p>
        </div>

        <div className="grid gap-4">
          {selectedEquation.variables.map((v: any) => (
            <div key={v.symbol} className="bg-white border-2 border-gray-200 p-4 rounded-2xl flex items-center justify-between shadow-[0_4px_0_0_#F3F4F6]">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded-xl flex items-center justify-center font-black">
                  {v.symbol}
                </div>
                <div>
                  <p className="font-black text-gray-800 uppercase text-sm">{v.name}</p>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Unit: {v.unit || 'N/A'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            setIsPracticeMode(true);
            generatePracticeQuestion(selectedEquation);
          }}
          className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-black text-xl uppercase tracking-widest shadow-[0_6px_0_0_#059669] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-3"
        >
          <Zap size={24} />
          Practice Mode
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {equations.map((eq) => (
        <motion.button
          key={eq.id}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setSelectedEquation(eq);
            setEquationSubject(eq.variables[0].symbol);
          }}
          className="w-full bg-white border-2 border-gray-200 p-6 rounded-3xl flex items-center justify-between shadow-[0_4px_0_0_#e5e7eb] hover:border-blue-400 transition-all group"
        >
          <div className="text-left">
            <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">{eq.name}</h3>
            <p className="text-blue-500 font-black text-lg font-mono">{eq.formula}</p>
          </div>
          <div className="bg-gray-100 text-gray-400 p-2 rounded-xl group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
            <ArrowRight size={24} />
          </div>
        </motion.button>
      ))}
    </div>
  );
};

export default EquationPlayground;
