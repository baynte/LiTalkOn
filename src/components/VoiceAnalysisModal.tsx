import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { VoiceClip, VoiceAnalysisResult } from '../types';
import AudioPlayer from './AudioPlayer';
import AudioRecorder from './AudioRecorder';
import { analyzeVoiceComparison } from '../services/api';
import { createFileObject } from '../utils/audioUtils';
import { useTheme } from '../theme/ThemeProvider';

interface VoiceAnalysisModalProps {
  visible: boolean;
  voiceClip: VoiceClip | null;
  onClose: () => void;
}

const VoiceAnalysisModal: React.FC<VoiceAnalysisModalProps> = ({
  visible,
  voiceClip,
  onClose,
}) => {
  const theme = useTheme();
  const { colors, borderRadius, shadows } = theme;

  const [userRecordingUri, setUserRecordingUri] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<VoiceAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEmulator, setIsEmulator] = useState<boolean | null>(null);
  const [analysisRequested, setAnalysisRequested] = useState(false);

  // Check if running in an emulator
  useEffect(() => {
    const checkEmulator = async () => {
      try {
        // Simple check based on device model or brand
        // This is a basic check and might not be 100% accurate
        if (Platform.OS === 'android') {
          // Access Android-specific constants with type assertion
          const constants = Platform.constants as any;
          const isLikelyEmulator = 
            constants?.Model?.includes('sdk') || 
            constants?.Model?.includes('Simulator') || 
            constants?.Model?.includes('Emulator') ||
            constants?.Manufacturer?.includes('Genymotion') ||
            constants?.Brand?.toLowerCase() === 'google' ||
            constants?.Model?.toLowerCase() === 'android sdk built for x86';
          
          setIsEmulator(isLikelyEmulator);
          
          if (isLikelyEmulator) {
            console.log('Running in an emulator - recording may not work properly');
          }
        } else if (Platform.OS === 'ios') {
          // Access iOS-specific constants with type assertion
          const constants = Platform.constants as any;
          const isSimulator = constants?.interfaceIdiom?.includes('Simulator');
          setIsEmulator(isSimulator);
          
          if (isSimulator) {
            console.log('Running in iOS Simulator - recording may not work properly');
          }
        }
      } catch (err) {
        console.error('Error detecting emulator:', err);
      }
    };
    
    checkEmulator();
  }, []);

  // Reset analysis state when modal becomes visible
  useEffect(() => {
    if (visible) {
      // Only reset if we're opening the modal
      setAnalysisRequested(false);
    }
  }, [visible]);

  const handleRecordingComplete = (audioUri: string) => {
    setUserRecordingUri(audioUri);
    // Reset analysis state when a new recording is made
    setAnalysisResult(null);
    setError(null);
    setAnalysisRequested(false);
    
    console.log('Recording completed, URI:', audioUri);
    
    // Only attempt to check file size if it's a valid URI
    if (audioUri && (audioUri.startsWith('file://') || audioUri.startsWith('content://'))) {
      // For local files, we'll rely on the fact that the file was created
      // rather than trying to fetch it, which can cause network errors
      console.log('Recording saved to local file:', audioUri);
      
      // We'll check the file size when analyzing, not here
    } else if (audioUri && (audioUri.startsWith('http://') || audioUri.startsWith('https://'))) {
      // Only use fetch for remote URLs, not local files
      fetch(audioUri, { method: 'HEAD' })
        .then(response => {
          const contentLength = response.headers.get('Content-Length');
          const fileSize = contentLength ? parseInt(contentLength, 10) : 0;
          console.log(`Remote recording file size: ${fileSize} bytes`);
          
          if (fileSize <= 100) {
            console.warn('Warning: Recording file appears to be empty or very small');
          }
        })
        .catch(err => {
          console.error('Error checking remote recording file:', err);
        });
    } else {
      console.warn('Recording URI is in an unexpected format:', audioUri);
    }
  };

  const handleAnalyzeVoice = async () => {
    if (!voiceClip || !userRecordingUri) return;

    // Set flag to indicate user has explicitly requested analysis
    setAnalysisRequested(true);
    setIsAnalyzing(true);
    setError(null);

    console.log('User explicitly requested voice analysis');

    try {
      // Log the URI we're about to analyze
      console.log('Analyzing voice recording from URI:', userRecordingUri);
      
      // Check if this is a local file URI
      const isLocalFile = userRecordingUri.startsWith('file://') || 
                          userRecordingUri.startsWith('content://');
      
      // Create a file object from the URI
      const audioFile = createFileObject(
        userRecordingUri,
        'audio/mp4',
        isLocalFile ? 'user_recording.mp4' : 'remote_recording.mp4'
      );
      
      console.log('Created file object for analysis:', {
        uri: audioFile.uri,
        type: audioFile.type,
        name: audioFile.name
      });

      const result = await analyzeVoiceComparison(voiceClip.id, audioFile);
      setAnalysisResult(result);
    } catch (err: any) {
      console.error('Error analyzing voice:', err);
      setError(`Failed to analyze voice: ${err?.message || 'Unknown error'}. Please try again.`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderAnalysisResult = () => {
    // Only render analysis result if user has explicitly requested analysis
    if (!analysisResult || !analysisRequested) return null;

    return (
      <View style={styles.analysisContainer}>
        <Text style={[styles.analysisTitle, { color: colors.text }]}>Analysis Result</Text>
        
        <View style={[styles.scoreContainer, { backgroundColor: colors.primaryLight + '20' }]}>
          <Text style={[styles.scoreLabel, { color: colors.text }]}>Overall Similarity:</Text>
          <Text style={[styles.scoreValue, { color: colors.primary }]}>
            {analysisResult.similarityScore ? `${Math.round(analysisResult.similarityScore)}%` : 'N/A'}
          </Text>
        </View>

        {analysisResult.feedback && (
          <Text style={[styles.feedback, { color: colors.textSecondary }]}>{analysisResult.feedback}</Text>
        )}

        {analysisResult.analysisDetails && (
          <View style={styles.detailsContainer}>
            <Text style={[styles.detailsTitle, { color: colors.text }]}>Detailed Analysis:</Text>
            
            {analysisResult.analysisDetails.pitch && (
              <View style={[styles.detailItem, { borderColor: colors.divider }]}>
                <Text style={[styles.detailLabel, { color: colors.text }]}>Pitch:</Text>
                <Text style={[styles.detailScore, { color: colors.primary }]}>
                  {Math.round(analysisResult.analysisDetails.pitch.score)}%
                </Text>
                <Text style={[styles.detailFeedback, { color: colors.textSecondary }]}>
                  {analysisResult.analysisDetails.pitch.feedback}
                </Text>
              </View>
            )}
            
            {analysisResult.analysisDetails.rhythm && (
              <View style={[styles.detailItem, { borderColor: colors.divider }]}>
                <Text style={[styles.detailLabel, { color: colors.text }]}>Rhythm:</Text>
                <Text style={[styles.detailScore, { color: colors.primary }]}>
                  {Math.round(analysisResult.analysisDetails.rhythm.score)}%
                </Text>
                <Text style={[styles.detailFeedback, { color: colors.textSecondary }]}>
                  {analysisResult.analysisDetails.rhythm.feedback}
                </Text>
              </View>
            )}
            
            {analysisResult.analysisDetails.pronunciation && (
              <View style={[styles.detailItem, { borderColor: colors.divider }]}>
                <Text style={[styles.detailLabel, { color: colors.text }]}>Pronunciation:</Text>
                <Text style={[styles.detailScore, { color: colors.primary }]}>
                  {Math.round(analysisResult.analysisDetails.pronunciation.score)}%
                </Text>
                <Text style={[styles.detailFeedback, { color: colors.textSecondary }]}>
                  {analysisResult.analysisDetails.pronunciation.feedback}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  if (!voiceClip) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[
          styles.modalContent, 
          { 
            backgroundColor: colors.surface,
            borderRadius: borderRadius.lg,
            ...shadows.medium
          }
        ]}>
          <View style={[styles.header, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.title, { color: colors.text }]}>{voiceClip.name}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={colors.icon} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent}>
            <Text style={[styles.description, { color: colors.textSecondary }]}>{voiceClip.description}</Text>
            
            {isEmulator && (
              <View style={[styles.emulatorWarning, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
                <Icon name="warning" size={20} color={colors.warning} style={styles.warningIcon} />
                <Text style={[styles.warningText, { color: colors.textSecondary }]}>
                  You appear to be running in an emulator. Audio recording may not work properly in emulators due to limited microphone access. 
                  For best results, test on a physical device.
                </Text>
              </View>
            )}
            
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Original Voice Clip</Text>
              <AudioPlayer audioUrl={voiceClip.audioUrl} />
            </View>
            
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Record Your Voice</Text>
              <AudioRecorder onRecordingComplete={handleRecordingComplete} />
            </View>
            
            {userRecordingUri && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Recording</Text>
                <AudioPlayer audioUrl={userRecordingUri} />
                
                <TouchableOpacity
                  style={[styles.analyzeButton, { backgroundColor: colors.primary }]}
                  onPress={handleAnalyzeVoice}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <ActivityIndicator size="small" color={colors.textOnPrimary} />
                  ) : (
                    <Text style={[styles.analyzeButtonText, { color: colors.textOnPrimary }]}>
                      {analysisRequested ? 'Analyze Again' : 'Analyze Voice'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
            
            {error && (
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            )}
            
            {renderAnalysisResult()}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 16,
  },
  description: {
    fontSize: 16,
    marginBottom: 16,
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  analyzeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  analyzeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
    marginBottom: 16,
  },
  analysisContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  analysisTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  feedback: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 16,
  },
  detailsContainer: {
    marginTop: 8,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  detailItem: {
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  detailScore: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  detailFeedback: {
    fontSize: 14,
    lineHeight: 20,
  },
  emulatorWarning: {
    flexDirection: 'row',
    padding: 12,
    marginVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  warningIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});

export default VoiceAnalysisModal; 