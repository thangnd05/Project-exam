'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { getQuestionById } from '@/app/apis/questionApi';
import { getExamPartById } from '@/app/apis/examPartApi';
import { getTagsFlatByExamType } from '@/app/apis/tagApi';
import { useQuestionCollections } from '@/app/features/tests/question-bank/hooks/useQuestionCollections';
import { useUpdateQuestion } from '@/app/features/tests/question-bank/hooks/useUpdateQuestion';
import { useDeletePassageMedia } from '@/app/features/tests/question-bank/hooks/useDeletePassageMedia';
import {
  getExtraTextContents,
  getPassageMediaItems,
} from '@/app/features/tests/question-bank/modals/passageMedia';

const EMPTY_PASSAGE = {
  passageType: 'READING',
  content: '',
  contentTranslation: '',
  mediaUrl: '',
};

const defaultOptions = () => [
  { id: null, answerLabel: 'A', content: '', isCorrect: false },
  { id: null, answerLabel: 'B', content: '', isCorrect: false },
];

const getAnswerLabelByIndex = (index) => String.fromCharCode(65 + index);

export function useEditQuestionModal({ show, questionId, onHide, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [newFiles, setNewFiles] = useState([]);
  const [extraContents, setExtraContents] = useState([]);
  const [existingMedia, setExistingMedia] = useState([]);
  const [confirmDeleteMedia, setConfirmDeleteMedia] = useState(null);
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [formData, setFormData] = useState({
    classId: '',
    examPartId: '',
    collectionId: '',
    questionType: 'MCQ',
    questionText: '',
    explanation: '',
    isBank: true,
    passage: { ...EMPTY_PASSAGE },
    options: [],
  });

  const onHideRef = useRef(onHide);
  useEffect(() => {
    onHideRef.current = onHide;
  }, [onHide]);

  const { questionCollections = [] } = useQuestionCollections();
  const updateMutation = useUpdateQuestion();
  const deleteMediaMutation = useDeletePassageMedia();
  const saving = updateMutation.isPending;
  const isDeletingMedia = (id) =>
    deleteMediaMutation.isPending && deleteMediaMutation.variables?.mediaId === id;

  useEffect(() => {
    if (!show || !questionId) return undefined;
    let cancelled = false;

    const fetchQuestionDetails = async (id) => {
      setLoading(true);
      try {
        const questionDetail = await getQuestionById(id);

        let mappedOptions = [];
        if (questionDetail.answers && questionDetail.answers.length > 0) {
          mappedOptions = questionDetail.answers.map((ans) => ({
            id: ans.answerId || ans.id,
            answerLabel: ans.answerLabel,
            content: ans.answerText || ans.content || '',
            isCorrect: ans.isCorrect,
          }));
        } else {
          mappedOptions = defaultOptions();
        }

        if (!cancelled) {
          setFormData({
            classId: questionDetail.classId || '',
            examPartId: questionDetail.examPartId || '',
            questionType: questionDetail.questionType || 'MCQ',
            questionText: questionDetail.questionText || '',
            explanation: questionDetail.explanation || '',
            collectionId: questionDetail.collectionId || '',
            isBank:
              questionDetail.isBank !== undefined ? questionDetail.isBank : true,
            passage: questionDetail.passage
              ? {
                  passageType: questionDetail.passage.passageType || 'READING',
                  content: questionDetail.passage.content || '',
                  contentTranslation:
                    questionDetail.passage.contentTranslation || '',
                  mediaUrl: questionDetail.passage.mediaUrl || '',
                }
              : { ...EMPTY_PASSAGE },
            options: mappedOptions,
          });
          setExistingMedia(getPassageMediaItems(questionDetail));
          setExtraContents(getExtraTextContents(questionDetail));

          const currentTagIds = (questionDetail.tags || []).map((t) => t.tagId);
          setSelectedTagIds(currentTagIds);

          if (questionDetail.examTypeId) {
            getTagsFlatByExamType(questionDetail.examTypeId)
              .then((tags) => {
                if (!cancelled) setAvailableTags(tags);
              })
              .catch(() => {});
          } else if (questionDetail.examPartId) {
            getExamPartById(questionDetail.examPartId)
              .then((part) => {
                const etId = part?.examTypeId;
                if (etId && !cancelled) {
                  return getTagsFlatByExamType(etId);
                }
                return [];
              })
              .then((tags) => {
                if (!cancelled) setAvailableTags(Array.isArray(tags) ? tags : []);
              })
              .catch(() => {});
          }
        }
      } catch {
        if (!cancelled) {
          toast.error('Không thể tải dữ liệu câu hỏi');
          onHideRef.current?.();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    setNewFiles([]);
    setExtraContents([]);
    setExistingMedia([]);
    fetchQuestionDetails(questionId);

    return () => {
      cancelled = true;
    };
  }, [show, questionId]);

  const handlePassageChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      passage: { ...prev.passage, [field]: value },
    }));
  };

  const addExtraContent = () => {
    setExtraContents((prev) => [...prev, '']);
  };

  const updateExtraContent = (idx, value) => {
    setExtraContents((prev) => prev.map((t, i) => (i === idx ? value : t)));
  };

  const removeExtraContent = (idx) => {
    setExtraContents((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleOptionChange = (idx, field, value) => {
    const updated = [...formData.options];
    if (field === 'isCorrect' && value) {
      for (let i = 0; i < updated.length; i += 1) {
        updated[i] = { ...updated[i], isCorrect: i === idx };
      }
    } else {
      updated[idx] = { ...updated[idx], [field]: value };
    }
    setFormData({ ...formData, options: updated });
  };

  const addAnswer = () => {
    if (formData.options.length >= 10) {
      toast.warning('Tối đa 10 đáp án.');
      return;
    }
    const nextLabel = getAnswerLabelByIndex(formData.options.length);
    setFormData({
      ...formData,
      options: [
        ...formData.options,
        { id: null, answerLabel: nextLabel, content: '', isCorrect: false },
      ],
    });
  };

  const removeAnswer = (idx) => {
    if (formData.options.length <= 2) {
      toast.warning('Tối thiểu phải có 2 đáp án.');
      return;
    }
    setFormData({
      ...formData,
      options: formData.options
        .filter((_, i) => i !== idx)
        .map((opt, i) => ({
          ...opt,
          answerLabel: getAnswerLabelByIndex(i),
        })),
    });
  };

  const toggleTag = (tagId) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  };

  const handleDeleteExistingMedia = (item) => {
    if (!item?.id) {
      toast.info('Media này không có id để xóa trực tiếp.');
      return;
    }

    deleteMediaMutation.mutate(
      { mediaId: item.id, questionId },
      {
        onSuccess: () => {
          setExistingMedia((prev) => prev.filter((m) => m.id !== item.id));
          if (formData.passage.mediaUrl && formData.passage.mediaUrl === item.mediaUrl) {
            setFormData((prev) => ({
              ...prev,
              passage: { ...prev.passage, mediaUrl: '' },
            }));
          }
          toast.success('Đã xóa media');
        },
        onError: (error) => {
          const msg = error.response?.data?.message ?? error.message;
          toast.error(`Xóa media thất bại: ${msg}`);
        },
      },
    );
  };

  const handleSave = () => {
    const payload = {
      classId: formData.classId ? String(formData.classId) : null,
      examPartId: formData.examPartId ? String(formData.examPartId) : null,
      chapterId: null,
      questionType: formData.questionType,
      questionText: formData.questionText,
      explanation: formData.explanation || '',
      collectionId: formData.collectionId ? String(formData.collectionId) : '',
      isBank: formData.isBank,
      answers: formData.options.map((opt) => ({
        id: opt.id,
        answerId: opt.id,
        answerLabel: opt.answerLabel,
        answerText: opt.content,
        isCorrect: opt.isCorrect,
      })),
      tagIds: selectedTagIds,
    };

    const cleanExtraContents = extraContents.map((t) => t?.trim()).filter(Boolean);
    const hasPassage =
      formData.passage.content?.trim() !== '' ||
      formData.passage.contentTranslation?.trim() !== '' ||
      formData.passage.mediaUrl?.trim() !== '' ||
      cleanExtraContents.length > 0;

    if (hasPassage) {
      payload.passage = {
        passageType: formData.passage.passageType,
        content: formData.passage.content,
        contentTranslation: formData.passage.contentTranslation?.trim() || null,
        mediaUrl: formData.passage.mediaUrl,
        extraContents: cleanExtraContents,
      };
    }

    let data;
    let config;
    if (newFiles.length > 0) {
      const fd = new FormData();
      fd.append('request', JSON.stringify(payload));
      newFiles.forEach((file, index) => {
        fd.append(`file${index}`, file);
      });
      data = fd;
      config = { headers: { 'Content-Type': 'multipart/form-data' } };
    } else {
      data = payload;
      config = { headers: { 'Content-Type': 'application/json' } };
    }

    updateMutation.mutate(
      { questionId, data, config },
      {
        onSuccess: () => {
          toast.success('Cập nhật câu hỏi thành công!');
          onSuccess();
        },
        onError: (error) => {
          const msg = error.response?.data?.message ?? error.message;
          toast.error(`Lỗi khi cập nhật: ${msg}`);
        },
      },
    );
  };

  return {
    loading,
    saving,
    formData,
    setFormData,
    setNewFiles,
    newFiles,
    extraContents,
    existingMedia,
    confirmDeleteMedia,
    setConfirmDeleteMedia,
    availableTags,
    selectedTagIds,
    questionCollections,
    isDeletingMedia,
    handlePassageChange,
    addExtraContent,
    updateExtraContent,
    removeExtraContent,
    handleOptionChange,
    addAnswer,
    removeAnswer,
    toggleTag,
    handleDeleteExistingMedia,
    handleSave,
  };
}
