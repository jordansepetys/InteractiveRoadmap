import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { format, parseISO, differenceInDays } from 'date-fns';
import useInnovationStore, { INNOVATION_STAGES, STAGE_COLORS } from '../../stores/innovationStore';

const InnovationDetailPanel = ({ item, onClose }) => {
  const { updateItem, deleteItem, moveStage } = useInnovationStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    owner: '',
    requestor: '',
    category: '',
    rice_reach: '',
    rice_impact: '',
    rice_confidence: '',
    rice_effort: '',
    roi_estimate: '',
    roi_notes: '',
    status_notes: '',
    rejection_reason: ''
  });

  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title || '',
        description: item.description || '',
        owner: item.owner || '',
        requestor: item.requestor || '',
        category: item.category || '',
        rice_reach: item.rice_reach ?? '',
        rice_impact: item.rice_impact ?? '',
        rice_confidence: item.rice_confidence ?? '',
        rice_effort: item.rice_effort ?? '',
        roi_estimate: item.roi_estimate || '',
        roi_notes: item.roi_notes || '',
        status_notes: item.status_notes || '',
        rejection_reason: item.rejection_reason || ''
      });
    }
  }, [item]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Calculate RICE score in real-time
  const calculateRiceScore = () => {
    const reach = parseFloat(formData.rice_reach) || 0;
    const impact = parseFloat(formData.rice_impact) || 0;
    const confidence = parseFloat(formData.rice_confidence) || 0;
    const effort = parseFloat(formData.rice_effort) || 0;

    if (reach && impact && confidence && effort > 0) {
      return ((reach * impact * (confidence / 100)) / effort).toFixed(1);
    }
    return null;
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await updateItem(item.id, {
      ...formData,
      rice_reach: formData.rice_reach ? parseInt(formData.rice_reach) : null,
      rice_impact: formData.rice_impact ? parseInt(formData.rice_impact) : null,
      rice_confidence: formData.rice_confidence ? parseInt(formData.rice_confidence) : null,
      rice_effort: formData.rice_effort ? parseInt(formData.rice_effort) : null
    });

    setSaving(false);
    if (result.success) {
      toast.success('Changes saved');
      setIsEditing(false);
    } else {
      toast.error(result.error || 'Failed to save');
    }
  };

  const handleDelete = async () => {
    const result = await deleteItem(item.id);
    if (result.success) {
      toast.success('Item deleted');
      onClose();
    } else {
      toast.error(result.error || 'Failed to delete');
    }
  };

  const handleStageChange = async (newStage) => {
    const result = await moveStage(item.id, newStage);
    if (result.success) {
      toast.success(`Moved to ${newStage}`);
    } else {
      toast.error(result.error || 'Failed to move');
    }
  };

  const colors = STAGE_COLORS[item.stage];
  const daysInStage = item.stage_changed_at
    ? differenceInDays(new Date(), parseISO(item.stage_changed_at))
    : 0;

  const riceScore = isEditing ? calculateRiceScore() : item.rice_score;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-[480px] bg-white dark:bg-slate-900 shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400 dark:text-slate-500">#{item.id}</span>
            <span className={`px-2 py-1 text-xs font-medium rounded ${colors.badge} ${colors.text}`}>
              {item.stage}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
              >
                Edit
              </button>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title */}
          <div>
            {isEditing ? (
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full text-lg font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{item.title}</h2>
            )}
          </div>

          {/* Stage Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Stage
            </label>
            <select
              value={item.stage}
              onChange={(e) => handleStageChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {INNOVATION_STAGES.map(stage => (
                <option key={stage} value={stage}>{stage}</option>
              ))}
            </select>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {daysInStage} days in this stage
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Description
            </label>
            {isEditing ? (
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                {item.description || 'No description'}
              </p>
            )}
          </div>

          {/* Owner & Requestor */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Owner
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.owner}
                  onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-sm text-slate-600 dark:text-slate-300">{item.owner || '-'}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Requestor
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.requestor}
                  onChange={(e) => setFormData({ ...formData, requestor: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-sm text-slate-600 dark:text-slate-300">{item.requestor || '-'}</p>
              )}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Category
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Platform, UX, Integration"
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-300">{item.category || '-'}</p>
            )}
          </div>

          {/* RICE Metrics */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">RICE Score</h3>
              <span className={`px-3 py-1 text-sm font-bold rounded ${
                riceScore !== null
                  ? riceScore >= 15 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : riceScore >= 5 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
              }`}>
                {riceScore !== null ? riceScore : '-'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Reach (users/period)</label>
                {isEditing ? (
                  <input
                    type="number"
                    value={formData.rice_reach}
                    onChange={(e) => setFormData({ ...formData, rice_reach: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.rice_reach ?? '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Impact (1-3)</label>
                {isEditing ? (
                  <select
                    value={formData.rice_impact}
                    onChange={(e) => setFormData({ ...formData, rice_impact: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select...</option>
                    <option value="1">1 - Low</option>
                    <option value="2">2 - Medium</option>
                    <option value="3">3 - High</option>
                  </select>
                ) : (
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {item.rice_impact ? `${item.rice_impact} - ${['Low', 'Medium', 'High'][item.rice_impact - 1]}` : '-'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Confidence (%)</label>
                {isEditing ? (
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.rice_confidence}
                    onChange={(e) => setFormData({ ...formData, rice_confidence: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.rice_confidence ? `${item.rice_confidence}%` : '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Effort (person-weeks)</label>
                {isEditing ? (
                  <input
                    type="number"
                    value={formData.rice_effort}
                    onChange={(e) => setFormData({ ...formData, rice_effort: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.rice_effort ?? '-'}</p>
                )}
              </div>
            </div>
          </div>

          {/* ROI */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">ROI Estimate</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Estimate</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.roi_estimate}
                    onChange={(e) => setFormData({ ...formData, roi_estimate: e.target.value })}
                    placeholder="e.g., $50K-100K annual savings"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-sm text-slate-600 dark:text-slate-300">{item.roi_estimate || '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">ROI Notes / Justification</label>
                {isEditing ? (
                  <textarea
                    value={formData.roi_notes}
                    onChange={(e) => setFormData({ ...formData, roi_notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                ) : (
                  <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{item.roi_notes || '-'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Status Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Status Notes
            </label>
            {isEditing ? (
              <textarea
                value={formData.status_notes}
                onChange={(e) => setFormData({ ...formData, status_notes: e.target.value })}
                rows={3}
                placeholder="Where things are at..."
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{item.status_notes || 'No status notes'}</p>
            )}
          </div>

          {/* Rejection Reason (if rejected) */}
          {item.stage === 'Rejected' && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <label className="block text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wider mb-2">
                Rejection Reason
              </label>
              {isEditing ? (
                <textarea
                  value={formData.rejection_reason}
                  onChange={(e) => setFormData({ ...formData, rejection_reason: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-red-200 dark:border-red-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
              ) : (
                <p className="text-sm text-red-700 dark:text-red-300">{item.rejection_reason || 'No reason provided'}</p>
              )}
            </div>
          )}

          {/* ADO Link */}
          {item.ado_feature_id && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <label className="block text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">
                Linked ADO Feature
              </label>
              <p className="text-sm text-blue-700 dark:text-blue-300">Feature #{item.ado_feature_id}</p>
            </div>
          )}

          {/* Timestamps */}
          <div className="text-xs text-slate-400 dark:text-slate-500 space-y-1">
            <p>Created: {format(parseISO(item.created_at), 'MMM d, yyyy h:mm a')}</p>
            <p>Updated: {format(parseISO(item.updated_at), 'MMM d, yyyy h:mm a')}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-none px-6 py-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            Delete Item
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Delete Item?</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              This will permanently delete "{item.title}". This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InnovationDetailPanel;
