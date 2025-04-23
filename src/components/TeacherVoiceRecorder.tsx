import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAudio } from '../hooks/useAudio';

export interface TeacherVoiceRecorderProps {
  onRecordingComplete: (
    audioFile: any, 
    title: string, 
    description: string, 
    transcript: string,
    categoryId: string,
    difficultyId: string,
    tips: string
  ) => void;
  onCancel: () => void;
  isUploading: boolean;
}

const TeacherVoiceRecorder: React.FC<TeacherVoiceRecorderProps> = ({
  onRecordingComplete,
  onCancel,
  isUploading
}) => {
  const theme = useTheme();
  const { colors } = theme;
  
  const [isRecording, setIsRecording] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [transcript, setTranscript] = useState('');
  const [categoryId, setCategoryId] = useState('2'); // Default category
  const [difficultyId, setDifficultyId] = useState('1'); // Default difficulty
  const [tips, setTips] = useState('');
  const [audioFile, setAudioFile] = useState<any>(null);
  
  // Use the useAudio hook for actual audio recording
  const { 
    startRecording: startAudioRecording, 
    stopRecording: stopAudioRecording,
    recordTime,
    recordingAvailable
  } = useAudio();

  // Start recording
  const startRecording = async () => {
    if (title.trim() === '') {
      Alert.alert('Error', 'Please enter a title for the voice clip');
      return;
    }

    if (transcript.trim() === '') {
      Alert.alert('Error', 'Please enter the text for the voice clip');
      return;
    }

    try {
      await startAudioRecording();
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
    }
  };

  // Stop recording
  const stopRecording = async () => {
    try {
      const audioUri = await stopAudioRecording();
      setIsRecording(false);
      
      if (audioUri) {
        // Create a proper audio file object to pass to the parent component
        const file = {
          name: `recording_${Date.now()}.mp3`,
          type: 'audio/mp3',
          uri: audioUri,
        };
        
        setAudioFile(file);
      } else {
        Alert.alert('Recording Error', 'Failed to save recording. Please try again.');
      }
    } catch (err) {
      console.error('Error stopping recording:', err);
      Alert.alert('Recording Error', 'Failed to process recording. Please try again.');
      setIsRecording(false);
    }
  };

  // Submit the voice clip
  const handleSubmit = () => {
    if (title.trim() === '') {
      Alert.alert('Error', 'Please enter a title for the voice clip');
      return;
    }

    if (transcript.trim() === '') {
      Alert.alert('Error', 'Please enter text for the voice clip');
      return;
    }

    if (!audioFile) {
      Alert.alert('Error', 'Please record your voice first');
      return;
    }

    onRecordingComplete(audioFile, title, description, transcript, categoryId, difficultyId, tips);
  };

  // Format recording time as MM:SS (using the time from useAudio hook)
  const formattedTime = recordTime || '00:00';

  return (
    <ScrollView>
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Record Voice Clip
          </Text>
          <TouchableOpacity onPress={onCancel}>
            <Icon name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Title *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter title"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Description</Text>
            <TextInput
              style={[styles.textarea, { backgroundColor: colors.background, color: colors.text }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter description"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Transcript *</Text>
            <TextInput
              style={[styles.textarea, { backgroundColor: colors.background, color: colors.text }]}
              value={transcript}
              onChangeText={setTranscript}
              placeholder="Enter the text that students will pronounce"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Tips</Text>
            <TextInput
              style={[styles.textarea, { backgroundColor: colors.background, color: colors.text }]}
              value={tips}
              onChangeText={setTips}
              placeholder="Enter tips for pronunciation (optional)"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.recordContainer}>
            {isRecording ? (
              <View style={styles.recordingContainer}>
                <View style={[styles.recordingIndicator, { backgroundColor: colors.error }]} />
                <Text style={[styles.recordingTime, { color: colors.text }]}>
                  {formattedTime}
                </Text>
                <TouchableOpacity
                  style={[styles.stopButton, { backgroundColor: colors.error }]}
                  onPress={stopRecording}
                >
                  <Icon name="stop" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.recordButton, { backgroundColor: recordingAvailable ? colors.success : colors.primary }]}
                onPress={startRecording}
                disabled={isUploading}
              >
                <Icon name="microphone" size={24} color="#FFFFFF" />
                <Text style={styles.recordButtonText}>
                  {audioFile ? 'Record Again' : 'Record Your Voice'}
                </Text>
              </TouchableOpacity>
            )}
            {audioFile && !isRecording && (
              <Text style={[styles.recordingComplete, { color: colors.success }]}>
                Recording complete
              </Text>
            )}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.border }]}
              onPress={onCancel}
              disabled={isUploading}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleSubmit}
              disabled={isUploading || !audioFile || title.trim() === '' || transcript.trim() === ''}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Save Voice Clip</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    margin: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  form: {
    gap: 16,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textarea: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  recordContainer: {
    gap: 8,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  recordButtonText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: 'bold',
  },
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  recordingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  recordingTime: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  stopButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingComplete: {
    fontSize: 14,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    fontWeight: 'bold',
  },
  submitButton: {
    flex: 2,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default TeacherVoiceRecorder; 