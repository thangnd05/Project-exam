import { useState } from 'react';
import { Row, Col, Spinner } from 'react-bootstrap';
import classNames from 'classnames/bind';
import { motion } from 'framer-motion';
import {
    BarChart3,
    Users,
    Eye,
    UserCheck,
} from 'lucide-react';
import {
    MonthlyPerformanceCombo,
    MonthlyNewUsersBar,
    MonthlyVisitsBar,
    ExamTypeDonut,
} from '../components/AdminCharts';
import LocationsMap, { TopCountriesList } from '../components/LocationsMap';
import { AdminPageHeader } from '../components/common';
import { useDashboardStats, useMonthlyPerformance } from './hooks/useDashboardStats';

import styles from './Analytics.module.scss';

const cx = classNames.bind(styles);

const MetricCard = ({ icon, iconBg, value, label, trend, trendUp, delay }) => (
    <Col lg={3} md={6}>
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay }}
            className={cx('metricCard')}
        >
            <div className={cx('metricIcon')} style={{ backgroundColor: iconBg }}>
                {icon}
            </div>
            <div className={cx('metricInfo')}>
                <span className={cx('metricValue')}>{value}</span>
                <span className={cx('metricLabel')}>{label}</span>
                {trend && (
                    <span className={cx('metricTrend', trendUp ? 'up' : 'down')}>{trend}</span>
                )}
            </div>
        </motion.div>
    </Col>
);

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

const AnalyticsPage = () => {
    const { data, isLoading, isError } = useDashboardStats();

    const stats = data?.stats ?? {};
    const traffic = data?.traffic ?? {
        visitsToday: 0, visitsTrend: null, uniqueVisitorsWeek: 0, totalVisitsWeek: 0,
        heatmap: [], topCountries: [],
    };
    const statusDistribution = data?.statusDistribution ?? [];

    const currentYear = new Date().getFullYear();
    const [perfYear, setPerfYear] = useState(currentYear);
    const { data: perf } = useMonthlyPerformance(perfYear);
    const monthlyPerformance = perf?.months ?? [];
    const availableYears = perf?.availableYears ?? [currentYear];

    const visitTrendText =
        traffic.visitsTrend === null || traffic.visitsTrend === undefined
            ? null
            : `${traffic.visitsTrend >= 0 ? '+' : ''}${traffic.visitsTrend}% so với hôm qua`;

    // Bộ chọn năm dùng chung cho mọi biểu đồ theo tháng của trang Thống kê.
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
                description="Phân tích chi tiết về hệ thống English Exam"
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
                        <MetricCard
                            icon={<Users size={24} color="#3b82f6" />}
                            iconBg="rgba(59, 130, 246, 0.1)"
                            value={stats.totalUsers ?? 0}
                            label="Tổng người dùng"
                            delay={0.1}
                        />
                        <MetricCard
                            icon={<Eye size={24} color="#3b82f6" />}
                            iconBg="rgba(59, 130, 246, 0.1)"
                            value={traffic.visitsToday}
                            label="Lượt truy cập hôm nay"
                            trend={visitTrendText}
                            trendUp={(traffic.visitsTrend ?? 0) >= 0}
                            delay={0.15}
                        />
                        <MetricCard
                            icon={<BarChart3 size={24} color="#3b82f6" />}
                            iconBg="rgba(59, 130, 246, 0.1)"
                            value={traffic.totalVisitsWeek ?? 0}
                            label="Tổng lượt truy cập (7 ngày)"
                            delay={0.2}
                        />
                        <MetricCard
                            icon={<UserCheck size={24} color="#3b82f6" />}
                            iconBg="rgba(59, 130, 246, 0.1)"
                            value={traffic.uniqueVisitorsWeek}
                            label="Khách duy nhất (7 ngày)"
                            delay={0.25}
                        />
                    </Row>

                    {/* Lượt truy cập theo tháng (kèm giờ cao điểm) — theo năm được chọn */}
                    <Row className={cx('chartsRow')}>
                        <Col lg={12}>
                            <ChartCard
                                title="Lượt truy cập theo tháng"
                                height={320}
                                delay={0.3}
                                action={yearSelect}
                            >
                                <MonthlyVisitsBar data={monthlyPerformance} />
                            </ChartCard>
                        </Col>
                    </Row>

                    {/* Hiệu suất theo tháng — theo năm được chọn */}
                    <Row className={cx('chartsRow')}>
                        <Col lg={12}>
                            <ChartCard
                                title="Hiệu suất theo tháng (lượt thi & tỉ lệ hoàn thành)"
                                height={320}
                                delay={0.4}
                                action={yearSelect}
                            >
                                <MonthlyPerformanceCombo data={monthlyPerformance} />
                            </ChartCard>
                        </Col>
                    </Row>

                    {/* Người dùng mới theo tháng + tình trạng lượt thi */}
                    <Row className={cx('chartsRow')}>
                        <Col lg={8}>
                            <ChartCard
                                title="Người dùng mới theo tháng"
                                height={300}
                                delay={0.5}
                                action={yearSelect}
                            >
                                <MonthlyNewUsersBar data={monthlyPerformance} />
                            </ChartCard>
                        </Col>
                        <Col lg={4}>
                            <ChartCard title="Tình trạng lượt thi" height={300} delay={0.55}>
                                <ExamTypeDonut data={statusDistribution} />
                            </ChartCard>
                        </Col>
                    </Row>

                    {/* Vị trí truy cập */}
                    <Row className={cx('chartsRow')}>
                        <Col lg={8}>
                            <ChartCard title="Vị trí truy cập" delay={0.6}>
                                <LocationsMap countries={traffic.topCountries ?? []} />
                            </ChartCard>
                        </Col>
                        <Col lg={4}>
                            <ChartCard title="Top quốc gia" delay={0.65}>
                                <TopCountriesList countries={traffic.topCountries ?? []} />
                            </ChartCard>
                        </Col>
                    </Row>
                </>
            )}
        </div>
    );
};

export default AnalyticsPage;
