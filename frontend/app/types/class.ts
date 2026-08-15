import { ClassMemberStatus } from '@/app/enums';

export interface ClassRequest {
  className?: string;
  description?: string;
}

export interface ClassResponse {
  classId: string;
  classQr?: string;
  className?: string;
  description?: string;
  teacherId?: string;
  createdAt?: string;
}

export interface ClassSimpleResponse {
  classId: string;
  classQr?: string;
  className?: string;
}

export interface ClassStudentResponse {
  classId: string;
  classQr?: string;
  className?: string;
  teacherName?: string;
}

export interface ChapterRequest {
  classId?: string;
  title?: string;
  description?: string;
}

export interface ChapterResponse {
  chapterId: string;
  classId?: string;
  title?: string;
  description?: string;
  createdAt?: string;
}

export interface ClassMemberActionRequest {
  classId?: string;
  userId?: string;
}

export interface ClassMemberJoinRequest {
  classId?: string;
  classQr?: string;
}

export interface ClassMemberResponse {
  id: string;
  classId?: string;
  userId?: string;
  fullName?: string;
  status?: ClassMemberStatus;
  joinedAt?: string;
}

export interface MyClassesResponse {
  teachingClasses?: ClassStudentResponse[];
  learningClasses?: ClassStudentResponse[];
}
