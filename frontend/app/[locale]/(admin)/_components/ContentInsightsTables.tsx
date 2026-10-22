'use client';

import classNames from 'classnames/bind';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

import styles from './ContentInsightsTables.module.scss';
import type { ContentTestStat } from '@/app/types/admin';

const cx = classNames.bind(styles);

const RateBar = ({ value }: { value: number }) => (
    <div className={cx('rateCell')}>
        <div className={cx('rateTrack')}>
            <div
                className={cx('rateFill')}
                style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
            />
        </div>
        <span className={cx('rateValue')}>{value}%</span>
    </div>
);

const EmptyRow = ({ colSpan, message }: { colSpan: number; message: string }) => (
    <tr>
        <td colSpan={colSpan} className={cx('empty')}>{message}</td>
    </tr>
);

export const TopTestsTable = ({ data = [] }: { data?: ContentTestStat[] }) => {
    const t = useTranslations('AdminCommon.contentInsights');
    return (
        <div className={cx('tableWrap')}>
            <table className={cx('table')}>
                <thead>
                    <tr>
                        <th className={cx('rank')}>#</th>
                        <th>{t('test')}</th>
                        <th className={cx('num')}>{t('attempts')}</th>
                        <th className={cx('rateCol')}>{t('completionRate')}</th>
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 ? (
                        <EmptyRow colSpan={4} message={t('empty')} />
                    ) : (
                        data.map((row, i) => (
                            <motion.tr
                                key={row.testId}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.03 }}
                            >
                                <td className={cx('rank')}>{i + 1}</td>
                                <td className={cx('title')} title={row.title}>{row.title}</td>
                                <td className={cx('num')}>{row.attempts}</td>
                                <td className={cx('rateCol')}>
                                    <RateBar value={row.completionRate} />
                                </td>
                            </motion.tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};
