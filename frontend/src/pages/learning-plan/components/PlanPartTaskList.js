import React from 'react';
import { Link } from 'react-router-dom';

const TASK_STATUS_LABEL = {
  PASSED: { text: 'Đã đạt', className: 'success' },
  ACTIVE: { text: 'Chưa đạt', className: 'primary' },
  LOCKED: { text: 'Chưa đạt', className: 'secondary' },
  SKIPPED: { text: 'Bỏ qua', className: 'light' },
};

/**
 * Danh sách ải (tag) theo từng Part — nút "Học ải" nằm trong khung Part.
 * @param {'link'|'button'} studyAction - link: điều hướng /study?taskId=; button: gọi onStudyTask
 */
function PlanPartTaskList({
  partGroups = [],
  learningPlanId,
  studyAction = 'link',
  onStudyTask,
  compact = false,
}) {
  if (!partGroups.length) {
    return <p className="text-muted mb-0">Chưa có ải trong kế hoạch.</p>;
  }

  return (
    <div className="plan-part-task-list">
      {partGroups.map((group) => (
        <div
          key={group.examPartId}
          className={`card mb-3 border-2 border-primary-subtle shadow-sm ${compact ? 'compact-part-card' : ''}`}
        >
          <div className="card-header bg-primary bg-opacity-10 d-flex justify-content-between align-items-center flex-wrap gap-2 py-2">
            <div>
              <span className="text-muted small d-block">Part</span>
              <strong className="fs-6">{group.examPartName}</strong>
            </div>
            <span className="badge bg-info text-dark">
              {group.passedTasksInPart}/{group.totalTasksInPart} ải
              {group.passAccuracy != null ? ` · cần ≥${group.passAccuracy}%` : ''}
            </span>
          </div>
          <div className={`card-body ${compact ? 'py-2' : 'py-3'}`}>
            <p className="small text-muted mb-2 mb-md-3">
              Bước 1: đọc tài liệu của ải · Bước 2: bấm Học ải để luyện (thứ tự ải tùy ý).
            </p>
            {(group.tasks || []).map((t) => (
              <PartTaskRow
                key={t.taskId}
                task={t}
                learningPlanId={learningPlanId}
                studyAction={studyAction}
                onStudyTask={onStudyTask}
                compact={compact}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const PRIORITY_BADGE = {
  HIGH: { text: 'Nên học trước', className: 'danger' },
  MEDIUM: { text: 'Ưu tiên vừa', className: 'warning' },
  LOW: { text: 'Tùy chọn', className: 'secondary' },
};

function PartTaskRow({ task, learningPlanId, studyAction, onStudyTask, compact }) {
  const status = TASK_STATUS_LABEL[task.status] || TASK_STATUS_LABEL.ACTIVE;
  const canStudy = task.status !== 'SKIPPED';
  const resource = task.studyResource;
  const priority = PRIORITY_BADGE[task.priorityTier] || PRIORITY_BADGE.MEDIUM;

  const studyButton =
    studyAction === 'button' ? (
      <button
        type="button"
        className="btn btn-sm btn-primary"
        disabled={!canStudy}
        onClick={() => onStudyTask?.(task.taskId)}
      >
        Học ải
      </button>
    ) : (
      <Link
        to={`/learning-plans/${learningPlanId}/study?taskId=${task.taskId}`}
        className={`btn btn-sm btn-primary ${!canStudy ? 'disabled' : ''}`}
        aria-disabled={!canStudy}
        onClick={(e) => {
          if (!canStudy) e.preventDefault();
        }}
      >
        Học ải
      </Link>
    );

  return (
    <div
      className={`rounded border bg-white ${compact ? 'p-2 mb-2' : 'p-3 mb-2'}`}
    >
      <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap">
        <div className="min-w-0 flex-grow-1">
        <div className="fw-semibold d-flex flex-wrap align-items-center gap-2">
          <span>
            <span className="text-muted me-1">Ải #{task.taskOrder}</span>
            {task.tagName}
          </span>
          {task.priorityTier && (
            <span className={`badge bg-${priority.className}`}>{priority.text}</span>
          )}
        </div>
        <div className="small text-muted mt-1">
          {task.wrongCountAtDiagnosis != null && (
            <span className="me-2">Sai {task.wrongCountAtDiagnosis} câu (mock)</span>
          )}
            {task.baselineAccuracy != null && (
              <span className="me-2">Điểm gốc {task.baselineAccuracy}%</span>
            )}
            {task.bestAccuracy != null && (
              <span className="me-2">Tốt nhất {task.bestAccuracy}%</span>
            )}
            {task.passAccuracy != null && (
              <span>Pass ≥{task.passAccuracy}%</span>
            )}
          </div>
        </div>
        <span className={`badge bg-${status.className} flex-shrink-0`}>{status.text}</span>
      </div>

      <div className="mt-2 p-2 rounded bg-light border border-light">
        <div className="small fw-semibold text-secondary mb-1">Tài liệu (đọc trước)</div>
        {resource?.url ? (
          <>
            <a
              href={resource.url}
              target="_blank"
              rel="noreferrer"
              className="small d-block text-truncate"
            >
              {resource.title || resource.originalFileName || 'Mở tài liệu'}
            </a>
            {resource.description && (
              <p className="small text-muted mb-0 mt-1">{resource.description}</p>
            )}
          </>
        ) : (
          <span className="small text-muted">
            Chưa gắn tài liệu cho tag này (admin: Recovery Resource + tag).
          </span>
        )}
      </div>

      <div className="d-flex flex-wrap gap-2 mt-2 justify-content-end">
        {resource?.url && (
          <a
            href={resource.url}
            target="_blank"
            rel="noreferrer"
            className="btn btn-sm btn-outline-secondary"
          >
            Xem tài liệu
          </a>
        )}
        {studyButton}
      </div>
    </div>
  );
}

export default PlanPartTaskList;

export function groupTasksByPart(tasks) {
  const map = new Map();
  (tasks || []).forEach((t) => {
    const key = t.examPartId || 'unknown';
    if (!map.has(key)) {
      map.set(key, {
        examPartId: key,
        examPartName: t.examPartName || key,
        passAccuracy: t.passAccuracy,
        passedTasksInPart: 0,
        totalTasksInPart: 0,
        tasks: [],
      });
    }
    const g = map.get(key);
    g.tasks.push(t);
    g.totalTasksInPart += 1;
    if (t.status === 'PASSED') g.passedTasksInPart += 1;
  });
  return Array.from(map.values());
}
