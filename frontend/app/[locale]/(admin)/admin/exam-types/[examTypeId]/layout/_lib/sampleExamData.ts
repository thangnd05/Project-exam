import { PassageType, QuestionType } from '@/app/enums';
import type {
  ExamFlowStep,
  ExamPart,
  ExamQuestion,
  QuestionIndexMap,
} from '@/app/features/exam-layout/examLayoutTypes';

export type SampleExamTexts = {
  passage: string;
  questionWithPassage: string;
  questionWithoutPassage: string;
  answer: (label: string) => string;
};

const sampleAnswers = (prefix: string, texts: SampleExamTexts) =>
  ['A', 'B', 'C', 'D'].map((label, i) => ({
    answerId: `${prefix}${i + 1}`,
    answerLabel: label,
    answerText: texts.answer(label),
  }));

export function buildSampleExam(texts: SampleExamTexts) {
  const sampleExamData: { visibleParts: ExamPart[] } = {
    visibleParts: [
      {
        testPartId: 'sample-part-1',
        questionGroups: [
          {
            passage: {
              passageId: 'sample-passage-1',
              passageType: PassageType.READING,
              content: texts.passage,
            },
            questions: [
              {
                questionId: 'sample-q-1',
                questionType: QuestionType.MCQ,
                questionText: texts.questionWithPassage,
                answers: sampleAnswers('a', texts),
              },
            ],
          },
          {
            passage: null,
            questions: [
              {
                questionId: 'sample-q-2',
                questionType: QuestionType.MCQ,
                questionText: texts.questionWithoutPassage,
                answers: sampleAnswers('b', texts),
              },
            ],
          },
        ],
      },
    ],
  };

  const sampleAllQuestions: ExamQuestion[] = sampleExamData.visibleParts
    .flatMap((p) => p.questionGroups || [])
    .flatMap((g) => g.questions || []);

  const sampleQuestionIndexMap: QuestionIndexMap = sampleAllQuestions.reduce(
    (map: QuestionIndexMap, q, i) => {
      map[q.questionId] = i + 1;
      return map;
    },
    {},
  );

  // Mỗi nhóm câu là một bước, giống cách phòng thi chia bước ở chế độ "Từng câu/nhóm một".
  const sampleFlowSteps: ExamFlowStep[] = sampleExamData.visibleParts.flatMap((part) =>
    (part.questionGroups || []).map((group, gi) => ({
      key: group.passage?.passageId || group.questions?.[0]?.questionId || `${part.testPartId}-${gi}`,
      partId: part.testPartId,
      partName: part.partName || '',
      sectionType: null,
      audioGated: false,
      passage: group.passage || null,
      questions: group.questions || [],
    })),
  );

  return { sampleExamData, sampleAllQuestions, sampleQuestionIndexMap, sampleFlowSteps };
}
