'use client';

import { useState, useEffect, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toDateTimeLocalInput, fromDateTimeLocalInput } from '@/app/utils/format-date-time';
import { Button, Spinner, Row, Col, Accordion } from 'react-bootstrap';
import BaseModal from '@/app/components/modal/BaseModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';
import { getAdminTestById, updateTest } from '@/app/apis/testApi';
import { getExamTypes } from '@/app/apis/examTypeApi';
import { getExamCategories } from '@/app/apis/examCategoryApi';
import { getQuestionCollections } from '@/app/apis/questionCollectionApi';
import { buildCollectionTree } from '@/app/utils/collectionTree';
import { useHasPermission } from '@/app/hooks/usePermission';
import { toast } from 'react-toastify';
import classNames from 'classnames/bind';
import {
  IoCreateOutline,
  IoSettingsOutline,
  IoListOutline,
  IoImageOutline,
  IoRocketOutline,
} from 'react-icons/io5';
import EditQuestionModal from '@/app/components/tests/EditQuestionModal';
import { PermissionCode } from '@/app/enums';
import type { CreateTestRequest, TestAdminResponse, TestResponse } from '@/app/types';
import createModalStyles from './CreateTestModal.module.scss';

const cxCreate = classNames.bind(createModalStyles);

/** Đề truyền vào có thể là TestResponse hoặc dữ liệu cũ (id / examType lồng) từ trang quản lý. */
export type EditableTest = TestResponse & {
  id?: string;
  examType?: { examTypeId?: string };
};

type EditTestModalProps = {
  show: boolean;
  onHide: () => void;
  test: EditableTest | null;
  onSuccess: () => void;
};

type UpdateTestVariables = { testId: string; payload: CreateTestRequest };

const EditTestModal = ({ show, onHide, test, onSuccess }: EditTestModalProps) => {
  const canSetPricing = useHasPermission(PermissionCode.TEST_MANAGE_PRICING);
  // Các list dưới đây nhận nhiều dạng response cũ (mảng | {data} | {content}) nên để any[] có chủ đích.
  const [examTypes, setExamTypes] = useState<any[]>([]);
  const [examCategories, setExamCategories] = useState<any[]>([]);
  const [questionCollections, setQuestionCollections] = useState<any[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [testDetail, setTestDetail] = useState<TestAdminResponse | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    examTypeId: '',
    examCategoryId: '',
    collectionId: '',
    durationMinutes: '' as string | number,
    maxAttempts: '' as string | number,
    bannerUrl: '',
    availableFrom: '',
    availableTo: '',
    costCoins: '' as string | number,
  });

  useEffect(() => {
    if (show) {
      fetchExamTypes();
      fetchExamCategories();
      fetchQuestionCollections();
      if (test) {
        setFormData({
          title: test.title || '',
          description: test.description || '',
          examTypeId: test.examType?.examTypeId || test.examTypeId || '',
          examCategoryId: test.examCategoryId || '',
          collectionId: test.collectionId || '',
          durationMinutes: test.durationMinutes || '',
          maxAttempts: test.maxAttempts || '',
          bannerUrl: test.bannerUrl || '',
          availableFrom: toDateTimeLocalInput(test.availableFrom),
          availableTo: toDateTimeLocalInput(test.availableTo),
          costCoins: test.costCoins != null ? test.costCoins : '',
        });
        fetchTestDetail(test.testId || test.id);
      }
    } else {
      setTestDetail(null);
      setEditingQuestionId(null);
    }
  }, [show, test]);

  const fetchTestDetail = async (id?: string) => {
    if (!id) return;
    setLoadingDetail(true);
    try {
      const data = await getAdminTestById(id);
      setTestDetail(data);

      if (data?.examCategoryId) {
        setFormData((prev) =>
          prev.examCategoryId ? prev : { ...prev, examCategoryId: data.examCategoryId as string },
        );
      }
    } catch (error) {
      console.error('Failed to load test detail', error);
      toast.error('Không tải được danh sách câu hỏi của đề');
    } finally {
      setLoadingDetail(false);
    }
  };

  const fetchExamTypes = async () => {
    try {
      const data: any = await getExamTypes();
      if (data?.data) {
        setExamTypes(data.data);
      } else if (Array.isArray(data)) {
        setExamTypes(data);
      }
    } catch (error) {
      console.error('Failed to load exam types', error);
    }
  };

  const fetchExamCategories = async () => {
    try {
      const data: any = await getExamCategories();
      setExamCategories(Array.isArray(data) ? data : (data?.data || []));
    } catch (error) {
      console.error('Failed to load exam categories', error);
      setExamCategories([]);
    }
  };

  const fetchQuestionCollections = async () => {
    try {
      const data: any = await getQuestionCollections();
      setQuestionCollections(Array.isArray(data) ? data : (data?.data || data?.content || []));
    } catch (error) {
      console.error('Failed to load collections', error);
      setQuestionCollections([]);
    }
  };

  const collectionOptions = useMemo(
    () =>
      buildCollectionTree(
        (questionCollections || []).filter(
          (c: any) =>
            !formData.examTypeId ||
            !c.examTypeId ||
            String(c.examTypeId) === String(formData.examTypeId),
        ),
      ),
    [questionCollections, formData.examTypeId],
  );

  const updateMutation = useMutation({
    mutationFn: ({ testId, payload }: UpdateTestVariables) => updateTest(testId, payload),
    onSuccess: () => {
      toast.success('Cập nhật đề thi thành công!');
      onSuccess();
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message ?? error.message;
      toast.error(`Lỗi khi cập nhật: ${msg}`);
    },
  });

  const handleSave = () => {
    if (!formData.title?.trim() || !formData.examTypeId) {
      toast.warning('Vui lòng nhập tên đề thi và chọn loại kỳ thi');
      return;
    }

    const payload = {
      title: formData.title.trim(),
      description: formData.description || null,
      examTypeId: String(formData.examTypeId),

      examCategoryId: formData.examCategoryId ? String(formData.examCategoryId) : '',
      collectionId: formData.collectionId ? String(formData.collectionId) : '',
      durationMinutes:
        formData.durationMinutes && Number(formData.durationMinutes) > 0
          ? Number(formData.durationMinutes)
          : null,
      maxAttempts:
        formData.maxAttempts && Number(formData.maxAttempts) > 0
          ? Number(formData.maxAttempts)
          : null,
      bannerUrl: formData.bannerUrl || null,
      availableFrom: fromDateTimeLocalInput(formData.availableFrom),
      availableTo: fromDateTimeLocalInput(formData.availableTo),
      classId: test!.classId ? String(test!.classId) : null,
      chapterId: test!.chapterId ? String(test!.chapterId) : null,

      costCoins: formData.costCoins === '' || formData.costCoins === null
        ? null
        : Number(formData.costCoins),
    };

    // BE nhận `null` để xoá field (khác undefined) nên giữ nguyên payload, cast qua unknown.
    updateMutation.mutate({
      testId: (test!.testId || test!.id) as string,
      payload: payload as unknown as CreateTestRequest,
    });
  };

  const groupedQuestions = useMemo(() => {
    if (!testDetail?.parts) return [];
    // Response cũ có part.examPart / part.questions phẳng nên duyệt bằng any có chủ đích.
    return (testDetail.parts as any[]).map((part: any, partIndex: number) => {
      const partName =
        part?.examPart?.name ||
        part?.examPartName ||
        part?.name ||
        `Part ${partIndex + 1}`;
      const questionRows: Array<{ questionId: string; questionText: string }> = [];
      const groups = Array.isArray(part?.questionGroups) ? part.questionGroups : [];

      groups.forEach((group: any) => {
        const questions = Array.isArray(group?.questions) ? group.questions : [];
        questions.forEach((q: any) => {
          const id = q?.questionId ?? q?.id;
          if (!id) return;
          questionRows.push({
            questionId: id,
            questionText: q?.questionText || '(Không có nội dung)',
          });
        });
      });

      const directQuestions = Array.isArray(part?.questions) ? part.questions : [];
      directQuestions.forEach((q: any) => {
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
      headerExtra={
        <span className={cxCreate('badge')}>
          {test?.classId ? `Lớp: ${test.classId}` : 'Cá nhân'}
        </span>
      }
      maxWidth={1140}
      footer={
        <ModalActionFooter
          onCancel={onHide}
          onSubmit={handleSave}
          loading={updateMutation.isPending}
          cancelLabel="Hủy"
          submitLabel="Lưu cập nhật"
          loadingLabel="Đang lưu..."
          submitIcon={IoRocketOutline}
        />
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

                  {examTypes.filter((type: any) => !type.childCount).map((type: any) => (
                    <option key={type.examTypeId} value={type.examTypeId}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
            </Col>

            <Col md={6}>
              <div className={cxCreate('formGroupModern')}>
                <label>Phân loại bài thi (tuỳ chọn)</label>
                <select
                  className={cxCreate('inputModern')}
                  value={formData.examCategoryId}
                  onChange={(e) =>
                    setFormData({ ...formData, examCategoryId: e.target.value })
                  }
                  aria-label="Phân loại bài thi"
                >
                  <option value="">-- Không phân loại --</option>
                  {examCategories.map((c: any) => (
                    <option key={c.examCategoryId} value={c.examCategoryId}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </Col>

            <Col md={6}>
              <div className={cxCreate('formGroupModern')}>
                <label>Bộ đề (Collection)</label>
                <select
                  className={cxCreate('inputModern')}
                  value={formData.collectionId}
                  onChange={(e) =>
                    setFormData({ ...formData, collectionId: e.target.value })
                  }
                >
                  <option value="">-- Trống --</option>
                  {collectionOptions.map((c) => (
                    <option key={c.collectionId} value={c.collectionId}>
                      {c.depth > 0 ? `    └ ${c.name}` : c.name}
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
