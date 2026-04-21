import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, CheckCircle2 } from 'lucide-react';

interface TasksViewProps {
  currentEventMessageIndex: number;
  eventMessages: string[];
  showEasterNotice: boolean;
  setShowEasterNotice: (val: boolean) => void;
  easterNoticeAgreed: boolean;
  setEasterNoticeAgreed: (val: boolean) => void;
  proceedToEasterAssignment: () => void;
}

const TasksView = ({ 
  currentEventMessageIndex, 
  eventMessages, 
  showEasterNotice,
  setShowEasterNotice,
  easterNoticeAgreed,
  setEasterNoticeAgreed,
  proceedToEasterAssignment
}: TasksViewProps) => {
  return (
    <div className="flex flex-col flex-1 h-full max-w-7xl mx-auto w-full p-6 space-y-8 pb-24 mt-4">
      <header className="mb-0">
        <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Tasks</h1>
        <p className="text-gray-500 font-medium mt-2">Complete assignments and special events.</p>
      </header>

      {/* Event Mode Card */}
      <motion.div 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowEasterNotice(true)}
        className="bg-gradient-to-br from-cyan-400 to-blue-500 rounded-3xl p-8 shadow-xl cursor-pointer relative overflow-hidden group border-4 border-cyan-300"
      >
        <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
          <Star size={120} />
        </div>
        <div className="relative z-10 flex items-center gap-6">
          <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
            <Star className="text-white" size={48} />
          </div>
          <div className="flex-1 overflow-hidden">
            <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2">Event Mode</h2>
            <div className="h-6 relative overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.p 
                  key={currentEventMessageIndex}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  className="text-white/90 font-medium absolute inset-0 truncate text-lg"
                >
                  {eventMessages[currentEventMessageIndex]}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showEasterNotice && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[500] flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl border-4 border-cyan-100"
            >
              <div className="bg-cyan-50 w-20 h-20 rounded-3xl flex items-center justify-center text-cyan-500 mx-auto mb-8">
                <Star size={40} className="animate-pulse" />
              </div>
              <h2 className="text-3xl font-black text-center text-gray-800 uppercase tracking-tight mb-6">Notice</h2>
              <div className="bg-gray-50 rounded-2xl p-6 mb-8 border-2 border-gray-100">
                <p className="text-gray-600 font-bold leading-relaxed text-center">
                  Welcome to the Easter assignment. Please read and answer these questions carefully. 
                  If your grade is below <span className="text-red-500 font-black">60%</span> or if you missed the assignment, 
                  you will have to sit for a written test paper on Tuesday so please answer the questions carefully. 
                  You will be asked to input your name at the end.
                </p>
              </div>
              
              <label className="flex items-center gap-4 mb-8 cursor-pointer group justify-center">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    checked={easterNoticeAgreed}
                    onChange={(e) => setEasterNoticeAgreed(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-8 h-8 rounded-xl border-4 transition-all flex items-center justify-center ${
                    easterNoticeAgreed ? 'bg-cyan-500 border-cyan-500' : 'border-gray-200 group-hover:border-cyan-200'
                  }`}>
                    {easterNoticeAgreed && <CheckCircle2 size={20} className="text-white" />}
                  </div>
                </div>
                <span className="text-gray-700 font-black uppercase tracking-widest text-sm">I agree to the terms</span>
              </label>

              <div className="flex gap-4">
                <button 
                  onClick={() => setShowEasterNotice(false)}
                  className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest border-2 border-gray-200 text-gray-400 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  disabled={!easterNoticeAgreed}
                  onClick={proceedToEasterAssignment}
                  className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${
                    easterNoticeAgreed 
                      ? 'bg-cyan-500 text-white shadow-[0_6px_0_0_#0891b2] active:shadow-none active:translate-y-1' 
                      : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  Start Quiz
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TasksView;
