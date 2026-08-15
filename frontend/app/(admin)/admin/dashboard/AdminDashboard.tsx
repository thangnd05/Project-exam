'use client';

import { useState } from 'react';
import { Row, Col, Spinner } from 'react-bootstrap';
import classNames from 'classnames/bind';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import TrafficHeatmap from '@/app/components/admin/TrafficHeatmap';
import OverviewCard from '@/app/components/admin/OverviewCard';
import PageHeader from '@/app/components/PageHeader/PageHeader';
import { useDashboardStats, useTrafficHeatmap } from '@/app/hooks/useDashboardStats';

const localISODate = (d: Date = new Date()) => {
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
};

import styles from './AdminDashboard.module.scss';

const cx = classNames.bind(styles);

const TrafficHeatmapCard = ({ delay }: { delay: number }) => {
    const today = localISODate();
    const [endDate, setEndDate] = useState(today);
    const { heatmap = [] } = useTrafficHeatmap(endDate);

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
    const { stats, traffic, isLoading, isError } = useDashboardStats();

    return (
        <div className={cx('dashboard')}>
            <PageHeader
                label="Tổng quan hệ thống WinDe Exam"
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

                    <Row className={cx('kpiRow')}>
                        <Col lg={3} md={6} sm={12}>
                            <OverviewCard
                                label="Lượt truy cập hôm nay"
                                value={traffic.visitsToday}
                                period="Hôm nay"
                                delay={0}
                            />
                        </Col>
                        <Col lg={3} md={6} sm={12}>
                            <OverviewCard
                                value={stats.totalTests ?? 0}
                                label="Bài thi"
                                sub={`${stats.totalExamsTaken ?? 0} lượt · ${stats.completedExams ?? 0} hoàn thành`}
                                delay={0.05}
                            />
                        </Col>
                        <Col lg={3} md={6} sm={12}>
                            <OverviewCard
                                value={stats.totalQuestions ?? 0}
                                label="Câu hỏi"
                                sub="Ngân hàng câu hỏi"
                                delay={0.1}
                            />
                        </Col>
                        <Col lg={3} md={6} sm={12}>
                            <OverviewCard
                                value={stats.totalClasses ?? 0}
                                label="Lớp học"
                                delay={0.15}
                            />
                        </Col>
                    </Row>

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
