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
  const [exporting, setExporting] = useState(false);

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

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await axios.get('/api/export/stagegate-html', {
        responseType: 'blob'
      });

      // Create download link
      const blob = new Blob([response.data], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Get filename from content-disposition header or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'stagegate.html';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Stage Gate exported! Open the HTML file in any browser.');
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Failed to export stage gate');
    } finally {
      setExporting(false);
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
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 border border-blue-600 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {exporting ? 'Exporting...' : 'Export HTML'}
            </button>
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
