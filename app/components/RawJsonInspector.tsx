import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Clipboard, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/shared/ThemeContext';

interface Props {
  data: any;
  label?: string;
}

export function RawJsonInspector({ data, label = 'Raw Data Inspector' }: Props) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const jsonString = JSON.stringify(data, null, 2);

  const copyToClipboard = () => {
    Clipboard.setString(jsonString);
    Alert.alert('Copied', 'JSON data copied to clipboard');
  };

  return (
    <View style={[styles.container, { borderColor: colors.border, backgroundColor: colors.background }]}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.titleRow}>
          <Ionicons name="code-slash" size={20} color={colors.textSecondary} />
          <Text style={[styles.title, { color: colors.textSecondary }]}>{label}</Text>
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={[styles.content, { borderTopColor: colors.border }]}>
            <TouchableOpacity style={styles.copyButton} onPress={copyToClipboard}>
                <Text style={[styles.copyText, {color: colors.accent}]}>Copy JSON</Text>
            </TouchableOpacity>
          <Text style={[styles.code, { color: colors.text }]}>
            {jsonString}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  content: {
    padding: 12,
    borderTopWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 11,
  },
  copyButton: {
      alignSelf: 'flex-end',
      marginBottom: 8,
  },
  copyText: {
      fontSize: 12,
      fontWeight: '600',
  }
});
