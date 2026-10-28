'use client';

import { useRouter } from '@/app/i18n/navigation';
import { useState, useEffect, useMemo } from 'react';
import { Row, Col, Alert, Form } from 'react-bootstrap';
import { getClassById } from '@/app/apis/classApi';
import { getChapterById } from '@/app/apis/chapterApi';
import { previewDocument, previewJsonFile, previewPassageDocument } from '@/app/apis/questionApi';
import { previewTestJson } from '@/app/apis/testApi';
import type {
  NormalQuestionRequest,
  PassageQuestionGroupRequest,
  QuestionJsonImportPreviewResponse,
  TagResponse,
  TestJsonImportPreviewResponse,
} from '@/app/types';
import { Trash, PlusCircle, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import classNames from 'classnames/bind';
import { toast } from 'react-toastify';
import { useTranslations } from 'next-intl';
import { useCreateTest, CREATOR_TYPES } from '@/app/features/tests/creator/hooks/useCreateTest';
import { useExamCategories } from '@/app/features/tests/creator/hooks/useExamCategories';
import type { CreatorType, DraftGroup, DraftQuestion } from '@/app/features/tests/creator/hooks/useCreateTest';
import CoinPriceField from '@/app/features/tests/CoinPriceField';
import QuestionBlock from '@/app/features/tests/creator/QuestionBlock';
import CreatorTabs from '@/app/features/tests/creator/CreatorTabs';
import FormFooter from '@/app/features/tests/creator/FormFooter';
import CreateFromBankBody from '@/app/features/tests/creator/CreateFromBankBody';
import JsonQuestionsPreview from '@/app/features/tests/creator/JsonQuestionsPreview';
import type { EditQuestionHandler } from '@/app/features/tests/creator/JsonQuestionsPreview';
import { applyQuestionEdit, buildImportFile, countQuestions } from '@/app/features/tests/creator/jsonPreviewEdit';
import Pager, { PAGE_SIZE, pageCountOf } from '@/app/features/tests/creator/Pager';
import { TAG_STATUS_LABEL, editorTagStatus } from '@/app/features/tests/creator/tagStatus';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import routes from '@/app/configs/Routes';
import { buildCollectionTree } from '@/app/features/tests/collectionTree';
import { getApiErrorMessage } from '@/app/utils/apiError';
import { QuestionUsageScope } from '@/app/enums';
import styles from '@/app/features/tests/CreateTestModal.module.scss';

const cx = classNames.bind(styles);

const ACCEPT_BY_TYPE = {
  LISTENING: 'audio/*',
  READING: 'image/*',
  MEDIA: 'image/*,audio/*',
  DOCUMENT: '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

const pruneIndexes = (set: Set<number>, length: number) => {
  const next = new Set([...set].filter((i) => i < length));
  return next.size === set.size ? set : next;
};

export type CreateTestMode = 'personal' | 'class';

type CreateTestFormBodyProps = {
  mode?: CreateTestMode;
  classId?: string;
  chapterId?: string;
  creatorType?: CreatorType;
  onCreatorTypeChange?: (creatorType: CreatorType) => void;
  onSuccess?: () => void;
  onCancel?: () => void;
  showCreatorTypeTabs?: boolean;
};

const CreateTestFormBody = ({
  mode = 'personal',
  classId,
  chapterId,
  creatorType: creatorTypeProp = CREATOR_TYPES.TEST,
  onCreatorTypeChange,
  onSuccess,
  onCancel,
  showCreatorTypeTabs = true,
}: CreateTestFormBodyProps) => {
  const t = useTranslations('TestCreator');
  const router = useRouter();
  const [creatorTypeLocal, setCreatorTypeLocal] = useState<CreatorType>(creatorTypeProp);
  const isControlled = typeof onCreatorTypeChange === 'function';
  const activeCreatorType = isControlled ? creatorTypeProp : creatorTypeLocal;
  const setCreatorType = isControlled ? (v: CreatorType) => onCreatorTypeChange?.(v) : setCreatorTypeLocal;

  const {
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
    testJsonFile,
    setTestJsonFile,
    bankJsonFile,
    setBankJsonFile,
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
    handleSubmit,
    questionCollections,
    availableTags,
  } = useCreateTest({ mode, classId, chapterId, creatorType: activeCreatorType });

  const [className, setClassName] = useState('');
  const [chapterName, setChapterName] = useState('');
  const [groupDocumentFiles, setGroupDocumentFiles] = useState<Record<number, File | null>>({});
  const [bulkPassageFile, setBulkPassageFile] = useState<File | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<number>>(() => new Set());
  const [collapsedQuestions, setCollapsedQuestions] = useState<Set<number>>(() => new Set());
  const [testJsonPreview, setTestJsonPreview] =
    useState<(TestJsonImportPreviewResponse & { fileName: string }) | null>(null);
  const [testJsonChecking, setTestJsonChecking] = useState(false);
  const isTestJsonMode = activeCreatorType === CREATOR_TYPES.TEST && !!testJsonFile;
  const [bankJsonPreview, setBankJsonPreview] =
    useState<(QuestionJsonImportPreviewResponse & { fileName: string }) | null>(null);
  const [bankJsonChecking, setBankJsonChecking] = useState(false);
  const isBankJsonMode = activeCreatorType === CREATOR_TYPES.BULK && !!bankJsonPreview;
  // Khung soạn thảo: phân trang và lọc câu thiếu tag.
  const [editorPage, setEditorPage] = useState(0);
  const [editorIssuesOnly, setEditorIssuesOnly] = useState(false);
  const examCategories = useExamCategories();

  useEffect(() => {
    if (mode === 'class' && classId) {
      getClassById(classId).then((data) => setClassName(data?.className || t('form.classFallback', { classId }))).catch(() => setClassName(t('form.classFallback', { classId })));
    }
    if (mode === 'class' && chapterId) {
      getChapterById(chapterId).then((data) => setChapterName(data?.title || t('form.chapterFallback', { chapterId }))).catch(() => setChapterName(t('form.chapterFallback', { chapterId })));
    }
  }, [mode, classId, chapterId, t]);

  // Số nhóm/câu đổi thì bỏ chỉ số thu gọn đã vượt quá danh sách (điều chỉnh ngay lúc render, không cần effect).
  const [prevGroupCount, setPrevGroupCount] = useState(groups.length);
  if (groups.length !== prevGroupCount) {
    setPrevGroupCount(groups.length);
    setCollapsedGroups((prev) => pruneIndexes(prev, groups.length));
  }
  const [prevQuestionCount, setPrevQuestionCount] = useState(questions.length);
  if (questions.length !== prevQuestionCount) {
    setPrevQuestionCount(questions.length);
    setCollapsedQuestions((prev) => pruneIndexes(prev, questions.length));
  }

  const toggleGroupCollapsed = (gIndex: number) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(gIndex)) {
        next.delete(gIndex);
      } else {
        next.add(gIndex);
      }
      return next;
    });
  };

  // Câu đã có nội dung mà chưa có tag (hoặc tag nạp từ file không khớp); câu trống chưa tính.
  const editorTagIssues = useMemo(
    () => questions
      .map((q, i) => (q.questionText?.trim() && editorTagStatus(q) !== 'ok' ? i : -1))
      .filter((i) => i >= 0),
    [questions],
  );
  const editorTagWarning = (index: number) => {
    const q = questions[index];
    if (!q?.questionText?.trim()) return null;
    const status = editorTagStatus(q);
    return status === 'ok' ? null : t(TAG_STATUS_LABEL[status]);
  };
  const editorIndexes = editorIssuesOnly && editorTagIssues.length > 0
    ? editorTagIssues
    : questions.map((_, i) => i);
  const editorPageCount = pageCountOf(editorIndexes.length);
  const editorPageSafe = Math.min(editorPage, editorPageCount - 1);
  const editorPageIndexes = editorIndexes.slice(editorPageSafe * PAGE_SIZE, (editorPageSafe + 1) * PAGE_SIZE);

  const toggleQuestionCollapsed = (qIndex: number) => {
    setCollapsedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(qIndex)) {
        next.delete(qIndex);
      } else {
        next.add(qIndex);
      }
      return next;
    });
  };

  const getGroupSummary = (group: DraftGroup) => {
    const questionCount = group.questions?.length ?? 0;
    const hasPassage =
      Boolean(group.passage?.content?.trim()) ||
      Boolean(group.passage?.contentTranslation?.trim()) ||
      (group.passage?.extraContents || []).some((t) => t?.trim()) ||
      (group.passage?.mediaFiles?.length ?? 0) > 0;
    const parts = [t('form.groupSummary.questions', { count: questionCount })];
    if (hasPassage) {
      parts.push(t('form.groupSummary.hasPassage'));
    }
    return parts.join(' · ');
  };

  /**
   * Câu nạp từ JSON được sửa trực tiếp trên bản xem trước; lúc lưu mới dựng lại file từ dữ liệu
   * đang xem (dựng mỗi lần gõ phím thì nghìn câu sẽ giật).
   */
  const buildEditedJsonFile = (): File | null => {
    if (activeCreatorType === CREATOR_TYPES.TEST && testJsonFile && testJsonPreview?.valid) {
      return buildImportFile(testJsonPreview.fileName, testJsonPreview.parts.map((p) => ({
        questions: p.questions,
        groups: p.groups,
        examPartId: p.examPartId,
      })));
    }
    if (activeCreatorType === CREATOR_TYPES.BULK && bankJsonFile && bankJsonPreview?.valid) {
      return buildImportFile(bankJsonPreview.fileName, [{
        questions: bankJsonPreview.questions || [],
        groups: bankJsonPreview.groups || [],
      }]);
    }
    return null;
  };

  /** Kiểm tra nhanh câu đã sửa trong bản xem trước trước khi gửi: trống nội dung hoặc chưa có đáp án đúng. */
  const findInvalidJsonQuestions = (): number[] => {
    const all = activeCreatorType === CREATOR_TYPES.TEST && testJsonPreview
      ? testJsonPreview.parts.flatMap((p) => [...p.questions, ...p.groups.flatMap((g) => g.questions || [])])
      : activeCreatorType === CREATOR_TYPES.BULK && bankJsonPreview
        ? [...(bankJsonPreview.questions || []), ...(bankJsonPreview.groups || []).flatMap((g) => g.questions || [])]
        : [];
    return all
      .map((q, i) => {
        const correct = (q.answers || []).filter((a) => a.isCorrect).length;
        const bad = !q.questionText?.trim() || correct === 0 || (q.questionType === 'MCQ' && correct > 1);
        return bad ? i + 1 : 0;
      })
      .filter((n) => n > 0);
  };

  const handleFormSubmit = async () => {
    const editedFile = buildEditedJsonFile();
    if (editedFile) {
      const invalid = findInvalidJsonQuestions();
      if (invalid.length > 0) {
        toast.warning(
          t('form.toast.invalidJsonQuestions', { list: `${invalid.slice(0, 15).join(', ')}${invalid.length > 15 ? ' ...' : ''}` }),
        );
        return;
      }
    }
    const success = await handleSubmit(editedFile);
    if (success) {
      // Lưu thành công thì hook đã xoá file; bỏ luôn bản xem trước (giữ lại bảng lỗi của file hỏng).
      if (activeCreatorType === CREATOR_TYPES.TEST) {
        setTestJsonPreview((prev) => (prev?.valid ? null : prev));
      } else if (activeCreatorType === CREATOR_TYPES.BULK) {
        setBankJsonPreview((prev) => (prev?.valid ? null : prev));
      }
      toast.success(
        activeCreatorType === CREATOR_TYPES.TEST
          ? t('form.toast.testCreated')
          : t('form.toast.questionsSaved')
      );
      onSuccess?.();
    }
  };

  const handleDocumentFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setDocumentFile(selectedFile);
    if (selectedFile) {
      handlePreviewQuestionsFromDocument(selectedFile);
    }
  };

  const normTag = (s?: string | null) => (s || '').trim().toLowerCase();
  const resolveTagNamesToIds = (tagNames: string[] = []): string[] => {
    if (!tagNames.length || !availableTags.length) return [];
    const byName = new Map<string, TagResponse[]>();
    availableTags.forEach((t) => {
      const k = normTag(t.name);
      if (!byName.has(k)) byName.set(k, []);
      byName.get(k)!.push(t);
    });
    const partId = testInfo.examPartId ? String(testInfo.examPartId) : null;

    const ids: string[] = [];
    tagNames.forEach((rawSpec) => {
      const spec = (rawSpec || '').trim();
      if (!spec) return;
      // Spec dạng "Tag" hoặc "Phần thi > Tag".
      let partName: string | null = null;
      let tagName = spec;
      const gt = spec.indexOf('>');
      if (gt >= 0) {
        partName = spec.slice(0, gt).trim();
        tagName = spec.slice(gt + 1).trim();
      }
      let cands = byName.get(normTag(tagName)) || [];
      if (partName) {
        cands = cands.filter((t) => normTag(t.examPartName) === normTag(partName));
      }
      if (!cands.length) return;
      let chosen: TagResponse | null = null;
      if (cands.length > 1 && partId) {
        const inPart = cands.filter((t) => t.examPartId === partId);
        if (inPart.length === 1) chosen = inPart[0];
      }
      if (!chosen && cands.length === 1) chosen = cands[0];
      if (chosen && !ids.includes(chosen.tagId)) ids.push(chosen.tagId);
    });
    return ids;
  };

  const normalizeParsedQuestions = (parsedQuestions: NormalQuestionRequest[] = []): DraftQuestion[] => (
    parsedQuestions.map((question) => {
      const tagNames: string[] = question.tagNames || [];
      const tagIds = [...(question.tagIds || []), ...resolveTagNamesToIds(tagNames)]
        .filter((v, i, a) => a.indexOf(v) === i);
      return {
        questionText: question.questionText || '',
        questionType: question.questionType || 'MCQ',
        mediaFiles: [],
        mediaUrl: '',
        passageType: 'LISTENING',
        explanation: question.explanation || '',
        tagIds,
        tagNames,
        answers: (question.answers && question.answers.length > 0)
          ? question.answers.map((ans, idx) => ({
            answerLabel: ans.answerLabel || String.fromCharCode(65 + idx),
            answerText: ans.answerText || "",
            isCorrect: Boolean(ans.isCorrect),
          }))
          : ["A", "B", "C", "D"].map((label) => ({
            answerLabel: label,
            answerText: "",
            isCorrect: false,
          })),
      };
    })
  );

  const normalizeParsedGroups = (parsedGroups: PassageQuestionGroupRequest[] = []): DraftGroup[] => (
    parsedGroups.map((group) => ({
      passage: {
        content: group.passage?.content || '',
        contentTranslation: group.passage?.contentTranslation || '',
        passageType: group.passage?.passageType || 'READING',
        mediaFiles: [],
        extraContents: Array.isArray(group.passage?.extraContents) ? group.passage.extraContents : [],
        inputMode: 'TEXT',
      },
      questions: normalizeParsedQuestions(group.questions),
    }))
  );

  const handlePreviewQuestionsFromDocument = async (fileInput: File | null = documentFile) => {
    if (!fileInput) {
      toast.warning(t('form.toast.selectWordFirst'));
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', fileInput);

      const data = await previewDocument(formData);

      const parsedQuestions = Array.isArray(data) ? data : [];
      if (parsedQuestions.length === 0) {
        toast.warning(t('form.toast.noValidQuestions'));
        return;
      }

      const normalizedQuestions = normalizeParsedQuestions(parsedQuestions);

      setQuestions(normalizedQuestions);
      setDocumentFile(null);
      toast.success(t('form.toast.loadedFromWord', { count: normalizedQuestions.length }));
    } catch (error) {
      const message = getApiErrorMessage(error, t('form.toast.loadFromWordFailed'));
      toast.error(message);
    }
  };

  const showJsonIssues = (issues: string[] = [], label: string, isError: boolean) => {
    if (issues.length === 0) return;
    const shown = issues.slice(0, 3).join(' | ');
    const rest = issues.length > 3 ? ` ${t('form.toast.andMoreItems', { count: issues.length - 3 })}` : '';
    const message = `${label}: ${shown}${rest}`;
    if (isError) {
      toast.error(message, { autoClose: 20000 });
    } else {
      toast.info(message, { autoClose: 10000 });
    }
  };

  /**
   * Tab TEST: file JSON tạo trọn đề. Không nạp vào form nháp mà gửi lên backend chia câu theo
   * phần thi (trường examPart hoặc tag "Phần thi > Tag"), rồi hiện bảng tóm tắt để kiểm tra.
   */
  const handleTestJsonFile = async (fileInput: File) => {
    if (!testInfo.examTypeId) {
      toast.warning(t('form.toast.selectExamTypeFirst'));
      return;
    }
    setTestJsonChecking(true);
    try {
      const data = await previewTestJson(fileInput, testInfo.examTypeId);
      setTestJsonPreview({ ...data, fileName: fileInput.name });
      setTestJsonFile(data.valid ? fileInput : null);
      if (data.valid) {
        toast.success(t('form.toast.testJsonValid', { count: data.questionCount, parts: data.parts.length }));
      }
    } catch (error) {
      setTestJsonFile(null);
      setTestJsonPreview(null);
      const message = getApiErrorMessage(error, t('form.toast.readJsonFailed'));
      toast.error(message, { autoClose: 20000 });
    } finally {
      setTestJsonChecking(false);
    }
  };

  const clearTestJson = () => {
    setTestJsonFile(null);
    setTestJsonPreview(null);
  };

  /**
   * Tab kho: file JSON không nạp vào khung soạn thảo (nghìn câu làm trang giật) mà xem trước
   * chỉ đọc, lúc lưu gửi thẳng file lên /import/json.
   */
  const handleBankJsonFile = async (fileInput: File) => {
    if (!testInfo.examPartId) {
      toast.warning(t('form.toast.selectExamPartFirst'));
      return;
    }
    setBankJsonChecking(true);
    try {
      const formData = new FormData();
      formData.append('file', fileInput);
      const data = await previewJsonFile(formData);
      setBankJsonPreview({ ...data, fileName: fileInput.name });
      setBankJsonFile(data.valid ? fileInput : null);
      if (data.valid) {
        toast.success(t('form.toast.bankJsonValid', { count: data.questionCount }));
      }
    } catch (error) {
      setBankJsonFile(null);
      setBankJsonPreview(null);
      const message = getApiErrorMessage(error, t('form.toast.readJsonFailed'));
      toast.error(message, { autoClose: 20000 });
    } finally {
      setBankJsonChecking(false);
    }
  };

  const clearBankJson = () => {
    setBankJsonFile(null);
    setBankJsonPreview(null);
  };

  // Sửa/xoá câu trong bản xem trước: cập nhật dữ liệu đang xem và dựng lại file sẽ gửi đi.
  const editBankQuestion: EditQuestionHandler = (_partKey, loc, question) => {
    if (!bankJsonPreview) return;
    const next = applyQuestionEdit(
      { questions: bankJsonPreview.questions || [], groups: bankJsonPreview.groups || [] }, loc, question);
    const total = countQuestions(next);
    // Xoá hết câu thì bỏ luôn file và bản xem trước.
    if (total === 0) {
      clearBankJson();
      return;
    }
    setBankJsonPreview({ ...bankJsonPreview, ...next, questionCount: total, groupCount: next.groups.length });
  };

  const editTestQuestion: EditQuestionHandler = (partKey, loc, question) => {
    if (!testJsonPreview) return;
    const parts = testJsonPreview.parts
      .map((p) => {
        if (p.examPartId !== partKey) return p;
        const next = applyQuestionEdit({ questions: p.questions, groups: p.groups }, loc, question);
        return { ...p, ...next, questionCount: countQuestions(next), groupCount: next.groups.length };
      })
      .filter((p) => p.questionCount > 0);
    const total = parts.reduce((n, p) => n + p.questionCount, 0);
    if (total === 0) {
      clearTestJson();
      return;
    }
    setTestJsonPreview({ ...testJsonPreview, parts, questionCount: total });
  };

  /** Nạp file JSON vào form nháp. Mục tiêu 'questions' cho câu lẻ, 'groups' cho nhóm theo passage. */
  const handlePreviewFromJson = async (fileInput: File, target: 'questions' | 'groups') => {
    try {
      const formData = new FormData();
      formData.append('file', fileInput);

      const data = await previewJsonFile(formData);

      if (!data.valid) {
        showJsonIssues(data.errors, t('form.toast.jsonErrors', { count: data.errors.length }), true);
        return;
      }
      showJsonIssues(data.warnings, t('form.toast.warnings'), false);

      const parsedQuestions = data.questions ?? [];
      const parsedGroups = data.groups ?? [];

      if (target === 'groups') {
        if (parsedGroups.length === 0) {
          toast.warning(t('form.toast.noGroups'));
          return;
        }
        if (parsedQuestions.length > 0) {
          toast.info(t('form.toast.skippedQuestions', { count: parsedQuestions.length }));
        }
        setGroups(normalizeParsedGroups(parsedGroups));
        toast.success(t('form.toast.loadedGroupsFromJson', { count: parsedGroups.length }));
        return;
      }

      if (parsedQuestions.length === 0) {
        toast.warning(
          parsedGroups.length > 0
            ? t('form.toast.onlyGroups')
            : t('form.toast.noQuestions'),
        );
        return;
      }
      if (parsedGroups.length > 0) {
        toast.info(t('form.toast.skippedGroups', { count: parsedGroups.length }));
      }

      const normalizedQuestions = normalizeParsedQuestions(parsedQuestions);
      setQuestions(normalizedQuestions);
      toast.success(t('form.toast.loadedFromJson', { count: normalizedQuestions.length }));
    } catch (error) {
      const message = getApiErrorMessage(error, t('form.toast.loadFromJsonFailed'));
      toast.error(message, { autoClose: 20000 });
    }
  };

  const handleJsonFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    target: 'questions' | 'groups',
  ) => {
    const selectedFile = event.target.files?.[0] || null;
    event.target.value = '';
    if (selectedFile) {
      handlePreviewFromJson(selectedFile, target);
    }
  };

  const handleGroupDocumentFileChange = (gIndex: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setGroupDocumentFiles((prev) => ({ ...prev, [gIndex]: selectedFile }));
    if (selectedFile) {
      handlePreviewGroupQuestionsFromDocument(gIndex, selectedFile);
    }
  };

  const handlePreviewGroupQuestionsFromDocument = async (
    gIndex: number,
    fileInput: File | null = groupDocumentFiles[gIndex],
  ) => {
    if (!fileInput) {
      toast.warning(t('form.toast.selectWordFirstGroup'));
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', fileInput);

      const data = await previewDocument(formData);

      const parsedQuestions = Array.isArray(data) ? data : [];
      if (parsedQuestions.length === 0) {
        toast.warning(t('form.toast.noValidQuestions'));
        return;
      }

      const normalizedQuestions = normalizeParsedQuestions(parsedQuestions);
      setGroupQuestions(gIndex, normalizedQuestions);
      setGroupDocumentFiles((prev) => ({ ...prev, [gIndex]: null }));
      toast.success(t('form.toast.loadedForGroup', { count: normalizedQuestions.length, group: gIndex + 1 }));
    } catch (error) {
      const message = getApiErrorMessage(error, t('form.toast.loadGroupFromWordFailed'));
      toast.error(message);
    }
  };

  const handleBulkPassageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setBulkPassageFile(selectedFile);
    if (selectedFile) {
      handlePreviewBulkPassageFromDocument(selectedFile);
    }
  };

  const handlePreviewBulkPassageFromDocument = async (fileInput: File | null = bulkPassageFile) => {
    if (!fileInput) {
      toast.warning(t('form.toast.selectWordFirstPassage'));
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', fileInput);

      const data = await previewPassageDocument(formData);

      const parsedGroups = Array.isArray(data) ? data : [];
      if (parsedGroups.length === 0) {
        toast.warning(t('form.toast.noValidPassage'));
        return;
      }

      const normalizedGroups = normalizeParsedGroups(parsedGroups);

      setGroups(normalizedGroups);
      setBulkPassageFile(null);
      toast.success(t('form.toast.loadedGroupsFromWord', { count: normalizedGroups.length }));
    } catch (error) {
      const message = getApiErrorMessage(error, t('form.toast.loadPassageFromWordFailed'));
      toast.error(message);
    }
  };

  const collectionOptions = buildCollectionTree(
    (questionCollections || []).filter(
      (c) =>
        !testInfo.examTypeId ||
        !c.examTypeId ||
        String(c.examTypeId) === String(testInfo.examTypeId),
    ),
  );

  return (
    <>
      {notification.message && (
        <Alert variant={notification.type} className="mb-3">{notification.message}</Alert>
      )}

      {showCreatorTypeTabs && (
        <CreatorTabs activeCreatorType={activeCreatorType} setCreatorType={setCreatorType} />
      )}

      {activeCreatorType === CREATOR_TYPES.TEST && (
        <Alert variant="info" className="mb-3">
          {t.rich('form.editNote', { strong: (chunks) => <strong>{chunks}</strong> })}
        </Alert>
      )}

      {activeCreatorType === CREATOR_TYPES.TEST && (
        <Alert variant="light" className="mb-3 border">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
            <span>
              {t.rich('form.bankNote', { strong: (chunks) => <strong>{chunks}</strong> })}
            </span>
            <ButtonPrime
              type="button"
              variant="outline"
              size="md"
              onClick={() => {
                onCancel?.();
                router.push(routes.personalQuestionBank);
              }}
            >
              {t('form.openBank')}
            </ButtonPrime>
          </div>
        </Alert>
      )}

      {activeCreatorType !== CREATOR_TYPES.BANK && (
        <div className={cx('configCard')}>
          <div className={cx('sectionTitle')}>
            1. {activeCreatorType === CREATOR_TYPES.TEST ? t('form.section.testConfig') : t('form.section.generalInfo')}
          </div>
          <Row className="g-3">
            {mode === 'class' && (
              <>
                <Col md={6}>
                  <div className={cx('formGroupModern')}>
                    <label>{t('form.fields.class')}</label>
                    <input className={cx('inputModern', 'inputDisabled')} value={className} disabled />
                  </div>
                </Col>
                <Col md={6}>
                  <div className={cx('formGroupModern')}>
                    <label>{t('form.fields.chapter')}</label>
                    <input className={cx('inputModern', 'inputDisabled')} value={chapterName} disabled />
                  </div>
                </Col>
              </>
            )}
            {activeCreatorType === CREATOR_TYPES.TEST && (
              <>
                <Col md={8}>
                  <div className={cx('formGroupModern')}>
                    <label>{t('form.fields.title')}</label>
                    <input className={cx('inputModern')} value={testInfo.title} onChange={(e) => setTestInfo({ ...testInfo, title: e.target.value })} />
                  </div>
                </Col>
                <Col md={4}>
                  <div className={cx('formGroupModern')}>
                    <label>{t('form.fields.bannerUrl')}</label>
                    <input className={cx('inputModern')} value={testInfo.bannerUrl} onChange={(e) => setTestInfo({ ...testInfo, bannerUrl: e.target.value })} />
                  </div>
                </Col>
              </>
            )}
            <Col md={4}>
              <div className={cx('formGroupModern')}>
                <label>{t('form.fields.examType')}</label>
                <select className={cx('inputModern')} value={testInfo.examTypeId} onChange={(e) => {
                  handleExamTypeChange(e.target.value);
                  // Đổi loại kỳ thi thì phần thi đổi theo, kết quả chia cũ không còn đúng.
                  clearTestJson();
                }}>
                  <option value="">{t('form.fields.selectPlaceholder')}</option>

                  {examTypes.filter((t) => !t.childCount).map((t) => <option key={t.examTypeId} value={t.examTypeId}>{t.name}</option>)}
                </select>
              </div>
            </Col>
            {/* Tab tạo đề không chọn phần thi: câu được xếp vào phần thi theo tag. */}
            {activeCreatorType !== CREATOR_TYPES.TEST && (
            <Col md={4}>
              <div className={cx('formGroupModern')}>
                <label>{t('form.fields.examPartRequired')}</label>
                <select className={cx('inputModern')} value={testInfo.examPartId} onChange={(e) => setTestInfo({ ...testInfo, examPartId: e.target.value })} disabled={!testInfo.examTypeId}>
                  <option value="">{t('form.fields.selectPartPlaceholder')}</option>
                  {examParts.map((p) => <option key={p.examPartId} value={p.examPartId}>{p.name}</option>)}
                </select>
              </div>
            </Col>
            )}
            {activeCreatorType === CREATOR_TYPES.TEST && (
              <Col md={4}>
                <div className={cx('formGroupModern')}>
                  <label>{t('form.fields.testCollection')}</label>
                  <select className={cx('inputModern')} value={testInfo.collectionId || ''} onChange={(e) => setTestInfo({ ...testInfo, collectionId: e.target.value })}>
                    <option value="">{t('form.fields.emptyOption')}</option>
                    {collectionOptions.map((c) => (
                      <option key={c.collectionId} value={c.collectionId}>
                        {c.depth > 0 ? `    └ ${c.name}` : c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </Col>
            )}
            {(activeCreatorType === CREATOR_TYPES.BULK || activeCreatorType === CREATOR_TYPES.PASSAGE) && (
              <Col md={4}>
                <div className={cx('formGroupModern')}>
                  <label>{t('form.fields.groupCollection')}</label>
                  <select className={cx('inputModern')} value={testInfo.collectionId || ''} onChange={(e) => setTestInfo({ ...testInfo, collectionId: e.target.value })}>
                    <option value="">{t('form.fields.emptyOption')}</option>
                    {collectionOptions.map((c) => (
                      <option key={c.collectionId} value={c.collectionId}>
                        {c.depth > 0 ? `    └ ${c.name}` : c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </Col>
            )}
            {(activeCreatorType === CREATOR_TYPES.BULK || activeCreatorType === CREATOR_TYPES.PASSAGE) && (
              <Col md={4}>
                <div className={cx('formGroupModern')}>
                  <label>{t('form.fields.usageScope')}</label>
                  <select
                    className={cx('inputModern')}
                    value={testInfo.usageScope}
                    onChange={(e) =>
                      setTestInfo({
                        ...testInfo,
                        usageScope: e.target.value as QuestionUsageScope,
                      })
                    }
                  >
                    <option value={QuestionUsageScope.EXAM}>{t('form.fields.usageExam')}</option>
                    <option value={QuestionUsageScope.PRACTICE}>{t('form.fields.usagePractice')}</option>
                  </select>
                </div>
              </Col>
            )}
            {(activeCreatorType === CREATOR_TYPES.TEST || activeCreatorType === CREATOR_TYPES.BULK) && (
              <>
                {activeCreatorType === CREATOR_TYPES.TEST && (
                  <>
                    <Col md={4}>
                      <div className={cx('formGroupModern')}>
                        <label>{t('form.fields.duration')}</label>
                        <input type="number" className={cx('inputModern')} value={testInfo.durationMinutes} onChange={(e) => setTestInfo({ ...testInfo, durationMinutes: e.target.value })} />
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className={cx('formGroupModern')}>
                        <label>{t('form.fields.maxAttempts')}</label>
                        <input type="number" className={cx('inputModern')} value={testInfo.maxAttempts} onChange={(e) => setTestInfo({ ...testInfo, maxAttempts: e.target.value })} />
                      </div>
                    </Col>
                    <CoinPriceField
                      md={4}
                      isPublic={mode !== 'class'}
                      value={testInfo.costCoins}
                      onChange={(v) => setTestInfo({ ...testInfo, costCoins: v })}
                      groupClassName={cx('formGroupModern')}
                      inputClassName={cx('inputModern')}
                    />
                    <Col md={mode === 'class' ? 8 : 4}>
                      <div className={cx('formGroupModern')}>
                        <label>{t('form.fields.examCategory')}</label>
                        <select
                          className={cx('inputModern')}
                          value={testInfo.examCategoryId}
                          onChange={(e) => setTestInfo({ ...testInfo, examCategoryId: e.target.value })}
                          aria-label={t('form.fields.examCategoryAria')}
                        >
                          <option value="">{t('form.fields.noCategory')}</option>
                          {examCategories.map((c) => (
                            <option key={c.examCategoryId} value={c.examCategoryId}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </Col>
                    <Col md={activeCreatorType === CREATOR_TYPES.TEST ? 6 : 4}>
                      <div className={cx('formGroupModern')}>
                        <label>{t('form.fields.availableFrom')}</label>
                        <input type="datetime-local" className={cx('inputModern')} value={testInfo.availableFrom} onChange={(e) => setTestInfo({ ...testInfo, availableFrom: e.target.value })} />
                      </div>
                    </Col>
                    <Col md={activeCreatorType === CREATOR_TYPES.TEST ? 6 : 4}>
                      <div className={cx('formGroupModern')}>
                        <label>{t('form.fields.availableTo')}</label>
                        <input type="datetime-local" className={cx('inputModern')} value={testInfo.availableTo} onChange={(e) => setTestInfo({ ...testInfo, availableTo: e.target.value })} />
                      </div>
                    </Col>
                    <Col md={12}>
                      <div className={cx('formGroupModern')}>
                        <label>{t('form.fields.description')}</label>
                        <textarea className={cx('inputModern')} rows={2} value={testInfo.description} onChange={(e) => setTestInfo({ ...testInfo, description: e.target.value })} />
                      </div>
                    </Col>
                    <Col md={6}>
                      <Form.Check
                        type="checkbox"
                        id="create-test-shuffle-on-create"
                        label={t('form.fields.shuffleOnCreate')}
                        checked={testInfo.shuffleOnCreate}
                        onChange={(e) => setTestInfo({ ...testInfo, shuffleOnCreate: e.target.checked })}
                      />
                    </Col>
                    <Col md={6}>
                      <Form.Check
                        type="checkbox"
                        id="create-test-shuffle-per-attempt"
                        label={t('form.fields.shufflePerAttempt')}
                        checked={testInfo.shuffleQuestions}
                        onChange={(e) => setTestInfo({ ...testInfo, shuffleQuestions: e.target.checked })}
                      />
                    </Col>
                  </>
                )}
                {!isTestJsonMode && !isBankJsonMode && (
                <Col md={12}>
                  <div className={cx('formGroupModern')}>
                    <label>
                      {activeCreatorType === CREATOR_TYPES.BULK
                        ? t('form.upload.wordBulk')
                        : t('form.upload.wordQuick')}
                    </label>
                    <input
                      type="file"
                      accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className={cx('inputModern')}
                      onChange={handleDocumentFileChange}
                    />
                    {documentFile && (
                      <small className="text-muted d-block mt-2">
                        {t('form.upload.loadingFrom', { name: documentFile.name })}
                      </small>
                    )}
                  </div>
                </Col>
                )}
                {activeCreatorType === CREATOR_TYPES.TEST ? (
                  <Col md={12}>
                    <div className={cx('formGroupModern')}>
                      <label>{t('form.upload.testJson')}</label>
                      <input
                        type="file"
                        accept=".json,application/json"
                        className={cx('inputModern')}
                        disabled={!testInfo.examTypeId || testJsonChecking}
                        onChange={(e) => {
                          const selectedFile = e.target.files?.[0] || null;
                          e.target.value = '';
                          if (selectedFile) handleTestJsonFile(selectedFile);
                        }}
                      />
                      <small className="text-muted d-block mt-2">
                        {testInfo.examTypeId
                          ? t.rich('form.upload.testJsonHelp', { code: (chunks) => <code>{chunks}</code> })
                          : t('form.upload.testJsonNeedExamType')}
                      </small>
                      {testJsonChecking && <small className="d-block mt-2">{t('form.upload.checking')}</small>}
                    </div>
                  </Col>
                ) : (
                  <Col md={12}>
                    <div className={cx('formGroupModern')}>
                      <label>{t('form.upload.bankJson')}</label>
                      <input
                        type="file"
                        accept=".json,application/json"
                        className={cx('inputModern')}
                        disabled={!testInfo.examPartId || bankJsonChecking}
                        onChange={(e) => {
                          const selectedFile = e.target.files?.[0] || null;
                          e.target.value = '';
                          if (selectedFile) handleBankJsonFile(selectedFile);
                        }}
                      />
                      <small className="text-muted d-block mt-2">
                        {testInfo.examPartId
                          ? t.rich('form.upload.bankJsonHelp', { code: (chunks) => <code>{chunks}</code> })
                          : t('form.upload.bankJsonNeedExamPart')}
                      </small>
                      {bankJsonChecking && <small className="d-block mt-2">{t('form.upload.checking')}</small>}
                    </div>
                  </Col>
                )}
              </>
            )}
          </Row>
        </div>
      )}

      {activeCreatorType === CREATOR_TYPES.TEST && testJsonPreview && (
        <>
          <div className={cx('sectionTitle')}>
            2. {t('form.preview.testTitle', { name: testJsonPreview.fileName })}
          </div>
          <JsonQuestionsPreview
            valid={testJsonPreview.valid}
            errors={testJsonPreview.errors}
            warnings={testJsonPreview.warnings}
            parts={testJsonPreview.parts.map((p) => ({
              key: p.examPartId,
              name: p.examPartName,
              questions: p.questions,
              groups: p.groups,
            }))}
            availableTags={availableTags}
            summary={t.rich('form.preview.testSummary', { count: testJsonPreview.questionCount, parts: testJsonPreview.parts.length, strong: (chunks) => <strong>{chunks}</strong> })}
            onClear={clearTestJson}
            clearLabel={t('form.preview.clearLabel')}
            onEditQuestion={editTestQuestion}
          />
        </>
      )}

      {isBankJsonMode && bankJsonPreview && (
        <>
          <div className={cx('sectionTitle')}>
            2. {t('form.preview.bankTitle', { name: bankJsonPreview.fileName })}
          </div>
          <JsonQuestionsPreview
            valid={bankJsonPreview.valid}
            errors={bankJsonPreview.errors}
            warnings={bankJsonPreview.warnings}
            parts={[{
              key: testInfo.examPartId,
              name: examParts.find((p) => p.examPartId === testInfo.examPartId)?.name || t('form.preview.selectedPart'),
              questions: bankJsonPreview.questions || [],
              groups: bankJsonPreview.groups || [],
            }]}
            availableTags={availableTags}
            summary={t.rich('form.preview.bankSummary', { count: bankJsonPreview.questionCount, strong: (chunks) => <strong>{chunks}</strong> })}
            onClear={clearBankJson}
            clearLabel={t('form.preview.clearLabel')}
            onEditQuestion={editBankQuestion}
          />
        </>
      )}

      {((activeCreatorType === CREATOR_TYPES.BULK && !isBankJsonMode) || (activeCreatorType === CREATOR_TYPES.TEST && !testJsonPreview)) && (
        <>
          <div className={cx('sectionTitle')}>
            2. {t('form.editor.title', { count: questions.length })}
          </div>
          {activeCreatorType === CREATOR_TYPES.TEST && (
            <small className="text-muted d-block mb-3">
              {t('form.editor.tagHint')}
            </small>
          )}
          {editorTagIssues.length > 0 && (
            <div className={cx('tagSummaryBar', 'hasIssue')}>
              <span className={cx('tagSummaryItem', 'warn')}>
                {t('form.editor.tagIssues', { count: editorTagIssues.length })}{' '}
                {editorTagIssues.slice(0, 15).map((i) => t('form.editor.questionLabel', { number: i + 1 })).join(', ')}
                {editorTagIssues.length > 15 ? ` ${t('form.editor.andMore', { count: editorTagIssues.length - 15 })}` : ''}
              </span>
              <ButtonPrime
                size="sm"
                variant="outline"
                className={cx('tagFilterBtn')}
                onClick={() => {
                  setEditorIssuesOnly((v) => !v);
                  setEditorPage(0);
                }}
              >
                {editorIssuesOnly ? t('form.editor.showAll') : t('form.editor.showIssuesOnly')}
              </ButtonPrime>
            </div>
          )}
          <Pager page={editorPageSafe} pageCount={editorPageCount} onChange={setEditorPage} />
          {editorPageIndexes.map((i) => (
            <QuestionBlock
              key={i}
              question={questions[i]}
              index={i}
              tagWarning={editorTagWarning(i)}
              radioGroupPrefix="single-question"
              removeQuestionFn={removeQuestion}
              updateQuestionTextFn={updateQuestionText}
              updateQuestionFieldFn={updateQuestionField}
              updateAnswerFn={updateAnswer}
              addAnswerFn={addAnswer}
              removeAnswerFn={removeAnswer}
              addMediaFilesFn={addMediaFiles}
              removeMediaFileFn={removeMediaFile}
              availableTags={availableTags}
              minQuestions={questions.length}
              collapsible
              isCollapsed={collapsedQuestions.has(i)}
              onToggleCollapsed={toggleQuestionCollapsed}
            />
          ))}
          <Pager page={editorPageSafe} pageCount={editorPageCount} onChange={setEditorPage} />
        </>
      )}

      {activeCreatorType === CREATOR_TYPES.PASSAGE && (
        <>
          <div className={cx('sectionTitle')}>
            2. {t('form.passage.title', { count: groups.length })}
          </div>

          <div className={cx('groupCard')} style={{ borderStyle: 'dashed', backgroundColor: '#f8fafc', marginBottom: '20px' }}>
            <div className={cx('formGroupModern', 'mb-0')}>
              <label className="mb-2 d-block fw-bold text-primary">
                {t('form.passage.wordUpload')}
              </label>
              <input
                type="file"
                accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className={cx('inputModern')}
                onChange={handleBulkPassageFileChange}
              />
              <small className="text-muted d-block mt-2">
                {t('form.passage.wordHelp')}
              </small>
            </div>

            <div className={cx('formGroupModern', 'mb-0')} style={{ marginTop: '16px' }}>
              <label className="mb-2 d-block fw-bold text-primary">
                {t('form.passage.jsonUpload')}
              </label>
              <input
                type="file"
                accept=".json,application/json"
                className={cx('inputModern')}
                onChange={(e) => handleJsonFileChange(e, 'groups')}
              />
              <small className="text-muted d-block mt-2">
                {t.rich('form.passage.jsonHelp', { code: (chunks) => <code>{chunks}</code> })}
              </small>
            </div>
          </div>

          {groups.map((group, gIndex) => {
            const isCollapsed = collapsedGroups.has(gIndex);
            return (
            <div key={gIndex} className={cx('groupCard', { collapsed: isCollapsed })}>
              <div className={cx('groupHeader')}>
                <button
                  type="button"
                  className={cx('groupToggleBtn')}
                  onClick={() => toggleGroupCollapsed(gIndex)}
                  aria-expanded={!isCollapsed}
                  aria-label={isCollapsed ? t('form.passage.expandGroup', { number: gIndex + 1 }) : t('form.passage.collapseGroup', { number: gIndex + 1 })}
                >
                  {isCollapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
                  <h4 className={cx('groupTitle')}>{t('form.passage.groupTitle', { number: gIndex + 1 })}</h4>
                  <span className={cx('groupSummaryBadge')}>{getGroupSummary(group)}</span>
                </button>
                {groups.length > 1 && (
                  <ButtonPrime variant="dangerGhost" size="icon" onClick={() => removeGroup(gIndex)} aria-label={t('form.passage.removeGroup', { number: gIndex + 1 })}>
                    <Trash size={18} />
                  </ButtonPrime>
                )}
              </div>
              {!isCollapsed && (
              <>
              <div className={cx('passageSection')}>
                <div className={cx('formGroupModern')}>
                  <label className="mb-2 d-block fw-bold">{t('form.passage.content')}</label>
                  <textarea
                    className={cx('inputModern')}
                    rows={3}
                    value={group.passage.content}
                    onChange={(e) => updatePassage(gIndex, 'content', e.target.value)}
                    placeholder={t('form.passage.contentPlaceholder')}
                  />
                </div>
                {(group.passage.extraContents || []).map((text, tIdx) => (
                  <div className={cx('formGroupModern')} key={tIdx}>
                    <label className="mb-2 d-flex justify-content-between align-items-center fw-bold">
                      <span>{t('form.passage.extraText', { number: tIdx + 2 })}</span>
                      <ButtonPrime
                        variant="dangerGhost"
                        size="icon"
                        onClick={() => removeGroupPassageText(gIndex, tIdx)}
                        aria-label={t('form.passage.removeExtraText', { number: tIdx + 2 })}
                      >
                        <Trash size={14} />
                      </ButtonPrime>
                    </label>
                    <textarea
                      className={cx('inputModern')}
                      rows={3}
                      value={text}
                      onChange={(e) => updateGroupPassageText(gIndex, tIdx, e.target.value)}
                      placeholder={t('form.passage.extraTextPlaceholder', { number: tIdx + 2 })}
                    />
                  </div>
                ))}
                <div className="mb-3">
                  <ButtonPrime
                    type="button"
                    variant="outline"
                    size="sm"
                    fullWidth
                    className={cx('btnSecondary')}
                    onClick={() => addGroupPassageText(gIndex)}
                  >
                    <PlusCircle size={16} /> {t('form.passage.addText')}
                  </ButtonPrime>
                </div>
                <div className={cx('formGroupModern')}>
                  <label className="mb-2 d-block fw-bold">{t('form.passage.translation')}</label>
                  <textarea
                    className={cx('inputModern')}
                    rows={3}
                    value={group.passage.contentTranslation || ''}
                    onChange={(e) => updatePassage(gIndex, 'contentTranslation', e.target.value)}
                    placeholder={t('form.passage.translationPlaceholder')}
                  />
                </div>
                <div className={cx('formGroupModern')}>
                  <label className="mb-2 d-block fw-bold">{t('form.passage.mediaUpload')}</label>
                  <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                    <input
                      type="file"
                      multiple
                      accept={ACCEPT_BY_TYPE.MEDIA}
                      className={cx('inputModern')}
                      style={{ width: 'auto' }}
                      onChange={(e) => { addGroupMediaFiles(gIndex, e.target.files); e.target.value = ''; }}
                    />
                  </div>
                  {group.passage.mediaFiles?.length > 0 && (
                    <ul className="list-unstyled mb-0 mt-2">
                      {group.passage.mediaFiles.map((file, fIdx) => (
                        <li key={fIdx} className="d-flex align-items-center gap-2 mb-1">
                          <span className="small text-secondary">{file.name}</span>
                          <ButtonPrime
                            variant="dangerGhost"
                            size="icon"
                            onClick={() => removeGroupMediaFile(gIndex, fIdx)}
                          >
                            <Trash size={14} />
                          </ButtonPrime>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <div className={cx('questionsSection')}>
                <div className={cx('formGroupModern')}>
                  <label>{t('form.passage.groupWordUpload')}</label>
                  <input
                    type="file"
                    accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className={cx('inputModern')}
                    onChange={(e) => handleGroupDocumentFileChange(gIndex, e)}
                  />
                  {groupDocumentFiles[gIndex] && (
                    <small className="text-muted d-block mt-2">
                      {t('form.passage.loadingForGroup', { number: gIndex + 1, name: groupDocumentFiles[gIndex]?.name ?? '' })}
                    </small>
                  )}
                </div>
                {group.questions.map((q, qIndex) => (
                  <QuestionBlock
                    key={qIndex}
                    question={q}
                    index={qIndex}
                    radioGroupPrefix={`group-${gIndex}-question`}
                    removeQuestionFn={(i) => removeGroupQuestion(gIndex, i)}
                    updateQuestionTextFn={(i, v) => updateGroupQuestion(gIndex, i, 'questionText', v)}
                    updateQuestionFieldFn={(...args) => updateGroupQuestion(gIndex, ...args)}
                    updateAnswerFn={(...args) => updateGroupAnswer(gIndex, ...args)}
                    addAnswerFn={(i) => addGroupAnswer(gIndex, i)}
                    removeAnswerFn={(i, aIndex) => removeGroupAnswer(gIndex, i, aIndex)}
                    addMediaFilesFn={() => { }}
                    removeMediaFileFn={() => { }}
                    availableTags={availableTags}
                    withMedia={false}
                    minQuestions={group.questions.length}
                  />
                ))}
                <ButtonPrime type="button" variant="outline" size="sm" fullWidth className={cx('btnSecondary')} onClick={() => addGroupQuestion(gIndex)}><PlusCircle size={18} /> {t('formFooter.addQuestion')}</ButtonPrime>
              </div>
              </>
              )}
            </div>
            );
          })}
          <ButtonPrime type="button" variant="outline" size="sm" fullWidth className={cx('btnSecondary', 'btnGroupAdd')} onClick={addGroup}><Plus size={20} /> {t('form.passage.addGroup')}</ButtonPrime>
        </>
      )}

      {activeCreatorType === CREATOR_TYPES.BANK && (
        <CreateFromBankBody
          mode={mode}
          classId={classId}
          chapterId={chapterId}
          onCancel={onCancel}
          onSuccess={onSuccess}
        />
      )}

      {(activeCreatorType === CREATOR_TYPES.TEST || activeCreatorType === CREATOR_TYPES.BULK) && (
        <FormFooter
          loading={loading}
          onAddQuestion={() => {
            addQuestion();
            // Câu mới nằm cuối danh sách: chuyển tới trang cuối để thấy ngay.
            setEditorIssuesOnly(false);
            setEditorPage(pageCountOf(questions.length + 1) - 1);
          }}
          onCancel={onCancel}
          onSubmit={handleFormSubmit}
          showAddBtn={!isTestJsonMode && !isBankJsonMode && !testJsonPreview}
        />
      )}

      {activeCreatorType === CREATOR_TYPES.PASSAGE && (
        <FormFooter
          loading={loading}
          onCancel={onCancel}
          onSubmit={handleFormSubmit}
          submitLabel={t('form.saveAll')}
          showAddBtn={false}
        />
      )}
    </>
  );
};

export default CreateTestFormBody;
