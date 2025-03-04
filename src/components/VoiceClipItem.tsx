import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { VoiceClip } from '../types';
import { useTheme } from '../theme/ThemeProvider';

interface VoiceClipItemProps {
  item: VoiceClip;
  onPress: (item: VoiceClip) => void;
}

const VoiceClipItem: React.FC<VoiceClipItemProps> = ({ item, onPress }) => {
  const theme = useTheme();
  const { colors, shadows, borderRadius } = theme;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        shadows.small,
        {
          backgroundColor: colors.surface,
          borderRadius: borderRadius.md,
        },
      ]}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={[styles.date, { color: colors.textLight }]}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginBottom: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    marginBottom: 8,
  },
  date: {
    fontSize: 12,
    alignSelf: 'flex-end',
  },
});

export default VoiceClipItem; 