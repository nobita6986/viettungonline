import { create } from 'zustand';

export interface ComboComponentItem {
  componentId: string;
  name: string;
  sku: string;
  stockQty: number;
  buyPrice: number;
  quantity: number; // Number of items required in this combo
}

interface ComboState {
  components: ComboComponentItem[];
  
  // Actions
  addComponent: (item: Omit<ComboComponentItem, 'quantity'>) => void;
  removeComponent: (componentId: string) => void;
  updateQuantity: (componentId: string, quantity: number) => void;
  clearComponents: () => void;
  
  // Computed (will be used directly in components)
  getTotalBuyPrice: () => number;
  getMaxComboAvailable: () => number;
}

export const useComboStore = create<ComboState>((set, get) => ({
  components: [],

  addComponent: (item) => set((state) => {
    const existing = state.components.find(c => c.componentId === item.componentId);
    if (existing) {
      return {
        components: state.components.map(c => 
          c.componentId === item.componentId 
            ? { ...c, quantity: c.quantity + 1 }
            : c
        )
      };
    }
    return {
      components: [...state.components, { ...item, quantity: 1 }]
    };
  }),

  removeComponent: (componentId) => set((state) => ({
    components: state.components.filter(c => c.componentId !== componentId)
  })),

  updateQuantity: (componentId, quantity) => set((state) => ({
    components: state.components.map(c => 
      c.componentId === componentId 
        ? { ...c, quantity: Math.max(1, quantity) }
        : c
    )
  })),

  clearComponents: () => set({ components: [] }),

  getTotalBuyPrice: () => {
    const { components } = get();
    return components.reduce((total, item) => total + (item.buyPrice * item.quantity), 0);
  },

  getMaxComboAvailable: () => {
    const { components } = get();
    if (components.length === 0) return 0;
    
    let max = Infinity;
    for (const item of components) {
      if (item.quantity <= 0) continue;
      const possible = Math.floor(item.stockQty / item.quantity);
      if (possible < max) max = possible;
    }
    return max === Infinity ? 0 : max;
  }
}));
