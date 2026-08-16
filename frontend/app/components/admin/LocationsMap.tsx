'use client';

import { useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import worldGeo from 'world-atlas/countries-110m.json';
import classNames from 'classnames/bind';

import styles from './LocationsMap.module.scss';
import { brandColors } from '@/app/assets/styles/brandColors';
import type { CountryTraffic } from '@/app/types/admin';

const cx = classNames.bind(styles);

const brand = brandColors;

const norm = (s?: string) =>
    (s || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .trim();

const ALIAS: Record<string, string> = {
    'united states': 'united states of america',
    'czechia': 'czech republic',
    'the netherlands': 'netherlands',
};
const canon = (name?: string) => ALIAS[norm(name)] || norm(name);

const isRealCountry = (c: CountryTraffic) => c.code && c.code !== 'LO' && c.code !== '??';

const LocationsMap = ({ countries = [] }: { countries?: CountryTraffic[] }) => {
    const [hover, setHover] = useState<{ name?: string; v: number } | null>(null);

    const counts: Record<string, number> = {};
    let max = 1;
    countries.filter(isRealCountry).forEach((c) => {
        counts[canon(c.name)] = c.value;
        max = Math.max(max, c.value);
    });

    const hasData = Object.keys(counts).length > 0;

    const fill = (name?: string) => {
        const v = counts[norm(name)];
        if (!v) return '#e9eef5';
        const t = 0.25 + 0.75 * (v / max);
        return `rgba(20, 184, 166, ${t})`;
    };

    return (
        <div className={cx('mapWrap')}>
            <ComposableMap
                projection="geoEqualEarth"
                projectionConfig={{ scale: 150 }}
                height={330}
                style={{ width: '100%', height: 'auto' }}
            >
                <Geographies geography={worldGeo}>
                    {({ geographies }: { geographies: any[] }) =>
                        geographies.map((geo: any) => {
                            const name = geo.properties.name;
                            const v = counts[norm(name)] || 0;
                            return (
                                <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    fill={fill(name)}
                                    stroke="#ffffff"
                                    strokeWidth={0.4}
                                    onMouseEnter={() => setHover({ name, v })}
                                    onMouseLeave={() => setHover(null)}
                                    style={{
                                        default: { outline: 'none' },
                                        hover: { fill: brand.primary, outline: 'none' },
                                        pressed: { outline: 'none' },
                                    }}
                                />
                            );
                        })
                    }
                </Geographies>
            </ComposableMap>
            <div className={cx('caption')}>
                {hover
                    ? `${hover.name}: ${hover.v} lượt`
                    : hasData
                        ? 'Di chuột lên bản đồ để xem chi tiết'
                        : 'Chưa có lượt truy cập từ IP công cộng (local hiển thị "Local")'}
            </div>
        </div>
    );
};

export default LocationsMap;
