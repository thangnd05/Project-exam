import React from 'react';
import classNames from 'classnames/bind';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import styles from './Pagination.module.scss';

const cx = classNames.bind(styles);

function Pagination({ currentPage = 0, totalPages = 0, onChange }) {
  // Luôn hiện thanh phân trang để dễ quan sát, kể cả khi chỉ có 1 trang
  // (hoặc chưa có dữ liệu) -> hiện 1 nút "1", prev/next tự disable.
  const total = Math.max(totalPages, 1);

  const pages = [];
  for (let i = 0; i < total; i++) {
    if (
      i === 0 ||
      i === total - 1 ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  const go = (p) => {
    if (typeof p === 'number' && p !== currentPage) onChange?.(p);
  };

  return (
    <div className={cx('pagination')}>
      <button
        className={cx('pageBtn', { disabled: currentPage === 0 })}
        onClick={() => currentPage > 0 && onChange?.(currentPage - 1)}
      >
        <ChevronLeft size={20} />
      </button>

      {pages.map((p, idx) => (
        <button
          key={idx}
          className={cx('pageBtn', {
            active: p === currentPage,
            disabled: p === '...',
          })}
          onClick={() => go(p)}
        >
          {typeof p === 'number' ? p + 1 : p}
        </button>
      ))}

      <button
        className={cx('pageBtn', { disabled: currentPage >= total - 1 })}
        onClick={() =>
          currentPage < total - 1 && onChange?.(currentPage + 1)
        }
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}

export default Pagination;
