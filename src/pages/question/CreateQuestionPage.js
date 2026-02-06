import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import classNames from 'classnames/bind';
import {
    IoAdd,
    IoTrashOutline,
    IoBookOutline,
    IoMusicalNotesOutline,
    IoCheckmarkCircleOutline,
    IoDocumentTextOutline,
    IoSchoolOutline,
    IoLayersOutline,
    IoCloudUploadOutline,
    IoVolumeHighOutline
} from 'react-icons/io5';

import styles from './CreateQuestionPage.module.scss';

const cx = classNames.bind(styles);

const QuestionGroupCreationForm = () => {
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
        passage: { passageType: 'READING', content: '', mediaFile: null },
        questions: [JSON.parse(JSON.stringify(initialQuestion))],
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    useEffect(() => {
        axios.get('/api/classes/my')
            .then((res) => setClasses(Array.isArray(res.data) ? res.data : (res.data.classes || [])))
            .catch((err) => console.error(err));

        axios.get('/api/exam-types')
            .then((res) => setExamTypes(res.data || []))
            .catch((err) => console.error(err));
    }, []);

    useEffect(() => {
        if (!formData.examTypeId) return;
        axios.get(`/api/exam-parts/by-exam-type/${formData.examTypeId}`)
            .then((res) => setExamParts(res.data || []))
            .catch((err) => console.error(err));
    }, [formData.examTypeId]);

    const handlePassageChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            passage: { ...prev.passage, [field]: value },
        }));
    };

    const addQuestion = () => {
        setFormData((prev) => ({
            ...prev,
            questions: [...prev.questions, JSON.parse(JSON.stringify(initialQuestion))],
        }));
    };

    const removeQuestion = (index) => {
        setFormData((prev) => ({
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatusMessage('');

        const hasPassageContent = formData.passage.content?.trim() !== '' || (formData.passage.passageType === 'LISTENING' && formData.passage.mediaFile);

        const payload = {
            classId: formData.classId ? parseInt(formData.classId) : null,
            examPartId: parseInt(formData.examPartId),
            questions: formData.questions.map((q) => ({
                questionType: q.questionType,
                questionText: q.questionText,
                answers: q.options.map((opt) => ({
                    label: opt.label,
                    answerText: opt.content,
                    isCorrect: opt.isCorrect,
                })),
            })),
        };

        if (hasPassageContent) {
            payload.passage = {
                passageType: formData.passage.passageType,
                content: formData.passage.content,
            };
        }

        const sendData = new FormData();
        sendData.append('data', JSON.stringify(payload));
        if (hasPassageContent && formData.passage.passageType === 'LISTENING' && formData.passage.mediaFile) {
            sendData.append('audioFile', formData.passage.mediaFile);
        }

        try {
            await axios.post('/api/questions/create-with-passage', sendData, {
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
                    <h1>Tạo Nhóm Câu Hỏi</h1>
                    <p>Xây dựng ngân hàng câu hỏi thông minh theo từng Passage hoặc Skill</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* --- Classification Card --- */}
                    <div className={cx('form-card')}>
                        <div className={cx('section-title')}>
                            <IoSchoolOutline /> Phân loại & Cấu trúc
                        </div>
                        <Row className="g-4">
                            <Col md={4}>
                                <label className={cx('label-modern')}>Lớp học mục tiêu</label>
                                <select className={cx('input-modern')} value={formData.classId} onChange={(e) => setFormData({ ...formData, classId: e.target.value })}>
                                    <option value="">-- Chọn lớp học --</option>
                                    {classes.map(c => <option key={c.classId} value={c.classId}>{c.className}</option>)}
                                </select>
                            </Col>
                            <Col md={4}>
                                <label className={cx('label-modern')}>Loại kỳ thi</label>
                                <select className={cx('input-modern')} value={formData.examTypeId} onChange={(e) => setFormData({ ...formData, examTypeId: e.target.value })}>
                                    <option value="">-- Chọn loại kỳ thi --</option>
                                    {examTypes.map(et => <option key={et.examTypeId} value={et.examTypeId}>{et.name}</option>)}
                                </select>
                            </Col>
                            <Col md={4}>
                                <label className={cx('label-modern')}>Phần thi (Part)</label>
                                <select className={cx('input-modern')} value={formData.examPartId} onChange={(e) => setFormData({ ...formData, examPartId: e.target.value })}>
                                    <option value="">-- Chọn phần thi --</option>
                                    {examParts.map(p => <option key={p.examPartId} value={p.examPartId}>{p.name}</option>)}
                                </select>
                            </Col>
                        </Row>
                    </div>

                    {/* --- Passage Card --- */}
                    <div className={cx('form-card')}>
                        <div className={cx('section-title')}>
                            <IoBookOutline /> Nội dung bài đọc / Nghe (Passage)
                        </div>
                        <div className={cx('passage-box')}>
                            <Row className="g-4">
                                <Col md={4}>
                                    <label className={cx('label-modern')}>Loại Passage</label>
                                    <select className={cx('input-modern')} value={formData.passage.passageType} onChange={(e) => handlePassageChange('passageType', e.target.value)}>
                                        <option value="READING">Reading (Văn bản)</option>
                                        <option value="LISTENING">Listening (Âm thanh)</option>
                                    </select>
                                </Col>
                                <Col md={12}>
                                    <label className={cx('label-modern')}>Nội dung đoạn văn / Script</label>
                                    <textarea className={cx('input-modern')} rows={6} value={formData.passage.content} onChange={(e) => handlePassageChange('content', e.target.value)} placeholder="Nhập văn bản bài đọc hoặc script audio..." />
                                </Col>
                                {formData.passage.passageType === 'LISTENING' && (
                                    <Col md={12}>
                                        <div className="p-3 bg-white rounded-3 border">
                                            <label className={cx('label-modern')}><IoMusicalNotesOutline /> Tải lên Audio</label>
                                            <input type="file" className={cx('input-modern')} accept="audio/*" onChange={(e) => setFormData({ ...formData, passage: { ...formData.passage, mediaFile: e.target.files[0] } })} />
                                            {formData.passage.mediaFile && (
                                                <div className="mt-3 d-flex align-items-center gap-3">
                                                    <audio controls src={URL.createObjectURL(formData.passage.mediaFile)} className="flex-grow-1" />
                                                    <button type="button" className="btn btn-outline-danger" onClick={() => setFormData({ ...formData, passage: { ...formData.passage, mediaFile: null } })}><IoTrashOutline /></button>
                                                </div>
                                            )}
                                        </div>
                                    </Col>
                                )}
                            </Row>
                        </div>
                    </div>

                    {/* --- Questions Area --- */}
                    <div className={cx('section-title')}>
                        <IoLayersOutline /> Danh sách câu hỏi kèm theo
                    </div>
                    {formData.questions.map((q, qIndex) => (
                        <div key={qIndex} className={cx('question-card')}>
                            <div className="d-flex justify-content-between mb-3">
                                <span className="badge bg-primary fs-5">Câu #{qIndex + 1}</span>
                                <button type="button" className="btn btn-link text-danger p-0" onClick={() => removeQuestion(qIndex)}><IoTrashOutline size={20} /></button>
                            </div>
                            <textarea className={cx('input-modern', 'mb-4')} rows={2} value={q.questionText} onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)} placeholder="Nhập nội dung câu hỏi..." />

                            <Row className="g-3">
                                {q.options.map((o, oIndex) => (
                                    <Col md={6} key={oIndex} className={cx('option-row')}>
                                        <input type="checkbox" className={cx('check-box')} checked={o.isCorrect} onChange={(e) => handleOptionChange(qIndex, oIndex, 'isCorrect', e.target.checked)} />
                                        <span className={cx('choice-label')}>{o.label}</span>
                                        <input type="text" className={cx('input-modern')} value={o.content} onChange={(e) => handleOptionChange(qIndex, oIndex, 'content', e.target.value)} placeholder="Nhập đáp án..." />
                                    </Col>
                                ))}
                            </Row>
                        </div>
                    ))}

                    <button type="button" className={cx('btn-add-ghost')} onClick={addQuestion}>
                        <IoAdd /> Thêm câu hỏi mới vào nhóm này
                    </button>

                    {statusMessage === 'SUCCESS' && <Alert variant="success" className="mt-4 text-center">🎉 Đã lưu nhóm câu hỏi vào ngân hàng!</Alert>}
                    {statusMessage === 'ERROR' && <Alert variant="danger" className="mt-4 text-center">❌ Lỗi khi lưu, vui lòng thử lại!</Alert>}

                    <button type="submit" className={cx('btn-submit-large')} disabled={isSubmitting}>
                        {isSubmitting ? <Spinner size="sm" /> : <><IoCheckmarkCircleOutline size={22} /> Lưu vào ngân hàng câu hỏi</>}
                    </button>
                </form>
            </Container>
        </div>
    );
};

export default QuestionGroupCreationForm;