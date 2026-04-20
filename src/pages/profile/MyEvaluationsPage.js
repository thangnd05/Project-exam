import React, {useEffect, useState} from 'react';
import axios from 'axios';
import classNames from 'classnames/bind';
import {Alert, Spinner} from 'react-bootstrap';
import {useNavigate} from 'react-router-dom';
import {IoArrowBackOutline, IoCalendarOutline, IoStar} from 'react-icons/io5';
import routes from '~/config/Routes';
import styles from './MyEvaluationsPage.module.scss';

const cx = classNames.bind(styles);

const formatDateTime = (value) => {
  if (!value) return '--';
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return '--';
  return parsedDate.toLocaleString('vi-VN');
};

function MyEvaluationsPage() {
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchMyEvaluations = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await axios.get('/api/evaluations/me');
      setEvaluations(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setErrorMessage('Không tải được danh sách đánh giá. Vui lòng thử lại sau.');
      setEvaluations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyEvaluations();
  }, []);

  return (
    <div className={cx('wrapper')}>
      <div className={cx('container')}>
        <header className={cx('header')}>
          <div>
            <h1 className={cx('title')}>Đánh giá của tôi</h1>
            <p className={cx('subtitle')}>
              Tất cả đánh giá bạn đã gửi cho hệ thống.
            </p>
          </div>
          <button
            type="button"
            className={cx('backBtn')}
            onClick={() => navigate(routes.profile)}
          >
            <IoArrowBackOutline />
            Quay lại profile
          </button>
        </header>

        {loading && (
          <div className={cx('loadingWrap')}>
            <Spinner animation="border" />
            <span>Đang tải đánh giá...</span>
          </div>
        )}

        {!loading && errorMessage && (
          <Alert variant="danger" className={cx('alertBox')}>
            {errorMessage}
          </Alert>
        )}

        {!loading && !errorMessage && evaluations.length === 0 && (
          <Alert variant="info" className={cx('alertBox')}>
            Bạn chưa có đánh giá nào.
          </Alert>
        )}

        {!loading && !errorMessage && evaluations.length > 0 && (
          <div className={cx('list')}>
            {evaluations.map((evaluation) => (
              <article key={evaluation.id} className={cx('item')}>
                <div className={cx('itemHeader')}>
                  <div className={cx('stars')}>
                    {Array.from({length: 5}).map((_, index) => (
                      <IoStar
                        key={`${evaluation.id}-star-${index}`}
                        className={cx(
                          index < Number(evaluation.rating || 0)
                            ? 'starActive'
                            : 'starInactive',
                        )}
                      />
                    ))}
                  </div>
                  <span className={cx('date')}>
                    <IoCalendarOutline />
                    {formatDateTime(evaluation.createdAt)}
                  </span>
                </div>
                <p className={cx('content')}>{evaluation.content || '--'}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyEvaluationsPage;
