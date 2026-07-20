import { useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import worldGeo from 'world-atlas/countries-110m.json';
import classNames from 'classnames/bind';

import styles from './LocationsMap.module.scss';
import { brandColors } from '~/shared/styles/brandColors';

const cx = classNames.bind(styles);

const norm = (s) =>
    (s || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .trim();

// Tên từ ip-api đôi khi khác world-atlas — quy về tên chuẩn của bản đồ.
const ALIAS = {
    'united states': 'united states of america',
    'czechia': 'czech republic',
    'the netherlands': 'netherlands',
};
const canon = (name) => ALIAS[norm(name)] || norm(name);

const isRealCountry = (c) => c.code && c.code !== 'LO' && c.code !== '??';

/**
 * Nhãn quốc gia hiển thị trong danh sách: mã ISO alpha-2 (vd "VN") cho quốc gia thật,
 * emoji cho local/không xác định. Không dùng cờ emoji vì Windows không render, gây lệch hàng.
 */
export const flagLabel = (code) => {
    if (code === 'LO') return '🏠';
    if (!code || code.length !== 2 || code === '??') return '🌐';
    return code.toUpperCase();
};

export const TopCountriesList = ({ countries = [] }) => {
    // Ẩn "Local" (IP nội bộ/localhost) khỏi danh sách top quốc gia.
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

const LocationsMap = ({ countries = [] }) => {
    const [hover, setHover] = useState(null);

    const counts = {};
    let max = 1;
    countries.filter(isRealCountry).forEach((c) => {
        counts[canon(c.name)] = c.value;
        max = Math.max(max, c.value);
    });

    const hasData = Object.keys(counts).length > 0;

    const fill = (name) => {
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
                    {({ geographies }) =>
                        geographies.map((geo) => {
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
                                        hover: { fill: brandColors.primary, outline: 'none' },
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
