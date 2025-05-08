import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { getStudentTestScores } from '../../services/api';
import { StudentTestScore } from '../../types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AudioPlayer from '../../components/AudioPlayer';

interface StudentTestScoresScreenProps {
  navigation: any;
  route: any;
}

const StudentTestScoresScreen: React.FC<StudentTestScoresScreenProps> = ({ navigation, route }) => {
  const { examId, examName } = route.params;
  const theme = useTheme();
  const { colors, spacing, borderRadius } = theme;

  const [testScores, setTestScores] = useState<StudentTestScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  // Load student test scores
  const loadTestScores = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 1 = exam type
      const data = await getStudentTestScores(1, examId);
      
      // Filter scores for this specific exam
      const examScores = data.filter(score => score.test_id === examId);
      setTestScores(examScores);
    } catch (err: any) {
      console.error('Error loading student test scores:', err);
      setError(err.message || 'Failed to load student test scores');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadTestScores();
  }, [examId]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadTestScores();
  };

  // Toggle expanded state for an item
  const toggleExpandItem = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Render test score item
  const renderTestScoreItem = ({ item }: { item: StudentTestScore }) => {
    const isExpanded = expandedItems[item.id] || false;
    
    return (
      <View style={[styles.scoreItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.scoreHeader}
          onPress={() => toggleExpandItem(item.id)}
        >
          <View style={styles.scoreInfo}>
            <Text style={[styles.scoreTitle, { color: colors.text }]}>
              {item.student_full_name || 'Unknown Test'}
            </Text>
            <Text style={[styles.scoreValue, { color: getScoreColor(item.score, colors) }]}>
              {item.score}%
            </Text>
          </View>
          
          <Icon 
            name={isExpanded ? 'chevron-up' : 'chevron-down'} 
            size={24} 
            color={colors.text} 
          />
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.expandedContent}>
            {/* <View style={styles.textComparisonContainer}>
              <View style={styles.textSection}>
                <Text style={[styles.sectionTitle, { color: colors.primary }]}>Correct Text:</Text>
                <Text style={[styles.transcriptText, { color: colors.text }]}>
                  {item.transcript || 'No transcript available'}
                </Text>
              </View>
              
              <View style={styles.textSection}>
                <Text style={[styles.sectionTitle, { color: colors.warning }]}>{item.student_full_name} Speech:</Text>
                <Text style={[styles.transcriptText, { color: colors.text }]}>
                  {item.recognized_text || 'No recognized text available'}
                </Text>
              </View>
            </View> */}
            
            <View style={styles.audioSection}>
              {/* <View style={styles.audioPlayer}>
                <Text style={[styles.audioTitle, { color: colors.primary }]}>Original Audio:</Text>
                {item.audioUrl ? (
                  <AudioPlayer audioUrl={item.audioUrl} />
                ) : (
                  <Text style={[styles.noAudioText, { color: colors.textSecondary }]}>
                    No audio available
                  </Text>
                )}
              </View> */}
              
              <View style={styles.audioPlayer}>
                <Text style={[styles.audioTitle, { color: colors.warning }]}>{item.student_full_name}'s Recording:</Text>
                {item.userAudioUrl ? (
                  <AudioPlayer audioUrl={item.userAudioUrl} />
                ) : (
                  <Text style={[styles.noAudioText, { color: colors.textSecondary }]}>
                    No recording available
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  // Helper function for score color
  const getScoreColor = (score: number, colors: any) => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.warning;
    return colors.error;
  };

  if (isLoading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Icon name="alert-circle-outline" size={50} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={loadTestScores}
        >
          <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {examName} - Student Scores
        </Text>
      </View>
      
      {testScores.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="account-voice-off" size={60} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No student recordings available
          </Text>
          <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>
            Students have not attempted this exam yet or their recordings were not saved
          </Text>
        </View>
      ) : (
        <FlatList
          data={testScores}
          renderItem={renderTestScoreItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  listContent: {
    paddingBottom: 16,
  },
  scoreItem: {
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  scoreHeader: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 12,
  },
  expandedContent: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  textComparisonContainer: {
    marginBottom: 16,
  },
  textSection: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  transcriptText: {
    fontSize: 14,
    lineHeight: 20,
  },
  audioSection: {
    marginTop: 8,
  },
  audioPlayer: {
    marginBottom: 16,
  },
  audioTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  noAudioText: {
    fontStyle: 'italic',
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
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

export default StudentTestScoresScreen; 