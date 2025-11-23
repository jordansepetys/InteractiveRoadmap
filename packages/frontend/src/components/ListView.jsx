import { useState } from 'react';

export default function ListView({ items, onItemClick, getAdoUrl }) {
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });

  const workItemTypeIcons = {
    'Epic': '📦',
    'Feature': '⭐',
    'User Story': '📖',
    'Issue': '📋',
    'Task': '✓',
    'Bug': '🐛'
  };

  const priorityColors = {
    1: 'text-red-600',
    2: 'text-orange-600',
    3: 'text-yellow-600',
    4: 'text-gray-600'
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedItems = () => {
    const sortedItems = [...items];

    sortedItems.sort((a, b) => {
      let aVal, bVal;

      switch (sortConfig.key) {
        case 'id':
          aVal = a.id;
          bVal = b.id;
          break;
        case 'type':
          aVal = a.fields['System.WorkItemType'];
          bVal = b.fields['System.WorkItemType'];
          break;
        case 'title':
          aVal = a.fields['System.Title'];
          bVal = b.fields['System.Title'];
          break;
        case 'state':
          aVal = a.fields['System.State'];
          bVal = b.fields['System.State'];
          break;
        case 'assignee':
          aVal = a.fields['System.AssignedTo']?.displayName || 'Unassigned';
          bVal = b.fields['System.AssignedTo']?.displayName || 'Unassigned';
          break;
        case 'priority':
          aVal = a.fields['Microsoft.VSTS.Common.Priority'] || 999;
          bVal = b.fields['Microsoft.VSTS.Common.Priority'] || 999;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sortedItems;
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    return sortConfig.direction === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              onClick={() => handleSort('id')}
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
            >
              <div className="flex items-center gap-2">
                ID
                <SortIcon columnKey="id" />
              </div>
            </th>
            <th
              onClick={() => handleSort('type')}
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
            >
              <div className="flex items-center gap-2">
                Type
                <SortIcon columnKey="type" />
              </div>
            </th>
            <th
              onClick={() => handleSort('title')}
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
            >
              <div className="flex items-center gap-2">
                Title
                <SortIcon columnKey="title" />
              </div>
            </th>
            <th
              onClick={() => handleSort('state')}
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
            >
              <div className="flex items-center gap-2">
                State
                <SortIcon columnKey="state" />
              </div>
            </th>
            <th
              onClick={() => handleSort('assignee')}
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
            >
              <div className="flex items-center gap-2">
                Assigned To
                <SortIcon columnKey="assignee" />
              </div>
            </th>
            <th
              onClick={() => handleSort('priority')}
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
            >
              <div className="flex items-center gap-2">
                Priority
                <SortIcon columnKey="priority" />
              </div>
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {getSortedItems().map((item) => {
            const type = item.fields['System.WorkItemType'];
            const title = item.fields['System.Title'];
            const state = item.fields['System.State'];
            const assignee = item.fields['System.AssignedTo']?.displayName || 'Unassigned';
            const priority = item.fields['Microsoft.VSTS.Common.Priority'];

            return (
              <tr
                key={item.id}
                onClick={() => onItemClick && onItemClick(item)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  #{item.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <span className="text-lg">{workItemTypeIcons[type] || '📋'}</span>
                    {type}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
                  {title}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {state}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {assignee}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {priority ? (
                    <span className={`font-medium ${priorityColors[priority] || 'text-gray-600'}`}>
                      P{priority}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <a
                    href={getAdoUrl(item.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {items.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No work items found
        </div>
      )}
    </div>
  );
}
