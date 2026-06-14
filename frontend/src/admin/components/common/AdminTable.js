import React, {useEffect, useMemo, useState} from 'react';
import {Spinner, Table} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {ChevronLeft, ChevronRight} from 'lucide-react';

import styles from './adminKit.module.scss';

const cx = classNames.bind(styles);

// Sinh danh sách trang hiển thị (0-based) có dấu "..." khi nhiều trang.
function buildPageItems(current, total) {
  const items = [];
  for (let i = 0; i < total; i++) {
    if (i === 0 || i === total - 1 || (i >= current - 1 && i <= current + 1)) {
      items.push(i);
    } else if (items[items.length - 1] !== '...') {
      items.push('...');
    }
  }
  return items;
}

/**
 * Bảng dữ liệu cấu hình bằng `columns`, tự xử lý loading/empty, bo góc.
 *
 * columns: [{ key, header, render?(row, index), align?: 'center'|'right', width? }]
 * showIndex: true -> tự thêm cột STT (số thứ tự bắt đầu từ 1) ở đầu, thay cho cột ID.
 * rowActions?: (row, index) => ReactNode  -> render cột "Thao tác" cuối, bọc sẵn .actions
 *   (đặt các <button> icon bên trong; có thể thêm class "danger" cho nút xóa)
 * paginated: true -> phân trang client-side ngay trong bảng + chân trang.
 *   pageSize (mặc định 10), itemLabel (vd 'vai trò') cho dòng "tổng số N ...".
 */
function AdminTable({
  columns = [],
  data = [],
  loading = false,
  emptyText = 'Không có dữ liệu.',
  loadingText = 'Đang tải dữ liệu...',
  getRowKey,
  rowActions,
  actionsHeader = 'Thao tác',
  showIndex = false,
  indexHeader = 'STT',
  paginated = false,
  pageSize = 10,
  itemLabel = 'mục',
}) {
  const [page, setPage] = useState(0);

  const total = data.length;
  const totalPages = paginated ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const safePage = Math.min(page, totalPages - 1);

  // Giữ trang hợp lệ khi data đổi (lọc/xoá làm giảm số trang).
  useEffect(() => {
    if (page !== safePage) {
      setPage(safePage);
    }
  }, [page, safePage]);

  const pageRows = useMemo(() => {
    if (!paginated) {
      return data;
    }
    const start = safePage * pageSize;
    return data.slice(start, start + pageSize);
  }, [paginated, data, safePage, pageSize]);

  const colSpan = columns.length + (showIndex ? 1 : 0) + (rowActions ? 1 : 0);
  const indexOffset = paginated ? safePage * pageSize : 0;
  const rangeStart = total === 0 ? 0 : safePage * pageSize + 1;
  const rangeEnd = paginated ? Math.min(total, (safePage + 1) * pageSize) : total;

  return (
    <div className={cx('tableWrapper')}>
      <Table responsive hover>
        <thead>
          <tr>
            {showIndex && (
              <th className={cx('center')} style={{width: 70}}>
                {indexHeader}
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                className={cx({[col.align]: col.align})}
                style={col.width ? {width: col.width} : undefined}
              >
                {col.header}
              </th>
            ))}
            {rowActions && <th>{actionsHeader}</th>}
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={colSpan} className={cx('stateCell')}>
                <Spinner size="sm" className="me-2" />
                {loadingText}
              </td>
            </tr>
          )}

          {!loading &&
            pageRows.map((row, index) => (
              <tr key={getRowKey ? getRowKey(row, index) : index}>
                {showIndex && (
                  <td className={cx('center')}>{indexOffset + index + 1}</td>
                )}
                {columns.map((col) => (
                  <td key={col.key} className={cx({[col.align]: col.align})}>
                    {col.render ? col.render(row, indexOffset + index) : row[col.key]}
                  </td>
                ))}
                {rowActions && (
                  <td>
                    <div className={cx('actions')}>
                      {rowActions(row, indexOffset + index)}
                    </div>
                  </td>
                )}
              </tr>
            ))}

          {!loading && total === 0 && (
            <tr>
              <td colSpan={colSpan} className={cx('stateCell')}>
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      {paginated && !loading && total > 0 && (
        <div className={cx('tableFooter')}>
          <span className={cx('footerInfo')}>
            Hiển thị {rangeStart} - {rangeEnd} trên tổng số {total} {itemLabel}
          </span>
          <div className={cx('pager')}>
            <button
              className={cx('pagerBtn')}
              disabled={safePage === 0}
              onClick={() => setPage(safePage - 1)}
              aria-label="Trang trước"
            >
              <ChevronLeft size={16} />
            </button>
            {buildPageItems(safePage, totalPages).map((item, idx) =>
              item === '...' ? (
                <span key={`e${idx}`} className={cx('pagerBtn', 'ellipsis')}>
                  …
                </span>
              ) : (
                <button
                  key={item}
                  className={cx('pagerBtn', {active: item === safePage})}
                  onClick={() => setPage(item)}
                >
                  {item + 1}
                </button>
              ),
            )}
            <button
              className={cx('pagerBtn')}
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage(safePage + 1)}
              aria-label="Trang sau"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminTable;
