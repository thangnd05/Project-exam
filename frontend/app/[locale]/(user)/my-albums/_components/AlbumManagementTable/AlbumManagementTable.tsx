'use client';

import { useRouter } from '@/app/i18n/navigation';
import {Table, Button, OverlayTrigger, Tooltip} from 'react-bootstrap';
import { IoPencilOutline, IoTrashOutline, IoPlayOutline } from 'react-icons/io5';
import classNames from 'classnames/bind';
import { useTranslations } from 'next-intl';
import type { VocabularyAlbumResponse } from '@/app/types';
import styles from './AlbumManagementTable.module.scss';

const cx = classNames.bind(styles);

type AlbumManagementTableProps = {
  albums: VocabularyAlbumResponse[];
  onDelete: (album: VocabularyAlbumResponse) => void;
  onEdit: (album: VocabularyAlbumResponse) => void;
};

const AlbumManagementTable = ({albums, onDelete, onEdit}: AlbumManagementTableProps) => {
  const t = useTranslations('Vocabulary');
  const router = useRouter();

  return (
    <div className={cx('table-responsive')}>
      <Table hover className={cx('management-table')}>
        <thead>
          <tr>
            <th>{t('albumTable.name')}</th>
            <th>{t('albumTable.description')}</th>
            <th className="text-center">{t('albumTable.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {albums.map((album) => {
            return (
              <tr key={album.albumId}>
                <td className={cx('album-title')}>
                  <div className="d-flex align-items-center">
                    <strong>{album.name}</strong>
                  </div>
                </td>
                <td className={cx('album-description')}>
                  {album.description}
                </td>
                <td>
                  <div className={cx('action-group')}>
                    <OverlayTrigger overlay={<Tooltip>{t('albumTable.study')}</Tooltip>}>
                      <Button
                        variant="link"
                        className={cx('btn-action', 'stats')}
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/albums/${album.albumId}`);
                        }}
                      >
                        <IoPlayOutline />
                      </Button>
                    </OverlayTrigger>

                    <OverlayTrigger overlay={<Tooltip>{t('albumTable.edit')}</Tooltip>}>
                      <Button
                        variant="link"
                        className={cx('btn-action', 'edit')}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(album);
                        }}
                      >
                        <IoPencilOutline />
                      </Button>
                    </OverlayTrigger>

                    <OverlayTrigger overlay={<Tooltip>{t('albumTable.delete')}</Tooltip>}>
                      <Button
                        variant="link"
                        className={cx('btn-action', 'delete')}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(album);
                        }}
                      >
                        <IoTrashOutline />
                      </Button>
                    </OverlayTrigger>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
};

export default AlbumManagementTable;
