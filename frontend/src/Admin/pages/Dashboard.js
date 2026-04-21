import React from 'react';
import { Row, Col, Table, Badge } from 'react-bootstrap';
import classNames from 'classnames/bind';
import { motion } from 'framer-motion';
import {
    Users,
    GraduationCap,
    BookOpen,
    FileQuestion,
    TrendingUp,
    Clock,
    CheckCircle,
    Eye,
    Edit,
    Trash2,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    Award,
    BarChart3,
    PieChart as PieChartIcon
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';

import {
    dashboardStats,
    weeklyUserRegistrations,
    monthlyTestPerformance,
    recentActivities,
    examTypeDistribution,
    skillDistribution,
    fakeUserTests,
    getUserById,
    getTestById
} from '../data/fakeData';

import styles from './Dashboard.module.scss';

const cx = classNames.bind(styles);

// Stat Card Component
const StatCard = ({ title, value, icon, color, trend, trendValue, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay * 0.1, duration: 0.4 }}
        className={cx('statCard')}
    >
        <div className={cx('statIcon')} style={{ backgroundColor: color }}>
            {icon}
        </div>
        <div className={cx('statContent')}>
            <span className={cx('statTitle')}>{title}</span>
            <span className={cx('statValue')}>{value}</span>
            {trend && (
                <div className={cx('statTrend', trend > 0 ? 'up' : 'down')}>
                    {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    <span>{Math.abs(trendValue)}% so với tuần trước</span>
                </div>
            )}
        </div>
    </motion.div>
);

// Activity Icon Helper
const getActivityIcon = (type) => {
    switch (type) {
        case 'exam_completed': return <CheckCircle size={16} className={cx('activityIcon', 'success')} />;
        case 'user_registered': return <Users size={16} className={cx('activityIcon', 'primary')} />;
        case 'class_joined': return <GraduationCap size={16} className={cx('activityIcon', 'warning')} />;
        case 'test_created': return <BookOpen size={16} className={cx('activityIcon', 'info')} />;
        default: return <Clock size={16} className={cx('activityIcon')} />;
    }
};

const AdminDashboard = () => {
    // Chart Configurations
    const lineChartOption = {
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderWidth: 0,
            shadowBlur: 10,
            shadowColor: 'rgba(0,0,0,0.1)',
            textStyle: { color: '#1e293b' }
        },
        legend: {
            data: ['Người dùng mới', 'Bài thi'],
            bottom: 0,
            textStyle: { color: '#64748b' }
        },
        grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true, top: '10%' },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: weeklyUserRegistrations.map(d => d.day),
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#64748b', margin: 15 }
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } }
        },
        series: [
            {
                name: 'Người dùng mới',
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 8,
                data: weeklyUserRegistrations.map(d => d.users),
                itemStyle: { color: '#3b82f6' },
                lineStyle: { width: 3, shadowBlur: 10, shadowColor: 'rgba(59, 130, 246, 0.3)' },
                areaStyle: {
                    color: {
                        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(59, 130, 246, 0.2)' },
                            { offset: 1, color: 'rgba(59, 130, 246, 0)' }
                        ]
                    }
                }
            },
            {
                name: 'Bài thi',
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 8,
                data: weeklyUserRegistrations.map(d => d.exams),
                itemStyle: { color: '#10b981' },
                lineStyle: { width: 3, shadowBlur: 10, shadowColor: 'rgba(16, 185, 129, 0.3)' },
                areaStyle: {
                    color: {
                        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(16, 185, 129, 0.2)' },
                            { offset: 1, color: 'rgba(16, 185, 129, 0)' }
                        ]
                    }
                }
            }
        ]
    };

    const barChartOption = {
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
                lineStyle: { width: 3 },
                label: {
                    show: true,
                    position: 'top',
                    formatter: '{c}',
                    color: '#64748b'
                }
            }
        ]
    };

    const pieChartOption = {
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

    const radarChartOption = {
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
            name: 'Phân bố kỹ năng',
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

    const recentTests = fakeUserTests.slice(0, 5).map(ut => ({
        ...ut,
        user: getUserById(ut.user_id),
        test: getTestById(ut.test_id)
    }));

    return (
        <div className={cx('dashboard')}>
            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cx('pageHeader')}
            >
                <div>
                    <h1>Dashboard</h1>
                    <p>Tổng quan về hệ thống English Exam</p>
                </div>
                <div className={cx('headerActions')}>
                    <span className={cx('dateBadge')}>
                        <Calendar size={16} />
                        {new Date().toLocaleDateString('vi-VN', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </span>
                </div>
            </motion.div>

            {/* Stats Cards */}
            <Row className={cx('statsRow')}>
                <Col lg={3} md={6} sm={12}>
                    <StatCard
                        title="Tổng Users"
                        value={dashboardStats.totalUsers}
                        icon={<Users size={24} />}
                        color="#3b82f6"
                        trend={12}
                        trendValue={12}
                        delay={0}
                    />
                </Col>
                <Col lg={3} md={6} sm={12}>
                    <StatCard
                        title="Tổng Lớp học"
                        value={dashboardStats.totalClasses}
                        icon={<GraduationCap size={24} />}
                        color="#10b981"
                        trend={8}
                        trendValue={8}
                        delay={1}
                    />
                </Col>
                <Col lg={3} md={6} sm={12}>
                    <StatCard
                        title="Tổng Bài thi"
                        value={dashboardStats.totalTests}
                        icon={<BookOpen size={24} />}
                        color="#f59e0b"
                        trend={-3}
                        trendValue={3}
                        delay={2}
                    />
                </Col>
                <Col lg={3} md={6} sm={12}>
                    <StatCard
                        title="Câu hỏi"
                        value={dashboardStats.totalQuestions}
                        icon={<FileQuestion size={24} />}
                        color="#8b5cf6"
                        trend={15}
                        trendValue={15}
                        delay={3}
                    />
                </Col>
            </Row>

            {/* Secondary Stats */}
            <Row className={cx('secondaryStats')}>
                <Col lg={2} md={4} sm={6}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                        className={cx('miniStat')}
                    >
                        <span className={cx('miniValue')}>{dashboardStats.totalTeachers}</span>
                        <span className={cx('miniLabel')}>Giáo viên</span>
                    </motion.div>
                </Col>
                <Col lg={2} md={4} sm={6}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                        className={cx('miniStat')}
                    >
                        <span className={cx('miniValue')}>{dashboardStats.totalStudents}</span>
                        <span className={cx('miniLabel')}>Học sinh</span>
                    </motion.div>
                </Col>
                <Col lg={2} md={4} sm={6}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 }}
                        className={cx('miniStat')}
                    >
                        <span className={cx('miniValue')}>{dashboardStats.totalExamsTaken}</span>
                        <span className={cx('miniLabel')}>Lượt thi</span>
                    </motion.div>
                </Col>
                <Col lg={2} md={4} sm={6}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.7 }}
                        className={cx('miniStat')}
                    >
                        <span className={cx('miniValue')}>{dashboardStats.completedExams}</span>
                        <span className={cx('miniLabel')}>Hoàn thành</span>
                    </motion.div>
                </Col>
                <Col lg={2} md={4} sm={6}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.8 }}
                        className={cx('miniStat')}
                    >
                        <span className={cx('miniValue')}>{dashboardStats.avgScore}</span>
                        <span className={cx('miniLabel')}>Điểm TB</span>
                    </motion.div>
                </Col>
                <Col lg={2} md={4} sm={6}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.9 }}
                        className={cx('miniStat')}
                    >
                        <span className={cx('miniValue')}>{dashboardStats.pendingMembers}</span>
                        <span className={cx('miniLabel')}>Chờ duyệt</span>
                    </motion.div>
                </Col>
            </Row>

            {/* Charts Row 1 */}
            <Row className={cx('chartsRow')}>
                <Col lg={8}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className={cx('chartCard')}
                    >
                        <div className={cx('chartHeader')}>
                            <h3>
                                <TrendingUp size={20} />
                                Hoạt động tuần này
                            </h3>
                        </div>
                        <div style={{ width: '100%', height: 300 }}>
                            <ReactECharts option={lineChartOption} style={{ height: '100%', width: '100%' }} />
                        </div>
                    </motion.div>
                </Col>
                <Col lg={4}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className={cx('chartCard')}
                    >
                        <div className={cx('chartHeader')}>
                            <h3>
                                <PieChartIcon size={20} />
                                Loại kỳ thi
                            </h3>
                        </div>
                        <div style={{ width: '100%', height: 300 }}>
                            <ReactECharts option={pieChartOption} style={{ height: '100%', width: '100%' }} />
                        </div>
                    </motion.div>
                </Col>
            </Row>

            {/* Charts Row 2 */}
            <Row className={cx('chartsRow')}>
                <Col lg={8}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className={cx('chartCard')}
                    >
                        <div className={cx('chartHeader')}>
                            <h3>
                                <BarChart3 size={20} />
                                Hiệu suất hàng tháng
                            </h3>
                        </div>
                        <div style={{ width: '100%', height: 300 }}>
                            <ReactECharts option={barChartOption} style={{ height: '100%', width: '100%' }} />
                        </div>
                    </motion.div>
                </Col>
                <Col lg={4}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className={cx('chartCard')}
                    >
                        <div className={cx('chartHeader')}>
                            <h3>
                                <Award size={20} />
                                Kỹ năng học viên
                            </h3>
                        </div>
                        <div style={{ width: '100%', height: 300 }}>
                            <ReactECharts option={radarChartOption} style={{ height: '100%', width: '100%' }} />
                        </div>
                    </motion.div>
                </Col>
            </Row>

            {/* Bottom Row: Recent Tests & Activities */}
            <Row className={cx('bottomRow')}>
                <Col lg={8}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 }}
                        className={cx('tableCard')}
                    >
                        <div className={cx('tableHeader')}>
                            <h3>Bài thi gần đây</h3>
                            <button type="button" className={cx('viewAll')}>Xem tất cả</button>
                        </div>
                        <div className={cx('tableWrapper')}>
                            <Table responsive className={cx('customTable')}>
                                <thead>
                                    <tr>
                                        <th>Học viên</th>
                                        <th>Bài thi</th>
                                        <th>Điểm</th>
                                        <th>Trạng thái</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentTests.map((test) => (
                                        <tr key={test.user_test_id}>
                                            <td>
                                                <div className={cx('userCell')}>
                                                    <div className={cx('userAvatar')}>
                                                        {test.user?.full_name?.charAt(0)}
                                                    </div>
                                                    <span>{test.user?.full_name}</span>
                                                </div>
                                            </td>
                                            <td>{test.test?.title}</td>
                                            <td>
                                                <span className={cx('score')}>
                                                    {test.status === 'COMPLETED' ? test.total_score : '-'}
                                                </span>
                                            </td>
                                            <td>
                                                <Badge bg={
                                                    test.status === 'COMPLETED' ? 'success' :
                                                    test.status === 'IN_PROGRESS' ? 'warning' : 'danger'
                                                }>
                                                    {test.status === 'COMPLETED' ? 'Hoàn thành' :
                                                     test.status === 'IN_PROGRESS' ? 'Đang làm' : 'Hết hạn'}
                                                </Badge>
                                            </td>
                                            <td>
                                                <div className={cx('actions')}>
                                                    <button className={cx('actionBtn')} title="Xem">
                                                        <Eye size={16} />
                                                    </button>
                                                    <button className={cx('actionBtn')} title="Sửa">
                                                        <Edit size={16} />
                                                    </button>
                                                    <button className={cx('actionBtn', 'delete')} title="Xóa">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    </motion.div>
                </Col>
                <Col lg={4}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 }}
                        className={cx('activityCard')}
                    >
                        <div className={cx('activityHeader')}>
                            <h3>Hoạt động gần đây</h3>
                        </div>
                        <div className={cx('activityList')}>
                            {recentActivities.map((activity, index) => (
                                <motion.div
                                    key={activity.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 1 + index * 0.05 }}
                                    className={cx('activityItem')}
                                >
                                    {getActivityIcon(activity.type)}
                                    <div className={cx('activityContent')}>
                                        <span className={cx('activityUser')}>{activity.user}</span>
                                        <span className={cx('activityAction')}>{activity.action}</span>
                                        <span className={cx('activityTime')}>{activity.time}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </Col>
            </Row>
        </div>
    );
};

export default AdminDashboard;
