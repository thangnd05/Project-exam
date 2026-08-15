import type { PassageResponse, QuestionResponse } from '@/app/types';

/**
 * Kiểu dữ liệu bài làm đi qua engine layout (trang làm bài + preview của layout builder).
 * Dữ liệu thật đến từ useTestSession (còn .js) và dữ liệu mẫu từ sampleExamData, cấu trúc
 * rộng hơn TestPartResponse một chút (passage có thể null) nên khai riêng ở đây.
 */
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

/** Đáp án người dùng đang chọn, gom theo questionId. */
export type ExamUserAnswer = {
  selectedAnswerId?: string;
  selectedAnswerIds?: string[];
  answerText?: string;
};

export type ExamUserAnswers = Record<string, ExamUserAnswer>;

/** questionId -> số thứ tự hiển thị (1-based) */
export type QuestionIndexMap = Record<string, number>;

export type AnswerChangeHandler = (
  questionId: string,
  questionType: string,
  value: string,
) => void;

/** Một bước trong chế độ PAGED (từng câu/nhóm kiểu TOEIC), dựng bởi useExamFlowNavigation. */
export type ExamFlowStep = {
  key: string;
  partId?: string;
  partName?: string;
  sectionType?: 'LISTENING' | 'READING' | null;
  /** true = nhóm nghe khoá theo audio: hết audio mới tự chuyển bước */
  audioGated?: boolean;
  passage?: ExamPassage;
  questions: ExamQuestion[];
};
