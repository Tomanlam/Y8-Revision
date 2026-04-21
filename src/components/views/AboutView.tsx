import * as React from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Github, ExternalLink, Zap, RefreshCw } from 'lucide-react';

const AboutView: React.FC = () => {
  const revisionNumber = "1.7.0";
  
  return (
    <div className="min-h-screen bg-gray-50 pb-24 px-4 md:px-8">
      <header className="bg-white border-b-2 border-gray-200 p-6 sticky top-0 z-10 -mx-4 md:-mx-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tight">About</h1>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-1">App Information</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto py-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Creator Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border-2 border-gray-200 rounded-3xl overflow-hidden shadow-[0_4px_0_0_rgba(0,0,0,0.05)]"
          >
            <div className="bg-emerald-500 p-6 text-white">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                  <GraduationCap size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight">Creator</h3>
                  <p className="text-emerald-100 font-bold text-sm uppercase tracking-widest opacity-90">Mr. LAM</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="relative pl-6 border-l-2 border-emerald-100 space-y-1">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm" />
                <p className="text-gray-800 font-black text-sm uppercase tracking-tight">
                  Bachelor of Science
                </p>
                <p className="text-gray-500 font-bold text-xs uppercase tracking-wider">
                  Biochemistry major, Psychology Minor
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">
                    University of Hong Kong
                  </span>
                  <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">
                    2013
                  </span>
                </div>
              </div>

              <div className="relative pl-6 border-l-2 border-emerald-100 space-y-1">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm" />
                <p className="text-gray-800 font-black text-sm uppercase tracking-tight">
                  Post Graduate Certificate in Education
                </p>
                <p className="text-gray-500 font-bold text-xs uppercase tracking-wider">
                  Secondary Education
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">
                    University of Sunderland
                  </span>
                  <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">
                    2025
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* GitHub Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border-2 border-gray-200 rounded-3xl p-6 shadow-[0_4px_0_0_rgba(0,0,0,0.05)]"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-gray-100 p-3 rounded-2xl text-gray-800">
                <Github size={24} />
              </div>
              <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Repository</h3>
            </div>
            <a 
              href="https://github.com/Tomanlam/Y8-Revision" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-between bg-gray-900 text-white p-4 rounded-2xl hover:bg-gray-800 transition-colors group"
            >
              <span className="font-bold text-sm truncate mr-2">github.com/Tomanlam/Y8-Revision</span>
              <ExternalLink size={18} className="flex-shrink-0 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </a>
          </motion.div>

          {/* Tech Stack Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white border-2 border-gray-200 rounded-3xl p-6 shadow-[0_4px_0_0_rgba(0,0,0,0.05)]"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-orange-100 p-3 rounded-2xl text-orange-600">
                <Zap size={24} />
              </div>
              <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Tech Stack</h3>
            </div>
            <div className="bg-orange-50 border-2 border-orange-100 p-4 rounded-2xl text-center">
              <p className="text-xl font-black text-orange-700">Powered by React + Vite</p>
              <p className="text-orange-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Modern Web Technologies</p>
            </div>
          </motion.div>

          {/* Revision Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white border-2 border-gray-200 rounded-3xl p-6 shadow-[0_4px_0_0_rgba(0,0,0,0.05)]"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-blue-100 p-3 rounded-2xl text-blue-600">
                <RefreshCw size={24} />
              </div>
              <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Version</h3>
            </div>
            <div className="bg-blue-50 border-2 border-blue-100 p-4 rounded-2xl text-center">
              <p className="text-3xl font-black text-blue-700">v{revisionNumber}</p>
              <p className="text-blue-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Revision Number</p>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default AboutView;
