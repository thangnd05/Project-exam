'use client';

import classNames from 'classnames/bind';

import styles from './TrafficHeatmap.module.scss';

const cx = classNames.bind(styles);

const HOUR_TICKS = [0, 3, 6, 9, 12, 15, 18, 21];

const TrafficHeatmap = ({ data = [] }) => {
    if (!data.length) {
        return <div className={cx('empty')}>Chưa có dữ liệu truy cập</div>;
    }

    const max = data.reduce(
        (m, row) => Math.max(m, ...(row.hours ?? [0])),
        0,
    ) || 1;

    const shade = (v) => {
        if (!v) return '#f1f5f9';
        const t = 0.18 + 0.82 * (v / max);
        return `rgba(20, 184, 166, ${t})`;
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
                                title={`${row.day} ${String(h).padStart(2, '0')}:00  ${v} lượt truy cập`}
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
                <span>Ít</span>
                <span className={cx('legendScale')} />
                <span>Nhiều</span>
            </div>
        </div>
    );
};

export default TrafficHeatmap;
