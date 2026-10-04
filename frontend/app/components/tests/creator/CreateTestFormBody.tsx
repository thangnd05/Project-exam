'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { Row, Col, Alert } from 'react-bootstrap';
import { getClassById } from '@/app/apis/classApi';
import { getChapterById } from '@/app/apis/chapterApi';
import { previewDocument, previewJsonFile, previewPassageDocument } from '@/app/apis/questionApi';
import { previewTestJson } from '@/app/apis/testApi';
import type { QuestionJsonImportPreviewResponse, TestJsonImportPreviewResponse } from '@/app/types';
import {
  IoCalendarOutline,
  IoTimeOutline,
  IoImageOutline,
  IoInformationCircleOutline,
  IoSchoolOutline,
  IoBookOutline,
  IoRocketOutline,
  IoAddOutline,
  IoLibraryOutline,
} from 'react-icons/io5';
import { Trash, PlusCircle, ChevronDown, ChevronRight } from 'lucide-react';
import classNames from 'classnames/bind';
import { toast } from 'react-toastify';
import { useCreateTest, CREATOR_TYPES } from '@/app/hooks/useCreateTest';
import { useExamCategories } from '@/app/hooks/useExamCategories';
import type { CreatorType, DraftGroup, DraftQuestion } from '@/app/hooks/useCreateTest';
import CoinPriceField from '@/app/components/tests/CoinPriceField';
import QuestionBlock from './QuestionBlock';
import CreatorTabs from './CreatorTabs';
import FormFooter from './FormFooter';
import CreateFromBankBody from './CreateFromBankBody';
import JsonQuestionsPreview from './JsonQuestionsPreview';
import type { EditQuestionHandler } from './JsonQuestionsPreview';
import { applyQuestionEdit, buildImportFile, countQuestions } from './jsonPreviewEdit';
import Pager, { PAGE_SIZE, pageCountOf } from './Pager';
import { TAG_STATUS_LABEL, editorTagStatus } from './tagStatus';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import routes from '@/app/configs/Routes';
import { buildCollectionTree } from '@/app/utils/collectionTree';
import { QuestionUsageScope } from '@/app/enums';
import styles from '../CreateTestModal.module.scss';

const cx = classNames.bind(styles);

const ACCEPT_BY_TYPE = {
  LISTENING: 'audio/*',
  READING: 'image/*',
  MEDIA: 'image/*,audio/*',
  DOCUMENT: '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
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
  embedded?: boolean;
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
  embedded = false,
  showCreatorTypeTabs = true,
}: CreateTestFormBodyProps) => {
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
      getClassById(classId).then((data) => setClassName(data?.className || `Lớp ${classId}`)).catch(() => setClassName(`Lớp ${classId}`));
    }
    if (mode === 'class' && chapterId) {
      getChapterById(chapterId).then((data) => setChapterName(data?.title || `Chapter ${chapterId}`)).catch(() => setChapterName(`Chapter ${chapterId}`));
    }
  }, [mode, classId, chapterId]);

  useEffect(() => {
    setCollapsedGroups((prev) => {
      const next = new Set([...prev].filter((i) => i < groups.length));
      return next.size === prev.size ? prev : next;
    });
  }, [groups.length]);

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

  useEffect(() => {
    setCollapsedQuestions((prev) => {
      const next = new Set([...prev].filter((i) => i < questions.length));
      return next.size === prev.size ? prev : next;
    });
  }, [questions.length]);

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
    return status === 'ok' ? null : TAG_STATUS_LABEL[status];
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
    const parts = [`${questionCount} câu hỏi`];
    if (hasPassage) {
      parts.push('có passage');
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
          `Câu chưa có nội dung hoặc chưa chọn đúng đáp án đúng: ${invalid.slice(0, 15).join(', ')}${invalid.length > 15 ? ' ...' : ''}`,
        );
        return;
      }
    }
    const success = await handleSubmit(editedFile);
    if (success) {
      toast.success(
        activeCreatorType === CREATOR_TYPES.TEST
          ? 'Đã tạo đề thi thành công'
          : 'Đã lưu câu hỏi vào kho thành công'
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
    const byName = new Map<string, any[]>();
    availableTags.forEach((t: any) => {
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
        cands = cands.filter((t: any) => normTag(t.examPartName) === normTag(partName));
      }
      if (!cands.length) return;
      let chosen = null;
      if (cands.length > 1 && partId) {
        const inPart = cands.filter((t: any) => t.examPartId === partId);
        if (inPart.length === 1) chosen = inPart[0];
      }
      if (!chosen && cands.length === 1) chosen = cands[0];
      if (chosen && !ids.includes(chosen.tagId)) ids.push(chosen.tagId);
    });
    return ids;
  };

  const normalizeParsedQuestions = (parsedQuestions: any[] = []): DraftQuestion[] => (
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
          ? question.answers.map((ans: any, idx: number) => ({
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

  const normalizeParsedGroups = (parsedGroups: any[] = []): DraftGroup[] => (
    parsedGroups.map((group: any) => ({
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
      toast.warning('Vui lòng chọn file Word trước khi nạp câu hỏi.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', fileInput);

      const data = await previewDocument(formData);

      const parsedQuestions = Array.isArray(data) ? data : [];
      if (parsedQuestions.length === 0) {
        toast.warning('Không tìm thấy câu hỏi hợp lệ trong file Word.');
        return;
      }

      const normalizedQuestions = normalizeParsedQuestions(parsedQuestions);

      setQuestions(normalizedQuestions);
      setDocumentFile(null);
      toast.success(`Đã nạp ${normalizedQuestions.length} câu hỏi từ Word.`);
    } catch (error: any) {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Không thể nạp câu hỏi từ Word.';
      toast.error(message);
    }
  };

  const showJsonIssues = (issues: string[] = [], label: string, isError: boolean) => {
    if (issues.length === 0) return;
    const shown = issues.slice(0, 3).join(' | ');
    const rest = issues.length > 3 ? ` (và ${issues.length - 3} mục khác)` : '';
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
      toast.warning('Chọn loại kỳ thi trước khi upload file JSON.');
      return;
    }
    setTestJsonChecking(true);
    try {
      const data = await previewTestJson(fileInput, testInfo.examTypeId);
      setTestJsonPreview({ ...data, fileName: fileInput.name });
      setTestJsonFile(data.valid ? fileInput : null);
      if (data.valid) {
        toast.success(`File hợp lệ: ${data.questionCount} câu, chia vào ${data.parts.length} phần thi.`);
      }
    } catch (error: any) {
      setTestJsonFile(null);
      setTestJsonPreview(null);
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Không thể đọc file JSON.';
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
      toast.warning('Chọn phần thi trước khi upload file JSON.');
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
        toast.success(`File hợp lệ: ${data.questionCount} câu.`);
      }
    } catch (error: any) {
      setBankJsonFile(null);
      setBankJsonPreview(null);
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Không thể đọc file JSON.';
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
    setBankJsonPreview({ ...bankJsonPreview, ...next, questionCount: total, groupCount: next.groups.length });
    if (total === 0) setBankJsonFile(null);
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
    setTestJsonPreview({ ...testJsonPreview, parts, questionCount: total });
    if (total === 0) setTestJsonFile(null);
  };

  // Lưu thành công thì hook xoá file; bỏ luôn bản xem trước (giữ lại bảng lỗi của file hỏng).
  useEffect(() => {
    if (!bankJsonFile) {
      setBankJsonPreview((prev) => (prev?.valid ? null : prev));
    }
  }, [bankJsonFile]);

  // Tạo đề thành công thì hook xoá file; bỏ luôn bảng tóm tắt (giữ lại bảng lỗi của file hỏng).
  useEffect(() => {
    if (!testJsonFile) {
      setTestJsonPreview((prev) => (prev?.valid ? null : prev));
    }
  }, [testJsonFile]);

  // Đổi loại kỳ thi thì phần thi đổi theo, kết quả chia cũ không còn đúng.
  useEffect(() => {
    clearTestJson();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testInfo.examTypeId]);

  /** Nạp file JSON vào form nháp. Mục tiêu 'questions' cho câu lẻ, 'groups' cho nhóm theo passage. */
  const handlePreviewFromJson = async (fileInput: File, target: 'questions' | 'groups') => {
    try {
      const formData = new FormData();
      formData.append('file', fileInput);

      const data = await previewJsonFile(formData);

      if (!data.valid) {
        showJsonIssues(data.errors, `File JSON có ${data.errors.length} lỗi`, true);
        return;
      }
      showJsonIssues(data.warnings, 'Cảnh báo', false);

      const parsedQuestions = data.questions ?? [];
      const parsedGroups = data.groups ?? [];

      if (target === 'groups') {
        if (parsedGroups.length === 0) {
          toast.warning('File JSON không có nhóm nào trong "groups".');
          return;
        }
        if (parsedQuestions.length > 0) {
          toast.info(`Bỏ qua ${parsedQuestions.length} câu trong "questions" - ở đây chỉ nạp "groups".`);
        }
        setGroups(normalizeParsedGroups(parsedGroups));
        toast.success(`Đã nạp ${parsedGroups.length} nhóm passage từ JSON.`);
        return;
      }

      if (parsedQuestions.length === 0) {
        toast.warning(
          parsedGroups.length > 0
            ? 'File JSON chỉ có "groups". Dùng tab Passage để nạp nhóm câu hỏi.'
            : 'File JSON không có câu hỏi nào trong "questions".',
        );
        return;
      }
      if (parsedGroups.length > 0) {
        toast.info(`Bỏ qua ${parsedGroups.length} nhóm trong "groups" - dùng tab Passage để nạp nhóm.`);
      }

      const normalizedQuestions = normalizeParsedQuestions(parsedQuestions);
      setQuestions(normalizedQuestions);
      toast.success(`Đã nạp ${normalizedQuestions.length} câu hỏi từ JSON.`);
    } catch (error: any) {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Không thể nạp câu hỏi từ file JSON.';
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
      toast.warning('Vui lòng chọn file Word trước khi nạp nhóm câu hỏi.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', fileInput);

      const data = await previewDocument(formData);

      const parsedQuestions = Array.isArray(data) ? data : [];
      if (parsedQuestions.length === 0) {
        toast.warning('Không tìm thấy câu hỏi hợp lệ trong file Word.');
        return;
      }

      const normalizedQuestions = normalizeParsedQuestions(parsedQuestions);
      setGroupQuestions(gIndex, normalizedQuestions);
      setGroupDocumentFiles((prev) => ({ ...prev, [gIndex]: null }));
      toast.success(`Đã nạp ${normalizedQuestions.length} câu hỏi cho nhóm ${gIndex + 1}.`);
    } catch (error: any) {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Không thể nạp nhóm câu hỏi từ Word.';
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
      toast.warning('Vui lòng chọn file Word trước khi nạp passage.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', fileInput);

      const data = await previewPassageDocument(formData);

      const parsedGroups = Array.isArray(data) ? data : [];
      if (parsedGroups.length === 0) {
        toast.warning('Không tìm thấy passage hợp lệ trong file Word.');
        return;
      }

      const normalizedGroups = normalizeParsedGroups(parsedGroups);

      setGroups(normalizedGroups);
      setBulkPassageFile(null);
      toast.success(`Đã nạp ${normalizedGroups.length} nhóm passage từ Word.`);
    } catch (error: any) {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Không thể nạp passage từ Word.';
      toast.error(message);
    }
  };

  const collectionOptions = buildCollectionTree(
    (questionCollections || []).filter(
      (c: any) =>
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
          <strong>Ghi chú:</strong> Sau khi tạo đề, vào chế độ quản lý dạng bảng và bấm biểu tượng bút chì để sửa đề,
          sửa từng câu hỏi, đáp án, cũng như cập nhật file ảnh/audio liên quan.
        </Alert>
      )}

      {activeCreatorType === CREATOR_TYPES.TEST && (
        <Alert variant="light" className="mb-3 border">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
            <span>
              <strong>Kho lưu trữ câu hỏi:</strong> Nếu bạn muốn tạo đề từ câu hỏi đã lưu trong kho, vào trang này.
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
              Mở kho lưu trữ
            </ButtonPrime>
          </div>
        </Alert>
      )}

      {activeCreatorType !== CREATOR_TYPES.BANK && (
        <div className={cx('configCard')}>
          <div className={cx('sectionTitle')}>
            1. {activeCreatorType === CREATOR_TYPES.TEST ? 'Cấu hình bài thi' : 'Thông tin chung'}
          </div>
          <Row className="g-3">
            {mode === 'class' && (
              <>
                <Col md={6}>
                  <div className={cx('formGroupModern')}>
                    <label><IoSchoolOutline /> Lớp học</label>
                    <input className={cx('inputModern', 'inputDisabled')} value={className} disabled />
                  </div>
                </Col>
                <Col md={6}>
                  <div className={cx('formGroupModern')}>
                    <label><IoBookOutline /> Chương</label>
                    <input className={cx('inputModern', 'inputDisabled')} value={chapterName} disabled />
                  </div>
                </Col>
              </>
            )}
            {activeCreatorType === CREATOR_TYPES.TEST && (
              <>
                <Col md={8}>
                  <div className={cx('formGroupModern')}>
                    <label>Tiêu đề đề thi</label>
                    <input className={cx('inputModern')} value={testInfo.title} onChange={(e) => setTestInfo({ ...testInfo, title: e.target.value })} />
                  </div>
                </Col>
                <Col md={4}>
                  <div className={cx('formGroupModern')}>
                    <label><IoImageOutline /> Link ảnh Banner</label>
                    <input className={cx('inputModern')} value={testInfo.bannerUrl} onChange={(e) => setTestInfo({ ...testInfo, bannerUrl: e.target.value })} />
                  </div>
                </Col>
              </>
            )}
            <Col md={4}>
              <div className={cx('formGroupModern')}>
                <label>Loại kỳ thi</label>
                <select className={cx('inputModern')} value={testInfo.examTypeId} onChange={(e) => handleExamTypeChange(e.target.value)}>
                  <option value="">-- Chọn --</option>

                  {examTypes.filter((t: any) => !t.childCount).map((t: any) => <option key={t.examTypeId} value={t.examTypeId}>{t.name}</option>)}
                </select>
              </div>
            </Col>
            {/* Tab tạo đề không chọn phần thi: câu được xếp vào phần thi theo tag. */}
            {activeCreatorType !== CREATOR_TYPES.TEST && (
            <Col md={4}>
              <div className={cx('formGroupModern')}>
                <label>Phần thi *</label>
                <select className={cx('inputModern')} value={testInfo.examPartId} onChange={(e) => setTestInfo({ ...testInfo, examPartId: e.target.value })} disabled={!testInfo.examTypeId}>
                  <option value="">-- Chọn part --</option>
                  {examParts.map((p: any) => <option key={p.examPartId} value={p.examPartId}>{p.name}</option>)}
                </select>
              </div>
            </Col>
            )}
            {activeCreatorType === CREATOR_TYPES.TEST && (
              <Col md={4}>
                <div className={cx('formGroupModern')}>
                  <label><IoLibraryOutline /> Bộ đề (Collection)</label>
                  <select className={cx('inputModern')} value={testInfo.collectionId || ''} onChange={(e) => setTestInfo({ ...testInfo, collectionId: e.target.value })}>
                    <option value="">-- Trống --</option>
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
                  <label><IoLibraryOutline /> Nhóm (Collection)</label>
                  <select className={cx('inputModern')} value={testInfo.collectionId || ''} onChange={(e) => setTestInfo({ ...testInfo, collectionId: e.target.value })}>
                    <option value="">-- Trống --</option>
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
                  <label>Mục đích sử dụng *</label>
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
                    <option value={QuestionUsageScope.EXAM}>Câu thi (ra đề)</option>
                    <option value={QuestionUsageScope.PRACTICE}>Câu ôn tập (lộ trình)</option>
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
                        <label><IoTimeOutline /> Thời gian (phút)</label>
                        <input type="number" className={cx('inputModern')} value={testInfo.durationMinutes} onChange={(e) => setTestInfo({ ...testInfo, durationMinutes: e.target.value })} />
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className={cx('formGroupModern')}>
                        <label><IoRocketOutline /> Lượt làm tối đa</label>
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
                        <label>Phân loại bài thi (tuỳ chọn)</label>
                        <select
                          className={cx('inputModern')}
                          value={testInfo.examCategoryId}
                          onChange={(e) => setTestInfo({ ...testInfo, examCategoryId: e.target.value })}
                          aria-label="Phân loại bài thi"
                        >
                          <option value="">-- Không phân loại --</option>
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
                        <label><IoCalendarOutline /> Thời gian bắt đầu</label>
                        <input type="datetime-local" className={cx('inputModern')} value={testInfo.availableFrom} onChange={(e) => setTestInfo({ ...testInfo, availableFrom: e.target.value })} />
                      </div>
                    </Col>
                    <Col md={activeCreatorType === CREATOR_TYPES.TEST ? 6 : 4}>
                      <div className={cx('formGroupModern')}>
                        <label><IoCalendarOutline /> Thời gian kết thúc</label>
                        <input type="datetime-local" className={cx('inputModern')} value={testInfo.availableTo} onChange={(e) => setTestInfo({ ...testInfo, availableTo: e.target.value })} />
                      </div>
                    </Col>
                    <Col md={12}>
                      <div className={cx('formGroupModern')}>
                        <label><IoInformationCircleOutline /> Mô tả</label>
                        <textarea className={cx('inputModern')} rows={2} value={testInfo.description} onChange={(e) => setTestInfo({ ...testInfo, description: e.target.value })} />
                      </div>
                    </Col>
                  </>
                )}
                {!isTestJsonMode && !isBankJsonMode && (
                <Col md={12}>
                  <div className={cx('formGroupModern')}>
                    <label>
                      {activeCreatorType === CREATOR_TYPES.BULK
                        ? 'Upload file Word để import câu hỏi số lượng lớn vào kho (DOC/DOCX)'
                        : 'Upload file Word để tạo câu hỏi nhanh (DOC/DOCX)'}
                    </label>
                    <input
                      type="file"
                      accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className={cx('inputModern')}
                      onChange={handleDocumentFileChange}
                    />
                    {documentFile && (
                      <small className="text-muted d-block mt-2">
                        Đang nạp từ file: {documentFile.name}
                      </small>
                    )}
                  </div>
                </Col>
                )}
                {activeCreatorType === CREATOR_TYPES.TEST ? (
                  <Col md={12}>
                    <div className={cx('formGroupModern')}>
                      <label>Hoặc tạo trọn đề từ file JSON (nhiều phần thi, kèm tag)</label>
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
                          ? <>Chỉ cần chọn loại kỳ thi. Mỗi câu được xếp vào phần thi theo trường <code>examPart</code> hoặc
                            tiền tố tag <code>&quot;Phần thi &gt; Tag&quot;</code>, mỗi phần thi thành một part của đề.
                            Định dạng file: <code>docs/question-import-json.md</code>.</>
                          : 'Chọn loại kỳ thi trước để upload file JSON.'}
                      </small>
                      {testJsonChecking && <small className="d-block mt-2">Đang kiểm tra file...</small>}
                    </div>
                  </Col>
                ) : (
                  <Col md={12}>
                    <div className={cx('formGroupModern')}>
                      <label>Hoặc upload file JSON (chính xác hơn, không cần đoán cấu trúc)</label>
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
                          ? <>Xem trước câu hỏi và tag rồi lưu thẳng cả file vào kho (không giới hạn số câu).
                            Sai định dạng sẽ được báo chính xác vị trí. Định dạng file:{' '}
                            <code>docs/question-import-json.md</code>.</>
                          : 'Chọn phần thi trước để upload file JSON.'}
                      </small>
                      {bankJsonChecking && <small className="d-block mt-2">Đang kiểm tra file...</small>}
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
            2. Đề từ file JSON: {testJsonPreview.fileName}
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
            summary={<><strong>{testJsonPreview.questionCount}</strong> câu, chia vào <strong>{testJsonPreview.parts.length}</strong> phần thi. Đề chỉ lấy câu từ file này.</>}
            onClear={clearTestJson}
            clearLabel="Bỏ file JSON, nhập tay"
            onEditQuestion={editTestQuestion}
          />
        </>
      )}

      {isBankJsonMode && bankJsonPreview && (
        <>
          <div className={cx('sectionTitle')}>
            2. Câu hỏi từ file JSON: {bankJsonPreview.fileName}
          </div>
          <JsonQuestionsPreview
            valid={bankJsonPreview.valid}
            errors={bankJsonPreview.errors}
            warnings={bankJsonPreview.warnings}
            parts={[{
              key: testInfo.examPartId,
              name: examParts.find((p: any) => p.examPartId === testInfo.examPartId)?.name || 'Phần thi đã chọn',
              questions: bankJsonPreview.questions || [],
              groups: bankJsonPreview.groups || [],
            }]}
            availableTags={availableTags}
            summary={<><strong>{bankJsonPreview.questionCount}</strong> câu sẽ được lưu vào kho của phần thi đã chọn.</>}
            onClear={clearBankJson}
            clearLabel="Bỏ file JSON, nhập tay"
            onEditQuestion={editBankQuestion}
          />
        </>
      )}

      {((activeCreatorType === CREATOR_TYPES.BULK && !isBankJsonMode) || (activeCreatorType === CREATOR_TYPES.TEST && !testJsonPreview)) && (
        <>
          <div className={cx('sectionTitle')}>
            2. Danh sách câu hỏi ({questions.length})
          </div>
          {activeCreatorType === CREATOR_TYPES.TEST && (
            <small className="text-muted d-block mb-3">
              Mỗi câu chọn tag của một phần thi, câu sẽ được xếp vào phần thi đó. Đề có bao nhiêu phần thi
              thì tạo bấy nhiêu part.
            </small>
          )}
          {editorTagIssues.length > 0 && (
            <div className={cx('tagSummaryBar', 'hasIssue')}>
              <span className={cx('tagSummaryItem', 'warn')}>
                ⚠ {editorTagIssues.length} câu chưa có tag hoặc tag không khớp:{' '}
                {editorTagIssues.slice(0, 15).map((i) => `Câu ${i + 1}`).join(', ')}
                {editorTagIssues.length > 15 ? ` và ${editorTagIssues.length - 15} câu khác` : ''}
              </span>
              <button
                type="button"
                className={cx('tagFilterBtn')}
                onClick={() => {
                  setEditorIssuesOnly((v) => !v);
                  setEditorPage(0);
                }}
              >
                {editorIssuesOnly ? 'Hiện tất cả câu' : 'Chỉ hiện các câu này'}
              </button>
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
              setPassageTypeFn={setPassageType}
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
            2. Danh sách nhóm ({groups.length})
          </div>

          <div className={cx('groupCard')} style={{ borderStyle: 'dashed', backgroundColor: '#f8fafc', marginBottom: '20px' }}>
            <div className={cx('formGroupModern', 'mb-0')}>
              <label className="mb-2 d-block fw-bold text-primary">
                Upload file Word nạp NHIỀU Passage tự động (DOC/DOCX)
              </label>
              <input
                type="file"
                accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className={cx('inputModern')}
                onChange={handleBulkPassageFileChange}
              />
              <small className="text-muted d-block mt-2">
                File của bạn cần có dòng phân cách Passage (ví dụ: "Passage 1:", "Bài đọc 2:"). Các câu hỏi bên dưới sẽ tự động được xếp vào đúng Passage.
                Nếu 1 passage có NHIỀU đoạn văn, ngăn các đoạn bằng dòng "Đoạn 2:", "Đoạn 3:"… (đoạn đầu không cần đánh dấu); đặt trước dòng "Dịch:" nếu có.
              </small>
            </div>

            <div className={cx('formGroupModern', 'mb-0')} style={{ marginTop: '16px' }}>
              <label className="mb-2 d-block fw-bold text-primary">
                Hoặc upload file JSON nạp NHIỀU Passage (chính xác hơn)
              </label>
              <input
                type="file"
                accept=".json,application/json"
                className={cx('inputModern')}
                onChange={(e) => handleJsonFileChange(e, 'groups')}
              />
              <small className="text-muted d-block mt-2">
                Nạp các nhóm trong <code>groups</code> của file JSON, không cần dòng phân cách nào.
                File mẫu: <code>docs/question-import-sample.json</code>. Lưu ý: JSON không mang theo
                file audio/ảnh - dùng <code>mediaUrl</code> của file đã upload, hoặc thêm media bên dưới sau khi nạp.
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
                  aria-label={isCollapsed ? `Mở nhóm ${gIndex + 1}` : `Thu gọn nhóm ${gIndex + 1}`}
                >
                  {isCollapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
                  <h4 className={cx('groupTitle')}>Nhóm thứ {gIndex + 1}</h4>
                  <span className={cx('groupSummaryBadge')}>{getGroupSummary(group)}</span>
                </button>
                {groups.length > 1 && (
                  <ButtonPrime variant="dangerGhost" size="icon" onClick={() => removeGroup(gIndex)} aria-label={`Xóa nhóm ${gIndex + 1}`}>
                    <Trash size={18} />
                  </ButtonPrime>
                )}
              </div>
              {!isCollapsed && (
              <>
              <div className={cx('passageSection')}>
                <div className={cx('formGroupModern')}>
                  <label className="mb-2 d-block fw-bold">Nội dung Passage (tùy chọn)</label>
                  <textarea
                    className={cx('inputModern')}
                    rows={3}
                    value={group.passage.content}
                    onChange={(e) => updatePassage(gIndex, 'content', e.target.value)}
                    placeholder="Nhập nội dung văn bản nếu có..."
                  />
                </div>
                {(group.passage.extraContents || []).map((text, tIdx) => (
                  <div className={cx('formGroupModern')} key={tIdx}>
                    <label className="mb-2 d-flex justify-content-between align-items-center fw-bold">
                      <span>Đoạn văn bổ sung {tIdx + 2}</span>
                      <ButtonPrime
                        variant="dangerGhost"
                        size="icon"
                        onClick={() => removeGroupPassageText(gIndex, tIdx)}
                        aria-label={`Xóa đoạn văn bổ sung ${tIdx + 2}`}
                      >
                        <Trash size={14} />
                      </ButtonPrime>
                    </label>
                    <textarea
                      className={cx('inputModern')}
                      rows={3}
                      value={text}
                      onChange={(e) => updateGroupPassageText(gIndex, tIdx, e.target.value)}
                      placeholder={`Nội dung đoạn văn thứ ${tIdx + 2}...`}
                    />
                  </div>
                ))}
                <div className="mb-3">
                  <ButtonPrime
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cx('btnSecondary')}
                    onClick={() => addGroupPassageText(gIndex)}
                  >
                    <PlusCircle size={16} className="me-1" /> Thêm đoạn văn
                  </ButtonPrime>
                </div>
                <div className={cx('formGroupModern')}>
                  <label className="mb-2 d-block fw-bold">Bản dịch Passage (tùy chọn)</label>
                  <textarea
                    className={cx('inputModern')}
                    rows={3}
                    value={group.passage.contentTranslation || ''}
                    onChange={(e) => updatePassage(gIndex, 'contentTranslation', e.target.value)}
                    placeholder="Bản dịch của nội dung passage (phần &quot;Dịch:&quot; trong file Word)..."
                  />
                </div>
                <div className={cx('formGroupModern')}>
                  <label className="mb-2 d-block fw-bold">Upload phương tiện (ảnh / audio)</label>
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
                  <label>Upload file Word để nạp câu hỏi cho nhóm này (DOC/DOCX)</label>
                  <input
                    type="file"
                    accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className={cx('inputModern')}
                    onChange={(e) => handleGroupDocumentFileChange(gIndex, e)}
                  />
                  {groupDocumentFiles[gIndex] && (
                    <small className="text-muted d-block mt-2">
                      Đang nạp cho nhóm {gIndex + 1}: {groupDocumentFiles[gIndex]?.name}
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
                    updateQuestionFieldFn={(i, field, value) => updateGroupQuestion(gIndex, i, field, value)}
                    updateAnswerFn={(i, aIndex, field, value) => updateGroupAnswer(gIndex, i, aIndex, field, value)}
                    addAnswerFn={(i) => addGroupAnswer(gIndex, i)}
                    removeAnswerFn={(i, aIndex) => removeGroupAnswer(gIndex, i, aIndex)}
                    addMediaFilesFn={() => { }}
                    removeMediaFileFn={() => { }}
                    setPassageTypeFn={() => { }}
                    availableTags={availableTags}
                    withMedia={false}
                    minQuestions={group.questions.length}
                  />
                ))}
                <ButtonPrime type="button" variant="outline" size="sm" className={cx('btnSecondary')} onClick={() => addGroupQuestion(gIndex)}><PlusCircle size={18} /> Thêm câu hỏi</ButtonPrime>
              </div>
              </>
              )}
            </div>
            );
          })}
          <ButtonPrime type="button" variant="outline" size="sm" className={cx('btnSecondary', 'btnGroupAdd')} onClick={addGroup}><IoAddOutline size={20} /> Thêm nhóm passage</ButtonPrime>
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
          submitLabel="Lưu tất cả"
          showAddBtn={false}
        />
      )}
    </>
  );
};

export default CreateTestFormBody;
