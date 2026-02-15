import { useState, useEffect } from 'react';
import axios from 'axios';

export const CREATOR_TYPES = {
  TEST: 'test',
  BULK: 'bulk',
  PASSAGE: 'passage',
};

// Cấu hình giới hạn để tránh lỗi server
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_QUESTIONS = 40; // Giới hạn số câu mỗi lần tạo

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
  const [examTypes, setExamTypes] = useState([]);
  const [examParts, setExamParts] = useState([]);

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

  const [questions, setQuestions] = useState([
    JSON.parse(JSON.stringify(emptyQuestion)),
  ]);

  const [groups, setGroups] = useState([createInitialGroup()]);

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({});

  useEffect(() => {
    axios
      .get('/api/exam-types')
      .then((res) => setExamTypes(res.data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (!testInfo.examTypeId) return;
    axios
      .get(`/api/exam-parts/by-exam-type/${testInfo.examTypeId}`)
      .then((res) => setExamParts(res.data))
      .catch((err) => console.error(err));
  }, [testInfo.examTypeId]);

  const handleExamTypeChange = async (value) => {
    setTestInfo((prev) => ({ ...prev, examTypeId: value, examPartId: '' }));
    if (!value) return;
    try {
      const res = await axios.get(`/api/exam-parts/by-exam-type/${value}`);
      setExamParts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addQuestion = () => {
    if (questions.length >= MAX_QUESTIONS) {
      setNotification({
        type: 'warning',
        message: `Hệ thống giới hạn tối đa ${MAX_QUESTIONS} câu hỏi mỗi lần tạo.`,
      });
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
      newQ[qIndex].answers = newQ[qIndex].answers.map((a, i) => ({
        ...a,
        isCorrect: i === aIndex,
      }));
    else
      newQ[qIndex].answers[aIndex] = {
        ...newQ[qIndex].answers[aIndex],
        [field]: value,
      };
    setQuestions(newQ);
  };

  const addMediaFiles = (index, fileList) => {
    const files = fileList ? Array.from(fileList) : [];
    if (files.length === 0) return;

    // Chặn dung lượng file
    const oversizedFile = files.find((f) => f.size > MAX_FILE_SIZE);
    if (oversizedFile) {
      setNotification({
        type: 'warning',
        message: `File "${oversizedFile.name}" vượt quá ${MAX_FILE_SIZE / 1024 / 1024}MB. Vui lòng nén lại.`,
      });
      return;
    }

    const newQ = [...questions];
    // Tự động nhận diện PassageType: Ưu tiên LISTENING nếu có file âm thanh
    const hasAudio = files.some((f) => f.type.startsWith('audio/'));
    if (hasAudio) {
      newQ[index].passageType = 'LISTENING';
    }

    newQ[index].mediaFiles = [...(newQ[index].mediaFiles || []), ...files];
    setQuestions(newQ);
  };

  const removeMediaFile = (qIndex, fileIndex) => {
    const newQ = [...questions];
    newQ[qIndex].mediaFiles = newQ[qIndex].mediaFiles.filter(
      (_, i) => i !== fileIndex,
    );
    setQuestions(newQ);
  };

  const setPassageType = (index, passageType) => {
    const newQ = [...questions];
    newQ[index] = { ...newQ[index], passageType, mediaFiles: [] };
    setQuestions(newQ);
  };

  const addGroup = () => {
    if (groups.length >= MAX_QUESTIONS) {
      setNotification({
        type: 'warning',
        message: `Hệ thống giới hạn tối đa ${MAX_QUESTIONS} nhóm mỗi lần tạo.`,
      });
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
    const files = fileList ? Array.from(fileList) : [];
    if (files.length === 0) return;

    // Chặn dung lượng file
    const oversizedFile = files.find((f) => f.size > MAX_FILE_SIZE);
    if (oversizedFile) {
      setNotification({
        type: 'warning',
        message: `File "${oversizedFile.name}" vượt quá ${MAX_FILE_SIZE / 1024 / 1024}MB. Vui lòng nén lại.`,
      });
      return;
    }

    const newGroups = [...groups];
    // Tự động nhận diện PassageType
    const hasAudio = files.some((f) => f.type.startsWith('audio/'));
    if (hasAudio) {
      newGroups[gIndex].passage.passageType = 'LISTENING';
    }

    const prev = newGroups[gIndex].passage.mediaFiles || [];
    newGroups[gIndex].passage = {
      ...newGroups[gIndex].passage,
      mediaFiles: [...prev, ...files],
    };
    setGroups(newGroups);
  };

  const removeGroupMediaFile = (gIndex, fIndex) => {
    const newGroups = [...groups];
    newGroups[gIndex].passage.mediaFiles = newGroups[
      gIndex
    ].passage.mediaFiles.filter((_, i) => i !== fIndex);
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
      newGroups[gIndex].questions = newGroups[gIndex].questions.filter(
        (_, i) => i !== qIndex,
      );
      setGroups(newGroups);
    }
  };

  const updateGroupQuestion = (gIndex, qIndex, field, value) => {
    const newGroups = [...groups];
    newGroups[gIndex].questions[qIndex] = {
      ...newGroups[gIndex].questions[qIndex],
      [field]: value,
    };
    setGroups(newGroups);
  };

  const updateGroupAnswer = (gIndex, qIndex, aIndex, field, value) => {
    const newGroups = [...groups];
    const q = newGroups[gIndex].questions[qIndex];
    if (field === 'isCorrect')
      q.answers = q.answers.map((a, i) => ({ ...a, isCorrect: i === aIndex }));
    else q.answers[aIndex] = { ...q.answers[aIndex], [field]: value };
    setGroups(newGroups);
  };

  const setGroupPassageType = (gIndex, passageType) => {
    const newGroups = [...groups];
    newGroups[gIndex].passage = {
      ...newGroups[gIndex].passage,
      passageType,
      mediaFiles: [],
    };
    setGroups(newGroups);
  };

  const handleSubmit = async () => {
    if (creatorType === CREATOR_TYPES.TEST) {
      if (!testInfo.title || !testInfo.examTypeId || !testInfo.examPartId) {
        setNotification({
          type: 'warning',
          message: 'Vui lòng điền đủ thông tin!',
        });
        return false;
      }
    } else {
      if (!testInfo.examPartId) {
        setNotification({
          type: 'warning',
          message: 'Vui lòng chọn Phần thi (Part)!',
        });
        return false;
      }
    }

    setLoading(true);
    setNotification({});

    try {
      if (creatorType === CREATOR_TYPES.TEST) {
        const testRes = await axios.post('/api/tests', {
          title: testInfo.title,
          description: testInfo.description,
          examTypeId: Number(testInfo.examTypeId),
          durationMinutes:
            testInfo.durationMinutes && Number(testInfo.durationMinutes) > 0
              ? Number(testInfo.durationMinutes)
              : null,
          maxAttempts:
            testInfo.maxAttempts && Number(testInfo.maxAttempts) > 0
              ? Number(testInfo.maxAttempts)
              : null,
          bannerUrl: testInfo.bannerUrl || null,
          availableFrom: testInfo.availableFrom
            ? testInfo.availableFrom + ':00'
            : null,
          availableTo: testInfo.availableTo
            ? testInfo.availableTo + ':00'
            : null,
          classId: mode === 'class' ? Number(classId) : null,
          chapterId: mode === 'class' ? Number(chapterId) : null,
        });
        const newTestId = testRes.data.testId || testRes.data.id;
        const partRes = await axios.post('/api/test-parts', {
          testId: Number(newTestId),
          examPartId: Number(testInfo.examPartId),
          numQuestions: questions.length,
        });
        const newPartId = partRes.data.testPartId || partRes.data.id;
        await Promise.all(
          questions.map((q) => {
            const formData = new FormData();
            const hasMedia = q.mediaFiles && q.mediaFiles.length > 0;
            const passageType = q.passageType || 'LISTENING';
            const payload = {
              testPartId: Number(newPartId),
              questionText: q.questionText,
              questionType: q.questionType,
              classId: mode === 'class' ? Number(classId) : null,
              chapterId: mode === 'class' ? Number(chapterId) : null,
              answers: q.answers,
              passage: hasMedia ? { passageType, content: '' } : null,
            };
            formData.append('request', JSON.stringify(payload));
            if (hasMedia) {
              q.mediaFiles.forEach((file, i) =>
                formData.append(`file${i}`, file),
              );
            }
            return axios.post('/api/questions/create-and-attach', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
          }),
        );
        setNotification({
          type: 'success',
          message: '🎉 Tạo đề thi thành công!',
        });
        setQuestions([JSON.parse(JSON.stringify(emptyQuestion))]);
      } else if (creatorType === CREATOR_TYPES.BULK) {
        const formData = new FormData();
        const payload = {
          examPartId: Number(testInfo.examPartId),
          classId: mode === 'class' && classId ? Number(classId) : null,
          chapterId: mode === 'class' && chapterId ? Number(chapterId) : null,
          questions: questions.map((q) => ({
            questionType: q.questionType,
            questionText: q.questionText,
            answers: q.answers.map((a) => ({
              answerLabel: a.answerLabel,
              answerText: a.answerText,
              isCorrect: a.isCorrect,
            })),
          })),
        };
        formData.append('request', JSON.stringify(payload));

        questions.forEach((q, index) => {
          if (q.mediaFiles && q.mediaFiles.length > 0) {
            formData.append(`media_${index}_audio`, q.mediaFiles[0]);
          }
        });

        await axios.post('/api/questions/bulk', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setNotification({
          type: 'success',
          message: '🎉 Đã lưu câu hỏi vào kho!',
        });
        setQuestions([JSON.parse(JSON.stringify(emptyQuestion))]);
      } else if (creatorType === CREATOR_TYPES.PASSAGE) {
        const formData = new FormData();
        const requestData = {
          examPartId: Number(testInfo.examPartId),
          classId: mode === 'class' && classId ? Number(classId) : null,
          chapterId: mode === 'class' && chapterId ? Number(chapterId) : null,
          groups: groups.map((group) => ({
            passage: {
              passageType: group.passage.passageType,
              content: group.passage.content,
            },
            questions: group.questions.map((q) => ({
              questionText: q.questionText,
              questionType: q.questionType,
              answers: q.answers.map((a) => ({
                answerLabel: a.answerLabel,
                answerText: a.answerText,
                isCorrect: a.isCorrect,
              })),
            })),
          })),
        };
        formData.append('request', JSON.stringify(requestData));
        groups.forEach((group, gIndex) => {
          if (group.passage.mediaFiles?.length > 0) {
            group.passage.mediaFiles.forEach((file, fIndex) => {
              formData.append(`media_${gIndex}_${fIndex}`, file);
            });
          }
        });
        await axios.post('/api/questions/bulk-groups', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setNotification({ type: 'success', message: '🎉 Đã lưu thành công!' });
        setGroups([createInitialGroup()]);
      }
      return true;
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      setNotification({ type: 'danger', message: '❌ ' + msg });
      return false;
    } finally {
      setLoading(false);
    }
  };

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
