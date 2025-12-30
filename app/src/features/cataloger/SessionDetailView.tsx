import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getSession, listFinds, updateFindMetadata } from '../../shared/db';
import { useSession } from '../../shared/SessionContext';
import { FindRecord, Session } from '../../shared/types';
import { GlassView } from '../../shared/components/GlassView';
import { THEME } from '../../shared/theme';
import { useSelection } from '../../shared/SelectionContext';
import { FlipCard } from '../../shared/components/FlipCard';

type Props = {
  sessionId: string;
  refreshKey: number;
  onBack: () => void;
  onUpdated?: () => void;
};

// Context: Phase 2 - Session detail view with metrics and batch actions scaffold.
export function SessionDetailView({ sessionId, refreshKey, onBack, onUpdated }: Props) {
  const { activeSession, endSessionById } = useSession();
  const [session, setSession] = useState<Session | null>(null);
  const [finds, setFinds] = useState<FindRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [ending, setEnding] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const { isSelectionMode, selectedIds, enterSelectionMode, toggleSelection } = useSelection();
  const [flippedId, setFlippedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const s = await getSession(sessionId);
    setSession(s);
    const items = await listFinds({ sessionId });
    setFinds(items);
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load, refreshKey]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNowMs(Date.now());
  }, [sessionId, session?.endTime, refreshKey]);

  const metrics = useMemo(() => {
    const total = finds.length;
    const categories = new Set(finds.map((f) => f.category || 'Unlabeled'));
    const durationMs = session?.endTime
      ? session.endTime - session.startTime
      : nowMs - (session?.startTime ?? 0);
    const minutes = Math.max(1, Math.round(durationMs / 60000));
    return { total, categories: categories.size, minutes };
  }, [finds, nowMs, session?.endTime, session?.startTime]);

  const handleEndSession = useCallback(async () => {
    if (!session) return;
    setEnding(true);
    await endSessionById(session.id);
    await load();
    onUpdated?.();
    setEnding(false);
  }, [endSessionById, load, onUpdated, session]);

  const toggleFavorite = async (findId: string, next: boolean) => {
    await updateFindMetadata(findId, { favorite: next });
    await load();
    onUpdated?.();
  };

  const onItemPress = (id: string) => {
    if (isSelectionMode) {
      toggleSelection(id);
    } else {
      setFlippedId((current) => (current === id ? null : id));
    }
  };

  const onItemLongPress = (id: string) => {
    if (!isSelectionMode) {
      if (flippedId) setFlippedId(null);
      enterSelectionMode(id);
    }
  };

  if (!session) {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>Session not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.heading}>{session.name}</Text>
          <Text style={styles.subtle}>
            {new Date(session.startTime).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <Metric label="Finds" value={metrics.total.toString()} />
        <Metric label="Categories" value={metrics.categories.toString()} />
        <Metric label="Minutes" value={metrics.minutes.toString()} />
      </View>

      {session.status === 'active' ? (
        <TouchableOpacity style={styles.endButton} onPress={handleEndSession} disabled={ending}>
          {ending ? <ActivityIndicator color="#fff" /> : <Text style={styles.endText}>End Session</Text>}
        </TouchableOpacity>
      ) : (
        <Text style={styles.subtle}>Completed</Text>
      )}

      {!isSelectionMode ? (
        <GlassView style={styles.toolbar} intensity={10}>
          <Text style={styles.toolbarText}>Tip:</Text>
          <Text style={styles.toolbarHint}>Tap to flip. Long press to select.</Text>
        </GlassView>
      ) : null}

      {loading ? <ActivityIndicator color={THEME.colors.text} /> : null}
      {finds.length === 0 ? <Text style={styles.subtle}>No finds in this session yet.</Text> : null}

      <FlatList
        data={finds}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        renderItem={({ item }) => {
          const isSelected = selectedIds.has(item.id);
          const isFlipped = flippedId === item.id;

          return (
            <View style={{ flex: 1 }}>
              <FlipCard
                isFlipped={isFlipped && !isSelectionMode}
                style={{ flex: 1, minHeight: 250 }}
                front={
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => onItemPress(item.id)}
                    onLongPress={() => onItemLongPress(item.id)}
                    style={{ flex: 1 }}
                  >
                    <GlassView
                      style={[styles.card, isSelected && styles.cardSelected]}
                      intensity={isSelected ? 40 : 20}
                    >
                      <Image source={{ uri: item.photoUri }} style={styles.thumb} />
                      <View style={styles.cardMeta}>
                        <Text style={styles.cardTitle}>{item.label || 'Unlabeled'}</Text>
                        <Text style={styles.cardTag}>{item.category || 'Unsorted'}</Text>
                        <View style={styles.cardRow}>
                          <View style={[styles.badge, item.status === 'cataloged' ? styles.badgeCataloged : styles.badgeDraft]}>
                            <Text style={[styles.badgeText, item.status === 'cataloged' ? styles.badgeTextCataloged : styles.badgeTextDraft]}>
                              {item.status === 'cataloged' ? 'Cataloged' : 'Draft'}
                            </Text>
                          </View>
                          {item.favorite ? <Text style={styles.favoriteMark}>★</Text> : null}
                        </View>
                        {!isSelectionMode && (
                          <TouchableOpacity
                            style={[styles.favoriteButton, item.favorite && styles.favoriteButtonActive]}
                            onPress={() => toggleFavorite(item.id, !item.favorite)}
                            activeOpacity={0.9}
                          >
                            <Text style={[styles.favoriteButtonText, item.favorite && styles.favoriteButtonTextActive]}>{item.favorite ? 'Kept' : 'Keep'}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      {isSelected && (
                        <View style={styles.checkOverlay}>
                          <Text style={styles.checkMark}>✓</Text>
                        </View>
                      )}
                    </GlassView>
                  </TouchableOpacity>
                }
                back={
                  <GlassView style={[styles.card, styles.aiCard]} intensity={50}>
                    <View style={styles.aiHeader}>
                       <Text style={styles.aiTitle}>Rock Buddy AI</Text>
                       <Text style={styles.aiScore}>88% Match</Text>
                    </View>
                    <View style={styles.aiBody}>
                       <Text style={styles.aiLabel}>Likely Agate</Text>
                       <Text style={styles.aiDesc}>
                         &quot;This specimen features characteristic chalcedony banding suitable for tumbling.&quot;
                       </Text>
                      <View style={styles.aiTags}>
                          <Text style={styles.aiTag}>#quartz</Text>
                          <Text style={styles.aiTag}>#banding</Text>
                       </View>
                    </View>
                    <TouchableOpacity onPress={() => onItemPress(item.id)} activeOpacity={0.7}>
                        <Text style={styles.flipHint}>Tap to flip back</Text>
                    </TouchableOpacity>
                  </GlassView>
                }
              />
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        scrollEnabled={false}
      />
      {activeSession?.id === session.id ? (
        <Text style={styles.activeHint}>New captures will auto-link here.</Text>
      ) : null}
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <GlassView style={styles.metric} intensity={20}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </GlassView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  backText: {
    ...THEME.typography.label,
    color: THEME.colors.text,
  },
  heading: {
    ...THEME.typography.header,
    fontSize: 24,
  },
  subtle: {
    ...THEME.typography.body,
    fontSize: 14,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.background,
  },
  loadingText: {
    ...THEME.typography.subHeader,
    marginTop: 16,
    color: THEME.colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.background,
    padding: 20,
  },
  emptyText: {
    ...THEME.typography.subHeader,
    color: THEME.colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubText: {
    ...THEME.typography.body,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
  },
  metric: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    // GlassView handles border/radius
  },
  metricValue: {
    ...THEME.typography.header,
    fontSize: 28,
    color: THEME.colors.accent,
  },
  metricLabel: {
    ...THEME.typography.label,
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 4,
  },
  endButton: {
    backgroundColor: THEME.colors.danger,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  endText: {
    ...THEME.typography.label,
    fontSize: 16,
  },
  toolbar: {
    padding: 16,
  },
  toolbarText: {
    ...THEME.typography.subHeader,
    fontSize: 18, // 16 -> 18
  },
  toolbarHint: {
    ...THEME.typography.body,
    fontSize: 15, // 13 -> 15
  },
  gridRow: {
    gap: 12,
  },
  card: {
    flex: 1,
    height: '100%',
    // GlassView handles radius/flow
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)', // base tint
  },
  aiCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)', // Nearly opaque for text reading
    padding: 12,
    justifyContent: 'space-between',
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiTitle: {
    ...THEME.typography.label,
    color: THEME.colors.accent,
    fontSize: 14, // 12 -> 14
  },
  aiScore: {
    ...THEME.typography.label,
    color: THEME.colors.textSecondary,
    fontSize: 14, // 12 -> 14
  },
  aiBody: {
    gap: 8,
  },
  aiLabel: {
    ...THEME.typography.header, // bold
    fontSize: 22, // 20 -> 22
    color: THEME.colors.text,
  },
  aiDesc: {
    ...THEME.typography.body,
    fontSize: 16, // 12 -> 16 (Critical readability bump)
    color: THEME.colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  aiTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  aiTag: {
    fontSize: 12, // 10 -> 12
    fontWeight: 'bold',
    color: THEME.colors.accent,
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  flipHint: {
    textAlign: 'center',
    fontSize: 12, // 10 -> 12
    color: THEME.colors.textSecondary,
    marginTop: 8,
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: THEME.colors.accent,
  },
  checkOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28, // 24 -> 28
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: THEME.colors.background,
    fontWeight: 'bold',
    fontSize: 16,
  },
  thumb: {
    width: '100%',
    height: 160,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  cardMeta: {
    padding: 12,
    gap: 8, // 6 -> 8
  },
  cardTitle: {
    ...THEME.typography.subHeader,
    fontSize: 18, // 16 -> 18
  },
  cardTag: {
    ...THEME.typography.body,
    fontSize: 14, // 12 -> 14
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  badgeDraft: {
    backgroundColor: 'rgba(253, 230, 138, 0.2)', // Soft Sand low opacity
  },
  badgeCataloged: {
    backgroundColor: 'rgba(45, 212, 191, 0.2)', // Electric Teal low opacity
  },
  badgeText: {
    ...THEME.typography.label,
    fontSize: 12, // 10 -> 12
  },
  badgeTextDraft: {
    color: THEME.colors.textSecondary,
  },
  badgeTextCataloged: {
    color: THEME.colors.accent,
  },
  favoriteMark: {
    color: THEME.colors.textSecondary,
    fontSize: 18,
  },
  favoriteButton: {
    marginTop: 4,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.colors.border, // Higher contrast border
    alignItems: 'center',
  },
  favoriteButtonActive: {
    backgroundColor: THEME.colors.accent,
    borderColor: THEME.colors.accent,
  },
  favoriteButtonText: {
    ...THEME.typography.label,
    fontSize: 14, // 12 -> 14
  },
  favoriteButtonTextActive: {
    color: THEME.colors.background,
  },
  activeHint: {
    ...THEME.typography.body,
    textAlign: 'center',
    marginTop: 12,
  },
});
