import React from 'react';
import classNames from 'classnames/bind';
import styles from '../TargetDashboardPage.module.scss';

const cx = classNames.bind(styles);

function formatPercent(value) {
  if (value == null || Number.isNaN(value)) {
    return '—';
  }
  return `${Number(value).toFixed(1)}%`;
}

function PartRowTooltip({ row }) {
  const hasCurrent = row.current != null;

  return (
    <div className={cx('partChartTooltip', 'partRowHoverTooltip')}>
      <div className={cx('partChartTooltipRow')}>
        <span className={cx('partChartTooltipLabel')}>Aim</span>
        <strong>{row.aim}%</strong>
      </div>
      <div className={cx('partChartTooltipRow')}>
        <span className={cx('partChartTooltipLabel')}>Hiện tại</span>
        <strong>{hasCurrent ? formatPercent(row.current) : '—'}</strong>
      </div>
      <p className={cx('partChartTooltipStatus')}>
        {!hasCurrent
          ? 'Chưa có dữ liệu mock'
          : row.reached
            ? 'Đạt aim'
            : `Còn ${(row.aim - row.current).toFixed(1)}% để đạt aim`}
      </p>
    </div>
  );
}

function TargetDashboardPartChart({ rows }) {
  if (!rows.length) {
    return (
      <p className={cx('emptyPartHint')}>
        Chưa có yêu cầu từng part. Hãy cập nhật mục tiêu tại trang Cài đặt target.
      </p>
    );
  }

  return (
    <div className={cx('partChartWrap')}>
      <p className={cx('partChartHint')}>
        Di chuột lên thanh để xem Aim, Hiện tại và trạng thái.
      </p>

      <ul className={cx('partCompareList')}>
        {rows.map((row) => {
          const hasCurrent = row.current != null;
          const currentPct = hasCurrent ? Math.min(100, Math.max(0, row.current)) : 0;
          const aimPct = Math.min(100, Math.max(0, row.aim));

          return (
            <li key={row.key} className={cx('partCompareRow')} tabIndex={0}>
              <PartRowTooltip row={row} />

              <div className={cx('partCompareHead')}>
                <span className={cx('partCompareName')}>{row.name}</span>
              </div>

              <div className={cx('partCompareTrackWrap')}>
                <div className={cx('partCompareScale')}>
                  <span>0%</span>
                  <span
                    className={cx('partCompareAimScaleLabel')}
                    style={{ left: `${aimPct}%` }}
                  >
                    aim {aimPct}%
                  </span>
                  <span>100%</span>
                </div>
                <div
                  className={cx('partCompareTrack')}
                  role="img"
                  aria-label={`${row.name}: hiện tại ${hasCurrent ? formatPercent(row.current) : 'chưa có'}, aim ${aimPct}%`}
                >
                  <div
                    className={cx('partCompareFill', {
                      ok: hasCurrent && row.reached,
                      gap: hasCurrent && !row.reached,
                      empty: !hasCurrent,
                    })}
                    style={{ width: hasCurrent ? `${currentPct}%` : '0%' }}
                  />
                  <div
                    className={cx('partCompareAimMark')}
                    style={{ left: `${aimPct}%` }}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className={cx('partCompareLegend')}>
        <span className={cx('partCompareLegendItem')}>
          <span className={cx('partCompareLegendSwatch', 'fillOk')} />
          Thanh xanh lá
        </span>
        <span className={cx('partCompareLegendItem')}>
          <span className={cx('partCompareLegendSwatch', 'fillGap')} />
          Thanh cam
        </span>
        <span className={cx('partCompareLegendItem')}>
          <span className={cx('partCompareLegendSwatch', 'aimMark')} />
          Vạch aim
        </span>
      </div>
    </div>
  );
}

export default TargetDashboardPartChart;
