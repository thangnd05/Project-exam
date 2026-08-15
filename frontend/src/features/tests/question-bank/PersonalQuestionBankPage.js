'use client';

import { useEffect, useState } from 'react';
import { Alert, Spinner } from 'react-bootstrap';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Eye,
  Library,
  Pencil,
  School,
  Trash2,
} from 'lucide-react';
import classNames from 'classnames/bind';
import { useBaseMetaData } from '~/shared/hooks/useBaseMetaData';
import { useHasPermission } from '~/shared/hooks/usePermission';
import PageHeader from '~/shared/ui/PageHeader/PageHeader';
import ButtonPrime from '~/shared/ui/Button/ButtonPrime';
import ConfirmDeleteModal from '~/shared/ui/modal/ConfirmDeleteModal';
import { getQuestionDisplayNumber } from '~/shared/utils/questionNumber';
import { buildCollectionTree } from '~/shared/utils/collectionTree';
import EditQuestionModal from './modals/EditQuestionModal';
import ViewQuestionModal from './modals/ViewQuestionModal';
import { useDeleteQuestion } from '~/features/tests/question-bank/hooks/useDeleteQuestion';
import {
  BANK_SCOPE,
  usePersonalQuestionBank,
} from '~/features/tests/question-bank/hooks/usePersonalQuestionBank';
import styles from './PersonalQuestionBankPage.module.scss';

const cx = classNames.bind(styles);

const PersonalQuestionBankPage = () => {
  const canAccessAdminBank = useHasPermission('QUESTION:MANAGE');
  const [bankScope, setBankScope] = useState(
    canAccessAdminBank ? BANK_SCOPE.ADMIN : BANK_SCOPE.PERSONAL,
  );
  const [selectedClassId, setSelectedClassId] = useState('');
  const [examTypeId, setExamTypeId] = useState('');
  const [notification, setNotification] = useState({});
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editingPartId, setEditingPartId] = useState(null);
  const [deleteQuestionTarget, setDeleteQuestionTarget] = useState(null);
  const [viewingQuestionId, setViewingQuestionId] = useState(null);
  const [editingChapterId, setEditingChapterId] = useState(null);
  const [collectionFilter, setCollectionFilter] = useState('');
  const [includeChildCollections, setIncludeChildCollections] = useState(true);

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
    clearLoadError,
  } = usePersonalQuestionBank({
    bankScope,
    examTypeId,
    selectedClassId,
    examParts,
    collectionFilter,
    includeChildCollections,
  });

  const deleteMutation = useDeleteQuestion();
  const isDeleting = (id) =>
    deleteMutation.isPending && deleteMutation.variables === id;

  useEffect(() => {
    if (!canAccessAdminBank && bankScope === BANK_SCOPE.ADMIN) {
      setBankScope(BANK_SCOPE.PERSONAL);
    }
  }, [canAccessAdminBank, bankScope]);

  useEffect(() => {
    if (loadError) {
      setNotification({ type: 'danger', message: loadError });
      clearLoadError();
    }
  }, [loadError, clearLoadError]);

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
          message: 'Đã xóa câu hỏi thành công.',
        });
        setDeleteQuestionTarget(null);
      },
      onError: (error) => {
        const message =
          error.response?.data?.message || 'Không thể xóa câu hỏi. Vui lòng thử lại.';
        setNotification({ type: 'danger', message });
      },
    });
  };

  return (
    <div className={cx('wrapper')}>
      <div className={cx('container')}>
        <PageHeader
          label="Kho câu hỏi"
          title={
            bankScope === BANK_SCOPE.CLASS
              ? 'Kho câu hỏi lớp học'
              : bankScope === BANK_SCOPE.ADMIN
                ? 'Kho đề quản trị'
                : 'Kho câu hỏi cá nhân'
          }
          badgeLabel={
            <>
              <Library size={16} />
              <span>
                {bankScope === BANK_SCOPE.CLASS
                  ? 'Quản lý câu hỏi theo từng Chương. Bấm bút chì để sửa nhanh.'
                  : bankScope === BANK_SCOPE.ADMIN
                    ? 'Kho câu hỏi quản trị viên cung cấp, dùng làm nguồn tạo đề.'
                    : 'Quản lý câu hỏi theo từng Part. Bấm bút chì để sửa nhanh.'}
              </span>
            </>
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
            <School size={18} /> Bộ lọc kho câu hỏi
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
                Kho đề quản trị
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
              Kho cá nhân
            </ButtonPrime>
            <ButtonPrime
              size="sm"
              variant={bankScope === BANK_SCOPE.CLASS ? 'primary' : 'outline'}
              onClick={() => setBankScope(BANK_SCOPE.CLASS)}
            >
              Kho lớp học
            </ButtonPrime>
          </div>

          <div className={cx('filterGrid')}>
            {bankScope === BANK_SCOPE.CLASS && (
              <select
                className={cx('selectField')}
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                aria-label="Chọn lớp học"
              >
                <option value="">-- Chọn lớp học --</option>
                {(classes || []).map((c) => (
                  <option key={c.classId} value={c.classId}>
                    {c.className || `Lớp ${c.classId}`}
                  </option>
                ))}
              </select>
            )}

            {(bankScope === BANK_SCOPE.PERSONAL || bankScope === BANK_SCOPE.ADMIN) && (
              <select
                className={cx('selectField')}
                value={examTypeId}
                onChange={(e) => setExamTypeId(e.target.value)}
                aria-label="Loại kỳ thi"
              >
                <option value="">-- Chọn loại kỳ thi --</option>
                {(examTypes || []).map((t) => (
                  <option key={t.examTypeId} value={t.examTypeId}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}

            <select
              className={cx('selectField')}
              value={collectionFilter}
              onChange={(e) => setCollectionFilter(e.target.value)}
              aria-label="Lọc theo nhóm (Collection)"
            >
              <option value="">-- Tất cả nhóm (Collection) --</option>
              <option value="__none__">(Chưa gắn nhóm)</option>
              {buildCollectionTree(collectionsList).map((c) => (
                <option key={c.collectionId} value={c.collectionId}>
                  {c.depth > 0 ? `    └ ${c.name}` : c.name}
                </option>
              ))}
            </select>

            {selectedIsParent && (
              <label className={cx('includeChildrenToggle')} title="Gộp câu hỏi của các nhóm con">
                <input
                  type="checkbox"
                  checked={includeChildCollections}
                  onChange={(e) => setIncludeChildCollections(e.target.checked)}
                />
                <span>Gộp nhóm con</span>
              </label>
            )}
          </div>
        </div>

        {bankScope === BANK_SCOPE.CLASS && selectedClassId && (
          <div className={cx('card')}>
            <div className={cx('sectionTitle')}>
              <BookOpen size={18} /> Danh sách câu hỏi theo Chương
            </div>

            {chaptersLoading ? (
              <div className={cx('loadingWrap')}>
                <Spinner animation="border" size="sm" />{' '}
                <span>Đang tải danh sách chương...</span>
              </div>
            ) : chapters.length === 0 ? (
              <Alert variant="info" className="mb-0">
                Lớp này chưa có chương nào.
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
                        <BookOpen size={20} /> {chapter.title}
                      </span>
                      <span className={cx('partBadge')}>{displayCount} câu</span>
                      {cfg.expanded ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
                    </button>

                    {cfg.expanded && (
                      <div className={cx('partCardBody')}>
                        {cfg.loading ? (
                          <div className={cx('loadingWrap')}>
                            <Spinner animation="border" size="sm" />{' '}
                            <span>Đang tải câu hỏi...</span>
                          </div>
                        ) : (() => {
                          const visibleChapterQuestions = filterByCollection(cfg.questions || []);
                          if (visibleChapterQuestions.length === 0) {
                            return (
                              <Alert variant="info" className="mb-0">
                                {collectionFilter
                                  ? 'Không có câu hỏi nào thuộc nhóm đã chọn.'
                                  : 'Chương này chưa có câu hỏi.'}
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
                                      {q.questionText || '(Không có nội dung)'}
                                      {collectionName ? (
                                        <span className={cx('collectionBadge')} title="Nhóm (Collection)">
                                          <Library size={12} /> {collectionName}
                                        </span>
                                      ) : (
                                        <span
                                          className={cx('collectionBadge', 'collectionBadgeEmpty')}
                                          title="Chưa gắn nhóm"
                                        >
                                          Chưa gắn nhóm
                                        </span>
                                      )}
                                    </span>
                                    <div className={cx('questionActions')}>
                                      <ButtonPrime
                                        size="icon"
                                        variant="ghost"
                                        className={cx('iconBtn')}
                                        onClick={() => setViewingQuestionId(id)}
                                        aria-label={`Xem câu ${getQuestionDisplayNumber(q, idx)}`}
                                      >
                                        <Eye size={16} />
                                      </ButtonPrime>
                                      <ButtonPrime
                                        size="icon"
                                        variant="ghost"
                                        className={cx('iconBtn')}
                                        disabled={isDeleting(id)}
                                        onClick={() => {
                                          setEditingChapterId(chapter.chapterId);
                                          setEditingPartId(null);
                                          setEditingQuestionId(id);
                                        }}
                                        aria-label={`Sửa câu ${getQuestionDisplayNumber(q, idx)}`}
                                      >
                                        <Pencil size={16} />
                                      </ButtonPrime>
                                      <ButtonPrime
                                        size="icon"
                                        variant="dangerGhost"
                                        className={cx('iconBtn')}
                                        disabled={isDeleting(id)}
                                        onClick={() =>
                                          setDeleteQuestionTarget({
                                            questionId: id,
                                            chapterId: chapter.chapterId,
                                          })
                                        }
                                        aria-label={`Xóa câu ${getQuestionDisplayNumber(q, idx)}`}
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
                <BookOpen size={18} />{' '}
                {bankScope === BANK_SCOPE.ADMIN
                  ? 'Câu hỏi quản trị theo Part'
                  : 'Danh sách câu hỏi theo Part'}
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
                        <BookOpen size={20} /> {part.name}
                      </span>
                      <span className={cx('partBadge')}>
                        {collectionFilter ? `${total}/${totalAll}` : total} câu
                      </span>
                      {cfg.expanded ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
                    </button>

                    {cfg.expanded && (
                      <div className={cx('partCardBody')}>
                        {cfg.loading ? (
                          <div className={cx('loadingWrap')}>
                            <Spinner animation="border" size="sm" />{' '}
                            <span>Đang tải câu hỏi...</span>
                          </div>
                        ) : total === 0 ? (
                          <Alert variant="info" className="mb-0">
                            {collectionFilter
                              ? 'Không có câu hỏi nào thuộc nhóm đã chọn.'
                              : 'Part này chưa có câu hỏi.'}
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
                                    {q.questionText || '(Không có nội dung)'}
                                    {collectionName ? (
                                      <span className={cx('collectionBadge')} title="Nhóm (Collection)">
                                        <Library size={12} /> {collectionName}
                                      </span>
                                    ) : (
                                      <span
                                        className={cx('collectionBadge', 'collectionBadgeEmpty')}
                                        title="Chưa gắn nhóm"
                                      >
                                        Chưa gắn nhóm
                                      </span>
                                    )}
                                  </span>
                                  <div className={cx('questionActions')}>
                                    <ButtonPrime
                                      size="icon"
                                      variant="ghost"
                                      className={cx('iconBtn')}
                                      onClick={() => setViewingQuestionId(id)}
                                      aria-label={`Xem câu ${getQuestionDisplayNumber(q, idx)}`}
                                    >
                                      <Eye size={16} />
                                    </ButtonPrime>
                                    {bankScope === BANK_SCOPE.PERSONAL && (
                                      <>
                                        <ButtonPrime
                                          size="icon"
                                          variant="ghost"
                                          className={cx('iconBtn')}
                                          disabled={isDeleting(id)}
                                          onClick={() => {
                                            setEditingPartId(part.examPartId);
                                            setEditingChapterId(null);
                                            setEditingQuestionId(id);
                                          }}
                                          aria-label={`Sửa câu ${getQuestionDisplayNumber(q, idx)}`}
                                        >
                                          <Pencil size={16} />
                                        </ButtonPrime>
                                        <ButtonPrime
                                          size="icon"
                                          variant="dangerGhost"
                                          className={cx('iconBtn')}
                                          disabled={isDeleting(id)}
                                          onClick={() =>
                                            setDeleteQuestionTarget({
                                              questionId: id,
                                              partId: part.examPartId,
                                            })
                                          }
                                          aria-label={`Xóa câu ${getQuestionDisplayNumber(q, idx)}`}
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
        title="Xác nhận xóa câu hỏi"
        message="Bạn có chắc muốn xóa câu hỏi này không? Hành động này không thể hoàn tác."
      />
    </div>
  );
};

export default PersonalQuestionBankPage;
