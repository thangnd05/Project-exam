'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Row, Col, Spinner } from 'react-bootstrap';
import classNames from 'classnames/bind';
import { motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { TopTestsTable } from '@/app/[locale]/(admin)/_components/ContentInsightsTables';
import { TopCountriesList } from '@/app/[locale]/(admin)/_components/TopCountriesList';
import { AdminPageHeader } from '@/app/[locale]/(admin)/_components/common';
import OverviewCard from '@/app/[locale]/(admin)/_components/OverviewCard';
import {
    useDashboardStats,
    useMonthlyPerformance,
    useContentInsights,
    useTrafficLocations,
} from '@/app/[locale]/(admin)/_hooks/useDashboardStats';

import styles from './Analytics.module.scss';

const cx = classNames.bind(styles);

const MonthlyActivityCombo = dynamic(
    () => import('@/app/[locale]/(admin)/_components/AdminCharts').then((m) => m.MonthlyActivityCombo),
    { ssr: false, loading: () => <Spinner animation="border" size="sm" /> },
);
const MonthlyNewUsersLine = dynamic(
    () => import('@/app/[locale]/(admin)/_components/AdminCharts').then((m) => m.MonthlyNewUsersLine),
    { ssr: false, loading: () => <Spinner animation="border" size="sm" /> },
);
const ExamTypeDonut = dynamic(
    () => import('@/app/[locale]/(admin)/_components/AdminCharts').then((m) => m.ExamTypeDonut),
    { ssr: false, loading: () => <Spinner animation="border" size="sm" /> },
);
const LocationsMap = dynamic(() => import('@/app/[locale]/(admin)/_components/LocationsMap'), {
    ssr: false,
    loading: () => <Spinner animation="border" size="sm" />,
});

type ChartCardProps = {
    icon?: React.ReactNode;
    title: React.ReactNode;
    height?: number | string;
    delay?: number;
    action?: React.ReactNode;
    children?: React.ReactNode;
};

const ChartCard = ({ icon, title, height, delay, action, children }: ChartCardProps) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className={cx('chartCard')}
    >
        <div className={cx('chartHeader')}>
            <h3>{icon}{title}</h3>
            {action}
        </div>
        {height ? <div style={{ width: '100%', height }}>{children}</div> : children}
    </motion.div>
);

type AnalyticsT = ReturnType<typeof useTranslations<'AdminSystem.analytics'>>;

const monthLabel = (t: AnalyticsT, month: string) => {
    const [y, m] = (month || '').split('-');
    return y && m ? t('monthLabel', { month: String(Number(m)), year: y }) : month;
};

// Tên trạng thái do API trả về (tiếng Việt cố định) -> khoá dịch
const STATUS_KEYS: Record<string, 'completed' | 'inProgress' | 'expired'> = {
    'Hoàn thành': 'completed',
    'Đang làm': 'inProgress',
    'Hết hạn': 'expired',
};

const currentMonthKey = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const Analytics = () => {
    const { stats, statusDistribution, isLoading, isError } = useDashboardStats();
    const t = useTranslations('AdminSystem.analytics');
    const tStats = useTranslations('AdminSystem.stats');
    const locale = useLocale();
    const statusData = statusDistribution.map((item) => {
        const key = item.name ? STATUS_KEYS[item.name] : undefined;
        return key ? { ...item, name: t(`status.${key}`) } : item;
    });

    const currentYear = new Date().getFullYear();
    const [perfYear, setPerfYear] = useState(currentYear);
    const { months: monthlyPerformance = [], availableYears } = useMonthlyPerformance(perfYear);

    const [locMonth, setLocMonth] = useState(currentMonthKey);
    const {
        totalVisits: locTotalVisits,
        availableMonths: locAvailableMonths,
        topCountries: locCountries,
    } = useTrafficLocations(locMonth);

    const { topTests = [], topPracticeTests = [] } = useContentInsights();

    const monthOptions = locAvailableMonths.includes(locMonth)
        ? locAvailableMonths
        : [locMonth, ...locAvailableMonths];

    const monthSelect = (
        <select
            className={cx('yearSelect')}
            value={locMonth}
            onChange={(e) => setLocMonth(e.target.value)}
        >
            {monthOptions.map((m) => (
                <option key={m} value={m}>{monthLabel(t, m)}</option>
            ))}
        </select>
    );

    const yearSelect = (
        <select
            className={cx('yearSelect')}
            value={perfYear}
            onChange={(e) => setPerfYear(Number(e.target.value))}
        >
            {availableYears.map((y) => (
                <option key={y} value={y}>{t('yearOption', { year: y })}</option>
            ))}
        </select>
    );

    return (
        <div className={cx('analyticsPage')}>
            <AdminPageHeader
                title={t('title')}
                description={t('description')}
            />

            {isLoading ? (
                <div className={cx('loadingState')}>
                    <Spinner animation="border" variant="primary" />
                    <span>{tStats('loading')}</span>
                </div>
            ) : isError ? (
                <div className={cx('loadingState')}>
                    <span>{tStats('loadError')}</span>
                </div>
            ) : (
                <>
                    <Row className={cx('metricsRow')}>
                        <Col lg={3} md={6}>
                            <OverviewCard
                                value={stats.totalUsers ?? 0}
                                label={t('totalUsers')}
                                delay={0.1}
                            />
                        </Col>
                        <Col lg={3} md={6}>
                            <OverviewCard
                                value={stats.totalClasses ?? 0}
                                label={t('totalClasses')}
                                delay={0.15}
                            />
                        </Col>
                        <Col lg={3} md={6}>
                            <OverviewCard
                                value={stats.totalExamsTaken ?? 0}
                                label={t('totalAttempts')}
                                delay={0.2}
                            />
                        </Col>
                        <Col lg={3} md={6}>
                            <OverviewCard
                                value={stats.totalExamTypes ?? 0}
                                label={t('examTypes')}
                                delay={0.25}
                            />
                        </Col>
                    </Row>

                    <Row className={cx('chartsRow')}>
                        <Col lg={8}>
                            <ChartCard title={t('locationsTitle')} delay={0.3} action={monthSelect}>
                                <div className={cx('monthSummary')}>
                                    <span className={cx('summaryValue')}>{locTotalVisits.toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN')}</span>
                                    <span className={cx('summaryLabel')}>
                                        {locMonth.includes('-')
                                            ? t('publicVisitsInMonth', {
                                                  month: String(Number(locMonth.split('-')[1])),
                                                  year: locMonth.split('-')[0],
                                              })
                                            : t('publicVisits')}
                                    </span>
                                </div>
                                <LocationsMap countries={locCountries} />
                            </ChartCard>
                        </Col>
                        <Col lg={4}>
                            <ChartCard
                                title={t('topCountries')}
                                delay={0.35}
                                action={<span className={cx('monthTag')}>{monthLabel(t, locMonth)}</span>}
                            >
                                <TopCountriesList countries={locCountries} />
                            </ChartCard>
                        </Col>
                    </Row>

                    <Row className={cx('chartsRow')}>
                        <Col lg={12}>
                            <ChartCard
                                title={t('monthlyActivity')}
                                height={360}
                                delay={0.4}
                                action={yearSelect}
                            >
                                <MonthlyActivityCombo data={monthlyPerformance} />
                            </ChartCard>
                        </Col>
                    </Row>

                    <Row className={cx('chartsRow')}>
                        <Col lg={8}>
                            <ChartCard
                                title={t('monthlyNewUsers')}
                                height={300}
                                delay={0.5}
                                action={yearSelect}
                            >
                                <MonthlyNewUsersLine data={monthlyPerformance} />
                            </ChartCard>
                        </Col>
                        <Col lg={4}>
                            <ChartCard title={t('attemptStatus')} height={300} delay={0.55}>
                                <ExamTypeDonut data={statusData} />
                            </ChartCard>
                        </Col>
                    </Row>

                    <Row className={cx('chartsRow')}>
                        <Col lg={6}>
                            <ChartCard title={t('topTests')} delay={0.6}>
                                <TopTestsTable data={topTests} />
                            </ChartCard>
                        </Col>
                        <Col lg={6}>
                            <ChartCard title={t('topPracticeTests')} delay={0.65}>
                                <TopTestsTable data={topPracticeTests} />
                            </ChartCard>
                        </Col>
                    </Row>
                </>
            )}
        </div>
    );
};

export default Analytics;
