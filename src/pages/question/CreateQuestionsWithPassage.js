import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import classNames from 'classnames/bind';
import {
  IoAdd,
  IoTrashOutline,
  IoBookOutline,
  IoMusicalNotesOutline,
  IoCheckmarkCircleOutline,
  IoSchoolOutline,
  IoLayersOutline,
} from 'react-icons/io5';

import styles from './CreateQuestionsWithPassage.module.scss';

const cx = classNames.bind(styles);

const CreateQuestionsWithPassage = () => {
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

  const [examTypes, setExamTypes] = useState([]);
  const [examParts, setExamParts] = useState([]);
  const [classes, setClasses] = useState([]);

  const [formData, setFormData] = useState({
    classId: '',
    examTypeId: '',
    examPartId: '',
    passage: {
      passageType: 'READING',
      content: '',
      mediaFile: null,
    },
    questions: [JSON.parse(JSON.stringify(initialQuestion))],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  /* ================== LOAD DATA ================== */
  useEffect(() => {
    axios.get('/api/classes/my')
      .then(res => setClasses(Array.isArray(res.data) ? res.data : []))
      .catch(console.error);

    axios.get('/api/exam-types')
      .then(res => setExamTypes(res.data || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!formData.examTypeId) return;
    axios
      .get(`/api/exam-parts/by-exam-type/${formData.examTypeId}`)
      .then(res => setExamParts(res.data || []))
      .catch(console.error);
  }, [formData.examTypeId]);

  /* ================== HANDLERS ================== */
  const handlePassageChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      passage: { ...prev.passage, [field]: value },
    }));
  };

  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, JSON.parse(JSON.stringify(initialQuestion))],
    }));
  };

  const removeQuestion = (index) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const handleQuestionChange = (qIndex, field, value) => {
    const updated = [...formData.questions];
    updated[qIndex][field] = value;
    setFormData({ ...formData, questions: updated });
  };

  const handleOptionChange = (qIndex, oIndex, field, value) => {
    const updated = [...formData.questions];
    updated[qIndex].options[oIndex][field] = value;
    setFormData({ ...formData, questions: updated });
  };

  /* ================== SUBMIT ================== */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage('');

    try {
      const hasPassage =
        formData.passage.content?.trim() !== '' ||
        (formData.passage.passageType === 'LISTENING' &&
          formData.passage.mediaFile);

      const payload = {
        examPartId: Number(formData.examPartId),
        classId: formData.classId ? Number(formData.classId) : null,
        chapterId: null,
        passage: hasPassage
          ? {
            passageType: formData.passage.passageType,
            content: formData.passage.content,
          }
          : null,
        questions: formData.questions.map(q => ({
          questionType: q.questionType,
          questionText: q.questionText,
          answers: q.options.map(opt => ({
            label: opt.label,
            answerText: opt.content,
            isCorrect: opt.isCorrect,
          })),
        })),
      };

      const formDataToSend = new FormData();
      formDataToSend.append('request', JSON.stringify(payload));

      if (
        hasPassage &&
        formData.passage.passageType === 'LISTENING' &&
        formData.passage.mediaFile
      ) {
        formDataToSend.append('audio', formData.passage.mediaFile);
      }

      await axios.post('/api/questions/bulk-with-passage', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setStatusMessage('SUCCESS');
      toast.success('🎉 Đã lưu vào ngân hàng câu hỏi!');
    } catch (err) {
      console.error(err);
      setStatusMessage('ERROR');
      toast.error('❌ Lỗi khi lưu, vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ================== RENDER ================== */
  return (
    <div className={cx('wrapper')}>
      <Container>
        <div className={cx('header')}>
          <h1>Tạo Nhóm Câu Hỏi</h1>
          <p>Xây dựng ngân hàng câu hỏi theo Passage / Skill</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* ===== Classification ===== */}
          <div className={cx('form-card')}>
            <div className={cx('section-title')}>
              <IoSchoolOutline /> Phân loại
            </div>
            <Row className="g-4">
              <Col md={4}>
                <label className={cx('label-modern')}>Lớp</label>
                <select
                  className={cx('input-modern')}
                  value={formData.classId}
                  onChange={e => setFormData({ ...formData, classId: e.target.value })}
                >
                  <option value="">-- Chọn lớp --</option>
                  {classes.map(c => (
                    <option key={c.classId} value={c.classId}>{c.className}</option>
                  ))}
                </select>
              </Col>

              <Col md={4}>
                <label className={cx('label-modern')}>Kỳ thi</label>
                <select
                  className={cx('input-modern')}
                  value={formData.examTypeId}
                  onChange={e => setFormData({ ...formData, examTypeId: e.target.value })}
                >
                  <option value="">-- Chọn --</option>
                  {examTypes.map(et => (
                    <option key={et.examTypeId} value={et.examTypeId}>{et.name}</option>
                  ))}
                </select>
              </Col>

              <Col md={4}>
                <label className={cx('label-modern')}>Part</label>
                <select
                  className={cx('input-modern')}
                  value={formData.examPartId}
                  onChange={e => setFormData({ ...formData, examPartId: e.target.value })}
                >
                  <option value="">-- Chọn --</option>
                  {examParts.map(p => (
                    <option key={p.examPartId} value={p.examPartId}>{p.name}</option>
                  ))}
                </select>
              </Col>
            </Row>
          </div>

          {/* ===== Passage ===== */}
          <div className={cx('form-card')}>
            <div className={cx('section-title')}>
              <IoBookOutline /> Passage
            </div>

            <Row className="g-4">
              <Col md={4}>
                <label className={cx('label-modern')}>Loại</label>
                <select
                  className={cx('input-modern')}
                  value={formData.passage.passageType}
                  onChange={e => handlePassageChange('passageType', e.target.value)}
                >
                  <option value="READING">Reading</option>
                  <option value="LISTENING">Listening</option>
                </select>
              </Col>

              <Col md={12}>
                <textarea
                  className={cx('input-modern')}
                  rows={6}
                  placeholder="Nội dung passage"
                  value={formData.passage.content}
                  onChange={e => handlePassageChange('content', e.target.value)}
                />
              </Col>

              {formData.passage.passageType === 'LISTENING' && (
                <Col md={12}>
                  <label className={cx('label-modern')}>
                    <IoMusicalNotesOutline /> Audio
                  </label>
                  <input
                    type="file"
                    accept="audio/*"
                    className={cx('input-modern')}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        passage: { ...formData.passage, mediaFile: e.target.files[0] },
                      })
                    }
                  />
                </Col>
              )}
            </Row>
          </div>

          {/* ===== Questions ===== */}
          <div className={cx('section-title')}>
            <IoLayersOutline /> Câu hỏi
          </div>

          {formData.questions.map((q, qIndex) => (
            <div key={qIndex} className={cx('question-card')}>
              <div className="d-flex justify-content-between mb-2">
                <strong>Câu {qIndex + 1}</strong>
                <button
                  type="button"
                  className="btn btn-link text-danger"
                  onClick={() => removeQuestion(qIndex)}
                >
                  <IoTrashOutline />
                </button>
              </div>

              <textarea
                className={cx('input-modern')}
                rows={2}
                placeholder="Nội dung câu hỏi"
                value={q.questionText}
                onChange={e => handleQuestionChange(qIndex, 'questionText', e.target.value)}
              />

              <Row className="g-3 mt-2">
                {q.options.map((o, oIndex) => (
                  <Col md={6} key={oIndex}>
                    <input
                      type="checkbox"
                      checked={o.isCorrect}
                      onChange={e =>
                        handleOptionChange(qIndex, oIndex, 'isCorrect', e.target.checked)
                      }
                    />
                    <span className="mx-2">{o.label}</span>
                    <input
                      type="text"
                      className={cx('input-modern')}
                      value={o.content}
                      onChange={e =>
                        handleOptionChange(qIndex, oIndex, 'content', e.target.value)
                      }
                    />
                  </Col>
                ))}
              </Row>
            </div>
          ))}

          <button type="button" className={cx('btn-add-ghost')} onClick={addQuestion}>
            <IoAdd /> Thêm câu hỏi
          </button>

          {statusMessage === 'SUCCESS' && (
            <Alert variant="success" className="mt-3 text-center">
              🎉 Đã lưu vào ngân hàng câu hỏi
            </Alert>
          )}
          {statusMessage === 'ERROR' && (
            <Alert variant="danger" className="mt-3 text-center">
              ❌ Lỗi khi lưu
            </Alert>
          )}

          <button
            type="submit"
            className={cx('btn-submit-large')}
            disabled={isSubmitting}
          >
            {isSubmitting ? <Spinner size="sm" /> : (
              <>
                <IoCheckmarkCircleOutline /> Lưu vào kho
              </>
            )}
          </button>
        </form>
      </Container>
    </div>
  );
};

export default CreateQuestionsWithPassage;
