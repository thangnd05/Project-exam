'use client';

import { useState } from 'react';
import { Row, Col } from 'react-bootstrap';
import classNames from 'classnames/bind';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import TrafficHeatmap from '@/app/[locale]/(admin)/_components/TrafficHeatmap';
import OverviewCard from '@/app/[locale]/(admin)/_components/OverviewCard';
import { AdminPageHeader } from '@/app/[locale]/(admin)/_components/common';
import { useDashboardStats, useTrafficHeatmap } from '@/app/[locale]/(admin)/_hooks/useDashboardStats';

const localISODate = (d: Date = new Date()) => {
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
};

import styles from './AdminDashboard.module.scss';
import Loading from '@/app/components/Loading/Loading';
import { formatLongDate } from '@/app/utils/format-date-time';

const cx = classNames.bind(styles);

const TrafficHeatmapCard = ({ delay }: { delay: number }) => {
    const today = localISODate();
    const [endDate, setEndDate] = useState(today);
    const t = useTranslations('AdminSystem.dashboard');
    const { heatmap = [] } = useTrafficHeatmap(endDate);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className={cx('chartCard')}
        >
            <div className={cx('chartHeader')}>
                <h3>{t('heatmapTitle')}</h3>
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
    const t = useTranslations('AdminSystem');

    return (
        <div className={cx('dashboard')}>
            <AdminPageHeader
                title={t('dashboard.title')}
                description={t('dashboard.description')}
            >
                <span className={cx('dateBadge')}>
                    {formatLongDate(new Date(), { weekday: true })}
                </span>
            </AdminPageHeader>

            {isLoading ? (
                <Loading label={t('stats.loading')} />
            ) : isError ? (
                <div className={cx('loadingState')}>
                    <span>{t('stats.loadError')}</span>
                </div>
            ) : (
                <>

                    <Row className={cx('kpiRow')}>
                        <Col lg={3} md={6} sm={12}>
                            <OverviewCard
                                label={t('dashboard.visitsToday')}
                                value={traffic.visitsToday}
                                period={t('dashboard.today')}
                                delay={0}
                            />
                        </Col>
                        <Col lg={3} md={6} sm={12}>
                            <OverviewCard
                                value={stats.totalTests ?? 0}
                                label={t('dashboard.tests')}
                                sub={t('dashboard.testsSub', { taken: stats.totalExamsTaken ?? 0, completed: stats.completedExams ?? 0 })}
                                delay={0.05}
                            />
                        </Col>
                        <Col lg={3} md={6} sm={12}>
                            <OverviewCard
                                value={stats.totalQuestions ?? 0}
                                label={t('dashboard.questions')}
                                sub={t('dashboard.questionBank')}
                                delay={0.1}
                            />
                        </Col>
                        <Col lg={3} md={6} sm={12}>
                            <OverviewCard
                                value={stats.totalClasses ?? 0}
                                label={t('dashboard.classes')}
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
