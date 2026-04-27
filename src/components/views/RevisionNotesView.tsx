import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Sparkles, Star, Languages, Download, FileText, Send, Layout, Edit, RefreshCw, ChevronRight, BookOpen, Database, Trash2, Zap, Copy, Palette, EyeOff, Eye, Plus, Clock, ZoomIn, ZoomOut
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
  const [zoomLevel, setZoomLevel] = useState(1);
  
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
    } catch (e: any) {
      console.error(e);
      alert(`Failed to add note: ${e.message}`);
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

  // Handle resize via ResizeObserver on the actual container
  useEffect(() => {
    if (!leftPaneRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.contentRect.width > 0) {
          setViewerWidth((prev) => {
             if (Math.abs(prev - entry.contentRect.width) > 10) {
               return entry.contentRect.width;
             }
             return prev;
          });
        }
      }
    });
    
    observer.observe(leftPaneRef.current);
    return () => observer.disconnect();
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
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-md border-b border-white/10 p-4 shrink-0 sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-5">
            <button 
              onClick={onBack} 
              className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white border border-white/20 hover:text-slate-900 rounded-[1.2rem] text-white transition-all active:scale-95 group/btn"
            >
              <X size={20} className="stroke-[3] group-hover/btn:scale-110 transition-transform" />
            </button>
            <div className="h-8 w-px bg-white/10" />
            <div className="flex flex-col">
              <h1 className="text-xl font-black text-white uppercase tracking-tight leading-none">Unit {unit.id}: {unit.title}</h1>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em] px-2 py-0.5 bg-emerald-500/10 rounded-md border border-emerald-500/20">Revision Hub</span>
                {numPages && (
                  <span className="text-[9px] font-black text-white/50 uppercase tracking-widest leading-none">• Page {activePage} / {numPages}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/5 p-1.5 rounded-[1.2rem] border border-white/10 flex items-center gap-1.5 backdrop-blur-sm">
              <button 
                onClick={() => setViewMode('interactive')}
                className={`flex items-center gap-2 px-4 py-2 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'interactive' ? 'bg-white/20 text-white shadow-sm border border-white/20 scale-105' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
              >
                <Zap size={14} className={viewMode === 'interactive' ? 'text-emerald-400' : ''} /> Interactive
              </button>
              <button 
                onClick={() => setViewMode('summary')}
                className={`flex items-center gap-2 px-4 py-2 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'summary' ? 'bg-white/20 text-white shadow-sm border border-white/20 scale-105' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
              >
                <Layout size={14} className={viewMode === 'summary' ? 'text-blue-400' : ''} /> Summary
              </button>
            </div>

            <div className="h-8 w-px bg-white/10 mx-2" />

            {viewMode === 'interactive' && (
              <div className="flex items-center gap-1 mr-2 bg-white/5 rounded-[1.2rem] p-1 border border-white/10 backdrop-blur-sm">
                <button
                  onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
                  className="w-8 h-8 flex items-center justify-center rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut size={16} />
                </button>
                <div className="text-[10px] font-black text-white/50 w-8 text-center">{Math.round(zoomLevel * 100)}%</div>
                <button
                  onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
                  className="w-8 h-8 flex items-center justify-center rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn size={16} />
                </button>
              </div>
            )}

            {isAdmin && (
              <button 
                onClick={() => {
                  setEditingNotes(JSON.stringify(interactiveNotes, null, 2));
                  setShowEditor(true);
                }}
                className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-amber-500/20 text-amber-400 rounded-[1.2rem] border border-white/20 hover:border-amber-500/30 shadow-sm transition-all active:scale-95 group/btn"
                title="Edit Interactive Notes"
              >
                <Database size={18} className="stroke-[2.5] group-hover/btn:scale-110 transition-transform" />
              </button>
            )}

            <button 
              onClick={() => setAssistMode(!assistMode)}
              className={`w-10 h-10 flex items-center justify-center rounded-[1.2rem] border transition-all active:scale-95 group/btn ${assistMode ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-white/10 text-white border-white/20 hover:bg-white hover:text-slate-900'}`}
              title="Assist Mode"
            >
              <Languages size={18} className="stroke-[2.5] group-hover/btn:scale-110 transition-transform" />
            </button>
            
            {assistMode && (
              <button 
                onClick={() => setCharType(charType === 'traditional' ? 'simplified' : 'traditional')}
                className="px-3 h-10 rounded-[1.2rem] text-xs font-black border border-white/20 text-white bg-white/10 hover:bg-white hover:text-slate-900 transition-all active:scale-95"
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
          className="flex-1 overflow-y-auto custom-scrollbar relative z-0"
        >
          {viewMode === 'summary' ? (
            <div className="max-w-4xl mx-auto p-10 space-y-12 min-h-screen">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 flex items-center justify-center rounded-[1.2rem] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 backdrop-blur-sm">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white uppercase tracking-tight">Revision Summary</h2>
                  <p className="text-xs font-black text-white/50 uppercase tracking-[0.2em] mt-1">Core Concepts & Key Takeaways</p>
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
                      className={`p-8 bg-white/5 rounded-[2rem] border transition-all group backdrop-blur-xl shadow-xl ${assistMode ? 'border-emerald-500/30 shadow-emerald-500/10 hover:bg-white/10' : 'border-white/10 hover:bg-white/10'}`}
                    >
                      <div className="flex items-start gap-6">
                        <div className={`w-10 h-10 flex-shrink-0 rounded-[1.2rem] flex items-center justify-center font-black text-sm transition-colors border ${assistMode ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-white/10 text-white/50 border-white/10 group-hover:bg-white/20 group-hover:text-white'}`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 space-y-4">
                          <p className="text-[15px] font-bold text-white/90 leading-relaxed tracking-tight">
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
                                <div className="pt-5 border-t border-white/10 mt-2">
                                  <p className="text-[13px] font-black text-emerald-400 leading-relaxed italic opacity-90">
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
                    <RefreshCw className="animate-spin text-emerald-400" size={40} />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 animate-pulse">Synchronizing Data Source...</p>
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
                      className="flex border-b border-white/10 min-h-[70vh] scroll-mt-20"
                    >
                      {/* Left: PDF Page */}
                      <div className="w-1/2 p-4 md:p-8 flex justify-center items-start border-r border-white/10 relative overflow-hidden">
                        <div 
                          className="shadow-2xl rounded-lg overflow-auto bg-white ring-1 ring-white/20 sticky top-24 max-w-full max-h-[80vh] custom-scrollbar"
                        >
                          <Page 
                            pageNumber={pageNum} 
                            width={Math.min(viewerWidth * 0.9, 650) * zoomLevel}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                          />
                        </div>
                      </div>

                      {/* Right: Notes Page */}
                      <div className="w-1/2 p-12 space-y-10 group">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1">
                            <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-[1.2rem] border border-emerald-500/20 uppercase tracking-widest backdrop-blur-sm">
                              Page {pageNum} Insights
                            </span>
                            <div className="h-px flex-1 bg-white/10" />
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => {
                                setActiveStickyInputPage(activeStickyInputPage === pageNum ? null : pageNum);
                                setNewStickyContent("");
                              }}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-[1.2rem] text-[9px] font-black uppercase tracking-widest transition-all ${activeStickyInputPage === pageNum ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 opacity-0 group-hover:opacity-100'}`}
                            >
                              {activeStickyInputPage === pageNum ? <X size={12} /> : <Plus size={12} />}
                              {activeStickyInputPage === pageNum ? 'Cancel' : 'Add Post-it'}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-12">
                          {/* Official Takeaways */}
                          {hasOfficial && (
                            <div className="space-y-8">
                              {notesByPage[pageNum].map((note) => (
                                <div key={note.id} className="relative pl-6 border-l-4 border-emerald-500/30 hover:border-emerald-400 transition-colors">
                                  <h3 className="text-sm font-black text-white uppercase tracking-tight mb-3 flex items-center gap-2 group-hover:text-emerald-400">
                                    <Zap size={14} className="text-emerald-400" />
                                    {note.title}
                                  </h3>
                                  <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 group-hover:bg-white/10 transition-all shadow-xl backdrop-blur-xl">
                                    <p className="text-[13px] font-bold text-white/80 leading-relaxed">
                                      {note.content}
                                    </p>
                                    {assistMode && note.translation && (
                                      <div className="mt-4 pt-4 border-t border-white/10">
                                        <p className="text-[11px] font-black text-emerald-400 italic opacity-90">
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
                                className="bg-orange-500/10 p-6 rounded-[2.5rem] border border-orange-500/20 shadow-xl backdrop-blur-xl"
                              >
                                <textarea 
                                  value={newStickyContent}
                                  onChange={(e) => setNewStickyContent(e.target.value)}
                                  placeholder="Annotate this page with your observations..."
                                  className="w-full bg-white/5 rounded-2xl p-5 text-sm font-bold border border-white/10 text-white placeholder-white/30 outline-none focus:border-orange-500/50 transition-all resize-none min-h-[100px]"
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
                                    className="px-6 py-2.5 bg-white/10 hover:bg-white text-white hover:text-slate-900 border border-white/20 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-md active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2 group/btn"
                                  >
                                    {isSaving ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} className="group-hover/btn:scale-110 transition-transform" />}
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
                                  <div className={`p-6 rounded-[2rem] border transition-all shadow-xl backdrop-blur-xl ${colorOptions.find(c => c.name === (note as any).color)?.bg || 'bg-white/5'} ${colorOptions.find(c => c.name === (note as any).color)?.border || 'border-white/10'} hover:shadow-2xl hover:scale-[1.01]`} style={{ backgroundColor: colorOptions.find(c => c.name === (note as any).color)?.bg.includes('bg-white') ? 'rgba(255,255,255,0.05)' : undefined }}>
                                    <p className="text-[12px] font-black leading-relaxed italic" style={{ color: colorOptions.find(c => c.name === (note as any).color)?.bg.includes('bg-white') ? 'rgba(255,255,255,0.8)' : undefined }}>
                                      "{note.content}"
                                    </p>
                                    <div className="flex items-center justify-between mt-4">
                                      <div className="flex items-center gap-2 opacity-40 text-current">
                                        <Clock size={10} />
                                        <p className="text-[8px] font-black uppercase tracking-widest">
                                          {new Date(note.createdAt).toLocaleDateString()}
                                        </p>
                                      </div>
                                      <button 
                                        onClick={() => handleDeleteSticky(note.id)}
                                        className="p-1.5 text-current opacity-0 group-hover/note:opacity-50 hover:!opacity-100 transition-all hover:text-red-400"
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
                            <div className="py-12 text-center border border-dashed border-white/10 rounded-[2rem] bg-white/5 flex flex-col items-center justify-center gap-3">
                              <BookOpen size={24} className="text-white/20" />
                              <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Awaiting scientific observations...</p>
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
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-3xl z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/5 border border-white/20 rounded-[2.5rem] p-10 max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh] backdrop-blur-xl"
            >
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                  <div className="bg-amber-500/10 p-3 rounded-[1.2rem] text-amber-400 shadow-sm border border-amber-500/20 backdrop-blur-sm">
                    <Database size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Sync Repository</h3>
                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mt-0.5">Unit {unit.id} • Dynamic Hub JSON</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={copyAIPrompt}
                    className="px-6 py-3 rounded-2xl font-black uppercase text-[10px] text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 tracking-widest transition-all flex items-center gap-2 group/btn"
                  >
                    <div className="w-5 h-5 flex items-center justify-center bg-amber-500/20 rounded-lg group-hover/btn:scale-110 transition-transform"><Copy size={12} /></div> Copy Prompt
                  </button>
                  <button
                    onClick={() => setShowEditor(false)}
                    className="px-6 py-3 rounded-2xl font-black uppercase text-[10px] text-white bg-white/10 hover:bg-white border border-white/20 hover:text-slate-900 tracking-widest transition-all group/btn"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNotes}
                    className="px-8 py-3 bg-emerald-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 disabled:opacity-50 hover:bg-emerald-400 transition-all border border-emerald-400 group/btn shadow-xl shadow-emerald-500/20"
                    disabled={isSaving}
                  >
                    <div className="w-5 h-5 flex items-center justify-center bg-white/20 rounded-lg group-hover/btn:scale-110 transition-transform">
                      {isSaving ? <RefreshCw className="animate-spin" size={12} /> : <Send size={12} />}
                    </div>
                    {isSaving ? 'Syncing...' : 'Upload Sync'}
                  </button>
                </div>
              </div>

              <div className="bg-white/5 rounded-[1.2rem] p-6 border border-white/10 mb-8 space-y-3">
                <p className="text-[10px] font-black text-white/50 uppercase tracking-widest leading-relaxed">JSON Cleaner active: Auto-detects schema & repairs missing IDs.</p>
              </div>

              <textarea
                value={editingNotes}
                onChange={(e) => setEditingNotes(e.target.value)}
                className="w-full flex-1 min-h-[300px] p-6 rounded-[1.5rem] border border-white/10 font-mono text-xs leading-relaxed resize-none focus:border-emerald-500/50 outline-none custom-scrollbar bg-black/20 text-emerald-400 shadow-inner"
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
