import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AudioRecorder from './AudioRecorder';
import { addTestScoreRemark } from '../services/api';

interface TestScoreRemarkFormProps {
  attemptId: string;
  visible: boolean;
  onClose: () => void;
  onRemarkAdded: () => void;
}

const TestScoreRemarkForm: React.FC<TestScoreRemarkFormProps> = ({
  attemptId,
  visible,
  onClose,
  onRemarkAdded,
}) => {
  const theme = useTheme();
  const { colors } = theme;
  
  const [remark, setRemark] = useState('');
  const [audioFile, setAudioFile] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle form submission
  const handleSubmit = async () => {
    // Validate form input
    if (!remark.trim()) {
      Alert.alert('Error', 'Please enter a remark');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Create form data for API request
      const formData = new FormData();
      formData.append('remark', remark);
      
      if (audioFile) {
        formData.append('audio_file', {
          uri: audioFile.uri,
          type: 'audio/m4a',
          name: 'audio_remark.m4a',
        });
      }
      
      // Submit the form
      await addTestScoreRemark(attemptId, formData);
      
      // Reset form and close modal
      setRemark('');
      setAudioFile(null);
      onRemarkAdded();
      onClose();
      
    } catch (err: any) {
      console.error('Error submitting remark:', err);
      setError(err.message || 'Failed to submit remark');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle recording complete
  const handleRecordingComplete = (file: any) => {
    setAudioFile(file);
    setIsRecording(false);
  };

  // Clear audio file
  const clearAudioFile = () => {
    setAudioFile(null);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Add Remark</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: colors.error + '15' }]}>
              <Icon name="alert-circle-outline" size={20} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          )}
          
          <View style={styles.form}>
            <Text style={[styles.label, { color: colors.text }]}>Remark</Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Enter your feedback for the student..."
              placeholderTextColor={colors.textSecondary}
              value={remark}
              onChangeText={setRemark}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.border }]}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Submit</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    borderRadius: 8,
    padding: 16,
    maxHeight: '80%',
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
  closeButton: {
    padding: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    marginLeft: 8,
    flex: 1,
  },
  form: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
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
    fontWeight: '500',
    marginLeft: 8,
  },
  audioFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CCCCCC',
  },
  audioFileText: {
    flex: 1,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 12,
  },
  cancelButtonText: {
    fontWeight: '500',
  },
  submitButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default TestScoreRemarkForm; 