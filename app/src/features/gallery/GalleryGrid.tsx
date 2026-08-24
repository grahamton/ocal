import React from 'react';
import {FlatList, Text, useWindowDimensions, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {FindRecord} from '@/shared/types';
import {useTheme} from '@/shared/ThemeContext';
import {useGalleryGrid} from './hooks/useGalleryGrid';
import {GalleryHeader} from './components/GalleryHeader';
import {GridItem} from './components/GridItem';
import {ListItem} from './components/ListItem';
import {styles} from './GalleryGrid.styles';

const spacing = 12;

type Props = {
  refreshKey: number;
  onSelect?: (item: FindRecord) => void;
  initialSessionId?: string | null;
  ListHeaderComponent?: React.ReactNode;
  refreshControl?: React.ReactElement;
};

export function GalleryGrid({
  refreshKey,
  onSelect,
  initialSessionId,
  ListHeaderComponent,
  refreshControl,
}: Props) {
  const {colors, mode} = useTheme();
  const {width} = useWindowDimensions();

  const {
    items,
    error,
    filter,
    setFilter,
    viewMode,
    setViewMode,
    selectedSessionId,
    setSelectedSessionId,
    activeSession,
    sessions,
    recentSessions,
    selectedIds,
    enterSelectionMode,
    filteredItems,
    handleItemPress,
  } = useGalleryGrid({refreshKey, initialSessionId, onSelect});

  const numColumns = width > 600 ? 3 : 2;
  const cardWidth = (width - 48 - spacing * (numColumns - 1)) / numColumns;
  const columns = viewMode === 'grid' ? numColumns : 1;

  const renderItem = ({item}: {item: FindRecord}) => {
    const isSelected = selectedIds.has(item.id);
    return viewMode === 'grid' ? (
      <GridItem
        item={item}
        isSelected={isSelected}
        cardWidth={cardWidth}
        colors={colors}
        mode={mode}
        onPress={() => handleItemPress(item)}
        onLongPress={() => enterSelectionMode(item.id)}
      />
    ) : (
      <ListItem
        item={item}
        isSelected={isSelected}
        colors={colors}
        mode={mode}
        onPress={() => handleItemPress(item)}
        onLongPress={() => enterSelectionMode(item.id)}
      />
    );
  };

  const renderEmptyComponent = () => {
    if (items.length === 0) {
      return (
        <View style={[styles.emptyBox, {backgroundColor: colors.card}]}>
          <Ionicons
            name="camera-outline"
            size={48}
            color={colors.accent}
            style={{marginBottom: 16}}
          />
          <Text style={[styles.emptyText, {color: colors.text}]}>
            Your collection is empty.
          </Text>
          <Text
            style={[
              styles.emptySubText,
              {color: colors.textSecondary, marginTop: 8},
            ]}>
            Ready for a walk? Tap Capture to start finding treasures.
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyCollection}>
        <Text style={[styles.emptySubText, {color: colors.textSecondary}]}>
          {filter === 'session' && !selectedSessionId
            ? 'Select a walk to see finds.'
            : 'No finds match this filter.'}
        </Text>
      </View>
    );
  };

  if (error) {
    return (
      <View style={[styles.emptyBox, {backgroundColor: colors.card}]}>
        <Ionicons
          name="cloud-offline-outline"
          size={48}
          color={colors.danger}
          style={{marginBottom: 16}}
        />
        <Text style={[styles.emptyText, {color: colors.text}]}>
          Error Loading Finds
        </Text>
        <Text
          style={[
            styles.emptySubText,
            {color: colors.textSecondary, marginTop: 8},
          ]}>
          {error}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      key={`${viewMode}-${columns}`}
      data={filteredItems}
      numColumns={columns}
      keyExtractor={item => item.id}
      renderItem={renderItem}
      columnWrapperStyle={
        viewMode === 'grid' ? styles.columnWrapper : undefined
      }
      contentContainerStyle={[styles.listContainer, {paddingBottom: 120}]}
      refreshControl={refreshControl}
      ListHeaderComponent={
        <GalleryHeader
          itemsCount={items.length}
          viewMode={viewMode}
          setViewMode={setViewMode}
          filter={filter}
          setFilter={setFilter}
          sessions={sessions}
          recentSessions={recentSessions}
          selectedSessionId={selectedSessionId}
          setSelectedSessionId={setSelectedSessionId}
          activeSession={activeSession}
          ListHeaderComponent={ListHeaderComponent}
          colors={colors}
        />
      }
      ListEmptyComponent={renderEmptyComponent}
    />
  );
}
