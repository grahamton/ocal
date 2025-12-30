import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

type SelectionContextType = {
  isSelectionMode: boolean;
  selectedIds: Set<string>;
  enterSelectionMode: (initialId?: string) => void;
  exitSelectionMode: () => void;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;
  selectAll: (ids: string[]) => void;
};

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const enterSelectionMode = useCallback((initialId?: string) => {
    setIsSelectionMode(true);
    if (initialId) {
      setSelectedIds(new Set([initialId]));
    }
  }, []);

  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      // Auto-exit if empty? Maybe not, usually frustrating.
      // Keeping mode active allows clearing all then picking new ones.

      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  return (
    <SelectionContext.Provider
      value={{
        isSelectionMode,
        selectedIds,
        enterSelectionMode,
        exitSelectionMode,
        toggleSelection,
        clearSelection,
        selectAll,
      }}
    >
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error('useSelection must be used within a SelectionProvider');
  }
  return context;
}
