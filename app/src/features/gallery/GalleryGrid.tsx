import { useEffect, useMemo, useState } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { listFinds } from '../../shared/db';
import { formatCoords } from '../../shared/format';
import { FindRecord } from '../../shared/types';
import { useTheme } from '../../shared/ThemeContext';
import { useSelection } from '../../shared/SelectionContext';
import { Ionicons } from '@expo/vector-icons';

const spacing = 12; // Increased spacing for cleaner look
const numColumns = 2;
// Standard tile width
const cardWidth = (Dimensions.get('window').width - 16 * 2 - spacing * (numColumns - 1)) / numColumns;
// Inbox tile width (slightly smaller for horizontal scroll)
const inboxCardWidth = 140;

type Props = {
  refreshKey: number;
  onSelect?: (item: FindRecord) => void;
};
export function GalleryGrid({ refreshKey, onSelect }: Props) {
  const [items, setItems] = useState<FindRecord[]>([]);
  const { colors } = useTheme();
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

  const { inbox, collection } = useMemo(() => {
    const drafts: FindRecord[] = [];
    const cataloged: FindRecord[] = [];

    // Sort by date desc
    const sorted = [...items].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    sorted.forEach(item => {
      if (item.status === 'draft') {
        drafts.push(item);
      } else {
        cataloged.push(item);
      }
    });

    return { inbox: drafts, collection: cataloged };
  }, [items]);

  if (items.length === 0) {
    return (
      <View style={[styles.emptyBox, { backgroundColor: colors.card }]}>
        <Text style={[styles.emptyText, { color: colors.text }]}>No photos yet. Snap a find to see it here.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* INBOX SECTION */}
      {inbox.length > 0 && (
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionHeader, { color: colors.text }]}>Inbox ({inbox.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.inboxRow}>
            {inbox.map(item => (
              <TouchableOpacity
                key={item.id}
                style={[styles.inboxTile, { borderColor: colors.border, backgroundColor: colors.card }]} // Updated
                activeOpacity={0.8}
                onPress={() => onSelect?.(item)}
              >
                <Image source={{ uri: item.photoUri }} style={styles.inboxImage} />
                <View style={styles.inboxOverlay}>
                  <Text style={styles.inboxTime}>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* COLLECTION SECTION */}
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionHeader, { color: colors.text }]}>Collection</Text>
        {collection.length === 0 ? (
           <View style={styles.emptyCollection}>
             <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>Nothing in your collection yet. Process your inbox!</Text>
           </View>
        ) : (
          <View style={styles.grid}>
            {collection.map(item => {
              const isSelected = selectedIds.has(item.id);
              return (
              <TouchableOpacity
                key={item.id}
                style={[
                    styles.tile,
                    { backgroundColor: colors.card, borderColor: isSelected ? colors.accent : colors.border },
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
                {isSelected && (
                    <View style={styles.selectionOverlay}>
                        <Ionicons name="checkmark-circle" size={32} color={colors.accent} />
                    </View>
                )}
                <View style={styles.cardBody}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.titleText, { color: colors.text }]} numberOfLines={1}>
                      {item.label || 'Untitled'}
                    </Text>
                  </View>
                  {/* Only show badge if it's a real category, not Unsorted */}
                  {(item.category && item.category !== 'Unsorted') ? (
                    <View style={[styles.badge, { backgroundColor: colors.text }]}>
                        <Text style={[styles.badgeText, { color: colors.background }]}>{item.category.toUpperCase()}</Text>
                    </View>
                  ) : null}
                  <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
                    {formatCoords(item.lat, item.long) || 'No location'}
                  </Text>
                </View>
              </TouchableOpacity>
            )})}
          </View>
        )}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
  },
  sectionContainer: {
    gap: 12,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '800',
    // color removed, handled inline
    paddingHorizontal: 4,
  },
  emptyBox: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    // bg handled inline
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    // color handled inline
  },
  emptyCollection: {
    padding: 20,
    alignItems: 'center',
  },
  emptySubText: {
    fontStyle: 'italic',
    // color handled inline
  },

  // INBOX STYLES
  inboxRow: {
    gap: 12,
    paddingRight: 16,
  },
  inboxTile: {
    width: inboxCardWidth,
    height: inboxCardWidth, // Square
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    // colors handled inline
  },
  inboxImage: {
    width: '100%',
    height: '100%',
    opacity: 0.9,
  },
  inboxOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  inboxTime: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },

  // GRID STYLES
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing,
  },
  tile: {
    width: cardWidth,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    // colors handled inline
    // Elevation for pop
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: cardWidth * 0.85, // Slightly taller image area
    backgroundColor: '#f1f5f9',
  },
  cardBody: {
    padding: 12,
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleText: {
    fontWeight: '800',
    fontSize: 16, // Larger for seniors
    flex: 1,
    // color inline
  },
  metaText: {
    fontWeight: '600',
    fontSize: 13,
    // color inline
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 2,
    // bg inline
  },
  badgeText: {
    fontWeight: '800',
    fontSize: 10,
    // color inline
  },
  selectionOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    zIndex: 10,
  },
});
