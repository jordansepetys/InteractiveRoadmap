import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import BacklogFilters from '../components/BacklogFilters';
import ListView from '../components/ListView';
import KanbanView from '../components/KanbanView';
import SprintView from '../components/SprintView';

export default function BacklogPage() {
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped', 'list', 'kanban', 'sprint'
  const [workItems, setWorkItems] = useState([]);
  const [hierarchy, setHierarchy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [adoSettings, setAdoSettings] = useState({ orgUrl: '', project: '', iteration_path: '' });
  const [filters, setFilters] = useState({
    type: 'all',
    state: 'all',
    assignee: 'all',
    search: ''
  });

  useEffect(() => {
    fetchSettings();
    fetchBacklog();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/api/settings');
      const settings = response.data.settings || response.data;
      setAdoSettings({
        orgUrl: settings.ado_org_url || '',
        project: settings.ado_project || '',
        iteration_path: settings.iteration_path || ''
      });
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  const fetchBacklog = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('/api/ado/backlog');
      setWorkItems(response.data.workItems || []);
      setHierarchy(response.data.hierarchy || []);

      // Auto-expand all epics and features by default
      const autoExpand = new Set();
      response.data.workItems?.forEach(item => {
        const type = item.fields['System.WorkItemType'];
        if (type === 'Epic' || type === 'Feature') {
          autoExpand.add(item.id);
        }
      });
      setExpandedItems(autoExpand);
    } catch (err) {
      console.error('Failed to fetch backlog:', err);
      setError(err.response?.data?.error || 'Failed to load backlog');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters to work items
  const filteredItems = useMemo(() => {
    return workItems.filter(item => {
      const type = item.fields['System.WorkItemType'];
      const state = item.fields['System.State'];
      const assignee = item.fields['System.AssignedTo']?.displayName || 'Unassigned';
      const title = item.fields['System.Title'];

      // Type filter
      if (filters.type !== 'all' && type !== filters.type) {
        return false;
      }

      // State filter
      if (filters.state !== 'all' && state !== filters.state) {
        return false;
      }

      // Assignee filter
      if (filters.assignee !== 'all') {
        if (filters.assignee === 'unassigned' && assignee !== 'Unassigned') {
          return false;
        }
        if (filters.assignee !== 'unassigned' && assignee !== filters.assignee) {
          return false;
        }
      }

      // Search filter
      if (filters.search && !title.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [workItems, filters]);

  // Filter hierarchy based on filters
  const filteredHierarchy = useMemo(() => {
    const filterTree = (items) => {
      return items
        .map(item => ({
          ...item,
          children: item.children ? filterTree(item.children) : []
        }))
        .filter(item => {
          const hasMatchingChildren = item.children && item.children.length > 0;
          const itemMatches = filteredItems.some(fi => fi.id === item.id);
          return hasMatchingChildren || itemMatches;
        });
    };

    return filterTree(hierarchy);
  }, [hierarchy, filteredItems]);

  const toggleExpand = (itemId) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const getAdoUrl = (workItemId) => {
    if (adoSettings.orgUrl && adoSettings.project) {
      return `${adoSettings.orgUrl}/${adoSettings.project}/_workitems/edit/${workItemId}/`;
    }
    return `https://dev.azure.com/_workitems/edit/${workItemId}`;
  };

  const workItemTypeIcons = {
    'Epic': '📦',
    'Feature': '⭐',
    'User Story': '📖',
    'Issue': '📋',
    'Task': '✓',
    'Bug': '🐛'
  };

  const workItemTypeColors = {
    'Epic': 'bg-purple-100 text-purple-800 border-purple-300',
    'Feature': 'bg-blue-100 text-blue-800 border-blue-300',
    'User Story': 'bg-green-100 text-green-800 border-green-300',
    'Issue': 'bg-cyan-100 text-cyan-800 border-cyan-300',
    'Task': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'Bug': 'bg-red-100 text-red-800 border-red-300'
  };

  const stateColors = {
    'New': 'bg-blue-50 text-blue-700',
    'To Do': 'bg-blue-50 text-blue-700',
    'Active': 'bg-orange-50 text-orange-700',
    'In Progress': 'bg-orange-50 text-orange-700',
    'Resolved': 'bg-green-50 text-green-700',
    'Done': 'bg-green-50 text-green-700',
    'Closed': 'bg-gray-50 text-gray-700'
  };

  // Calculate progress for parent items
  const calculateProgress = (item) => {
    if (!item.children || item.children.length === 0) {
      return { completed: 0, total: 0, percentage: 0 };
    }

    const countStates = (items) => {
      let completed = 0;
      let total = 0;

      items.forEach(child => {
        const state = child.fields['System.State'];
        total++;
        if (['Resolved', 'Done', 'Closed'].includes(state)) {
          completed++;
        }

        if (child.children && child.children.length > 0) {
          const childProgress = countStates(child.children);
          completed += childProgress.completed;
          total += childProgress.total;
        }
      });

      return { completed, total };
    };

    const { completed, total } = countStates(item.children);
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  };

  // Calculate effort (story points) for parent items
  const calculateEffort = (item) => {
    if (!item.children || item.children.length === 0) {
      return 0;
    }

    const sumEffort = (items) => {
      let total = 0;

      items.forEach(child => {
        const storyPoints = child.fields['Microsoft.VSTS.Scheduling.StoryPoints'];
        if (storyPoints) {
          total += storyPoints;
        }

        if (child.children && child.children.length > 0) {
          total += sumEffort(child.children);
        }
      });

      return total;
    };

    return sumEffort(item.children);
  };

  const renderWorkItem = (item, depth = 0) => {
    const isExpanded = expandedItems.has(item.id);
    const hasChildren = item.children && item.children.length > 0;
    const type = item.fields['System.WorkItemType'];
    const title = item.fields['System.Title'];
    const state = item.fields['System.State'];
    const assignedTo = item.fields['System.AssignedTo']?.displayName || 'Unassigned';
    const progress = calculateProgress(item);
    const effort = calculateEffort(item);

    return (
      <div key={item.id} className="mb-2">
        {/* Work Item Card */}
        <div
          className={`bg-white rounded-lg shadow-sm border-l-4 hover:shadow-md transition-all ${workItemTypeColors[type]} ${hasChildren ? 'cursor-pointer' : ''}`}
          style={{ marginLeft: `${depth * 2}rem` }}
          onClick={() => hasChildren && toggleExpand(item.id)}
        >
          <div className="p-4">
            <div className="flex items-start gap-3">
              {/* Expand/Collapse Indicator */}
              {hasChildren && (
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                  <svg
                    className={`w-4 h-4 text-gray-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              )}

              {/* Icon */}
              <div className="flex-shrink-0 text-2xl">
                {workItemTypeIcons[type] || '📋'}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${workItemTypeColors[type]}`}>
                    {type}
                  </span>
                  <span className="text-sm text-gray-500">#{item.id}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${stateColors[state] || 'bg-gray-50 text-gray-700'}`}>
                    {state}
                  </span>
                  {hasChildren && (
                    <span className="text-xs text-gray-500">
                      ({item.children.length} {item.children.length === 1 ? 'item' : 'items'})
                    </span>
                  )}
                </div>

                <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2">
                  {title}
                </h3>

                {/* Progress Bar and Effort for Epics/Features */}
                {hasChildren && (type === 'Epic' || type === 'Feature') && (
                  <div className="mt-3 space-y-2">
                    {/* Progress Bar */}
                    {progress.total > 0 && (
                      <div>
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span>Progress</span>
                          <span className="font-medium">{progress.completed}/{progress.total} ({progress.percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${progress.percentage}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Effort Total */}
                    {effort > 0 && (
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">{effort}</span> story points total
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-3 text-sm text-gray-600 mt-2">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {assignedTo}
                  </span>
                </div>
              </div>

              {/* View in ADO Button */}
              <a
                href={getAdoUrl(item.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                View
              </a>
            </div>
          </div>
        </div>

        {/* Children */}
        {isExpanded && hasChildren && (
          <div className="mt-2">
            {item.children.map(child => renderWorkItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const viewModeButtons = [
    { id: 'grouped', label: 'Grouped', icon: '📁' },
    { id: 'list', label: 'List', icon: '📋' },
    { id: 'kanban', label: 'Kanban', icon: '🎯' },
    { id: 'sprint', label: 'Sprint', icon: '🏃' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Home
              </Link>

              <h1 className="text-2xl font-bold text-gray-900">Backlog</h1>
            </div>

            <button
              onClick={fetchBacklog}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all"
            >
              <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 mt-4">
            {viewModeButtons.map(button => (
              <button
                key={button.id}
                onClick={() => setViewMode(button.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  viewMode === button.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{button.icon}</span>
                {button.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading backlog...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 font-medium">Error loading backlog</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <button
              onClick={fetchBacklog}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            {/* Filters */}
            <BacklogFilters onFiltersChange={setFilters} workItems={workItems} />

            {/* View Content */}
            {viewMode === 'grouped' && (
              <div className="space-y-4">
                {filteredHierarchy.length > 0 ? (
                  filteredHierarchy.map(item => renderWorkItem(item, 0))
                ) : (
                  <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <p className="text-gray-600 text-lg">No work items match your filters</p>
                    <p className="text-gray-500 text-sm mt-2">Try adjusting your filters or clear them</p>
                  </div>
                )}
              </div>
            )}

            {viewMode === 'list' && (
              <ListView
                items={filteredItems}
                getAdoUrl={getAdoUrl}
              />
            )}

            {viewMode === 'kanban' && (
              <KanbanView
                items={filteredItems}
                getAdoUrl={getAdoUrl}
                onRefresh={fetchBacklog}
              />
            )}

            {viewMode === 'sprint' && (
              <SprintView
                items={filteredItems}
                settings={adoSettings}
                getAdoUrl={getAdoUrl}
                onRefresh={fetchBacklog}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
