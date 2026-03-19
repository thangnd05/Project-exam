import React, { useState, useEffect } from 'react';
import { Modal, Button, Spinner, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import classNames from 'classnames/bind';
import { IoCheckmarkCircleOutline, IoCloseOutline } from 'react-icons/io5';
import styles from './EditQuestionModal.module.scss';

const cx = classNames.bind(styles);

const EditQuestionModal = ({ show, onHide, questionId, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [examParts, setExamParts] = useState([]);
    const [classes, setClasses] = useState([]);

    const [formData, setFormData] = useState({
        classId: '',
        examPartId: '',
        questionType: 'MCQ',
        questionText: '',
        isBank: true,
        passage: {
            passageType: 'READING',
            content: '',
            mediaUrl: ''
        },
        options: [
            { id: null, answerLabel: 'A', content: '', isCorrect: false },
            { id: null, answerLabel: 'B', content: '', isCorrect: false },
            { id: null, answerLabel: 'C', content: '', isCorrect: false },
            { id: null, answerLabel: 'D', content: '', isCorrect: false }
        ]
    });

    useEffect(() => {
        if (show) {
            fetchMetadata();
            if (questionId) {
                fetchQuestionDetails(questionId);
            }
        }
    }, [show, questionId]);

    const fetchMetadata = async () => {
        try {
            const classRes = await axios.get('/api/classes/my');
            setClasses(Array.isArray(classRes.data) ? classRes.data : (classRes.data?.classes || []));
            // You may want to fetch exam parts too if not already available, this can be fetched based on type if needed
        } catch (error) {
            console.error('Failed to load metadata', error);
        }
    };

    const fetchQuestionDetails = async (id) => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/questions/${id}`);
            const questionDetail = res.data;

            // map answers
            const mappedOptions = [
                { id: null, answerLabel: 'A', content: '', isCorrect: false },
                { id: null, answerLabel: 'B', content: '', isCorrect: false },
                { id: null, answerLabel: 'C', content: '', isCorrect: false },
                { id: null, answerLabel: 'D', content: '', isCorrect: false }
            ];

            if (questionDetail.answers && questionDetail.answers.length > 0) {
                questionDetail.answers.forEach((ans, index) => {
                    if (index < 4) {
                        mappedOptions[index] = {
                            id: ans.answerId || ans.id,
                            answerLabel: ans.answerLabel,
                            content: ans.answerText || ans.content || '',
                            isCorrect: ans.isCorrect
                        };
                    }
                });
            }

            setFormData({
                classId: questionDetail.classId || '',
                examPartId: questionDetail.examPartId || '',
                questionType: questionDetail.questionType || 'MCQ',
                questionText: questionDetail.questionText || '',
                isBank: questionDetail.isBank !== undefined ? questionDetail.isBank : true,
                passage: questionDetail.passage ? {
                    passageType: questionDetail.passage.passageType || 'READING',
                    content: questionDetail.passage.content || '',
                    mediaUrl: questionDetail.passage.mediaUrl || ''
                } : { passageType: 'READING', content: '', mediaUrl: '' },
                options: mappedOptions
            });
        } catch (error) {
            toast.error('Không thể tải dữ liệu câu hỏi');
            onHide();
        } finally {
            setLoading(false);
        }
    };

    const handlePassageChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            passage: { ...prev.passage, [field]: value }
        }));
    };

    const handleOptionChange = (idx, field, value) => {
        const updated = [...formData.options];
        updated[idx][field] = value;
        setFormData({ ...formData, options: updated });
    };

    const handleSave = async () => {
        if (!formData.questionText?.trim()) {
            toast.warning('Vui lòng nhập nội dung câu hỏi');
            return;
        }

        setSaving(true);
        
        const payload = {
            classId: formData.classId ? parseInt(formData.classId) : null,
            examPartId: formData.examPartId ? parseInt(formData.examPartId) : null,
            chapterId: null,
            questionType: formData.questionType,
            questionText: formData.questionText,
            isBank: formData.isBank,
            answers: formData.options.map((opt) => ({
                id: opt.id,
                answerLabel: opt.answerLabel,
                answerText: opt.content,
                isCorrect: opt.isCorrect,
            }))
        };

        const hasPassage = formData.passage.content?.trim() !== '' || formData.passage.mediaUrl?.trim() !== '';
        if (hasPassage) {
            payload.passage = {
                passageType: formData.passage.passageType,
                content: formData.passage.content,
                mediaUrl: formData.passage.mediaUrl
            };
        }

        try {
            await axios.put(`/api/questions/${questionId}`, payload, {
                headers: { 'Content-Type': 'application/json' }
            });
            toast.success('Cập nhật câu hỏi thành công!');
            onSuccess();
        } catch (error) {
            const msg = error.response?.data?.message ?? error.message;
            toast.error(`Lỗi khi cập nhật: ${msg}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" backdrop="static" centered className={cx('modalWrapper')}>
            <Modal.Header closeButton>
                <Modal.Title className={cx('modalTitle')}>Cập nhật câu hỏi</Modal.Title>
            </Modal.Header>
            <Modal.Body className={cx('modalBody')}>
                {loading ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-2 text-muted">Đang tải dữ liệu...</p>
                    </div>
                ) : (
                    <div className={cx('formGroup')}>
                        <Row className="g-3">
                            <Col md={12}>
                                <label className={cx('formLabel')}>Nội dung câu hỏi</label>
                                <textarea
                                    className={cx('formControl')}
                                    rows={3}
                                    value={formData.questionText}
                                    onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                                />
                            </Col>

                            <Col md={12}>
                                <div className={cx('sectionTitle')}>Tùy chọn đoạn văn / Audio (Passage)</div>
                            </Col>
                            <Col md={4}>
                                <label className={cx('formLabel')}>Loại Passage</label>
                                <select 
                                    className={cx('formControl')}
                                    value={formData.passage.passageType}
                                    onChange={(e) => handlePassageChange('passageType', e.target.value)}
                                >
                                    <option value="READING">Reading (Văn bản)</option>
                                    <option value="LISTENING">Listening (Âm thanh)</option>
                                </select>
                            </Col>
                            <Col md={8}>
                                <label className={cx('formLabel')}>Đường dẫn Audio/Media (nếu có)</label>
                                <input 
                                    type="text" 
                                    className={cx('formControl')}
                                    placeholder="https://.../audio.mp3"
                                    value={formData.passage.mediaUrl}
                                    onChange={(e) => handlePassageChange('mediaUrl', e.target.value)}
                                    disabled={formData.passage.passageType === 'READING'}
                                />
                            </Col>
                            <Col md={12}>
                                <label className={cx('formLabel')}>Nội dung Passage</label>
                                <textarea
                                    className={cx('formControl')}
                                    rows={4}
                                    value={formData.passage.content}
                                    onChange={(e) => handlePassageChange('content', e.target.value)}
                                    placeholder="Văn bản bài đọc / Script..."
                                />
                            </Col>

                            <Col md={12}>
                                <div className={cx('sectionTitle')}>Đáp án</div>
                            </Col>
                            {formData.options.map((opt, idx) => (
                                <Col md={6} key={idx} className="mb-2">
                                    <div className="d-flex align-items-center gap-2">
                                        <input 
                                            type="checkbox" 
                                            checked={opt.isCorrect} 
                                            onChange={(e) => handleOptionChange(idx, 'isCorrect', e.target.checked)}
                                        />
                                        <span className="fw-bold">{opt.answerLabel}</span>
                                        <input 
                                            type="text" 
                                            className={cx('formControl')} 
                                            value={opt.content}
                                            onChange={(e) => handleOptionChange(idx, 'content', e.target.value)}
                                            placeholder={`Nội dung ${opt.answerLabel}...`}
                                        />
                                    </div>
                                </Col>
                            ))}
                        </Row>
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide} disabled={saving}>
                    <IoCloseOutline size={20} className="me-1" /> Hủy
                </Button>
                <Button variant="primary" onClick={handleSave} disabled={saving || loading}>
                    {saving ? <Spinner size="sm" /> : <IoCheckmarkCircleOutline size={20} className="me-1" />}
                    Lưu cập nhật
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default EditQuestionModal;
