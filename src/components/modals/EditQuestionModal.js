import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Spinner, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import classNames from 'classnames/bind';
import { IoCheckmarkCircleOutline, IoCloseOutline, IoCreateOutline } from 'react-icons/io5';
import styles from './EditQuestionModal.module.scss';
import createStyles from './CreateTestModal.module.scss';

const cx = classNames.bind(styles);
const cxCreate = classNames.bind(createStyles);

const ACCEPT_BY_TYPE = {
    LISTENING: 'audio/*',
    READING: 'image/*',
    DOCUMENT:
        '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

const EditQuestionModal = ({ show, onHide, questionId, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [newFiles, setNewFiles] = useState([]);
    const onHideRef = useRef(onHide);

    useEffect(() => {
        onHideRef.current = onHide;
    }, [onHide]);

    const [formData, setFormData] = useState({
        classId: '',
        examPartId: '',
        questionType: 'MCQ',
        questionText: '',
        isBank: true,
        passage: {
            passageType: 'READING',
            content: '',
            mediaUrl: '',
        },
        options: [
            { id: null, answerLabel: 'A', content: '', isCorrect: false },
            { id: null, answerLabel: 'B', content: '', isCorrect: false },
            { id: null, answerLabel: 'C', content: '', isCorrect: false },
            { id: null, answerLabel: 'D', content: '', isCorrect: false },
        ],
    });

    useEffect(() => {
        if (!show || !questionId) return;
        let cancelled = false;
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
                { id: null, answerLabel: 'D', content: '', isCorrect: false },
            ];

            if (questionDetail.answers && questionDetail.answers.length > 0) {
                questionDetail.answers.forEach((ans, index) => {
                    if (index < 4) {
                        mappedOptions[index] = {
                            id: ans.answerId || ans.id,
                            answerLabel: ans.answerLabel,
                            content: ans.answerText || ans.content || '',
                            isCorrect: ans.isCorrect,
                        };
                    }
                });
            }

                if (!cancelled) {
                    setFormData({
                        classId: questionDetail.classId || '',
                        examPartId: questionDetail.examPartId || '',
                        questionType: questionDetail.questionType || 'MCQ',
                        questionText: questionDetail.questionText || '',
                        isBank:
                            questionDetail.isBank !== undefined ? questionDetail.isBank : true,
                        passage: questionDetail.passage
                            ? {
                                passageType: questionDetail.passage.passageType || 'READING',
                                content: questionDetail.passage.content || '',
                                mediaUrl: questionDetail.passage.mediaUrl || '',
                            }
                            : { passageType: 'READING', content: '', mediaUrl: '' },
                        options: mappedOptions,
                    });
                }
            } catch (error) {
                if (!cancelled) {
                    toast.error('Không thể tải dữ liệu câu hỏi');
                    onHideRef.current?.();
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };
        setNewFiles([]);
        fetchQuestionDetails(questionId);
        return () => {
            cancelled = true;
        };
    }, [show, questionId]);

    const handlePassageChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            passage: { ...prev.passage, [field]: value },
        }));
    };

    const handleOptionChange = (idx, field, value) => {
        const updated = [...formData.options];
        if (field === 'isCorrect' && value) {
            for (let i = 0; i < updated.length; i += 1) {
                updated[i] = { ...updated[i], isCorrect: i === idx };
            }
        } else {
            updated[idx] = { ...updated[idx], [field]: value };
        }
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
            })),
        };

        const hasPassage =
            formData.passage.content?.trim() !== '' ||
            formData.passage.mediaUrl?.trim() !== '';
        if (hasPassage) {
            payload.passage = {
                passageType: formData.passage.passageType,
                content: formData.passage.content,
                mediaUrl: formData.passage.mediaUrl,
            };
        }

        try {
            if (newFiles.length > 0) {
                const fd = new FormData();
                fd.append('request', JSON.stringify(payload));
                newFiles.forEach((file, index) => {
                    fd.append(`file${index}`, file);
                });
                await axios.put(`/api/questions/${questionId}`, fd, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            } else {
                await axios.put(`/api/questions/${questionId}`, payload, {
                    headers: { 'Content-Type': 'application/json' },
                });
            }
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
        <Modal
            show={show}
            onHide={onHide}
            size="lg"
            backdrop="static"
            centered
            className={cx('modalWrapper', 'questionModalRoot')}
            backdropClassName={cx('questionBackdrop')}
        >
            <div className={cxCreate('header')}>
                <div className={cxCreate('titleWrapper')}>
                    <IoCreateOutline />
                    <h3 className={cxCreate('title')}>Cập nhật câu hỏi</h3>
                </div>
                <button
                    type="button"
                    className={cxCreate('closeBtn')}
                    onClick={onHide}
                    aria-label="Đóng"
                >
                    <IoCloseOutline />
                </button>
            </div>
            <Modal.Body className={cx('modalBody')}>
                {loading ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-2 text-muted">Đang tải dữ liệu...</p>
                    </div>
                ) : (
                    <div className={cxCreate('partBlock')}>
                        <Row className="g-3">
                            <Col md={12}>
                                <label className={cx('formLabel')}>Nội dung câu hỏi</label>
                                <textarea
                                    className={cxCreate('inputModern')}
                                    rows={3}
                                    value={formData.questionText}
                                    onChange={(e) =>
                                        setFormData({ ...formData, questionText: e.target.value })
                                    }
                                />
                            </Col>

                            <Col md={12}>
                                <div className={cx('sectionTitle')}>
                                    Tùy chọn đoạn văn / Audio (Passage)
                                </div>
                            </Col>
                            <Col md={4}>
                                <label className={cx('formLabel')}>Loại Passage</label>
                                <select
                                    className={cxCreate('inputModern')}
                                    value={formData.passage.passageType}
                                    onChange={(e) =>
                                        handlePassageChange('passageType', e.target.value)
                                    }
                                >
                                    <option value="READING">Đọc (ảnh)</option>
                                    <option value="LISTENING">Nghe (audio)</option>
                                </select>
                            </Col>
                            <Col md={8}>
                                <label className={cx('formLabel')}>
                                    Đường dẫn Audio/Media (nếu có)
                                </label>
                                <input
                                    type="text"
                                    className={cxCreate('inputModern')}
                                    placeholder="https://.../audio.mp3"
                                    value={formData.passage.mediaUrl}
                                    onChange={(e) =>
                                        handlePassageChange('mediaUrl', e.target.value)
                                    }
                                />
                            </Col>
                            <Col md={12}>
                                <label className={cx('formLabel')}>
                                    Upload thêm file (ảnh / audio / tài liệu)
                                </label>
                                <input
                                    type="file"
                                    className={cxCreate('inputModern')}
                                    multiple
                                    accept={ACCEPT_BY_TYPE[formData.passage.passageType] || ACCEPT_BY_TYPE.READING}
                                    onChange={(e) => {
                                        const files = Array.from(e.target.files || []);
                                        setNewFiles(files);
                                    }}
                                />
                                {newFiles.length > 0 && (
                                    <small className="text-muted d-block mt-1">
                                        Đã chọn {newFiles.length} file mới để append vào passage_media.
                                    </small>
                                )}
                            </Col>
                            <Col md={12}>
                                <label className={cx('formLabel')}>Nội dung Passage</label>
                                <textarea
                                    className={cxCreate('inputModern')}
                                    rows={4}
                                    value={formData.passage.content}
                                    onChange={(e) =>
                                        handlePassageChange('content', e.target.value)
                                    }
                                    placeholder="Văn bản bài đọc / Script..."
                                />
                            </Col>

                            <Col md={12}>
                                <div className={cx('sectionTitle')}>Đáp án</div>
                            </Col>
                            {formData.options.map((opt, idx) => (
                                <Col md={6} key={idx} className="mb-2">
                                    <div className={cxCreate('answerItem')}>
                                        <input
                                            type="radio"
                                            name="question-correct-answer"
                                            checked={opt.isCorrect}
                                            onChange={() => handleOptionChange(idx, 'isCorrect', true)}
                                        />
                                        <span className="ms-2 fw-bold">{opt.answerLabel}.</span>
                                        <input
                                            type="text"
                                            className={cxCreate('inputModern', 'ms-2')}
                                            value={opt.content}
                                            onChange={(e) =>
                                                handleOptionChange(idx, 'content', e.target.value)
                                            }
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
                <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={saving || loading}
                >
                    {saving ? (
                        <Spinner size="sm" />
                    ) : (
                        <IoCheckmarkCircleOutline size={20} className="me-1" />
                    )}
                    Lưu cập nhật
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default EditQuestionModal;
