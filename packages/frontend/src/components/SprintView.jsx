import { useMemo, useState } from 'react';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import axios from 'axios';
import toast from 'react-hot-toast';

function SprintCard({ item, getAdoUrl }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const workItemTypeIcons = {
    'Epic': '📦',
    'Feature': '⭐',
    'User Story': '📖',
    'Issue': '📋',
    'Task': '✓',
    'Bug': '🐛'
  };

  const type = item.fields['System.WorkItemType'];
  const title = item.fields['System.Title'];
  const assignee = item.fields['System.AssignedTo']?.displayName || 'Unassigned';
  const storyPoints = item.fields['Microsoft.VSTS.Scheduling.StoryPoints'];
  const state = item.fields['System.State'];

  const stateColors = {
    'New': 'bg-blue-50 text-blue-700',
    'To Do': 'bg-blue-50 text-blue-700',
    'Active': 'bg-orange-50 text-orange-700',
    'In Progress': 'bg-orange-50 text-orange-700',
    'Resolved': 'bg-green-50 text-green-700',
    'Done': 'bg-green-50 text-green-700'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-2 cursor-move hover:shadow-md transition-all"
    >
      <div className="flex items-start gap-2 mb-2">
        <span className="text-lg">{workItemTypeIcons[type] || '📋'}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-500">#{item.id}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${stateColors[state] || 'bg-gray-50 text-gray-700'}`}>
              {state}
            </span>
          </div>
          <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
            {title}
          </h4>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-600">
        <span className="truncate">{assignee}</span>
        {storyPoints && (
          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-medium">
            {storyPoints} pts
          </span>
        )}
      </div>
    </div>
  );
}

function SprintColumn({ title, items, description, effort, getAdoUrl, droppableId }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 min-h-[600px]">
      <div className="mb-4">
        <h3 className="font-semibold text-lg text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
        <div className="mt-2 flex items-center gap-4 text-sm">
          <span className="text-gray-700">
            <span className="font-medium">{items.length}</span> items
          </span>
          {effort > 0 && (
            <span className="text-gray-700">
              <span className="font-medium">{effort}</span> story points
            </span>
          )}
        </div>
      </div>

      <div>
        {items.map((item) => (
          <SprintCard key={item.id} item={item} getAdoUrl={getAdoUrl} />
        ))}

        {items.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm border-2 border-dashed border-gray-300 rounded-lg">
            Drop items here
          </div>
        )}
      </div>
    </div>
  );
}

export default function SprintView({ items, settings, getAdoUrl, onRefresh }) {
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Split items into backlog and current sprint
  const { backlogItems, sprintItems } = useMemo(() => {
    const backlog = [];
    const sprint = [];

    const currentIteration = settings?.iteration_path || '';

    items.forEach(item => {
      const itemIteration = item.fields['System.IterationPath'] || '';

      if (currentIteration && itemIteration === currentIteration) {
        sprint.push(item);
      } else {
        backlog.push(item);
      }
    });

    return { backlogItems: backlog, sprintItems: sprint };
  }, [items, settings]);

  // Calculate effort
  const backlogEffort = backlogItems.reduce((sum, item) =>
    sum + (item.fields['Microsoft.VSTS.Scheduling.StoryPoints'] || 0), 0
  );

  const sprintEffort = sprintItems.reduce((sum, item) =>
    sum + (item.fields['Microsoft.VSTS.Scheduling.StoryPoints'] || 0), 0
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    setActiveId(null);

    if (!over) return;

    const activeItem = items.find(item => item.id === active.id);
    if (!activeItem) return;

    const currentIteration = activeItem.fields['System.IterationPath'] || '';
    const targetIteration = settings?.iteration_path || '';

    // Determine if item should move to sprint or backlog
    const isInSprint = currentIteration === targetIteration;
    const shouldMoveToSprint = over.id === 'sprint-column' || sprintItems.some(item => item.id === over.id);

    if (isInSprint && !shouldMoveToSprint) {
      // Move to backlog (remove iteration)
      try {
        await axios.patch(`/api/ado/work-items/${activeItem.id}/update`, {
          iterationPath: '' // Remove from sprint
        });

        console.log(`✅ Moved work item #${activeItem.id} to backlog`);

        if (onRefresh) {
          onRefresh();
        }
      } catch (error) {
        console.error('Failed to move work item:', error);
        toast.error(`Failed to move work item: ${error.response?.data?.error || error.message}`);
      }
    } else if (!isInSprint && shouldMoveToSprint) {
      // Move to sprint
      try {
        await axios.patch(`/api/ado/work-items/${activeItem.id}/move`, {
          iterationPath: targetIteration,
          state: 'Active' // Optionally activate when moving to sprint
        });

        console.log(`✅ Moved work item #${activeItem.id} to sprint`);

        if (onRefresh) {
          onRefresh();
        }
      } catch (error) {
        console.error('Failed to move work item:', error);
        toast.error(`Failed to move work item: ${error.response?.data?.error || error.message}`);
      }
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activeItem = activeId ? items.find(item => item.id === activeId) : null;

  if (!settings?.iteration_path) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <svg className="w-12 h-12 text-yellow-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-yellow-800 font-medium mb-2">No iteration/sprint configured</p>
        <p className="text-yellow-700 text-sm">
          Please configure an iteration path in Settings to use Sprint Planning view
        </p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SprintColumn
          title="Backlog"
          description="Items not assigned to current sprint"
          items={backlogItems}
          effort={backlogEffort}
          getAdoUrl={getAdoUrl}
          droppableId="backlog-column"
        />

        <SprintColumn
          title={`Current Sprint: ${settings?.iteration_path?.split('\\').pop() || 'Sprint'}`}
          description="Items committed for this sprint"
          items={sprintItems}
          effort={sprintEffort}
          getAdoUrl={getAdoUrl}
          droppableId="sprint-column"
        />
      </div>

      <DragOverlay>
        {activeItem ? (
          <div className="opacity-90">
            <SprintCard item={activeItem} getAdoUrl={getAdoUrl} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
