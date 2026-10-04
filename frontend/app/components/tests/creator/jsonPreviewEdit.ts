import type { NormalQuestionRequest, PassageQuestionGroupRequest, PassageRequest } from '@/app/types';
import type { DraftQuestion } from '@/app/hooks/useCreateTest';
import { resolveQuestionTags } from './tagStatus';

/** Vị trí của câu trong một phần thi: câu độc lập (groupIndex null) hoặc câu trong nhóm đoạn văn. */
export type PreviewLocation = { groupIndex: number | null; index: number };

export type PreviewPartData = {
  questions: NormalQuestionRequest[];
  groups: PassageQuestionGroupRequest[];
};

/** Thay (hoặc xoá khi {@code question} null) một câu; nhóm hết câu thì bỏ luôn nhóm. */
export const applyQuestionEdit = (
  part: PreviewPartData,
  loc: PreviewLocation,
  question: NormalQuestionRequest | null,
): PreviewPartData => {
  if (loc.groupIndex === null) {
    const questions = question
      ? part.questions.map((q, i) => (i === loc.index ? question : q))
      : part.questions.filter((_, i) => i !== loc.index);
    return { ...part, questions };
  }
  const groups = part.groups
    .map((g, gi) => {
      if (gi !== loc.groupIndex) return g;
      const groupQuestions = g.questions || [];
      return {
        ...g,
        questions: question
          ? groupQuestions.map((q, i) => (i === loc.index ? question : q))
          : groupQuestions.filter((_, i) => i !== loc.index),
      };
    })
    .filter((g) => (g.questions || []).length > 0);
  return { ...part, groups };
};

export const countQuestions = (part: PreviewPartData) =>
  part.questions.length + part.groups.reduce((n, g) => n + (g.questions || []).length, 0);

/**
 * Chuyển câu sang dạng khung soạn thảo. Tag ghi bằng tên được đổi sang id để bỏ chọn được;
 * tên không khớp tag nào giữ lại trong tagNames để vẫn thấy cảnh báo.
 */
export const toDraftQuestion = (question: NormalQuestionRequest, partTags: any[]): DraftQuestion => {
  const { ids, unmatched } = resolveQuestionTags(question, partTags);
  return {
    questionText: question.questionText || '',
    questionType: question.questionType || 'MCQ',
    mediaFiles: [],
    mediaUrl: '',
    passageType: 'READING',
    explanation: question.explanation || '',
    tagIds: ids,
    tagNames: unmatched,
    answers: (question.answers || []).map((a, i) => ({
      answerLabel: a.answerLabel || String.fromCharCode(65 + i),
      answerText: a.answerText || '',
      isCorrect: !!a.isCorrect,
    })),
  };
};

export const fromDraftQuestion = (draft: DraftQuestion, original: NormalQuestionRequest): NormalQuestionRequest => ({
  ...original,
  questionText: draft.questionText,
  questionType: draft.questionType as NormalQuestionRequest['questionType'],
  explanation: draft.explanation?.trim() || undefined,
  tagIds: draft.tagIds,
  tagNames: draft.tagNames,
  answers: draft.answers.map((a) => ({ answerLabel: a.answerLabel, answerText: a.answerText, isCorrect: a.isCorrect })),
});

/** Chỉ giữ trường mà import JSON chấp nhận: backend đọc strict, trường lạ là bị từ chối cả file. */
const toImportQuestion = (q: NormalQuestionRequest, examPart?: string) => ({
  ...(examPart ? { examPart } : {}),
  questionText: q.questionText,
  questionType: q.questionType,
  explanation: q.explanation || undefined,
  collectionId: q.collectionId || undefined,
  questionNumber: q.questionNumber || undefined,
  tagIds: q.tagIds?.length ? q.tagIds : undefined,
  tagNames: q.tagNames?.length ? q.tagNames : undefined,
  answers: (q.answers || []).map((a) => ({
    answerLabel: a.answerLabel,
    answerText: a.answerText,
    isCorrect: !!a.isCorrect,
  })),
});

const toImportPassage = (p?: PassageRequest) => ({
  content: p?.content || undefined,
  contentTranslation: p?.contentTranslation || undefined,
  mediaUrl: p?.mediaUrl || undefined,
  passageType: p?.passageType || undefined,
  extraContents: p?.extraContents?.length ? p.extraContents : undefined,
});

/**
 * Dựng lại file JSON từ dữ liệu đã sửa để gửi thay file gốc. Với đề nhiều phần thi, mỗi câu
 * ghi rõ examPart (id phần thi) nên backend xếp đúng phần dù tag đã bị sửa.
 */
export const buildImportFile = (
  fileName: string,
  parts: Array<PreviewPartData & { examPartId?: string }>,
): File => {
  const payload = {
    version: 1,
    questions: parts.flatMap((p) => p.questions.map((q) => toImportQuestion(q, p.examPartId))),
    groups: parts.flatMap((p) => p.groups.map((g) => ({
      ...(p.examPartId ? { examPart: p.examPartId } : {}),
      passage: toImportPassage(g.passage),
      questions: (g.questions || []).map((q) => toImportQuestion(q)),
    }))),
  };
  return new File([JSON.stringify(payload)], fileName, { type: 'application/json' });
};
