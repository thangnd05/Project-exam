'use client';

import classNames from 'classnames/bind';
import { useTranslations } from 'next-intl';

import styles from './TrafficHeatmap.module.scss';
import type { DayHours } from '@/app/types/admin';

const cx = classNames.bind(styles);

const HOUR_TICKS = [0, 3, 6, 9, 12, 15, 18, 21];

const TrafficHeatmap = ({ data = [] }: { data?: DayHours[] }) => {
    const t = useTranslations('AdminCommon.heatmap');
    if (!data.length) {
        return <div className={cx('empty')}>{t('empty')}</div>;
    }

    const max = data.reduce(
        (m, row) => Math.max(m, ...(row.hours ?? [0])),
        0,
    ) || 1;

    const shade = (v: number) => {
        if (!v) return '#f1f5f9';
        const alpha = 0.18 + 0.82 * (v / max);
        return `rgba(201, 168, 75, ${alpha})`;
    };

    return (
        <div className={cx('heatmap')}>
            {data.map((row) => (
                <div key={row.day} className={cx('row')}>
                    <span className={cx('dayLabel')}>{row.day}</span>
                    <div className={cx('cells')}>
                        {(row.hours ?? []).map((v, h) => (
                            <div
                                key={h}
                                className={cx('cell')}
                                style={{ background: shade(v) }}
                                title={t('cellTitle', { day: row.day ?? '', hour: String(h).padStart(2, '0'), count: v })}
                            />
                        ))}
                    </div>
                </div>
            ))}

            <div className={cx('axisRow')}>
                <span className={cx('dayLabel')} />
                <div className={cx('cells')}>
                    {Array.from({ length: 24 }).map((_, h) => (
                        <span key={h} className={cx('hourTick')}>
                            {HOUR_TICKS.includes(h) ? String(h).padStart(2, '0') : ''}
                        </span>
                    ))}
                </div>
            </div>

            <div className={cx('legend')}>
                <span>{t('less')}</span>
                <span className={cx('legendScale')} />
                <span>{t('more')}</span>
            </div>
        </div>
    );
};

export default TrafficHeatmap;
