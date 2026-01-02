import { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, ScrollView, Image, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { updateFindMetadata, getFind, deleteFind, getSession } from '../../shared/db';
import { FindRecord } from '../../shared/types';
import { IdentifyQueueService } from '../../ai/IdentifyQueueService';
import { RockIdResult, AnalysisEvent } from '../../ai/rockIdSchema';
import { formatLocationSync } from '../../shared/format';
import { useTheme, ThemeColors } from '../../shared/ThemeContext';
import { StatusIcon } from '../../../components/StatusIcon';
import { getCategoryFromTags } from '../../../utils/CategoryMapper';
import { RawJsonInspector } from '../../../components/RawJsonInspector';

type Props = {
  visible: boolean;
  item: FindRecord | null;
  onClose: () => void;
  onSaved: () => void;
};



function ContextItem({ label, value, colors }: { label: string, value: string, colors: ThemeColors }) {
  if (!value) return null;
  return (
    <View style={styles.factGrid}>
       <View style={{width: '30%'}}>
          <Text style={[styles.factLabel, {color: colors.textSecondary}]}>{label}</Text>
       </View>
       <View style={{flex: 1}}>
          <Text style={[styles.factValue, {color: colors.text}]}>{value}</Text>
       </View>
    </View>
  );
}

export function FindDetailModal({ visible, item, onClose, onSaved }: Props) {
  const { colors, mode } = useTheme();
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [label, setLabel] = useState('');
  const [favorite, setFavorite] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<RockIdResult | null>(null);
  const [localItem, setLocalItem] = useState<FindRecord | null>(item);
  const [sessionName, setSessionName] = useState<string | null>(null);
  const [showContext, setShowContext] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (item && visible) {
      setLabel(item.label ?? '');
      setNote(item.note ?? '');
      setFavorite(item.favorite);
      setAiError(null);

      const rawAiData = item.aiData as (RockIdResult | AnalysisEvent | null);
      // Check if wrapped in AnalysisEvent (has 'result' property)
      if (rawAiData && 'result' in rawAiData && 'meta' in rawAiData) {
          setAiResult((rawAiData as AnalysisEvent).result);
      } else {
          setAiResult((rawAiData as RockIdResult) || null);
      }

      setLocalItem(item);
      setAiLoading(false);
      setSessionName(null);

      if (item.sessionId) {
        getSession(item.sessionId).then(s => {
            if (s) setSessionName(s.name);
        });
      }
    }
  }, [item, visible]);

  // Poll for queue updates if waiting for AI
  useEffect(() => {
    if (!visible || !item || aiResult) return;

    let mounted = true;
    const checkQueue = async () => {
      const qItem = await IdentifyQueueService.getQueueStatus(item.id);

      if (!mounted) return;

      if (qItem && (qItem.status === 'pending' || qItem.status === 'processing')) {
        setAiLoading(true);
        setTimeout(checkQueue, 2000);
      } else if (qItem && qItem.status === 'completed') {
        const fresh = await getFind(item.id);
        if (fresh && fresh.aiData && mounted) {
          const freshData = fresh.aiData as (RockIdResult | AnalysisEvent);
          if ('result' in freshData && 'meta' in freshData) {
             setAiResult((freshData as AnalysisEvent).result);
          } else {
             setAiResult(freshData as RockIdResult);
          }
          setLocalItem(fresh);
          setAiLoading(false);
        }
      } else if (qItem && qItem.status === 'failed') {
        setAiError(qItem.error || 'Request failed');
        setAiLoading(false);
      } else {
        // Not in queue? It might have just finished (row deleted).
        // Check the main table one last time.
        const freshFind = await getFind(item.id);
        if (freshFind && freshFind.aiData) {
          const freshData = freshFind.aiData as (RockIdResult | AnalysisEvent);
          if ('result' in freshData && 'meta' in freshData) {
             setAiResult((freshData as AnalysisEvent).result);
          } else {
             setAiResult(freshData as RockIdResult);
          }
          setLocalItem(freshFind);
        }
        setAiLoading(false);
      }
    };

    checkQueue();

    return () => { mounted = false; };
  }, [visible, item, aiResult]);

  const handleSave = async () => {
    if (!item || saving) return;
    setSaving(true);
    try {
      await updateFindMetadata(item.id, {
        label: label.trim() || null,
        note: note.trim() || null,
        status: 'cataloged',
        favorite,
      });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete this find?",
      "This cannot be undone.",
      [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
            try {
                // Safe access
                if (item?.id) {
                    await deleteFind(item.id);
                    onClose?.();
                }
            } catch {
                Alert.alert("Error", "Could not delete");
            }
        }
      }
    ]);
  };

  const handleShare = async () => {
    if (!item) return;
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(item.photoUri);
      } else {
        Alert.alert('Sharing not available', 'Sharing is not supported on this device/simulator.');
      }
    } catch (error) {
      console.error('Share failed', error);
      Alert.alert('Error', 'Could not share image.');
    }
  };

  const runIdentify = async () => {
    if (!item || aiLoading) return;
    setAiLoading(true);
    setAiError(null);
    try {
      await IdentifyQueueService.addToQueue(item.id);
    } catch {
      setAiError('Could not start analysis.');
      setAiLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString(undefined, {
      month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit'
    });
  };

  if (!localItem) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>

        {/* Close Button (Absolute) */}
        <TouchableOpacity style={[styles.closeBtn, { zIndex: 50 }]} onPress={onClose}>
           <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>

        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: localItem.photoUri }} style={styles.heroImage} resizeMode="cover" />
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.1)' }]} pointerEvents="none" />
        </View>

        {/* Content Scroll */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* State A: Unanalyzed */}
          {!aiResult && !aiLoading && (
            <TouchableOpacity
              style={[styles.analyzeButton, { backgroundColor: colors.accent }]}
              onPress={runIdentify}
            >
              <Ionicons name="sparkles" size={24} color="#fff" />
              <Text style={styles.analyzeButtonText}>Ask Ranger Al</Text>
            </TouchableOpacity>
          )}

          {/* Loading State */}
          {aiLoading && (
            <View style={[styles.loadingCard, { backgroundColor: colors.card }]}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={[styles.loadingText, { color: colors.text }]}>Analyzing your find...</Text>
            </View>
          )}

          {/* Error State */}
          {aiError && (
            <View style={[styles.errorCard, { backgroundColor: '#fef2f2', borderColor: '#ef4444' }]}>
              <Ionicons name="alert-circle" size={24} color="#ef4444" />
              <Text style={styles.errorText}>{aiError}</Text>
              <TouchableOpacity onPress={runIdentify}>
                <Text style={[styles.retryText, { color: colors.accent }]}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* State B: Analyzed - Info Dock */}
          {aiResult && (
            <>
              <View style={[styles.infoDock, { backgroundColor: colors.card }]}>
                {/* Title Row */}
                <View style={styles.titleRow}>
                  <Text
                    style={[styles.title, { color: colors.text }]}
                    accessibilityRole="header"
                  >
                    {label || aiResult.best_guess?.label || 'Unknown Rock'}
                  </Text>
                  <TouchableOpacity onPress={() => setFavorite(p => !p)}>
                    <Ionicons
                      name={favorite ? "star" : "star-outline"}
                      size={32}
                      color={favorite ? "#fbbf24" : colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                {/* Metadata Row */}
                <Text style={[styles.metadata, { color: colors.textSecondary }]}>
                  {(localItem.location_text || formatLocationSync(localItem.lat, localItem.long))}
                  {sessionName ? ` • ${sessionName}` : ''} • {formatDate(localItem.timestamp)}
                  {/* Traceability Badge */}
                  {localItem.aiData && 'meta' in localItem.aiData && (
                     <Text style={{fontSize: 10, color: colors.accent}}> • v{(localItem.aiData as AnalysisEvent).meta?.schemaVersion}</Text>
                  )}
                </Text>
              </View>

              {/* Dynamic Content Renderer */}
              <View style={[styles.labCard, { backgroundColor: colors.card, borderColor: colors.border }]}>

                {/* Dynamic Header (Polished/Rough) */}
                <View style={styles.labHeader}>
                   <StatusIcon
                      status={aiResult ? 'polished' : (aiLoading ? 'polishing' : 'rough')}
                      category={getCategoryFromTags([aiResult?.best_guess?.category || ''], aiResult?.best_guess?.label)}
                      confidence={aiResult?.best_guess?.confidence || 0}
                      size={40}
                      theme={mode === 'high-contrast' ? 'beach' : 'journal'}
                   />
                   <View style={{justifyContent: 'center', flex: 1}}>
                       <Text style={[styles.labTitle, { color: colors.text }]}>
                          {aiResult ? 'ANALYSIS COMPLETE' : (aiLoading ? 'ANALYZING...' : 'READY TO SCAN')}
                       </Text>
                       {/* Confidence Bar */}
                       {aiResult?.best_guess?.confidence !== undefined && (
                         <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4}}>
                           <View style={{height: 4, flex: 1, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden'}}>
                             <View style={{height: '100%', width: `${aiResult.best_guess.confidence * 100}%`, backgroundColor: aiResult.best_guess.confidence > 0.8 ? '#22c55e' : '#eab308'}} />
                           </View>
                           <Text style={{fontSize: 11, fontWeight: '700', color: colors.textSecondary}}>
                             {Math.round(aiResult.best_guess.confidence * 100)}%
                           </Text>
                         </View>
                       )}
                   </View>
                </View>

                {aiResult && (
                  <>
                    {/* Ranger Summary */}
                    {aiResult.ranger_summary && (
                      <View style={styles.summaryBox}>
                         <Ionicons name="chatbox-ellipses-outline" size={20} color={colors.accent} style={{marginTop: 2}} />
                         <Text style={[styles.summaryText, {color: colors.text}]}>{aiResult.ranger_summary}</Text>
                      </View>
                    )}

                    {/* Category Specific Analysis (New for Gemini 2.0) */}
                    {aiResult.category_details && (
                      <View style={[styles.labSection, { marginBottom: 8 }]}>
                         {/* Mineral */}
                         {aiResult.category_details.mineral && (
                           <>
                              <Text style={[styles.sectionHeader, {color: colors.text, marginBottom: 8}]}>MINERAL ANALYSIS</Text>
                              <ContextItem label="Crystal System" value={aiResult.category_details.mineral.crystal_system || ''} colors={colors} />
                              <ContextItem label="Formula" value={aiResult.category_details.mineral.chemical_formula || ''} colors={colors} />
                              <ContextItem label="Hardness" value={aiResult.category_details.mineral.hardness_scale || ''} colors={colors} />
                              <ContextItem label="Optical" value={aiResult.category_details.mineral.optical_properties || ''} colors={colors} />
                           </>
                         )}
                         {/* Rock */}
                         {aiResult.category_details.rock && (
                           <>
                              <Text style={[styles.sectionHeader, {color: colors.text, marginBottom: 8}]}>PETROLOGY</Text>
                              <ContextItem label="Texture" value={aiResult.category_details.rock.texture_type || ''} colors={colors} />
                              <ContextItem label="Composition" value={aiResult.category_details.rock.mineral_composition || ''} colors={colors} />
                              <ContextItem label="Environment" value={aiResult.category_details.rock.depositional_environment || ''} colors={colors} />
                           </>
                         )}
                         {/* Fossil */}
                         {aiResult.category_details.fossil && (
                           <>
                              <Text style={[styles.sectionHeader, {color: colors.text, marginBottom: 8}]}>PALEONTOLOGY</Text>
                              <ContextItem label="Taxonomy" value={aiResult.category_details.fossil.taxonomy || ''} colors={colors} />
                              <ContextItem label="Living Relative" value={aiResult.category_details.fossil.living_relative || ''} colors={colors} />
                              <ContextItem label="Preservation" value={aiResult.category_details.fossil.preservation_mode || ''} colors={colors} />
                           </>
                         )}
                         {/* Artifact */}
                         {aiResult.category_details.artifact && (
                           <>
                              <Text style={[styles.sectionHeader, {color: colors.text, marginBottom: 8}]}>ARTIFACT DETAILS</Text>
                              <ContextItem label="Likely Origin" value={aiResult.category_details.artifact.likely_origin || ''} colors={colors} />
                              <ContextItem label="Est. Age" value={aiResult.category_details.artifact.estimated_age_range || ''} colors={colors} />
                           </>
                         )}
                      </View>
                    )}

                    {/* Alerts (Red Flags / Caution) */}
                    {((aiResult.red_flags && aiResult.red_flags.length > 0) || (aiResult.caution && aiResult.caution.length > 0)) && (
                      <View style={[styles.alertBox, {backgroundColor: '#fef2f2', borderColor: '#ef4444'}]}>
                        <Ionicons name="warning" size={20} color="#ef4444" />
                        <View style={{flex: 1}}>
                          {[...(aiResult.red_flags || []), ...(aiResult.caution || [])].map((flag: string, i: number) => (
                             <Text key={i} style={[styles.alertText, {color: '#b91c1c'}]}>• {flag}</Text>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Lapidary / Tumble Info */}
                    {aiResult.lapidary_guidance && (
                      <View style={styles.labSection}>
                         <View style={styles.rowCenter}>
                           <Ionicons
                              name={aiResult.lapidary_guidance.is_tumble_candidate ? "checkmark-circle" : "close-circle"}
                              size={18}
                              color={aiResult.lapidary_guidance.is_tumble_candidate ? "#22c55e" : "#ef4444"}
                           />
                           <Text style={[styles.sectionHeader, {color: colors.text}]}>
                              {aiResult.lapidary_guidance.is_tumble_candidate ? "Good for Tumbling" : "Not Recommended for Tumbling"}
                           </Text>
                         </View>
                         <Text style={[styles.bodyText, {color: colors.textSecondary, marginLeft: 26}]}>
                           {aiResult.lapidary_guidance.tumble_reason}
                         </Text>
                      </View>
                    )}

                    {/* Region Fit (Conditional) */}
                    {aiResult.region_fit && (aiResult.region_fit.fit === 'medium' || aiResult.region_fit.fit === 'low') && (
                      <View style={styles.labSection}>
                        <View style={styles.rowCenter}>
                           <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
                           <Text style={[styles.sectionHeader, {color: colors.text}]}>Location Check: {aiResult.region_fit.fit.toUpperCase()}</Text>
                        </View>
                        <Text style={[styles.bodyText, {color: colors.textSecondary, marginLeft: 26}]}>
                           {aiResult.region_fit.note}
                        </Text>
                      </View>
                    )}

                    {/* Followup Output (Conditional) */}
                    {((aiResult.best_guess?.confidence || 0) < 0.9 || aiResult.best_guess?.category === 'unknown') &&
                      aiResult.followup_photos && aiResult.followup_photos.length > 0 && (
                      <View style={styles.labSection}>
                         <Text style={[styles.label, {color: colors.textSecondary}]}>Ranger Tip: Try these photos for better ID</Text>
                         <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4}}>
                            {aiResult.followup_photos.slice(0, 2).map((req: string, i: number) => (
                              <View key={i} style={[styles.chip, {borderColor: colors.border}]}>
                                <Text style={[styles.chipText, {color: colors.textSecondary}]}>{req}</Text>
                              </View>
                            ))}
                         </View>
                      </View>
                    )}

                    {/* Context Toggle (Learn More) */}
                    <TouchableOpacity
                       style={[styles.toggleRow, {borderTopColor: colors.border}]}
                       onPress={() => setShowContext(!showContext)}
                    >
                       <Text style={[styles.toggleText, {color: colors.text}]}>Geologic Context</Text>
                       <Ionicons name={showContext ? "chevron-up" : "chevron-down"} size={20} color={colors.textSecondary} />
                    </TouchableOpacity>

                    {showContext && aiResult.specimen_context && (
                      <View style={styles.toggleContent}>
                         <ContextItem label="Age" value={aiResult.specimen_context.age} colors={colors} />
                         <ContextItem
                            label="Geologic Hypothesis"
                            value={
                                aiResult.specimen_context.geology_hypothesis?.name
                                  ? `${aiResult.specimen_context.geology_hypothesis.name} (${aiResult.specimen_context.geology_hypothesis.confidence})`
                                  : 'Formation unknown'
                            }
                            colors={colors}
                         />
                         <ContextItem label="Historical Fact" value={aiResult.specimen_context.historical_fact} colors={colors} />
                      </View>
                    )}

                    {/* Technical (Advanced) Toggle */}
                    <TouchableOpacity
                       style={[styles.toggleRow, {borderTopColor: colors.border}]}
                       onPress={() => setShowAdvanced(!showAdvanced)}
                    >
                       <Text style={[styles.toggleText, {color: colors.text}]}>Technical Details</Text>
                       <Ionicons name={showAdvanced ? "chevron-up" : "chevron-down"} size={20} color={colors.textSecondary} />
                    </TouchableOpacity>

                    {showAdvanced && (
                      <View style={styles.toggleContent}>
                         {/* Alternatives */}
                         {aiResult.alternatives && aiResult.alternatives.length > 0 && (
                           <View style={{marginBottom: 12}}>
                             <Text style={[styles.label, {color: colors.textSecondary, marginBottom: 4}]}>Alternatives</Text>
                             {aiResult.alternatives.map((alt: { label: string, confidence: number }, i: number) => (
                               <View key={i} style={styles.altRow}>
                                 <Text style={{color: colors.text}}>{alt.label}</Text>
                                 <Text style={{color: colors.textSecondary}}>{Math.round(alt.confidence * 100)}%</Text>
                               </View>
                             ))}
                           </View>
                         )}

                         {/* Catalog Tags */}
                         {aiResult.catalog_tags && (
                           <View>
                             <Text style={[styles.label, {color: colors.textSecondary, marginBottom: 4}]}>Tags</Text>
                             <Text style={{color: colors.text, lineHeight: 20}}>
                               {Object.entries(aiResult.catalog_tags).map(([_k, v]) =>
                                 Array.isArray(v) ? v.join(', ') : v
                               ).join(' • ')}
                             </Text>
                           </View>
                         )}

                         <RawJsonInspector data={aiResult} />
                      </View>
                    )}

                  </>
                )}

                {/* Placeholder if no result but showing manual entry or loading */}
                {!aiResult && <View style={{height: 20}} />}

                {/* Notes Section */}
                <View style={{marginTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 16, gap: 8}}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>YOUR FIELD NOTES</Text>
                  <TextInput
                    value={note}
                    onChangeText={setNote}
                    style={{
                      borderWidth: 1,
                      borderRadius: 12,
                      padding: 12,
                      fontSize: 15,
                      minHeight: 80,
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.text
                    }}
                    placeholder="Add your story about this find..."
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    textAlignVertical="top"
                  />
                </View>


              </View>
            </>
          )}
          {/* Bottom padding for sticky footer */}
          <View style={{ height: 80 }} />
        </ScrollView>

        {/* Sticky Action Footer */}
        <View style={[styles.actionFooter, {
          backgroundColor: colors.background,
          borderTopColor: colors.border
        }]}>
          <TouchableOpacity
            style={[styles.iconButton, { borderColor: colors.border }]}
            onPress={handleShare}
          >
             <Ionicons name="share-outline" size={24} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconButton, { borderColor: '#ef4444' }]}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={24} color="#ef4444" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.accent }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.saveText}>Save</Text>
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
  heroContainer: {
    height: '42%',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  closeBtn: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 16,
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'Outfit_800ExtraBold',
  },
  loadingCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    alignItems: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
  },
  retryText: {
    fontSize: 15,
    fontWeight: '700',
  },
  infoDock: {
    padding: 20,
    borderRadius: 16,
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    fontFamily: 'Outfit_800ExtraBold',
    flex: 1,
  },
  metadata: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Scientist View Styles
  labCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
  },
  labHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  labTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  meterContainer: {
    gap: 6,
  },
  meterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  meterLabel: { fontSize: 13, fontWeight: '600' },
  meterValue: { fontSize: 13, fontWeight: '700' },
  meterTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  meterFill: { height: '100%', borderRadius: 3 },

  labSection: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 12,
  },
  labSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  evidenceItem: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  evidenceText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  altRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  altName: { fontSize: 14, fontWeight: '500' },
  altProb: { fontSize: 14 },

  monoText: {
    fontFamily: 'monospace',
    fontSize: 11,
  },

  notesSection: {
    gap: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
  },
  actionFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  deleteButton: {
    // Legacy mapping if needed, but handled by iconButton now
  },
  factGrid: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 12,
  },
  factChip: {
    width: '100%',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
    gap: 4,
  },
  factLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  factValue: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'left',
  },
  didYouKnowBox: {
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 6,
  },
  didYouKnowTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  didYouKnowText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  summaryBox: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
    marginBottom: 8
  },
  summaryText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    fontStyle: 'italic'
  },
  alertBox: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8
  },
  alertText: {
    fontSize: 14,
    fontWeight: '600'
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700'
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 20
  },
  label: {
     fontSize: 12,
     fontWeight: '700',
     textTransform: 'uppercase',
     letterSpacing: 0.5
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500'
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    marginTop: 4
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '700'
  },
  toggleContent: {
    paddingBottom: 12,
    paddingTop: 4,
    gap: 12
  }
});
