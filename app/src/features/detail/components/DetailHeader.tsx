import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {FindRecord, Session} from '@/shared/types';
import {formatLocationSync} from '@/shared/format';
import {styles} from '../FindDetailModal.styles';

import {ThemeColors} from '@/shared/ThemeContext';

type Props = {
  localItem: FindRecord;
  label: string;
  favorite: boolean;
  setFavorite: React.Dispatch<React.SetStateAction<boolean>>;
  session: Session | null;
  onFilterBySession?: (sessionId: string) => void;
  colors: ThemeColors;
  mode: string;
};

export function DetailHeader({
  localItem,
  label,
  favorite,
  setFavorite,
  session,
  onFilterBySession,
  colors,
  mode,
}: Props) {
  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const aiResult = localItem.aiData?.result || null;

  return (
    <View style={[styles.infoDock, {backgroundColor: colors.card}]}>
      <View style={styles.titleRow}>
        <Text
          style={[styles.title, {color: colors.text}]}
          accessibilityRole="header">
          {label || aiResult?.best_guess?.label || 'Unknown Rock'}
        </Text>
        <TouchableOpacity onPress={() => setFavorite(p => !p)}>
          <Ionicons
            name={favorite ? 'star' : 'star-outline'}
            size={32}
            color={favorite ? '#fbbf24' : colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <Text style={[styles.metadata, {color: colors.textSecondary}]}>
        {localItem.location_text ||
          formatLocationSync(localItem.lat, localItem.long)}
        {' • '}
        {formatDate(localItem.timestamp)}
        {localItem?.aiData?.meta && (
          <Text style={{fontSize: 10, color: colors.accent}}>
            {' '}
            • v{localItem.aiData.meta.schemaVersion}
          </Text>
        )}
      </Text>

      {session && (
        <View
          style={[
            styles.sessionBar,
            {
              backgroundColor:
                mode === 'high-contrast'
                  ? 'rgba(255,255,255,0.1)'
                  : 'rgba(0,0,0,0.03)',
            },
          ]}>
          <View style={{flex: 1}}>
            <Text style={[styles.sessionLabel, {color: colors.textSecondary}]}>
              FOUND DURING
            </Text>
            <Text
              style={[styles.sessionName, {color: colors.text}]}
              numberOfLines={1}>
              {session.name}
            </Text>
            {session.locationName && (
              <Text
                style={[styles.sessionLocation, {color: colors.textSecondary}]}
                numberOfLines={1}>
                <Ionicons name="map-outline" size={12} /> {session.locationName}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={[styles.viewSessionBtn, {backgroundColor: colors.accent}]}
            onPress={() => onFilterBySession?.(session.id)}>
            <Text style={styles.viewSessionBtnText}>View Walk</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
