'use client';

import { useParams, usePathname, useRouter } from 'next/navigation';
import { useContext, useMemo } from "react";
import { Container, Spinner, Alert } from "react-bootstrap";
import { toast } from "react-toastify";
import classNames from "classnames/bind";
import {
  IoCheckmarkCircle,
  IoHomeOutline,
  IoStatsChartOutline,
  IoTimeOutline,
  IoSchoolOutline,
  IoLockClosedOutline,
} from "react-icons/io5";

import { AuthContext } from "@/app/contexts/AuthContext";
import { getGuestSessionId, guestHeaders } from "@/app/utils/guestSession";
import { useTestResult } from "@/app/features/tests/exam/exam-types/detail/result/hooks/useTestResult";
import ButtonPrime from "@/app/components/Button/ButtonPrime";
import CertificateBanner from "./components/CertificateBanner";
import ReadinessGauge from "./components/ReadinessGauge";
import RecoveryPlan from "./components/RecoveryPlan";
import TagAnalysisTable from "./components/TagAnalysisTable";
import styles from "./TestResultPage.module.scss";

const cx = classNames.bind(styles);

const TestResultPage = () => {
  const { userTestId } = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useContext(AuthContext);
  const isGuest = !authLoading && !isAuthenticated;
  const guestCfg = useMemo(
    () => (isGuest ? { headers: guestHeaders(getGuestSessionId()) } : {}),
    [isGuest],
  );

  const { result, testId, enhanced, canReview, isLoading, isError } =
    useTestResult(userTestId, isGuest, guestCfg, !authLoading);

  const loading = authLoading || isLoading;
  const error = isError ? "Không thể tải kết quả bài thi này" : "";

  const formatTime = (start, end) => {
    if (!start || !end) return "--:--";

    const diff = Math.floor((new Date(end) - new Date(start)) / 1000);
    const m = Math.floor(diff / 60);
    const s = diff % 60;

    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleShowDetail = () => {
    if (!canReview) {
      toast.warning("Bạn chỉ có thể xem đáp án sau khi thời gian làm bài kết thúc.");
      return;
    }
    router.push(`/tests/result/${userTestId}/review`);
  };

  if (loading)
    return (
      <div className={cx("wrapper")}>
        <Container className="d-flex flex-column align-items-center justify-content-center">
          <Spinner animation="border" />
          <p className="mt-3 fw-bold text-primary">
            Đang tổng hợp điểm số của bạn...
          </p>
        </Container>
      </div>
    );

  if (error)
    return (
      <div className={cx("wrapper")}>
        <Container>
          <Alert variant="danger">{error}</Alert>
          <ButtonPrime variant="primary" className="mt-3" onClick={() => router.push("/")}>
            Quay lại trang chủ
          </ButtonPrime>
        </Container>
      </div>
    );

  return (
    <div className={cx("wrapper")}>
      <Container>

        <CertificateBanner userTestId={userTestId} enabled={!authLoading && isAuthenticated} />

        <div className={cx("result-layout")}>

          <div className={cx("result-card")}>
            <h1>Hoàn thành bài thi!</h1>

            <div className={cx("result-body")}>
              <div className={cx("score-display")}>
                {enhanced?.examCategoryCode === 'QUICK_CHALLENGE' ? (
                  <>
                    <span className={cx("label")}>Độ chính xác</span>
                    <div className={cx("points")}>
                      {enhanced?.percentage ?? 0}%
                    </div>
                  </>
                ) : (
                  <>
                    <span className={cx("label")}>Điểm số</span>
                    <div className={cx("points")}>
                      {/* Bản react-router cũ còn nhánh location.state?.score do trang trước
                          truyền sang; Next không có location.state nên bỏ — `result` từ API
                          vốn đã là nguồn chính, nhánh kia chỉ là dự phòng. */}
                      {result?.totalScore?.toFixed(2) || "0.00"}
                    </div>
                  </>
                )}
              </div>

              <div className={cx("stats-grid")}>
                <div className={cx("stat-item", "correct")}>
                  <IoCheckmarkCircle size={24} />
                  <div className={cx("stat-text")}>
                    <span className={cx("stat-val")}>{result?.correct || 0}</span>
                    <span className={cx("stat-label")}>Câu đúng</span>
                  </div>
                </div>

                <div className={cx("stat-item", "wrong")}>
                  <IoStatsChartOutline size={24} />
                  <div className={cx("stat-text")}>
                    <span className={cx("stat-val")}>{result?.wrong || 0}</span>
                    <span className={cx("stat-label")}>Câu sai</span>
                  </div>
                </div>

                <div className={cx("stat-item", "total")}>
                  <IoSchoolOutline size={24} />
                  <div className={cx("stat-text")}>
                    <span className={cx("stat-val")}>{result?.total || 0}</span>
                    <span className={cx("stat-label")}>Tổng số câu</span>
                  </div>
                </div>

                <div className={cx("stat-item")}>
                  <IoTimeOutline size={24} />
                  <div className={cx("stat-text")}>
                    <span className={cx("stat-val")}>
                      {formatTime(result?.startedAt, result?.finishedAt)}
                    </span>
                    <span className={cx("stat-label")}>Thời gian</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={cx("actions")}>
              {!canReview && (
                <div className={cx("lock-message")}>
                  <IoLockClosedOutline />
                  <span>
                    Đáp án sẽ hiển thị sau khi thời gian làm bài kết thúc.
                  </span>
                </div>
              )}

              <ButtonPrime
                variant="outline"
                className={cx({ "is-locked": !canReview })}
                onClick={handleShowDetail}
              >
                {!canReview ? <IoLockClosedOutline /> : <IoStatsChartOutline />}
                Xem đáp án & giải thích
              </ButtonPrime>

              <ButtonPrime
                variant="ghost"
                onClick={() => router.push(`/tests/history/${testId}`)}
              >
                <IoSchoolOutline /> Lịch sử bài thi
              </ButtonPrime>

              <ButtonPrime variant="primary" onClick={() => router.push("/")}>
                <IoHomeOutline /> Trang chủ
              </ButtonPrime>
            </div>
          </div>

          {enhanced && (
            <div className={cx("diagnosis-card")}>
              <ReadinessGauge enhanced={enhanced} />

              <div className={cx("diagnosis-side")}>
                {enhanced.percentile != null && (
                  <div className={cx("percentile-box")}>
                    Bạn làm tốt hơn <strong>{enhanced.percentile}%</strong> người đã từng làm bài này
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
                />
              </div>
            </div>
          )}

        </div>

        {enhanced && <TagAnalysisTable enhanced={enhanced} userTestId={userTestId} />}
      </Container>
    </div>
  );
};

export default TestResultPage;
