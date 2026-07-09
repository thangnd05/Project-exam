import React from 'react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    ComposedChart,
    Line,
    PieChart,
    Pie,
    Cell,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts';

export const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const AXIS_TICK = { fill: '#64748b', fontSize: 12 };
const GRID_STROKE = '#e2e8f0';

const TOOLTIP_STYLE = {
    contentStyle: {
        background: 'rgba(255, 255, 255, 0.97)',
        border: 'none',
        borderRadius: 10,
        boxShadow: '0 6px 18px rgba(15, 23, 42, 0.12)',
        color: '#1e293b',
    },
    labelStyle: { color: '#1e293b', fontWeight: 600, marginBottom: 4 },
    cursor: { fill: 'rgba(148, 163, 184, 0.1)' },
};

export const WeeklyActivityArea = ({ data }) => (
    <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <defs>
                <linearGradient id="acUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="acExams" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={GRID_STROKE} />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={AXIS_TICK} dy={8} />
            <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} />
            <Tooltip {...TOOLTIP_STYLE} />
            <Legend />
            <Area
                type="monotone"
                dataKey="users"
                name="Người dùng mới"
                stroke="#3b82f6"
                strokeWidth={3}
                fill="url(#acUsers)"
                dot={{ r: 3, fill: '#3b82f6' }}
                activeDot={{ r: 6 }}
            />
            <Area
                type="monotone"
                dataKey="exams"
                name="Bài thi"
                stroke="#10b981"
                strokeWidth={3}
                fill="url(#acExams)"
                dot={{ r: 3, fill: '#10b981' }}
                activeDot={{ r: 6 }}
            />
        </AreaChart>
    </ResponsiveContainer>
);

export const MonthlyPerformanceCombo = ({ data }) => (
    <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
                <linearGradient id="acTests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#60a5fa" />
                </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={GRID_STROKE} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={AXIS_TICK} />
            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={AXIS_TICK} />
            <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tick={AXIS_TICK}
            />
            <Tooltip {...TOOLTIP_STYLE} />
            <Legend />
            <Bar
                yAxisId="left"
                dataKey="tests"
                name="Số bài thi"
                fill="url(#acTests)"
                radius={[6, 6, 0, 0]}
                barSize={28}
            />
            <Line
                yAxisId="right"
                type="monotone"
                dataKey="avgScore"
                name="Điểm TB"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ r: 4, fill: '#f59e0b' }}
                activeDot={{ r: 6 }}
            />
        </ComposedChart>
    </ResponsiveContainer>
);

export const ExamTypeDonut = ({ data }) => (
    <ResponsiveContainer width="100%" height="100%">
        <PieChart>
            <Tooltip {...TOOLTIP_STYLE} />
            <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" />
            <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="40%"
                cy="50%"
                innerRadius="55%"
                outerRadius="80%"
                paddingAngle={2}
                stroke="#fff"
                strokeWidth={2}
            >
                {data.map((entry, index) => (
                    <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
            </Pie>
        </PieChart>
    </ResponsiveContainer>
);

export const SkillRadar = ({ data }) => (
    <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="70%">
            <PolarGrid stroke="rgba(59, 130, 246, 0.18)" />
            <PolarAngleAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
                name="Kỹ năng TB"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="#3b82f6"
                fillOpacity={0.3}
            />
            <Tooltip {...TOOLTIP_STYLE} />
        </RadarChart>
    </ResponsiveContainer>
);

export const UserGrowthBar = ({ data }) => (
    <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
                <linearGradient id="acGrowth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={GRID_STROKE} />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={AXIS_TICK} />
            <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} />
            <Tooltip {...TOOLTIP_STYLE} />
            <Bar dataKey="users" name="Người dùng" fill="url(#acGrowth)" radius={[6, 6, 0, 0]} barSize={32} />
        </BarChart>
    </ResponsiveContainer>
);

export const ScoreDistributionBar = ({ data }) => (
    <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
                <linearGradient id="acScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={GRID_STROKE} />
            <XAxis dataKey="range" axisLine={false} tickLine={false} tick={AXIS_TICK} />
            <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} />
            <Tooltip {...TOOLTIP_STYLE} />
            <Bar dataKey="count" name="Học viên" fill="url(#acScore)" radius={[6, 6, 0, 0]} barSize={48} />
        </BarChart>
    </ResponsiveContainer>
);
