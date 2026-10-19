'use client';

import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { examCategoryKeys, examTypeKeys, questionCollectionKeys } from '@/app/configs/queryKeys';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';
import { toDateTimeLocalInput, fromDateTimeLocalInput } from '@/app/utils/format-date-time';
import { Button, Spinner, Row, Col, Accordion, Form } from 'react-bootstrap';
import BaseModal from '@/app/components/modal/BaseModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';
import { getAdminTestById, shuffleTestQuestions, updateTest } from '@/app/apis/testApi';
import { getExamTypes } from '@/app/apis/examTypeApi';
import { durationMinutesFromExamType } from '@/app/features/exam-types/hooks/useExamTypes';
import { getExamCategories } from '@/app/apis/examCategoryApi';
import { getQuestionCollections } from '@/app/apis/questionCollectionApi';
import { buildCollectionTree } from '@/app/features/tests/collectionTree';
import { useHasPermission } from '@/app/hooks/usePermission';
import { toast } from 'react-toastify';
import { getApiErrorMessage } from '@/app/utils/apiError';
import classNames from 'classnames/bind';
import {
  IoCreateOutline,
  IoSettingsOutline,
  IoListOutline,
  IoImageOutline,
  IoRocketOutline,
  IoShuffleOutline,
} from 'react-icons/io5';
import EditQuestionModal from '@/app/features/tests/EditQuestionModal';
import { PermissionCode } from '@/app/enums';
import type {
  CreateTestRequest,
  ExamCategoryResponse,
  ExamTypeResponse,
  QuestionCollectionResponse,
  TestAdminResponse,
  TestResponse,
} from '@/app/types';
import createModalStyles from '@/app/features/tests/CreateTestModal.module.scss';

const cxCreate = classNames.bind(createModalStyles);

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

const EMPTY_FORM = {
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
  shuffleQuestions: false,
};

const formFromTest = (test: EditableTest): typeof EMPTY_FORM => ({
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
  shuffleQuestions: Boolean(test.shuffleQuestions),
});

// Response cũ có thể bọc trong { data } hoặc { content }; chuẩn hoá về mảng.
const toList = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  const wrapped = payload as { data?: T[]; content?: T[] } | null;
  return wrapped?.data ?? wrapped?.content ?? [];
};

// Nằm dưới gốc ['admin-tests'] để invalidate danh sách đề ở trang admin cũng làm mới chi tiết.
const testDetailKey = (testId?: string) => ['admin-tests', 'detail', testId ?? null];

const EditTestModal = ({ show, onHide, test, onSuccess }: EditTestModalProps) => {
  const queryClient = useQueryClient();
  const canSetPricing = useHasPermission(PermissionCode.TEST_MANAGE_PRICING);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const testId = test?.testId || test?.id;

  // Dữ liệu dùng chung cache với các trang khác (cùng key) và có key theo testId, nên mở đề B ngay
  // sau đề A không thể hiện nhầm dữ liệu của A như khi fetch tay trong useEffect.
  const { data: examTypes = EMPTY_LIST as ExamTypeResponse[] } = useQuery({
    queryKey: examTypeKeys.all,
    queryFn: getExamTypes,
    enabled: show,
    select: toList<ExamTypeResponse>,
  });
  const { data: examCategories = EMPTY_LIST as ExamCategoryResponse[] } = useQuery({
    queryKey: examCategoryKeys.all,
    queryFn: getExamCategories,
    enabled: show,
    select: toList<ExamCategoryResponse>,
  });
  const { data: questionCollections = EMPTY_LIST as QuestionCollectionResponse[] } = useQuery({
    queryKey: questionCollectionKeys.all,
    queryFn: getQuestionCollections,
    enabled: show,
    select: toList<QuestionCollectionResponse>,
  });
  const detailQuery = useQuery({
    queryKey: testDetailKey(testId),
    queryFn: () => getAdminTestById(testId as string),
    enabled: show && !!testId,
  });
  const testDetail: TestAdminResponse | undefined = detailQuery.data;
  const loadingDetail = detailQuery.isFetching;
  const refreshTestDetail = () => queryClient.invalidateQueries({ queryKey: testDetailKey(testId) });

  // Mở modal (hoặc đổi sang đề khác) thì nạp lại form từ đề; cha re-render truyền object mới của
  // cùng đề thì không nạp lại, để không xoá những gì người dùng đang sửa.
  const formFor = show ? (testId ?? null) : null;
  const [seededFor, setSeededFor] = useState<string | null>(null);
  if (formFor !== seededFor) {
    setSeededFor(formFor);
    if (show && test) setFormData(formFromTest(test));
    if (!show) setEditingQuestionId(null);
  }

  // Đề cũ chưa có phân loại trong danh sách thì lấy từ chi tiết khi chi tiết về.
  const [seededCategoryFrom, setSeededCategoryFrom] = useState<TestAdminResponse | undefined>();
  if (testDetail && testDetail !== seededCategoryFrom) {
    setSeededCategoryFrom(testDetail);
    if (testDetail.examCategoryId && !formData.examCategoryId) {
      setFormData((prev) => ({ ...prev, examCategoryId: testDetail.examCategoryId as string }));
    }
  }

  const collectionOptions = useMemo(
    () =>
      buildCollectionTree(
        questionCollections.filter(
          (c) =>
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
    onError: (error: unknown) => {
      const msg = getApiErrorMessage(error, error instanceof Error ? error.message : undefined);
      toast.error(`Lỗi khi cập nhật: ${msg}`);
    },
  });

  const shuffleMutation = useMutation({
    mutationFn: (testId: string) => shuffleTestQuestions(testId),
    onSuccess: async () => {
      toast.success('Đã xáo lại thứ tự câu trong đề');
      await refreshTestDetail();
    },
    onError: (error: unknown) => {
      const msg = getApiErrorMessage(error, error instanceof Error ? error.message : undefined);
      toast.error(`Lỗi khi xáo thứ tự câu: ${msg}`);
    },
  });

  const handleShuffleNow = () => {
    const testId = test?.testId || test?.id;
    if (!testId) return;
    if (!window.confirm('Xáo lại thứ tự câu của đề? Thứ tự mới áp dụng cho mọi lượt làm sau này.')) return;
    shuffleMutation.mutate(testId);
  };

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
      shuffleQuestions: formData.shuffleQuestions,
    };

    updateMutation.mutate({
      testId: (test!.testId || test!.id) as string,
      payload: payload as unknown as CreateTestRequest,
    });
  };

  const groupedQuestions = useMemo(() => {
    if (!testDetail?.parts) return [];
    return testDetail.parts.map((part, partIndex) => {
      const partName = part.partName || `Part ${partIndex + 1}`;
      const questionRows: Array<{ questionId: string; questionText: string }> = [];
      const groups = Array.isArray(part.questionGroups) ? part.questionGroups : [];

      groups.forEach((group) => {
        const questions = Array.isArray(group?.questions) ? group.questions : [];
        questions.forEach((q) => {
          if (!q?.questionId) return;
          questionRows.push({
            questionId: q.questionId,
            questionText: q.questionText || '(Không có nội dung)',
          });
        });
      });

      return { partName, questionRows };
    });
  }, [testDetail]);

  const handleQuestionUpdated = async () => {
    setEditingQuestionId(null);
    await refreshTestDetail();
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
                  onChange={(e) => {
                    const examTypeId = e.target.value;
                    setFormData({
                      ...formData,
                      examTypeId,
                      durationMinutes: durationMinutesFromExamType(examTypes, examTypeId),
                    });
                  }}
                >
                  <option value="">-- Chọn loại --</option>

                  {examTypes.filter((type) => !type.childCount).map((type) => (
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
                  {examCategories.map((c) => (
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

            <Col md={12}>
              <Form.Check
                type="checkbox"
                id="edit-test-shuffle-per-attempt"
                label="Xáo trộn thứ tự câu mỗi lượt làm (mỗi người, mỗi lần làm một thứ tự khác)"
                checked={formData.shuffleQuestions}
                onChange={(e) =>
                  setFormData({ ...formData, shuffleQuestions: e.target.checked })
                }
              />
            </Col>
          </Row>
        </div>

        <div className={cxCreate('configCard')} style={{ marginTop: 16 }}>
          <div className={cxCreate('sectionTitle')}>
            <IoListOutline /> Danh sách câu hỏi trong đề
            <Button
              type="button"
              variant="outline-secondary"
              size="sm"
              className="ms-auto"
              onClick={handleShuffleNow}
              disabled={shuffleMutation.isPending || loadingDetail || groupedQuestions.length === 0}
              title="Xáo một lần thứ tự câu trong từng phần thi và lưu lại; câu cùng đoạn văn giữ liền nhau"
            >
              <IoShuffleOutline size={16} />{' '}
              {shuffleMutation.isPending ? 'Đang xáo...' : 'Xáo thứ tự câu ngay'}
            </Button>
          </div>
          {loadingDetail ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
            </div>
          ) : detailQuery.isError ? (
            <p className="text-danger mb-0">Không tải được danh sách câu hỏi của đề.</p>
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
