import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { fetchPracticeTests, fetchExamTests, fetchStudentRankings } from '../../services/api';
import { PracticeTest, ExamTest, StudentRanking } from '../../types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { logout } from '../../services/auth';

interface TeacherDashboardScreenProps {
  navigation: any;
}

const TeacherDashboardScreen: React.FC<TeacherDashboardScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const { colors, spacing, borderRadius } = theme;

  const [practiceTests, setPracticeTests] = useState<PracticeTest[]>([]);
  const [examTests, setExamTests] = useState<ExamTest[]>([]);
  const [topStudents, setTopStudents] = useState<StudentRanking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch all data in parallel
        const [practiceTestsData, examTestsData, rankingsData] = await Promise.all([
          fetchPracticeTests(),
          fetchExamTests(),
          fetchStudentRankings()
        ]);
        
        setPracticeTests(practiceTestsData);
        setExamTests(examTestsData);
        
        // Sort rankings by score (descending) and take top 5
        const sortedRankings = rankingsData.sort((a, b) => b.score - a.score).slice(0, 5);
        setTopStudents(sortedRankings);
      } catch (err: any) {
        console.error('Error loading dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDashboardData();
  }, []);

  // Handle logout
  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (err: any) {
              console.error('Error during logout:', err);
              Alert.alert('Error', err.message || 'Failed to logout');
            }
          },
        },
      ],
      { cancelable: true }
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
          onPress={() => navigation.replace('TeacherDashboard')}
        >
          <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={[styles.headerTitle, { color: colors.textOnPrimary }]}>Teacher Dashboard</Text>
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
        >
          <Icon name="logout" size={24} color={colors.textOnPrimary} />
        </TouchableOpacity>
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
        
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Icon name="account-group" size={30} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Students</Text>
          <Text style={[styles.cardValue, { color: colors.primary }]}>{topStudents.length}</Text>
        </View>
      </View>
      
      {/* Top Students Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Students</Text>
        
        {topStudents.length > 0 ? (
          topStudents.map((student, index) => (
            <View 
              key={student.id} 
              style={[
                styles.studentItem, 
                { backgroundColor: colors.card, borderColor: colors.border }
              ]}
            >
              <View style={styles.rankContainer}>
                <Text style={[styles.rankText, { color: colors.primary }]}>#{index + 1}</Text>
              </View>
              <View style={styles.studentInfo}>
                <Text style={[styles.studentName, { color: colors.text }]}>{student.student_name}</Text>
                {/* <Text style={[styles.examTitle, { color: colors.textSecondary }]}>{student.exam_name}</Text> */}
              </View>
              <Text style={[styles.scoreText, { color: colors.success }]}>{student.score}%</Text>
            </View>
          ))
        ) : (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No student rankings available yet
          </Text>
        )}
      </View>
      
      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('PracticeTests', { screen: 'CreatePracticeTest' })}
          >
            <Icon name="plus" size={20} color="#FFFFFF" />
            <Text style={[styles.actionText, { color: '#FFFFFF' }]}>New Practice Test</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.secondary }]}
            onPress={() => navigation.navigate('ExamTests', { screen: 'CreateExamTest' })}
          >
            <Icon name="plus" size={20} color="#FFFFFF" />
            <Text style={[styles.actionText, { color: '#FFFFFF' }]}>New Exam Test</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: 8,
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
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
  },
  examTitle: {
    fontSize: 14,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    fontStyle: 'italic',
    padding: 16,
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

export default TeacherDashboardScreen; 