import axios from 'axios';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Table, Spinner } from 'react-bootstrap';
import classNames from 'classnames/bind';
import {
  IoArrowBack,
  IoEyeOutline,
  IoCalendarOutline,
  IoStatsChartOutline,
  IoCheckmarkCircleOutline,
  IoHourglassOutline,
  IoCloseCircleOutline,
  IoDocumentTextOutline,
  IoTrophyOutline
} from 'react-icons/io5';

import style from './TestHistory.module.scss';
import { useAuth } from '~/hook/useAuth';

const cx = classNames.bind(style);

function TestHistoryPage() {
  const { testId } = useParams();
  const { userId } = useAuth();
  const navigate = useNavigate();

  const [attempts, setAttempts] = useState([]);
  const [testInfo, setTestInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!testId || !userId) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const [attemptRes, testRes] = await Promise.all([
          axios.get(`/api/user-tests/by-user/${userId}/by-test/${testId}`),
          axios.get(`/api/tests/${testId}`),
        ]);
        setAttempts(attemptRes.data);
        setTestInfo(testRes.data);
      } catch (err) {
        console.error('❌ Lỗi khi tải dữ liệu lịch sử:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [testId, userId]);

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('vi-VN', {
      hour12: false,
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleViewResult = (userTestId) => {
    navigate(`/tests/result/${userTestId}`);
  };

  if (loading) {
    return (
      <div className={cx('loading-box')}>
        <Spinner animation="grow" variant="primary" size="lg" />
        <p>Đang lục lại nhật ký học tập...</p>
      </div>
    );
  }

  return (
    <div className={cx('wrapper')}>
      <Container>
        {/* === Premium Header === */}
        <div className={cx('header')}>
          <div className={cx('title-section')}>
            <button className={cx('btn-back')} onClick={() => navigate(-1)}>
              <IoArrowBack />
              Quay lại
            </button>
            <h1>
              {testInfo ? testInfo.title : `Lịch sử bài thi #${testId}`}
            </h1>
          </div>
        </div>

        {/* === Table Content === */}
        {attempts.length === 0 ? (
          <div className={cx('empty-state')}>
            <IoDocumentTextOutline className={cx('icon')} />
            <h4>Chưa có lần làm bài nào</h4>
            <p className="text-muted">Hãy bắt đầu thử sức với bài thi này để xem kết quả tại đây nhé!</p>
          </div>
        ) : (
          <div className={cx('table-container')}>
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Lần</th>
                  <th>Thời gian bắt đầu</th>
                  <th>Thời gian nộp</th>
                  <th>Điểm số</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a, i) => (
                  <tr key={a.userTestId}>
                    <td data-label="Lần" className="fw-bold text-muted">#{i + 1}</td>
                    <td data-label="Bắt đầu">
                      <div className="d-flex align-items-center justify-content-center gap-2">
                        <IoCalendarOutline size={16} />
                        {formatDateTime(a.startedAt)}
                      </div>
                    </td>
                    <td data-label="Nộp bài">
                      <div className="d-flex align-items-center justify-content-center gap-2">
                        <IoCheckmarkCircleOutline size={16} />
                        {formatDateTime(a.finishedAt)}
                      </div>
                    </td>
                    <td data-label="Điểm">
                      <div className={cx('score-badge')}>
                        <IoTrophyOutline size={18} className="me-2" />
                        {a.totalScore ?? '--'}
                      </div>
                    </td>
                    <td data-label="Trạng thái">
                      {a.status === 'COMPLETED' ? (
                        <span className={cx('status-pill', 'status-completed')}>
                          <IoCheckmarkCircleOutline /> Hoàn thành
                        </span>
                      ) : a.status === 'IN_PROGRESS' ? (
                        <span className={cx('status-pill', 'status-in-progress')}>
                          <IoHourglassOutline /> Đang làm
                        </span>
                      ) : (
                        <span className={cx('status-pill', 'status-expired')}>
                          <IoCloseCircleOutline /> Hết hạn
                        </span>
                      )}
                    </td>
                    <td data-label="Thao tác">
                      {a.status === 'COMPLETED' ? (
                        <button
                          className={cx('btn-view-modern')}
                          onClick={() => handleViewResult(a.userTestId)}
                        >
                          <IoEyeOutline />
                          Chi tiết
                        </button>
                      ) : (
                        <span className="text-muted small italic">Không khả dụng</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Container>
    </div>
  );
}

export default TestHistoryPage;
