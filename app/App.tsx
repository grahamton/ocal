import { useEffect, useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { CameraCapture } from './src/features/capture/CameraCapture';
import { GalleryGrid } from './src/features/gallery/GalleryGrid';
import { PosterStub } from './src/features/poster/PosterStub';
import { FindDetailModal } from './src/features/detail/FindDetailModal';
import { setupDatabase } from './src/shared/db';
import { FindRecord } from './src/shared/types';
import { SessionProvider, useSession } from './src/shared/SessionContext';
import { CatalogerDashboard } from './src/features/cataloger/CatalogerDashboard';
import { SessionDetailView } from './src/features/cataloger/SessionDetailView';
import { SessionLedger } from './src/features/capture/SessionLedger';
import { resetLocalDataForDev } from './src/shared/debugReset';
import { DevNotes } from './src/shared/DevNotes';
import { NextActionPrompt } from './src/shared/NextActionPrompt';

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setupDatabase().then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.loadingContainer} edges={['top']}>
          <StatusBar barStyle="dark-content" />
          <Text style={styles.loadingText}>Preparing Beach Mode...</Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SessionProvider>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </SessionProvider>
  );
}

function AppContent() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedFind, setSelectedFind] = useState<FindRecord | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [view, setView] = useState<'capture' | 'cataloger' | 'gallery'>('capture');
  const [galleryFilter, setGalleryFilter] = useState<'all' | 'draft'>('all');
  const { activeSession, startSession, endSession } = useSession();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [devNotesVisible, setDevNotesVisible] = useState(false);
  const [nextActionVisible, setNextActionVisible] = useState(false);

  const handleSaved = () => {
    setRefreshKey((n) => n + 1);
    setNextActionVisible(true);
  };

  const openDetail = (item: FindRecord) => {
    setSelectedFind(item);
    setDetailVisible(true);
  };

  const handleDevReset = () => {
    if (!__DEV__) return;
    Alert.alert('Reset local data', 'This deletes all captures, photos, and sessions on this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await resetLocalDataForDev();
            setSelectedFind(null);
            setDetailVisible(false);
            setSelectedSessionId(null);
            setGalleryFilter('all');
            setView('capture');
            setRefreshKey((n) => n + 1);
            Alert.alert('Reset complete', 'Local cache cleared. Ready for a fresh start.');
          } catch (error) {
            Alert.alert('Reset failed', (error as Error)?.message ?? 'Could not reset local data.');
          }
        },
      },
    ]);
  };

  const ensureSession = async () => {
    if (!activeSession) {
      await startSession();
    }
  };

  const handleReview = () => {
    setNextActionVisible(false);
    setView('cataloger');
  };

  const handleEndSession = async () => {
    setNextActionVisible(false);
    if (activeSession) {
      await endSession();
      setSelectedSessionId(null);
    }
    setView('capture');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.pageScroll} contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Ocal</Text>
              <Text style={styles.subtitle}>Beach Mode capture + easy sorting.</Text>
            </View>
            {__DEV__ ? (
              <TouchableOpacity style={styles.devPill} onPress={() => setDevNotesVisible(true)}>
                <Text style={styles.devPillText}>Dev notes</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {activeSession ? <Text style={styles.sessionPill}>Active session: {activeSession.name}</Text> : null}
          {__DEV__ ? (
            <TouchableOpacity style={styles.devReset} onPress={handleDevReset}>
              <Text style={styles.devResetText}>Reset local data</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={styles.tabs}>
          {[
            { key: 'capture', label: 'Capture' },
            { key: 'cataloger', label: 'Cataloger' },
            { key: 'gallery', label: 'Gallery' },
          ].map((tab) => {
            const active = view === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabButton, active && styles.tabButtonActive]}
                onPress={() => setView(tab.key as typeof view)}
                activeOpacity={0.85}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {view === 'capture' ? (
          <View style={styles.section}>
            <CameraCapture
              onSaved={async () => {
                await ensureSession();
                handleSaved();
              }}
            />
            <SessionLedger
              refreshKey={refreshKey}
              onUpdated={handleSaved}
              onRequestReview={() => {
                setSelectedSessionId(activeSession?.id ?? null);
                setView('cataloger');
              }}
            />
          </View>
        ) : null}
        {view === 'cataloger' ? (
          <View style={styles.section}>
            {selectedSessionId ? (
              <SessionDetailView
                sessionId={selectedSessionId}
                onBack={() => setSelectedSessionId(null)}
                refreshKey={refreshKey}
                onUpdated={handleSaved}
              />
            ) : (
              <CatalogerDashboard
                refreshKey={refreshKey}
                onUpdated={handleSaved}
                onStartSession={() => setView('capture')}
                onOpenSession={(id) => setSelectedSessionId(id)}
              />
            )}
          </View>
        ) : null}
        {view === 'gallery' ? (
          <View style={styles.section}>
            <View style={styles.galleryHeader}>
              <Text style={styles.title}>Gallery</Text>
              <View style={styles.chipRow}>
                {['all', 'draft'].map((f) => {
                  const active = galleryFilter === f;
                  return (
                    <TouchableOpacity
                      key={f}
                      style={[styles.filterChip, active && styles.filterChipActive]}
                      onPress={() => setGalleryFilter(f as 'all' | 'draft')}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.filterText, active && styles.filterTextActive]}>
                        {f === 'draft' ? 'Draft only' : 'All'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            <GalleryGrid refreshKey={refreshKey} onSelect={openDetail} filter={galleryFilter} />
            <PosterStub onPress={() => Alert.alert('Poster', 'Poster builder coming soon.')} />
          </View>
        ) : null}
      </ScrollView>
      <FindDetailModal
        visible={detailVisible}
        item={selectedFind}
        onClose={() => setDetailVisible(false)}
        onSaved={() => {
          setDetailVisible(false);
          handleSaved();
        }}
      />
      {__DEV__ ? (
        <DevNotes
          visible={devNotesVisible}
          onClose={() => setDevNotesVisible(false)}
          onSubmit={(note) => {
            console.log('[DevNote submit]', note);
          }}
        />
      ) : null}
      <NextActionPrompt
        visible={nextActionVisible}
        onStay={() => setNextActionVisible(false)}
        onReview={handleReview}
        onEndSession={handleEndSession}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  pageScroll: {
    flex: 1,
  },
  pageContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 32,
  },
  header: {
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111',
  },
  subtitle: {
    fontSize: 14,
    color: '#4b5563',
  },
  sessionPill: {
    marginTop: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#eef2ff',
    color: '#111',
    fontWeight: '700',
    fontSize: 13,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  tabButtonActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  tabTextActive: {
    color: '#fff',
  },
  section: {
    gap: 12,
  },
  galleryHeader: {
    marginBottom: 8,
    gap: 8,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  filterChipActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  filterText: {
    color: '#0f172a',
    fontWeight: '800',
    fontSize: 13,
  },
  filterTextActive: {
    color: '#fff',
  },
  devPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  devPillText: {
    color: '#0f172a',
    fontWeight: '800',
  },
  devReset: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  devResetText: {
    color: '#b91c1c',
    fontWeight: '800',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    color: '#111',
    fontSize: 16,
  },
});
