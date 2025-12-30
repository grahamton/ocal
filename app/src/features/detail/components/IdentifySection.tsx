import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from '../../../shared/components/GlassView';
import { RockIdResult } from '../../../ai/rockIdSchema';

type Props = {
  aiResult: RockIdResult | null;
  aiError: string | null;
  aiLoading: boolean;
  onRun: () => void;
  onApply: () => void;
};

export function IdentifySection({ aiResult, aiError, aiLoading, onRun, onApply }: Props) {
  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.header}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="sparkles" size={20} color="#c084fc" />
          <View>
            <Text style={styles.title}>Rock Buddy AI</Text>
            <Text style={styles.subtitle}>Identify & analyze findings</Text>
          </View>
        </View>
        <TouchableOpacity
           style={[styles.runBtn, aiLoading && styles.runBtnDisabled]}
           onPress={onRun}
           disabled={aiLoading}
        >
          {aiLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.runBtnText}>Analyze</Text>}
        </TouchableOpacity>
      </View>

      {/* Error State */}
      {aiError ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={20} color="#f87171" />
          <Text style={styles.errorText}>{aiError}</Text>
        </View>
      ) : null}

      {/* Loading State Helper */}
      {aiLoading ? (
         <Text style={styles.loadingText}>Analyzing photo features...</Text>
      ) : null}

      {/* Result Card */}
      {aiResult ? (
        <GlassView style={styles.resultCard} intensity={25}>
          {/* Best Guess Hero */}
          <View style={styles.heroRow}>
             <View style={{flex: 1}}>
                <Text style={styles.matchLabel}>BEST MATCH</Text>
                <Text style={styles.guessTitle}>{aiResult.best_guess?.label ?? 'Unknown'}</Text>
                <Text style={styles.confidence}>{Math.round((aiResult.best_guess?.confidence ?? 0) * 100)}% Confidence</Text>
             </View>
             <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{aiResult.best_guess?.category ?? '?'}</Text>
             </View>
          </View>

          {/* Details List */}
          <View style={styles.details}>
             {aiResult.observable_reasons?.length ? (
                <View>
                   <Text style={styles.sectionHeader}>OBSERVATIONS</Text>
                   {aiResult.observable_reasons.map((r, i) => (
                      <Text key={i} style={styles.detailItem}>• {r}</Text>
                   ))}
                </View>
             ) : null}

             {aiResult.alternatives?.length ? (
                <View>
                   <Text style={styles.sectionHeader}>ALTERNATIVES</Text>
                   <Text style={styles.detailItem}>
                      {aiResult.alternatives.map(a => `${a.label} (${Math.round((a.confidence??0)*100)}%)`).join(', ')}
                   </Text>
                </View>
             ) : null}
          </View>

          {/* Action Footer */}
          <TouchableOpacity style={styles.applyBtn} onPress={onApply}>
             <Text style={styles.applyBtnText}>Apply to Logbook</Text>
             <Ionicons name="arrow-up-circle-outline" size={20} color="#0f172a" />
          </TouchableOpacity>

        </GlassView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    marginVertical: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Outfit_700Bold',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
  },
  runBtn: {
    backgroundColor: '#7c3aed', // Violet-600
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#8b5cf6',
  },
  runBtnDisabled: {
    opacity: 0.7,
  },
  runBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Outfit_700Bold',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 14,
    flex: 1,
  },
  loadingText: {
    color: '#cbd5e1',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  resultCard: {
    padding: 16,
    borderRadius: 16,
    gap: 16,
    backgroundColor: 'rgba(255,255,255,0.05)', // Subtle backdrop
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingBottom: 12,
  },
  matchLabel: {
    color: '#c084fc',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 2,
  },
  guessTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'Outfit_800ExtraBold',
  },
  confidence: {
    color: '#94a3b8',
    fontSize: 13,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  details: {
    gap: 12,
  },
  sectionHeader: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  detailItem: {
    color: '#e2e8f0',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Outfit_400Regular',
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#e2e8f0',
    padding: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  applyBtnText: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'Outfit_700Bold',
  },
});
