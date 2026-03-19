import React, { useState, useEffect } from 'react';
import { Modal, Button, Spinner, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import classNames from 'classnames/bind';
import { IoCheckmarkCircleOutline, IoCloseOutline } from 'react-icons/io5';
import styles from './EditQuestionModal.module.scss'; // Reuse styles

const cx = classNames.bind(styles);

const EditTestModal = ({ show, onHide, test, onSuccess }) => {
    const [saving, setSaving] = useState(false);
    const [examTypes, setExamTypes] = useState([]);
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        examTypeId: '',
        durationMinutes: '',
        maxAttempts: '',
        bannerUrl: '',
        availableFrom: '',
        availableTo: ''
    });

    useEffect(() => {
        if (show) {
            fetchExamTypes();
            if (test) {
                setFormData({
                    title: test.title || '',
                    description: test.description || '',
                    examTypeId: test.examType?.examTypeId || test.examTypeId || '',
                    durationMinutes: test.durationMinutes || '',
                    maxAttempts: test.maxAttempts || '',
                    bannerUrl: test.bannerUrl || '',
                    availableFrom: test.availableFrom ? test.availableFrom.substring(0, 16) : '',
                    availableTo: test.availableTo ? test.availableTo.substring(0, 16) : ''
                });
            }
        }
    }, [show, test]);

    const fetchExamTypes = async () => {
        try {
            const res = await axios.get('/api/exam-types');
            if (res.data?.data) {
                setExamTypes(res.data.data);
            } else if (Array.isArray(res.data)) {
                setExamTypes(res.data);
            }
        } catch (error) {
            console.error('Failed to load exam types', error);
        }
    };

    const handleSave = async () => {
        if (!formData.title?.trim() || !formData.examTypeId) {
            toast.warning('Vui lòng nhập tên đề thi và chọn loại kỳ thi');
            return;
        }

        setSaving(true);
        
        const payload = {
            title: formData.title.trim(),
            description: formData.description || null,
            examTypeId: Number(formData.examTypeId),
            durationMinutes: formData.durationMinutes && Number(formData.durationMinutes) > 0 ? Number(formData.durationMinutes) : null,
            maxAttempts: formData.maxAttempts && Number(formData.maxAttempts) > 0 ? Number(formData.maxAttempts) : null,
            bannerUrl: formData.bannerUrl || null,
            availableFrom: formData.availableFrom ? formData.availableFrom + ':00' : null,
            availableTo: formData.availableTo ? formData.availableTo + ':00' : null,
            classId: test.classId || null,
            chapterId: test.chapterId || null
        };

        try {
            await axios.put(`/api/tests/${test.testId || test.id}`, payload);
            toast.success('Cập nhật đề thi thành công!');
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
                <Modal.Title className={cx('modalTitle')}>Cập nhật bài thi</Modal.Title>
            </Modal.Header>
            <Modal.Body className={cx('modalBody')}>
                <div className={cx('formGroup')}>
                    <Row className="g-3">
                        <Col md={12}>
                            <label className={cx('formLabel')}>Tên bài thi *</label>
                            <input
                                type="text"
                                className={cx('formControl')}
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Nhập tên bài thi..."
                            />
                        </Col>
                        
                        <Col md={6}>
                            <label className={cx('formLabel')}>Loại kỳ thi *</label>
                            <select
                                className={cx('formControl')}
                                value={formData.examTypeId}
                                onChange={(e) => setFormData({ ...formData, examTypeId: e.target.value })}
                            >
                                <option value="">-- Chọn loại --</option>
                                {examTypes.map(type => (
                                    <option key={type.examTypeId} value={type.examTypeId}>{type.name}</option>
                                ))}
                            </select>
                        </Col>

                        <Col md={6}>
                            <label className={cx('formLabel')}>Ảnh banner (URL)</label>
                            <input 
                                type="text" 
                                className={cx('formControl')} 
                                value={formData.bannerUrl}
                                onChange={(e) => setFormData({ ...formData, bannerUrl: e.target.value })}
                                placeholder="https://..."
                            />
                        </Col>

                        <Col md={6}>
                            <label className={cx('formLabel')}>Thời gian làm bài (Phút)</label>
                            <input
                                type="number"
                                min={0}
                                className={cx('formControl')}
                                value={formData.durationMinutes}
                                onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                                placeholder="Để trống nếu không giới hạn"
                            />
                        </Col>

                        <Col md={6}>
                            <label className={cx('formLabel')}>Số lượt làm tối đa</label>
                            <input
                                type="number"
                                min={0}
                                className={cx('formControl')}
                                value={formData.maxAttempts}
                                onChange={(e) => setFormData({ ...formData, maxAttempts: e.target.value })}
                                placeholder="Để trống nếu không giới hạn"
                            />
                        </Col>

                        <Col md={6}>
                            <label className={cx('formLabel')}>Thời điểm bắt đầu (Mở)</label>
                            <input
                                type="datetime-local"
                                className={cx('formControl')}
                                value={formData.availableFrom}
                                onChange={(e) => setFormData({ ...formData, availableFrom: e.target.value })}
                            />
                        </Col>
                        
                        <Col md={6}>
                            <label className={cx('formLabel')}>Thời điểm kết thúc (Đóng)</label>
                            <input
                                type="datetime-local"
                                className={cx('formControl')}
                                value={formData.availableTo}
                                onChange={(e) => setFormData({ ...formData, availableTo: e.target.value })}
                            />
                        </Col>

                        <Col md={12}>
                            <label className={cx('formLabel')}>Mô tả</label>
                            <textarea
                                className={cx('formControl')}
                                rows={2}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Mô tả bài thi..."
                            />
                        </Col>
                    </Row>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide} disabled={saving}>
                    <IoCloseOutline size={20} className="me-1" /> Hủy
                </Button>
                <Button variant="primary" onClick={handleSave} disabled={saving}>
                    {saving ? <Spinner size="sm" /> : <IoCheckmarkCircleOutline size={20} className="me-1" />}
                    Lưu cập nhật
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default EditTestModal;
