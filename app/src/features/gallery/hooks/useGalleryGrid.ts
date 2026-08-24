import {useEffect, useMemo, useState} from 'react';
import {subscribeToFinds} from '@/shared/firestoreService';
import {FindRecord} from '@/shared/types';
import {useSession} from '@/shared/SessionContext';
import {useSelectionStore} from '@/shared/store/useSelectionStore';

type FilterMode = 'all' | 'favorites' | 'session';
type ViewMode = 'grid' | 'list';

type HookOptions = {
  refreshKey: number;
  initialSessionId?: string | null;
  onSelect?: (item: FindRecord) => void;
};

export function useGalleryGrid({
  refreshKey,
  initialSessionId,
  onSelect,
}: HookOptions) {
  const [items, setItems] = useState<FindRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterMode>(
    initialSessionId ? 'session' : 'all',
  );
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const {activeSession, sessions} = useSession();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    initialSessionId || null,
  );

  const {isSelectionMode, selectedIds, toggleSelection, enterSelectionMode} =
    useSelectionStore();

  useEffect(() => {
    if (activeSession && !selectedSessionId && !initialSessionId) {
      const activeId = activeSession.id;
      Promise.resolve().then(() => {
        setSelectedSessionId(activeId);
      });
    }
  }, [activeSession, initialSessionId, selectedSessionId]);

  useEffect(() => {
    if (initialSessionId) {
      Promise.resolve().then(() => {
        setSelectedSessionId(initialSessionId);
        setFilter('session');
      });
    }
  }, [initialSessionId]);

  useEffect(() => {
    const unsubscribe = subscribeToFinds(
      finds => {
        setItems(finds);
        setError(null);
      },
      err => {
        setError(
          'Failed to load finds. You might be offline or an error occurred.',
        );
        console.error(err);
      },
    );
    return () => unsubscribe();
  }, [refreshKey]);

  const filteredItems = useMemo(() => {
    if (filter === 'all') return items;
    if (filter === 'favorites') return items.filter(item => item.favorite);
    if (filter === 'session' && selectedSessionId)
      return items.filter(item => item.sessionId === selectedSessionId);
    return items;
  }, [items, filter, selectedSessionId]);

  const recentSessions = useMemo(() => {
    return sessions.slice(0, 5);
  }, [sessions]);

  const handleItemPress = (item: FindRecord) => {
    if (isSelectionMode) {
      toggleSelection(item.id);
    } else {
      onSelect?.(item);
    }
  };

  return {
    items,
    error,
    filter,
    setFilter,
    viewMode,
    setViewMode,
    selectedSessionId,
    setSelectedSessionId,
    activeSession,
    sessions,
    recentSessions,
    isSelectionMode,
    selectedIds,
    toggleSelection,
    enterSelectionMode,
    filteredItems,
    handleItemPress,
  };
}
