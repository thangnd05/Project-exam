'use client';

import { useState } from 'react';
import { Row, Col, Spinner } from 'react-bootstrap';
import classNames from 'classnames/bind';
import { motion } from 'framer-motion';
import {
    MonthlyActivityCombo,
    MonthlyNewUsersLine,
    ExamTypeDonut,
} from '../components/AdminCharts';
import { TopTestsTable } from '../components/ContentInsightsTables';
import LocationsMap, { TopCountriesList } from '../components/LocationsMap';
import { AdminPageHeader } from '../components/common';
import OverviewCard from './OverviewCard';
import {
    useDashboardStats,
    useMonthlyPerformance,
    useContentInsights,
    useTrafficLocations,
} from '@/app/features/admin/overview/hooks/useDashboardStats';

import styles from './AnalyticsPage.module.scss';

const cx = classNames.bind(styles);

const ChartCard = ({ icon, title, height, delay, action, children }) => (
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

const monthLabel = (month) => {
    const [y, m] = (month || '').split('-');
    return y && m ? `Tháng ${Number(m)}/${y}` : month;
};

const currentMonthKey = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const AnalyticsPage = () => {
    const { stats, statusDistribution, isLoading, isError } = useDashboardStats();

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
                <option key={m} value={m}>{monthLabel(m)}</option>
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
                <option key={y} value={y}>Năm {y}</option>
            ))}
        </select>
    );

    return (
        <div className={cx('analyticsPage')}>
            <AdminPageHeader
                title="Thống kê & Phân tích"
                description="Phân tích chi tiết về hệ thống WinDe Exam"
            />

            {isLoading ? (
                <div className={cx('loadingState')}>
                    <Spinner animation="border" variant="primary" />
                    <span>Đang tải số liệu...</span>
                </div>
            ) : isError ? (
                <div className={cx('loadingState')}>
                    <span>Không tải được số liệu thống kê. Vui lòng thử lại.</span>
                </div>
            ) : (
                <>
                    <Row className={cx('metricsRow')}>
                        <Col lg={3} md={6}>
                            <OverviewCard
                                value={stats.totalUsers ?? 0}
                                label="Tổng người dùng"
                                delay={0.1}
                            />
                        </Col>
                        <Col lg={3} md={6}>
                            <OverviewCard
                                value={stats.totalClasses ?? 0}
                                label="Tổng số lớp học"
                                delay={0.15}
                            />
                        </Col>
                        <Col lg={3} md={6}>
                            <OverviewCard
                                value={stats.totalExamsTaken ?? 0}
                                label="Tổng lượt thi"
                                delay={0.2}
                            />
                        </Col>
                        <Col lg={3} md={6}>
                            <OverviewCard
                                value={stats.totalExamTypes ?? 0}
                                label="Loại kỳ thi"
                                delay={0.25}
                            />
                        </Col>
                    </Row>

                    <Row className={cx('chartsRow')}>
                        <Col lg={8}>
                            <ChartCard title="Vị trí truy cập" delay={0.3} action={monthSelect}>
                                <div className={cx('monthSummary')}>
                                    <span className={cx('summaryValue')}>{locTotalVisits.toLocaleString('vi-VN')}</span>
                                    <span className={cx('summaryLabel')}>
                                        lượt truy cập từ IP công cộng trong {monthLabel(locMonth).toLowerCase()}
                                    </span>
                                </div>
                                <LocationsMap countries={locCountries} />
                            </ChartCard>
                        </Col>
                        <Col lg={4}>
                            <ChartCard
                                title="Top quốc gia"
                                delay={0.35}
                                action={<span className={cx('monthTag')}>{monthLabel(locMonth)}</span>}
                            >
                                <TopCountriesList countries={locCountries} />
                            </ChartCard>
                        </Col>
                    </Row>

                    <Row className={cx('chartsRow')}>
                        <Col lg={12}>
                            <ChartCard
                                title="Hoạt động theo tháng (truy cập, lượt thi & tỉ lệ hoàn thành)"
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
                                title="Người dùng mới theo tháng"
                                height={300}
                                delay={0.5}
                                action={yearSelect}
                            >
                                <MonthlyNewUsersLine data={monthlyPerformance} />
                            </ChartCard>
                        </Col>
                        <Col lg={4}>
                            <ChartCard title="Tình trạng lượt thi" height={300} delay={0.55}>
                                <ExamTypeDonut data={statusDistribution} />
                            </ChartCard>
                        </Col>
                    </Row>

                    <Row className={cx('chartsRow')}>
                        <Col lg={6}>
                            <ChartCard title="Bài thi nhiều nhất" delay={0.6}>
                                <TopTestsTable data={topTests} />
                            </ChartCard>
                        </Col>
                        <Col lg={6}>
                            <ChartCard title="Đề thi ôn luyện nhiều nhất" delay={0.65}>
                                <TopTestsTable data={topPracticeTests} />
                            </ChartCard>
                        </Col>
                    </Row>
                </>
            )}
        </div>
    );
};

export default AnalyticsPage;
