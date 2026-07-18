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

/**
 * Hệ màu minimalism cho trang Thống kê — chỉ 3 vai trò, dùng nhất quán mọi chart:
 * xanh dương = chính (số liệu cốt lõi), cam = accent duy nhất (KPI tỉ lệ), xám slate = nền/phụ.
 */
const VIZ = { primary: '#3b82f6', accent: '#f59e0b', muted: '#94a3b8' };
// Thứ tự khớp buildStatusDistribution: [Hoàn thành, Đang làm, Hết hạn].
const STATUS_COLORS = [VIZ.primary, VIZ.accent, VIZ.muted];

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
                dataKey="rate"
                name="Tỉ lệ hoàn thành (%)"
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
                    <Cell key={entry.name} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                ))}
            </Pie>
        </PieChart>
    </ResponsiveContainer>
);

export const MonthlyNewUsersBar = ({ data }) => (
    <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
                <linearGradient id="acNewUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#c4b5fd" />
                </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={GRID_STROKE} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={AXIS_TICK} />
            <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} allowDecimals={false} />
            <Tooltip {...TOOLTIP_STYLE} />
            <Bar dataKey="newUsers" name="Người dùng mới" fill="url(#acNewUsers)" radius={[6, 6, 0, 0]} barSize={28} />
        </BarChart>
    </ResponsiveContainer>
);

// Người dùng mới theo tháng — dạng đường (nhẹ hơn cột), đo tăng trưởng người dùng.
export const MonthlyNewUsersLine = ({ data }) => (
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
                name="Người dùng mới"
                stroke={VIZ.primary}
                strokeWidth={2.5}
                fill="url(#acNewUsersLine)"
                dot={{ r: 3, fill: VIZ.primary }}
                activeDot={{ r: 6 }}
            />
        </AreaChart>
    </ResponsiveContainer>
);

// Tooltip riêng cho biểu đồ lượt truy cập theo tháng: hiện thêm giờ cao điểm của tháng.
const MonthlyVisitsTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const row = payload[0].payload ?? {};
    const peak = row.peakHour;
    const hasPeak = peak !== null && peak !== undefined && peak >= 0;
    return (
        <div style={{ ...TOOLTIP_STYLE.contentStyle, padding: '8px 12px' }}>
            <div style={TOOLTIP_STYLE.labelStyle}>{label}</div>
            <div>Lượt truy cập: <strong>{row.visits ?? 0}</strong></div>
            <div style={{ color: '#64748b', marginTop: 2 }}>
                {hasPeak ? `Giờ cao điểm: ${String(peak).padStart(2, '0')}:00` : 'Chưa có truy cập'}
            </div>
        </div>
    );
};

export const MonthlyVisitsBar = ({ data }) => (
    <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
                <linearGradient id="acVisitsMonth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#93c5fd" />
                </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={GRID_STROKE} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={AXIS_TICK} />
            <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} allowDecimals={false} />
            <Tooltip {...TOOLTIP_STYLE} content={<MonthlyVisitsTooltip />} />
            <Bar dataKey="visits" name="Lượt truy cập" fill="url(#acVisitsMonth)" radius={[6, 6, 0, 0]} barSize={28} />
        </BarChart>
    </ResponsiveContainer>
);

// Tooltip gộp cho biểu đồ hoạt động theo tháng: truy cập, lượt thi, tỉ lệ hoàn thành + giờ cao điểm.
const MonthlyActivityTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const row = payload[0].payload ?? {};
    const peak = row.peakHour;
    const hasPeak = peak !== null && peak !== undefined && peak >= 0;
    return (
        <div style={{ ...TOOLTIP_STYLE.contentStyle, padding: '8px 12px' }}>
            <div style={TOOLTIP_STYLE.labelStyle}>{label}</div>
            <div>Lượt truy cập: <strong>{row.visits ?? 0}</strong></div>
            <div>Lượt thi: <strong>{row.tests ?? 0}</strong></div>
            <div>Tỉ lệ hoàn thành: <strong>{row.rate ?? 0}%</strong></div>
            <div style={{ color: '#64748b', marginTop: 2 }}>
                {hasPeak ? `Giờ cao điểm: ${String(peak).padStart(2, '0')}:00` : 'Chưa có truy cập'}
            </div>
        </div>
    );
};

// Gộp "Lượt truy cập theo tháng" + "Hiệu suất theo tháng": 2 cột nhóm (truy cập/lượt thi) trên trục
// trái, đường tỉ lệ hoàn thành (%) trên trục phải.
export const MonthlyActivityCombo = ({ data }) => (
    <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={GRID_STROKE} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={AXIS_TICK} />
            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={AXIS_TICK} allowDecimals={false} />
            <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tick={AXIS_TICK}
                unit="%"
            />
            <Tooltip {...TOOLTIP_STYLE} content={<MonthlyActivityTooltip />} />
            <Legend />
            <Bar yAxisId="left" dataKey="visits" name="Lượt truy cập" fill={VIZ.muted} radius={[4, 4, 0, 0]} barSize={16} />
            <Bar yAxisId="left" dataKey="tests" name="Lượt thi" fill={VIZ.primary} radius={[4, 4, 0, 0]} barSize={16} />
            <Line
                yAxisId="right"
                type="monotone"
                dataKey="rate"
                name="Tỉ lệ hoàn thành (%)"
                stroke={VIZ.accent}
                strokeWidth={2.5}
                dot={{ r: 3, fill: VIZ.accent }}
                activeDot={{ r: 6 }}
            />
        </ComposedChart>
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

// Sparkline mini — nhúng trong KPI card, không trục/lưới.
export const SparkArea = ({ data, dataKey = 'value', color = '#3b82f6', id = 'a' }) => (
    <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
            <defs>
                <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
            </defs>
            <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2}
                  fill={`url(#spark-${id})`} dot={false} isAnimationActive={false} />
        </AreaChart>
    </ResponsiveContainer>
);

export const SparkBar = ({ data, dataKey = 'value', color = '#3b82f6' }) => (
    <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }} barCategoryGap={1}>
            <Bar dataKey={dataKey} fill={color} radius={[2, 2, 0, 0]} isAnimationActive={false} />
        </BarChart>
    </ResponsiveContainer>
);

// Traffic dạng cột chồng (khách + đã đăng nhập) — kiểu "Traffic summary".
export const TrafficStackedBar = ({ data }) => (
    <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={GRID_STROKE} />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={AXIS_TICK} dy={8} />
            <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} allowDecimals={false} />
            <Tooltip {...TOOLTIP_STYLE} />
            <Legend />
            <Bar dataKey="users" name="Đã đăng nhập" stackId="1" fill="#3b82f6" radius={[0, 0, 0, 0]} barSize={26} />
            <Bar dataKey="guests" name="Khách" stackId="1" fill="#10b981" radius={[4, 4, 0, 0]} barSize={26} />
        </BarChart>
    </ResponsiveContainer>
);

export const TrafficAreaChart = ({ data }) => (
    <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <defs>
                <linearGradient id="acVisitUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="acVisitGuests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={GRID_STROKE} />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={AXIS_TICK} dy={8} />
            <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} allowDecimals={false} />
            <Tooltip {...TOOLTIP_STYLE} />
            <Legend />
            <Area
                type="monotone"
                dataKey="users"
                name="Đã đăng nhập"
                stackId="1"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#acVisitUsers)"
            />
            <Area
                type="monotone"
                dataKey="guests"
                name="Khách"
                stackId="1"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#acVisitGuests)"
            />
        </AreaChart>
    </ResponsiveContainer>
);

export const TrafficHourBar = ({ data }) => (
    <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
                <linearGradient id="acVisitHour" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#a5b4fc" />
                </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={GRID_STROKE} />
            <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ ...AXIS_TICK, fontSize: 10 }} interval={2} />
            <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} allowDecimals={false} />
            <Tooltip {...TOOLTIP_STYLE} />
            <Bar dataKey="visits" name="Lượt truy cập" fill="url(#acVisitHour)" radius={[4, 4, 0, 0]} />
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
