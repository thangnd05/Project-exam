import { UserTestMode, UserTestStatus } from '@/app/enums';

export interface StartUserTestRequest {
  testId?: string;
  mode?: UserTestMode;
  examPartIds?: string[];
}

export interface StartUserTestResponse {
  message?: string;
  userTestId?: string;
  status?: UserTestStatus;
  startedAt?: string;
  mode?: UserTestMode;
  serverNow?: string;
}

export interface ActiveUserTestResponse {
  serverNow?: string;
  userTestId?: string;
  status?: UserTestStatus | 'NONE';
  startedAt?: string;
}

export interface UserTestResponse {
  userTestId: string;
  userId?: string;
  userName?: string;
  testId?: string;
  testTitle?: string;
  examTypeId?: string;
  startedAt?: string;
  finishedAt?: string;
  totalScore?: number;
  status?: UserTestStatus;
  mode?: UserTestMode;
  practicePartIds?: string[];
  durationTaken?: number;
}

export interface UserTestUpdateRequest {
  status?: UserTestStatus;
}

export interface UserAnswerRequest {
  userTestId?: string;
  questionId?: string;
  /* Trang làm bài gửi thẳng null cho ô chưa chọn (BE hiểu null = xoá đáp án cũ). */
  selectedAnswerId?: string | null;
  selectedAnswerIds?: string[] | null;
  answerText?: string | null;
}

export interface UserAnswerResponse {
  userAnswerId: string;
  userTestId?: string;
  questionId?: string;
  selectedAnswerId?: string;
  selectedAnswerIds?: string[];
  answerText?: string;
}

export interface ResultSummaryResponse {
  correct: number;
  wrong: number;
  total: number;
  totalScore: number;
}

export interface TagQuestionRefResponse {
  questionId: string;
  questionNumber: number;
  status?: string;
}

export interface TagBreakdownResponse {
  tagId: string;
  tagName?: string;
  correct: number;
  wrong: number;
  skipped: number;
  total: number;
  percentage: number;
  questions?: TagQuestionRefResponse[];
}

export interface PartBreakdownResponse {
  examPartId: string;
  partName?: string;
  skillId?: string;
  skillName?: string;
  correct: number;
  wrong: number;
  total: number;
  percentage: number;
  targetPercentage?: number;
  isTargetMet?: boolean;
  tags?: TagBreakdownResponse[];
}

export interface EnhancedResultResponse {
  correct: number;
  wrong: number;
  total: number;
  totalScore?: number;
  examCategoryCode?: string;
  examTypeId?: string;
  partBreakdown?: PartBreakdownResponse[];
  percentage: number;
  readinessScore: number;
  readinessLevel?: string;
  percentile?: number;
  hasTarget: boolean;
  isTargetMet?: boolean;
  targetScore?: number;
}

export interface LeaderboardMyRank {
  rank: number;
  userTestId?: string;
  totalScore?: number;
  durationTaken?: number;
}

export interface TestLeaderboardResponse {
  entries?: UserTestResponse[];
  me?: LeaderboardMyRank;
  totalParticipants: number;
}

export interface EvaluationRequest {
  content: string;
  rating: number;
}

export interface EvaluationResponse {
  id: string;
  content?: string;
  rating?: number;
  createdAt?: string;
  userId?: string;
  username?: string;
  avatarUrl?: string;
}

export interface ClaimGuestTestsResponse {
  claimed: number;
}
