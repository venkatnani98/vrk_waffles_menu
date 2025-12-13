import { create } from "zustand";

export const useCartStore = create((set, get) => ({
  items: {},

  addItem: (item) => {
    const items = get().items;
    const existing = items[item.id];

    const updated = {
      ...items,
      [item.id]: {
        ...item,
        qty: existing ? existing.qty + 1 : 1
      }
    };

    set({ items: updated });
  },

  increment: (id) => {
    const items = get().items;
    const existing = items[id];

    if (!existing) return;

    set({
      items: {
        ...items,
        [id]: { ...existing, qty: existing.qty + 1 }
      }
    });
  },

  decrement: (id) => {
    const items = get().items;
    const existing = items[id];

    if (!existing) return;

    if (existing.qty <= 1) {
      const { [id]: _, ...rest } = items;
      set({ items: rest });
    } else {
      set({
        items: {
          ...items,
          [id]: { ...existing, qty: existing.qty - 1 }
        }
      });
    }
  },

  getCount: () => {
    return Object.values(get().items)
      .reduce((sum, item) => sum + item.qty, 0);
  },

  clear: () => set({ items: {} }),

}));
