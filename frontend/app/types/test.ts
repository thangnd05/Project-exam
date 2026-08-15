import { QuestionType, TestStatus } from '@/app/enums';
import type { PassageMediaResponse, PassageResponse, QuestionGroupAdminResponse } from './question';

export interface AnswerResponse {
  answerId: string;
  answerText?: string;
  answerLabel?: string;
}

export interface QuestionResponse {
  questionId: string;
  questionNumber?: number;
  examPartId?: string;
  questionText?: string;
  questionType?: QuestionType;
  isBank?: boolean;
  passage?: PassageResponse;
  passageMedia?: PassageMediaResponse[];
  testPartId?: string;
  answers?: AnswerResponse[];
  collectionId?: string;
}

export interface QuestionGroupResponse {
  passage?: PassageResponse;
  questions?: QuestionResponse[];
}

export interface TestPartResponse {
  testPartId: string;
  examPartId?: string;
  partName?: string;
  questionGroups?: QuestionGroupResponse[];
}

export interface TestPartAdminResponse {
  testPartId: string;
  examPartId?: string;
  partName?: string;
  questionGroups?: QuestionGroupAdminResponse[];
}

export interface TestPartSimpleResponse {
  testPartId: string;
  testId?: string;
  examPartId?: string;
  numQuestions?: number;
}

export interface TestPartSummaryResponse {
  testPartId: string;
  examPartId?: string;
  partName?: string;
  skillName?: string;
  questionCount?: number;
  displayOrder?: number;
}

export interface TestPartRequest {
  testId?: string;
  examPartId?: string;
  numQuestions?: number;
}

export interface TestQuestionRequest {
  testPartId?: string;
  questionId?: string;
  displayOrder?: number;
}

export interface TestQuestionResponse {
  testQuestionId: string;
  testPartId?: string;
  questionId?: string;
  displayOrder?: number;
}

export interface TestResponse {
  testId: string;
  title?: string;
  description?: string;
  examTypeId?: string;
  examCategoryId?: string;
  collectionId?: string;
  createdBy?: string;
  createdAt?: string;
  bannerUrl?: string;
  durationMinutes?: number;
  classId?: string;
  chapterId?: string;
  availableFrom?: string;
  availableTo?: string;
  status?: TestStatus;
  maxAttempts?: number;
  attemptsUsed?: number;
  remainingAttempts?: number;
  totalAttempts?: number;
  canDoTest?: boolean;
  costCoins?: number;
  owned?: boolean;
  locked?: boolean;
  parts?: TestPartResponse[];
}

export interface TestAdminResponse {
  testId: string;
  title?: string;
  description?: string;
  examTypeId?: string;
  examCategoryId?: string;
  collectionId?: string;
  createdBy?: string;
  createdAt?: string;
  bannerUrl?: string;
  durationMinutes?: number;
  availableFrom?: string;
  availableTo?: string;
  status?: TestStatus;
  maxAttempts?: number;
  totalAttempts?: number;
  classId?: string;
  parts?: TestPartAdminResponse[];
}

export interface CreateTestRequest {
  title?: string;
  description?: string;
  examTypeId?: string;
  durationMinutes?: number;
  bannerUrl?: string;
  maxAttempts?: number;
  classId?: string;
  chapterId?: string;
  examCategoryId?: string;
  collectionId?: string;
  availableFrom?: string;
  availableTo?: string;
  costCoins?: number;
}

export interface AddQuestionsToTestRequest {
  testPartId?: string;
  questionIds?: string[];
}

export interface AddRandomQuestionsToTestRequest {
  testPartId?: string;
  count?: number;
  classId?: string;
  chapterId?: string;
  isSequential?: boolean;
  fromIndex?: number;
  toIndex?: number;
  bank?: string;
  collectionId?: string;
}

export interface TestCollectionResponse {
  collectionId: string;
  name?: string;
  description?: string;
  testCount: number;
}

export interface QuickChallengePartSummary {
  name?: string;
  numQuestions: number;
  displayOrder: number;
}

export interface QuickChallengeCardResponse {
  testId: string;
  title?: string;
  description?: string;
  durationMinutes?: number;
  bannerUrl?: string;
  examTypeId?: string;
  examTypeName?: string;
  examTypeImageUrl?: string;
  status?: TestStatus;
  totalQuestions: number;
  parts?: QuickChallengePartSummary[];
}

export interface CanStartTestResponse {
  canStart: boolean;
  message?: string;
  costCoins?: number;
  owned?: boolean;
  requiresPayment?: boolean;
}

export interface CertificateExamListResponse {
  tests?: TestResponse[];
  certificateTitle?: string;
  passScore?: number;
  validMonths?: number;
  alreadyOwned: boolean;
}
