'use client';

import { useState } from 'react';
import { Alert, Spinner } from 'react-bootstrap';
import {
  ChevronDown,
  ChevronUp,
  Eye,
  Pencil,
  Trash2,
} from 'lucide-react';
import classNames from 'classnames/bind';
import { useTranslations } from 'next-intl';
import { useBaseMetaData } from '@/app/features/tests/creator/hooks/useBaseMetaData';
import { useHasPermission } from '@/app/hooks/usePermission';
import PageHeader from '@/app/components/PageHeader/PageHeader';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import ConfirmDeleteModal from '@/app/components/modal/ConfirmDeleteModal';
import { getQuestionDisplayNumber } from '@/app/features/tests/questionNumber';
import { buildCollectionTree } from '@/app/features/tests/collectionTree';
import EditQuestionModal from '@/app/features/tests/EditQuestionModal';
import ViewQuestionModal from './_components/ViewQuestionModal';
import { PermissionCode } from '@/app/enums';
import { getApiErrorMessage } from '@/app/utils/apiError';
import { useDeleteQuestion } from './_hooks/useDeleteQuestion';
import {
  BANK_SCOPE,
  usePersonalQuestionBank,
} from './_hooks/usePersonalQuestionBank';
import type { BankScope } from './_hooks/usePersonalQuestionBank';
import styles from './PersonalQuestionBank.module.scss';

const cx = classNames.bind(styles);

type DeleteQuestionTarget = {
  questionId: string;
  partId?: string | null;
  chapterId?: string | null;
};

const PersonalQuestionBank = () => {
  const t = useTranslations('TestCreatorBank');
  const canAccessAdminBank = useHasPermission(PermissionCode.QUESTION_MANAGE);
  const [bankScope, setBankScope] = useState<BankScope>(
    canAccessAdminBank ? BANK_SCOPE.ADMIN : BANK_SCOPE.PERSONAL,
  );
  const [selectedClassId, setSelectedClassId] = useState('');
  const [examTypeId, setExamTypeId] = useState('');
  const [notification, setNotification] = useState<{ type?: string; message?: string }>({});
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingPartId, setEditingPartId] = useState<string | null>(null);
  const [deleteQuestionTarget, setDeleteQuestionTarget] =
    useState<DeleteQuestionTarget | null>(null);
  const [viewingQuestionId, setViewingQuestionId] = useState<string | null>(null);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [collectionFilter, setCollectionFilter] = useState('');
  const [includeChildCollections, setIncludeChildCollections] = useState(true);

  // Mất quyền kho admin thì chuyển về kho cá nhân (điều chỉnh state ngay khi render).
  if (!canAccessAdminBank && bankScope === BANK_SCOPE.ADMIN) {
    setBankScope(BANK_SCOPE.PERSONAL);
  }

  const { examTypes, examParts } = useBaseMetaData(examTypeId);

  const {
    collectionsList,
    getCollectionName,
    selectedIsParent,
    filterByCollection,
    classes,
    partConfigs,
    chapters,
    chaptersLoading,
    chapterConfigs,
    togglePartExpanded,
    toggleChapterExpanded,
    invalidateAfterEdit,
    invalidateAfterDelete,
    loadError,
  } = usePersonalQuestionBank({
    bankScope,
    examTypeId,
    selectedClassId,
    examParts,
    collectionFilter,
    includeChildCollections,
  });

  const deleteMutation = useDeleteQuestion();
  const isDeleting = (id: string) =>
    deleteMutation.isPending && deleteMutation.variables === id;

  // Có lỗi tải dữ liệu mới thì hiện thông báo một lần; người dùng đóng thì không hiện lại
  // cho tới khi xuất hiện lỗi khác.
  const [notifiedLoadError, setNotifiedLoadError] = useState<string | null>(null);
  if (loadError !== notifiedLoadError) {
    setNotifiedLoadError(loadError);
    if (loadError) setNotification({ type: 'danger', message: loadError });
  }

  const handleEditSuccess = async () => {
    setEditingQuestionId(null);
    await invalidateAfterEdit({ editingPartId, editingChapterId });
  };

  const handleDeleteQuestion = () => {
    if (!deleteQuestionTarget) return;
    const { questionId, partId = null, chapterId = null } = deleteQuestionTarget;

    deleteMutation.mutate(questionId, {
      onSuccess: async () => {
        if (editingQuestionId === questionId) {
          setEditingQuestionId(null);
        }
        await invalidateAfterDelete({ partId, chapterId });
        setNotification({
          type: 'success',
          message: t('bank.deleted'),
        });
        setDeleteQuestionTarget(null);
      },
      onError: (error: unknown) => {
        const message = getApiErrorMessage(error, t('bank.deleteError'));
        setNotification({ type: 'danger', message });
      },
    });
  };

  return (
    <div className={cx('wrapper')}>
      <div className={cx('container')}>
        <PageHeader
          label={t('bank.label')}
          title={
            bankScope === BANK_SCOPE.CLASS
              ? t('bank.title.class')
              : bankScope === BANK_SCOPE.ADMIN
                ? t('bank.title.admin')
                : t('bank.title.personal')
          }
          badgeLabel={
            bankScope === BANK_SCOPE.CLASS
              ? t('bank.badge.class')
              : bankScope === BANK_SCOPE.ADMIN
                ? t('bank.badge.admin')
                : t('bank.badge.personal')
          }
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

        <div className={cx('card')}>
          <div className={cx('sectionTitle')}>
            {t('bank.filters')}
          </div>

          <div className={cx('scopeSwitch')}>
            {canAccessAdminBank && (
              <ButtonPrime
                size="sm"
                variant={bankScope === BANK_SCOPE.ADMIN ? 'primary' : 'outline'}
                onClick={() => {
                  setBankScope(BANK_SCOPE.ADMIN);
                  setSelectedClassId('');
                }}
              >
                {t('bank.title.admin')}
              </ButtonPrime>
            )}
            <ButtonPrime
              size="sm"
              variant={bankScope === BANK_SCOPE.PERSONAL ? 'primary' : 'outline'}
              onClick={() => {
                setBankScope(BANK_SCOPE.PERSONAL);
                setSelectedClassId('');
              }}
            >
              {t('source.personal')}
            </ButtonPrime>
            <ButtonPrime
              size="sm"
              variant={bankScope === BANK_SCOPE.CLASS ? 'primary' : 'outline'}
              onClick={() => setBankScope(BANK_SCOPE.CLASS)}
            >
              {t('source.class')}
            </ButtonPrime>
          </div>

          <div className={cx('filterGrid')}>
            {bankScope === BANK_SCOPE.CLASS && (
              <select
                className={cx('selectField')}
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                aria-label={t('bank.selectClassAria')}
              >
                <option value="">{t('bank.selectClass')}</option>
                {classes.map((c) => (
                  <option key={c.classId} value={c.classId}>
                    {c.className || t('bank.classFallback', { classId: c.classId })}
                  </option>
                ))}
              </select>
            )}

            {(bankScope === BANK_SCOPE.PERSONAL || bankScope === BANK_SCOPE.ADMIN) && (
              <select
                className={cx('selectField')}
                value={examTypeId}
                onChange={(e) => setExamTypeId(e.target.value)}
                aria-label={t('info.examTypeAria')}
              >
                <option value="">{t('bank.selectExamType')}</option>
                {examTypes.map((type) => (
                  <option key={type.examTypeId} value={type.examTypeId}>
                    {type.name}
                  </option>
                ))}
              </select>
            )}

            <select
              className={cx('selectField')}
              value={collectionFilter}
              onChange={(e) => setCollectionFilter(e.target.value)}
              aria-label={t('bank.collectionFilterAria')}
            >
              <option value="">{t('bank.allCollections')}</option>
              <option value="__none__">{t('bank.noCollectionOption')}</option>
              {buildCollectionTree(collectionsList).map((c) => (
                <option key={c.collectionId} value={c.collectionId}>
                  {c.depth > 0 ? `    └ ${c.name}` : c.name}
                </option>
              ))}
            </select>

            {selectedIsParent && (
              <label className={cx('includeChildrenToggle')} title={t('bank.includeChildrenTitle')}>
                <input
                  type="checkbox"
                  checked={includeChildCollections}
                  onChange={(e) => setIncludeChildCollections(e.target.checked)}
                />
                <span>{t('bank.includeChildren')}</span>
              </label>
            )}
          </div>
        </div>

        {bankScope === BANK_SCOPE.CLASS && selectedClassId && (
          <div className={cx('card')}>
            <div className={cx('sectionTitle')}>
              {t('bank.byChapter')}
            </div>

            {chaptersLoading ? (
              <div className={cx('loadingWrap')}>
                <Spinner animation="border" size="sm" />{' '}
                <span>{t('bank.loadingChapters')}</span>
              </div>
            ) : chapters.length === 0 ? (
              <Alert variant="info" className="mb-0">
                {t('bank.noChapters')}
              </Alert>
            ) : (
              chapters.map((chapter) => {
                const cfg = chapterConfigs[chapter.chapterId] || {
                  expanded: false,
                  loading: false,
                  questions: [],
                  count: null,
                };
                const displayCount =
                  cfg.count !== null && cfg.count !== undefined ? cfg.count : '...';

                return (
                  <div key={chapter.chapterId} className={cx('partCard')}>
                    <button
                      type="button"
                      className={cx('partCardHeader')}
                      onClick={() => toggleChapterExpanded(chapter.chapterId)}
                      aria-expanded={cfg.expanded}
                    >
                      <span className={cx('partName')}>
                        {chapter.title}
                      </span>
                      <span className={cx('partBadge')}>{t('bank.questionCountRaw', { count: displayCount })}</span>
                      {cfg.expanded ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
                    </button>

                    {cfg.expanded && (
                      <div className={cx('partCardBody')}>
                        {cfg.loading ? (
                          <div className={cx('loadingWrap')}>
                            <Spinner animation="border" size="sm" />{' '}
                            <span>{t('parts.loading')}</span>
                          </div>
                        ) : (() => {
                          const visibleChapterQuestions = filterByCollection(cfg.questions || []);
                          if (visibleChapterQuestions.length === 0) {
                            return (
                              <Alert variant="info" className="mb-0">
                                {collectionFilter
                                  ? t('bank.noQuestionsInCollection')
                                  : t('bank.chapterEmpty')}
                              </Alert>
                            );
                          }
                          return (
                            <ul className={cx('questionList')}>
                              {visibleChapterQuestions.map((q, idx) => {
                                const id = q.questionId ?? q.id;
                                if (!id) return null;
                                const collectionName = getCollectionName(q.collectionId);

                                return (
                                  <li key={id} className={cx('questionItem')}>
                                    <span className={cx('questionIndex')}>
                                      {getQuestionDisplayNumber(q, idx)}.
                                    </span>
                                    <span className={cx('questionText')}>
                                      {q.questionText || t('parts.noContent')}
                                      {collectionName ? (
                                        <span className={cx('collectionBadge')} title={t('bank.collectionBadgeTitle')}>
                                          {collectionName}
                                        </span>
                                      ) : (
                                        <span
                                          className={cx('collectionBadge', 'collectionBadgeEmpty')}
                                          title={t('bank.noCollection')}
                                        >
                                          {t('bank.noCollection')}
                                        </span>
                                      )}
                                    </span>
                                    <div className={cx('questionActions')}>
                                      <ButtonPrime
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => setViewingQuestionId(id)}
                                        aria-label={t('bank.viewQuestion', { number: getQuestionDisplayNumber(q, idx) })}
                                      >
                                        <Eye size={16} />
                                      </ButtonPrime>
                                      <ButtonPrime
                                        size="icon"
                                        variant="ghost"
                                        disabled={isDeleting(id)}
                                        onClick={() => {
                                          setEditingChapterId(chapter.chapterId);
                                          setEditingPartId(null);
                                          setEditingQuestionId(id);
                                        }}
                                        aria-label={t('bank.editQuestion', { number: getQuestionDisplayNumber(q, idx) })}
                                      >
                                        <Pencil size={16} />
                                      </ButtonPrime>
                                      <ButtonPrime
                                        size="icon"
                                        variant="dangerGhost"
                                        disabled={isDeleting(id)}
                                        onClick={() =>
                                          setDeleteQuestionTarget({
                                            questionId: id,
                                            chapterId: chapter.chapterId,
                                          })
                                        }
                                        aria-label={t('bank.deleteQuestion', { number: getQuestionDisplayNumber(q, idx) })}
                                      >
                                        <Trash2 size={16} />
                                      </ButtonPrime>
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {(bankScope === BANK_SCOPE.PERSONAL || bankScope === BANK_SCOPE.ADMIN) &&
          examTypeId &&
          examParts?.length > 0 && (
            <div className={cx('card')}>
              <div className={cx('sectionTitle')}>
                {bankScope === BANK_SCOPE.ADMIN
                  ? t('bank.adminByPart')
                  : t('bank.byPart')}
              </div>

              {examParts.map((part) => {
                const cfg = partConfigs[part.examPartId] || {
                  expanded: false,
                  loading: false,
                  questions: [],
                };
                const visibleQuestions = filterByCollection(cfg.questions || []);
                const total = visibleQuestions.length;
                const totalAll = cfg.questions?.length || 0;

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
                      <span className={cx('partBadge')}>
                        {collectionFilter ? t('bank.questionCountRaw', { count: `${total}/${totalAll}` }) : t('parts.questionCount', { count: total })}
                      </span>
                      {cfg.expanded ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
                    </button>

                    {cfg.expanded && (
                      <div className={cx('partCardBody')}>
                        {cfg.loading ? (
                          <div className={cx('loadingWrap')}>
                            <Spinner animation="border" size="sm" />{' '}
                            <span>{t('parts.loading')}</span>
                          </div>
                        ) : total === 0 ? (
                          <Alert variant="info" className="mb-0">
                            {collectionFilter
                              ? t('bank.noQuestionsInCollection')
                              : t('bank.partEmpty')}
                          </Alert>
                        ) : (
                          <ul className={cx('questionList')}>
                            {visibleQuestions.map((q, idx) => {
                              const id = q.questionId ?? q.id;
                              if (!id) return null;
                              const collectionName = getCollectionName(q.collectionId);

                              return (
                                <li key={id} className={cx('questionItem')}>
                                  <span className={cx('questionIndex')}>
                                    {getQuestionDisplayNumber(q, idx)}.
                                  </span>
                                  <span className={cx('questionText')}>
                                    {q.questionText || t('parts.noContent')}
                                    {collectionName ? (
                                      <span className={cx('collectionBadge')} title={t('bank.collectionBadgeTitle')}>
                                        {collectionName}
                                      </span>
                                    ) : (
                                      <span
                                        className={cx('collectionBadge', 'collectionBadgeEmpty')}
                                        title={t('bank.noCollection')}
                                      >
                                        {t('bank.noCollection')}
                                      </span>
                                    )}
                                  </span>
                                  <div className={cx('questionActions')}>
                                    <ButtonPrime
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => setViewingQuestionId(id)}
                                      aria-label={t('bank.viewQuestion', { number: getQuestionDisplayNumber(q, idx) })}
                                    >
                                      <Eye size={16} />
                                    </ButtonPrime>
                                    {bankScope === BANK_SCOPE.PERSONAL && (
                                      <>
                                        <ButtonPrime
                                          size="icon"
                                          variant="ghost"
                                          disabled={isDeleting(id)}
                                          onClick={() => {
                                            setEditingPartId(part.examPartId);
                                            setEditingChapterId(null);
                                            setEditingQuestionId(id);
                                          }}
                                          aria-label={t('bank.editQuestion', { number: getQuestionDisplayNumber(q, idx) })}
                                        >
                                          <Pencil size={16} />
                                        </ButtonPrime>
                                        <ButtonPrime
                                          size="icon"
                                          variant="dangerGhost"
                                          disabled={isDeleting(id)}
                                          onClick={() =>
                                            setDeleteQuestionTarget({
                                              questionId: id,
                                              partId: part.examPartId,
                                            })
                                          }
                                          aria-label={t('bank.deleteQuestion', { number: getQuestionDisplayNumber(q, idx) })}
                                        >
                                          <Trash2 size={16} />
                                        </ButtonPrime>
                                      </>
                                    )}
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
      </div>

      <EditQuestionModal
        show={!!editingQuestionId}
        onHide={() => setEditingQuestionId(null)}
        questionId={editingQuestionId}
        onSuccess={handleEditSuccess}
      />

      <ViewQuestionModal
        show={!!viewingQuestionId}
        onHide={() => setViewingQuestionId(null)}
        questionId={viewingQuestionId}
      />

      <ConfirmDeleteModal
        show={Boolean(deleteQuestionTarget)}
        onClose={() => setDeleteQuestionTarget(null)}
        onConfirm={handleDeleteQuestion}
        title={t('bank.confirmDeleteTitle')}
        message={t('bank.confirmDeleteMessage')}
      />
    </div>
  );
};

export default PersonalQuestionBank;
