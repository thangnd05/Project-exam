import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import {Alert, Spinner} from 'react-bootstrap';
import {
  getQuestionsByPart,
  getMyClassBankQuestions,
  getMyClassBankCount,
} from '~/shared/api/questionApi';
import { getMyClasses } from '~/shared/api/classApi';
import { getChaptersByClass } from '~/shared/api/chapterApi';
import { getQuestionCollections } from '~/shared/api/questionCollectionApi';
import classNames from 'classnames/bind';
import {
  IoBookOutline,
  IoChevronDownOutline,
  IoChevronUpOutline,
  IoCreateOutline,
  IoEyeOutline,
  IoLibraryOutline,
  IoSchoolOutline,
  IoTrashOutline,
} from 'react-icons/io5';
import {useBaseMetaData} from '~/shared/hooks/useBaseMetaData';
import {useHasPermission} from '~/shared/hooks/usePermission';
import PageHeader from '~/shared/ui/PageHeader/PageHeader';
import ButtonPrime from '~/shared/ui/Button/ButtonPrime';
import EditQuestionModal from './modals/EditQuestionModal';
import ViewQuestionModal from './modals/ViewQuestionModal';
import { useDeleteQuestion } from './hooks/useDeleteQuestion';
import ConfirmDeleteModal from '~/shared/ui/modal/ConfirmDeleteModal';
import { getQuestionDisplayNumber } from '~/shared/utils/questionNumber';
import { buildCollectionTree, getCollectionWithDescendantIds, isParentCollection } from '~/shared/utils/collectionTree';
import styles from './PersonalQuestionBankPage.module.scss';

const cx = classNames.bind(styles);

const BANK_SCOPE = {
  ADMIN: 'admin',
  PERSONAL: 'personal',
  CLASS: 'class',
};

export const questionBankKeys = {
  collections: ['question-bank', 'collections'],
  myClasses: ['question-bank', 'my-classes'],
  chapters: (classId) => ['question-bank', 'chapters', classId],
  chapterCount: (classId, chapterId) => ['question-bank', 'chapter-count', classId, chapterId],
  chapterQuestions: (classId, chapterId) => ['question-bank', 'chapter-questions', classId, chapterId],
  partQuestions: (partId, scope) => ['question-bank', 'part-questions', partId, scope],
};

const normalizeCollections = (data) =>
  Array.isArray(data) ? data : (data?.data || data?.content || []);

const normalizeMyClasses = (result) =>
  Array.isArray(result) ? result : result?.classes || [];

const normalizeChapters = (raw) =>
  Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);

const normalizePartQuestions = (data) =>
  Array.isArray(data) ? data : (data?.data ?? data?.questions ?? []);

const normalizeChapterQuestions = (raw) =>
  Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);

const PersonalQuestionBankPage = () => {

  const canAccessAdminBank = useHasPermission('QUESTION:MANAGE');
  const queryClient = useQueryClient();
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

  const [expandedParts, setExpandedParts] = useState(() => new Set());
  const [expandedChapters, setExpandedChapters] = useState(() => new Set());

  const {examTypes, examParts} = useBaseMetaData(examTypeId);

  const isPartScope =
    bankScope === BANK_SCOPE.PERSONAL || bankScope === BANK_SCOPE.ADMIN;

  const deleteMutation = useDeleteQuestion();
  const isDeleting = (id) =>
    deleteMutation.isPending && deleteMutation.variables === id;

  useEffect(() => {
    if (!canAccessAdminBank && bankScope === BANK_SCOPE.ADMIN) {
      setBankScope(BANK_SCOPE.PERSONAL);
    }
  }, [canAccessAdminBank, bankScope]);

  // ----- Collections -----
  const collectionsQuery = useQuery({
    queryKey: questionBankKeys.collections,
    queryFn: getQuestionCollections,
    select: normalizeCollections,
  });
  const collectionsList = collectionsQuery.data ?? [];
  const collectionsMap = useMemo(() => {
    const map = {};
    collectionsList.forEach((c) => {
      if (c?.collectionId) map[c.collectionId] = c.name || '(Không tên)';
    });
    return map;
  }, [collectionsList]);

  const getCollectionName = (id) => {
    if (!id) return '';
    return collectionsMap[id] || '(Không xác định)';
  };

  const selectedIsParent = isParentCollection(collectionsList, collectionFilter);

  const filterByCollection = (questions) => {
    if (!collectionFilter) return questions;
    if (collectionFilter === '__none__') {
      return questions.filter((q) => !q.collectionId);
    }

    if (includeChildCollections && selectedIsParent) {
      const ids = new Set(getCollectionWithDescendantIds(collectionsList, collectionFilter));
      return questions.filter((q) => ids.has(q.collectionId));
    }
    return questions.filter((q) => q.collectionId === collectionFilter);
  };

  // ----- My classes -----
  const classesQuery = useQuery({
    queryKey: questionBankKeys.myClasses,
    queryFn: getMyClasses,
    select: normalizeMyClasses,
  });
  const classes = classesQuery.data ?? [];

  // ----- Part-based bank (personal / admin) -----
  const partQueries = useQueries({
    queries: (isPartScope && examTypeId ? (examParts || []) : []).map((p) => ({
      queryKey: questionBankKeys.partQuestions(p.examPartId, bankScope),
      queryFn: () =>
        getQuestionsByPart(
          p.examPartId,
          bankScope === BANK_SCOPE.ADMIN ? { bank: 'admin' } : {},
        ),
      enabled: isPartScope && !!examTypeId,
      select: normalizePartQuestions,
    })),
  });

  const partConfigs = useMemo(() => {
    const map = {};
    (examParts || []).forEach((p, i) => {
      const q = partQueries[i];
      map[p.examPartId] = {
        expanded: expandedParts.has(p.examPartId),
        loading: q?.isLoading ?? false,
        questions: q?.data ?? [],
      };
    });
    return map;
  }, [examParts, partQueries, expandedParts]);

  const anyPartError = partQueries.some((q) => q.isError);
  useEffect(() => {
    if (anyPartError) {
      setNotification({
        type: 'danger',
        message: 'Không tải được danh sách câu hỏi.',
      });
    }
  }, [anyPartError]);

  // Collapse all parts when the exam type or bank scope changes.
  useEffect(() => {
    setExpandedParts(new Set());
  }, [examTypeId, bankScope]);

  const togglePartExpanded = (partId) => {
    setExpandedParts((prev) => {
      const next = new Set(prev);
      if (next.has(partId)) next.delete(partId);
      else next.add(partId);
      return next;
    });
  };

  // ----- Chapter-based bank (class) -----
  const chaptersQuery = useQuery({
    queryKey: questionBankKeys.chapters(selectedClassId),
    queryFn: () => getChaptersByClass(selectedClassId),
    enabled: bankScope === BANK_SCOPE.CLASS && !!selectedClassId,
    select: normalizeChapters,
  });
  const chapters = chaptersQuery.data ?? [];
  const chaptersLoading = chaptersQuery.isLoading;

  useEffect(() => {
    if (chaptersQuery.isError) {
      setNotification({
        type: 'danger',
        message: 'Không tải được danh sách chương.',
      });
    }
  }, [chaptersQuery.isError]);

  const chapterCountQueries = useQueries({
    queries: chapters.map((ch) => ({
      queryKey: questionBankKeys.chapterCount(selectedClassId, ch.chapterId),
      queryFn: () =>
        getMyClassBankCount({ classId: selectedClassId, chapterId: ch.chapterId }),
      enabled: bankScope === BANK_SCOPE.CLASS && !!selectedClassId,
      select: (count) => (typeof count === 'number' ? count : 0),
    })),
  });

  const chapterQuestionQueries = useQueries({
    queries: chapters.map((ch) => ({
      queryKey: questionBankKeys.chapterQuestions(selectedClassId, ch.chapterId),
      queryFn: () =>
        getMyClassBankQuestions({ classId: selectedClassId, chapterId: ch.chapterId }),
      enabled:
        bankScope === BANK_SCOPE.CLASS &&
        !!selectedClassId &&
        expandedChapters.has(ch.chapterId),
      select: normalizeChapterQuestions,
    })),
  });

  const chapterConfigs = useMemo(() => {
    const map = {};
    chapters.forEach((ch, i) => {
      const cq = chapterQuestionQueries[i];
      const countQ = chapterCountQueries[i];
      const hasQuestions = cq?.data !== undefined;
      const questions = cq?.data ?? [];
      const count = hasQuestions ? questions.length : (countQ?.data ?? null);
      map[ch.chapterId] = {
        expanded: expandedChapters.has(ch.chapterId),
        loading: cq?.isLoading ?? false,
        questions,
        count: count === undefined ? null : count,
      };
    });
    return map;
  }, [chapters, chapterQuestionQueries, chapterCountQueries, expandedChapters]);

  const anyChapterQuestionError = chapterQuestionQueries.some((q) => q.isError);
  useEffect(() => {
    if (anyChapterQuestionError) {
      setNotification({
        type: 'danger',
        message: 'Không tải được câu hỏi của chương này.',
      });
    }
  }, [anyChapterQuestionError]);

  // Collapse all chapters when the selected class or bank scope changes.
  useEffect(() => {
    setExpandedChapters(new Set());
  }, [selectedClassId, bankScope]);

  const toggleChapterExpanded = (chapterId) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) next.delete(chapterId);
      else next.add(chapterId);
      return next;
    });
  };

  const handleEditSuccess = async () => {
    setEditingQuestionId(null);

    if (bankScope === BANK_SCOPE.CLASS && editingChapterId) {
      await queryClient.invalidateQueries({
        queryKey: questionBankKeys.chapterQuestions(selectedClassId, editingChapterId),
      });
      queryClient.invalidateQueries({
        queryKey: questionBankKeys.chapterCount(selectedClassId, editingChapterId),
      });
      return;
    }

    if (editingPartId) {
      await queryClient.invalidateQueries({
        queryKey: questionBankKeys.partQuestions(editingPartId, bankScope),
      });
    }
  };

  const handleDeleteQuestion = () => {
    if (!deleteQuestionTarget) return;
    const { questionId, partId = null, chapterId = null } = deleteQuestionTarget;

    deleteMutation.mutate(questionId, {
      onSuccess: async () => {
        if (editingQuestionId === questionId) {
          setEditingQuestionId(null);
        }

        if (bankScope === BANK_SCOPE.CLASS && chapterId) {
          await queryClient.invalidateQueries({
            queryKey: questionBankKeys.chapterQuestions(selectedClassId, chapterId),
          });
          queryClient.invalidateQueries({
            queryKey: questionBankKeys.chapterCount(selectedClassId, chapterId),
          });
        } else if (partId) {
          await queryClient.invalidateQueries({
            queryKey: questionBankKeys.partQuestions(partId, bankScope),
          });
        }

        setNotification({
          type: 'success',
          message: 'Đã xóa câu hỏi thành công.',
        });
        setDeleteQuestionTarget(null);
      },
      onError: (error) => {
        const message =
          error.response?.data?.message || 'Không thể xóa câu hỏi. Vui lòng thử lại.';
        setNotification({
          type: 'danger',
          message,
        });
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
              <IoLibraryOutline />
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
            <IoSchoolOutline /> Bộ lọc kho câu hỏi
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
              <IoBookOutline /> Danh sách câu hỏi theo Chương
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
                  cfg.count !== null && cfg.count !== undefined
                    ? cfg.count
                    : '...';

                return (
                  <div key={chapter.chapterId} className={cx('partCard')}>
                    <button
                      type="button"
                      className={cx('partCardHeader')}
                      onClick={() => toggleChapterExpanded(chapter.chapterId)}
                      aria-expanded={cfg.expanded}
                    >
                      <span className={cx('partName')}>
                        <IoBookOutline size={20} /> {chapter.title}
                      </span>
                      <span className={cx('partBadge')}>
                        {displayCount} câu
                      </span>
                      {cfg.expanded ? (
                        <IoChevronUpOutline size={22} />
                      ) : (
                        <IoChevronDownOutline size={22} />
                      )}
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
                                        <IoLibraryOutline size={12} /> {collectionName}
                                      </span>
                                    ) : (
                                      <span className={cx('collectionBadge', 'collectionBadgeEmpty')} title="Chưa gắn nhóm">
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
                                      <IoEyeOutline />
                                    </ButtonPrime>
                                    <ButtonPrime
                                      size="icon"
                                      variant="outline"
                                      className={cx('iconBtn')}
                                      disabled={isDeleting(id)}
                                      onClick={() => {
                                        setEditingChapterId(chapter.chapterId);
                                        setEditingPartId(null);
                                        setEditingQuestionId(id);
                                      }}
                                      aria-label={`Sửa câu ${getQuestionDisplayNumber(q, idx)}`}
                                    >
                                      <IoCreateOutline />
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
                                      <IoTrashOutline />
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
                <IoBookOutline />{' '}
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
                        <IoBookOutline size={20} /> {part.name}
                      </span>
                      <span className={cx('partBadge')}>
                        {collectionFilter ? `${total}/${totalAll}` : total} câu
                      </span>
                      {cfg.expanded ? (
                        <IoChevronUpOutline size={22} />
                      ) : (
                        <IoChevronDownOutline size={22} />
                      )}
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
                                        <IoLibraryOutline size={12} /> {collectionName}
                                      </span>
                                    ) : (
                                      <span className={cx('collectionBadge', 'collectionBadgeEmpty')} title="Chưa gắn nhóm">
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
                                      <IoEyeOutline />
                                    </ButtonPrime>
                                    {bankScope === BANK_SCOPE.PERSONAL && (
                                      <>
                                        <ButtonPrime
                                          size="icon"
                                          variant="outline"
                                          className={cx('iconBtn')}
                                          disabled={isDeleting(id)}
                                          onClick={() => {
                                            setEditingPartId(part.examPartId);
                                            setEditingChapterId(null);
                                            setEditingQuestionId(id);
                                          }}
                                          aria-label={`Sửa câu ${getQuestionDisplayNumber(q, idx)}`}
                                        >
                                          <IoCreateOutline />
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
                                          <IoTrashOutline />
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
