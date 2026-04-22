import React from 'react';
import { motion } from 'motion/react';

interface InteractiveApparatusProps {
  id: string;
  responses: Record<string, any>;
  handleResponse: (id: string, response: any) => void;
  readOnly: boolean;
  submitted: boolean;
}

export const InteractiveApparatus: React.FC<InteractiveApparatusProps> = ({
  id,
  responses,
  handleResponse,
  readOnly,
  submitted
}) => {
  const currentSelections = responses[id] || {
    flask: null,
    tube: null,
    collection: null
  };

  const allParts = [
    { id: 'flask_a', type: 'flask', label: 'Conical Flask', icon: '⚗️', correctFor: 'flask' },
    { id: 'tube_a', type: 'tube', label: 'Delivery Tube', icon: '➰', correctFor: 'tube' },
    { id: 'collection_a', type: 'collection', label: 'Gas Syringe', icon: '💉', correctFor: 'collection' },
    { id: 'wrong_1', type: 'collection', label: 'Evaporating Basin', icon: '🥣', correctFor: 'none' },
    { id: 'wrong_2', type: 'tube', label: 'Glass Rod', icon: '🥢', correctFor: 'none' }
  ];

  const availableParts = allParts.filter(
    part => !Object.values(currentSelections).includes(part.id)
  );

  const handleDragStart = (e: React.DragEvent, partId: string) => {
    if (readOnly || submitted) return;
    e.dataTransfer.setData('partId', partId);
  };

  const handleDrop = (e: React.DragEvent, zoneType: string) => {
    if (readOnly || submitted) return;
    e.preventDefault();
    const partId = e.dataTransfer.getData('partId');
    if (partId) {
      handleResponse(id, { ...currentSelections, [zoneType]: partId });
    }
  };

  const handleRemove = (zoneType: string) => {
    if (readOnly || submitted) return;
    const newSelections = { ...currentSelections };
    newSelections[zoneType] = null;
    handleResponse(id, newSelections);
  };

  const renderDroppedPart = (partId: string | null) => {
    if (!partId) return null;
    const part = allParts.find(p => p.id === partId);
    if (!part) return null;
    return (
      <div className="flex flex-col items-center justify-center w-full h-full p-2 bg-blue-50 cursor-pointer" onClick={() => handleRemove(part.type)}>
        <span className="text-3xl mb-1">{part.icon}</span>
        <span className="text-[10px] font-black text-blue-800 text-center uppercase leading-tight">{part.label}</span>
      </div>
    );
  };

  return (
    <div className="bg-blue-50/50 p-6 rounded-3xl border-2 border-blue-100 flex flex-col items-center gap-6">
      <p className="text-blue-700 font-bold text-sm text-center">Construct your apparatus: Drag the correct equipment pieces into the assembly slots to collect gas.</p>
      
      <div className="w-full max-w-sm aspect-[4/3] bg-white rounded-2xl border-2 border-dashed border-blue-200 shadow-sm flex flex-col items-center justify-center p-4 relative">
        <div className="flex items-end justify-center w-full h-full gap-2 pt-8">
          
          {/* Reaction Vessel Slot */}
          <div 
            className={`w-28 h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center overflow-hidden transition-colors ${currentSelections.flask ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, 'flask')}
          >
            {currentSelections.flask ? renderDroppedPart(currentSelections.flask) : <span className="text-[10px] font-bold text-gray-400 uppercase text-center p-2">Reaction Vessel</span>}
          </div>

          {/* Connection Tube Slot */}
          <div 
            className={`w-20 h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center overflow-hidden transition-colors mb-8 ${currentSelections.tube ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, 'tube')}
          >
           {currentSelections.tube ? renderDroppedPart(currentSelections.tube) : <span className="text-[10px] font-bold text-gray-400 uppercase text-center p-2">Connection</span>}
          </div>

          {/* Collection Vessel Slot */}
          <div 
            className={`w-32 h-20 border-2 border-dashed rounded-xl flex flex-col items-center justify-center overflow-hidden transition-colors mb-10 ${currentSelections.collection ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, 'collection')}
          >
           {currentSelections.collection ? renderDroppedPart(currentSelections.collection) : <span className="text-[10px] font-bold text-gray-400 uppercase text-center p-2">Gas Collection</span>}
          </div>

        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3 w-full">
        {availableParts.map(part => (
          <div 
            key={part.id}
            draggable={!readOnly && !submitted}
            onDragStart={(e) => handleDragStart(e, part.id)}
            className={`px-3 py-2 rounded-xl flex flex-col items-center justify-center min-w-[80px] shadow-sm touch-none select-none transition-transform ${readOnly || submitted ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'bg-white border-2 border-blue-400 cursor-grab active:cursor-grabbing hover:-translate-y-1'}`}
          >
            <span className="text-2xl mb-1 pointer-events-none">{part.icon}</span>
            <span className="text-[10px] font-black text-blue-800 uppercase tracking-tight pointer-events-none">{part.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
