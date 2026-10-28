'use client';

import { useParams } from 'next/navigation';
import { useRouter } from '@/app/i18n/navigation';
import { useMemo } from "react";
import { Container } from "react-bootstrap";
import { toast } from "react-toastify";
import classNames from "classnames/bind";
import { useTranslations } from "next-intl";
import { CircleCheck, House, ChartNoAxesColumnIncreasing, Clock, GraduationCap, Lock, Calendar, CircleAlert } from "lucide-react";

import { useAuth } from "@/app/hooks/useAuth";
import { useMounted } from "@/app/hooks/useMounted";
import { getGuestSessionId, guestHeaders } from "@/app/utils/guestSession";
import { isBeginnerLevel } from "@/app/features/learning-plans/learnerLevel";
import { getScoreScale } from "@/app/features/exam-types/scoreScale";
import { buildPlanFromTestUrl } from "@/app/[locale]/(guest)/tests/result/[userTestId]/_lib/planFromTest";
import { useTestResult } from "./_hooks/useTestResult";
import { useTestEvaluationPrompt } from "./_hooks/useTestEvaluationPrompt";
import ButtonPrime from "@/app/components/Button/ButtonPrime";
import EmptyState from "@/app/components/EmptyState/EmptyState";
import CertificateBanner from "./_components/CertificateBanner";
import GuestSaveBanner from "./_components/GuestSaveBanner";
import ReadinessGauge from "./_components/ReadinessGauge";
import RecoveryPlan from "./_components/RecoveryPlan";
import TagAnalysisTable from "./_components/TagAnalysisTable";
import TestEvaluationModal from "./_components/TestEvaluationModal";
import styles from "./TestResult.module.scss";
import { buildTestPath } from '@/app/configs/Routes';
import Loading from '@/app/components/Loading/Loading';

const cx = classNames.bind(styles);

const TestResult = () => {
  const { userTestId } = useParams<{ userTestId: string }>();
  const router = useRouter();
  const t = useTranslations("TestTaking.result");
  const tCommon = useTranslations("Common");
  const { isAuthenticated, loading: authLoading } = useAuth();
  const isGuest = !authLoading && !isAuthenticated;
  const guestCfg = useMemo(
    () => (isGuest ? { headers: guestHeaders(getGuestSessionId()) } : {}),
    [isGuest],
  );

  const { result, testId, testTitle, enhanced, canReview, practicePartIds, isLoading, isError } =
    useTestResult(userTestId, isGuest, guestCfg, !authLoading);

  const isPractice = practicePartIds !== null;

  // Chỉ hỏi đánh giá đề khi user đã đăng nhập và làm full (không phải luyện theo phần).
  const evaluationPrompt = useTestEvaluationPrompt({
    userTestId,
    testId,
    enabled: !authLoading && isAuthenticated && !isLoading && !isError && !isPractice,
  });
  const practiceParts = useMemo(
    () => (isPractice
      ? (enhanced?.partBreakdown ?? []).filter((p) => practicePartIds!.includes(p.examPartId))
      : null),
    [isPractice, enhanced, practicePartIds],
  );

  const loading = authLoading || isLoading;
  const error = isError ? t("loadError") : "";

  const scoreScale = getScoreScale(enhanced);

  const isQuickChallenge = enhanced?.examCategoryCode === 'QUICK_CHALLENGE';
  // Trình độ tự khai nằm ở localStorage: chỉ đọc sau khi mount để không lệch hydration.
  const mounted = useMounted();
  const isBeginner = mounted && Boolean(isQuickChallenge) && isBeginnerLevel(enhanced?.examTypeId);

  const formatTime = (start?: string, end?: string) => {
    if (!start || !end) return "--:--";

    const diff = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 1000);
    const m = Math.floor(diff / 60);
    const s = diff % 60;

    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleShowDetail = () => {
    if (!canReview) {
      toast.warning(t("reviewLocked"));
      return;
    }
    router.push(`/tests/result/${userTestId}/review`);
  };

  const handlePlanFromTest = () => {
    router.push(buildPlanFromTestUrl({
      userTestId,
      examTypeId: enhanced?.examTypeId,
      hasTarget: enhanced ? Boolean(enhanced.hasTarget) : undefined,
      isGuest,
    }));
  };

  if (loading)
    return (
      <div className={cx("wrapper")}>
        <Loading label={t("loading")} />
      </div>
    );

  if (error)
    return (
      <div className={cx("wrapper")}>
        <Container>
          <EmptyState
            tone="danger"
            icon={CircleAlert}
            title={tCommon("loadErrorTitle")}
            description={error}
            action={
              <ButtonPrime variant="primary" onClick={() => router.push("/")}>
                {t("backHome")}
              </ButtonPrime>
            }
          />
        </Container>
      </div>
    );

  return (
    <div className={cx("wrapper")}>
      <Container>

        {isGuest && <GuestSaveBanner userTestId={userTestId} examTypeId={enhanced?.examTypeId} />}
        <CertificateBanner userTestId={userTestId} enabled={!authLoading && isAuthenticated} />

        <div className={cx("result-layout")}>

          <div className={cx("result-card")}>
            <h1>{isBeginner ? t("titleBeginner") : t("title")}</h1>

            <div className={cx("result-body")}>
              <div className={cx("score-display")}>
                {isQuickChallenge ? (
                  <>
                    <span className={cx("label")}>
                      {isBeginner ? t("startingScore") : t("accuracy")}
                    </span>
                    <div className={cx("points")}>
                      {enhanced?.percentage ?? 0}%
                    </div>
                  </>
                ) : (
                  <>
                    <span className={cx("label")}>{t("score")}</span>
                    <div className={cx("points")}>
                      {Math.round(Number(result?.totalScore ?? 0))}
                    </div>
                    {scoreScale.scaled && (
                      <span className={cx("scale-hint")}>
                        {t("scale", { min: scoreScale.min, max: scoreScale.max })}
                      </span>
                    )}
                  </>
                )}
              </div>

              <div className={cx("stats-grid")}>
                <div className={cx("stat-item", "correct")}>
                  <CircleCheck size={24} />
                  <div className={cx("stat-text")}>
                    <span className={cx("stat-val")}>{result?.correct || 0}</span>
                    <span className={cx("stat-label")}>{t("stats.correct")}</span>
                  </div>
                </div>

                <div className={cx("stat-item", "wrong")}>
                  <ChartNoAxesColumnIncreasing size={24} />
                  <div className={cx("stat-text")}>
                    <span className={cx("stat-val")}>{result?.wrong || 0}</span>
                    <span className={cx("stat-label")}>{t("stats.wrong")}</span>
                  </div>
                </div>

                <div className={cx("stat-item", "total")}>
                  <GraduationCap size={24} />
                  <div className={cx("stat-text")}>
                    <span className={cx("stat-val")}>{result?.total || 0}</span>
                    <span className={cx("stat-label")}>{t("stats.total")}</span>
                  </div>
                </div>

                <div className={cx("stat-item")}>
                  <Clock size={24} />
                  <div className={cx("stat-text")}>
                    <span className={cx("stat-val")}>
                      {formatTime(result?.startedAt, result?.finishedAt)}
                    </span>
                    <span className={cx("stat-label")}>{t("stats.time")}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={cx("actions")}>
              {!canReview && (
                <div className={cx("lock-message")}>
                  <Lock size="1em" />
                  <span>
                    {t("answersLocked")}
                  </span>
                </div>
              )}

              <ButtonPrime
                variant="outline"
                className={cx({ "is-locked": !canReview })}
                onClick={handleShowDetail}
              >
                {!canReview ? <Lock size="1em" /> : <ChartNoAxesColumnIncreasing size="1em" />}
                {t("viewAnswers")}
              </ButtonPrime>

              {!isGuest && testId && (
                <ButtonPrime
                  variant="ghost"
                  onClick={() => router.push(buildTestPath({ testId }, 'history'))}
                >
                  <GraduationCap size="1em" /> {t("history")}
                </ButtonPrime>
              )}

              <ButtonPrime variant="ghost" onClick={() => router.push("/")}>
                <House size="1em" /> {t("home")}
              </ButtonPrime>

              <ButtonPrime variant="primary" onClick={handlePlanFromTest}>
                <Calendar size="1em" /> {t("planFromTest")}
              </ButtonPrime>
            </div>
          </div>

          {enhanced && (
            <div className={cx("diagnosis-card")}>
              <ReadinessGauge enhanced={enhanced} isPractice={isPractice} />

              <div className={cx("diagnosis-side")}>
                {enhanced.percentile != null && (
                  <div className={cx("percentile-box")}>
                    {t.rich("percentile", {
                      percentile: enhanced.percentile,
                      strong: (chunks) => <strong>{chunks}</strong>,
                    })}
                  </div>
                )}

                <RecoveryPlan
                  userTestId={userTestId}
                  examTypeId={enhanced.examTypeId}
                  hasTarget={enhanced.hasTarget}
                  isTargetMet={enhanced.isTargetMet}
                  readinessScore={enhanced.readinessScore}
                  readinessLevel={enhanced.readinessLevel}
                  isGuest={isGuest}
                  practiceParts={practiceParts}
                />
              </div>
            </div>
          )}

        </div>

        {enhanced && <TagAnalysisTable enhanced={enhanced} userTestId={userTestId} />}
      </Container>

      <TestEvaluationModal
        show={evaluationPrompt.show}
        testTitle={testTitle}
        onDismiss={evaluationPrompt.dismiss}
        onAlreadyEvaluated={evaluationPrompt.markEvaluated}
        submitMutation={evaluationPrompt.submitMutation}
      />
    </div>
  );
};

export default TestResult;
