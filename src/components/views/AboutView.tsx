import * as React from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Github, ExternalLink, Zap, RefreshCw, Info, Sparkles, Terminal, GitCommit } from 'lucide-react';

interface Commit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    }
  };
  html_url: string;
}

const AboutView: React.FC = () => {
  const revisionNumber = "6.0.0";
  const [clickCount, setClickCount] = React.useState(0);
  const [changelog, setChangelog] = React.useState<Commit[]>([]);
  const [isLoadingLog, setIsLoadingLog] = React.useState(true);
  const [logError, setLogError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchChangelog = async () => {
      try {
        const response = await fetch("https://api.github.com/repos/Tomanlam/Y8-Revision/commits");
        if (!response.ok) throw new Error("Failed to fetch changelog");
        const data = await response.json();
        setChangelog(data.slice(0, 5));
      } catch (err) {
        setLogError("Could not load recent updates.");
      } finally {
        setIsLoadingLog(false);
      }
    };
    fetchChangelog();
  }, []);
  
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

      {/* Changelog Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="w-full mt-6"
      >
        <div className="bg-slate-900 rounded-[2rem] p-6 sm:p-8 border-2 border-slate-800 shadow-inner flex flex-col gap-6">
          <div className="flex items-center gap-4 border-b border-white/10 pb-4">
            <div className="bg-emerald-500/20 text-emerald-400 p-2.5 rounded-2xl border border-emerald-500/30">
              <Terminal size={28} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Update Log</h2>
              <p className="text-emerald-500 font-bold text-[10px] uppercase tracking-widest mt-1">Live from repository</p>
            </div>
          </div>
          
          <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap flex flex-col gap-2">
            {isLoadingLog ? (
              <div className="text-emerald-400 animate-pulse">
                {"{ \"status\": \"fetching_updates...\" }"}
              </div>
            ) : logError ? (
              <div className="text-red-400">
                 {"{ \"error\": \"" + logError + "\" }"}
              </div>
            ) : (
              <div className="relative">
                <span className="text-emerald-400">{"["}</span>
                {changelog.map((entry, idx) => (
                  <TypewriterEntry key={entry.sha} entry={entry} isLast={idx === changelog.length - 1} delay={idx * 0.2} />
                ))}
                <span className="text-emerald-400">{"]"}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const TypewriterEntry: React.FC<{ entry: Commit; isLast: boolean; delay: number }> = ({ entry, isLast, delay }) => {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!visible) return null;

  const date = new Date(entry.commit.author.date).toLocaleDateString();
  const sha = entry.sha.substring(0, 7);
  const msg = entry.commit.message.split('\n')[0].replace(/"/g, '\\"');

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="ml-4 my-3 group"
    >
      <span className="text-emerald-400">{"{"}</span>
      <div className="ml-4 border-l border-emerald-500/20 pl-4 py-1">
        <div>
          <span className="text-emerald-300/60">"date"</span>: <span className="text-indigo-300 font-bold">"{date}"</span>,
        </div>
        <div>
          <span className="text-emerald-300/60">"commit"</span>: <a href={entry.html_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline underline-offset-4 decoration-blue-500/30">"{sha}"</a>,
        </div>
        <div className="relative">
          <span className="text-emerald-300/60">"message"</span>: <span className="text-yellow-200 group-hover:text-emerald-300 group-hover:drop-shadow-[0_0_8px_rgba(52,211,153,0.6)] transition-all duration-500">"{msg}"</span>
        </div>
      </div>
      <span className="text-emerald-400">{"}"}</span>{!isLast && <span className="text-emerald-400">,</span>}
    </motion.div>
  );
};

export default AboutView;
