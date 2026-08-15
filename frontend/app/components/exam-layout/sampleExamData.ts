import { PassageType, QuestionType } from '@/app/enums';
import type { ExamPart, ExamQuestion, QuestionIndexMap } from '@/app/components/exam-layout/examLayoutTypes';

// Dữ liệu mẫu cho phần xem trước của layout builder (trang admin exam-types/[examTypeId]/layout).
export const sampleExamData: { visibleParts: ExamPart[] } = {
  visibleParts: [
    {
      testPartId: 'sample-part-1',
      questionGroups: [
        {
          passage: {
            passageId: 'sample-passage-1',
            passageType: PassageType.READING,
            content: 'Đoạn văn mẫu để xem bố cục vùng đọc.',
          },
          questions: [
            {
              questionId: 'sample-q-1',
              questionType: QuestionType.MCQ,
              questionText: 'Nội dung câu hỏi mẫu (có đoạn văn).',
              answers: [
                { answerId: 'a1', answerLabel: 'A', answerText: 'Đáp án A' },
                { answerId: 'a2', answerLabel: 'B', answerText: 'Đáp án B' },
                { answerId: 'a3', answerLabel: 'C', answerText: 'Đáp án C' },
                { answerId: 'a4', answerLabel: 'D', answerText: 'Đáp án D' },
              ],
            },
          ],
        },
        {
          passage: null,
          questions: [
            {
              questionId: 'sample-q-2',
              questionType: QuestionType.MCQ,
              questionText: 'Nội dung câu hỏi mẫu (không có đoạn văn).',
              answers: [
                { answerId: 'b1', answerLabel: 'A', answerText: 'Đáp án A' },
                { answerId: 'b2', answerLabel: 'B', answerText: 'Đáp án B' },
                { answerId: 'b3', answerLabel: 'C', answerText: 'Đáp án C' },
                { answerId: 'b4', answerLabel: 'D', answerText: 'Đáp án D' },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export const sampleAllQuestions: ExamQuestion[] = sampleExamData.visibleParts
  .flatMap((p) => p.questionGroups || [])
  .flatMap((g) => g.questions || []);

export const sampleQuestionIndexMap: QuestionIndexMap = sampleAllQuestions.reduce(
  (map: QuestionIndexMap, q, i) => {
    map[q.questionId] = i + 1;
    return map;
  },
  {},
);
