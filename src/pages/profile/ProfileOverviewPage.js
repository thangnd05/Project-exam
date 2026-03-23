import React, {useEffect, useMemo, useState} from 'react';
import axios from 'axios';
import classNames from 'classnames/bind';
import {Alert, Spinner} from 'react-bootstrap';
import {Link} from 'react-router-dom';
import {
  IoCalendarOutline,
  IoCheckmarkCircleOutline,
  IoClipboardOutline,
  IoLayersOutline,
  IoMailOutline,
  IoLockClosedOutline,
  IoPersonCircleOutline,
  IoSchoolOutline,
  IoStatsChartOutline,
} from 'react-icons/io5';
import routes from '~/config/Routes';
import styles from './ProfileOverviewPage.module.scss';

const cx = classNames.bind(styles);

const formatDateTime = (value) => {
  if (!value) {
    return '--';
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return '--';
  }

  return parsedDate.toLocaleString('vi-VN');
};

const formatNumber = (value) => {
  const safeValue = Number(value) || 0;
  return safeValue.toLocaleString('vi-VN');
};

const safeAverage = (value) => {
  if (value === null || value === undefined) {
    return '--';
  }

  return Number(value).toLocaleString('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

function ProfileOverviewPage() {
  const [profileOverview, setProfileOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchProfileOverview = async () => {
      setLoading(true);
      setErrorMessage('');

      try {
        const response = await axios.get('/api/users/me/profile-overview');
        setProfileOverview(response.data || null);
      } catch (error) {
        setErrorMessage('Không tải được thông tin hồ sơ. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileOverview();
  }, []);

  const fullName = useMemo(() => {
    if (!profileOverview) {
      return '';
    }

    return profileOverview.fullName || profileOverview.userName || 'Người dùng';
  }, [profileOverview]);

  if (loading) {
    return (
      <div className={cx('loadingWrap')}>
        <Spinner animation="border" />
        <span>Đang tải hồ sơ...</span>
      </div>
    );
  }

  return (
    <div className={cx('wrapper')}>
      <div className={cx('container')}>
        <header className={cx('header')}>
          <h1 className={cx('title')}>
            <IoPersonCircleOutline className={cx('titleIcon')} />
            Hồ sơ cá nhân
          </h1>
          <p className={cx('subtitle')}>
            Tổng quan thông tin tài khoản và hoạt động gần đây.
          </p>
        </header>

        {errorMessage && (
          <Alert variant="danger" className={cx('alertBox')}>
            {errorMessage}
          </Alert>
        )}

        {!errorMessage && profileOverview && (
          <>
            <section className={cx('profileCard')}>
              <div className={cx('avatarWrap')}>
                <img
                  src={profileOverview.avatarUrl}
                  alt={fullName}
                  className={cx('avatar')}
                />
              </div>

              <div className={cx('profileContent')}>
                <h2 className={cx('name')}>{fullName}</h2>
                <p className={cx('username')}>@{profileOverview.userName}</p>

                <div className={cx('metaList')}>
                  <span className={cx('metaItem')}>
                    <IoMailOutline />
                    {profileOverview.email || '--'}
                  </span>
                  <span className={cx('metaItem')}>
                    <IoLayersOutline />
                    Vai trò: {profileOverview.roleId ?? '--'}
                  </span>
                  <span className={cx('metaItem')}>
                    <IoCalendarOutline />
                    Tham gia: {formatDateTime(profileOverview.createdAt)}
                  </span>
                  <span className={cx('metaItem')}>
                    <IoCheckmarkCircleOutline />
                    {profileOverview.verified
                      ? 'Tài khoản đã xác minh'
                      : 'Tài khoản chưa xác minh'}
                  </span>
                </div>

                <div className={cx('actionRow')}>
                  <Link to={routes.forgot} className={cx('changePasswordBtn')}>
                    <IoLockClosedOutline />
                    Đổi mật khẩu
                  </Link>
                </div>
              </div>
            </section>

            <section className={cx('statsGrid')}>
              <article className={cx('statCard')}>
                <h3 className={cx('cardTitle')}>
                  <IoStatsChartOutline />
                  Thống kê bài kiểm tra
                </h3>

                <div className={cx('statRows')}>
                  <div className={cx('statRow')}>
                    <span>Tổng lượt làm</span>
                    <strong>
                      {formatNumber(profileOverview.testStats?.totalAttempts)}
                    </strong>
                  </div>
                  <div className={cx('statRow')}>
                    <span>Đã hoàn thành</span>
                    <strong>
                      {formatNumber(profileOverview.testStats?.completedAttempts)}
                    </strong>
                  </div>
                  <div className={cx('statRow')}>
                    <span>Đang làm dở</span>
                    <strong>
                      {formatNumber(profileOverview.testStats?.inProgressAttempts)}
                    </strong>
                  </div>
                  <div className={cx('statRow')}>
                    <span>Điểm cao nhất</span>
                    <strong>{formatNumber(profileOverview.testStats?.bestScore)}</strong>
                  </div>
                  <div className={cx('statRow')}>
                    <span>Điểm trung bình</span>
                    <strong>{safeAverage(profileOverview.testStats?.averageScore)}</strong>
                  </div>
                  <div className={cx('statRow')}>
                    <span>Lần làm gần nhất</span>
                    <strong>
                      {formatDateTime(profileOverview.testStats?.lastAttemptAt)}
                    </strong>
                  </div>
                </div>
              </article>

              <article className={cx('statCard')}>
                <h3 className={cx('cardTitle')}>
                  <IoClipboardOutline />
                  Thống kê từ vựng
                </h3>

                <div className={cx('statRows')}>
                  <div className={cx('statRow')}>
                    <span>Tổng từ vựng</span>
                    <strong>
                      {formatNumber(profileOverview.vocabularyStats?.totalVocabulary)}
                    </strong>
                  </div>
                  <div className={cx('statRow')}>
                    <span>Đang học</span>
                    <strong>
                      {formatNumber(profileOverview.vocabularyStats?.learningVocabulary)}
                    </strong>
                  </div>
                  <div className={cx('statRow')}>
                    <span>Đã ghi nhớ</span>
                    <strong>
                      {formatNumber(profileOverview.vocabularyStats?.masteredVocabulary)}
                    </strong>
                  </div>
                </div>
              </article>

              <article className={cx('statCard')}>
                <h3 className={cx('cardTitle')}>
                  <IoSchoolOutline />
                  Thống kê lớp học
                </h3>

                <div className={cx('statRows')}>
                  <div className={cx('statRow')}>
                    <span>Lớp đã duyệt</span>
                    <strong>
                      {formatNumber(profileOverview.classStats?.approvedClassCount)}
                    </strong>
                  </div>
                  <div className={cx('statRow')}>
                    <span>Lớp chờ duyệt</span>
                    <strong>
                      {formatNumber(profileOverview.classStats?.pendingClassCount)}
                    </strong>
                  </div>
                </div>
              </article>
            </section>
          </>
        )}

        {!errorMessage && !profileOverview && (
          <Alert variant="info" className={cx('alertBox')}>
            Không có dữ liệu hồ sơ để hiển thị.
          </Alert>
        )}
      </div>
    </div>
  );
}

export default ProfileOverviewPage;
