import type { PassageResponse, QuestionResponse } from '@/app/types';

export type ExamPassage = PassageResponse | null | undefined;

export type ExamQuestion = QuestionResponse;

export type ExamQuestionGroup = {
  passage?: ExamPassage;
  questions?: ExamQuestion[];
};

export type ExamPart = {
  testPartId: string;
  partName?: string;
  questionGroups?: ExamQuestionGroup[];
};

export type ExamUserAnswer = {
  selectedAnswerId?: string | null;
  selectedAnswerIds?: string[] | null;
  answerText?: string | null;
};

export type ExamUserAnswers = Record<string, ExamUserAnswer>;

export type QuestionIndexMap = Record<string, number>;

export type AnswerChangeHandler = (
  questionId: string,
  questionType: string,
  value: string,
) => void;

export type ExamFlowStep = {
  key: string;
  partId?: string;
  partName?: string;
  sectionType?: 'LISTENING' | 'READING' | null;
  audioGated?: boolean;
  passage?: ExamPassage;
  questions: ExamQuestion[];
};
