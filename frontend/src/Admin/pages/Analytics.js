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
import ReactECharts from 'echarts-for-react';

import {
    monthlyTestPerformance,
    examTypeDistribution,
    skillDistribution,
    weeklyUserRegistrations,
    dashboardStats
} from '../data/fakeData';

import styles from './Analytics.module.scss';

const cx = classNames.bind(styles);

const AnalyticsPage = () => {
    // Chart options
    const performanceTrendOption = {
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderWidth: 0,
            shadowBlur: 10,
            textStyle: { color: '#1e293b' }
        },
        legend: {
            data: ['Số bài thi', 'Điểm TB'],
            bottom: 0,
            textStyle: { color: '#64748b' }
        },
        grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true, top: '10%' },
        xAxis: {
            type: 'category',
            data: monthlyTestPerformance.map(d => d.month),
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#64748b' }
        },
        yAxis: [
            {
                type: 'value',
                name: 'Bài thi',
                axisLine: { show: false },
                axisTick: { show: false },
                splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } }
            },
            {
                type: 'value',
                name: 'Điểm',
                max: 100,
                axisLine: { show: false },
                axisTick: { show: false },
                splitLine: { show: false }
            }
        ],
        series: [
            {
                name: 'Số bài thi',
                type: 'bar',
                barWidth: '40%',
                data: monthlyTestPerformance.map(d => d.tests),
                itemStyle: {
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: '#3b82f6' },
                            { offset: 1, color: '#60a5fa' }
                        ]
                    },
                    borderRadius: [6, 6, 0, 0]
                }
            },
            {
                name: 'Điểm TB',
                type: 'line',
                yAxisIndex: 1,
                smooth: true,
                symbol: 'circle',
                symbolSize: 8,
                data: monthlyTestPerformance.map(d => d.avgScore),
                itemStyle: { color: '#f59e0b' },
                lineStyle: { width: 3 }
            }
        ]
    };

    const examDistributionOption = {
        tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
            orient: 'vertical',
            right: '5%',
            top: 'center',
            textStyle: { color: '#64748b' }
        },
        series: [
            {
                name: 'Loại kỳ thi',
                type: 'pie',
                radius: ['45%', '75%'],
                center: ['35%', '50%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 8,
                    borderColor: '#fff',
                    borderWidth: 2
                },
                label: { show: false },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 14,
                        fontWeight: 'bold'
                    }
                },
                data: examTypeDistribution,
                color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
            }
        ]
    };

    const skillRadarOption = {
        tooltip: {},
        radar: {
            indicator: skillDistribution.map(s => ({ name: s.name, max: s.max })),
            shape: 'polygon',
            splitNumber: 5,
            axisName: { color: '#64748b' },
            splitLine: { lineStyle: { color: ['rgba(59, 130, 246, 0.1)'] } },
            splitArea: { show: false },
            axisLine: { lineStyle: { color: 'rgba(59, 130, 246, 0.2)' } }
        },
        series: [{
            name: 'Kỹ năng',
            type: 'radar',
            data: [{
                value: skillDistribution.map(s => s.value),
                name: 'Kỹ năng TB',
                areaStyle: { color: 'rgba(59, 130, 246, 0.3)' },
                lineStyle: { color: '#3b82f6', width: 2 },
                symbol: 'none'
            }]
        }]
    };

    const userGrowthOption = {
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderWidth: 0,
            textStyle: { color: '#1e293b' }
        },
        grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true, top: '10%' },
        xAxis: {
            type: 'category',
            data: weeklyUserRegistrations.map(d => d.day),
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#64748b' }
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } }
        },
        series: [{
            type: 'bar',
            data: weeklyUserRegistrations.map(d => d.users),
            itemStyle: {
                color: {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                        { offset: 0, color: '#10b981' },
                        { offset: 1, color: '#34d399' }
                    ]
                },
                borderRadius: [6, 6, 0, 0]
            },
            barWidth: '50%'
        }]
    };

    const scoreDistributionOption = {
        tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c} học viên'
        },
        xAxis: {
            type: 'category',
            data: ['0-2', '2-4', '4-6', '6-8', '8-10'],
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#64748b' }
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } }
        },
        series: [{
            name: 'Phân bố điểm',
            type: 'bar',
            data: [5, 15, 35, 30, 15],
            itemStyle: {
                color: {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                        { offset: 0, color: '#ef4444' },
                        { offset: 0.5, color: '#f59e0b' },
                        { offset: 1, color: '#10b981' }
                    ]
                },
                borderRadius: [6, 6, 0, 0]
            }
        }]
    };

    return (
        <div className={cx('analyticsPage')}>
            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cx('pageHeader')}
            >
                <div>
                    <h1>Thống kê & Phân tích</h1>
                    <p>Phân tích chi tiết về hệ thống English Exam</p>
                </div>
            </motion.div>

            {/* Key Metrics */}
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

            {/* Charts Row 1 */}
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
                            <ReactECharts option={performanceTrendOption} style={{ height: '100%', width: '100%' }} />
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
                            <ReactECharts option={examDistributionOption} style={{ height: '100%', width: '100%' }} />
                        </div>
                    </motion.div>
                </Col>
            </Row>

            {/* Charts Row 2 */}
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
                            <ReactECharts option={userGrowthOption} style={{ height: '100%', width: '100%' }} />
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
                            <ReactECharts option={skillRadarOption} style={{ height: '100%', width: '100%' }} />
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
                            <ReactECharts option={scoreDistributionOption} style={{ height: '100%', width: '100%' }} />
                        </div>
                    </motion.div>
                </Col>
            </Row>
        </div>
    );
};

export default AnalyticsPage;
