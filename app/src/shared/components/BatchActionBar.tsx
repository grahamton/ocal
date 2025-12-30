import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GlassView } from './GlassView';
import { THEME } from '../theme';
import { useSelection } from '../SelectionContext';
import { IdentifyQueueService } from '../../ai/IdentifyQueueService';
import { logger } from '../LogService';

type Props = {
  // onIdentify moved internal
  onPoster?: () => void;
  onDelete?: () => void;
};

export function BatchActionBar({ onPoster, onDelete }: Omit<Props, 'onIdentify'>) {
  const { selectedIds, exitSelectionMode } = useSelection();
  const count = selectedIds.size;

  const handleBatchIdentify = async () => {
    // Queue all selected
    try {
        const ids = Array.from(selectedIds);
        await Promise.all(ids.map(id => IdentifyQueueService.addToQueue(id)));
        // Optional: Show toast?
        exitSelectionMode();
    } catch (e) {
        logger.error('Batch identify failed', e);
    }
  };

  return (
    <GlassView style={styles.container} intensity={40}>
      <TouchableOpacity onPress={exitSelectionMode} style={styles.closeButton}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>

      <View style={styles.countContainer}>
        <Text style={styles.countText}>{count} selected</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleBatchIdentify}>
          <Text style={styles.actionIcon}>✨</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onPoster}>
          <Text style={styles.actionIcon}>🖼️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
          <Text style={styles.actionIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </GlassView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 32,
    gap: 12,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: THEME.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  countContainer: {
    flex: 1,
  },
  countText: {
    ...THEME.typography.label,
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 20,
  },
});
