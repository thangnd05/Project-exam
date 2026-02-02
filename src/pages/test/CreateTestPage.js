import { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, Row, Col, Form, Spinner } from 'react-bootstrap';
import {
  IoAdd,
  IoRocketOutline,
  IoSettingsOutline,
  IoCubeOutline,
  IoInfiniteOutline,
  IoCalendarOutline,
  IoTimeOutline,
  IoLayersOutline,
  IoCheckboxOutline
} from 'react-icons/io5';
import classNames from 'classnames/bind';

import styles from './CreateTestPage.module.scss';

const cx = classNames.bind(styles);

function CreateTestPage() {
  const [examTypes, setExamTypes] = useState([]);
  const [selectedExamType, setSelectedExamType] = useState('');
  const [examParts, setExamParts] = useState([]);
  const [testName, setTestName] = useState('');
  const [testDescription, setTestDescription] = useState('');
  const [bannerFile, setBannerFile] = useState(null);
  const [numQuestions, setNumQuestions] = useState({});
  const [maxQuestions, setMaxQuestions] = useState({});
  const [mode, setMode] = useState({});
  const [enabledParts, setEnabledParts] = useState({});
  const [selectedQuestions, setSelectedQuestions] = useState({});
  const [questionBank, setQuestionBank] = useState({});
  const [availableFrom, setAvailableFrom] = useState('');
  const [availableTo, setAvailableTo] = useState('');
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [durationMinutes, setDurationMinutes] = useState('');
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    axios.get('/api/classes/my')
      .then((res) => setClasses(Array.isArray(res.data) ? res.data : (res.data.classes || [])))
      .catch((err) => console.error(err));

    axios.get('/api/exam-types')
      .then((res) => setExamTypes(res.data || []))
      .catch((err) => console.error(err));
  }, []);

  const handleExamTypeChange = async (examTypeId) => {
    setSelectedExamType(examTypeId);
    if (!examTypeId) {
      setExamParts([]);
      return;
    }

    try {
      const res = await axios.get(`/api/exam-parts/by-exam-type/${examTypeId}`);
      const parts = res.data || [];

      const initNums = {};
      const initMode = {};
      const initEnabled = {};
      const counts = {};

      for (const p of parts) {
        initNums[p.examPartId] = p.defaultNumQuestions || 0;
        initMode[p.examPartId] = 'random';
        initEnabled[p.examPartId] = true;

        const countRes = await axios.get(classId
          ? `/api/questions/count/by-part/${p.examPartId}?classId=${classId}`
          : `/api/questions/count/by-part/${p.examPartId}`);
        counts[p.examPartId] = countRes.data || 0;
      }

      setExamParts(parts);
      setNumQuestions(initNums);
      setMode(initMode);
      setEnabledParts(initEnabled);
      setMaxQuestions(counts);
    } catch (err) {
      console.error(err);
    }
  };

  const handleModeChange = async (partId, newMode) => {
    setMode((prev) => ({ ...prev, [partId]: newMode }));
    if (newMode === 'manual' && !questionBank[partId]) {
      try {
        const res = await axios.get(classId
          ? `/api/questions/by-part/${partId}?classId=${classId}`
          : `/api/questions/by-part/${partId}`);
        setQuestionBank((prev) => ({ ...prev, [partId]: res.data || [] }));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleCreateTest = async () => {
    if (!selectedExamType || !testName.trim()) {
      alert('Vui lòng chọn loại kỳ thi và nhập tên!');
      return;
    }

    setIsSubmitting(true);
    const parts = examParts
      .filter((p) => enabledParts[p.examPartId])
      .map((p) => ({
        examPartId: p.examPartId,
        random: mode[p.examPartId] === 'random',
        numQuestions: parseInt(numQuestions[p.examPartId] || 0, 10),
        questionIds: selectedQuestions[p.examPartId] || [],
      }));

    const testData = {
      title: testName,
      description: testDescription,
      examTypeId: parseInt(selectedExamType, 10),
      durationMinutes: parseInt(durationMinutes || 60, 10),
      availableFrom: availableFrom || null,
      availableTo: availableTo || null,
      maxAttempts: parseInt(maxAttempts, 10) || 1,
      parts,
      classId: classId ? parseInt(classId, 10) : null,
    };

    const formData = new FormData();
    formData.append('data', JSON.stringify(testData));
    if (bannerFile) formData.append('banner', bannerFile);

    try {
      await axios.post('/api/tests', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('🚀 Tạo đề thi thành công!');
    } catch (err) {
      console.error(err);
      alert('❌ Lỗi khi tạo đề!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cx('wrapper')}>
      <Container>
        {/* --- Header --- */}
        <div className={cx('header')}>
          <h1>Kiến tạo bài thi (Matrix)</h1>
          <p>Lấy câu hỏi từ ngân hàng để tạo đề thi nhanh chóng và chính xác</p>
        </div>

        {/* --- Config Card --- */}
        <div className={cx('config-card')}>
          <div className={cx('section-title')}>
            <IoSettingsOutline /> Thiết lập cơ bản
          </div>
          <Row>
            <Col md={6} className={cx('form-group-modern')}>
              <label>Chọn lớp học</label>
              <select className={cx('input-modern')} value={classId} onChange={(e) => setClassId(e.target.value)}>
                <option value="">-- Chọn lớp học --</option>
                {classes.map(c => <option key={c.classId} value={c.classId}>{c.className}</option>)}
              </select>
            </Col>
            <Col md={6} className={cx('form-group-modern')}>
              <label>Loại kỳ thi</label>
              <select className={cx('input-modern')} value={selectedExamType} onChange={(e) => handleExamTypeChange(e.target.value)}>
                <option value="">-- Chọn kỳ thi --</option>
                {examTypes.map(t => <option key={t.examTypeId} value={t.examTypeId}>{t.name}</option>)}
              </select>
            </Col>
            <Col md={12} className={cx('form-group-modern')}>
              <label>Tên bài thi</label>
              <input type="text" className={cx('input-modern')} placeholder="VD: Đề Toeic tháng 12" value={testName} onChange={(e) => setTestName(e.target.value)} />
            </Col>
            <Col md={4} className={cx('form-group-modern')}>
              <label><IoTimeOutline /> Thời lượng (phút)</label>
              <input type="number" className={cx('input-modern')} value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} />
            </Col>
            <Col md={4} className={cx('form-group-modern')}>
              <label><IoCalendarOutline /> Bắt đầu</label>
              <input type="datetime-local" className={cx('input-modern')} value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)} />
            </Col>
            <Col md={4} className={cx('form-group-modern')}>
              <label><IoCalendarOutline /> Kết thúc</label>
              <input type="datetime-local" className={cx('input-modern')} value={availableTo} onChange={(e) => setAvailableTo(e.target.value)} />
            </Col>
            <Col md={12}>
              <label className="fw-bold fs-4 mb-2">Ảnh Banner</label>
              <input type="file" className={cx('input-modern')} accept="image/*" onChange={(e) => setBannerFile(e.target.files[0])} />
            </Col>
          </Row>
        </div>

        {/* --- Matrix Parts --- */}
        <div className={cx('section-title')} style={{ marginTop: '40px' }}>
          <IoLayersOutline /> Cấu trúc đề (Matrix)
        </div>
        {examParts.map((p) => (
          <div key={p.examPartId} className={cx('part-block')}>
            <div className={cx('part-header')}>
              <div className={cx('name-box')}>
                <Form.Check
                  type="switch"
                  checked={enabledParts[p.examPartId] ?? true}
                  onChange={(e) => setEnabledParts({ ...enabledParts, [p.examPartId]: e.target.checked })}
                />
                <b>{p.name}</b>
                <span className="text-muted small ms-2">{p.description}</span>
              </div>
              <select
                className={cx('mode-pill')}
                disabled={!enabledParts[p.examPartId]}
                value={mode[p.examPartId] || 'random'}
                onChange={(e) => handleModeChange(p.examPartId, e.target.value)}
              >
                <option value="random">Lấy ngẫu nhiên</option>
                <option value="manual">Chọn thủ công</option>
              </select>
            </div>

            {enabledParts[p.examPartId] && (
              <div className="mt-4">
                {mode[p.examPartId] === 'random' ? (
                  <Row className="align-items-center">
                    <Col md={4}>
                      <input
                        type="number"
                        className={cx('input-modern')}
                        max={maxQuestions[p.examPartId]}
                        value={numQuestions[p.examPartId] || 0}
                        onChange={(e) => setNumQuestions({ ...numQuestions, [p.examPartId]: e.target.value })}
                        placeholder="Số câu muốn lấy..."
                      />
                    </Col>
                    <Col md={8}>
                      <span className="text-muted"><IoInfiniteOutline /> Ngân hàng hiện có: <b>{maxQuestions[p.examPartId] || 0}</b> câu</span>
                    </Col>
                  </Row>
                ) : (
                  <div className={cx('manual-select')}>
                    {questionBank[p.examPartId]?.map(q => (
                      <div key={q.questionId} className={cx('question-item')} onClick={() => {
                        const current = selectedQuestions[p.examPartId] || [];
                        const exists = current.includes(q.questionId);
                        setSelectedQuestions({
                          ...selectedQuestions,
                          [p.examPartId]: exists ? current.filter(id => id !== q.questionId) : [...current, q.questionId]
                        });
                      }}>
                        <Form.Check checked={selectedQuestions[p.examPartId]?.includes(q.questionId) || false} readOnly />
                        <span>{q.questionText}</span>
                      </div>
                    )) || <i>Đang tải dữ liệu...</i>}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        <button className={cx('btn-create-large')} onClick={handleCreateTest} disabled={isSubmitting}>
          {isSubmitting ? <Spinner size="sm" /> : <><IoRocketOutline size={25} /> Tạo bài thi ngay</>}
        </button>
      </Container>
    </div>
  );
}

export default CreateTestPage;
