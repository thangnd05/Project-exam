import React from 'react';
import classNames from 'classnames/bind';
import {
  Bar,
  CartesianGrid,
  Cell,
  Line,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import styles from '../styles/PlanComparisonPage.module.scss';

const cx = classNames.bind(styles);

const COLOR_ACTIVE = '#0061f2';
const COLOR_COMPLETED = '#10b981';
const COLOR_REPLACED = '#94a3b8';
const COLOR_ABANDONED = '#ef4444';
const COLOR_DEFAULT = '#64748b';

const STATUS_LABEL = {
  ACTIVE: 'Đang học',
  COMPLETED: 'Hoàn thành',
  REPLACED: 'Đã thay',
  ABANDONED: 'Đã bỏ',
};

function barColor(status) {
  if (status === 'ACTIVE') return COLOR_ACTIVE;
  if (status === 'COMPLETED') return COLOR_COMPLETED;
  if (status === 'REPLACED') return COLOR_REPLACED;
  if (status === 'ABANDONED') return COLOR_ABANDONED;
  return COLOR_DEFAULT;
}

function PlanComparisonTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null;
  }
  const row = payload[0]?.payload;
  if (!row) {
    return null;
  }

  return (
    <div className={cx('chartTooltip')}>
      <p className={cx('chartTooltipTitle')}>{row.label}</p>
      <p>
        <strong>Baseline readiness:</strong> {row.readiness}%
      </p>
      <p>
        <strong>Trạng thái:</strong> {STATUS_LABEL[row.status] || row.status}
      </p>
      {row.planStage && (
        <p>
          <strong>Giai đoạn:</strong> {row.planStage}
        </p>
      )}
      {row.diffVsPrev != null && (
        <p>
          <strong>So với plan trước:</strong>{' '}
          {row.diffVsPrev > 0 ? '+' : ''}
          {row.diffVsPrev}%
        </p>
      )}
      {row.createdAt && (
        <p>
          <strong>Tạo:</strong> {row.createdAt}
        </p>
      )}
    </div>
  );
}

function PlanComparisonCharts({ chartData, examTypeName }) {
  if (!chartData.length) {
    return null;
  }

  const readinessValues = chartData.map((p) => p.readiness);
  const first = readinessValues[0];
  const last = readinessValues[readinessValues.length - 1];
  const totalDelta = first != null && last != null ? last - first : null;
  const maxReadiness = Math.max(...readinessValues);
  const activePlan = chartData.find((p) => p.status === 'ACTIVE');

  return (
    <div className={cx('chartsSection')}>
      <div className={cx('statsRow')}>
        <div className={cx('statTile')}>
          <span className={cx('statTileLabel')}>Số plan</span>
          <strong className={cx('statTileValue')}>{chartData.length}</strong>
        </div>
        <div className={cx('statTile')}>
          <span className={cx('statTileLabel')}>Readiness đầu</span>
          <strong className={cx('statTileValue')}>{first}%</strong>
        </div>
        <div className={cx('statTile', 'statTileHighlight')}>
          <span className={cx('statTileLabel')}>Readiness mới nhất</span>
          <strong className={cx('statTileValue')}>{last}%</strong>
        </div>
        {totalDelta != null && chartData.length > 1 && (
          <div className={cx('statTile')}>
            <span className={cx('statTileLabel')}>Tăng từ plan đầu</span>
            <strong
              className={classNames(cx('statTileValue'), {
                [cx('statTileDeltaUp')]: totalDelta > 0,
                [cx('statTileDeltaDown')]: totalDelta < 0,
              })}
            >
              {totalDelta > 0 ? '+' : ''}
              {totalDelta}%
            </strong>
          </div>
        )}
        {activePlan && (
          <div className={cx('statTile')}>
            <span className={cx('statTileLabel')}>Đang học</span>
            <strong className={cx('statTileValue')}>{activePlan.label}</strong>
          </div>
        )}
      </div>

      <div className={cx('chartCard')}>
        <div className={cx('chartCardHeader')}>
          <h3 className={cx('chartCardTitle')}>
            Tiến triển baseline readiness qua các plan
            {examTypeName ? ` · ${examTypeName}` : ''}
          </h3>
        </div>
        <p className={cx('chartCardDesc')}>
          Trục ngang: thứ tự plan (#1 → mới nhất). Cột = baseline readiness khi tạo plan từ mock.
        </p>

        <div className={cx('chartContainer')}>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart
              data={chartData}
              margin={{ top: 16, right: 16, left: 8, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, Math.max(100, maxReadiness + 10)]}
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
                unit="%"
              />
              <Tooltip content={<PlanComparisonTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                formatter={(value) => {
                  if (value === 'readiness') return 'Baseline readiness';
                  if (value === 'diffVsPrev') return 'Chênh vs plan trước';
                  return value;
                }}
              />
              <Bar
                dataKey="readiness"
                name="readiness"
                radius={[6, 6, 0, 0]}
                maxBarSize={56}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.key} fill={barColor(entry.status)} />
                ))}
              </Bar>
              {chartData.length > 1 && (
                <Line
                  type="monotone"
                  dataKey="readiness"
                  name="trend"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  legendType="none"
                  activeDot={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <p className={cx('chartLegendNote')}>
          Xanh dương = đang học · xanh lá = hoàn thành · xám = đã thay · đỏ = đã bỏ.
          Baseline không đổi khi pass ải — chỉ mock mới + plan mới mới tăng readiness.
        </p>
      </div>
    </div>
  );
}

export default PlanComparisonCharts;
