import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
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

  const handleRecordingComplete = (audioUri: string) => {
    setUserRecordingUri(audioUri);
    setAnalysisResult(null);
    setError(null);
  };

  const handleAnalyzeVoice = async () => {
    if (!voiceClip || !userRecordingUri) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // Create a file object from the URI
      const audioFile = createFileObject(userRecordingUri);

      const result = await analyzeVoiceComparison(voiceClip.id, audioFile);
      setAnalysisResult(result);
    } catch (err) {
      console.error('Error analyzing voice:', err);
      setError('Failed to analyze voice. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderAnalysisResult = () => {
    if (!analysisResult) return null;

    return (
      <View style={styles.analysisContainer}>
        <Text style={[styles.analysisTitle, { color: colors.text }]}>Analysis Result</Text>
        
        <View style={[styles.scoreContainer, { backgroundColor: colors.primaryLight + '20' }]}>
          <Text style={[styles.scoreLabel, { color: colors.text }]}>Overall Similarity:</Text>
          <Text style={[styles.scoreValue, { color: colors.primary }]}>
            {analysisResult.similarityScore ? `${Math.round(analysisResult.similarityScore * 100)}%` : 'N/A'}
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
                  {Math.round(analysisResult.analysisDetails.pitch.score * 100)}%
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
                  {Math.round(analysisResult.analysisDetails.rhythm.score * 100)}%
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
                  {Math.round(analysisResult.analysisDetails.pronunciation.score * 100)}%
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
            <Text style={[styles.title, { color: colors.text }]}>{voiceClip.title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={colors.icon} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent}>
            <Text style={[styles.description, { color: colors.textSecondary }]}>{voiceClip.description}</Text>
            
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
                    <Text style={[styles.analyzeButtonText, { color: colors.textOnPrimary }]}>Analyze Voice</Text>
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
});

export default VoiceAnalysisModal; 