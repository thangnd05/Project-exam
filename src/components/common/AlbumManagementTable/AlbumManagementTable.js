import React from 'react';
import { Table, Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
    IoPencilOutline,
    IoTrashOutline,
    IoPlayOutline,
    IoBookOutline,
} from 'react-icons/io5';
import classNames from 'classnames/bind';
import styles from './AlbumManagementTable.module.scss';

const cx = classNames.bind(styles);

const AlbumManagementTable = ({ albums, onDelete, onEdit }) => {
    const navigate = useNavigate();

    return (
        <div className={cx('table-responsive')}>
            <Table hover className={cx('management-table')}>
                <thead>
                    <tr>
                        <th>Tên Album</th>
                        <th>Mô tả</th>
                        <th className="text-center">Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {albums.map((album) => {
                        return (
                            <tr key={album.albumId}>
                                <td className={cx('album-title')}>
                                    <div className="d-flex align-items-center">
                                        <IoBookOutline className="me-3 text-primary" size={20} />
                                        <strong>{album.name}</strong>
                                    </div>
                                </td>
                                <td className={cx('album-description')}>
                                    {album.description || 'Hành trình chinh phục từ vựng mỗi ngày'}
                                </td>
                                <td>
                                    <div className={cx('action-group')}>
                                        <OverlayTrigger overlay={<Tooltip>Học ngay</Tooltip>}>
                                            <Button
                                                variant="link"
                                                className={cx('btn-action', 'stats')}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/albums/${album.albumId}`);
                                                }}
                                            >
                                                <IoPlayOutline />
                                            </Button>
                                        </OverlayTrigger>

                                        <OverlayTrigger overlay={<Tooltip>Sửa Album</Tooltip>}>
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

                                        <OverlayTrigger overlay={<Tooltip>Xóa Album</Tooltip>}>
                                            <Button
                                                variant="link"
                                                className={cx('btn-action', 'delete')}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDelete(album.albumId);
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
