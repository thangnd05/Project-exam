import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import planStyles from '~/features/diagnostic/styles/PersonalizedPlan.module.scss';
import styles from '../TargetDashboardPage.module.scss';
import { brandColors } from '~/shared/styles/brandColors';

const cx = classNames.bind(styles);
const planCx = classNames.bind(planStyles);

function TargetDashboardMockSparkline({ data, examTypeId, targetScore }) {
  if (!data.length) {
    return null;
  }

  return (
    <div className={classNames(planCx('card'), cx('mockSparklineCard'))}>
      <div className={planCx('cardBody')}>
        <div className={cx('mockSparklineHeader')}>
          <h3 className={cx('mockSparklineTitle')}>Điểm các mock gần đây</h3>
          <Link
            to={examTypeId ? `/my-target/mocks?examTypeId=${examTypeId}` : '/my-target/mocks'}
            className={planCx('btn', 'btnGhost', 'btnSm')}
          >
            Xem đầy đủ
          </Link>
        </div>
        <div className={cx('sparklineContainer')}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 990]} tick={{ fontSize: 11 }} width={40} />
              <Tooltip
                formatter={(value) => [`${value} điểm`, 'Score']}
                labelFormatter={(label) => label}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke={brandColors.primary}
                strokeWidth={2}
                dot={{ r: 4, fill: brandColors.primary }}
                activeDot={{ r: 5 }}
              />
              {targetScore != null && (
                <ReferenceLine
                  y={targetScore}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{
                    value: `Mục tiêu ${targetScore}`,
                    position: 'insideTopRight',
                    fill: '#ef4444',
                    fontSize: 11,
                  }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default TargetDashboardMockSparkline;
