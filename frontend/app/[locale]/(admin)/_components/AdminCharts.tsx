'use client';

import {
    ResponsiveContainer,
    AreaChart,
    Area,
    Bar,
    ComposedChart,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts';
import type { TooltipContentProps } from 'recharts';
import { useTranslations } from 'next-intl';
import { brandColors } from '@/app/assets/styles/brandColors';
import type { MonthPerformance } from '@/app/types/admin';

const brand = brandColors;

type ChartTooltipProps = Partial<TooltipContentProps<number, string>>;

const VIZ = { primary: brand.accent, muted: '#94a3b8' };

const AXIS_TICK = { fill: '#64748b', fontSize: 12 };
const GRID_STROKE = '#e2e8f0';

const TOOLTIP_STYLE = {
    contentStyle: {
        background: 'var(--bg-white)',
        border: 'none',
        borderRadius: 10,
        boxShadow: '0 6px 18px rgba(15, 23, 42, 0.12)',
        color: 'var(--text-color)',
    },
    labelStyle: { color: 'var(--text-color)', fontWeight: 600, marginBottom: 4 },
    cursor: { fill: 'rgba(148, 163, 184, 0.1)' },
};

export const MonthlyNewUsersLine = ({ data }: { data: MonthPerformance[] }) => {
    const t = useTranslations('AdminCommon.charts');
    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                    <linearGradient id="acNewUsersLine" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={VIZ.primary} stopOpacity={0.18} />
                        <stop offset="100%" stopColor={VIZ.primary} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={GRID_STROKE} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={AXIS_TICK} />
                <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} allowDecimals={false} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Area
                    type="monotone"
                    dataKey="newUsers"
                    name={t('newUsers')}
                    stroke={VIZ.primary}
                    strokeWidth={2.5}
                    fill="url(#acNewUsersLine)"
                    dot={{ r: 3, fill: VIZ.primary }}
                    activeDot={{ r: 6 }}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
};

const MonthlyActivityTooltip = ({ active, payload, label }: ChartTooltipProps) => {
    const t = useTranslations('AdminCommon.charts');
    if (!active || !payload?.length) return null;
    const row = payload[0].payload ?? {};
    const peak = row.peakHour;
    const hasPeak = peak !== null && peak !== undefined && peak >= 0;
    return (
        <div style={{ ...TOOLTIP_STYLE.contentStyle, padding: '8px 12px' }}>
            <div style={TOOLTIP_STYLE.labelStyle}>{label}</div>
            <div>{t.rich('tooltipVisits', { value: row.visits ?? 0, strong: (chunks) => <strong>{chunks}</strong> })}</div>
            <div>{t.rich('tooltipAttempts', { value: row.tests ?? 0, strong: (chunks) => <strong>{chunks}</strong> })}</div>
            <div style={{ color: '#64748b', marginTop: 2 }}>
                {hasPeak ? t('peakHour', { hour: String(peak).padStart(2, '0') }) : t('noVisits')}
            </div>
        </div>
    );
};

export const MonthlyActivityCombo = ({ data }: { data: MonthPerformance[] }) => {
    const t = useTranslations('AdminCommon.charts');
    return (
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={GRID_STROKE} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={AXIS_TICK} />
                <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} allowDecimals={false} />
                <Tooltip {...TOOLTIP_STYLE} content={<MonthlyActivityTooltip />} />
                <Legend />
                <Bar dataKey="visits" name={t('visits')} fill={VIZ.muted} radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="tests" name={t('attempts')} fill={VIZ.primary} radius={[4, 4, 0, 0]} barSize={16} />
            </ComposedChart>
        </ResponsiveContainer>
    );
};
