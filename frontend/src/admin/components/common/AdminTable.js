import React from 'react';
import {Spinner, Table} from 'react-bootstrap';
import classNames from 'classnames/bind';

import styles from './adminKit.module.scss';

const cx = classNames.bind(styles);

/**
 * Bảng dữ liệu cấu hình bằng `columns`, tự xử lý trạng thái loading/empty và bo góc.
 *
 * columns: [{ key, header, render?(row, index), align?: 'center'|'right', width? }]
 * showIndex: true -> tự thêm cột STT (số thứ tự bắt đầu từ 1) ở đầu, thay cho cột ID.
 * rowActions?: (row, index) => ReactNode  -> render cột "Thao tác" cuối, bọc sẵn .actions
 *   (đặt các <button> icon bên trong; có thể thêm class "danger" cho nút xóa)
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
}) {
  const colSpan = columns.length + (showIndex ? 1 : 0) + (rowActions ? 1 : 0);

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
            data.map((row, index) => (
              <tr key={getRowKey ? getRowKey(row, index) : index}>
                {showIndex && <td className={cx('center')}>{index + 1}</td>}
                {columns.map((col) => (
                  <td key={col.key} className={cx({[col.align]: col.align})}>
                    {col.render ? col.render(row, index) : row[col.key]}
                  </td>
                ))}
                {rowActions && (
                  <td>
                    <div className={cx('actions')}>{rowActions(row, index)}</div>
                  </td>
                )}
              </tr>
            ))}

          {!loading && data.length === 0 && (
            <tr>
              <td colSpan={colSpan} className={cx('stateCell')}>
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
}

export default AdminTable;
