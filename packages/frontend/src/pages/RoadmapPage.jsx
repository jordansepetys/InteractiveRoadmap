import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useRoadmapStore from '../stores/roadmapStore';
import useSettingsStore from '../stores/settingsStore';
import toast from 'react-hot-toast';
import TimelineHeader from '../components/roadmap/TimelineHeader';
import EpicSwimlane from '../components/roadmap/EpicSwimlane';

function RoadmapPage() {
  const navigate = useNavigate();
  const {
    scheduled,
    orphanedScheduled,
    unscheduled,
    loading,
    error,
    fetchFeatures,
    clearError
  } = useRoadmapStore();

  const { settings, fetchSettings } = useSettingsStore();

  useEffect(() => {
    const loadFeatures = async () => {
      const result = await fetchFeatures();
      if (!result.success && result.error) {
        toast.error(result.error);
      }
    };
    loadFeatures();
    fetchSettings();
  }, [fetchFeatures, fetchSettings]);

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const handleFeatureClick = (feature) => {
    navigate(`/feature/${feature.id}`);
  };

  const handleRefresh = async () => {
    const result = await fetchFeatures();
    if (result.success) {
      toast.success('Roadmap refreshed');
    } else {
      toast.error(result.error || 'Failed to refresh roadmap');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 text-center">
        <h3 className="text-lg font-medium text-slate-900 mb-2">Error loading roadmap</h3>
        <p className="text-slate-500 mb-4">{error}</p>
        <button onClick={handleRefresh} className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 text-sm">
          Retry
        </button>
      </div>
    );
  }

  const hasScheduledItems = scheduled.length > 0 || orphanedScheduled.length > 0;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Page Header */}
      <div className="px-6 py-4 border-b border-slate-200 flex-none">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Roadmap</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Timeline visualization of features.
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {!hasScheduledItems && unscheduled.length === 0 && (
          <div className="text-center py-20 border border-slate-200 border-dashed rounded bg-slate-50">
            <p className="text-sm text-slate-500">No features found. Check your ADO connection.</p>
          </div>
        )}

        {hasScheduledItems && (
          <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden mb-8">
            <TimelineHeader />
            
            <div className="p-4 bg-white">
              {scheduled.map((group, idx) => (
                <EpicSwimlane
                  key={group.epic.id}
                  epic={group.epic}
                  features={group.features}
                  colorIndex={idx}
                  onFeatureClick={handleFeatureClick}
                />
              ))}

              {orphanedScheduled.length > 0 && (
                <EpicSwimlane
                  epic={null}
                  features={orphanedScheduled}
                  colorIndex={3} // Teal for orphans
                  onFeatureClick={handleFeatureClick}
                />
              )}
            </div>
          </div>
        )}

        {unscheduled.length > 0 && (
          <div>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Unscheduled ({unscheduled.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {unscheduled.map((feature) => (
                <div
                  key={feature.id}
                  onClick={() => handleFeatureClick(feature)}
                  className="group bg-white p-3 rounded border border-slate-200 hover:border-blue-400 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono text-slate-400">#{feature.id}</span>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">
                      {feature.state}
                    </span>
                  </div>
                  <h4 className="text-xs font-medium text-slate-800 group-hover:text-blue-700 line-clamp-2 leading-snug">
                    {feature.title}
                  </h4>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RoadmapPage;
