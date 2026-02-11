import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import classNames from 'classnames/bind';
import {
    IoAdd,
    IoTrashOutline,
    IoCheckmarkCircleOutline,
    IoLayersOutline,
    IoSchoolOutline,
    IoMusicalNotesOutline
} from 'react-icons/io5';

import styles from '../CreateQuestionsWithPassage.module.scss';
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
            const formData = new FormData();

            const payload = {
                examPartId: Number(form.examPartId),
                classId: form.classId ? Number(form.classId) : null,
                chapterId: form.chapterId ? Number(form.chapterId) : null,
                questions: form.questions.map(q => ({
                    questionType: q.questionType,
                    questionText: q.questionText,
                    passage: q.audioFile ? { passageType: "LISTENING", content: "" } : null,
                    answers: q.options.map(o => ({
                        answerLabel: o.answerLabel,
                        answerText: o.content,
                        isCorrect: o.isCorrect,
                    })),
                })),
            };

            formData.append("data", JSON.stringify(payload));

            // Append audio files
            form.questions.forEach((q, index) => {
                if (q.audioFile) {
                    formData.append("audioFiles", q.audioFile);
                }
            });

            await axios.post('/api/questions/bulk-independent-with-audio', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setStatus('SUCCESS');
            toast.success('🎉 Đã lưu câu hỏi vào kho!');
        } catch (err) {
            console.error(err);
            setStatus('ERROR');
            toast.error('❌ Có lỗi xảy ra, vui lòng thử lại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={cx('wrapper')}>
            <Container>
                <div className={cx('header')}>
                    <h1>Premium Bulk Question Creator</h1>
                    <p>Hệ thống tạo câu hỏi hàng loạt hỗ trợ Audio và Media chuyên nghiệp</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* ===== Classification ===== */}
                    <div className={cx('form-card')}>
                        <div className={cx('section-title')}>
                            <IoSchoolOutline /> Cấu trúc & Phân loại
                        </div>
                        <Row className="g-4">
                            <Col md={4}>
                                <label className="fw-bold mb-1">Loại kỳ thi</label>
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
                                <label className="fw-bold mb-1">Phần thi (Part)</label>
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
                                <label className="fw-bold mb-1">Lớp (Tuỳ chọn)</label>
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
                        <IoLayersOutline /> Danh sách câu hỏi ({form.questions.length})
                    </div>

                    {form.questions.map((q, qIndex) => (
                        <div key={qIndex} className={cx('question-card')}>
                            <div className="d-flex justify-content-between mb-3">
                                <span className="badge bg-primary fs-6">CÂU HỎI #{qIndex + 1}</span>
                                <button
                                    type="button"
                                    className="btn btn-link text-danger p-0"
                                    onClick={() => removeQuestion(qIndex)}
                                >
                                    <IoTrashOutline size={22} />
                                </button>
                            </div>

                            <textarea
                                className={cx('input-modern', 'mb-3')}
                                rows={2}
                                placeholder="Nhập nội dung câu hỏi..."
                                value={q.questionText}
                                onChange={e =>
                                    updateQuestion(qIndex, 'questionText', e.target.value)
                                }
                            />

                            {/* Audio Upload */}
                            <div className="mb-4 p-3 bg-light rounded-3 border">
                                <label className="fw-bold mb-2 d-flex align-items-center gap-2">
                                    <IoMusicalNotesOutline size={20} className="text-primary" />
                                    Tải lên Audio cho câu hỏi này
                                </label>
                                <input
                                    type="file"
                                    accept="audio/*"
                                    className={cx('input-modern')}
                                    onChange={e =>
                                        updateQuestion(qIndex, 'audioFile', e.target.files[0])
                                    }
                                />
                                {q.audioFile && (
                                    <div className="mt-3">
                                        <audio controls style={{ width: '100%' }} src={URL.createObjectURL(q.audioFile)} />
                                    </div>
                                )}
                            </div>

                            <Row className="g-3">
                                {q.options.map((o, oIndex) => (
                                    <Col md={6} key={oIndex}>
                                        <div className={cx('option-row', 'd-flex align-items-center gap-3')}>
                                            <input
                                                type="checkbox"
                                                className={cx('check-box')}
                                                style={{ width: '20px', height: '20px' }}
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
                                            <b className="fs-5">{o.answerLabel || o.label}.</b>
                                            <input
                                                type="text"
                                                className={cx('input-modern')}
                                                placeholder={`Đáp án ${o.answerLabel || o.label}`}
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

                    <div className="mt-4 mb-5">
                        <button
                            type="button"
                            className={cx('btn-add-ghost')}
                            onClick={addQuestion}
                            style={{ width: '100%', borderStyle: 'dashed' }}
                        >
                            <IoAdd size={24} /> Thêm câu hỏi mới
                        </button>
                    </div>

                    {status === 'SUCCESS' && (
                        <Alert variant="success" className="mt-4 text-center py-3">
                            <IoCheckmarkCircleOutline size={24} className="me-2" />
                            <b>Thành công!</b> Tất cả câu hỏi đã được lưu vào kho dữ liệu.
                        </Alert>
                    )}
                    {status === 'ERROR' && (
                        <Alert variant="danger" className="mt-4 text-center py-3">
                            ❌ <b>Lỗi!</b> Có sự cố xảy ra khi lưu dữ liệu. Vui lòng kiểm tra lại.
                        </Alert>
                    )}

                    <div className="sticky-bottom bg-white py-3 border-top mt-5" style={{ zIndex: 100 }}>
                        <button
                            type="submit"
                            className={cx('btn-submit-large')}
                            disabled={loading}
                            style={{ width: '100%', height: '60px', fontSize: '1.8rem' }}
                        >
                            {loading ? (
                                <Spinner animation="border" size="sm" />
                            ) : (
                                <>
                                    <IoCheckmarkCircleOutline size={26} />
                                    Xác nhận & Lưu {form.questions.length} câu hỏi vào kho
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </Container>
        </div>
    );
};

export default PremiumBulkQuestionCreator;
