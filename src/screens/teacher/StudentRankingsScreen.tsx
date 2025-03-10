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
import { fetchStudentRankings, fetchExamTests } from '../../services/api';
import { StudentRanking, ExamTest } from '../../types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface StudentRankingsScreenProps {
  navigation: any;
}

const StudentRankingsScreen: React.FC<StudentRankingsScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const { colors, spacing, borderRadius } = theme;

  const [rankings, setRankings] = useState<StudentRanking[]>([]);
  const [examTests, setExamTests] = useState<ExamTest[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load rankings and exam tests
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch rankings and exam tests in parallel
      const [rankingsData, examTestsData] = await Promise.all([
        fetchStudentRankings(),
        fetchExamTests()
      ]);
      
      setRankings(rankingsData);
      setExamTests(examTestsData);
      
      // If no exam is selected and we have exams, select the first one
      if (!selectedExamId && examTestsData.length > 0) {
        setSelectedExamId(examTestsData[0].id);
      }
    } catch (err: any) {
      console.error('Error loading rankings data:', err);
      setError(err.message || 'Failed to load rankings data');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Filter rankings by selected exam
  const filteredRankings = selectedExamId
    ? rankings.filter(ranking => ranking.exam_id === selectedExamId)
    : rankings;

  // Sort rankings by score (descending)
  const sortedRankings = [...filteredRankings].sort((a, b) => b.score - a.score);

  // Get selected exam title
  const selectedExamName = selectedExamId
    ? examTests.find(exam => exam.id === selectedExamId)?.name || 'Unknown Exam'
    : 'All Exams';

  // Render exam filter item
  const renderExamFilterItem = ({ item }: { item: ExamTest }) => {
    const isSelected = selectedExamId === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.filterItem,
          {
            backgroundColor: isSelected ? colors.primary : colors.card,
            borderColor: isSelected ? colors.primary : colors.border,
          },
        ]}
        onPress={() => setSelectedExamId(item.id)}
      >
        <Text
          style={[
            styles.filterItemText,
            { color: isSelected ? '#FFFFFF' : colors.text },
          ]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  // Render ranking item
  const renderRankingItem = ({ item, index }: { item: StudentRanking; index: number }) => {
    // Determine medal icon based on rank
    let medalIcon = null;
    let medalColor = '';
    
    if (index === 0) {
      medalIcon = 'medal';
      medalColor = '#FFD700'; // Gold
    } else if (index === 1) {
      medalIcon = 'medal';
      medalColor = '#C0C0C0'; // Silver
    } else if (index === 2) {
      medalIcon = 'medal';
      medalColor = '#CD7F32'; // Bronze
    }
    
    return (
      <View style={[styles.rankingItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.rankContainer}>
          {medalIcon ? (
            <Icon name={medalIcon} size={24} color={medalColor} />
          ) : (
            <Text style={[styles.rankText, { color: colors.text }]}>#{index + 1}</Text>
          )}
        </View>
        
        <View style={styles.studentInfo}>
          <Text style={[styles.studentName, { color: colors.text }]}>{item.student_name}</Text>
          {/* <Text style={[styles.examTitle, { color: colors.textSecondary }]}>
            {item.exam_name}
          </Text> */}
          <Text style={[styles.completedDate, { color: colors.textSecondary }]}>
            Completed on {new Date(item.completed_at).toLocaleDateString()}
          </Text>
        </View>
        
        <View style={styles.scoreContainer}>
          <Text
            style={[
              styles.scoreText,
              {
                color:
                  item.score >= 90
                    ? colors.success
                    : item.score >= 70
                    ? colors.warning
                    : colors.error,
              },
            ]}
          >
            {item.score}%
          </Text>
        </View>
      </View>
    );
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
          onPress={loadData}
        >
          <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Student Rankings</Text>
      </View>
      
      {/* Exam Filters */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[
            styles.filterItem,
            {
              backgroundColor: selectedExamId === null ? colors.primary : colors.card,
              borderColor: selectedExamId === null ? colors.primary : colors.border,
            },
          ]}
          onPress={() => setSelectedExamId(null)}
        >
          <Text
            style={[
              styles.filterItemText,
              { color: selectedExamId === null ? '#FFFFFF' : colors.text },
            ]}
          >
            All Exams
          </Text>
        </TouchableOpacity>
        
        <FlatList
          data={examTests}
          renderItem={renderExamFilterItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
        />
      </View>
      
      {/* Selected Exam Title */}
      <View style={styles.selectedExamContainer}>
        <Text style={[styles.selectedExamTitle, { color: colors.text }]}>
          {selectedExamName}
        </Text>
      </View>
      
      {/* Rankings List */}
      {sortedRankings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="trophy-outline" size={60} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No rankings available
          </Text>
          <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>
            Students haven't completed any exams yet
          </Text>
        </View>
      ) : (
        <FlatList
          data={sortedRankings}
          renderItem={renderRankingItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.rankingsList}
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
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  filtersContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filtersList: {
    paddingRight: 16,
  },
  filterItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  filterItemText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  selectedExamContainer: {
    marginBottom: 16,
  },
  selectedExamTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  rankingsList: {
    paddingBottom: 16,
  },
  rankingItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    alignItems: 'center',
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  studentInfo: {
    flex: 1,
    marginLeft: 8,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  examTitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  completedDate: {
    fontSize: 12,
  },
  scoreContainer: {
    marginLeft: 8,
    alignItems: 'flex-end',
  },
  scoreText: {
    fontSize: 20,
    fontWeight: 'bold',
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

export default StudentRankingsScreen; 