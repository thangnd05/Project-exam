'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { brandColors } from '@/app/assets/styles/brandColors';

const chartColors = brandColors;

const formatDuration = (minutes: unknown) => {
  const total = Math.max(0, Math.round(Number(minutes) || 0));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h > 0) return m > 0 ? `${h}h ${m}p` : `${h}h`;
  return `${m}p`;
};

type DailyPoint = { day: number | string; minutes: number };

export const DailyActivityBar = ({ data }: { data: DailyPoint[] }) => (
  <ResponsiveContainer width="100%" height={250}>
    <BarChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} />
      <XAxis dataKey="day" interval={2} tick={{ fontSize: 11 }} />
      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} unit="p" width={40} />
      <RechartsTooltip
        cursor={{ fill: 'rgba(0,0,0,0.04)' }}
        labelFormatter={(d) => `Ngày ${d}`}
        formatter={(value) => [formatDuration(value), 'Thời gian']}
      />
      <Bar dataKey="minutes" radius={[4, 4, 0, 0]} maxBarSize={28} fill={chartColors.primary} />
    </BarChart>
  </ResponsiveContainer>
);

type MonthlyPoint = { month?: string; label: string; minutes: number };

type MonthlyTimeLineProps = {
  data: MonthlyPoint[];
  formatMonthLabel: (value?: string) => string;
};

export const MonthlyTimeLine = ({ data, formatMonthLabel }: MonthlyTimeLineProps) => (
  <ResponsiveContainer width="100%" height={250}>
    <LineChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} />
      <XAxis dataKey="label" interval={0} tick={{ fontSize: 11 }} />
      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} unit="p" width={40} />
      <RechartsTooltip
        formatter={(value) => [formatDuration(value), 'Thời gian học']}
        labelFormatter={(label, items) => formatMonthLabel(items?.[0]?.payload?.month) || label}
      />
      <Line
        type="monotone"
        dataKey="minutes"
        stroke={chartColors.primary}
        strokeWidth={2}
        dot={{ r: 4 }}
        activeDot={{ r: 6 }}
      />
    </LineChart>
  </ResponsiveContainer>
);
