import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Sound from 'react-native-sound';

export interface ExamRemark {
  id: string;
  exam_test_id: string;
  teacher_id: string;
  content: string;
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

  // Function to play audio
  const playAudio = (audioUrl: string, remarkId: string) => {
    // Stop any currently playing audio
    if (sound) {
      sound.stop();
      sound.release();
      setSound(null);
    }
    
    setPlayingAudioId(remarkId);
    setIsLoadingAudio(true);
    
    // Load and play the new audio
    const newSound = new Sound(audioUrl, '', (error) => {
      setIsLoadingAudio(false);
      
      if (error) {
        console.error('Error loading sound:', error);
        setPlayingAudioId(null);
        return;
      }
      
      setSound(newSound);
      
      newSound.play((success) => {
        if (success) {
          console.log('Successfully played the sound');
        } else {
          console.log('Playback failed due to audio decoding errors');
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
              
              {remark.content.trim() !== '' && (
                <Text style={[styles.remarkContent, { color: colors.text }]}>
                  {remark.content}
                </Text>
              )}
              
              {remark.audioUrl && (
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