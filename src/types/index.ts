export interface VoiceClip {
  id: string;
  name: string;
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
  user_group: 'student' | 'teacher';
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
  user_type: 'teacher' | 'student';
}

// Test types
export interface PracticeTest {
  id: string;
  name: string;
  description: string;
  voiceClipIds: string[];
  createdAt: string;
  createdBy: string;
}

export interface ExamTest {
  id: string;
  name: string;
  description: string;
  voiceClipIds: string[];
  createdAt: string;
  createdBy: string;
  timeLimit?: number; // Optional time limit in minutes
}

// Student ranking type
export interface StudentRanking {
  id: string;
  student_id: string;
  student_name: string;
  exam_id: string;
  exam_name: string;
  score: number;
  completed_at: string;
} 