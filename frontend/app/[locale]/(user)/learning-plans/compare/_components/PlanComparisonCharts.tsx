'use client';

import classNames from 'classnames/bind';
import { useTranslations } from 'next-intl';
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
import { planStageLabel, planStatusLabel } from '@/app/features/learning-plans/planLabels';
import styles from '@/app/[locale]/(user)/learning-plans/compare/PlanComparison.module.scss';
import { brandColors } from '@/app/assets/styles/brandColors';

export type PlanComparisonChartRow = {
  key: string;
  label: string;
  readiness: number;
  status?: string;
  planStage?: string;
  createdAt?: string;
  diffVsPrev: number | null;
};

const cx = classNames.bind(styles);

const COLOR_ACTIVE = brandColors.primary;
const COLOR_COMPLETED = 'var(--green-500)';
const COLOR_REPLACED = 'var(--slate-400)';
const COLOR_ABANDONED = 'var(--red-500)';
const COLOR_DEFAULT = 'var(--slate-500)';

function barColor(status?: string) {
  if (status === 'ACTIVE') return COLOR_ACTIVE;
  if (status === 'COMPLETED') return COLOR_COMPLETED;
  if (status === 'REPLACED') return COLOR_REPLACED;
  if (status === 'ABANDONED') return COLOR_ABANDONED;
  return COLOR_DEFAULT;
}

function PlanComparisonTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload?: PlanComparisonChartRow }[];
}) {
  const t = useTranslations('LearningPlans');
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
        <strong>{t('common.baselineReadiness')}</strong> {row.readiness}%
      </p>
      <p>
        <strong>{t('compareCharts.status')}</strong> {planStatusLabel(t, row.status)}
      </p>
      {row.planStage && (
        <p>
          <strong>{t('common.stage')}</strong> {planStageLabel(t, row.planStage)}
        </p>
      )}
      {row.diffVsPrev != null && (
        <p>
          <strong>{t('compareCharts.vsPrev')}</strong>{' '}
          {row.diffVsPrev > 0 ? '+' : ''}
          {row.diffVsPrev}%
        </p>
      )}
      {row.createdAt && (
        <p>
          <strong>{t('common.created')}</strong> {row.createdAt}
        </p>
      )}
    </div>
  );
}

type PlanComparisonChartsProps = {
  chartData: PlanComparisonChartRow[];
  examTypeName?: string;
};

function PlanComparisonCharts({ chartData, examTypeName }: PlanComparisonChartsProps) {
  const t = useTranslations('LearningPlans');
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
          <span className={cx('statTileLabel')}>{t('compareCharts.planCount')}</span>
          <strong className={cx('statTileValue')}>{chartData.length}</strong>
        </div>
        <div className={cx('statTile')}>
          <span className={cx('statTileLabel')}>{t('compareCharts.baseline')}</span>
          <strong className={cx('statTileValue')}>{first}%</strong>
        </div>
        <div className={cx('statTile', 'statTileHighlight')}>
          <span className={cx('statTileLabel')}>{t('compareCharts.latest')}</span>
          <strong className={cx('statTileValue')}>{last}%</strong>
        </div>
        {totalDelta != null && chartData.length > 1 && (
          <div className={cx('statTile')}>
            <span className={cx('statTileLabel')}>{t('compareCharts.growth')}</span>
            <strong
              className={cx('statTileValue', {
                statTileDeltaUp: totalDelta > 0,
                statTileDeltaDown: totalDelta < 0,
              })}
            >
              {totalDelta > 0 ? '+' : ''}
              {totalDelta}%
            </strong>
          </div>
        )}
        {activePlan && (
          <div className={cx('statTile')}>
            <span className={cx('statTileLabel')}>{t('compareCharts.active')}</span>
            <strong className={cx('statTileValue')}>{activePlan.label}</strong>
          </div>
        )}
      </div>

      <div className={cx('chartCard')}>
        <div className={cx('chartCardHeader')}>
          <h3 className={cx('chartCardTitle')}>
            {t('compareCharts.chartTitle')}
            {examTypeName ? ` · ${examTypeName}` : ''}
          </h3>
        </div>
        <p className={cx('chartCardDesc')}>
          {t('compareCharts.chartDesc')}
        </p>

        <div className={cx('chartContainer')}>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart
              data={chartData}
              margin={{ top: 16, right: 16, left: 8, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--slate-200)" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: 'var(--slate-500)' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, Math.max(100, maxReadiness + 10)]}
                tick={{ fontSize: 12, fill: 'var(--slate-500)' }}
                tickLine={false}
                axisLine={false}
                unit="%"
              />
              <Tooltip content={<PlanComparisonTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                formatter={(value) => {
                  if (value === 'readiness') return t('compareCharts.legendReadiness');
                  if (value === 'diffVsPrev') return t('compareCharts.legendDiffVsPrev');
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
                  stroke={COLOR_DEFAULT}
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
          {t('compareCharts.note')}
        </p>
      </div>
    </div>
  );
}

export default PlanComparisonCharts;
