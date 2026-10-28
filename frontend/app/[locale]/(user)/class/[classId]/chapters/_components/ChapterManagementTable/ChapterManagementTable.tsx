'use client';

import {Table, OverlayTrigger, Tooltip} from 'react-bootstrap';
import { Pencil, Trash2 } from 'lucide-react';
import {useTranslations} from 'next-intl';
import classNames from 'classnames/bind';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import styles from './ChapterManagementTable.module.scss';
import type { ChapterResponse } from '@/app/types';
import { formatDate } from '@/app/utils/format-date-time';

const cx = classNames.bind(styles);

type ChapterManagementTableProps = {
  chapters: ChapterResponse[];
  onViewTests: (chapterId: string) => void;
  onEdit: (chapter: ChapterResponse) => void;
  onDelete: (chapter: ChapterResponse) => void;
};

function ChapterManagementTable({chapters, onViewTests, onEdit, onDelete}: ChapterManagementTableProps) {
  const t = useTranslations('Classes');
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
                <ButtonPrime
                  variant="link"
                  size="lg"
                  className={cx('chapter-link-btn')}
                  onClick={() => onViewTests(chapter.chapterId)}
                >
                  {chapter.title}
                </ButtonPrime>
              </td>
              <td>
                <span className={cx('chapter-date')}>
                  {formatDate(chapter.createdAt)}
                </span>
              </td>
              <td>
                <div className={cx('action-group')}>
                  <OverlayTrigger overlay={<Tooltip>{t('chapterTable.edit')}</Tooltip>}>
                    <ButtonPrime
                      variant="ghost"
                      size="icon"
                      aria-label={t('chapterTable.edit')}
                      onClick={(event) => {
                        event.stopPropagation();
                        onEdit(chapter);
                      }}
                    >
                      <Pencil size={18} />
                    </ButtonPrime>
                  </OverlayTrigger>

                  <OverlayTrigger overlay={<Tooltip>{t('chapterTable.delete')}</Tooltip>}>
                    <ButtonPrime
                      variant="dangerGhost"
                      size="icon"
                      aria-label={t('chapterTable.delete')}
                      onClick={(event) => {
                        event.stopPropagation();
                        onDelete(chapter);
                      }}
                    >
                      <Trash2 size={18} />
                    </ButtonPrime>
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
