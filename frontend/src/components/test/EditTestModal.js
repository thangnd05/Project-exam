import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Button, Spinner, Row, Col, Accordion } from 'react-bootstrap';
import axios from '../../api/axiosClient';
import { toast } from 'react-toastify';
import classNames from 'classnames/bind';
import { IoCheckmarkCircleOutline, IoCloseOutline, IoCreateOutline } from 'react-icons/io5';
import EditQuestionModal from '~/pages/question-bank/modals/EditQuestionModal';
import styles from '~/pages/question-bank/modals/EditQuestionModal.module.scss'; // Reuse styles
import createModalStyles from './CreateTestModal.module.scss';

const cx = classNames.bind(styles);
const cxCreate = classNames.bind(createModalStyles);

const EditTestModal = ({ show, onHide, test, onSuccess }) => {
  const [saving, setSaving] = useState(false);
  const [examTypes, setExamTypes] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [testDetail, setTestDetail] = useState(null);
  const [editingQuestionId, setEditingQuestionId] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    examTypeId: '',
    durationMinutes: '',
    maxAttempts: '',
    bannerUrl: '',
    availableFrom: '',
    availableTo: '',
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
          availableFrom: test.availableFrom
            ? test.availableFrom.substring(0, 16)
            : '',
          availableTo: test.availableTo
            ? test.availableTo.substring(0, 16)
            : '',
        });
        fetchTestDetail(test.testId || test.id);
      }
    } else {
      setTestDetail(null);
      setEditingQuestionId(null);
    }
  }, [show, test]);

  const fetchTestDetail = async (id) => {
    if (!id) return;
    setLoadingDetail(true);
    try {
      const res = await axios.get(`/api/tests/admintest/${id}`);
      setTestDetail(res.data);
    } catch (error) {
      console.error('Failed to load test detail', error);
      toast.error('Không tải được danh sách câu hỏi của đề');
    } finally {
      setLoadingDetail(false);
    }
  };

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
      examTypeId: String(formData.examTypeId),
      durationMinutes:
        formData.durationMinutes && Number(formData.durationMinutes) > 0
          ? Number(formData.durationMinutes)
          : null,
      maxAttempts:
        formData.maxAttempts && Number(formData.maxAttempts) > 0
          ? Number(formData.maxAttempts)
          : null,
      bannerUrl: formData.bannerUrl || null,
      availableFrom: formData.availableFrom
        ? formData.availableFrom + ':00'
        : null,
      availableTo: formData.availableTo ? formData.availableTo + ':00' : null,
      classId: test.classId ? String(test.classId) : null,
      chapterId: test.chapterId ? String(test.chapterId) : null,
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

  const groupedQuestions = useMemo(() => {
    if (!testDetail?.parts) return [];
    return testDetail.parts.map((part, partIndex) => {
      const partName =
        part?.examPart?.name ||
        part?.examPartName ||
        part?.name ||
        `Part ${partIndex + 1}`;
      const questionRows = [];
      const groups = Array.isArray(part?.questionGroups) ? part.questionGroups : [];

      groups.forEach((group) => {
        const questions = Array.isArray(group?.questions) ? group.questions : [];
        questions.forEach((q) => {
          const id = q?.questionId ?? q?.id;
          if (!id) return;
          questionRows.push({
            questionId: id,
            questionText: q?.questionText || '(Không có nội dung)',
          });
        });
      });

      const directQuestions = Array.isArray(part?.questions) ? part.questions : [];
      directQuestions.forEach((q) => {
        const id = q?.questionId ?? q?.id;
        if (!id) return;
        questionRows.push({
          questionId: id,
          questionText: q?.questionText || '(Không có nội dung)',
        });
      });

      return { partName, questionRows };
    });
  }, [testDetail]);

  const handleQuestionUpdated = async () => {
    setEditingQuestionId(null);
    const testId = test?.testId || test?.id;
    await fetchTestDetail(testId);
    onSuccess?.();
  };

  return (
    <>
    <Modal
      show={show}
      onHide={onHide}
      size="xl"
      backdrop="static"
      centered
      scrollable
      className={cx('modalWrapper')}
    >
      <div className={cxCreate('header')}>
        <div className={cxCreate('titleWrapper')}>
          <IoCreateOutline />
          <h3 className={cxCreate('title')}>Cập nhật bài thi</h3>
          <span className={cxCreate('badge')}>
            {test?.classId ? `Lớp: ${test.classId}` : 'Cá nhân'}
          </span>
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
        <div className={cx('formGroup')}>
          <Row className="g-3">
            <Col md={12}>
              <label className={cx('formLabel')}>Tên bài thi *</label>
              <input
                type="text"
                className={cx('formControl')}
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Nhập tên bài thi..."
              />
            </Col>

            <Col md={6}>
              <label className={cx('formLabel')}>Loại kỳ thi *</label>
              <select
                className={cx('formControl')}
                value={formData.examTypeId}
                onChange={(e) =>
                  setFormData({ ...formData, examTypeId: e.target.value })
                }
              >
                <option value="">-- Chọn loại --</option>
                {examTypes.map((type) => (
                  <option key={type.examTypeId} value={type.examTypeId}>
                    {type.name}
                  </option>
                ))}
              </select>
            </Col>

            <Col md={6}>
              <label className={cx('formLabel')}>Ảnh banner (URL)</label>
              <input
                type="text"
                className={cx('formControl')}
                value={formData.bannerUrl}
                onChange={(e) =>
                  setFormData({ ...formData, bannerUrl: e.target.value })
                }
                placeholder="https://..."
              />
            </Col>

            <Col md={6}>
              <label className={cx('formLabel')}>
                Thời gian làm bài (Phút)
              </label>
              <input
                type="number"
                min={0}
                className={cx('formControl')}
                value={formData.durationMinutes}
                onChange={(e) =>
                  setFormData({ ...formData, durationMinutes: e.target.value })
                }
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
                onChange={(e) =>
                  setFormData({ ...formData, maxAttempts: e.target.value })
                }
                placeholder="Để trống nếu không giới hạn"
              />
            </Col>

            <Col md={6}>
              <label className={cx('formLabel')}>Thời điểm bắt đầu (Mở)</label>
              <input
                type="datetime-local"
                className={cx('formControl')}
                value={formData.availableFrom}
                onChange={(e) =>
                  setFormData({ ...formData, availableFrom: e.target.value })
                }
              />
            </Col>

            <Col md={6}>
              <label className={cx('formLabel')}>
                Thời điểm kết thúc (Đóng)
              </label>
              <input
                type="datetime-local"
                className={cx('formControl')}
                value={formData.availableTo}
                onChange={(e) =>
                  setFormData({ ...formData, availableTo: e.target.value })
                }
              />
            </Col>

            <Col md={12}>
              <label className={cx('formLabel')}>Mô tả</label>
              <textarea
                className={cx('formControl')}
                rows={2}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Mô tả bài thi..."
              />
            </Col>
          </Row>
        </div>

        <div className={cx('formGroup')} style={{ marginTop: 16 }}>
          <div className={cx('sectionTitle')}>Danh sách câu hỏi trong đề</div>
          {loadingDetail ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
            </div>
          ) : groupedQuestions.length === 0 ? (
            <p className="text-muted mb-0">Không có câu hỏi để hiển thị.</p>
          ) : (
            <Accordion defaultActiveKey="0">
              {groupedQuestions.map((part, index) => (
                <Accordion.Item eventKey={String(index)} key={`${part.partName}-${index}`}>
                  <Accordion.Header>
                    {part.partName}
                    <span className="badge bg-secondary ms-2">{part.questionRows.length} câu</span>
                  </Accordion.Header>
                  <Accordion.Body>
                    {part.questionRows.length === 0 ? (
                      <p className="text-muted mb-0">Part này chưa có câu hỏi.</p>
                    ) : (
                      <div className="d-flex flex-column gap-2">
                        {part.questionRows.map((q, qIndex) => (
                          <div
                            key={q.questionId}
                            className="d-flex align-items-center gap-2 p-2 rounded border bg-white"
                          >
                            <span className="text-muted fw-bold">{qIndex + 1}.</span>
                            <span className="flex-grow-1">{q.questionText}</span>
                            <Button
                              type="button"
                              variant="outline-primary"
                              size="sm"
                              onClick={() => setEditingQuestionId(q.questionId)}
                              aria-label={`Sửa câu hỏi ${qIndex + 1}`}
                            >
                              <IoCreateOutline size={16} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={saving}>
          <IoCloseOutline size={20} className="me-1" /> Hủy
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? (
            <Spinner size="sm" />
          ) : (
            <IoCheckmarkCircleOutline size={20} className="me-1" />
          )}
          Lưu cập nhật
        </Button>
      </Modal.Footer>
    </Modal>
    <EditQuestionModal
      show={!!editingQuestionId}
      onHide={() => setEditingQuestionId(null)}
      questionId={editingQuestionId}
      onSuccess={handleQuestionUpdated}
    />
    </>
  );
};

export default EditTestModal;
