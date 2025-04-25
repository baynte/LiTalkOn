import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAudio } from '../hooks/useAudio';

export interface ExamRemarkRecorderProps {
  onSaveRemark: (content: string, audioFile: any) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const ExamRemarkRecorder: React.FC<ExamRemarkRecorderProps> = ({
  onSaveRemark,
  onCancel,
  isSubmitting,
}) => {
  const theme = useTheme();
  const { colors } = theme;
  
  const [content, setContent] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioFile, setAudioFile] = useState<any>(null);
  
  const { 
    startRecording: startAudioRecording, 
    stopRecording: stopAudioRecording,
    recordTime,
    recordingAvailable,
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
        // Ensure all required properties for FormData compatibility
        const file = {
          name: `remark_${Date.now()}.mp3`,
          type: 'audio/mp3',
          uri: Platform.OS === 'android' && !audioUri.startsWith('file://') 
            ? `file://${audioUri}` // Ensure proper URI format for Android
            : audioUri,
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

  // Save remark
  const handleSaveRemark = () => {
    if (!content.trim() && !audioFile) {
      Alert.alert('Error', 'Please enter a comment or record a voice remark');
      return;
    }
    
    onSaveRemark(content, audioFile);
  };

  // Format recording time
  const formattedTime = recordTime || '00:00';

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Add Exam Remark</Text>
        <TouchableOpacity onPress={onCancel} disabled={isSubmitting}>
          <Icon name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Written Comment</Text>
          <TextInput
            style={[styles.textarea, { backgroundColor: colors.background, color: colors.text }]}
            value={content}
            onChangeText={setContent}
            placeholder="Enter your comment for students"
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.textSecondary }]}>OR</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        <View style={styles.recordContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Voice Comment</Text>
          
          {isRecording ? (
            <View style={styles.recordingContainer}>
              <View style={[styles.recordingIndicator, { backgroundColor: colors.error }]} />
              <Text style={[styles.recordingTime, { color: colors.text }]}>{formattedTime}</Text>
              <TouchableOpacity
                style={[styles.stopButton, { backgroundColor: colors.error }]}
                onPress={stopRecording}
              >
                <Icon name="stop" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.recordButton, { backgroundColor: audioFile ? colors.success : colors.primary }]}
              onPress={startRecording}
              disabled={isSubmitting}
            >
              <Icon name="microphone" size={24} color="#FFFFFF" />
              <Text style={styles.recordButtonText}>
                {audioFile ? 'Record Again' : 'Record Voice Comment'}
              </Text>
            </TouchableOpacity>
          )}
          
          {audioFile && !isRecording && (
            <Text style={[styles.recordingComplete, { color: colors.success }]}>
              Voice comment recorded successfully
            </Text>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.border }]}
            onPress={onCancel}
            disabled={isSubmitting}
          >
            <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
            onPress={handleSaveRemark}
            disabled={isSubmitting || (!content.trim() && !audioFile)}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Save Remark</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
    marginBottom: 8,
  },
  textarea: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontWeight: 'bold',
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

export default ExamRemarkRecorder; 