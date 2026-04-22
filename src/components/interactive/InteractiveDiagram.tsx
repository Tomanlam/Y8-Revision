import React, { useState } from 'react';

interface InteractiveDiagramProps {
  id: string;
  responses: Record<string, any>;
  handleResponse: (id: string, response: any) => void;
  readOnly: boolean;
  submitted: boolean;
}

export const InteractiveDiagram: React.FC<InteractiveDiagramProps> = ({
  id,
  responses,
  handleResponse,
  readOnly,
  submitted
}) => {
  const currentSelections = responses[id] || {
    wool: null,
    metal: null,
    tube: null,
    heat: null
  };

  const availableLabels = ['Mineral wool', 'Metal sample', 'Delivery tube', 'Heat source'].filter(
    label => !Object.values(currentSelections).includes(label)
  );

  const handleDragStart = (e: React.DragEvent, label: string) => {
    if (readOnly || submitted) return;
    e.dataTransfer.setData('label', label);
  };

  const handleDrop = (e: React.DragEvent, zoneId: string) => {
    if (readOnly || submitted) return;
    e.preventDefault();
    const label = e.dataTransfer.getData('label');
    if (label) {
      handleResponse(id, { ...currentSelections, [zoneId]: label });
    }
  };

  const handleRemove = (zoneId: string) => {
    if (readOnly || submitted) return;
    const newSelections = { ...currentSelections };
    newSelections[zoneId] = null;
    handleResponse(id, newSelections);
  };

  // Coordinates for the blanks based on the typical layout
  const zones = [
    { id: 'tube', x: 20, y: 70, w: 90, h: 30 },
    { id: 'metal', x: 160, y: 120, w: 90, h: 30 },
    { id: 'wool', x: 260, y: 30, w: 90, h: 30 },
    { id: 'heat', x: 260, y: 220, w: 90, h: 30 }
  ];

  return (
    <div className="bg-emerald-50 p-6 rounded-3xl border-2 border-emerald-100 flex flex-col items-center gap-6">
      <p className="text-emerald-700 font-bold text-sm">Drag labels from below to the correct boxes on the diagram.</p>
      
      <div className="relative w-full max-w-lg aspect-[16/10] bg-white rounded-2xl border-2 border-gray-200 shadow-sm overflow-hidden flex items-center justify-center">
        {/* SVG Diagram representing the steam reaction setup */}
        <svg viewBox="0 0 400 250" className="w-[90%] h-[90%] absolute inset-0 m-auto pointer-events-none">
          <g stroke="#9ca3af" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Delivery tube */}
            <path d="M40 90 L130 90" />
            <path d="M40 95 L130 95" />
            {/* Bung */}
            <path d="M120 70 L140 75 L140 115 L120 120 Z" fill="#4b5563" stroke="#4b5563" />
            {/* Test tube */}
            <path d="M140 75 L330 75 A 20 20 0 0 1 350 95 A 20 20 0 0 1 330 115 L140 115" strokeWidth="2.5" />
            
            {/* Metal Sample */}
            <rect x="200" y="100" width="30" height="10" rx="3" fill="#6b7280" stroke="#4b5563" />
            
            {/* Mineral Wool */}
            <path d="M280 85 Q 290 75 300 85 Q 310 75 320 85 Q 330 90 325 105 Q 310 115 300 105 Q 290 115 280 105 Q 275 95 280 85" fill="#d1d5db" />
            
            {/* Heat Source (Bunsen burner under wool) */}
            <path d="M305 130 C 295 160 315 160 305 130" fill="#f87171" stroke="#ef4444" opacity="0.8" />
            <path d="M295 210 L315 210" strokeWidth="3" />
            <path d="M305 170 L305 210" strokeWidth="6" stroke="#d1d5db" />
            <path d="M285 210 L325 210 L325 216 L285 216 Z" fill="#9ca3af" />
          </g>

          {/* Pointer lines to drop zones */}
          <g stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4,4">
            <line x1="85" y1="90" x2="65" y2="70" />
            <line x1="215" y1="100" x2="205" y2="120" />
            <line x1="305" y1="85" x2="305" y2="60" />
            <line x1="305" y1="180" x2="305" y2="220" />
          </g>
        </svg>

        {/* Drop zones overlay */}
        {zones.map(zone => (
          <div 
            key={zone.id}
            style={{ left: `${(zone.x / 400) * 100}%`, top: `${(zone.y / 250) * 100}%`, width: `${(zone.w / 400) * 100}%`, height: `${(zone.h / 250) * 100}%` }}
            className={`absolute border-2 border-dashed flex items-center justify-center p-1 rounded-lg bg-white/80 backdrop-blur-sm transition-colors ${currentSelections[zone.id] ? 'border-emerald-400 bg-emerald-50' : 'border-gray-300'}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, zone.id)}
            onClick={() => handleRemove(zone.id)}
          >
            {currentSelections[zone.id] ? (
              <span className="text-[10px] sm:text-xs font-black text-emerald-700 leading-tight text-center cursor-pointer">{currentSelections[zone.id]}</span>
            ) : (
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Drop</span>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-3 min-h-[40px] px-4">
        {availableLabels.map(label => (
          <div 
            key={label}
            draggable={!readOnly && !submitted}
            onDragStart={(e) => handleDragStart(e, label)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black shadow-sm touch-none select-none ${readOnly || submitted ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400' : 'bg-white border-2 border-emerald-500 text-emerald-700 cursor-grab active:cursor-grabbing hover:bg-emerald-50'}`}
          >
            {label}
          </div>
        ))}
        {availableLabels.length === 0 && (
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mt-3">All labels placed</p>
        )}
      </div>
    </div>
  );
};
