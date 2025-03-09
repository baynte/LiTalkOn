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
import { fetchVoiceClips, createPracticeTest } from '../../services/api';
import { VoiceClip } from '../../types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface CreatePracticeTestScreenProps {
  navigation: any;
}

const CreatePracticeTestScreen: React.FC<CreatePracticeTestScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const { colors, spacing, borderRadius } = theme;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [voiceClips, setVoiceClips] = useState<VoiceClip[]>([]);
  const [selectedClipIds, setSelectedClipIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load voice clips
  useEffect(() => {
    const loadVoiceClips = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const clips = await fetchVoiceClips();
        setVoiceClips(clips);
      } catch (err: any) {
        console.error('Error loading voice clips:', err);
        setError(err.message || 'Failed to load voice clips');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadVoiceClips();
  }, []);

  // Toggle voice clip selection
  const toggleClipSelection = (clipId: string) => {
    if (selectedClipIds.includes(clipId)) {
      setSelectedClipIds(selectedClipIds.filter(id => id !== clipId));
    } else {
      setSelectedClipIds([...selectedClipIds, clipId]);
    }
  };

  // Handle create practice test
  const handleCreatePracticeTest = async () => {
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
      await createPracticeTest({
        name: name.trim(),
        description: description.trim(),
        voiceClipIds: selectedClipIds,
      });
      
      Alert.alert(
        'Success',
        'Practice test created successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err: any) {
      console.error('Error creating practice test:', err);
      setError(err.message || 'Failed to create practice test');
      Alert.alert('Error', err.message || 'Failed to create practice test');
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
        <Text style={[styles.title, { color: colors.text }]}>Create Practice Test</Text>
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
            Select Voice Clips * ({selectedClipIds.length || 0} selected)
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
            styles.createButton,
            { backgroundColor: colors.primary },
            (isSubmitting || selectedClipIds.length === 0 || !name.trim()) && styles.disabledButton,
          ]}
          onPress={handleCreatePracticeTest}
          disabled={isSubmitting || selectedClipIds.length === 0 || !name.trim()}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={[styles.createButtonText, { color: '#FFFFFF' }]}>Create Test</Text>
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
  createButton: {
    flex: 2,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  createButtonText: {
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

export default CreatePracticeTestScreen; 