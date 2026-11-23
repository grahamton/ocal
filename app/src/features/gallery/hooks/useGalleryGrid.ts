import {useEffect, useMemo, useState} from 'react';
import {subscribeToFinds} from '@/shared/localDb';
import {FindRecord} from '@/shared/types';

export type FilterMode = 'all' | 'favorites';

type HookOptions = {
  refreshKey: number;
  onSelect?: (item: FindRecord) => void;
};

export function useGalleryGrid({refreshKey, onSelect}: HookOptions) {
  const [items, setItems] = useState<FindRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterMode>('all');

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

  const filteredItems = useMemo(
    () => (filter === 'favorites' ? items.filter(i => i.favorite) : items),
    [items, filter],
  );

  const handleItemPress = (item: FindRecord) => onSelect?.(item);

  return {items, error, filter, setFilter, filteredItems, handleItemPress};
}
