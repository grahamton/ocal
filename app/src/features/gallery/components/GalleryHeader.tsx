import React from 'react';
import {ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {Session} from '@/shared/types';
import {styles} from '../GalleryGrid.styles';

type FilterMode = 'all' | 'favorites' | 'session';
type ViewMode = 'grid' | 'list';

import {ThemeColors} from '@/shared/ThemeContext';

type Props = {
  itemsCount: number;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  filter: FilterMode;
  setFilter: (filter: FilterMode) => void;
  sessions: Session[];
  recentSessions: Session[];
  selectedSessionId: string | null;
  setSelectedSessionId: (id: string | null) => void;
  activeSession: Session | null;
  ListHeaderComponent?: React.ReactNode;
  colors: ThemeColors;
};

export function GalleryHeader({
  itemsCount,
  viewMode,
  setViewMode,
  filter,
  setFilter,
  sessions,
  recentSessions,
  selectedSessionId,
  setSelectedSessionId,
  activeSession,
  ListHeaderComponent,
  colors,
}: Props) {
  return (
    <View style={styles.headerContainer}>
      {ListHeaderComponent}
      <View style={styles.collectionHeader}>
        <Text style={[styles.sectionHeader, {color: colors.text}]}>
          Your Finds ({itemsCount})
        </Text>
        <View style={styles.headerActions}>
          <View style={styles.viewSwitcher}>
            <TouchableOpacity
              style={[
                styles.viewBtn,
                viewMode === 'grid' && {backgroundColor: colors.accent},
              ]}
              onPress={() => setViewMode('grid')}>
              <Ionicons
                name="grid"
                size={16}
                color={viewMode === 'grid' ? '#fff' : colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewBtn,
                viewMode === 'list' && {backgroundColor: colors.accent},
              ]}
              onPress={() => setViewMode('list')}>
              <Ionicons
                name="list"
                size={16}
                color={viewMode === 'list' ? '#fff' : colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'all' && {backgroundColor: colors.accent},
          ]}
          onPress={() => setFilter('all')}>
          <Text
            style={[
              styles.filterTabText,
              {color: filter === 'all' ? '#fff' : colors.textSecondary},
            ]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'favorites' && {backgroundColor: colors.accent},
          ]}
          onPress={() => setFilter('favorites')}>
          <Ionicons
            name="star"
            size={12}
            color={filter === 'favorites' ? '#fff' : '#fbbf24'}
            style={{marginRight: 4}}
          />
          <Text
            style={[
              styles.filterTabText,
              {
                color: filter === 'favorites' ? '#fff' : colors.textSecondary,
              },
            ]}>
            Favorites
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'session' && {backgroundColor: colors.accent},
          ]}
          onPress={() => {
            setFilter('session');
            if (!selectedSessionId && activeSession)
              setSelectedSessionId(activeSession.id);
          }}>
          <Text
            style={[
              styles.filterTabText,
              {color: filter === 'session' ? '#fff' : colors.textSecondary},
            ]}>
            By Walk
          </Text>
        </TouchableOpacity>
      </View>

      {filter === 'session' && sessions.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sessionPickerScroll}>
          {recentSessions.map(session => (
            <TouchableOpacity
              key={session.id}
              style={[
                styles.sessionChip,
                selectedSessionId === session.id && {
                  backgroundColor: colors.accent + '20',
                  borderColor: colors.accent,
                },
                {borderColor: colors.border},
              ]}
              onPress={() => setSelectedSessionId(session.id)}>
              <Text
                style={[
                  styles.sessionChipText,
                  {
                    color:
                      selectedSessionId === session.id
                        ? colors.accent
                        : colors.textSecondary,
                  },
                ]}>
                {session.name}
                {session.status === 'active' && ' 🔴'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
