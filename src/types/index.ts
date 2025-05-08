export interface VoiceClip {
  id: string;
  title: string;
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

// Student test score with audio recording
export interface StudentTestScore {
  id: string;
  score: number;
  test_id: string;
  language_test_case_id: string;
  title: string;
  description: string;
  transcript: string;
  recognized_text?: string;
  audioUrl?: string;        // Original test audio
  userAudioUrl?: string;    // Student's recorded audio
  created_at: string;
  student_full_name: string;
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