import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FindRecord } from '../../../shared/types';
import { THEME } from '../../../shared/theme';

type Props = {
  item: FindRecord;
  onFlip: () => void;
};

export function CardFront({ item, onFlip }: Props) {
  return (
    <View style={styles.container}>
      {/* Hero Image */}
      <Image source={{ uri: item.photoUri }} style={styles.image} resizeMode="cover" />

      {/* Tappable Area for Flip */}
      <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onFlip} activeOpacity={1}>
        {/* Scrim / Details */}
        <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.scrim}
        >
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.label}>{item.label || 'Untitled Rock'}</Text>
                    {item.category && item.category !== 'Unsorted' && (
                        <Text style={styles.category}>{item.category.toUpperCase()}</Text>
                    )}
                </View>
                {item.favorite && (
                    <Ionicons name="star" size={32} color="#ca8a04" />
                )}
            </View>
            <Text style={styles.hint}>Tap to flip for logbook</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  scrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingTop: 80,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    // ... same as before
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 32,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  category: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    letterSpacing: 1,
  },
  hint: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: 12,
  },
});
