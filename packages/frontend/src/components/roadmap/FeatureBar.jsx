import React from 'react';
import { useTimeline } from '../../hooks/useTimeline';

const FeatureBar = ({ feature, color, onClick }) => {
  const { calculatePosition } = useTimeline();
  const position = calculatePosition(feature.startDate, feature.targetDate);

  if (!position || !position.isVisible) return null;

  return (
    <div className="relative h-10 mb-2 first:mt-0">
      <div
        className={`absolute h-full ${color.bg} ${color.hover} cursor-pointer transition-all rounded-md border ${color.border} shadow-sm hover:shadow-md flex items-center justify-between px-3 group overflow-hidden`}
        style={{
          left: `${position.left}%`,
          width: `${position.width}%`
        }}
        onClick={() => onClick(feature)}
        title={`${feature.title} (${feature.state})`}
      >
        <span className="text-white text-xs font-semibold truncate tracking-wide mr-2">
          {feature.title}
        </span>
      </div>
    </div>
  );
};

export default FeatureBar;
