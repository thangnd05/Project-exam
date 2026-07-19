import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import classNames from 'classnames/bind';
import { getCurrentSession } from '~/shared/api/learningPlanApi';
import ButtonPrime from '~/shared/ui/Button/ButtonPrime';
import { getRecoveryResourceLinkProps } from '~/shared/utils/recoveryResource';
import { getApiBaseUrl } from '~/shared/utils/mediaUrl';
import { useStreak } from '~/shared/hooks/useStreak';
import PlanPartTaskList, { groupTasksByPart } from '../components/PlanPartTaskList';
import { useSubmitSession } from './hooks/useSubmitSession';
import { planStageLabel } from '../planLabels';
import TestStartDashboard from '~/features/tests/exam/exam-types/detail/testStart/TestStartDashboard';
import styles from '~/features/diagnostic/styles/PersonalizedPlan.module.scss';
import examStyles from '~/features/tests/exam/exam-types/detail/testStart/TestStartPage.module.scss';

const cx = classNames.bind(styles);
// Tái dùng đúng SCSS thẻ câu hỏi/đáp án của trang làm bài thi.
const ex = classNames.bind(examStyles);

const API_BASE = getApiBaseUrl();

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

  // Lưu đáp án đã chọn vào sessionStorage để không mất khi F5 (giống trang làm bài thi).
  const answersStorageKey = `plan-study-answers-${learningPlanId}-${taskIdFromUrl || 'current'}`;

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

  // Reset trạng thái UI khi đổi ải / đổi chế độ, đồng thời khôi phục đáp án đã lưu (F5).
  useEffect(() => {
    setResult(null);
    setShowReview(false);
    setFormError(null);
    if (reviewBranch) {
      setSelections({});
      return;
    }
    try {
      const saved = sessionStorage.getItem(answersStorageKey);
      setSelections(saved ? JSON.parse(saved) : {});
    } catch {
      setSelections({});
    }
  }, [learningPlanId, taskIdFromUrl, isReviewMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lưu đáp án mỗi khi thay đổi (chỉ ở chế độ luyện), để F5 không mất.
  useEffect(() => {
    if (reviewBranch) return;
    try {
      sessionStorage.setItem(answersStorageKey, JSON.stringify(selections));
    } catch {
      /* bỏ qua nếu storage đầy/không dùng được */
    }
  }, [selections, answersStorageKey, reviewBranch]);

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
    try {
      sessionStorage.removeItem(answersStorageKey);
    } catch { /* noop */ }
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
          try {
            sessionStorage.removeItem(answersStorageKey);
          } catch { /* noop */ }
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
            <h3 className={cx('title', 'pickTitle')}>
              Chọn Part và ải để học
            </h3>
            <p className={cx('muted')} style={{ marginBottom: '1.2rem' }}>{session.message}</p>
            <div className={cx('actionBar')}>
              <span className={cx('badge', 'badgeMuted')}>
                Tiến độ: {session.passedTasks}/{session.totalTasks} ải
              </span>
              <span className={cx('badge', 'badgePrimary')}>{planStageLabel(session.planStage)}</span>
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

  const answeredCount = (session?.questions || []).filter((q) => {
    const sel = selections[q.questionId];
    return q.questionType === 'MSQ'
      ? Array.isArray(sel) && sel.length > 0
      : Boolean(sel);
  }).length;

  // Đưa selections về đúng shape userAnswers mà TestStartDashboard (trục câu hỏi) cần.
  const navAnswers = {};
  (session?.questions || []).forEach((q) => {
    const sel = selections[q.questionId];
    navAnswers[q.questionId] =
      q.questionType === 'MSQ'
        ? { selectedAnswerIds: Array.isArray(sel) ? sel : [] }
        : { selectedAnswerId: sel };
  });

  const scrollToQuestion = (questionId) => {
    document
      .getElementById(`q-${questionId}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className={cx('wrapper', 'studyWide')}>
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
                  <span className={cx('badge', 'badgePrimary')}>{planStageLabel(session.planStage)}</span>
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
                <div className={cx('resourceInfo')}>
                  <div className={cx('resourceTitle')}>{session.resource.title}</div>
                  {session.resource.description && (
                    <p className={cx('resourceDesc')}>{session.resource.description}</p>
                  )}
                </div>
                {getRecoveryResourceLinkProps(session.resource, API_BASE)?.href && (
                  <ButtonPrime
                    as="a"
                    href={getRecoveryResourceLinkProps(session.resource, API_BASE).href}
                    target="_blank"
                    rel="noreferrer"
                    variant="outline"
                    size="sm"
                    className={cx('resourceBtn')}
                  >
                    Mở tài liệu
                  </ButtonPrime>
                )}
              </div>
            )}
          </div>

          <div className={cx('studyLayout')}>
            <div className={cx('studyMain')}>
              {(session.questions || []).map((q, idx) => {
                const isMsq = q.questionType === 'MSQ';
                const sel = selections[q.questionId];
                return (
                  <div key={q.questionId} id={`q-${q.questionId}`} className={ex('question-card')}>
                    <span className={ex('q-text')}>
                      <span className={ex('q-number')}>Câu {idx + 1}:</span>{' '}
                      {q.questionText}
                    </span>
                    {isMsq && <div className={cx('msqHint')}>Chọn tất cả đáp án đúng:</div>}
                    <div className={ex('mcq-group')}>
                      {(q.answers || []).map((a) => {
                        const checked = isMsq
                          ? Array.isArray(sel) && sel.includes(a.answerId)
                          : sel === a.answerId;
                        return (
                          <label
                            key={a.answerId}
                            className={ex('mcq-option', { selected: checked })}
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
                );
              })}

              {(session.questions?.length ?? 0) > 0 && (
                <div className={cx('studySubmitBar')}>
                  <span className={cx('studySubmitProgress')}>
                    Đã trả lời <strong>{answeredCount}</strong>/{session.questions.length} câu
                  </span>
                  <button
                    type="button"
                    className={cx('btn', 'btnPrimary', 'btnLg')}
                    disabled={submitting}
                    onClick={handleSubmit}
                  >
                    {submitting ? 'Đang chấm...' : 'Nộp bài'}
                  </button>
                </div>
              )}
            </div>

            {(session.questions?.length ?? 0) > 0 && (
              <div className={cx('studySidebar')}>
                <TestStartDashboard
                  allQuestions={session.questions}
                  userAnswers={navAnswers}
                  onScrollToQuestion={scrollToQuestion}
                  gridMaxHeight="calc(100vh - 24rem)"
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default PlanStudyPage;
