import axios from "axios";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import classNames from "classnames/bind";
import style from "./TestByExamTypePage.module.scss";
import { useAuth } from "../../../../hook/useAuth";

const cx = classNames.bind(style);

function TestByExamTypePage() {
  const { examTypeId } = useParams();
  const { userId } = useAuth();
  const navigate = useNavigate();

  const [tests, setTests] = useState([]);
  const [examTypeName, setExamTypeName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!examTypeId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    let apiUrl = `/api/tests/user/by-exam-type/${examTypeId}`;
    if (userId) apiUrl += `?userId=${userId}`;

    axios
      .get(apiUrl)
      .then((res) => setTests(res.data))
      .catch((err) => {
        console.error("Lỗi khi lấy tests:", err);
        setTests([]);
      })
      .finally(() => setLoading(false));

    axios
      .get(`/api/exam-types/${examTypeId}`)
      .then((res) => setExamTypeName(res.data.name))
      .catch((err) => console.error("Lỗi khi lấy tên exam type:", err));
  }, [examTypeId, userId]);

  // === Xử lý click Bắt đầu ===
  const handleStartTest = (testId, remainingAttempts, availableFrom, availableTo) => {
    if (!userId) {
      alert("Bạn cần đăng nhập để làm bài kiểm tra.");
      navigate("/login");
      return;
    }

    const now = new Date();

    if (availableFrom && now < new Date(availableFrom)) {
      alert("⏳ Bài thi chưa mở. Vui lòng quay lại sau.");
      return;
    }

    if (availableTo && now > new Date(availableTo)) {
      alert("❌ Bài thi đã kết thúc, bạn không thể làm nữa.");
      return;
    }

    if (remainingAttempts === 0) {
      alert("⚠️ Bạn đã hết số lượt làm bài này.");
      return;
    }

    navigate(`/tests/${testId}/start`);
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleString("vi-VN", {
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const now = new Date();

  return (
    <div className={cx("container")}>
      <h3 className={cx("title")}>
        Bài kiểm tra - {examTypeName || "Đang tải..."}
      </h3>

      <div className={cx("grid")}>
        {loading && <p>Đang tải danh sách bài kiểm tra...</p>}

        {!loading && tests.length === 0 && (
          <p>Không có bài kiểm tra nào cho loại đề thi này.</p>
        )}

        {!loading &&
          tests.map((test) => {
            const availableFrom = test.availableFrom ? new Date(test.availableFrom) : null;
            const availableTo = test.availableTo ? new Date(test.availableTo) : null;

            let buttonText = "Bắt đầu";
            let canStart = true;
            let buttonClass = "btn-start";

            if (userId) {
              // ⏳ Bài chưa mở
              if (availableFrom && now < availableFrom) {
                buttonText = `Chưa mở (${formatDateTime(test.availableFrom)})`;
                canStart = false;
                buttonClass = "btn-disabled btn-not-started";
              }
              // ❌ Bài đã kết thúc
              else if (availableTo && now > availableTo) {
                buttonText = `Đã kết thúc (${formatDateTime(test.availableTo)})`;
                canStart = false;
                buttonClass = "btn-disabled btn-expired";
              }
              // ⚠️ Hết lượt
              else if (test.remainingAttempts === 0) {
                buttonText = "Hết lượt";
                canStart = false;
                buttonClass = "btn-disabled btn-no-attempts";
              }
            }

            return (
              <div key={test.testId} className={cx("card")}>
                {test.bannerUrl && (
                  <img
                    src={test.bannerUrl}
                    alt={test.title}
                    className={cx("banner")}
                  />
                )}

                <div className={cx("body")}>
                  <h5 className={cx("card-title")}>{test.title}</h5>

                  {test.durationMinutes && (
                    <p className={cx("card-duration")}>
                      ⏱ Thời gian: {test.durationMinutes} phút
                    </p>
                  )}

                  {test.availableFrom && (
                    <p>📅 Mở từ: {formatDateTime(test.availableFrom)}</p>
                  )}

                  {test.availableTo && (
                    <p>⏰ Đến hết: {formatDateTime(test.availableTo)}</p>
                  )}

                  <button
                    className={cx(buttonClass)}
                    onClick={() =>
                      handleStartTest(
                        test.testId,
                        test.remainingAttempts,
                        test.availableFrom,
                        test.availableTo
                      )
                    }
                    disabled={!canStart}
                  >
                    {buttonText}
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

export default TestByExamTypePage;
