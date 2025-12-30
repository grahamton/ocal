import { useEffect, useMemo, useState } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { listFinds } from '../../shared/db';
import { formatCoords } from '../../shared/format';
import { FindRecord } from '../../shared/types';

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
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>No photos yet. Snap a find to see it here.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* INBOX SECTION */}
      {inbox.length > 0 && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Inbox ({inbox.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.inboxRow}>
            {inbox.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.inboxTile}
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
        <Text style={styles.sectionHeader}>Collection</Text>
        {collection.length === 0 ? (
           <View style={styles.emptyCollection}>
             <Text style={styles.emptySubText}>Nothing in your collection yet. Process your inbox!</Text>
           </View>
        ) : (
          <View style={styles.grid}>
            {collection.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.tile}
                activeOpacity={0.85}
                onPress={() => onSelect?.(item)}
              >
                <Image source={{ uri: item.photoUri }} style={styles.image} />
                <View style={styles.cardBody}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.titleText} numberOfLines={1}>
                      {item.label || 'Untitled'}
                    </Text>
                  </View>
                  {/* Only show badge if it's a real category, not Unsorted */}
                  {(item.category && item.category !== 'Unsorted') ? (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.category.toUpperCase()}</Text>
                    </View>
                  ) : null}
                  <Text style={styles.metaText} numberOfLines={1}>
                    {formatCoords(item.lat, item.long) || 'No location'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
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
    color: '#fff', // High contrast on gradient
    paddingHorizontal: 4,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  emptyBox: {
    padding: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyCollection: {
    padding: 20,
    alignItems: 'center',
  },
  emptySubText: {
    color: 'rgba(255,255,255,0.6)',
    fontStyle: 'italic',
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
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
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
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
    color: '#0f172a',
    flex: 1,
  },
  metaText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 13,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#0f172a', // Dark tag for contrast
    marginBottom: 2,
  },
  badgeText: {
    fontWeight: '800',
    fontSize: 10,
    color: '#f8fafc',
  },
});
