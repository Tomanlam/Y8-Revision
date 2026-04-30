import * as React from 'react';
import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { UserProfile } from '../../types';
import { 
  Search, User, X, ShieldAlert, GraduationCap, 
  Baby, ArrowRightLeft, Target, Mail, Clock
} from 'lucide-react';

interface DiagnosticsViewProps {
  allUsers: UserProfile[];
  onSelectTarget: (user: UserProfile) => void;
  onClose: () => void;
}

const DiagnosticsView: React.FC<DiagnosticsViewProps> = ({ allUsers, onSelectTarget, onClose }) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<'all' | 'students' | 'parents'>('all');

  const filteredUsers = useMemo(() => {
    return allUsers.filter(u => {
      const matchesSearch = u.displayName.toLowerCase().includes(search.toLowerCase()) || 
                           u.email.toLowerCase().includes(search.toLowerCase());
      
      let matchesFilter = true;
      if (filter === 'students') matchesFilter = !u.isAdmin && !u.isParent;
      if (filter === 'parents') matchesFilter = !!u.isParent;
      
      return matchesSearch && matchesFilter && !u.isAdmin; // Don't shadow other admins
    });
  }, [allUsers, search, filter]);

  return (
    <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
      {/* Header */}
      <header className="p-8 pb-4 flex items-center justify-between">
        <div>
           <div className="flex items-center gap-3 mb-1">
             <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                <ShieldAlert size={20} />
             </div>
             <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">Diagnostics Center</h1>
           </div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">ADMINISTRATIVE GHOSTING & SHADOWING SYSTEM</p>
        </div>
        <button 
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all border border-slate-200"
        >
          <X size={20} />
        </button>
      </header>

      {/* Main Grid */}
      <div className="flex-1 overflow-hidden p-8 flex flex-col gap-6">
        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4">
           <div className="relative flex-1">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input 
               type="text"
               placeholder="Search by name or email..."
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all font-bold text-slate-800"
             />
           </div>
           <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
             {(['all', 'students', 'parents'] as const).map(f => (
               <button
                 key={f}
                 onClick={() => setFilter(f)}
                 className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                   filter === f 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-600'
                 }`}
               >
                 {f}
               </button>
             ))}
           </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {filteredUsers.map((user) => (
               <motion.button
                 key={user.userId}
                 whileHover={{ y: -4, scale: 1.02 }}
                 whileTap={{ scale: 0.98 }}
                 onClick={() => onSelectTarget(user)}
                 className="group bg-white p-6 rounded-[2.5rem] border border-slate-200 transition-all hover:shadow-2xl hover:shadow-slate-200/50 text-left relative overflow-hidden"
               >
                 {/* Role Badge */}
                 <div className={`absolute top-6 right-6 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                   user.isParent ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                 }`}>
                   {user.isParent ? 'Parent' : 'Student'}
                 </div>

                 <div className="flex items-start gap-5">
                    <div className="relative">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName} className="w-16 h-16 rounded-[1.5rem] border-2 border-white shadow-md object-cover" />
                      ) : (
                        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-xl font-black ${
                          user.isParent ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'
                        }`}>
                          {user.displayName.charAt(0)}
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                        {user.isParent ? <Baby size={12} className="text-indigo-600" /> : <GraduationCap size={12} className="text-emerald-600" />}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                       <h3 className="text-lg font-black text-slate-900 leading-tight mb-1 truncate group-hover:text-amber-600 transition-colors">
                         {user.displayName}
                       </h3>
                       <div className="flex items-center gap-2 text-slate-400 mb-4 truncate">
                          <Mail size={12} />
                          <span className="text-[10px] font-bold truncate">{user.email}</span>
                       </div>

                       <div className="flex items-center gap-2 pt-4 border-t border-slate-50">
                          <Clock size={10} className="text-slate-300" />
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            Last active: {new Date(user.lastSeen).toLocaleDateString()}
                          </span>
                       </div>
                    </div>
                 </div>

                 <div className="mt-6 w-full flex items-center justify-center gap-3 py-4 bg-slate-50 group-hover:bg-amber-50 rounded-2xl transition-all border border-slate-100 group-hover:border-amber-200">
                    <ArrowRightLeft size={16} className="text-slate-400 group-hover:text-amber-600 group-hover:rotate-180 transition-all duration-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover:text-amber-800">Start Shadowing</span>
                 </div>
               </motion.button>
             ))}
           </div>
           
           {filteredUsers.length === 0 && (
             <div className="h-64 flex flex-col items-center justify-center text-slate-300">
                <Search size={48} strokeWidth={1} className="mb-4 opacity-20" />
                <p className="font-black uppercase tracking-[0.2em] text-[10px]">No matches found in database</p>
             </div>
           )}
        </div>
      </div>
      
      {/* Bottom Footer Info */}
      <footer className="px-8 py-6 bg-white border-t border-slate-100 flex items-center gap-4">
         <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
         <p className="text-[10px] font-bold text-slate-400">
           Diagnostics mode allows read-only and interaction testing. No persistent changes will be saved to the database while shadowing students.
         </p>
      </footer>
    </div>
  );
};

export default DiagnosticsView;
