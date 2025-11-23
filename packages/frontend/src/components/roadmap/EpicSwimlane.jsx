import React, { useState } from 'react';
import FeatureBar from './FeatureBar';

const EpicSwimlane = ({ epic, features, colorIndex, onFeatureClick }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Assign different blue-gray shades
  const colors = [
    { bg: 'bg-slate-600', hover: 'hover:bg-slate-700', border: 'border-slate-500', pill: 'bg-slate-100 text-slate-700' },
    { bg: 'bg-blue-600', hover: 'hover:bg-blue-700', border: 'border-blue-500', pill: 'bg-blue-50 text-blue-700' },
    { bg: 'bg-indigo-600', hover: 'hover:bg-indigo-700', border: 'border-indigo-500', pill: 'bg-indigo-50 text-indigo-700' },
    { bg: 'bg-teal-600', hover: 'hover:bg-teal-700', border: 'border-teal-500', pill: 'bg-teal-50 text-teal-700' },
  ];
  const color = colors[colorIndex % colors.length];

  if (!features || features.length === 0) return null;

  return (
    <div className="mb-4 rounded border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Epic Header */}
      <div 
        className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <button className="text-slate-400 hover:text-slate-600">
             <svg 
              className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-500">#{epic ? epic.id : '—'}</span>
            <h3 className="text-xs font-bold text-slate-800">{epic ? epic.title : 'Orphaned Features'}</h3>
          </div>
        </div>
        <span className="text-[10px] text-slate-500 font-medium">
          {features.length} items
        </span>
      </div>

      {/* Swimlane Content */}
      {isExpanded && (
        <div className="p-2 relative min-h-[40px] bg-white">
          <div className="relative space-y-1">
            {features.map((feature) => (
              <FeatureBar 
                key={feature.id} 
                feature={feature} 
                color={color} 
                onClick={onFeatureClick} 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EpicSwimlane;
