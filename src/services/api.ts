import axios, { AxiosRequestConfig } from 'axios';
import { VoiceClip, VoiceAnalysisResult } from '../types';
import { mockVoiceClips, mockAnalysisResult } from '../utils/mockData';

// Replace with your actual API base URL
export const API_BASE_URL = 'http://172.16.2.208:8000/api';

// Set this to false to use the actual API instead of mock data
const USE_MOCK_DATA = false;

// Token management
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  console.log('Auth token set:', token ? 'Token provided' : 'Token cleared');
};

export const getAuthToken = () => {
  return authToken;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchVoiceClips = async (): Promise<VoiceClip[]> => {
  console.warn('Fetching voice clips...');
  // Simulate network delay
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return mockVoiceClips;
  }

  try {
    const response = await api.get('/voice-clips');
    console.log('Voice clips response:', response.data);
    return response.data.voiceClips;
  } catch (error) {
    console.error('Error fetching voice clips:', error);
    throw error;
  }
};

export const getVoiceClipById = async (id: string): Promise<VoiceClip> => {
  // Simulate network delay
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 500));
    const clip = mockVoiceClips.find(clip => clip.id === id);
    if (clip) {
      return clip;
    }
    throw new Error(`Voice clip with id ${id} not found`);
  }

  try {
    const response = await api.get(`/voice-clips/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching voice clip with id ${id}:`, error);
    throw error;
  }
};

export const analyzeVoiceComparison = async (
  originalClipId: string,
  userAudioFile: any
): Promise<VoiceAnalysisResult> => {
  console.log(`Analyzing voice comparison for clip ID: ${originalClipId}`);
  
  // Validate file type - only accept MP3 audio files
  if (!USE_MOCK_DATA && userAudioFile) {
    const fileType = userAudioFile.type || '';
    const fileName = userAudioFile.name || '';
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
    
    console.log('File info:', {
      name: fileName,
      type: fileType,
      extension: fileExtension
    });
    
    // Check if the file is an MP3 audio file
    const isMP3 = 
      (fileType === 'audio/mp3' || fileType === 'audio/mpeg') || 
      (fileExtension === 'mp3');
    
    if (!isMP3) {
      console.error('Invalid file type. Only MP3 audio files are accepted.');
      throw new Error('Invalid file type. Only MP3 audio files are accepted. Please upload an MP3 file.');
    }
    
    // Explicitly reject video files
    if (fileType.startsWith('video/') || fileExtension === 'mp4' || fileExtension === 'mov' || fileExtension === 'avi') {
      console.error('Video files are not accepted.');
      throw new Error('Video files are not accepted. Please upload an MP3 audio file.');
    }
  }
  
  // Check if we have an auth token
  if (!USE_MOCK_DATA && !authToken) {
    console.warn('No auth token available. User might need to log in.');
    // You can choose to throw an error based on your app's requirements
    // For now, we'll continue the request without a token
  }
  
  // Simulate network delay and processing time for mock data
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Returning mock analysis result');
    return {
      ...mockAnalysisResult,
      originalClipId,
    };
  }

  try {
    console.log('Sending analysis request to:', `${API_BASE_URL}/analyze-voice`);
    console.log('Analysis data:', {
      originalClipId,
      userAudioFile: userAudioFile ? `Audio file provided (${userAudioFile.name})` : 'No audio file'
    });
    
    // Create form data
    const formData = new FormData();
    formData.append('originalClipId', originalClipId);
    formData.append('userAudio', userAudioFile);

    const response = await api.post('/analyze-voice/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('Analysis response status:', response.status);
    console.log('Analysis result:', response.data);
    
    return response.data;
  } catch (error: any) {
    console.error('Error analyzing voice comparison:', error);
    
    // Handle specific error cases
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Server responded with error:', error.response.status);
      console.error('Error data:', error.response.data);
      
      if (error.response.status === 401) {
        // Unauthorized - token might be expired or invalid
        setAuthToken(null); // Clear the invalid token
        throw new Error('Your session has expired. Please log in again.');
      } else if (error.response.status === 403) {
        // Forbidden - user doesn't have permission
        throw new Error('You do not have permission to perform this analysis.');
      } else if (error.response.status === 404) {
        // Not found
        throw new Error(`Original voice clip with ID ${originalClipId} was not found.`);
      } else if (error.response.status === 413) {
        // Payload too large
        throw new Error('The audio file is too large. Please use a smaller file.');
      } else if (error.response.status === 415) {
        // Unsupported media type
        throw new Error('The audio file format is not supported. Please upload an MP3 file.');
      } else {
        // Other server errors
        throw new Error(`Server error: ${error.response.data.message || 'Unknown error'}`);
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
      throw new Error('No response from server. Please check your internet connection.');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
      throw new Error(`Error: ${error.message}`);
    }
  }
}; 