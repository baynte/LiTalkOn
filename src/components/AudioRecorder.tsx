import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faMicrophone, faStop } from '@fortawesome/free-solid-svg-icons';
import { useAudio } from '../hooks/useAudio';

interface AudioRecorderProps {
  onRecordingComplete: (audioUri: string) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete }) => {
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
    <View style={styles.container}>
      <Text style={styles.title}>Record Your Voice</Text>
      
      <View style={styles.recordingInfo}>
        {isRecording && (
          <View style={styles.recordingStatus}>
            <View style={styles.recordingIndicator} />
            <Text style={styles.recordingTime}>{recordTime}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.controls}>
        {isProcessing ? (
          <ActivityIndicator size="large" color="#007AFF" />
        ) : (
          <TouchableOpacity
            onPress={isRecording ? handleStopRecording : handleStartRecording}
            style={[
              styles.recordButton,
              { backgroundColor: isRecording ? '#FF3B30' : '#007AFF' }
            ]}
          >
            <FontAwesomeIcon
              icon={isRecording ? faStop : faMicrophone}
              size={32}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        )}
      </View>
      
      <Text style={styles.instructions}>
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
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
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
    backgroundColor: '#FF3B30',
    marginRight: 8,
  },
  recordingTime: {
    fontSize: 16,
    color: '#333',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  instructions: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default AudioRecorder; 