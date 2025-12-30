import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { listFinds } from '../../shared/db';
import { useSession } from '../../shared/SessionContext';
import { FindRecord, Session } from '../../shared/types';
import { UnsortedList } from '../list/UnsortedList';
import { THEME, PALETTE } from '../../shared/theme';

type Props = {
  refreshKey: number;
  onUpdated?: () => void;
  onStartSession: () => void;
  onOpenSession: (sessionId: string) => void;
};

// Context: Phase 2 - Cataloger dashboard surfaces sessions and all finds.
export function CatalogerDashboard({ refreshKey, onUpdated, onStartSession, onOpenSession }: Props) {
  const { sessions, activeSession, startSession, refreshSessions } = useSession();
  const [mode, setMode] = useState<'sessions' | 'all'>('sessions');
  const [finds, setFinds] = useState<FindRecord[]>([]);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending'>('pending');
  const [startingSession, setStartingSession] = useState(false);

  const loadFinds = useCallback(async () => {
    const rows = await listFinds();
    setFinds(rows);
    setSyncStatus(rows.some((f) => !f.synced) ? 'pending' : 'synced');
  }, []);

  useEffect(() => {
    loadFinds();
  }, [loadFinds, refreshKey]);

  useEffect(() => {
    refreshSessions();
  }, [refreshSessions, refreshKey]);

  const handleStartSession = useCallback(async () => {
    if (startingSession) return;
    setStartingSession(true);
    try {
      await startSession();
      await refreshSessions();
      onStartSession();
    } finally {
      setStartingSession(false);
    }
  }, [onStartSession, refreshSessions, startSession, startingSession]);

  const renderSession = useCallback(
    ({ item }: { item: Session }) => {
      const sessionFinds = finds.filter((find) => find.sessionId === item.id);
      return (
        <TouchableOpacity activeOpacity={0.9} onPress={() => onOpenSession(item.id)}>
          <SessionCard session={item} finds={sessionFinds} active={item.id === activeSession?.id} />
        </TouchableOpacity>
      );
    },
    [activeSession?.id, finds, onOpenSession]
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Cataloger</Text>
        <View style={[styles.syncBadge, syncStatus === 'synced' ? styles.syncOk : styles.syncPending]}>
          <Text style={[styles.syncText, syncStatus === 'synced' ? styles.syncTextOk : styles.syncTextPending]}>
            {syncStatus === 'synced' ? 'Synced' : 'Offline / pending'}
          </Text>
        </View>
      </View>
      <View style={styles.toggleRow}>
        {[
          { key: 'sessions', label: 'Sessions' },
          { key: 'all', label: 'All Finds' },
        ].map((toggle) => {
          const active = mode === toggle.key;
          return (
            <TouchableOpacity
              key={toggle.key}
              style={[styles.toggleButton, active && styles.toggleButtonActive]}
              onPress={() => setMode(toggle.key as typeof mode)}
              activeOpacity={0.9}
            >
              <Text style={[styles.toggleText, active && styles.toggleTextActive]}>{toggle.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {mode === 'sessions' ? (
        <View style={styles.section}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Recent sessions</Text>
            {activeSession ? <Text style={styles.activeHint}>Active: {activeSession.name}</Text> : null}
          </View>
          {sessions.length === 0 ? (
            <Text style={styles.emptyText}>
              No sessions yet. Start one to group finds by trip while keeping capture offline-first.
            </Text>
          ) : (
            <FlatList
              data={sessions}
              renderItem={renderSession}
              keyExtractor={(item) => item.id}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              scrollEnabled={false}
            />
          )}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleStartSession}
            activeOpacity={0.9}
            disabled={startingSession}
          >
            <Text style={styles.primaryText}>{startingSession ? 'Starting...' : 'Start Session'}</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      {mode === 'all' ? (
        <View style={styles.section}>
          <UnsortedList refreshKey={refreshKey} onUpdated={onUpdated} mode="all" />
        </View>
      ) : null}
    </View>
  );
}

function SessionCard({ session, finds, active }: { session: Session; finds: FindRecord[]; active: boolean }) {
  const thumbnails = useMemo(() => finds.slice(0, 3), [finds]);
  const startDate = new Date(session.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const endDate = session.endTime
    ? new Date(session.endTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : null;

  return (
    <View style={[styles.card, active && styles.cardActive]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{session.name}</Text>
        {active ? <Text style={styles.activeBadge}>Active</Text> : null}
      </View>
      <Text style={styles.cardMeta}>
        {startDate}
        {endDate ? ` - ${endDate}` : ''} {session.locationName ? `- ${session.locationName}` : ''}
      </Text>
      <Text style={styles.cardMeta}>
        {finds.length} {finds.length === 1 ? 'find' : 'finds'}
      </Text>
      <View style={styles.thumbRow}>
        {thumbnails.map((find) => (
          <Image key={find.id} source={{ uri: find.photoUri }} style={styles.thumb} />
        ))}
        {thumbnails.length === 0 ? <View style={styles.thumbPlaceholder} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingHorizontal: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heading: {
    ...THEME.typography.header,
    fontSize: 28, // Scaled for Senior Mode
  },
  syncBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  syncOk: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)', // Green glass
    borderColor: '#22c55e',
  },
  syncPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)', // Amber glass
    borderColor: '#f59e0b',
  },
  syncText: {
    fontWeight: '800',
    fontSize: 14,
  },
  syncTextOk: {
    color: '#4ade80', // Bright green text
  },
  syncTextPending: {
    color: PALETTE.softSand, // Bright yellow/sand text
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 16, // Larger target
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: PALETTE.electricTeal,
    borderColor: PALETTE.electricTeal,
  },
  toggleText: {
    fontSize: 18, // Larger font
    fontWeight: '800',
    color: THEME.colors.text,
  },
  toggleTextActive: {
    color: PALETTE.oceanDark,
  },
  section: {
    gap: 14,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listTitle: {
    ...THEME.typography.subHeader,
    fontSize: 22,
  },
  activeHint: {
    ...THEME.typography.label,
    color: PALETTE.electricTeal,
    fontSize: 14,
  },
  emptyText: {
    ...THEME.typography.body,
    fontSize: 16,
    fontStyle: 'italic',
  },
  separator: {
    height: 14,
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: PALETTE.electricTeal,
    paddingVertical: 18, // Larger target
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryText: {
    color: PALETTE.oceanDark,
    fontSize: 20,
    fontWeight: '800',
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.05)', // Glass effect like Detail View
    gap: 8,
  },
  cardActive: {
    borderColor: PALETTE.electricTeal,
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    ...THEME.typography.subHeader,
    fontSize: 20,
    color: THEME.colors.text,
  },
  cardMeta: {
    ...THEME.typography.body,
    fontSize: 16,
    color: THEME.colors.textSecondary,
  },
  activeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: PALETTE.electricTeal,
    color: PALETTE.oceanDark,
    fontWeight: '800',
    fontSize: 12,
  },
  thumbRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  thumb: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  thumbPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
});
