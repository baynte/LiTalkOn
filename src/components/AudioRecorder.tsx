import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faMicrophone, faStop } from '@fortawesome/free-solid-svg-icons';
import { useAudio } from '../hooks/useAudio';
import { useTheme } from '../theme/ThemeProvider';

interface AudioRecorderProps {
  onRecordingComplete: (audioUri: string) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete }) => {
  const theme = useTheme();
  const { colors, borderRadius, shadows } = theme;
  
  const { isRecording, recordTime, startRecording, stopRecording, recordedUri } = useAudio();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStartRecording = async () => {
    await startRecording();
  };

  const handleStopRecording = async () => {
    setIsProcessing(true);
    const uri = await stopRecording();
    if (uri) {
      onRecordingComplete(uri);
    }
    setIsProcessing(false);
  };

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: colors.background,
        borderRadius: borderRadius.md,
        borderColor: colors.border,
      }
    ]}>
      <Text style={[styles.title, { color: colors.text }]}>Record Your Voice</Text>
      
      <View style={styles.recordingInfo}>
        {isRecording && (
          <View style={styles.recordingStatus}>
            <View style={[styles.recordingIndicator, { backgroundColor: colors.recording }]} />
            <Text style={[styles.recordingTime, { color: colors.text }]}>{recordTime}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.controls}>
        {isProcessing ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <TouchableOpacity
            onPress={isRecording ? handleStopRecording : handleStartRecording}
            style={[
              styles.recordButton,
              isRecording ? { backgroundColor: colors.recording } : { backgroundColor: colors.primary },
              shadows.medium
            ]}
          >
            <FontAwesomeIcon
              icon={isRecording ? faStop : faMicrophone}
              size={32}
              color={colors.textOnPrimary}
            />
          </TouchableOpacity>
        )}
      </View>
      
      <Text style={[styles.instructions, { color: colors.textSecondary }]}>
        {isRecording
          ? 'Tap the button to stop recording'
          : 'Tap the button to start recording'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderWidth: 1,
    marginVertical: 8,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  recordingInfo: {
    height: 40,
    justifyContent: 'center',
    marginBottom: 16,
  },
  recordingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  recordingTime: {
    fontSize: 16,
  },
  controls: {
    marginVertical: 16,
    height: 80,
    justifyContent: 'center',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructions: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default AudioRecorder; 