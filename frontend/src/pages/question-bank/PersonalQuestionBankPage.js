import React, {useCallback, useEffect, useState} from 'react';
import {Alert, Button, Spinner} from 'react-bootstrap';
import axios from '../../api/axiosClient';
import classNames from 'classnames/bind';
import {
  IoBookOutline,
  IoChevronDownOutline,
  IoChevronUpOutline,
  IoCreateOutline,
  IoLibraryOutline,
  IoSchoolOutline,
  IoTrashOutline,
} from 'react-icons/io5';
import {useBaseMetaData} from '~/hook/useBaseMetaData';
import EditQuestionModal from '~/components/modals/EditQuestionModal';
import styles from './PersonalQuestionBankPage.module.scss';

const cx = classNames.bind(styles);

const BANK_SCOPE = {
  PERSONAL: 'personal',
  CLASS: 'class',
};

const PersonalQuestionBankPage = () => {
  const [bankScope, setBankScope] = useState(BANK_SCOPE.PERSONAL);
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [examTypeId, setExamTypeId] = useState('');
  const [partConfigs, setPartConfigs] = useState({});
  const [notification, setNotification] = useState({});
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editingPartId, setEditingPartId] = useState(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState(null);

  const [chapters, setChapters] = useState([]);
  const [chapterConfigs, setChapterConfigs] = useState({});
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [editingChapterId, setEditingChapterId] = useState(null);

  const {examTypes, examParts} = useBaseMetaData(examTypeId);

  useEffect(() => {
    axios
      .get('/api/classes/my')
      .then((res) => {
        const data = Array.isArray(res.data)
          ? res.data
          : res.data?.classes || [];
        setClasses(data);
      })
      .catch(() => setClasses([]));
  }, []);

  const loadQuestionsForPart = useCallback(async (partId) => {
    setPartConfigs((prev) => ({
      ...prev,
      [partId]: {...(prev[partId] || {}), loading: true},
    }));

    try {
      const res = await axios.get(`/api/questions/by-part/${partId}`);
      const list = Array.isArray(res.data)
        ? res.data
        : (res.data?.data ?? res.data?.questions ?? []);
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
    if (
      bankScope !== BANK_SCOPE.PERSONAL ||
      !examTypeId ||
      !examParts?.length
    ) {
      setPartConfigs({});
      return;
    }

    const initial = {};
    examParts.forEach((p) => {
      initial[p.examPartId] = {expanded: false, loading: true, questions: []};
    });
    setPartConfigs(initial);
    examParts.forEach((p) => loadQuestionsForPart(p.examPartId));
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
    axios
      .get(`/api/chapters/class/${selectedClassId}`)
      .then((res) => {
        const raw = res.data;
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
          axios
            .get('/api/questions/bank/my-class/count', {
              params: {classId: selectedClassId, chapterId: ch.chapterId},
            })
            .then((countRes) => {
              const countVal =
                typeof countRes.data === 'number' ? countRes.data : 0;
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
        const res = await axios.get('/api/questions/bank/my-class', {
          params: {classId: selectedClassId, chapterId},
        });
        const raw = res.data;
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
      await loadQuestionsForPart(editingPartId);
    }
  };

  const handleDeleteQuestion = async ({
    questionId,
    partId = null,
    chapterId = null,
  }) => {
    const confirmed = window.confirm('Bạn có chắc muốn xóa câu hỏi này không?');
    if (!confirmed) return;

    setDeletingQuestionId(questionId);
    try {
      await axios.delete(`/api/questions/${questionId}`);

      if (editingQuestionId === questionId) {
        setEditingQuestionId(null);
      }

      if (bankScope === BANK_SCOPE.CLASS && chapterId) {
        await loadQuestionsForChapter(chapterId);
      } else if (partId) {
        await loadQuestionsForPart(partId);
      }

      setNotification({
        type: 'success',
        message: 'Đã xóa câu hỏi thành công.',
      });
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
                : 'Kho câu hỏi cá nhân'}
            </span>
          </h1>
          <p className={cx('subtitle')}>
            {bankScope === BANK_SCOPE.CLASS
              ? 'Quản lý câu hỏi theo từng Chương. Bấm bút chì để sửa nhanh câu hỏi/đáp án.'
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

            {bankScope === BANK_SCOPE.PERSONAL && (
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
                        ) : cfg.questions.length === 0 ? (
                          <Alert variant="info" className="mb-0">
                            Chương này chưa có câu hỏi.
                          </Alert>
                        ) : (
                          <ul className={cx('questionList')}>
                            {cfg.questions.map((q, idx) => {
                              const id = q.questionId ?? q.id;
                              if (!id) return null;

                              return (
                                <li key={id} className={cx('questionItem')}>
                                  <span className={cx('questionIndex')}>
                                    {idx + 1}.
                                  </span>
                                  <span className={cx('questionText')}>
                                    {q.questionText || '(Không có nội dung)'}
                                  </span>
                                  <div className={cx('questionActions')}>
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
                                      aria-label={`Sửa câu ${idx + 1}`}
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
                                        handleDeleteQuestion({
                                          questionId: id,
                                          chapterId: chapter.chapterId,
                                        })
                                      }
                                      aria-label={`Xóa câu ${idx + 1}`}
                                    >
                                      <IoTrashOutline />
                                    </Button>
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
              })
            )}
          </div>
        )}

        {bankScope === BANK_SCOPE.PERSONAL &&
          examTypeId &&
          examParts?.length > 0 && (
            <div className={cx('card')}>
              <div className={cx('sectionTitle')}>
                <IoBookOutline /> Danh sách câu hỏi theo Part
              </div>

              {examParts.map((part) => {
                const cfg = partConfigs[part.examPartId] || {
                  expanded: false,
                  loading: false,
                  questions: [],
                };
                const total = cfg.questions?.length || 0;

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
                      <span className={cx('partBadge')}>{total} câu</span>
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
                            Part này chưa có câu hỏi.
                          </Alert>
                        ) : (
                          <ul className={cx('questionList')}>
                            {cfg.questions.map((q, idx) => {
                              const id = q.questionId ?? q.id;
                              if (!id) return null;

                              return (
                                <li key={id} className={cx('questionItem')}>
                                  <span className={cx('questionIndex')}>
                                    {idx + 1}.
                                  </span>
                                  <span className={cx('questionText')}>
                                    {q.questionText || '(Không có nội dung)'}
                                  </span>
                                  <div className={cx('questionActions')}>
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
                                      aria-label={`Sửa câu ${idx + 1}`}
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
                                        handleDeleteQuestion({
                                          questionId: id,
                                          partId: part.examPartId,
                                        })
                                      }
                                      aria-label={`Xóa câu ${idx + 1}`}
                                    >
                                      <IoTrashOutline />
                                    </Button>
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
    </div>
  );
};

export default PersonalQuestionBankPage;
