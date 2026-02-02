import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Spinner, Form, Alert } from 'react-bootstrap';
import classNames from 'classnames/bind';
import {
  IoAdd,
  IoTrashOutline,
  IoCloudUploadOutline,
  IoCalendarOutline,
  IoTimeOutline,
  IoDocumentTextOutline,
  IoLayersOutline,
  IoCheckmarkCircleOutline,
  IoMusicalNotesOutline,
  IoVolumeHighOutline
} from 'react-icons/io5';

import styles from './TestCreateForm.module.scss';

const cx = classNames.bind(styles);

const TestCreationForm = ({ user }) => {
  const initialQuestion = {
    questionType: 'MCQ',
    questionText: '',
    options: [
      { label: 'A', content: '', isCorrect: false },
      { label: 'B', content: '', isCorrect: false },
      { label: 'C', content: '', isCorrect: false },
      { label: 'D', content: '', isCorrect: false },
    ],
  };

  const [testData, setTestData] = useState({
    examTypeId: '',
    title: '',
    description: '',
    durationMinutes: '',
    availableFrom: '',
    availableTo: '',
    maxAttempts: 1,
    parts: [],
    classId: '',
  });

  const [classes, setClasses] = useState([]);
  const [bannerFile, setBannerFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    axios.get('/api/classes/my')
      .then((res) => setClasses(Array.isArray(res.data) ? res.data : (res.data.classes || [])))
      .catch((err) => console.error('❌ Lỗi:', err));
  }, []);

  useEffect(() => {
    const fetchExamParts = async () => {
      if (!testData.examTypeId) return;
      try {
        const res = await axios.get(`/api/exam-parts/by-exam-type/${testData.examTypeId}`);
        const parts = res.data.map((p) => ({
          examPartId: p.examPartId,
          name: p.name,
          passage: {
            passageType: p.skillId === 1 ? 'LISTENING' : p.skillId === 2 ? 'READING' : p.skillId === 3 ? 'SPEAKING' : 'WRITING',
            content: '',
            mediaFile: null,
          },
          questions: [JSON.parse(JSON.stringify(initialQuestion))],
        }));
        setTestData((prev) => ({ ...prev, parts }));
      } catch (err) {
        console.error('❌ Lỗi:', err);
        setStatusMessage('❌ Không tải được danh sách phần thi!');
      }
    };
    fetchExamParts();
  }, [testData.examTypeId]);

  const addPart = () => {
    setTestData((prev) => {
      const newPart = {
        examPartId: prev.parts.length + 1000,
        name: `Phần tự chọn ${prev.parts.length + 1}`,
        passage: { passageType: 'READING', content: '', mediaFile: null },
        questions: [JSON.parse(JSON.stringify(initialQuestion))],
      };
      return { ...prev, parts: [...prev.parts, newPart] };
    });
  };

  const removePart = (index) => {
    setTestData((prev) => ({ ...prev, parts: prev.parts.filter((_, i) => i !== index) }));
  };

  const handlePartChange = (index, field, value) => {
    const updatedParts = [...testData.parts];
    if (field === 'passageType') updatedParts[index].passage.passageType = value;
    else updatedParts[index][field] = value;
    setTestData({ ...testData, parts: updatedParts });
  };

  const handlePassageChange = (partIndex, field, value) => {
    const updatedParts = [...testData.parts];
    updatedParts[partIndex].passage[field] = value;
    setTestData({ ...testData, parts: updatedParts });
  };

  const addQuestion = (partIndex) => {
    const updatedParts = [...testData.parts];
    updatedParts[partIndex].questions.push(JSON.parse(JSON.stringify(initialQuestion)));
    setTestData({ ...testData, parts: updatedParts });
  };

  const removeQuestion = (partIndex, qIndex) => {
    const updatedParts = [...testData.parts];
    updatedParts[partIndex].questions.splice(qIndex, 1);
    setTestData({ ...testData, parts: updatedParts });
  };

  const handleQuestionChange = (partIndex, qIndex, field, value) => {
    const updatedParts = [...testData.parts];
    updatedParts[partIndex].questions[qIndex][field] = value;
    setTestData({ ...testData, parts: updatedParts });
  };

  const handleOptionChange = (partIndex, qIndex, oIndex, field, value) => {
    const updatedParts = [...testData.parts];
    updatedParts[partIndex].questions[qIndex].options[oIndex][field] = value;
    setTestData({ ...testData, parts: updatedParts });
  };

  const handleFileChange = (partIndex, file) => {
    const updatedParts = [...testData.parts];
    updatedParts[partIndex].passage.mediaFile = file;
    setTestData({ ...testData, parts: updatedParts });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage('');

    const requestPayload = {
      examTypeId: testData.examTypeId,
      title: testData.title,
      description: testData.description,
      durationMinutes: parseInt(testData.durationMinutes),
      availableFrom: testData.availableFrom || null,
      availableTo: testData.availableTo || null,
      maxAttempts: parseInt(testData.maxAttempts),
      classId: testData.classId ? parseInt(testData.classId) : null,
      parts: testData.parts.map((p) => ({
        examPartId: p.examPartId,
        passage: {
          passageType: p.passage.passageType,
          content: p.passage.content,
        },
        questions: p.questions.map((q) => ({
          questionType: q.questionType,
          questionText: q.questionText,
          answers: q.options.map((opt) => ({
            label: opt.label,
            answerText: opt.content,
            isCorrect: opt.isCorrect,
          })),
        })),
      })),
    };

    const formData = new FormData();
    formData.append('testData', JSON.stringify(requestPayload));
    if (bannerFile) formData.append('bannerFile', bannerFile);

    testData.parts.forEach((part) => {
      if (part.passage.passageType === 'LISTENING' && part.passage.mediaFile) {
        formData.append('audioFiles', part.passage.mediaFile);
      }
    });

    try {
      await axios.post('/api/tests/create-with-questions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setStatusMessage('SUCCESS');
    } catch (err) {
      console.error(err);
      setStatusMessage('ERROR');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cx('wrapper')}>
      <Container>
        {/* --- Header --- */}
        <div className={cx('header')}>
          <h1>Tạo bài kiểm tra mới</h1>
          <p>Thiết kế đề thi chuyên nghiệp với đầy đủ các phần Reading, Listening, Speaking và Writing</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* --- Basic Info Card --- */}
          <div className={cx('form-card')}>
            <div className={cx('section-title')}>
              <IoDocumentTextOutline /> Thông tin chung
            </div>
            <Row className="g-4">
              <Col md={6}>
                <label className={cx('label-modern')}>Tên lớp học</label>
                <select className={cx('input-modern')} value={testData.classId} onChange={(e) => setTestData({ ...testData, classId: e.target.value })}>
                  <option value="">-- Chọn lớp học --</option>
                  {classes.map(cls => <option key={cls.classId} value={cls.classId}>{cls.className}</option>)}
                </select>
              </Col>
              <Col md={6}>
                <label className={cx('label-modern')}>Loại bài thi</label>
                <select className={cx('input-modern')} value={testData.examTypeId} onChange={(e) => setTestData({ ...testData, examTypeId: e.target.value })}>
                  <option value="">-- Chọn loại kỳ thi --</option>
                  <option value="1">TOEIC</option>
                  <option value="2">IELTS</option>
                  <option value="3">CUSTOM</option>
                </select>
              </Col>
              <Col md={12}>
                <label className={cx('label-modern')}>Tiêu đề đề thi</label>
                <input type="text" className={cx('input-modern')} placeholder="VD: Kiểm tra giữa kỳ Listening" value={testData.title} onChange={(e) => setTestData({ ...testData, title: e.target.value })} />
              </Col>
              <Col md={4}>
                <label className={cx('label-modern')}><IoTimeOutline className="me-1" /> Thời lượng (phút)</label>
                <input type="number" className={cx('input-modern')} value={testData.durationMinutes} onChange={(e) => setTestData({ ...testData, durationMinutes: e.target.value })} />
              </Col>
              <Col md={4}>
                <label className={cx('label-modern')}><IoCalendarOutline className="me-1" /> Thời gian mở</label>
                <input type="datetime-local" className={cx('input-modern')} value={testData.availableFrom} onChange={(e) => setTestData({ ...testData, availableFrom: e.target.value })} />
              </Col>
              <Col md={4}>
                <label className={cx('label-modern')}><IoCalendarOutline className="me-1" /> Thời gian đóng</label>
                <input type="datetime-local" className={cx('input-modern')} value={testData.availableTo} onChange={(e) => setTestData({ ...testData, availableTo: e.target.value })} />
              </Col>
            </Row>
          </div>

          {/* --- Banner Card --- */}
          <div className={cx('form-card')}>
            <div className={cx('section-title')}>
              <IoCloudUploadOutline /> Ảnh bìa (Banner)
            </div>
            <input type="file" accept="image/*" className={cx('input-modern')} onChange={(e) => setBannerFile(e.target.files[0])} />
            {bannerFile && (
              <div className={cx('banner-preview')}>
                <img src={URL.createObjectURL(bannerFile)} alt="Preview" />
                <button type="button" className="btn btn-sm btn-outline-danger mt-3" onClick={() => setBannerFile(null)}><IoTrashOutline /> Xóa ảnh</button>
              </div>
            )}
          </div>

          {/* --- Parts Area --- */}
          {testData.parts.map((part, partIndex) => (
            <div key={partIndex} className={cx('part-card')}>
              <div className={cx('part-header')}>
                <h5>Section: {part.name || `P.${partIndex + 1}`}</h5>
                <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => removePart(partIndex)}><IoTrashOutline /></button>
              </div>

              <Row className="g-3">
                <Col md={4}>
                  <label className={cx('label-modern')}>Loại kỹ năng</label>
                  <select className={cx('input-modern')} value={part.passage.passageType} onChange={(e) => handlePartChange(partIndex, 'passageType', e.target.value)}>
                    <option value="READING">Reading / Grammar</option>
                    <option value="LISTENING">Listening (Audio)</option>
                    <option value="SPEAKING">Speaking</option>
                    <option value="WRITING">Writing</option>
                  </select>
                </Col>
                <Col md={12}>
                  <label className={cx('label-modern')}>Nội dung đoạn văn / Hướng dẫn (Passage)</label>
                  <textarea className={cx('input-modern')} rows={4} value={part.passage.content} onChange={(e) => handlePassageChange(partIndex, 'content', e.target.value)} />
                </Col>
                {part.passage.passageType === 'LISTENING' && (
                  <Col md={12}>
                    <div className="p-3 bg-white rounded-3 border">
                      <label className={cx('label-modern')}><IoMusicalNotesOutline /> Tải lên Audio</label>
                      <input type="file" accept="audio/*" className={cx('input-modern')} onChange={(e) => handleFileChange(partIndex, e.target.files[0])} />
                      {part.passage.mediaFile && (
                        <div className="mt-3">
                          <audio controls src={URL.createObjectURL(part.passage.mediaFile)} className="w-100" />
                        </div>
                      )}
                    </div>
                  </Col>
                )}
              </Row>

              {/* --- Questions in Part --- */}
              {part.questions.map((q, qIndex) => (
                <div key={qIndex} className={cx('question-box')}>
                  <div className="d-flex justify-content-between mb-3">
                    <label className={cx('label-modern')}>Câu hỏi {qIndex + 1}</label>
                    <button type="button" className="btn btn-link text-danger p-0" onClick={() => removeQuestion(partIndex, qIndex)}><IoTrashOutline size={18} /></button>
                  </div>
                  <textarea className={cx('input-modern', 'mb-3')} value={q.questionText} onChange={(e) => handleQuestionChange(partIndex, qIndex, 'questionText', e.target.value)} placeholder="Nhập câu hỏi tại đây..." />

                  <Row>
                    {q.options.map((o, oIndex) => (
                      <Col md={6} key={oIndex} className={cx('option-line')}>
                        <input type="checkbox" className={cx('check-custom')} checked={o.isCorrect} onChange={(e) => handleOptionChange(partIndex, qIndex, oIndex, 'isCorrect', e.target.checked)} />
                        <span className={cx('label-tag')}>{o.label}.</span>
                        <input type="text" className={cx('input-modern')} value={o.content} onChange={(e) => handleOptionChange(partIndex, qIndex, oIndex, 'content', e.target.value)} placeholder="Nhập đáp án..." />
                      </Col>
                    ))}
                  </Row>
                </div>
              ))}

              <button type="button" className={cx('btn-add-outline')} onClick={() => addQuestion(partIndex)}>
                <IoAdd /> Thêm câu hỏi vào phần này
              </button>
            </div>
          ))}

          <div className="text-center mb-5">
            <button type="button" className={cx('btn-add-outline')} style={{ maxWidth: '300px', margin: '0 auto' }} onClick={addPart}>
              <IoLayersOutline /> Thêm phần (Section) mới
            </button>
          </div>

          {statusMessage === 'SUCCESS' && <Alert variant="success" className="text-center">🎉 Tạo bài kiểm tra thành công!</Alert>}
          {statusMessage === 'ERROR' && <Alert variant="danger" className="text-center">❌ Có lỗi xảy ra, vui lòng kiểm tra lại!</Alert>}

          <button type="submit" className={cx('btn-primary-modern')} disabled={isSubmitting}>
            {isSubmitting ? <><Spinner size="sm" className="me-2" /> Đang xử lý...</> : <><IoCheckmarkCircleOutline size={22} /> Hoàn tất & Tạo đề thi</>}
          </button>
        </form>
      </Container>
    </div>
  );
};

export default TestCreationForm;
