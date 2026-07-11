import classNames from 'classnames/bind';
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import styles from '../MockHistoryPage.module.scss';

const cx = classNames.bind(styles);

const READINESS_COLOR = '#10b981';
const BAR_TARGET_MET = '#10b981';
const BAR_DEFAULT = '#0061f2';
const BAR_BELOW = '#f59e0b';

function formatShortDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

function MockHistoryTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null;
  }
  const row = payload[0]?.payload;
  if (!row) {
    return null;
  }

  return (
    <div className={cx('chartTooltip')}>
      <p className={cx('chartTooltipTitle')}>{row.fullDate}</p>
      {row.totalScore != null && (
        <p>
          <strong>Điểm:</strong> {row.totalScore}
        </p>
      )}
      {row.readinessScore != null && (
        <p>
          <strong>Readiness:</strong> {row.readinessScore}%
        </p>
      )}
      {row.isTargetMet === true && (
        <p className={cx('chartTooltipSuccess')}>Đạt mục tiêu</p>
      )}
      {row.isTargetMet === false && (
        <p className={cx('chartTooltipWarn')}>Chưa đạt mục tiêu</p>
      )}
    </div>
  );
}

function MockHistoryCharts({ chartData, targetScore, loading, examTypeName }) {
  const scores = chartData
    .map((p) => p.totalScore)
    .filter((v) => v != null);
  const readinessValues = chartData
    .map((p) => p.readinessScore)
    .filter((v) => v != null);

  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;
  const maxScore = scores.length > 0 ? Math.max(...scores) : null;
  const latestReadiness =
    readinessValues.length > 0 ? readinessValues[readinessValues.length - 1] : null;

  const hasReadiness = readinessValues.length > 0;
  const hasScore = scores.length > 0;

  if (loading && chartData.length === 0) {
    return (
      <div className={cx('chartsSection')}>
        <div className={cx('chartLoading')}>Đang tải dữ liệu biểu đồ...</div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return null;
  }

  return (
    <div className={cx('chartsSection')}>
      <div className={cx('statsRow')}>
        <div className={cx('statTile')}>
          <span className={cx('statTileLabel')}>Số bài thi</span>
          <strong className={cx('statTileValue')}>{chartData.length}</strong>
        </div>
        {maxScore != null && (
          <div className={cx('statTile')}>
            <span className={cx('statTileLabel')}>Điểm cao nhất</span>
            <strong className={cx('statTileValue')}>{maxScore}</strong>
          </div>
        )}
        {avgScore != null && (
          <div className={cx('statTile')}>
            <span className={cx('statTileLabel')}>Điểm trung bình</span>
            <strong className={cx('statTileValue')}>{avgScore}</strong>
          </div>
        )}
        {latestReadiness != null && (
          <div className={cx('statTile')}>
            <span className={cx('statTileLabel')}>Readiness mới nhất</span>
            <strong className={cx('statTileValue')}>{latestReadiness}%</strong>
          </div>
        )}
        {targetScore != null && (
          <div className={cx('statTile', 'statTileHighlight')}>
            <span className={cx('statTileLabel')}>Mục tiêu</span>
            <strong className={cx('statTileValue')}>{targetScore}</strong>
          </div>
        )}
      </div>

      <div className={cx('chartCard')}>
        <div className={cx('chartCardHeader')}>
          <h3 className={cx('chartCardTitle')}>Tiến triển theo thời gian</h3>
          {examTypeName && (
            <span className={cx('chartCardMeta')}>{examTypeName}</span>
          )}
        </div>
        <p className={cx('chartCardDesc')}>
          Trục ngang: thứ tự bài thi từ cũ → mới. Cột = điểm tổng · đường = readiness %.
        </p>

        {loading && (
          <p className={cx('chartLoadingInline')}>Đang bổ sung readiness cho các bài cũ...</p>
        )}

        <div className={cx('chartContainer')}>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart
              data={chartData}
              margin={{ top: 12, right: hasReadiness ? 48 : 16, left: 8, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis
                dataKey="dateLabel"
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickLine={false}
              />
              {hasScore && (
                <YAxis
                  yAxisId="score"
                  orientation="left"
                  domain={[0, 990]}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  label={{
                    value: 'Điểm',
                    angle: -90,
                    position: 'insideLeft',
                    style: { fontSize: 11, fill: '#94a3b8' },
                  }}
                />
              )}
              {hasReadiness && (
                <YAxis
                  yAxisId="readiness"
                  orientation="right"
                  domain={[0, 100]}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  label={{
                    value: 'Readiness %',
                    angle: 90,
                    position: 'insideRight',
                    style: { fontSize: 11, fill: '#94a3b8' },
                  }}
                />
              )}
              <Tooltip content={<MockHistoryTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                formatter={(value) => {
                  if (value === 'totalScore') return 'Điểm tổng';
                  if (value === 'readinessScore') return 'Readiness';
                  return value;
                }}
              />
              {targetScore != null && hasScore && (
                <ReferenceLine
                  yAxisId="score"
                  y={targetScore}
                  stroke="#ef4444"
                  strokeDasharray="6 4"
                  label={{
                    value: `Mục tiêu ${targetScore}`,
                    position: 'insideTopRight',
                    fill: '#ef4444',
                    fontSize: 11,
                  }}
                />
              )}
              {hasScore && (
                <Bar
                  yAxisId="score"
                  dataKey="totalScore"
                  name="totalScore"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                >
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.key}
                      fill={
                        entry.isTargetMet === true
                          ? BAR_TARGET_MET
                          : entry.isTargetMet === false
                            ? BAR_BELOW
                            : BAR_DEFAULT
                      }
                    />
                  ))}
                </Bar>
              )}
              {hasReadiness && (
                <Line
                  yAxisId="readiness"
                  type="monotone"
                  dataKey="readinessScore"
                  name="readinessScore"
                  stroke={READINESS_COLOR}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: READINESS_COLOR, strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <p className={cx('chartLegendNote')}>
          Cột xanh lá = đạt mục tiêu · xanh dương = chưa xác định · vàng = chưa đạt.
          {targetScore != null && ' Đường đỏ đứt nét = điểm mục tiêu.'}
        </p>
      </div>
    </div>
  );
}

export default MockHistoryCharts;
