import axios, { AxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';
import { VoiceClip, VoiceAnalysisResult, PracticeTest, ExamTest, StudentRanking } from '../types';
import { mockVoiceClips, mockAnalysisResult } from '../utils/mockData';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your actual API base URL
// export const API_BASE_URL = 'http://172.16.2.208:8000/api';
// export const API_BASE_URL = 'http://172.16.2.167:8000/api';
export const API_BASE_URL = 'http://172.16.2.208:8000/api';

// Set this to false to use the actual API instead of mock data
const USE_MOCK_DATA = false;

// Token storage key
const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';

// Token management
let authToken: string | null = null;
let currentUser: any = null;
let isRefreshing = false;
let failedQueue: any[] = [];
let navigationRef: any = null;

// Set navigation reference for redirecting to login when token refresh fails
export const setNavigationRef = (ref: any) => {
  navigationRef = ref;
};

// Helper function to redirect to login screen
export const redirectToLogin = () => {
  if (navigationRef && navigationRef.isReady()) {
    navigationRef.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  }
};

// Process the failed requests queue
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Initialize token from storage
export const initializeAuth = async () => {
  try {
    const storedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    const storedUserData = await AsyncStorage.getItem(USER_DATA_KEY);
    
    if (storedToken) {
      authToken = storedToken;
      console.log('Auth token loaded from storage');
    }
    
    if (storedUserData) {
      currentUser = JSON.parse(storedUserData);
      console.log('User data loaded from storage');
    }
    
    return { token: authToken, user: currentUser };
  } catch (error) {
    console.error('Error initializing auth from storage:', error);
    return { token: null, user: null };
  }
};

export const setAuthToken = async (token: string | null) => {
  authToken = token;
  
  try {
    if (token) {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      console.log('Auth token saved to storage');
    } else {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      console.log('Auth token removed from storage');
    }
  } catch (error) {
    console.error('Error saving auth token to storage:', error);
  }
  
  console.log('Auth token set:', token ? 'Token provided' : 'Token cleared');
};

export const setCurrentUser = async (user: any | null) => {
  currentUser = user;
  
  try {
    if (user) {
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
      console.log('User data saved to storage');
    } else {
      await AsyncStorage.removeItem(USER_DATA_KEY);
      console.log('User data removed from storage');
    }
  } catch (error) {
    console.error('Error saving user data to storage:', error);
  }
};

export const getAuthToken = () => {
  return authToken;
};

export const getCurrentUser = () => {
  return currentUser;
};

export const clearAuth = async () => {
  authToken = null;
  currentUser = null;
  
  try {
    await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_DATA_KEY]);
    console.log('Auth data cleared from storage');
  } catch (error) {
    console.error('Error clearing auth data from storage:', error);
  }
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
api.interceptors.request.use(
  (config) => {
    if (authToken) {
      // Django REST Framework expects: "Token <token>" format
      // Check if the token already has the Token prefix
      if (authToken.startsWith('Token ')) {
        config.headers.Authorization = authToken;
      } else {
        // Add the Token prefix as required by Django REST Framework
        config.headers.Authorization = `Token ${authToken}`;
      }
      
      console.log('Adding auth token to request:', config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;
    
    // If there's no response or no config, just reject
    if (!error.response || !originalRequest) {
      return Promise.reject(error);
    }
    
    // Handle specific error status codes
    if (error.response.status === 401) {
      // Unauthorized - token might be expired or invalid
      
      // If the request already tried to refresh, reject
      if ((originalRequest as any)._retry) {
        // Clear auth and redirect to login
        await clearAuth();
        redirectToLogin();
        return Promise.reject(new Error('Session expired. Please log in again.'));
      }
      
      // Mark this request as retried
      (originalRequest as any)._retry = true;
      
      // If already refreshing, add to queue
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            return api(originalRequest!);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }
      
      isRefreshing = true;
      
      try {
        // Import here to avoid circular dependency
        const { refreshToken } = await import('./auth');
        const refreshed = await refreshToken();
        
        if (refreshed) {
          // Update the token in the current request
          if (authToken) {
            if (authToken.startsWith('Token ')) {
              originalRequest.headers!.Authorization = authToken;
            } else {
              originalRequest.headers!.Authorization = `Token ${authToken}`;
            }
          }
          
          // Process the queue with the new token
          processQueue(null, authToken);
          
          // Retry the original request
          return api(originalRequest);
        } else {
          // If refresh failed, reject all queued requests
          processQueue(new Error('Failed to refresh token'));
          
          // Clear auth and redirect to login
          await clearAuth();
          redirectToLogin();
          
          // Reject the original request
          return Promise.reject(new Error('Session expired. Please log in again.'));
        }
      } catch (refreshError) {
        // If refresh throws an error, reject all queued requests
        processQueue(refreshError);
        
        // Clear auth and redirect to login
        await clearAuth();
        redirectToLogin();
        
        // Reject the original request
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    } else if (error.response.status === 403) {
      // Forbidden - user doesn't have permission
      return Promise.reject(new Error('You do not have permission to perform this action.'));
    } else if (error.response.status === 404) {
      // Not found
      return Promise.reject(new Error('The requested resource was not found.'));
    } else if (error.response.status === 400) {
      // Bad request - typically validation errors
      let errorMessage = 'Invalid request. Please check your data.';
      
      // Django REST Framework typically returns validation errors as an object
      // with field names as keys and arrays of error messages as values
      if (error.response.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (typeof error.response.data === 'object') {
          // Try to extract the first error message
          const errorData = error.response.data as Record<string, any>;
          const firstErrorKey = Object.keys(errorData)[0];
          if (firstErrorKey && errorData[firstErrorKey]) {
            const firstError = errorData[firstErrorKey];
            if (Array.isArray(firstError) && firstError.length > 0) {
              errorMessage = `${firstErrorKey}: ${firstError[0]}`;
            } else if (typeof firstError === 'string') {
              errorMessage = `${firstErrorKey}: ${firstError}`;
            }
          }
        }
      }
      
      return Promise.reject(new Error(errorMessage));
    }
    
    // For all other errors, just reject with the original error
    return Promise.reject(error);
  }
);

// Voice Clips API
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

// Voice Analysis API
export const analyzeVoiceComparison = async (
  originalClipId: string,
  userAudioFile: any,
  testId: string,
  test_type: number = 0
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
    formData.append('test_id', testId);
    formData.append('test_type', test_type.toString());

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
        await setAuthToken(null); // Clear the invalid token
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

// Practice Test API
export const fetchPracticeTests = async (): Promise<PracticeTest[]> => {
  try {
    const response = await api.get('/practice-test');
    return response.data.practice_test_cases;
  } catch (error) {
    console.error('Error fetching practice tests:', error);
    throw error;
  }
};

export const getPracticeTestById = async (id: string): Promise<PracticeTest> => {
  try {
    const response = await api.get(`/practice-test/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching practice test with id ${id}:`, error);
    throw error;
  }
};

export const createPracticeTest = async (data: {
  name: string;
  description: string;
  voiceClipIds: string[];
}): Promise<PracticeTest> => {
  try {
    const response = await api.post('/practice-test/create/', data);
    return response.data;
  } catch (error) {
    console.error('Error creating practice test:', error);
    throw error;
  }
};

export const updatePracticeTest = async (
  id: string,
  data: {
    name?: string;
    description?: string;
    voiceClipIds?: string[];
  }
): Promise<PracticeTest> => {
  try {
    const response = await api.put(`/practice-test/update/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating practice test with id ${id}:`, error);
    throw error;
  }
};

export const deletePracticeTest = async (id: string): Promise<void> => {
  try {
    await api.delete(`/practice-test/${id}`);
  } catch (error) {
    console.error(`Error deleting practice test with id ${id}:`, error);
    throw error;
  }
};

// Exam Test API
export const fetchExamTests = async (): Promise<ExamTest[]> => {
  try {
    const response = await api.get('/exam-test');
    return response.data.exam_test_cases;
  } catch (error) {
    console.error('Error fetching exam tests:', error);
    throw error;
  }
};

export const getExamTestById = async (id: string): Promise<ExamTest> => {
  try {
    const response = await api.get(`/exam-test/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching exam test with id ${id}:`, error);
    throw error;
  }
};

export const createExamTest = async (data: {
  name: string;
  description: string;
  voiceClipIds: string[];
  timeLimit?: number;
}): Promise<ExamTest> => {
  try {
    const response = await api.post('/exam-test/create/', data);
    return response.data;
  } catch (error) {
    console.error('Error creating exam test:', error);
    throw error;
  }
};

export const updateExamTest = async (
  id: string,
  data: {
    name?: string;
    description?: string;
    voiceClipIds?: string[];
    timeLimit?: number;
  }
): Promise<ExamTest> => {
  try {
    const response = await api.put(`/exam-test/update/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating exam test with id ${id}:`, error);
    throw error;
  }
};

export const deleteExamTest = async (id: string): Promise<void> => {
  try {
    await api.delete(`/exam-test/${id}`);
  } catch (error) {
    console.error(`Error deleting exam test with id ${id}:`, error);
    throw error;
  }
};

// Student Rankings API
export const fetchStudentRankings = async (): Promise<StudentRanking[]> => {
  try {
    const response = await api.get('/student-rankings');
    return response.data.rankings;
  } catch (error) {
    console.error('Error fetching student rankings:', error);
    throw error;
  }
};

export const getStudentRankingsByExamId = async (examId: string): Promise<StudentRanking[]> => {
  try {
    const response = await api.get(`/student-rankings/exam/${examId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching student rankings for exam ${examId}:`, error);
    throw error;
  }
};

// Teacher Voice Clips API
export const uploadTeacherVoiceClip = async (formData: FormData) => {
  try {
    const response = await api.post(`${API_BASE_URL}/teacher-voice-clips/upload/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading teacher voice clip:', error);
    throw error;
  }
};

export const getTeacherVoiceClips = async () => {
  try {
    const response = await api.get(`${API_BASE_URL}/teacher-voice-clips/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching teacher voice clips:', error);
    throw error;
  }
};


// Exam Remarks API
export const addExamRemark = async (examTestId: string, formData: FormData) => {
  try {
    const response = await api.post(`/exam-test/${examTestId}/remarks/add/`, formData);
    return response.data;
  } catch (error) {
    console.error('Error adding exam remark:', error);
    throw error;
  }
};

export const getExamRemarks = async (examTestId: string) => {
  try {
    const response = await api.get(`/exam-test/${examTestId}/remarks/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching exam remarks:', error);
    throw error;
  }
};