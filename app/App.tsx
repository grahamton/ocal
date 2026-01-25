import {AuthProvider} from '@/shared/AuthContext';
import * as firestoreService from '@/shared/firestoreService';
import {useEffect, useState, useCallback} from 'react';
import {Ionicons} from '@expo/vector-icons';
import {
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  useFonts,
  Outfit_400Regular,
  Outfit_700Bold,
  Outfit_800ExtraBold,
} from '@expo-google-fonts/outfit';
import {CameraCapture} from '@/features/capture/CameraCapture';
import {GalleryGrid} from '@/features/gallery/GalleryGrid';
import {InsightsView} from '@/features/insights/InsightsView';

import {FindDetailModal} from '@/features/detail/FindDetailModal';
import {FindRecord} from '@/shared/types';
import {SessionProvider, useSession} from '@/shared/SessionContext';

// import { NextActionPrompt } from '@/shared/NextActionPrompt';
import {GradientBackground} from '@/shared/components/GradientBackground';
import {GlassView} from '@/shared/components/GlassView';
import {THEME} from '@/shared/theme';
import {SelectionProvider, useSelection} from '@/shared/SelectionContext';
import {BatchActionBar} from '@/shared/components/BatchActionBar';

import {ThemeProvider} from '@/shared/ThemeContext';
import {StatusIcon} from '@/shared/components/StatusIcon';
import {AnalyticsService} from '@/shared/AnalyticsService';
// import { migrationService } from '@/shared/migration/MigrationService';
// import { MigrationStatusModal } from '@/shared/migration/MigrationStatusModal';

export default function App() {
  const dbReady = true;
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_700Bold,
    Outfit_800ExtraBold,
  });

  useEffect(() => {
    // This effect is now just for analytics
    AnalyticsService.logEvent('app_opened');
  }, []);

  const appIsReady = dbReady && fontsLoaded;

  if (!appIsReady) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <Text style={styles.loadingText}>Ocal...</Text>
      </View>
    );
  }

  return (
    <AuthProvider>
      <ThemeProvider>
        <SessionProvider>
          <SelectionProvider>
            <SafeAreaProvider>
              <GradientBackground>
                <AppContent />
              </GradientBackground>
            </SafeAreaProvider>
          </SelectionProvider>
        </SessionProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

import {SessionControlModal} from '@/shared/components/SessionControlModal';
import {logger} from '@/shared/LogService';
import {useTheme} from '@/shared/ThemeContext';
import {SettingsModal} from '@/shared/components/SettingsModal';

function AppContent() {
  const insets = useSafeAreaInsets();
  const {colors, mode} = useTheme();
  // ... existing hooks

  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedFind, setSelectedFind] = useState<FindRecord | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [sessionModalVisible, setSessionModalVisible] = useState(false);
  const [insightsVisible, setInsightsVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Navigation State
  const [view, setView] = useState<'capture' | 'gallery'>('capture');

  // Log navigation changes
  useEffect(() => {
    logger.add('nav', `Navigated to ${view}`);
  }, [view]);

  const {activeSession} = useSession();

  const {isSelectionMode, selectedIds, exitSelectionMode} = useSelection();

  const handleBatchDelete = async () => {
    const count = selectedIds.size;
    if (count === 0) return;

    Alert.alert(
      'Delete Items',
      `Delete ${count} item${count > 1 ? 's' : ''}? This cannot be undone.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all(
                Array.from(selectedIds).map(id =>
                  firestoreService.deleteFind(id),
                ),
              ); // Changed here
              exitSelectionMode();
              handleRefresh();
              logger.add('user', `Deleted ${count} items`);
            } catch (error) {
              logger.error('Batch delete failed', error);
              Alert.alert('Error', 'Failed to delete some items');
            }
          },
        },
      ],
    );
  };

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const openDetail = (item: FindRecord) => {
    logger.add('nav', 'Opened detail view', {id: item.id});
    setSelectedFind(item);
    setDetailVisible(true);
  };

  const [refreshing, setRefreshing] = useState(false);

  const handleManualRefresh = useCallback(async () => {
    setRefreshing(true);
    handleRefresh(); // existing refresh logic
    setTimeout(() => setRefreshing(false), 1000);
  }, [handleRefresh]);

  return (
    <View style={[styles.safe, {paddingTop: insets.top}]}>
      <StatusBar
        barStyle={mode === 'high-contrast' ? 'light-content' : 'dark-content'}
      />
      <ScrollView
        style={styles.pageScroll}
        contentContainerStyle={[styles.pageContent, {paddingBottom: 120}]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleManualRefresh}
            tintColor={colors.accent}
          />
        }>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            {/* Left: Logo Only */}
            <StatusIcon
              status="polished"
              category="mineral"
              size={32}
              theme={mode === 'high-contrast' ? 'beach' : 'journal'}
            />

            {/* Center: Session Pill (Expanded) */}
            <View style={{flex: 1, paddingHorizontal: 12}}>
              <TouchableOpacity
                onPress={() => setSessionModalVisible(true)}
                style={{width: '100%'}}
                activeOpacity={0.8}>
                <GlassView
                  style={[
                    styles.sessionPillContainer,
                    !activeSession && {justifyContent: 'center', opacity: 0.8},
                  ]}
                  intensity={10}>
                  <Text
                    style={[
                      styles.sessionPillText,
                      {
                        color: colors.accent,
                        textAlign: activeSession ? 'left' : 'center',
                      },
                      !activeSession && {fontWeight: '600', fontSize: 13},
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail">
                    {activeSession ? activeSession.name : 'Start Session'}
                  </Text>
                  {activeSession && (
                    <Ionicons
                      name="create-outline"
                      size={14}
                      color={colors.accent}
                      style={{marginLeft: 4, flexShrink: 0}}
                    />
                  )}
                </GlassView>
              </TouchableOpacity>
            </View>

            {/* Right: Actions */}
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <TouchableOpacity
                onPress={() => setInsightsVisible(true)}
                style={{padding: 8}}>
                <Ionicons
                  name="analytics-outline"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSettingsVisible(true)}
                style={{padding: 8}}>
                <Ionicons
                  name="settings-outline"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {view === 'capture' ? (
          <View style={styles.section}>
            <CameraCapture
              onSaved={() => {
                logger.add('user', 'Captured photo');
                handleRefresh();
              }}
            />
          </View>
        ) : null}

        {view === 'gallery' ? (
          <View style={styles.section}>
            <View style={styles.galleryHeader}>
              <View
                style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                <StatusIcon
                  status="polished"
                  category="fossil"
                  size={24}
                  theme={mode === 'high-contrast' ? 'beach' : 'journal'}
                />
                <Text style={styles.sectionTitle}>Gallery</Text>
              </View>
            </View>
            <GalleryGrid refreshKey={refreshKey} onSelect={openDetail} />
          </View>
        ) : null}
      </ScrollView>

      {/* Insights Modal */}
      <Modal
        visible={insightsVisible}
        animationType="slide"
        onRequestClose={() => setInsightsVisible(false)}>
        <View
          style={[
            styles.safe,
            {paddingTop: insets.top, backgroundColor: colors.background},
          ]}>
          <View style={[styles.header, {paddingHorizontal: 16}]}>
            <TouchableOpacity
              onPress={() => setInsightsVisible(false)}
              style={{padding: 8}}>
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.title, {color: colors.text}]}>Insights</Text>
            <View style={{width: 44}} />
          </View>
          <InsightsView />
        </View>
      </Modal>

      {/* Floating Glass Tab Bar OR Batch Action Bar */}
      {/* Floating Glass Tab Bar OR Batch Action Bar */}
      <View
        style={[
          styles.floatingTabsContainer,
          {
            paddingBottom: insets.bottom + 10,
            backgroundColor: colors.card,
            borderTopColor: colors.border,
          },
        ]}>
        {isSelectionMode ? (
          <BatchActionBar
            onPoster={() => Alert.alert('Poster', 'Batch poster coming soon')}
            onDelete={handleBatchDelete}
          />
        ) : (
          <View style={styles.floatingTabs}>
            {[
              {key: 'capture', label: 'Capture', icon: 'camera'},
              {key: 'gallery', label: 'Gallery', icon: 'grid'},
            ].map(tab => {
              const active = view === tab.key;
              const iconName = (
                active ? tab.icon : `${tab.icon}-outline`
              ) as keyof typeof Ionicons.glyphMap;
              const activeColor = colors.accent;
              const inactiveColor = colors.textSecondary;

              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[
                    styles.tabButton,
                    active && {
                      backgroundColor:
                        mode === 'high-contrast'
                          ? colors.accent
                          : 'rgba(0,0,0,0.05)',
                    },
                  ]}
                  onPress={() => setView(tab.key as typeof view)}
                  activeOpacity={0.7}
                  accessibilityRole="tab"
                  accessibilityState={{selected: active}}
                  accessibilityLabel={tab.label}>
                  <Ionicons
                    name={iconName}
                    size={32}
                    color={active ? activeColor : inactiveColor}
                  />
                  <Text
                    style={[
                      styles.tabTextActive,
                      {color: active ? activeColor : inactiveColor},
                    ]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      <FindDetailModal
        visible={detailVisible}
        item={selectedFind}
        onClose={() => {
          logger.add('nav', 'Closed detail view');
          setDetailVisible(false);
        }}
        onSaved={() => {
          setDetailVisible(false);
          handleRefresh();
        }}
      />

      <SessionControlModal
        visible={sessionModalVisible && !!activeSession}
        onClose={() => setSessionModalVisible(false)}
        session={activeSession}
      />

      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
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
    flexDirection: 'row', // Ensure text and icon align
    alignItems: 'center',
    maxWidth: '100%', // Respect shrinking
  },
  sessionPillText: {
    ...THEME.typography.label,
    flexShrink: 1, // Allow truncation
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
    borderTopWidth: 2,
    paddingTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingTabs: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    gap: 0,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'column', // Stack icon and text
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tabTextActive: {
    ...THEME.typography.label,
    fontSize: 14, // Larger
    fontWeight: '700',
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
    // Dynamic styles handled inline or keeping static fallback
    backgroundColor: THEME.colors.accent,
    borderColor: THEME.colors.accent,
  },
  filterText: {
    ...THEME.typography.label,
    fontSize: 12,
    color: THEME.colors.textSecondary,
  },
  filterTextActive: {
    color: THEME.colors.background,
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
    color: THEME.colors.danger,
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