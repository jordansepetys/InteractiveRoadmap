import React from 'react';

const FeatureCard = ({ feature, onClick }) => {
  return (
    <div
      className="bg-white border border-slate-200 rounded-lg p-4 cursor-pointer hover:border-red-600 hover:shadow-md transition-all"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs text-slate-500 font-medium">#{feature.id}</span>
        <span className="text-xs text-slate-600 font-medium">
          {feature.state}
        </span>
      </div>

      <h4 className="text-sm text-slate-900 mb-3 line-clamp-2 leading-relaxed">
        {feature.title}
      </h4>

      {feature.assignedTo && feature.assignedTo !== 'Unassigned' && (
        <div className="text-xs text-slate-500 truncate">
          {feature.assignedTo}
        </div>
      )}
    </div>
  );
};

export default FeatureCard;
