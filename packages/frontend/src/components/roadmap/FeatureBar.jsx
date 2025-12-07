import React from 'react';
import { useTimeline } from '../../hooks/useTimeline';

const FeatureBar = ({ feature, color, onClick }) => {
  const { calculatePosition } = useTimeline();
  const position = calculatePosition(feature.startDate, feature.targetDate);

  if (!position || !position.isVisible) return null;

  const progress = feature.progress || { percentage: 0, completedEffort: 0, totalEffort: 0 };
  const hasProgress = progress.totalEffort > 0;

  // Build tooltip with progress info
  const tooltipText = hasProgress
    ? `${feature.title} (${feature.state}) - ${progress.percentage}% complete (${progress.completedEffort}/${progress.totalEffort} effort)`
    : `${feature.title} (${feature.state})`;

  return (
    <div className="relative h-10 mb-2 first:mt-0">
      <div
        className={`absolute h-full ${color.bg} ${color.hover} cursor-pointer transition-all rounded-md border ${color.border} shadow-sm hover:shadow-md flex items-center justify-between px-3 group overflow-hidden`}
        style={{
          left: `${position.left}%`,
          width: `${position.width}%`
        }}
        onClick={() => onClick(feature)}
        title={tooltipText}
      >
        {/* Progress fill overlay */}
        {hasProgress && progress.percentage > 0 && (
          <div
            className="absolute inset-0 bg-green-500/40 rounded-l-md transition-all"
            style={{
              width: `${progress.percentage}%`,
              borderTopRightRadius: progress.percentage >= 100 ? '0.375rem' : 0,
              borderBottomRightRadius: progress.percentage >= 100 ? '0.375rem' : 0
            }}
          />
        )}
        {/* Feature title - positioned above progress fill */}
        <span className="relative z-10 text-white text-xs font-semibold truncate tracking-wide mr-2">
          {feature.title}
        </span>
        {/* Progress percentage indicator */}
        {hasProgress && (
          <span className="relative z-10 text-white/90 text-[10px] font-medium whitespace-nowrap">
            {progress.percentage}%
          </span>
        )}
      </div>
    </div>
  );
};

export default FeatureBar;
