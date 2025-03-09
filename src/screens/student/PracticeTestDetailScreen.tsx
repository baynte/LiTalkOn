import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { getPracticeTestById, getVoiceClipById, analyzeVoiceComparison } from '../../services/api';
import { PracticeTest, VoiceClip, VoiceAnalysisResult } from '../../types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AudioRecorder from '../../components/AudioRecorder';
import AudioPlayer from '../../components/AudioPlayer';

interface PracticeTestDetailScreenProps {
  navigation: any;
  route: any;
}

const PracticeTestDetailScreen: React.FC<PracticeTestDetailScreenProps> = ({ navigation, route }) => {
  const { testId } = route.params;
  const theme = useTheme();
  const { colors, spacing, borderRadius } = theme;

  const [practiceTest, setPracticeTest] = useState<PracticeTest | null>(null);
  const [voiceClips, setVoiceClips] = useState<VoiceClip[]>([]);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [selectedClip, setSelectedClip] = useState<VoiceClip | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<VoiceAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load practice test and voice clips
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch practice test
        const test = await getPracticeTestById(testId);
        setPracticeTest(test);
        
        // Fetch all voice clips for this test
        const clips: VoiceClip[] = [];
        for (const clipId of test.voiceClipIds) {
          const clip = await getVoiceClipById(clipId);
          clips.push(clip);
        }
        
        setVoiceClips(clips);
        
        // Select the first clip by default
        if (clips.length > 0) {
          setSelectedClipId(clips[0].id);
          setSelectedClip(clips[0]);
        }
      } catch (err: any) {
        console.error('Error loading practice test data:', err);
        setError(err.message || 'Failed to load practice test data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [testId]);

  // Handle clip selection
  const handleClipSelection = (clipId: string) => {
    setSelectedClipId(clipId);
    const clip = voiceClips.find(c => c.id === clipId) || null;
    setSelectedClip(clip);
    setAnalysisResult(null); // Clear previous analysis result
  };

  // Handle audio recording
  const handleRecordingComplete = (audioFile: any) => {
    if (selectedClipId) {
      analyzeAudio(selectedClipId, audioFile, testId);
    }
  };

  // Analyze audio
  const analyzeAudio = async (clipId: string, audioFile: any, testId: string) => {
    setIsAnalyzing(true);
    
    try {
      const result = await analyzeVoiceComparison(clipId, audioFile, testId);
      setAnalysisResult(result);
    } catch (err: any) {
      console.error('Error analyzing audio:', err);
      Alert.alert('Analysis Error', err.message || 'Failed to analyze audio');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Render voice clip item
  const renderVoiceClipItem = ({ item }: { item: any }) => {
    const isSelected = selectedClipId === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.clipItem,
          {
            backgroundColor: isSelected ? colors.primaryLight : colors.card,
            borderColor: isSelected ? colors.primary : colors.border,
          },
        ]}
        onPress={() => handleClipSelection(item.id)}
      >
        <View style={styles.clipInfo}>
          <Text style={[styles.clipTitle, { color: colors.text }]}>{item.title}</Text>
          <Text style={[styles.clipDescription, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
        {isSelected && (
          <Icon name="check-circle" size={24} color={colors.primary} />
        )}
      </TouchableOpacity>
    );
  };

  // Render analysis result
  const renderAnalysisResult = () => {
    if (!analysisResult) return null;
    
    const { similarityScore, feedback, analysisDetails } = analysisResult;
    
    // Determine score color
    const getScoreColor = (score?: number) => {
      if (score === undefined) return colors.textSecondary;
      if (score >= 90) return colors.success;
      if (score >= 70) return colors.warning;
      return colors.error;
    };
    
    return (
      <View style={[styles.analysisContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.analysisTitle, { color: colors.text }]}>Analysis Result</Text>
        
        {similarityScore !== undefined && (
          <View style={styles.scoreContainer}>
            <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>Overall Score:</Text>
            <Text style={[styles.scoreValue, { color: getScoreColor(similarityScore) }]}>
              {similarityScore}%
            </Text>
          </View>
        )}
        
        {feedback && (
          <View style={styles.feedbackContainer}>
            <Text style={[styles.feedbackLabel, { color: colors.textSecondary }]}>Feedback:</Text>
            <Text style={[styles.feedbackText, { color: colors.text }]}>{feedback}</Text>
          </View>
        )}
        
        {analysisDetails && (
          <View style={styles.detailsContainer}>
            <Text style={[styles.detailsTitle, { color: colors.text }]}>Detailed Analysis:</Text>
            
            {analysisDetails.pitch && (
              <View style={styles.detailItem}>
                <View style={styles.detailHeader}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Pitch:</Text>
                  <Text style={[styles.detailScore, { color: getScoreColor(analysisDetails.pitch.score) }]}>
                    {analysisDetails.pitch.score}%
                  </Text>
                </View>
                <Text style={[styles.detailFeedback, { color: colors.text }]}>
                  {analysisDetails.pitch.feedback}
                </Text>
              </View>
            )}
            
            {analysisDetails.rhythm && (
              <View style={styles.detailItem}>
                <View style={styles.detailHeader}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Rhythm:</Text>
                  <Text style={[styles.detailScore, { color: getScoreColor(analysisDetails.rhythm.score) }]}>
                    {analysisDetails.rhythm.score}%
                  </Text>
                </View>
                <Text style={[styles.detailFeedback, { color: colors.text }]}>
                  {analysisDetails.rhythm.feedback}
                </Text>
              </View>
            )}
            
            {analysisDetails.pronunciation && (
              <View style={styles.detailItem}>
                <View style={styles.detailHeader}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Pronunciation:</Text>
                  <Text style={[styles.detailScore, { color: getScoreColor(analysisDetails.pronunciation.score) }]}>
                    {analysisDetails.pronunciation.score}%
                  </Text>
                </View>
                <Text style={[styles.detailFeedback, { color: colors.text }]}>
                  {analysisDetails.pronunciation.feedback}
                </Text>
              </View>
            )}
          </View>
        )}
        
        <TouchableOpacity
          style={[styles.tryAgainButton, { backgroundColor: colors.primary }]}
          onPress={() => setAnalysisResult(null)}
        >
          <Text style={[styles.tryAgainButtonText, { color: '#FFFFFF' }]}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Icon name="alert-circle-outline" size={50} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!practiceTest) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Icon name="alert-circle-outline" size={50} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.error }]}>Practice test not found</Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{practiceTest.name}</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {practiceTest.description}
        </Text>
      </View>
      
      {/* Voice Clips List */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Voice Clips</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          Select a voice clip to practice with
        </Text>
        
        <FlatList
          data={voiceClips}
          renderItem={renderVoiceClipItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          style={styles.clipsList}
        />
      </View>
      
      {/* Selected Clip */}
      {selectedClip && !analysisResult && (
        <View style={[styles.selectedClipContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.selectedClipTitle, { color: colors.text }]}>{selectedClip.name}</Text>
          <Text style={[styles.selectedClipDescription, { color: colors.textSecondary }]}>
            {selectedClip.description}
          </Text>
          
          {/* Replace Audio Player placeholder with actual AudioPlayer component */}
          <AudioPlayer 
            audioUrl={selectedClip.audioUrl} 
            title="Original Audio"
          />
          
          {/* Audio Recorder Component */}
          <AudioRecorder
            isRecording={isRecording}
            setIsRecording={setIsRecording}
            onRecordingComplete={handleRecordingComplete}
            isAnalyzing={isAnalyzing}
            testId={testId}
          />
        </View>
      )}
      
      {/* Analysis Result */}
      {analysisResult && renderAnalysisResult()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  clipsList: {
    marginTop: 8,
  },
  clipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  clipInfo: {
    flex: 1,
  },
  clipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  clipDescription: {
    fontSize: 14,
  },
  selectedClipContainer: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 24,
  },
  selectedClipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  selectedClipDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  analysisContainer: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 24,
  },
  analysisTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  scoreLabel: {
    fontSize: 16,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  feedbackContainer: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  feedbackLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  feedbackText: {
    fontSize: 16,
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  detailItem: {
    marginBottom: 12,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  detailScore: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  detailFeedback: {
    fontSize: 14,
  },
  tryAgainButton: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tryAgainButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  button: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PracticeTestDetailScreen; 