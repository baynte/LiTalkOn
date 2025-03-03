import axios from 'axios';
import { VoiceClip, VoiceAnalysisResult } from '../types';
import { mockVoiceClips, mockAnalysisResult } from '../utils/mockData';

// Replace with your actual API base URL
const API_BASE_URL = 'https://your-backend-api.com/api';

// Set this to false to use the actual API instead of mock data
const USE_MOCK_DATA = true;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchVoiceClips = async (): Promise<VoiceClip[]> => {
  // Simulate network delay
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return mockVoiceClips;
  }

  try {
    const response = await api.get('/voice-clips');
    return response.data;
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
  // Simulate network delay and processing time
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      ...mockAnalysisResult,
      originalClipId,
    };
  }

  try {
    const formData = new FormData();
    formData.append('originalClipId', originalClipId);
    formData.append('userAudio', userAudioFile);

    const response = await api.post('/analyze-voice', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error analyzing voice comparison:', error);
    throw error;
  }
}; 