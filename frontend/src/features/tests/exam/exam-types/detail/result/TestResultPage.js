import { useContext, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
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

import { AuthContext } from "~/shared/context/AuthContext";
import { getGuestSessionId, guestHeaders } from "~/shared/utils/guestSession";
import { useTestResult } from "./hooks/useTestResult";
import ButtonPrime from "~/shared/ui/Button/ButtonPrime";
import ReadinessGauge from "./components/ReadinessGauge";
import RecoveryPlan from "./components/RecoveryPlan";
import TagAnalysisTable from "./components/TagAnalysisTable";
import styles from "./TestResultPage.module.scss";

const cx = classNames.bind(styles);

const TestResultPage = () => {
  const { userTestId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
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
    navigate(`/tests/result/${userTestId}/review`);
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
          <ButtonPrime variant="primary" className="mt-3" onClick={() => navigate("/")}>
            Quay lại trang chủ
          </ButtonPrime>
        </Container>
      </div>
    );

  return (
    <div className={cx("wrapper")}>
      <Container>

        <div className={cx("result-layout")}>

          <div className={cx("result-left")}>
            <div className={cx("result-card")}>

              <h1>Hoàn thành bài thi!</h1>

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
                      {result?.totalScore?.toFixed(2) ||
                        location.state?.score?.toFixed(2) ||
                        "0.00"}
                    </div>
                  </>
                )}
              </div>

              <div className={cx("stats-grid")}>
                <div className={cx("stat-item", "correct")}>
                  <IoCheckmarkCircle size={24} />
                  <span className={cx("stat-val")}>{result?.correct || 0}</span>
                  <span className={cx("stat-label")}>Câu đúng</span>
                </div>

                <div className={cx("stat-item", "wrong")}>
                  <IoStatsChartOutline size={24} />
                  <span className={cx("stat-val")}>{result?.wrong || 0}</span>
                  <span className={cx("stat-label")}>Câu sai</span>
                </div>

                <div className={cx("stat-item", "total")}>
                  <IoSchoolOutline size={24} />
                  <span className={cx("stat-val")}>{result?.total || 0}</span>
                  <span className={cx("stat-label")}>Tổng số câu</span>
                </div>

                <div className={cx("stat-item")}>
                  <IoTimeOutline size={24} />
                  <span className={cx("stat-val")}>
                    {formatTime(result?.startedAt, result?.finishedAt)}
                  </span>
                  <span className={cx("stat-label")}>Thời gian</span>
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
                  fullWidth
                  className={cx({ "is-locked": !canReview })}
                  onClick={handleShowDetail}
                >
                  {!canReview ? <IoLockClosedOutline /> : <IoStatsChartOutline />}
                  Xem đáp án & giải thích
                </ButtonPrime>

                <ButtonPrime variant="primary" fullWidth onClick={() => navigate("/")}>
                  <IoHomeOutline /> Trang chủ
                </ButtonPrime>

                <ButtonPrime
                  variant="ghost"
                  fullWidth
                  onClick={() => navigate(`/tests/history/${testId}`)}
                >
                  <IoSchoolOutline /> Lịch sử bài thi
                </ButtonPrime>
              </div>
            </div>
          </div>

          {enhanced && (
            <div className={cx("result-right")}>
              <div className={cx("diagnosis-card")}>
                <ReadinessGauge enhanced={enhanced} />

                {enhanced.percentile != null && (
                  <div className={cx("percentile-box")}>
                    Bạn làm tốt hơn <strong>{enhanced.percentile}%</strong> người đã từng làm bài này
                  </div>
                )}

                <RecoveryPlan
                  recoveryMessage={enhanced.recoveryMessage}
                  userTestId={userTestId}
                  examTypeId={enhanced.examTypeId}
                  hasTarget={enhanced.hasTarget}
                  isTargetMet={enhanced.isTargetMet}
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
