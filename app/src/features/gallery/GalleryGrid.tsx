import React from 'react';
import {FlatList, Text, useWindowDimensions, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {FindRecord} from '@/shared/types';
import {useTheme} from '@/shared/ThemeContext';
import {useGalleryGrid} from './hooks/useGalleryGrid';
import {FilterButtons} from './components/FilterButtons';
import {GridItem} from './components/GridItem';
import {GalleryRow, groupByDay} from './dayGroups';
import {styles} from './GalleryGrid.styles';

const spacing = 12;

type Props = {
  refreshKey: number;
  onSelect?: (item: FindRecord) => void;
  ListHeaderComponent?: React.ReactNode;
  refreshControl?: React.ReactElement;
};

export function GalleryGrid({
  refreshKey,
  onSelect,
  ListHeaderComponent,
  refreshControl,
}: Props) {
  const {colors, mode} = useTheme();
  const {width} = useWindowDimensions();
  const {items, error, filter, setFilter, filteredItems, handleItemPress} =
    useGalleryGrid({refreshKey, onSelect});

  const cardWidth = (width - 32 - spacing) / 2;
  const rows = groupByDay(filteredItems);

  const renderRow = ({item}: {item: GalleryRow}) => {
    if (item.type === 'day') {
      return (
        <Text
          style={[styles.dayHeading, {color: colors.text}]}
          accessibilityRole="header">
          {item.label}
        </Text>
      );
    }
    return (
      <View style={styles.pairRow}>
        {item.items.map(find => (
          <GridItem
            key={find.id}
            item={find}
            cardWidth={cardWidth}
            colors={colors}
            mode={mode}
            onPress={() => handleItemPress(find)}
          />
        ))}
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={[styles.emptyBox, {backgroundColor: colors.card}]}>
      <Ionicons name="camera-outline" size={48} color={colors.accent} />
      <Text style={[styles.emptyText, {color: colors.text}]}>
        {items.length === 0 ? 'No rocks yet.' : 'No favorites yet.'}
      </Text>
      <Text style={[styles.emptySubText, {color: colors.textSecondary}]}>
        {items.length === 0
          ? 'Tap Take Photo to find your first one.'
          : 'Open a rock and tap Add to favorites.'}
      </Text>
    </View>
  );

  if (error) {
    return (
      <View style={[styles.emptyBox, {backgroundColor: colors.card}]}>
        <Ionicons name="cloud-offline-outline" size={48} color={colors.danger} />
        <Text style={[styles.emptyText, {color: colors.text}]}>
          Could not load your rocks
        </Text>
        <Text style={[styles.emptySubText, {color: colors.textSecondary}]}>
          {error}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={rows}
      keyExtractor={row => row.key}
      renderItem={renderRow}
      contentContainerStyle={styles.listContainer}
      refreshControl={refreshControl}
      ListHeaderComponent={
        <>
          {ListHeaderComponent}
          <FilterButtons
            filter={filter}
            setFilter={setFilter}
            total={items.length}
            colors={colors}
          />
        </>
      }
      ListEmptyComponent={renderEmpty}
    />
  );
}
