'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSearchParamsState } from '@/app/hooks/useSearchParamsState';
import { useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import classNames from 'classnames/bind';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import ConfirmModal from '@/app/components/modal/ConfirmModal';
import { buildExamTypeDetailPath } from '@/app/configs/Routes';
import { getRecoveryResourceLinkProps } from '@/app/utils/recoveryResource';
import { getApiBaseUrl, getFullMediaUrl } from '@/app/utils/mediaUrl';
import { useStreak } from '@/app/hooks/useStreak';
import PlanPartTaskList from '@/app/components/learning-plans/PlanPartTaskList/PlanPartTaskList';
import { useSubmitSession } from './_hooks/useSubmitSession';
import { usePlanSession } from './_hooks/usePlanSession';
import { planNoticeText, planStageLabel, taskDisplayName } from '@/app/utils/planLabels';
import TestStartDashboard from '@/app/features/tests/exam/exam-types/detail/testStart/TestStartDashboard';
import ProgressBlock from '@/app/components/exam-layout/blocks/ProgressBlock';
import SubmitBlock from '@/app/components/exam-layout/blocks/SubmitBlock';
import styles from '@/app/assets/styles/diagnostic/PersonalizedPlan.module.scss';
import examStyles from '@/app/features/tests/exam/exam-types/detail/testStart/TestStartPage.module.scss';
import { MediaType, PassageType, QuestionType } from '@/app/enums';
import type { PassageResponse, QuestionResponse } from '@/app/types';

// TODO: TestStartDashboard vẫn nằm ở features/tests/.../testStart (.js, không thuộc batch chuyển
// exam-layout) — TS suy props từ destructure nên bắt buộc columns/canNavigateToQuestion dù runtime
// cho phép bỏ trống. Cast any có chủ đích, bỏ khi trang làm bài chuyển sang TS.
const TestStartDashboardLoose = TestStartDashboard as any;
const cx = classNames.bind(styles);

const ex = classNames.bind(examStyles);

const API_BASE = getApiBaseUrl();

function isAnswered(question: QuestionResponse, selections: Record<string, string | string[]>) {
  const selected = selections[question.questionId];
  return question.questionType === QuestionType.MSQ
    ? Array.isArray(selected) && selected.length > 0
    : Boolean(selected);
}

// Gom các câu hỏi cùng passage vào một nhóm để chỉ hiển thị đoạn văn/audio một lần.
type QuestionGroup = { passage: PassageResponse | null; questions: QuestionResponse[] };

function groupQuestionsByPassage(questions?: QuestionResponse[] | null): QuestionGroup[] {
  const byPassage = new Map<string, QuestionGroup>();
  const groups: QuestionGroup[] = [];
  (questions || []).forEach((q) => {
    const pid = q.passage?.passageId;
    if (pid && byPassage.has(pid)) {
      byPassage.get(pid)!.questions.push(q);
      return;
    }
    const group = { passage: q.passage || null, questions: [q] };
    if (pid) byPassage.set(pid, group);
    groups.push(group);
  });
  return groups;
}

function PassageBox({ passage }: { passage?: PassageResponse | null }) {
  if (!passage) return null;
  const mediaList = Array.isArray(passage.passageMedias) ? passage.passageMedias : [];
  const hasContent = Boolean(passage.content);
  const hasSingleAudio =
    mediaList.length === 0 && Boolean(passage.mediaUrl) && passage.passageType === PassageType.LISTENING;
  if (!hasContent && mediaList.length === 0 && !hasSingleAudio) return null;

  const renderText = (text: string | undefined, key: string) => (
    <div key={key} className={ex('passage-content')}>
      {String(text)
        .split(/\n+/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((para, i) => (
          <p key={i} className={ex('passage-paragraph')}>
            {para}
          </p>
        ))}
    </div>
  );

  return (
    <div className={ex('passage-box')}>
      {hasContent && renderText(passage.content, 'main')}
      {mediaList.map((m, idx) => {
        if (m?.mediaType === MediaType.TEXT) {
          return m.content ? renderText(m.content, `media-${idx}`) : null;
        }
        if (!m?.mediaUrl) return null;
        if (m.mediaType === MediaType.AUDIO) {
          return (
            <div key={idx} className="mb-3">
              <audio controls src={getFullMediaUrl(m.mediaUrl) as string} className={ex('audio-player')} />
            </div>
          );
        }
        if (m.mediaType === MediaType.IMAGE) {
          return (
            <div key={idx} className={ex('passage-image-box')}>
              <img
                src={getFullMediaUrl(m.mediaUrl) as string}
                alt={`Passage ${idx + 1}`}
                className={ex('passage-image')}
              />
            </div>
          );
        }
        return null;
      })}
      {hasSingleAudio && (
        <div className="mb-4">
          <audio
            controls
            src={getFullMediaUrl(passage.mediaUrl) as string}
            className={ex('audio-player')}
          />
        </div>
      )}
    </div>
  );
}

function PlanStudy() {
  const { learningPlanId } = useParams<{ learningPlanId: string }>();
  const [searchParams, setSearchParams] = useSearchParamsState();
  const router = useRouter();
  const { refreshStreak } = useStreak();
  const taskIdFromUrl = searchParams.get('taskId');

  const answersStorageKey = `plan-study-answers-${learningPlanId}-${taskIdFromUrl || 'current'}`;

  const [selections, setSelections] = useState<Record<string, string | string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const [unansweredCount, setUnansweredCount] = useState(0);

  const submitMutation = useSubmitSession();
  const submitting = submitMutation.isPending;

  const { session, isLoading: loading, error: loadError } = usePlanSession(
    learningPlanId,
    taskIdFromUrl,
  );

  const error = formError || loadError;

  useEffect(() => {
    setFormError(null);
    const sessionId = session?.sessionId;
    if (!sessionId) {
      setSelections({});
      return;
    }
    try {
      const saved = JSON.parse(sessionStorage.getItem(answersStorageKey) || 'null');
      setSelections(saved?.sessionId === sessionId ? saved.selections || {} : {});
    } catch {
      setSelections({});
    }
  }, [answersStorageKey, session?.sessionId]);

  useEffect(() => {
    if (!session?.sessionId) return;
    try {
      sessionStorage.setItem(
        answersStorageKey,
        JSON.stringify({ sessionId: session.sessionId, selections }),
      );
    } catch {

    }
  }, [selections, answersStorageKey, session?.sessionId]);

  const goToPicker = () => {
    router.push(`/learning-plans/${learningPlanId}`);
  };

  const startTask = (taskId: string) => {
    setSearchParams({ taskId });
  };

  const handleSelect = (questionId: string, answerId: string, isMsq: boolean) => {
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

    const unanswered = (session.questions || []).filter((q) => !isAnswered(q, selections)).length;
    if (unanswered > 0) {
      setUnansweredCount(unanswered);
      return;
    }
    doSubmit();
  };

  const doSubmit = () => {
    setUnansweredCount(0);
    const answers = (session?.questions || []).map((q) => {
      const sel = selections[q.questionId];
      if (q.questionType === QuestionType.MSQ) {
        return { questionId: q.questionId, selectedAnswerIds: Array.isArray(sel) ? sel : [] };
      }
      return { questionId: q.questionId, selectedAnswerId: sel as string | undefined };
    });
    setFormError(null);
    submitMutation.mutate(
      { learningPlanId, sessionId: session?.sessionId as string, answers },
      {
        onSuccess: (res) => {
          try {
            sessionStorage.removeItem(answersStorageKey);
          } catch {  }
          if (res?.passed) refreshStreak();

          const taskId = taskIdFromUrl || session?.activeTask?.taskId;
          router.push(`/learning-plans/${learningPlanId}/tasks/${taskId}/result`);
        },
        // err any có chủ đích: lỗi Axios, đọc response.data.message (BE không có type lỗi)
        onError: (err: any) => setFormError(err?.response?.data?.message || err.message),
      },
    );
  };

  if (loading) {
    return <div className={cx('wrapper')}><div className={cx('loading')}>Đang tải...</div></div>;
  }

  if (!session) {
    return (
      <div className={cx('wrapper')}>
        <div className={cx('headerBar')}>
          <Link href={`/learning-plans/${learningPlanId}`} className={cx('btn', 'btnGhost', 'btnSm')}>
            ← Kế hoạch
          </Link>
        </div>
        <div className={cx('alert', 'alertDanger')}>{error || 'Không mở được ải này.'}</div>
      </div>
    );
  }

  const partGroups = session.partGroups || [];

  const isPickMode = session?.mode === 'PICK' || (!session?.sessionId && session?.mode !== 'MOCK');
  const isMockMode = session?.mode === 'MOCK';

  if (isMockMode) {
    return (
      <div className={cx('wrapper')}>
        <div className={cx('alert', 'alertSuccess')}>
          <span>
            Đã hoàn thành ải theo từng Part. Làm Full Mock để kiểm tra readiness.
            <br />
            <small>
              Làm một bài <strong>thi thử trọn đề</strong>, sau đó quay lại trang kế hoạch 
              hệ thống sẽ gợi ý sinh lộ trình mới từ chính bài vừa làm.
            </small>
          </span>
          <div className={cx('actionBar')}>
            <Link
              href={buildExamTypeDetailPath(session.examTypeId)}
              className={cx('btn', 'btnPrimary', 'btnSm')}
            >
              Làm bài thi thử
            </Link>
            <Link
              href={`/learning-plans/${learningPlanId}`}
              className={cx('btn', 'btnOutline', 'btnSm')}
            >
              Xem bước tiếp theo
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
          <Link href={`/learning-plans/${learningPlanId}`} className={cx('btn', 'btnGhost', 'btnSm')}>
            ← Kế hoạch
          </Link>
        </div>

        {error && <div className={cx('alert', 'alertDanger')}>{error}</div>}
        {planNoticeText(session.noticeCode) && (
          <div className={cx('alert', 'alertWarning')}>{planNoticeText(session.noticeCode)}</div>
        )}

        <div className={cx('card')}>
          <div className={cx('cardBody')}>
            <h3 className={cx('title', 'pickTitle')}>
              Chọn Part và ải để học
            </h3>
            <p className={cx('muted')} style={{ marginBottom: '1.2rem' }}>
              Đọc tài liệu trong từng ải trước, sau đó bấm Học ải để luyện.
            </p>
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

  const questionGroups = groupQuestionsByPassage(session.questions);
  const orderedQuestions = questionGroups.flatMap((g) => g.questions);
  const questionNumberById: Record<string, number> = {};
  orderedQuestions.forEach((q, i) => {
    questionNumberById[q.questionId] = i + 1;
  });

  const navAnswers: Record<string, { selectedAnswerIds?: string[]; selectedAnswerId?: string | string[] }> = {};
  (session?.questions || []).forEach((q) => {
    const sel = selections[q.questionId];
    navAnswers[q.questionId] =
      q.questionType === QuestionType.MSQ
        ? { selectedAnswerIds: Array.isArray(sel) ? sel : [] }
        : { selectedAnswerId: sel };
  });

  const scrollToQuestion = (questionId: string) => {
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
                  {' · Ải '}{taskDisplayName(session.activeTask)}
                </h3>
                <div className={cx('actionBar')}>
                  <span className={cx('badge', 'badgePrimary')}>

                    {session.planStage === 'MOCK' ? 'Luyện lại' : planStageLabel(session.planStage)}
                  </span>
                  <span className={cx('badge', 'badgeMuted')}>
                    {session.passedTasks}/{session.totalTasks} ải đã xong
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
                    href={getRecoveryResourceLinkProps(session.resource, API_BASE)!.href}
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
              {questionGroups.map((group, groupIdx) => {
                const questionCards = group.questions.map((q) => {
                  const isMsq = q.questionType === QuestionType.MSQ;
                  const sel = selections[q.questionId];
                  return (
                    <div key={q.questionId} id={`q-${q.questionId}`} className={ex('question-card')}>
                      <span className={ex('q-text')}>
                        <span className={ex('q-number')}>Câu {questionNumberById[q.questionId]}:</span>{' '}
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
                });

                if (!group.passage) {
                  return questionCards;
                }
                return (
                  <div
                    key={group.passage.passageId || groupIdx}
                    className={ex('group-section')}
                  >
                    <PassageBox passage={group.passage} />
                    {questionCards}
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
                          total={session.questions!.length}
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
                <TestStartDashboardLoose
                  allQuestions={orderedQuestions}
                  userAnswers={navAnswers}
                  onScrollToQuestion={scrollToQuestion}
                  gridMaxHeight="calc(100vh - 24rem)"
                />
              </div>
            )}
          </div>
        </>
      )}

      <ConfirmModal
        show={unansweredCount > 0}
        onClose={() => setUnansweredCount(0)}
        onConfirm={doSubmit}
        title="Còn câu chưa trả lời"
        confirmText="Vẫn nộp bài"
        cancelText="Quay lại làm tiếp"
        message={`Bạn còn ${unansweredCount} câu chưa trả lời  các câu này sẽ bị tính là sai khi chấm. Vẫn nộp bài?`}
      />
    </div>
  );
}

export default PlanStudy;
