import { useState, useEffect } from 'react';
import AudioRecorderPlayer, {
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  AVEncoderAudioQualityIOSType,
  AVEncodingOption,
} from 'react-native-audio-recorder-player';
import { Platform, PermissionsAndroid } from 'react-native';
import Sound from 'react-native-sound';
import { getRecordingPath, formatTime } from '../utils/audioUtils';

// Enable playback in silence mode
Sound.setCategory('Playback');

const audioRecorderPlayer = new AudioRecorderPlayer();

export const useAudio = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [recordTime, setRecordTime] = useState('00:00');
  const [playTime, setPlayTime] = useState('00:00');
  const [duration, setDuration] = useState('00:00');
  const [currentSound, setCurrentSound] = useState<Sound | null>(null);

  useEffect(() => {
    // Clean up on unmount
    return () => {
      if (isRecording) {
        stopRecording();
      }
      if (isPlaying) {
        stopPlaying();
      }
    };
  }, [isRecording, isPlaying]);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);

        if (
          grants['android.permission.WRITE_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED &&
          grants['android.permission.READ_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED &&
          grants['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED
        ) {
          return true;
        } else {
          console.log('All required permissions not granted');
          return false;
        }
      } catch (err) {
        console.warn(err);
        return false;
      }
    } else {
      return true; // iOS handles permissions differently
    }
  };

  const startRecording = async () => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) {
      console.log('Permissions not granted');
      return;
    }

    const audioPath = getRecordingPath();

    try {
      await audioRecorderPlayer.startRecorder(
        audioPath,
        {
          AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
          AudioSourceAndroid: AudioSourceAndroidType.MIC,
          AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
          AVNumberOfChannelsKeyIOS: 2,
          AVFormatIDKeyIOS: AVEncodingOption.aac,
        }
      );

      audioRecorderPlayer.addRecordBackListener((e) => {
        setRecordTime(formatTime(e.currentPosition));
      });

      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = async () => {
    try {
      const result = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setRecordedUri(result);
      setIsRecording(false);
      return result;
    } catch (error) {
      console.error('Error stopping recording:', error);
      return null;
    }
  };

  const playAudio = (uri: string) => {
    if (isPlaying) {
      stopPlaying();
    }

    const sound = new Sound(uri, '', (error) => {
      if (error) {
        console.error('Error loading sound:', error);
        return;
      }

      setDuration(formatTime(sound.getDuration() * 1000));
      setCurrentSound(sound);

      sound.play((success) => {
        if (success) {
          console.log('Successfully finished playing');
        } else {
          console.log('Playback failed due to audio decoding errors');
        }
        setIsPlaying(false);
      });

      setIsPlaying(true);
    });
  };

  const stopPlaying = () => {
    if (currentSound) {
      currentSound.stop();
      currentSound.release();
      setCurrentSound(null);
    }
    setIsPlaying(false);
  };

  const pausePlaying = () => {
    if (currentSound) {
      currentSound.pause();
      setIsPlaying(false);
    }
  };

  const resumePlaying = () => {
    if (currentSound) {
      currentSound.play();
      setIsPlaying(true);
    }
  };

  return {
    isRecording,
    isPlaying,
    recordedUri,
    recordTime,
    playTime,
    duration,
    startRecording,
    stopRecording,
    playAudio,
    stopPlaying,
    pausePlaying,
    resumePlaying,
  };
}; 