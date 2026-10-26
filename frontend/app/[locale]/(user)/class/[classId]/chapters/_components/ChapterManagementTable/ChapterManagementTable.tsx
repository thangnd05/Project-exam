'use client';

import {Table, Button, OverlayTrigger, Tooltip} from 'react-bootstrap';
import { Pencil, Trash2 } from 'lucide-react';
import {useLocale, useTranslations} from 'next-intl';
import classNames from 'classnames/bind';
import styles from './ChapterManagementTable.module.scss';
import type { ChapterResponse } from '@/app/types';

const cx = classNames.bind(styles);

type ChapterManagementTableProps = {
  chapters: ChapterResponse[];
  onViewTests: (chapterId: string) => void;
  onEdit: (chapter: ChapterResponse) => void;
  onDelete: (chapter: ChapterResponse) => void;
};

function ChapterManagementTable({chapters, onViewTests, onEdit, onDelete}: ChapterManagementTableProps) {
  const t = useTranslations('Classes');
  const locale = useLocale();
  return (
    <div className={cx('table-responsive')}>
      <Table hover className={cx('management-table')}>
        <thead>
          <tr>
            <th>{t('common.chapterName')}</th>
            <th>{t('chapterTable.createdAt')}</th>
            <th className="text-center">{t('common.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {chapters.map((chapter) => (
            <tr
              key={chapter.chapterId}
              className={cx('table-row-clickable')}
              onClick={() => onViewTests(chapter.chapterId)}
            >
              <td className={cx('chapter-title')}>
                <button
                  type="button"
                  className={cx('chapter-link-btn')}
                  onClick={() => onViewTests(chapter.chapterId)}
                >
                  {chapter.title}
                </button>
              </td>
              <td>
                <span className={cx('chapter-date')}>
                  {new Date(chapter.createdAt!).toLocaleDateString(locale === 'en' ? 'en-US' : 'vi-VN')}
                </span>
              </td>
              <td>
                <div className={cx('action-group')}>
                  <OverlayTrigger overlay={<Tooltip>{t('chapterTable.edit')}</Tooltip>}>
                    <Button
                      variant="link"
                      className={cx('btn-action', 'edit')}
                      onClick={(event) => {
                        event.stopPropagation();
                        onEdit(chapter);
                      }}
                    >
                      <Pencil size="1em" />
                    </Button>
                  </OverlayTrigger>

                  <OverlayTrigger overlay={<Tooltip>{t('chapterTable.delete')}</Tooltip>}>
                    <Button
                      variant="link"
                      className={cx('btn-action', 'delete')}
                      onClick={(event) => {
                        event.stopPropagation();
                        onDelete(chapter);
                      }}
                    >
                      <Trash2 size="1em" />
                    </Button>
                  </OverlayTrigger>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default ChapterManagementTable;
