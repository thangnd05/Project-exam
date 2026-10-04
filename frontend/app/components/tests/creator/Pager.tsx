'use client';

import classNames from 'classnames/bind';
import styles from '../CreateTestModal.module.scss';

const cx = classNames.bind(styles);

export const PAGE_SIZE = 20;

export const pageCountOf = (total: number, pageSize = PAGE_SIZE) => Math.max(1, Math.ceil(total / pageSize));

type PagerProps = {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
};

/** Phân trang danh sách câu hỏi: vẽ cả nghìn câu một lúc làm trang giật. */
const Pager = ({ page, pageCount, onChange }: PagerProps) => {
  if (pageCount <= 1) return null;
  return (
    <div className={cx('pager')}>
      <button type="button" className={cx('pagerBtn')} disabled={page <= 0} onClick={() => onChange(0)}>
        « Đầu
      </button>
      <button type="button" className={cx('pagerBtn')} disabled={page <= 0} onClick={() => onChange(page - 1)}>
        ‹ Trước
      </button>
      <span className={cx('pagerInfo')}>
        Trang
        <select value={page} onChange={(e) => onChange(Number(e.target.value))} aria-label="Chọn trang">
          {Array.from({ length: pageCount }, (_, i) => (
            <option key={i} value={i}>{i + 1}</option>
          ))}
        </select>
        / {pageCount}
      </span>
      <button type="button" className={cx('pagerBtn')} disabled={page >= pageCount - 1} onClick={() => onChange(page + 1)}>
        Sau ›
      </button>
      <button type="button" className={cx('pagerBtn')} disabled={page >= pageCount - 1} onClick={() => onChange(pageCount - 1)}>
        Cuối »
      </button>
    </div>
  );
};

export default Pager;
