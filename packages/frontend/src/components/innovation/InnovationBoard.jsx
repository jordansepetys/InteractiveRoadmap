import React, { useState } from 'react';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { toast } from 'react-hot-toast';
import useInnovationStore, { INNOVATION_STAGES, STAGE_COLORS } from '../../stores/innovationStore';
import StageColumn from './StageColumn';
import InnovationCard from './InnovationCard';

const InnovationBoard = () => {
  const { getFilteredGrouped, moveStage, selectItem } = useInnovationStore();
  const [activeItem, setActiveItem] = useState(null);
  const [showRejectionModal, setShowRejectionModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const grouped = getFilteredGrouped();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event) => {
    const { active } = event;
    const item = Object.values(grouped)
      .flat()
      .find(i => i.id === active.id);
    setActiveItem(item);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveItem(null);

    if (!over) return;

    const itemId = active.id;
    const newStage = over.id;

    // Find the item
    const item = Object.values(grouped)
      .flat()
      .find(i => i.id === itemId);

    if (!item || item.stage === newStage) return;

    // If moving to Rejected, show reason modal
    if (newStage === 'Rejected') {
      setShowRejectionModal({ itemId, item });
      return;
    }

    // Move the item
    const result = await moveStage(itemId, newStage);
    if (result.success) {
      toast.success(`Moved to ${newStage}`);
    } else {
      toast.error(result.error || 'Failed to move item');
    }
  };

  const handleRejectConfirm = async () => {
    if (!showRejectionModal) return;

    const result = await moveStage(
      showRejectionModal.itemId,
      'Rejected',
      rejectionReason
    );

    if (result.success) {
      toast.success('Item rejected');
    } else {
      toast.error(result.error || 'Failed to reject item');
    }

    setShowRejectionModal(null);
    setRejectionReason('');
  };

  return (
    <div className="h-full overflow-x-auto">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 p-6 h-full min-w-max">
          {INNOVATION_STAGES.map(stage => (
            <StageColumn
              key={stage}
              stage={stage}
              items={grouped[stage] || []}
              colors={STAGE_COLORS[stage]}
              onItemClick={selectItem}
            />
          ))}
        </div>

        <DragOverlay>
          {activeItem && (
            <InnovationCard
              item={activeItem}
              isDragging
            />
          )}
        </DragOverlay>
      </DndContext>

      {/* Rejection Reason Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Reject Item
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              Please provide a reason for rejecting "{showRejectionModal.item.title}"
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Reason for rejection..."
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              rows={3}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowRejectionModal(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InnovationBoard;
