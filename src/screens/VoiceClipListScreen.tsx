import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { VoiceClip } from '../types';
import VoiceClipItem from '../components/VoiceClipItem';
import VoiceAnalysisModal from '../components/VoiceAnalysisModal';
import { fetchVoiceClips } from '../services/api';
import { useTheme } from '../theme/ThemeProvider';

const VoiceClipListScreen: React.FC = () => {
  const theme = useTheme();
  const { colors } = theme;
  
  const [voiceClips, setVoiceClips] = useState<VoiceClip[]>([]);
  const [selectedVoiceClip, setSelectedVoiceClip] = useState<VoiceClip | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadVoiceClips = async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    
    setError(null);

    try {
      const clips = await fetchVoiceClips();
      setVoiceClips(clips);
    } catch (err) {
      console.error('Error fetching voice clips:', err);
      setError('Failed to load voice clips. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadVoiceClips();
  }, []);

  const handleVoiceClipPress = (clip: VoiceClip) => {
    setSelectedVoiceClip(clip);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  const renderEmptyList = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Loading voice clips...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No voice clips available</Text>
      </View>
    );
  };

  const renderVoiceClipItem = ({ item }: { item: VoiceClip }) => {
    return (
      <TouchableOpacity
        onPress={() => handleVoiceClipPress(item)}
      >
        <View style={styles.clipInfo}>
          <Text style={[styles.clipTitle, { color: colors.text }]}>{item.name}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}>
        <Text style={[styles.title, { color: colors.text }]}>Voice Analysis</Text>
      </View>
      
      <FlatList
        data={voiceClips}
        renderItem={renderVoiceClipItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadVoiceClips(true)}
            colors={[colors.primary]}
          />
        }
      />
      
      <VoiceAnalysisModal
        visible={isModalVisible}
        voiceClip={selectedVoiceClip}
        onClose={handleCloseModal}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 32,
  },
  clipInfo: {
    padding: 16,
  },
  clipTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
});

export default VoiceClipListScreen; 