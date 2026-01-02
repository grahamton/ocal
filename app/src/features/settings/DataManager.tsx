
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useTheme } from '../../shared/ThemeContext';
import { exportService } from '../../shared/export/ExportService';
import { importService } from '../../shared/export/ImportService';
import { integrityService, IntegrityReport } from '../../shared/integrity/IntegrityService';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { GlassView } from '../../shared/components/GlassView';
import { StatusIcon } from '../../../components/StatusIcon';

export function DataManager() {
  const { colors, mode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<IntegrityReport | null>(null);

  const handleScan = async () => {
      try {
          setLoading(true);
          const r = await integrityService.checkIntegrity();
          setReport(r);
      } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          Alert.alert('Scan Failed', msg);
      } finally {
          setLoading(false);
      }
  };

  const handleCleanupOrphans = async () => {
      if (!report || report.orphanFiles.length === 0) return;

      Alert.alert(
          'Clean Up Orphans',
          `Permanently delete ${report.orphanFiles.length} files?`,
          [
              { text: 'Cancel', style: 'cancel' },
              {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                      setLoading(true);
                      const deleted = await integrityService.cleanupOrphans(report.orphanFiles);
                      Alert.alert('Cleanup Complete', `Deleted ${deleted} files.`);
                      handleScan(); // Rescan
                  }
              }
          ]
      );
  };

  const handleArchiveMissing = async () => {
      if (!report || report.missingPhotos.length === 0) return;

      Alert.alert(
        'Archive Missing',
        `Mark ${report.missingPhotos.length} items as 'archived'?`,
        [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Archive',
                onPress: async () => {
                    setLoading(true);
                    const archived = await integrityService.archiveMissingPhotos(report.missingPhotos);
                    Alert.alert('Archive Complete', `Archived ${archived} items.`);
                    handleScan();
                }
            }
        ]
      );
  };

  const handleExportJson = async () => {
    try {
      setLoading(true);
      const path = await exportService.exportBackupJson();
      await exportService.shareFile(path);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert('Export Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleExportAnalysis = async () => {
    try {
        setLoading(true);
        const path = await exportService.exportAnalysisJson();
        await exportService.shareFile(path);
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        Alert.alert('Export Failed', msg);
    } finally {
        setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      setLoading(true);
      const path = await exportService.exportFindsCsv();
      await exportService.shareFile(path);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert('Export Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    try {
        const result = await DocumentPicker.getDocumentAsync({
            type: 'application/json',
            copyToCacheDirectory: true
        });

        if (result.canceled) return;
        const asset = result.assets[0];

        setLoading(true);
        // Confirm
        Alert.alert(
            'Restore Backup',
            `Importing from ${asset.name}. This involves adding data to your existing collection. Continue?`,
            [
                { text: 'Cancel', style: 'cancel', onPress: () => setLoading(false) },
                {
                    text: 'Import',
                    onPress: async () => {
                        const res = await importService.restoreBackup(asset.uri);
                        setLoading(false);
                        if (res.success) {
                            Alert.alert('Success', `Restored ${res.count} finds.`);
                        } else {
                            Alert.alert('Import Failed', res.error);
                        }
                    }
                }
            ]
        );

    } catch (e) {
        setLoading(false);
        const msg = e instanceof Error ? e.message : String(e);
        Alert.alert('Error', msg);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
         <StatusIcon status="rough" category="fossil" size={48} theme={mode === 'high-contrast' ? 'beach' : 'journal'} />
         <Text style={[styles.title, { color: colors.text }]}>Data Management</Text>
         <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
             Your data is stored locally. Use these tools to back it up or move it.
         </Text>
      </View>

      <View style={styles.actions}>

          <TouchableOpacity onPress={handleExportAnalysis} disabled={loading}>
            <GlassView style={styles.card} intensity={20}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                    <Ionicons name="bug-outline" size={24} color="#8b5cf6" />
                </View>
                <View style={{flex: 1}}>
                    <Text style={[styles.actionTitle, { color: colors.text }]}>Export for Analysis</Text>
                    <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
                        Sanitized JSON for AI feedback (No heavy images).
                    </Text>
                </View>
            </GlassView>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleExportJson} disabled={loading}>
            <GlassView style={styles.card} intensity={20}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                    <Ionicons name="download-outline" size={24} color="#10b981" />
                </View>
                <View style={{flex: 1}}>
                    <Text style={[styles.actionTitle, { color: colors.text }]}>Backup Everything (JSON)</Text>
                    <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
                        Full restore file including sessions and edits.
                    </Text>
                </View>
            </GlassView>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleExportCsv} disabled={loading}>
            <GlassView style={styles.card} intensity={20}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                    <Ionicons name="grid-outline" size={24} color="#3b82f6" />
                </View>
                <View style={{flex: 1}}>
                    <Text style={[styles.actionTitle, { color: colors.text }]}>Export Spreadsheet (CSV)</Text>
                    <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
                        Table format for Excel or Google Sheets. Finds only.
                    </Text>
                </View>
            </GlassView>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleImport} disabled={loading}>
            <GlassView style={styles.card} intensity={20}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                    <Ionicons name="refresh-outline" size={24} color="#f59e0b" />
                </View>
                <View style={{flex: 1}}>
                    <Text style={[styles.actionTitle, { color: colors.text }]}>Restore from Backup</Text>
                    <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
                        Import a previously saved JSON backup.
                    </Text>
                </View>
            </GlassView>
          </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Data Health</Text>

      {!report ? (
          <TouchableOpacity onPress={handleScan} disabled={loading}>
            <GlassView style={styles.card} intensity={20}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(236, 72, 153, 0.1)' }]}>
                    <Ionicons name="pulse-outline" size={24} color="#ec4899" />
                </View>
                <View style={{flex: 1}}>
                    <Text style={[styles.actionTitle, { color: colors.text }]}>Run Health Check</Text>
                    <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
                        Scan for missing photos and orphan files.
                    </Text>
                </View>
            </GlassView>
          </TouchableOpacity>
      ) : (
          <View style={{ gap: 12 }}>
              <GlassView style={[styles.card, { flexDirection: 'column', alignItems: 'flex-start' }]} intensity={10}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                      <Text style={[styles.actionTitle, { color: colors.text }]}>Scan Results</Text>
                      <TouchableOpacity onPress={handleScan}>
                          <Ionicons name="refresh" size={20} color={colors.accent} />
                      </TouchableOpacity>
                  </View>

                  <View style={styles.statRow}>
                      <Text style={{ color: colors.textSecondary }}>Total Finds:</Text>
                      <Text style={{ color: colors.text, fontWeight: 'bold' }}>{report.totalFinds}</Text>
                  </View>
                  <View style={styles.statRow}>
                      <Text style={{ color: colors.textSecondary }}>Total Assets:</Text>
                      <Text style={{ color: colors.text, fontWeight: 'bold' }}>{report.totalFiles}</Text>
                  </View>

                  {/* Issues */}
                  <View style={[styles.issueBox, report.missingPhotos.length > 0 ? { borderColor: '#ef4444' } : { borderColor: 'transparent' }]}>
                       <Text style={{ color: report.missingPhotos.length > 0 ? '#ef4444' : colors.textSecondary }}>
                           Missing Photos: {report.missingPhotos.length}
                       </Text>
                       {report.missingPhotos.length > 0 && (
                           <View>
                                <Text style={{ fontSize: 10, color: colors.textSecondary, marginBottom: 4 }}>
                                    (Database records exist without files)
                                </Text>
                                <TouchableOpacity onPress={handleArchiveMissing} style={styles.smallBtn}>
                                   <Text style={styles.smallBtnText}>Archive Items</Text>
                               </TouchableOpacity>
                           </View>
                       )}
                  </View>

                  <View style={[styles.issueBox, report.orphanFiles.length > 0 ? { borderColor: '#f59e0b' } : { borderColor: 'transparent' }]}>
                       <Text style={{ color: report.orphanFiles.length > 0 ? '#f59e0b' : colors.textSecondary }}>
                           Orphan Files: {report.orphanFiles.length}
                       </Text>
                        {report.orphanFiles.length > 0 && (
                           <TouchableOpacity onPress={handleCleanupOrphans} style={styles.smallBtn}>
                               <Text style={styles.smallBtnText}>Clean Up</Text>
                           </TouchableOpacity>
                       )}
                  </View>
              </GlassView>
          </View>
      )}

      {loading && (
          <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.accent} />
          </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
      alignItems: 'center',
      marginBottom: 32,
      gap: 12,
  },
  title: {
      fontSize: 24,
      fontWeight: '800',
      fontFamily: 'Outfit_800ExtraBold',
  },
  subtitle: {
      textAlign: 'center',
      fontSize: 14,
      maxWidth: 300,
  },
  actions: {
      gap: 16,
  },
  card: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 16,
      gap: 16,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
      overflow: 'hidden',
  },
  iconBox: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
  },
  actionTitle: {
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 4,
  },
  actionDesc: {
      fontSize: 12,
  },
  loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.3)',
      zIndex: 100,
  },
  divider: {
      height: 1,
      backgroundColor: 'rgba(255,255,255,0.1)',
      marginVertical: 24,
  },
  sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 16,
      fontFamily: 'Outfit_700Bold',
  },
  statRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      marginBottom: 4,
  },
  issueBox: {
      marginTop: 8,
      padding: 8,
      borderRadius: 8,
      borderWidth: 1,
      width: '100%',
      backgroundColor: 'rgba(0,0,0,0.2)',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
  },
  smallBtn: {
      backgroundColor: '#f59e0b',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
  },
  smallBtnText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: '#000',
  }
});
