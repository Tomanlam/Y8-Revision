import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Activity, Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SolubilityCurveCardProps {
  chineseType?: 'traditional' | 'simplified' | null;
}

const BeakerParticles: React.FC<{ count: number; color: string; volume: number }> = ({ count, color, volume }) => {
  const particles = React.useMemo(() => {
    return Array.from({ length: Math.min(count, 50) }, (_, i) => ({
      id: i,
      x: 10 + Math.random() * 80,
      y: 10 + Math.random() * 80,
      tx: (Math.random() - 0.5) * 40,
      ty: (Math.random() - 0.5) * 40,
      duration: 2 + Math.random() * 3
    }));
  }, [count, volume]);

  return (
    <>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          animate={{
            x: [0, p.tx, 0],
            y: [0, p.ty, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute w-1.5 h-1.5 rounded-full opacity-60 shadow-sm"
          style={{ 
            backgroundColor: color,
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
        />
      ))}
    </>
  );
};

const SolubilityCurveCard: React.FC<SolubilityCurveCardProps> = ({ chineseType }) => {
  const [selectedSalt, setSelectedSalt] = useState<'kno3' | 'nacl' | 'pbno3'>('kno3');
  const [temp, setTemp] = useState(20);

  const t = (en: string, sc: string, tc: string) => {
    if (chineseType === 'simplified') return sc;
    if (chineseType === 'traditional') return tc;
    return en;
  };

  const salts = {
    kno3: { name: t('Potassium Nitrate', '硝酸钾', '硝酸鉀'), color: '#ef4444', formula: 'KNO₃' },
    nacl: { name: t('Sodium Chloride', '氯化钠', '氯化鈉'), color: '#eab308', formula: 'NaCl' },
    pbno3: { name: t('Lead(II) Nitrate', '硝酸铅(II)', '硝酸鉛(II)'), color: '#3b82f6', formula: 'Pb(NO₃)₂' },
  } as const;

  const solubilityData = [
    { temp: 0, kno3: 13, nacl: 36, pbno3: 37 },
    { temp: 10, kno3: 21, nacl: 36, pbno3: 45 },
    { temp: 20, kno3: 32, nacl: 36, pbno3: 54 },
    { temp: 30, kno3: 46, nacl: 37, pbno3: 63 },
    { temp: 40, kno3: 64, nacl: 37, pbno3: 73 },
    { temp: 50, kno3: 86, nacl: 37, pbno3: 84 },
    { temp: 60, kno3: 110, nacl: 38, pbno3: 95 },
    { temp: 70, kno3: 138, nacl: 38, pbno3: 106 },
    { temp: 80, kno3: 169, nacl: 39, pbno3: 117 },
    { temp: 90, kno3: 202, nacl: 39, pbno3: 127 },
    { temp: 100, kno3: 246, nacl: 40, pbno3: 138 },
  ];

  const getSolubility = (salt: 'kno3' | 'nacl' | 'pbno3', tVal: number) => {
    const index = solubilityData.findIndex(d => d.temp > tVal);
    if (index === -1) return solubilityData[solubilityData.length - 1][salt];
    if (index === 0) return solubilityData[0][salt];
    
    const d1 = solubilityData[index - 1];
    const d2 = solubilityData[index];
    const ratio = (tVal - d1.temp) / (d2.temp - d1.temp);
    return Math.round(d1[salt] + ratio * (d2[salt] - d1[salt]));
  };

  const currentSolubility = getSolubility(selectedSalt, temp);

  return (
    <div className="bg-white rounded-[2rem] border-2 border-gray-100 shadow-xl overflow-hidden w-full">
      <div className="bg-gradient-to-r from-red-50 to-blue-50 p-6 border-b-2 border-gray-100">
         <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-3">
            <Activity className="text-blue-500" />
            {t('Solubility Curves', '溶解度曲线', '溶解度曲線')}
         </h3>
         <p className="text-gray-500 font-bold text-sm mt-1">
            {t('Investigate how temperature affects the solubility of different salts.', '研究温度如何影响不同盐类的溶解度。', '研究溫度如何影響不同鹽類的溶解度。')}
         </p>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
           <div className="bg-gray-50 p-6 rounded-[2.5rem] border-2 border-gray-100 flex flex-col shadow-inner">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('Solubility (g/100g water)', '溶解度 (g/100g水)', '溶解度 (g/100g水)')}</span>
                <span className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('Temperature (°C)', '温度 (°C)', '溫度 (°C)')}</span>
              </div>
              <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={solubilityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="temp" fontSize={10} fontWeight="bold" tick={{ fill: '#94a3b8' }} />
                      <YAxis fontSize={10} fontWeight="bold" tick={{ fill: '#94a3b8' }} />
                      <Tooltip 
                         contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold', fontSize: '10px' }}
                      />
                      <Legend verticalAlign="top" iconType="circle" fontSize={10} wrapperStyle={{ paddingBottom: '20px' }} />
                      <Line type="monotone" dataKey="kno3" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} name={t('KNO₃', '硝酸钾', '硝酸鉀')} />
                      <Line type="monotone" dataKey="nacl" stroke="#eab308" strokeWidth={3} dot={{ r: 4 }} name={t('NaCl', '氯化钠', '氯化鈉')} />
                      <Line type="monotone" dataKey="pbno3" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} name={t('Pb(NO₃)₂', '硝酸铅(II)', '硝酸鉛(II)')} />
                   </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between mb-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('Test Temperature', '测试温度', '測試溫度')}</label>
                  <span className="text-sm font-black text-gray-800">{temp}°C</span>
                </div>
                <input 
                  type="range" min="0" max="100" value={temp} 
                  onChange={(e) => setTemp(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
           </div>

           <div className="space-y-8">
              <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200 shadow-sm overflow-x-auto">
                {(['kno3', 'nacl', 'pbno3'] as const).map((salt) => (
                  <button 
                    key={salt}
                    onClick={() => setSelectedSalt(salt)}
                    className={`flex-1 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap ${selectedSalt === salt ? 'bg-white shadow-md ring-1 ring-black/5 text-gray-900 translate-y-[-1px]' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    {salts[salt].formula}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[50, 100, 200].map((vol) => {
                  const amount = Math.round((currentSolubility * vol) / 100);
                  
                  return (
                    <div key={vol} className="bg-white p-6 rounded-3xl border-2 border-gray-100 flex flex-col items-center hover:border-blue-100 transition-colors shadow-sm">
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">{vol} cm³ {t('Water', '水', '水')}</span>
                       <div className="relative w-20 h-28 border-x-4 border-b-4 border-slate-200 rounded-b-2xl overflow-hidden bg-gray-50/50">
                          {/* Beaker Markings */}
                          <div className="absolute left-0 top-4 w-2 h-0.5 bg-slate-300" />
                          <div className="absolute left-0 top-12 w-3 h-0.5 bg-slate-300" />
                          <div className="absolute left-0 top-20 w-2 h-0.5 bg-slate-300" />
                          
                          <div className="absolute bottom-0 w-full bg-blue-100/60 h-[85%] border-t border-blue-200/50" />
                          
                          <div className="absolute inset-0 z-10">
                             <BeakerParticles count={amount} color={salts[selectedSalt].color} volume={vol} />
                          </div>

                          <div className="absolute top-0 w-full h-4 bg-slate-200/20 blur-[1px]" />
                       </div>
                       <div className="mt-4 text-center">
                          <p className="text-2xl font-black tracking-tighter" style={{ color: salts[selectedSalt].color }}>{amount}<span className="text-[10px] ml-0.5">g</span></p>
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{t('Limit', '最大溶解', '最大溶解')}</p>
                       </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-emerald-50 p-6 rounded-3xl border-2 border-emerald-100">
                <div className="flex items-center gap-3 mb-2">
                  <Info className="text-emerald-500" size={18} />
                  <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">{t('Key Concept', '核心概念', '核心概念')}</span>
                </div>
                <p className="text-[10px] font-bold text-emerald-800 leading-relaxed font-sans">
                   {t('This graph shows the SATURATED point. Any point ON the line means the solution is saturated. BELOW the line is unsaturated, and ABOVE is supersaturated.', '该图显示了饱和点。线上的任何点都表示溶液已饱和。线下表示未饱和，线上表示过饱和。', '該圖顯示了飽和點。線上的任何點都表示溶液已飽和。線下表示未飽和，線上表示過飽和。')}
                </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

// Metadata for sorting
(SolubilityCurveCard as any).UNIT = 2;
(SolubilityCurveCard as any).SUBJECT = 'CHEMISTRY';

export default SolubilityCurveCard;
