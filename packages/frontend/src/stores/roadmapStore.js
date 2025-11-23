import { create } from 'zustand';
import axios from 'axios';

const useRoadmapStore = create((set, get) => ({
  scheduled: [], // Array of epic groups: [{ epic: {...}, features: [...] }]
  orphanedScheduled: [], // Features without parent epic but with dates
  unscheduled: [], // Features without dates
  selectedFeature: null,
  loading: false,
  error: null,

  fetchFeatures: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get('/api/roadmap/features');
      set({
        scheduled: response.data.scheduled || [],
        orphanedScheduled: response.data.orphanedScheduled || [],
        unscheduled: response.data.unscheduled || [],
        loading: false,
        error: null
      });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch roadmap features';
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  selectFeature: (feature) => {
    set({ selectedFeature: feature });
  },

  clearSelection: () => {
    set({ selectedFeature: null });
  },

  clearError: () => {
    set({ error: null });
  }
}));

export default useRoadmapStore;
