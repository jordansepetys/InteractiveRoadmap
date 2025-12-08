import React, { useState, useEffect } from 'react';

export default function BacklogFilters({ onFiltersChange, workItems }) {
  const [filters, setFilters] = useState({
    type: 'all',
    state: 'all',
    search: ''
  });

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  // Simple unique getters
  const types = Array.from(new Set(workItems.map(i => i.fields['System.WorkItemType']))).sort();
  const states = Array.from(new Set(workItems.map(i => i.fields['System.State']))).sort();

  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-200 dark:border-slate-700 mb-0 bg-white dark:bg-slate-900 px-6 sticky top-0 z-10">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search backlog..."
          className="block w-full pl-10 pr-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-md leading-5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
        />
      </div>

      {/* Type Select */}
      <select
        value={filters.type}
        onChange={(e) => handleFilterChange('type', e.target.value)}
        className="block pl-3 pr-10 py-1.5 text-base border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
      >
        <option value="all">All Types</option>
        {types.map(t => <option key={t} value={t}>{t}</option>)}
      </select>

      {/* State Select */}
      <select
        value={filters.state}
        onChange={(e) => handleFilterChange('state', e.target.value)}
        className="block pl-3 pr-10 py-1.5 text-base border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
      >
        <option value="all">All States</option>
        {states.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      <div className="flex-1"></div>

      {/* Clear Filters */}
      {(filters.type !== 'all' || filters.state !== 'all' || filters.search) && (
         <button
           onClick={() => {
             const reset = { type: 'all', state: 'all', search: '' };
             setFilters(reset);
             onFiltersChange(reset);
           }}
           className="text-xs text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 font-medium transition-colors"
         >
           Clear Filters
         </button>
      )}
    </div>
  );
}