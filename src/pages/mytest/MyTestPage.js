import axios from 'axios';
import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import classNames from 'classnames/bind';
import style from '../exam/examtype/examtypeById/TestByExamTypePage.module.scss';
import {useAuth} from '../../hook/useAuth';
import {Button, Spinner} from 'react-bootstrap';

const cx = classNames.bind(style);

function MyTestPage() {
  const {user} = useAuth();
  const navigate = useNavigate();

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countdowns, setCountdowns] = useState({});

  useEffect(() => {
    if (!user) {
      alert('🔒 Bạn cần đăng nhập để xem danh sách bài kiểm tra.');
      navigate('/login');
      return;
    }

    setLoading(true);
    axios
      .get('/api/tests/my-test')
      .then((res) => {
        if (Array.isArray(res.data)) setTests(res.data);
        else setTests([]);
      })
      .catch((err) => {
        console.error('❌ Lỗi khi lấy danh sách bài test:', err);
        alert('⚠️ Lỗi khi tải danh sách bài kiểm tra.');
      })
      .finally(() => setLoading(false));
  }, [user, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const updated = {};
      tests.forEach((t) => {
        if (t.availableFrom) {
          const diff = new Date(t.availableFrom) - now;
          if (diff > 0) updated[t.testId] = diff;
        }
      });
      setCountdowns(updated);
    }, 1000);
    return () => clearInterval(interval);
  }, [tests]);

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

  const handleStartTest = (test) => {
    const now = new Date();
    const from = test.availableFrom ? new Date(test.availableFrom) : null;
    const to = test.availableTo ? new Date(test.availableTo) : null;

    if (from && now < from) {
      alert('⏳ Bài thi chưa mở. Vui lòng quay lại sau.');
      return;
    }
    if (to && now > to) {
      alert('❌ Bài thi đã kết thúc, bạn không thể làm nữa.');
      return;
    }
    if (test.remainingAttempts === 0) {
      alert('⚠️ Bạn đã hết lượt làm bài này.');
      return;
    }

    navigate(`/tests/${test.testId}/start`, {
      state: {allowedTime: test.durationMinutes * 60},
    });
  };

  const handleViewHistory = (testId) => {
    navigate(`/tests/history/${testId}`);
  };

  const handleCreateTest = () => {
    navigate('/tests/create');
  };

  const now = new Date();

  return (
    <div className={cx('container')}>
      {/* 🎯 Tiêu đề giống giao diện album */}
      <div className={cx('header-bar')}>
        <h3 className={cx('page-title')}>📘 Bài kiểm tra của tôi</h3>
        <button className={cx('btn-create')} onClick={handleCreateTest}>
          ➕ Tạo kiểm tra mới
        </button>
      </div>

      {/* 🧩 Hiển thị nội dung */}
      {loading ? (
        <div className="text-center mt-5">
          <Spinner animation="border" variant="primary" />
          <p>Đang tải...</p>
        </div>
      ) : tests.length === 0 ? (
        // 🟢 Thông báo trống giống kiểu album
        <div className={cx('empty-box')}>
          <p>📭 Chưa có bài kiểm tra nào được tạo.</p>
        </div>
      ) : (
        // 🟢 Giữ nguyên phần card gốc
        <div className={cx('grid')}>
          {tests.map((test) => {
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
      )}
    </div>
  );
}

export default MyTestPage;
