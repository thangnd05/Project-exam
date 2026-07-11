import { useEffect, useMemo, useState } from 'react';
import {Spinner, Table} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {ChevronLeft, ChevronRight} from 'lucide-react';

import styles from './adminKit.module.scss';

const cx = classNames.bind(styles);

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

  page,
  totalPages: totalPagesProp,
  totalElements,
  onPageChange,
}) {
  const isServer = typeof onPageChange === 'function';
  const hasPager = isServer || paginated;
  const [internalPage, setInternalPage] = useState(0);

  const total = isServer ? totalElements || 0 : data.length;
  const totalPages = isServer
    ? Math.max(1, totalPagesProp || 1)
    : Math.max(1, Math.ceil(total / pageSize));

  const safeInternal = Math.min(internalPage, totalPages - 1);
  const currentPage = isServer ? page || 0 : safeInternal;

  useEffect(() => {
    if (!isServer && internalPage !== safeInternal) {
      setInternalPage(safeInternal);
    }
  }, [isServer, internalPage, safeInternal]);

  const pageRows = useMemo(() => {
    if (!paginated || isServer) {
      return data;
    }
    const start = currentPage * pageSize;
    return data.slice(start, start + pageSize);
  }, [paginated, isServer, data, currentPage, pageSize]);

  const goTo = (target) => {
    if (target < 0 || target > totalPages - 1 || target === currentPage) {
      return;
    }
    if (isServer) {
      onPageChange(target);
    } else {
      setInternalPage(target);
    }
  };

  const colSpan = columns.length + (showIndex ? 1 : 0) + (rowActions ? 1 : 0);
  const indexOffset = hasPager ? currentPage * pageSize : 0;
  const rangeStart = total === 0 ? 0 : currentPage * pageSize + 1;
  const rangeEnd = isServer
    ? Math.min(total, currentPage * pageSize + data.length)
    : Math.min(total, (currentPage + 1) * pageSize);

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

      {hasPager && !loading && total > 0 && (
        <div className={cx('tableFooter')}>
          <span className={cx('footerInfo')}>
            Hiển thị {rangeStart} - {rangeEnd} trên tổng số {total} {itemLabel}
          </span>
          <div className={cx('pager')}>
            <button
              className={cx('pagerBtn')}
              disabled={currentPage === 0}
              onClick={() => goTo(currentPage - 1)}
              aria-label="Trang trước"
            >
              <ChevronLeft size={16} />
            </button>
            {buildPageItems(currentPage, totalPages).map((item, idx) =>
              item === '...' ? (
                <span key={`e${idx}`} className={cx('pagerBtn', 'ellipsis')}>
                  …
                </span>
              ) : (
                <button
                  key={item}
                  className={cx('pagerBtn', {active: item === currentPage})}
                  onClick={() => goTo(item)}
                >
                  {item + 1}
                </button>
              ),
            )}
            <button
              className={cx('pagerBtn')}
              disabled={currentPage >= totalPages - 1}
              onClick={() => goTo(currentPage + 1)}
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
