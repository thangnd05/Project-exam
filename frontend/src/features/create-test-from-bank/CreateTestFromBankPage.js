import React, { useEffect, useState } from 'react';
import { Row, Col, Spinner, Alert, Form } from 'react-bootstrap';
import { createTest, addRandomQuestionsToPart, addQuestionsToPart } from '~/shared/api/testApi';
import { createTestPart } from '~/shared/api/testPartApi';
import CoinPriceField from '~/shared/test/CoinPriceField';
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
} from 'react-icons/io5';
import { useBaseMetaData } from '~/shared/hooks/useBaseMetaData';
import { getQuestionDisplayNumber } from '~/shared/utils/questionNumber';
import EditQuestionModal from '~/features/question-bank/modals/EditQuestionModal';
import ButtonPrime from '~/shared/ui/Button/ButtonPrime';
import { getExamCategories } from '~/shared/api/examCategoryApi';
import {
  useBankTestBuilder,
  SELECTION_MODES,
  defaultPartConfig,
  groupQuestionsByPassage,
} from '~/shared/hooks/useBankTestBuilder';
import styles from './CreateTestFromBankPage.module.scss';

const cx = classNames.bind(styles);

const CreateTestFromBankPage = () => {
  const [testInfo, setTestInfo] = useState({
    title: '',
    description: '',
    durationMinutes: '',
    maxAttempts: '',
    examTypeId: '',
    examCategoryId: '',
    bannerUrl: '',
    availableFrom: '',
    availableTo: '',
    costCoins: '',
  });

  const [examCategories, setExamCategories] = useState([]);
  useEffect(() => {
    getExamCategories()
      .then((list) => setExamCategories(Array.isArray(list) ? list : []))
      .catch(() => setExamCategories([]));
  }, []);

  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [notification, setNotification] = useState({});
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editingPartId, setEditingPartId] = useState(null);

  const { examTypes, examParts } = useBaseMetaData(testInfo.examTypeId);

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
  } = useBankTestBuilder();

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
      loadQuestionsForPart(part.examPartId);
    });
  }, [testInfo.examTypeId, examParts]);

  const handleEditQuestionSuccess = () => {
      setEditingQuestionId(null);
      if (editingPartId) {
          loadQuestionsForPart(editingPartId);
      }
  };

  const handleExamTypeChange = (value) => {
    setTestInfo((prev) => ({ ...prev, examTypeId: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!testInfo.title?.trim() || !testInfo.examTypeId) {
      setNotification({ type: 'warning', message: 'Vui lòng điền tiêu đề và chọn loại kỳ thi.' });
      return;
    }

    const partsToAdd = examParts.filter(hasPartWithQuestions);
    if (partsToAdd.length === 0) {
      setNotification({ type: 'warning', message: 'Vui lòng cấu hình ít nhất một part có câu hỏi (số câu > 0 hoặc chọn thủ công).' });
      return;
    }

    setLoadingSubmit(true);
    setNotification({});

    try {
      const testData = await createTest({
        title: testInfo.title.trim(),
        description: testInfo.description || null,
        examTypeId: testInfo.examTypeId,
        examCategoryId: testInfo.examCategoryId || null,
        durationMinutes: testInfo.durationMinutes && Number(testInfo.durationMinutes) > 0 ? Number(testInfo.durationMinutes) : null,
        maxAttempts: testInfo.maxAttempts && Number(testInfo.maxAttempts) > 0 ? Number(testInfo.maxAttempts) : null,
        bannerUrl: testInfo.bannerUrl || null,
        availableFrom: testInfo.availableFrom ? testInfo.availableFrom + ':00' : null,
        availableTo: testInfo.availableTo ? testInfo.availableTo + ':00' : null,
        classId: null,
        chapterId: null,
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

        if (cfg.mode === SELECTION_MODES.RANDOM || cfg.mode === SELECTION_MODES.SEQUENTIAL) {
          await addRandomQuestionsToPart({
            testPartId: String(newPartId),
            count: numQuestions,
            isSequential: cfg.mode === SELECTION_MODES.SEQUENTIAL,
            fromIndex: cfg.mode === SELECTION_MODES.SEQUENTIAL ? parseInt(cfg.fromIndex, 10) : undefined,
            toIndex: cfg.mode === SELECTION_MODES.SEQUENTIAL ? parseInt(cfg.toIndex, 10) : undefined,
          });
        } else {
          await addQuestionsToPart({
            testPartId: String(newPartId),
            questionIds: (cfg.selectedIds || []).map(String),
          });
        }
      }

      setTestInfo((prev) => ({ ...prev, title: '', description: '' }));
      toast.success('Đã tạo đề thi từ kho câu hỏi!');
    } catch (error) {
      const msg = error.response?.data?.message ?? error.response?.data ?? error.message;
      setNotification({ type: 'danger', message: 'Lỗi: ' + (typeof msg === 'string' ? msg : JSON.stringify(msg)) });
    } finally {
      setLoadingSubmit(false);
    }
  };

  const totalSelected = (examParts || []).reduce((sum, p) => sum + getPartEffectiveCount(p.examPartId), 0);
  const hasAnyPartWithQuestions = (examParts || []).some((p) => getPartEffectiveCount(p.examPartId) > 0);

  return (
    <div className={cx('wrapper')}>
      <div className={cx('container')}>
        <header className={cx('header')}>
          <h1 className={cx('title')}>
            <IoLibraryOutline /> Tạo đề thi từ kho câu hỏi
          </h1>
          <p className={cx('subtitle')}>
            Chọn loại kỳ thi, cấu hình từng part (random theo số lượng hoặc chọn thủ công), rồi tạo đề. Câu hỏi lấy theo kho cá nhân (tài khoản đang đăng nhập).
          </p>
        </header>

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
                <div className={cx('formGroup')}>
                  <label>Tiêu đề đề thi *</label>
                  <input
                    type="text"
                    className={cx('input')}
                    value={testInfo.title}
                    onChange={(e) => setTestInfo({ ...testInfo, title: e.target.value })}
                    placeholder="Nhập tiêu đề đề thi"
                    aria-label="Tiêu đề đề thi"
                  />
                </div>
              </Col>
              <Col md={4}>
                <div className={cx('formGroup')}>
                  <label><IoTimeOutline /> Thời gian (phút)</label>
                  <input
                    type="number"
                    min={0}
                    className={cx('input')}
                    value={testInfo.durationMinutes}
                    onChange={(e) => setTestInfo({ ...testInfo, durationMinutes: e.target.value })}
                    placeholder="VD: 60"
                    aria-label="Thời gian làm bài"
                  />
                </div>
              </Col>
              <Col md={4}>
                <div className={cx('formGroup')}>
                  <label>Loại kỳ thi *</label>
                  <select
                    className={cx('input')}
                    value={testInfo.examTypeId}
                    onChange={(e) => handleExamTypeChange(e.target.value)}
                    aria-label="Loại kỳ thi"
                  >
                    <option value="">-- Chọn --</option>
                    {(examTypes || []).map((t) => (
                      <option key={t.examTypeId} value={t.examTypeId}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </Col>
              <Col md={4}>
                <div className={cx('formGroup')}>
                  <label><IoRocketOutline /> Số lượt làm tối đa</label>
                  <input
                    type="number"
                    min={0}
                    className={cx('input')}
                    value={testInfo.maxAttempts}
                    onChange={(e) => setTestInfo({ ...testInfo, maxAttempts: e.target.value })}
                    placeholder="Để trống = không giới hạn"
                    aria-label="Số lượt làm"
                  />
                </div>
              </Col>
              <CoinPriceField
                value={testInfo.costCoins}
                onChange={(v) => setTestInfo({ ...testInfo, costCoins: v })}
                groupClassName={cx('formGroup')}
                inputClassName={cx('input')}
              />
              <Col md={4}>
                <div className={cx('formGroup')}>
                  <label>Phân loại bài thi (tuỳ chọn)</label>
                  <select
                    className={cx('input')}
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
                <div className={cx('formGroup')}>
                  <label>Mô tả</label>
                  <textarea
                    className={cx('input')}
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

          {testInfo.examTypeId && (examParts || []).length > 0 && (
            <div className={cx('configCard')}>
              <div className={cx('sectionTitle')}>
                <IoLibraryOutline /> 2. Cấu hình từng Part
              </div>
              <p className={cx('hint')}>
                Mỗi part: <strong>Random theo số lượng</strong> (BE lấy ngẫu nhiên từ kho cá nhân) hoặc <strong>Chọn thủ công</strong>. Với part có passage (vd. Part 3, 4, 6, 7): chọn theo <strong>nhóm (cùng passage)</strong> để giữ tính tương đồng, không chọn lẻ từng câu.
              </p>

              {(examParts || []).map((part) => {
                const cfg = partConfigs[part.examPartId] ?? defaultPartConfig();
                const count = getPartEffectiveCount(part.examPartId);
                const maxInBank = (cfg.bankQuestions || []).length;
                const allSelected = maxInBank > 0 && (cfg.selectedIds || []).length === maxInBank;

                return (
                  <div key={part.examPartId} className={cx('partCard')}>
                    <button
                      type="button"
                      className={cx('partCardHeader')}
                      onClick={() => togglePartExpanded(part.examPartId)}
                      aria-expanded={cfg.expanded}
                    >
                      <span className={cx('partName')}>
                        <IoBookOutline size={20} /> {part.name}
                      </span>
                      <span className={cx('partBadge')}>{count} câu</span>
                      {cfg.expanded ? <IoChevronUpOutline size={22} /> : <IoChevronDownOutline size={22} />}
                    </button>

                    {cfg.expanded && (
                      <div className={cx('partCardBody')}>
                        <div className={cx('modeTabs')}>
                          <button
                            type="button"
                            className={cx('modeTab', { active: cfg.mode === SELECTION_MODES.RANDOM })}
                            onClick={() => updatePartConfig(part.examPartId, 'mode', SELECTION_MODES.RANDOM)}
                            aria-pressed={cfg.mode === SELECTION_MODES.RANDOM}
                          >
                            <IoShuffleOutline size={18} /> Random theo số lượng
                          </button>
                          <button
                            type="button"
                            className={cx('modeTab', { active: cfg.mode === SELECTION_MODES.SEQUENTIAL })}
                            onClick={() => updatePartConfig(part.examPartId, 'mode', SELECTION_MODES.SEQUENTIAL)}
                            aria-pressed={cfg.mode === SELECTION_MODES.SEQUENTIAL}
                          >
                            <IoRocketOutline size={18} /> Lấy tuần tự
                          </button>
                          <button
                            type="button"
                            className={cx('modeTab', { active: cfg.mode === SELECTION_MODES.MANUAL })}
                            onClick={() => updatePartConfig(part.examPartId, 'mode', SELECTION_MODES.MANUAL)}
                            aria-pressed={cfg.mode === SELECTION_MODES.MANUAL}
                          >
                            <IoCheckboxOutline size={18} /> Chọn thủ công
                          </button>
                        </div>

                        {cfg.mode === SELECTION_MODES.RANDOM && (
                          <div className={cx('randomRow')}>
                            <label className={cx('randomLabel')}>Số câu lấy ngẫu nhiên:</label>
                            <input
                              type="number"
                              min={0}
                              max={Math.max(maxInBank, 0)}
                              className={cx('input', 'randomInput')}
                              value={cfg.randomCount}
                              onChange={(e) => updatePartConfig(part.examPartId, 'randomCount', e.target.value)}
                              aria-label={`Số câu random ${part.name}`}
                            />
                            <span className={cx('randomHint')}>Tối đa {maxInBank} câu trong kho</span>
                          </div>
                        )}

                        {cfg.mode === SELECTION_MODES.SEQUENTIAL && (
                          <div className={cx('randomRow')} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <label className={cx('randomLabel')}>Từ câu:</label>
                            <input
                              type="number"
                              min={1}
                              max={Math.max(maxInBank, 1)}
                              className={cx('input', 'randomInput')}
                              value={cfg.fromIndex}
                              onChange={(e) => updatePartConfig(part.examPartId, 'fromIndex', e.target.value)}
                              aria-label={`Từ câu ${part.name}`}
                            />
                            <label className={cx('randomLabel')}>Đến câu:</label>
                            <input
                              type="number"
                              min={1}
                              max={Math.max(maxInBank, 1)}
                              className={cx('input', 'randomInput')}
                              value={cfg.toIndex}
                              onChange={(e) => updatePartConfig(part.examPartId, 'toIndex', e.target.value)}
                              aria-label={`Đến câu ${part.name}`}
                            />
                            <span className={cx('randomHint')}>Tối đa {maxInBank} câu trong kho</span>
                          </div>
                        )}

                        {cfg.loading && (
                          <div className={cx('loadingWrap')}>
                            <Spinner animation="border" size="sm" /> <span>Đang tải câu hỏi...</span>
                          </div>
                        )}

                        {!cfg.loading && maxInBank === 0 && (
                          <Alert variant="info" className="mb-0 mt-2">Chưa có câu hỏi trong kho (cá nhân) cho part này.</Alert>
                        )}

                        {!cfg.loading && cfg.mode === SELECTION_MODES.MANUAL && maxInBank > 0 && (() => {
                          const groups = groupQuestionsByPassage(cfg.bankQuestions);
                          return (
                            <>
                              <div className={cx('selectAllRow')}>
                                <Form.Check
                                  type="checkbox"
                                  id={`select-all-${part.examPartId}`}
                                  label={`Chọn tất cả (${maxInBank} câu)`}
                                  checked={allSelected}
                                  onChange={(e) => toggleSelectAll(part.examPartId, e.target.checked)}
                                  aria-label={`Chọn tất cả ${part.name}`}
                                />
                              </div>
                              <div className={cx('groupList')}>
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
                                    <div key={gr.groupKey} className={cx('passageGroup', { selected: grSelected })}>
                                      <div className={cx('groupHeader')}>
                                        <Form.Check
                                          type="checkbox"
                                          id={`gr-${part.examPartId}-${gr.groupKey}`}
                                          checked={grSelected}
                                          onChange={() => toggleGroup(part.examPartId, gr.groupKey)}
                                          aria-label={grLabel}
                                        />
                                        <span className={cx('groupLabel')}>{grLabel}</span>
                                      </div>
                                      <ul className={cx('questionList')}>
                                        {gr.questions.map((q, index) => {
                                          const id = q.questionId ?? q.id;
                                          if (id == null) return null;
                                          const checked = (cfg.selectedIds || []).includes(id);
                                          const displayNo = getQuestionDisplayNumber(q, groupStartOffset + index);
                                          return (
                                            <li key={id} className={cx('questionItem', { selected: checked })}>
                                              <span className={cx('questionIndex')}>{displayNo}.</span>
                                              <span className={cx('questionText')}>{q.questionText || '(Không có nội dung)'}</span>
                                              <button
                                                type="button"
                                                className={cx('btnEditQuestion')}
                                                onClick={() => {
                                                    setEditingPartId(part.examPartId);
                                                    setEditingQuestionId(id);
                                                }}
                                                title="Sửa câu hỏi này"
                                              >
                                                  <IoCreateOutline size={18} />
                                              </button>
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

              <p className={cx('totalCount')}>
                Tổng số câu sẽ đưa vào đề: <strong>{totalSelected}</strong>
              </p>
            </div>
          )}

          <div className={cx('footer')}>
            <ButtonPrime
              type="submit"
              variant="primary"
              size="md"
              disabled={loadingSubmit || !hasAnyPartWithQuestions || !testInfo.examTypeId}
            >
              {loadingSubmit ? <><Spinner animation="border" size="sm" /> Đang tạo đề...</> : <><IoRocketOutline /> Tạo đề thi từ kho</>}
            </ButtonPrime>
          </div>
        </Form>
      </div>

      <EditQuestionModal
        show={!!editingQuestionId}
        onHide={() => setEditingQuestionId(null)}
        questionId={editingQuestionId}
        onSuccess={handleEditQuestionSuccess}
      />
    </div>
  );
};

export default CreateTestFromBankPage;
