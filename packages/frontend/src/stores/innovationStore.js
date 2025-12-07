import { create } from 'zustand';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Valid stages for innovation funnel
export const INNOVATION_STAGES = [
  'Intake',
  'Triage',
  'Discovery',
  'Ready for Build',
  'In Flight',
  'Parked',
  'Rejected'
];

// Stage colors for UI
export const STAGE_COLORS = {
  'Intake': { bg: 'bg-slate-100', border: 'border-slate-300', text: 'text-slate-700', badge: 'bg-slate-200' },
  'Triage': { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', badge: 'bg-amber-200' },
  'Discovery': { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', badge: 'bg-blue-200' },
  'Ready for Build': { bg: 'bg-indigo-50', border: 'border-indigo-300', text: 'text-indigo-700', badge: 'bg-indigo-200' },
  'In Flight': { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700', badge: 'bg-green-200' },
  'Parked': { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700', badge: 'bg-purple-200' },
  'Rejected': { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', badge: 'bg-red-200' }
};

const useInnovationStore = create((set, get) => ({
  // State
  items: [],
  grouped: {}, // Items grouped by stage
  stats: null,
  loading: false,
  error: null,
  selectedItem: null,
  viewMode: 'board', // 'board' or 'list'
  filters: {
    search: '',
    category: '',
    owner: ''
  },
  lastFetch: null,

  // Actions
  fetchItems: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${API_BASE}/api/innovation/items`);

      if (response.data.success) {
        const items = response.data.items;

        // Group items by stage
        const grouped = {};
        INNOVATION_STAGES.forEach(stage => {
          grouped[stage] = items
            .filter(item => item.stage === stage)
            .sort((a, b) => a.stage_order - b.stage_order);
        });

        set({
          items,
          grouped,
          loading: false,
          lastFetch: new Date().toISOString()
        });
        return { success: true };
      } else {
        set({ error: 'Failed to fetch items', loading: false });
        return { success: false, error: 'Failed to fetch items' };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch items';
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  fetchStats: async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/innovation/stats`);
      if (response.data.success) {
        set({ stats: response.data.stats });
        return { success: true, stats: response.data.stats };
      }
      return { success: false };
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      return { success: false, error: error.message };
    }
  },

  createItem: async (itemData) => {
    try {
      const response = await axios.post(`${API_BASE}/api/innovation/items`, itemData);

      if (response.data.success) {
        // Refresh items to get updated list
        await get().fetchItems();
        return { success: true, item: response.data.item };
      }
      return { success: false, error: 'Failed to create item' };
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create item';
      return { success: false, error: errorMessage };
    }
  },

  updateItem: async (id, itemData) => {
    try {
      const response = await axios.put(`${API_BASE}/api/innovation/items/${id}`, itemData);

      if (response.data.success) {
        // Update the item in state
        const items = get().items.map(item =>
          item.id === id ? response.data.item : item
        );

        // Re-group items
        const grouped = {};
        INNOVATION_STAGES.forEach(stage => {
          grouped[stage] = items
            .filter(item => item.stage === stage)
            .sort((a, b) => a.stage_order - b.stage_order);
        });

        set({ items, grouped, selectedItem: response.data.item });
        return { success: true, item: response.data.item };
      }
      return { success: false, error: 'Failed to update item' };
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update item';
      return { success: false, error: errorMessage };
    }
  },

  deleteItem: async (id) => {
    try {
      const response = await axios.delete(`${API_BASE}/api/innovation/items/${id}`);

      if (response.data.success) {
        // Remove from state
        const items = get().items.filter(item => item.id !== id);

        // Re-group items
        const grouped = {};
        INNOVATION_STAGES.forEach(stage => {
          grouped[stage] = items
            .filter(item => item.stage === stage)
            .sort((a, b) => a.stage_order - b.stage_order);
        });

        set({ items, grouped, selectedItem: null });
        return { success: true };
      }
      return { success: false, error: 'Failed to delete item' };
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to delete item';
      return { success: false, error: errorMessage };
    }
  },

  moveStage: async (id, newStage, rejectionReason = null) => {
    try {
      const response = await axios.patch(`${API_BASE}/api/innovation/items/${id}/stage`, {
        stage: newStage,
        rejection_reason: rejectionReason
      });

      if (response.data.success) {
        // Refresh items to get updated ordering
        await get().fetchItems();
        return { success: true, item: response.data.item };
      }
      return { success: false, error: 'Failed to move item' };
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to move item';
      return { success: false, error: errorMessage };
    }
  },

  reorderItem: async (id, newOrder) => {
    try {
      const response = await axios.patch(`${API_BASE}/api/innovation/items/${id}/order`, {
        newOrder
      });

      if (response.data.success) {
        // Refresh items to get updated ordering
        await get().fetchItems();
        return { success: true };
      }
      return { success: false, error: 'Failed to reorder item' };
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to reorder item';
      return { success: false, error: errorMessage };
    }
  },

  selectItem: (item) => set({ selectedItem: item }),

  clearSelection: () => set({ selectedItem: null }),

  setViewMode: (mode) => set({ viewMode: mode }),

  setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),

  clearFilters: () => set({ filters: { search: '', category: '', owner: '' } }),

  clearError: () => set({ error: null }),

  // Get filtered items
  getFilteredItems: () => {
    const { items, filters } = get();
    let filtered = [...items];

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(search) ||
        item.description?.toLowerCase().includes(search) ||
        item.owner?.toLowerCase().includes(search) ||
        item.requestor?.toLowerCase().includes(search)
      );
    }

    if (filters.category) {
      filtered = filtered.filter(item => item.category === filters.category);
    }

    if (filters.owner) {
      filtered = filtered.filter(item => item.owner === filters.owner);
    }

    return filtered;
  },

  // Get filtered and grouped items
  getFilteredGrouped: () => {
    const filteredItems = get().getFilteredItems();
    const grouped = {};
    INNOVATION_STAGES.forEach(stage => {
      grouped[stage] = filteredItems
        .filter(item => item.stage === stage)
        .sort((a, b) => a.stage_order - b.stage_order);
    });
    return grouped;
  },

  // Get unique categories from items
  getCategories: () => {
    const { items } = get();
    const categories = new Set();
    items.forEach(item => {
      if (item.category) categories.add(item.category);
    });
    return Array.from(categories).sort();
  },

  // Get unique owners from items
  getOwners: () => {
    const { items } = get();
    const owners = new Set();
    items.forEach(item => {
      if (item.owner) owners.add(item.owner);
    });
    return Array.from(owners).sort();
  }
}));

export default useInnovationStore;
