import { useEffect, useState } from 'react';
import { fromDateTimeLocalInput } from '~/shared/utils/format-date-time';
import { useMutation } from '@tanstack/react-query';
import { Row, Col, Spinner, Alert, Form } from 'react-bootstrap';
import { getChaptersByClass } from '~/shared/api/chapterApi';
import { createTest, addRandomQuestionsToPart, addQuestionsToPart } from '~/shared/api/testApi';
import { createTestPart } from '~/shared/api/testPartApi';
import { buildCollectionTree, getCollectionWithDescendantIds } from '~/shared/utils/collectionTree';
import classNames from 'classnames/bind';
import { toast } from 'react-toastify';
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
} from 'react-icons/io5';
import { useBaseMetaData } from '~/shared/hooks/useBaseMetaData';
import { useHasPermission } from '~/shared/hooks/usePermission';
import { brandColors } from '~/shared/styles/brandColors';
import CoinPriceField from '~/features/tests/components/CoinPriceField';
import { getQuestionDisplayNumber } from '~/shared/utils/questionNumber';
import EditQuestionModal from '~/features/tests/question-bank/modals/EditQuestionModal';
import ButtonPrime from '~/shared/ui/Button/ButtonPrime';
import { getExamCategories } from '~/shared/api/examCategoryApi';
import {
  useBankTestBuilder,
  SELECTION_MODES,
  defaultPartConfig,
  groupQuestionsByPassage,
} from '~/features/tests/hooks/useBankTestBuilder';
import styles from '../CreateTestModal.module.scss';

const cx = classNames.bind(styles);

const COLLECTION_SCOPED_MODES = [
  SELECTION_MODES.RANDOM_BY_COLLECTION,
  SELECTION_MODES.SEQUENTIAL,
  SELECTION_MODES.MANUAL,
];

const BANK_SOURCES = {
  PERSONAL: 'personal',
  ADMIN: 'admin',
  CLASS: 'class',
};

const ALL_CHAPTERS = '__ALL__';

const CreateFromBankBody = ({ onCancel, onSuccess, mode = 'personal', classId, chapterId }) => {
  const isClassMode = mode === 'class' && !!classId;

  const canAccessAdminBank = useHasPermission('QUESTION:MANAGE');

  const [testInfo, setTestInfo] = useState({
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

  const [examCategories, setExamCategories] = useState([]);

  const [notification, setNotification] = useState({});
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editingPartId, setEditingPartId] = useState(null);
  const [bankSource, setBankSource] = useState(isClassMode ? BANK_SOURCES.CLASS : BANK_SOURCES.PERSONAL);
  const [chapters, setChapters] = useState([]);
  const [selectedChapterId, setSelectedChapterId] = useState(chapterId || ALL_CHAPTERS);

  const { examTypes, examParts, questionCollections } = useBaseMetaData(testInfo.examTypeId);
  const collectionScopeIds = testInfo.collectionId
    ? getCollectionWithDescendantIds(questionCollections, testInfo.collectionId).map(String)
    : null;

  const getScopedQuestions = (cfg) => {
    const list = cfg?.bankQuestions || [];
    if (!collectionScopeIds || !COLLECTION_SCOPED_MODES.includes(cfg?.mode)) return list;
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

  const buildLoadParams = (source = bankSource, chapterFilter = selectedChapterId) => {
    if (source === BANK_SOURCES.ADMIN) return { bank: 'admin' };
    if (source === BANK_SOURCES.CLASS && classId) {
      const params = { classId };
      if (chapterFilter && chapterFilter !== ALL_CHAPTERS) params.chapterId = chapterFilter;
      return params;
    }
    return {};
  };

  useEffect(() => {
    getExamCategories()
      .then((list) => setExamCategories(Array.isArray(list) ? list : []))
      .catch(() => setExamCategories([]));
  }, []);

  useEffect(() => {
    if (!isClassMode) return;
    getChaptersByClass(classId)
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setChapters(list);
      })
      .catch((err) => {
        console.error('Lỗi tải chapter:', err);
        setChapters([]);
      });
  }, [isClassMode, classId]);

  useEffect(() => {
    if (!testInfo.examTypeId || !examParts?.length) {
      setPartConfigs({});
      return;
    }
    const initial = {};
    examParts.forEach((p) => {
      initial[p.examPartId] = { ...defaultPartConfig(), expanded: false, loading: true };
    });
    setPartConfigs(initial);
    examParts.forEach((part) => {
      loadQuestionsForPart(part.examPartId, buildLoadParams(bankSource, selectedChapterId));
    });

  }, [testInfo.examTypeId, examParts, bankSource, selectedChapterId]);

  const handleEditQuestionSuccess = () => {
    setEditingQuestionId(null);
    if (editingPartId) {
      loadQuestionsForPart(editingPartId, buildLoadParams(bankSource, selectedChapterId));
    }
  };

  const handleExamTypeChange = (value) => {
    setTestInfo((prev) => ({ ...prev, examTypeId: value }));
  };

  const applyModeToAllParts = (modeValue) => {
    setPartConfigs((prev) => {
      const next = { ...prev };
      (examParts || []).forEach((p) => {
        next[p.examPartId] = { ...(next[p.examPartId] || defaultPartConfig()), mode: modeValue };
      });
      return next;
    });
  };

  const createTestMutation = useMutation({
    mutationFn: async (partsToAdd) => {
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
      });

      const newTestId = testData.testId ?? testData.id;
      if (!newTestId) throw new Error('Không nhận được testId từ server.');

      for (const part of partsToAdd) {
        const cfg = partConfigs[part.examPartId];
        const numQuestions = getPartEffectiveCount(part.examPartId);
        if (numQuestions <= 0) continue;

        const partData = await createTestPart({
          testId: String(newTestId),
          examPartId: String(part.examPartId),
          numQuestions,
        });
        const newPartId = partData.testPartId ?? partData.id;
        if (!newPartId) throw new Error(`Không nhận được testPartId cho part ${part.name}.`);

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
          });
        }
      }
    },
    onSuccess: () => {
      setTestInfo((prev) => ({ ...prev, title: '', description: '' }));
      toast.success('Đã tạo đề thi từ kho câu hỏi!');
      onSuccess?.();
    },
    onError: (error) => {
      const msg = error.response?.data?.message ?? error.response?.data ?? error.message;
      setNotification({ type: 'danger', message: 'Lỗi: ' + (typeof msg === 'string' ? msg : JSON.stringify(msg)) });
    },
  });

  const handleSubmit = (e) => {
    if (e?.preventDefault) e.preventDefault();

    if (!testInfo.title?.trim() || !testInfo.examTypeId) {
      setNotification({ type: 'warning', message: 'Vui lòng điền tiêu đề và chọn loại kỳ thi.' });
      return;
    }

    const partsToAdd = examParts.filter(hasPartWithQuestions);
    if (partsToAdd.length === 0) {
      setNotification({ type: 'warning', message: 'Vui lòng cấu hình ít nhất một part có câu hỏi (số câu > 0 hoặc chọn thủ công).' });
      return;
    }

    setNotification({});
    createTestMutation.mutate(partsToAdd);
  };

  const totalSelected = (examParts || []).reduce((sum, p) => sum + getPartEffectiveCount(p.examPartId), 0);
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
            <IoSettingsOutline /> 1. Thông tin đề thi
          </div>
          <Row className="g-3">
            <Col md={8}>
              <div className={cx('formGroupModern')}>
                <label>Tiêu đề đề thi *</label>
                <input
                  type="text"
                  className={cx('inputModern')}
                  value={testInfo.title}
                  onChange={(e) => setTestInfo({ ...testInfo, title: e.target.value })}
                  placeholder="Nhập tiêu đề đề thi"
                  aria-label="Tiêu đề đề thi"
                />
              </div>
            </Col>
            <Col md={4}>
              <div className={cx('formGroupModern')}>
                <label><IoTimeOutline /> Thời gian (phút)</label>
                <input
                  type="number"
                  min={0}
                  className={cx('inputModern')}
                  value={testInfo.durationMinutes}
                  onChange={(e) => setTestInfo({ ...testInfo, durationMinutes: e.target.value })}
                  placeholder="VD: 60"
                  aria-label="Thời gian làm bài"
                />
              </div>
            </Col>
            <Col md={4}>
              <div className={cx('formGroupModern')}>
                <label>Loại kỳ thi *</label>
                <select
                  className={cx('inputModern')}
                  value={testInfo.examTypeId}
                  onChange={(e) => handleExamTypeChange(e.target.value)}
                  aria-label="Loại kỳ thi"
                >
                  <option value="">-- Chọn --</option>

                  {(examTypes || []).filter((t) => !t.childCount).map((t) => (
                    <option key={t.examTypeId} value={t.examTypeId}>{t.name}</option>
                  ))}
                </select>
              </div>
            </Col>
            <Col md={4}>
              <div className={cx('formGroupModern')}>
                <label><IoLibraryOutline /> Bộ đề (Collection)</label>
                <select
                  className={cx('inputModern')}
                  value={testInfo.collectionId || ''}
                  onChange={(e) => setTestInfo({ ...testInfo, collectionId: e.target.value })}
                  aria-label="Bộ đề"
                >
                  <option value="">-- Trống --</option>
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
                <label><IoRocketOutline /> Số lượt làm tối đa</label>
                <input
                  type="number"
                  min={0}
                  className={cx('inputModern')}
                  value={testInfo.maxAttempts}
                  onChange={(e) => setTestInfo({ ...testInfo, maxAttempts: e.target.value })}
                  placeholder="Để trống = không giới hạn"
                  aria-label="Số lượt làm"
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
            <Col md={12}>
              <div className={cx('formGroupModern')}>
                <label>Mô tả</label>
                <textarea
                  className={cx('inputModern')}
                  rows={2}
                  value={testInfo.description}
                  onChange={(e) => setTestInfo({ ...testInfo, description: e.target.value })}
                  placeholder="Mô tả ngắn (tùy chọn)"
                  aria-label="Mô tả đề thi"
                />
              </div>
            </Col>
          </Row>
        </div>

        <div className={cx('configCard')}>
          <div className={cx('sectionTitle')}>
            <IoServerOutline /> 2. Chọn nguồn kho câu hỏi
          </div>
          <p className={cx('bankHint')}>
            Chọn kho lấy câu hỏi để tạo đề. <strong>Kho cá nhân</strong> chứa các câu hỏi do chính bạn lưu.
            {isClassMode && (
              <> <strong>Kho lớp học</strong> là kho câu hỏi của lớp hiện tại — có thể lọc theo chapter.</>
            )}
            {canAccessAdminBank && (
              <> <strong>Kho quản trị</strong> là kho do admin cung cấp, dùng làm nguồn tạo đề.</>
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
              <IoLibraryOutline size={18} /> Kho cá nhân
            </button>
            {isClassMode && (
              <button
                type="button"
                className={cx('bankModeTab', { active: bankSource === BANK_SOURCES.CLASS })}
                onClick={() => setBankSource(BANK_SOURCES.CLASS)}
                aria-pressed={bankSource === BANK_SOURCES.CLASS}
              >
                <IoSchoolOutline size={18} /> Kho lớp học
              </button>
            )}
            {canAccessAdminBank && (
              <button
                type="button"
                className={cx('bankModeTab', { active: bankSource === BANK_SOURCES.ADMIN })}
                onClick={() => setBankSource(BANK_SOURCES.ADMIN)}
                aria-pressed={bankSource === BANK_SOURCES.ADMIN}
              >
                <IoServerOutline size={18} /> Kho quản trị
              </button>
            )}
          </div>

          {isClassMode && bankSource === BANK_SOURCES.CLASS && (
            <div className={cx('formGroupModern')} style={{ marginTop: 14, maxWidth: 480 }}>
              <label><IoBookOutline /> Lọc theo chapter</label>
              <select
                className={cx('inputModern')}
                value={selectedChapterId}
                onChange={(e) => setSelectedChapterId(e.target.value)}
                aria-label="Chọn chapter trong lớp"
              >
                <option value={ALL_CHAPTERS}>Tất cả chapter của lớp</option>
                {chapters.map((c) => (
                  <option key={c.chapterId} value={c.chapterId}>
                    {c.title || `Chapter ${c.chapterId}`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {testInfo.examTypeId && (examParts || []).length > 0 && (
          <div className={cx('configCard')}>
            <div className={cx('sectionTitle')}>
              <IoLibraryOutline /> 3. Cấu hình từng Part
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
                  ? 'Kho quản trị'
                  : bankSource === BANK_SOURCES.CLASS
                    ? `Kho lớp học${selectedChapterId && selectedChapterId !== ALL_CHAPTERS
                      ? ` · ${chapters.find((c) => c.chapterId === selectedChapterId)?.title || 'Chapter'}`
                      : ' · Tất cả chapter'}`
                    : 'Kho cá nhân'}
              </span>
            </div>
            <p className={cx('bankHint')}>
              Mỗi part: <strong>Random theo số lượng</strong> (lấy ngẫu nhiên toàn kho), <strong>Random theo bộ đề</strong>,{' '}
              <strong>Lấy tuần tự</strong> hoặc <strong>Chọn thủ công</strong>.
              {testInfo.collectionId
                ? ' Đã chọn Bộ đề → Random theo bộ đề / Tuần tự / Thủ công chỉ lấy câu trong bộ đề đó.'
                : ' Chọn Bộ đề ở mục 1 để giới hạn nguồn câu theo bộ đề.'}
              {' '}Với part có passage (vd. Part 3, 4, 6, 7): chọn theo <strong>nhóm (cùng passage)</strong> để giữ tính tương đồng, không chọn lẻ từng câu.
            </p>

            <div className={cx('bankModeTabs')}>
              <button
                type="button"
                className={cx('bankModeTab', 'active')}
                onClick={() => applyModeToAllParts(SELECTION_MODES.RANDOM_BY_COLLECTION)}
                title={testInfo.collectionId
                  ? 'Lấy toàn bộ câu trong bộ đề cho tất cả Part'
                  : 'Chưa chọn Bộ đề → sẽ lấy toàn bộ kho cho tất cả Part'}
              >
                <IoLibraryOutline size={18} /> Random theo bộ đề · tất cả Part
              </button>
              <button
                type="button"
                className={cx('bankModeTab')}
                onClick={() => applyModeToAllParts(SELECTION_MODES.RANDOM)}
                title="Đặt tất cả Part về Random theo số lượng"
              >
                <IoShuffleOutline size={18} /> Random số lượng · tất cả Part
              </button>
            </div>

            {(examParts || []).map((part) => {
              const cfg = partConfigs[part.examPartId] ?? defaultPartConfig();
              const totalInBank = (cfg.bankQuestions || []).length;
              const scopedQuestions = getScopedQuestions(cfg);

              const maxInBank = scopedQuestions.length;

              const collectionScoped = !!collectionScopeIds && COLLECTION_SCOPED_MODES.includes(cfg.mode);
              const scopeLabel = collectionScoped ? 'bộ đề' : 'kho';
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
                    <span className={cx('bankPartBadge')}>{totalInBank} câu</span>
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
                          <IoShuffleOutline size={18} /> Random theo số lượng
                        </button>
                        <button
                          type="button"
                          className={cx('bankModeTab', { active: cfg.mode === SELECTION_MODES.RANDOM_BY_COLLECTION })}
                          onClick={() => updatePartConfig(part.examPartId, 'mode', SELECTION_MODES.RANDOM_BY_COLLECTION)}
                          aria-pressed={cfg.mode === SELECTION_MODES.RANDOM_BY_COLLECTION}
                          title={testInfo.collectionId ? undefined : 'Chưa chọn Bộ đề ở mục 1 → sẽ lấy toàn kho'}
                        >
                          <IoLibraryOutline size={18} /> Random theo bộ đề
                        </button>
                        <button
                          type="button"
                          className={cx('bankModeTab', { active: cfg.mode === SELECTION_MODES.SEQUENTIAL })}
                          onClick={() => updatePartConfig(part.examPartId, 'mode', SELECTION_MODES.SEQUENTIAL)}
                          aria-pressed={cfg.mode === SELECTION_MODES.SEQUENTIAL}
                        >
                          <IoRocketOutline size={18} /> Lấy tuần tự
                        </button>
                        <button
                          type="button"
                          className={cx('bankModeTab', { active: cfg.mode === SELECTION_MODES.MANUAL })}
                          onClick={() => updatePartConfig(part.examPartId, 'mode', SELECTION_MODES.MANUAL)}
                          aria-pressed={cfg.mode === SELECTION_MODES.MANUAL}
                        >
                          <IoCheckboxOutline size={18} /> Chọn thủ công
                        </button>
                      </div>

                      {cfg.mode === SELECTION_MODES.RANDOM && (
                        <div className={cx('bankRandomRow')}>
                          <label className={cx('bankRandomLabel')}>Số câu lấy ngẫu nhiên:</label>
                          <input
                            type="number"
                            min={0}
                            max={Math.max(maxInBank, 0)}
                            className={cx('inputModern', 'bankRandomInput')}
                            value={cfg.randomCount}
                            onChange={(e) => updatePartConfig(part.examPartId, 'randomCount', e.target.value)}
                            aria-label={`Số câu random ${part.name}`}
                          />
                          <span className={cx('bankRandomHint')}>Tối đa {maxInBank} câu trong {scopeLabel}</span>
                        </div>
                      )}

                      {cfg.mode === SELECTION_MODES.RANDOM_BY_COLLECTION && (
                        <div className={cx('bankRandomRow')}>
                          <span className={cx('bankRandomHint')}>
                            {testInfo.collectionId
                              ? `Lấy toàn bộ ${maxInBank} câu trong bộ đề (xáo trộn thứ tự, giữ trọn cụm passage).`
                              : `Chưa chọn Bộ đề ở mục 1 → sẽ lấy toàn bộ ${maxInBank} câu trong kho.`}
                          </span>
                        </div>
                      )}

                      {cfg.mode === SELECTION_MODES.SEQUENTIAL && (
                        <div className={cx('bankRandomRow')} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                          <label className={cx('bankRandomLabel')}>Từ câu:</label>
                          <input
                            type="number"
                            min={1}
                            max={Math.max(maxInBank, 1)}
                            className={cx('inputModern', 'bankRandomInput')}
                            value={cfg.fromIndex}
                            onChange={(e) => updatePartConfig(part.examPartId, 'fromIndex', e.target.value)}
                            aria-label={`Từ câu ${part.name}`}
                          />
                          <label className={cx('bankRandomLabel')}>Đến câu:</label>
                          <input
                            type="number"
                            min={1}
                            max={Math.max(maxInBank, 1)}
                            className={cx('inputModern', 'bankRandomInput')}
                            value={cfg.toIndex}
                            onChange={(e) => updatePartConfig(part.examPartId, 'toIndex', e.target.value)}
                            aria-label={`Đến câu ${part.name}`}
                          />
                          <span className={cx('bankRandomHint')}>Tối đa {maxInBank} câu trong {scopeLabel}</span>
                        </div>
                      )}

                      {cfg.loading && (
                        <div className={cx('bankLoadingWrap')}>
                          <Spinner animation="border" size="sm" /> <span>Đang tải câu hỏi...</span>
                        </div>
                      )}

                      {!cfg.loading && maxInBank === 0 && (
                        <Alert variant="info" className="mb-0 mt-2">
                          {collectionScoped
                            ? 'Bộ đề đã chọn chưa có câu hỏi cho part này.'
                            : bankSource === BANK_SOURCES.ADMIN
                              ? 'Kho quản trị chưa có câu hỏi cho part này.'
                              : bankSource === BANK_SOURCES.CLASS
                                ? (selectedChapterId && selectedChapterId !== ALL_CHAPTERS
                                    ? 'Kho lớp học (chapter đã chọn) chưa có câu hỏi cho part này.'
                                    : 'Kho lớp học chưa có câu hỏi cho part này.')
                                : 'Chưa có câu hỏi trong kho cá nhân cho part này.'}
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
                                label={`Chọn tất cả (${maxInBank} câu)`}
                                checked={allSelected}
                                onChange={(e) => toggleSelectAll(part.examPartId, e.target.checked)}
                                aria-label={`Chọn tất cả ${part.name}`}
                              />
                            </div>
                            <div className={cx('bankGroupList')}>
                              {(() => {
                                let listOffset = 0;
                                return groups.map((gr) => {
                                const grSelected = isGroupSelected(part.examPartId, gr.groupKey);
                                const grLabel = gr.passageId != null
                                  ? `Nhóm passage (${gr.questions.length} câu)`
                                  : `Câu độc lập (${gr.questions.length} câu)`;
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
                                            <span className={cx('bankQuestionText')}>{q.questionText || '(Không có nội dung)'}</span>
                                            {bankSource === BANK_SOURCES.PERSONAL && (
                                              <button
                                                type="button"
                                                className={cx('bankBtnEdit')}
                                                onClick={() => {
                                                  setEditingPartId(part.examPartId);
                                                  setEditingQuestionId(id);
                                                }}
                                                title="Sửa câu hỏi này"
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
              Tổng số câu sẽ đưa vào đề: <strong>{totalSelected}</strong>
            </p>
          </div>
        )}

        <div className={cx('footer')}>
          {onCancel && (
            <ButtonPrime type="button" variant="ghost" size="md" onClick={onCancel}>
              Để sau
            </ButtonPrime>
          )}
          <ButtonPrime
            type="submit"
            variant="primary"
            size="md"
            disabled={createTestMutation.isPending || !hasAnyPartWithQuestions || !testInfo.examTypeId}
          >
            {createTestMutation.isPending ? <><Spinner animation="border" size="sm" /> Đang tạo đề...</> : <><IoRocketOutline /> Tạo đề thi từ kho</>}
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
