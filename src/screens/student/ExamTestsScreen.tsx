import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { fetchExamTests } from '../../services/api';
import { ExamTest } from '../../types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface ExamTestsScreenProps {
  navigation: any;
}

const ExamTestsScreen: React.FC<ExamTestsScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const { colors, spacing, borderRadius } = theme;

  const [examTests, setExamTests] = useState<ExamTest[]>([]);
  const [filteredTests, setFilteredTests] = useState<ExamTest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load exam tests
  const loadExamTests = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await fetchExamTests();
      setExamTests(data);
      setFilteredTests(data);
    } catch (err: any) {
      console.error('Error loading exam tests:', err);
      setError(err.message || 'Failed to load exam tests');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadExamTests();
  }, []);

  // Filter tests when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTests(examTests);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = examTests.filter(
        test => 
          test.name.toLowerCase().includes(query) || 
          test.description.toLowerCase().includes(query)
      );
      setFilteredTests(filtered);
    }
  }, [searchQuery, examTests]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadExamTests();
  };

  // Format time limit
  const formatTimeLimit = (minutes?: number) => {
    if (!minutes) return 'No time limit';
    
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      
      if (remainingMinutes === 0) {
        return `${hours} hour${hours !== 1 ? 's' : ''}`;
      } else {
        return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
      }
    }
  };

  // Render exam test item
  const renderExamTestItem = ({ item }: { item: ExamTest }) => {
    return (
      <TouchableOpacity
        style={[styles.testItem, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => navigation.navigate('ExamTestDetail', { testId: item.id })}
      >
        <View style={styles.testInfo}>
          <Text style={[styles.testTitle, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.testDescription, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.description}
          </Text>
          <Text style={[styles.testMeta, { color: colors.textSecondary }]}>
            {item.voiceClipIds.length} voice clips • {formatTimeLimit(item.timeLimit)}
          </Text>
          <Text style={[styles.testMeta, { color: colors.textSecondary }]}>
            Created on {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <Icon name="chevron-right" size={24} color={colors.textSecondary} />
      </TouchableOpacity>
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
          onPress={loadExamTests}
        >
          <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Exam Tests</Text>
      </View>
      
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Icon name="magnify" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search exam tests..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Exam Tests List */}
      {filteredTests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="clipboard-text-outline" size={60} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {searchQuery.length > 0
              ? 'No exam tests match your search'
              : 'No exam tests available'}
          </Text>
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={[styles.clearSearchText, { color: colors.primary }]}>
                Clear search
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredTests}
          renderItem={renderExamTestItem}
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
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    height: 48,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 16,
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
    marginBottom: 4,
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
  clearSearchText: {
    fontSize: 16,
    fontWeight: 'bold',
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

export default ExamTestsScreen; 