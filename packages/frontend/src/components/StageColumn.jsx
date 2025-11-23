import React, { useState } from 'react';
import FeatureCard from './FeatureCard';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Glassmorphism design with transparent colors
const stageStyles = {
  'Intake': {
    bg: 'bg-white/60 backdrop-blur-md',
    border: 'border-white/30',
    headerBg: 'bg-white/50 backdrop-blur-sm',
    headerText: 'text-slate-900',
    countText: 'text-slate-600',
    emptyText: 'text-slate-300'
  },
  'Discovery': {
    bg: 'bg-white/60 backdrop-blur-md',
    border: 'border-white/30',
    headerBg: 'bg-white/50 backdrop-blur-sm',
    headerText: 'text-slate-900',
    countText: 'text-slate-600',
    emptyText: 'text-slate-300'
  },
  'Development': {
    bg: 'bg-red-500/10 backdrop-blur-md',
    border: 'border-red-300/30',
    headerBg: 'bg-red-500/20 backdrop-blur-sm',
    headerText: 'text-red-900',
    countText: 'text-red-700',
    emptyText: 'text-red-200'
  },
  'Testing': {
    bg: 'bg-white/60 backdrop-blur-md',
    border: 'border-white/30',
    headerBg: 'bg-white/50 backdrop-blur-sm',
    headerText: 'text-slate-900',
    countText: 'text-slate-600',
    emptyText: 'text-slate-300'
  },
  'Complete': {
    bg: 'bg-white/60 backdrop-blur-md',
    border: 'border-white/30',
    headerBg: 'bg-white/50 backdrop-blur-sm',
    headerText: 'text-slate-900',
    countText: 'text-slate-600',
    emptyText: 'text-slate-300'
  }
};

// Sortable wrapper for FeatureCard
const SortableFeatureCard = ({ feature, onClick }) => {
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
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <FeatureCard feature={feature} onClick={onClick} />
    </div>
  );
};

const StageColumn = ({ stage, features, count, onFeatureClick, onReorder }) => {
  const style = stageStyles[stage] || stageStyles['Intake'];
  const isCollapsible = stage === 'Intake' || stage === 'Complete';
  const isDraggable = stage === 'Intake';
  const [isCollapsed, setIsCollapsed] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const toggleCollapse = () => {
    if (isCollapsible) {
      setIsCollapsed(!isCollapsed);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = features.findIndex((f) => f.id === active.id);
      const newIndex = features.findIndex((f) => f.id === over.id);

      const reorderedFeatures = arrayMove(features, oldIndex, newIndex);

      // Call parent callback with reordered features
      if (onReorder) {
        onReorder(reorderedFeatures);
      }
    }
  };

  return (
    <div className={`${style.bg} border ${style.border} ${isCollapsed ? 'min-h-0' : 'min-h-[600px]'} flex flex-col rounded-2xl shadow-lg`}>
      {/* Stage Header */}
      <div className={`px-6 py-4 ${style.headerBg} border-b ${style.border} ${isCollapsible ? 'cursor-pointer hover:brightness-110' : ''} transition-all`} onClick={toggleCollapse}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className={`font-medium ${style.headerText} text-sm uppercase tracking-wide`}>{stage}</h3>
            {isCollapsible && (
              <svg
                className={`w-4 h-4 ${style.headerText} transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </div>
          <span className={`${style.countText} text-xs font-medium`}>
            {count}
          </span>
        </div>
      </div>

      {/* Feature Cards */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {features.length === 0 ? (
            <div className={`text-center ${style.emptyText} text-sm mt-16`}>
              —
            </div>
          ) : isDraggable ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={features.map(f => f.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {features.map((feature) => (
                    <SortableFeatureCard
                      key={feature.id}
                      feature={feature}
                      onClick={() => onFeatureClick(feature)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            features.map((feature) => (
              <FeatureCard
                key={feature.id}
                feature={feature}
                onClick={() => onFeatureClick(feature)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default StageColumn;
