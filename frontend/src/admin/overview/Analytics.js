import React from 'react';
import { Row, Col } from 'react-bootstrap';
import classNames from 'classnames/bind';
import { motion } from 'framer-motion';
import {
    BarChart3,
    TrendingUp,
    Users,
    BookOpen,
    Award,
    Target,
    PieChart as PieChartIcon
} from 'lucide-react';
import {
    MonthlyPerformanceCombo,
    ExamTypeDonut,
    SkillRadar,
    UserGrowthBar,
    ScoreDistributionBar,
} from '../components/AdminCharts';
import {AdminPageHeader} from '../components/common';

import {
    monthlyTestPerformance,
    examTypeDistribution,
    skillDistribution,
    weeklyUserRegistrations,
    dashboardStats
} from '../data/fakeData';

import styles from './Analytics.module.scss';

const cx = classNames.bind(styles);

const scoreDistribution = [
    { range: '0-2', count: 5 },
    { range: '2-4', count: 15 },
    { range: '4-6', count: 35 },
    { range: '6-8', count: 30 },
    { range: '8-10', count: 15 },
];

const AnalyticsPage = () => {
    return (
        <div className={cx('analyticsPage')}>

            <AdminPageHeader
                title="Thống kê & Phân tích"
                description="Phân tích chi tiết về hệ thống English Exam"
            />

            <Row className={cx('metricsRow')}>
                <Col lg={3} md={6}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className={cx('metricCard')}
                    >
                        <div className={cx('metricIcon')} style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                            <Users size={24} color="#3b82f6" />
                        </div>
                        <div className={cx('metricInfo')}>
                            <span className={cx('metricValue')}>{dashboardStats.totalUsers}</span>
                            <span className={cx('metricLabel')}>Tổng người dùng</span>
                            <span className={cx('metricTrend', 'up')}>+12% tuần này</span>
                        </div>
                    </motion.div>
                </Col>
                <Col lg={3} md={6}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.15 }}
                        className={cx('metricCard')}
                    >
                        <div className={cx('metricIcon')} style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                            <BookOpen size={24} color="#10b981" />
                        </div>
                        <div className={cx('metricInfo')}>
                            <span className={cx('metricValue')}>{dashboardStats.totalExamsTaken}</span>
                            <span className={cx('metricLabel')}>Lượt thi</span>
                            <span className={cx('metricTrend', 'up')}>+8% tuần này</span>
                        </div>
                    </motion.div>
                </Col>
                <Col lg={3} md={6}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className={cx('metricCard')}
                    >
                        <div className={cx('metricIcon')} style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
                            <Award size={24} color="#f59e0b" />
                        </div>
                        <div className={cx('metricInfo')}>
                            <span className={cx('metricValue')}>{dashboardStats.avgScore}</span>
                            <span className={cx('metricLabel')}>Điểm TB</span>
                            <span className={cx('metricTrend', 'up')}>+3% tuần này</span>
                        </div>
                    </motion.div>
                </Col>
                <Col lg={3} md={6}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.25 }}
                        className={cx('metricCard')}
                    >
                        <div className={cx('metricIcon')} style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
                            <Target size={24} color="#8b5cf6" />
                        </div>
                        <div className={cx('metricInfo')}>
                            <span className={cx('metricValue')}>
                                {Math.round((dashboardStats.completedExams / dashboardStats.totalExamsTaken) * 100)}%
                            </span>
                            <span className={cx('metricLabel')}>Tỷ lệ hoàn thành</span>
                            <span className={cx('metricTrend', 'up')}>Ổn định</span>
                        </div>
                    </motion.div>
                </Col>
            </Row>

            <Row className={cx('chartsRow')}>
                <Col lg={8}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className={cx('chartCard')}
                    >
                        <div className={cx('chartHeader')}>
                            <h3>
                                <TrendingUp size={20} />
                                Hiệu suất hàng tháng
                            </h3>
                        </div>
                        <div style={{ width: '100%', height: 350 }}>
                            <MonthlyPerformanceCombo data={monthlyTestPerformance} />
                        </div>
                    </motion.div>
                </Col>
                <Col lg={4}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className={cx('chartCard')}
                    >
                        <div className={cx('chartHeader')}>
                            <h3>
                                <PieChartIcon size={20} />
                                Phân bố loại kỳ thi
                            </h3>
                        </div>
                        <div style={{ width: '100%', height: 350 }}>
                            <ExamTypeDonut data={examTypeDistribution} />
                        </div>
                    </motion.div>
                </Col>
            </Row>

            <Row className={cx('chartsRow')}>
                <Col lg={4}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className={cx('chartCard')}
                    >
                        <div className={cx('chartHeader')}>
                            <h3>
                                <Users size={20} />
                                Đăng ký người dùng
                            </h3>
                        </div>
                        <div style={{ width: '100%', height: 300 }}>
                            <UserGrowthBar data={weeklyUserRegistrations} />
                        </div>
                    </motion.div>
                </Col>
                <Col lg={4}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45 }}
                        className={cx('chartCard')}
                    >
                        <div className={cx('chartHeader')}>
                            <h3>
                                <Award size={20} />
                                Phân bố kỹ năng
                            </h3>
                        </div>
                        <div style={{ width: '100%', height: 300 }}>
                            <SkillRadar data={skillDistribution} />
                        </div>
                    </motion.div>
                </Col>
                <Col lg={4}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className={cx('chartCard')}
                    >
                        <div className={cx('chartHeader')}>
                            <h3>
                                <BarChart3 size={20} />
                                Phân bố điểm số
                            </h3>
                        </div>
                        <div style={{ width: '100%', height: 300 }}>
                            <ScoreDistributionBar data={scoreDistribution} />
                        </div>
                    </motion.div>
                </Col>
            </Row>
        </div>
    );
};

export default AnalyticsPage;
