'use client';

import { Table, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Pencil, Trash2, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import classNames from 'classnames/bind';
import styles from './ClassManagementTable.module.scss';
import type { ClassStudentResponse } from '@/app/types';

const cx = classNames.bind(styles);

type ClassRow = ClassStudentResponse & { isTeacher?: boolean };

type ClassManagementTableProps = {
  classes: ClassRow[];
  onEdit?: (clazz: ClassRow) => void;
  onDelete?: (clazz: ClassRow) => void;
  onManageStudents?: (classId: string) => void;
};

const ClassManagementTable = ({ classes, onEdit, onDelete, onManageStudents }: ClassManagementTableProps) => {
  const t = useTranslations('Classes');
  return (
    <div className={cx('table-responsive')}>
      <Table hover className={cx('management-table')}>
        <thead>
          <tr>
            <th>{t('common.className')}</th>
            <th>{t('classTable.role')}</th>
            <th>{t('classTable.classCode')}</th>
            <th className="text-center">{t('common.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {classes.map((clazz) => (
            <tr key={clazz.classId}>
              <td className={cx('class-name')}>
                <strong>{clazz.className}</strong>
              </td>
              <td className={cx('class-role')}>
                {clazz.isTeacher ? t('common.teacher') : t('common.student')}
              </td>
              <td className={cx('class-id')}>
                {clazz.classQr}
              </td>
              <td>
                <div className={cx('action-group')}>
                  {onEdit && (
                    <OverlayTrigger overlay={<Tooltip>{t('classTable.edit')}</Tooltip>}>
                      <button
                        className={cx('btn-action', 'edit')}
                        onClick={() => onEdit(clazz)}
                      >
                        <Pencil size="1em" />
                      </button>
                    </OverlayTrigger>
                  )}

                  {onDelete && (
                    <OverlayTrigger overlay={<Tooltip>{t('classTable.delete')}</Tooltip>}>
                      <button
                        className={cx('btn-action', 'delete')}
                        onClick={() => onDelete(clazz)}
                      >
                        <Trash2 size="1em" />
                      </button>
                    </OverlayTrigger>
                  )}

                  {onManageStudents && (
                    <OverlayTrigger overlay={<Tooltip>{t('common.manageStudents')}</Tooltip>}>
                      <button
                        className={cx('btn-action', 'manage')}
                        onClick={() => onManageStudents(clazz.classId)}
                      >
                        <Users size="1em" />
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
