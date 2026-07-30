import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Container } from 'react-bootstrap';
import classNames from 'classnames/bind';
import { getCurrentSession, startTaskSession } from '~/shared/api/learningPlanApi';
import ButtonPrime from '~/shared/ui/Button/ButtonPrime';
import ConfirmActionModal from '~/shared/ui/modal/ConfirmActionModal';
import { buildExamTypeDetailPath } from '~/shared/config/Routes';
import { getRecoveryResourceLinkProps } from '~/shared/utils/recoveryResource';
import { getApiBaseUrl } from '~/shared/utils/mediaUrl';
import { useStreak } from '~/shared/hooks/useStreak';
import PlanPartTaskList, { groupTasksByPart } from '../components/PlanPartTaskList';
import { useSubmitSession } from './hooks/useSubmitSession';
import { planStageLabel } from '../planLabels';
import TestStartDashboard from '~/features/tests/exam/exam-types/detail/testStart/TestStartDashboard';
import ProgressBlock from '~/features/tests/exam/exam-types/detail/testStart/examLayout/blocks/ProgressBlock';
import SubmitBlock from '~/features/tests/exam/exam-types/detail/testStart/examLayout/blocks/SubmitBlock';
import styles from '~/features/diagnostic/styles/PersonalizedPlan.module.scss';
import examStyles from '~/features/tests/exam/exam-types/detail/testStart/TestStartPage.module.scss';
const cx = classNames.bind(styles);
// Tái dùng đúng SCSS thẻ câu hỏi/đáp án của trang làm bài thi.
const ex = classNames.bind(examStyles);

const API_BASE = getApiBaseUrl();

/** Câu đã trả lời: MSQ cần ít nhất 1 lựa chọn, còn lại cần có đáp án được chọn. */
function isAnswered(question, selections) {
  const selected = selections[question.questionId];
  return question.questionType === 'MSQ'
    ? Array.isArray(selected) && selected.length > 0
    : Boolean(selected);
}

const planSessionKeys = {
  session: (learningPlanId, taskId) =>
    ['plan-session', learningPlanId, taskId || null],
};

function PlanStudyPage() {
  const { learningPlanId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshStreak } = useStreak();
  const taskIdFromUrl = searchParams.get('taskId');

  // Lưu đáp án đã chọn vào sessionStorage để không mất khi F5 (giống trang làm bài thi).
  const answersStorageKey = `plan-study-answers-${learningPlanId}-${taskIdFromUrl || 'current'}`;

  const [selections, setSelections] = useState({});
  const [formError, setFormError] = useState(null);
  // > 0 = đang hỏi lại vì còn câu chưa trả lời.
  const [unansweredCount, setUnansweredCount] = useState(0);

  const submitMutation = useSubmitSession();
  const submitting = submitMutation.isPending;

  const sessionQuery = useQuery({
    queryKey: planSessionKeys.session(learningPlanId, taskIdFromUrl),
    // Có taskId = vào học ải đó -> gọi endpoint tạo phiên (POST, trả lại phiên đang dở nếu có).
    // Không có taskId = chỉ xem danh sách ải -> endpoint chỉ đọc.
    queryFn: () => (taskIdFromUrl
      ? startTaskSession(learningPlanId, taskIdFromUrl)
      : getCurrentSession(learningPlanId)),
    enabled: !!learningPlanId,
    retry: false,
  });

  const session = sessionQuery.data ?? null;
  // Chỉ chặn màn hình ở lần tải đầu; refetch nền giữ nguyên bài đang làm, không nháy "Đang tải".
  const loading = sessionQuery.isLoading;
  const loadError = sessionQuery.error
    ? sessionQuery.error?.response?.data?.message || sessionQuery.error.message
    : null;
  const error = formError || loadError;

  // Reset khi đổi ải, đồng thời khôi phục đáp án đã lưu (F5).
  useEffect(() => {
    setFormError(null);
    try {
      const saved = sessionStorage.getItem(answersStorageKey);
      setSelections(saved ? JSON.parse(saved) : {});
    } catch {
      setSelections({});
    }
  }, [learningPlanId, taskIdFromUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lưu đáp án mỗi khi thay đổi, để F5 không mất.
  useEffect(() => {
    try {
      sessionStorage.setItem(answersStorageKey, JSON.stringify(selections));
    } catch {
      /* bỏ qua nếu storage đầy/không dùng được */
    }
  }, [selections, answersStorageKey]);

  const goToPicker = () => {
    navigate(`/learning-plans/${learningPlanId}`);
  };

  const startTask = (taskId) => {
    setSearchParams({ taskId });
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
    // Câu bỏ trống bị tính là sai -> hỏi lại trước khi nộp thay vì chấm thẳng.
    const unanswered = (session.questions || []).filter((q) => !isAnswered(q, selections)).length;
    if (unanswered > 0) {
      setUnansweredCount(unanswered);
      return;
    }
    doSubmit();
  };

  const doSubmit = () => {
    setUnansweredCount(0);
    const answers = (session.questions || []).map((q) => {
      const sel = selections[q.questionId];
      if (q.questionType === 'MSQ') {
        return { questionId: q.questionId, selectedAnswerIds: Array.isArray(sel) ? sel : [] };
      }
      return { questionId: q.questionId, selectedAnswerId: sel };
    });
    setFormError(null);
    submitMutation.mutate(
      { learningPlanId, sessionId: session.sessionId, answers },
      {
        onSuccess: (res) => {
          try {
            sessionStorage.removeItem(answersStorageKey);
          } catch { /* noop */ }
          if (res?.passed) refreshStreak();
          // Điều hướng sang trang kết quả riêng (có URL) để F5 vẫn giữ kết quả,
          // không rơi về phiên đề mới.
          const taskId = taskIdFromUrl || session?.activeTask?.taskId;
          navigate(`/learning-plans/${learningPlanId}/tasks/${taskId}/result`);
        },
        onError: (err) => setFormError(err?.response?.data?.message || err.message),
      },
    );
  };

  if (loading) {
    return <div className={cx('wrapper')}><div className={cx('loading')}>Đang tải...</div></div>;
  }

  // Không có dữ liệu phiên (API lỗi) -> hiện lỗi, tránh rơi vào nhánh PICK rồi vỡ ở session.message.
  if (!session) {
    return (
      <div className={cx('wrapper')}>
        <div className={cx('headerBar')}>
          <Link to={`/learning-plans/${learningPlanId}`} className={cx('btn', 'btnGhost', 'btnSm')}>
            ← Kế hoạch
          </Link>
        </div>
        <div className={cx('alert', 'alertDanger')}>{error || 'Không mở được ải này.'}</div>
      </div>
    );
  }

  const partGroups = session.partGroups?.length
    ? session.partGroups
    : groupTasksByPart(session.tasks || []);

  // Chỉ dựa vào mode của BE: plan đã sang trạm MOCK vẫn có thể mở phiên luyện lại một ải cũ.
  const isPickMode = session?.mode === 'PICK' || (!session?.sessionId && session?.mode !== 'MOCK');
  const isMockMode = session?.mode === 'MOCK';

  if (isMockMode) {
    return (
      <div className={cx('wrapper')}>
        <div className={cx('alert', 'alertSuccess')}>
          <span>{session.message}</span>
          <div className={cx('actionBar')}>
            {/* Hết ải rồi thì việc tiếp theo là đi thi thử, không phải quay về kế hoạch. */}
            <Link
              to={buildExamTypeDetailPath(session.examTypeId)}
              className={cx('btn', 'btnPrimary', 'btnSm')}
            >
              Làm bài thi thử
            </Link>
            <Link
              to={`/learning-plans/${learningPlanId}`}
              className={cx('btn', 'btnOutline', 'btnSm')}
            >
              Về kế hoạch
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isPickMode) {
    return (
      <div className={cx('wrapper')}>
        <div className={cx('headerBar')}>
          <Link to={`/learning-plans/${learningPlanId}`} className={cx('btn', 'btnGhost', 'btnSm')}>
            ← Kế hoạch
          </Link>
        </div>

        {error && <div className={cx('alert', 'alertDanger')}>{error}</div>}
        {session.notice && (
          <div className={cx('alert', 'alertWarning')}>{session.notice}</div>
        )}

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

  const answeredCount = (session.questions || []).filter((q) => isAnswered(q, selections)).length;

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
    <div
      className={cx('wrapper', 'studyWide', {
        studyWideWithFooter: (session?.questions?.length ?? 0) > 0,
      })}
    >
      <div className={cx('headerBar')}>
        <button type="button" className={cx('btn', 'btnOutline', 'btnSm')} onClick={goToPicker}>
          Quay lại
        </button>
      </div>

      {error && <div className={cx('alert', 'alertDanger')}>{error}</div>}

      {session && (
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
                  <span className={cx('badge', 'badgePrimary')}>
                    {/* Hết ải rồi mà vẫn mở phiên -> đây là lượt luyện lại, không phải giai đoạn học. */}
                    {session.planStage === 'MOCK' ? 'Luyện lại' : planStageLabel(session.planStage)}
                  </span>
                  <span className={cx('badge', 'badgeMuted')}>
                    {session.passedTasks}/{session.totalTasks} ải đã vượt
                  </span>
                  {session.passAccuracyRequired != null && (
                    <span className={cx('badge', 'badgePrimary')}>
                      Cần ≥{session.passAccuracyRequired}% để qua ải
                    </span>
                  )}
                </div>
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
                <div className={ex('footer-actions')}>
                  <div className={ex('footer-buttons')}>
                    <Container className={ex('footer-buttons-inner')}>
                      <div className={ex('footer-pills')}>
                        <ProgressBlock
                          answered={answeredCount}
                          total={session.questions.length}
                        />
                      </div>
                      <div className={ex('footer-right-group')}>
                        <SubmitBlock
                          onSubmit={handleSubmit}
                          isSubmitting={submitting}
                          label="Nộp bài"
                        />
                      </div>
                    </Container>
                  </div>
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

      <ConfirmActionModal
        show={unansweredCount > 0}
        onClose={() => setUnansweredCount(0)}
        onConfirm={doSubmit}
        title="Còn câu chưa trả lời"
        confirmText="Vẫn nộp bài"
        cancelText="Quay lại làm tiếp"
        message={`Bạn còn ${unansweredCount} câu chưa trả lời — các câu này sẽ bị tính là sai khi chấm. Vẫn nộp bài?`}
      />
    </div>
  );
}

export default PlanStudyPage;
