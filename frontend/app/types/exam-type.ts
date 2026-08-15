export interface ExamTypeRequest {
  name?: string;
  description?: string;
  imageUrl?: string;
  durationMinutes?: number;
  scoringMethod?: string;
  flexible?: boolean;
  parentId?: string;
}

export interface ExamTypeResponse {
  examTypeId: string;
  name?: string;
  description?: string;
  imageUrl?: string;
  durationMinutes?: number;
  scoringMethod?: string;
  flexible?: boolean;
  parentId?: string;
  parentName?: string;
  childCount?: number;
}

export interface ExamTypeLayoutRequest {
  config?: string;
}

export interface ExamTypeLayoutResponse {
  examTypeId: string;
  config?: string;
  updatedAt?: string;
}

export interface ExamCategoryRequest {
  code?: string;
  name?: string;
  description?: string;
  guestAllowed?: boolean;
  certificateEligible?: boolean;
  displayOrder?: number;
}

export interface ExamCategoryResponse {
  examCategoryId: string;
  code?: string;
  name?: string;
  description?: string;
  guestAllowed?: boolean;
  certificateEligible?: boolean;
  displayOrder?: number;
  createdAt?: string;
}

export interface ExamPartRequest {
  examTypeId?: string;
  name?: string;
  description?: string;
  defaultNumQuestions?: number;
  skillId?: string;
  displayOrder?: number;
}

export interface ExamPartResponse {
  examPartId: string;
  examTypeId?: string;
  name?: string;
  description?: string;
  defaultNumQuestions?: number;
  skillId?: string;
  displayOrder?: number;
}

export interface SkillRequest {
  name?: string;
  description?: string;
}

export interface SkillResponse {
  skillId: string;
  name?: string;
  description?: string;
}

export interface ScoringConversionRequest {
  examTypeId?: string;
  skillId?: string;
  numCorrect?: number;
  convertedScore?: number;
}

export interface ScoringConversionResponse {
  conversionId: string;
  examTypeId?: string;
  skillId?: string;
  numCorrect?: number;
  convertedScore?: number;
}

export interface PartResponse {
  examPartId: string;
  numQuestions?: number;
  questionIds?: string[];
}
