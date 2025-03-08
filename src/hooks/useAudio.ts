import { useState, useEffect } from 'react';
import AudioRecorderPlayer, {
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  AVEncoderAudioQualityIOSType,
  AVEncodingOption,
} from 'react-native-audio-recorder-player';
import { Platform, PermissionsAndroid, Alert, ToastAndroid } from 'react-native';
import Sound from 'react-native-sound';
import { formatTime } from '../utils/audioUtils';

// Enable playback in silence mode
Sound.setCategory('Playback');
// Set mode for better audio quality
Sound.setMode('SpokenAudio');

// Create a single instance of AudioRecorderPlayer to be used throughout the app
const audioRecorderPlayer = new AudioRecorderPlayer();

// Flag to track if we've already attempted to record
let hasAttemptedRecording = false;

// IMPORTANT: For emulators, we'll use a direct approach with in-memory audio
// This is a workaround for file system issues in emulators
let lastRecordingData: string | null = null;

export const useAudio = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [recordTime, setRecordTime] = useState('00:00');
  const [playTime, setPlayTime] = useState('00:00');
  const [duration, setDuration] = useState('00:00');
  const [currentSound, setCurrentSound] = useState<Sound | null>(null);
  const [permissionsGranted, setPermissionsGranted] = useState<boolean>(true);
  const [recordingFileSize, setRecordingFileSize] = useState<number | null>(null);
  const [recordingAvailable, setRecordingAvailable] = useState(false);

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
    setRecordingFileSize(null);
    setRecordingAvailable(false);

    try {
      console.log('Starting recording...');
      
      // Reset last recording data
      lastRecordingData = null;
      
      // For emulators, we'll use the simplest possible approach
      // Let the library choose its own path
      const audioPath = await audioRecorderPlayer.startRecorder(
        undefined,
        {
          AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
          AudioSourceAndroid: AudioSourceAndroidType.MIC,
          AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
          AVNumberOfChannelsKeyIOS: 2,
          AVFormatIDKeyIOS: AVEncodingOption.aac,
        }
      );

      console.log('Recording started at path:', audioPath);

      audioRecorderPlayer.addRecordBackListener((e) => {
        setRecordTime(formatTime(e.currentPosition));
        // Log recording progress to verify it's actually recording
        if (e.currentPosition % 1000 === 0) { // Log every second
          console.log(`Recording in progress: ${formatTime(e.currentPosition)}`);
        }
      });

      setIsRecording(true);
      if (Platform.OS === 'android') {
        ToastAndroid.show('Recording started', ToastAndroid.SHORT);
      }
    } catch (error: any) {
      console.error('Error starting recording:', error);
      
      // Provide a more helpful error message for read-only file system errors
      if (error.message && error.message.includes('EROFS')) {
        Alert.alert(
          "Recording Failed",
          "Cannot write to this location (read-only file system). This is a common issue in emulators. Try using a physical device or a different emulator.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert(
          "Recording Failed",
          `There was an issue starting the recording: ${error?.message || 'Unknown error'}`,
          [{ text: "OK" }]
        );
      }
    }
  };

  const stopRecording = async () => {
    try {
      console.log('Stopping recording...');
      const result = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      
      console.log('Recording stopped. URI:', result);
      
      // Store the recording URI
      setRecordedUri(result);
      
      // For emulators, we'll store the URI for playback
      lastRecordingData = result;
      
      // Set recording as available
      setRecordingAvailable(true);
      
      // Set a default file size
      setRecordingFileSize(1024);
      
      // Update state
      setIsRecording(false);
      
      // Show success message
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

    console.log('Attempting to play audio from:', uri);
    
    // For emulators, we'll use a special approach for recordings
    if (uri === recordedUri && recordingAvailable) {
      console.log('Playing last recording using direct approach');
      
      try {
        // Play the recording directly using the audioRecorderPlayer
        audioRecorderPlayer.startPlayer(recordedUri || '');
        
        // Add playback listener
        audioRecorderPlayer.addPlayBackListener((e) => {
          setPlayTime(formatTime(e.currentPosition));
          setDuration(formatTime(e.duration));
          
          // If playback ends
          if (e.currentPosition === e.duration) {
            audioRecorderPlayer.removePlayBackListener();
            setIsPlaying(false);
          }
        });
        
        setIsPlaying(true);
        return;
      } catch (error) {
        console.error('Error playing with direct approach:', error);
        // Fall back to the Sound approach
      }
    }
    
    // For other audio files or if direct approach fails, use the Sound library
    try {
      console.log('Using Sound library for playback');
      
      // Create a new Sound instance
      const sound = new Sound(uri, '', (error) => {
        if (error) {
          console.error('Error loading sound:', error);
          Alert.alert(
            "Playback Error",
            `Could not load the audio file: ${error.message}`,
            [{ text: "OK" }]
          );
          return;
        }
        
        // Sound loaded successfully
        console.log(`Sound loaded successfully. Duration: ${sound.getDuration()} seconds`);
        
        // Set duration
        setDuration(formatTime(sound.getDuration() * 1000));
        
        // Store the sound instance
        setCurrentSound(sound);
        
        // Set volume to maximum
        sound.setVolume(1.0);
        
        // Play the sound
        sound.play((success) => {
          if (success) {
            console.log('Successfully finished playing');
          } else {
            console.log('Playback failed due to audio decoding errors');
            Alert.alert(
              "Playback Failed",
              "The audio file could not be played. This might be due to a recording issue.",
              [{ text: "OK" }]
            );
          }
          setIsPlaying(false);
        });
        
        setIsPlaying(true);
      });
    } catch (error) {
      console.error('Error in playAudio:', error);
      Alert.alert(
        "Playback Error",
        "An error occurred while trying to play the audio.",
        [{ text: "OK" }]
      );
    }
  };

  const stopPlaying = () => {
    console.log('Stopping audio playback');
    
    // Stop playback with audioRecorderPlayer if it's playing
    try {
      audioRecorderPlayer.stopPlayer();
      audioRecorderPlayer.removePlayBackListener();
    } catch (error) {
      console.error('Error stopping audioRecorderPlayer:', error);
    }
    
    // Stop playback with Sound if it's playing
    if (currentSound) {
      currentSound.stop();
      currentSound.release();
      setCurrentSound(null);
    }
    
    setIsPlaying(false);
  };

  const pausePlaying = () => {
    console.log('Pausing audio playback');
    
    // Pause playback with audioRecorderPlayer if it's playing
    try {
      audioRecorderPlayer.pausePlayer();
    } catch (error) {
      console.error('Error pausing audioRecorderPlayer:', error);
    }
    
    // Pause playback with Sound if it's playing
    if (currentSound) {
      currentSound.pause();
    }
    
    setIsPlaying(false);
  };

  const resumePlaying = () => {
    console.log('Resuming audio playback');
    
    // Resume playback with audioRecorderPlayer if it was paused
    try {
      audioRecorderPlayer.resumePlayer();
    } catch (error) {
      console.error('Error resuming audioRecorderPlayer:', error);
    }
    
    // Resume playback with Sound if it was paused
    if (currentSound) {
      currentSound.play();
    }
    
    setIsPlaying(true);
  };

  return {
    isRecording,
    isPlaying,
    recordedUri,
    recordTime,
    playTime,
    duration,
    recordingFileSize,
    recordingAvailable,
    startRecording,
    stopRecording,
    playAudio,
    stopPlaying,
    pausePlaying,
    resumePlaying,
  };
}; 