import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { getTeacherVoiceClips, uploadTeacherVoiceClip } from '../../services/api';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import TeacherVoiceRecorder from '../../components/TeacherVoiceRecorder';
import Sound from 'react-native-sound';

interface VoiceClip {
  id: string;
  title: string;
  description: string;
  transcript: string;
  audio_url: string;
  category_id: string;
  difficulty_id: string;
  created_at: string;
}

interface TeacherVoiceClipsScreenProps {
  navigation: any;
}

const TeacherVoiceClipsScreen: React.FC<TeacherVoiceClipsScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const { colors } = theme;
  
  const [voiceClips, setVoiceClips] = useState<VoiceClip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRecorder, setShowRecorder] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [playingClipId, setPlayingClipId] = useState<string | null>(null);
  const [sound, setSound] = useState<Sound | null>(null);

  // Load voice clips
  const loadVoiceClips = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getTeacherVoiceClips();
      console.log('Voice clips loaded:', data);
      if (data && data.teacherVoiceClips) {
        setVoiceClips(data.teacherVoiceClips);
      } else {
        setVoiceClips([]);
      }
    } catch (error: any) {
      console.error('Error loading voice clips:', error);
      setError(error.message || 'Failed to load voice clips');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVoiceClips();

    // Cleanup sound on unmount
    return () => {
      if (sound) {
        sound.stop();
        sound.release();
      }
    };
  }, []);

  // Handle recording complete
  const handleRecordingComplete = async (
    audioFile: any,
    title: string,
    description: string,
    transcript: string,
    categoryId: string,
    difficultyId: string,
    tips: string
  ) => {
    setIsUploading(true);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('text', transcript);
      formData.append('category_id', categoryId);
      formData.append('difficulty_id', difficultyId);
      formData.append('tips', tips);
      formData.append('audioFile', audioFile);
      
      // Upload the voice clip
      const response = await uploadTeacherVoiceClip(formData);
      console.log('Upload response:', response);
      
      // Close recorder modal
      setShowRecorder(false);
      
      // Reload voice clips
      await loadVoiceClips();
      
      // Show success message
      Alert.alert('Success', 'Voice clip uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading voice clip:', error);
      Alert.alert('Error', error.message || 'Failed to upload voice clip');
    } finally {
      setIsUploading(false);
    }
  };

  // Play audio
  const playAudio = (audioUrl: string, clipId: string) => {
    // Stop any currently playing audio
    if (sound) {
      sound.stop();
      sound.release();
      setSound(null);
    }
    
    setPlayingClipId(clipId);
    
    // Load and play the new audio
    const newSound = new Sound(audioUrl, '', (error) => {
      if (error) {
        console.error('Error loading sound:', error);
        setPlayingClipId(null);
        return;
      }
      
      setSound(newSound);
      
      newSound.play((success) => {
        if (success) {
          console.log('Successfully played the sound');
        } else {
          console.log('Playback failed due to audio decoding errors');
        }
        setPlayingClipId(null);
        newSound.release();
        setSound(null);
      });
    });
  };

  // Stop audio playback
  const stopAudio = () => {
    if (sound) {
      sound.stop();
      sound.release();
      setSound(null);
      setPlayingClipId(null);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Render voice clip item
  const renderVoiceClipItem = ({ item }: { item: VoiceClip }) => (
    <View style={[styles.clipItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.clipHeader}>
        <Text style={[styles.clipTitle, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.clipDate, { color: colors.textSecondary }]}>
          {formatDate(item.created_at)}
        </Text>
      </View>
      
      {item.description && (
        <Text style={[styles.clipDescription, { color: colors.textSecondary }]}>
          {item.description}
        </Text>
      )}
      
      {item.transcript && (
        <View style={styles.transcriptContainer}>
          <Text style={[styles.transcriptLabel, { color: colors.text }]}>Transcript:</Text>
          <Text style={[styles.transcript, { color: colors.text }]}>{item.transcript}</Text>
        </View>
      )}
      
      <View style={styles.clipFooter}>
        <Text style={[styles.clipType, { color: colors.textSecondary }]}>
          Category ID: {item.category_id}, Difficulty ID: {item.difficulty_id}
        </Text>
        
        {playingClipId === item.id ? (
          <TouchableOpacity
            style={[styles.playButton, { backgroundColor: colors.error }]}
            onPress={stopAudio}
          >
            <Icon name="stop" size={20} color="#FFFFFF" />
            <Text style={styles.playButtonText}>Stop</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.playButton, { backgroundColor: colors.primary }]}
            onPress={() => playAudio(item.audio_url, item.id)}
          >
            <Icon name="play" size={20} color="#FFFFFF" />
            <Text style={styles.playButtonText}>Play</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // Screen content
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>My Voice Clips</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowRecorder(true)}
        >
          <Icon name="plus" size={24} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add Voice Clip</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Icon name="alert-circle-outline" size={50} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={loadVoiceClips}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : voiceClips.length === 0 ? (
        <View style={styles.centerContainer}>
          <Icon name="microphone-off" size={50} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            You don't have any voice clips yet. Add a voice clip to get started.
          </Text>
        </View>
      ) : (
        <FlatList
          data={voiceClips}
          renderItem={renderVoiceClipItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Voice Recorder Modal */}
      <Modal
        visible={showRecorder}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRecorder(false)}
      >
        <View style={styles.modalOverlay}>
          <TeacherVoiceRecorder
            onRecordingComplete={handleRecordingComplete}
            onCancel={() => setShowRecorder(false)}
            isUploading={isUploading}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    maxWidth: '80%',
  },
  listContent: {
    padding: 4,
  },
  clipItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
  },
  clipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  clipDate: {
    fontSize: 12,
  },
  clipDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  transcriptContainer: {
    marginBottom: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    padding: 8,
    borderRadius: 6,
  },
  transcriptLabel: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  transcript: {
    fontSize: 14,
  },
  clipFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clipType: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});

export default TeacherVoiceClipsScreen; 