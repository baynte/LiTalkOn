import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Animated, Easing } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faMicrophone, faStop, faCheck } from '@fortawesome/free-solid-svg-icons';
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
  const [recordingComplete, setRecordingComplete] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  // Pulsing animation for recording indicator
  useEffect(() => {
    let animation: Animated.CompositeAnimation;
    
    if (isRecording) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.5,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    } else {
      pulseAnim.setValue(1);
    }

    return () => {
      if (animation) {
        animation.stop();
      }
    };
  }, [isRecording, pulseAnim]);

  // Reset recording complete status when starting a new recording
  useEffect(() => {
    if (isRecording) {
      setRecordingComplete(false);
    }
  }, [isRecording]);

  const handleStartRecording = async () => {
    setRecordingComplete(false);
    await startRecording();
  };

  const handleStopRecording = async () => {
    setIsProcessing(true);
    const uri = await stopRecording();
    if (uri) {
      onRecordingComplete(uri);
      setRecordingComplete(true);
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
        borderWidth: 1,
      }
    ]}>
      {isRecording && (
        <View style={styles.recordingBanner}>
          <Text style={[styles.recordingText, { color: colors.textOnPrimary }]}>
            Recording in progress...
          </Text>
        </View>
      )}
      
      <View style={styles.recordingInfo}>
        {isRecording ? (
          <View style={styles.recordingStatus}>
            <Animated.View 
              style={[
                styles.recordingIndicator, 
                { 
                  backgroundColor: colors.recording,
                  transform: [{ scale: pulseAnim }]
                }
              ]} 
            />
            <Text style={[styles.recordingTime, { color: colors.text }]}>{recordTime}</Text>
          </View>
        ) : recordingComplete ? (
          <View style={styles.recordingStatus}>
            <View style={[styles.completedIndicator, { backgroundColor: colors.success }]}>
              <FontAwesomeIcon icon={faCheck} size={10} color={colors.textOnPrimary} />
            </View>
            <Text style={[styles.recordingComplete, { color: colors.success }]}>
              Recording complete!
            </Text>
          </View>
        ) : null}
      </View>
      
      <View style={styles.controls}>
        {isProcessing ? (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.processingText, { color: colors.textSecondary }]}>
              Processing recording...
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={isRecording ? handleStopRecording : handleStartRecording}
            style={[
              styles.recordButton,
              isRecording 
                ? { backgroundColor: colors.recording } 
                : recordingComplete 
                  ? { backgroundColor: colors.success }
                  : { backgroundColor: colors.primary },
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
          : recordingComplete
            ? 'Your recording is ready for analysis'
            : 'Tap the button to start recording'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginVertical: 8,
    alignItems: 'center',
  },
  recordingBanner: {
    backgroundColor: '#FF4136',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  recordingText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  recordingInfo: {
    height: 40,
    justifyContent: 'center',
    marginBottom: 16,
  },
  recordingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  completedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingTime: {
    fontSize: 18,
    fontWeight: '600',
  },
  recordingComplete: {
    fontSize: 16,
    fontWeight: '600',
  },
  controls: {
    marginVertical: 16,
    height: 80,
    justifyContent: 'center',
  },
  processingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingText: {
    marginTop: 8,
    fontSize: 14,
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
    marginTop: 8,
  },
});

export default AudioRecorder; 