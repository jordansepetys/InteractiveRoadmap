import React, { useMemo } from 'react';
import { differenceInDays, parseISO } from 'date-fns';

const StageCard = ({ feature, onClick }) => {
  const { title, state, changedDate, createdDate, id } = feature;

  // Calculate Health
  const daysInState = useMemo(() => {
    if (!changedDate) return 0;
    return differenceInDays(new Date(), parseISO(changedDate));
  }, [changedDate]);

  const health = useMemo(() => {
    if (daysInState > 30) return 'critical';
    if (daysInState > 14) return 'warning';
    return 'healthy';
  }, [daysInState]);

  const healthColors = {
    critical: 'border-l-red-500',
    warning: 'border-l-amber-400',
    healthy: 'border-l-emerald-400', 
  };

  const badgeColors = {
    critical: 'text-red-700 bg-red-50 ring-1 ring-red-600/10',
    warning: 'text-amber-700 bg-amber-50 ring-1 ring-amber-600/10',
    healthy: 'text-slate-500',
  };

  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded border border-slate-200 border-l-4 shadow-sm hover:border-blue-400 transition-all p-3 cursor-pointer ${healthColors[health]}`}
    >
      <div className="flex justify-between items-start mb-1.5">
        <span className="text-[10px] font-mono text-slate-500">#{id}</span>
        {daysInState > 7 && (
          <span className={`text-[10px] font-medium px-1.5 rounded-sm ${badgeColors[health]}`}>
            {daysInState}d
          </span>
        )}
      </div>
      
      <h4 className="text-xs font-semibold text-slate-900 mb-2 leading-snug line-clamp-3">
        {title}
      </h4>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
           <div className="w-4 h-4 rounded bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-500 border border-slate-200">
             U
           </div>
        </div>
        <span className="text-[10px] text-slate-500 font-medium">
          {state}
        </span>
      </div>
    </div>
  );
};

export default StageCard;
