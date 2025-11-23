import React, { useEffect } from 'react';
import useStageGateStore from '../stores/stageGateStore';
import useSettingsStore from '../stores/settingsStore';

const FeatureDetailsPanel = ({ isOpen, onClose }) => {
  const { selectedFeature, selectedFeatureDetails, fetchFeatureDetails } = useStageGateStore();
  const { settings } = useSettingsStore();

  useEffect(() => {
    if (isOpen && selectedFeature && !selectedFeatureDetails) {
      fetchFeatureDetails(selectedFeature.id);
    }
  }, [isOpen, selectedFeature, selectedFeatureDetails, fetchFeatureDetails]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !selectedFeature) return null;

  const details = selectedFeatureDetails || selectedFeature;

  // Generate ADO URL
  const getAdoUrl = () => {
    if (selectedFeatureDetails?.adoUrl) {
      return selectedFeatureDetails.adoUrl;
    }
    if (settings?.ado_org_url && settings?.ado_project) {
      return `${settings.ado_org_url}/${settings.ado_project}/_workitems/edit/${selectedFeature.id}/`;
    }
    return `https://dev.azure.com/_workitems/edit/${selectedFeature.id}/`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Strip HTML from description
  const stripHtml = (html) => {
    if (!html) return 'No description provided';
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || 'No description provided';
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-slate-900/30 z-40 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Slide-in Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white border-l border-slate-200 z-50 overflow-y-auto transform transition-transform duration-300 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-slate-50 border-b border-slate-200 px-10 py-8 flex items-start justify-between z-10">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-xs text-slate-500 font-medium">Feature #{details.id}</span>
              <span className="text-xs text-slate-600 font-medium">
                {details.state}
              </span>
            </div>
            <h2 className="text-2xl font-light text-slate-900 leading-relaxed">{details.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="ml-6 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-10 py-8">
          {/* Quick Actions */}
          <div className="mb-10">
            <a
              href={getAdoUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View in Azure DevOps
            </a>
          </div>

          {/* Details Grid */}
          <div className="space-y-10">
            {/* Description */}
            <div>
              <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-4 font-medium">Description</h3>
              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {stripHtml(details.description)}
              </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-x-10 gap-y-8">
              <div>
                <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-3 font-medium">Status</h3>
                <p className="text-sm text-slate-900">{details.state}</p>
              </div>

              <div>
                <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-3 font-medium">Stage</h3>
                <p className="text-sm text-slate-900">{details.stage}</p>
              </div>

              <div>
                <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-3 font-medium">Assigned To</h3>
                <p className="text-sm text-slate-900">{details.assignedTo || 'Unassigned'}</p>
              </div>

              {selectedFeatureDetails?.createdBy && (
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-3 font-medium">Created By</h3>
                  <p className="text-sm text-slate-900">{selectedFeatureDetails.createdBy}</p>
                </div>
              )}

              <div>
                <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-3 font-medium">Created</h3>
                <p className="text-sm text-slate-900">{formatDate(details.createdDate)}</p>
              </div>

              <div>
                <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-3 font-medium">Last Changed</h3>
                <p className="text-sm text-slate-900">{formatDate(details.changedDate)}</p>
              </div>

              {selectedFeatureDetails?.areaPath && (
                <div className="col-span-2">
                  <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-3 font-medium">Area Path</h3>
                  <p className="text-sm text-slate-900 truncate" title={selectedFeatureDetails.areaPath}>
                    {selectedFeatureDetails.areaPath}
                  </p>
                </div>
              )}

              {selectedFeatureDetails?.iterationPath && (
                <div className="col-span-2">
                  <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-3 font-medium">Iteration Path</h3>
                  <p className="text-sm text-slate-900 truncate" title={selectedFeatureDetails.iterationPath}>
                    {selectedFeatureDetails.iterationPath}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FeatureDetailsPanel;
