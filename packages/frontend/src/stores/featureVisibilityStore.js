import { create } from 'zustand';
import axios from 'axios';

const useFeatureVisibilityStore = create((set, get) => ({
  // State
  features: [],
  loading: false,
  saving: false,
  error: null,

  // Actions
  fetchFeatures: async () => {
    set({ loading: true, error: null });

    try {
      const response = await axios.get('/api/feature-visibility');

      set({
        features: response.data.features || [],
        loading: false
      });

      return {
        success: true,
        features: response.data.features || []
      };
    } catch (error) {
      console.error('Error fetching feature visibility:', error);

      const errorMessage = error.response?.data?.error || error.message;
      set({
        error: errorMessage,
        loading: false
      });

      return {
        success: false,
        error: errorMessage
      };
    }
  },

  updateFeatureVisibility: async (featureId, isVisible) => {
    set({ saving: true, error: null });

    try {
      await axios.post('/api/feature-visibility/update', {
        featureId,
        isVisible
      });

      // Update local state
      const features = get().features;
      const updatedFeatures = features.map(f =>
        f.id === featureId ? { ...f, isVisible } : f
      );

      set({
        features: updatedFeatures,
        saving: false
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating feature visibility:', error);

      const errorMessage = error.response?.data?.error || error.message;
      set({
        error: errorMessage,
        saving: false
      });

      return { success: false, error: errorMessage };
    }
  },

  bulkUpdateVisibility: async (updates) => {
    set({ saving: true, error: null });

    try {
      await axios.post('/api/feature-visibility/bulk-update', { updates });

      // Refresh features after bulk update
      await get().fetchFeatures();

      set({ saving: false });

      return { success: true };
    } catch (error) {
      console.error('Error bulk updating feature visibility:', error);

      const errorMessage = error.response?.data?.error || error.message;
      set({
        error: errorMessage,
        saving: false
      });

      return { success: false, error: errorMessage };
    }
  },

  clearError: () => set({ error: null })
}));

export default useFeatureVisibilityStore;
