import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Row, Col, Spinner, Button } from 'react-bootstrap';
import classNames from 'classnames/bind';
import { toast } from 'react-toastify';
import {
  IoCheckmarkCircleOutline,
  IoLayersOutline,
  IoSettingsOutline,
  IoSchoolOutline,
  IoBookOutline,
  IoMusicalNotesOutline,
} from 'react-icons/io5';
import { Trash, PlusCircle } from 'lucide-react';

import styles from './PremiumBulkQuestionCreator.module.scss';

const cx = classNames.bind(styles);

const emptyQuestion = {
  questionType: 'MCQ',
  questionText: '',
  audioFile: null,
  options: [
    { answerLabel: 'A', content: '', isCorrect: false },
    { answerLabel: 'B', content: '', isCorrect: false },
    { answerLabel: 'C', content: '', isCorrect: false },
    { answerLabel: 'D', content: '', isCorrect: false },
  ],
};

const PremiumBulkQuestionCreator = () => {
  const [examTypes, setExamTypes] = useState([]);
  const [examParts, setExamParts] = useState([]);
  const [classes, setClasses] = useState([]);

  const [form, setForm] = useState({
    examTypeId: '',
    examPartId: '',
    classId: '',
    chapterId: '',
    questions: [JSON.parse(JSON.stringify(emptyQuestion))],
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get('/api/exam-types').then((res) => setExamTypes(res.data || []));
    axios.get('/api/classes/my').then((res) => {
      const data = Array.isArray(res.data) ? res.data : res.data?.classes || [];
      setClasses(data);
    });
  }, []);

  useEffect(() => {
    if (!form.examTypeId) {
      setExamParts([]);
      setForm((prev) => ({ ...prev, examPartId: '' }));
      return;
    }
    axios.get(`/api/exam-parts/by-exam-type/${form.examTypeId}`).then((res) => setExamParts(res.data || []));
  }, [form.examTypeId]);

  const addQuestion = () => {
    setForm((prev) => ({
      ...prev,
      questions: [...prev.questions, JSON.parse(JSON.stringify(emptyQuestion))],
    }));
  };

  const removeQuestion = (index) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const updateQuestion = (qIndex, field, value) => {
    const updated = [...form.questions];
    updated[qIndex] = { ...updated[qIndex], [field]: value };
    setForm({ ...form, questions: updated });
  };

  const updateOption = (qIndex, oIndex, field, value) => {
    const updated = [...form.questions];
    if (field === 'isCorrect' && value) {
      updated[qIndex].options = updated[qIndex].options.map((o, i) => ({
        ...o,
        isCorrect: i === oIndex,
      }));
    } else {
      updated[qIndex].options[oIndex] = { ...updated[qIndex].options[oIndex], [field]: value };
    }
    setForm({ ...form, questions: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.examPartId) {
      toast.warn('Vui lòng chọn Phần thi (Part)');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        examPartId: Number(form.examPartId),
        classId: form.classId ? Number(form.classId) : null,
        chapterId: form.chapterId ? Number(form.chapterId) : null,
        questions: form.questions.map((q) => ({
          questionType: q.questionType,
          questionText: q.questionText,
          answers: q.options.map((o) => ({
            answerLabel: o.answerLabel,
            answerText: o.content,
            isCorrect: o.isCorrect,
          })),
        })),
      };

      const formData = new FormData();

      // 1. Append JSON payload
      formData.append('request', JSON.stringify(payload));

      // 2. Sửa lại key append audio ở đây để khớp với Backend
      form.questions.forEach((q, index) => {
        if (q.audioFile) {
          // Sửa "audio_" thành "media_${index}_audio"
          // Backend dùng startsWith("media_" + index + "_") nên phải có dấu gạch dưới sau index
          formData.append(`media_${index}_audio`, q.audioFile);
        }
      });

      await axios.post('/api/questions/bulk', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('🎉 Đã lưu câu hỏi vào kho!');

      setForm((prev) => ({
        ...prev,
        questions: [JSON.parse(JSON.stringify(emptyQuestion))],
      }));

    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message ||
        '❌ Có lỗi xảy ra, vui lòng thử lại'
      );
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className={cx('wrapper')}>
      <div className={cx('container')}>
        <div className={cx('header')}>
          <h1 className={cx('title')}>
            <IoLayersOutline /> Premium Bulk Question Creator
          </h1>
          <p className={cx('subtitle')}>
            Hệ thống tạo câu hỏi hàng loạt hỗ trợ Audio và Media chuyên nghiệp
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 1. Thông tin chung */}
          <div className={cx('configCard')}>
            <div className={cx('sectionTitle')}>
              <IoSettingsOutline /> 1. Thông tin chung
            </div>
            <Row className="g-3">
              <Col md={4}>
                <div className={cx('formGroupModern')}>
                  <label><IoSchoolOutline /> Loại kỳ thi</label>
                  <select
                    className={cx('inputModern')}
                    value={form.examTypeId}
                    onChange={(e) => setForm({ ...form, examTypeId: e.target.value })}
                    aria-label="Loại kỳ thi"
                  >
                    <option value="">-- Chọn kỳ thi --</option>
                    {examTypes.map((et) => (
                      <option key={et.examTypeId} value={et.examTypeId}>{et.name}</option>
                    ))}
                  </select>
                </div>
              </Col>
              <Col md={4}>
                <div className={cx('formGroupModern')}>
                  <label><IoBookOutline /> Phần thi *</label>
                  <select
                    className={cx('inputModern')}
                    value={form.examPartId}
                    onChange={(e) => setForm({ ...form, examPartId: e.target.value })}
                    disabled={!form.examTypeId}
                    aria-label="Phần thi"
                  >
                    <option value="">-- Chọn Part --</option>
                    {examParts.map((p) => (
                      <option key={p.examPartId} value={p.examPartId}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </Col>
              <Col md={4}>
                <div className={cx('formGroupModern')}>
                  <label><IoSchoolOutline /> Lớp học</label>
                  <select
                    className={cx('inputModern')}
                    value={form.classId}
                    onChange={(e) => setForm({ ...form, classId: e.target.value })}
                    aria-label="Lớp học"
                  >
                    <option value="">-- Không chọn --</option>
                    {classes.map((c) => (
                      <option key={c.classId} value={c.classId}>{c.className}</option>
                    ))}
                  </select>
                </div>
              </Col>
            </Row>
          </div>

          {/* 2. Danh sách câu hỏi */}
          <div className={cx('sectionTitle')}>
            <IoLayersOutline /> 2. Danh sách câu hỏi ({form.questions.length})
          </div>

          {form.questions.map((q, qIndex) => (
            <div key={qIndex} className={cx('partBlock')}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <b>Câu hỏi số {qIndex + 1}</b>
                <Button
                  type="button"
                  variant="link"
                  className={cx('removeBtn')}
                  onClick={() => removeQuestion(qIndex)}
                  disabled={form.questions.length === 1}
                  aria-label={`Xóa câu ${qIndex + 1}`}
                >
                  <Trash size={18} />
                </Button>
              </div>

              <input
                className={cx('inputModern', 'mb-3')}
                placeholder="Nhập nội dung câu hỏi..."
                value={q.questionText}
                onChange={(e) => updateQuestion(qIndex, 'questionText', e.target.value)}
              />

              <div className={cx('formGroupModern', 'mb-3')}>
                <label><IoMusicalNotesOutline /> Audio cho câu hỏi này</label>
                <input
                  type="file"
                  accept="audio/*"
                  className={cx('inputModern')}
                  onChange={(e) => updateQuestion(qIndex, 'audioFile', e.target.files?.[0] ?? null)}
                />
                {q.audioFile && (
                  <div className="mt-2">
                    <audio
                      controls
                      src={URL.createObjectURL(q.audioFile)}
                      style={{ width: '100%', maxHeight: 40 }}
                    />
                  </div>
                )}
              </div>

              <Row className="g-2">
                {q.options.map((o, oIndex) => (
                  <Col md={6} key={oIndex}>
                    <div className={cx('answerItem', { correct: o.isCorrect })}>
                      <input
                        type="radio"
                        name={`q-${qIndex}`}
                        checked={o.isCorrect}
                        onChange={() => updateOption(qIndex, oIndex, 'isCorrect', true)}
                        aria-label={`Đáp án ${o.answerLabel}`}
                      />
                      <span className={cx('answerLabel')}>{o.answerLabel}.</span>
                      <input
                        type="text"
                        className={cx('answerInput')}
                        placeholder={`Đáp án ${o.answerLabel}`}
                        value={o.content}
                        onChange={(e) => updateOption(qIndex, oIndex, 'content', e.target.value)}
                      />
                    </div>
                  </Col>
                ))}
              </Row>
            </div>
          ))}

          <button type="button" className={cx('btnSecondary')} onClick={addQuestion}>
            <PlusCircle size={18} /> Thêm câu hỏi
          </button>

          <div className={cx('footer')}>
            <button type="submit" className={cx('btnPrimary')} disabled={loading}>
              {loading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <IoCheckmarkCircleOutline size={22} />
              )}
              {loading ? 'Đang lưu...' : `Xác nhận & Lưu ${form.questions.length} câu hỏi vào kho`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PremiumBulkQuestionCreator;
