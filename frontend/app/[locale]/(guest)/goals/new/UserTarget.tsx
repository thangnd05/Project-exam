'use client';

import { useRouter } from '@/app/i18n/navigation';
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'react-toastify';
import { ArrowRight, ChevronRight, Flag } from 'lucide-react';
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
import { buildLoginUrl, safeRedirect } from '@/app/utils/redirect';
import type { MilestoneResponse } from '@/app/types';
import { useCurrentUserTarget, useUserTargetData } from './_hooks/useUserTargetData';
import PageHeader from '@/app/components/PageHeader/PageHeader';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import {
  useSaveUserTarget,
  useDeleteUserTarget,
} from './_hooks/useUserTargetMutations';

const cx = classNamesBind.bind(styles);
const planCx = classNamesBind.bind(planStyles);
const ui = classNamesBind.bind(uiStyles);

function UserTarget() {
  const t = useTranslations('MyTarget');
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
  // URL không chỉ kỳ thi nào: chọn sẵn kỳ thi đầu tiên thay vì để trang trống.
  if (!selectedExamTypeId && !examTypeIdFromQuery && examTypes.length > 0) {
    setSelectedExamTypeId(examTypes[0].examTypeId);
  }

  // Được điều hướng tới đây chỉ để đặt mục tiêu thì giữ đúng bước tiếp theo của luồng cũ.
  const nextAfterTarget = useMemo(() => {
    return safeRedirect(
      searchParams.get('next'),
      withExam('/learning-paths/create', selectedExamTypeId, examTypes),
    );
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
      toast.warning(t('setTarget.toast.enterScoreFirst'));
      return;
    }
    if (!isAuthenticated) {
      // Giữ cả next để đăng nhập xong quay lại đây, lưu xong vẫn đi tiếp đúng luồng.
      const backParams = setExamParam(searchParams, selectedExamTypeId, examTypes);
      router.push(
        buildLoginUrl(`/goals/new?${backParams.toString()}`, {
          flash: t('setTarget.toast.loginRequired'),
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
            toast.success(t('setTarget.toast.updated'));
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
          }
          // Mục tiêu đầu tiên: đi thẳng sang bước sinh lộ trình thay vì bắt người dùng tự tìm tab.
          toast.success(t('setTarget.toast.saved'));
          router.push(nextAfterTarget);
        },
        onError: () => toast.error(t('setTarget.toast.saveError')),
      },
    );
  };

  const handleDelete = () => {
    if (!selectedExamTypeId) return;

    deleteMutation.mutate(selectedExamTypeId, {
      onSuccess: () => {
        setTargetScore('');
        setCustomParts({});
        toast.success(t('setTarget.toast.deleted'));
      },
      onError: () => toast.error(t('setTarget.toast.deleteError')),
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
    <aside className={classNames(ui('card'), cx('summary'))} aria-label={t('setTarget.summary.ariaLabel')}>
      <div className={cx('summaryTop')}>
        <span className={ui('eyebrow')}>{t('setTarget.summary.eyebrow')}</span>
        <span className={ui('pill', { pillSuccess: hasSavedTarget })}>
          {hasSavedTarget
            ? t('setTarget.summary.saved', { score: currentTarget?.targetScore ?? 0 })
            : t('setTarget.summary.notSaved')}
        </span>
      </div>

      <div className={cx('scoreStats')}>
        <div className={cx('scoreStat')}>
          <span className={cx('statLabel')}>{t('setTarget.summary.target')}</span>
          <span className={cx('statValue')}>{targetScore || '—'}</span>
        </div>
        <div className={cx('scoreStat')}>
          <span className={cx('statLabel')}>{t('setTarget.summary.estimate')}</span>
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
            ? t('setTarget.summary.estimateNeed', {
                detail: formatEstimateDetail(estimate),
                score: targetScore,
              })
            : formatEstimateDetail(estimate)}
        </p>
      )}

      {targetScore && hasSavedTarget && (
        <p className={cx('overwriteNote')}>{t('setTarget.summary.overwriteNote')}</p>
      )}

      <div className={cx('summaryActions')}>
        <ButtonPrime
          variant="ink"
          type="button"
          onClick={handleSave}
          disabled={loading || !targetScore}
        >
          {loading
            ? t('setTarget.summary.saving')
            : hasSavedTarget
              ? t('setTarget.summary.update')
              : t('setTarget.summary.save')}
        </ButtonPrime>
        {hasSavedTarget && (
          <ButtonPrime as="link" variant="soft" href={nextAfterTarget}>
            {t('setTarget.summary.generatePlan')}
            <ArrowRight size="1em" aria-hidden="true" />
          </ButtonPrime>
        )}
        {hasSavedTarget && (
          <ButtonPrime
            variant="dangerGhost"
            size="sm"
            className={cx('deleteBtn')}
            onClick={handleDelete}
            disabled={loading}
          >
            {t('setTarget.summary.delete')}
          </ButtonPrime>
        )}
      </div>
    </aside>
  );

  return (
    <div className={classNames(planCx('wrapper'), ui('pageRoot'))}>
      <TargetPlanTabs active="target" examTypeId={selectedExamTypeId} examTypes={examTypes} />
      <PageHeader title={t('setTarget.title')} description={t('setTarget.subtitle')} />

      <ExamPillPicker
        className={ui('pickerRow')}
        examTypes={examTypes}
        value={selectedExamTypeId}
        onChange={selectExam}
      />

      {!selectedExamTypeId ? (
        <div className={ui('empty')}>
          <Flag size="1em" className={ui('emptyIcon')} aria-hidden="true" />
          <h2>{t('setTarget.empty.title')}</h2>
          <p>{t('setTarget.empty.description')}</p>
        </div>
      ) : (
        <div className={cx('layout')}>
          <section className={classNames(ui('card'), cx('setupCard'))} aria-labelledby="target-exam-title">
            <ExamHeading exam={activeExam} id="target-exam-title" className={cx('examHead')} />

            <div className={cx('block')}>
              <span className={classNames(ui('eyebrow'), cx('blockLabel'))}>{t('setTarget.scoreLabel')}</span>
              {milestones.length > 0 && (
                <div className={cx('chips')} role="group" aria-label={t('setTarget.milestonesAriaLabel')}>
                  {milestones.map((m) => (
                    <ButtonPrime
                      key={m.examTargetMilestoneId}
                      variant={Number(targetScore) === m.milestoneScore ? 'ink' : 'outline'}
                      size="sm"
                      className={cx('chip')}
                      title={m.description || undefined}
                      aria-pressed={Number(targetScore) === m.milestoneScore}
                      onClick={() => {
                        setTargetScore(String(m.milestoneScore));
                        setCustomParts({});
                      }}
                    >
                      {m.milestoneScore}
                    </ButtonPrime>
                  ))}
                </div>
              )}
              <div className={cx('scoreInputRow')}>
                <label className={cx('scoreInput')}>
                  <span className="visually-hidden">{t('setTarget.scoreLabel')}</span>
                  <input
                    type="number"
                    placeholder={isScaled ? t('setTarget.placeholderScaled') : t('setTarget.placeholder')}
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
                    {t('setTarget.milestoneHint', { score: matchedMilestone.milestoneScore ?? '' })}
                    {matchedMilestone.description && `: ${matchedMilestone.description}`}
                  </span>
                )}
                {targetScore && !matchedMilestone && (
                  <span className={cx('milestoneHint')}>
                    {t('setTarget.customHint', { pct: evenPctForScore(targetScore) })}
                  </span>
                )}
              </div>
              {suggestedFor === selectedExamTypeId && !hasSavedTarget && (
                <p className={cx('hint')}>
                  {t('setTarget.suggestedHint')}
                </p>
              )}
            </div>

            {targetScore && partRequirements.length > 0 && (
              <details className={cx('advanced')} open={Object.keys(customParts).length > 0}>
                <summary className={cx('advancedTitle')}>
                  <ChevronRight size="1em" className={cx('chevron')} aria-hidden="true" />
                  {t('setTarget.advanced.title')}
                  <span className={cx('optional')}>{t('setTarget.advanced.optional')}</span>
                </summary>
                <p className={cx('hint')}>
                  {matchedMilestone
                    ? t('setTarget.advanced.milestoneHint')
                    : t('setTarget.advanced.evenHint', { pct: evenPctForScore(targetScore) })}
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
                          <span className={cx('partTotal')}>{t('setTarget.advanced.questionCount', { count: total })}</span>
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
                            <span>{t('setTarget.advanced.questionUnit')}</span>
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
                          <ButtonPrime
                            variant="link"
                            size="sm"
                            className={cx('resetBtn', { hidden: !isCustom })}
                            onClick={() => handleResetPart(pr.examPartId)}
                            tabIndex={isCustom ? undefined : -1}
                            aria-hidden={!isCustom}
                          >
                            {t('setTarget.advanced.reset')}
                          </ButtonPrime>
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
