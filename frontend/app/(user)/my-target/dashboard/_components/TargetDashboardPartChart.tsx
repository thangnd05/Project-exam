'use client';

import classNamesBind from 'classnames/bind';
import uiStyles from '@/app/assets/styles/diagnostic/TargetPlanPage.module.scss';
import styles from './TargetDashboardPartChart.module.scss';

const cx = classNamesBind.bind(styles);
const ui = classNamesBind.bind(uiStyles);

export type PartChartRow = {
  key: string;
  name: string;
  aim: number;
  current: number | null;
  reached: boolean;
};

function formatPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) {
    return '-';
  }
  return `${Number(value).toFixed(1)}%`;
}

function TargetDashboardPartChart({ rows }: { rows: PartChartRow[] }) {
  if (!rows.length) {
    return (
      <p className={cx('emptyHint')}>
        Chưa có mục tiêu cho từng phần. Hãy cập nhật ở trang Mục tiêu.
      </p>
    );
  }

  return (
    <>
      <ul className={cx('list')}>
        {rows.map((row) => {
          const hasCurrent = row.current != null;
          const currentPct = row.current != null ? Math.min(100, Math.max(0, row.current)) : 0;
          const aimPct = Math.min(100, Math.max(0, row.aim));

          return (
            <li key={row.key} className={cx('row')}>
              <div className={cx('head')}>
                <span className={cx('name')}>{row.name}</span>
                <span className={cx('values')}>
                  <strong>{hasCurrent ? formatPercent(row.current) : '—'}</strong> / {aimPct}%
                </span>
                <span
                  className={ui(
                    'pill',
                    !hasCurrent ? null : row.reached ? 'pillSuccess' : 'pillWarning',
                  )}
                >
                  {!hasCurrent
                    ? 'Chưa có dữ liệu'
                    : row.reached
                      ? 'Đạt'
                      : `Còn ${(row.aim - (row.current ?? 0)).toFixed(1)}%`}
                </span>
              </div>
              <div
                className={cx('track')}
                role="img"
                aria-label={`${row.name}: hiện tại ${hasCurrent ? formatPercent(row.current) : 'chưa có'}, mục tiêu ${aimPct}%`}
              >
                <span
                  className={cx('fill', { ok: hasCurrent && row.reached, gap: hasCurrent && !row.reached })}
                  style={{ width: hasCurrent ? `${currentPct}%` : '0%' }}
                />
                <span className={cx('aim')} style={{ left: `${aimPct}%` }} />
              </div>
            </li>
          );
        })}
      </ul>

      <div className={cx('legend')}>
        <span>
          <i className={cx('swatch', 'ok')} />
          Đạt mục tiêu
        </span>
        <span>
          <i className={cx('swatch', 'gap')} />
          Chưa đạt
        </span>
        <span>
          <i className={cx('swatch', 'aimSwatch')} />
          Vạch mục tiêu
        </span>
      </div>
    </>
  );
}

export default TargetDashboardPartChart;
