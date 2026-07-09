import React, {useCallback, useEffect, useState} from 'react';
import {Alert, Button, Spinner} from 'react-bootstrap';
import {AnimatePresence, motion} from 'framer-motion';
import {
  getQuestionsByPart,
  getMyClassBankQuestions,
  getMyClassBankCount,
  deleteQuestion,
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
import EditQuestionModal from './modals/EditQuestionModal';
import ViewQuestionModal from './modals/ViewQuestionModal';
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

const PersonalQuestionBankPage = () => {

  const canAccessAdminBank = useHasPermission('QUESTION:MANAGE');
  const [bankScope, setBankScope] = useState(
    canAccessAdminBank ? BANK_SCOPE.ADMIN : BANK_SCOPE.PERSONAL,
  );
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [examTypeId, setExamTypeId] = useState('');
  const [partConfigs, setPartConfigs] = useState({});
  const [notification, setNotification] = useState({});
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editingPartId, setEditingPartId] = useState(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState(null);
  const [deleteQuestionTarget, setDeleteQuestionTarget] = useState(null);
  const [viewingQuestionId, setViewingQuestionId] = useState(null);

  const [chapters, setChapters] = useState([]);
  const [chapterConfigs, setChapterConfigs] = useState({});
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [editingChapterId, setEditingChapterId] = useState(null);
  const [collectionsMap, setCollectionsMap] = useState({});
  const [collectionsList, setCollectionsList] = useState([]);
  const [collectionFilter, setCollectionFilter] = useState('');

  const [includeChildCollections, setIncludeChildCollections] = useState(true);

  const {examTypes, examParts} = useBaseMetaData(examTypeId);

  useEffect(() => {
    if (!canAccessAdminBank && bankScope === BANK_SCOPE.ADMIN) {
      setBankScope(BANK_SCOPE.PERSONAL);
    }
  }, [canAccessAdminBank, bankScope]);

  useEffect(() => {
    getQuestionCollections()
      .then((data) => {
        const list = Array.isArray(data)
          ? data
          : (data?.data || data?.content || []);
        const map = {};
        list.forEach((c) => {
          if (c?.collectionId) map[c.collectionId] = c.name || '(Không tên)';
        });
        setCollectionsMap(map);
        setCollectionsList(list);
      })
      .catch(() => {
        setCollectionsMap({});
        setCollectionsList([]);
      });
  }, []);

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

  useEffect(() => {
    getMyClasses()
      .then((result) => {
        const data = Array.isArray(result)
          ? result
          : result?.classes || [];
        setClasses(data);
      })
      .catch(() => setClasses([]));
  }, []);

  const loadQuestionsForPart = useCallback(async (partId, scope) => {
    setPartConfigs((prev) => ({
      ...prev,
      [partId]: {...(prev[partId] || {}), loading: true},
    }));

    try {
      const params = scope === BANK_SCOPE.ADMIN ? {bank: 'admin'} : {};
      const data = await getQuestionsByPart(partId, params);
      const list = Array.isArray(data)
        ? data
        : (data?.data ?? data?.questions ?? []);
      setPartConfigs((prev) => ({
        ...prev,
        [partId]: {
          ...(prev[partId] || {}),
          loading: false,
          questions: list,
        },
      }));
    } catch (error) {
      setPartConfigs((prev) => ({
        ...prev,
        [partId]: {
          ...(prev[partId] || {}),
          loading: false,
          questions: [],
        },
      }));
      setNotification({
        type: 'danger',
        message: 'Không tải được danh sách câu hỏi.',
      });
    }
  }, []);

  useEffect(() => {
    const isPartScope =
      bankScope === BANK_SCOPE.PERSONAL || bankScope === BANK_SCOPE.ADMIN;
    if (!isPartScope || !examTypeId || !examParts?.length) {
      setPartConfigs({});
      return;
    }

    const initial = {};
    examParts.forEach((p) => {
      initial[p.examPartId] = {expanded: false, loading: true, questions: []};
    });
    setPartConfigs(initial);
    examParts.forEach((p) => loadQuestionsForPart(p.examPartId, bankScope));
  }, [examTypeId, examParts, bankScope, loadQuestionsForPart]);

  const togglePartExpanded = (partId) => {
    setPartConfigs((prev) => ({
      ...prev,
      [partId]: {...(prev[partId] || {}), expanded: !prev[partId]?.expanded},
    }));
  };

  useEffect(() => {
    if (bankScope !== BANK_SCOPE.CLASS || !selectedClassId) {
      setChapters([]);
      setChapterConfigs({});
      return;
    }

    setChaptersLoading(true);
    getChaptersByClass(selectedClassId)
      .then((raw) => {
        const data = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.data)
            ? raw.data
            : [];
        setChapters(data);

        const initial = {};
        data.forEach((ch) => {
          initial[ch.chapterId] = {
            expanded: false,
            loading: false,
            questions: [],
            count: null,
          };
        });
        setChapterConfigs(initial);

        data.forEach((ch) => {
          getMyClassBankCount({classId: selectedClassId, chapterId: ch.chapterId})
            .then((count) => {
              const countVal =
                typeof count === 'number' ? count : 0;
              setChapterConfigs((prev) => ({
                ...prev,
                [ch.chapterId]: {
                  ...(prev[ch.chapterId] || {}),
                  count: countVal,
                },
              }));
            })
            .catch(() => {});
        });
      })
      .catch(() => {
        setChapters([]);
        setNotification({
          type: 'danger',
          message: 'Không tải được danh sách chương.',
        });
      })
      .finally(() => setChaptersLoading(false));
  }, [bankScope, selectedClassId]);

  const loadQuestionsForChapter = useCallback(
    async (chapterId) => {
      if (!selectedClassId) return;

      setChapterConfigs((prev) => ({
        ...prev,
        [chapterId]: {...(prev[chapterId] || {}), loading: true},
      }));

      try {
        const raw = await getMyClassBankQuestions({classId: selectedClassId, chapterId});
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.data)
            ? raw.data
            : [];
        setChapterConfigs((prev) => ({
          ...prev,
          [chapterId]: {
            ...(prev[chapterId] || {}),
            loading: false,
            questions: list,
            count: list.length,
          },
        }));
      } catch (error) {
        setChapterConfigs((prev) => ({
          ...prev,
          [chapterId]: {
            ...(prev[chapterId] || {}),
            loading: false,
            questions: [],
          },
        }));
        setNotification({
          type: 'danger',
          message: 'Không tải được câu hỏi của chương này.',
        });
      }
    },
    [selectedClassId],
  );

  const toggleChapterExpanded = (chapterId) => {
    setChapterConfigs((prev) => {
      const cfg = prev[chapterId] || {};
      const willExpand = !cfg.expanded;
      return {
        ...prev,
        [chapterId]: {...cfg, expanded: willExpand},
      };
    });

    const cfg = chapterConfigs[chapterId] || {};
    if (!cfg.expanded && cfg.questions.length === 0 && !cfg.loading) {
      loadQuestionsForChapter(chapterId);
    }
  };

  const handleEditSuccess = async () => {
    setEditingQuestionId(null);

    if (bankScope === BANK_SCOPE.CLASS && editingChapterId) {
      await loadQuestionsForChapter(editingChapterId);
      return;
    }

    if (editingPartId) {
      await loadQuestionsForPart(editingPartId, bankScope);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!deleteQuestionTarget) return;
    const { questionId, partId = null, chapterId = null } = deleteQuestionTarget;

    setDeletingQuestionId(questionId);
    try {
      await deleteQuestion(questionId);

      if (editingQuestionId === questionId) {
        setEditingQuestionId(null);
      }

      if (bankScope === BANK_SCOPE.CLASS && chapterId) {
        await loadQuestionsForChapter(chapterId);
      } else if (partId) {
        await loadQuestionsForPart(partId, bankScope);
      }

      setNotification({
        type: 'success',
        message: 'Đã xóa câu hỏi thành công.',
      });
      setDeleteQuestionTarget(null);
    } catch (error) {
      const message =
        error.response?.data?.message || 'Không thể xóa câu hỏi. Vui lòng thử lại.';
      setNotification({
        type: 'danger',
        message,
      });
    } finally {
      setDeletingQuestionId(null);
    }
  };

  return (
    <div className={cx('wrapper')}>
      <div className={cx('container')}>
        <header className={cx('header')}>
          <h1 className={cx('title')}>
            <IoLibraryOutline className={cx('titleIcon')} />{' '}
            <span className={cx('titleGradient')}>
              {bankScope === BANK_SCOPE.CLASS
                ? 'Kho câu hỏi lớp học'
                : bankScope === BANK_SCOPE.ADMIN
                  ? 'Kho đề quản trị'
                  : 'Kho câu hỏi cá nhân'}
            </span>
          </h1>
          <p className={cx('subtitle')}>
            {bankScope === BANK_SCOPE.CLASS
              ? 'Quản lý câu hỏi theo từng Chương. Bấm bút chì để sửa nhanh câu hỏi/đáp án.'
              : bankScope === BANK_SCOPE.ADMIN
                ? 'Kho câu hỏi do quản trị viên cung cấp. Bất kỳ ai cũng có thể tham khảo và dùng làm nguồn tạo đề.'
                : 'Quản lý câu hỏi theo từng Part. Bấm bút chì để sửa nhanh câu hỏi/đáp án.'}
          </p>
        </header>

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
              <Button
                type="button"
                className={cx('scopeBtn')}
                variant={
                  bankScope === BANK_SCOPE.ADMIN ? 'primary' : 'outline-primary'
                }
                onClick={() => {
                  setBankScope(BANK_SCOPE.ADMIN);
                  setSelectedClassId('');
                }}
              >
                Kho đề quản trị
              </Button>
            )}
            <Button
              type="button"
              className={cx('scopeBtn')}
              variant={
                bankScope === BANK_SCOPE.PERSONAL
                  ? 'primary'
                  : 'outline-primary'
              }
              onClick={() => {
                setBankScope(BANK_SCOPE.PERSONAL);
                setSelectedClassId('');
              }}
            >
              Kho cá nhân
            </Button>
            <Button
              type="button"
              className={cx('scopeBtn')}
              variant={
                bankScope === BANK_SCOPE.CLASS ? 'primary' : 'outline-primary'
              }
              onClick={() => setBankScope(BANK_SCOPE.CLASS)}
            >
              Kho lớp học
            </Button>
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

                    <AnimatePresence initial={false}>
                    {cfg.expanded && (
                      <motion.div
                        key={`chapter-body-${chapter.chapterId}`}
                        initial={{height: 0, opacity: 0}}
                        animate={{height: 'auto', opacity: 1}}
                        exit={{height: 0, opacity: 0}}
                        transition={{duration: 0.3, ease: [0.22, 1, 0.36, 1]}}
                        style={{overflow: 'hidden'}}
                      >
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
                                    <Button
                                      type="button"
                                      className={cx('viewBtn')}
                                      size="sm"
                                      variant="outline-secondary"
                                      onClick={() => setViewingQuestionId(id)}
                                      aria-label={`Xem câu ${getQuestionDisplayNumber(q, idx)}`}
                                    >
                                      <IoEyeOutline />
                                    </Button>
                                    <Button
                                      type="button"
                                      className={cx('editBtn')}
                                      size="sm"
                                      variant="outline-primary"
                                      disabled={deletingQuestionId === id}
                                      onClick={() => {
                                        setEditingChapterId(chapter.chapterId);
                                        setEditingPartId(null);
                                        setEditingQuestionId(id);
                                      }}
                                      aria-label={`Sửa câu ${getQuestionDisplayNumber(q, idx)}`}
                                    >
                                      <IoCreateOutline />
                                    </Button>
                                    <Button
                                      type="button"
                                      className={cx('deleteBtn')}
                                      size="sm"
                                      variant="outline-danger"
                                      disabled={deletingQuestionId === id}
                                      onClick={() =>
                                        setDeleteQuestionTarget({
                                          questionId: id,
                                          chapterId: chapter.chapterId,
                                        })
                                      }
                                      aria-label={`Xóa câu ${getQuestionDisplayNumber(q, idx)}`}
                                    >
                                      <IoTrashOutline />
                                    </Button>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                          );
                        })()}
                      </div>
                      </motion.div>
                    )}
                    </AnimatePresence>
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

                    <AnimatePresence initial={false}>
                    {cfg.expanded && (
                      <motion.div
                        key={`part-body-${part.examPartId}`}
                        initial={{height: 0, opacity: 0}}
                        animate={{height: 'auto', opacity: 1}}
                        exit={{height: 0, opacity: 0}}
                        transition={{duration: 0.3, ease: [0.22, 1, 0.36, 1]}}
                        style={{overflow: 'hidden'}}
                      >
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
                                    <Button
                                      type="button"
                                      className={cx('viewBtn')}
                                      size="sm"
                                      variant="outline-secondary"
                                      onClick={() => setViewingQuestionId(id)}
                                      aria-label={`Xem câu ${getQuestionDisplayNumber(q, idx)}`}
                                    >
                                      <IoEyeOutline />
                                    </Button>
                                    {bankScope === BANK_SCOPE.PERSONAL && (
                                      <>
                                        <Button
                                          type="button"
                                          className={cx('editBtn')}
                                          size="sm"
                                          variant="outline-primary"
                                          disabled={deletingQuestionId === id}
                                          onClick={() => {
                                            setEditingPartId(part.examPartId);
                                            setEditingChapterId(null);
                                            setEditingQuestionId(id);
                                          }}
                                          aria-label={`Sửa câu ${getQuestionDisplayNumber(q, idx)}`}
                                        >
                                          <IoCreateOutline />
                                        </Button>
                                        <Button
                                          type="button"
                                          className={cx('deleteBtn')}
                                          size="sm"
                                          variant="outline-danger"
                                          disabled={deletingQuestionId === id}
                                          onClick={() =>
                                            setDeleteQuestionTarget({
                                              questionId: id,
                                              partId: part.examPartId,
                                            })
                                          }
                                          aria-label={`Xóa câu ${getQuestionDisplayNumber(q, idx)}`}
                                        >
                                          <IoTrashOutline />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                      </motion.div>
                    )}
                    </AnimatePresence>
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
