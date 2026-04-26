import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Download, MousePointer2 } from 'lucide-react';

interface SketchpadProps {
  onClose: () => void;
}

const Sketchpad: React.FC<SketchpadProps> = ({ onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(3);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.beginPath(); // Reset path
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = (e as React.MouseEvent).clientX - rect.left;
      y = (e as React.MouseEvent).clientY - rect.top;
    }

    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'sketchpad.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-10 pointer-events-none"
    >
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl h-full flex flex-col overflow-hidden border-2 border-gray-100 pointer-events-auto">
        <header className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100/50">
              <MousePointer2 size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black text-gray-800 uppercase tracking-tight">Virtual Sketchpad</h2>
              <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Transient Buffer</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-200 mr-4">
              {['#000000', '#ef4444', '#3b82f6', '#10b981', '#f59e0b'].map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-lg transition-transform ${color === c ? 'scale-110 shadow-md ring-2 ring-indigo-500 ring-offset-2' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            
            <button onClick={clearCanvas} className="p-2.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-all" title="Clear All">
              <Trash2 size={20} />
            </button>
            <button onClick={downloadCanvas} className="p-2.5 hover:bg-gray-100 text-gray-400 hover:text-gray-900 rounded-xl transition-all" title="Download Screenshot">
              <Download size={20} />
            </button>
            <div className="w-px h-6 bg-gray-200 mx-2" />
            <button onClick={onClose} className="p-2.5 hover:bg-gray-100 text-gray-400 hover:text-gray-900 rounded-xl transition-all">
              <X size={20} />
            </button>
          </div>
        </header>

        <div className="flex-1 bg-white relative cursor-crosshair overflow-hidden">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseOut={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="absolute inset-0 touch-none"
          />
        </div>
      </div>
    </motion.div>
  );
};

export default Sketchpad;
