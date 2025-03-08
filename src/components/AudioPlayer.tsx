import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAudio } from '../hooks/useAudio';
import { useTheme } from '../theme/ThemeProvider';
import { formatTime } from '../utils/audioUtils';

interface AudioPlayerProps {
  audioUrl: string;
  title?: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, title }) => {
  const theme = useTheme();
  const { colors, borderRadius } = theme;
  
  const { 
    isPlaying, 
    playTime, 
    duration, 
    playAudio, 
    stopPlaying, 
    pausePlaying, 
    resumePlaying, 
    recordingFileSize
  } = useAudio();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // Reset state when audioUrl changes
  useEffect(() => {
    stopPlaying();
    setError(null);
    setProgress(0);
  }, [audioUrl]);

  // Update progress based on playTime and duration
  useEffect(() => {
    if (duration === '00:00' || playTime === '00:00') {
      setProgress(0);
      return;
    }

    // Convert time strings to seconds for calculation
    const playTimeSeconds = timeStringToSeconds(playTime);
    const durationSeconds = timeStringToSeconds(duration);
    
    if (durationSeconds > 0) {
      setProgress(playTimeSeconds / durationSeconds);
    }
  }, [playTime, duration]);

  // Helper function to convert time string (MM:SS) to seconds
  const timeStringToSeconds = (timeString: string): number => {
    const [minutes, seconds] = timeString.split(':').map(Number);
    return minutes * 60 + seconds;
  };

  const handlePlayPause = () => {
    if (loading) return;

    if (isPlaying) {
      pausePlaying();
    } else {
      if (progress > 0) {
        // Resume if already started
        resumePlaying();
      } else {
        // Start new playback
        setLoading(true);
        setError(null);
        
        try {
          console.log('AudioPlayer: Starting playback of', audioUrl);
          playAudio(audioUrl);
        } catch (err) {
          console.error('AudioPlayer: Error starting playback:', err);
          setError('Failed to play audio');
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const handleStop = () => {
    stopPlaying();
    setProgress(0);
  };

  // Check if the file might be empty or invalid
  // We'll only consider it empty if it's extremely small (less than 50 bytes)
  // and we'll only check for remote files, not local files
  const isEmptyFile = recordingFileSize !== null && 
                     recordingFileSize < 50 && 
                     !audioUrl.startsWith('file://');
  
  // Show a warning if the file might be empty, but only once
  useEffect(() => {
    // We'll skip the warning for local files since they're likely valid
    // if they can be played back
    if (isEmptyFile && 
        audioUrl.includes('user_recording') && 
        !audioUrl.startsWith('file://')) {
      Alert.alert(
        "Small Recording File",
        "The recording file appears to be very small. If you can hear audio when playing it back, please ignore this message.",
        [{ text: "OK" }]
      );
    }
  }, [isEmptyFile, audioUrl]);

  // Render progress bar
  const renderProgressBar = () => {
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${progress * 100}%` }
            ]} 
          />
        </View>
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{playTime}</Text>
          <Text style={styles.timeText}>{duration}</Text>
        </View>
      </View>
    );
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
      {title && <Text style={[styles.title, { color: colors.text }]}>{title}</Text>}
      
      {error ? (
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={24} color="#e74c3c" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <>
          {renderProgressBar()}
          
          <View style={styles.controls}>
            <TouchableOpacity 
              style={styles.controlButton} 
              onPress={handleStop}
              disabled={loading || (!isPlaying && progress === 0)}
            >
              <Icon 
                name="stop" 
                size={32} 
                color={loading || (!isPlaying && progress === 0) ? '#999' : '#333'} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.controlButton, styles.playButton]} 
              onPress={handlePlayPause}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="large" color="#fff" />
              ) : (
                <Icon 
                  name={isPlaying ? "pause" : "play-arrow"} 
                  size={40} 
                  color="#fff" 
                />
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
      
      {isEmptyFile && !audioUrl.startsWith('file://') && (
        <Text style={[styles.warningText, { color: colors.warning }]}>
          Warning: This recording may be small (file size: {recordingFileSize} bytes)
        </Text>
      )}
      
      {audioUrl && (
        <Text 
          style={[styles.fileInfo, { color: colors.textSecondary }]}
          numberOfLines={1}
          ellipsizeMode="middle"
        >
          {audioUrl}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderWidth: 1,
    marginVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBackground: {
    height: 8,
    backgroundColor: '#ddd',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3498db',
    borderRadius: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButton: {
    padding: 8,
    borderRadius: 30,
    marginHorizontal: 16,
  },
  playButton: {
    backgroundColor: '#3498db',
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  errorText: {
    color: '#e74c3c',
    marginLeft: 8,
    fontSize: 14,
  },
  warningText: {
    marginTop: 8,
    fontSize: 12,
  },
  fileInfo: {
    marginTop: 8,
    fontSize: 10,
    opacity: 0.7,
  },
});

export default AudioPlayer; 