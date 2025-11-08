import axios from 'axios';
import {useEffect, useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import classNames from 'classnames/bind';
import style from './TestHistory.module.scss';
import {useAuth} from '~/hook/useAuth';

const cx = classNames.bind(style);

function TestHistoryPage() {
  const {testId} = useParams();
  const {userId} = useAuth();
  const navigate = useNavigate();

  const [attempts, setAttempts] = useState([]);
  const [testInfo, setTestInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🟢 Lấy danh sách các lần làm bài
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

  // 🕓 Format thời gian hiển thị
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('vi-VN', {
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 👁 Xem chi tiết kết quả
  const handleViewResult = (userTestId) => {
    navigate(`/tests/result/${userTestId}`);
  };

  return (
    <div className={cx('container')}>
      <div className={cx('header')}>
        <button className={cx('btn-back')} onClick={() => navigate(-1)}>
          ← Quay lại
        </button>
        <h3>
          📊 Lịch sử làm bài -{' '}
          {testInfo ? testInfo.title : `Bài thi #${testId}`}
        </h3>
      </div>

      {loading ? (
        <p>Đang tải dữ liệu...</p>
      ) : attempts.length === 0 ? (
        <p>Chưa có lượt làm nào cho bài thi này.</p>
      ) : (
        <table className={cx('history-table')}>
          <thead>
            <tr>
              <th>Lần</th>
              <th>Bắt đầu</th>
              <th>Kết thúc</th>
              <th>Điểm</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((a, i) => (
              <tr key={a.userTestId}>
                <td>{i + 1}</td>
                <td>{formatDateTime(a.startedAt)}</td>
                <td>{formatDateTime(a.finishedAt)}</td>
                <td>{a.totalScore ?? 'Chưa có'}</td>
                <td>
                  {a.status === 'COMPLETED'
                    ? '✅ Hoàn thành'
                    : a.status === 'IN_PROGRESS'
                    ? '⏳ Đang làm'
                    : '❌ Hết hạn'}
                </td>
                <td>
                  {a.status === 'COMPLETED' && (
                    <button
                      className={cx('btn-view')}
                      onClick={() => handleViewResult(a.userTestId)}
                    >
                      👁 Xem kết quả
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default TestHistoryPage;
