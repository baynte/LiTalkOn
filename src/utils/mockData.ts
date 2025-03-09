import { VoiceClip, VoiceAnalysisResult } from '../types';

export const mockVoiceClips: VoiceClip[] = [
  {
    id: '1',
    name: 'English Pronunciation Exercise',
    description: 'Practice your English pronunciation with this short sentence: "The quick brown fox jumps over the lazy dog."',
    audioUrl: 'https://example.com/audio/english-pronunciation.mp3',
    createdAt: '2023-03-01T10:00:00Z',
  },
  {
    id: '2',
    name: 'French Accent Training',
    description: 'Improve your French accent with this phrase: "Je voudrais une tasse de café, s\'il vous plaît."',
    audioUrl: 'https://example.com/audio/french-accent.mp3',
    createdAt: '2023-03-02T14:30:00Z',
  },
  {
    id: '3',
    name: 'Spanish Pronunciation Guide',
    description: 'Learn to pronounce this Spanish sentence correctly: "¿Dónde está la biblioteca?"',
    audioUrl: 'https://example.com/audio/spanish-pronunciation.mp3',
    createdAt: '2023-03-03T09:15:00Z',
  },
  {
    id: '4',
    name: 'Japanese Greeting Practice',
    description: 'Practice this common Japanese greeting: "こんにちは、お元気ですか？" (Konnichiwa, o-genki desu ka?)',
    audioUrl: 'https://example.com/audio/japanese-greeting.mp3',
    createdAt: '2023-03-04T16:45:00Z',
  },
  {
    id: '5',
    name: 'German Pronunciation Challenge',
    description: 'Try this challenging German phrase: "Ich möchte Deutsch lernen, weil es eine interessante Sprache ist."',
    audioUrl: 'https://example.com/audio/german-pronunciation.mp3',
    createdAt: '2023-03-05T11:20:00Z',
  },
];

export const mockAnalysisResult: VoiceAnalysisResult = {
  originalClipId: '1',
  userClipId: 'user-recording-123',
  similarityScore: 0.78,
  feedback: 'Good attempt! Your pronunciation is clear, but you could improve the rhythm and intonation of the sentence.',
  analysisDetails: {
    pitch: {
      score: 0.82,
      feedback: 'Your pitch variation is good, but try to emphasize the rising intonation at the end of questions.',
    },
    rhythm: {
      score: 0.75,
      feedback: 'The rhythm is slightly off. Try to maintain a more consistent pace throughout the sentence.',
    },
    pronunciation: {
      score: 0.85,
      feedback: 'Your pronunciation of individual words is very good. Pay attention to the "th" sound in "the".',
    },
  },
}; 