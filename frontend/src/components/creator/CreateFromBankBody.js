/**
 * Tạo đề thi từ kho câu hỏi — phiên bản nhúng trong modal/tab.
 * Logic hiển thị giống hệt CreateTestFromBankPage.js,
 * SCSS dùng chung CreateTestModal.module.scss.
 */
import React, { useEffect, useState } from 'react';
import { Row, Col, Spinner, Alert, Form } from 'react-bootstrap';
import axios from '../../api/axiosClient';
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
import { useBaseMetaData } from '~/hook/useBaseMetaData';
import EditQuestionModal from '~/components/modals/EditQuestionModal';
import styles from '../modals/CreateTestModal.module.scss';

const cx = classNames.bind(styles);

const SELECTION_MODES = {
  MANUAL: 'manual',
  RANDOM: 'random',
  SEQUENTIAL: 'sequential',
};

const defaultPartConfig = () => ({
  mode: SELECTION_MODES.RANDOM,
  randomCount: '',
  fromIndex: '',
  toIndex: '',
  selectedIds: [],
  bankQuestions: [],
  loading: false,
  expanded: true,
});

const CreateFromBankBody = ({ onCancel, onSuccess }) => {
  const [testInfo, setTestInfo] = useState({
    title: '',
    description: '',
    durationMinutes: '',
    maxAttempts: '',
    examTypeId: '',
    bannerUrl: '',
    availableFrom: '',
    availableTo: '',
  });

  const [partConfigs, setPartConfigs] = useState({});
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [notification, setNotification] = useState({});
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editingPartId, setEditingPartId] = useState(null);

  const { examTypes, examParts } = useBaseMetaData(testInfo.examTypeId);

  /* ---------- load câu hỏi theo part ---------- */
  const loadQuestionsForPart = (examPartId) => {
    setPartConfigs((prev) => ({
      ...prev,
      [examPartId]: { ...prev[examPartId], loading: true },
    }));
    axios
      .get(`/api/questions/by-part/${examPartId}`)
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data?.data ?? res.data?.questions ?? [];
        setPartConfigs((prev) => ({
          ...prev,
          [examPartId]: { ...prev[examPartId], bankQuestions: list, loading: false },
        }));
      })
      .catch((err) => {
        console.error(err);
        setPartConfigs((prev) => ({
          ...prev,
          [examPartId]: { ...prev[examPartId], bankQuestions: [], loading: false },
        }));
      });
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const updatePartConfig = (examPartId, field, value) => {
    setPartConfigs((prev) => ({
      ...prev,
      [examPartId]: { ...prev[examPartId], [field]: value },
    }));
  };

  const togglePartExpanded = (examPartId) => {
    setPartConfigs((prev) => ({
      ...prev,
      [examPartId]: { ...prev[examPartId], expanded: !prev[examPartId].expanded },
    }));
  };

  /* ---------- nhóm câu theo passage ---------- */
  const groupQuestionsByPassage = (questions) => {
    if (!questions?.length) return [];
    const map = new Map();
    questions.forEach((q) => {
      const id = q.questionId ?? q.id;
      const passageId = q.passageId ?? q.passage?.passageId ?? null;
      const groupKey = passageId != null ? `passage-${passageId}` : `no-passage-${id}`;
      if (!map.has(groupKey)) {
        map.set(groupKey, { groupKey, passageId, questions: [] });
      }
      map.get(groupKey).questions.push(q);
    });
    return Array.from(map.values());
  };

  const toggleGroup = (examPartId, groupKey) => {
    const cfg = partConfigs[examPartId];
    if (!cfg) return;
    const groups = groupQuestionsByPassage(cfg.bankQuestions);
    const group = groups.find((g) => g.groupKey === groupKey);
    if (!group) return;
    const ids = group.questions.map((q) => q.questionId ?? q.id).filter(Boolean);
    const selectedSet = new Set(cfg.selectedIds || []);
    const allSelected = ids.every((id) => selectedSet.has(id));
    if (allSelected) ids.forEach((id) => selectedSet.delete(id));
    else ids.forEach((id) => selectedSet.add(id));
    updatePartConfig(examPartId, 'selectedIds', Array.from(selectedSet));
  };

  const isGroupSelected = (examPartId, groupKey) => {
    const cfg = partConfigs[examPartId];
    if (!cfg) return false;
    const groups = groupQuestionsByPassage(cfg.bankQuestions);
    const group = groups.find((g) => g.groupKey === groupKey);
    if (!group) return false;
    const ids = group.questions.map((q) => q.questionId ?? q.id).filter(Boolean);
    const selectedSet = new Set(cfg.selectedIds || []);
    return ids.length > 0 && ids.every((id) => selectedSet.has(id));
  };

  const toggleSelectAll = (examPartId, checked) => {
    const cfg = partConfigs[examPartId];
    if (!cfg) return;
    const ids = (cfg.bankQuestions || []).map((q) => q.questionId ?? q.id).filter(Boolean);
    updatePartConfig(examPartId, 'selectedIds', checked ? ids : []);
  };

  const getPartEffectiveCount = (examPartId) => {
    const cfg = partConfigs[examPartId];
    if (!cfg) return 0;
    if (cfg.mode === SELECTION_MODES.RANDOM) {
      const n = Math.max(0, parseInt(cfg.randomCount, 10) || 0);
      return Math.min(n, (cfg.bankQuestions || []).length);
    }
    if (cfg.mode === SELECTION_MODES.SEQUENTIAL) {
      const from = Math.max(1, parseInt(cfg.fromIndex, 10) || 1);
      const to = Math.max(from, parseInt(cfg.toIndex, 10) || from);
      const maxInBank = (cfg.bankQuestions || []).length;
      if (from > maxInBank) return 0;
      const actualTo = Math.min(to, maxInBank);
      return actualTo - from + 1;
    }
    return (cfg.selectedIds || []).length;
  };

  const hasPartWithQuestions = (part) => {
    const cfg = partConfigs[part.examPartId];
    if (!cfg) return false;
    if (cfg.mode === SELECTION_MODES.RANDOM) {
      const n = Math.max(0, parseInt(cfg.randomCount, 10) || 0);
      return n > 0 && (cfg.bankQuestions || []).length > 0;
    }
    if (cfg.mode === SELECTION_MODES.SEQUENTIAL) {
      const from = parseInt(cfg.fromIndex, 10);
      const to = parseInt(cfg.toIndex, 10);
      return !isNaN(from) && !isNaN(to) && from > 0 && to >= from && (cfg.bankQuestions || []).length >= from;
    }
    return (cfg.selectedIds || []).length > 0;
  };

  /* ---------- submit ---------- */
  const handleSubmit = async (e) => {
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

    setLoadingSubmit(true);
    setNotification({});

    try {
      const testRes = await axios.post('/api/tests', {
        title: testInfo.title.trim(),
        description: testInfo.description || null,
        examTypeId: testInfo.examTypeId,
        durationMinutes: testInfo.durationMinutes && Number(testInfo.durationMinutes) > 0 ? Number(testInfo.durationMinutes) : null,
        maxAttempts: testInfo.maxAttempts && Number(testInfo.maxAttempts) > 0 ? Number(testInfo.maxAttempts) : null,
        bannerUrl: testInfo.bannerUrl || null,
        availableFrom: testInfo.availableFrom ? testInfo.availableFrom + ':00' : null,
        availableTo: testInfo.availableTo ? testInfo.availableTo + ':00' : null,
        classId: null,
        chapterId: null,
      });

      const newTestId = testRes.data.testId ?? testRes.data.id;
      if (!newTestId) throw new Error('Không nhận được testId từ server.');

      for (const part of partsToAdd) {
        const cfg = partConfigs[part.examPartId];
        const numQuestions = getPartEffectiveCount(part.examPartId);
        if (numQuestions <= 0) continue;

        const partRes = await axios.post('/api/test-parts', {
          testId: String(newTestId),
          examPartId: String(part.examPartId),
          numQuestions,
        });
        const newPartId = partRes.data.testPartId ?? partRes.data.id;
        if (!newPartId) throw new Error(`Không nhận được testPartId cho part ${part.name}.`);

        if (cfg.mode === SELECTION_MODES.RANDOM || cfg.mode === SELECTION_MODES.SEQUENTIAL) {
          await axios.post('/api/tests/parts/random-questions', {
            testPartId: String(newPartId),
            count: numQuestions,
            isSequential: cfg.mode === SELECTION_MODES.SEQUENTIAL,
            fromIndex: cfg.mode === SELECTION_MODES.SEQUENTIAL ? parseInt(cfg.fromIndex, 10) : undefined,
            toIndex: cfg.mode === SELECTION_MODES.SEQUENTIAL ? parseInt(cfg.toIndex, 10) : undefined,
          });
        } else {
          await axios.post('/api/tests/parts/questions', {
            testPartId: String(newPartId),
            questionIds: (cfg.selectedIds || []).map(String),
          });
        }
      }

      setTestInfo((prev) => ({ ...prev, title: '', description: '' }));
      toast.success('Đã tạo đề thi từ kho câu hỏi!');
      onSuccess?.();
    } catch (error) {
      const msg = error.response?.data?.message ?? error.response?.data ?? error.message;
      setNotification({ type: 'danger', message: 'Lỗi: ' + (typeof msg === 'string' ? msg : JSON.stringify(msg)) });
    } finally {
      setLoadingSubmit(false);
    }
  };

  const totalSelected = (examParts || []).reduce((sum, p) => sum + getPartEffectiveCount(p.examPartId), 0);
  const hasAnyPartWithQuestions = (examParts || []).some((p) => getPartEffectiveCount(p.examPartId) > 0);

  /* ======================= RENDER ======================= */
  return (
    <>
      {notification.message && (
        <Alert variant={notification.type} className="mb-3" dismissible onClose={() => setNotification({})}>
          {notification.message}
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        {/* ---- 1. Thông tin đề thi ---- */}
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
            <Col md={6}>
              <div className={cx('formGroupModern')}>
                <label>Loại kỳ thi *</label>
                <select
                  className={cx('inputModern')}
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
            <Col md={6}>
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

        {/* ---- 2. Cấu hình từng Part ---- */}
        {testInfo.examTypeId && (examParts || []).length > 0 && (
          <div className={cx('configCard')}>
            <div className={cx('sectionTitle')}>
              <IoLibraryOutline /> 2. Cấu hình từng Part
            </div>
            <p className={cx('bankHint')}>
              Mỗi part: <strong>Random theo số lượng</strong> (BE lấy ngẫu nhiên từ kho cá nhân) hoặc <strong>Chọn thủ công</strong>.
              Với part có passage (vd. Part 3, 4, 6, 7): chọn theo <strong>nhóm (cùng passage)</strong> để giữ tính tương đồng, không chọn lẻ từng câu.
            </p>

            {(examParts || []).map((part) => {
              const cfg = partConfigs[part.examPartId] ?? defaultPartConfig();
              const totalInBank = (cfg.bankQuestions || []).length;
              const maxInBank = totalInBank;
              const allSelected = maxInBank > 0 && (cfg.selectedIds || []).length === maxInBank;

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
                      {/* mode tabs */}
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

                      {/* random input */}
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
                          <span className={cx('bankRandomHint')}>Tối đa {maxInBank} câu trong kho</span>
                        </div>
                      )}

                      {/* sequential input */}
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
                          <span className={cx('bankRandomHint')}>Tối đa {maxInBank} câu trong kho</span>
                        </div>
                      )}

                      {/* loading */}
                      {cfg.loading && (
                        <div className={cx('bankLoadingWrap')}>
                          <Spinner animation="border" size="sm" /> <span>Đang tải câu hỏi...</span>
                        </div>
                      )}

                      {/* empty */}
                      {!cfg.loading && maxInBank === 0 && (
                        <Alert variant="info" className="mb-0 mt-2">Chưa có câu hỏi trong kho (cá nhân) cho part này.</Alert>
                      )}

                      {/* manual selection — giống hệt CreateTestFromBankPage */}
                      {!cfg.loading && cfg.mode === SELECTION_MODES.MANUAL && maxInBank > 0 && (() => {
                        const groups = groupQuestionsByPassage(cfg.bankQuestions);
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
                              {groups.map((gr) => {
                                const grSelected = isGroupSelected(part.examPartId, gr.groupKey);
                                const grLabel = gr.passageId != null
                                  ? `Nhóm passage (${gr.questions.length} câu)`
                                  : `Câu độc lập (${gr.questions.length} câu)`;
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
                                        return (
                                          <li key={id} className={cx('bankQuestionItem', { selected: checked })}>
                                            <span className={cx('bankQuestionIndex')}>{index + 1}.</span>
                                            <span className={cx('bankQuestionText')}>{q.questionText || '(Không có nội dung)'}</span>
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
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  </div>
                                );
                              })}
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

        {/* ---- Footer ---- */}
        <div className={cx('footer')}>
          {onCancel && (
            <button type="button" className={cx('btnCancel')} onClick={onCancel}>
              Để sau
            </button>
          )}
          <button
            type="submit"
            className={cx('btnSubmit')}
            disabled={loadingSubmit || !hasAnyPartWithQuestions || !testInfo.examTypeId}
          >
            {loadingSubmit ? <><Spinner animation="border" size="sm" /> Đang tạo đề...</> : <><IoRocketOutline /> Tạo đề thi từ kho</>}
          </button>
        </div>
      </Form>

      {/* Edit Question Modal */}
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
