import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Download, MousePointer2, Save, Loader2, Undo, Redo, Image as ImageIcon, Type, Square, Circle, Triangle, Pen, Minus, ArrowRight, ArrowLeftRight, Maximize2, Minimize2 } from 'lucide-react';
import { upload } from '@vercel/blob/client';
import { fabric } from 'fabric';

interface SketchpadProps {
  onClose: () => void;
  onSave?: (url: string, filename: string) => void;
}

const Sketchpad: React.FC<SketchpadProps> = ({ onClose, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  
  const [activeMode, setActiveMode] = useState<'draw' | 'select' | 'shape'>('draw');
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(3);
  const [isUploading, setIsUploading] = useState(false);
  
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isHistoryAction, setIsHistoryAction] = useState(false);

  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const boundsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    
    // Initialize Fabric canvas
    const canvas = new fabric.Canvas(canvasRef.current, {
      isDrawingMode: true,
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      backgroundColor: '#ffffff'
    });
    
    canvas.freeDrawingBrush.color = color;
    canvas.freeDrawingBrush.width = lineWidth;
    
    setFabricCanvas(canvas);
    
    // Save initial state
    setHistory([JSON.stringify(canvas.toJSON())]);
    setHistoryIndex(0);
    
    const saveHistory = () => {
      // Avoid saving history when we are undoing/redoing
      if (canvas.historyProcessing) return;
      
      setHistory(prev => {
        const newHistory = prev.slice(0, (canvas.historyIndexRef as number) + 1);
        newHistory.push(JSON.stringify(canvas.toJSON()));
        canvas.historyIndexRef = newHistory.length - 1;
        setHistoryIndex(newHistory.length - 1);
        return newHistory;
      });
    };

    canvas.historyProcessing = false;
    canvas.historyIndexRef = 0;

    // History Tracking
    canvas.on('object:added', () => saveHistory());
    canvas.on('object:modified', () => saveHistory());
    canvas.on('object:removed', () => saveHistory());
    canvas.on('path:created', () => saveHistory());

    const resizeCanvas = () => {
      if (containerRef.current) {
        canvas.setWidth(containerRef.current.clientWidth);
        canvas.setHeight(containerRef.current.clientHeight);
        canvas.renderAll();
      }
    };

    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.dispose();
    };
  }, []); // Only run once on mount

  // Watch for resize events of the container to readjust canvas when minimizing/maximizing
  useEffect(() => {
    if (!fabricCanvas || !containerRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
       if (containerRef.current) {
         fabricCanvas.setWidth(containerRef.current.clientWidth);
         fabricCanvas.setHeight(containerRef.current.clientHeight);
         fabricCanvas.renderAll();
       }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [fabricCanvas]);

  const undo = () => {
    if (!fabricCanvas || historyIndex <= 0) return;
    (fabricCanvas as any).historyProcessing = true;
    const newIdx = historyIndex - 1;
    (fabricCanvas as any).historyIndexRef = newIdx;
    setHistoryIndex(newIdx);
    fabricCanvas.loadFromJSON(history[newIdx], () => {
      fabricCanvas.renderAll();
      (fabricCanvas as any).historyProcessing = false;
    });
  };

  const redo = () => {
    if (!fabricCanvas || historyIndex >= history.length - 1) return;
    (fabricCanvas as any).historyProcessing = true;
    const newIdx = historyIndex + 1;
    (fabricCanvas as any).historyIndexRef = newIdx;
    setHistoryIndex(newIdx);
    fabricCanvas.loadFromJSON(history[newIdx], () => {
      fabricCanvas.renderAll();
      (fabricCanvas as any).historyProcessing = false;
    });
  };

  useEffect(() => {
    if (!fabricCanvas) return;
    fabricCanvas.freeDrawingBrush.color = color;
    fabricCanvas.freeDrawingBrush.width = lineWidth;
    
    if (fabricCanvas.getActiveObject() && 'set' in fabricCanvas.getActiveObject()) {
      const obj = fabricCanvas.getActiveObject();
      if (obj.type === 'i-text' || obj.type === 'path') {
        obj.set('fill', color);
        obj.set('stroke', obj.type === 'path' ? color : null);
      } else {
        obj.set('stroke', color);
      }
      fabricCanvas.renderAll();
      
      // Save history after changing color
      setHistory(prev => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(JSON.stringify(fabricCanvas.toJSON()));
        setHistoryIndex(newHistory.length - 1);
        return newHistory;
      });
    }
  }, [color, lineWidth, fabricCanvas]);

  const setMode = (mode: 'draw' | 'select' | 'shape') => {
    setActiveMode(mode);
    if (!fabricCanvas) return;
    if (mode === 'draw') {
      fabricCanvas.isDrawingMode = true;
      fabricCanvas.discardActiveObject();
      fabricCanvas.renderAll();
    } else {
      fabricCanvas.isDrawingMode = false;
    }
  };

  const addText = () => {
    if (!fabricCanvas) return;
    setMode('select');
    const text = new fabric.IText('Double click to edit', {
      left: fabricCanvas.width ? fabricCanvas.width / 2 : 100,
      top: fabricCanvas.height ? fabricCanvas.height / 2 : 100,
      fontFamily: 'helvetica',
      fill: color,
      fontSize: 24,
      originX: 'center',
      originY: 'center',
    });
    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    fabricCanvas.renderAll();
  };

  const addShape = (type: 'rect' | 'circle' | 'triangle' | 'line' | 'arrow' | 'double-arrow') => {
    if (!fabricCanvas) return;
    setMode('select');
    
    const center = fabricCanvas.getCenter();
    let shape;
    
    const commonOpts = {
      left: center.left,
      top: center.top,
      fill: 'transparent',
      stroke: color,
      strokeWidth: lineWidth,
      originX: 'center' as const,
      originY: 'center' as const,
      strokeLineJoin: 'round' as const,
      strokeLineCap: 'round' as const,
      strokeUniform: true
    };

    if (type === 'rect') {
      shape = new fabric.Rect({ ...commonOpts, width: 100, height: 100 });
    } else if (type === 'circle') {
      shape = new fabric.Circle({ ...commonOpts, radius: 50 });
    } else if (type === 'triangle') {
      shape = new fabric.Triangle({ ...commonOpts, width: 100, height: 100 });
    } else if (type === 'line') {
      shape = new fabric.Line([-50, 0, 50, 0], { ...commonOpts });
    } else if (type === 'arrow') {
      const pathStr = 'M -50 0 L 50 0 M 35 -15 L 50 0 L 35 15';
      shape = new fabric.Path(pathStr, { ...commonOpts, fill: '' });
    } else if (type === 'double-arrow') {
      const pathStrDouble = 'M -35 -15 L -50 0 L -35 15 M -50 0 L 50 0 M 35 -15 L 50 0 L 35 15';
      shape = new fabric.Path(pathStrDouble, { ...commonOpts, fill: '' });
    }

    if (shape) {
      fabricCanvas.add(shape);
      fabricCanvas.setActiveObject(shape);
      fabricCanvas.renderAll();
    }
  };

  const importImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!fabricCanvas || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (f) => {
      const data = f.target?.result as string;
      fabric.Image.fromURL(data, (img) => {
        if (!img) return;
        
        let scale = 1;
        if (fabricCanvas.width && fabricCanvas.height && img.width && img.height) {
          scale = Math.min(fabricCanvas.width / img.width, fabricCanvas.height / img.height);
          // Only scale down to fit
          if (scale > 1) scale = 1;
          img.scale(scale * 0.9);
        }
        
        // Add as background
        fabricCanvas.setBackgroundImage(img, fabricCanvas.renderAll.bind(fabricCanvas), {
          originX: 'center',
          originY: 'center',
          left: fabricCanvas.width ? fabricCanvas.width / 2 : 100,
          top: fabricCanvas.height ? fabricCanvas.height / 2 : 100,
          scaleX: scale * 0.9,
          scaleY: scale * 0.9
        });
        
        e.target.value = ''; // Reset input
      });
    };
    reader.readAsDataURL(file);
  };

  const deleteSelected = () => {
    if (!fabricCanvas) return;
    const activeObjects = fabricCanvas.getActiveObjects();
    if (activeObjects.length) {
      fabricCanvas.discardActiveObject();
      activeObjects.forEach(obj => {
        fabricCanvas.remove(obj);
      });
    }
  };

  const clearValues = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = '#ffffff';
    fabricCanvas.renderAll();
  };

  const getCanvasDataUrl = () => {
     if (!fabricCanvas) return '';
     
     // Remove selection before capturing
     fabricCanvas.discardActiveObject();
     fabricCanvas.renderAll();
     
     const multiplier = 2; // For higher res output
     return fabricCanvas.toDataURL({ format: 'png', multiplier });
  };

  const triggerDownload = () => {
    const dataUrl = getCanvasDataUrl();
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.download = 'sketchpad.png';
    link.href = dataUrl;
    link.click();
  };

  const saveAndUploadCanvas = async () => {
    if (!onSave || !fabricCanvas) return;
    
    setIsUploading(true);
    try {
      const dataUrl = getCanvasDataUrl();
      const blobData = await (await fetch(dataUrl)).blob();
      
      const file = new File([blobData], `sketch_${Date.now()}.png`, { type: 'image/png' });
      const newBlob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
      });
      onSave(newBlob.url, file.name);
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed: ' + (error as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace' || e.key === 'Delete') {
        const activeObj = fabricCanvas?.getActiveObject();
        if (activeObj && activeObj.type !== 'i-text') {
           deleteSelected();
        } else if (activeObj && activeObj.type === 'i-text' && !(activeObj as fabric.IText).isEditing) {
           deleteSelected();
        }
      } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div ref={boundsRef} className="fixed inset-0 z-[1000] pointer-events-none flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          width: isMaximized ? '100vw' : (isMinimized ? '400px' : '95vw'),
          height: isMaximized ? '100vh' : (isMinimized ? '80px' : '85vh'),
          maxWidth: isMaximized ? '100%' : (isMinimized ? '400px' : '1400px'),
          x: (isMaximized || isMinimized) ? 0 : undefined,
          y: (isMaximized || isMinimized) ? 0 : undefined,
        }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
        className={`bg-white shadow-2xl flex flex-col overflow-hidden pointer-events-auto border-2 border-gray-200 ${
          isMaximized ? 'rounded-none border-0' : 'rounded-[2.5rem]'
        }`}
        style={{ position: 'relative' }}
      >
        <header className="bg-gray-50/50 p-2 md:p-3 border-b border-gray-100 flex items-center gap-4">
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-2">
              <button 
                onClick={onClose} 
                className="w-3.5 h-3.5 rounded-full bg-[#ff5f56] border border-[#e0443e] hover:bg-[#ff5f56]/80 flex items-center justify-center group" 
                title="Exit to Question"
                disabled={isUploading}
              >
                <X size={8} className="text-black/50 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <button 
                onClick={() => { setIsMinimized(!isMinimized); setIsMaximized(false); }} 
                className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e] border border-[#dea123] hover:bg-[#ffbd2e]/80 flex items-center justify-center group" 
                title={isMinimized ? "Restore" : "Minimize"}
              >
                <Minus size={8} className="text-black/50 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <button 
                onClick={() => { setIsMaximized(!isMaximized); setIsMinimized(false); }} 
                className="w-3.5 h-3.5 rounded-full bg-[#27c93f] border border-[#1aab29] hover:bg-[#27c93f]/80 flex items-center justify-center group" 
                title={isMaximized ? "Restore" : "Maximize"}
              >
                <Maximize2 size={8} className="text-black/50 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>

            <div className="flex items-center px-2 py-1">
              <h2 className="text-sm font-black text-gray-800 uppercase tracking-tight select-none">Sketch</h2>
            </div>
          </div>

          <div className={`flex items-center gap-2 overflow-x-auto no-scrollbar w-full justify-between ${isMinimized ? 'hidden' : 'flex'}`}>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200">
                <button onClick={() => undo()} disabled={historyIndex <= 0} className="p-1 text-gray-500 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg disabled:opacity-30"><Undo size={14}/></button>
                <button onClick={() => redo()} disabled={historyIndex >= history.length - 1} className="p-1 text-gray-500 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg disabled:opacity-30"><Redo size={14}/></button>
              </div>
              
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200">
                 <button onClick={() => setMode('select')} className={`p-1 rounded-lg ${activeMode === 'select' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`} title="Select tool"><MousePointer2 size={14}/></button>
                 <button onClick={() => setMode('draw')} className={`p-1 rounded-lg ${activeMode === 'draw' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`} title="Draw tool"><Pen size={14}/></button>
                 <button onClick={() => addText()} className="p-1 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50" title="Add Text"><Type size={14}/></button>
                 <button onClick={() => addShape('line')} className="p-1 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50" title="Add Line"><Minus size={14}/></button>
                 <button onClick={() => addShape('arrow')} className="p-1 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50" title="Add Arrow"><ArrowRight size={14}/></button>
                 <button onClick={() => addShape('double-arrow')} className="p-1 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50" title="Add Double Arrow"><ArrowLeftRight size={14}/></button>
                 <button onClick={() => addShape('rect')} className="p-1 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50" title="Add Square"><Square size={14}/></button>
                 <button onClick={() => addShape('circle')} className="p-1 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50" title="Add Circle"><Circle size={14}/></button>
                 <button onClick={() => addShape('triangle')} className="p-1 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50" title="Add Triangle"><Triangle size={14}/></button>
              </div>
  
              <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-gray-200">
                {['#000000', '#ef4444', '#3b82f6', '#10b981', '#f59e0b'].map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-4 h-4 md:w-5 md:h-5 rounded-lg transition-transform ${color === c ? 'scale-110 shadow-[0_0_0_2px_#fff,0_0_0_4px_#3b82f6]' : 'hover:scale-105'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={importImage} 
              />
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 px-2 py-1.5 hover:bg-indigo-50 text-indigo-500 rounded-xl transition-all font-bold text-xs" title="Import Image Background">
                <ImageIcon size={14} /> <span className="hidden xl:inline">BG</span>
              </button>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button onClick={clearValues} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 rounded-lg transition-all font-black uppercase text-[9px] tracking-widest" title="Clear All" disabled={isUploading}>
                <Trash2 size={12} /> Clear Canvas
              </button>
              <button onClick={triggerDownload} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-700 rounded-lg transition-all font-black uppercase text-[9px] tracking-widest" title="Download Screenshot" disabled={isUploading}>
                <Download size={12} /> Download PNG
              </button>
              {onSave && (
                <button 
                  onClick={saveAndUploadCanvas} 
                  className={`flex items-center gap-1.5 px-3 py-1.5 font-black text-[9px] uppercase tracking-widest rounded-lg transition-all ${
                    isUploading ? 'bg-indigo-100 text-indigo-400 cursor-not-allowed' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-700'
                  }`}
                  disabled={isUploading}
                >
                  {isUploading ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                  <span>{isUploading ? 'Saving...' : 'Save As Answer'}</span>
                </button>
              )}
            </div>
          </div>
        </header>

        <div 
          ref={containerRef}
          className={`flex-1 bg-gray-50 relative pointer-events-auto ${isMinimized ? 'hidden' : 'block'}`}
        >
          <canvas ref={canvasRef} className="absolute inset-0" />
        </div>
      </motion.div>
    </div>
  );
};

export default Sketchpad;

