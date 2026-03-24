import { create } from 'zustand';

interface SelectionState {
  isSelectionMode: boolean;
  selectedIds: Set<string>;
  enterSelectionMode: (initialId?: string) => void;
  exitSelectionMode: () => void;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;
  selectAll: (ids: string[]) => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  isSelectionMode: false,
  selectedIds: new Set<string>(),

  enterSelectionMode: (initialId?: string) =>
    set(() => ({
      isSelectionMode: true,
      selectedIds: initialId ? new Set([initialId]) : new Set(),
    })),

  exitSelectionMode: () =>
    set(() => ({
      isSelectionMode: false,
      selectedIds: new Set(),
    })),

  toggleSelection: (id: string) =>
    set((state) => {
      const next = new Set(state.selectedIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { selectedIds: next };
    }),

  clearSelection: () =>
    set(() => ({
      selectedIds: new Set(),
    })),

  selectAll: (ids: string[]) =>
    set(() => ({
      selectedIds: new Set(ids),
    })),
}));
