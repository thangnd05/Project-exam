import React, { useEffect, useMemo, useState } from 'react';
import { getProfileOverview, getMyActivity } from '../../api/userApi';
import classNames from 'classnames/bind';
import { Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
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
  IoBookOutline,
  IoFolderOpenOutline,
  IoDesktopOutline,
  IoPencilOutline,
  IoStar,
  IoNewspaperOutline,
  IoBookmarkOutline,
  IoFlagOutline,
  IoTrophyOutline,
  IoRocketOutline,
  IoCompassOutline,
  IoChevronDownOutline,
  IoChevronUpOutline,
} from 'react-icons/io5';
import { getExamTypes } from '~/api/examTypeApi';
import { getExamParts } from '~/api/examPartApi';
import { getUserTarget } from '~/api/userTargetApi';
import { sortPartsByLookup } from '~/utils/partOrder';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import ChangePasswordModal from './modals/ChangePasswordModal';
import UpdateProfileModal from './modals/UpdateProfileModal';
import BaseModal from '~/components/common/modal/BaseModal';
import MyEvaluationsPage from './MyEvaluationsPage';
import MyPostsPage from './MyPostsPage';
import SavedPostsPage from './SavedPostsPage';
import styles from './ProfileOverviewPage.module.scss';
import routes, { buildNextStepPath } from '~/config/Routes';
import AvatarWithCosmetic from '~/components/cosmetic/AvatarWithCosmetic';
import { useCosmetics } from '~/hooks/useCosmetics';

const cx = classNames.bind(styles);

const TARGET_VISIBLE_COUNT = 2;

// Các mục mở bằng modal (thay vì điều hướng sang trang riêng).
const PROFILE_SECTIONS = {
  evaluations: { title: 'Đánh giá của tôi', icon: IoStar, Component: MyEvaluationsPage },
  posts: { title: 'Bài viết của tôi', icon: IoNewspaperOutline, Component: MyPostsPage },
  saved: { title: 'Bài đã lưu', icon: IoBookmarkOutline, Component: SavedPostsPage },
};

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

// "2026-06" -> "Tháng 6/2026"
const formatMonthLabel = (value) => {
  if (!value) return '';
  const [year, month] = value.split('-');
  return `Tháng ${Number(month)}/${year}`;
};

// "2026-06" -> "T6" (gọn cho trục X)
const formatMonthShort = (value) => {
  if (!value) return '';
  const [, month] = value.split('-');
  return `T${Number(month)}`;
};

// 95 -> "1h 35p"; 40 -> "40p"; 0 -> "0p"
const formatDuration = (minutes) => {
  const total = Math.max(0, Math.round(Number(minutes) || 0));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h > 0) return m > 0 ? `${h}h ${m}p` : `${h}h`;
  return `${m}p`;
};

function ProfileOverviewPage() {
  const navigate = useNavigate();
  const { frame: cosmeticFrame, badge: cosmeticBadge } = useCosmetics();
  const [profileOverview, setProfileOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showUpdateProfileModal, setShowUpdateProfileModal] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [myTargets, setMyTargets] = useState([]);
  const [loadingTargets, setLoadingTargets] = useState(true);
  const [showAllTargets, setShowAllTargets] = useState(false);
  const [activity, setActivity] = useState(null);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  const fetchProfileOverview = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setErrorMessage('');

    try {
      const data = await getProfileOverview();
      setProfileOverview(data || null);
    } catch (error) {
      setErrorMessage('Không tải được thông tin hồ sơ. Vui lòng thử lại sau.');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileOverview();
  }, []);

  useEffect(() => {
    const fetchMyTargets = async () => {
      setLoadingTargets(true);
      try {
        const [examTypes, examParts] = await Promise.all([
          getExamTypes().catch(() => []),
          getExamParts().catch(() => []),
        ]);
        if (!Array.isArray(examTypes) || examTypes.length === 0) {
          setMyTargets([]);
          return;
        }
        const partNameById = new Map();
        (examParts || []).forEach((p) => partNameById.set(p.examPartId, p.name));
        const results = await Promise.all(
          examTypes.map((et) =>
            getUserTarget(et.examTypeId)
              .then((data) =>
                data?.hasTarget
                  ? {
                      ...data,
                      examTypeName: et.name,
                      partRequirements: sortPartsByLookup(
                        data.partRequirements || [],
                        examParts,
                      ).map((p) => ({
                        ...p,
                        examPartName: partNameById.get(p.examPartId) || p.examPartId,
                      })),
                    }
                  : null
              )
              .catch(() => null)
          )
        );
        setMyTargets(results.filter(Boolean));
      } catch {
        setMyTargets([]);
      } finally {
        setLoadingTargets(false);
      }
    };
    fetchMyTargets();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchActivity = async () => {
      setLoadingActivity(true);
      try {
        const data = await getMyActivity({
          month: selectedMonth || undefined,
          year: selectedYear || undefined,
        });
        if (cancelled) return;
        setActivity(data || null);
        // Đồng bộ tháng/năm đang chọn theo giá trị backend trả về (lần đầu chưa chọn).
        if (!selectedMonth && data?.month) setSelectedMonth(data.month);
        if (!selectedYear && data?.year) setSelectedYear(data.year);
      } catch {
        if (!cancelled) setActivity(null);
      } finally {
        if (!cancelled) setLoadingActivity(false);
      }
    };
    fetchActivity();
    return () => {
      cancelled = true;
    };
  }, [selectedMonth, selectedYear]);

  const fullName = useMemo(() => {
    if (!profileOverview) return '';
    return profileOverview.fullName || profileOverview.userName || 'Người dùng';
  }, [profileOverview]);

  const activityDays = useMemo(() => activity?.days || [], [activity]);
  const activityHasData = useMemo(
    () => activityDays.some((d) => d.minutes > 0),
    [activityDays]
  );

  const monthlyTimeData = useMemo(
    () =>
      (activity?.monthlyTime || []).map((m) => ({
        ...m,
        label: formatMonthShort(m.month),
      })),
    [activity]
  );
  const monthlyHasData = useMemo(
    () => monthlyTimeData.some((m) => m.minutes > 0),
    [monthlyTimeData]
  );

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
                  <AvatarWithCosmetic
                    src={profileOverview.avatarUrl}
                    alt={fullName}
                    size={110}
                    frame={cosmeticFrame}
                    badge={cosmeticBadge}
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
                    <span>Thẻ ghi nhớ</span>
                  </button>
                  <button onClick={() => navigate(routes.myClasses)} className={cx('actionBtn', 'btnOrange')}>
                    <IoSchoolOutline className={cx('btnIcon')} />
                    <span>Lớp học của tôi</span>
                  </button>
                  <button onClick={() => navigate(routes.personalQuestionBank)} className={cx('actionBtn', 'btnPurple')}>
                    <IoFolderOpenOutline className={cx('btnIcon')} />
                    <span>Ngân hàng câu hỏi</span>
                  </button>
                  <button onClick={() => setActiveSection('evaluations')} className={cx('actionBtn', 'btnYellow')}>
                    <IoStar className={cx('btnIcon')} />
                    <span>Đánh giá của tôi</span>
                  </button>
                  <button onClick={() => setActiveSection('posts')} className={cx('actionBtn', 'btnBlue')}>
                    <IoNewspaperOutline className={cx('btnIcon')} />
                    <span>Bài viết của tôi</span>
                  </button>
                  <button onClick={() => setActiveSection('saved')} className={cx('actionBtn', 'btnGreen')}>
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
                    <span className={cx('statLabel')}>Thẻ ghi nhớ đã lưu</span>
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
                  <div className={cx('chartHeader')}>
                    <h3 className={cx('cardTitle')}>Thời gian làm bài</h3>
                    <select
                      className={cx('monthSelect')}
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      disabled={loadingActivity && !activity}
                    >
                      {(activity?.availableMonths || (selectedMonth ? [selectedMonth] : [])).map((m) => (
                        <option key={m} value={m}>
                          {formatMonthLabel(m)}
                        </option>
                      ))}
                    </select>
                  </div>
                  {activity && (
                    <p className={cx('chartSubtitle')}>
                      {formatDuration(activity.totalMinutes)} làm bài · {activity.activeDays} ngày hoạt động
                    </p>
                  )}
                  <div className={cx('chartContainer')}>
                    {loadingActivity ? (
                      <div className={cx('noDataMessage')}>Đang tải hoạt động...</div>
                    ) : activityHasData ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart
                          data={activityDays}
                          margin={{ top: 10, right: 16, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="day" interval={2} tick={{ fontSize: 11 }} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} unit="p" width={40} />
                          <RechartsTooltip
                            cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                            labelFormatter={(d) => `Ngày ${d}`}
                            formatter={(value) => [formatDuration(value), 'Thời gian']}
                          />
                          <Bar dataKey="minutes" radius={[4, 4, 0, 0]} maxBarSize={28} fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className={cx('noDataMessage')}>Không có hoạt động trong tháng này</div>
                    )}
                  </div>
                </article>

                <article className={cx('chartCard')}>
                  <div className={cx('chartHeader')}>
                    <h3 className={cx('cardTitle')}>Thời gian học theo tháng</h3>
                    <select
                      className={cx('monthSelect')}
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      disabled={loadingActivity && !activity}
                    >
                      {(activity?.availableYears || (selectedYear ? [selectedYear] : [])).map((y) => (
                        <option key={y} value={y}>
                          Năm {y}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={cx('chartContainer')}>
                    {loadingActivity ? (
                      <div className={cx('noDataMessage')}>Đang tải...</div>
                    ) : monthlyHasData ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart
                          data={monthlyTimeData}
                          margin={{ top: 16, right: 24, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="label" interval={0} tick={{ fontSize: 11 }} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} unit="p" width={40} />
                          <RechartsTooltip
                            formatter={(value) => [formatDuration(value), 'Thời gian học']}
                            labelFormatter={(label, items) =>
                              formatMonthLabel(items?.[0]?.payload?.month) || label
                            }
                          />
                          <Line
                            type="monotone"
                            dataKey="minutes"
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className={cx('noDataMessage')}>Chưa có dữ liệu học trong năm này</div>
                    )}
                  </div>
                </article>
              </section>

              <section className={cx('targetRow')}>
                <article className={cx('statCard', 'targetSummaryCard')}>
                  <div className={cx('targetHeader')}>
                    <h3 className={cx('cardTitle')}>
                      <IoFlagOutline />
                      Mục tiêu của tôi
                    </h3>
                    <button
                      type="button"
                      className={cx('targetManageBtn')}
                      onClick={() => navigate(routes.myTarget)}
                    >
                      <IoPencilOutline />
                      Quản lý mục tiêu
                    </button>
                  </div>

                  {loadingTargets ? (
                    <div className={cx('noDataMessage')}>Đang tải mục tiêu...</div>
                  ) : myTargets.length === 0 ? (
                    <div className={cx('targetEmpty')}>
                      <p className={cx('targetEmptyText')}>
                        Bạn chưa đặt mục tiêu nào. Đặt mục tiêu để cá nhân hóa lộ trình học.
                      </p>
                      <button
                        type="button"
                        className={cx('targetEmptyBtn')}
                        onClick={() => navigate(routes.myTarget)}
                      >
                        <IoRocketOutline />
                        Đặt mục tiêu ngay
                      </button>
                    </div>
                  ) : (
                    <div className={cx('targetList')}>
                      {(showAllTargets ? myTargets : myTargets.slice(0, TARGET_VISIBLE_COUNT)).map((target) => {
                        const readiness = Number(target.targetReadiness ?? 0);
                        const isAchieved = Boolean(target.achievedAt);
                        return (
                          <article
                            key={target.userTargetId}
                            className={cx('targetItem', { achieved: isAchieved })}
                          >
                            <div className={cx('targetItemHead')}>
                              <div className={cx('targetItemTitle')}>
                                <span className={cx('targetExamName')}>{target.examTypeName}</span>
                                {isAchieved && (
                                  <span className={cx('targetAchievedBadge')}>
                                    <IoTrophyOutline />
                                    Đã đạt
                                  </span>
                                )}
                              </div>
                              <span className={cx('targetScore')}>
                                {formatNumber(target.targetScore)} điểm
                              </span>
                            </div>

                            <div className={cx('targetProgress')}>
                              <div className={cx('targetProgressBar')}>
                                <div
                                  className={cx('targetProgressFill')}
                                  style={{ width: `${Math.min(100, Math.max(0, readiness))}%` }}
                                />
                              </div>
                              <span className={cx('targetProgressLabel')}>
                                Sẵn sàng: {readiness}%
                              </span>
                            </div>

                            {Array.isArray(target.partRequirements) && target.partRequirements.length > 0 && (
                              <div className={cx('targetParts')}>
                                {target.partRequirements.map((p) => (
                                  <span key={p.examPartId} className={cx('targetPartChip')}>
                                    {p.examPartName || p.examPartId}: {p.requiredPercentage}%
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className={cx('targetActions')}>
                              <button
                                type="button"
                                className={cx('targetActionBtn', 'targetActionBtnPrimary')}
                                onClick={() => navigate(buildNextStepPath(target.examTypeId))}
                              >
                                <IoCompassOutline />
                                Tiếp theo
                              </button>
                              <button
                                type="button"
                                className={cx('targetActionBtn')}
                                onClick={() =>
                                  navigate(
                                    `${routes.targetDashboard}?examTypeId=${encodeURIComponent(target.examTypeId)}`
                                  )
                                }
                              >
                                <IoStatsChartOutline />
                                Dashboard
                              </button>
                              <button
                                type="button"
                                className={cx('targetActionBtn')}
                                onClick={() =>
                                  navigate(
                                    `${routes.generatePlan}?examTypeId=${encodeURIComponent(target.examTypeId)}`
                                  )
                                }
                              >
                                <IoRocketOutline />
                                Sinh lộ trình
                              </button>
                            </div>
                          </article>
                        );
                      })}

                      {myTargets.length > TARGET_VISIBLE_COUNT && (
                        <button
                          type="button"
                          className={cx('targetShowMoreBtn')}
                          onClick={() => setShowAllTargets((prev) => !prev)}
                        >
                          {showAllTargets ? (
                            <>
                              Thu gọn
                              <IoChevronUpOutline />
                            </>
                          ) : (
                            <>
                              Xem thêm {myTargets.length - TARGET_VISIBLE_COUNT} mục tiêu
                              <IoChevronDownOutline />
                            </>
                          )}
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

      {activeSection && (() => {
        const section = PROFILE_SECTIONS[activeSection];
        const SectionComponent = section.Component;
        return (
          <BaseModal
            show
            onClose={() => setActiveSection(null)}
            title={section.title}
            icon={section.icon}
            maxWidth={1040}
          >
            <SectionComponent embedded />
          </BaseModal>
        );
      })()}
    </div>
  );
}

export default ProfileOverviewPage;
