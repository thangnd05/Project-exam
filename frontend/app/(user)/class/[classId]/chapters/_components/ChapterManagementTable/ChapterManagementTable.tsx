'use client';

import {Table, Button, OverlayTrigger, Tooltip} from 'react-bootstrap';
import {IoPencilOutline, IoTrashOutline} from 'react-icons/io5';
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
  return (
    <div className={cx('table-responsive')}>
      <Table hover className={cx('management-table')}>
        <thead>
          <tr>
            <th>Tên chương</th>
            <th>Thời gian tạo</th>
            <th className="text-center">Hành động</th>
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
                  {/* createdAt optional theo type nhưng BE luôn trả — giữ hành vi bản JS cũ */}
                  {new Date(chapter.createdAt!).toLocaleDateString('vi-VN')}
                </span>
              </td>
              <td>
                <div className={cx('action-group')}>
                  <OverlayTrigger overlay={<Tooltip>Sửa chương</Tooltip>}>
                    <Button
                      variant="link"
                      className={cx('btn-action', 'edit')}
                      onClick={(event) => {
                        event.stopPropagation();
                        onEdit(chapter);
                      }}
                    >
                      <IoPencilOutline />
                    </Button>
                  </OverlayTrigger>

                  <OverlayTrigger overlay={<Tooltip>Xóa chương</Tooltip>}>
                    <Button
                      variant="link"
                      className={cx('btn-action', 'delete')}
                      onClick={(event) => {
                        event.stopPropagation();
                        onDelete(chapter);
                      }}
                    >
                      <IoTrashOutline />
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
