import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { getExamTestById, getVoiceClipById, analyzeVoiceComparison, getExamRemarks } from '../../services/api';
import { ExamTest, VoiceClip, VoiceAnalysisResult } from '../../types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AudioRecorder from '../../components/AudioRecorder';
import AudioPlayer from '../../components/AudioPlayer';
import ExamRemarkList from '../../components/ExamRemarkList';
import { ExamRemark } from '../../components/ExamRemarkList';

interface ExamTestDetailScreenProps {
  navigation: any;
  route: any;
}

const ExamTestDetailScreen: React.FC<ExamTestDetailScreenProps> = ({ navigation, route }) => {
  const { testId } = route.params;
  const theme = useTheme();
  const { colors, spacing, borderRadius } = theme;

  const [examTest, setExamTest] = useState<ExamTest | null>(null);
  const [voiceClips, setVoiceClips] = useState<VoiceClip[]>([]);
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<VoiceAnalysisResult[]>([]);
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [isExamCompleted, setIsExamCompleted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRemarkTab, setShowRemarkTab] = useState(false);
  const [remarks, setRemarks] = useState<ExamRemark[]>([]);
  const [isLoadingRemarks, setIsLoadingRemarks] = useState(false);
  const [remarksError, setRemarksError] = useState<string | null>(null);

  // Load exam test and voice clips
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch exam test
        const test = await getExamTestById(testId);
        setExamTest(test);
        
        // If the exam has been taken, show remarks tab by default
        if (test.taken) {
          setShowRemarkTab(true);
        }
        
        // Fetch all voice clips for this test
        const clips: VoiceClip[] = [];
        for (const clipId of test.voiceClipIds) {
          const clip = await getVoiceClipById(clipId);
          clips.push(clip);
        }
        
        setVoiceClips(clips);
        
        // Initialize time remaining if there's a time limit
        if (test.timeLimit) {
          setTimeRemaining(test.timeLimit * 60); // Convert minutes to seconds
        }
      } catch (err: any) {
        console.error('Error loading exam test data:', err);
        setError(err.message || 'Failed to load exam test data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [testId]);

  // Handle timer
  useEffect(() => {
    if (isExamStarted && timeRemaining !== null && !isExamCompleted) {
      const interval = setInterval(() => {
        setTimeRemaining((prevTime) => {
          if (prevTime === null || prevTime <= 1) {
            // Time's up
            clearInterval(interval);
            handleExamComplete();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
      
      setTimer(interval);
      
      return () => {
        clearInterval(interval);
      };
    }
  }, [isExamStarted, timeRemaining, isExamCompleted]);

  // Load exam remarks
  useEffect(() => {
    if (showRemarkTab && testId) {
      loadRemarks();
    }
  }, [showRemarkTab, testId]);

  const loadRemarks = async () => {
    if (!testId) return;
    
    setIsLoadingRemarks(true);
    setRemarksError(null);
    
    try {
      const fetchedRemarks = await getExamRemarks(testId);
      setRemarks(fetchedRemarks);
    } catch (error: any) {
      console.error('Error loading remarks:', error);
      setRemarksError(error.message || 'Failed to load remarks');
    } finally {
      setIsLoadingRemarks(false);
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds: number | null) => {
    if (seconds === null) return '--:--';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Start exam
  const handleStartExam = () => {
    setShowConfirmModal(true);
  };

  // Confirm start exam
  const confirmStartExam = () => {
    setShowConfirmModal(false);
    setIsExamStarted(true);
    setAnalysisResults([]);
  };

  // Handle audio recording complete
  const handleRecordingComplete = (audioFile: any) => {
    if (currentClipIndex < voiceClips.length) {
      analyzeAudio(voiceClips[currentClipIndex].id, audioFile);
    }
  };

  // Analyze audio
  const analyzeAudio = async (clipId: string, audioFile: any) => {
    setIsAnalyzing(true);
    
    try {
      const result = await analyzeVoiceComparison(clipId, audioFile, testId, 1);
      
      // Add result to results array
      setAnalysisResults((prevResults) => [...prevResults, result]);
      
      // Move to next clip or complete exam
      if (currentClipIndex < voiceClips.length - 1) {
        setCurrentClipIndex(currentClipIndex + 1);
      } else {
        handleExamComplete();
      }
    } catch (err: any) {
      console.error('Error analyzing audio:', err);
      Alert.alert('Analysis Error', err.message || 'Failed to analyze audio');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Complete exam
  const handleExamComplete = () => {
    if (timer) {
      clearInterval(timer);
      setTimer(null);
    }
    
    setIsExamCompleted(true);
    
    // Calculate overall score
    const totalScore = analysisResults.reduce((sum, result) => {
      return sum + (result.similarityScore || 0);
    }, 0);
    
    const averageScore = totalScore / (analysisResults.length || 1);
    
    // Show completion alert
    Alert.alert(
      'Exam Completed',
      `You have completed the exam with an average score of ${averageScore.toFixed(1)}%`,
      [
        {
          text: 'View Results',
          onPress: () => {}, // Stay on results screen
        },
        {
          text: 'Return to Exams',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  // Render current voice clip
  const renderCurrentClip = () => {
    if (currentClipIndex >= voiceClips.length) return null;
    
    const currentClip = voiceClips[currentClipIndex];
    
    return (
      <View style={[styles.currentClipContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.clipHeader}>
          <Text style={[styles.clipCounter, { color: colors.textSecondary }]}>
            Clip {currentClipIndex + 1} of {voiceClips.length}
          </Text>
          {timeRemaining !== null && (
            <Text 
              style={[
                styles.timeRemaining, 
                { 
                  color: timeRemaining < 60 ? colors.error : 
                         timeRemaining < 300 ? colors.warning : 
                         colors.textSecondary 
                }
              ]}
            >
              Time: {formatTime(timeRemaining)}
            </Text>
          )}
        </View>
        
        <Text style={[styles.clipTitle, { color: colors.text }]}>{currentClip.name}</Text>
        <Text style={[styles.clipDescription, { color: colors.textSecondary }]}>
          {currentClip.description}
        </Text>
        
        {/* Replace Audio Player placeholder with actual AudioPlayer component */}
        <AudioPlayer 
          audioUrl={currentClip.audioUrl} 
          title="Original Audio"
        />
        
        {/* Audio Recorder Component */}
        <AudioRecorder
          isRecording={isRecording}
          setIsRecording={setIsRecording}
          onRecordingComplete={handleRecordingComplete}
          isAnalyzing={isAnalyzing}
        />
      </View>
    );
  };

  // Render results
  const renderResults = () => {
    if (!isExamCompleted || analysisResults.length === 0) return null;
    
    // Calculate overall score
    const totalScore = analysisResults.reduce((sum, result) => {
      return sum + (result.similarityScore || 0);
    }, 0);
    
    const averageScore = totalScore / analysisResults.length;
    
    // Determine score color
    const getScoreColor = (score: number) => {
      if (score >= 90) return colors.success;
      if (score >= 70) return colors.warning;
      return colors.error;
    };
    
    return (
      <View style={[styles.resultsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.resultsTitle, { color: colors.text }]}>Exam Results</Text>
        
        <View style={styles.overallScoreContainer}>
          <Text style={[styles.overallScoreLabel, { color: colors.textSecondary }]}>Overall Score:</Text>
          <Text style={[styles.overallScoreValue, { color: getScoreColor(averageScore) }]}>
            {averageScore.toFixed(1)}%
          </Text>
        </View>
        
        <Text style={[styles.clipResultsTitle, { color: colors.text }]}>Individual Clip Results:</Text>
        
        {analysisResults.map((result, index) => (
          <View 
            key={index} 
            style={[styles.clipResultItem, { borderBottomColor: colors.border }]}
          >
            <View style={styles.clipResultHeader}>
              <Text style={[styles.clipResultName, { color: colors.text }]}>
                {index < voiceClips.length ? voiceClips[index].name : `Clip ${index + 1}`}
              </Text>
              <Text 
                style={[
                  styles.clipResultScore, 
                  { color: getScoreColor(result.similarityScore || 0) }
                ]}
              >
                {result.similarityScore?.toFixed(1) || 0}%
              </Text>
            </View>
            
            {result.feedback && (
              <Text style={[styles.clipResultFeedback, { color: colors.textSecondary }]}>
                {result.feedback}
              </Text>
            )}
          </View>
        ))}
        
        <TouchableOpacity
          style={[styles.returnButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.returnButtonText, { color: '#FFFFFF' }]}>Return to Exams</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Add this function to show a warning if the exam has been taken
  const renderExamStartSection = () => {
    if (!examTest) return null;
    
    // If exam has been taken, show a message directing to remarks
    if (examTest.taken) {
      return (
        <View style={[styles.startContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.takenContainer}>
            <Icon name="check-circle" size={40} color={colors.success} />
            <Text style={[styles.takenTitle, { color: colors.success }]}>
              You have completed this exam
            </Text>
          </View>
          
          <Text style={[styles.startDescription, { color: colors.textSecondary }]}>
            You've already taken this exam. View your results and teacher remarks below.
          </Text>
          
          <TouchableOpacity
            style={[styles.viewRemarksButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowRemarkTab(true)}
          >
            <Text style={[styles.viewRemarksButtonText, { color: '#FFFFFF' }]}>
              View Teacher Remarks
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.viewScoresButton, { backgroundColor: colors.primaryLight, marginTop: 12 }]}
            onPress={() => navigation.navigate('MyTestScores', { examId: testId, examName: examTest.name })}
          >
            <Text style={[styles.viewScoresButtonText, { color: '#FFFFFF' }]}>
              View My Test Scores
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    // Normal start exam section for untaken exams
    return (
      <View style={[styles.startContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.startTitle, { color: colors.text }]}>Ready to Start?</Text>
        
        <Text style={[styles.startDescription, { color: colors.textSecondary }]}>
          This exam contains {voiceClips.length} voice clips that you will need to record.
          {examTest.timeLimit ? ` You will have ${examTest.timeLimit} minutes to complete the exam.` : ''}
        </Text>
        
        <Text style={[styles.startWarning, { color: colors.warning }]}>
          Once started, you cannot pause or restart the exam.
        </Text>
        
        <TouchableOpacity
          style={[styles.startButton, { backgroundColor: colors.primary }]}
          onPress={handleStartExam}
        >
          <Text style={[styles.startButtonText, { color: '#FFFFFF' }]}>
            Start Exam
          </Text>
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

  if (!examTest) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Icon name="alert-circle-outline" size={50} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.error }]}>Exam test not found</Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isExamCompleted) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{examTest.name}</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {examTest.description}
          </Text>
        </View>

        {/* Tabs */}
        <View style={[styles.tabContainer, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              !showRemarkTab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
            ]}
            onPress={() => setShowRemarkTab(false)}
          >
            <Icon name="clipboard-text-outline" size={20} color={!showRemarkTab ? colors.primary : colors.textSecondary} />
            <Text
              style={[
                styles.tabText,
                { color: !showRemarkTab ? colors.primary : colors.textSecondary }
              ]}
            >
              Results
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              showRemarkTab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
            ]}
            onPress={() => setShowRemarkTab(true)}
          >
            <Icon name="comment-text-outline" size={20} color={showRemarkTab ? colors.primary : colors.textSecondary} />
            <Text
              style={[
                styles.tabText,
                { color: showRemarkTab ? colors.primary : colors.textSecondary }
              ]}
            >
              Teacher Remarks
            </Text>
          </TouchableOpacity>
        </View>
        
        {showRemarkTab ? (
          <ExamRemarkList
            remarks={remarks}
            isLoading={isLoadingRemarks}
            error={remarksError}
            isTeacher={false}
          />
        ) : (
          <>
            {renderResults()}
            <TouchableOpacity
              style={[styles.viewScoresButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('MyTestScores', { examId: testId, examName: examTest.name })}
            >
              <Text style={styles.viewScoresButtonText}>View My Test Scores</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{examTest.name}</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {examTest.description}
        </Text>
      </View>
      
      {/* Tabs - only show if exam has been taken */}
      {examTest.taken && (
        <View style={[styles.tabContainer, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              !showRemarkTab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
            ]}
            onPress={() => setShowRemarkTab(false)}
          >
            <Icon name="clipboard-text-outline" size={20} color={!showRemarkTab ? colors.primary : colors.textSecondary} />
            <Text
              style={[
                styles.tabText,
                { color: !showRemarkTab ? colors.primary : colors.textSecondary }
              ]}
            >
              Exam Info
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              showRemarkTab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
            ]}
            onPress={() => setShowRemarkTab(true)}
          >
            <Icon name="comment-text-outline" size={20} color={showRemarkTab ? colors.primary : colors.textSecondary} />
            <Text
              style={[
                styles.tabText,
                { color: showRemarkTab ? colors.primary : colors.textSecondary }
              ]}
            >
              Teacher Remarks
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {examTest.taken && showRemarkTab ? (
        <ExamRemarkList
          remarks={remarks}
          isLoading={isLoadingRemarks}
          error={remarksError}
          isTeacher={false}
        />
      ) : (
        !isExamStarted && !isExamCompleted ? (
          renderExamStartSection()
        ) : isExamStarted && !isExamCompleted ? (
          renderCurrentClip()
        ) : (
          renderResults()
        )
      )}
      
      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
      >
        <View style={[styles.modalOverlay]}>
          <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Start Exam
            </Text>
            <Text style={[styles.modalText, { color: colors.textSecondary }]}>
              Are you sure you want to start the exam? Once started, you cannot pause or restart.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={confirmStartExam}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Start</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 16,
    marginBottom: 16,
  },
  examInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    marginLeft: 4,
  },
  startContainer: {
    padding: 24,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  startTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  startDescription: {
    fontSize: 16,
    marginBottom: 16,
  },
  startWarning: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 24,
  },
  startButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  takenContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  takenTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  takenWarningText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  currentClipContainer: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  clipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  clipCounter: {
    fontSize: 14,
  },
  timeRemaining: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  clipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  clipDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  resultsContainer: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 24,
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  overallScoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  overallScoreLabel: {
    fontSize: 16,
  },
  overallScoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  clipResultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  clipResultItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  clipResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  clipResultName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  clipResultScore: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  clipResultFeedback: {
    fontSize: 14,
  },
  returnButton: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  returnButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    padding: 24,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 14,
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
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 16,
  },
  tabText: {
    marginLeft: 8,
    fontWeight: '500',
    fontSize: 14,
  },
  viewScoresButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  viewScoresButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  remarksSection: {
    marginTop: 8,
  },
  viewRemarksButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  viewRemarksButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ExamTestDetailScreen; 