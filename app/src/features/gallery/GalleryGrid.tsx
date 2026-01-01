import { useEffect, useMemo, useState } from 'react';
import { DeviceEventEmitter, Image, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { listFinds } from '../../shared/db';
import { formatLocationSync } from '../../shared/format';
import { FindRecord } from '../../shared/types';
import { useTheme } from '../../shared/ThemeContext';
import { useSelection } from '../../shared/SelectionContext';
import { useSession } from '../../shared/SessionContext';
import { Ionicons } from '@expo/vector-icons';

import { StatusIcon } from '../../../components/StatusIcon';
import { getCategoryFromTags } from '../../../utils/CategoryMapper';

const spacing = 12;

type Props = {
  refreshKey: number;
  onSelect?: (item: FindRecord) => void;
};

type ViewMode = 'grid' | 'list';

export function GalleryGrid({ refreshKey, onSelect }: Props) {
  const [items, setItems] = useState<FindRecord[]>([]);
  const [filter, setFilter] = useState<'all' | 'favorites' | 'session'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const { activeSession } = useSession();

  // Responsive Columns
  const { width } = useWindowDimensions();
  const numColumns = width > 600 ? 3 : 2; // Tablet = 3, Phone = 2
  // Subtracting 48 instead of 32 to account for potential parent padding variation (safe buffer)
  const cardWidth = (width - 48 - spacing * (numColumns - 1)) / numColumns;

  const { colors, mode } = useTheme();
  const { isSelectionMode, selectedIds, toggleSelection, enterSelectionMode } = useSelection();

  useEffect(() => {
    let active = true;
    (async () => {
      const rows = await listFinds();
      if (active) setItems(rows);
    })();
    return () => {
      active = false;
    };
  }, [refreshKey]);

  const allItems = useMemo(() => {
    return [...items].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [items]);

  const filteredItems = useMemo(() => {
    if (filter === 'all') return allItems;
    if (filter === 'favorites') return allItems.filter(item => item.favorite);
    if (filter === 'session' && activeSession) return allItems.filter(item => item.sessionId === activeSession.id);
    return allItems;
  }, [allItems, filter, activeSession]);



  // Auto-refresh when AI processing completes
  // Auto-refresh when AI processing completes
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('AI_IDENTIFY_SUCCESS', async () => {
        // Refresh data
        const rows = await listFinds();
        setItems(rows);
    });
    return () => {
        subscription.remove();
    };
  }, []);



  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const renderGridItem = (item: FindRecord) => {
    const isSelected = selectedIds.has(item.id);

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.tile,
          {
            width: cardWidth,
            backgroundColor: colors.card,
            borderColor: isSelected ? colors.accent : colors.border
          },
          isSelected && { borderWidth: 3 }
        ]}
        activeOpacity={0.85}
        onLongPress={() => enterSelectionMode(item.id)}
        onPress={() => {
          if (isSelectionMode) {
            toggleSelection(item.id);
          } else {
            onSelect?.(item);
          }
        }}
      >
        <Image source={{ uri: item.photoUri }} style={styles.image} />

        {/* Subtle Gradient Overlay for depth */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.3)']}
          style={styles.gradientOverlay}
        />

        {/* Favorite Star (Top-Left) */}
        {item.favorite && (
          <View style={styles.favoriteBadge}>
            <Ionicons name="star" size={16} color="#fbbf24" />
          </View>
        )}

        {isSelected && (
          <View style={styles.selectionOverlay}>
            <Ionicons name="checkmark-circle" size={32} color={colors.accent} />
          </View>
        )}

        {/* Rough Status Overlay - Only if not analyzed */}
        {!item.aiData && !isSelected && (
           <View style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center'}}>
               <StatusIcon status="rough" size={40} theme={mode === 'high-contrast' ? 'beach' : 'journal'} />
           </View>
        )}

        <View style={styles.cardBody}>
          {/* Title */}
          <Text style={[styles.titleText, { color: colors.text }]} numberOfLines={1}>
            {item.label || item.aiData?.best_guess?.label || 'Unknown'}
          </Text>

          {/* Location */}
          <Text style={[styles.locationText, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.location_text || formatLocationSync(item.lat, item.long)}
          </Text>

          {/* Session/Date */}
          <Text style={[styles.sessionText, { color: colors.textSecondary }]} numberOfLines={1}>
            {formatDate(item.timestamp)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderListItem = (item: FindRecord) => {
    const isSelected = selectedIds.has(item.id);

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.listItem,
          { backgroundColor: colors.card, borderColor: isSelected ? colors.accent : colors.border },
          isSelected && { borderLeftWidth: 4 }
        ]}
        activeOpacity={0.85}
        onLongPress={() => enterSelectionMode(item.id)}
        onPress={() => {
          if (isSelectionMode) {
            toggleSelection(item.id);
          } else {
            onSelect?.(item);
          }
        }}
      >
        <Image source={{ uri: item.photoUri }} style={styles.listImage} />

        <View style={styles.listContent}>
          <View style={styles.listTitleRow}>
            {item.favorite && (
              <Ionicons name="star" size={16} color="#fbbf24" style={{ marginRight: 4 }} />
            )}
            <Text style={[styles.listTitle, { color: colors.text }]} numberOfLines={1}>
              {item.label || item.aiData?.best_guess?.label || 'Unknown'}
            </Text>
            {/* Category Icon Mini */}
            {item.aiData && (
               <StatusIcon
                  status="polished"
                  size={24}
                  category={getCategoryFromTags([item.aiData?.best_guess?.category || ''], item.aiData?.best_guess?.label)}
                  theme={mode === 'high-contrast' ? 'beach' : 'journal'}
                  style={{marginLeft: 8}}
               />
            )}
            {!item.aiData && (
               <StatusIcon status="rough" size={24} theme={mode === 'high-contrast' ? 'beach' : 'journal'} style={{marginLeft: 8}} />
            )}
          </View>

          <Text style={[styles.listMeta, { color: colors.textSecondary }]} numberOfLines={1}>
            {(item.location_text || formatLocationSync(item.lat, item.long))} • {formatDate(item.timestamp)}
          </Text>
        </View>

        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color={colors.accent} />
        )}
      </TouchableOpacity>
    );
  };

  if (items.length === 0) {
    return (
      <View style={[styles.emptyBox, { backgroundColor: colors.card }]}>
        <Ionicons name="camera-outline" size={48} color={colors.accent} style={{ marginBottom: 16 }} />
        <Text style={[styles.emptyText, { color: colors.text }]}>Your collection is empty.</Text>
        <Text style={[styles.emptySubText, { color: colors.textSecondary, marginTop: 8 }]}>
          Ready for a walk? Tap Capture to start finding treasures.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.sectionContainer}>
        <View style={styles.collectionHeader}>
          <Text style={[styles.sectionHeader, { color: colors.text }]}>Your Finds ({allItems.length})</Text>

          <View style={styles.headerActions}>
            {/* View Mode Switcher */}
            <View style={styles.viewSwitcher}>
              <TouchableOpacity
                style={[styles.viewBtn, viewMode === 'grid' && { backgroundColor: colors.accent }]}
                onPress={() => setViewMode('grid')}
              >
                <Ionicons name="grid" size={16} color={viewMode === 'grid' ? '#fff' : colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.viewBtn, viewMode === 'list' && { backgroundColor: colors.accent }]}
                onPress={() => setViewMode('list')}
              >
                <Ionicons name="list" size={16} color={viewMode === 'list' ? '#fff' : colors.textSecondary} />
              </TouchableOpacity>
            </View>

          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          {activeSession && (
             <TouchableOpacity
                style={[styles.filterTab, filter === 'session' && { backgroundColor: colors.accent }]}
                onPress={() => setFilter('session')}
              >
                <Text style={[styles.filterTabText, { color: filter === 'session' ? '#fff' : colors.textSecondary }]}>
                  Current Walk ({allItems.filter(i => i.sessionId === activeSession.id).length})
                </Text>
              </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.filterTab, filter === 'all' && { backgroundColor: colors.accent }]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterTabText, { color: filter === 'all' ? '#fff' : colors.textSecondary }]}>
              All ({allItems.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'favorites' && { backgroundColor: colors.accent }]}
            onPress={() => setFilter('favorites')}
          >
            <Ionicons name="star" size={12} color={filter === 'favorites' ? '#fff' : '#fbbf24'} style={{marginRight: 4}} />
            <Text style={[styles.filterTabText, { color: filter === 'favorites' ? '#fff' : colors.textSecondary }]}>
              Favorites ({allItems.filter(i => i.favorite).length})
            </Text>
          </TouchableOpacity>
        </View>

        {filteredItems.length === 0 ? (
          <View style={styles.emptyCollection}>
            <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>
              {filter === 'all' ? 'No finds yet. Capture your first one!' :
               'No favorite finds yet. Tap the star to save one!'}
            </Text>
          </View>
        ) : viewMode === 'grid' ? (
          <View style={styles.grid}>
            {filteredItems.map(renderGridItem)}
          </View>
        ) : (
          <View style={styles.listContainer}>
            {filteredItems.map(renderListItem)}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionContainer: {
    gap: 12,
  },
  collectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  viewSwitcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    padding: 2,
  },
  viewBtn: {
    padding: 6,
    borderRadius: 6,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'Outfit_800ExtraBold',
  },
  analyzeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  analyzeAllText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  filterTabs: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  // Grid View Styles
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing,
    paddingHorizontal: 4,
    marginBottom: 40, // Extra space at bottom
  },
  tile: {
    // width handled inline
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    backgroundColor: '#fff', // Fallback for transparency
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '40%', // Subtle darkened bottom
  },
  image: {
    width: '100%',
    aspectRatio: 1,
  },
  favoriteBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  selectionOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    zIndex: 10,
  },
  cardBody: {
    padding: 12,
    gap: 4,
  },
  titleText: {
    fontWeight: '800',
    fontSize: 18,
    fontFamily: 'Outfit_800ExtraBold',
  },
  locationText: {
    fontWeight: '600',
    fontSize: 14,
  },
  sessionText: {
    fontWeight: '500',
    fontSize: 12,
  },
  // List View Styles
  listContainer: {
    gap: 8,
    paddingHorizontal: 4,
  },
  listItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    alignItems: 'center',
  },
  listImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  listContent: {
    flex: 1,
    gap: 4,
  },
  listTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  listMeta: {
    fontSize: 13,
  },
  // Empty States
  emptyBox: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  emptyCollection: {
    padding: 32,
    alignItems: 'center',
  },
  emptySubText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});
