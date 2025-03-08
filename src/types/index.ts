export interface VoiceClip {
  id: string;
  title: string;
  description: string;
  audioUrl: string;
  createdAt: string;
}

export interface VoiceAnalysisResult {
  originalClipId: string;
  userClipId?: string;
  similarityScore?: number;
  feedback?: string;
  analysisDetails?: {
    pitch?: {
      score: number;
      feedback: string;
    };
    rhythm?: {
      score: number;
      feedback: string;
    };
    pronunciation?: {
      score: number;
      feedback: string;
    };
  };
}

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  profilePicture?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  first_name: string;
  last_name: string;
} 