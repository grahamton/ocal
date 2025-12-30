import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FindRecord } from '../../../shared/types';
import { formatCoords } from '../../../shared/format';
import { formatTimestamp } from '../utils';
import { AiResult } from '../types';
import { IdentifySection } from './IdentifySection';
import { ChipSelector } from './ChipSelector';

type Props = {
  label: string;
  setLabel: (v: string) => void;
  note: string;
  setNote: (v: string) => void;
  category: string | null;
  setCategory: (v: string | null) => void;
  status: 'draft' | 'cataloged';
  setStatus: (v: 'draft' | 'cataloged') => void;
  favorite: boolean;
  setFavorite: (v: boolean | ((p: boolean) => boolean)) => void;

  // Meta
  item: FindRecord;
  sessionId: string | null;

  // AI
  aiResult: AiResult | null;
  aiError: string | null;
  aiLoading: boolean;
  onRunIdentify: () => void;
  onApplyTags: () => void;

  // Actions
  onPoster: () => void;
  onClose: () => void;
  onSave: () => void; // Save replaces "Flip back" in this context? Or explicit save button?
};

const CATEGORY_OPTIONS = ['Unsorted', 'Agate', 'Jasper', 'Fossil', 'Driftwood', 'Other'].map((value) => ({
  value,
}));

export function CardBack(props: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Logbook Entry</Text>
        <TouchableOpacity onPress={props.onClose} style={styles.closeBtn}>
             <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Meta Grid */}
        <View style={styles.metaGrid}>
             <View style={styles.metaItem}>
                 <Ionicons name="time-outline" size={16} color="#94a3b8" />
                 <Text style={styles.metaText}>{formatTimestamp(props.item.timestamp)}</Text>
             </View>
             <View style={styles.metaItem}>
                 <Ionicons name="location-outline" size={16} color="#94a3b8" />
                 <Text style={styles.metaText}>{formatCoords(props.item.lat, props.item.long) || 'No Loc'}</Text>
             </View>
        </View>

        {/* Main Edit Form */}
        <View style={styles.formGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
                value={props.label}
                onChangeText={props.setLabel}
                style={styles.input}
                placeholder="Name your find..."
                placeholderTextColor="#64748b"
            />
        </View>

        <View style={styles.formGroup}>
            <Text style={styles.label}>Category</Text>
            <ChipSelector
                options={CATEGORY_OPTIONS}
                selected={props.category ?? 'Unsorted'}
                onSelect={props.setCategory}
            />
        </View>

        <IdentifySection
            aiResult={props.aiResult}
            aiError={props.aiError}
            aiLoading={props.aiLoading}
            onRun={props.onRunIdentify}
            onApply={props.onApplyTags}
        />

        <View style={styles.formGroup}>
            <Text style={styles.label}>Field Notes</Text>
            <TextInput
                value={props.note}
                onChangeText={props.setNote}
                style={[styles.input, styles.textArea]}
                placeholder="Observations..."
                placeholderTextColor="#64748b"
                multiline
            />
        </View>

        <View style={styles.actions}>
            <TouchableOpacity style={[styles.actionBtn, props.favorite && styles.favActive]} onPress={() => props.setFavorite(p => !p)}>
                <Ionicons name={props.favorite ? "star" : "star-outline"} size={20} color={props.favorite ? "#fff" : "#94a3b8"} />
                <Text style={[styles.actionText, props.favorite && {color: '#fff'}]}>{props.favorite ? 'Favorited' : 'Favorite'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={props.onPoster}>
                <Ionicons name="image-outline" size={20} color="#94a3b8" />
                <Text style={styles.actionText}>Poster</Text>
            </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Done / Flip Back Button */}
      <View style={styles.footer}>
          <TouchableOpacity style={styles.saveBtn} onPress={props.onSave}>
             <Text style={styles.saveText}>Save & Flip</Text>
          </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: {
    color: '#fff',
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
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 12,
    borderRadius: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: '#94a3b8',
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
  },
  formGroup: {
    gap: 8,
  },
  label: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Outfit_700Bold',
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
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
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  favActive: {
    backgroundColor: '#ca8a04', // Goldish/Dark Yellow
    borderColor: '#eab308',
  },
  actionText: {
    color: '#94a3b8',
    fontWeight: '600',
    fontFamily: 'Outfit_700Bold',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    backgroundColor: '#1e293b',
  },
  saveBtn: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'Outfit_800ExtraBold',
  },
});
