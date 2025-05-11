import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Sound from 'react-native-sound';
import { TestScoreRemark } from '../types';
import { API_BASE_URL } from '../services/api';
import AudioPlayer from './AudioPlayer';

interface TestScoreRemarkListProps {
  remarks: TestScoreRemark[];
  isLoading: boolean;
  error: string | null;
  onAddRemark?: () => void;
  isTeacher: boolean;
}

const TestScoreRemarkList: React.FC<TestScoreRemarkListProps> = ({
  remarks,
  isLoading,
  error,
  onAddRemark,
  isTeacher,
}) => {
  const theme = useTheme();
  const { colors } = theme;

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Icon name="alert-circle-outline" size={50} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Teacher Remarks</Text>
        {isTeacher && onAddRemark && (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={onAddRemark}
          >
            <Icon name="plus" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Remark</Text>
          </TouchableOpacity>
        )}
      </View>

      {remarks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="comment-text-outline" size={50} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {isTeacher 
              ? 'No remarks added yet. Add a remark to provide feedback to the student.'
              : 'No teacher remarks available for this test attempt.'
            }
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.remarksList}>
          {remarks.map((remark) => (
            <View
              key={remark.id}
              style={[styles.remarkItem, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={styles.remarkHeader}>
                <Text style={[styles.teacherName, { color: colors.primary }]}>
                  {remark.teacher.name}
                </Text>
                <Text style={[styles.remarkDate, { color: colors.textSecondary }]}>
                  {formatDate(remark.created_at)}
                </Text>
              </View>
              
              {remark.remark && remark.remark.trim() !== '' && (
                <Text style={[styles.remarkContent, { color: colors.text }]}>
                  {remark.remark}
                </Text>
              )}
              
              {remark.audio_url && (
                <View style={styles.audioContainer}>
                  <AudioPlayer audioUrl={remark.audio_url} />
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 14,
    textAlign: 'center',
    maxWidth: '80%',
  },
  remarksList: {
    flex: 1,
  },
  remarkItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
  },
  remarkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'center',
  },
  teacherName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  remarkDate: {
    fontSize: 12,
  },
  remarkContent: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  audioContainer: {
    marginTop: 8,
  },
});

export default TestScoreRemarkList; 