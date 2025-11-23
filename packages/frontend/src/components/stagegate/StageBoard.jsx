import React from 'react';
import StageColumn from './StageColumn';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
  arrayMove,
} from '@dnd-kit/sortable';
import StageCard from './StageCard';

const StageBoard = ({ groupedFeatures, counts, stages, onFeatureClick, onReorder }) => {
  const [activeId, setActiveId] = React.useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    // Find the feature objects
    // Note: This logic assumes we are reordering within the "Intake" column primarily
    // If we want to move between columns, we need to check if 'over.id' is a column ID or card ID
    
    // Simplification for MVP: Only support reordering inside the same list for now
    if (active.id !== over.id) {
       // Logic to find source and dest lists would go here
       // For now, we will rely on the parent to handle the actual arrayMove logic 
       // if we pass up the indices or IDs
       onReorder(active.id, over.id);
    }
  };

  // Helper to find the feature being dragged for the overlay
  const findActiveFeature = () => {
    if (!activeId) return null;
    for (const stage of stages) {
      const feature = groupedFeatures[stage]?.find(f => f.id === activeId);
      if (feature) return feature;
    }
    return null;
  };

  const activeFeature = findActiveFeature();

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCenter} 
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full gap-6 overflow-x-auto pb-4 px-2 snap-x">
        {stages.map((stage) => (
          <StageColumn
            key={stage}
            stage={stage}
            features={groupedFeatures[stage] || []}
            // Only make Intake draggable for now as requested in original logic
            isDroppableArea={stage === 'Intake'} 
            onFeatureClick={onFeatureClick}
          />
        ))}
      </div>

      <DragOverlay>
        {activeFeature ? <StageCard feature={activeFeature} /> : null}
      </DragOverlay>
    </DndContext>
  );
};

export default StageBoard;
