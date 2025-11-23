import { useMemo } from 'react';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

function KanbanCard({ item, getAdoUrl }) {
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
  const priority = item.fields['Microsoft.VSTS.Common.Priority'];

  const priorityColors = {
    1: 'border-l-red-500',
    2: 'border-l-orange-500',
    3: 'border-l-yellow-500',
    4: 'border-l-gray-500'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-lg shadow-sm border-l-4 ${priorityColors[priority] || 'border-l-gray-300'} p-4 mb-3 cursor-move hover:shadow-md transition-all`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-lg">{workItemTypeIcons[type] || '📋'}</span>
        <span className="text-xs text-gray-500">#{item.id}</span>
      </div>

      <h4 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
        {title}
      </h4>

      <div className="flex items-center justify-between text-xs text-gray-600">
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          {assignee}
        </span>

        {priority && (
          <span className="px-2 py-0.5 bg-gray-100 rounded-full font-medium">
            P{priority}
          </span>
        )}
      </div>

      <a
        href={getAdoUrl(item.id)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="mt-3 text-xs text-blue-600 hover:text-blue-800 block"
      >
        View in ADO →
      </a>
    </div>
  );
}

function KanbanColumn({ state, items, getAdoUrl }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${state}`,
  });

  const stateColors = {
    'New': 'bg-blue-100 text-blue-800',
    'To Do': 'bg-blue-100 text-blue-800',
    'Active': 'bg-orange-100 text-orange-800',
    'In Progress': 'bg-orange-100 text-orange-800',
    'Resolved': 'bg-green-100 text-green-800',
    'Done': 'bg-green-100 text-green-800',
    'Closed': 'bg-gray-100 text-gray-800'
  };

  return (
    <div className={`bg-gray-50 rounded-lg p-4 min-h-[500px] flex flex-col transition-colors ${isOver ? 'ring-2 ring-blue-400 bg-blue-50' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{state}</h3>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${stateColors[state] || 'bg-gray-100 text-gray-800'}`}>
          {items.length}
        </span>
      </div>

      <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="flex-1 min-h-[400px]">
          {items.map((item) => (
            <KanbanCard key={item.id} item={item} getAdoUrl={getAdoUrl} />
          ))}

          {items.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              Drop items here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export default function KanbanView({ items, getAdoUrl, onRefresh, processTemplate = 'Basic' }) {
  const [activeId, setActiveId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before starting drag
      },
    })
  );

  // Define default states based on process template
  const getDefaultStates = (template) => {
    switch (template) {
      case 'Basic':
        return ['To Do', 'Doing', 'Done'];
      case 'Agile':
        return ['New', 'Active', 'Resolved', 'Closed'];
      case 'Scrum':
        return ['New', 'Approved', 'Committed', 'Done'];
      case 'CMMI':
        return ['Proposed', 'Active', 'Resolved', 'Closed'];
      default:
        return ['To Do', 'Doing', 'Done']; // Default to Basic
    }
  };

  // Group items by state
  const columns = useMemo(() => {
    const grouped = {};
    const defaultStates = getDefaultStates(processTemplate);

    // Get all unique states from items
    const states = new Set(items.map(item => item.fields['System.State']));

    // Initialize columns with states from items
    states.forEach(state => {
      grouped[state] = [];
    });

    // Add default states if they don't exist
    defaultStates.forEach(state => {
      if (!grouped[state]) {
        grouped[state] = [];
      }
    });

    // Group items
    items.forEach(item => {
      const state = item.fields['System.State'];
      if (grouped[state]) {
        grouped[state].push(item);
      }
    });

    // Remove empty columns (except default states)
    Object.keys(grouped).forEach(state => {
      if (grouped[state].length === 0 && !defaultStates.includes(state)) {
        delete grouped[state];
      }
    });

    return grouped;
  }, [items, processTemplate]);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
    setIsDragging(true);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    console.log('Drag ended:', { active: active?.id, over: over?.id });

    setActiveId(null);
    setIsDragging(false);

    if (!over) {
      console.log('No drop target detected');
      return;
    }

    const activeItem = items.find(item => item.id === active.id);
    if (!activeItem) {
      console.log('Active item not found:', active.id);
      return;
    }

    // Determine target state
    let targetState = null;

    // Check if dropped on a column
    if (over.id.toString().startsWith('column-')) {
      targetState = over.id.toString().replace('column-', '');
      console.log('Dropped on column:', targetState);
    } else {
      // Dropped on a card - find which column that card belongs to
      targetState = Object.keys(columns).find(state =>
        columns[state].some(item => item.id === over.id)
      );
      console.log('Dropped on card, target state:', targetState);
    }

    if (!targetState) {
      console.log('Could not determine target state');
      return;
    }

    const currentState = activeItem.fields['System.State'];
    console.log(`Current state: ${currentState}, Target state: ${targetState}`);

    if (currentState !== targetState) {
      try {
        console.log(`Updating work item #${activeItem.id} to state: ${targetState}`);

        // Update work item state in ADO
        await axios.patch(`/api/ado/work-items/${activeItem.id}/update`, {
          state: targetState
        });

        console.log(`✅ Moved work item #${activeItem.id} from "${currentState}" to "${targetState}"`);

        // Refresh backlog
        if (onRefresh) {
          onRefresh();
        }
      } catch (error) {
        console.error('Failed to move work item:', error);
        toast.error(`Failed to move work item: ${error.response?.data?.error || error.message}`);
      }
    } else {
      console.log('Same state, no update needed');
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setIsDragging(false);
  };

  const activeItem = activeId ? items.find(item => item.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(columns).map(([state, stateItems]) => (
          <KanbanColumn
            key={state}
            state={state}
            items={stateItems}
            getAdoUrl={getAdoUrl}
          />
        ))}
      </div>

      <DragOverlay>
        {activeItem ? (
          <div className="opacity-90">
            <KanbanCard item={activeItem} getAdoUrl={getAdoUrl} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
