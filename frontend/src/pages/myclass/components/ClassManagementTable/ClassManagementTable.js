import React from 'react';
import { Table, OverlayTrigger, Tooltip } from 'react-bootstrap';
import {
  IoPencilOutline,
  IoTrashOutline,
  IoPeopleOutline,
} from 'react-icons/io5';
import classNames from 'classnames/bind';
import styles from './ClassManagementTable.module.scss';

const cx = classNames.bind(styles);

const ClassManagementTable = ({ classes, onEdit, onDelete, onManageStudents }) => {
  return (
    <div className={cx('table-responsive')}>
      <Table hover className={cx('management-table')}>
        <thead>
          <tr>
            <th>Tên lớp học</th>
            <th>Vai trò</th>
            <th>Mã lớp</th>
            <th className="text-center">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {classes.map((clazz) => (
            <tr key={clazz.classId}>
              <td className={cx('class-name')}>
                <strong>{clazz.className}</strong>
              </td>
              <td className={cx('class-role')}>
                {clazz.isTeacher ? 'Giáo viên' : 'Học sinh'}
              </td>
              <td className={cx('class-id')}>
                {clazz.classQr}
              </td>
              <td>
                <div className={cx('action-group')}>
                  {onEdit && (
                    <OverlayTrigger overlay={<Tooltip>Sửa lớp học</Tooltip>}>
                      <button
                        className={cx('btn-action', 'edit')}
                        onClick={() => onEdit(clazz)}
                      >
                        <IoPencilOutline />
                      </button>
                    </OverlayTrigger>
                  )}

                  {onDelete && (
                    <OverlayTrigger overlay={<Tooltip>Xóa lớp học</Tooltip>}>
                      <button
                        className={cx('btn-action', 'delete')}
                        onClick={() => onDelete(clazz)}
                      >
                        <IoTrashOutline />
                      </button>
                    </OverlayTrigger>
                  )}

                  {onManageStudents && (
                    <OverlayTrigger overlay={<Tooltip>Quản lý học sinh</Tooltip>}>
                      <button
                        className={cx('btn-action', 'manage')}
                        onClick={() => onManageStudents(clazz.classId)}
                      >
                        <IoPeopleOutline />
                      </button>
                    </OverlayTrigger>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default ClassManagementTable;
