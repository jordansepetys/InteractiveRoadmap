import React, { useState } from 'react';
import { differenceInDays, parseISO, format } from 'date-fns';
import useInnovationStore, { STAGE_COLORS } from '../../stores/innovationStore';

const InnovationList = () => {
  const { getFilteredItems, selectItem } = useInnovationStore();
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');

  const items = getFilteredItems();

  // Sort items
  const sortedItems = [...items].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    // Handle nulls
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;

    // Handle dates
    if (sortField.includes('_at') || sortField.includes('date')) {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }

    // Handle strings
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortHeader = ({ field, label, className = '' }) => (
    <th
      onClick={() => handleSort(field)}
      className={`px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 ${className}`}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortField === field && (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {sortDirection === 'asc' ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            )}
          </svg>
        )}
      </div>
    </th>
  );

  const getDaysInStage = (item) => {
    return item.stage_changed_at
      ? differenceInDays(new Date(), parseISO(item.stage_changed_at))
      : 0;
  };

  const getHealthColor = (item) => {
    const days = getDaysInStage(item);
    if (item.stage === 'Rejected' || item.stage === 'Parked') return 'bg-slate-300';
    if (days > 30) return 'bg-red-400';
    if (days > 14) return 'bg-amber-400';
    if (days > 7) return 'bg-yellow-400';
    return 'bg-green-400';
  };

  const getRiceColor = (score) => {
    if (score === null || score === undefined) return 'text-slate-400 bg-slate-100';
    if (score >= 15) return 'text-green-700 bg-green-100';
    if (score >= 5) return 'text-amber-700 bg-amber-100';
    return 'text-red-700 bg-red-100';
  };

  return (
    <div className="h-full overflow-auto">
      <table className="w-full">
        <thead className="bg-slate-50 sticky top-0 z-10">
          <tr className="border-b border-slate-200">
            <SortHeader field="id" label="ID" className="w-16" />
            <SortHeader field="title" label="Title" className="min-w-[200px]" />
            <SortHeader field="stage" label="Stage" className="w-36" />
            <SortHeader field="owner" label="Owner" className="w-32" />
            <SortHeader field="category" label="Category" className="w-28" />
            <SortHeader field="rice_score" label="RICE" className="w-24" />
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-20">
              Days
            </th>
            <SortHeader field="created_at" label="Created" className="w-28" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sortedItems.map(item => {
            const colors = STAGE_COLORS[item.stage];
            const daysInStage = getDaysInStage(item);

            return (
              <tr
                key={item.id}
                onClick={() => selectItem(item)}
                className="hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3 text-xs text-slate-400">
                  #{item.id}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900 truncate max-w-[300px]">
                      {item.title}
                    </span>
                    {item.ado_feature_id && (
                      <span className="text-blue-500" title={`Linked to ADO #${item.ado_feature_id}`}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${colors.badge} ${colors.text}`}>
                    {item.stage}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 truncate">
                  {item.owner || '-'}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {item.category || '-'}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded ${getRiceColor(item.rice_score)}`}>
                    {item.rice_score !== null ? item.rice_score.toFixed(1) : '-'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${getHealthColor(item)}`}></div>
                    <span className="text-xs text-slate-500">{daysInStage}d</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {format(parseISO(item.created_at), 'MMM d, yyyy')}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {sortedItems.length === 0 && (
        <div className="flex items-center justify-center h-48 text-sm text-slate-400">
          No items found
        </div>
      )}
    </div>
  );
};

export default InnovationList;
