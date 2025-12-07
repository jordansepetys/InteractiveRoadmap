import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { differenceInDays, parseISO } from 'date-fns';

const InnovationCard = ({ item, onClick, isDragging = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  // Calculate days in current stage
  const daysInStage = item.stage_changed_at
    ? differenceInDays(new Date(), parseISO(item.stage_changed_at))
    : 0;

  // Get health color based on days in stage
  const getHealthColor = () => {
    if (item.stage === 'Rejected' || item.stage === 'Parked') return 'bg-slate-300';
    if (daysInStage > 30) return 'bg-red-400';
    if (daysInStage > 14) return 'bg-amber-400';
    if (daysInStage > 7) return 'bg-yellow-400';
    return 'bg-green-400';
  };

  // Get RICE score color
  const getRiceColor = () => {
    if (!item.rice_score) return 'text-slate-400 bg-slate-100';
    if (item.rice_score >= 15) return 'text-green-700 bg-green-100';
    if (item.rice_score >= 5) return 'text-amber-700 bg-amber-100';
    return 'text-red-700 bg-red-100';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`bg-white rounded-lg border border-slate-200 p-3 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all ${
        isDragging ? 'shadow-lg rotate-2' : ''
      }`}
    >
      {/* Top Row: ID, Category, ADO Link */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-400">#{item.id}</span>
        <div className="flex items-center gap-2">
          {item.category && (
            <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 rounded">
              {item.category}
            </span>
          )}
          {item.ado_feature_id && (
            <span className="text-blue-500" title={`Linked to ADO Feature #${item.ado_feature_id}`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <h4 className="text-sm font-medium text-slate-900 line-clamp-2 mb-2">
        {item.title}
      </h4>

      {/* Owner */}
      {item.owner && (
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center text-[10px] font-medium text-slate-600">
            {item.owner.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <span className="text-xs text-slate-500 truncate">{item.owner}</span>
        </div>
      )}

      {/* Bottom Row: RICE Score, Days in Stage */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        {/* RICE Score */}
        <div className={`px-2 py-0.5 text-xs font-medium rounded ${getRiceColor()}`}>
          {item.rice_score !== null ? `RICE: ${item.rice_score.toFixed(1)}` : 'No RICE'}
        </div>

        {/* Days in Stage */}
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${getHealthColor()}`}></div>
          <span className="text-[10px] text-slate-400">
            {daysInStage}d
          </span>
        </div>
      </div>

      {/* Rejection Reason (if rejected) */}
      {item.stage === 'Rejected' && item.rejection_reason && (
        <div className="mt-2 pt-2 border-t border-red-100">
          <p className="text-[10px] text-red-600 line-clamp-2">
            {item.rejection_reason}
          </p>
        </div>
      )}
    </div>
  );
};

export default InnovationCard;
