import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import {useTheme} from '@/shared/ThemeContext';
import {exportService} from '@/shared/export/ExportService';
import {importService} from '@/shared/export/ImportService';

const errText = (e: unknown) => (e instanceof Error ? e.message : String(e));

export function DataManager() {
  const {colors} = useTheme();
  const [loading, setLoading] = useState(false);

  const runExport = async (make: () => Promise<string>) => {
    try {
      setLoading(true);
      await exportService.shareFile(await make());
    } catch (e) {
      Alert.alert('That did not work', errText(e));
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      Alert.alert(
        'Get a backup back',
        `This adds the rocks from ${asset.name} to the ones you already have. Go ahead?`,
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Yes, add them',
            onPress: async () => {
              setLoading(true);
              const res = await importService.restoreBackup(asset.uri);
              setLoading(false);
              if (res.success) Alert.alert('Done', `Added ${res.count} rocks.`);
              else Alert.alert('That did not work', res.error);
            },
          },
        ],
      );
    } catch (e) {
      setLoading(false);
      Alert.alert('That did not work', errText(e));
    }
  };

  const primary = {backgroundColor: colors.accent, borderColor: colors.accent};
  const plain = {backgroundColor: colors.card, borderColor: colors.text};

  return (
    <View style={styles.wrap}>
      <Text style={[styles.heading, {color: colors.text}]}>Keep my rocks safe</Text>
      <Text style={[styles.desc, {color: colors.textSecondary}]}>
        Your rocks live on this phone. Save a copy now and then.
      </Text>

      <TouchableOpacity
        style={[styles.btn, primary]}
        disabled={loading}
        onPress={() => runExport(() => exportService.exportBackupJson())}
        accessibilityRole="button">
        <Text style={[styles.btnText, {color: '#fff'}]}>Save a backup</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.btn, plain]}
        disabled={loading}
        onPress={handleImport}
        accessibilityRole="button">
        <Text style={[styles.btnText, {color: colors.text}]}>Get a backup back</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.btn, plain]}
        disabled={loading}
        onPress={() => runExport(() => exportService.exportFindsCsv())}
        accessibilityRole="button">
        <Text style={[styles.btnText, {color: colors.text}]}>Make a spreadsheet</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color={colors.accent} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {gap: 14, marginTop: 14},
  heading: {fontSize: 24, fontWeight: '800', fontFamily: 'Outfit_800ExtraBold'},
  desc: {fontSize: 18, lineHeight: 26},
  btn: {
    minHeight: 60,
    borderRadius: 30,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {fontSize: 20, fontWeight: '800'},
});
