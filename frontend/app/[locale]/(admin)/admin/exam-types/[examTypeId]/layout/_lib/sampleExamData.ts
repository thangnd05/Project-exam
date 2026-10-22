import { PassageType, QuestionType } from '@/app/enums';
import type { ExamPart, ExamQuestion, QuestionIndexMap } from '@/app/features/exam-layout/examLayoutTypes';

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

  return { sampleExamData, sampleAllQuestions, sampleQuestionIndexMap };
}
