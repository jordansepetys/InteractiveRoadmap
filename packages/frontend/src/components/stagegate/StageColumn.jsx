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

// Stage descriptions for tooltips
const STAGE_DESCRIPTIONS = {
  'Intake': 'Features awaiting initial review and prioritization',
  'Discovery': 'Features being researched, scoped, and estimated',
  'Development': 'Features actively being built by the team',
  'Testing': 'Features in QA, validation, and user acceptance',
  'Complete': 'Features delivered and released to production'
};

const StageColumn = ({ stage, features, isDroppableArea = false, onFeatureClick }) => {
  const { setNodeRef } = useDroppable({
    id: stage,
  });

  return (
    <div className="flex-shrink-0 w-80 flex flex-col h-full max-h-full">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 px-1 group">
        <div className="flex items-center gap-1.5">
          <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wider">
            {stage}
          </h3>
          <div className="relative">
            <svg
              className="w-3.5 h-3.5 text-slate-400 cursor-help"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              title={STAGE_DESCRIPTIONS[stage]}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="absolute left-0 top-6 w-48 p-2 bg-slate-800 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              {STAGE_DESCRIPTIONS[stage]}
            </div>
          </div>
        </div>
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
