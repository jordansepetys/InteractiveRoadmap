import React from 'react';
import { useTimeline } from '../../hooks/useTimeline';

const TimelineHeader = () => {
  const { months } = useTimeline();

  return (
    <div className="mb-6 sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm pt-4 pb-2 border-b border-slate-200">
      <div className="flex items-center justify-between px-4">
        {months.map((month, idx) => (
          <div key={month.key} className="flex-1 text-center min-w-0 border-l border-slate-100 first:border-l-0">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide truncate block px-1">
              {month.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimelineHeader;
