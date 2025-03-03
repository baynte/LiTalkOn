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
        <Text style={styles.analysisTitle}>Analysis Result</Text>
        
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>Overall Similarity:</Text>
          <Text style={styles.scoreValue}>
            {analysisResult.similarityScore ? `${Math.round(analysisResult.similarityScore * 100)}%` : 'N/A'}
          </Text>
        </View>

        {analysisResult.feedback && (
          <Text style={styles.feedback}>{analysisResult.feedback}</Text>
        )}

        {analysisResult.analysisDetails && (
          <View style={styles.detailsContainer}>
            <Text style={styles.detailsTitle}>Detailed Analysis:</Text>
            
            {analysisResult.analysisDetails.pitch && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Pitch:</Text>
                <Text style={styles.detailScore}>
                  {Math.round(analysisResult.analysisDetails.pitch.score * 100)}%
                </Text>
                <Text style={styles.detailFeedback}>
                  {analysisResult.analysisDetails.pitch.feedback}
                </Text>
              </View>
            )}
            
            {analysisResult.analysisDetails.rhythm && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Rhythm:</Text>
                <Text style={styles.detailScore}>
                  {Math.round(analysisResult.analysisDetails.rhythm.score * 100)}%
                </Text>
                <Text style={styles.detailFeedback}>
                  {analysisResult.analysisDetails.rhythm.feedback}
                </Text>
              </View>
            )}
            
            {analysisResult.analysisDetails.pronunciation && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Pronunciation:</Text>
                <Text style={styles.detailScore}>
                  {Math.round(analysisResult.analysisDetails.pronunciation.score * 100)}%
                </Text>
                <Text style={styles.detailFeedback}>
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
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>{voiceClip.title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent}>
            <Text style={styles.description}>{voiceClip.description}</Text>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Original Voice Clip</Text>
              <AudioPlayer audioUrl={voiceClip.audioUrl} />
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Record Your Voice</Text>
              <AudioRecorder onRecordingComplete={handleRecordingComplete} />
            </View>
            
            {userRecordingUri && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Your Recording</Text>
                <AudioPlayer audioUrl={userRecordingUri} />
                
                <TouchableOpacity
                  style={styles.analyzeButton}
                  onPress={handleAnalyzeVoice}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.analyzeButtonText}>Analyze Voice</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
            
            {error && (
              <Text style={styles.errorText}>{error}</Text>
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
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
    color: '#666',
    marginBottom: 16,
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  analyzeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  analyzeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  analysisContainer: {
    backgroundColor: '#F8F8F8',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 24,
  },
  analysisTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  scoreLabel: {
    fontSize: 16,
    color: '#333',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
  },
  feedback: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  detailsContainer: {
    marginTop: 8,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  detailItem: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  detailScore: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4,
  },
  detailFeedback: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default VoiceAnalysisModal; 