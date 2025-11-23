import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStageGateStore from '../stores/stageGateStore';
import useSettingsStore from '../stores/settingsStore';
import StageBoard from '../components/stagegate/StageBoard';
import toast from 'react-hot-toast';
import axios from 'axios';
import { arrayMove } from '@dnd-kit/sortable';

const STAGES = ['Intake', 'Discovery', 'Development', 'Testing', 'Complete'];
const REFRESH_INTERVAL = 60000; // 1 minute

function StageGatePage() {
  const navigate = useNavigate();
  const {
    grouped,
    counts,
    loading,
    error,
    fetchFeatures,
    clearError,
  } = useStageGateStore();

  const { settings, fetchSettings } = useSettingsStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initial fetch
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

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(async () => {
      setIsRefreshing(true);
      await fetchFeatures();
      setIsRefreshing(false);
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchFeatures]);

  // Clear error on unmount
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const handleFeatureClick = (feature) => {
    navigate(`/feature/${feature.id}`);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const result = await fetchFeatures();
    setIsRefreshing(false);
    if (result.success) {
      toast.success('Features refreshed');
    } else {
      toast.error(result.error || 'Failed to refresh features');
    }
  };

  const handleReorder = async (activeId, overId) => {
    const intakeFeatures = grouped['Intake'];
    const oldIndex = intakeFeatures.findIndex(f => f.id === activeId);
    const newIndex = intakeFeatures.findIndex(f => f.id === overId);
    
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

    const reordered = arrayMove(intakeFeatures, oldIndex, newIndex);

    try {
      const priorityUpdates = reordered.map((feature, index) => ({
        id: feature.id,
        priority: index + 1
      }));

      await axios.post('/api/stagegate/update-priorities', { updates: priorityUpdates });
      toast.success('Priorities updated');
      
      fetchFeatures();
    } catch (error) {
      console.error('Error updating priorities:', error);
      toast.error('Failed to update priorities');
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex-none px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Stage Gate</h1>
            <p className="text-xs text-slate-500 mt-0.5">
               Manage feature governance and flow.
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <svg
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Board Content */}
      <div className="flex-1 min-h-0 p-6 overflow-hidden bg-slate-50">
        {loading && !isRefreshing ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-800"></div>
          </div>
        ) : error ? (
           <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-red-500 mb-2">{error}</p>
              <button onClick={handleRefresh} className="text-sm underline">Try again</button>
            </div>
          </div>
        ) : (
          <StageBoard 
            groupedFeatures={grouped}
            counts={counts}
            stages={STAGES}
            onFeatureClick={handleFeatureClick}
            onReorder={handleReorder}
          />
        )}
      </div>
    </div>
  );
}

export default StageGatePage;
