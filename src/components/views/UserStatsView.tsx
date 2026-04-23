import * as React from 'react';
import { motion } from 'motion/react';
import { BookOpen, CheckCircle2, XCircle, GraduationCap, Languages } from 'lucide-react';
import { Unit, SessionStats } from '../../types';

interface UserStatsViewProps {
  units: Unit[];
  sessionStats: SessionStats;
}

const UserStatsView: React.FC<UserStatsViewProps> = ({ units, sessionStats }) => {
  return (
    <div className="min-h-screen bg-gray-50 pb-24 px-4 md:px-8">
      <header className="bg-white border-b-2 border-gray-200 p-6 sticky top-0 z-10 -mx-4 md:-mx-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Dashboard</h1>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-1">Session Statistics</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {units.map((unit) => {
            const stats = sessionStats[unit.id] || { attemptedQuestions: [], masteredVocab: [] };
            const attemptedCount = stats.attemptedQuestions?.length || 0;
            const totalQuestions = unit.questions?.length || 0;
            const notAttemptedCount = totalQuestions - attemptedCount;
            const masteredCount = stats.masteredVocab?.length || 0;
            const totalVocab = unit.vocab?.length || 0;
            const totalNotes = unit.concepts?.length || 0;

            return (
              <motion.div
                key={unit.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border-2 border-gray-200 rounded-3xl overflow-hidden shadow-[0_4px_0_0_rgba(0,0,0,0.05)]"
              >
                <div className={`${unit.color} p-4 text-white flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                      <BookOpen size={20} />
                    </div>
                    <h3 className="font-black uppercase tracking-wide">{unit.title}</h3>
                  </div>
                  <span className="text-xs font-black bg-black/10 px-3 py-1 rounded-full uppercase tracking-widest">Unit {unit.id}</span>
                </div>

                <div className="p-6 grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 border-2 border-blue-100 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-blue-500 mb-1">
                      <CheckCircle2 size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Quiz Attempted</span>
                    </div>
                    <p className="text-2xl font-black text-blue-700">{attemptedCount}</p>
                    <p className="text-[10px] text-blue-400 font-bold uppercase">Questions</p>
                  </div>

                  <div className="bg-orange-50 border-2 border-orange-100 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-orange-500 mb-1">
                      <XCircle size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Not Attempted</span>
                    </div>
                    <p className="text-2xl font-black text-orange-700">{notAttemptedCount}</p>
                    <p className="text-[10px] text-orange-400 font-bold uppercase">Questions</p>
                  </div>

                  <div className="bg-emerald-50 border-2 border-emerald-100 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-emerald-500 mb-1">
                      <GraduationCap size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Vocab Mastered</span>
                    </div>
                    <p className="text-2xl font-black text-emerald-700">{masteredCount} / {totalVocab}</p>
                    <p className="text-[10px] text-emerald-400 font-bold uppercase">Items</p>
                  </div>

                  <div className="bg-purple-50 border-2 border-purple-100 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-purple-500 mb-1">
                      <Languages size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Total Notes</span>
                    </div>
                    <p className="text-2xl font-black text-purple-700">{totalNotes}</p>
                    <p className="text-[10px] text-purple-400 font-bold uppercase">Concepts</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default UserStatsView;
