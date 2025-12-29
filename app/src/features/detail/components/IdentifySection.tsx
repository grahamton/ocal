import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { findDetailStyles as styles } from '../FindDetailModal.styles';
import { AiResult } from '../types';

type Props = {
  aiResult: AiResult | null;
  aiError: string | null;
  aiLoading: boolean;
  onRun: () => void;
  onApply: () => void;
};

export function IdentifySection({ aiResult, aiError, aiLoading, onRun, onApply }: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.identifyRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Identify (AI)</Text>
          <Text style={styles.metaText}>Optional helper for sorting</Text>
        </View>
        <TouchableOpacity style={styles.identifyButton} onPress={onRun} disabled={aiLoading}>
          {aiLoading ? <ActivityIndicator color="#0f172a" /> : <Text style={styles.identifyText}>Run AI</Text>}
        </TouchableOpacity>
      </View>
      {aiError ? <Text style={styles.errorText}>{aiError}</Text> : null}
      {aiLoading ? <Text style={styles.metaText}>Analyzing photo...</Text> : null}
      {aiResult ? (
        <View style={styles.aiCard}>
          <Text style={styles.aiTitle}>
            Best guess: {aiResult.best_guess?.label ?? 'Unknown'} (
            {Math.round((aiResult.best_guess?.confidence ?? 0) * 100)}%)
          </Text>
          <Text style={styles.metaText}>Category: {aiResult.best_guess?.category ?? 'unknown'}</Text>
          {aiResult.alternatives?.length ? (
            <View style={styles.aiSection}>
              <Text style={styles.label}>Alternatives</Text>
              {aiResult.alternatives.map((alt, idx: number) => (
                <Text key={idx} style={styles.metaText}>
                  {alt.label} ({Math.round((alt.confidence ?? 0) * 100)}%)
                </Text>
              ))}
            </View>
          ) : null}
          {aiResult.observable_reasons?.length ? (
            <View style={styles.aiSection}>
              <Text style={styles.label}>Reasons</Text>
              {aiResult.observable_reasons.map((reason: string, idx: number) => (
                <Text key={idx} style={styles.metaText}>
                  - {reason}
                </Text>
              ))}
            </View>
          ) : null}
          {aiResult.caution?.length ? (
            <View style={styles.aiSection}>
              <Text style={styles.label}>Caution</Text>
              {aiResult.caution.map((c: string, idx: number) => (
                <Text key={idx} style={styles.metaText}>
                  - {c}
                </Text>
              ))}
            </View>
          ) : null}
          {aiResult.red_flags?.length ? (
            <View style={styles.aiSection}>
              <Text style={styles.label}>Red flags</Text>
              {aiResult.red_flags.map((c: string, idx: number) => (
                <Text key={idx} style={styles.metaText}>
                  - {c}
                </Text>
              ))}
            </View>
          ) : null}
          <TouchableOpacity style={styles.applyButton} onPress={onApply}>
            <Text style={styles.applyText}>Apply tags</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}
