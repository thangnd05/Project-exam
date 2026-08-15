import { UserVocabularyStatus } from '@/app/enums';

export interface VocabularyAlbumRequest {
  name?: string;
  description?: string;
}

export interface VocabularyAlbumResponse {
  albumId: string;
  name?: string;
  description?: string;
  userId?: string;
  createdAt?: string;
  totalWords: number;
  masteredWords: number;
}

export interface VocabularyRequest {
  word?: string;
  phonetic?: string;
  meaning?: string;
  example?: string;
  albumId?: string;
  newAlbumName?: string;
  newAlbumDesc?: string;
  userId?: string;
  voiceUrl?: string;
}

export interface VocabularyResponse {
  vocabId: string;
  word?: string;
  phonetic?: string;
  meaning?: string;
  example?: string;
  albumId?: string;
  albumName?: string;
  albumDesc?: string;
  voiceUrl?: string;
  createdAt?: string;
}

export interface UserVocabularyRequest {
  vocabId?: string;
  status?: UserVocabularyStatus;
}

export interface UserVocabularyResponse {
  id: string;
  userId?: string;
  vocabId?: string;
  status?: UserVocabularyStatus;
  lastReviewed?: string;
  correctCount?: number;
}

export interface PracticeQuestionResponse {
  vocabId: string;
  type?: string;
  questionText?: string;
  voiceUrl?: string;
  word?: string;
  meaning?: string;
  options?: string[];
}

export interface PracticeCheckRequest {
  vocabId?: string;
  type?: string;
  selectedOptionText?: string;
  userEnglish?: string;
  userVietnamese?: string;
}

export interface PracticeCheckResponse {
  vocabId: string;
  correct: boolean;
  status?: string;
  correctCount: number;
}
