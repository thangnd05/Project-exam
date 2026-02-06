import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import classNames from 'classnames/bind';
import {
    IoAdd,
    IoTrashOutline,
    IoCheckmarkCircleOutline,
    IoLayersOutline,
    IoSchoolOutline,
} from 'react-icons/io5';

import styles from '../CreateQuestionsWithPassage.module.scss';
const cx = classNames.bind(styles);

const emptyQuestion = {
    questionType: 'MCQ',
    questionText: '',
    options: [
        { label: 'A', content: '', isCorrect: false },
        { label: 'B', content: '', isCorrect: false },
        { label: 'C', content: '', isCorrect: false },
        { label: 'D', content: '', isCorrect: false },
    ],
};

const CreateBulkQuestionsToBank = () => {
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
    const [status, setStatus] = useState(null); // SUCCESS | ERROR

    // ===== Load base data =====
    useEffect(() => {
        axios.get('/api/exam-types').then(res => setExamTypes(res.data || []));
        axios.get('/api/classes/my').then(res => setClasses(res.data || []));
    }, []);

    useEffect(() => {
        if (!form.examTypeId) return;
        axios
            .get(`/api/exam-parts/by-exam-type/${form.examTypeId}`)
            .then(res => setExamParts(res.data || []));
    }, [form.examTypeId]);

    // ===== Question handlers =====
    const addQuestion = () => {
        setForm(prev => ({
            ...prev,
            questions: [...prev.questions, JSON.parse(JSON.stringify(emptyQuestion))],
        }));
    };

    const removeQuestion = index => {
        setForm(prev => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== index),
        }));
    };

    const updateQuestion = (qIndex, field, value) => {
        const updated = [...form.questions];
        updated[qIndex][field] = value;
        setForm({ ...form, questions: updated });
    };

    const updateOption = (qIndex, oIndex, field, value) => {
        const updated = [...form.questions];
        updated[qIndex].options[oIndex][field] = value;
        setForm({ ...form, questions: updated });
    };

    // ===== Submit =====
    const handleSubmit = async e => {
        e.preventDefault();
        setLoading(true);
        setStatus(null);

        try {
            const payload = {
                examPartId: Number(form.examPartId),
                classId: form.classId ? Number(form.classId) : null,
                chapterId: form.chapterId ? Number(form.chapterId) : null,
                questions: form.questions.map(q => ({
                    questionType: q.questionType,
                    questionText: q.questionText,
                    answers: q.options.map(o => ({
                        label: o.label,
                        answerText: o.content,
                        isCorrect: o.isCorrect,
                    })),
                })),
            };

            await axios.post('/api/questions/bulk', payload);
            setStatus('SUCCESS');
        } catch (err) {
            console.error(err);
            setStatus('ERROR');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={cx('wrapper')}>
            <Container>
                <div className={cx('header')}>
                    <h1>Tạo nhiều câu hỏi vào kho</h1>
                    <p>Tạo nhanh nhiều câu hỏi độc lập (không passage)</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* ===== Classification ===== */}
                    <div className={cx('form-card')}>
                        <div className={cx('section-title')}>
                            <IoSchoolOutline /> Phân loại
                        </div>
                        <Row className="g-4">
                            <Col md={4}>
                                <label>Loại kỳ thi</label>
                                <select
                                    className={cx('input-modern')}
                                    value={form.examTypeId}
                                    onChange={e =>
                                        setForm({ ...form, examTypeId: e.target.value })
                                    }
                                >
                                    <option value="">-- Chọn --</option>
                                    {examTypes.map(et => (
                                        <option key={et.examTypeId} value={et.examTypeId}>
                                            {et.name}
                                        </option>
                                    ))}
                                </select>
                            </Col>

                            <Col md={4}>
                                <label>Phần thi</label>
                                <select
                                    className={cx('input-modern')}
                                    value={form.examPartId}
                                    onChange={e =>
                                        setForm({ ...form, examPartId: e.target.value })
                                    }
                                >
                                    <option value="">-- Chọn --</option>
                                    {examParts.map(p => (
                                        <option key={p.examPartId} value={p.examPartId}>
                                            {p.name}
                                        </option>
                                    ))}
                                </select>
                            </Col>

                            <Col md={4}>
                                <label>Lớp (tuỳ chọn)</label>
                                <select
                                    className={cx('input-modern')}
                                    value={form.classId}
                                    onChange={e =>
                                        setForm({ ...form, classId: e.target.value })
                                    }
                                >
                                    <option value="">-- Không chọn --</option>
                                    {classes.map(c => (
                                        <option key={c.classId} value={c.classId}>
                                            {c.className}
                                        </option>
                                    ))}
                                </select>
                            </Col>
                        </Row>
                    </div>

                    {/* ===== Questions ===== */}
                    <div className={cx('section-title')}>
                        <IoLayersOutline /> Danh sách câu hỏi
                    </div>

                    {form.questions.map((q, qIndex) => (
                        <div key={qIndex} className={cx('question-card')}>
                            <div className="d-flex justify-content-between mb-3">
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
                                className={cx('input-modern', 'mb-3')}
                                rows={2}
                                placeholder="Nội dung câu hỏi"
                                value={q.questionText}
                                onChange={e =>
                                    updateQuestion(qIndex, 'questionText', e.target.value)
                                }
                            />

                            <Row className="g-3">
                                {q.options.map((o, oIndex) => (
                                    <Col md={6} key={oIndex}>
                                        <div className="d-flex align-items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={o.isCorrect}
                                                onChange={e =>
                                                    updateOption(
                                                        qIndex,
                                                        oIndex,
                                                        'isCorrect',
                                                        e.target.checked
                                                    )
                                                }
                                            />
                                            <strong>{o.label}</strong>
                                            <input
                                                type="text"
                                                className={cx('input-modern')}
                                                placeholder="Đáp án"
                                                value={o.content}
                                                onChange={e =>
                                                    updateOption(
                                                        qIndex,
                                                        oIndex,
                                                        'content',
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </div>
                                    </Col>
                                ))}
                            </Row>
                        </div>
                    ))}

                    <button
                        type="button"
                        className={cx('btn-add-ghost')}
                        onClick={addQuestion}
                    >
                        <IoAdd /> Thêm câu hỏi
                    </button>

                    {status === 'SUCCESS' && (
                        <Alert variant="success" className="mt-4">
                            🎉 Đã lưu câu hỏi vào kho!
                        </Alert>
                    )}
                    {status === 'ERROR' && (
                        <Alert variant="danger" className="mt-4">
                            ❌ Có lỗi xảy ra, vui lòng thử lại
                        </Alert>
                    )}

                    <button
                        type="submit"
                        className={cx('btn-submit-large')}
                        disabled={loading}
                    >
                        {loading ? (
                            <Spinner size="sm" />
                        ) : (
                            <>
                                <IoCheckmarkCircleOutline size={22} /> Lưu vào kho
                            </>
                        )}
                    </button>
                </form>
            </Container>
        </div>
    );
};

export default CreateBulkQuestionsToBank;
