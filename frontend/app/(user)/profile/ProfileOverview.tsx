'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames/bind';
import { Alert, Spinner } from 'react-bootstrap';
import { IoClipboardOutline, IoLockClosedOutline, IoSchoolOutline, IoStatsChartOutline } from 'react-icons/io5';
import dynamic from 'next/dynamic';
import ChangePasswordModal from './_components/ChangePasswordModal';
import UpdateProfileModal from './_components/UpdateProfileModal';
import ProfileSectionModal from '@/app/components/ProfileSectionModal/ProfileSectionModal';
import styles from './ProfileOverview.module.scss';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import routes from '@/app/configs/Routes';
import AvatarWithCosmetic from '@/app/components/gamification/cosmetic/AvatarWithCosmetic';
import { useCosmetics } from '@/app/hooks/useCosmetics';
import {
  useProfileOverview,
  useMyTargets,
  useMyActivity,
} from './_hooks/useProfileDashboard';

const cx = classNames.bind(styles);

const DailyActivityBar = dynamic(
  () => import('./_components/ProfileActivityCharts').then((m) => m.DailyActivityBar),
  { ssr: false },
);
const MonthlyTimeLine = dynamic(
  () => import('./_components/ProfileActivityCharts').then((m) => m.MonthlyTimeLine),
  { ssr: false },
);

const TARGET_VISIBLE_COUNT = 2;

const formatDateTime = (value?: string | null) => {
  if (!value) return '--';
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return '--';
  return parsedDate.toLocaleString('vi-VN');
};

const formatNumber = (value: unknown) => {
  const safeValue = Number(value) || 0;
  return safeValue.toLocaleString('vi-VN');
};

const formatMonthLabel = (value?: string) => {
  if (!value) return '';
  const [year, month] = value.split('-');
  return `Tháng ${Number(month)}/${year}`;
};

const formatMonthShort = (value?: string) => {
  if (!value) return '';
  const [, month] = value.split('-');
  return `T${Number(month)}`;
};

const formatDuration = (minutes: unknown) => {
  const total = Math.max(0, Math.round(Number(minutes) || 0));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h > 0) return m > 0 ? `${h}h ${m}p` : `${h}h`;
  return `${m}p`;
};

function ProfileOverview() {
  const router = useRouter();
  const { frame: cosmeticFrame, badge: cosmeticBadge } = useCosmetics();
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showUpdateProfileModal, setShowUpdateProfileModal] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showAllTargets, setShowAllTargets] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  const {
    profileOverview,
    isLoading: loading,
    isError: profileError,
    refetch: refetchProfileOverview,
  } = useProfileOverview();
  const { myTargets, loadingTargets } = useMyTargets();
  const { activity, loadingActivity } = useMyActivity(selectedMonth, selectedYear);

  const errorMessage = profileError
    ? 'Không tải được thông tin hồ sơ. Vui lòng thử lại sau.'
    : '';

  useEffect(() => {
    if (!activity) return;
    if (!selectedMonth && activity.month) setSelectedMonth(activity.month);
    if (!selectedYear && activity.year) setSelectedYear(activity.year);
  }, [activity, selectedMonth, selectedYear]);

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
                    <span className={cx('metaItem')}>
                      <span className={cx('metaLabel')}>Email</span>
                      {profileOverview.email || '--'}
                    </span>
                    <span className={cx('metaItem')}>
                      <span className={cx('metaLabel')}>Vai trò</span>
                      {profileOverview.roleName}
                    </span>
                    <span className={cx('metaItem')}>
                      <span className={cx('metaLabel')}>Ngày tham gia</span>
                      {formatDateTime(profileOverview.createdAt)}
                    </span>
                    <span className={cx('metaItem')}>
                      <span className={cx('metaLabel')}>Trạng thái</span>
                      <span className={cx({ verifiedText: profileOverview.verified })}>
                        {profileOverview.verified ? 'Đã xác minh' : 'Chưa xác minh'}
                      </span>
                    </span>
                  </div>

                  <div className={cx('actionRow')}>
                    <ButtonPrime
                      variant="primary"
                      fullWidth
                      onClick={() => setShowUpdateProfileModal(true)}
                    >
                      Cập nhật thông tin
                    </ButtonPrime>
                    <ButtonPrime
                      variant="outline"
                      fullWidth
                      onClick={() => setShowChangePasswordModal(true)}
                    >
                      <IoLockClosedOutline />
                      Đổi mật khẩu
                    </ButtonPrime>
                  </div>
                </div>
              </section>

              <section className={cx('quickActionsCard')}>
                <h3 className={cx('cardTitle')}>Truy cập nhanh</h3>
                <div className={cx('quickActionsList')}>
                  <button onClick={() => router.push(routes.home)} className={cx('actionBtn')}>
                    <span>Làm bài thi mới</span>
                  </button>
                  <button onClick={() => router.push(routes.myAlbums)} className={cx('actionBtn')}>
                    <span>Thẻ ghi nhớ</span>
                  </button>
                  <button onClick={() => router.push(routes.myClasses)} className={cx('actionBtn')}>
                    <span>Lớp học của tôi</span>
                  </button>
                  <button onClick={() => router.push(routes.personalQuestionBank)} className={cx('actionBtn')}>
                    <span>Ngân hàng câu hỏi</span>
                  </button>
                  <button onClick={() => setActiveSection('evaluations')} className={cx('actionBtn')}>
                    <span>Đánh giá của tôi</span>
                  </button>
                  <button onClick={() => setActiveSection('posts')} className={cx('actionBtn')}>
                    <span>Bài viết của tôi</span>
                  </button>
                  <button onClick={() => setActiveSection('saved')} className={cx('actionBtn')}>
                    <span>Bài đã lưu</span>
                  </button>
                </div>
              </section>
            </aside>

            <main className={cx('rightCol')}>
              <section className={cx('statsRow')}>
                <article className={cx('statCard', 'statCardCompact')}>
                  <div className={cx('statIconWrap')}>
                    <IoStatsChartOutline />
                  </div>
                  <div className={cx('statInfo')}>
                    <span className={cx('statLabel')}>Tổng bài làm</span>
                    <strong className={cx('statValue')}>{formatNumber(profileOverview.testStats?.totalAttempts)}</strong>
                  </div>
                </article>

                <article className={cx('statCard', 'statCardCompact')}>
                  <div className={cx('statIconWrap')}>
                    <IoClipboardOutline />
                  </div>
                  <div className={cx('statInfo')}>
                    <span className={cx('statLabel')}>Thẻ ghi nhớ đã lưu</span>
                    <strong className={cx('statValue')}>{formatNumber(profileOverview.vocabularyStats?.totalVocabulary)}</strong>
                  </div>
                </article>

                <article className={cx('statCard', 'statCardCompact')}>
                  <div className={cx('statIconWrap')}>
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
                      <DailyActivityBar data={activityDays} />
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
                      <MonthlyTimeLine data={monthlyTimeData} formatMonthLabel={formatMonthLabel} />
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
                      Mục tiêu của tôi
                    </h3>
                    <ButtonPrime
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(routes.myTarget)}
                    >
                      Quản lý mục tiêu
                    </ButtonPrime>
                  </div>

                  {loadingTargets ? (
                    <div className={cx('noDataMessage')}>Đang tải mục tiêu...</div>
                  ) : myTargets.length === 0 ? (
                    <div className={cx('targetEmpty')}>
                      <p className={cx('targetEmptyText')}>
                        Bạn chưa đặt mục tiêu nào. Đặt mục tiêu để cá nhân hóa lộ trình học.
                      </p>
                      <ButtonPrime
                        variant="primary"
                        onClick={() => router.push(routes.myTarget)}
                      >
                        Đặt mục tiêu ngay
                      </ButtonPrime>
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
                              <ButtonPrime
                                variant="primary"
                                size="sm"
                                className={cx('targetActionFlex')}
                                onClick={() =>
                                  router.push(`${routes.targetDashboard}?examTypeId=${encodeURIComponent(target.examTypeId ?? '')}`)
                                }
                              >
                                Dashboard
                              </ButtonPrime>
                              <ButtonPrime
                                variant="outline"
                                size="sm"
                                className={cx('targetActionFlex')}
                                onClick={() =>
                                  router.push(`${routes.generatePlan}?examTypeId=${encodeURIComponent(target.examTypeId ?? '')}`)
                                }
                              >
                                Sinh lộ trình
                              </ButtonPrime>
                            </div>
                          </article>
                        );
                      })}

                      {myTargets.length > TARGET_VISIBLE_COUNT && (
                        <ButtonPrime
                          variant="ghost"
                          size="sm"
                          className={cx('targetShowMore')}
                          onClick={() => setShowAllTargets((prev) => !prev)}
                        >
                          {showAllTargets
                            ? 'Thu gọn'
                            : `Xem thêm ${myTargets.length - TARGET_VISIBLE_COUNT} mục tiêu`}
                        </ButtonPrime>
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
        onUpdateSuccess={() => refetchProfileOverview()}
      />

      <ChangePasswordModal
        show={showChangePasswordModal}
        onHide={() => setShowChangePasswordModal(false)}
      />

      <ProfileSectionModal section={activeSection} onClose={() => setActiveSection(null)} />
    </div>
  );
}

export default ProfileOverview;
