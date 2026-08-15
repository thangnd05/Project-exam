import { LearningPlanStatus, PlanStage, PlanTaskType, QuestionType, SessionStatus, TaskStatus } from '@/app/enums';
import type { QuestionResponse } from './test';

export interface GeneratePlanRequest {
  userTestId: string;
  deadlineDays?: number;
  targetScore?: number;
  focusExamPartIds?: string[];
}

export interface RecommendedResourceResponse {
  resourceId: string;
  title?: string;
  description?: string;
  url?: string;
  originalFileName?: string;
}

export interface PlanTaskResponse {
  taskId: string;
  taskOrder?: number;
  tagId?: string;
  taskType?: PlanTaskType;
  targetQuestionCount?: number;
  tagName?: string;
  examPartId?: string;
  examPartName?: string;
  status?: TaskStatus;
  passAccuracy?: number;
  baselineAccuracy?: number;
  bestAccuracy?: number;
  attemptCount?: number;
  studyResource?: RecommendedResourceResponse;
  wrongCountAtDiagnosis?: number;
}

export interface PlanPartGroupResponse {
  examPartId: string;
  examPartName?: string;
  displayOrder?: number;
  passAccuracy?: number;
  passedTasksInPart: number;
  totalTasksInPart: number;
  partResources?: RecommendedResourceResponse[];
  tasks?: PlanTaskResponse[];
}

export interface PlanResponse {
  learningPlanId: string;
  userId?: string;
  examTypeId?: string;
  sourceUserTestId?: string;
  planSequence?: number;
  status?: LearningPlanStatus;
  replacedByPlanId?: string;
  targetAchieved?: boolean;
  targetScore?: number;
  baselineReadiness?: number;
  readinessLevel?: string;
  diagnosisSourceCategory?: string;
  diagnosisSourcePractice?: boolean;
  planStage?: PlanStage;
  userTargetId?: string;
  targetOutdated?: boolean;
  createdAt?: string;
  totalTasks?: number;
  passedTasks?: number;
  recommendedTaskId?: string;
  reopenedTasks?: number;
  partGroups?: PlanPartGroupResponse[];
  partsWithoutTasks?: string[];
}

export interface SessionReviewAnswer {
  answerId: string;
  answerText?: string;
  answerLabel?: string;
  isCorrect: boolean;
}

export interface SessionReviewItem {
  questionId: string;
  questionText?: string;
  questionType?: QuestionType;
  answers?: SessionReviewAnswer[];
  selectedAnswerId?: string;
  selectedAnswerIds?: string[];
  correctAnswerId?: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface CurrentSessionResponse {
  mode?: string;
  learningPlanId?: string;
  examTypeId?: string;
  planStage?: PlanStage;
  sessionId?: string;
  activeTask?: PlanTaskResponse;
  resource?: RecommendedResourceResponse;
  passAccuracyRequired?: number;
  correctCount?: number;
  totalCount?: number;
  accuracy?: number;
  passed?: boolean;
  questions?: QuestionResponse[];
  totalTasks?: number;
  passedTasks?: number;
  noticeCode?: string;
  partGroups?: PlanPartGroupResponse[];
  lastReviewItems?: SessionReviewItem[];
}

export interface SubmitSessionAnswerItem {
  questionId: string;
  selectedAnswerId?: string;
  selectedAnswerIds?: string[];
}

export interface SubmitSessionRequest {
  answers: SubmitSessionAnswerItem[];
}

export interface SubmitSessionResponse {
  sessionId: string;
  correctCount: number;
  totalCount: number;
  accuracy: number;
  passed: boolean;
  taskStatus?: TaskStatus;
  planStage?: PlanStage;
  reviewItems?: SessionReviewItem[];
}

export interface TaskSessionHistoryResponse {
  sessionId: string;
  status?: SessionStatus;
  questionCount?: number;
  accuracy?: number;
  passed?: boolean;
  startedAt?: string;
  submittedAt?: string;
}
