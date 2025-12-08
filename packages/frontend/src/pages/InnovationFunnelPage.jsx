import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import useInnovationStore, { INNOVATION_STAGES } from '../stores/innovationStore';
import InnovationBoard from '../components/innovation/InnovationBoard';
import InnovationList from '../components/innovation/InnovationList';
import InnovationDetailPanel from '../components/innovation/InnovationDetailPanel';
import InnovationModal from '../components/innovation/InnovationModal';

const InnovationFunnelPage = () => {
  const {
    items,
    loading,
    error,
    selectedItem,
    viewMode,
    filters,
    stats,
    fetchItems,
    fetchStats,
    setViewMode,
    setFilters,
    clearFilters,
    clearSelection,
    getCategories,
    getOwners
  } = useInnovationStore();

  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchItems();
    fetchStats();
  }, [fetchItems, fetchStats]);

  const handleRefresh = async () => {
    const result = await fetchItems();
    if (result.success) {
      toast.success('Data refreshed');
      fetchStats();
    } else {
      toast.error(result.error || 'Failed to refresh');
    }
  };

  const categories = getCategories();
  const owners = getOwners();

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 transition-colors">
      {/* Header */}
      <div className="flex-none px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Innovation Funnel</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Portfolio Kanban for tracking intake projects through validation stages
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('board')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  viewMode === 'board'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                Board
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                List
              </button>
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            {/* Add New Button */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Idea
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mt-4">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search items..."
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <select
            value={filters.category}
            onChange={(e) => setFilters({ category: e.target.value })}
            className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Owner Filter */}
          <select
            value={filters.owner}
            onChange={(e) => setFilters({ owner: e.target.value })}
            className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Owners</option>
            {owners.map(owner => (
              <option key={owner} value={owner}>{owner}</option>
            ))}
          </select>

          {/* Clear Filters */}
          {(filters.search || filters.category || filters.owner) && (
            <button
              onClick={clearFilters}
              className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              Clear filters
            </button>
          )}

          {/* Stats Summary */}
          {stats && (
            <div className="ml-auto flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span>{stats.total} total items</span>
              {stats.averageRiceScore && (
                <span>Avg RICE: {stats.averageRiceScore}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {loading && items.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-slate-500">Loading...</p>
            </div>
          </div>
        ) : viewMode === 'board' ? (
          <InnovationBoard />
        ) : (
          <InnovationList />
        )}
      </div>

      {/* Detail Panel */}
      {selectedItem && (
        <InnovationDetailPanel
          item={selectedItem}
          onClose={clearSelection}
        />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <InnovationModal
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
};

export default InnovationFunnelPage;
