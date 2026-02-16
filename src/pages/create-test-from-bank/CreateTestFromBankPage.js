import React, { useEffect, useState } from 'react';
import { Row, Col, Spinner, Alert, Button, Form } from 'react-bootstrap';
import axios from 'axios';
import classNames from 'classnames/bind';
import { toast } from 'react-toastify';
import {
  IoLibraryOutline,
  IoSettingsOutline,
  IoCheckboxOutline,
  IoShuffleOutline,
  IoBookOutline,
  IoSchoolOutline,
  IoTimeOutline,
  IoRocketOutline,
  IoChevronDownOutline,
  IoChevronUpOutline,
} from 'react-icons/io5';
import { useBaseMetaData } from '~/hook/useBaseMetaData';
import styles from './CreateTestFromBankPage.module.scss';

const cx = classNames.bind(styles);

const SELECTION_MODES = {
  MANUAL: 'manual',
  RANDOM: 'random',
};

const defaultPartConfig = () => ({
  mode: SELECTION_MODES.RANDOM,
  randomCount: 0,
  selectedIds: [],
  bankQuestions: [],
  loading: false,
  expanded: true,
});

const CreateTestFromBankPage = () => {
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

  const { examTypes, examParts } = useBaseMetaData(testInfo.examTypeId);

  useEffect(() => {
    if (!testInfo.examTypeId || !examParts.length) {
      setPartConfigs({});
      return;
    }
    const initial = {};
    examParts.forEach((p) => {
      initial[p.examPartId] = { ...defaultPartConfig(), expanded: false, loading: true };
    });
    setPartConfigs(initial);

    examParts.forEach((part) => {
      const examPartId = part.examPartId;
      axios
        .get(`/api/questions/by-exam-part/${examPartId}`)
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
    });
  }, [testInfo.examTypeId, examParts]);

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

  const toggleQuestion = (examPartId, questionId) => {
    setPartConfigs((prev) => {
      const cfg = prev[examPartId];
      const set = new Set(cfg.selectedIds);
      if (set.has(questionId)) set.delete(questionId);
      else set.add(questionId);
      return { ...prev, [examPartId]: { ...cfg, selectedIds: Array.from(set) } };
    });
  };

  const toggleSelectAll = (examPartId, checked) => {
    const cfg = partConfigs[examPartId];
    if (!cfg) return;
    const ids = (cfg.bankQuestions || [])
      .map((q) => q.questionId ?? q.id)
      .filter(Boolean);
    updatePartConfig(examPartId, 'selectedIds', checked ? ids : []);
  };

  const getSelectedQuestionIdsForPart = (examPartId) => {
    const cfg = partConfigs[examPartId];
    if (!cfg) return [];
    if (cfg.mode === SELECTION_MODES.RANDOM) {
      const ids = (cfg.bankQuestions || []).map((q) => q.questionId ?? q.id).filter(Boolean);
      const count = Math.min(Number(cfg.randomCount) || 0, ids.length);
      const shuffled = [...ids].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    }
    return cfg.selectedIds || [];
  };

  const getPartSelectedCount = (examPartId) => {
    const cfg = partConfigs[examPartId];
    if (!cfg) return 0;
    if (cfg.mode === SELECTION_MODES.RANDOM) {
      const max = (cfg.bankQuestions || []).length;
      return Math.min(Number(cfg.randomCount) || 0, max);
    }
    return (cfg.selectedIds || []).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!testInfo.title?.trim() || !testInfo.examTypeId) {
      setNotification({ type: 'warning', message: 'Vui lòng điền tiêu đề và chọn loại kỳ thi.' });
      return;
    }

    const partsWithQuestions = examParts.filter((p) => getSelectedQuestionIdsForPart(p.examPartId).length > 0);
    if (partsWithQuestions.length === 0) {
      setNotification({ type: 'warning', message: 'Vui lòng chọn ít nhất một câu hỏi ở một part bất kỳ (số lượng > 0).' });
      return;
    }

    setLoadingSubmit(true);
    setNotification({});

    try {
      const testRes = await axios.post('/api/tests', {
        title: testInfo.title.trim(),
        description: testInfo.description || null,
        examTypeId: Number(testInfo.examTypeId),
        durationMinutes: testInfo.durationMinutes && Number(testInfo.durationMinutes) > 0 ? Number(testInfo.durationMinutes) : null,
        maxAttempts: testInfo.maxAttempts && Number(testInfo.maxAttempts) > 0 ? Number(testInfo.maxAttempts) : null,
        bannerUrl: testInfo.bannerUrl || null,
        availableFrom: testInfo.availableFrom ? testInfo.availableFrom + ':00' : null,
        availableTo: testInfo.availableTo ? testInfo.availableTo + ':00' : null,
        classId: null,
        chapterId: null,
      });

      const newTestId = testRes.data.testId ?? testRes.data.id;

      for (const part of partsWithQuestions) {
        const questionIds = getSelectedQuestionIdsForPart(part.examPartId);
        if (questionIds.length === 0) continue;

        const partRes = await axios.post('/api/test-parts', {
          testId: Number(newTestId),
          examPartId: Number(part.examPartId),
          numQuestions: questionIds.length,
        });
        const newPartId = partRes.data.testPartId ?? partRes.data.id;
        await axios.post(`/api/test-parts/${newPartId}/attach-from-bank`, {
          questionIds: questionIds.map(Number),
        });
      }

      setNotification({ type: 'success', message: '🎉 Tạo đề thi từ kho câu hỏi thành công!' });
      setTestInfo((prev) => ({ ...prev, title: '', description: '' }));
      toast.success('Đã tạo đề thi từ kho câu hỏi!');
    } catch (error) {
      const msg = error.response?.data?.message ?? error.message;
      setNotification({ type: 'danger', message: '❌ ' + msg });
    } finally {
      setLoadingSubmit(false);
    }
  };

  const totalSelected = examParts.reduce((sum, p) => sum + getPartSelectedCount(p.examPartId), 0);
  const hasAnyPartWithQuestions = examParts.some((p) => getPartSelectedCount(p.examPartId) > 0);

  return (
    <div className={cx('wrapper')}>
      <div className={cx('container')}>
        <header className={cx('header')}>
          <h1 className={cx('title')}>
            <IoLibraryOutline /> Tạo đề thi từ kho câu hỏi
          </h1>
          <p className={cx('subtitle')}>
            Chọn loại kỳ thi → Cấu hình từng Part (số lượng / chọn thủ công hoặc random) → Tạo đề
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
              <Col md={6}>
                <div className={cx('formGroup')}>
                  <label><IoSchoolOutline /> Loại kỳ thi *</label>
                  <select
                    className={cx('input')}
                    value={testInfo.examTypeId}
                    onChange={(e) => handleExamTypeChange(e.target.value)}
                    aria-label="Loại kỳ thi"
                  >
                    <option value="">-- Chọn --</option>
                    {examTypes.map((t) => (
                      <option key={t.examTypeId} value={t.examTypeId}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </Col>
              <Col md={6}>
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

          {testInfo.examTypeId && examParts.length > 0 && (
            <div className={cx('configCard')}>
              <div className={cx('sectionTitle')}>
                <IoLibraryOutline /> 2. Cấu hình từng Part – chọn câu hỏi từ kho
              </div>
              <p className={cx('hint')}>
                Mỗi part có thể bật chế độ <strong>Random theo số lượng</strong> hoặc <strong>Chọn thủ công</strong>. Để part không có trong đề, để số câu = 0 (Random) hoặc không chọn câu nào (Thủ công).
              </p>

              {examParts.map((part) => {
                const cfg = partConfigs[part.examPartId] ?? defaultPartConfig();
                const count = getPartSelectedCount(part.examPartId);
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
                      <span className={cx('partBadge')}>Số câu: {count}</span>
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

                        {cfg.loading && (
                          <div className={cx('loadingWrap')}>
                            <Spinner animation="border" size="sm" /> <span>Đang tải câu hỏi...</span>
                          </div>
                        )}

                        {!cfg.loading && maxInBank === 0 && (
                          <Alert variant="info" className="mb-0 mt-2">Chưa có câu hỏi trong kho cho part này.</Alert>
                        )}

                        {!cfg.loading && cfg.mode === SELECTION_MODES.MANUAL && maxInBank > 0 && (
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
                            <div className={cx('questionList')}>
                              {cfg.bankQuestions.map((q, index) => {
                                const id = q.questionId ?? q.id;
                                if (id == null) return null;
                                const checked = (cfg.selectedIds || []).includes(id);
                                return (
                                  <div key={id} className={cx('questionItem', { selected: checked })}>
                                    <Form.Check
                                      type="checkbox"
                                      id={`q-${part.examPartId}-${id}`}
                                      checked={checked}
                                      onChange={() => toggleQuestion(part.examPartId, id)}
                                      aria-label={`Chọn câu ${index + 1}`}
                                    />
                                    <span className={cx('questionIndex')}>{index + 1}.</span>
                                    <span className={cx('questionText')}>{q.questionText || '(Không có nội dung)'}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              <p className={cx('selectedCount')}>
                Tổng số câu sẽ đưa vào đề: <strong>{totalSelected}</strong>
              </p>
            </div>
          )}

          <div className={cx('footer')}>
            <Button
              type="submit"
              className={cx('btnSubmit')}
              disabled={loadingSubmit || !hasAnyPartWithQuestions || !testInfo.examTypeId}
            >
              {loadingSubmit ? <><Spinner animation="border" size="sm" /> Đang tạo đề...</> : <><IoRocketOutline /> Tạo đề thi từ kho</>}
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default CreateTestFromBankPage;
