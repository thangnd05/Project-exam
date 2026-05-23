import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getCurrentSession, submitSession } from '~/api/learningPlanApi';
import PlanPartTaskList, { groupTasksByPart } from './components/PlanPartTaskList';

function PlanStudyPage() {
  const { learningPlanId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const taskIdFromUrl = searchParams.get('taskId');

  const [session, setSession] = useState(null);
  const [selections, setSelections] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const loadSession = useCallback((taskId) => {
    setLoading(true);
    setError(null);
    setResult(null);
    getCurrentSession(learningPlanId, taskId || undefined)
      .then((data) => {
        setSession(data);
        setSelections({});
      })
      .catch((err) => {
        setError(err?.response?.data?.message || err.message);
      })
      .finally(() => setLoading(false));
  }, [learningPlanId]);

  useEffect(() => {
    loadSession(taskIdFromUrl);
  }, [loadSession, taskIdFromUrl]);

  const goToPicker = () => {
    navigate(`/learning-plans/${learningPlanId}`);
  };

  const startTask = (taskId) => {
    setSearchParams({ taskId });
    setResult(null);
  };

  const handleSelect = (questionId, answerId) => {
    setSelections((prev) => ({ ...prev, [questionId]: answerId }));
  };

  const handleSubmit = async () => {
    if (!session?.sessionId) return;
    const answers = (session.questions || []).map((q) => ({
      questionId: q.questionId,
      selectedAnswerId: selections[q.questionId],
    }));
    const missing = answers.some((a) => !a.selectedAnswerId);
    if (missing) {
      setError('Vui lòng chọn đáp án cho tất cả câu hỏi.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await submitSession(learningPlanId, session.sessionId, answers);
      setResult(res);
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="container py-4">Đang tải...</div>;

  const partGroups = session?.partGroups?.length
    ? session.partGroups
    : groupTasksByPart(session?.tasks || []);

  const isPickMode = session?.mode === 'PICK' || (!session?.sessionId && session?.mode !== 'MOCK');
  const isMockMode = session?.mode === 'MOCK' || session?.planStage === 'MOCK';

  if (isMockMode && !session?.sessionId) {
    return (
      <div className="container py-4">
        <div className="alert alert-success">{session.message}</div>
        <Link to={`/learning-plans/${learningPlanId}`} className="btn btn-primary">
          Về kế hoạch
        </Link>
      </div>
    );
  }

  if (isPickMode && !result) {
    return (
      <div className="container py-4">
        <div className="mb-3">
          <Link to={`/learning-plans/${learningPlanId}`} className="btn btn-sm btn-outline-secondary">
            ← Kế hoạch
          </Link>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="card mb-3">
          <div className="card-body">
            <h4 className="mb-2">Chọn Part và ải để học</h4>
            <p className="text-muted mb-2">{session.message}</p>
            <span className="badge bg-secondary me-1">
              Tiến độ: {session.passedTasks}/{session.totalTasks} ải
            </span>
            <span className="badge bg-primary">{session.planStage}</span>
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

  const activeTaskId = session?.activeTask?.taskId || taskIdFromUrl;

  return (
    <div className="container py-4">
      <div className="mb-3 d-flex flex-wrap gap-2">
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={goToPicker}>
          ← Chọn ải khác (trong khung Part)
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {result && (
        <div className={`alert ${result.passed ? 'alert-success' : 'alert-warning'}`}>
          <strong>
            {result.correctCount}/{result.totalCount} đúng ({result.accuracy}%)
          </strong>
          <div className="mt-1">{result.message}</div>
          <div className="mt-2">
            <button
              type="button"
              className="btn btn-sm btn-primary me-2"
              onClick={() => loadSession(taskIdFromUrl)}
            >
              {result.passed ? 'Làm lại ải này' : 'Thử lại'}
            </button>
            <button type="button" className="btn btn-sm btn-outline-secondary me-2" onClick={goToPicker}>
              Chọn ải khác
            </button>
          </div>
        </div>
      )}

      <div className="row g-4">
        <div className="col-lg-4 order-lg-2">
          <div className="sticky-top" style={{ top: '1rem' }}>
            <h5 className="mb-2 small text-muted text-uppercase">Đổi ải (trong Part)</h5>
            <PlanPartTaskList
              partGroups={partGroups}
              learningPlanId={learningPlanId}
              studyAction="button"
              onStudyTask={startTask}
              compact
            />
          </div>
        </div>

        <div className="col-lg-8 order-lg-1">
          {!result && session && (
            <>
              <div className="card mb-3 border-primary">
                <div className="card-body">
                  <div className="d-flex justify-content-between flex-wrap gap-2">
                    <div>
                      <span className="text-muted small">Đang học</span>
                      <h4 className="mb-1">
                        {session.activeTask?.examPartName || 'Part'}
                        {' '}
                        · Ải {session.activeTask?.tagName || '—'}
                      </h4>
                      <span className="badge bg-primary me-1">{session.planStage}</span>
                      <span className="badge bg-secondary">
                        {session.passedTasks}/{session.totalTasks} ải đã pass
                      </span>
                    </div>
                    <div className="text-end">
                      <div className="small text-muted">{session.message}</div>
                      {session.activeTask && (
                        <div className="mt-1 fw-semibold">
                          Cần ≥{session.passAccuracyRequired}% để qua ải
                        </div>
                      )}
                    </div>
                  </div>

                  {session.resource && (
                    <div className="mt-3 p-3 bg-light rounded">
                      <h6>Bước 1: Đọc tài liệu</h6>
                      <a href={session.resource.url} target="_blank" rel="noreferrer">
                        {session.resource.title}
                      </a>
                      {session.resource.description && (
                        <p className="small text-muted mb-0 mt-1">{session.resource.description}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <h5 className="mb-3">
                Bước 2: Luyện ({session.questionCount} câu)
              </h5>

              {(session.questions || []).map((q, idx) => (
                <div key={q.questionId} className="card mb-3">
                  <div className="card-body">
                    <div className="fw-semibold mb-2">
                      Câu {idx + 1}
                    </div>
                    <p>{q.questionText}</p>
                    <div className="list-group">
                      {(q.answers || []).map((a) => (
                        <label
                          key={a.answerId}
                          className={`list-group-item list-group-item-action ${
                            selections[q.questionId] === a.answerId ? 'active' : ''
                          }`}
                        >
                          <input
                            type="radio"
                            className="me-2"
                            name={`q-${q.questionId}`}
                            checked={selections[q.questionId] === a.answerId}
                            onChange={() => handleSelect(q.questionId, a.answerId)}
                          />
                          {a.answerLabel ? `${a.answerLabel}. ` : ''}
                          {a.answerText}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="btn btn-primary btn-lg"
                disabled={submitting || !(session.questions?.length)}
                onClick={handleSubmit}
              >
                {submitting ? 'Đang chấm...' : 'Nộp bài'}
              </button>
            </>
          )}
        </div>
      </div>

      {!result && session?.sessionId && (
        <p className="small text-muted mt-3 d-lg-none">
          Muốn học ải khác: cuộn lên khung Part bên phải hoặc về trang kế hoạch.
        </p>
      )}
    </div>
  );
}

export default PlanStudyPage;
