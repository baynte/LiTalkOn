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