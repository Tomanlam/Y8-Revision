import * as React from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Github, ExternalLink, Zap, RefreshCw, Info, Sparkles } from 'lucide-react';

const AboutView: React.FC = () => {
  const revisionNumber = "6.0.0";
  const [clickCount, setClickCount] = React.useState(0);
  
  const handleCreatorClick = () => {
    setClickCount(prev => prev + 1);
  };
  
  const showEasterEgg = clickCount >= 3;
  
  return (
    <div className="flex-1 flex flex-col items-center justify-start p-6 max-w-7xl mx-auto w-full pt-4 pb-24">
      <div className="w-full flex items-center gap-4 mb-6">
        <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600">
          <Info size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tight leading-none">About</h1>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-1">App Information</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {/* Creator Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleCreatorClick}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-[2rem] p-6 shadow-lg text-white flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm border border-white/20 text-teal-50">
              <GraduationCap size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tight leading-none">Creator</h3>
              <p className="text-emerald-100 font-bold text-[10px] uppercase tracking-widest mt-1 opacity-90">Mr. LAM</p>
            </div>
          </div>
          
          <div className="space-y-4 bg-white/10 rounded-2xl border border-white/10 p-5 backdrop-blur-sm">
            <div className="relative pl-6 border-l-2 border-emerald-300/50 space-y-1">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-teal-500 border-4 border-white shadow-sm" />
              <p className="text-white font-black text-sm uppercase tracking-tight">
                Bachelor of Science
              </p>
              <p className="text-emerald-100 font-bold text-[10px] uppercase tracking-wider">
                Biochemistry major, Psychology Minor
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="bg-white/20 text-white px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">
                  University of Hong Kong
                </span>
                <span className="bg-emerald-900/30 text-emerald-100 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">
                  2013
                </span>
              </div>
            </div>

            <div className="relative pl-6 border-l-2 border-emerald-300/50 space-y-1">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-teal-500 border-4 border-white shadow-sm" />
              <p className="text-white font-black text-sm uppercase tracking-tight">
                Post Graduate Certificate in Education
              </p>
              <p className="text-emerald-100 font-bold text-[10px] uppercase tracking-wider">
                Secondary Education
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="bg-white/20 text-white px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">
                  University of Sunderland
                </span>
                <span className="bg-emerald-900/30 text-emerald-100 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">
                  2025
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-6">
          {/* Version & Tech Stack Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Version Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-[2rem] p-6 shadow-lg text-white flex flex-col justify-between"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm border border-white/20 text-blue-50">
                  <RefreshCw size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight leading-none">Version</h3>
                  <p className="text-blue-100 font-bold text-[10px] uppercase tracking-widest mt-1 opacity-90">v{revisionNumber}</p>
                </div>
              </div>
              
              <div className="bg-white/10 rounded-2xl border border-white/10 p-4 backdrop-blur-sm">
                <p className="text-blue-50 font-black text-xs uppercase tracking-widest mb-1 opacity-70">Current Revision</p>
                <p className="text-2xl font-black text-white leading-none">Production Ready</p>
              </div>
            </motion.div>

            {/* Tech Stack Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-gradient-to-br from-orange-500 to-red-600 rounded-[2rem] p-6 shadow-lg text-white flex flex-col justify-between"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm border border-white/20 text-orange-50">
                  <Zap size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight leading-none">Tech Stack</h3>
                  <p className="text-orange-100 font-bold text-[10px] uppercase tracking-widest mt-1 opacity-90">Modern Web</p>
                </div>
              </div>
              
              <div className="bg-white/10 rounded-2xl border border-white/10 p-4 backdrop-blur-sm">
                <div className="flex flex-wrap gap-2">
                  <span className="bg-white/20 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest">React 18</span>
                  <span className="bg-white/20 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest">TypeScript</span>
                  <span className="bg-white/20 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest">Tailwind</span>
                  <span className="bg-white/20 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest">Firebase</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* AI Engine Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-[2rem] p-6 shadow-lg text-white"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm border border-white/20 text-purple-50">
                  <Sparkles size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight leading-none">Large Language Model (LLM) Deployed</h3>
                  <p className="text-purple-100 font-bold text-[10px] uppercase tracking-widest mt-1 opacity-90">LLM Processing</p>
                </div>
              </div>
              <div className="hidden sm:block bg-purple-900/30 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-sm text-[10px] font-black uppercase tracking-widest text-purple-100">
                Google DeepMind
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-2xl border border-white/10 p-4 backdrop-blur-sm">
                <p className="text-purple-50 font-black text-[9px] uppercase tracking-widest mb-1 opacity-70">Architecture</p>
                <p className="text-sm font-black text-white">Gemini 3.1 Flash Lite</p>
              </div>
              <div className="bg-white/10 rounded-2xl border border-white/10 p-4 backdrop-blur-sm">
                <p className="text-purple-50 font-black text-[9px] uppercase tracking-widest mb-1 opacity-70">Capabilities</p>
                <p className="text-sm font-black text-white">Automated Grading & Feedback</p>
              </div>
            </div>
          </motion.div>

          {/* GitHub Card */}
          {showEasterEgg && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border-2 border-gray-200 rounded-[2rem] p-6 shadow-[0_4px_0_0_rgba(0,0,0,0.05)]"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-gray-100 p-4 rounded-2xl text-gray-800">
                  <Github size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight leading-none">Repository</h3>
                  <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">Open Source</p>
                </div>
              </div>
              <a 
                href="https://github.com/Tomanlam/Y8-Revision" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between bg-gray-900 border-2 border-black text-white p-4 rounded-2xl hover:bg-gray-800 hover:-translate-y-1 shadow-[0_4px_0_0_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 transition-all group"
              >
                <span className="font-bold text-xs truncate mr-2 tracking-wide">github.com/Tomanlam/Y8-Revision</span>
                <ExternalLink size={18} className="flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" />
              </a>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AboutView;
