import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from '../../../shared/components/GlassView';
import { FindRecord } from '../../../shared/types';
import { formatCoords, formatTimestamp } from '../../../shared/format';
import { ChipSelector } from './ChipSelector';
import { IdentifySection } from './IdentifySection';
import { CATEGORY_OPTIONS } from '../../../shared/constants';
import { RockIdResult } from '../../../ai/rockIdSchema';
import { useTheme } from '../../../shared/ThemeContext';

type Props = {
  item: FindRecord;
  sessionId: string | null;
  label: string;
  setLabel: (val: string) => void;
  category: string | null;
  setCategory: (val: string | null) => void;
  status: 'draft' | 'cataloged';
  setStatus: (val: 'draft' | 'cataloged') => void;
  note: string;
  setNote: (val: string) => void;
  favorite: boolean;
  setFavorite: (val: boolean | ((p: boolean) => boolean)) => void;
  aiResult: RockIdResult | null;
  aiError: string | null;
  aiLoading: boolean;
  onRunIdentify: () => void;
  onApplyTags: () => void;

  onClose: () => void;
  onSave: () => void;
  onFlipBack: () => void;
};

export function CardBack(props: Props) {
  const { colors, mode } = useTheme();

  return (
    <GlassView style={styles.container} intensity={40}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24} // Adjust based on Modal/StatusBar
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Logbook Entry</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={props.onFlipBack} style={styles.closeBtn}>
                 <Ionicons name="camera-reverse-outline" size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={props.onClose} style={styles.closeBtn}>
                 <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.metaGrid, { backgroundColor: mode === 'journal' ? '#f1f5f9' : '#111' }]}>
               <View style={styles.metaItem}>
                   <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                   <Text style={[styles.metaText, { color: colors.textSecondary }]}>{formatTimestamp(props.item.timestamp)}</Text>
               </View>
               <View style={styles.metaItem}>
                   <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                   <Text style={[styles.metaText, { color: colors.textSecondary }]}>{formatCoords(props.item.lat, props.item.long) || 'No Loc'}</Text>
               </View>
          </View>

          <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Name</Text>
              <TextInput
                  value={props.label}
                  onChangeText={props.setLabel}
                  style={[styles.input, { backgroundColor: mode === 'journal' ? '#fff' : '#0f172a', borderColor: colors.border, color: colors.text }]}
                  placeholder="Name your find..."
                  placeholderTextColor={colors.textSecondary}
              />
          </View>

          <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Category</Text>
              <ChipSelector
                  options={CATEGORY_OPTIONS}
                  selected={props.category ?? 'Unsorted'}
                  onSelect={props.setCategory}
                  // ChipSelector needs to handle theme internally or accept props, assuming standard View for now
                  // If ChipSelector has hardcoded colors, it might need update too.
              />
          </View>

          <IdentifySection
              aiResult={props.aiResult}
              aiError={props.aiError}
              aiLoading={props.aiLoading}
              onRun={props.onRunIdentify}
              onApply={props.onApplyTags}
              // IdentifySection likely needs theme update too if not passed down
          />

          <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Field Notes</Text>
              <TextInput
                  value={props.note}
                  onChangeText={props.setNote}
                  style={[styles.input, styles.textArea, { backgroundColor: mode === 'journal' ? '#fff' : '#0f172a', borderColor: colors.border, color: colors.text }]}
                  placeholder="Observations..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
              />
          </View>

          <View style={styles.actions}>
              <TouchableOpacity style={[
                    styles.actionBtn,
                    { borderColor: colors.border, backgroundColor: mode === 'journal' ? '#f8fafc' : 'rgba(255,255,255,0.05)' },
                    props.favorite && { backgroundColor: colors.accentSecondary, borderColor: colors.accentSecondary }
                ]} onPress={() => props.setFavorite((p: boolean) => !p)}>
                  <Ionicons name={props.favorite ? "star" : "star-outline"} size={20} color={props.favorite ? "#fff" : colors.textSecondary} />
                  <Text style={[styles.actionText, { color: props.favorite ? '#fff' : colors.textSecondary }]}>{props.favorite ? 'Favorited' : 'Favorite'}</Text>
              </TouchableOpacity>


          </View>

        </ScrollView>

        {/* Done / Flip Back Button */}
        <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.text }]} onPress={props.onSave}>
               <Text style={[styles.saveText, { color: colors.background }]}>File It</Text>
            </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </GlassView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 24,
    // backgroundColor handled by GlassView props/theme
    borderWidth: 0, // GlassView adds border
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    // borderBottomColor dynamic
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Outfit_700Bold',
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 16,
    gap: 20,
  },
  metaGrid: {
    flexDirection: 'row',
    gap: 16,
    padding: 12,
    borderRadius: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Outfit_700Bold',
  },
  input: {
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    fontFamily: 'Outfit_400Regular',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  favActive: {
    // handled inline
  },
  actionText: {
    fontWeight: '600',
    fontFamily: 'Outfit_700Bold',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    // bg dynamic
  },
  saveBtn: {
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'Outfit_800ExtraBold',
  },
});
