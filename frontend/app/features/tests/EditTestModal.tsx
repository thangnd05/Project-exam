'use client';

import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { examCategoryKeys, examTypeKeys, questionCollectionKeys } from '@/app/configs/queryKeys';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';
import { toDateTimeLocalInput, fromDateTimeLocalInput } from '@/app/utils/format-date-time';
import { Spinner, Row, Col, Accordion, Form } from 'react-bootstrap';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
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
import { useTranslations } from 'next-intl';
import { getApiErrorMessage } from '@/app/utils/apiError';
import classNames from 'classnames/bind';
import { SquarePen } from 'lucide-react';
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
  const t = useTranslations('TestCreator');
  const tCommon = useTranslations('Common');
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
      toast.success(t('editTest.toast.updated'));
      onSuccess();
    },
    onError: (error: unknown) => {
      const msg = getApiErrorMessage(error, error instanceof Error ? error.message : undefined);
      toast.error(t('editTest.toast.updateError', { message: msg }));
    },
  });

  const shuffleMutation = useMutation({
    mutationFn: (testId: string) => shuffleTestQuestions(testId),
    onSuccess: async () => {
      toast.success(t('editTest.toast.shuffled'));
      await refreshTestDetail();
    },
    onError: (error: unknown) => {
      const msg = getApiErrorMessage(error, error instanceof Error ? error.message : undefined);
      toast.error(t('editTest.toast.shuffleError', { message: msg }));
    },
  });

  const handleShuffleNow = () => {
    const testId = test?.testId || test?.id;
    if (!testId) return;
    if (!window.confirm(t('editTest.shuffleConfirm'))) return;
    shuffleMutation.mutate(testId);
  };

  const handleSave = () => {
    if (!formData.title?.trim() || !formData.examTypeId) {
      toast.warning(t('editTest.toast.titleAndExamTypeRequired'));
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
      const partName = part.partName || t('editTest.partFallback', { number: partIndex + 1 });
      const questionRows: Array<{ questionId: string; questionText: string }> = [];
      const groups = Array.isArray(part.questionGroups) ? part.questionGroups : [];

      groups.forEach((group) => {
        const questions = Array.isArray(group?.questions) ? group.questions : [];
        questions.forEach((q) => {
          if (!q?.questionId) return;
          questionRows.push({
            questionId: q.questionId,
            questionText: q.questionText || t('editTest.noContent'),
          });
        });
      });

      return { partName, questionRows };
    });
  }, [testDetail, t]);

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
      title={t('editTest.title')}
      headerExtra={
        <span className={cxCreate('badge')}>
          {test?.classId ? t('createTestModal.classBadge', { classId: test.classId }) : t('createTestModal.personalBadge')}
        </span>
      }
      maxWidth={1140}
      footer={
        <ModalActionFooter
          onCancel={onHide}
          onSubmit={handleSave}
          loading={updateMutation.isPending}
          cancelLabel={tCommon('cancelShort')}
          submitLabel={t('editTest.submit')}
          loadingLabel={t('editTest.saving')}
        />
      }
    >
      <div>
        <div className={cxCreate('configCard')}>
          <div className={cxCreate('sectionTitle')}>
            {t('form.section.testConfig')}
          </div>
          <Row className="g-3">
            <Col md={8}>
              <div className={cxCreate('formGroupModern')}>
                <label>{t('editTest.name')}</label>
                <input
                  type="text"
                  className={cxCreate('inputModern')}
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder={t('editTest.namePlaceholder')}
                />
              </div>
            </Col>

            <Col md={4}>
              <div className={cxCreate('formGroupModern')}>
                <label>{t('form.fields.bannerUrl')}</label>
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
                <label>{t('editTest.examType')}</label>
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
                  <option value="">{t('editTest.selectType')}</option>

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
                <label>{t('form.fields.examCategory')}</label>
                <select
                  className={cxCreate('inputModern')}
                  value={formData.examCategoryId}
                  onChange={(e) =>
                    setFormData({ ...formData, examCategoryId: e.target.value })
                  }
                  aria-label={t('form.fields.examCategoryAria')}
                >
                  <option value="">{t('form.fields.noCategory')}</option>
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
                <label>{t('form.fields.testCollection')}</label>
                <select
                  className={cxCreate('inputModern')}
                  value={formData.collectionId}
                  onChange={(e) =>
                    setFormData({ ...formData, collectionId: e.target.value })
                  }
                >
                  <option value="">{t('form.fields.emptyOption')}</option>
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
                <label>{t('editTest.duration')}</label>
                <input
                  type="number"
                  min={0}
                  className={cxCreate('inputModern')}
                  value={formData.durationMinutes}
                  onChange={(e) =>
                    setFormData({ ...formData, durationMinutes: e.target.value })
                  }
                  placeholder={t('editTest.unlimited')}
                />
              </div>
            </Col>

            <Col md={3}>
              <div className={cxCreate('formGroupModern')}>
                <label>{t('editTest.maxAttempts')}</label>
                <input
                  type="number"
                  min={0}
                  className={cxCreate('inputModern')}
                  value={formData.maxAttempts}
                  onChange={(e) =>
                    setFormData({ ...formData, maxAttempts: e.target.value })
                  }
                  placeholder={t('editTest.unlimited')}
                />
              </div>
            </Col>

            {canSetPricing && !test?.classId && (
              <Col md={4}>
                <div className={cxCreate('formGroupModern')}>
                  <label>{t('editTest.coinPrice')}</label>
                  <input
                    type="number"
                    min={0}
                    className={cxCreate('inputModern')}
                    value={formData.costCoins}
                    onChange={(e) =>
                      setFormData({ ...formData, costCoins: e.target.value })
                    }
                    placeholder={t('editTest.coinPricePlaceholder')}
                  />
                </div>
              </Col>
            )}

            <Col md={4}>
              <div className={cxCreate('formGroupModern')}>
                <label>{t('editTest.availableFrom')}</label>
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
                <label>{t('editTest.availableTo')}</label>
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
                <label>{t('form.fields.description')}</label>
                <textarea
                  className={cxCreate('inputModern')}
                  rows={2}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder={t('editTest.descriptionPlaceholder')}
                />
              </div>
            </Col>

            <Col md={12}>
              <Form.Check
                type="checkbox"
                id="edit-test-shuffle-per-attempt"
                label={t('form.fields.shufflePerAttempt')}
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
            {t('editTest.questionList')}
            <ButtonPrime
              type="button"
              variant="outline"
              size="sm"
              className="ms-auto"
              onClick={handleShuffleNow}
              disabled={shuffleMutation.isPending || loadingDetail || groupedQuestions.length === 0}
              title={t('editTest.shuffleHint')}
            >
              {shuffleMutation.isPending ? t('editTest.shuffling') : t('editTest.shuffleNow')}
            </ButtonPrime>
          </div>
          {loadingDetail ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
            </div>
          ) : detailQuery.isError ? (
            <p className="text-danger mb-0">{t('editTest.loadError')}</p>
          ) : groupedQuestions.length === 0 ? (
            <p className="text-muted mb-0">{t('editTest.empty')}</p>
          ) : (
            <Accordion defaultActiveKey="0">
              {groupedQuestions.map((part, index) => (
                <Accordion.Item eventKey={String(index)} key={`${part.partName}-${index}`}>
                  <Accordion.Header>
                    {part.partName}
                    <span className="badge bg-secondary ms-2">{t('jsonPreview.questionCount', { count: part.questionRows.length })}</span>
                  </Accordion.Header>
                  <Accordion.Body>
                    {part.questionRows.length === 0 ? (
                      <p className="text-muted mb-0">{t('editTest.partEmpty')}</p>
                    ) : (
                      <div className="d-flex flex-column gap-2">
                        {part.questionRows.map((q, qIndex) => (
                          <div
                            key={q.questionId}
                            className="d-flex align-items-center gap-2 p-2 rounded border bg-white"
                          >
                            <span className="text-muted fw-bold">{qIndex + 1}.</span>
                            <span className="flex-grow-1">{q.questionText}</span>
                            <ButtonPrime
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => setEditingQuestionId(q.questionId)}
                              aria-label={t('editTest.editQuestion', { number: qIndex + 1 })}
                            >
                              <SquarePen size={16} />
                            </ButtonPrime>
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
