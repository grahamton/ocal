import React, {useRef, useState} from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
// Use dynamic require or check for existence to prevent crash in Expo Go
let captureRef: any;
try {
  captureRef = require('react-native-view-shot').captureRef;
} catch (e) {
  // Module missing, handled in handleShare
}
import * as Sharing from 'expo-sharing';
import {PosterPreview} from './PosterPreview';
import {FindRecord} from '@/shared/types';
import {useTheme} from '@/shared/ThemeContext';
import {logger} from '@/shared/LogService';

interface Props {
  visible: boolean;
  onClose: () => void;
  selectedItems: FindRecord[];
}

export function PosterModal({visible, onClose, selectedItems}: Props) {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const posterRef = useRef<View>(null);
  const [theme, setTheme] = useState<'color' | 'bw'>('color');
  const [isExporting, setIsExporting] = useState(false);
  
  // Customization state
  const [showName, setShowName] = useState(true);
  const [showDate, setShowDate] = useState(true);
  const [showLocation, setShowLocation] = useState(true);
  const [numColumns, setNumColumns] = useState<number | undefined>(undefined);

  const handleShare = async () => {
    if (!posterRef.current) return;
    
    if (!captureRef) {
      Alert.alert(
        'Native Module Missing',
        'Image export requires a native rebuild. Please run "npm run android" or "npm run ios" to enable this feature.'
      );
      return;
    }

    setIsExporting(true);
    try {
      const uri = await captureRef(posterRef, {
        format: 'jpg',
        quality: 0.9,
      });

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }

      await Sharing.shareAsync(uri);
      logger.add('user', 'Shared poster', {count: selectedItems.length});
    } catch (error) {
      logger.error('Failed to share poster', error);
      Alert.alert('Error', 'Failed to generate poster');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={[styles.container, {backgroundColor: colors.background, paddingTop: insets.top}]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, {color: colors.text}]}>Create Poster</Text>
          <View style={{width: 28}} /> {/* Spacer */}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View collapsable={false} ref={posterRef}>
            <PosterPreview 
              selectedItems={selectedItems} 
              theme={theme}
              showName={showName}
              showDate={showDate}
              showLocation={showLocation}
              numColumns={numColumns}
            />
          </View>

          <View style={styles.controls}>
            <View style={styles.controlGroup}>
              <Text style={[styles.controlLabel, {color: colors.textSecondary}]}>Theme</Text>
              <View style={styles.themeRow}>
                <TouchableOpacity
                  style={[
                    styles.themeButton,
                    theme === 'color' && styles.themeButtonActive,
                    {borderColor: colors.border},
                  ]}
                  onPress={() => setTheme('color')}>
                  <Text style={[styles.themeText, theme === 'color' && styles.themeTextActive]}>
                    Full Color
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.themeButton,
                    theme === 'bw' && styles.themeButtonActive,
                    {borderColor: colors.border},
                  ]}
                  onPress={() => setTheme('bw')}>
                  <Text style={[styles.themeText, theme === 'bw' && styles.themeTextActive]}>
                    Journal B&W
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.controlGroup}>
              <Text style={[styles.controlLabel, {color: colors.textSecondary}]}>Layout</Text>
              <View style={styles.themeRow}>
                {[undefined, 2, 3, 4].map((cols) => (
                  <TouchableOpacity
                    key={cols === undefined ? 'auto' : cols}
                    style={[
                      styles.layoutButton,
                      numColumns === cols && styles.themeButtonActive,
                      {borderColor: colors.border},
                    ]}
                    onPress={() => setNumColumns(cols)}>
                    <Text style={[styles.themeText, numColumns === cols && styles.themeTextActive]}>
                      {cols === undefined ? 'Auto' : `${cols} Col`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.controlGroup}>
              <Text style={[styles.controlLabel, {color: colors.textSecondary}]}>Captions</Text>
              <View style={[styles.optionRow, {borderColor: colors.border}]}>
                <Text style={[styles.optionText, {color: colors.text}]}>Show Name</Text>
                <Switch 
                  value={showName} 
                  onValueChange={setShowName}
                  trackColor={{true: colors.accent, false: colors.border}}
                />
              </View>
              <View style={[styles.optionRow, {borderColor: colors.border}]}>
                <Text style={[styles.optionText, {color: colors.text}]}>Show Date</Text>
                <Switch 
                  value={showDate} 
                  onValueChange={setShowDate}
                  trackColor={{true: colors.accent, false: colors.border}}
                />
              </View>
              <View style={[styles.optionRow, {borderColor: colors.border}]}>
                <Text style={[styles.optionText, {color: colors.text}]}>Show Location</Text>
                <Switch 
                  value={showLocation} 
                  onValueChange={setShowLocation}
                  trackColor={{true: colors.accent, false: colors.border}}
                />
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, {paddingBottom: insets.bottom + 16}]}>
          <TouchableOpacity
            style={[styles.shareButton, {backgroundColor: colors.accent}]}
            onPress={handleShare}
            disabled={isExporting}>
            {isExporting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="share-outline" size={20} color="#fff" />
                <Text style={styles.shareText}>Export & Share</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  scrollContent: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  controls: {
    marginTop: 30,
    width: '90%',
    gap: 24,
  },
  controlGroup: {
    gap: 12,
  },
  controlLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  themeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  layoutButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  themeButtonActive: {
    backgroundColor: '#111',
    borderColor: '#111',
  },
  themeText: {
    fontWeight: '700',
    color: '#64748b',
    fontSize: 13,
  },
  themeTextActive: {
    color: '#fff',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
  },
  shareText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
});

