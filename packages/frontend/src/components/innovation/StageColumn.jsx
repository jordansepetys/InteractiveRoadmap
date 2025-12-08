import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import InnovationCard from './InnovationCard';

// Stage descriptions for tooltips
const STAGE_DESCRIPTIONS = {
  'Intake': 'Raw ideas with minimal details captured. Starting point for all new concepts.',
  'Triage': 'Quick screening pass to assess viability and determine if worth pursuing.',
  'Discovery': 'Research phase: interviews, rough sizing, risk assessment, and validation.',
  'Ready for Build': 'Fully scoped with sufficient detail for a team to begin work.',
  'In Flight': 'Actively being executed by a delivery team.',
  'Parked': 'Interesting idea but deprioritized for now. May revisit later.',
  'Rejected': 'Explicitly declined. Rejection reason documented for future reference.'
};

const StageColumn = ({ stage, items, colors, onItemClick }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
  });

  return (
    <div
      className={`flex flex-col w-72 flex-shrink-0 rounded-lg ${colors.bg} border ${colors.border} ${
        isOver ? 'ring-2 ring-blue-400' : ''
      }`}
    >
      {/* Column Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${colors.border}`}>
        <div className="flex items-center gap-2 group">
          <h3 className={`text-sm font-semibold ${colors.text}`}>
            {stage}
          </h3>
          <div className="relative">
            <svg
              className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 cursor-help"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="absolute left-0 top-6 w-52 p-2 bg-slate-800 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
              {STAGE_DESCRIPTIONS[stage]}
            </div>
          </div>
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colors.badge} ${colors.text}`}>
            {items.length}
          </span>
        </div>
      </div>

      {/* Cards Container */}
      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px]"
      >
        <SortableContext
          items={items.map(item => item.id)}
          strategy={verticalListSortingStrategy}
        >
          {items.map(item => (
            <InnovationCard
              key={item.id}
              item={item}
              onClick={() => onItemClick(item)}
            />
          ))}
        </SortableContext>

        {items.length === 0 && (
          <div className="flex items-center justify-center h-24 text-xs text-slate-400">
            Drop items here
          </div>
        )}
      </div>
    </div>
  );
};

export default StageColumn;
