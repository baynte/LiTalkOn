import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { fetchVoiceClips, getPracticeTestById, updatePracticeTest } from '../../services/api';
import { VoiceClip, PracticeTest } from '../../types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface EditPracticeTestScreenProps {
  navigation: any;
  route: any;
}

const EditPracticeTestScreen: React.FC<EditPracticeTestScreenProps> = ({ navigation, route }) => {
  const { testId } = route.params;
  const theme = useTheme();
  const { colors, spacing, borderRadius } = theme;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [voiceClips, setVoiceClips] = useState<VoiceClip[]>([]);
  const [selectedClipIds, setSelectedClipIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load practice test and voice clips
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch practice test and voice clips in parallel
        const [practiceTest, clips] = await Promise.all([
          getPracticeTestById(testId),
          fetchVoiceClips()
        ]);
        
        // Set form data
        setName(practiceTest.name);
        setDescription(practiceTest.description);
        console.warn("practiceTest.voiceClipIds", practiceTest.voiceClipIds);
        setSelectedClipIds(practiceTest.voiceClipIds || []);
        setVoiceClips(clips);
      } catch (err: any) {
        console.error('Error loading data:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [testId]);

  // Toggle voice clip selection
  const toggleClipSelection = (clipId: string) => {
    if (selectedClipIds.includes(clipId)) {
      setSelectedClipIds(selectedClipIds.filter(id => id !== clipId));
    } else {
      setSelectedClipIds([...selectedClipIds, clipId]);
    }
  };

  // Handle update practice test
  const handleUpdatePracticeTest = async () => {
    // Validate inputs
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name for the practice test');
      return;
    }
    
    if (selectedClipIds.length === 0) {
      Alert.alert('Error', 'Please select at least one voice clip');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await updatePracticeTest(testId, {
        name: name.trim(),
        description: description.trim(),
        voiceClipIds: selectedClipIds,
      });
      
      Alert.alert(
        'Success',
        'Practice test updated successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err: any) {
      console.error('Error updating practice test:', err);
      setError(err.message || 'Failed to update practice test');
      Alert.alert('Error', err.message || 'Failed to update practice test');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render voice clip item
  const renderVoiceClipItem = ({ item }: { item: VoiceClip }) => {
    const isSelected = selectedClipIds.includes(item.id);
    
    return (
      <TouchableOpacity
        style={[
          styles.clipItem,
          {
            backgroundColor: isSelected ? colors.primaryLight : colors.card,
            borderColor: isSelected ? colors.primary : colors.border,
          },
        ]}
        onPress={() => toggleClipSelection(item.id)}
      >
        <View style={styles.clipInfo}>
          <Text style={[styles.clipTitle, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.clipDescription, { color: colors.textSecondary }]}>
            {item.description}
          </Text>
        </View>
        <View style={styles.checkboxContainer}>
          {isSelected ? (
            <Icon name="checkbox-marked" size={24} color={colors.primary} />
          ) : (
            <Icon name="checkbox-blank-outline" size={24} color={colors.textSecondary} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error && !voiceClips.length) {
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

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Edit Practice Test</Text>
      </View>
      
      {/* Form */}
      <View style={styles.form}>
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Name *</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="Enter practice test name"
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Description</Text>
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="Enter practice test description"
            placeholderTextColor={colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            Select Voice Clips * ({selectedClipIds.length} selected)
          </Text>
          
          {voiceClips.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="microphone-off" size={40} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No voice clips available
              </Text>
            </View>
          ) : (
            <FlatList
              data={voiceClips}
              renderItem={renderVoiceClipItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              style={styles.clipsList}
            />
          )}
        </View>
      </View>
      
      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.cancelButton, { borderColor: colors.border }]}
          onPress={() => navigation.goBack()}
          disabled={isSubmitting}
        >
          <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.updateButton,
            { backgroundColor: colors.primary },
            (isSubmitting || selectedClipIds.length === 0 || !name.trim()) && styles.disabledButton,
          ]}
          onPress={handleUpdatePracticeTest}
          disabled={isSubmitting || selectedClipIds.length === 0 || !name.trim()}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={[styles.updateButtonText, { color: '#FFFFFF' }]}>Update Test</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  form: {
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    minHeight: 100,
  },
  clipsList: {
    marginTop: 8,
  },
  clipItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
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
  checkboxContainer: {
    justifyContent: 'center',
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  updateButton: {
    flex: 2,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
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

export default EditPracticeTestScreen; 