import React, { useEffect, useMemo, useState } from 'react';
import axios from '../../api/axiosClient';
import classNames from 'classnames/bind';
import { Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  IoCalendarOutline,
  IoChevronForwardOutline,
  IoCheckmarkCircleOutline,
  IoClipboardOutline,
  IoLayersOutline,
  IoMailOutline,
  IoLockClosedOutline,
  IoPersonCircleOutline,
  IoSchoolOutline,
  IoStatsChartOutline,
  IoBookOutline,
  IoFolderOpenOutline,
  IoDesktopOutline,
  IoPencilOutline,
  IoStar,
  IoNewspaperOutline,
  IoBookmarkOutline
} from 'react-icons/io5';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import ChangePasswordModal from '~/components/modals/ChangePasswordModal';
import UpdateProfileModal from '~/components/modals/UpdateProfileModal';
import styles from './ProfileOverviewPage.module.scss';
import routes from '~/config/Routes';

const cx = classNames.bind(styles);

const formatDateTime = (value) => {
  if (!value) return '--';
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return '--';
  return parsedDate.toLocaleString('vi-VN');
};

const formatNumber = (value) => {
  const safeValue = Number(value) || 0;
  return safeValue.toLocaleString('vi-VN');
};

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444'];

function ProfileOverviewPage() {
  const navigate = useNavigate();
  const [profileOverview, setProfileOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showUpdateProfileModal, setShowUpdateProfileModal] = useState(false);
  const [myEvaluations, setMyEvaluations] = useState([]);
  const [loadingEvaluations, setLoadingEvaluations] = useState(true);
  const PREVIEW_EVALUATION_COUNT = 3;

  const fetchProfileOverview = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setErrorMessage('');

    try {
      const response = await axios.get('/api/users/me/profile-overview');
      setProfileOverview(response.data || null);
    } catch (error) {
      setErrorMessage('Không tải được thông tin hồ sơ. Vui lòng thử lại sau.');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileOverview();
  }, []);

  const fetchMyEvaluations = async () => {
    setLoadingEvaluations(true);
    try {
      const response = await axios.get('/api/evaluations/me');
      setMyEvaluations(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setMyEvaluations([]);
    } finally {
      setLoadingEvaluations(false);
    }
  };

  useEffect(() => {
    fetchMyEvaluations();
  }, []);

  const fullName = useMemo(() => {
    if (!profileOverview) return '';
    return profileOverview.fullName || profileOverview.userName || 'Người dùng';
  }, [profileOverview]);

  const vocabData = useMemo(() => {
    if (!profileOverview?.vocabularyStats) return [];
    return [
      { name: 'Đã ghi nhớ', value: profileOverview.vocabularyStats.masteredVocabulary || 0 },
      { name: 'Đang học', value: profileOverview.vocabularyStats.learningVocabulary || 0 }
    ];
  }, [profileOverview]);

  const testData = useMemo(() => {
    if (!profileOverview?.testStats) return [];
    return [
      { name: 'Hoàn thành', value: profileOverview.testStats.completedAttempts || 0 },
      { name: 'Chưa hoàn thành', value: profileOverview.testStats.inProgressAttempts || 0 }
    ];
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
            Dashboard Cá Nhân
          </h1>
          <p className={cx('subtitle')}>
            Tổng quan thông tin tài khoản và phân tích tiến độ học tập.
          </p>
        </header>

        {errorMessage && (
          <Alert variant="danger" className={cx('alertBox')}>
            {errorMessage}
          </Alert>
        )}

        {!errorMessage && profileOverview && (
          <div className={cx('dashboardGrid')}>
            {/* LÊN LEFT SIDE (CỘT NHỎ) */}
            <aside className={cx('leftCol')}>
              <section className={cx('profileCard')}>
                <div className={cx('avatarWrap')}>
                  <img
                    src={profileOverview.avatarUrl}
                    alt={fullName}
                    className={cx('avatar')}
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className={cx('profileContent')}>
                  <h2 className={cx('name')}>{fullName}</h2>
                  <p className={cx('username')}>@{profileOverview.userName}</p>

                  <div className={cx('metaList')}>
                    <span className={cx('metaItem')} title="Email">
                      <IoMailOutline /> {profileOverview.email || '--'}
                    </span>
                    <span className={cx('metaItem')} title="Vai trò">
                      <IoLayersOutline /> {profileOverview.roleName}
                    </span>
                    <span className={cx('metaItem')} title="Ngày tham gia">
                      <IoCalendarOutline /> {formatDateTime(profileOverview.createdAt)}
                    </span>
                    <span className={cx('metaItem')} title="Trạng thái xác minh">
                      <IoCheckmarkCircleOutline className={cx({ verifiedIcon: profileOverview.verified })} />
                      {profileOverview.verified ? 'Đã xác minh' : 'Chưa xác minh'}
                    </span>
                  </div>

                  <div className={cx('actionRow')}>
                    <button
                      type="button"
                      className={cx('changePasswordBtn')}
                      onClick={() => setShowUpdateProfileModal(true)}
                    >
                      <IoPencilOutline />
                      Cập nhật thông tin
                    </button>
                    <button
                      type="button"
                      className={cx('changePasswordBtn', 'secondaryBtn')}
                      onClick={() => setShowChangePasswordModal(true)}
                    >
                      <IoLockClosedOutline />
                      Đổi mật khẩu
                    </button>
                  </div>
                </div>
              </section>

              <section className={cx('quickActionsCard')}>
                <h3 className={cx('cardTitle')}>Truy cập nhanh</h3>
                <div className={cx('quickActionsList')}>
                  <button onClick={() => navigate(routes.home)} className={cx('actionBtn', 'btnBlue')}>
                    <IoDesktopOutline className={cx('btnIcon')} />
                    <span>Làm bài thi mới</span>
                  </button>
                  <button onClick={() => navigate(routes.myAlbums)} className={cx('actionBtn', 'btnGreen')}>
                    <IoBookOutline className={cx('btnIcon')} />
                    <span>Học từ vựng</span>
                  </button>
                  <button onClick={() => navigate(routes.myClasses)} className={cx('actionBtn', 'btnOrange')}>
                    <IoSchoolOutline className={cx('btnIcon')} />
                    <span>Lớp học của tôi</span>
                  </button>
                  <button onClick={() => navigate(routes.personalQuestionBank)} className={cx('actionBtn', 'btnPurple')}>
                    <IoFolderOpenOutline className={cx('btnIcon')} />
                    <span>Ngân hàng câu hỏi</span>
                  </button>
                  <button onClick={() => navigate(routes.myEvaluations)} className={cx('actionBtn', 'btnYellow')}>
                    <IoStar className={cx('btnIcon')} />
                    <span>Đánh giá của tôi</span>
                  </button>
                  <button onClick={() => navigate(routes.myPosts)} className={cx('actionBtn', 'btnBlue')}>
                    <IoNewspaperOutline className={cx('btnIcon')} />
                    <span>Bài viết của tôi</span>
                  </button>
                  <button onClick={() => navigate(routes.savedPosts)} className={cx('actionBtn', 'btnGreen')}>
                    <IoBookmarkOutline className={cx('btnIcon')} />
                    <span>Bài đã lưu</span>
                  </button>
                </div>
              </section>
            </aside>

            {/* LÊN RIGHT SIDE (CỘT LỚN) */}
            <main className={cx('rightCol')}>
              <section className={cx('statsRow')}>
                <article className={cx('statCard', 'statCardCompact')}>
                  <div className={cx('statIconWrap', 'bgBlue')}>
                    <IoStatsChartOutline />
                  </div>
                  <div className={cx('statInfo')}>
                    <span className={cx('statLabel')}>Tổng bài làm</span>
                    <strong className={cx('statValue')}>{formatNumber(profileOverview.testStats?.totalAttempts)}</strong>
                  </div>
                </article>

                <article className={cx('statCard', 'statCardCompact')}>
                  <div className={cx('statIconWrap', 'bgGreen')}>
                    <IoClipboardOutline />
                  </div>
                  <div className={cx('statInfo')}>
                    <span className={cx('statLabel')}>Từ vựng đã lưu</span>
                    <strong className={cx('statValue')}>{formatNumber(profileOverview.vocabularyStats?.totalVocabulary)}</strong>
                  </div>
                </article>

                <article className={cx('statCard', 'statCardCompact')}>
                  <div className={cx('statIconWrap', 'bgOrange')}>
                    <IoSchoolOutline />
                  </div>
                  <div className={cx('statInfo')}>
                    <span className={cx('statLabel')}>Lớp học hiện tại</span>
                    <strong className={cx('statValue')}>{formatNumber(profileOverview.classStats?.approvedClassCount)}</strong>
                  </div>
                </article>
              </section>

              <section className={cx('chartsRow')}>
                <article className={cx('chartCard')}>
                  <h3 className={cx('cardTitle')}>Tiến độ từ vựng</h3>
                  <div className={cx('chartContainer')}>
                    {vocabData.reduce((acc, curr) => acc + curr.value, 0) > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={vocabData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            label
                          >
                            {vocabData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className={cx('noDataMessage')}>Chưa có dữ liệu từ vựng</div>
                    )}
                  </div>
                </article>

                <article className={cx('chartCard')}>
                  <h3 className={cx('cardTitle')}>Thống kê bài thi</h3>
                  <div className={cx('chartContainer')}>
                    {testData.reduce((acc, curr) => acc + curr.value, 0) > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart
                          data={testData}
                          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" />
                          <YAxis allowDecimals={false} />
                          <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={60}>
                            {testData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className={cx('noDataMessage')}>Chưa có dữ liệu bài thi</div>
                    )}
                  </div>
                </article>
              </section>

              <section className={cx('detailsRow')}>
                <article className={cx('statCard')}>
                  <h3 className={cx('cardTitle')}>
                    <IoStar />
                    Đánh giá của bạn
                  </h3>

                  {loadingEvaluations ? (
                    <div className={cx('noDataMessage')}>Đang tải đánh giá...</div>
                  ) : myEvaluations.length === 0 ? (
                    <div className={cx('noDataMessage')}>Bạn chưa gửi đánh giá nào.</div>
                  ) : (
                    <div className={cx('evaluationList')}>
                      {myEvaluations
                        .slice(0, PREVIEW_EVALUATION_COUNT)
                        .map((evaluation) => (
                          <article key={evaluation.id} className={cx('evaluationItem')}>
                            <div className={cx('evaluationHeader')}>
                              <div className={cx('evaluationStars')}>
                                {Array.from({ length: 5 }).map((_, index) => (
                                  <IoStar
                                    key={`${evaluation.id}-star-${index}`}
                                    className={cx(
                                      index < Number(evaluation.rating || 0)
                                        ? 'evaluationStarActive'
                                        : 'evaluationStarInactive'
                                    )}
                                  />
                                ))}
                              </div>
                              <span className={cx('evaluationDate')}>
                                {formatDateTime(evaluation.createdAt)}
                              </span>
                            </div>
                            <p className={cx('evaluationContent')}>
                              {evaluation.content || '--'}
                            </p>
                          </article>
                        ))}
                      {myEvaluations.length > PREVIEW_EVALUATION_COUNT && (
                        <button
                          type="button"
                          className={cx('viewAllEvaluationsBtn')}
                          onClick={() => navigate(routes.myEvaluations)}
                        >
                          Xem tất cả {formatNumber(myEvaluations.length)} đánh giá
                          <IoChevronForwardOutline />
                        </button>
                      )}
                    </div>
                  )}
                </article>
              </section>

            </main>
          </div>
        )}

        {!errorMessage && !profileOverview && (
          <Alert variant="info" className={cx('alertBox')}>
            Không có dữ liệu hồ sơ để hiển thị.
          </Alert>
        )}
      </div>

      <UpdateProfileModal
        show={showUpdateProfileModal}
        onHide={() => setShowUpdateProfileModal(false)}
        onUpdateSuccess={() => fetchProfileOverview(false)}
      />

      <ChangePasswordModal
        show={showChangePasswordModal}
        onHide={() => setShowChangePasswordModal(false)}
      />
    </div>
  );
}

export default ProfileOverviewPage;
