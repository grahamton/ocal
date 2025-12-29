import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getSession, listFinds, updateFindMetadata } from '../../shared/db';
import { useSession } from '../../shared/SessionContext';
import { FindRecord, Session } from '../../shared/types';

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
        <Text style={styles.heading}>{session.name}</Text>
      </View>
      <Text style={styles.subtle}>
        Started {new Date(session.startTime).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
      </Text>
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
      <View style={styles.toolbar}>
        <Text style={styles.toolbarText}>Batch actions (stub)</Text>
        <Text style={styles.toolbarHint}>Select items to run AI or make a poster later.</Text>
      </View>
      {loading ? <ActivityIndicator /> : null}
      {finds.length === 0 ? <Text style={styles.subtle}>No finds in this session yet.</Text> : null}
      <FlatList
        data={finds}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.photoUri }} style={styles.thumb} />
            <View style={styles.cardMeta}>
              <Text style={styles.cardTitle}>{item.label || 'Unlabeled'}</Text>
              <Text style={styles.cardTag}>{item.category || 'Unsorted'}</Text>
              <View style={styles.cardRow}>
                <Text style={[styles.badge, item.status === 'cataloged' ? styles.badgeCataloged : styles.badgeDraft]}>
                  {item.status === 'cataloged' ? 'Cataloged' : 'Draft'}
                </Text>
                {item.favorite ? <Text style={styles.favoriteMark}>★</Text> : null}
              </View>
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={() => toggleFavorite(item.id, !item.favorite)}
                activeOpacity={0.9}
              >
                <Text style={styles.favoriteButtonText}>{item.favorite ? 'Unstar' : 'Star for ledger'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  backText: {
    fontWeight: '800',
    color: '#0f172a',
  },
  heading: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111',
  },
  subtle: {
    color: '#4b5563',
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metric: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
  },
  metricLabel: {
    color: '#4b5563',
    fontWeight: '700',
  },
  endButton: {
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  endText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  toolbar: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  toolbarText: {
    fontWeight: '800',
    color: '#0f172a',
  },
  toolbarHint: {
    color: '#4b5563',
    fontSize: 13,
  },
  gridRow: {
    gap: 12,
  },
  card: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  thumb: {
    width: '100%',
    height: 160,
    backgroundColor: '#e5e7eb',
  },
  cardMeta: {
    padding: 12,
    gap: 6,
  },
  cardTitle: {
    fontWeight: '800',
    color: '#0f172a',
    fontSize: 16,
  },
  cardTag: {
    color: '#4b5563',
    fontWeight: '700',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    overflow: 'hidden',
    fontWeight: '800',
    fontSize: 12,
  },
  badgeDraft: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  badgeCataloged: {
    backgroundColor: '#ecfdf3',
    color: '#166534',
  },
  favoriteMark: {
    color: '#f59e0b',
    fontWeight: '900',
  },
  favoriteButton: {
    marginTop: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  favoriteButtonText: {
    fontWeight: '800',
    color: '#0f172a',
  },
  activeHint: {
    color: '#0f172a',
    fontWeight: '700',
  },
});
