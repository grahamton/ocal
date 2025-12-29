import { Image, Text, View } from 'react-native';
import { findDetailStyles as styles } from '../FindDetailModal.styles';

type Props = {
  photoUri: string;
  timestampLabel: string;
  coordsLabel: string;
  sessionId: string | null;
};

export function MetaSection({ photoUri, timestampLabel, coordsLabel, sessionId }: Props) {
  return (
    <>
      <Image source={{ uri: photoUri }} style={styles.hero} />
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>Captured {timestampLabel}</Text>
        <Text style={styles.metaText}>{coordsLabel}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Session</Text>
        <Text style={styles.metaText}>{sessionId ? 'Linked to a session' : 'Unsorted'}</Text>
        {sessionId ? <Text style={styles.metaSubtle}>{sessionId}</Text> : null}
      </View>
    </>
  );
}
