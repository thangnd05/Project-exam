import { MediaType, PassageType, QuestionType } from '@/app/enums';

export interface TagRequest {
  name?: string;
  examTypeId?: string;
  parentId?: string;
  sortOrder?: number;
}

export interface TagResponse {
  tagId: string;
  name?: string;
  examTypeId?: string;
  parentId?: string;
  sortOrder?: number;
  children?: TagResponse[];
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
}

export interface BulkQuestionWithPassageRequest {
  examPartId?: string;
  classId?: string;
  chapterId?: string;
  passage?: PassageRequest;
  questions?: NormalQuestionRequest[];
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
  collectionId?: string;
  passage?: PassageResponse;
  passageMedia?: PassageMediaResponse[];
  answers?: AnswerAdminResponse[];
  tags?: TagResponse[];
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
