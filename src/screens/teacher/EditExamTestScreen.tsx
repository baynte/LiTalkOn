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
  Switch,
  Modal,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { fetchVoiceClips, getExamTestById, updateExamTest, getExamRemarks, addExamRemark } from '../../services/api';
import { VoiceClip, ExamTest } from '../../types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ExamRemarkList from '../../components/ExamRemarkList';
import ExamRemarkRecorder from '../../components/ExamRemarkRecorder';
import { ExamRemark } from '../../components/ExamRemarkList';

interface EditExamTestScreenProps {
  route: any;
  navigation: any;
}

const EditExamTestScreen: React.FC<EditExamTestScreenProps> = ({ route, navigation }) => {
  const theme = useTheme();
  const { colors, spacing, borderRadius } = theme;
  const { examId } = route.params || {};

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [voiceClips, setVoiceClips] = useState<VoiceClip[]>([]);
  const [selectedClipIds, setSelectedClipIds] = useState<string[]>([]);
  const [hasTimeLimit, setHasTimeLimit] = useState(false);
  const [timeLimit, setTimeLimit] = useState('60'); // Default to 60 minutes
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRemarkTab, setShowRemarkTab] = useState(false);
  const [remarks, setRemarks] = useState<ExamRemark[]>([]);
  const [isLoadingRemarks, setIsLoadingRemarks] = useState(false);
  const [remarksError, setRemarksError] = useState<string | null>(null);
  const [showRemarkRecorder, setShowRemarkRecorder] = useState(false);
  const [isSubmittingRemark, setIsSubmittingRemark] = useState(false);

  // Load exam test and voice clips
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Load voice clips
        const clips = await fetchVoiceClips();
        setVoiceClips(clips);
        
        // Load exam test details
        if (examId) {
          const examTest = await getExamTestById(examId);
          
          setName(examTest.name);
          setDescription(examTest.description || '');
          setSelectedClipIds(examTest.voiceClipIds || []);
          
          if (examTest.timeLimit) {
            setHasTimeLimit(true);
            setTimeLimit(examTest.timeLimit.toString());
          }
        }
      } catch (err: any) {
        console.error('Error loading data:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [examId]);

  // Load exam remarks
  useEffect(() => {
    if (showRemarkTab && examId) {
      loadRemarks();
    }
  }, [showRemarkTab, examId]);

  const loadRemarks = async () => {
    if (!examId) return;
    
    setIsLoadingRemarks(true);
    setRemarksError(null);
    
    try {
      const fetchedRemarks = await getExamRemarks(examId);
      setRemarks(fetchedRemarks);
    } catch (error: any) {
      console.error('Error loading remarks:', error);
      setRemarksError(error.message || 'Failed to load remarks');
    } finally {
      setIsLoadingRemarks(false);
    }
  };

  // Toggle voice clip selection
  const toggleClipSelection = (clipId: string) => {
    if (selectedClipIds.includes(clipId)) {
      setSelectedClipIds(selectedClipIds.filter(id => id !== clipId));
    } else {
      setSelectedClipIds([...selectedClipIds, clipId]);
    }
  };

  // Handle time limit input
  const handleTimeLimitChange = (text: string) => {
    // Only allow numbers
    const numericValue = text.replace(/[^0-9]/g, '');
    setTimeLimit(numericValue);
  };

  // Handle update exam test
  const handleUpdateExamTest = async () => {
    // Validate inputs
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name for the exam test');
      return;
    }
    
    if (selectedClipIds.length === 0) {
      Alert.alert('Error', 'Please select at least one voice clip');
      return;
    }
    
    if (hasTimeLimit && (!timeLimit || parseInt(timeLimit) <= 0)) {
      Alert.alert('Error', 'Please enter a valid time limit');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await updateExamTest(examId, {
        name: name.trim(),
        description: description.trim(),
        voiceClipIds: selectedClipIds,
        timeLimit: hasTimeLimit ? parseInt(timeLimit) : undefined,
      });
      
      Alert.alert(
        'Success',
        'Exam test updated successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err: any) {
      console.error('Error updating exam test:', err);
      setError(err.message || 'Failed to update exam test');
      Alert.alert('Error', err.message || 'Failed to update exam test');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveRemark = async (content: string, audioFile: any) => {
    if (!examId) return;
    
    setIsSubmittingRemark(true);
    
    try {
      // Create form data
      const formData = new FormData();
      if (content) {
        formData.append('content', content);
      }
      if (audioFile) {
        formData.append('audioFile', audioFile);
      }
      
      // Upload the remark
      await addExamRemark(examId, formData);
      
      // Close recorder modal
      setShowRemarkRecorder(false);
      
      // Reload remarks
      await loadRemarks();
      
      // Show success message
      Alert.alert('Success', 'Remark added successfully');
    } catch (error: any) {
      console.error('Error adding remark:', error);
      Alert.alert('Error', error.message || 'Failed to add remark');
    } finally {
      setIsSubmittingRemark(false);
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
          <Text style={[styles.clipTitle, { color: colors.text }]}>{item.title}</Text>
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

  // Render loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Render error state
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            !showRemarkTab && { backgroundColor: colors.primary },
          ]}
          onPress={() => setShowRemarkTab(false)}
        >
          <Text
            style={[
              styles.tabText,
              { color: showRemarkTab ? colors.text : '#FFFFFF' },
            ]}
          >
            Test Details
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            showRemarkTab && { backgroundColor: colors.primary },
          ]}
          onPress={() => setShowRemarkTab(true)}
        >
          <Text
            style={[
              styles.tabText,
              { color: !showRemarkTab ? colors.text : '#FFFFFF' },
            ]}
          >
            Remarks
          </Text>
        </TouchableOpacity>
      </View>

      {showRemarkTab ? (
        <ExamRemarkList
          remarks={remarks}
          isLoading={isLoadingRemarks}
          error={remarksError}
          onAddRemark={() => setShowRemarkRecorder(true)}
          isTeacher={true}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Edit Exam Test</Text>
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
                placeholder="Enter exam test name"
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
                placeholder="Enter exam test description"
                placeholderTextColor={colors.textSecondary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
            
            <View style={styles.formGroup}>
              <View style={styles.switchContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Time Limit</Text>
                <Switch
                  value={hasTimeLimit}
                  onValueChange={setHasTimeLimit}
                  trackColor={{ false: colors.border, true: colors.primaryLight }}
                  thumbColor={hasTimeLimit ? colors.primary : colors.textSecondary}
                />
              </View>
              
              {hasTimeLimit && (
                <View style={styles.timeLimitContainer}>
                  <TextInput
                    style={[
                      styles.timeLimitInput,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                    placeholder="Enter time limit"
                    placeholderTextColor={colors.textSecondary}
                    value={timeLimit}
                    onChangeText={handleTimeLimitChange}
                    keyboardType="numeric"
                  />
                  <Text style={[styles.timeLimitLabel, { color: colors.text }]}>minutes</Text>
                </View>
              )}
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Voice Clips *</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Select one or more voice clips for this exam test
              </Text>
              
              <FlatList
                data={voiceClips}
                renderItem={renderVoiceClipItem}
                keyExtractor={(item) => item.id}
                style={styles.clipsList}
                scrollEnabled={false}
              />
            </View>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => navigation.goBack()}
                disabled={isSubmitting}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleUpdateExamTest}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={[styles.saveButtonText, { color: '#FFFFFF' }]}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Remark Recorder Modal */}
      <Modal
        visible={showRemarkRecorder}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRemarkRecorder(false)}
      >
        <View style={styles.modalOverlay}>
          <ExamRemarkRecorder
            onSaveRemark={handleSaveRemark}
            onCancel={() => setShowRemarkRecorder(false)}
            isSubmitting={isSubmittingRemark}
          />
        </View>
      </Modal>
    </View>
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
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  form: {
    gap: 20,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    minHeight: 100,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeLimitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  timeLimitInput: {
    width: 80,
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    textAlign: 'center',
  },
  timeLimitLabel: {
    fontSize: 16,
  },
  clipsList: {
    marginTop: 8,
  },
  clipItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '500',
  },
  clipDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  checkboxContainer: {
    marginLeft: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    flex: 2,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  button: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    padding: 8,
  },
  tab: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  tabText: {
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});

export default EditExamTestScreen; 