import { MediaType, PassageType, QuestionType, QuestionUsageScope } from '@/app/enums';

export interface TagRequest {
  name?: string;
  examTypeId?: string;
  /** null = tag dùng chung cho mọi phần thi */
  examPartId?: string | null;
  sortOrder?: number | null;
}

export interface TagResponse {
  tagId: string;
  name?: string;
  examTypeId?: string;
  examPartId?: string | null;
  examPartName?: string | null;
  sortOrder?: number;
  /** Số tài liệu gắn tag (chỉ có ở danh sách tag theo kỳ thi) */
  resourceCount?: number;
}

export interface AnswerRequest {
  answerId?: string;
  answerText?: string;
  isCorrect?: boolean;
  answerLabel?: string;
  questionId?: string;
}

export interface AnswerAdminResponse {
  answerId: string;
  answerText?: string;
  answerLabel?: string;
  isCorrect?: boolean;
}

export interface PassageMediaRequest {
  passageId?: string;
  mediaUrl?: string;
  mediaType?: MediaType;
}

export interface PassageMediaResponse {
  id: string;
  passageId?: string;
  mediaUrl?: string;
  mediaType?: MediaType;
  content?: string;
}

export interface PassageRequest {
  content?: string;
  contentTranslation?: string;
  mediaUrl?: string;
  passageType?: PassageType;
  extraContents?: string[];
}

export interface PassageResponse {
  passageId: string;
  content?: string;
  contentTranslation?: string;
  mediaUrl?: string;
  passageType?: PassageType;
  passageMedias?: PassageMediaResponse[];
}

export interface QuestionCreateRequest {
  examPartId?: string;
  classId?: string;
  chapterId?: string;
  passage?: PassageRequest;
  questionText?: string;
  questionType?: QuestionType;
  answers?: AnswerRequest[];
  isBank?: boolean;

  usageScope?: QuestionUsageScope;
  collectionId?: string;
  explanation?: string;
  tagIds?: string[];
}

export interface NormalQuestionRequest {
  questionText?: string;
  questionType?: QuestionType;
  answers?: AnswerRequest[];
  needsManualCorrect?: boolean;
  collectionId?: string;
  explanation?: string;
  tagIds?: string[];
  tagNames?: string[];
  questionNumber?: number;
}

export interface CreateQuestionAndAttachRequest {
  testPartId?: string;
  classId?: string;
  chapterId?: string;
  passage?: PassageRequest;
  questionText?: string;
  questionType?: QuestionType;
  answers?: AnswerRequest[];
  collectionId?: string;
  explanation?: string;
  tagIds?: string[];
  tagNames?: string[];
}

export interface BulkCreateQuestionsToBankRequest {
  examPartId?: string;
  classId?: string;
  chapterId?: string;
  questions?: NormalQuestionRequest[];

  usageScope?: QuestionUsageScope;
}

export interface PassageQuestionGroupRequest {
  passage?: PassageRequest;
  questions?: NormalQuestionRequest[];
}

export interface BulkPassageGroupRequest {
  examPartId?: string;
  classId?: string;
  chapterId?: string;
  groups?: PassageQuestionGroupRequest[];

  usageScope?: QuestionUsageScope;
}

export interface QuestionJsonImportRequest {
  version?: number;
  examPartId?: string;
  classId?: string;
  chapterId?: string;
  usageScope?: QuestionUsageScope;
  questions?: NormalQuestionRequest[];
  groups?: PassageQuestionGroupRequest[];
}

export interface QuestionJsonImportPreviewResponse {
  valid: boolean;
  questionCount: number;
  groupCount: number;
  errors: string[];
  warnings: string[];
  questions: NormalQuestionRequest[];
  groups: PassageQuestionGroupRequest[];
}

export interface BulkQuestionWithPassageRequest {
  examPartId?: string;
  classId?: string;
  chapterId?: string;
  passage?: PassageRequest;
  questions?: NormalQuestionRequest[];

  usageScope?: QuestionUsageScope;
}

export interface QuestionAdminResponse {
  questionId: string;
  questionNumber?: number;
  examPartId?: string;
  questionText?: string;
  questionType?: QuestionType;
  explanation?: string;
  examTypeId?: string;
  classId?: string;
  isBank?: boolean;
  usageScope?: QuestionUsageScope;
  collectionId?: string;
  passage?: PassageResponse;
  passageMedia?: PassageMediaResponse[];
  answers?: AnswerAdminResponse[];
  tags?: TagResponse[];
}

export interface AdminQuestionListItem {
  questionId: string;
  questionNumber?: number;
  questionText?: string;
  questionType?: QuestionType;
  usageScope?: QuestionUsageScope;
  isBank?: boolean;
  createdAt?: string;
  examPartId?: string;
  examPartName?: string;
  examTypeId?: string;
  examTypeName?: string;
  collectionId?: string;
  collectionName?: string;
  tagNames?: string[];
}

export interface AdminQuestionSearchParams {
  examTypeId?: string;
  examPartId?: string;
  collectionId?: string;
  usageScope?: QuestionUsageScope;
  questionType?: QuestionType;
  isBank?: boolean;
  keyword?: string;
  page?: number;
  size?: number;
}

export interface BulkUpdateQuestionsRequest {
  questionIds: string[];
  usageScope?: QuestionUsageScope | null;
  collectionId?: string | null;
  clearCollection?: boolean;
  isBank?: boolean | null;
}

export interface BulkUpdateQuestionsResponse {
  updatedCount: number;
  missingQuestionIds?: string[];
}

export interface QuestionGroupAdminResponse {
  passage?: PassageResponse;
  questions?: QuestionAdminResponse[];
}

export interface QuestionCollectionRequest {
  name?: string;
  description?: string;
  parentId?: string;
  examTypeId?: string;
  displayOrder?: number;
}

export interface QuestionCollectionResponse {
  collectionId: string;
  name?: string;
  description?: string;
  questionCount?: number;
  parentId?: string;
  parentName?: string;
  childCount?: number;
  totalQuestionCount?: number;
  examTypeId?: string;
  displayOrder?: number;
}

export interface AddRandomQuestionsResponse {
  addedCount: number;
}
