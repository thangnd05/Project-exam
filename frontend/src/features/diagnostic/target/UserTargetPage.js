import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import classNames from 'classnames/bind';
import { getUserTarget } from '~/shared/api/userTargetApi';
import ButtonPrime from '~/shared/ui/Button/ButtonPrime';
import TargetPlanTabs from '~/features/diagnostic/TargetPlanTabs';
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

const currentTargetKeys = {
  detail: (examTypeId) => ['user-target', examTypeId],
};

function UserTargetPage() {
  const [searchParams] = useSearchParams();
  const [selectedExamTypeId, setSelectedExamTypeId] = useState('');
  const [targetScore, setTargetScore] = useState('');
  const [customParts, setCustomParts] = useState({});

  const targetQuery = useQuery({
    queryKey: currentTargetKeys.detail(selectedExamTypeId),
    queryFn: () => getUserTarget(selectedExamTypeId),
    enabled: !!selectedExamTypeId,
  });
  const currentTarget = targetQuery.data?.hasTarget ? targetQuery.data : null;

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

  // Đồng bộ form (điểm mục tiêu, % từng part) theo mục tiêu server trả về.
  useEffect(() => {
    if (!selectedExamTypeId) {
      setTargetScore('');
      setCustomParts({});
      return;
    }
    if (targetQuery.data?.hasTarget) {
      setTargetScore(String(targetQuery.data.targetScore || ''));
      const cp = {};
      (targetQuery.data.partRequirements || []).forEach((p) => {
        cp[p.examPartId] = p.requiredPercentage;
      });
      setCustomParts(cp);
    } else if (targetQuery.data || targetQuery.isError) {
      setTargetScore('');
      setCustomParts({});
    }
  }, [selectedExamTypeId, targetQuery.data, targetQuery.isError]);

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
      toast.warn('Bạn đã có mục tiêu hiện tại. Vui lòng xóa mục tiêu cũ trước khi lưu mới.');
      return;
    }
    if (!targetScore || !selectedExamTypeId) {
      toast.warn('Nhập điểm mục tiêu trước.');
      return;
    }

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
        onSuccess: () => {
          toast.success('Đã lưu mục tiêu! Sang tab "Lập kế hoạch" để sinh lộ trình.');
          // Card "Mục tiêu hiện tại" nằm đầu trang — kéo lên cho user thấy ngay.
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        onError: () => toast.error('Lỗi khi lưu mục tiêu.'),
      },
    );
  };

  const handleDelete = () => {
    if (!selectedExamTypeId) return;

    deleteMutation.mutate(selectedExamTypeId, {
      onSuccess: () => {
        setTargetScore('');
        setCustomParts({});
        toast.success('Đã xóa mục tiêu.');
      },
      onError: () => toast.error('Lỗi khi xóa mục tiêu.'),
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
      <TargetPlanTabs active="target" examTypeId={selectedExamTypeId} />
      <div className={planCx('headerBar')}>
        <h2 className={classNames(planCx('title'), cx('pageTitle'))}>Mục tiêu của tôi</h2>
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
            <ButtonPrime
              as="link"
              to={
                selectedExamTypeId
                  ? `/learning-plans/generate?examTypeId=${selectedExamTypeId}`
                  : '/learning-plans/generate'
              }
              variant="primary"
              size="sm"
            >
              Sinh lộ trình vượt ải
            </ButtonPrime>
          </div>
        </section>
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
            </div>
          )}

          {targetScore && partRequirements.length > 0 && (
            <div className={cx('partSection')}>
              <div className={cx('partSectionTitle')}>
                Yêu cầu từng phần thi
              </div>
              <div className={cx('partSectionBody')}>
                <p className={cx('partSectionHint')}>
                  {matchedMilestone
                    ? 'Giá trị từ cấu hình quản trị viên. Hãy sửa lại nếu không phù hợp.'
                    : `Chia đều ${evenPctForScore(targetScore)}%. Hãy sửa lại nếu không phù hợp.`}
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
                          Đặt lại
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
              <ButtonPrime
                variant="primary"
                size="lg"
                onClick={handleSave}
                disabled={loading || hasSavedTarget}
              >
                {loading ? 'Đang lưu...' : 'Lưu mục tiêu'}
              </ButtonPrime>
              {hasSavedTarget && (
                <ButtonPrime
                  variant="dangerGhost"
                  size="lg"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  Xóa mục tiêu
                </ButtonPrime>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

export default UserTargetPage;
