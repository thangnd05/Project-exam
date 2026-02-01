import axios from 'axios';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import style from './TestByExamTypePage.module.scss';
import { useAuth } from '../../../../hook/useAuth';

const cx = classNames.bind(style);

function TestByExamTypePage() {
  const { examTypeId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tests, setTests] = useState([]);
  const [examTypeName, setExamTypeName] = useState('');
  const [loading, setLoading] = useState(true);
  const [countdowns, setCountdowns] = useState({});

  // 🟢 Lấy danh sách bài kiểm tra theo examTypeId
  useEffect(() => {
    if (!examTypeId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    axios
      .get(`/api/tests/user/by-exam-type/${examTypeId}`)
      .then((res) => setTests(res.data))
      .catch((err) => {
        console.error('❌ Lỗi khi lấy danh sách bài kiểm tra:', err);
        setTests([]);
      })
      .finally(() => setLoading(false));

    // Lấy tên loại bài thi
    axios
      .get(`/api/exam-types/${examTypeId}`)
      .then((res) => setExamTypeName(res.data.name))
      .catch((err) => console.error('❌ Lỗi khi lấy tên exam type:', err));
  }, [examTypeId]);

  // 🟢 Cập nhật đếm ngược
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const updatedCountdowns = {};
      tests.forEach((test) => {
        if (test.availableFrom) {
          const diff = new Date(test.availableFrom) - now;
          if (diff > 0) updatedCountdowns[test.testId] = diff;
        }
      });
      setCountdowns(updatedCountdowns);
    }, 1000);
    return () => clearInterval(interval);
  }, [tests]);

  // 🧭 Format thời gian
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('vi-VN', {
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCountdown = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}p ${seconds}s`;
  };

  // 🟢 Xử lý khi người dùng bắt đầu bài thi
  const handleStartTest = (test) => {
    if (!user) {
      alert('Bạn cần đăng nhập để làm bài kiểm tra.');
      navigate('/login');
      return;
    }

    const now = new Date();
    const availableFrom = test.availableFrom
      ? new Date(test.availableFrom)
      : null;
    const availableTo = test.availableTo ? new Date(test.availableTo) : null;

    if (availableFrom && now < availableFrom) {
      alert('⏳ Bài thi chưa mở. Vui lòng quay lại sau.');
      return;
    }

    if (availableTo && now > availableTo) {
      alert('❌ Bài thi đã kết thúc, bạn không thể làm nữa.');
      return;
    }

    if (test.remainingAttempts === 0) {
      alert('⚠️ Bạn đã hết số lượt làm bài này.');
      return;
    }

    let allowedTime = test.durationMinutes * 60;
    if (availableTo) {
      const timeUntilClose = Math.floor((availableTo - now) / 1000);
      if (timeUntilClose < allowedTime) allowedTime = timeUntilClose;
    }

    navigate(`/tests/${test.testId}/start`, { state: { allowedTime } });
  };

  const handleViewHistory = (testId) => {
    navigate(`/tests/history/${testId}`);
  };

  const now = new Date();

  return (
    <div className={cx('container')}>
      <h3 className={cx('title')}>
        Bài kiểm tra - {examTypeName || 'Đang tải...'}
      </h3>

      <div className={cx('grid')}>
        {loading && <p>Đang tải danh sách bài kiểm tra...</p>}
        {!loading && tests.length === 0 && <p>Không có bài kiểm tra nào.</p>}

        {!loading &&
          tests.map((test) => {
            const availableFrom = test.availableFrom
              ? new Date(test.availableFrom)
              : null;
            const availableTo = test.availableTo
              ? new Date(test.availableTo)
              : null;
            const remainingTime = countdowns[test.testId];

            let buttonText = 'Bắt đầu';
            let canStart = true;
            let buttonClass = 'btn-start';

            if (availableFrom && now < availableFrom) {
              buttonText = remainingTime
                ? `Mở sau ${formatCountdown(remainingTime)}`
                : `Chưa mở (${formatDateTime(test.availableFrom)})`;
              canStart = false;
              buttonClass = 'btn-disabled btn-not-started';
            } else if (availableTo && now > availableTo) {
              buttonText = `Đã kết thúc (${formatDateTime(test.availableTo)})`;
              canStart = false;
              buttonClass = 'btn-disabled btn-expired';
            } else if (test.remainingAttempts === 0) {
              buttonText = 'Hết lượt';
              canStart = false;
              buttonClass = 'btn-disabled btn-no-attempts';
            }

            return (
              <div key={test.testId} className={cx('card')}>
                {test.bannerUrl && (
                  <img
                    src={test.bannerUrl}
                    alt={test.title}
                    className={cx('banner')}
                  />
                )}

                <div className={cx('body')}>
                  <h5 className={cx('card-title')}>
                    {test.title || 'Không có tiêu đề'}
                  </h5>

                  <p className={cx('card-duration')}>
                    ⏱ Thời gian:{' '}
                    {test.durationMinutes ? `${test.durationMinutes} phút` : ''}
                  </p>
                  <p>📅 Mở từ: {formatDateTime(test.availableFrom)}</p>
                  <p>⏰ Đến hết: {formatDateTime(test.availableTo)}</p>

                  <div>
                    <button
                      className={cx('btn-history')}
                      onClick={() => handleViewHistory(test.testId)}
                    >
                      📊 Xem lịch sử
                    </button>
                  </div>

                  <div className={cx('btn-group')}>
                    <button
                      className={cx(buttonClass)}
                      onClick={() => handleStartTest(test)}
                      disabled={!canStart}
                    >
                      {buttonText}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

export default TestByExamTypePage;
