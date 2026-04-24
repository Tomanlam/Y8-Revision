import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Sparkles, Star, Languages, Download, FileText, Send, Layout, Edit, RefreshCw, ChevronRight, BookOpen, Database, Trash2, Zap, Copy, Palette, EyeOff, Eye, Plus, Clock
} from 'lucide-react';
import { Unit } from '../../types';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { db, auth } from '../../firebase';
import { doc, getDoc, setDoc, collection, query, where, onSnapshot, addDoc, deleteDoc } from 'firebase/firestore';

// PDF worker setup
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface InteractiveNote {
  id: string;
  page: number;
  title: string;
  content: string;
  translation?: string;
}

interface StickyNote {
  id: string;
  userId: string;
  unitId: number;
  page: number;
  content: string;
  createdAt: number;
}

interface RevisionNotesViewProps {
  unit: Unit | undefined;
  onBack: () => void;
  charType: 'simplified' | 'traditional';
  setCharType: (type: 'simplified' | 'traditional') => void;
  isAdmin?: boolean;
}

const RevisionNotesView: React.FC<RevisionNotesViewProps> = ({ unit, onBack, charType, setCharType, isAdmin }) => {
  const [assistMode, setAssistMode] = useState(false);
  const [viewMode, setViewMode] = useState<'interactive' | 'summary'>('interactive');
  const [interactiveNotes, setInteractiveNotes] = useState<InteractiveNote[]>([]);
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([]);
  const [newStickyContent, setNewStickyContent] = useState("");
  const [stickyColor, setStickyColor] = useState('orange');
  const [showStickyInput, setShowStickyInput] = useState(true);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [activePage, setActivePage] = useState(1);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [viewerWidth, setViewerWidth] = useState(window.innerWidth * 0.45);
  
  const currentUser = auth.currentUser;

  // Admin states
  const [showEditor, setShowEditor] = useState(false);
  const [editingNotes, setEditingNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const leftPaneRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!unit) return;
    
    const loadInteractiveNotes = async () => {
      setIsLoadingNotes(true);
      try {
        const docRef = doc(db, 'interactiveNotes', `unit_${unit.id}`);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setInteractiveNotes(snap.data().notes || []);
        } else {
          setInteractiveNotes([]);
          setViewMode('summary'); 
        }
      } catch (e) {
        console.error("Error loading interactive notes:", e);
      } finally {
        setIsLoadingNotes(false);
      }
    };

    loadInteractiveNotes();
  }, [unit]);

  // Sync personal sticky notes
  useEffect(() => {
    if (!unit || !currentUser) return;
    
    const q = query(
      collection(db, 'stickyNotes'),
      where('unitId', '==', unit.id),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const notes = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as StickyNote));
      setStickyNotes(notes.sort((a, b) => a.createdAt - b.createdAt));
    });

    return () => unsubscribe();
  }, [unit, currentUser]);

  const cleanJson = (raw: string) => {
    try {
      let text = raw.trim();
      
      // If it starts with { and ends with }, wrap it in an array to be safe
      if (text.startsWith('{') && text.endsWith('}')) {
        text = `[${text}]`;
      }

      // Robust extraction: find the first '[' and last ']' to isolate JSON array
      const start = text.indexOf('[');
      const end = text.lastIndexOf(']');
      
      let data;
      if (start !== -1 && end !== -1 && end > start) {
        const jsonContent = text.substring(start, end + 1);
        data = JSON.parse(jsonContent);
      } else {
        // Try parsing the whole thing as an object or array
        data = JSON.parse(text);
      }

      const finalData = Array.isArray(data) ? data : [data];
      
      return finalData.map((item: any) => {
        const cleaned: any = {
          id: item.id || Math.random().toString(36).substr(2, 9),
          page: Number(item.page) || 1,
          title: String(item.title || "Untitled"),
          content: String(item.content || "")
        };
        if (item.translation) cleaned.translation = String(item.translation);
        return cleaned;
      });
    } catch (e) {
      console.error("JSON Parse Error:", e);
      return null;
    }
  };

  const handleSaveNotes = async () => {
    if (!unit) return;
    setIsSaving(true);
    try {
      const cleaned = cleanJson(editingNotes);
      if (!cleaned) throw new Error("Invalid format");

      await setDoc(doc(db, 'interactiveNotes', `unit_${unit.id}`), { notes: cleaned });
      setInteractiveNotes(cleaned);
      setShowEditor(false);
      setViewMode('interactive');
    } catch (e) {
      console.error(e);
      alert("Invalid JSON format or corrupted data. Please check your input.");
    } finally {
      setIsSaving(false);
    }
  };

  const [activeStickyInputPage, setActiveStickyInputPage] = useState<number | null>(null);

  const handleAddSticky = async (pageNum: number) => {
    if (!unit || !currentUser || !newStickyContent.trim()) return;
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'stickyNotes'), {
        userId: currentUser.uid,
        unitId: unit.id,
        page: pageNum,
        content: newStickyContent.trim(),
        createdAt: Date.now(),
        color: stickyColor
      });
      setNewStickyContent("");
      setActiveStickyInputPage(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const copyAIPrompt = () => {
    const prompt = `Please analyze the provided PDF for Unit ${unit?.id}: ${unit?.title}. 
Generate a JSON array of interactive notes. 
Each object in the array MUST follow this schema:
{
  "id": "unique_string_id",
  "page": number, 
  "title": "Short descriptive title of the concept",
  "content": "A detailed explanation of the concept found on that page",
  "translation": "Traditional Chinese translation of the content (optional)"
}
Return ONLY the JSON array.`;
    navigator.clipboard.writeText(prompt);
    alert("AI Prompt copied to clipboard!");
  };

  const colorOptions = [
    { name: 'orange', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600', hover: 'hover:bg-orange-100' },
    { name: 'emerald', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', hover: 'hover:bg-emerald-100' },
    { name: 'blue', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', hover: 'hover:bg-blue-100' },
    { name: 'purple', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', hover: 'hover:bg-purple-100' },
    { name: 'white', bg: 'bg-white', border: 'border-slate-200', text: 'text-slate-600', hover: 'hover:bg-slate-50' }
  ];

  const handleDeleteSticky = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'stickyNotes', id));
    } catch (e) {
      console.error(e);
    }
  };

  // Handle resize debounced
  useEffect(() => {
    const handleResize = () => setViewerWidth(window.innerWidth * 0.45);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const pdfOptions = useMemo(() => ({
    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
  }), []);

  // Scroll sync logic
  useEffect(() => {
    if (viewMode !== 'interactive' || !numPages || !leftPaneRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            const pageNum = parseInt(target.getAttribute('data-page-index') || '1');
            setActivePage(pageNum);
          }
        });
      },
      { threshold: 0.3 }
    );

    Object.values(pageRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref as Element);
    });

    return () => observer.disconnect();
  }, [numPages, viewMode]);

  if (!unit) return null;

  const notesByPage = interactiveNotes.reduce((acc, note) => {
    if (!acc[note.page]) acc[note.page] = [];
    acc[note.page].push(note);
    return acc;
  }, {} as Record<number, InteractiveNote[]>);

  const stickyByPage = stickyNotes.reduce((acc, note) => {
    if (!acc[note.page]) acc[note.page] = [];
    acc[note.page].push(note);
    return acc;
  }, {} as Record<number, StickyNote[]>);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans selection:bg-emerald-100">
      {/* Header */}
      <header className="bg-white border-b-2 border-slate-100 p-4 shrink-0 shadow-sm sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-5">
            <button 
              onClick={onBack} 
              className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-all active:scale-95"
            >
              <X size={20} className="stroke-[3]" />
            </button>
            <div className="h-8 w-px bg-slate-100" />
            <div className="flex flex-col">
              <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none">Unit {unit.id}: {unit.title}</h1>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] px-2 py-0.5 bg-emerald-50 rounded-md border border-emerald-100">Revision Hub</span>
                {numPages && (
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">• Page {activePage} / {numPages}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-50 p-1.5 rounded-2xl border-2 border-slate-100 flex items-center gap-1.5">
              <button 
                onClick={() => setViewMode('interactive')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'interactive' ? 'bg-white text-emerald-600 shadow-sm border border-emerald-100 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Zap size={14} className={viewMode === 'interactive' ? 'fill-emerald-500' : ''} /> Interactive
              </button>
              <button 
                onClick={() => setViewMode('summary')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'summary' ? 'bg-white text-blue-600 shadow-sm border border-blue-100 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Layout size={14} className={viewMode === 'summary' ? 'fill-blue-500' : ''} /> Summary
              </button>
            </div>

            <div className="h-8 w-px bg-slate-100 mx-2" />

            {isAdmin && (
              <button 
                onClick={() => {
                  setEditingNotes(JSON.stringify(interactiveNotes, null, 2));
                  setShowEditor(true);
                }}
                className="w-10 h-10 flex items-center justify-center bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-xl border-2 border-amber-200 shadow-sm transition-all active:translate-y-0.5"
                title="Edit Interactive Notes"
              >
                <Database size={18} className="stroke-[2.5]" />
              </button>
            )}

            <button 
              onClick={() => setAssistMode(!assistMode)}
              className={`w-10 h-10 flex items-center justify-center rounded-xl border-2 transition-all active:translate-y-0.5 ${assistMode ? 'bg-blue-500 text-white border-blue-600 shadow-[0_3px_0_0_#2563eb]' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300 shadow-[0_3px_0_0_#f1f5f9]'}`}
              title="Assist Mode"
            >
              <Languages size={18} className="stroke-[2.5]" />
            </button>
            
            {assistMode && (
              <button 
                onClick={() => setCharType(charType === 'traditional' ? 'simplified' : 'traditional')}
                className="px-3 h-10 rounded-xl text-xs font-black border-2 border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-all shadow-[0_3px_0_0_#f1f5f9] active:translate-y-0.5"
              >
                {charType === 'traditional' ? '繁' : '簡'}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 flex overflow-hidden">
        <div 
          ref={leftPaneRef}
          className="flex-1 bg-slate-200/40 overflow-y-auto custom-scrollbar"
        >
          {viewMode === 'summary' ? (
            <div className="max-w-4xl mx-auto p-10 space-y-12 bg-white min-h-screen border-x border-slate-100 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Revision Summary</h2>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Core Concepts & Key Takeaways</p>
                </div>
              </div>
              
              <div className="space-y-6">
                {unit.concepts.map((concept, idx) => {
                  const translation = charType === 'traditional' 
                    ? unit.conceptsTraditional?.[idx] 
                    : unit.conceptsSimplified?.[idx];
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={idx}
                      className={`p-8 bg-white rounded-[2.5rem] border-2 transition-all group ${assistMode ? 'border-blue-100 shadow-blue-50/50' : 'border-slate-100'} hover:border-blue-200 shadow-sm`}
                    >
                      <div className="flex items-start gap-6">
                        <div className={`w-10 h-10 flex-shrink-0 rounded-2xl flex items-center justify-center font-black text-sm transition-colors ${assistMode ? 'bg-blue-500 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-50'}`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 space-y-4">
                          <p className="text-[15px] font-bold text-slate-700 leading-relaxed tracking-tight">
                            {concept as unknown as string}
                          </p>
                          <AnimatePresence>
                            {assistMode && translation && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="pt-5 border-t border-blue-50">
                                  <p className="text-[13px] font-black text-blue-600 leading-relaxed italic opacity-80">
                                    {translation}
                                  </p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              <Document
                file={unit.pdfUrl || ''}
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                options={pdfOptions}
                loading={
                  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                    <RefreshCw className="animate-spin text-emerald-500" size={40} />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 animate-pulse">Synchronizing Data Source...</p>
                  </div>
                }
              >
                {Array.from(new Array(numPages || 0), (_, index) => {
                  const pageNum = index + 1;
                  const hasOfficial = notesByPage[pageNum] && notesByPage[pageNum].length > 0;
                  const hasPersonal = stickyByPage[pageNum] && stickyByPage[pageNum].length > 0;
                  
                  return (
                    <div 
                      key={`row_${pageNum}`} 
                      data-page-index={pageNum}
                      ref={el => pageRefs.current[pageNum] = el}
                      className="flex border-b-2 border-slate-100 bg-white min-h-[70vh] scroll-mt-20"
                    >
                      {/* Left: PDF Page */}
                      <div className="w-1/2 bg-slate-50 p-8 flex justify-center items-start border-r border-slate-100">
                        <div 
                          className="shadow-2xl rounded-lg overflow-hidden bg-white ring-1 ring-slate-200/50 sticky top-24"
                        >
                          <Page 
                            pageNumber={pageNum} 
                            width={Math.min(viewerWidth * 0.9, 650)}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                          />
                        </div>
                      </div>

                      {/* Right: Notes Page */}
                      <div className="w-1/2 p-12 space-y-10 group">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1">
                            <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 uppercase tracking-widest">
                              Page {pageNum} Insights
                            </span>
                            <div className="h-px flex-1 bg-slate-100" />
                          </div>
                          
                          <button 
                            onClick={() => {
                              setActiveStickyInputPage(activeStickyInputPage === pageNum ? null : pageNum);
                              setNewStickyContent("");
                            }}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeStickyInputPage === pageNum ? 'bg-red-50 text-red-500' : 'bg-orange-50 text-orange-600 hover:bg-orange-100 shadow-sm opacity-0 group-hover:opacity-100'}`}
                          >
                            {activeStickyInputPage === pageNum ? <X size={12} /> : <Plus size={12} />}
                            {activeStickyInputPage === pageNum ? 'Cancel' : 'Add Post-it'}
                          </button>
                        </div>

                        <div className="space-y-12">
                          {/* Official Takeaways */}
                          {hasOfficial && (
                            <div className="space-y-8">
                              {notesByPage[pageNum].map((note) => (
                                <div key={note.id} className="relative pl-6 border-l-4 border-emerald-500/20 hover:border-emerald-500 transition-colors">
                                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-3 flex items-center gap-2 group-hover:text-emerald-600">
                                    <Zap size={14} className="text-emerald-500" />
                                    {note.title}
                                  </h3>
                                  <div className="p-6 bg-[#FBFDFF] rounded-[2.5rem] border-2 border-slate-100 group-hover:border-emerald-50 transition-all shadow-sm">
                                    <p className="text-[13px] font-bold text-slate-600 leading-relaxed">
                                      {note.content}
                                    </p>
                                    {assistMode && note.translation && (
                                      <div className="mt-4 pt-4 border-t border-emerald-50">
                                        <p className="text-[11px] font-black text-emerald-600 italic">
                                          {note.translation}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Sticky Input */}
                          <AnimatePresence>
                            {activeStickyInputPage === pageNum && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                className="bg-orange-50/50 p-6 rounded-[2.5rem] border-2 border-orange-100 shadow-sm"
                              >
                                <textarea 
                                  value={newStickyContent}
                                  onChange={(e) => setNewStickyContent(e.target.value)}
                                  placeholder="Annotate this page with your observations..."
                                  className="w-full bg-white rounded-2xl p-5 text-sm font-bold border-2 border-transparent outline-none focus:border-orange-200 transition-all resize-none min-h-[100px]"
                                />
                                <div className="flex items-center justify-between mt-4">
                                  <div className="flex gap-2">
                                    {colorOptions.map(opt => (
                                      <button
                                        key={opt.name}
                                        onClick={() => setStickyColor(opt.name)}
                                        className={`w-5 h-5 rounded-full border border-black/5 transition-transform ${opt.bg} ${stickyColor === opt.name ? 'ring-2 ring-orange-400 ring-offset-2 scale-110' : 'hover:scale-105'}`}
                                      />
                                    ))}
                                  </div>
                                  <button 
                                    onClick={() => handleAddSticky(pageNum)}
                                    disabled={!newStickyContent.trim() || isSaving}
                                    className="px-6 py-2.5 bg-slate-800 text-white rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-md active:translate-y-0.5 transition-all disabled:opacity-50 flex items-center gap-2"
                                  >
                                    {isSaving ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} />}
                                    Preserve Note
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Personal Sticky Notes */}
                          {hasPersonal && (
                            <div className="grid grid-cols-1 gap-4">
                              {stickyByPage[pageNum].map(note => (
                                <div key={note.id} className="relative group/note">
                                  <div className={`p-6 rounded-[2rem] border transition-all shadow-sm ${colorOptions.find(c => c.name === (note as any).color)?.bg || 'bg-white'} ${colorOptions.find(c => c.name === (note as any).color)?.border || 'border-slate-100'} hover:shadow-md hover:scale-[1.01]`}>
                                    <p className="text-[12px] font-black text-slate-700 leading-relaxed italic">
                                      "{note.content}"
                                    </p>
                                    <div className="flex items-center justify-between mt-4">
                                      <div className="flex items-center gap-2 opacity-40">
                                        <Clock size={10} className="text-slate-400" />
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                          {new Date(note.createdAt).toLocaleDateString()}
                                        </p>
                                      </div>
                                      <button 
                                        onClick={() => handleDeleteSticky(note.id)}
                                        className="p-1.5 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover/note:opacity-100"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {!hasOfficial && !hasPersonal && !activeStickyInputPage && (
                            <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-[3rem] bg-slate-50/20 opacity-40 flex flex-col items-center justify-center gap-3">
                              <BookOpen size={24} className="text-slate-300" />
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Awaiting scientific observations...</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </Document>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showEditor && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-10 max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                  <div className="bg-amber-100 p-3 rounded-2xl text-amber-600 shadow-sm border border-amber-200">
                    <Database size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Sync Repository</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Unit {unit.id} • Dynamic Hub JSON</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={copyAIPrompt}
                    className="px-6 py-3 rounded-xl font-black uppercase text-[10px] text-amber-600 bg-amber-50 hover:bg-amber-100 tracking-widest transition-all flex items-center gap-2"
                  >
                    <Copy size={14} /> Copy Prompt
                  </button>
                  <button
                    onClick={() => setShowEditor(false)}
                    className="px-6 py-3 rounded-xl font-black uppercase text-[10px] text-slate-400 hover:bg-slate-50 tracking-widest transition-all"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNotes}
                    className="px-8 py-3 bg-emerald-500 text-white rounded-xl font-black uppercase text-[10px] shadow-[0_4px_0_0_#059669] active:shadow-none active:translate-y-1 transition-all tracking-widest flex items-center gap-2 disabled:opacity-50"
                    disabled={isSaving}
                  >
                    {isSaving ? <RefreshCw className="animate-spin" size={14} /> : <Send size={14} />}
                    {isSaving ? 'Syncing...' : 'Upload Sync'}
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 border-2 border-dashed border-slate-200 mb-8 space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">JSON Cleaner active: Auto-detects schema & repairs missing IDs.</p>
              </div>

              <textarea
                value={editingNotes}
                onChange={(e) => setEditingNotes(e.target.value)}
                className="w-full flex-1 min-h-[300px] p-6 rounded-2xl border-2 border-slate-100 font-mono text-xs leading-relaxed resize-none focus:border-emerald-500 outline-none custom-scrollbar bg-slate-50/50 text-slate-800 shadow-inner"
                placeholder="Paste JSON array here..."
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RevisionNotesView;
