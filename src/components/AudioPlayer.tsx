import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
  
  const { isPlaying, playAudio, stopPlaying, pausePlaying, resumePlaying } = useAudio();
  const [playbackState, setPlaybackState] = useState<'stopped' | 'playing' | 'paused'>('stopped');

  useEffect(() => {
    return () => {
      // Clean up when component unmounts
      if (playbackState !== 'stopped') {
        stopPlaying();
      }
    };
  }, [playbackState, stopPlaying]);

  const handlePlayPause = () => {
    if (playbackState === 'stopped') {
      playAudio(audioUrl);
      setPlaybackState('playing');
    } else if (playbackState === 'playing') {
      pausePlaying();
      setPlaybackState('paused');
    } else {
      resumePlaying();
      setPlaybackState('playing');
    }
  };

  const handleStop = () => {
    stopPlaying();
    setPlaybackState('stopped');
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
      <View style={styles.controls}>
        <TouchableOpacity onPress={handlePlayPause} style={styles.button}>
          <Icon
            name={playbackState === 'playing' ? 'pause' : 'play-arrow'}
            size={32}
            color={playbackState === 'playing' ? colors.playing : colors.primary}
          />
        </TouchableOpacity>
        {playbackState !== 'stopped' && (
          <TouchableOpacity onPress={handleStop} style={styles.button}>
            <Icon name="stop" size={32} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>
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
});

export default AudioPlayer; 