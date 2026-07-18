import { useState } from 'react';
import { Row, Col, Spinner } from 'react-bootstrap';
import classNames from 'classnames/bind';
import { motion } from 'framer-motion';
import {
    BookOpen,
    FileQuestion,
    GraduationCap,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
} from 'lucide-react';
import { SparkArea } from '../components/AdminCharts';
import TrafficHeatmap from '../components/TrafficHeatmap';
import PageHeader from '~/shared/ui/PageHeader/PageHeader';
import { useDashboardStats, useTrafficHeatmap } from './hooks/useDashboardStats';

/** Ngày hôm nay dạng 'yyyy-MM-dd' theo giờ địa phương (không lệch múi giờ như toISOString). */
const localISODate = (d = new Date()) => {
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
};

import styles from './Dashboard.module.scss';

const cx = classNames.bind(styles);

const EMPTY_TRAFFIC = {
    visitsToday: 0,
    visitsTrend: null,
    uniqueVisitorsWeek: 0,
    totalVisitsWeek: 0,
    heatmap: [],
    topCountries: [],
};

const KpiCard = ({ label, value, period, trend, live, spark, delay }) => {
    const hasTrend = trend !== null && trend !== undefined;
    const up = trend >= 0;
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay * 0.08, duration: 0.4 }}
            className={cx('kpiCard')}
        >
            <div className={cx('kpiTop')}>
                <span className={cx('kpiLabel')}>
                    {live && <span className={cx('liveDot')} />}
                    {label}
                </span>
                {period && <span className={cx('kpiPeriod')}>{period}</span>}
            </div>
            <div className={cx('kpiValueRow')}>
                <span className={cx('kpiValue')}>{value}</span>
                {hasTrend && (
                    <span className={cx('kpiTrend', up ? 'up' : 'down')}>
                        {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {Math.abs(trend)}%
                    </span>
                )}
            </div>
            <div className={cx('kpiSpark')}>{spark}</div>
        </motion.div>
    );
};

const IconCard = ({ icon, value, label, sub, delay }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay }}
        className={cx('iconCard')}
    >
        <div className={cx('iconBox')}>{icon}</div>
        <div className={cx('iconMeta')}>
            <span className={cx('iconValue')}>{value}</span>
            <span className={cx('iconLabel')}>{label}</span>
            {sub && <span className={cx('iconSub')}>{sub}</span>}
        </div>
    </motion.div>
);

/**
 * Card heatmap ngày×giờ có bộ lọc ngày: mặc định 7 ngày gần nhất, chọn ngày (chỉ hôm nay & quá khứ)
 * để xem tuần kết thúc ở ngày đó — giữ nguyên giao diện heatmap.
 */
const TrafficHeatmapCard = ({ delay }) => {
    const today = localISODate();
    const [endDate, setEndDate] = useState(today);
    const { data: heatmap = [] } = useTrafficHeatmap(endDate);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className={cx('chartCard')}
        >
            <div className={cx('chartHeader')}>
                <h3>Lượt truy cập theo ngày & giờ</h3>
                <input
                    type="date"
                    className={cx('dateInput')}
                    value={endDate}
                    max={today}
                    onChange={(e) => setEndDate(e.target.value || today)}
                />
            </div>
            <TrafficHeatmap data={heatmap} />
        </motion.div>
    );
};

const AdminDashboard = () => {
    const { data, isLoading, isError } = useDashboardStats();

    const stats = data?.stats ?? {};
    const traffic = data?.traffic ?? EMPTY_TRAFFIC;
    const heatmap = traffic.heatmap ?? [];

    const daySpark = heatmap.map((d) => ({ value: (d.hours ?? []).reduce((a, b) => a + b, 0) }));

    return (
        <div className={cx('dashboard')}>
            <PageHeader
                label="Tổng quan hệ thống English Exam"
                title="Dashboard"
            >
                <span className={cx('dateBadge')}>
                    <Calendar size={16} />
                    {new Date().toLocaleDateString('vi-VN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </span>
            </PageHeader>

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
                    {/* KPI truy cập + card icon nội dung trên cùng 1 dòng */}
                    <Row className={cx('kpiRow')}>
                        <Col lg={3} md={6} sm={12}>
                            <KpiCard
                                label="Lượt truy cập hôm nay"
                                value={traffic.visitsToday}
                                period="Hôm nay"
                                trend={traffic.visitsTrend}
                                spark={<SparkArea data={daySpark} color="#3b82f6" id="visits" />}
                                delay={0}
                            />
                        </Col>
                        <Col lg={3} md={6} sm={12}>
                            <IconCard
                                icon={<BookOpen size={22} />}
                                value={stats.totalTests ?? 0}
                                label="Bài thi"
                                sub={`${stats.totalExamsTaken ?? 0} lượt · ${stats.completedExams ?? 0} hoàn thành`}
                                delay={0.4}
                            />
                        </Col>
                        <Col lg={3} md={6} sm={12}>
                            <IconCard
                                icon={<FileQuestion size={22} />}
                                value={stats.totalQuestions ?? 0}
                                label="Câu hỏi"
                                sub="Ngân hàng câu hỏi"
                                delay={0.45}
                            />
                        </Col>
                        <Col lg={3} md={6} sm={12}>
                            <IconCard
                                icon={<GraduationCap size={22} />}
                                value={stats.totalClasses ?? 0}
                                label="Lớp học"
                                delay={0.5}
                            />
                        </Col>
                    </Row>

                    {/* Heatmap tuần × giờ, lọc theo ngày ngay trong card */}
                    <Row className={cx('chartsRow')}>
                        <Col lg={12}>
                            <TrafficHeatmapCard delay={0.5} />
                        </Col>
                    </Row>
                </>
            )}
        </div>
    );
};

export default AdminDashboard;
