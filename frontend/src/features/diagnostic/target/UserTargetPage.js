import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import { getUserTarget } from '~/shared/api/userTargetApi';
import planStyles from '~/features/diagnostic/styles/PersonalizedPlan.module.scss';
import styles from './UserTargetPage.module.scss';
import { sortPartsByLookup } from '~/shared/utils/partOrder';
import useMilestoneScoring from '~/shared/hooks/useMilestoneScoring';
import { useUserTargetData } from './hooks/useUserTargetData';
import {
  useSaveUserTarget,
  useDeleteUserTarget,
} from './hooks/useUserTargetMutations';

const cx = classNames.bind(styles);
const planCx = classNames.bind(planStyles);

function UserTargetPage() {
  const [searchParams] = useSearchParams();
  const [selectedExamTypeId, setSelectedExamTypeId] = useState('');
  const [targetScore, setTargetScore] = useState('');
  const [customParts, setCustomParts] = useState({});
  const [currentTarget, setCurrentTarget] = useState(null);
  const [message, setMessage] = useState('');

  const { examTypes, examParts, skills, scoringConversions, milestones } =
    useUserTargetData(selectedExamTypeId);

  const saveMutation = useSaveUserTarget();
  const deleteMutation = useDeleteUserTarget();
  const loading = saveMutation.isPending || deleteMutation.isPending;

  useEffect(() => {
    const examTypeIdFromQuery = searchParams.get('examTypeId');
    if (examTypeIdFromQuery) {
      setSelectedExamTypeId(examTypeIdFromQuery);
    }
  }, [searchParams]);

  const {
    isScaled,
    maxScore: maxTargetScore,
    getPartTotal,
    getPartName,
    percentToNum,
    numToPercent,
    evenPctForScore,
    estimateScore,
    formatEstimateDetail,
  } = useMilestoneScoring({
    examTypes,
    examParts,
    skills,
    scoringConversions,
    selectedExamTypeId,
  });

  const loadCurrentTarget = useCallback(async () => {
    if (!selectedExamTypeId) {
      setCurrentTarget(null);
      setTargetScore('');
      setCustomParts({});
      return;
    }
    try {
      const data = await getUserTarget(selectedExamTypeId);
      if (data.hasTarget) {
        setCurrentTarget(data);
        setTargetScore(String(data.targetScore || ''));
        const cp = {};
        (data.partRequirements || []).forEach((p) => {
          cp[p.examPartId] = p.requiredPercentage;
        });
        setCustomParts(cp);
      } else {
        setCurrentTarget(null);
        setTargetScore('');
        setCustomParts({});
      }
    } catch {
      setCurrentTarget(null);
      setTargetScore('');
      setCustomParts({});
    }
  }, [selectedExamTypeId]);

  useEffect(() => {
    loadCurrentTarget();
  }, [loadCurrentTarget]);

  const matchedMilestone = useMemo(() => {
    if (!targetScore) return null;
    return milestones.find((m) => m.milestoneScore === Number(targetScore)) || null;
  }, [targetScore, milestones]);

  const filteredParts = examParts.filter((p) => p.examTypeId === selectedExamTypeId);
  const partRequirements = useMemo(() => {
    if (!targetScore || filteredParts.length === 0) return [];
    if (matchedMilestone && matchedMilestone.partRequirements) {
      const mapped = matchedMilestone.partRequirements.map((pr) => ({
        examPartId: pr.examPartId,
        requiredPercentage: pr.requiredPercentage,
      }));
      return sortPartsByLookup(mapped, filteredParts);
    }
    const evenPct = evenPctForScore(targetScore);
    return filteredParts.map((p) => ({
      examPartId: p.examPartId,
      requiredPercentage: evenPct,
    }));
  }, [targetScore, matchedMilestone, filteredParts]);

  const handleSave = () => {
    if (hasSavedTarget) {
      setMessage('Bạn đã có mục tiêu hiện tại. Vui lòng xóa mục tiêu cũ trước khi lưu mới.');
      return;
    }
    if (!targetScore || !selectedExamTypeId) {
      setMessage('Nhập điểm mục tiêu trước.');
      return;
    }
    setMessage('');

    const allParts = partRequirements.map((pr) => ({
      examPartId: pr.examPartId,
      customPercentage:
        customParts[pr.examPartId] !== undefined
          ? Number(customParts[pr.examPartId])
          : pr.requiredPercentage,
    }));

    saveMutation.mutate(
      {
        examTypeId: selectedExamTypeId,
        targetScore: Number(targetScore),
        customParts: allParts,
      },
      {
        onSuccess: (result) => {
          setCurrentTarget(result);
          setMessage('Đã lưu mục tiêu thành công!');
        },
        onError: () => setMessage('Lỗi khi lưu mục tiêu.'),
      },
    );
  };

  const handleDelete = () => {
    if (!selectedExamTypeId) return;
    setMessage('');

    deleteMutation.mutate(selectedExamTypeId, {
      onSuccess: () => {
        setCurrentTarget(null);
        setTargetScore('');
        setCustomParts({});
        setMessage('Đã xóa mục tiêu.');
      },
      onError: () => setMessage('Lỗi khi xóa mục tiêu.'),
    });
  };

  const handlePartChange = (examPartId, value) => {
    setCustomParts((prev) => ({ ...prev, [examPartId]: value }));
  };

  const handleResetPart = (examPartId) => {
    setCustomParts((prev) => {
      const next = { ...prev };
      delete next[examPartId];
      return next;
    });
  };

  const isSuccess = message.includes('thành công') || message.includes('Đã xóa');
  const hasSavedTarget = Boolean(currentTarget?.hasTarget);

  const scoreEstimateBlock = (() => {
    if (!targetScore || partRequirements.length === 0) return null;
    const partsConfig = {};
    partRequirements.forEach((pr) => {
      partsConfig[pr.examPartId] =
        customParts[pr.examPartId] !== undefined
          ? Number(customParts[pr.examPartId])
          : pr.requiredPercentage;
    });
    const est = estimateScore(partsConfig, selectedExamTypeId);
    if (!est) return null;
    const diff = est.totalScore - Number(targetScore);
    const tone = diff === 0 ? 'neutral' : diff > 0 ? 'above' : 'below';
    const diffColor =
      diff === 0 ? 'var(--success-text)' : 'var(--primary)';

    return (
      <div className={classNames(planCx('alert'), cx('scoreEstimate', tone))}>
        <div className={cx('scoreEstimateMain')}>
          <span className={planCx('muted')}>Điểm ước tính:</span>
          <span className={cx('scoreEstimateValue')}>{est.totalScore}</span>
          <span className={cx('scoreEstimateDiff')} style={{ color: diffColor }}>
            ({diff > 0 ? '+' : ''}
            {diff} so với mục tiêu {targetScore})
          </span>
        </div>
        <div className={cx('scoreEstimateDetail')}>
          {est.scaled
            ? `${formatEstimateDetail(est)}, cần đạt ≥ ${targetScore}`
            : formatEstimateDetail(est)}
        </div>
      </div>
    );
  })();

  return (
    <div className={classNames(planCx('wrapper'), cx('pageRoot'))}>
      <div className={planCx('headerBar')}>
        <h2 className={classNames(planCx('title'), cx('pageTitle'))}>Mục tiêu của tôi</h2>
        <div className={planCx('actionBar')}>
          <Link
            to={
              selectedExamTypeId
                ? `/my-target/dashboard?examTypeId=${selectedExamTypeId}`
                : '/my-target/dashboard'
            }
            className={planCx('btn', 'btnOutline', 'btnSm')}
          >
            Dashboard
          </Link>
          <Link
            to={
              selectedExamTypeId
                ? `/learning-plans/generate?examTypeId=${selectedExamTypeId}`
                : '/learning-plans/generate'
            }
            className={classNames(planCx('btn', 'btnPrimary', 'btnSm'), cx('heroHoverBtn'))}
          >
            Sinh lộ trình
          </Link>
        </div>
      </div>

      <p className={classNames(planCx('subtitle'), cx('pageSubtitle'))}>
        Nhập điểm mục tiêu theo từng loại kỳ thi. Nếu trùng mốc admin đã cấu hình, % từng
        phần sẽ được gợi ý tự động. Bạn có thể chỉnh lại yêu cầu từng part cho phù hợp
        với bản thân.
      </p>

      {message && (
        <div
          className={planCx(
            'alert',
            isSuccess ? 'alertSuccess' : 'alertDanger',
          )}
        >
          <span>{message}</span>
        </div>
      )}

      <div className={classNames(planCx('card'), cx('setupCard'))}>
        <div className={classNames(planCx('cardHeader'), cx('compactCardHeader'))}>Thiết lập mục tiêu</div>
        <div className={classNames(planCx('cardBody'), cx('compactCardBody'))}>
          <div className={classNames(planCx('fieldGroup'), cx('fieldFull'))}>
            <label className={cx('fieldLabelLarge')}>Loại kỳ thi</label>
            <select
              className={classNames(planCx('select'), cx('compactSelect'))}
              style={{ width: '100%' }}
              value={selectedExamTypeId}
              onChange={(e) => {
                setSelectedExamTypeId(e.target.value);
                setTargetScore('');
                setCustomParts({});
                setMessage('');
              }}
            >
              <option value="">-- Chọn --</option>
              {examTypes.map((et) => (
                <option key={et.examTypeId} value={et.examTypeId}>
                  {et.name}
                </option>
              ))}
            </select>
          </div>

          {selectedExamTypeId && (
            <div className={classNames(planCx('fieldGroup'), cx('fieldFull'))}>
              <label className={cx('fieldLabelLarge')}>Điểm mục tiêu</label>
              <div className={cx('scoreInputRow')}>
                <input
                  type="number"
                  className={classNames(planCx('select'), cx('scoreInput'))}
                  placeholder={isScaled ? 'VD: 700' : 'VD: 450'}
                  value={targetScore}
                  min={0}
                  max={maxTargetScore}
                  onChange={(e) => {
                    setTargetScore(e.target.value);
                    setCustomParts({});
                  }}
                />
                {targetScore && matchedMilestone && (
                  <span className={cx('milestoneHint', 'matched')}>
                    Trùng mốc &quot;{matchedMilestone.milestoneScore}
                    {matchedMilestone.description && ` — ${matchedMilestone.description}`}
                    &quot; — dùng cấu hình admin
                  </span>
                )}
                {targetScore && !matchedMilestone && (
                  <span className={cx('milestoneHint', 'custom')}>
                    Không trùng mốc nào — chia đều {evenPctForScore(targetScore)}% mỗi part
                  </span>
                )}
              </div>
              {milestones.length > 0 && (
                <div className={cx('milestoneChips')}>
                  <span className={cx('chipsLabel')}>Gợi ý từ admin:</span>
                  {milestones.map((m) => (
                    <button
                      key={m.examTargetMilestoneId}
                      type="button"
                      className={classNames(planCx('badge'), cx('chip', {
                        active: Number(targetScore) === m.milestoneScore,
                      }))}
                      onClick={() => {
                        setTargetScore(String(m.milestoneScore));
                        setCustomParts({});
                      }}
                    >
                      {m.milestoneScore}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {targetScore && partRequirements.length > 0 && (
            <div className={classNames(planCx('card'), cx('partSection'))}>
              <div className={classNames(planCx('cardHeader'), cx('compactCardHeader'))}>
                Yêu cầu từng phần thi
              </div>
              <div className={classNames(planCx('cardBody'), cx('compactCardBody'))}>
                <p className={cx('partSectionHint')}>
                  {matchedMilestone
                    ? 'Giá trị từ cấu hình admin. Sửa ô để tuỳ chỉnh.'
                    : `Chia đều ${evenPctForScore(targetScore)}%. Sửa ô để tuỳ chỉnh.`}
                </p>

                {partRequirements.map((pr) => {
                  const isCustom = customParts[pr.examPartId] !== undefined;
                  const currentPct = Number(
                    isCustom ? customParts[pr.examPartId] : pr.requiredPercentage,
                  );
                  const total = getPartTotal(pr.examPartId);
                  const numCorrect = percentToNum(currentPct, total);

                  return (
                    <div key={pr.examPartId} className={cx('partRow')}>
                      <span className={cx('partName')}>
                        {getPartName(pr.examPartId)}
                        <span className={cx('partTotal')}>({total} câu)</span>
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={total}
                        className={classNames(planCx('select'), cx('partInput', { custom: isCustom }))}
                        value={numCorrect}
                        onChange={(e) => {
                          const newPct = numToPercent(Number(e.target.value), total);
                          handlePartChange(pr.examPartId, newPct);
                        }}
                      />
                      <span className={cx('partUnit')}>câu</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        className={classNames(planCx('select'), cx('partInput', { custom: isCustom }))}
                        value={currentPct}
                        onChange={(e) => {
                          handlePartChange(pr.examPartId, Number(e.target.value));
                        }}
                      />
                      <span className={cx('partUnit')}>%</span>
                      {isCustom && (
                        <button
                          type="button"
                          className={cx('resetBtn')}
                          onClick={() => handleResetPart(pr.examPartId)}
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {scoreEstimateBlock}

          {targetScore && (
            <div className={planCx('actionBar')} style={{ marginTop: '0.8rem' }}>
              <button
                type="button"
                className={classNames(planCx('btn', 'btnPrimary', 'btnLg'), cx('heroHoverBtn'))}
                onClick={handleSave}
                disabled={loading || hasSavedTarget}
              >
                {loading ? 'Đang lưu...' : 'Lưu mục tiêu'}
              </button>
              {hasSavedTarget && (
                <button
                  type="button"
                  className={planCx('btn', 'btnOutline', 'btnLg')}
                  onClick={handleDelete}
                  disabled={loading}
                  style={{ color: 'var(--danger-text)', borderColor: 'var(--danger-border)' }}
                >
                  Xóa mục tiêu
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {hasSavedTarget && (
        <section className={cx('currentTargetCard')} aria-label="Mục tiêu hiện tại">
          <div className={cx('currentTargetHeader')}>
            <span className={cx('currentTargetLabel')}>Mục tiêu hiện tại</span>
            <span className={cx('currentTargetScore')}>{currentTarget.targetScore} điểm</span>
          </div>
          <div className={cx('currentTargetParts')}>
            {sortPartsByLookup(currentTarget.partRequirements || [], examParts).map((p) => {
              const total = getPartTotal(p.examPartId);
              const num = percentToNum(p.requiredPercentage, total);
              return (
                <span key={p.examPartId} className={cx('currentTargetBadge')}>
                  {getPartName(p.examPartId)}: {num}/{total} ({p.requiredPercentage}%)
                </span>
              );
            })}
          </div>
          <div className={planCx('actionBar')} style={{ marginTop: '1rem' }}>
            <Link
              to={
                selectedExamTypeId
                  ? `/learning-plans/generate?examTypeId=${selectedExamTypeId}`
                  : '/learning-plans/generate'
              }
              className={classNames(planCx('btn', 'btnPrimary', 'btnSm'), cx('heroHoverBtn'))}
            >
              Sinh lộ trình vượt ải
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

export default UserTargetPage;
