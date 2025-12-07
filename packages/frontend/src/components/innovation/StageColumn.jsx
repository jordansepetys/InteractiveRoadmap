import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import InnovationCard from './InnovationCard';

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
        <div className="flex items-center gap-2">
          <h3 className={`text-sm font-semibold ${colors.text}`}>
            {stage}
          </h3>
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
