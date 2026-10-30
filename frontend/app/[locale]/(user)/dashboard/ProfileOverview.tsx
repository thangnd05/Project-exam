'use client';

import { useRouter } from '@/app/i18n/navigation';
import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import classNames from 'classnames/bind';
import { CircleAlert, UserRound } from 'lucide-react';
import dynamic from 'next/dynamic';
import ChangePasswordModal from './_components/ChangePasswordModal';
import UpdateProfileModal from './_components/UpdateProfileModal';
import ProfileSectionModal from '@/app/features/posts/ProfileSectionModal/ProfileSectionModal';
import styles from './ProfileOverview.module.scss';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import EmptyState from '@/app/components/EmptyState/EmptyState';
import PageHeader from '@/app/components/PageHeader/PageHeader';
import routes from '@/app/configs/Routes';
import AvatarWithCosmetic from '@/app/features/gamification/cosmetic/AvatarWithCosmetic';
import { useCosmetics } from '@/app/features/gamification/cosmetic/hooks/useCosmetics';
import {
  useProfileOverview,
  useMyTargets,
  useMyActivity,
} from './_hooks/useProfileDashboard';
import { formatDuration, type DashboardT } from './_lib/formatDuration';
import Loading from '@/app/components/Loading/Loading';
import { formatDateTime } from '@/app/utils/format-date-time';

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


const formatNumber = (value: unknown, intlLocale: string) => {
  const safeValue = Number(value) || 0;
  return safeValue.toLocaleString(intlLocale);
};

const formatMonthLabel = (value: string | undefined, t: DashboardT) => {
  if (!value) return '';
  const [year, month] = value.split('-');
  return t('activity.monthLabel', { month: String(Number(month)), year });
};

const formatMonthShort = (value: string | undefined, t: DashboardT) => {
  if (!value) return '';
  const [, month] = value.split('-');
  return t('activity.monthShort', { month: String(Number(month)) });
};

function ProfileOverview() {
  const t = useTranslations('Dashboard');
  const tCommon = useTranslations('Common');
  const intlLocale = useLocale() === 'en' ? 'en-US' : 'vi-VN';
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
    ? t('profile.loadError')
    : '';

  // Chưa chọn tháng/năm thì lấy theo kỳ mà backend trả về (điều chỉnh state ngay khi render).
  if (activity) {
    if (!selectedMonth && activity.month) setSelectedMonth(activity.month);
    if (!selectedYear && activity.year) setSelectedYear(activity.year);
  }

  const fullName = useMemo(() => {
    if (!profileOverview) return '';
    return profileOverview.fullName || profileOverview.userName || t('profile.defaultName');
  }, [profileOverview, t]);

  const activityDays = useMemo(() => activity?.days || [], [activity]);
  const activityHasData = useMemo(
    () => activityDays.some((d) => d.minutes > 0),
    [activityDays]
  );

  const monthlyTimeData = useMemo(
    () =>
      (activity?.monthlyTime || []).map((m) => ({
        ...m,
        label: formatMonthShort(m.month, t),
      })),
    [activity, t]
  );
  const monthlyHasData = useMemo(
    () => monthlyTimeData.some((m) => m.minutes > 0),
    [monthlyTimeData]
  );

  if (loading) {
    return (
      <Loading label={t('profile.loading')} />
    );
  }

  return (
    <div className={cx('wrapper')}>
      <div className={cx('container')}>
        <PageHeader title={t('profile.title')} description={t('profile.subtitle')} />

        {errorMessage && (
          <EmptyState
            tone="danger"
            icon={CircleAlert}
            title={tCommon('loadErrorTitle')}
            description={errorMessage}
            action={
              <ButtonPrime variant="outline" onClick={() => refetchProfileOverview()}>
                {tCommon('error.retry')}
              </ButtonPrime>
            }
          />
        )}

        {!errorMessage && profileOverview && (
          <div className={cx('dashboardGrid')}>

            <aside className={cx('leftCol')}>
              <section className={cx('profileCard')}>
                <div className={cx('avatarWrap')}>
                  <AvatarWithCosmetic
                    src={profileOverview.avatarUrl}
                    name={profileOverview.userName || fullName}
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
                      <span className={cx('metaLabel')}>{t('profile.email')}</span>
                      <span className={cx('metaValue')} title={profileOverview.email || undefined}>
                        {profileOverview.email || '--'}
                      </span>
                    </span>
                    <span className={cx('metaItem')}>
                      <span className={cx('metaLabel')}>{t('profile.role')}</span>
                      {profileOverview.roleName}
                    </span>
                    <span className={cx('metaItem')}>
                      <span className={cx('metaLabel')}>{t('profile.joinedAt')}</span>
                      {formatDateTime(profileOverview.createdAt, '--')}
                    </span>
                    <span className={cx('metaItem')}>
                      <span className={cx('metaLabel')}>{t('profile.status')}</span>
                      <span className={cx({ verifiedText: profileOverview.verified })}>
                        {profileOverview.verified ? t('profile.verified') : t('profile.unverified')}
                      </span>
                    </span>
                  </div>

                  <div className={cx('actionRow')}>
                    <ButtonPrime
                      variant="primary"
                      fullWidth
                      onClick={() => setShowUpdateProfileModal(true)}
                    >
                      {t('profile.updateInfo')}
                    </ButtonPrime>
                    <ButtonPrime
                      variant="outline"
                      fullWidth
                      onClick={() => setShowChangePasswordModal(true)}
                    >
                      {t('profile.changePassword')}
                    </ButtonPrime>
                  </div>
                </div>
              </section>

              <section className={cx('quickActionsCard')}>
                <h3 className={cx('cardTitle')}>{t('quickActions.title')}</h3>
                <div className={cx('quickActionsList')}>
                  <ButtonPrime variant="soft" size="lg" fullWidth className={cx('actionBtn')} onClick={() => router.push(routes.examTypes)}>
                    <span>{t('quickActions.newTest')}</span>
                  </ButtonPrime>
                  <ButtonPrime variant="soft" size="lg" fullWidth className={cx('actionBtn')} onClick={() => router.push(routes.learningPlans)}>
                    <span>{t('quickActions.learningPlans')}</span>
                  </ButtonPrime>
                  <ButtonPrime variant="soft" size="lg" fullWidth className={cx('actionBtn')} onClick={() => router.push(routes.resources)}>
                    <span>{t('quickActions.resources')}</span>
                  </ButtonPrime>
                  {/* Trang chứng chỉ, Thẻ ghi nhớ, Lớp học, Ngân hàng câu hỏi, Bài viết đang tạm ẩn trên web nên ẩn luôn lối tắt. */}
                  {/* <ButtonPrime variant="soft" size="lg" fullWidth className={cx('actionBtn')} onClick={() => router.push(routes.myCertificates)}>
                    <span>{t('quickActions.myCertificates')}</span>
                  </ButtonPrime> */}
                  {/* <ButtonPrime variant="soft" size="lg" fullWidth className={cx('actionBtn')} onClick={() => router.push(routes.myAlbums)}>
                    <span>{t('quickActions.flashcards')}</span>
                  </ButtonPrime>
                  <ButtonPrime variant="soft" size="lg" fullWidth className={cx('actionBtn')} onClick={() => router.push(routes.myClasses)}>
                    <span>{t('quickActions.myClasses')}</span>
                  </ButtonPrime>
                  <ButtonPrime variant="soft" size="lg" fullWidth className={cx('actionBtn')} onClick={() => router.push(routes.personalQuestionBank)}>
                    <span>{t('quickActions.questionBank')}</span>
                  </ButtonPrime>
                  <ButtonPrime variant="soft" size="lg" fullWidth className={cx('actionBtn')} onClick={() => setActiveSection('posts')}>
                    <span>{t('quickActions.myPosts')}</span>
                  </ButtonPrime>
                  <ButtonPrime variant="soft" size="lg" fullWidth className={cx('actionBtn')} onClick={() => setActiveSection('saved')}>
                    <span>{t('quickActions.savedPosts')}</span>
                  </ButtonPrime> */}
                </div>
              </section>
            </aside>

            <main className={cx('rightCol')}>
              <section className={cx('chartsRow')}>
                <article className={cx('chartCard')}>
                  <div className={cx('chartHeader')}>
                    <h3 className={cx('cardTitle')}>{t('activity.testTime')}</h3>
                    <select
                      className={cx('monthSelect')}
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      disabled={loadingActivity && !activity}
                    >
                      {(activity?.availableMonths || (selectedMonth ? [selectedMonth] : [])).map((m) => (
                        <option key={m} value={m}>
                          {formatMonthLabel(m, t)}
                        </option>
                      ))}
                    </select>
                  </div>
                  {activity && (
                    <p className={cx('chartSubtitle')}>
                      {t('activity.summary', {
                        duration: formatDuration(activity.totalMinutes, t),
                        days: activity.activeDays ?? 0,
                      })}
                    </p>
                  )}
                  <div className={cx('chartContainer')}>
                    {loadingActivity ? (
                      <div className={cx('noDataMessage')}>{t('activity.loading')}</div>
                    ) : activityHasData ? (
                      <DailyActivityBar data={activityDays} />
                    ) : (
                      <div className={cx('noDataMessage')}>{t('activity.noActivity')}</div>
                    )}
                  </div>
                </article>

                <article className={cx('chartCard')}>
                  <div className={cx('chartHeader')}>
                    <h3 className={cx('cardTitle')}>{t('activity.monthlyTitle')}</h3>
                    <select
                      className={cx('monthSelect')}
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      disabled={loadingActivity && !activity}
                    >
                      {(activity?.availableYears || (selectedYear ? [selectedYear] : [])).map((y) => (
                        <option key={y} value={y}>
                          {t('activity.yearOption', { year: y })}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={cx('chartContainer')}>
                    {loadingActivity ? (
                      <div className={cx('noDataMessage')}>{tCommon('loading')}</div>
                    ) : monthlyHasData ? (
                      <MonthlyTimeLine data={monthlyTimeData} formatMonthLabel={(value) => formatMonthLabel(value, t)} />
                    ) : (
                      <div className={cx('noDataMessage')}>{t('activity.noYearData')}</div>
                    )}
                  </div>
                </article>
              </section>

              <section className={cx('targetRow')}>
                <article className={cx('statCard', 'targetSummaryCard')}>
                  <div className={cx('targetHeader')}>
                    <h3 className={cx('cardTitle')}>
                      {t('targets.title')}
                    </h3>
                    <ButtonPrime
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(routes.myTarget)}
                    >
                      {t('targets.manage')}
                    </ButtonPrime>
                  </div>

                  {loadingTargets ? (
                    <div className={cx('noDataMessage')}>{t('targets.loading')}</div>
                  ) : myTargets.length === 0 ? (
                    <div className={cx('targetEmpty')}>
                      <p className={cx('targetEmptyText')}>
                        {t('targets.empty')}
                      </p>
                      <ButtonPrime
                        variant="primary"
                        onClick={() => router.push(routes.myTarget)}
                      >
                        {t('targets.setNow')}
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
                                    {t('targets.achieved')}
                                  </span>
                                )}
                              </div>
                              <span className={cx('targetScore')}>
                                {t('targets.score', { score: formatNumber(target.targetScore, intlLocale) })}
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
                                {t('targets.readiness', { pct: readiness })}
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
                                {t('targets.dashboard')}
                              </ButtonPrime>
                              <ButtonPrime
                                variant="outline"
                                size="sm"
                                className={cx('targetActionFlex')}
                                onClick={() =>
                                  router.push(`${routes.generatePlan}?examTypeId=${encodeURIComponent(target.examTypeId ?? '')}`)
                                }
                              >
                                {t('targets.generatePlan')}
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
                            ? t('targets.collapse')
                            : t('targets.showMore', { count: myTargets.length - TARGET_VISIBLE_COUNT })}
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
          <EmptyState icon={UserRound} title={t('profile.noData')} />
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
