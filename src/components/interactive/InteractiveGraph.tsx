import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { XCircle } from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

interface InteractiveGraphProps {
  id: string;
  responses: Record<string, any>;
  handleResponse: (id: string, response: any) => void;
  readOnly: boolean;
  submitted: boolean;
}

export const InteractiveGraph: React.FC<InteractiveGraphProps> = ({
  id,
  responses,
  handleResponse,
  readOnly,
  submitted
}) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Data structure: array of {x, y} coordinates
  const points: Point[] = responses[id]?.points || [];

  const handleGraphClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly || submitted) return;
    if (!containerRef.current) return;
    
    // We want to snap to grid intersections (or rough approximations)
    const rect = containerRef.current.getBoundingClientRect();
    const xRatio = (e.clientX - rect.left) / rect.width;
    const yRatio = (e.clientY - rect.top) / rect.height;
    
    // Graph bounds: X (Time in s 0-100), Y (Volume cm3 0-100)
    // Assume 10x10 grid -> snap to nearest 10%
    const snapGrid = 10;
    const xSnaps = Math.round(xRatio * snapGrid) / snapGrid;
    const ySnaps = Math.round((1 - yRatio) * snapGrid) / snapGrid; // Flip Y since 0 is at bottom
    
    // Prevent exactly identical x points
    const newPoints = points.filter(p => Math.abs(p.x - (xSnaps * 100)) > 1);
    
    newPoints.push({ x: xSnaps * 100, y: ySnaps * 100 });
    // Sort by X
    newPoints.sort((a, b) => a.x - b.x);
    
    handleResponse(id, { ...responses[id], points: newPoints });
  };

  const clearPoints = () => {
    if (readOnly || submitted) return;
    handleResponse(id, { ...responses[id], points: [] });
  };

  // Convert points to SVG polyline (coordinates relative to 100x100 box where top-left is 0,0)
  const polylinePoints = points.map(p => `${p.x},${100 - p.y}`).join(' ');

  const renderGrid = () => {
    return (
      <div className="absolute inset-0 pt-[2%]" style={{ pointerEvents: 'none' }}>
        {/* Draw a 10x10 grid */}
        {Array.from({ length: 11 }).map((_, i) => (
          <React.Fragment key={i}>
            {/* Horizontal line */}
            <div className={`absolute w-full h-px ${i % 5 === 0 ? 'bg-gray-300' : 'bg-gray-100'}`} style={{ top: `${i * 10}%` }} />
            {/* Vertical line */}
            <div className={`absolute h-full w-px ${i % 5 === 0 ? 'bg-gray-300' : 'bg-gray-100'}`} style={{ left: `${i * 10}%` }} />
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Editor view or launch button */}
      {!isEditorOpen ? (
        <div className="bg-gray-50 p-6 rounded-3xl border-2 border-gray-200 flex flex-col items-center justify-center min-h-[300px] text-center gap-4">
          <div className="w-full max-w-[400px] aspect-square bg-white border-l-2 border-b-2 border-gray-400 relative p-4 pointer-events-none">
            <div className="absolute -left-8 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] uppercase font-black tracking-widest text-gray-500">Volume (cm³)</div>
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] uppercase font-black tracking-widest text-gray-500">Time (s)</div>
            
            {points.length > 0 ? (
               <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                 <polyline points={polylinePoints} fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinejoin="round" />
                 {points.map((p, i) => (
                   <circle key={i} cx={p.x} cy={100 - p.y} r="2" fill="#4f46e5" />
                 ))}
               </svg>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-gray-300 font-bold text-xs uppercase tracking-widest">No Graph Data</span>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => setIsEditorOpen(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-black tracking-widest uppercase shadow-[0_4px_0_0_#4338ca] active:shadow-none active:translate-y-1 transition-all mt-4"
          >
            {readOnly || submitted ? 'View Graph Details' : 'Launch Graph Editor'}
          </button>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-3xl border-4 border-indigo-100 shadow-xl relative mt-4">
          <button 
            onClick={() => setIsEditorOpen(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-20 bg-white rounded-full"
          >
            <XCircle size={24} />
          </button>
          
          <h3 className="font-black text-indigo-900 uppercase tracking-tight text-lg mb-4 pr-10">Graph Editor</h3>
          
          {!readOnly && !submitted && (
            <p className="text-sm font-bold text-gray-500 mb-6 bg-gray-50 p-3 rounded-xl">Click on the grid intersections below to plot your data points.</p>
          )}

          <div className="flex flex-col items-center">
            <div className="w-full max-w-[400px] aspect-square relative mb-8">
              <div className="absolute -left-10 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-black tracking-widest text-gray-600 w-32 text-center">Volume (cm³) &rarr;</div>
              <div className="absolute -bottom-10 left-0 w-full text-center text-xs font-black tracking-widest text-gray-600">Time (s) &rarr;</div>
              
              <div 
                ref={containerRef}
                className="w-full h-full border-l-[3px] border-b-[3px] border-gray-800 relative cursor-crosshair bg-white"
                onClick={handleGraphClick}
              >
                {renderGrid()}
                
                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" preserveAspectRatio="none">
                  {points.length > 1 && (
                    <polyline points={polylinePoints} fill="none" stroke="#4f46e5" strokeWidth="1.5" strokeLinejoin="round" />
                  )}
                  {points.map((p, i) => (
                    <g key={i}>
                      <circle cx={p.x} cy={100 - p.y} r="2.5" fill="#e11d48" stroke="white" strokeWidth="0.5" />
                      {/* Interactive "x" removed for simplicity, just displaying dots */}
                    </g>
                  ))}
                </svg>
              </div>
            </div>

            {!readOnly && !submitted && (
              <div className="w-full flex justify-between items-center bg-gray-50 p-4 rounded-2xl border-2 border-gray-100">
                <span className="font-bold text-gray-600 text-sm">Data points: {points.length}</span>
                <button 
                  onClick={clearPoints}
                  disabled={points.length === 0}
                  className="px-4 py-2 bg-white border-2 border-red-200 text-red-600 rounded-lg font-black uppercase text-xs tracking-widest hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Clear Plot
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Common note area that sits below either view */}
      <textarea
        placeholder="Provide any additional data points or trend description..."
        value={responses[id]?.notes || ''}
        readOnly={readOnly || submitted}
        onChange={(e) => handleResponse(id, { ...responses[id], notes: e.target.value })}
        className={`w-full p-4 rounded-2xl border-2 border-slate-100 font-bold text-sm text-gray-800 focus:border-indigo-500 outline-none transition-all resize-none min-h-[80px] ${readOnly || submitted ? 'bg-gray-100' : 'bg-slate-50/50'}`}
      />
    </div>
  );
};
