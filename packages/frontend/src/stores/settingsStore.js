import { create } from 'zustand';
import axios from 'axios';

const useSettingsStore = create((set, get) => ({
  // State
  settings: null,
  configured: false,
  loading: false,
  saving: false,
  testing: false,
  error: null,
  testResult: null,

  // Actions
  fetchSettings: async () => {
    set({ loading: true, error: null });

    try {
      const response = await axios.get('/api/settings');

      set({
        settings: response.data.settings || null,
        configured: response.data.configured || false,
        loading: false
      });

      return {
        success: true,
        settings: response.data.settings || null,
        configured: response.data.configured || false
      };
    } catch (error) {
      console.error('Error fetching settings:', error);

      // 404 means not configured yet
      if (error.response?.status === 404) {
        set({
          configured: false,
          settings: null,
          loading: false
        });

        return {
          success: true,
          settings: null,
          configured: false
        };
      } else {
        set({
          error: error.response?.data?.error || error.message,
          loading: false
        });

        return {
          success: false,
          error: error.response?.data?.error || error.message,
          settings: null,
          configured: false
        };
      }
    }
  },

  saveSettings: async (settingsData) => {
    set({ saving: true, error: null });

    try {
      const response = await axios.post('/api/settings', settingsData);

      set({
        settings: response.data.settings,
        configured: true,
        saving: false,
        error: null
      });

      return { success: true };
    } catch (error) {
      console.error('Error saving settings:', error);

      const errorMessage = error.response?.data?.error || error.message;
      set({
        error: errorMessage,
        saving: false
      });

      return { success: false, error: errorMessage };
    }
  },

  testAdoConnection: async () => {
    set({ testing: true, testResult: null, error: null });

    try {
      const response = await axios.post('/api/settings/test-ado');

      set({
        testResult: response.data,
        testing: false
      });

      return response.data;
    } catch (error) {
      console.error('Error testing ADO connection:', error);

      const result = {
        success: false,
        error: error.response?.data?.error || error.message
      };

      set({
        testResult: result,
        testing: false
      });

      return result;
    }
  },

  clearError: () => set({ error: null }),
  clearTestResult: () => set({ testResult: null })
}));

export default useSettingsStore;
