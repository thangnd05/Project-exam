'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { getQuestionById } from '@/app/apis/questionApi';
import { getExamPartById } from '@/app/apis/examPartApi';
import { getTagsFlatByExamType } from '@/app/apis/tagApi';
import { useQuestionCollections } from '@/app/hooks/useQuestionCollections';
import { useUpdateQuestion } from '@/app/hooks/useUpdateQuestion';
import { useDeletePassageMedia } from '@/app/hooks/useDeletePassageMedia';
import {
  getExtraTextContents,
  getPassageMediaItems,
} from '@/app/components/tests/passageMedia';
import type { PassageMediaItem } from '@/app/components/tests/passageMedia';
import type {
  AnswerRequest,
  QuestionCreateRequest,
  TagResponse,
} from '@/app/types';

type EditPassageForm = {
  passageType: string;
  content: string;
  contentTranslation: string;
  mediaUrl: string;
};

type EditQuestionOption = {
  id: string | null;
  answerLabel: string;
  content: string;
  isCorrect: boolean;
};

type EditQuestionFormData = {
  classId: string;
  examPartId: string;
  collectionId: string;
  questionType: string;
  questionText: string;
  explanation: string;
  isBank: boolean;
  passage: EditPassageForm;
  options: EditQuestionOption[];
};

type UpdateQuestionPayload = {
  classId: string | null;
  examPartId: string | null;
  chapterId: string | null;
  questionType: string;
  questionText: string;
  explanation: string;
  collectionId: string;
  isBank: boolean;
  tagIds: string[];
  answers: Array<AnswerRequest & { id: string | null }>;
  passage?: {
    passageType: string;
    content: string;
    contentTranslation: string | null;
    mediaUrl: string;
    extraContents: string[];
  };
};

const EMPTY_PASSAGE: EditPassageForm = {
  passageType: 'READING',
  content: '',
  contentTranslation: '',
  mediaUrl: '',
};

const defaultOptions = (): EditQuestionOption[] => [
  { id: null, answerLabel: 'A', content: '', isCorrect: false },
  { id: null, answerLabel: 'B', content: '', isCorrect: false },
];

const getAnswerLabelByIndex = (index: number) => String.fromCharCode(65 + index);

type UseEditQuestionModalParams = {
  show: boolean;
  questionId?: string | null;
  onHide: () => void;
  onSuccess: () => void;
};

export function useEditQuestionModal({
  show,
  questionId,
  onHide,
  onSuccess,
}: UseEditQuestionModalParams) {
  const [loading, setLoading] = useState(false);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [extraContents, setExtraContents] = useState<string[]>([]);
  const [existingMedia, setExistingMedia] = useState<PassageMediaItem[]>([]);
  const [confirmDeleteMedia, setConfirmDeleteMedia] = useState<PassageMediaItem | null>(null);
  const [availableTags, setAvailableTags] = useState<TagResponse[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [formData, setFormData] = useState<EditQuestionFormData>({
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
  const isDeletingMedia = (id: string) =>
    deleteMediaMutation.isPending && deleteMediaMutation.variables?.mediaId === id;

  useEffect(() => {
    if (!show || !questionId) return undefined;
    let cancelled = false;

    const fetchQuestionDetails = async (id: string) => {
      setLoading(true);
      try {
        const questionDetail = await getQuestionById(id);

        let mappedOptions: EditQuestionOption[] = [];
        if (questionDetail.answers && questionDetail.answers.length > 0) {
          mappedOptions = questionDetail.answers.map((ans: any) => ({
            id: ans.answerId || ans.id || null,
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
                return [] as TagResponse[];
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

  const handlePassageChange = (field: keyof EditPassageForm, value: string) => {
    setFormData((prev) => ({
      ...prev,
      passage: { ...prev.passage, [field]: value },
    }));
  };

  const addExtraContent = () => {
    setExtraContents((prev) => [...prev, '']);
  };

  const updateExtraContent = (idx: number, value: string) => {
    setExtraContents((prev) => prev.map((t, i) => (i === idx ? value : t)));
  };

  const removeExtraContent = (idx: number) => {
    setExtraContents((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleOptionChange = (
    idx: number,
    field: 'isCorrect' | 'content',
    value: boolean | string,
  ) => {
    const updated = [...formData.options];
    if (field === 'isCorrect' && value) {
      for (let i = 0; i < updated.length; i += 1) {
        updated[i] = { ...updated[i], isCorrect: i === idx };
      }
    } else {
      updated[idx] = { ...updated[idx], [field]: value } as EditQuestionOption;
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

  const removeAnswer = (idx: number) => {
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

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  };

  const handleDeleteExistingMedia = (item: PassageMediaItem | null) => {
    if (!item?.id) {
      toast.info('Media này không có id để xóa trực tiếp.');
      return;
    }

    deleteMediaMutation.mutate(
      { mediaId: item.id, questionId: questionId ?? undefined },
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
        onError: (error: any) => {
          const msg = error.response?.data?.message ?? error.message;
          toast.error(`Xóa media thất bại: ${msg}`);
        },
      },
    );
  };

  const handleSave = () => {
    const payload: UpdateQuestionPayload = {
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
        answerId: opt.id ?? undefined,
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

    let data: UpdateQuestionPayload | FormData;
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
      { questionId: questionId as string, data: data as QuestionCreateRequest | FormData, config },
      {
        onSuccess: () => {
          toast.success('Cập nhật câu hỏi thành công!');
          onSuccess();
        },
        onError: (error: any) => {
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
