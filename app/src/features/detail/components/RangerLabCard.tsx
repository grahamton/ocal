import React from 'react';
import {ActivityIndicator, Text, TouchableOpacity, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {StatusIcon} from '@/shared/components/StatusIcon';
import {getCategoryFromTags} from '@/shared/CategoryMapper';
import {styles} from '../FindDetailModal.styles';

// Subcomponents
import {MineralDetails} from './MineralDetails';
import {PetrologyDetails} from './PetrologyDetails';
import {PaleontologyDetails} from './PaleontologyDetails';
import {ArtifactDetails} from './ArtifactDetails';
import {LapidaryGuidance} from './LapidaryGuidance';
import {GeologicContext} from './GeologicContext';
import {TechnicalDetails} from './TechnicalDetails';
import {RegionFitDetails} from './RegionFitDetails';
import {RangerTipsDetails} from './RangerTipsDetails';

import {RockIdResult} from '@/ai/rockIdSchema';
import {ThemeColors} from '@/shared/ThemeContext';

type Props = {
  aiResult: RockIdResult | null;
  aiLoading: boolean;
  aiError: string | null;
  runIdentify: () => void;
  colors: ThemeColors;
  mode: string;
};

export function RangerLabCard({
  aiResult,
  aiLoading,
  aiError,
  runIdentify,
  colors,
  mode,
}: Props) {
  if (!aiResult && !aiLoading && !aiError) {
    return (
      <TouchableOpacity
        style={[styles.analyzeButton, {backgroundColor: colors.accent}]}
        onPress={runIdentify}>
        <Ionicons name="sparkles" size={24} color="#fff" />
        <Text style={styles.analyzeButtonText}>Ask Ranger Al</Text>
      </TouchableOpacity>
    );
  }

  return (
    <>
      {aiLoading && (
        <View style={[styles.loadingCard, {backgroundColor: colors.card}]}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, {color: colors.text}]}>
            Analyzing your find...
          </Text>
        </View>
      )}

      {aiError && (
        <View
          style={[
            styles.errorCard,
            {backgroundColor: '#fef2f2', borderColor: '#ef4444'},
          ]}>
          <Ionicons name="alert-circle" size={24} color="#ef4444" />
          <Text style={styles.errorText}>{aiError}</Text>
          <TouchableOpacity onPress={runIdentify}>
            <Text style={[styles.retryText, {color: colors.accent}]}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {aiResult && (
        <View
          style={[
            styles.labCard,
            {backgroundColor: colors.card, borderColor: colors.border},
          ]}>
          <View style={styles.labHeader}>
            <StatusIcon
              status={
                aiResult ? 'polished' : aiLoading ? 'polishing' : 'rough'
              }
              category={getCategoryFromTags(
                [aiResult?.best_guess?.category || ''],
                aiResult?.best_guess?.label,
              )}
              confidence={aiResult?.best_guess?.confidence || 0}
              size={40}
              theme={mode === 'high-contrast' ? 'beach' : 'journal'}
            />
            <View style={{justifyContent: 'center', flex: 1}}>
              <Text style={[styles.labTitle, {color: colors.text}]}>
                {aiResult
                  ? 'ANALYSIS COMPLETE'
                  : aiLoading
                    ? 'ANALYZING...'
                    : 'READY TO SCAN'}
              </Text>
            </View>
          </View>

          {aiResult.ranger_summary && (
            <View style={styles.summaryBox}>
              <Ionicons
                name="chatbox-ellipses-outline"
                size={20}
                color={colors.accent}
                style={{marginTop: 2}}
              />
              <Text style={[styles.summaryText, {color: colors.text}]}>
                {aiResult.ranger_summary}
              </Text>
            </View>
          )}

          {aiResult.category_details?.mineral && (
            <MineralDetails mineral={aiResult.category_details.mineral} />
          )}
          {aiResult.category_details?.rock && (
            <PetrologyDetails rock={aiResult.category_details.rock} />
          )}
          {aiResult.category_details?.fossil && (
            <PaleontologyDetails fossil={aiResult.category_details.fossil} />
          )}
          {aiResult.category_details?.artifact && (
            <ArtifactDetails artifact={aiResult.category_details.artifact} />
          )}

          {((aiResult.red_flags && aiResult.red_flags.length > 0) ||
            (aiResult.caution && aiResult.caution.length > 0)) && (
            <View
              style={[
                styles.alertBox,
                {backgroundColor: '#fef2f2', borderColor: '#ef4444'},
              ]}>
              <Ionicons name="warning" size={20} color="#ef4444" />
              <View style={{flex: 1}}>
                {[
                  ...(aiResult.red_flags || []),
                  ...(aiResult.caution || []),
                ].map((flag: string, i: number) => (
                  <Text key={i} style={[styles.alertText, {color: '#b91c1c'}]}>
                    • {flag}
                  </Text>
                ))}
              </View>
            </View>
          )}

          {aiResult.lapidary_guidance && (
            <LapidaryGuidance lapidary={aiResult.lapidary_guidance} />
          )}

          {aiResult.region_fit && (
            <RegionFitDetails
              regionFit={aiResult.region_fit}
              colors={colors}
            />
          )}

          <RangerTipsDetails
            bestGuess={aiResult.best_guess}
            followupPhotos={aiResult.followup_photos}
            colors={colors}
          />

          {aiResult.specimen_context && (
            <GeologicContext specimenContext={aiResult.specimen_context} />
          )}
          <TechnicalDetails aiResult={aiResult} />
        </View>
      )}
    </>
  );
}
