import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Spinner } from 'react-bootstrap';
import classNames from 'classnames/bind';
import {
  IoAdd,
  IoTimeOutline,
  IoCalendarOutline,
  IoStatsChartOutline,
  IoPlayCircleOutline,
  IoLockClosedOutline,
  IoHourglassOutline,
  IoDocumentTextOutline,
} from 'react-icons/io5';

import styles from './MyTestPage.module.scss';
import { useAuth } from '../../hook/useAuth';
import PageHeader from '~/components/common/PageHeader/PageHeader';
import CreateTestModal from '~/components/modals/CreateTestModal';

const cx = classNames.bind(styles);

function MyTestPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countdowns, setCountdowns] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchTests = () => {
    setLoading(true);
    axios
      .get('/api/tests/my-tests')
      .then((res) => {
        if (Array.isArray(res.data)) setTests(res.data);
        else setTests([]);
      })
      .catch((err) => {
        console.error('❌ Lỗi:', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchTests();
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
    const now = new Date();
    const from = test.availableFrom ? new Date(test.availableFrom) : null;
    const to = test.availableTo ? new Date(test.availableTo) : null;

    if (from && now < from) return;
    if (to && now > to) return;
    if (test.remainingAttempts === 0) return;

    navigate(`/tests/${test.testId}/start`, {
      state: { allowedTime: test.durationMinutes * 60 },
    });
  };

  const now = new Date();

  if (loading) {
    return (
      <div className={cx('loading-box')}>
        <Spinner animation="grow" variant="primary" size="lg" />
        <p>Đang tải bộ sưu tập đề thi...</p>
      </div>
    );
  }

  return (
    <div className={cx('wrapper')}>
      <Container>
        {/* === Generic Page Header === */}
        <PageHeader
          title="Bài kiểm tra của tôi"
          label="QUẢN LÝ ĐỀ THI"
          actionText="Tạo đề thi mới"
          actionIcon={IoAdd}
          onAction={() => setShowCreateModal(true)}
        />

        {/* === Grid Content === */}
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
                buttonText = 'Hết hạn nộp';
                canStart = false;
              } else if (test.remainingAttempts === 0) {
                status = 'expired';
                statusLabel = 'Hết lượt làm';
                buttonText = 'Vượt quá lượt thi';
                canStart = false;
              }

              return (
                <div key={test.testId} className={cx('test-card')}>
                  <div className={cx('banner-box')}>
                    <img
                      src={test.bannerUrl || 'https://images.unsplash.com/photo-1544391682-17762238690f?q=80&w=1000&auto=format&fit=crop'}
                      className={cx('banner-img')}
                      alt={test.title}
                    />
                    <div className={cx('status-tag', `status-${status}`)}>
                      {statusLabel}
                    </div>
                  </div>

                  <div className={cx('card-body')}>
                    <h5 className={cx('title')}>{test.title || 'Bài thi cá nhân'}</h5>

                    <div className={cx('info-group')}>
                      <div className={cx('info-item')}>
                        <IoTimeOutline />
                        <span>Thời gian: <strong>{test.durationMinutes || 0} phút</strong></span>
                      </div>
                      <div className={cx('info-item')}>
                        <IoCalendarOutline />
                        <span>Ngày mở: {formatDateTime(test.availableFrom)}</span>
                      </div>
                      <div className={cx('info-item')}>
                        <IoHourglassOutline />
                        <span>Hạn cuối: {formatDateTime(test.availableTo)}</span>
                      </div>
                    </div>

                    <div className={cx('actions')}>
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
                        Xem điểm & Lịch sử
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className={cx('empty-state')}>
              <IoDocumentTextOutline className={cx('icon')} />
              <h4>Kho lưu trữ hiện đang trống</h4>
              <p>Hãy bắt đầu hành trình chinh phục kiến thức bằng cách tạo bài kiểm tra đầu tiên của bạn!</p>
              <button className={cx('btn-primary-modern')} style={{ paddingLeft: '30px', paddingRight: '30px', width: 'auto', margin: '0 auto' }} onClick={() => setShowCreateModal(true)}>
                <IoAdd size={24} />
                Tạo kiểm tra ngay
              </button>
            </div>
          )}
        </div>
      </Container>

      {/* --- Standardized Modal --- */}
      <CreateTestModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchTests}
        mode="personal"
      />
    </div>
  );
}

export default MyTestPage;
