import { Platform } from 'react-native';
import Sound from 'react-native-sound';

// Enable playback in silence mode
Sound.setCategory('Playback');

/**
 * Get a file path for saving a recording
 */
export const getRecordingPath = (filename = 'user_recording'): string => {
  const extension = Platform.OS === 'ios' ? 'm4a' : 'mp4';
  
  if (Platform.OS === 'android') {
    // Use a relative path for Android internal storage
    // This will store in the app's internal storage
    return `${filename}.${extension}`;
  } else {
    // iOS already uses app's internal storage by default
    return `${filename}.${extension}`;
  }
};

/**
 * Format milliseconds to MM:SS format
 */
export const formatTime = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Check if a URL is a remote URL
 */
export const isRemoteUrl = (url: string): boolean => {
  return url.startsWith('http://') || url.startsWith('https://');
};

/**
 * Create a file object from a URI for API upload
 */
export const createFileObject = (uri: string, type = 'audio/mp4', name = 'recording.mp4') => {
  return {
    uri,
    type,
    name,
  };
}; 