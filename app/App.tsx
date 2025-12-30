import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts, Outfit_400Regular, Outfit_700Bold, Outfit_800ExtraBold } from '@expo-google-fonts/outfit';
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
// import { NextActionPrompt } from './src/shared/NextActionPrompt';
import { GradientBackground } from './src/shared/components/GradientBackground';
import { GlassView } from './src/shared/components/GlassView';
import { THEME, PALETTE } from './src/shared/theme';
import { SelectionProvider, useSelection } from './src/shared/SelectionContext';
import { BatchActionBar } from './src/shared/components/BatchActionBar';

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_700Bold,
    Outfit_800ExtraBold,
  });

  useEffect(() => {
    setupDatabase().then(() => setDbReady(true));
  }, []);

  const ready = dbReady && fontsLoaded;

  if (!ready) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <Text style={styles.loadingText}>Ocal...</Text>
      </View>
    );
  }

  return (
    <SessionProvider>
      <SelectionProvider>
        <SafeAreaProvider>
          <GradientBackground>
            <AppContent />
          </GradientBackground>
        </SafeAreaProvider>
      </SelectionProvider>
    </SessionProvider>
  );
}

function AppContent() {
  const insets = useSafeAreaInsets();
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedFind, setSelectedFind] = useState<FindRecord | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [view, setView] = useState<'capture' | 'cataloger' | 'gallery'>('capture');
  // galleryFilter moved to internal Gallery state
  const { activeSession } = useSession(); // endSession unused
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [devNotesVisible, setDevNotesVisible] = useState(false);
  const { isSelectionMode } = useSelection();

  const handleRefresh = () => {
    setRefreshKey((n) => n + 1);
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
            // setGalleryFilter('all'); // Removed
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

  // ensureSession moved to CameraCapture internal logic


  // handleReview and handleEndSession removed as NextActionPrompt is gone

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={styles.pageScroll}
        contentContainerStyle={[styles.pageContent, { paddingBottom: 120 }]} // Extra padding for floating tab bar
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Ocal</Text>
            {activeSession ? (
              <GlassView style={styles.sessionPillContainer} intensity={10}>
                <Text style={styles.sessionPillText}>{activeSession.name}</Text>
              </GlassView>
            ) : null}
            <View style={{ flex: 1 }} />
            {__DEV__ ? (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity style={styles.devPill} onPress={() => setDevNotesVisible(true)}>
                  <Text style={styles.devPillText}>Notes</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.devReset} onPress={handleDevReset}>
                  <Text style={styles.devResetText}>Reset</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>

        {view === 'capture' ? (
          <View style={styles.section}>
            <CameraCapture
              onSaved={() => {
                // await ensureSession(); // CameraCapture now handles auto-start!
                handleRefresh();
              }}
            />
            {/* Capture View Ledger */}
            <GlassView style={{ padding: 12 }}>
                 <SessionLedger
                  refreshKey={refreshKey}
                  onUpdated={handleRefresh}
                  onRequestReview={() => {
                    setSelectedSessionId(activeSession?.id ?? null);
                    setView('cataloger');
                  }}
                />
            </GlassView>
          </View>
        ) : null}

        {view === 'cataloger' ? (
          <View style={styles.section}>
            {selectedSessionId ? (
              <SessionDetailView
                sessionId={selectedSessionId}
                onBack={() => setSelectedSessionId(null)}
                refreshKey={refreshKey}
                onUpdated={handleRefresh}
              />
            ) : (
              <CatalogerDashboard
                refreshKey={refreshKey}
                onUpdated={handleRefresh}
                onStartSession={() => setView('capture')}
                onOpenSession={(id) => setSelectedSessionId(id)}
              />
            )}
          </View>
        ) : null}

        {view === 'gallery' ? (
          <View style={styles.section}>
            <View style={styles.galleryHeader}>
              <Text style={styles.sectionTitle}>Gallery</Text>
            </View>
            <GalleryGrid refreshKey={refreshKey} onSelect={openDetail} />
            <PosterStub onPress={() => Alert.alert('Poster', 'Poster builder coming soon.')} />
          </View>
        ) : null}
      </ScrollView>

      {/* Floating Glass Tab Bar OR Batch Action Bar */}
      <View style={[styles.floatingTabsContainer, { paddingBottom: insets.bottom + 10 }]}>
        {isSelectionMode ? (
          <BatchActionBar
            onIdentify={() => Alert.alert('Identify', 'Batch identification stub')}
            onPoster={() => Alert.alert('Poster', 'Batch poster stub')}
            onDelete={() => Alert.alert('Delete', 'Batch delete stub')}
          />
        ) : (
          <View style={styles.floatingTabs}>
            {[
              { key: 'capture', label: 'Capture', icon: 'camera' },
              { key: 'cataloger', label: 'Logbook', icon: 'book' }, // Icon changed to book
              { key: 'gallery', label: 'Gallery', icon: 'grid' },
            ].map((tab) => {
              const active = view === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tabButton, active && styles.tabButtonActive]}
                  onPress={() => setView(tab.key as typeof view)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={active ? (tab.icon as any) : (tab.icon + '-outline' as any)}
                    size={24}
                    color={active ? '#fff' : 'rgba(255,255,255,0.6)'}
                  />
                  {active && <Text style={styles.tabTextActive}>{tab.label}</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      <FindDetailModal
        visible={detailVisible}
        item={selectedFind}
        onClose={() => setDetailVisible(false)}
        onSaved={() => {
          setDetailVisible(false);
          handleRefresh();
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
      {/* NextActionPrompt removed for rapid workflow */}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },
  loadingText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  safe: {
    flex: 1,
  },
  pageScroll: {
    flex: 1,
  },
  pageContent: {
    padding: 16,
    gap: 24,
  },
  header: {
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    ...THEME.typography.header,
  },
  sessionPillContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  sessionPillText: {
    ...THEME.typography.label,
    color: PALETTE.electricTeal,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  floatingTabsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  floatingTabs: {
    flexDirection: 'row',
    padding: 6,
    borderRadius: 32,
    gap: 4,
    backgroundColor: '#0f172a', // Solid dark background
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)', // Subtle border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    gap: 8,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  tabTextActive: {
    ...THEME.typography.label,
    fontSize: 12,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    ...THEME.typography.subHeader,
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
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  filterChipActive: {
    backgroundColor: PALETTE.electricTeal,
    borderColor: PALETTE.electricTeal,
  },
  filterText: {
    ...THEME.typography.label,
    fontSize: 12,
    color: THEME.colors.textSecondary,
  },
  filterTextActive: {
    color: PALETTE.oceanDark,
  },
  devPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  devPillText: {
    ...THEME.typography.label,
    fontSize: 10,
  },
  devReset: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(248, 113, 113, 0.2)',
  },
  devResetText: {
    ...THEME.typography.label,
    color: PALETTE.danger,
    fontSize: 10,
  },
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  toastTitle: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 15,
  },
  toastHint: {
    color: '#e2e8f0',
    fontWeight: '700',
    marginTop: 2,
  },
  toastActions: {
    flexDirection: 'row',
    gap: 8,
  },
  toastButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    backgroundColor: '#111827',
  },
  toastButtonActive: {
    backgroundColor: '#eef2ff',
    borderColor: '#c7d2fe',
  },
  toastButtonText: {
    color: '#e2e8f0',
    fontWeight: '800',
    fontSize: 12,
  },
  toastButtonTextActive: {
    color: '#111827',
  },
});

