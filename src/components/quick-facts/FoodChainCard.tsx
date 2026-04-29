import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Leaf, Sun, Bug, Bird, Hexagon, Network, Link, Info } from 'lucide-react';

interface FoodChainCardProps {
  chineseType: 'traditional' | 'simplified' | null;
}

const FoodChainCard: React.FC<FoodChainCardProps> = ({ chineseType }) => {
  const [activeTab, setActiveTab] = useState<'chain' | 'web' | 'roles'>('chain');

  const t = (en: string, zhHans: string, zhHant: string) => {
    if (chineseType === 'simplified') return zhHans;
    if (chineseType === 'traditional') return zhHant;
    return en;
  };

  const chainNodes = [
    { id: 'sun', icon: Sun, label: t('Sun', '太阳', '太陽'), sub: t('Ultimate Energy Source', '最终能量来源', '最終能量來源'), color: 'text-yellow-500', bg: 'bg-yellow-100', border: 'border-yellow-200' },
    { id: 'producer', icon: Leaf, label: t('Producer', '生产者', '生產者'), sub: t('Grass / Plant', '草/植物', '草/植物'), color: 'text-emerald-500', bg: 'bg-emerald-100', border: 'border-emerald-200' },
    { id: 'primary', icon: Bug, label: t('Primary Consumer', '初级消费者', '初級消費者'), sub: t('Herbivore (Insect)', '草食动物(昆虫)', '草食動物(昆蟲)'), color: 'text-blue-500', bg: 'bg-blue-100', border: 'border-blue-200' },
    { id: 'secondary', icon: Bird, label: t('Secondary Consumer', '次级消费者', '次級消費者'), sub: t('Carnivore (Bird)', '肉食动物(鸟类)', '肉食動物(鳥類)'), color: 'text-orange-500', bg: 'bg-orange-100', border: 'border-orange-200' },
    { id: 'tertiary', icon: Hexagon, label: t('Tertiary Consumer', '三级消费者', '三級消費者'), sub: t('Apex (Hawk)', '顶级掠食者(鹰)', '頂級掠食者(鷹)'), color: 'text-red-500', bg: 'bg-red-100', border: 'border-red-200' }
  ];

  const renderArrow = (index: number) => {
    // Arrow gets thinner as index increases
    const thickness = Math.max(1, 16 - index * 3.5);
    const energyLabel = index === 0 ? "100%" : index === 1 ? "10%" : index === 2 ? "1%" : "0.1%";

    return (
      <div className="flex flex-col items-center justify-center relative w-full h-12 md:w-16 md:h-auto">
        <svg className="w-full h-full min-h-[40px] md:min-w-[40px]" viewBox="0 0 100 20" preserveAspectRatio="none">
          <motion.path 
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: index * 0.4 }}
            d="M 10,10 L 80,10" 
            stroke="#cbd5e1" 
            strokeWidth={thickness} 
            strokeLinecap="round" 
          />
          <motion.polygon 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: index * 0.4 + 0.8 }}
            points="80,0 100,10 80,20" 
            fill="#cbd5e1" 
          />
        </svg>
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.4 + 0.5 }}
          className="absolute -top-6 md:-top-4 text-[10px] md:text-xs font-black text-slate-400 bg-white px-2 rounded-full"
        >
          {energyLabel}
        </motion.div>
      </div>
    );
  };

  const renderTree = () => {
    return (
      <div className="relative w-full aspect-square md:aspect-video max-w-2xl mx-auto rounded-3xl bg-slate-50 border-2 border-slate-100 p-4 md:p-8 overflow-hidden flex flex-col items-center justify-center">
        {/* Draw lines for web */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
          <defs>
            <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
              <polygon points="0 0, 6 2, 0 4" fill="#94a3b8" />
            </marker>
          </defs>
          <g stroke="#cbd5e1" strokeWidth="2" markerEnd="url(#arrowhead)" opacity={0.6}>
            <line x1="20%" y1="75%" x2="45%" y2="55%" />
            <line x1="80%" y1="75%" x2="55%" y2="55%" />
            <line x1="50%" y1="50%" x2="50%" y2="25%" />
            <line x1="20%" y1="75%" x2="45%" y2="25%" />
          </g>
        </svg>
        
        <div className="w-full h-full relative z-10 flex flex-col justify-between">
          <div className="flex justify-center">
            <div className="flex flex-col items-center p-3 bg-red-100 text-red-600 rounded-2xl shadow-sm border border-red-200">
              <span className="text-[10px] font-black uppercase tracking-widest">{t('Hawk', '鹰', '鷹')}</span>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="flex flex-col items-center p-3 bg-orange-100 text-orange-600 rounded-2xl shadow-sm border border-orange-200">
              <span className="text-[10px] font-black uppercase tracking-widest">{t('Bird', '鸟类', '鳥類')}</span>
            </div>
          </div>
          <div className="flex justify-between px-8">
            <div className="flex flex-col items-center p-3 bg-blue-100 text-blue-600 rounded-2xl shadow-sm border border-blue-200">
              <span className="text-[10px] font-black uppercase tracking-widest">{t('Insect', '昆虫', '昆蟲')}</span>
            </div>
            <div className="flex flex-col items-center p-3 bg-emerald-100 text-emerald-600 rounded-2xl shadow-sm border border-emerald-200">
              <span className="text-[10px] font-black uppercase tracking-widest">{t('Plant', '植物', '植物')}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderWeb = () => (
    <div className="space-y-6">
      <div className="relative w-full aspect-square md:aspect-video max-w-2xl mx-auto rounded-3xl bg-slate-50 border-2 border-slate-100 p-4 md:p-8 overflow-hidden">
        {/* We use percentage positioning for a responsive web layout */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
          <defs>
            <marker id="arrow" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
              <polygon points="0 0, 6 2, 0 4" fill="#94a3b8" />
            </marker>
          </defs>
          <g stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 2" markerEnd="url(#arrow)" opacity={0.6}>
            {/* Plant -> Grasshopper */}
            <line x1="20%" y1="80%" x2="20%" y2="55%" />
            {/* Plant -> Rabbit */}
            <line x1="20%" y1="80%" x2="50%" y2="55%" />
            {/* Plant -> Mouse */}
            <line x1="20%" y1="80%" x2="80%" y2="55%" />
            
            {/* Berry -> Rabbit */}
            <line x1="80%" y1="80%" x2="50%" y2="55%" />
            {/* Berry -> Mouse */}
            <line x1="80%" y1="80%" x2="80%" y2="55%" />

            {/* Grasshopper -> Frog */}
            <line x1="20%" y1="55%" x2="20%" y2="35%" />
            {/* Grasshopper -> Bird */}
            <line x1="20%" y1="55%" x2="50%" y2="35%" />

            {/* Mouse -> Owl */}
            <line x1="80%" y1="55%" x2="80%" y2="25%" />
            {/* Mouse -> Fox */}
            <line x1="80%" y1="55%" x2="50%" y2="25%" />

            {/* Rabbit -> Fox */}
            <line x1="50%" y1="55%" x2="50%" y2="25%" />
            {/* Frog -> Owl */}
            <line x1="20%" y1="35%" x2="80%" y2="25%" />
            {/* Bird -> Fox */}
            <line x1="50%" y1="35%" x2="50%" y2="25%" />
          </g>
        </svg>

        {/* Nodes */}
        {/* Producers */}
        <div className="absolute top-[80%] left-[20%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 w-20">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl shadow-sm border border-emerald-200">
            <Leaf size={24} />
          </div>
          <span className="mt-1 text-[9px] font-black uppercase text-slate-500 bg-white/80 px-2 rounded backdrop-blur-sm whitespace-nowrap">{t('Grass', '草', '草')}</span>
        </div>
        <div className="absolute top-[80%] left-[80%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 w-20">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl shadow-sm border border-emerald-200">
            <Leaf size={24} />
          </div>
          <span className="mt-1 text-[9px] font-black uppercase text-slate-500 bg-white/80 px-2 rounded backdrop-blur-sm whitespace-nowrap">{t('Berries', '浆果', '漿果')}</span>
        </div>

        {/* Primary Consumers */}
        <div className="absolute top-[55%] left-[20%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 w-20">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl shadow-sm border border-blue-200">
            <Bug size={24} />
          </div>
          <span className="mt-1 text-[9px] font-black uppercase text-slate-500 bg-white/80 px-2 rounded backdrop-blur-sm whitespace-nowrap">{t('Grasshopper', '蚱蜢', '蚱蜢')}</span>
        </div>
        <div className="absolute top-[55%] left-[50%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 w-20">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl shadow-sm border border-blue-200">
            <div className="w-6 h-6 flex items-center justify-center font-bold">🐇</div>
          </div>
          <span className="mt-1 text-[9px] font-black uppercase text-slate-500 bg-white/80 px-2 rounded backdrop-blur-sm whitespace-nowrap">{t('Rabbit', '兔子', '兔子')}</span>
        </div>
        <div className="absolute top-[55%] left-[80%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 w-20">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl shadow-sm border border-blue-200">
            <div className="w-6 h-6 flex items-center justify-center font-bold">🐁</div>
          </div>
          <span className="mt-1 text-[9px] font-black uppercase text-slate-500 bg-white/80 px-2 rounded backdrop-blur-sm whitespace-nowrap">{t('Mouse', '老鼠', '老鼠')}</span>
        </div>

        {/* Secondary Consumers */}
        <div className="absolute top-[35%] left-[20%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 w-20">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl shadow-sm border border-orange-200">
            <div className="w-6 h-6 flex items-center justify-center font-bold">🐸</div>
          </div>
          <span className="mt-1 text-[9px] font-black uppercase text-slate-500 bg-white/80 px-2 rounded backdrop-blur-sm whitespace-nowrap">{t('Frog', '青蛙', '青蛙')}</span>
        </div>
        
        <div className="absolute top-[35%] left-[50%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 w-20">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl shadow-sm border border-orange-200">
            <div className="w-6 h-6 flex items-center justify-center font-bold">🐦</div>
          </div>
          <span className="mt-1 text-[9px] font-black uppercase text-slate-500 bg-white/80 px-2 rounded backdrop-blur-sm whitespace-nowrap">{t('Bird', '鸟', '鳥')}</span>
        </div>
        
        {/* Tertiary / Apex Consumers */}
        <div className="absolute top-[25%] left-[50%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 w-20">
          <div className="p-3 bg-red-100 text-red-600 rounded-2xl shadow-sm border border-red-200">
            <div className="w-6 h-6 flex items-center justify-center font-bold">🦊</div>
          </div>
          <span className="mt-1 text-[9px] font-black uppercase text-slate-500 bg-white/80 px-2 rounded backdrop-blur-sm whitespace-nowrap">{t('Fox', '狐狸', '狐狸')}</span>
        </div>
        <div className="absolute top-[25%] left-[80%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 w-20">
          <div className="p-3 bg-red-100 text-red-600 rounded-2xl shadow-sm border border-red-200">
            <div className="w-6 h-6 flex items-center justify-center font-bold">🦉</div>
          </div>
          <span className="mt-1 text-[9px] font-black uppercase text-slate-500 bg-white/80 px-2 rounded backdrop-blur-sm whitespace-nowrap">{t('Owl', '猫头鹰', '貓頭鷹')}</span>
        </div>

      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-2 flex items-center gap-2">
          <Network size={16} className="text-purple-500" />
          {t('Food Web Complexity', '食物网的复杂性', '食物網的複雜性')}
        </h4>
        <p className="text-slate-500 text-sm font-bold leading-relaxed">
          {t(
            'In reality, animals eat multiple types of food. A food web shows many interconnected food chains in an ecosystem.',
            '在现实中，动物会吃多种类型的食物。食物网展示了生态系统中许多相互交织的食物链。',
            '在現實中，動物會吃多種類型的食物。食物網展示了生態系統中許多相互交織的食物鏈。'
          )}
        </p>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-xl overflow-hidden w-full">
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 p-6 md:p-8 border-b-2 border-emerald-100 flex flex-col md:flex-row justify-between md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500 text-white rounded-xl shadow-sm">
              <Leaf size={20} />
            </div>
            <h3 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight">
              {t('Food Chain & Web', '食物链与食物网', '食物鏈與食物網')}
            </h3>
          </div>
          <p className="text-slate-500 font-bold text-sm">
            {t('Energy transfer in ecosystems', '生态系统中的能量传递', '生態系統中的能量傳遞')}
          </p>
        </div>

        <div className="flex bg-white/50 p-1 md:p-1.5 rounded-2xl backdrop-blur-md border md:border-2 border-white pointer-events-auto">
          <button 
            onClick={() => setActiveTab('chain')}
            className={`px-4 md:px-6 py-2.5 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all w-24 md:w-auto ${activeTab === 'chain' ? 'bg-white shadow-md text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t('Chain', '食物链', '食物鏈')}
          </button>
          <button 
            onClick={() => setActiveTab('web')}
            className={`px-4 md:px-6 py-2.5 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all w-24 md:w-auto ${activeTab === 'web' ? 'bg-white shadow-md text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t('Web', '食物网', '食物網')}
          </button>
          <button 
            onClick={() => setActiveTab('roles')}
            className={`px-4 md:px-6 py-2.5 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all w-24 md:w-auto ${activeTab === 'roles' ? 'bg-white shadow-md text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t('Roles', '角色', '角色')}
          </button>
        </div>
      </div>

      <div className="p-6 md:p-10 space-y-8 bg-slate-50/50">
        
        {activeTab === 'chain' && (
          <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="space-y-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-8">
              {chainNodes.map((node, i) => (
                <React.Fragment key={node.id}>
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", bounce: 0.5, delay: i * 0.4 }}
                    className="flex flex-col items-center flex-1 w-full"
                  >
                    <div className={`p-4 md:p-6 rounded-3xl ${node.bg} ${node.color} ${node.border} border-2 shadow-sm relative group`}>
                      <node.icon size={32} className="group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="mt-4 text-center">
                      <div className="text-xs font-black uppercase tracking-widest text-slate-700">{node.label}</div>
                      <div className="text-[10px] font-bold text-slate-500 mt-1">{node.sub}</div>
                    </div>
                  </motion.div>
                  {i < chainNodes.length - 1 && renderArrow(i)}
                </React.Fragment>
              ))}
            </div>

            <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 items-start">
              <div className="p-4 bg-orange-100 text-orange-600 rounded-2xl flex-shrink-0">
                <Leaf size={24} />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-2">{t('The 10% Rule', '10%定律', '10%定律')}</h4>
                <p className="text-slate-500 text-sm font-bold leading-relaxed mb-4">
                  {t(
                    'As energy passes from one trophic level to the next, about 90% is lost as heat, movement, or undigested materials. Only ~10% is stored and available for the next consumer.',
                    '当能量从一个营养级传递到下一个营养级时，约90%的能量会以热量、运动或未消化物质的形式流失。只有约10%的能量被储存并提供给下一个消费者。',
                    '當能量從一個營養級傳遞到下一個營養級時，約90%的能量會以熱量、運動或未消化物質的形式流失。只有約10%的能量被儲存並提供給下一個消費者。'
                  )}
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-black uppercase border border-slate-200">
                  <Info size={14} />
                  {t('This is why food chains rarely exceed 4 or 5 levels!', '这就是为什么食物链很少超过4或5级！', '這就是為什麼食物鏈很少超過4或5級！')}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'web' && (
          <motion.div initial={{opacity: 0}} animate={{opacity: 1}}>
            {renderWeb()}
          </motion.div>
        )}

        {activeTab === 'roles' && (
          <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="grid gap-6 md:grid-cols-2">
            
            <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-5">
                <Sun size={120} />
              </div>
              <h4 className="text-emerald-600 font-black uppercase tracking-widest mb-1 text-sm flex items-center gap-2">
                <Sun size={18} /> {t('Producers', '生产者', '生產者')}
              </h4>
              <p className="text-slate-500 text-sm font-bold leading-relaxed mt-4">
                {t('Plants and algae make their own food using sunlight (photosynthesis). They form the base of every food chain.', '植物和藻类利用阳光制造自己的食物（光合作用）。它们构成了每条食物链的基础。', '植物和藻類利用陽光製造自己的食物（光合作用）。它們構成了每條食物鏈的基礎。')}
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-blue-100 shadow-sm">
              <h4 className="text-blue-600 font-black uppercase tracking-widest mb-1 text-sm flex items-center gap-2">
                <Bug size={18} /> {t('Consumers', '消费者', '消費者')}
              </h4>
              <ul className="text-slate-500 text-sm font-bold leading-relaxed mt-4 space-y-3">
                <li className="flex gap-2">
                  <span className="text-blue-400 font-black tracking-widest uppercase">{t('Herbivores:', '草食动物:', '草食動物:')}</span>
                  {t('Eat only plants.', '只吃植物。', '只吃植物。')}
                </li>
                <li className="flex gap-2">
                  <span className="text-red-400 font-black tracking-widest uppercase">{t('Carnivores:', '肉食动物:', '肉食動物:')}</span>
                  {t('Eat other animals.', '吃其他动物。', '吃其他動物。')}
                </li>
                <li className="flex gap-2">
                  <span className="text-purple-400 font-black tracking-widest uppercase">{t('Omnivores:', '杂食动物:', '雜食動物:')}</span>
                  {t('Eat both plants and animals.', '植物和动物都吃。', '植物和動物都吃。')}
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-yellow-100 shadow-sm md:col-span-2">
              <h4 className="text-yellow-600 font-black uppercase tracking-widest mb-1 text-sm flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M12 2A6 6 0 0 0 6 8v3.5a6.5 6.5 0 0 0 12 0V8a6 6 0 0 0-6-6Z"/></svg>
                {t('Decomposers', '分解者', '分解者')}
              </h4>
              <p className="text-slate-500 text-sm font-bold leading-relaxed mt-2">
                {t('Bacteria and fungi break down dead plants and animals. They return valuable nutrients back to the soil, which helps producers grow. They recycle the matter in the ecosystem.', '细菌和真菌分解死去的动植物。它们将有价值的营养物质送回土壤中，帮助生产者生长。它们回收了生态系统中的物质。', '細菌和真菌分解死去的動植物。它們將有價值的營養物質送回土壤中，幫助生產者生長。它們回收了生態系統中的物質。')}
              </p>
            </div>

          </motion.div>
        )}

      </div>
    </div>
  );
};

(FoodChainCard as any).UNIT = 4;
(FoodChainCard as any).SUBJECT = 'BIOLOGY';

export default FoodChainCard;
