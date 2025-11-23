import React from 'react';

const WorkItemNode = ({ item, depth = 0, isExpanded, onToggle, getAdoUrl }) => {
  const hasChildren = item.children && item.children.length > 0;
  const type = item.fields['System.WorkItemType'];
  const title = item.fields['System.Title'];
  const state = item.fields['System.State'];
  const assignedTo = item.fields['System.AssignedTo']?.displayName || 'Unassigned';
  const priority = item.fields['Microsoft.VSTS.Common.Priority'];

  const typeIcons = {
    'Epic': '📦',
    'Feature': '⭐',
    'User Story': '📖',
    'Issue': '📋',
    'Task': '✓',
    'Bug': '🐛'
  };

  const typeColors = {
    'Epic': 'text-purple-600 bg-purple-50',
    'Feature': 'text-blue-600 bg-blue-50',
    'User Story': 'text-green-600 bg-green-50',
    'Issue': 'text-cyan-600 bg-cyan-50',
    'Task': 'text-yellow-600 bg-yellow-50',
    'Bug': 'text-red-600 bg-red-50'
  };

  return (
    <div className="group">
      {/* Row Node */}
      <div 
        className={`
          flex items-center py-2 px-2 hover:bg-slate-50 border-b border-slate-100 transition-colors
          ${depth === 0 ? 'bg-white' : ''}
        `}
        style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
      >
        {/* Expand/Collapse Toggle */}
        <div 
          className={`w-6 h-6 flex items-center justify-center mr-2 cursor-pointer text-slate-400 hover:text-slate-600 rounded hover:bg-slate-200/50 ${!hasChildren ? 'invisible' : ''}`}
          onClick={() => hasChildren && onToggle(item.id)}
        >
          <svg 
            className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>

        {/* Type Icon */}
        <span 
          className={`
            flex-shrink-0 w-6 h-6 flex items-center justify-center rounded mr-3 text-xs
            ${typeColors[type] || 'text-slate-500 bg-slate-100'}
          `}
          title={type}
        >
          {typeIcons[type] || '•'}
        </span>

        {/* ID & Title */}
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400 w-12 flex-shrink-0">#{item.id}</span>
          <span className="text-sm text-slate-700 font-medium truncate cursor-default" title={title}>{title}</span>
        </div>

        {/* Metadata Columns (Hidden on small screens) */}
        <div className="hidden md:flex items-center gap-6 text-xs text-slate-500 ml-4">
           {/* State Badge */}
           <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium min-w-[80px] text-center">
            {state}
          </span>

          {/* Priority */}
          <span className={`w-16 ${priority === 1 ? 'text-red-600 font-bold' : ''}`}>
            {priority ? `P${priority}` : '-'}
          </span>

          {/* Assignee */}
          <div className="flex items-center gap-1.5 w-32 truncate">
            <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-500">
              {assignedTo.charAt(0)}
            </div>
            <span className="truncate">{assignedTo}</span>
          </div>
          
          {/* Link */}
          <a
            href={getAdoUrl(item.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50 transition-colors"
            title="Open in Azure DevOps"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>

      {/* Children Recursion */}
      {isExpanded && hasChildren && (
        <div>
          {item.children.map(child => (
            <WorkItemNode
              key={child.id}
              item={child}
              depth={depth + 1}
              isExpanded={isExpanded} // In a real tree this would be granular
              onToggle={onToggle}
              getAdoUrl={getAdoUrl}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkItemNode;
