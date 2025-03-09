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
import { fetchPracticeTests } from '../../services/api';
import { PracticeTest } from '../../types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface PracticeTestsScreenProps {
  navigation: any;
}

const PracticeTestsScreen: React.FC<PracticeTestsScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const { colors, spacing, borderRadius } = theme;

  const [practiceTests, setPracticeTests] = useState<PracticeTest[]>([]);
  const [filteredTests, setFilteredTests] = useState<PracticeTest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load practice tests
  const loadPracticeTests = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await fetchPracticeTests();
      setPracticeTests(data);
      setFilteredTests(data);
    } catch (err: any) {
      console.error('Error loading practice tests:', err);
      setError(err.message || 'Failed to load practice tests');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadPracticeTests();
  }, []);

  // Filter tests when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTests(practiceTests);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = practiceTests.filter(
        test => 
          test.name.toLowerCase().includes(query) || 
          test.description.toLowerCase().includes(query)
      );
      setFilteredTests(filtered);
    }
  }, [searchQuery, practiceTests]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadPracticeTests();
  };

  // Render practice test item
  const renderPracticeTestItem = ({ item }: { item: PracticeTest }) => {
    return (
      <TouchableOpacity
        style={[styles.testItem, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => navigation.navigate('PracticeTestDetail', { testId: item.id })}
      >
        <View style={styles.testInfo}>
          <Text style={[styles.testTitle, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.testDescription, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.description}
          </Text>
          <Text style={[styles.testMeta, { color: colors.textSecondary }]}>
            {item.voiceClipIds.length} voice clips • Created on {new Date(item.createdAt).toLocaleDateString()}
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
          onPress={loadPracticeTests}
        >
          <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Practice Tests</Text>
      </View>
      
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Icon name="magnify" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search practice tests..."
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
      
      {/* Practice Tests List */}
      {filteredTests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="book-open-outline" size={60} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {searchQuery.length > 0
              ? 'No practice tests match your search'
              : 'No practice tests available'}
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
          renderItem={renderPracticeTestItem}
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

export default PracticeTestsScreen; 