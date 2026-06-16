import React, { useState, useEffect, useMemo } from 'react';
import { Button, Spinner, Row, Col, Accordion } from 'react-bootstrap';
import BaseModal from '~/components/common/modal/BaseModal';
import { getAdminTestById, updateTest } from '../../api/testApi';
import { getExamTypes } from '../../api/examTypeApi';
import { useHasPermission } from '~/hooks/usePermission';
import { toast } from 'react-toastify';
import classNames from 'classnames/bind';
import {
  IoCloseOutline,
  IoCreateOutline,
  IoSettingsOutline,
  IoListOutline,
  IoImageOutline,
  IoRocketOutline,
} from 'react-icons/io5';
import EditQuestionModal from '~/pages/question-bank/modals/EditQuestionModal';
import createModalStyles from './CreateTestModal.module.scss';
import baseModalStyles from '~/components/common/modal/BaseModal.module.scss';

const cxCreate = classNames.bind(createModalStyles);
const cxBase = classNames.bind(baseModalStyles);

const EditTestModal = ({ show, onHide, test, onSuccess }) => {
  const canSetPricing = useHasPermission('TEST:MANAGE_PRICING');
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
    costCoins: '',
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
          costCoins: test.costCoins != null ? test.costCoins : '',
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
      const data = await getAdminTestById(id);
      setTestDetail(data);
    } catch (error) {
      console.error('Failed to load test detail', error);
      toast.error('Không tải được danh sách câu hỏi của đề');
    } finally {
      setLoadingDetail(false);
    }
  };

  const fetchExamTypes = async () => {
    try {
      const data = await getExamTypes();
      if (data?.data) {
        setExamTypes(data.data);
      } else if (Array.isArray(data)) {
        setExamTypes(data);
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
      // Giá xu: BE chỉ áp dụng khi admin & bài công khai. Để trống = giữ nguyên, nhập 0 = miễn phí.
      costCoins: formData.costCoins === '' || formData.costCoins === null
        ? null
        : Number(formData.costCoins),
    };

    try {
      await updateTest(test.testId || test.id, payload);
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
    <BaseModal
      show={show}
      onClose={onHide}
      title="Cập nhật bài thi"
      icon={IoCreateOutline}
      headerExtra={
        <span className={cxCreate('badge')}>
          {test?.classId ? `Lớp: ${test.classId}` : 'Cá nhân'}
        </span>
      }
      maxWidth={1140}
      footer={
        <>
          <button type="button" className={cxBase('btnCancel')} onClick={onHide} disabled={saving}>
            <IoCloseOutline size={18} /> Hủy
          </button>
          <button type="button" className={cxBase('btnSubmit')} onClick={handleSave} disabled={saving}>
            {saving ? <Spinner size="sm" /> : <><IoRocketOutline /> Lưu cập nhật</>}
          </button>
        </>
      }
    >
      <div>
        <div className={cxCreate('configCard')}>
          <div className={cxCreate('sectionTitle')}>
            <IoSettingsOutline /> Cấu hình bài thi
          </div>
          <Row className="g-3">
            <Col md={8}>
              <div className={cxCreate('formGroupModern')}>
                <label>Tên bài thi *</label>
                <input
                  type="text"
                  className={cxCreate('inputModern')}
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Nhập tên bài thi..."
                />
              </div>
            </Col>

            <Col md={4}>
              <div className={cxCreate('formGroupModern')}>
                <label><IoImageOutline /> Link ảnh Banner</label>
                <input
                  type="text"
                  className={cxCreate('inputModern')}
                  value={formData.bannerUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, bannerUrl: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>
            </Col>

            <Col md={6}>
              <div className={cxCreate('formGroupModern')}>
                <label>Loại kỳ thi *</label>
                <select
                  className={cxCreate('inputModern')}
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
              </div>
            </Col>

            <Col md={3}>
              <div className={cxCreate('formGroupModern')}>
                <label>Thời gian làm bài (phút)</label>
                <input
                  type="number"
                  min={0}
                  className={cxCreate('inputModern')}
                  value={formData.durationMinutes}
                  onChange={(e) =>
                    setFormData({ ...formData, durationMinutes: e.target.value })
                  }
                  placeholder="Không giới hạn"
                />
              </div>
            </Col>

            <Col md={3}>
              <div className={cxCreate('formGroupModern')}>
                <label>Số lượt làm tối đa</label>
                <input
                  type="number"
                  min={0}
                  className={cxCreate('inputModern')}
                  value={formData.maxAttempts}
                  onChange={(e) =>
                    setFormData({ ...formData, maxAttempts: e.target.value })
                  }
                  placeholder="Không giới hạn"
                />
              </div>
            </Col>

            {canSetPricing && !test?.classId && (
              <Col md={4}>
                <div className={cxCreate('formGroupModern')}>
                  <label>Giá xu (0 = miễn phí)</label>
                  <input
                    type="number"
                    min={0}
                    className={cxCreate('inputModern')}
                    value={formData.costCoins}
                    onChange={(e) =>
                      setFormData({ ...formData, costCoins: e.target.value })
                    }
                    placeholder="Để trống nếu không đổi"
                  />
                </div>
              </Col>
            )}

            <Col md={4}>
              <div className={cxCreate('formGroupModern')}>
                <label>Thời điểm bắt đầu (mở)</label>
                <input
                  type="datetime-local"
                  className={cxCreate('inputModern')}
                  value={formData.availableFrom}
                  onChange={(e) =>
                    setFormData({ ...formData, availableFrom: e.target.value })
                  }
                />
              </div>
            </Col>

            <Col md={4}>
              <div className={cxCreate('formGroupModern')}>
                <label>Thời điểm kết thúc (đóng)</label>
                <input
                  type="datetime-local"
                  className={cxCreate('inputModern')}
                  value={formData.availableTo}
                  onChange={(e) =>
                    setFormData({ ...formData, availableTo: e.target.value })
                  }
                />
              </div>
            </Col>

            <Col md={12}>
              <div className={cxCreate('formGroupModern')}>
                <label>Mô tả</label>
                <textarea
                  className={cxCreate('inputModern')}
                  rows={2}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Mô tả bài thi..."
                />
              </div>
            </Col>
          </Row>
        </div>

        <div className={cxCreate('configCard')} style={{ marginTop: 16 }}>
          <div className={cxCreate('sectionTitle')}>
            <IoListOutline /> Danh sách câu hỏi trong đề
          </div>
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
      </div>
    </BaseModal>
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
