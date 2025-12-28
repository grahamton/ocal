import { useEffect, useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { CameraCapture } from './src/features/capture/CameraCapture';
import { UnsortedList } from './src/features/list/UnsortedList';
import { GalleryGrid } from './src/features/gallery/GalleryGrid';
import { PosterStub } from './src/features/poster/PosterStub';
import { FindDetailModal } from './src/features/detail/FindDetailModal';
import { setupDatabase } from './src/shared/db';
import { FindRecord } from './src/shared/types';

export default function App() {
  const [ready, setReady] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedFind, setSelectedFind] = useState<FindRecord | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [view, setView] = useState<'capture' | 'list' | 'gallery'>('capture');
  const [galleryFilter, setGalleryFilter] = useState<'all' | 'draft'>('all');

  useEffect(() => {
    setupDatabase().then(() => setReady(true));
  }, []);

  const handleSaved = () => {
    setRefreshKey((n) => n + 1);
  };

  const openDetail = (item: FindRecord) => {
    setSelectedFind(item);
    setDetailVisible(true);
  };

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
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Ocal</Text>
            <Text style={styles.subtitle}>Beach Mode capture + easy sorting.</Text>
          </View>
          <View style={styles.tabs}>
            {[
              { key: 'capture', label: 'Capture' },
              { key: 'list', label: 'Unsorted' },
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
              <CameraCapture onSaved={handleSaved} />
            </View>
          ) : null}
          {view === 'list' ? (
            <ScrollView contentContainerStyle={styles.section}>
              <UnsortedList refreshKey={refreshKey} onUpdated={handleSaved} />
            </ScrollView>
          ) : null}
          {view === 'gallery' ? (
            <ScrollView contentContainerStyle={styles.section}>
              <View style={styles.galleryHeader}>
                <Text style={styles.title}>Gallery</Text>
                <View style={styles.chipRow}>
                  {['all', 'draft'].map((f) => {
                    const active = f === 'draft';
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
            </ScrollView>
          ) : null}
        </View>
        <FindDetailModal
          visible={detailVisible}
          item={selectedFind}
          onClose={() => setDetailVisible(false)}
          onSaved={() => {
            setDetailVisible(false);
            handleSaved();
          }}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 16,
    gap: 20,
  },
  header: {
    gap: 4,
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
    tabs: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 8,
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
    paddingBottom: 16,
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
