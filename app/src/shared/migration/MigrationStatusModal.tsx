import React, {useEffect, useState} from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {MigrationState, migrationService} from './MigrationService';
import {Ionicons} from '@expo/vector-icons';
import {
  useFonts,
  Outfit_400Regular,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';

export function MigrationStatusModal() {
  const [state, setState] = useState<MigrationState>({
    status: 'idle',
    progress: 0,
    totalItems: 0,
    processedItems: 0,
    logs: [],
  });

  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_700Bold,
  });

  useEffect(() => {
    migrationService.subscribe(newState => {
      setState(newState);
    });
  }, []);

  if (
    state.status === 'idle' ||
    state.status === 'done' ||
    state.status === 'checking'
  ) {
    return null;
  }

  if (!fontsLoaded) return null;

  return (
    <Modal
      visible={true}
      transparent={false}
      animationType="fade"
      statusBarTranslucent>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            {state.status === 'error' ? (
              <Ionicons name="warning" size={48} color="#ef4444" />
            ) : (
              <ActivityIndicator size="large" color="#0f766e" />
            )}
          </View>

          <Text style={styles.title}>
            {state.status === 'error'
              ? 'Migration Failed'
              : 'Upgrading Database'}
          </Text>

          <Text style={styles.subtitle}>{getStatusMessage(state)}</Text>

          {state.status !== 'error' && (
            <View style={styles.progressContainer}>
              <View
                style={[
                  styles.progressBar,
                  {width: `${state.progress * 100}%`},
                ]}
              />
            </View>
          )}

          <View style={styles.logContainer}>
            <Text style={styles.logHeader}>Log Output:</Text>
            <ScrollView
              style={styles.logs}
              contentContainerStyle={{paddingBottom: 20}}>
              {state.logs
                .slice()
                .reverse()
                .map((log, i) => (
                  <Text key={i} style={styles.logText}>
                    {log}
                  </Text>
                ))}
            </ScrollView>
          </View>

          {state.status === 'error' && (
            <Text style={styles.errorHint}>
              Your data is backed up. Please take a screenshot of this screen
              and contact support.
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

function getStatusMessage(state: MigrationState): string {
  switch (state.status) {
    case 'backing_up':
      return 'Creating a safety backup...';
    case 'migrating':
      return `Migrating item ${state.processedItems} of ${state.totalItems}...`;
    case 'validating':
      return 'Verifying data integrity...';
    case 'error':
      return state.error || 'An unexpected error occurred.';
    default:
      return 'Please wait...';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9', // Light background
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    gap: 16,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0fdfa',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Outfit_700Bold',
    color: '#0f172a',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
  },
  progressContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#0f766e',
  },
  logContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#0f172a', // Terminal look
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  logHeader: {
    color: '#94a3b8',
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  logs: {
    flex: 1,
  },
  logText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  errorHint: {
    marginTop: 16,
    color: '#ef4444',
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
  },
});
