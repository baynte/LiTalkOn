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
import { fetchPracticeTests, deletePracticeTest } from '../../services/api';
import { PracticeTest } from '../../types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface PracticeTestListScreenProps {
  navigation: any;
  route: any;
}

const PracticeTestListScreen: React.FC<PracticeTestListScreenProps> = ({ navigation, route }) => {
  const theme = useTheme();
  const { colors, spacing, borderRadius } = theme;

  const [practiceTests, setPracticeTests] = useState<PracticeTest[]>([]);
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

  // Refresh when returning to this screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadPracticeTests();
    });

    return unsubscribe;
  }, [navigation]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadPracticeTests();
  };

  // Handle delete
  const handleDelete = (test: PracticeTest) => {
    Alert.alert(
      'Delete Practice Test',
      `Are you sure you want to delete "${test.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePracticeTest(test.id);
              // Remove from state
              setPracticeTests(practiceTests.filter(t => t.id !== test.id));
              Alert.alert('Success', 'Practice test deleted successfully');
            } catch (err: any) {
              console.error('Error deleting practice test:', err);
              Alert.alert('Error', err.message || 'Failed to delete practice test');
            }
          },
        },
      ]
    );
  };

  // Render practice test item
  const renderPracticeTestItem = ({ item }: { item: any }) => {
    return (
      <View style={[styles.testItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.testInfo}>
          <Text style={[styles.testTitle, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.testDescription, { color: colors.textSecondary }]}>
            {item.description}
          </Text>
          <Text style={[styles.testMeta, { color: colors.textSecondary }]}>
            {item.voiceClipIds.length} voice clips • Created on {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('EditPracticeTest', { testId: item.id })}
          >
            <Icon name="pencil" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.error }]}
            onPress={() => handleDelete(item)}
          >
            <Icon name="delete" size={20} color="#FFFFFF" />
          </TouchableOpacity>
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
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('CreatePracticeTest')}
        >
          <Icon name="plus" size={20} color="#FFFFFF" />
          <Text style={[styles.createButtonText, { color: '#FFFFFF' }]}>Create</Text>
        </TouchableOpacity>
      </View>
      
      {practiceTests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="book-open-outline" size={60} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No practice tests available
          </Text>
          <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>
            Create your first practice test by tapping the Create button
          </Text>
        </View>
      ) : (
        <FlatList
          data={practiceTests}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  createButtonText: {
    marginLeft: 8,
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: 16,
  },
  testItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  testInfo: {
    flex: 1,
  },
  testTitle: {
    fontSize: 18,
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
  actionsContainer: {
    justifyContent: 'space-around',
    marginLeft: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
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

export default PracticeTestListScreen; 