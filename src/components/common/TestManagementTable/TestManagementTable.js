import React from 'react';
import { Table, Badge, Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
    IoPencilOutline,
    IoTrashOutline,
    IoStatsChartOutline,
    IoTimeOutline,
    IoPeopleOutline,
} from 'react-icons/io5';
import classNames from 'classnames/bind';
import styles from './TestManagementTable.module.scss';
import { formatDateTime } from '~/utils/testStatusHelper';

const cx = classNames.bind(styles);

const TestManagementTable = ({ tests, onDelete }) => {
    const navigate = useNavigate();
    const now = new Date();

    const getStatus = (test) => {
        const from = test.availableFrom ? new Date(test.availableFrom) : null;
        const to = test.availableTo ? new Date(test.availableTo) : null;

        if (to && now > to) return { label: 'Đã kết thúc', variant: 'danger' };
        if (from && now < from) return { label: 'Chưa bắt đầu', variant: 'warning' };
        return { label: 'Đang diễn ra', variant: 'success' };
    };

    return (
        <div className={cx('table-responsive')}>
            <Table hover className={cx('management-table')}>
                <thead>
                    <tr>
                        <th>Tên bài test</th>
                        <th><IoTimeOutline className="me-2" />Thời gian</th>
                        <th>Trạng thái</th>
                        <th><IoPeopleOutline className="me-2" />Người tham gia</th>
                        <th className="text-center">Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {tests.map((test) => {
                        const status = getStatus(test);
                        return (
                            <tr key={test.testId}>
                                <td className={cx('test-title')}>
                                    <strong>{test.title || 'Bài tập luyện tập'}</strong>
                                </td>
                                <td className={cx('test-duration')}>
                                    {test.durationMinutes ? `${test.durationMinutes} phút` : 'Không giới hạn'}
                                </td>
                                <td>
                                    <Badge bg={status.variant} className={cx('status-badge')}>
                                        {status.label}
                                    </Badge>
                                </td>
                                <td className={cx('test-participants')}>
                                    {test.participantCount ?? 0} học sinh
                                </td>
                                <td>
                                    <div className={cx('action-group')}>
                                        <OverlayTrigger overlay={<Tooltip>Sửa bài test</Tooltip>}>
                                            <Button
                                                variant="link"
                                                className={cx('btn-action', 'edit')}
                                                onClick={() => navigate(`/tests/edit/${test.testId}`)}
                                            >
                                                <IoPencilOutline />
                                            </Button>
                                        </OverlayTrigger>

                                        <OverlayTrigger overlay={<Tooltip>Xóa bài test</Tooltip>}>
                                            <Button
                                                variant="link"
                                                className={cx('btn-action', 'delete')}
                                                onClick={() => onDelete(test.testId)}
                                            >
                                                <IoTrashOutline />
                                            </Button>
                                        </OverlayTrigger>

                                        <OverlayTrigger overlay={<Tooltip>Xem chi tiết điểm</Tooltip>}>
                                            <Button
                                                variant="link"
                                                className={cx('btn-action', 'stats')}
                                                onClick={() => navigate(`/tests/stats/${test.testId}`)}
                                            >
                                                <IoStatsChartOutline />
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

export default TestManagementTable;
