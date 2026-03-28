import React from 'react';
import {View, Text, Image, StyleSheet, Dimensions} from 'react-native';
import {FindRecord} from '@/shared/types';
import {formatTimestamp, formatLocationSync} from '@/shared/format';

interface Props {
  selectedItems: FindRecord[];
  theme: 'color' | 'bw';
  showName: boolean;
  showDate: boolean;
  showLocation: boolean;
  numColumns?: number;
}

const {width} = Dimensions.get('window');
const posterWidth = width * 0.9;

export function PosterPreview({
  selectedItems,
  theme,
  showName,
  showDate,
  showLocation,
  numColumns: propColumns,
}: Props) {
  const isBw = theme === 'bw';

  // Calculate grid
  const count = selectedItems.length;
  let numColumns = propColumns || 2;
  if (!propColumns) {
    if (count > 4) numColumns = 3;
    if (count > 9) numColumns = 4;
  }

  const itemWidth = (posterWidth - 40 - (numColumns - 1) * 10) / numColumns;

  return (
    <View style={[styles.container, isBw && styles.containerBw]}>
      <Text style={[styles.header, isBw && styles.textBw]}>Field Journal Finds</Text>
      
      <View style={styles.grid}>
        {selectedItems.map(item => (
          <View key={item.id} style={[styles.item, {width: itemWidth}]}>
            <View style={styles.imageContainer}>
              <Image
                source={{uri: item.photoUri}}
                style={[
                  styles.image,
                  {width: itemWidth, height: itemWidth},
                  isBw && styles.imageBw,
                ]}
              />
              {isBw && <View style={styles.bwOverlay} />}
            </View>
            
            {showName && (
              <Text style={[styles.itemTitle, isBw && styles.textBw]} numberOfLines={1}>
                {item.label || 'Unknown Find'}
              </Text>
            )}
            
            <View style={styles.metaRow}>
              {showDate && (
                <Text style={[styles.itemMeta, isBw && styles.textBw]}>
                  {formatTimestamp(item.timestamp)}
                </Text>
              )}
              {showLocation && (
                <Text style={[styles.itemMeta, isBw && styles.textBw]} numberOfLines={1}>
                  {item.location_text || formatLocationSync(item.lat, item.long)}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, isBw && styles.textBw]}>Ocal - Silent Partner in Discovery</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fafaf9', // Journal Cream
    padding: 20,
    borderRadius: 8,
    width: posterWidth,
    alignSelf: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  containerBw: {
    backgroundColor: '#fff',
    borderColor: '#000',
    borderWidth: 1,
  },
  header: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'serif',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 10,
  },
  item: {
    marginBottom: 15,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
  },
  image: {
    borderRadius: 4,
  },
  imageBw: {
    // Desaturation simulation is limited without native filters
  },
  bwOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  itemTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 6,
  },
  metaRow: {
    marginTop: 2,
    gap: 1,
  },
  itemMeta: {
    fontSize: 9,
    color: '#64748b',
  },
  textBw: {
    color: '#000',
  },
  footer: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
});

