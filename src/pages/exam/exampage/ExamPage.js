import { useState, useEffect } from 'react';
import { useAuth } from '~/hook/useAuth';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import classNames from 'classnames/bind';
import styles from './ExamStyle.module.scss';

const cx = classNames.bind(styles);

export default function ExamPage() {
  const { isAuthenticated } = useAuth();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const response = await axios.get('/api/tests/admin'); 
        setTests(response.data);
      } catch (error) {
        console.error('Lỗi khi lấy danh sách test:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, []);

  const handleCardClick = (testId) => {
    if (!isAuthenticated) {
      navigate('/login'); // Chưa login thì chuyển sang trang login
    } else {
      navigate(`/exam/${testId}`); // Đã login thì đi vào chi tiết đề thi
    }
  };

  if (loading) return <p>Đang tải dữ liệu...</p>;

  return (
    <div className={cx('exam-page')}>
      <h1 className={cx('title')}>Trang Đề Thi</h1>
      {tests.length === 0 ? (
        <p className={cx('empty')}>Chưa có đề thi nào từ admin.</p>
      ) : (
        <div className={cx('card-container')}>
          {tests.map((test) => (
            <div
              key={test.testId}
              className={cx('card')}
              onClick={() => handleCardClick(test.testId)}
            >
              {test.bannerUrl && (
                <img
                  src={test.bannerUrl}
                  alt={test.title}
                  className={cx('card-img')}
                />
              )}
              <h3 className={cx('card-title')}>{test.title}</h3>
              <p className={cx('card-text')}>
                Thời gian: {test.durationMinutes || 'Không giới hạn'} phút
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
