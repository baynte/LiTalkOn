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
import { getStudentTestScores, getTestScoreRemarks } from '../../services/api';
import { StudentTestScore, TestScoreRemark } from '../../types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AudioPlayer from '../../components/AudioPlayer';
import TestScoreRemarkList from '../../components/TestScoreRemarkList';
import { useAuth } from '../../contexts/AuthContext';

interface MyTestScoresScreenProps {
  navigation: any;
  route: any;
}

const MyTestScoresScreen: React.FC<MyTestScoresScreenProps> = ({ navigation, route }) => {
  const { examId, examName } = route.params;
  const theme = useTheme();
  const { colors } = theme;
  const { user } = useAuth();

  const [testScores, setTestScores] = useState<StudentTestScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<Record<string, string>>({});
  const [remarks, setRemarks] = useState<Record<string, TestScoreRemark[]>>({});
  const [isLoadingRemarks, setIsLoadingRemarks] = useState<Record<string, boolean>>({});
  const [remarksError, setRemarksError] = useState<Record<string, string | null>>({});

  // Load student test scores
  const loadTestScores = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 1 = exam type
      const data = await getStudentTestScores(1, examId);
      
      // Filter scores for this specific exam and this student
      const myScores = data.filter(score => score.test_id === examId && score.student_id === user?.id);
      setTestScores(myScores);
    } catch (err: any) {
      console.error('Error loading my test scores:', err);
      setError(err.message || 'Failed to load test scores');
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
    
    // Load remarks when expanding an item if not already loaded
    const isExpanded = !expandedItems[id];
    if (isExpanded && !remarks[id]) {
      loadRemarks(id);
    }
  };
  
  // Load remarks for a specific test score
  const loadRemarks = async (attemptId: string) => {
    setIsLoadingRemarks(prev => ({ ...prev, [attemptId]: true }));
    setRemarksError(prev => ({ ...prev, [attemptId]: null }));
    
    try {
      const data = await getTestScoreRemarks(attemptId);
      setRemarks(prev => ({ ...prev, [attemptId]: data }));
    } catch (err: any) {
      console.error(`Error loading remarks for attempt ${attemptId}:`, err);
      setRemarksError(prev => ({ ...prev, [attemptId]: err.message || 'Failed to load remarks' }));
    } finally {
      setIsLoadingRemarks(prev => ({ ...prev, [attemptId]: false }));
    }
  };
  
  // Set active tab for an item
  const setItemActiveTab = (id: string, tab: string) => {
    setActiveTab(prev => ({
      ...prev,
      [id]: tab
    }));
  };

  // Render test score item
  const renderTestScoreItem = ({ item }: { item: StudentTestScore }) => {
    const isExpanded = expandedItems[item.id] || false;
    const currentTab = activeTab[item.id] || 'recording';
    
    return (
      <View style={[styles.scoreItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.scoreHeader}
          onPress={() => toggleExpandItem(item.id)}
        >
          <View style={styles.scoreInfo}>
            <Text style={[styles.scoreTitle, { color: colors.text }]}>
              {item.title || 'Unknown Test'}
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
            {/* Tabs for switching between recording and remarks */}
            <View style={styles.tabContainer}>
              <TouchableOpacity 
                style={[
                  styles.tabButton, 
                  currentTab === 'recording' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
                ]}
                onPress={() => setItemActiveTab(item.id, 'recording')}
              >
                <Icon 
                  name="microphone" 
                  size={20} 
                  color={currentTab === 'recording' ? colors.primary : colors.textSecondary} 
                />
                <Text 
                  style={[
                    styles.tabText, 
                    { color: currentTab === 'recording' ? colors.primary : colors.textSecondary }
                  ]}
                >
                  My Recording
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.tabButton, 
                  currentTab === 'remarks' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
                ]}
                onPress={() => setItemActiveTab(item.id, 'remarks')}
              >
                <Icon 
                  name="comment-text-outline" 
                  size={20} 
                  color={currentTab === 'remarks' ? colors.primary : colors.textSecondary} 
                />
                <Text 
                  style={[
                    styles.tabText, 
                    { color: currentTab === 'remarks' ? colors.primary : colors.textSecondary }
                  ]}
                >
                  Teacher Remarks
                </Text>
              </TouchableOpacity>
            </View>
            
            {currentTab === 'recording' ? (
              <View style={styles.audioSection}>
                <View style={styles.audioPlayer}>
                  <Text style={[styles.audioTitle, { color: colors.warning }]}>Your Recording:</Text>
                  {item.userAudioUrl ? (
                    <AudioPlayer audioUrl={item.userAudioUrl} />
                  ) : (
                    <Text style={[styles.noAudioText, { color: colors.textSecondary }]}>
                      No recording available
                    </Text>
                  )}
                </View>
              </View>
            ) : (
              <View style={styles.remarksSection}>
                <TestScoreRemarkList
                  remarks={remarks[item.id] || []}
                  isLoading={isLoadingRemarks[item.id] || false}
                  error={remarksError[item.id] || null}
                  isTeacher={false}
                />
              </View>
            )}
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
          {examName} - My Scores
        </Text>
      </View>
      
      {testScores.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="account-voice-off" size={60} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No test scores available
          </Text>
          <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>
            You haven't attempted this exam yet or your recordings were not saved
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
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 16,
  },
  tabText: {
    marginLeft: 4,
    fontWeight: '500',
  },
  audioSection: {
    marginTop: 8,
  },
  remarksSection: {
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

export default MyTestScoresScreen; 