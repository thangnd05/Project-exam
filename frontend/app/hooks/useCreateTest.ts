'use client';

import { useState } from 'react';
import { useBaseMetaData } from '@/app/hooks/useBaseMetaData';
import { useTestSubmission } from '@/app/hooks/useTestSubmission';

export const CREATOR_TYPES = {
  TEST: 'test',
  BANK: 'bank',
  BULK: 'bulk',
  PASSAGE: 'passage',
} as const;

export type CreatorType = (typeof CREATOR_TYPES)[keyof typeof CREATOR_TYPES];

/** Một đáp án đang soạn trong form (chưa gửi BE nên vẫn giữ cờ isCorrect). */
export interface DraftAnswer {
  answerLabel: string;
  answerText: string;
  isCorrect: boolean;
}

/**
 * Câu hỏi đang soạn: khác QuestionResponse của BE vì còn giữ File chưa upload và
 * questionType chỉ toggle giữa 'MCQ' / 'MSQ' (checkbox "Nhiều đáp án đúng") nên để string.
 */
export interface DraftQuestion {
  questionText: string;
  questionType: string;
  mediaFiles: File[];
  mediaUrl: string;
  passageType: string;
  explanation: string;
  tagIds: string[];
  tagNames: string[];
  answers: DraftAnswer[];
}

/** Passage đang soạn (nhiều đoạn text qua extraContents, xem memory passage-multi-text-design). */
export interface DraftPassage {
  content: string;
  contentTranslation: string;
  passageType: string;
  mediaFiles: File[];
  extraContents: string[];
  inputMode: string;
}

export interface DraftGroup {
  passage: DraftPassage;
  questions: DraftQuestion[];
}

/** Form thông tin đề: mọi ô input đều là chuỗi, ép số ngay lúc submit. */
export interface TestInfoForm {
  title: string;
  description: string;
  durationMinutes: string;
  maxAttempts: string;
  examTypeId: string;
  examPartId: string;
  bannerUrl: string;
  availableFrom: string;
  availableTo: string;
  collectionId: string;
  costCoins: string;
}

export interface CreatorNotification {
  type?: string;
  message?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_QUESTIONS = 40;
const MIN_ANSWERS = 2;
const MAX_ANSWERS = 10;

const emptyQuestion: DraftQuestion = {
  questionText: '',
  questionType: 'MCQ',
  mediaFiles: [],
  mediaUrl: '',
  passageType: 'LISTENING',
  explanation: '',
  tagIds: [],
  tagNames: [],
  answers: [
    { answerLabel: 'A', answerText: '', isCorrect: false },
    { answerLabel: 'B', answerText: '', isCorrect: false },
    { answerLabel: 'C', answerText: '', isCorrect: false },
    { answerLabel: 'D', answerText: '', isCorrect: false },
  ],
};

const cloneEmptyQuestion = (): DraftQuestion => JSON.parse(JSON.stringify(emptyQuestion));

const createInitialGroup = (): DraftGroup => ({
  passage: {
    content: '',
    contentTranslation: '',
    passageType: 'READING',
    mediaFiles: [],
    extraContents: [],
    inputMode: 'TEXT',
  },
  questions: [cloneEmptyQuestion()],
});

const getAnswerLabelByIndex = (index: number) => String.fromCharCode(65 + index);

const normalizeAnswerLabels = (answers: DraftAnswer[]): DraftAnswer[] =>
  answers.map((answer, index) => ({
    ...answer,
    answerLabel: getAnswerLabelByIndex(index),
  }));

export interface UseCreateTestOptions {
  mode?: string;
  classId?: string | null;
  chapterId?: string | null;
  creatorType?: CreatorType;
}

export const useCreateTest = ({
  mode,
  classId,
  chapterId,
  creatorType = CREATOR_TYPES.TEST,
}: UseCreateTestOptions) => {
  const [testInfo, setTestInfo] = useState<TestInfoForm>({
    title: '',
    description: '',
    durationMinutes: '',
    maxAttempts: '',
    examTypeId: '',
    examPartId: '',
    bannerUrl: '',
    availableFrom: '',
    availableTo: '',
    collectionId: '',
    costCoins: '',
  });

  const [questions, setQuestions] = useState<DraftQuestion[]>([cloneEmptyQuestion()]);
  const [groups, setGroups] = useState<DraftGroup[]>([createInitialGroup()]);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [notification, setNotification] = useState<CreatorNotification>({});

  const { examTypes, examParts, questionCollections, availableTags } = useBaseMetaData(testInfo.examTypeId);

  const { handleSubmit: submitLogic, isSubmitting } = useTestSubmission({
    mode,
    classId,
    chapterId,
    testInfo,
    questions,
    groups,
    documentFile,
    setQuestions,
    setGroups,
    setDocumentFile,
    setNotification,
    emptyQuestion,
    createInitialGroup,
  });

  const handleExamTypeChange = async (value: string) => {
    setTestInfo((prev) => ({ ...prev, examTypeId: value, examPartId: '' }));
  };

  const addQuestion = () => {
    if (questions.length >= MAX_QUESTIONS) {
      setNotification({ type: 'warning', message: `Hệ thống giới hạn tối đa ${MAX_QUESTIONS} câu hỏi mỗi lần tạo.` });
      return;
    }
    setQuestions([...questions, cloneEmptyQuestion()]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestionText = (index: number, value: string) => {
    const newQ = [...questions];
    newQ[index] = { ...newQ[index], questionText: value };
    setQuestions(newQ);
  };

  const updateQuestionField = (index: number, field: string, value: any) => {
    const newQ = [...questions];
    newQ[index] = { ...newQ[index], [field]: value } as DraftQuestion;

    if (field === 'mediaUrl' && value) {
      const lowerVal = String(value).toLowerCase();
      if (['.mp3', '.wav', '.ogg', '.m4a'].some(ext => lowerVal.endsWith(ext))) {
        newQ[index].passageType = 'LISTENING';
      } else if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].some(ext => lowerVal.endsWith(ext))) {
        newQ[index].passageType = 'READING';
      }
    }

    setQuestions(newQ);
  };

  const updateAnswer = (qIndex: number, aIndex: number, field: string, value: any) => {
    const newQ = [...questions];
    if (field === 'isCorrect') {

      if (newQ[qIndex].questionType === 'MSQ')
        newQ[qIndex].answers = newQ[qIndex].answers.map((a, i) => (i === aIndex ? { ...a, isCorrect: value } : a));
      else
        newQ[qIndex].answers = newQ[qIndex].answers.map((a, i) => ({ ...a, isCorrect: i === aIndex }));
    } else
      newQ[qIndex].answers[aIndex] = { ...newQ[qIndex].answers[aIndex], [field]: value } as DraftAnswer;
    setQuestions(newQ);
  };

  const addAnswer = (qIndex: number) => {
    const newQ = [...questions];
    const currentAnswers = newQ[qIndex].answers || [];
    if (currentAnswers.length >= MAX_ANSWERS) {
      setNotification({ type: 'warning', message: `Tối đa ${MAX_ANSWERS} đáp án cho mỗi câu.` });
      return;
    }
    const nextAnswer: DraftAnswer = {
      answerLabel: getAnswerLabelByIndex(currentAnswers.length),
      answerText: '',
      isCorrect: false,
    };
    newQ[qIndex].answers = [...currentAnswers, nextAnswer];
    setQuestions(newQ);
  };

  const removeAnswer = (qIndex: number, aIndex: number) => {
    const newQ = [...questions];
    const currentAnswers = newQ[qIndex].answers || [];
    if (currentAnswers.length <= MIN_ANSWERS) {
      setNotification({ type: 'warning', message: `Mỗi câu phải có ít nhất ${MIN_ANSWERS} đáp án.` });
      return;
    }
    const removedAnswer = currentAnswers[aIndex];
    const filteredAnswers = currentAnswers.filter((_, index) => index !== aIndex);
    const hasCorrectAnswer = filteredAnswers.some((answer) => answer.isCorrect);
    const resetCorrectAnswers =
      removedAnswer?.isCorrect && !hasCorrectAnswer
        ? filteredAnswers.map((answer) => ({ ...answer, isCorrect: false }))
        : filteredAnswers;
    newQ[qIndex].answers = normalizeAnswerLabels(resetCorrectAnswers);
    setQuestions(newQ);
  };

  const addMediaFiles = (index: number, fileList: FileList | File[] | null | undefined) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    const oversizedFile = files.find((f) => f.size > MAX_FILE_SIZE);
    if (oversizedFile) {
      setNotification({ type: 'warning', message: `File "${oversizedFile.name}" vượt quá ${MAX_FILE_SIZE / 1024 / 1024}MB.` });
      return;
    }

    const newQ = [...questions];
    const allFiles = [...(newQ[index].mediaFiles || []), ...files];

    if (allFiles.some((f) => f.type.startsWith('audio/'))) {
      newQ[index].passageType = 'LISTENING';
    } else if (allFiles.some((f) => f.type.startsWith('image/'))) {
      newQ[index].passageType = 'READING';
    }

    newQ[index].mediaFiles = allFiles;
    setQuestions(newQ);
  };

  const removeMediaFile = (qIndex: number, fileIndex: number) => {
    const newQ = [...questions];
    newQ[qIndex].mediaFiles = newQ[qIndex].mediaFiles.filter((_, i) => i !== fileIndex);
    setQuestions(newQ);
  };

  const setPassageType = (index: number, passageType: string) => {
    const newQ = [...questions];
    newQ[index] = { ...newQ[index], passageType, mediaFiles: [] };
    setQuestions(newQ);
  };

  const addGroup = () => {
    if (groups.length >= MAX_QUESTIONS) {
      setNotification({ type: 'warning', message: `Hệ thống giới hạn tối đa ${MAX_QUESTIONS} nhóm mỗi lần tạo.` });
      return;
    }
    setGroups([...groups, createInitialGroup()]);
  };

  const removeGroup = (gIndex: number) => {
    if (groups.length > 1) setGroups(groups.filter((_, i) => i !== gIndex));
  };

  const updatePassage = (gIndex: number, field: string, value: any) => {
    const newGroups = [...groups];
    newGroups[gIndex].passage = { ...newGroups[gIndex].passage, [field]: value } as DraftPassage;
    if (field === 'passageType') newGroups[gIndex].passage.mediaFiles = [];
    if (field === 'inputMode') {
      if (value === 'TEXT') {
        newGroups[gIndex].passage.mediaFiles = [];
      } else if (value === 'UPLOAD') {
        newGroups[gIndex].passage.content = '';
      }
    }
    setGroups(newGroups);
  };

  const addGroupMediaFiles = (gIndex: number, fileList: FileList | File[] | null | undefined) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    const oversizedFile = files.find((f) => f.size > MAX_FILE_SIZE);
    if (oversizedFile) {
      setNotification({ type: 'warning', message: `File "${oversizedFile.name}" vượt quá ${MAX_FILE_SIZE / 1024 / 1024}MB.` });
      return;
    }

    const newGroups = [...groups];
    const allFiles = [...(newGroups[gIndex].passage.mediaFiles || []), ...files];

    if (allFiles.some((f) => f.type.startsWith('audio/'))) {
      newGroups[gIndex].passage.passageType = 'LISTENING';
    } else if (allFiles.some((f) => f.type.startsWith('image/'))) {
      newGroups[gIndex].passage.passageType = 'READING';
    }

    newGroups[gIndex].passage.mediaFiles = allFiles;
    newGroups[gIndex].passage.inputMode = 'UPLOAD';
    setGroups(newGroups);
  };

  const removeGroupMediaFile = (gIndex: number, fIndex: number) => {
    const newGroups = [...groups];
    newGroups[gIndex].passage.mediaFiles = newGroups[gIndex].passage.mediaFiles.filter((_, i) => i !== fIndex);
    setGroups(newGroups);
  };

  const addGroupPassageText = (gIndex: number) => {
    const newGroups = [...groups];
    const current = newGroups[gIndex].passage.extraContents || [];
    newGroups[gIndex].passage = {
      ...newGroups[gIndex].passage,
      extraContents: [...current, ''],
    };
    setGroups(newGroups);
  };

  const updateGroupPassageText = (gIndex: number, tIndex: number, value: string) => {
    const newGroups = [...groups];
    const current = [...(newGroups[gIndex].passage.extraContents || [])];
    current[tIndex] = value;
    newGroups[gIndex].passage = { ...newGroups[gIndex].passage, extraContents: current };
    setGroups(newGroups);
  };

  const removeGroupPassageText = (gIndex: number, tIndex: number) => {
    const newGroups = [...groups];
    const current = newGroups[gIndex].passage.extraContents || [];
    newGroups[gIndex].passage = {
      ...newGroups[gIndex].passage,
      extraContents: current.filter((_, i) => i !== tIndex),
    };
    setGroups(newGroups);
  };

  const addGroupQuestion = (gIndex: number) => {
    const newGroups = [...groups];
    newGroups[gIndex].questions.push(cloneEmptyQuestion());
    setGroups(newGroups);
  };

  const removeGroupQuestion = (gIndex: number, qIndex: number) => {
    const newGroups = [...groups];
    if (newGroups[gIndex].questions.length > 1) {
      newGroups[gIndex].questions = newGroups[gIndex].questions.filter((_, i) => i !== qIndex);
      setGroups(newGroups);
    }
  };

  const updateGroupQuestion = (gIndex: number, qIndex: number, field: string, value: any) => {
    const newGroups = [...groups];
    newGroups[gIndex].questions[qIndex] = { ...newGroups[gIndex].questions[qIndex], [field]: value } as DraftQuestion;
    setGroups(newGroups);
  };

  const setGroupQuestions = (gIndex: number, nextQuestions: DraftQuestion[]) => {
    const normalized = Array.isArray(nextQuestions) && nextQuestions.length > 0
      ? nextQuestions
      : [cloneEmptyQuestion()];
    const newGroups = [...groups];
    newGroups[gIndex].questions = normalized;
    setGroups(newGroups);
  };

  const updateGroupAnswer = (gIndex: number, qIndex: number, aIndex: number, field: string, value: any) => {
    const newGroups = [...groups];
    const q = newGroups[gIndex].questions[qIndex];
    if (field === 'isCorrect') {
      if (q.questionType === 'MSQ')
        q.answers = q.answers.map((a, i) => (i === aIndex ? { ...a, isCorrect: value } : a));
      else
        q.answers = q.answers.map((a, i) => ({ ...a, isCorrect: i === aIndex }));
    } else q.answers[aIndex] = { ...q.answers[aIndex], [field]: value } as DraftAnswer;
    setGroups(newGroups);
  };

  const addGroupAnswer = (gIndex: number, qIndex: number) => {
    const newGroups = [...groups];
    const currentAnswers = newGroups[gIndex].questions[qIndex].answers || [];
    if (currentAnswers.length >= MAX_ANSWERS) {
      setNotification({ type: 'warning', message: `Tối đa ${MAX_ANSWERS} đáp án cho mỗi câu.` });
      return;
    }
    const nextAnswer: DraftAnswer = {
      answerLabel: getAnswerLabelByIndex(currentAnswers.length),
      answerText: '',
      isCorrect: false,
    };
    newGroups[gIndex].questions[qIndex].answers = [...currentAnswers, nextAnswer];
    setGroups(newGroups);
  };

  const removeGroupAnswer = (gIndex: number, qIndex: number, aIndex: number) => {
    const newGroups = [...groups];
    const currentAnswers = newGroups[gIndex].questions[qIndex].answers || [];
    if (currentAnswers.length <= MIN_ANSWERS) {
      setNotification({ type: 'warning', message: `Mỗi câu phải có ít nhất ${MIN_ANSWERS} đáp án.` });
      return;
    }
    const removedAnswer = currentAnswers[aIndex];
    const filteredAnswers = currentAnswers.filter((_, index) => index !== aIndex);
    const hasCorrectAnswer = filteredAnswers.some((answer) => answer.isCorrect);
    const resetCorrectAnswers =
      removedAnswer?.isCorrect && !hasCorrectAnswer
        ? filteredAnswers.map((answer) => ({ ...answer, isCorrect: false }))
        : filteredAnswers;
    newGroups[gIndex].questions[qIndex].answers = normalizeAnswerLabels(resetCorrectAnswers);
    setGroups(newGroups);
  };

  const setGroupPassageType = (gIndex: number, passageType: string) => {
    const newGroups = [...groups];
    newGroups[gIndex].passage = { ...newGroups[gIndex].passage, passageType, mediaFiles: [] };
    setGroups(newGroups);
  };

  const handleSubmit = () => submitLogic(creatorType);

  return {
    creatorType,
    examTypes,
    examParts,
    testInfo,
    setTestInfo,
    questions,
    setQuestions,
    groups,
    setGroups,
    documentFile,
    setDocumentFile,
    loading: isSubmitting,
    notification,
    handleExamTypeChange,
    addQuestion,
    removeQuestion,
    updateQuestionText,
    updateQuestionField,
    updateAnswer,
    addAnswer,
    removeAnswer,
    addMediaFiles,
    removeMediaFile,
    setPassageType,
    addGroup,
    removeGroup,
    updatePassage,
    addGroupMediaFiles,
    removeGroupMediaFile,
    addGroupPassageText,
    updateGroupPassageText,
    removeGroupPassageText,
    addGroupQuestion,
    removeGroupQuestion,
    updateGroupQuestion,
    setGroupQuestions,
    updateGroupAnswer,
    addGroupAnswer,
    removeGroupAnswer,
    setGroupPassageType,
    handleSubmit,
    questionCollections,
    availableTags,
  };
};
