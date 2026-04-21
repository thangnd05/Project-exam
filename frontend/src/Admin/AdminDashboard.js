import React from 'react';
import classNames from 'classnames/bind';
import { motion } from 'framer-motion';
import {
    Users,
    FileText,
    HelpCircle,
    TrendingUp,
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';

import styles from './AdminDashboard.module.scss';

const cx = classNames.bind(styles);

// --- Dummy Data ---
const statCards = [
    { id: 1, title: 'Total Users', value: '12,543', icon: <Users />, color: '#6c5ce7' },
    { id: 2, title: 'Active Exams', value: '452', icon: <FileText />, color: '#00cec9' },
    { id: 3, title: 'Questions', value: '8,210', icon: <HelpCircle />, color: '#e17055' },
    { id: 4, title: 'Completion Rate', value: '84%', icon: <TrendingUp />, color: '#0984e3' },
];

const trendData = {
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    users: [400, 300, 200, 278, 189, 239, 349],
    exams: [240, 139, 980, 390, 480, 380, 430]
};

const distributionData = [
    { name: 'TOEIC', value: 40 },
    { name: 'IELTS', value: 32 },
    { name: 'Vocabulary', value: 28 },
    { name: 'Grammar', value: 22 },
    { name: 'Listening', value: 18 },
    { name: 'Reading', value: 14 }
];

const skillData = [
    { name: 'Vocabulary', max: 100, value: 85 },
    { name: 'Grammar', max: 100, value: 72 },
    { name: 'Speaking', max: 100, value: 60 },
    { name: 'Listening', max: 100, value: 90 },
    { name: 'Reading', max: 100, value: 88 },
    { name: 'Writing', max: 100, value: 55 }
];

const recentActivities = [
    { id: 1, user: 'Nguyen Van A', exam: 'IELTS Mock Test #4', score: '7.5', date: '2 mins ago', status: 'completed' },
    { id: 2, user: 'Tran Thi B', exam: 'TOEIC Listening', score: '450/495', date: '15 mins ago', status: 'completed' },
    { id: 3, user: 'Le Van C', exam: 'Vocabulary Quiz', score: '-', date: 'In Progress', status: 'pending' },
    { id: 4, user: 'Pham Van D', exam: 'Grammar Advanced', score: '9/10', date: '1 hour ago', status: 'completed' },
    { id: 5, user: 'Hoang Thi E', exam: 'Mock Test TOEIC', score: '-', date: 'Just started', status: 'pending' },
];

const AdminDashboard = () => {
    // 1. Line Chart with DataZoom & Visual Effects
    const trendOption = {
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderWidth: 0,
            shadowBlur: 10,
            shadowColor: 'rgba(0,0,0,0.1)',
            textStyle: { color: '#2d3436' }
        },
        grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true, top: '10%' },
        dataZoom: [{ type: 'inside', start: 0, end: 100 }],
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: trendData.days,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#636e72', margin: 15 }
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { lineStyle: { type: 'dashed', color: '#f0f0f0' } }
        },
        series: [
            {
                name: 'Active Users',
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 8,
                data: trendData.users,
                itemStyle: { color: '#6c5ce7' },
                lineStyle: { width: 4, shadowBlur: 10, shadowColor: 'rgba(108, 92, 231, 0.3)' },
                areaStyle: {
                    color: {
                        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [{ offset: 0, color: 'rgba(108, 92, 231, 0.3)' }, { offset: 1, color: 'rgba(108, 92, 231, 0)' }]
                    }
                }
            }
        ]
    };

    // 2. Nightingale Rose Chart (Unique to ECharts)
    const roseOption = {
        tooltip: { trigger: 'item', formatter: '{a} <br/>{b} : {c} ({d}%)' },
        series: [
            {
                name: 'Exam Popularity',
                type: 'pie',
                radius: [20, 100],
                center: ['50%', '50%'],
                roseType: 'area',
                itemStyle: { borderRadius: 8 },
                data: distributionData,
                color: ['#6c5ce7', '#00cec9', '#e17055', '#0984e3', '#fdcb6e', '#ff7675']
            }
        ]
    };

    // 3. Radar Chart (Unique to ECharts)
    const radarOption = {
        radar: {
            indicator: skillData.map(s => ({ name: s.name, max: s.max })),
            shape: 'circle',
            splitNumber: 5,
            axisName: { color: '#636e72' },
            splitLine: { lineStyle: { color: ['rgba(108, 92, 231, 0.1)'] } },
            splitArea: { show: false },
            axisLine: { lineStyle: { color: 'rgba(108, 92, 231, 0.2)' } }
        },
        series: [{
            name: 'Skill Distribution',
            type: 'radar',
            data: [{
                value: skillData.map(s => s.value),
                name: 'Average Skill',
                areaStyle: { color: 'rgba(108, 92, 231, 0.3)' },
                lineStyle: { color: '#6c5ce7', width: 2 },
                symbol: 'none'
            }]
        }]
    };

    return (
        <div className={cx('wrapper')}>
            <div className="container-lg">
                {/* Header Section */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className={cx('header')}>
                    <h1>Advanced Admin Metrics</h1>
                    <p>Leveraging powerful Apache ECharts for deep insights and unique visualizations.</p>
                </motion.div>

                {/* Stats Grid */}
                <div className={cx('statsGrid')}>
                    {statCards.map((card, index) => (
                        <motion.div key={card.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.1 }} className={cx('statCard')}>
                            <div className={cx('icon')} style={{ backgroundColor: card.color }}>{card.icon}</div>
                            <div className={cx('info')}>
                                <h3>{card.title}</h3>
                                <div className={cx('value')}>{card.value}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Charts Row 1: Line & Rose */}
                <div className={cx('chartsGrid')}>
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className={cx('chartContainer')}>
                        <h2>User Engagement Flow</h2>
                        <div style={{ width: '100%', height: 350 }}>
                            <ReactECharts option={trendOption} style={{ height: '100%', width: '100%' }} />
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className={cx('chartContainer')}>
                        <h2>Popurality (Nightingale Rose)</h2>
                        <div style={{ width: '100%', height: 350 }}>
                            <ReactECharts option={roseOption} style={{ height: '100%', width: '100%' }} />
                        </div>
                    </motion.div>
                </div>

                {/* Charts Row 2: Radar & Table */}
                <div className={cx('chartsGrid')}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className={cx('chartContainer')}>
                        <h2>Student Skill Competency</h2>
                        <div style={{ width: '100%', height: 400 }}>
                            <ReactECharts option={radarOption} style={{ height: '100%', width: '100%' }} />
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className={cx('dataTable')}>
                        <h2>Recent Student Activity</h2>
                        <div className={cx('tableResponsive')}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Student Name</th>
                                        <th>Exam / Practice</th>
                                        <th>Score</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentActivities.map((activity) => (
                                        <tr key={activity.id}>
                                            <td>{activity.user}</td>
                                            <td>{activity.exam}</td>
                                            <td>{activity.score}</td>
                                            <td>
                                                <span className={cx('status', activity.status)}>
                                                    {activity.status === 'completed' ? 'Completed' : 'Processing'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
