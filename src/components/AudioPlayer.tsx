import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAudio } from '../hooks/useAudio';
import { useTheme } from '../theme/ThemeProvider';

interface AudioPlayerProps {
  audioUrl: string;
  title?: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, title }) => {
  const theme = useTheme();
  const { colors, borderRadius } = theme;
  
  const { isPlaying, playAudio, stopPlaying, pausePlaying, resumePlaying, duration, recordingFileSize } = useAudio();
  const [playbackState, setPlaybackState] = useState<'stopped' | 'playing' | 'paused' | 'loading'>('stopped');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      // Clean up when component unmounts
      if (playbackState !== 'stopped') {
        stopPlaying();
      }
    };
  }, [playbackState, stopPlaying]);

  // Update playback state when isPlaying changes
  useEffect(() => {
    if (!isPlaying && playbackState === 'playing') {
      setPlaybackState('stopped');
    }
  }, [isPlaying, playbackState]);

  const handlePlayPause = () => {
    setError(null);
    
    if (playbackState === 'stopped') {
      try {
        setPlaybackState('loading');
        
        // Check if the file exists and has a valid URL
        if (!audioUrl) {
          setError('No audio file available');
          setPlaybackState('stopped');
          return;
        }
        
        // Verify the URL format
        if (!audioUrl.startsWith('file://') && !audioUrl.startsWith('http://') && !audioUrl.startsWith('https://')) {
          console.warn('Audio URL may not be in the correct format:', audioUrl);
        }
        
        playAudio(audioUrl);
        setPlaybackState('playing');
      } catch (err: any) {
        console.error('Error playing audio:', err);
        setError(err?.message || 'Failed to play audio');
        setPlaybackState('stopped');
      }
    } else if (playbackState === 'playing') {
      pausePlaying();
      setPlaybackState('paused');
    } else if (playbackState === 'paused') {
      resumePlaying();
      setPlaybackState('playing');
    }
  };

  const handleStop = () => {
    stopPlaying();
    setPlaybackState('stopped');
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
      
      <View style={styles.controls}>
        {playbackState === 'loading' ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <TouchableOpacity onPress={handlePlayPause} style={styles.button}>
            <Icon
              name={playbackState === 'playing' ? 'pause' : 'play-arrow'}
              size={32}
              color={playbackState === 'playing' ? colors.playing : colors.primary}
            />
          </TouchableOpacity>
        )}
        
        {playbackState !== 'stopped' && playbackState !== 'loading' && (
          <TouchableOpacity onPress={handleStop} style={styles.button}>
            <Icon name="stop" size={32} color={colors.error} />
          </TouchableOpacity>
        )}
        
        {duration !== '00:00' && (
          <Text style={[styles.duration, { color: colors.textSecondary }]}>
            {duration}
          </Text>
        )}
      </View>
      
      {error && (
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error}
        </Text>
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
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    marginRight: 16,
  },
  duration: {
    fontSize: 14,
    marginLeft: 8,
  },
  errorText: {
    marginTop: 8,
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