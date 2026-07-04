import { useContext, useEffect, useState, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { getUserTestMeta } from '../../../../../api/userTestApi';
import { getResultByUserTest } from '../../../../../api/userAnswerApi';
import { getUserTestInfo } from '../../../../../api/testApi';
import { Container, Spinner, Alert } from "react-bootstrap";
import classNames from "classnames/bind";
import {
  IoCheckmarkCircle,
  IoHomeOutline,
  IoStatsChartOutline,
  IoTimeOutline,
  IoSchoolOutline,
  IoLockClosedOutline,
} from "react-icons/io5";

import { AuthContext } from "~/context/AuthContext";
import { getGuestSessionId, guestHeaders } from "~/utils/guestSession";
import { getEnhancedResult, getGuestEnhancedResult } from "~/api/enhancedResultApi";
import SkillBreakdownChart from "./components/SkillBreakdownChart";
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

  const [result, setResult] = useState(null);
  const [testId, setTestId] = useState(null);

  const [enhanced, setEnhanced] = useState(null);

  const [canReview, setCanReview] = useState(false);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const formatTime = (start, end) => {
    if (!start || !end) return "--:--";

    const diff = Math.floor((new Date(end) - new Date(start)) / 1000);
    const m = Math.floor(diff / 60);
    const s = diff % 60;

    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // ================================
  //  LOAD RESULT + CHECK REVIEW TIME
  // ================================
  useEffect(() => {
    if (authLoading) return;
    const fetchResult = async () => {
      try {
        setLoading(true);
        // 1. Lấy thông tin tổng quan bài test (Chứa startedAt, finishedAt)
        const metaData = await getUserTestMeta(userTestId, isGuest, guestCfg);
        setTestId(metaData.testId);

        // 2. Lấy kết quả điểm số, số câu đúng/sai
        const resultData = await getResultByUserTest(userTestId, isGuest, guestCfg);

        setResult({
          ...resultData,
          startedAt: metaData.startedAt,
          finishedAt: metaData.finishedAt,
        });

        // 3. Check hạn review (endpoint public)
        const testData = await getUserTestInfo(metaData.testId);
        const now = new Date();
        const availableTo = testData.availableTo ? new Date(testData.availableTo) : null;
        setCanReview(!availableTo || now > availableTo);

        // 4. Fetch enhanced result (non-blocking)
        try {
          const enhancedRes = isGuest
            ? await getGuestEnhancedResult(userTestId)
            : await getEnhancedResult(userTestId);
          setEnhanced(enhancedRes.data);
        } catch (enhErr) {
          console.warn("Enhanced result not available:", enhErr);
        }

      } catch (err) {
        console.error(" Lỗi tải kết quả:", err);
        setError("Không thể tải kết quả bài thi này");
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [userTestId, authLoading, isGuest, guestCfg]);

  // ================================
  //  XEM ĐÁP ÁN & GIẢI THÍCH (trang riêng)
  // ================================
  const handleShowDetail = () => {
    if (!canReview) {
      alert("Bạn chỉ có thể xem đáp án sau khi thời gian làm bài kết thúc.");
      return;
    }
    navigate(`/tests/result/${userTestId}/review`);
  };

  // ================================
  // UI LOADING / ERROR
  // ================================
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
          <button className="btn btn-primary mt-3" onClick={() => navigate("/")}>
            Quay lại trang chủ
          </button>
        </Container>
      </div>
    );

  // ================================
  // MAIN UI
  // ================================
  return (
    <div className={cx("wrapper")}>
      <Container>
        {/* ================= SPLIT LAYOUT ================= */}
        <div className={cx("result-layout")}>

          {/* LEFT: Kết quả */}
          <div className={cx("result-left")}>
            <div className={cx("result-card")}>
              <div className={cx("icon-success")}>
                <IoCheckmarkCircle />
              </div>

              <h1>Hoàn thành bài thi!</h1>

              {/* SCORE */}
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

              {/* STATS */}
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

              {/* ACTIONS */}
              <div className={cx("actions")}>
                {!canReview && (
                  <div className={cx("lock-message")}>
                    <IoLockClosedOutline />
                    <span>
                      Đáp án sẽ hiển thị sau khi thời gian làm bài kết thúc.
                    </span>
                  </div>
                )}

                <button
                  className={cx("btn-detail", { "is-locked": !canReview })}
                  onClick={handleShowDetail}
                >
                  {!canReview ? <IoLockClosedOutline /> : <IoStatsChartOutline />}
                  Xem đáp án & giải thích
                </button>

                <button className={cx("btn-home")} onClick={() => navigate("/")}>
                  <IoHomeOutline /> Trang chủ
                </button>

                <button
                  className={cx("btn-review")}
                  onClick={() => navigate(`/tests/history/${testId}`)}
                >
                  <IoSchoolOutline /> Lịch sử bài thi
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: Chẩn đoán */}
          {enhanced && (
            <div className={cx("result-right")}>
              <div className={cx("diagnosis-card")}>
                <ReadinessGauge enhanced={enhanced} />

                {enhanced.percentile != null && (
                  <div style={{
                    marginTop: 16, padding: '12px 16px', borderRadius: 12,
                    background: '#f0f9ff', border: '1px solid #bae6fd',
                    textAlign: 'center', fontSize: 14, color: '#0369a1',
                  }}>
                    Bạn làm tốt hơn <strong>{enhanced.percentile}%</strong> người đã từng làm bài này
                  </div>
                )}

                <SkillBreakdownChart
                  skillBreakdown={enhanced.skillBreakdown}
                  partBreakdown={enhanced.partBreakdown}
                />

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
