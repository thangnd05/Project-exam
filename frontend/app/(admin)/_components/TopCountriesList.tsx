'use client';

import classNames from 'classnames/bind';

import styles from './LocationsMap.module.scss';
import type { CountryTraffic } from '@/app/types/admin';

const cx = classNames.bind(styles);

export const flagLabel = (code?: string) => {
    if (code === 'LO') return '🏠';
    if (!code || code.length !== 2 || code === '??') return '🌐';
    return code.toUpperCase();
};

export const TopCountriesList = ({ countries = [] }: { countries?: CountryTraffic[] }) => {
    const visible = countries.filter((c) => c.code !== 'LO' && c.name !== 'Local');
    const max = visible.reduce((m, c) => Math.max(m, c.value), 0) || 1;
    if (!visible.length) {
        return <span className={cx('empty')}>Chưa có dữ liệu vị trí</span>;
    }
    return (
        <div className={cx('countryList')}>
            {visible.map((c) => (
                <div key={`${c.code}-${c.name}`} className={cx('countryRow')}>
                    <div className={cx('countryInfo')}>
                        <span className={cx('flag')}>{flagLabel(c.code)}</span>
                        <span className={cx('countryName')} title={c.name}>{c.name}</span>
                        <span className={cx('countryCount')}>{c.value}</span>
                    </div>
                    <div className={cx('countryTrack')}>
                        <div className={cx('countryBar')} style={{ width: `${Math.max(6, (c.value / max) * 100)}%` }} />
                    </div>
                </div>
            ))}
        </div>
    );
};
