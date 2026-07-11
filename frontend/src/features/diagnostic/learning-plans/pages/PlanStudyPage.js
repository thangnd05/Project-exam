import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import classNames from 'classnames/bind';
import { getCurrentSession } from '~/shared/api/learningPlanApi';
import RecoveryResourceLink from '~/shared/resources/RecoveryResourceLink';
import { useStreak } from '~/shared/hooks/useStreak';
import PlanPartTaskList, { groupTasksByPart } from '../components/PlanPartTaskList';
import { useSubmitSession } from './hooks/useSubmitSession';
import styles from '~/features/diagnostic/styles/PersonalizedPlan.module.scss';

const cx = classNames.bind(styles);

const planSessionKeys = {
  session: (learningPlanId, taskId, review) =>
    ['plan-session', learningPlanId, taskId || null, !!review],
};

function PlanStudyPage() {
  const { learningPlanId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshStreak } = useStreak();
  const taskIdFromUrl = searchParams.get('taskId');
  const isReviewMode = searchParams.get('review') === 'true';
  // Chỉ vào nhánh "xem lại" khi có taskId; nếu không thì tải phiên luyện bình thường.
  const reviewBranch = isReviewMode && !!taskIdFromUrl;

  const [selections, setSelections] = useState({});
  const [result, setResult] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [formError, setFormError] = useState(null);

  const submitMutation = useSubmitSession();
  const submitting = submitMutation.isPending;

  const sessionQuery = useQuery({
    queryKey: planSessionKeys.session(learningPlanId, taskIdFromUrl, reviewBranch),
    queryFn: () =>
      getCurrentSession(learningPlanId, taskIdFromUrl || undefined, reviewBranch),
    enabled: !!learningPlanId,
  });

  // Trong nhánh xem lại, không dựng "session" (giữ như bản cũ: chỉ hiển thị result).
  const session = reviewBranch ? null : sessionQuery.data ?? null;
  const loading = sessionQuery.isLoading || sessionQuery.isFetching;
  const loadError = sessionQuery.error
    ? sessionQuery.error?.response?.data?.message || sessionQuery.error.message
    : null;
  const error = formError || loadError;

  // Reset trạng thái UI tạm thời khi đổi ải / đổi chế độ.
  useEffect(() => {
    setResult(null);
    setShowReview(false);
    setSelections({});
    setFormError(null);
  }, [learningPlanId, taskIdFromUrl, isReviewMode]);

  // Nạp dữ liệu xem lại (đáp án & giải thích) từ session query.
  useEffect(() => {
    if (!reviewBranch || !sessionQuery.data) return;
    const data = sessionQuery.data;
    if (data.lastReviewItems) {
      setResult({
        reviewItems: data.lastReviewItems,
        passed: true,
        accuracy: 0,
        correctCount: 0,
        totalCount: 0,
        message: data.message,
      });
      setShowReview(true);
    } else {
      setFormError('Chưa có dữ liệu giải thích cho ải này.');
    }
  }, [reviewBranch, sessionQuery.data]);

  const reloadSession = () => {
    setResult(null);
    setShowReview(false);
    setSelections({});
    setFormError(null);
    if (reviewBranch) {
      // Rời chế độ xem lại để lấy phiên luyện mới cho ải này (như loadSession cũ).
      setSearchParams({ taskId: taskIdFromUrl });
    } else {
      sessionQuery.refetch();
    }
  };

  const goToPicker = () => {
    navigate(`/learning-plans/${learningPlanId}`);
  };

  const startTask = (taskId) => {
    setSearchParams({ taskId });
    setResult(null);
  };

  const handleSelect = (questionId, answerId, isMsq) => {
    setSelections((prev) => {
      if (isMsq) {
        const cur = Array.isArray(prev[questionId]) ? prev[questionId] : [];
        const next = cur.includes(answerId) ? cur.filter((x) => x !== answerId) : [...cur, answerId];
        return { ...prev, [questionId]: next };
      }
      return { ...prev, [questionId]: answerId };
    });
  };

  const handleSubmit = () => {
    if (!session?.sessionId) return;
    const answers = (session.questions || []).map((q) => {
      const sel = selections[q.questionId];
      if (q.questionType === 'MSQ') {
        return { questionId: q.questionId, selectedAnswerIds: Array.isArray(sel) ? sel : [] };
      }
      return { questionId: q.questionId, selectedAnswerId: sel };
    });
    const missing = (session.questions || []).some((q) => {
      const sel = selections[q.questionId];
      return q.questionType === 'MSQ' ? !(Array.isArray(sel) && sel.length) : !sel;
    });
    if (missing) {
      setFormError('Vui lòng chọn đáp án cho tất cả câu hỏi.');
      return;
    }
    setFormError(null);
    submitMutation.mutate(
      { learningPlanId, sessionId: session.sessionId, answers },
      {
        onSuccess: (res) => {
          setResult(res);
          if (res?.passed) refreshStreak();
        },
        onError: (err) => setFormError(err?.response?.data?.message || err.message),
      },
    );
  };

  if (loading) {
    return <div className={cx('wrapper')}><div className={cx('loading')}>Đang tải...</div></div>;
  }

  const partGroups = session?.partGroups?.length
    ? session.partGroups
    : groupTasksByPart(session?.tasks || []);

  const isPickMode = session?.mode === 'PICK' || (!session?.sessionId && session?.mode !== 'MOCK');
  const isMockMode = session?.mode === 'MOCK' || session?.planStage === 'MOCK';

  if (isMockMode && !session?.sessionId) {
    return (
      <div className={cx('wrapper')}>
        <div className={cx('alert', 'alertSuccess')}>
          <span>{session.message}</span>
          <Link to={`/learning-plans/${learningPlanId}`} className={cx('btn', 'btnPrimary', 'btnSm')}>
            Về kế hoạch
          </Link>
        </div>
      </div>
    );
  }

  if (isPickMode && !result) {
    return (
      <div className={cx('wrapper')}>
        <div className={cx('headerBar')}>
          <Link to={`/learning-plans/${learningPlanId}`} className={cx('btn', 'btnGhost', 'btnSm')}>
            ← Kế hoạch
          </Link>
        </div>

        {error && <div className={cx('alert', 'alertDanger')}>{error}</div>}

        <div className={cx('card')}>
          <div className={cx('cardBody')}>
            <h3 className={cx('title')} style={{ fontSize: 'var(--font-size-xl)', marginBottom: '0.8rem' }}>
              Chọn Part và ải để học
            </h3>
            <p className={cx('muted')} style={{ marginBottom: '1.2rem' }}>{session.message}</p>
            <div className={cx('actionBar')}>
              <span className={cx('badge', 'badgeMuted')}>
                Tiến độ: {session.passedTasks}/{session.totalTasks} ải
              </span>
              <span className={cx('badge', 'badgePrimary')}>{session.planStage}</span>
            </div>
          </div>
        </div>

        <PlanPartTaskList
          partGroups={partGroups}
          learningPlanId={learningPlanId}
          studyAction="button"
          onStudyTask={startTask}
        />
      </div>
    );
  }

  return (
    <div className={cx('wrapper')}>
      <div className={cx('headerBar')}>
        <button type="button" className={cx('btn', 'btnGhost', 'btnSm')} onClick={goToPicker}>
          Chọn ải khác
        </button>
      </div>

      {error && <div className={cx('alert', 'alertDanger')}>{error}</div>}

      {result && (
        <>
          <div className={cx('resultAlert', { passed: result.passed, failed: !result.passed })}>
            {(result.correctCount > 0 || result.totalCount > 0) && (
              <div className={cx('resultStats')}>
                {result.correctCount}/{result.totalCount} đúng ({result.accuracy}%)
              </div>
            )}
            <div className={cx('resultStats')} style={{ marginBottom: '1rem' }}>
              {result.message}
            </div>
            <div className={cx('actionBar')}>
              <button
                type="button"
                className={cx('btn', 'btnPrimary', 'btnSm')}
                onClick={() => setShowReview((prev) => !prev)}
              >
                {showReview ? 'Ẩn đáp án' : 'Xem đáp án & giải thích'}
              </button>
              <button
                type="button"
                className={cx('btn', 'btnOutline', 'btnSm')}
                onClick={reloadSession}
              >
                {result.passed ? 'Làm lại ải này' : 'Thử lại'}
              </button>
              <button
                type="button"
                className={cx('btn', 'btnGhost', 'btnSm')}
                onClick={goToPicker}
              >
                Chọn ải khác
              </button>
            </div>
          </div>

          {showReview && result.reviewItems?.length > 0 && (
            <div className={cx('reviewSection')}>
              {result.reviewItems.map((item, idx) => {
                const isMsq = item.questionType === 'MSQ';
                const userSelectedIds = isMsq
                  ? (item.selectedAnswerIds || [])
                  : (item.selectedAnswerId ? [item.selectedAnswerId] : []);
                return (
                  <div
                    key={item.questionId}
                    className={cx('reviewItem', {
                      reviewCorrect: item.correct,
                      reviewWrong: !item.correct,
                    })}
                  >
                    <div className={cx('reviewQuestionNo')}>
                      Câu {idx + 1} {item.correct ? '✓' : '✗'}
                    </div>
                    <div className={cx('reviewQuestionText')}>{item.questionText}</div>
                    <div className={cx('reviewAnswerList')}>
                      {(item.answers || []).map((a) => {

                        const isCorrectAnswer = a.isCorrect != null
                          ? a.isCorrect
                          : a.answerId === item.correctAnswerId;
                        const isUserChoice = userSelectedIds.includes(a.answerId);
                        return (
                          <div
                            key={a.answerId}
                            className={cx('reviewAnswerOption', {
                              isCorrectAnswer: isCorrectAnswer,
                              isUserWrong: isUserChoice && !isCorrectAnswer,
                              isUserCorrect: isUserChoice && isCorrectAnswer,
                            })}
                          >
                            {a.answerText?.trim()
                              ? `${a.answerLabel ? `${a.answerLabel}. ` : ''}${a.answerText}`
                              : a.answerLabel}
                            {isCorrectAnswer && ' ✓'}
                            {isUserChoice && !isCorrectAnswer && ' (Bạn chọn)'}
                          </div>
                        );
                      })}
                    </div>
                    {item.explanation?.trim() && (
                      <div className={cx('reviewExplanation')}>
                        <strong>Giải thích:</strong> {item.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <div className={cx('studyLayout')}>
        <div className={cx('studyMain')}>
          {!result && session && (
            <>
              <div className={cx('activeTaskCard')}>
                <div className={cx('activeTaskHead')}>
                  <div>
                    <div className={cx('statLabel')}>Đang học</div>
                    <h3 className={cx('activeTaskTitle')}>
                      {session.activeTask?.examPartName || 'Part'}
                      {' · Ải '}{session.activeTask?.tagName || '—'}
                    </h3>
                    <div className={cx('actionBar')}>
                      <span className={cx('badge', 'badgePrimary')}>{session.planStage}</span>
                      <span className={cx('badge', 'badgeMuted')}>
                        {session.passedTasks}/{session.totalTasks} ải đã pass
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className={cx('muted', 'small')}>{session.message}</div>
                    {session.activeTask && (
                      <div className={cx('passRequired')} style={{ marginTop: '0.4rem' }}>
                        Cần ≥{session.passAccuracyRequired}% để qua ải
                      </div>
                    )}
                  </div>
                </div>

                {session.resource && (
                  <div className={cx('resourceBox')}>
                    <div className={cx('resourceLabel')}>Bước 1: đọc tài liệu</div>
                    <RecoveryResourceLink
                      resource={session.resource}
                      className={cx('resourceLink')}
                    >
                      {session.resource.title}
                    </RecoveryResourceLink>
                    {session.resource.description && (
                      <p className={cx('resourceDesc')}>{session.resource.description}</p>
                    )}
                  </div>
                )}
              </div>

              <h4 className={cx('sectionTitle')}>
                Bước 2: Luyện ({session.questionCount} câu)
              </h4>

              {(session.questions || []).map((q, idx) => (
                <div key={q.questionId} className={cx('questionCard')}>
                  <div className={cx('questionNo')}>Câu {idx + 1}</div>
                  <p className={cx('questionText')}>{q.questionText}</p>
                  {q.questionType === 'MSQ' && (
                    <div className="text-muted mb-1" style={{ fontSize: '1.3rem' }}>Chọn tất cả đáp án đúng:</div>
                  )}
                  <div className={cx('answerList')}>
                    {(q.answers || []).map((a) => {
                      const isMsq = q.questionType === 'MSQ';
                      const sel = selections[q.questionId];
                      const checked = isMsq
                        ? Array.isArray(sel) && sel.includes(a.answerId)
                        : sel === a.answerId;
                      return (
                        <label
                          key={a.answerId}
                          className={cx('answerOption', { active: checked })}
                        >
                          <input
                            type={isMsq ? 'checkbox' : 'radio'}
                            name={`q-${q.questionId}`}
                            checked={checked}
                            onChange={() => handleSelect(q.questionId, a.answerId, isMsq)}
                          />
                          <span>
                            {a.answerText?.trim()
                              ? `${a.answerLabel ? `${a.answerLabel}. ` : ''}${a.answerText}`
                              : a.answerLabel}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}

              <button
                type="button"
                className={cx('btn', 'btnPrimary', 'btnLg')}
                disabled={submitting || !(session.questions?.length)}
                onClick={handleSubmit}
              >
                {submitting ? 'Đang chấm...' : 'Nộp bài'}
              </button>
            </>
          )}
        </div>

        <div className={cx('studySidebar')}>
          <h5 className={cx('sectionTitle')}>Đổi ải (trong Part)</h5>
          <PlanPartTaskList
            partGroups={partGroups}
            learningPlanId={learningPlanId}
            studyAction="button"
            onStudyTask={startTask}
            compact
          />
        </div>
      </div>
    </div>
  );
}

export default PlanStudyPage;
