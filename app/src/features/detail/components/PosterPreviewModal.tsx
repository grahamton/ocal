import { Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SinglePosterView } from '../../poster/SinglePosterView';
import { findDetailStyles as styles } from '../FindDetailModal.styles';
import { FindRecord } from '../../../shared/types';

type Props = {
  visible: boolean;
  item: FindRecord;
  onClose: () => void;
};

export function PosterPreviewModal({ visible, item, onClose }: Props) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.posterSafeArea}>
        <ScrollView contentContainerStyle={styles.posterModalContent}>
          <SinglePosterView item={item} onClose={onClose} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
