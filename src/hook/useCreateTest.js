import { useState } from 'react';
import { useBaseMetaData } from './useBaseMetaData';
import { useTestSubmission } from './useTestSubmission';

export const CREATOR_TYPES = {
  TEST: 'test',
  BULK: 'bulk',
  PASSAGE: 'passage',
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_QUESTIONS = 40;

const emptyQuestion = {
  questionText: '',
  questionType: 'MCQ',
  mediaFiles: [],
  passageType: 'LISTENING',
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
    passageType: 'READING',
    mediaFiles: [],
  },
  questions: [JSON.parse(JSON.stringify(emptyQuestion))],
});

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
  });

  const [questions, setQuestions] = useState([JSON.parse(JSON.stringify(emptyQuestion))]);
  const [groups, setGroups] = useState([createInitialGroup()]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({});

  const { examTypes, examParts, setExamParts } = useBaseMetaData(testInfo.examTypeId);

  const { handleSubmit: submitLogic } = useTestSubmission({
    mode,
    classId,
    chapterId,
    testInfo,
    questions,
    groups,
    setQuestions,
    setGroups,
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

  const updateAnswer = (qIndex, aIndex, field, value) => {
    const newQ = [...questions];
    if (field === 'isCorrect')
      newQ[qIndex].answers = newQ[qIndex].answers.map((a, i) => ({ ...a, isCorrect: i === aIndex }));
    else
      newQ[qIndex].answers[aIndex] = { ...newQ[qIndex].answers[aIndex], [field]: value };
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
    if (files.some((f) => f.type.startsWith('audio/'))) newQ[index].passageType = 'LISTENING';
    newQ[index].mediaFiles = [...(newQ[index].mediaFiles || []), ...files];
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
    if (files.some((f) => f.type.startsWith('audio/'))) newGroups[gIndex].passage.passageType = 'LISTENING';
    newGroups[gIndex].passage.mediaFiles = [...(newGroups[gIndex].passage.mediaFiles || []), ...files];
    setGroups(newGroups);
  };

  const removeGroupMediaFile = (gIndex, fIndex) => {
    const newGroups = [...groups];
    newGroups[gIndex].passage.mediaFiles = newGroups[gIndex].passage.mediaFiles.filter((_, i) => i !== fIndex);
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

  const updateGroupAnswer = (gIndex, qIndex, aIndex, field, value) => {
    const newGroups = [...groups];
    const q = newGroups[gIndex].questions[qIndex];
    if (field === 'isCorrect') q.answers = q.answers.map((a, i) => ({ ...a, isCorrect: i === aIndex }));
    else q.answers[aIndex] = { ...q.answers[aIndex], [field]: value };
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
    groups,
    loading,
    notification,
    handleExamTypeChange,
    addQuestion,
    removeQuestion,
    updateQuestionText,
    updateAnswer,
    addMediaFiles,
    removeMediaFile,
    setPassageType,
    addGroup,
    removeGroup,
    updatePassage,
    addGroupMediaFiles,
    removeGroupMediaFile,
    addGroupQuestion,
    removeGroupQuestion,
    updateGroupQuestion,
    updateGroupAnswer,
    setGroupPassageType,
    handleSubmit,
  };
};
