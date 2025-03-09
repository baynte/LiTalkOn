import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAudio } from '../hooks/useAudio';

export interface AudioRecorderProps {
  isRecording: boolean;
  setIsRecording: React.Dispatch<React.SetStateAction<boolean>>;
  onRecordingComplete: (audioFile: any) => void;
  isAnalyzing: boolean;
  testId?: string;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({
  isRecording,
  setIsRecording,
  onRecordingComplete,
  isAnalyzing,
}) => {
  const theme = useTheme();
  const { colors } = theme;
  
  // Use the useAudio hook for actual audio recording
  const { 
    startRecording: startAudioRecording, 
    stopRecording: stopAudioRecording,
    recordTime,
  } = useAudio();

  // Start recording
  const startRecording = async () => {
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
        const audioFile = {
          name: `recording_${Date.now()}.mp3`,
          type: 'audio/mp3',
          uri: audioUri,
        };
        
        // Pass the audio file to the parent component
        onRecordingComplete(audioFile);
      } else {
        Alert.alert('Recording Error', 'Failed to save recording. Please try again.');
      }
    } catch (err) {
      console.error('Error stopping recording:', err);
      Alert.alert('Recording Error', 'Failed to process recording. Please try again.');
      setIsRecording(false);
    }
  };

  // Format recording time as MM:SS (using the time from useAudio hook)
  const formattedTime = recordTime || '00:00';

  return (
    <View style={styles.container}>
      {isAnalyzing ? (
        <View style={[styles.analyzingContainer, { backgroundColor: colors.primaryLight }]}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.analyzingText, { color: colors.primary }]}>
            Analyzing your recording...
          </Text>
        </View>
      ) : isRecording ? (
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
          style={[styles.recordButton, { backgroundColor: colors.primary }]}
          onPress={startRecording}
        >
          <Icon name="microphone" size={24} color="#FFFFFF" />
          <Text style={[styles.recordButtonText, { color: '#FFFFFF' }]}>
            Record Your Voice
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  recordButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  analyzingText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default AudioRecorder; 