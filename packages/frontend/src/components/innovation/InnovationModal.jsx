import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import useInnovationStore, { INNOVATION_STAGES } from '../../stores/innovationStore';

const InnovationModal = ({ onClose }) => {
  const { createItem, getCategories } = useInnovationStore();
  const [isSubmitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    stage: 'Intake',
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
    ado_feature_id: ''
  });

  const existingCategories = getCategories();

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    setSubmitting(true);
    const result = await createItem({
      ...formData,
      rice_reach: formData.rice_reach ? parseInt(formData.rice_reach) : null,
      rice_impact: formData.rice_impact ? parseInt(formData.rice_impact) : null,
      rice_confidence: formData.rice_confidence ? parseInt(formData.rice_confidence) : null,
      rice_effort: formData.rice_effort ? parseInt(formData.rice_effort) : null,
      ado_feature_id: formData.ado_feature_id ? parseInt(formData.ado_feature_id) : null
    });

    setSubmitting(false);
    if (result.success) {
      toast.success('Item created');
      onClose();
    } else {
      toast.error(result.error || 'Failed to create item');
    }
  };

  const riceScore = calculateRiceScore();

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Add New Idea</h2>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="p-6 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="What's the idea?"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Describe the idea..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Stage & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Initial Stage
                  </label>
                  <select
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {INNOVATION_STAGES.map(stage => (
                      <option key={stage} value={stage}>{stage}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    list="categories"
                    placeholder="e.g., Platform, UX"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <datalist id="categories">
                    {existingCategories.map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Owner & Requestor */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Owner
                  </label>
                  <input
                    type="text"
                    value={formData.owner}
                    onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                    placeholder="Who's responsible?"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Requestor
                  </label>
                  <input
                    type="text"
                    value={formData.requestor}
                    onChange={(e) => setFormData({ ...formData, requestor: e.target.value })}
                    placeholder="Who requested this?"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* RICE Metrics */}
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-700">RICE Score (Optional)</h3>
                  {riceScore && (
                    <span className={`px-3 py-1 text-sm font-bold rounded ${
                      riceScore >= 15 ? 'bg-green-100 text-green-700'
                        : riceScore >= 5 ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {riceScore}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Reach</label>
                    <input
                      type="number"
                      value={formData.rice_reach}
                      onChange={(e) => setFormData({ ...formData, rice_reach: e.target.value })}
                      placeholder="Users"
                      className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Impact</label>
                    <select
                      value={formData.rice_impact}
                      onChange={(e) => setFormData({ ...formData, rice_impact: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">1-3</option>
                      <option value="1">1 - Low</option>
                      <option value="2">2 - Med</option>
                      <option value="3">3 - High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Confidence</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.rice_confidence}
                      onChange={(e) => setFormData({ ...formData, rice_confidence: e.target.value })}
                      placeholder="%"
                      className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Effort</label>
                    <input
                      type="number"
                      value={formData.rice_effort}
                      onChange={(e) => setFormData({ ...formData, rice_effort: e.target.value })}
                      placeholder="Weeks"
                      className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  RICE = (Reach × Impact × Confidence%) / Effort
                </p>
              </div>

              {/* ROI */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    ROI Estimate
                  </label>
                  <input
                    type="text"
                    value={formData.roi_estimate}
                    onChange={(e) => setFormData({ ...formData, roi_estimate: e.target.value })}
                    placeholder="e.g., $50K annual savings"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Link to ADO Feature (ID)
                  </label>
                  <input
                    type="number"
                    value={formData.ado_feature_id}
                    onChange={(e) => setFormData({ ...formData, ado_feature_id: e.target.value })}
                    placeholder="e.g., 12345"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Status Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Initial Status Notes
                </label>
                <textarea
                  value={formData.status_notes}
                  onChange={(e) => setFormData({ ...formData, status_notes: e.target.value })}
                  rows={2}
                  placeholder="Where things are at..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.title.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Create Item'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default InnovationModal;
