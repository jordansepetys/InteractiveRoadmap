import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import BacklogFilters from '../components/BacklogFilters';
import ListView from '../components/ListView';
import KanbanView from '../components/KanbanView';
import SprintView from '../components/SprintView';
import WorkItemNode from '../components/backlog/WorkItemNode';

export default function BacklogPage() {
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped', 'list', 'kanban', 'sprint'
  const [workItems, setWorkItems] = useState([]);
  const [hierarchy, setHierarchy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [adoSettings, setAdoSettings] = useState({ orgUrl: '', project: '', iteration_path: '', process_template: '' });
  const [filters, setFilters] = useState({
    type: 'all',
    state: 'all',
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
        iteration_path: settings.iteration_path || '',
        process_template: settings.process_template || 'Basic'
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

      // Auto-expand Epics/Features
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

  // Filter logic
  const filteredItems = useMemo(() => {
    return workItems.filter(item => {
      const type = item.fields['System.WorkItemType'];
      const state = item.fields['System.State'];
      const title = item.fields['System.Title'] || '';

      if (filters.type !== 'all' && type !== filters.type) return false;
      if (filters.state !== 'all' && state !== filters.state) return false;
      if (filters.search && !title.toLowerCase().includes(filters.search.toLowerCase())) return false;

      return true;
    });
  }, [workItems, filters]);

  // Hierarchy filter logic
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
    // Navigate to feature detail page instead of ADO
    return `/feature/${workItemId}`;
  };

  // Helper for the recursive tree view to manage its own expansion state if needed
  // For now we just pass the global expandedItems set + toggler
  const renderTree = (items) => {
    if (!items || items.length === 0) return null;
    return items.map(item => (
      <WorkItemNode
        key={item.id}
        item={item}
        depth={0}
        isExpanded={expandedItems.has(item.id)}
        onToggle={toggleExpand}
        getAdoUrl={getAdoUrl}
      />
    ));
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex-none px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Backlog</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage work items and hierarchy.</p>
        </div>

        <div className="flex items-center gap-4">
          {/* View Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-lg">
            {[
              { id: 'grouped', label: 'Tree' },
              { id: 'list', label: 'List' },
              { id: 'kanban', label: 'Board' },
              { id: 'sprint', label: 'Sprint' }
            ].map(v => (
              <button
                key={v.id}
                onClick={() => setViewMode(v.id)}
                className={`
                  px-3 py-1 text-xs font-medium rounded-md transition-all
                  ${viewMode === v.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}
                `}
              >
                {v.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchBacklog}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
            title="Refresh"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-slate-50 overflow-hidden">
        {/* Filters Bar */}
        <BacklogFilters onFiltersChange={setFilters} workItems={workItems} />

        <div className="flex-1 overflow-y-auto p-0">
          {loading && workItems.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-800"></div>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-500 mb-2">{error}</p>
              <button onClick={fetchBacklog} className="text-sm underline">Try again</button>
            </div>
          ) : (
            <div className="min-h-full bg-white">
               {viewMode === 'grouped' && (
                 <div className="pb-20">
                   {filteredHierarchy.length > 0 ? renderTree(filteredHierarchy) : (
                     <div className="p-12 text-center text-slate-500 text-sm">
                       No items match your filters.
                     </div>
                   )}
                 </div>
               )}

               {viewMode === 'list' && (
                 <div className="p-6">
                    <ListView items={filteredItems} getAdoUrl={getAdoUrl} />
                 </div>
               )}

               {viewMode === 'kanban' && (
                  <div className="p-6">
                    <KanbanView 
                      items={filteredItems} 
                      getAdoUrl={getAdoUrl} 
                      onRefresh={fetchBacklog}
                      processTemplate={adoSettings.process_template}
                    />
                  </div>
               )}

               {viewMode === 'sprint' && (
                 <div className="p-6">
                    <SprintView 
                      items={filteredItems} 
                      settings={adoSettings} 
                      getAdoUrl={getAdoUrl} 
                      onRefresh={fetchBacklog} 
                    />
                 </div>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
