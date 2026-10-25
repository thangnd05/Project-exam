'use client';

import { useEffect, useEffectEvent, useState } from 'react';
import { Row, Col, Spinner, Alert, Form } from 'react-bootstrap';
import classNames from 'classnames/bind';
import { useTranslations } from 'next-intl';
import {
  ChevronDown,
  ChevronUp,
  Pencil,
} from 'lucide-react';
import CoinPriceField from '@/app/features/tests/CoinPriceField';
import { useBaseMetaData } from '@/app/features/tests/creator/hooks/useBaseMetaData';
import { durationMinutesFromExamType } from '@/app/features/exam-types/hooks/useExamTypes';
import { getQuestionDisplayNumber } from '@/app/features/tests/questionNumber';
import EditQuestionModal from '@/app/features/tests/EditQuestionModal';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import PageHeader from '@/app/components/PageHeader/PageHeader';
import {
  useBankTestBuilder,
  SELECTION_MODES,
  defaultPartConfig,
  groupQuestionsByPassage,
} from '@/app/features/tests/creator/hooks/useBankTestBuilder';
import type { PartConfigMap } from '@/app/features/tests/creator/hooks/useBankTestBuilder';
import type { ExamPartResponse } from '@/app/types';
import { useExamCategories } from '@/app/features/tests/creator/hooks/useExamCategories';
import {
  emptyTestInfo,
  useCreateTestFromBank,
} from './_hooks/useCreateTestFromBank';
import styles from './CreateTestFromBank.module.scss';

const cx = classNames.bind(styles);

const CreateTestFromBank = () => {
  const t = useTranslations('TestCreatorBank');
  const [testInfo, setTestInfo] = useState(emptyTestInfo);
  const [notification, setNotification] = useState<{ type?: string; message?: string }>({});
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingPartId, setEditingPartId] = useState<string | null>(null);

  const examCategories = useExamCategories();
  const { examTypes, examParts } = useBaseMetaData(testInfo.examTypeId);

  const {
    partConfigs,
    setPartConfigs,
    updatePartConfig,
    togglePartExpanded,
    loadQuestionsForPart,
    toggleGroup,
    isGroupSelected,
    toggleSelectAll,
    getPartEffectiveCount,
    hasPartWithQuestions,
  } = useBankTestBuilder();

  const createTestMutation = useCreateTestFromBank({
    testInfo,
    setTestInfo,
    partConfigs,
    getPartEffectiveCount,
    setNotification,
  });

  // Đổi loại đề (hoặc danh sách part về) thì khởi tạo lại cấu hình và tải câu hỏi cho từng part.
  // useEffectEvent: luôn dùng loadQuestionsForPart/setPartConfigs mới nhất mà không làm effect chạy lại.
  const initPartConfigs = useEffectEvent((examTypeId: string, parts: ExamPartResponse[]) => {
    if (!examTypeId || !parts.length) {
      setPartConfigs((prev) => (Object.keys(prev).length ? {} : prev));
      return;
    }
    const initial: PartConfigMap = {};
    parts.forEach((p) => {
      initial[p.examPartId] = { ...defaultPartConfig(), expanded: false, loading: true };
    });
    setPartConfigs(initial);

    parts.forEach((part) => {
      loadQuestionsForPart(part.examPartId);
    });
  });

  useEffect(() => {
    initPartConfigs(testInfo.examTypeId, examParts);
  }, [testInfo.examTypeId, examParts]);

  const handleEditQuestionSuccess = () => {
    setEditingQuestionId(null);
    if (editingPartId) {
      loadQuestionsForPart(editingPartId);
    }
  };

  const handleExamTypeChange = (value: string) => {
    setTestInfo((prev) => ({
      ...prev,
      examTypeId: value,
      durationMinutes: durationMinutesFromExamType(examTypes, value),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testInfo.title?.trim() || !testInfo.examTypeId) {
      setNotification({ type: 'warning', message: t('submit.titleRequired') });
      return;
    }

    const partsToAdd = examParts.filter(hasPartWithQuestions);
    if (partsToAdd.length === 0) {
      setNotification({
        type: 'warning',
        message: t('submit.partRequired'),
      });
      return;
    }

    setNotification({});
    createTestMutation.mutate(partsToAdd);
  };

  const totalSelected = (examParts || []).reduce(
    (sum: number, p) => sum + getPartEffectiveCount(p.examPartId),
    0,
  );
  const hasAnyPartWithQuestions = (examParts || []).some(
    (p) => getPartEffectiveCount(p.examPartId) > 0,
  );

  return (
    <div className={cx('wrapper')}>
      <div className={cx('container')}>
        <PageHeader
          label={t('page.label')}
          title={t('page.title')}
          badgeLabel={t('page.badge')}
        />

        {notification.message && (
          <Alert
            variant={notification.type}
            className="mb-3"
            dismissible
            onClose={() => setNotification({})}
          >
            {notification.message}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <div className={cx('configCard')}>
            <div className={cx('sectionTitle')}>
              1. {t('info.section')}
            </div>
            <Row className="g-3">
              <Col md={8}>
                <div className={cx('formGroup')}>
                  <label>{t('info.title')}</label>
                  <input
                    type="text"
                    className={cx('input')}
                    value={testInfo.title}
                    onChange={(e) => setTestInfo({ ...testInfo, title: e.target.value })}
                    placeholder={t('info.titlePlaceholder')}
                    aria-label={t('info.titleAria')}
                  />
                </div>
              </Col>
              <Col md={4}>
                <div className={cx('formGroup')}>
                  <label>
                    {t('info.duration')}
                  </label>
                  <input
                    type="number"
                    min={0}
                    className={cx('input')}
                    value={testInfo.durationMinutes}
                    onChange={(e) =>
                      setTestInfo({ ...testInfo, durationMinutes: e.target.value })
                    }
                    placeholder={t('info.durationPlaceholder')}
                    aria-label={t('info.durationAria')}
                  />
                </div>
              </Col>
              <Col md={4}>
                <div className={cx('formGroup')}>
                  <label>{t('info.examType')}</label>
                  <select
                    className={cx('input')}
                    value={testInfo.examTypeId}
                    onChange={(e) => handleExamTypeChange(e.target.value)}
                    aria-label={t('info.examTypeAria')}
                  >
                    <option value="">{t('info.selectPlaceholder')}</option>
                    {examTypes.map((type) => (
                      <option key={type.examTypeId} value={type.examTypeId}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
              </Col>
              <Col md={4}>
                <div className={cx('formGroup')}>
                  <label>
                    {t('info.maxAttempts')}
                  </label>
                  <input
                    type="number"
                    min={0}
                    className={cx('input')}
                    value={testInfo.maxAttempts}
                    onChange={(e) => setTestInfo({ ...testInfo, maxAttempts: e.target.value })}
                    placeholder={t('info.maxAttemptsPlaceholder')}
                    aria-label={t('info.maxAttemptsAria')}
                  />
                </div>
              </Col>
              <CoinPriceField
                value={testInfo.costCoins}
                onChange={(v) => setTestInfo({ ...testInfo, costCoins: v })}
                groupClassName={cx('formGroup')}
                inputClassName={cx('input')}
              />
              <Col md={4}>
                <div className={cx('formGroup')}>
                  <label>{t('info.category')}</label>
                  <select
                    className={cx('input')}
                    value={testInfo.examCategoryId}
                    onChange={(e) =>
                      setTestInfo({ ...testInfo, examCategoryId: e.target.value })
                    }
                    aria-label={t('info.categoryAria')}
                  >
                    <option value="">{t('info.noCategory')}</option>
                    {examCategories.map((c) => (
                      <option key={c.examCategoryId} value={c.examCategoryId}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </Col>
              <Col md={12}>
                <div className={cx('formGroup')}>
                  <label>{t('info.description')}</label>
                  <textarea
                    className={cx('input')}
                    rows={2}
                    value={testInfo.description}
                    onChange={(e) => setTestInfo({ ...testInfo, description: e.target.value })}
                    placeholder={t('info.descriptionPlaceholder')}
                    aria-label={t('info.descriptionAria')}
                  />
                </div>
              </Col>
            </Row>
          </div>

          {testInfo.examTypeId && (examParts || []).length > 0 && (
            <div className={cx('configCard')}>
              <div className={cx('sectionTitle')}>
                2. {t('parts.section')}
              </div>
              <p className={cx('hint')}>
                {t.rich('page.hint', { strong: (chunks) => <strong>{chunks}</strong> })}
              </p>

              {examParts.map((part) => {
                const cfg = partConfigs[part.examPartId] ?? defaultPartConfig();
                const count = getPartEffectiveCount(part.examPartId);
                const maxInBank = (cfg.bankQuestions || []).length;
                const allSelected = maxInBank > 0 && (cfg.selectedIds || []).length === maxInBank;

                return (
                  <div key={part.examPartId} className={cx('partCard')}>
                    <button
                      type="button"
                      className={cx('partCardHeader')}
                      onClick={() => togglePartExpanded(part.examPartId)}
                      aria-expanded={cfg.expanded}
                    >
                      <span className={cx('partName')}>
                        {part.name}
                      </span>
                      <span className={cx('partBadge')}>{t('parts.questionCount', { count })}</span>
                      {cfg.expanded ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
                    </button>

                    {cfg.expanded && (
                      <div className={cx('partCardBody')}>
                        <div className={cx('modeTabs')}>
                          <button
                            type="button"
                            className={cx('modeTab', {
                              active: cfg.mode === SELECTION_MODES.RANDOM,
                            })}
                            onClick={() =>
                              updatePartConfig(part.examPartId, 'mode', SELECTION_MODES.RANDOM)
                            }
                            aria-pressed={cfg.mode === SELECTION_MODES.RANDOM}
                          >
                            {t('modes.random')}
                          </button>
                          <button
                            type="button"
                            className={cx('modeTab', {
                              active: cfg.mode === SELECTION_MODES.SEQUENTIAL,
                            })}
                            onClick={() =>
                              updatePartConfig(
                                part.examPartId,
                                'mode',
                                SELECTION_MODES.SEQUENTIAL,
                              )
                            }
                            aria-pressed={cfg.mode === SELECTION_MODES.SEQUENTIAL}
                          >
                            {t('modes.sequential')}
                          </button>
                          <button
                            type="button"
                            className={cx('modeTab', {
                              active: cfg.mode === SELECTION_MODES.MANUAL,
                            })}
                            onClick={() =>
                              updatePartConfig(part.examPartId, 'mode', SELECTION_MODES.MANUAL)
                            }
                            aria-pressed={cfg.mode === SELECTION_MODES.MANUAL}
                          >
                            {t('modes.manual')}
                          </button>
                        </div>

                        {cfg.mode === SELECTION_MODES.RANDOM && (
                          <div className={cx('randomRow')}>
                            <label className={cx('randomLabel')}>{t('parts.randomCount')}</label>
                            <input
                              type="number"
                              min={0}
                              max={Math.max(maxInBank, 0)}
                              className={cx('input', 'randomInput')}
                              value={cfg.randomCount}
                              onChange={(e) =>
                                updatePartConfig(part.examPartId, 'randomCount', e.target.value)
                              }
                              aria-label={t('parts.randomAria', { part: part.name ?? '' })}
                            />
                            <span className={cx('randomHint')}>
                              {t('parts.maxInBank', { count: maxInBank })}
                            </span>
                          </div>
                        )}

                        {cfg.mode === SELECTION_MODES.SEQUENTIAL && (
                          <div
                            className={cx('randomRow')}
                            style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}
                          >
                            <label className={cx('randomLabel')}>{t('parts.fromIndex')}</label>
                            <input
                              type="number"
                              min={1}
                              max={Math.max(maxInBank, 1)}
                              className={cx('input', 'randomInput')}
                              value={cfg.fromIndex}
                              onChange={(e) =>
                                updatePartConfig(part.examPartId, 'fromIndex', e.target.value)
                              }
                              aria-label={t('parts.fromAria', { part: part.name ?? '' })}
                            />
                            <label className={cx('randomLabel')}>{t('parts.toIndex')}</label>
                            <input
                              type="number"
                              min={1}
                              max={Math.max(maxInBank, 1)}
                              className={cx('input', 'randomInput')}
                              value={cfg.toIndex}
                              onChange={(e) =>
                                updatePartConfig(part.examPartId, 'toIndex', e.target.value)
                              }
                              aria-label={t('parts.toAria', { part: part.name ?? '' })}
                            />
                            <span className={cx('randomHint')}>
                              {t('parts.maxInBank', { count: maxInBank })}
                            </span>
                          </div>
                        )}

                        {cfg.loading && (
                          <div className={cx('loadingWrap')}>
                            <Spinner animation="border" size="sm" />{' '}
                            <span>{t('parts.loading')}</span>
                          </div>
                        )}

                        {!cfg.loading && maxInBank === 0 && (
                          <Alert variant="info" className="mb-0 mt-2">
                            {t('page.noQuestions')}
                          </Alert>
                        )}

                        {!cfg.loading &&
                          cfg.mode === SELECTION_MODES.MANUAL &&
                          maxInBank > 0 &&
                          (() => {
                            const groups = groupQuestionsByPassage(cfg.bankQuestions);
                            return (
                              <>
                                <div className={cx('selectAllRow')}>
                                  <Form.Check
                                    type="checkbox"
                                    id={`select-all-${part.examPartId}`}
                                    label={t('parts.selectAll', { count: maxInBank })}
                                    checked={allSelected}
                                    onChange={(e) =>
                                      toggleSelectAll(part.examPartId, e.target.checked)
                                    }
                                    aria-label={t('parts.selectAllAria', { part: part.name ?? '' })}
                                  />
                                </div>
                                <div className={cx('groupList')}>
                                  {(() => {
                                    let listOffset = 0;
                                    return groups.map((gr) => {
                                      const grSelected = isGroupSelected(
                                        part.examPartId,
                                        gr.groupKey,
                                      );
                                      const grLabel =
                                        gr.passageId != null
                                          ? t('parts.passageGroup', { count: gr.questions.length })
                                          : t('parts.standalone', { count: gr.questions.length });
                                      const groupStartOffset = listOffset;
                                      listOffset += gr.questions.length;
                                      return (
                                        <div
                                          key={gr.groupKey}
                                          className={cx('passageGroup', {
                                            selected: grSelected,
                                          })}
                                        >
                                          <div className={cx('groupHeader')}>
                                            <Form.Check
                                              type="checkbox"
                                              id={`gr-${part.examPartId}-${gr.groupKey}`}
                                              checked={grSelected}
                                              onChange={() =>
                                                toggleGroup(part.examPartId, gr.groupKey)
                                              }
                                              aria-label={grLabel}
                                            />
                                            <span className={cx('groupLabel')}>{grLabel}</span>
                                          </div>
                                          <ul className={cx('questionList')}>
                                            {gr.questions.map((q, index) => {
                                              const id = q.questionId ?? q.id;
                                              if (id == null) return null;
                                              const checked = (cfg.selectedIds || []).includes(id);
                                              const displayNo = getQuestionDisplayNumber(
                                                q,
                                                groupStartOffset + index,
                                              );
                                              return (
                                                <li
                                                  key={id}
                                                  className={cx('questionItem', {
                                                    selected: checked,
                                                  })}
                                                >
                                                  <span className={cx('questionIndex')}>
                                                    {displayNo}.
                                                  </span>
                                                  <span className={cx('questionText')}>
                                                    {q.questionText || t('parts.noContent')}
                                                  </span>
                                                  <button
                                                    type="button"
                                                    className={cx('btnEditQuestion')}
                                                    onClick={() => {
                                                      setEditingPartId(part.examPartId);
                                                      setEditingQuestionId(id);
                                                    }}
                                                    title={t('parts.editQuestion')}
                                                  >
                                                    <Pencil size={18} />
                                                  </button>
                                                </li>
                                              );
                                            })}
                                          </ul>
                                        </div>
                                      );
                                    });
                                  })()}
                                </div>
                              </>
                            );
                          })()}
                      </div>
                    )}
                  </div>
                );
              })}

              <p className={cx('totalCount')}>
                {t.rich('parts.total', { count: totalSelected, strong: (chunks) => <strong>{chunks}</strong> })}
              </p>
            </div>
          )}

          <div className={cx('footer')}>
            <ButtonPrime
              type="submit"
              variant="primary"
              size="md"
              disabled={
                createTestMutation.isPending ||
                !hasAnyPartWithQuestions ||
                !testInfo.examTypeId
              }
            >
              {createTestMutation.isPending ? (
                <>
                  <Spinner animation="border" size="sm" /> {t('submit.creating')}
                </>
              ) : (
                <>
                  {t('submit.submit')}
                </>
              )}
            </ButtonPrime>
          </div>
        </Form>
      </div>

      <EditQuestionModal
        show={!!editingQuestionId}
        onHide={() => setEditingQuestionId(null)}
        questionId={editingQuestionId}
        onSuccess={handleEditQuestionSuccess}
      />
    </div>
  );
};

export default CreateTestFromBank;
