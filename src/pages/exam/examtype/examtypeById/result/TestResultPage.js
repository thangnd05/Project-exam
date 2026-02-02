import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Spinner, Alert } from 'react-bootstrap';
import classNames from 'classnames/bind';
import {
  IoCheckmarkCircle,
  IoHomeOutline,
  IoStatsChartOutline,
  IoTimeOutline,
  IoSchoolOutline,
  IoChevronForwardOutline
} from 'react-icons/io5';

import styles from './TestResultPage.module.scss';

const cx = classNames.bind(styles);

const TestResultPage = () => {
  const { userTestId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await axios.get(`/api/user-tests/${userTestId}/result`);
        setResult(res.data);
      } catch (err) {
        console.error('❌ Lỗi tải kết quả:', err);
        setError('Không thể tải kết quả bài thi này 😢');
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [userTestId]);

  if (loading) return (
    <div className={cx('wrapper')}>
      <Container className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 fw-bold text-primary">Đang tổng hợp điểm số của bạn...</p>
      </Container>
    </div>
  );

  if (error) return (
    <div className={cx('wrapper')}>
      <Container>
        <Alert variant="danger" className="rounded-xl shadow-sm">{error}</Alert>
        <button className="btn btn-primary rounded-pill mt-3" onClick={() => navigate('/')}>Quay lại trang chủ</button>
      </Container>
    </div>
  );

  return (
    <div className={cx('wrapper')}>
      <Container>
        <div className={cx('result-card')}>
          <div className={cx('icon-success')}>
            <IoCheckmarkCircle />
          </div>

          <h1>Chúc mừng bạn đã hoàn thành!</h1>
          <p className={cx('subtitle')}>
            Hệ thống đã ghi nhận nỗ lực của bạn trong bài thi <strong>"{result?.testTitle || 'Luyện tập'}"</strong>
          </p>

          <div className={cx('score-display')}>
            <span className={cx('label')}>Điểm số đạt được</span>
            <div className={cx('points')}>
              {result?.totalScore || location.state?.score || 0}
              <span className={cx('unit')}>điểm</span>
            </div>
          </div>

          <div className={cx('stats-grid')}>
            <div className={cx('stat-item')}>
              <IoTimeOutline size={24} color="#6366f1" />
              <span className={cx('stat-val')}>-{/* Nếu có data về thời gian làm bài thì thêm vào đây */}--</span>
              <span className={cx('stat-label')}>Thời gian làm</span>
            </div>
            <div className={cx('stat-item')}>
              <IoStatsChartOutline size={24} color="#f59e0b" />
              <span className={cx('stat-val')}># {userTestId}</span>
              <span className={cx('stat-label')}>Số hiệu bài thi</span>
            </div>
          </div>

          <div className={cx('actions')}>
            <button className={cx('btn-home')} onClick={() => navigate('/')}>
              <IoHomeOutline size={20} />
              Về trang chủ
              <IoChevronForwardOutline />
            </button>

            <button className={cx('btn-review')} onClick={() => navigate('/my-test')}>
              <IoSchoolOutline size={20} />
              Xem lịch sử bài thi khác
            </button>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default TestResultPage;
