import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Sound from 'react-native-sound';
import { API_BASE_URL } from '../services/api';

export interface ExamRemark {
  id: string;
  exam_test_id: string;
  teacher_id: string;
  remark: string;
  audioUrl: string | null;
  created_at: string;
}

interface ExamRemarkListProps {
  remarks: ExamRemark[];
  isLoading: boolean;
  error: string | null;
  onAddRemark?: () => void;
  isTeacher: boolean;
}

const ExamRemarkList: React.FC<ExamRemarkListProps> = ({
  remarks,
  isLoading,
  error,
  onAddRemark,
  isTeacher,
}) => {
  const theme = useTheme();
  const { colors } = theme;
  
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [sound, setSound] = useState<Sound | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  // Log received remarks for debugging
  useEffect(() => {
    if (remarks && remarks.length > 0) {
      console.log(`Received ${remarks.length} remarks`);
      remarks.forEach(remark => {
        console.log(`Remark ID: ${remark.id}, Has audio: ${Boolean(remark.audioUrl)}`, remark);
        if (remark.audioUrl) {
          console.log(`Audio URL: ${remark.audioUrl}`);
        }
      });
    }
  }, [remarks]);

  // Function to play audio
  const playAudio = (audioUrl: string, remarkId: string) => {
    // Stop any currently playing audio
    if (sound) {
      sound.stop();
      sound.release();
      setSound(null);
    }
    
    if (!audioUrl) {
      Alert.alert('Error', 'Audio URL is missing or invalid');
      return;
    }
    
    setPlayingAudioId(remarkId);
    setIsLoadingAudio(true);
    
    // Format the audio URL correctly - ensure it's a complete URL
    let fullAudioUrl = audioUrl;
    
    // If it's a relative URL, prepend the API base URL
    if (audioUrl && !audioUrl.startsWith('http') && !audioUrl.startsWith('file://')) {
      // Remove leading slash if present to avoid double slashes
      const cleanPath = audioUrl.startsWith('/') ? audioUrl.substring(1) : audioUrl;
      fullAudioUrl = `${API_BASE_URL}/${cleanPath}`;
    }
    
    console.log('Playing audio from URL:', fullAudioUrl);
    
    // Load and play the new audio
    const newSound = new Sound(fullAudioUrl, '', (error) => {
      setIsLoadingAudio(false);
      
      if (error) {
        console.error('Error loading sound:', error);
        setPlayingAudioId(null);
        Alert.alert('Playback Error', 'Could not play the audio. Please try again later.');
        return;
      }
      
      setSound(newSound);
      
      newSound.play((success) => {
        if (success) {
          console.log('Successfully played the sound');
        } else {
          console.log('Playback failed due to audio decoding errors');
          Alert.alert('Playback Error', 'Failed to play the audio due to decoding errors.');
        }
        setPlayingAudioId(null);
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
      setPlayingAudioId(null);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Check if an audio URL is valid
  const isValidAudioUrl = (url: string | null): boolean => {
    if (!url) return false;
    
    // Check if it's an empty string or just whitespace
    if (url.trim() === '') return false;
    
    // If it passes these checks, consider it valid
    return true;
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Icon name="alert-circle-outline" size={50} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Exam Remarks</Text>
        {isTeacher && onAddRemark && (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={onAddRemark}
          >
            <Icon name="plus" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Remark</Text>
          </TouchableOpacity>
        )}
      </View>

      {remarks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="comment-text-outline" size={50} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {isTeacher 
              ? 'No remarks added yet. Add a remark to provide feedback to students.'
              : 'No remarks available for this exam.'
            }
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.remarksList}>
          {remarks.map((remark) => (
            <View
              key={remark.id}
              style={[styles.remarkItem, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={styles.remarkHeader}>
                <Text style={[styles.remarkDate, { color: colors.textSecondary }]}>
                  {formatDate(remark.created_at)}
                </Text>
              </View>
              {remark.remark && remark.remark.trim() !== '' && (
                <Text style={[styles.remarkContent, { color: colors.text }]}>
                  {remark.remark}
                </Text>
              )}
              
              {isValidAudioUrl(remark.audioUrl) && (
                <View style={styles.audioContainer}>
                  {playingAudioId === remark.id ? (
                    <TouchableOpacity
                      style={[styles.audioButton, { backgroundColor: colors.error }]}
                      onPress={stopAudio}
                      disabled={isLoadingAudio}
                    >
                      {isLoadingAudio ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Icon name="stop" size={20} color="#FFFFFF" />
                          <Text style={styles.audioButtonText}>Stop</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.audioButton, { backgroundColor: colors.primary }]}
                      onPress={() => playAudio(remark.audioUrl as string, remark.id)}
                    >
                      <Icon name="play" size={20} color="#FFFFFF" />
                      <Text style={styles.audioButtonText}>Play Voice Comment</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
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
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    maxWidth: '80%',
  },
  remarksList: {
    flex: 1,
  },
  remarkItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
  },
  remarkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  remarkDate: {
    fontSize: 12,
  },
  remarkContent: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  audioContainer: {
    marginTop: 8,
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
  },
  audioButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default ExamRemarkList; 