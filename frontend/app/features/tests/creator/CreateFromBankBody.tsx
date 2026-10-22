'use client';

import { useEffect, useEffectEvent, useState } from 'react';
import { fromDateTimeLocalInput } from '@/app/utils/format-date-time';
import { useMutation } from '@tanstack/react-query';
import { Row, Col, Spinner, Alert, Form } from 'react-bootstrap';
import { getChaptersByClass } from '@/app/apis/chapterApi';
import { createTest, addRandomQuestionsToPart, addQuestionsToPart } from '@/app/apis/testApi';
import { createTestPart } from '@/app/apis/testPartApi';
import { buildCollectionTree, getCollectionWithDescendantIds } from '@/app/features/tests/collectionTree';
import classNames from 'classnames/bind';
import { toast } from 'react-toastify';
import { useTranslations } from 'next-intl';
import {
  IoLibraryOutline,
  IoSettingsOutline,
  IoCheckboxOutline,
  IoShuffleOutline,
  IoBookOutline,
  IoTimeOutline,
  IoRocketOutline,
  IoChevronDownOutline,
  IoChevronUpOutline,
  IoCreateOutline,
  IoServerOutline,
  IoSchoolOutline,
  IoFilterOutline,
} from 'react-icons/io5';
import { useBaseMetaData } from '@/app/features/tests/creator/hooks/useBaseMetaData';
import { durationMinutesFromExamType } from '@/app/features/exam-types/hooks/useExamTypes';
import { useHasPermission } from '@/app/hooks/usePermission';
import { brandColors } from '@/app/assets/styles/brandColors';
import CoinPriceField from '@/app/features/tests/CoinPriceField';
import { getQuestionDisplayNumber } from '@/app/features/tests/questionNumber';
import EditQuestionModal from '@/app/features/tests/EditQuestionModal';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import { useExamCategories } from '@/app/features/tests/creator/hooks/useExamCategories';
import {
  useBankTestBuilder,
  SELECTION_MODES,
  defaultPartConfig,
  groupQuestionsByPassage,
} from '@/app/features/tests/creator/hooks/useBankTestBuilder';
import type { BankLoadParams, BankQuestion, PartConfig } from '@/app/features/tests/creator/hooks/useBankTestBuilder';
import { PermissionCode, QuestionBankScope, QuestionUsageScope } from '@/app/enums';
import type { ChapterResponse, CreateTestRequest, ExamPartResponse } from '@/app/types';
import type { CreateTestMode } from '@/app/features/tests/creator/CreateTestFormBody';
import styles from '@/app/features/tests/CreateTestModal.module.scss';

const cx = classNames.bind(styles);

const COLLECTION_SCOPED_MODES: string[] = [
  SELECTION_MODES.RANDOM_BY_COLLECTION,
  SELECTION_MODES.SEQUENTIAL,
  SELECTION_MODES.MANUAL,
];

const BANK_SOURCES = {
  PERSONAL: 'personal',
  ADMIN: 'admin',
  CLASS: 'class',
} as const;

type BankSource = (typeof BANK_SOURCES)[keyof typeof BANK_SOURCES];

const ALL_CHAPTERS = '__ALL__';

// label/hint là khóa dịch (namespace TestCreatorBank).
const BANK_SCOPE_OPTIONS = [
  {
    value: QuestionBankScope.EXAM,
    label: 'scope.exam.label',
    hint: 'scope.exam.hint',
  },
  {
    value: QuestionBankScope.PRACTICE,
    label: 'scope.practice.label',
    hint: 'scope.practice.hint',
  },
  {
    value: QuestionBankScope.ALL,
    label: 'scope.all.label',
    hint: 'scope.all.hint',
  },
] as const satisfies readonly { value: QuestionBankScope; label: string; hint: string }[];

type BankTestInfo = {
  title: string;
  description: string;
  durationMinutes: string;
  maxAttempts: string;
  examTypeId: string;
  examCategoryId: string;
  collectionId: string;
  bannerUrl: string;
  availableFrom: string;
  availableTo: string;
  costCoins: string;
};

type CreateFromBankBodyProps = {
  onCancel?: () => void;
  onSuccess?: () => void;
  mode?: CreateTestMode;
  classId?: string;
  chapterId?: string;
};

const CreateFromBankBody = ({ onCancel, onSuccess, mode = 'personal', classId, chapterId }: CreateFromBankBodyProps) => {
  const t = useTranslations('TestCreatorBank');
  const isClassMode = mode === 'class' && !!classId;

  const canAccessAdminBank = useHasPermission(PermissionCode.QUESTION_MANAGE);

  const [testInfo, setTestInfo] = useState<BankTestInfo>({
    title: '',
    description: '',
    durationMinutes: '',
    maxAttempts: '',
    examTypeId: '',
    examCategoryId: '',
    collectionId: '',
    bannerUrl: '',
    availableFrom: '',
    availableTo: '',
    costCoins: '',
  });

  const examCategories = useExamCategories();

  const [notification, setNotification] = useState<{ type?: string; message?: string }>({});
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingPartId, setEditingPartId] = useState<string | null>(null);
  const [bankSource, setBankSource] = useState<BankSource>(isClassMode ? BANK_SOURCES.CLASS : BANK_SOURCES.PERSONAL);
  const [bankScope, setBankScope] = useState<QuestionBankScope>(QuestionBankScope.EXAM);
  const [chapters, setChapters] = useState<ChapterResponse[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string>(chapterId || ALL_CHAPTERS);

  const { examTypes, examParts, questionCollections } = useBaseMetaData(testInfo.examTypeId);
  const collectionScopeIds = testInfo.collectionId
    ? getCollectionWithDescendantIds(questionCollections, testInfo.collectionId).map(String)
    : null;

  const getScopedQuestions = (cfg: PartConfig | undefined): BankQuestion[] => {
    const list = cfg?.bankQuestions || [];
    if (!collectionScopeIds || !COLLECTION_SCOPED_MODES.includes(cfg?.mode as string)) return list;
    const scope = new Set(collectionScopeIds);
    return list.filter((q) => q.collectionId != null && scope.has(String(q.collectionId)));
  };

  const {
    partConfigs,
    setPartConfigs,
    updatePartConfig,
    togglePartExpanded,
    loadQuestionsForPart,
    toggleGroup,
    isGroupSelected,
    toggleSelectAll,
    getPartEffectiveCount,
    hasPartWithQuestions,
  } = useBankTestBuilder({ getScopedQuestions });

  const buildLoadParams = (
    source: BankSource = bankSource,
    chapterFilter = selectedChapterId,
    scope: QuestionBankScope = bankScope,
  ): BankLoadParams => {
    const params: BankLoadParams = { usageScope: scope };
    if (source === BANK_SOURCES.ADMIN) return { ...params, bank: 'admin' };
    if (source === BANK_SOURCES.CLASS && classId) {
      params.classId = classId;
      if (chapterFilter && chapterFilter !== ALL_CHAPTERS) params.chapterId = chapterFilter;
      return params;
    }
    return params;
  };

  useEffect(() => {
    if (!isClassMode) return;
    getChaptersByClass(classId as string)
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setChapters(list);
      })
      .catch((err) => {
        console.error('Lỗi tải chapter:', err);
        setChapters([]);
      });
  }, [isClassMode, classId]);

  // Đổi loại đề, danh sách part hoặc nguồn/chương/phạm vi kho thì khởi tạo lại cấu hình và tải câu hỏi.
  // useEffectEvent: luôn dùng loadQuestionsForPart/buildLoadParams mới nhất mà không làm effect chạy lại.
  const initPartConfigs = useEffectEvent((
    examTypeId: string,
    parts: ExamPartResponse[],
    source: BankSource,
    chapterFilter: string,
    scope: QuestionBankScope,
  ) => {
    if (!examTypeId || !parts?.length) {
      setPartConfigs((prev) => (Object.keys(prev).length ? {} : prev));
      return;
    }
    const initial: Record<string, PartConfig> = {};
    parts.forEach((p) => {
      initial[p.examPartId] = { ...defaultPartConfig(), expanded: false, loading: true };
    });
    setPartConfigs(initial);
    parts.forEach((part) => {
      loadQuestionsForPart(part.examPartId, buildLoadParams(source, chapterFilter, scope));
    });
  });

  useEffect(() => {
    initPartConfigs(testInfo.examTypeId, examParts, bankSource, selectedChapterId, bankScope);
  }, [testInfo.examTypeId, examParts, bankSource, selectedChapterId, bankScope]);

  const handleEditQuestionSuccess = () => {
    setEditingQuestionId(null);
    if (editingPartId) {
      loadQuestionsForPart(editingPartId, buildLoadParams(bankSource, selectedChapterId, bankScope));
    }
  };

  const handleExamTypeChange = (value: string) => {
    setTestInfo((prev) => ({
      ...prev,
      examTypeId: value,
      durationMinutes: durationMinutesFromExamType(examTypes, value),
    }));
  };

  const applyModeToAllParts = (modeValue: PartConfig['mode']) => {
    setPartConfigs((prev) => {
      const next = { ...prev };
      (examParts || []).forEach((p) => {
        next[p.examPartId] = { ...(next[p.examPartId] || defaultPartConfig()), mode: modeValue };
      });
      return next;
    });
  };

  const createTestMutation = useMutation({
    mutationFn: async (partsToAdd: ExamPartResponse[]) => {
      const testData = await createTest({
        title: testInfo.title.trim(),
        description: testInfo.description || null,
        examTypeId: testInfo.examTypeId,
        examCategoryId: testInfo.examCategoryId || null,
        durationMinutes: testInfo.durationMinutes && Number(testInfo.durationMinutes) > 0 ? Number(testInfo.durationMinutes) : null,
        maxAttempts: testInfo.maxAttempts && Number(testInfo.maxAttempts) > 0 ? Number(testInfo.maxAttempts) : null,
        bannerUrl: testInfo.bannerUrl || null,
        availableFrom: fromDateTimeLocalInput(testInfo.availableFrom),
        availableTo: fromDateTimeLocalInput(testInfo.availableTo),
        classId: isClassMode ? classId : null,
        chapterId: isClassMode ? (chapterId || null) : null,
        collectionId: testInfo.collectionId ? String(testInfo.collectionId) : null,
        costCoins: testInfo.costCoins && Number(testInfo.costCoins) > 0 ? Number(testInfo.costCoins) : null,
      } as unknown as CreateTestRequest);

      const newTestId = testData.testId;
      if (!newTestId) throw new Error(t('submit.errors.noTestId'));

      for (const part of partsToAdd) {
        const cfg = partConfigs[part.examPartId];
        const numQuestions = getPartEffectiveCount(part.examPartId);
        if (numQuestions <= 0) continue;

        const partData = await createTestPart({
          testId: String(newTestId),
          examPartId: String(part.examPartId),
          numQuestions,
        });
        const newPartId = partData.testPartId;
        if (!newPartId) throw new Error(t('submit.errors.noPartId', { part: part.name ?? '' }));

        if (cfg.mode === SELECTION_MODES.MANUAL) {
          const scopedIds = new Set(getScopedQuestions(cfg).map((q) => q.questionId ?? q.id));
          await addQuestionsToPart({
            testPartId: String(newPartId),
            questionIds: (cfg.selectedIds || []).filter((id) => scopedIds.has(id)).map(String),
          });
        } else {
          const useClassSource = bankSource === BANK_SOURCES.CLASS && classId;
          const isSequential = cfg.mode === SELECTION_MODES.SEQUENTIAL;

          const scopeByCollection = COLLECTION_SCOPED_MODES.includes(cfg.mode) && !!testInfo.collectionId;
          await addRandomQuestionsToPart({
            testPartId: String(newPartId),
            count: numQuestions,
            isSequential,
            fromIndex: isSequential ? parseInt(cfg.fromIndex, 10) : undefined,
            toIndex: isSequential ? parseInt(cfg.toIndex, 10) : undefined,
            bank: bankSource === BANK_SOURCES.ADMIN ? 'admin' : undefined,
            classId: useClassSource ? classId : undefined,
            chapterId: useClassSource && selectedChapterId && selectedChapterId !== ALL_CHAPTERS ? selectedChapterId : undefined,
            collectionId: scopeByCollection ? String(testInfo.collectionId) : undefined,
            usageScope: bankScope,
          });
        }
      }
    },
    onSuccess: () => {
      setTestInfo((prev) => ({ ...prev, title: '', description: '' }));
      toast.success(t('submit.created'));
      onSuccess?.();
    },
    onError: (error: unknown) => {
      const err = error as { message?: string; response?: { data?: unknown } } | null;
      const data = err?.response?.data;
      // Backend có thể trả { message } hoặc chuỗi thô.
      const msg = (data as { message?: unknown } | null | undefined)?.message ?? data ?? err?.message;
      setNotification({ type: 'danger', message: t('submit.errors.prefix', { message: typeof msg === 'string' ? msg : JSON.stringify(msg) }) });
    },
  });

  const handleSubmit = (e?: React.FormEvent) => {
    if (e?.preventDefault) e.preventDefault();

    if (!testInfo.title?.trim() || !testInfo.examTypeId) {
      setNotification({ type: 'warning', message: t('submit.titleRequired') });
      return;
    }

    const partsToAdd = examParts.filter(hasPartWithQuestions);
    if (partsToAdd.length === 0) {
      setNotification({ type: 'warning', message: t('submit.partRequired') });
      return;
    }

    setNotification({});
    createTestMutation.mutate(partsToAdd);
  };

  const totalSelected = (examParts || []).reduce((sum: number, p) => sum + getPartEffectiveCount(p.examPartId), 0);
  const hasAnyPartWithQuestions = (examParts || []).some((p) => getPartEffectiveCount(p.examPartId) > 0);

  return (
    <>
      {notification.message && (
        <Alert variant={notification.type} className="mb-3" dismissible onClose={() => setNotification({})}>
          {notification.message}
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>

        <div className={cx('configCard')}>
          <div className={cx('sectionTitle')}>
            <IoSettingsOutline /> 1. {t('info.section')}
          </div>
          <Row className="g-3">
            <Col md={8}>
              <div className={cx('formGroupModern')}>
                <label>{t('info.title')}</label>
                <input
                  type="text"
                  className={cx('inputModern')}
                  value={testInfo.title}
                  onChange={(e) => setTestInfo({ ...testInfo, title: e.target.value })}
                  placeholder={t('info.titlePlaceholder')}
                  aria-label={t('info.titleAria')}
                />
              </div>
            </Col>
            <Col md={4}>
              <div className={cx('formGroupModern')}>
                <label><IoTimeOutline /> {t('info.duration')}</label>
                <input
                  type="number"
                  min={0}
                  className={cx('inputModern')}
                  value={testInfo.durationMinutes}
                  onChange={(e) => setTestInfo({ ...testInfo, durationMinutes: e.target.value })}
                  placeholder={t('info.durationPlaceholder')}
                  aria-label={t('info.durationAria')}
                />
              </div>
            </Col>
            <Col md={4}>
              <div className={cx('formGroupModern')}>
                <label>{t('info.examType')}</label>
                <select
                  className={cx('inputModern')}
                  value={testInfo.examTypeId}
                  onChange={(e) => handleExamTypeChange(e.target.value)}
                  aria-label={t('info.examTypeAria')}
                >
                  <option value="">{t('info.selectPlaceholder')}</option>

                  {(examTypes || []).filter((type) => !type.childCount).map((type) => (
                    <option key={type.examTypeId} value={type.examTypeId}>{type.name}</option>
                  ))}
                </select>
              </div>
            </Col>
            <Col md={4}>
              <div className={cx('formGroupModern')}>
                <label><IoLibraryOutline /> {t('info.collection')}</label>
                <select
                  className={cx('inputModern')}
                  value={testInfo.collectionId || ''}
                  onChange={(e) => setTestInfo({ ...testInfo, collectionId: e.target.value })}
                  aria-label={t('info.collectionAria')}
                >
                  <option value="">{t('info.emptyOption')}</option>
                  {buildCollectionTree(
                    (questionCollections || []).filter(
                      (c) => !testInfo.examTypeId || !c.examTypeId || String(c.examTypeId) === String(testInfo.examTypeId),
                    ),
                  ).map((c) => (
                    <option key={c.collectionId} value={c.collectionId}>
                      {c.depth > 0 ? `    └ ${c.name}` : c.name}
                    </option>
                  ))}
                </select>
              </div>
            </Col>
            <Col md={4}>
              <div className={cx('formGroupModern')}>
                <label><IoRocketOutline /> {t('info.maxAttempts')}</label>
                <input
                  type="number"
                  min={0}
                  className={cx('inputModern')}
                  value={testInfo.maxAttempts}
                  onChange={(e) => setTestInfo({ ...testInfo, maxAttempts: e.target.value })}
                  placeholder={t('info.maxAttemptsPlaceholder')}
                  aria-label={t('info.maxAttemptsAria')}
                />
              </div>
            </Col>
            <CoinPriceField
              isPublic={!isClassMode}
              value={testInfo.costCoins}
              onChange={(v) => setTestInfo({ ...testInfo, costCoins: v })}
              groupClassName={cx('formGroupModern')}
              inputClassName={cx('inputModern')}
            />
            <Col md={4}>
              <div className={cx('formGroupModern')}>
                <label>{t('info.category')}</label>
                <select
                  className={cx('inputModern')}
                  value={testInfo.examCategoryId}
                  onChange={(e) => setTestInfo({ ...testInfo, examCategoryId: e.target.value })}
                  aria-label={t('info.categoryAria')}
                >
                  <option value="">{t('info.noCategory')}</option>
                  {examCategories.map((c) => (
                    <option key={c.examCategoryId} value={c.examCategoryId}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </Col>
            <Col md={12}>
              <div className={cx('formGroupModern')}>
                <label>{t('info.description')}</label>
                <textarea
                  className={cx('inputModern')}
                  rows={2}
                  value={testInfo.description}
                  onChange={(e) => setTestInfo({ ...testInfo, description: e.target.value })}
                  placeholder={t('info.descriptionPlaceholder')}
                  aria-label={t('info.descriptionAria')}
                />
              </div>
            </Col>
          </Row>
        </div>

        <div className={cx('configCard')}>
          <div className={cx('sectionTitle')}>
            <IoServerOutline /> 2. {t('source.section')}
          </div>
          <p className={cx('bankHint')}>
            {t.rich('source.hint', { strong: (chunks) => <strong>{chunks}</strong> })}
            {isClassMode && (
              <> {t.rich('source.classHint', { strong: (chunks) => <strong>{chunks}</strong> })}</>
            )}
            {canAccessAdminBank && (
              <> {t.rich('source.adminHint', { strong: (chunks) => <strong>{chunks}</strong> })}</>
            )}
          </p>
          <div
            style={{
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              className={cx('bankModeTab', { active: bankSource === BANK_SOURCES.PERSONAL })}
              onClick={() => setBankSource(BANK_SOURCES.PERSONAL)}
              aria-pressed={bankSource === BANK_SOURCES.PERSONAL}
            >
              <IoLibraryOutline size={18} /> {t('source.personal')}
            </button>
            {isClassMode && (
              <button
                type="button"
                className={cx('bankModeTab', { active: bankSource === BANK_SOURCES.CLASS })}
                onClick={() => setBankSource(BANK_SOURCES.CLASS)}
                aria-pressed={bankSource === BANK_SOURCES.CLASS}
              >
                <IoSchoolOutline size={18} /> {t('source.class')}
              </button>
            )}
            {canAccessAdminBank && (
              <button
                type="button"
                className={cx('bankModeTab', { active: bankSource === BANK_SOURCES.ADMIN })}
                onClick={() => setBankSource(BANK_SOURCES.ADMIN)}
                aria-pressed={bankSource === BANK_SOURCES.ADMIN}
              >
                <IoServerOutline size={18} /> {t('source.admin')}
              </button>
            )}
          </div>

          <div className={cx('bankScopeRow')} style={{ marginTop: 16 }}>
            <div className={cx('bankScopeLabel')}>
              <IoFilterOutline size={16} /> {t('scope.label')}
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {BANK_SCOPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={cx('bankModeTab', { active: bankScope === opt.value })}
                  onClick={() => setBankScope(opt.value)}
                  aria-pressed={bankScope === opt.value}
                  title={t(opt.hint)}
                >
                  {t(opt.label)}
                </button>
              ))}
            </div>
            <p className={cx('bankHint')} style={{ marginTop: 8, marginBottom: 0 }}>
              {t(BANK_SCOPE_OPTIONS.find((o) => o.value === bankScope)?.hint ?? 'scope.exam.hint')}
            </p>
          </div>

          {isClassMode && bankSource === BANK_SOURCES.CLASS && (
            <div className={cx('formGroupModern')} style={{ marginTop: 14, maxWidth: 480 }}>
              <label><IoBookOutline /> {t('source.chapterFilter')}</label>
              <select
                className={cx('inputModern')}
                value={selectedChapterId}
                onChange={(e) => setSelectedChapterId(e.target.value)}
                aria-label={t('source.chapterAria')}
              >
                <option value={ALL_CHAPTERS}>{t('source.allChaptersOption')}</option>
                {chapters.map((c) => (
                  <option key={c.chapterId} value={c.chapterId}>
                    {c.title || t('source.chapterFallback', { chapterId: c.chapterId })}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {testInfo.examTypeId && (examParts || []).length > 0 && (
          <div className={cx('configCard')}>
            <div className={cx('sectionTitle')}>
              <IoLibraryOutline /> 3. {t('parts.section')}
              <span
                style={{
                  marginLeft: 10,
                  fontSize: '1.15rem',
                  fontWeight: 600,
                  color: bankSource === BANK_SOURCES.ADMIN
                    ? brandColors.primaryHover
                    : bankSource === BANK_SOURCES.CLASS ? '#047857' : '#475569',
                  background: bankSource === BANK_SOURCES.ADMIN
                    ? brandColors.brand100
                    : bankSource === BANK_SOURCES.CLASS ? '#d1fae5' : '#f1f5f9',
                  padding: '2px 10px',
                  borderRadius: 999,
                }}
              >
                {bankSource === BANK_SOURCES.ADMIN
                  ? t('source.admin')
                  : bankSource === BANK_SOURCES.CLASS
                    ? `${t('source.class')} · ${selectedChapterId && selectedChapterId !== ALL_CHAPTERS
                      ? chapters.find((c) => c.chapterId === selectedChapterId)?.title || t('source.chapter')
                      : t('source.allChapters')}`
                    : t('source.personal')}
              </span>
              <span
                style={{
                  marginLeft: 8,
                  fontSize: '1.15rem',
                  fontWeight: 600,
                  color: bankScope === QuestionBankScope.EXAM ? '#475569' : '#6d28d9',
                  background: bankScope === QuestionBankScope.EXAM ? '#f1f5f9' : '#ede9fe',
                  padding: '2px 10px',
                  borderRadius: 999,
                }}
              >
                {t(BANK_SCOPE_OPTIONS.find((o) => o.value === bankScope)?.label ?? 'scope.exam.label')}
              </span>
            </div>
            <p className={cx('bankHint')}>
              {t.rich('parts.modesHint', { strong: (chunks) => <strong>{chunks}</strong> })}
              {' '}{testInfo.collectionId ? t('parts.collectionSelectedHint') : t('parts.collectionNotSelectedHint')}
              {' '}{t.rich('parts.passageHint', { strong: (chunks) => <strong>{chunks}</strong> })}
            </p>

            <div className={cx('bankModeTabs')}>
              <button
                type="button"
                className={cx('bankModeTab', 'active')}
                onClick={() => applyModeToAllParts(SELECTION_MODES.RANDOM_BY_COLLECTION)}
                title={testInfo.collectionId
                  ? t('parts.applyByCollectionTitle')
                  : t('parts.applyByCollectionNoCollectionTitle')}
              >
                <IoLibraryOutline size={18} /> {t('parts.applyByCollection')}
              </button>
              <button
                type="button"
                className={cx('bankModeTab')}
                onClick={() => applyModeToAllParts(SELECTION_MODES.RANDOM)}
                title={t('parts.applyRandomTitle')}
              >
                <IoShuffleOutline size={18} /> {t('parts.applyRandom')}
              </button>
            </div>

            {(examParts || []).map((part) => {
              const cfg = partConfigs[part.examPartId] ?? defaultPartConfig();
              const scopedQuestions = getScopedQuestions(cfg);
              const maxInBank = scopedQuestions.length;

              const collectionScoped = !!collectionScopeIds && COLLECTION_SCOPED_MODES.includes(cfg.mode);
              const allSelected = maxInBank > 0 && getPartEffectiveCount(part.examPartId) === maxInBank;

              return (
                <div key={part.examPartId} className={cx('bankPartCard')}>
                  <button
                    type="button"
                    className={cx('bankPartHeader')}
                    onClick={() => togglePartExpanded(part.examPartId)}
                    aria-expanded={cfg.expanded}
                  >
                    <span className={cx('bankPartName')}>
                      <IoBookOutline size={20} /> {part.name}
                    </span>
                    <span className={cx('bankPartBadge')}>{t('parts.questionCount', { count: maxInBank })}</span>
                    {cfg.expanded ? <IoChevronUpOutline size={22} /> : <IoChevronDownOutline size={22} />}
                  </button>

                  {cfg.expanded && (
                    <div className={cx('bankPartBody')}>

                      <div className={cx('bankModeTabs')}>
                        <button
                          type="button"
                          className={cx('bankModeTab', { active: cfg.mode === SELECTION_MODES.RANDOM })}
                          onClick={() => updatePartConfig(part.examPartId, 'mode', SELECTION_MODES.RANDOM)}
                          aria-pressed={cfg.mode === SELECTION_MODES.RANDOM}
                        >
                          <IoShuffleOutline size={18} /> {t('modes.random')}
                        </button>
                        <button
                          type="button"
                          className={cx('bankModeTab', { active: cfg.mode === SELECTION_MODES.RANDOM_BY_COLLECTION })}
                          onClick={() => updatePartConfig(part.examPartId, 'mode', SELECTION_MODES.RANDOM_BY_COLLECTION)}
                          aria-pressed={cfg.mode === SELECTION_MODES.RANDOM_BY_COLLECTION}
                          title={testInfo.collectionId ? undefined : t('modes.byCollectionNoCollectionTitle')}
                        >
                          <IoLibraryOutline size={18} /> {t('modes.byCollection')}
                        </button>
                        <button
                          type="button"
                          className={cx('bankModeTab', { active: cfg.mode === SELECTION_MODES.SEQUENTIAL })}
                          onClick={() => updatePartConfig(part.examPartId, 'mode', SELECTION_MODES.SEQUENTIAL)}
                          aria-pressed={cfg.mode === SELECTION_MODES.SEQUENTIAL}
                        >
                          <IoRocketOutline size={18} /> {t('modes.sequential')}
                        </button>
                        <button
                          type="button"
                          className={cx('bankModeTab', { active: cfg.mode === SELECTION_MODES.MANUAL })}
                          onClick={() => updatePartConfig(part.examPartId, 'mode', SELECTION_MODES.MANUAL)}
                          aria-pressed={cfg.mode === SELECTION_MODES.MANUAL}
                        >
                          <IoCheckboxOutline size={18} /> {t('modes.manual')}
                        </button>
                      </div>

                      {cfg.mode === SELECTION_MODES.RANDOM && (
                        <div className={cx('bankRandomRow')}>
                          <label className={cx('bankRandomLabel')}>{t('parts.randomCount')}</label>
                          <input
                            type="number"
                            min={0}
                            max={Math.max(maxInBank, 0)}
                            className={cx('inputModern', 'bankRandomInput')}
                            value={cfg.randomCount}
                            onChange={(e) => updatePartConfig(part.examPartId, 'randomCount', e.target.value)}
                            aria-label={t('parts.randomAria', { part: part.name ?? '' })}
                          />
                          <span className={cx('bankRandomHint')}>{collectionScoped ? t('parts.maxInCollection', { count: maxInBank }) : t('parts.maxInBank', { count: maxInBank })}</span>
                        </div>
                      )}

                      {cfg.mode === SELECTION_MODES.RANDOM_BY_COLLECTION && (
                        <div className={cx('bankRandomRow')}>
                          <span className={cx('bankRandomHint')}>
                            {testInfo.collectionId
                              ? t('parts.byCollectionHint', { count: maxInBank })
                              : t('parts.byCollectionNoCollectionHint', { count: maxInBank })}
                          </span>
                        </div>
                      )}

                      {cfg.mode === SELECTION_MODES.SEQUENTIAL && (
                        <div className={cx('bankRandomRow')} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                          <label className={cx('bankRandomLabel')}>{t('parts.fromIndex')}</label>
                          <input
                            type="number"
                            min={1}
                            max={Math.max(maxInBank, 1)}
                            className={cx('inputModern', 'bankRandomInput')}
                            value={cfg.fromIndex}
                            onChange={(e) => updatePartConfig(part.examPartId, 'fromIndex', e.target.value)}
                            aria-label={t('parts.fromAria', { part: part.name ?? '' })}
                          />
                          <label className={cx('bankRandomLabel')}>{t('parts.toIndex')}</label>
                          <input
                            type="number"
                            min={1}
                            max={Math.max(maxInBank, 1)}
                            className={cx('inputModern', 'bankRandomInput')}
                            value={cfg.toIndex}
                            onChange={(e) => updatePartConfig(part.examPartId, 'toIndex', e.target.value)}
                            aria-label={t('parts.toAria', { part: part.name ?? '' })}
                          />
                          <span className={cx('bankRandomHint')}>{collectionScoped ? t('parts.maxInCollection', { count: maxInBank }) : t('parts.maxInBank', { count: maxInBank })}</span>
                        </div>
                      )}

                      {cfg.loading && (
                        <div className={cx('bankLoadingWrap')}>
                          <Spinner animation="border" size="sm" /> <span>{t('parts.loading')}</span>
                        </div>
                      )}

                      {!cfg.loading && maxInBank === 0 && (
                        <Alert variant="info" className="mb-0 mt-2">
                          {collectionScoped
                            ? t('parts.empty.collection')
                            : bankSource === BANK_SOURCES.ADMIN
                              ? t('parts.empty.admin')
                              : bankSource === BANK_SOURCES.CLASS
                                ? (selectedChapterId && selectedChapterId !== ALL_CHAPTERS
                                    ? t('parts.empty.classChapter')
                                    : t('parts.empty.class'))
                                : t('parts.empty.personal')}
                          {bankScope !== QuestionBankScope.ALL && (
                            <> {t.rich('parts.filteringBy', { scope: t(BANK_SCOPE_OPTIONS.find((o) => o.value === bankScope)?.label ?? 'scope.exam.label'), strong: (chunks) => <strong>{chunks}</strong> })}</>
                          )}
                        </Alert>
                      )}

                      {!cfg.loading && cfg.mode === SELECTION_MODES.MANUAL && maxInBank > 0 && (() => {
                        const groups = groupQuestionsByPassage(scopedQuestions);
                        return (
                          <>
                            <div className={cx('bankSelectAllRow')}>
                              <Form.Check
                                type="checkbox"
                                id={`select-all-${part.examPartId}`}
                                label={t('parts.selectAll', { count: maxInBank })}
                                checked={allSelected}
                                onChange={(e) => toggleSelectAll(part.examPartId, e.target.checked)}
                                aria-label={t('parts.selectAllAria', { part: part.name ?? '' })}
                              />
                            </div>
                            <div className={cx('bankGroupList')}>
                              {(() => {
                                let listOffset = 0;
                                return groups.map((gr) => {
                                const grSelected = isGroupSelected(part.examPartId, gr.groupKey);
                                const grLabel = gr.passageId != null
                                  ? t('parts.passageGroup', { count: gr.questions.length })
                                  : t('parts.standalone', { count: gr.questions.length });
                                const groupStartOffset = listOffset;
                                listOffset += gr.questions.length;
                                return (
                                  <div key={gr.groupKey} className={cx('bankPassageGroup', { selected: grSelected })}>
                                    <div className={cx('bankGroupHeader')}>
                                      <Form.Check
                                        type="checkbox"
                                        id={`gr-${part.examPartId}-${gr.groupKey}`}
                                        checked={grSelected}
                                        onChange={() => toggleGroup(part.examPartId, gr.groupKey)}
                                        aria-label={grLabel}
                                      />
                                      <span className={cx('bankGroupLabel')}>{grLabel}</span>
                                    </div>
                                    <ul className={cx('bankQuestionList')}>
                                      {gr.questions.map((q, index) => {
                                        const id = q.questionId ?? q.id;
                                        if (id == null) return null;
                                        const checked = (cfg.selectedIds || []).includes(id);
                                        const displayNo = getQuestionDisplayNumber(q, groupStartOffset + index);
                                        return (
                                          <li key={id} className={cx('bankQuestionItem', { selected: checked })}>
                                            <span className={cx('bankQuestionIndex')}>{displayNo}.</span>
                                            <span className={cx('bankQuestionText')}>{q.questionText || t('parts.noContent')}</span>
                                            {q.usageScope === QuestionUsageScope.PRACTICE && (
                                              <span className={cx('bankScopeBadge')} title={t('parts.practiceBadgeTitle')}>
                                                {t('parts.practiceBadge')}
                                              </span>
                                            )}
                                            {bankSource === BANK_SOURCES.PERSONAL && (
                                              <button
                                                type="button"
                                                className={cx('bankBtnEdit')}
                                                onClick={() => {
                                                  setEditingPartId(part.examPartId);
                                                  setEditingQuestionId(id);
                                                }}
                                                title={t('parts.editQuestion')}
                                              >
                                                <IoCreateOutline size={18} />
                                              </button>
                                            )}
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  </div>
                                );
                              });
                              })()}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })}

            <p className={cx('bankTotalCount')}>
              {t.rich('parts.total', { count: totalSelected, strong: (chunks) => <strong>{chunks}</strong> })}
            </p>
          </div>
        )}

        <div className={cx('footer')}>
          {onCancel && (
            <ButtonPrime type="button" variant="ghost" size="md" onClick={onCancel}>
              {t('submit.later')}
            </ButtonPrime>
          )}
          <ButtonPrime
            type="submit"
            variant="primary"
            size="md"
            disabled={createTestMutation.isPending || !hasAnyPartWithQuestions || !testInfo.examTypeId}
          >
            {createTestMutation.isPending ? <><Spinner animation="border" size="sm" /> {t('submit.creating')}</> : <><IoRocketOutline /> {t('submit.submit')}</>}
          </ButtonPrime>
        </div>
      </Form>

      <EditQuestionModal
        show={!!editingQuestionId}
        onHide={() => setEditingQuestionId(null)}
        questionId={editingQuestionId}
        onSuccess={handleEditQuestionSuccess}
      />
    </>
  );
};

export default CreateFromBankBody;
