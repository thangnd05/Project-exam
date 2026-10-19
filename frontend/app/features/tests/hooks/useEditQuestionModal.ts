'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { getQuestionById } from '@/app/apis/questionApi';
import { getExamPartById } from '@/app/apis/examPartApi';
import { getTagsFlatByExamType } from '@/app/apis/tagApi';
import { examPartKeys, tagKeys } from '@/app/configs/queryKeys';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';
import { getApiErrorMessage } from '@/app/utils/apiError';
import { questionDetailKeys } from '@/app/features/tests/hooks/useQuestionDetail';
import { useQuestionCollections } from '@/app/features/tests/hooks/useQuestionCollections';
import { useUpdateQuestion } from '@/app/features/tests/hooks/useUpdateQuestion';
import { useDeletePassageMedia } from '@/app/features/tests/hooks/useDeletePassageMedia';
import { QuestionType, QuestionUsageScope } from '@/app/enums';
import {
  getExtraTextContents,
  getPassageMediaItems,
} from '@/app/features/tests/passageMedia';
import type { PassageMediaItem } from '@/app/features/tests/passageMedia';
import type {
  AnswerRequest,
  QuestionAdminResponse,
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
  usageScope: QuestionUsageScope;
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
  usageScope: QuestionUsageScope;
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

const formFromQuestion = (questionDetail: QuestionAdminResponse): EditQuestionFormData => ({
  classId: questionDetail.classId || '',
  examPartId: questionDetail.examPartId || '',
  questionType: questionDetail.questionType || 'MCQ',
  questionText: questionDetail.questionText || '',
  explanation: questionDetail.explanation || '',
  collectionId: questionDetail.collectionId || '',
  isBank: questionDetail.isBank !== undefined ? questionDetail.isBank : true,
  usageScope: questionDetail.usageScope ?? QuestionUsageScope.EXAM,
  passage: questionDetail.passage
    ? {
        passageType: questionDetail.passage.passageType || 'READING',
        content: questionDetail.passage.content || '',
        contentTranslation: questionDetail.passage.contentTranslation || '',
        mediaUrl: questionDetail.passage.mediaUrl || '',
      }
    : { ...EMPTY_PASSAGE },
  options:
    questionDetail.answers && questionDetail.answers.length > 0
      ? questionDetail.answers.map((ans) => ({
          id: ans.answerId || null,
          answerLabel: ans.answerLabel ?? '',
          content: ans.answerText || '',
          isCorrect: !!ans.isCorrect,
        }))
      : defaultOptions(),
});

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
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [extraContents, setExtraContents] = useState<string[]>([]);
  const [existingMedia, setExistingMedia] = useState<PassageMediaItem[]>([]);
  const [confirmDeleteMedia, setConfirmDeleteMedia] = useState<PassageMediaItem | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [formData, setFormData] = useState<EditQuestionFormData>({
    classId: '',
    examPartId: '',
    collectionId: '',
    questionType: 'MCQ',
    questionText: '',
    explanation: '',
    isBank: true,
    usageScope: QuestionUsageScope.EXAM,
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

  // Mở modal (hoặc đổi câu) là một lần nạp: dùng chung cache chi tiết câu hỏi với các nơi khác,
  // staleTime 0 để mỗi lần mở đều lấy bản mới như trước.
  const openedFor = show ? (questionId ?? null) : null;
  const detailQuery = useQuery({
    queryKey: questionDetailKeys.detail(questionId ?? undefined),
    queryFn: () => getQuestionById(questionId as string),
    enabled: !!openedFor,
    staleTime: 0,
  });
  const questionDetail = detailQuery.data;

  // Câu cũ chưa lưu examTypeId thì lấy loại kỳ thi qua phần thi.
  const fallbackPartId = questionDetail && !questionDetail.examTypeId ? questionDetail.examPartId : undefined;
  const examPartQuery = useQuery({
    queryKey: examPartKeys.detail(fallbackPartId),
    queryFn: () => getExamPartById(fallbackPartId as string),
    enabled: !!openedFor && !!fallbackPartId,
  });
  const tagExamTypeId = questionDetail?.examTypeId || examPartQuery.data?.examTypeId;
  const tagsQuery = useQuery({
    queryKey: tagKeys.flat(tagExamTypeId),
    queryFn: () => getTagsFlatByExamType(tagExamTypeId as string),
    enabled: !!openedFor && !!tagExamTypeId,
    select: (tags: TagResponse[]) => (Array.isArray(tags) ? tags : []),
  });
  const availableTags = tagsQuery.data ?? EMPTY_LIST;

  // Nạp form một lần cho mỗi lần mở, khi bản mới đã về; refetch nền sau đó (vd. sau khi xoá
  // media) không ghi đè những gì người dùng đang sửa. Điều chỉnh ngay lúc render, không qua effect.
  const [resetFor, setResetFor] = useState<string | null>(null);
  const [seededFor, setSeededFor] = useState<string | null>(null);
  if (openedFor !== resetFor) {
    setResetFor(openedFor);
    setSeededFor(null);
    if (openedFor) {
      setNewFiles([]);
      setExtraContents([]);
      setExistingMedia([]);
    }
  } else if (openedFor && seededFor !== openedFor && questionDetail && !detailQuery.isFetching) {
    setSeededFor(openedFor);
    setFormData(formFromQuestion(questionDetail));
    setExistingMedia(getPassageMediaItems(questionDetail));
    setExtraContents(getExtraTextContents(questionDetail));
    setSelectedTagIds((questionDetail.tags || []).map((t) => t.tagId));
  }
  const loading = !!openedFor && seededFor !== openedFor && !detailQuery.isError;

  useEffect(() => {
    if (!openedFor || !detailQuery.isError) return;
    toast.error('Không thể tải dữ liệu câu hỏi');
    onHideRef.current?.();
  }, [openedFor, detailQuery.isError]);

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

  const isMsq = formData.questionType === QuestionType.MSQ;

  const handleOptionChange = (
    idx: number,
    field: 'isCorrect' | 'content',
    value: boolean | string,
  ) => {
    const updated = [...formData.options];
    if (field === 'isCorrect' && !isMsq && value) {
      for (let i = 0; i < updated.length; i += 1) {
        updated[i] = { ...updated[i], isCorrect: i === idx };
      }
    } else {
      updated[idx] = { ...updated[idx], [field]: value } as EditQuestionOption;
    }
    setFormData({ ...formData, options: updated });
  };

  const toggleMsq = (checked: boolean) => {
    setFormData((prev) => {
      if (checked) {
        return { ...prev, questionType: QuestionType.MSQ };
      }

      const firstCorrect = prev.options.findIndex((opt) => opt.isCorrect);
      return {
        ...prev,
        questionType: QuestionType.MCQ,
        options: prev.options.map((opt, i) => ({
          ...opt,
          isCorrect: i === firstCorrect,
        })),
      };
    });
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
        onError: (error: unknown) => {
          const msg = getApiErrorMessage(error, error instanceof Error ? error.message : undefined);
          toast.error(`Xóa media thất bại: ${msg}`);
        },
      },
    );
  };

  // Chỉ tag dùng chung hoặc cùng phần thi với câu hỏi mới gắn được.
  const partTags = useMemo(
    () => availableTags.filter((t) => !t.examPartId || t.examPartId === formData.examPartId),
    [availableTags, formData.examPartId],
  );
  const partTagIds = useMemo(() => new Set(partTags.map((t) => t.tagId)), [partTags]);

  const handleSave = () => {
    const correctCount = formData.options.filter((opt) => opt.isCorrect).length;
    if (correctCount === 0) {
      toast.warning('Vui lòng chọn ít nhất một đáp án đúng.');
      return;
    }

    const payload: UpdateQuestionPayload = {
      classId: formData.classId ? String(formData.classId) : null,
      examPartId: formData.examPartId ? String(formData.examPartId) : null,
      chapterId: null,
      questionType: formData.questionType,
      questionText: formData.questionText,
      explanation: formData.explanation || '',
      collectionId: formData.collectionId ? String(formData.collectionId) : '',
      isBank: formData.isBank,
      usageScope: formData.usageScope,
      answers: formData.options.map((opt) => ({
        id: opt.id,
        answerId: opt.id ?? undefined,
        answerLabel: opt.answerLabel,
        answerText: opt.content,
        isCorrect: opt.isCorrect,
      })),
      tagIds: selectedTagIds.filter((id) => partTagIds.has(id)),
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
        onError: (error: unknown) => {
          const msg = getApiErrorMessage(error, error instanceof Error ? error.message : undefined);
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
    availableTags: partTags,
    selectedTagIds,
    questionCollections,
    isDeletingMedia,
    handlePassageChange,
    addExtraContent,
    updateExtraContent,
    removeExtraContent,
    isMsq,
    toggleMsq,
    handleOptionChange,
    addAnswer,
    removeAnswer,
    toggleTag,
    handleDeleteExistingMedia,
    handleSave,
  };
}
