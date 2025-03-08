import { Platform } from 'react-native';
import Sound from 'react-native-sound';

// Enable playback in silence mode
Sound.setCategory('Playback');

/**
 * Get a file path for saving a recording
 */
export const getRecordingPath = (filename = 'user_recording'): string => {
  // Always use MP3 extension for better compatibility
  const extension = 'mp3';
  
  if (Platform.OS === 'android') {
    // Use a path that's likely to be writable in the emulator
    // The 'cache' directory is typically writable
    return `file:///data/user/0/com.litalk/cache/${filename}.${extension}`;
  } else {
    // For iOS, use a relative path which will resolve to the app's documents directory
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
export const createFileObject = (uri: string, type = 'audio/mpeg', name = 'recording.mp3') => {
  // Validate that we're only using MP3 files
  if (type !== 'audio/mpeg' && type !== 'audio/mp3') {
    console.warn('Non-MP3 file type detected. Forcing audio/mpeg type.');
    type = 'audio/mpeg';
  }
  
  // Ensure the file has an .mp3 extension
  if (!name.toLowerCase().endsWith('.mp3')) {
    name = name.split('.')[0] + '.mp3';
  }
  
  return {
    uri,
    type,
    name,
  };
}; 