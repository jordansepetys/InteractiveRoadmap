import React from 'react';
import StageCard from './StageCard';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Wrapper for DnD capability
const SortableStageCard = ({ feature, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: feature.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <StageCard feature={feature} onClick={onClick} />
    </div>
  );
};

const StageColumn = ({ stage, features, isDroppableArea = false, onFeatureClick }) => {
  const { setNodeRef } = useDroppable({
    id: stage,
  });

  return (
    <div className="flex-shrink-0 w-80 flex flex-col h-full max-h-full">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wider">
          {stage}
        </h3>
        <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">
          {features.length}
        </span>
      </div>

      {/* Scrollable Card Area */}
      <div 
        ref={isDroppableArea ? setNodeRef : null}
        className="flex-1 overflow-y-auto min-h-0 pr-2 space-y-3 pb-4"
      >
        {isDroppableArea ? (
           <SortableContext items={features.map(f => f.id)} strategy={verticalListSortingStrategy}>
             {features.map(feature => (
               <SortableStageCard 
                 key={feature.id} 
                 feature={feature} 
                 onClick={() => onFeatureClick(feature)} 
               />
             ))}
           </SortableContext>
        ) : (
          features.map(feature => (
            <StageCard 
              key={feature.id} 
              feature={feature} 
              onClick={() => onFeatureClick(feature)} 
            />
          ))
        )}
      </div>
    </div>
  );
};

export default StageColumn;
