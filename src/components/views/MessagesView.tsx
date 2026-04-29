import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, Send, User, Users, Bell, Search, 
  Filter, Check, CheckCheck, Loader2, ArrowLeft,
  X, Plus, Sparkles, ShieldCheck
} from 'lucide-react';
import { 
  collection, addDoc, query, where, onSnapshot, 
  orderBy, Timestamp, updateDoc, doc, getDocs
} from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { UserProfile, Message } from '../../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
import { format } from 'date-fns';

interface MessagesViewProps {
  currentUser: UserProfile | null;
  allUsers: UserProfile[];
  isAdmin: boolean;
}

const MessagesView: React.FC<MessagesViewProps> = ({ currentUser, allUsers, isAdmin }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [selectedReceivers, setSelectedReceivers] = useState<string[]>([]);
  const [composeText, setComposeText] = useState('');
  const [isAnnouncing, setIsAnnouncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeConversation, setActiveConversation] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    let q;
    if (isAdmin) {
      q = query(
        collection(db, 'messages'),
        orderBy('timestamp', 'desc')
      );
    } else {
      if (!currentUser?.userId) return;
      q = query(
        collection(db, 'messages'),
        where('participants', 'array-contains', currentUser.userId),
        orderBy('timestamp', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Message));
      
      // Filter for sent messages too (since receiverIds query only gets received)
      // Wait, standard users can't list ALL and filter JS. 
      // If they want to see sent messages, they need another query or index.
      // But usually they just care about conversations.
      // Let's stick to the received ones for now, OR do two queries.
      // Actually, if we allow them to list THEIR OWN sent ones too:
      // We can't do OR in one query for different fields (senderId vs receiverIds).
      // So we have to merge in JS after multiple listeners OR use a different structure.
      
      setMessages(msgs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'messages');
    });

    return () => unsubscribe();
  }, [currentUser, isAdmin]);

  const handleSendMessage = async () => {
    // If announcing, and no receivers selected, we target everyone
    let finalReceivers = [...selectedReceivers];
    if (isAnnouncing && finalReceivers.length === 0) {
      finalReceivers = allUsers
        .filter(u => !u.isAdmin)
        .map(u => u.userId);
    }

    if (!currentUser || composeText.trim() === '' || finalReceivers.length === 0) return;

    try {
      const isRead: Record<string, boolean> = {};
      finalReceivers.forEach(id => {
        isRead[id] = false;
      });
      isRead[currentUser.userId] = true;

      const newMessage: Omit<Message, 'id'> = {
        senderId: currentUser.userId,
        senderName: currentUser.displayName,
        receiverIds: finalReceivers,
        participants: [currentUser.userId, ...finalReceivers],
        text: composeText,
        timestamp: new Timestamp(Date.now() / 1000, 0).toDate().toISOString(),
        isRead,
        type: isAnnouncing ? 'announcement' : 'individual'
      };

      await addDoc(collection(db, 'messages'), newMessage);
      setComposeText('');
      setSelectedReceivers([]);
      setIsComposeOpen(false);
      setIsAnnouncing(false);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'messages');
    }
  };

  const markAsRead = async (messageId: string) => {
    if (!currentUser) return;
    const msg = messages.find(m => m.id === messageId);
    if (msg && !msg.isRead[currentUser.userId]) {
      const ref = doc(db, 'messages', messageId);
      try {
        await updateDoc(ref, {
          [`isRead.${currentUser.userId}`]: true
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `messages/${messageId}`);
      }
    }
  };

  const toggleReceiver = (userId: string) => {
    if (selectedReceivers.includes(userId)) {
      setSelectedReceivers(prev => prev.filter(id => id !== userId));
    } else {
      setSelectedReceivers(prev => [...prev, userId]);
    }
  };

  const selectAll = (type: 'student' | 'parent') => {
    const ids = allUsers
      .filter(u => type === 'student' ? !u.isParent && !u.isAdmin : u.isParent)
      .map(u => u.userId);
    
    setSelectedReceivers(prev => {
      const newSet = new Set([...prev, ...ids]);
      return Array.from(newSet);
    });
  };

  const deselectAll = () => setSelectedReceivers([]);

  const filteredUsers = allUsers.filter(u => 
    u.userId !== currentUser?.userId &&
    (u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
     u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getConversations = () => {
    if (!currentUser) return [];

    const convos: Record<string, Message[]> = {};

    messages.forEach(m => {
      if (m.type === 'announcement') {
        if (!convos['announcement']) convos['announcement'] = [];
        convos['announcement'].push(m);
      } else if (isAdmin) {
        // Admin sees convos by other user ID
        const otherId = m.senderId === currentUser.userId ? m.receiverIds[0] : m.senderId;
        if (!convos[otherId]) convos[otherId] = [];
        convos[otherId].push(m);
      } else {
        // Student/Parent sees only one convo with Admin
        const adminId = 'admin'; // Simplified
        if (!convos[adminId]) convos[adminId] = [];
        convos[adminId].push(m);
      }
    });

    return Object.entries(convos).map(([id, msgs]) => ({
      id,
      lastMessage: msgs[0],
      unreadCount: msgs.filter(m => !m.isRead[currentUser.userId]).length,
      user: allUsers.find(u => u.userId === id) || (id === 'announcement' ? { displayName: 'Announcements' } : { displayName: 'Administrator' })
    })).sort((a, b) => 
      new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
    );
  };

  const conversations = getConversations();
  const currentConvoMessages = messages.filter(m => {
    if (!activeConversation || !currentUser) return false;
    if (activeConversation === 'announcement') return m.type === 'announcement';
    if (isAdmin) {
      return (m.senderId === currentUser.userId && m.receiverIds.includes(activeConversation)) || 
             (m.senderId === activeConversation && m.receiverIds.includes(currentUser.userId));
    } else {
      return (m.senderId === currentUser.userId) || (m.receiverIds.includes(currentUser.userId) && m.type !== 'announcement');
    }
  }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-8">
      {/* Header Overhaul */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/10 border border-white/20 rounded-[1.5rem] flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform duration-500">
              <MessageSquare size={32} className="text-indigo-400" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-800 uppercase tracking-tighter leading-none mb-2">
                Messages
              </h1>
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] bg-white/20 px-3 py-1 rounded-full border border-white/10">
                  Mission Control Interface
                </span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">System Online</span>
              </div>
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={() => setIsComposeOpen(true)}
              className="bg-indigo-600 border border-indigo-400/30 text-white rounded-2xl px-8 py-4 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-white hover:text-indigo-600 transition-all shadow-xl shadow-indigo-500/20 active:scale-95 group/btn"
            >
              <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                <Plus size={16} strokeWidth={3} />
              </div>
              New message
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-[600px]">
        {/* Conversations List */}
        <div className={`lg:col-span-4 flex flex-col gap-6 ${activeConversation ? 'hidden lg:flex' : 'flex'}`}>
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] p-5 flex items-center gap-4 group focus-within:bg-white/20 transition-all">
            <Search size={18} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text" 
              placeholder="SEARCH CHANNELS..."
              className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest placeholder:text-slate-400 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
            {conversations.map(convo => (
              <button
                key={convo.id}
                onClick={async () => {
                  setActiveConversation(convo.id);
                  if (convo.lastMessage.id) await markAsRead(convo.lastMessage.id);
                }}
                className={`w-full group text-left p-6 rounded-[2.5rem] border transition-all duration-300 relative overflow-hidden
                  ${activeConversation === convo.id 
                    ? 'bg-white border-white shadow-2xl scale-[1.02]' 
                    : 'bg-white/10 border-white/10 hover:bg-white/20 backdrop-blur-md hover:translate-x-2'
                  }
                `}
              >
                <div className="flex items-center gap-5 relative z-10">
                  <div className={`w-14 h-14 rounded-[1.2rem] flex items-center justify-center transition-transform duration-500 group-hover:rotate-6
                    ${convo.id === 'announcement' ? 'bg-amber-500/10 text-amber-600' : 'bg-indigo-500/10 text-indigo-600'}
                  `}>
                    {convo.id === 'announcement' ? <Bell size={28} /> : 
                     (convo.user as any).isParent ? <ShieldCheck size={28} /> : <User size={28} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className={`text-[12px] font-black uppercase tracking-tight truncate ${activeConversation === convo.id ? 'text-slate-900' : 'text-slate-700'}`}>
                        {(convo.user as any).displayName}
                      </h4>
                      <span className="text-[9px] font-black text-slate-400 whitespace-nowrap bg-slate-100 rounded-lg px-2 py-0.5">
                        {format(new Date(convo.lastMessage.timestamp), 'HH:mm')}
                      </span>
                    </div>
                    <p className={`text-[10px] font-bold truncate ${activeConversation === convo.id ? 'text-slate-500' : 'text-slate-400'}`}>
                      {convo.lastMessage.text}
                    </p>
                  </div>
                </div>
                {convo.unreadCount > 0 && (
                  <div className="absolute top-6 right-6 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-lg animate-bounce border-2 border-white">
                    {convo.unreadCount}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Message Panel */}
        <div className={`lg:col-span-8 flex flex-col bg-white/20 backdrop-blur-3xl border border-white/20 rounded-[3rem] shadow-2xl relative overflow-hidden ${activeConversation ? 'flex' : 'hidden lg:flex items-center justify-center'}`}>
          {activeConversation ? (
            <>
              {/* Panel Header */}
              <div className="p-8 border-b border-white/10 bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <button 
                    onClick={() => setActiveConversation(null)}
                    className="lg:hidden p-4 bg-white/10 rounded-2xl text-slate-600 hover:bg-white active:scale-90 transition-all"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    {activeConversation === 'announcement' ? <Bell size={24} /> : 
                     (allUsers.find(u => u.userId === activeConversation)?.isParent ? <ShieldCheck size={24} /> : <User size={24} />)}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                      {conversations.find(c => c.id === activeConversation)?.user?.displayName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Secured Channel</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
                {currentConvoMessages.map((m, idx) => {
                  const isOwn = m.senderId === currentUser?.userId;
                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, x: isOwn ? 20 : -20, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ type: 'spring', damping: 20, stiffness: 100, delay: idx * 0.05 }}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[75%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                        <div className={`p-6 rounded-[2.5rem] shadow-xl group/msg relative ${
                          isOwn 
                            ? 'bg-slate-900 text-white rounded-tr-none' 
                            : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                        }`}>
                          <p className="text-[13px] font-bold leading-relaxed">{m.text}</p>
                          <div className={`absolute top-0 ${isOwn ? 'right-0 translate-x-1/2 -translate-y-1/2' : 'left-0 -translate-x-1/2 -translate-y-1/2'} opacity-0 group-hover/msg:opacity-100 transition-opacity`}>
                            <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white shadow-lg">
                              <Sparkles size={14} />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-3 px-4">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            {format(new Date(m.timestamp), 'HH:mm')}
                          </span>
                          {isOwn && (
                            <div className="flex items-center gap-1">
                              {Object.values(m.isRead).every(Boolean) ? 
                                <CheckCheck size={12} className="text-emerald-500" /> : 
                                <Check size={12} className="text-slate-400" />}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Input Area */}
              {(activeConversation !== 'announcement' || isAdmin) && (
                <div className="p-8 bg-white/10 border-t border-white/10 backdrop-blur-md">
                  <div className="bg-white border border-slate-100 rounded-[2rem] p-3 flex items-center gap-4 shadow-2xl group focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
                    <input 
                      type="text" 
                      placeholder="Send Message..."
                      className="bg-transparent border-none outline-none text-[11px] font-black uppercase tracking-widest placeholder:text-slate-300 flex-1 px-5 py-3"
                      value={composeText}
                      onChange={(e) => setComposeText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <button 
                      onClick={() => {
                        if (activeConversation !== 'announcement' || isAdmin) {
                          setSelectedReceivers([activeConversation!]);
                          handleSendMessage();
                        }
                      }}
                      disabled={!composeText.trim()}
                      className="w-14 h-14 bg-slate-900 border border-black text-white rounded-[1.2rem] flex items-center justify-center hover:bg-indigo-600 hover:border-indigo-400 transition-all disabled:opacity-30 disabled:grayscale group/send"
                    >
                      <Send size={22} strokeWidth={3} className="group-hover/send:translate-x-1 group-hover/send:-translate-y-1 transition-transform" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center p-16"
            >
              <div className="w-32 h-32 bg-indigo-600/10 text-indigo-600 rounded-[3rem] flex items-center justify-center mx-auto mb-8 relative border border-indigo-500/20 shadow-inner group">
                <div className="absolute inset-0 bg-indigo-500/20 rounded-[3rem] blur-2xl group-hover:scale-150 transition-transform duration-700" />
                <MessageSquare size={56} className="relative z-10" />
              </div>
              <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter mb-4 italic">Message Inbox</h3>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] max-w-sm mx-auto leading-loose">
                Select a contact to start a conversation.
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Overhauled Compose Modal (Split-Panel) */}
      <AnimatePresence>
        {isComposeOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-3xl"
              onClick={() => setIsComposeOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="relative bg-white/95 rounded-[3.5rem] w-full max-w-5xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white/20 overflow-hidden flex flex-col md:flex-row h-[85vh]"
            >
              {/* Left Panel: Recipients Selection */}
              <div className="w-full md:w-1/2 border-r border-slate-100 flex flex-col p-8 bg-slate-50/30">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Target List</h3>
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">Recipient Selection</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => selectAll('student')}
                      title="Select All Students"
                      className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                    >
                      <User size={18} />
                    </button>
                    <button 
                      onClick={() => selectAll('parent')}
                      title="Select All Parents"
                      className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                    >
                      <ShieldCheck size={18} />
                    </button>
                    <button 
                      onClick={deselectAll}
                      title="Reset Selection"
                      className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-slate-100 rounded-3xl p-4 flex items-center gap-3 mb-6 shadow-sm focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all">
                  <Search size={18} className="text-slate-300" />
                  <input 
                    type="text" 
                    placeholder="SCAN TARGETS..."
                    className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-[0.2em] w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
                  <div className="flex flex-wrap gap-2 mb-6">
                    {selectedReceivers.map(id => {
                      const user = allUsers.find(u => u.userId === id);
                      return (
                        <motion.div 
                          layout
                          key={id} 
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg ${
                            user?.isParent ? 'bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-indigo-600 text-white shadow-indigo-500/20'
                          }`}
                        >
                          {user?.displayName}
                          <button onClick={() => toggleReceiver(id)} className="hover:scale-125 transition-transform"><X size={12} /></button>
                        </motion.div>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Students Column */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-xl mb-2">
                        <User size={14} className="text-indigo-600" />
                        <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Students</span>
                      </div>
                      {filteredUsers.filter(u => !u.isParent).map(user => (
                        <button
                          key={user.userId}
                          onClick={() => toggleReceiver(user.userId)}
                          className={`w-full p-4 rounded-[2rem] border transition-all duration-300 flex items-center justify-between group relative overflow-hidden ${
                            selectedReceivers.includes(user.userId)
                              ? 'bg-white border-indigo-500 ring-2 ring-indigo-500/10'
                              : 'bg-white/50 border-slate-100 hover:bg-white hover:border-slate-200 shadow-sm'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-active:scale-95 bg-indigo-50 text-indigo-600`}>
                              <div className="text-[12px] font-black">{user.displayName.charAt(0)}</div>
                            </div>
                            <div className="text-left">
                              <h5 className="text-[10px] font-black uppercase tracking-tight text-slate-800 truncate max-w-[80px]">{user.displayName}</h5>
                              <p className="text-[8px] font-bold text-slate-400 lowercase tracking-tight mt-0.5 max-w-[80px] truncate">
                                {user.email.toLowerCase()}
                              </p>
                              <div className="flex items-center gap-1 mt-1 text-indigo-400">
                                <User size={8} />
                                <span className="text-[6px] font-black uppercase tracking-widest">Student</span>
                              </div>
                            </div>
                          </div>
                          {selectedReceivers.includes(user.userId) && (
                            <div className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center animate-in zoom-in">
                              <Check size={12} strokeWidth={4} />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Parents Column */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl mb-2">
                        <ShieldCheck size={14} className="text-emerald-600" />
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Parents</span>
                      </div>
                      {filteredUsers.filter(u => u.isParent).map(user => (
                        <button
                          key={user.userId}
                          onClick={() => toggleReceiver(user.userId)}
                          className={`w-full p-4 rounded-[2rem] border transition-all duration-300 flex items-center justify-between group relative overflow-hidden ${
                            selectedReceivers.includes(user.userId)
                              ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/10'
                              : 'bg-white/50 border-slate-100 hover:bg-white hover:border-slate-200 shadow-sm'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-active:scale-95 bg-emerald-50 text-emerald-600`}>
                              <div className="text-[12px] font-black">{user.displayName.charAt(0)}</div>
                            </div>
                            <div className="text-left">
                              <h5 className="text-[10px] font-black uppercase tracking-tight text-slate-800 truncate max-w-[80px]">{user.displayName}</h5>
                              <p className="text-[8px] font-bold text-slate-400 lowercase tracking-tight mt-0.5 max-w-[80px] truncate">
                                {user.email.toLowerCase()}
                              </p>
                              <div className="flex items-center gap-1 mt-1 text-emerald-400">
                                <ShieldCheck size={8} />
                                <span className="text-[6px] font-black uppercase tracking-widest">Parent</span>
                              </div>
                            </div>
                          </div>
                          {selectedReceivers.includes(user.userId) && (
                            <div className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center animate-in zoom-in">
                              <Check size={12} strokeWidth={4} />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel: Content & Dispatch */}
              <div className="w-full md:w-1/2 flex flex-col p-12 bg-white relative">
                <button 
                  onClick={() => setIsComposeOpen(false)}
                  className="absolute top-8 right-8 p-4 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-2xl transition-all active:scale-90"
                >
                  <X size={20} />
                </button>

                <div className="mb-10">
                  <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Compose Message</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Payload Compilation</p>
                </div>

                <div className="flex-1 flex flex-col gap-8">
                  <div className="flex items-center justify-between bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-all ${
                        isAnnouncing ? 'bg-amber-500 text-white animate-pulse' : 'bg-slate-200 text-slate-400'
                      }`}>
                        <Bell size={24} />
                      </div>
                      <div>
                        <h4 className="text-[11px] font-black uppercase tracking-tight">Announcement Stream</h4>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Global broadcast mode</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsAnnouncing(!isAnnouncing)}
                      className={`w-14 h-8 rounded-full transition-all relative ${isAnnouncing ? 'bg-amber-500' : 'bg-slate-200'}`}
                    >
                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm transition-all ${isAnnouncing ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>

                  <div className="flex-1 group">
                    <label className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mb-4 block ml-4">Communication Packet</label>
                    <textarea
                      placeholder="Send Message..."
                      className="w-full h-full bg-slate-50/50 border-2 border-slate-100 rounded-[2.5rem] p-8 text-[13px] font-bold leading-relaxed focus:bg-white focus:border-indigo-500 outline-none transition-all resize-none shadow-inner"
                      value={composeText}
                      onChange={(e) => setComposeText(e.target.value)}
                    />
                  </div>

                  <button
                    onClick={handleSendMessage}
                    disabled={(selectedReceivers.length === 0 && !isAnnouncing) || !composeText.trim()}
                    className="w-full relative group/dispatch overflow-hidden bg-slate-900 border-2 border-black text-white rounded-[2rem] py-6 font-black uppercase tracking-[0.3em] text-[12px] shadow-2xl transition-all hover:bg-indigo-600 hover:border-indigo-400 active:scale-95 disabled:opacity-20 disabled:grayscale"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/dispatch:translate-y-0 transition-transform duration-500" />
                    <div className="relative z-10 flex items-center justify-center gap-4">
                      <Send size={24} strokeWidth={3} />
                      Send message
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MessagesView;
