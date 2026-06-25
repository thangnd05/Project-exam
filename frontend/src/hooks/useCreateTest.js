import { useState } from 'react';
import { useBaseMetaData } from './useBaseMetaData';
import { useTestSubmission } from './useTestSubmission';

export const CREATOR_TYPES = {
  TEST: 'test',
  BANK: 'bank',
  BULK: 'bulk',
  PASSAGE: 'passage',
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_QUESTIONS = 40;
const MIN_ANSWERS = 2;
const MAX_ANSWERS = 10;

const emptyQuestion = {
  questionText: '',
  questionType: 'MCQ',
  mediaFiles: [],
  mediaUrl: '',
  passageType: 'LISTENING',
  explanation: '',
  tagIds: [],
  tagNames: [], // tên tag đọc từ file import (Word), resolve sang tagId ở BE
  answers: [
    { answerLabel: 'A', answerText: '', isCorrect: false },
    { answerLabel: 'B', answerText: '', isCorrect: false },
    { answerLabel: 'C', answerText: '', isCorrect: false },
    { answerLabel: 'D', answerText: '', isCorrect: false },
  ],
};

const createInitialGroup = () => ({
  passage: {
    content: '',
    contentTranslation: '',
    passageType: 'READING',
    mediaFiles: [],
    extraContents: [], // các đoạn text bổ sung (passage nhiều đoạn)
    inputMode: 'TEXT',
  },
  questions: [JSON.parse(JSON.stringify(emptyQuestion))],
});

const getAnswerLabelByIndex = (index) => String.fromCharCode(65 + index);

const normalizeAnswerLabels = (answers) =>
  answers.map((answer, index) => ({
    ...answer,
    answerLabel: getAnswerLabelByIndex(index),
  }));

export const useCreateTest = ({
  mode,
  classId,
  chapterId,
  creatorType = CREATOR_TYPES.TEST,
}) => {
  const [testInfo, setTestInfo] = useState({
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
    costCoins: '', // giá xu (chỉ admin đặt, bài công khai)
  });

  const [questions, setQuestions] = useState([JSON.parse(JSON.stringify(emptyQuestion))]);
  const [groups, setGroups] = useState([createInitialGroup()]);
  const [documentFile, setDocumentFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({});

  const { examTypes, examParts, questionCollections, availableTags } = useBaseMetaData(testInfo.examTypeId);

  const { handleSubmit: submitLogic } = useTestSubmission({
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
    setLoading,
    setNotification,
    emptyQuestion,
    createInitialGroup,
  });

  const handleExamTypeChange = async (value) => {
    setTestInfo((prev) => ({ ...prev, examTypeId: value, examPartId: '' }));
  };

  const addQuestion = () => {
    if (questions.length >= MAX_QUESTIONS) {
      setNotification({ type: 'warning', message: `Hệ thống giới hạn tối đa ${MAX_QUESTIONS} câu hỏi mỗi lần tạo.` });
      return;
    }
    setQuestions([...questions, JSON.parse(JSON.stringify(emptyQuestion))]);
  };

  const removeQuestion = (index) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestionText = (index, value) => {
    const newQ = [...questions];
    newQ[index] = { ...newQ[index], questionText: value };
    setQuestions(newQ);
  };

  const updateQuestionField = (index, field, value) => {
    const newQ = [...questions];
    newQ[index] = { ...newQ[index], [field]: value };

    // If mediaUrl is updated, try to guess the type
    if (field === 'mediaUrl' && value) {
      const lowerVal = value.toLowerCase();
      if (['.mp3', '.wav', '.ogg', '.m4a'].some(ext => lowerVal.endsWith(ext))) {
        newQ[index].passageType = 'LISTENING';
      } else if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].some(ext => lowerVal.endsWith(ext))) {
        newQ[index].passageType = 'READING';
      }
    }

    setQuestions(newQ);
  };

  const updateAnswer = (qIndex, aIndex, field, value) => {
    const newQ = [...questions];
    if (field === 'isCorrect') {
      // MSQ: bật/tắt độc lập từng đáp án; MCQ: chỉ 1 đáp án đúng.
      if (newQ[qIndex].questionType === 'MSQ')
        newQ[qIndex].answers = newQ[qIndex].answers.map((a, i) => (i === aIndex ? { ...a, isCorrect: value } : a));
      else
        newQ[qIndex].answers = newQ[qIndex].answers.map((a, i) => ({ ...a, isCorrect: i === aIndex }));
    } else
      newQ[qIndex].answers[aIndex] = { ...newQ[qIndex].answers[aIndex], [field]: value };
    setQuestions(newQ);
  };

  const addAnswer = (qIndex) => {
    const newQ = [...questions];
    const currentAnswers = newQ[qIndex].answers || [];
    if (currentAnswers.length >= MAX_ANSWERS) {
      setNotification({ type: 'warning', message: `Tối đa ${MAX_ANSWERS} đáp án cho mỗi câu.` });
      return;
    }
    const nextAnswer = {
      answerLabel: getAnswerLabelByIndex(currentAnswers.length),
      answerText: '',
      isCorrect: false,
    };
    newQ[qIndex].answers = [...currentAnswers, nextAnswer];
    setQuestions(newQ);
  };

  const removeAnswer = (qIndex, aIndex) => {
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

  const addMediaFiles = (index, fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    const oversizedFile = files.find((f) => f.size > MAX_FILE_SIZE);
    if (oversizedFile) {
      setNotification({ type: 'warning', message: `File "${oversizedFile.name}" vượt quá ${MAX_FILE_SIZE / 1024 / 1024}MB.` });
      return;
    }

    const newQ = [...questions];
    const allFiles = [...(newQ[index].mediaFiles || []), ...files];
    
    // Auto-detect type: prefer LISTENING if any audio exists, otherwise READING
    if (allFiles.some((f) => f.type.startsWith('audio/'))) {
      newQ[index].passageType = 'LISTENING';
    } else if (allFiles.some((f) => f.type.startsWith('image/'))) {
      newQ[index].passageType = 'READING';
    }

    newQ[index].mediaFiles = allFiles;
    setQuestions(newQ);
  };

  const removeMediaFile = (qIndex, fileIndex) => {
    const newQ = [...questions];
    newQ[qIndex].mediaFiles = newQ[qIndex].mediaFiles.filter((_, i) => i !== fileIndex);
    setQuestions(newQ);
  };

  const setPassageType = (index, passageType) => {
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

  const removeGroup = (gIndex) => {
    if (groups.length > 1) setGroups(groups.filter((_, i) => i !== gIndex));
  };

  const updatePassage = (gIndex, field, value) => {
    const newGroups = [...groups];
    newGroups[gIndex].passage = { ...newGroups[gIndex].passage, [field]: value };
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

  const addGroupMediaFiles = (gIndex, fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    const oversizedFile = files.find((f) => f.size > MAX_FILE_SIZE);
    if (oversizedFile) {
      setNotification({ type: 'warning', message: `File "${oversizedFile.name}" vượt quá ${MAX_FILE_SIZE / 1024 / 1024}MB.` });
      return;
    }

    const newGroups = [...groups];
    const allFiles = [...(newGroups[gIndex].passage.mediaFiles || []), ...files];

    // Auto-detect type
    if (allFiles.some((f) => f.type.startsWith('audio/'))) {
      newGroups[gIndex].passage.passageType = 'LISTENING';
    } else if (allFiles.some((f) => f.type.startsWith('image/'))) {
      newGroups[gIndex].passage.passageType = 'READING';
    }

    newGroups[gIndex].passage.mediaFiles = allFiles;
    newGroups[gIndex].passage.inputMode = 'UPLOAD';
    setGroups(newGroups);
  };

  const removeGroupMediaFile = (gIndex, fIndex) => {
    const newGroups = [...groups];
    newGroups[gIndex].passage.mediaFiles = newGroups[gIndex].passage.mediaFiles.filter((_, i) => i !== fIndex);
    setGroups(newGroups);
  };

  // Đoạn text bổ sung của passage (giống "thêm đáp án" cho câu hỏi)
  const addGroupPassageText = (gIndex) => {
    const newGroups = [...groups];
    const current = newGroups[gIndex].passage.extraContents || [];
    newGroups[gIndex].passage = {
      ...newGroups[gIndex].passage,
      extraContents: [...current, ''],
    };
    setGroups(newGroups);
  };

  const updateGroupPassageText = (gIndex, tIndex, value) => {
    const newGroups = [...groups];
    const current = [...(newGroups[gIndex].passage.extraContents || [])];
    current[tIndex] = value;
    newGroups[gIndex].passage = { ...newGroups[gIndex].passage, extraContents: current };
    setGroups(newGroups);
  };

  const removeGroupPassageText = (gIndex, tIndex) => {
    const newGroups = [...groups];
    const current = newGroups[gIndex].passage.extraContents || [];
    newGroups[gIndex].passage = {
      ...newGroups[gIndex].passage,
      extraContents: current.filter((_, i) => i !== tIndex),
    };
    setGroups(newGroups);
  };

  const addGroupQuestion = (gIndex) => {
    const newGroups = [...groups];
    newGroups[gIndex].questions.push(JSON.parse(JSON.stringify(emptyQuestion)));
    setGroups(newGroups);
  };

  const removeGroupQuestion = (gIndex, qIndex) => {
    const newGroups = [...groups];
    if (newGroups[gIndex].questions.length > 1) {
      newGroups[gIndex].questions = newGroups[gIndex].questions.filter((_, i) => i !== qIndex);
      setGroups(newGroups);
    }
  };

  const updateGroupQuestion = (gIndex, qIndex, field, value) => {
    const newGroups = [...groups];
    newGroups[gIndex].questions[qIndex] = { ...newGroups[gIndex].questions[qIndex], [field]: value };
    setGroups(newGroups);
  };

  const setGroupQuestions = (gIndex, nextQuestions) => {
    const normalized = Array.isArray(nextQuestions) && nextQuestions.length > 0
      ? nextQuestions
      : [JSON.parse(JSON.stringify(emptyQuestion))];
    const newGroups = [...groups];
    newGroups[gIndex].questions = normalized;
    setGroups(newGroups);
  };

  const updateGroupAnswer = (gIndex, qIndex, aIndex, field, value) => {
    const newGroups = [...groups];
    const q = newGroups[gIndex].questions[qIndex];
    if (field === 'isCorrect') {
      if (q.questionType === 'MSQ')
        q.answers = q.answers.map((a, i) => (i === aIndex ? { ...a, isCorrect: value } : a));
      else
        q.answers = q.answers.map((a, i) => ({ ...a, isCorrect: i === aIndex }));
    } else q.answers[aIndex] = { ...q.answers[aIndex], [field]: value };
    setGroups(newGroups);
  };

  const addGroupAnswer = (gIndex, qIndex) => {
    const newGroups = [...groups];
    const currentAnswers = newGroups[gIndex].questions[qIndex].answers || [];
    if (currentAnswers.length >= MAX_ANSWERS) {
      setNotification({ type: 'warning', message: `Tối đa ${MAX_ANSWERS} đáp án cho mỗi câu.` });
      return;
    }
    const nextAnswer = {
      answerLabel: getAnswerLabelByIndex(currentAnswers.length),
      answerText: '',
      isCorrect: false,
    };
    newGroups[gIndex].questions[qIndex].answers = [...currentAnswers, nextAnswer];
    setGroups(newGroups);
  };

  const removeGroupAnswer = (gIndex, qIndex, aIndex) => {
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

  const setGroupPassageType = (gIndex, passageType) => {
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
    loading,
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
