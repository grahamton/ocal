import {useEffect, useMemo, useState} from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {subscribeToFinds} from '@/shared/firestoreService';
import {formatLocationSync} from '@/shared/format';
import {FindRecord} from '@/shared/types';
import {useTheme} from '@/shared/ThemeContext';
import {useSelectionStore} from '@/shared/store/useSelectionStore';
import {useSession} from '@/shared/SessionContext';
import {Ionicons} from '@expo/vector-icons';

import {StatusIcon} from '@/shared/components/StatusIcon';
import {getCategoryFromTags} from '@/shared/CategoryMapper';

const spacing = 12;

type Props = {
  refreshKey: number;
  onSelect?: (item: FindRecord) => void;
  initialSessionId?: string | null;
};

type ViewMode = 'grid' | 'list';
type FilterMode = 'all' | 'favorites' | 'session';

export function GalleryGrid({refreshKey, onSelect, initialSessionId}: Props) {
  const [items, setItems] = useState<FindRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterMode>(initialSessionId ? 'session' : 'all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const {activeSession, sessions} = useSession();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(initialSessionId || null);

  // Sync selectedSessionId with activeSession when it changes, but ONLY if no initialSessionId
  useEffect(() => {
    if (activeSession && !selectedSessionId && !initialSessionId) {
      setSelectedSessionId(activeSession.id);
    }
  }, [activeSession, initialSessionId]);

  // Handle updates to initialSessionId
  useEffect(() => {
    if (initialSessionId) {
      setSelectedSessionId(initialSessionId);
      setFilter('session');
    }
  }, [initialSessionId]);

  // Responsive Columns
  const {width} = useWindowDimensions();
  const numColumns = width > 600 ? 3 : 2; // Tablet = 3, Phone = 2
  const cardWidth = (width - 48 - spacing * (numColumns - 1)) / numColumns;

  const {colors, mode} = useTheme();
  const {isSelectionMode, selectedIds, toggleSelection, enterSelectionMode} =
    useSelectionStore();

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

  const allItems = useMemo(() => {
    return items;
  }, [items]);

  const filteredItems = useMemo(() => {
    if (filter === 'all') return allItems;
    if (filter === 'favorites') return allItems.filter(item => item.favorite);
    if (filter === 'session' && selectedSessionId)
      return allItems.filter(item => item.sessionId === selectedSessionId);
    return allItems;
  }, [allItems, filter, selectedSessionId]);

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString(undefined, {month: 'short', day: 'numeric'});
  };

  const getAiResult = (data: FindRecord['aiData']) => {
    return data?.result || null;
  };

  const renderGridItem = (item: FindRecord) => {
    const isSelected = selectedIds.has(item.id);
    const aiResult = getAiResult(item.aiData);
    const displayLabel = item.label || aiResult?.best_guess?.label || 'Unknown';

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.tile,
          {
            width: cardWidth,
            backgroundColor: colors.card,
            borderColor: isSelected ? colors.accent : colors.border,
          },
          isSelected && {borderWidth: 3},
        ]}
        activeOpacity={0.85}
        onLongPress={() => enterSelectionMode(item.id)}
        onPress={() => {
          if (isSelectionMode) {
            toggleSelection(item.id);
          } else {
            onSelect?.(item);
          }
        }}>
        <Image source={{uri: item.photoUri}} style={styles.image} />

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.3)']}
          style={styles.gradientOverlay}
        />

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

        {!aiResult && !isSelected && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <StatusIcon
              status="rough"
              size={40}
              theme={mode === 'high-contrast' ? 'beach' : 'journal'}
            />
          </View>
        )}

        <View style={styles.cardBody}>
          <Text
            style={[styles.titleText, {color: colors.text}]}
            numberOfLines={1}>
            {displayLabel}
          </Text>

          <Text
            style={[styles.locationText, {color: colors.textSecondary}]}
            numberOfLines={1}>
            {item.location_text || formatLocationSync(item.lat, item.long)}
          </Text>

          <Text
            style={[styles.sessionText, {color: colors.textSecondary}]}
            numberOfLines={1}>
            {formatDate(item.timestamp)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderListItem = (item: FindRecord) => {
    const isSelected = selectedIds.has(item.id);
    const aiResult = getAiResult(item.aiData);
    const displayLabel = item.label || aiResult?.best_guess?.label || 'Unknown';

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.listItem,
          {
            backgroundColor: colors.card,
            borderColor: isSelected ? colors.accent : colors.border,
          },
          isSelected && {borderLeftWidth: 4},
        ]}
        activeOpacity={0.85}
        onLongPress={() => enterSelectionMode(item.id)}
        onPress={() => {
          if (isSelectionMode) {
            toggleSelection(item.id);
          } else {
            onSelect?.(item);
          }
        }}>
        <Image source={{uri: item.photoUri}} style={styles.listImage} />

        <View style={styles.listContent}>
          <View style={styles.listTitleRow}>
            {item.favorite && (
              <Ionicons
                name="star"
                size={16}
                color="#fbbf24"
                style={{marginRight: 4}}
              />
            )}
            <Text
              style={[styles.listTitle, {color: colors.text}]}
              numberOfLines={1}>
              {displayLabel}
            </Text>
            {aiResult && (
              <StatusIcon
                status="polished"
                size={24}
                category={getCategoryFromTags(
                  [aiResult.best_guess?.category || ''],
                  aiResult.best_guess?.label,
                )}
                theme={mode === 'high-contrast' ? 'beach' : 'journal'}
                style={{marginLeft: 8}}
              />
            )}
            {!aiResult && (
              <StatusIcon
                status="rough"
                size={24}
                theme={mode === 'high-contrast' ? 'beach' : 'journal'}
                style={{marginLeft: 8}}
              />
            )}
          </View>

          <Text
            style={[styles.listMeta, {color: colors.textSecondary}]}
            numberOfLines={1}>
            {item.location_text || formatLocationSync(item.lat, item.long)} •{' '}
            {formatDate(item.timestamp)}
          </Text>
        </View>

        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color={colors.accent} />
        )}
      </TouchableOpacity>
    );
  };

  const recentSessions = useMemo(() => {
    return sessions.slice(0, 5); // Show last 5 sessions
  }, [sessions]);

  if (error) {
    return (
      <View style={[styles.emptyBox, {backgroundColor: colors.card}]}>
        <Ionicons
          name="cloud-offline-outline"
          size={48}
          color={colors.danger}
          style={{marginBottom: 16}}
        />
        <Text style={[styles.emptyText, {color: colors.text}]}>
          Error Loading Finds
        </Text>
        <Text
          style={[
            styles.emptySubText,
            {color: colors.textSecondary, marginTop: 8},
          ]}>
          {error}
        </Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={[styles.emptyBox, {backgroundColor: colors.card}]}>
        <Ionicons
          name="camera-outline"
          size={48}
          color={colors.accent}
          style={{marginBottom: 16}}
        />
        <Text style={[styles.emptyText, {color: colors.text}]}>
          Your collection is empty.
        </Text>
        <Text
          style={[
            styles.emptySubText,
            {color: colors.textSecondary, marginTop: 8},
          ]}>
          Ready for a walk? Tap Capture to start finding treasures.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.sectionContainer}>
        <View style={styles.collectionHeader}>
          <Text style={[styles.sectionHeader, {color: colors.text}]}>
            Your Finds ({allItems.length})
          </Text>

          <View style={styles.headerActions}>
            <View style={styles.viewSwitcher}>
              <TouchableOpacity
                style={[
                  styles.viewBtn,
                  viewMode === 'grid' && {backgroundColor: colors.accent},
                ]}
                onPress={() => setViewMode('grid')}>
                <Ionicons
                  name="grid"
                  size={16}
                  color={viewMode === 'grid' ? '#fff' : colors.textSecondary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.viewBtn,
                  viewMode === 'list' && {backgroundColor: colors.accent},
                ]}
                onPress={() => setViewMode('list')}>
                <Ionicons
                  name="list"
                  size={16}
                  color={viewMode === 'list' ? '#fff' : colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          <TouchableOpacity
            style={[
              styles.filterTab,
              filter === 'all' && {backgroundColor: colors.accent},
            ]}
            onPress={() => setFilter('all')}>
            <Text
              style={[
                styles.filterTabText,
                {color: filter === 'all' ? '#fff' : colors.textSecondary},
              ]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterTab,
              filter === 'favorites' && {backgroundColor: colors.accent},
            ]}
            onPress={() => setFilter('favorites')}>
            <Ionicons
              name="star"
              size={12}
              color={filter === 'favorites' ? '#fff' : '#fbbf24'}
              style={{marginRight: 4}}
            />
            <Text
              style={[
                styles.filterTabText,
                {color: filter === 'favorites' ? '#fff' : colors.textSecondary},
              ]}>
              Favorites
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterTab,
              filter === 'session' && {backgroundColor: colors.accent},
            ]}
            onPress={() => {
              setFilter('session');
              if (!selectedSessionId && activeSession) {
                setSelectedSessionId(activeSession.id);
              }
            }}>
            <Text
              style={[
                styles.filterTabText,
                {color: filter === 'session' ? '#fff' : colors.textSecondary},
              ]}>
              By Walk
            </Text>
          </TouchableOpacity>
        </View>

        {/* Session Picker (Sub-filters) */}
        {filter === 'session' && sessions.length > 0 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sessionPickerScroll}
          >
            {recentSessions.map(session => (
              <TouchableOpacity
                key={session.id}
                style={[
                  styles.sessionChip,
                  selectedSessionId === session.id && {
                    backgroundColor: colors.accent + '20',
                    borderColor: colors.accent,
                  },
                  {borderColor: colors.border}
                ]}
                onPress={() => setSelectedSessionId(session.id)}>
                <Text
                  style={[
                    styles.sessionChipText,
                    {color: selectedSessionId === session.id ? colors.accent : colors.textSecondary}
                  ]}>
                  {session.name}
                  {session.status === 'active' && ' 🔴'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {filteredItems.length === 0 ? (
          <View style={styles.emptyCollection}>
            <Text style={[styles.emptySubText, {color: colors.textSecondary}]}>
              {filter === 'session' && !selectedSessionId 
                ? 'Select a walk to see finds.' 
                : 'No finds match this filter.'}
            </Text>
          </View>
        ) : viewMode === 'grid' ? (
          <View style={styles.grid}>{filteredItems.map(renderGridItem)}</View>
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
  filterTabs: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '700',
  },
  sessionPickerScroll: {
    paddingHorizontal: 4,
    gap: 8,
    paddingBottom: 4,
  },
  sessionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  sessionChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing,
    paddingHorizontal: 4,
    marginBottom: 40,
  },
  tile: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '40%',
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
