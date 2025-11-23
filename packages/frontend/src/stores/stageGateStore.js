import { create } from 'zustand';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const useStageGateStore = create((set, get) => ({
  // State
  features: [],
  grouped: {
    'Intake': [],
    'Discovery': [],
    'Development': [],
    'Testing': [],
    'Complete': []
  },
  counts: {
    'Intake': 0,
    'Discovery': 0,
    'Development': 0,
    'Testing': 0,
    'Complete': 0
  },
  loading: false,
  error: null,
  selectedFeature: null,
  selectedFeatureDetails: null,
  lastFetch: null,

  // Actions
  fetchFeatures: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${API_BASE}/api/stagegate/features`);

      if (response.data.success) {
        set({
          features: response.data.features,
          grouped: response.data.grouped,
          counts: response.data.counts,
          loading: false,
          lastFetch: new Date().toISOString()
        });
        return { success: true };
      } else {
        set({
          error: 'Failed to fetch features',
          loading: false
        });
        return { success: false, error: 'Failed to fetch features' };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch features';
      set({
        error: errorMessage,
        loading: false
      });
      return { success: false, error: errorMessage };
    }
  },

  fetchFeatureDetails: async (featureId) => {
    try {
      const response = await axios.get(`${API_BASE}/api/stagegate/feature/${featureId}`);

      if (response.data.success) {
        set({ selectedFeatureDetails: response.data.feature });
        return { success: true, feature: response.data.feature };
      } else {
        return { success: false, error: 'Failed to fetch feature details' };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch feature details';
      return { success: false, error: errorMessage };
    }
  },

  selectFeature: (feature) => set({ selectedFeature: feature, selectedFeatureDetails: null }),

  clearSelection: () => set({ selectedFeature: null, selectedFeatureDetails: null }),

  clearError: () => set({ error: null }),

  // Refresh features (useful for auto-refresh)
  refreshFeatures: async () => {
    const { fetchFeatures } = get();
    return await fetchFeatures();
  }
}));

export default useStageGateStore;
