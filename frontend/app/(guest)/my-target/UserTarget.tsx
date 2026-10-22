'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { FiArrowRight, FiChevronRight } from 'react-icons/fi';
import { IoFlagOutline } from 'react-icons/io5';
import classNames from 'classnames';
import classNamesBind from 'classnames/bind';
import TargetPlanTabs from '@/app/features/my-target/TargetPlanTabs/TargetPlanTabs';
import ExamPillPicker from '@/app/features/my-target/ExamPillPicker/ExamPillPicker';
import ExamHeading from '@/app/features/my-target/ExamHeading/ExamHeading';
import { useSearchParamsState } from '@/app/hooks/useSearchParamsState';
import {
  examTypeIdFromParams,
  setExamParam,
  useNormalizeExamParam,
  withExam,
} from '@/app/features/exam-types/hooks/useExamParam';
import planStyles from '@/app/assets/styles/diagnostic/PersonalizedPlan.module.scss';
import uiStyles from '@/app/assets/styles/FlatUi.module.scss';
import styles from './UserTarget.module.scss';
import { sortPartsByLookup } from '@/app/features/exam-types/partOrder';
import useMilestoneScoring from '@/app/features/my-target/hooks/useMilestoneScoring';
import { useAuth } from '@/app/hooks/useAuth';
import { buildLoginUrl } from '@/app/features/auth/authRedirect';
import type { MilestoneResponse } from '@/app/types';
import { useCurrentUserTarget, useUserTargetData } from './_hooks/useUserTargetData';
import {
  useSaveUserTarget,
  useDeleteUserTarget,
} from './_hooks/useUserTargetMutations';

const cx = classNamesBind.bind(styles);
const planCx = classNamesBind.bind(planStyles);
const ui = classNamesBind.bind(uiStyles);

function UserTarget() {
  const [searchParams, setSearchParams] = useSearchParamsState();
  const router = useRouter();
  const [selectedExamTypeId, setSelectedExamTypeId] = useState('');
  const [targetScore, setTargetScore] = useState('');
  const [customParts, setCustomParts] = useState<Record<string, number>>({});
  // Khách vẫn xem và thử chọn mức điểm được, chỉ khi lưu mới bị đưa sang đăng nhập.
  const { isAuthenticated } = useAuth();

  const { target, isError: targetIsError } = useCurrentUserTarget(
    selectedExamTypeId,
    isAuthenticated,
  );
  const currentTarget = target?.hasTarget ? target : null;

  const { examTypes, examParts, skills, scoringConversions, milestones } =
    useUserTargetData(selectedExamTypeId);

  const saveMutation = useSaveUserTarget();
  const deleteMutation = useDeleteUserTarget();
  const loading = saveMutation.isPending || deleteMutation.isPending;

  useNormalizeExamParam(examTypes);

  // Kỳ thi trên URL đổi (hoặc slug vừa dịch được ra id) thì chọn theo URL.
  const examTypeIdFromQuery = examTypeIdFromParams(searchParams, examTypes);
  const [prevExamTypeIdFromQuery, setPrevExamTypeIdFromQuery] = useState('');
  if (examTypeIdFromQuery !== prevExamTypeIdFromQuery) {
    setPrevExamTypeIdFromQuery(examTypeIdFromQuery);
    if (examTypeIdFromQuery) setSelectedExamTypeId(examTypeIdFromQuery);
  }

  // Được điều hướng tới đây chỉ để đặt mục tiêu thì giữ đúng bước tiếp theo của luồng cũ.
  const nextAfterTarget = useMemo(() => {
    const next = searchParams.get('next');
    if (next && next.startsWith('/') && !next.startsWith('//')) return next;
    return withExam('/learning-plans/generate', selectedExamTypeId, examTypes);
  }, [searchParams, selectedExamTypeId, examTypes]);

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
    // ScoringConversionResponse để các trường optional, hook chấm điểm khai báo bắt buộc.
    scoringConversions,
    selectedExamTypeId,
  });

  // Đổi kỳ thi hoặc mục tiêu đã lưu vừa tải xong thì điền lại form theo mục tiêu đó.
  const [syncedTarget, setSyncedTarget] = useState<{
    examTypeId: string;
    target: typeof target;
    isError: boolean;
  } | null>(null);
  if (
    !syncedTarget ||
    syncedTarget.examTypeId !== selectedExamTypeId ||
    syncedTarget.target !== target ||
    syncedTarget.isError !== targetIsError
  ) {
    setSyncedTarget({ examTypeId: selectedExamTypeId, target, isError: targetIsError });
    if (!selectedExamTypeId) {
      setTargetScore('');
      setCustomParts({});
    } else if (target?.hasTarget) {
      setTargetScore(String(target.targetScore || ''));
      const cp: Record<string, number> = {};
      (target.partRequirements || []).forEach((p) => {
        if (p.requiredPercentage != null) cp[p.examPartId] = p.requiredPercentage;
      });
      setCustomParts(cp);
    } else if (target || targetIsError) {
      setTargetScore('');
      setCustomParts({});
    }
  }

  // Người mới chưa biết đặt bao nhiêu: chọn sẵn mức gợi ý ở giữa, mỗi kỳ thi chỉ gợi ý một lần.
  const [suggestedFor, setSuggestedFor] = useState('');
  if (
    selectedExamTypeId &&
    suggestedFor !== selectedExamTypeId &&
    !(isAuthenticated && (!target || target.hasTarget)) &&
    !targetScore &&
    milestones.length > 0
  ) {
    const sorted = milestones
      .filter((m) => !m.examTypeId || m.examTypeId === selectedExamTypeId)
      .sort((a, b) => (a.milestoneScore ?? 0) - (b.milestoneScore ?? 0));
    const middle = sorted[Math.floor((sorted.length - 1) / 2)];
    if (middle?.milestoneScore != null) {
      setTargetScore(String(middle.milestoneScore));
      setSuggestedFor(selectedExamTypeId);
    }
  }

  const matchedMilestone = useMemo<MilestoneResponse | null>(() => {
    if (!targetScore) return null;
    return milestones.find((m) => m.milestoneScore === Number(targetScore)) || null;
  }, [targetScore, milestones]);

  const filteredParts = useMemo(
    () => examParts.filter((p) => p.examTypeId === selectedExamTypeId),
    [examParts, selectedExamTypeId],
  );
  const partRequirements = useMemo(() => {
    if (!targetScore || filteredParts.length === 0) return [];
    if (matchedMilestone && matchedMilestone.partRequirements) {
      const mapped = matchedMilestone.partRequirements.map((pr) => ({
        examPartId: pr.examPartId as string,
        requiredPercentage: pr.requiredPercentage ?? 0,
      }));
      return sortPartsByLookup(mapped, filteredParts);
    }
    const evenPct = evenPctForScore(targetScore);
    return filteredParts.map((p) => ({
      examPartId: p.examPartId,
      requiredPercentage: evenPct,
    }));
  }, [targetScore, matchedMilestone, filteredParts, evenPctForScore]);

  const handleSave = () => {
    if (!targetScore || !selectedExamTypeId) {
      toast.warn('Nhập điểm mục tiêu trước.');
      return;
    }
    if (!isAuthenticated) {
      // Giữ cả next để đăng nhập xong quay lại đây, lưu xong vẫn đi tiếp đúng luồng.
      const backParams = setExamParam(searchParams, selectedExamTypeId, examTypes);
      router.push(
        buildLoginUrl(`/my-target?${backParams.toString()}`, {
          flash: 'Bạn cần đăng nhập để lưu mục tiêu!',
        }),
      );
      return;
    }
    const isUpdate = hasSavedTarget;

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
          if (isUpdate) {
            toast.success(
              'Đã cập nhật mục tiêu. Lộ trình đang chạy sẽ hiện nút "Cập nhật theo mục tiêu mới"  bấm là xong, không cần thi lại.',
            );
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
          }
          // Mục tiêu đầu tiên: đi thẳng sang bước sinh lộ trình thay vì bắt người dùng tự tìm tab.
          toast.success('Đã lưu mục tiêu! Giờ cùng sinh lộ trình học nhé.');
          router.push(nextAfterTarget);
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

  const handlePartChange = (examPartId: string, value: number) => {
    setCustomParts((prev) => ({ ...prev, [examPartId]: value }));
  };

  const handleResetPart = (examPartId: string) => {
    setCustomParts((prev) => {
      const next = { ...prev };
      delete next[examPartId];
      return next;
    });
  };

  const hasSavedTarget = Boolean(currentTarget?.hasTarget);

  const activeExam = examTypes.find((exam) => exam.examTypeId === selectedExamTypeId);

  const selectExam = (examTypeId: string) => {
    setSelectedExamTypeId(examTypeId);
    setTargetScore('');
    setCustomParts({});
    // Đưa kỳ thi lên URL để F5 / copy link vẫn đúng kỳ thi đang chọn.
    setSearchParams((prev) => setExamParam(prev, examTypeId, examTypes), { replace: true });
  };

  const pctOf = (pr: { examPartId: string; requiredPercentage: number }) =>
    customParts[pr.examPartId] !== undefined
      ? Number(customParts[pr.examPartId])
      : pr.requiredPercentage;

  const estimate = (() => {
    if (!targetScore || partRequirements.length === 0) return null;
    const partsConfig: Record<string, number> = {};
    partRequirements.forEach((pr) => {
      partsConfig[pr.examPartId] = pctOf(pr);
    });
    return estimateScore(partsConfig, selectedExamTypeId);
  })();
  const estimateDiff = estimate ? estimate.totalScore - Number(targetScore) : 0;

  const renderSummary = () => (
    <aside className={classNames(ui('card'), cx('summary'))} aria-label="Tóm tắt mục tiêu">
      <div className={cx('summaryTop')}>
        <span className={ui('eyebrow')}>Tóm tắt</span>
        <span className={ui('pill', { pillSuccess: hasSavedTarget })}>
          {hasSavedTarget ? `Đã lưu · ${currentTarget?.targetScore} điểm` : 'Chưa lưu'}
        </span>
      </div>

      <div className={cx('scoreStats')}>
        <div className={cx('scoreStat')}>
          <span className={cx('statLabel')}>Mục tiêu</span>
          <span className={cx('statValue')}>{targetScore || '—'}</span>
        </div>
        <div className={cx('scoreStat')}>
          <span className={cx('statLabel')}>Ước tính</span>
          <span className={cx('statValue')}>{estimate?.totalScore ?? '—'}</span>
          {estimate && (
            <span className={cx('statDiff', estimateDiff >= 0 ? 'ok' : 'short')}>
              {estimateDiff > 0 ? '+' : ''}
              {estimateDiff}
            </span>
          )}
        </div>
      </div>

      {partRequirements.length > 0 && (
        <ul className={cx('partBars')}>
          {partRequirements.map((pr) => {
            const pct = pctOf(pr);
            const total = getPartTotal(pr.examPartId);
            return (
              <li key={pr.examPartId}>
                <div className={cx('partBarHead')}>
                  <span className={cx('partBarName')}>{getPartName(pr.examPartId)}</span>
                  <span className={cx('partBarValue')}>
                    {percentToNum(pct, total)}/{total} · {pct}%
                  </span>
                </div>
                <div className={cx('partBarTrack')}>
                  <span style={{ width: `${Math.min(Math.max(pct, 0), 100)}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {estimate && (
        <p className={cx('estimateDetail')}>
          {estimate.scaled
            ? `${formatEstimateDetail(estimate)}, cần đạt ≥ ${targetScore}`
            : formatEstimateDetail(estimate)}
        </p>
      )}

      {targetScore && hasSavedTarget && (
        <p className={cx('overwriteNote')}>Lưu lại sẽ ghi đè mục tiêu hiện tại.</p>
      )}

      <div className={cx('summaryActions')}>
        <button
          type="button"
          className={ui('btnPrimary')}
          onClick={handleSave}
          disabled={loading || !targetScore}
        >
          {loading ? 'Đang lưu...' : hasSavedTarget ? 'Cập nhật mục tiêu' : 'Lưu mục tiêu'}
        </button>
        {hasSavedTarget && (
          <Link href={nextAfterTarget} className={ui('btnSecondary')}>
            Sinh lộ trình vượt ải
            <FiArrowRight aria-hidden="true" />
          </Link>
        )}
        {hasSavedTarget && (
          <button
            type="button"
            className={classNames(ui('dangerText'), cx('deleteBtn'))}
            onClick={handleDelete}
            disabled={loading}
          >
            Xóa mục tiêu
          </button>
        )}
      </div>
    </aside>
  );

  return (
    <div className={classNames(planCx('wrapper'), ui('pageRoot'))}>
      <TargetPlanTabs active="target" examTypeId={selectedExamTypeId} examTypes={examTypes} />
      <header className={ui('pageHead')}>
        <h1 className={ui('pageTitle')}>Mục tiêu của tôi</h1>
        <p className={ui('pageSubtitle')}>
          Chọn kỳ thi và mức điểm bạn muốn đạt. WinDe dựa vào đó để biết mỗi phần cần luyện tới đâu
          rồi lập lộ trình cho bạn.
        </p>
      </header>

      <ExamPillPicker
        className={ui('pickerRow')}
        examTypes={examTypes}
        value={selectedExamTypeId}
        onChange={selectExam}
      />

      {!selectedExamTypeId ? (
        <div className={ui('empty')}>
          <IoFlagOutline className={ui('emptyIcon')} aria-hidden="true" />
          <h2>Chọn kỳ thi để đặt mục tiêu</h2>
          <p>Bấm vào một kỳ thi ở trên để xem mức điểm gợi ý.</p>
        </div>
      ) : (
        <div className={cx('layout')}>
          <section className={classNames(ui('card'), cx('setupCard'))} aria-labelledby="target-exam-title">
            <ExamHeading exam={activeExam} id="target-exam-title" className={cx('examHead')} />

            <div className={cx('block')}>
              <span className={classNames(ui('eyebrow'), cx('blockLabel'))}>Điểm mục tiêu</span>
              {milestones.length > 0 && (
                <div className={cx('chips')} role="group" aria-label="Mức điểm gợi ý">
                  {milestones.map((m) => (
                    <button
                      key={m.examTargetMilestoneId}
                      type="button"
                      title={m.description || undefined}
                      aria-pressed={Number(targetScore) === m.milestoneScore}
                      className={cx('chip', { active: Number(targetScore) === m.milestoneScore })}
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
                <label className={cx('scoreInput')}>
                  <span className="visually-hidden">Điểm mục tiêu</span>
                  <input
                    type="number"
                    placeholder={isScaled ? 'VD: 700' : 'VD: 450'}
                    value={targetScore}
                    min={0}
                    max={maxTargetScore}
                    onChange={(e) => {
                      setTargetScore(e.target.value);
                      setCustomParts({});
                    }}
                  />
                  <span className={cx('scoreUnit')}>/ {maxTargetScore}</span>
                </label>
                {targetScore && matchedMilestone && (
                  <span className={cx('milestoneHint')}>
                    Mức {matchedMilestone.milestoneScore}
                    {matchedMilestone.description && `: ${matchedMilestone.description}`}
                  </span>
                )}
                {targetScore && !matchedMilestone && (
                  <span className={cx('milestoneHint')}>
                    Điểm tự chọn: mỗi phần thi cần đúng khoảng {evenPctForScore(targetScore)}%
                  </span>
                )}
              </div>
              {suggestedFor === selectedExamTypeId && !hasSavedTarget && (
                <p className={cx('hint')}>
                  Chưa biết đặt bao nhiêu? WinDe đã chọn sẵn một mức vừa sức, sau này đổi lúc nào cũng được.
                </p>
              )}
            </div>

            {targetScore && partRequirements.length > 0 && (
              <details className={cx('advanced')} open={Object.keys(customParts).length > 0}>
                <summary className={cx('advancedTitle')}>
                  <FiChevronRight className={cx('chevron')} aria-hidden="true" />
                  Nâng cao: số câu cần đúng ở từng phần thi
                  <span className={cx('optional')}>không bắt buộc</span>
                </summary>
                <p className={cx('hint')}>
                  {matchedMilestone
                    ? 'Đã điền sẵn theo mức điểm bạn chọn. Chỉ sửa nếu bạn muốn dồn sức vào phần nào đó.'
                    : `Đã điền sẵn: mỗi phần cần đúng khoảng ${evenPctForScore(targetScore)}%. Chỉ sửa nếu bạn muốn dồn sức vào phần nào đó.`}
                </p>

                <div className={cx('partList')}>
                  {partRequirements.map((pr) => {
                    const isCustom = customParts[pr.examPartId] !== undefined;
                    const currentPct = pctOf(pr);
                    const total = getPartTotal(pr.examPartId);
                    const numCorrect = percentToNum(currentPct, total);

                    return (
                      <div key={pr.examPartId} className={cx('partRow')}>
                        <span className={cx('partName')}>
                          {getPartName(pr.examPartId)}
                          <span className={cx('partTotal')}>{total} câu</span>
                        </span>
                        <div className={cx('partInputs')}>
                          <label className={cx('partField', { custom: isCustom })}>
                            <input
                              type="number"
                              min={0}
                              max={total}
                              value={numCorrect}
                              onChange={(e) => {
                                const newPct = numToPercent(Number(e.target.value), total);
                                handlePartChange(pr.examPartId, newPct);
                              }}
                            />
                            <span>câu</span>
                          </label>
                          <label className={cx('partField', { custom: isCustom })}>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={currentPct}
                              onChange={(e) => {
                                handlePartChange(pr.examPartId, Number(e.target.value));
                              }}
                            />
                            <span>%</span>
                          </label>
                          <button
                            type="button"
                            className={classNames(ui('textBtn'), cx('resetBtn', { hidden: !isCustom }))}
                            onClick={() => handleResetPart(pr.examPartId)}
                            tabIndex={isCustom ? undefined : -1}
                            aria-hidden={!isCustom}
                          >
                            Đặt lại
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </details>
            )}
          </section>

          {renderSummary()}
        </div>
      )}
    </div>
  );
}

export default UserTarget;
