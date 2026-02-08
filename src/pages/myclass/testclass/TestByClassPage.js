import axios from 'axios';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Spinner, Button } from 'react-bootstrap';
import classNames from 'classnames/bind';
import {
  IoTimeOutline,
  IoCalendarOutline,
  IoStatsChartOutline,
  IoPlayCircleOutline,
  IoLockClosedOutline,
  IoCheckmarkDoneOutline,
  IoHourglassOutline,
  IoDocumentTextOutline,
  IoAddCircleOutline
} from 'react-icons/io5';

import styles from './TestByClassPage.module.scss';
import { useAuth } from '../../../hook/useAuth';
import CreateTestModal from '~/components/modals/CreateTestModal';

const cx = classNames.bind(styles);

function TestByClassPage() {
  const { classId } = useParams();
  const { chapterId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tests, setTests] = useState([]);
  const [className, setClassName] = useState('');
  const [loading, setLoading] = useState(true);
  const [countdowns, setCountdowns] = useState({});
  const [showCreateTestModal, setShowCreateTestModal] = useState(false);

  // 🟢 Lấy thông tin lớp học
  useEffect(() => {
    if (!classId) return;
    axios
      .get(`/api/classes/${classId}`)
      .then((res) => {
        if (res.data && res.data.className) {
          setClassName(res.data.className);
        }
      })
      .catch((err) => console.error('❌ Lỗi:', err));
  }, [classId]);

  // 🟢 Lấy danh sách bài test
  const fetchTests = () => {
    if (!classId || !chapterId) return;
    setLoading(true);
    axios
      .get(`/api/classes/${classId}/chapters/${chapterId}/tests`)
      .then((res) => {
        if (Array.isArray(res.data)) {
          setTests(res.data);
        }
      })
      .catch((err) => {
        console.error('❌ Lỗi bài test:', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTests();
  }, [classId, chapterId]);

  // 🕒 Countdown logic
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
        <Spinner animation="grow" variant="primary" />
        <p className="mt-3 fw-bold text-primary">Đang tải phòng thi...</p>
      </div>
    );
  }

  return (
    <div className={cx('wrapper')}>
      <Container>
        {/* === Premium Header === */}
        <div className={cx('header')}>
          <div className={cx('header-content')}>
            <span className={cx('class-label')}>Phòng thi của lớp</span>
            <h1>{className || 'Lớp học hiện tại'}</h1>
          </div>
          <Button
            className={cx('btn-create-test')}
            onClick={() => setShowCreateTestModal(true)}
          >
            <IoAddCircleOutline size={20} />
            Tạo bài kiểm tra mới
          </Button>
        </div>

        {/* === Test Cards Grid === */}
        <div className={cx('test-grid')}>
          {tests.length > 0 ? (
            tests.map((test) => {
              const availableFrom = test.availableFrom ? new Date(test.availableFrom) : null;
              const availableTo = test.availableTo ? new Date(test.availableTo) : null;
              const remainingTime = countdowns[test.testId];

              let status = 'open';
              let statusLabel = 'Đang diễn ra';
              let buttonText = 'Bắt đầu làm bài';
              let canStart = true;

              if (availableFrom && now < availableFrom) {
                status = 'locked';
                statusLabel = 'Sắp diễn ra';
                buttonText = remainingTime ? `Mở sau ${formatCountdown(remainingTime)}` : 'Chưa mở';
                canStart = false;
              } else if (availableTo && now > availableTo) {
                status = 'expired';
                statusLabel = 'Đã kết thúc';
                buttonText = 'Vòng thi đã đóng';
                canStart = false;
              } else if (test.remainingAttempts === 0) {
                status = 'expired';
                statusLabel = 'Hết lượt làm';
                buttonText = 'Không còn lượt làm';
                canStart = false;
              }

              return (
                <div key={test.testId} className={cx('test-card')}>
                  <div className={cx('banner-wrapper')}>
                    <img
                      src={test.bannerUrl || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1000&auto=format&fit=crop'}
                      className={cx('banner-img')}
                      alt={test.title}
                    />
                    <div className={cx('status-badge', `status-${status}`)}>
                      {statusLabel}
                    </div>
                  </div>

                  <div className={cx('body')}>
                    <h5 className={cx('title')}>{test.title}</h5>

                    <div className={cx('info-list')}>
                      <div className={cx('info-item')}>
                        <IoTimeOutline />
                        <span>Thời gian: <strong>{test.durationMinutes} phút</strong></span>
                      </div>
                      <div className={cx('info-item')}>
                        <IoCalendarOutline />
                        <span>Bắt đầu: {formatDateTime(test.availableFrom)}</span>
                      </div>
                      <div className={cx('info-item')}>
                        <IoHourglassOutline />
                        <span>Kết thúc: {formatDateTime(test.availableTo)}</span>
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
                        Xem lịch sử kết quả
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className={cx('empty-state')}>
              <IoDocumentTextOutline className={cx('icon')} />
              <h4>Chưa có bài kiểm tra nào được công bố</h4>
              <p className="text-muted">Giáo viên của bạn sẽ sớm cập nhật các bài thi tại đây.</p>
            </div>
          )}
        </div>
      </Container>

      {/* Modal tạo test */}
      <CreateTestModal
        show={showCreateTestModal}
        onClose={() => setShowCreateTestModal(false)}
        mode="class"
        classId={classId}
        chapterId={chapterId}
        onSuccess={() => {
          fetchTests(); // Refresh danh sách test
          setShowCreateTestModal(false);
        }}
      />
    </div>
  );
}

export default TestByClassPage;
