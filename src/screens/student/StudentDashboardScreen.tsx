import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { fetchPracticeTests, fetchExamTests } from '../../services/api';
import { PracticeTest, ExamTest } from '../../types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface StudentDashboardScreenProps {
  navigation: any;
}

const StudentDashboardScreen: React.FC<StudentDashboardScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const { colors, spacing, borderRadius } = theme;

  const [practiceTests, setPracticeTests] = useState<PracticeTest[]>([]);
  const [examTests, setExamTests] = useState<ExamTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch all data in parallel
        const [practiceTestsData, examTestsData] = await Promise.all([
          fetchPracticeTests(),
          fetchExamTests()
        ]);
        
        setPracticeTests(practiceTestsData);
        setExamTests(examTestsData);
      } catch (err: any) {
        console.error('Error loading dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDashboardData();
  }, []);

  // Get recent practice tests (last 3)
  const recentPracticeTests = [...practiceTests]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  // Get recent exam tests (last 3)
  const recentExamTests = [...examTests]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

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
          onPress={() => navigation.replace('Dashboard')}
        >
          <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Student Dashboard</Text>
      </View>
      
      {/* Summary Cards */}
      <View style={styles.cardsContainer}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Icon name="book-open-variant" size={30} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Practice Tests</Text>
          <Text style={[styles.cardValue, { color: colors.primary }]}>{practiceTests.length}</Text>
        </View>
        
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Icon name="clipboard-text" size={30} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Exam Tests</Text>
          <Text style={[styles.cardValue, { color: colors.primary }]}>{examTests.length}</Text>
        </View>
      </View>
      
      {/* Recent Practice Tests */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Practice Tests</Text>
          <TouchableOpacity onPress={() => navigation.navigate('PracticeTests')}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {recentPracticeTests.length > 0 ? (
          recentPracticeTests.map((test) => (
            <TouchableOpacity
              key={test.id}
              style={[styles.testItem, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => navigation.navigate('PracticeTests', {
                screen: 'PracticeTestDetail',
                params: { testId: test.id }
              })}
            >
              <View style={styles.testInfo}>
                <Text style={[styles.testTitle, { color: colors.text }]}>{test.name}</Text>
                <Text style={[styles.testDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                  {test.description}
                </Text>
                <Text style={[styles.testMeta, { color: colors.textSecondary }]}>
                  {test.voiceClipIds.length} voice clips • Created on {new Date(test.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Icon name="chevron-right" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          ))
        ) : (
          <View style={[styles.emptyContainer, { borderColor: colors.border }]}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No practice tests available
            </Text>
          </View>
        )}
      </View>
      
      {/* Recent Exam Tests */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Exam Tests</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ExamTests')}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {recentExamTests.length > 0 ? (
          recentExamTests.map((test) => (
            <TouchableOpacity
              key={test.id}
              style={[styles.testItem, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => navigation.navigate('ExamTests', {
                screen: 'ExamTestDetail',
                params: { testId: test.id }
              })}
            >
              <View style={styles.testInfo}>
                <Text style={[styles.testTitle, { color: colors.text }]}>{test.name}</Text>
                <Text style={[styles.testDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                  {test.description}
                </Text>
                <Text style={[styles.testMeta, { color: colors.textSecondary }]}>
                  {test.voiceClipIds.length} voice clips • 
                  {test.timeLimit ? ` ${test.timeLimit} minutes` : ' No time limit'} • 
                  Created on {new Date(test.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Icon name="chevron-right" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          ))
        ) : (
          <View style={[styles.emptyContainer, { borderColor: colors.border }]}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No exam tests available
            </Text>
          </View>
        )}
      </View>
      
      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('PracticeTests')}
          >
            <Icon name="microphone" size={20} color="#FFFFFF" />
            <Text style={[styles.actionText, { color: '#FFFFFF' }]}>Practice Now</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.secondary }]}
            onPress={() => navigation.navigate('ExamTests')}
          >
            <Icon name="clipboard-check" size={20} color="#FFFFFF" />
            <Text style={[styles.actionText, { color: '#FFFFFF' }]}>Take Exam</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  card: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  cardTitle: {
    fontSize: 14,
    marginTop: 8,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  testItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  testInfo: {
    flex: 1,
  },
  testTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  testDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  testMeta: {
    fontSize: 12,
  },
  emptyContainer: {
    padding: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  actionText: {
    marginLeft: 8,
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

export default StudentDashboardScreen; 