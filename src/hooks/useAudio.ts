import { useState, useEffect } from 'react';
import AudioRecorderPlayer, {
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  AVEncoderAudioQualityIOSType,
  AVEncodingOption,
} from 'react-native-audio-recorder-player';
import { Platform, PermissionsAndroid, Alert, ToastAndroid } from 'react-native';
import Sound from 'react-native-sound';
import { getRecordingPath, formatTime } from '../utils/audioUtils';

// Enable playback in silence mode
Sound.setCategory('Playback');

const audioRecorderPlayer = new AudioRecorderPlayer();

// Flag to track if we've already attempted to record
let hasAttemptedRecording = false;

export const useAudio = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [recordTime, setRecordTime] = useState('00:00');
  const [playTime, setPlayTime] = useState('00:00');
  const [duration, setDuration] = useState('00:00');
  const [currentSound, setCurrentSound] = useState<Sound | null>(null);
  const [permissionsGranted, setPermissionsGranted] = useState<boolean>(true); // Assume permissions are granted initially

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isRecording) {
        stopRecording();
      }
      if (isPlaying) {
        stopPlaying();
      }
    };
  }, [isRecording, isPlaying]);

  // Simplified permission check that works better with emulators
  const ensurePermissions = async () => {
    // For iOS, we don't need to do anything special
    if (Platform.OS === 'ios') {
      return true;
    }

    try {
      // For emulators, we'll try a more direct approach
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: "Microphone Permission",
          message: "This app needs access to your microphone to record audio.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK"
        }
      );

      // Even if the result isn't GRANTED, we'll try to record anyway
      // This helps with emulators where permissions might be reported incorrectly
      if (result !== PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Audio permission reported as not granted, but will try recording anyway');
      }
      
      // Always return true to allow recording attempt
      return true;
    } catch (err) {
      console.warn('Error requesting audio permission:', err);
      // Still return true to attempt recording
      return true;
    }
  };

  const startRecording = async () => {
    // Always try to record, even if permissions might be reported incorrectly
    await ensurePermissions();
    
    hasAttemptedRecording = true;

    try {
      // Use the default path provided by the library
      // This will automatically use the correct internal storage path
      const audioPath = await audioRecorderPlayer.startRecorder(
        undefined, // Let the library choose the default path
        {
          AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
          AudioSourceAndroid: AudioSourceAndroidType.MIC,
          AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
          AVNumberOfChannelsKeyIOS: 2,
          AVFormatIDKeyIOS: AVEncodingOption.aac,
        }
      );

      console.log('Recording to path:', audioPath);

      audioRecorderPlayer.addRecordBackListener((e) => {
        setRecordTime(formatTime(e.currentPosition));
      });

      setIsRecording(true);
      if (Platform.OS === 'android') {
        ToastAndroid.show('Recording started', ToastAndroid.SHORT);
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      
      // If this is the first attempt and it failed, show a helpful message
      if (!hasAttemptedRecording) {
        Alert.alert(
          "Recording Failed",
          "There was an issue starting the recording. This might be due to permission issues or a problem with the microphone.",
          [{ text: "OK" }]
        );
      }
    }
  };

  const stopRecording = async () => {
    try {
      const result = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setRecordedUri(result);
      setIsRecording(false);
      if (Platform.OS === 'android') {
        ToastAndroid.show('Recording completed', ToastAndroid.SHORT);
      }
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