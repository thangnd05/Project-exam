import axios from 'axios';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Spinner } from 'react-bootstrap';
import classNames from 'classnames/bind';
import {
  IoTimeOutline,
  IoCalendarOutline,
  IoStatsChartOutline,
  IoPlayCircleOutline,
  IoLockClosedOutline,
  IoHourglassOutline,
  IoDocumentTextOutline
} from 'react-icons/io5';

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

  useEffect(() => {
    if (!examTypeId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Lấy danh sách đề
    axios
      .get(`/api/tests/user/by-exam-type/${examTypeId}`)
      .then((res) => setTests(res.data))
      .catch((err) => {
        console.error('❌ Lỗi tải bài test:', err);
        setTests([]);
      })
      .finally(() => setLoading(false));

    // Lấy thông tin loại đề
    axios
      .get(`/api/exam-types/${examTypeId}`)
      .then((res) => setExamTypeName(res.data.name))
      .catch((err) => console.error('❌ Lỗi tải tên:', err));
  }, [examTypeId]);

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

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('vi-VN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCountdown = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}p ${s}s`;
  };

  const handleStartTest = (test) => {
    if (!user) {
      navigate('/login');
      return;
    }

    const now = new Date();
    const availableFrom = test.availableFrom ? new Date(test.availableFrom) : null;
    const availableTo = test.availableTo ? new Date(test.availableTo) : null;

    if (availableFrom && now < availableFrom) return;
    if (availableTo && now > availableTo) return;
    if (test.remainingAttempts === 0) return;

    let allowedTime = test.durationMinutes * 60;
    if (availableTo) {
      const timeUntilClose = Math.floor((availableTo - now) / 1000);
      if (timeUntilClose < allowedTime) allowedTime = timeUntilClose;
    }

    navigate(`/tests/${test.testId}/start`, { state: { allowedTime } });
  };

  const now = new Date();

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="grow" variant="info" />
        <p className="mt-3 fw-bold text-info">Đang tải kho bài tập...</p>
      </div>
    );
  }

  return (
    <div className={cx('wrapper')}>
      <Container>
        {/* === Premium Header === */}
        <div className={cx('header')}>
          <span className={cx('type-label')}>Khám phá bộ đề</span>
          <h1>{examTypeName || 'Loại bài tập'}</h1>
        </div>

        {/* === Grid === */}
        <div className={cx('grid')}>
          {tests.length > 0 ? (
            tests.map((test) => {
              const availableFrom = test.availableFrom ? new Date(test.availableFrom) : null;
              const availableTo = test.availableTo ? new Date(test.availableTo) : null;
              const remainingTime = countdowns[test.testId];

              let status = 'open';
              let statusLabel = 'Đang diễn ra';
              let buttonText = 'Bắt đầu ngay';
              let canStart = true;

              if (availableFrom && now < availableFrom) {
                status = 'locked';
                statusLabel = 'Sắp mở';
                buttonText = remainingTime ? `Mở sau ${formatCountdown(remainingTime)}` : 'Chưa mở';
                canStart = false;
              } else if (availableTo && now > availableTo) {
                status = 'expired';
                statusLabel = 'Đã kết thúc';
                buttonText = 'Vòng thi đã đóng';
                canStart = false;
              } else if (test.remainingAttempts === 0) {
                status = 'expired';
                statusLabel = 'Hết lượt';
                buttonText = 'Vượt quá lượt làm';
                canStart = false;
              }

              return (
                <div key={test.testId} className={cx('test-card')}>
                  <div className={cx('banner-wrapper')}>
                    <img
                      src={test.bannerUrl || 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=1000&auto=format&fit=crop'}
                      className={cx('banner-img')}
                      alt={test.title}
                    />
                    <div className={cx('status-badge', `status-${status}`)}>
                      {statusLabel}
                    </div>
                  </div>

                  <div className={cx('card-body')}>
                    <h5 className={cx('title')}>{test.title || 'Bài tập luyện tập'}</h5>

                    <div className={cx('info-list')}>
                      <div className={cx('info-item')}>
                        <IoTimeOutline />
                        <span>Thời lượng: <strong>{test.durationMinutes || 0} phút</strong></span>
                      </div>
                      <div className={cx('info-item')}>
                        <IoCalendarOutline />
                        <span>Mở: {formatDateTime(test.availableFrom)}</span>
                      </div>
                      <div className={cx('info-item')}>
                        <IoHourglassOutline />
                        <span>Hạn: {formatDateTime(test.availableTo)}</span>
                      </div>
                    </div>

                    <div className={cx('btn-group')}>
                      <button
                        className={cx('btn-primary-modern')}
                        onClick={() => handleStartTest(test)}
                        disabled={!canStart}
                      >
                        {canStart ? <IoPlayCircleOutline size={22} /> : <IoLockClosedOutline size={20} />}
                        {buttonText}
                      </button>

                      <button
                        className={cx('btn-outline-modern')}
                        onClick={() => navigate(`/tests/history/${test.testId}`)}
                      >
                        <IoStatsChartOutline />
                        Lịch sử điểm của tôi
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className={cx('empty-state')}>
              <IoDocumentTextOutline className={cx('icon')} />
              <h4>Bộ đề này hiện đang được soạn thảo</h4>
              <p className="text-muted">Vui lòng quay lại sau để trải nghiệm những thử thách mới.</p>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}

export default TestByExamTypePage;
