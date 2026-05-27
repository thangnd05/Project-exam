import React from 'react';
import {Table, Badge, Button, OverlayTrigger, Tooltip} from 'react-bootstrap';
import {useNavigate} from 'react-router-dom';
import {
  IoPencilOutline,
  IoTrashOutline,
  IoStatsChartOutline,
  IoTimeOutline,
  IoPeopleOutline,
} from 'react-icons/io5';
import classNames from 'classnames/bind';
import styles from './TestManagementTable.module.scss';
import {getTestStatus} from '~/utils/testStatusHelper';
import EditTestModal from '~/components/test/EditTestModal';

const cx = classNames.bind(styles);

const TestManagementTable = ({tests, onDelete, onRefresh, countdowns}) => {
  const navigate = useNavigate();
  const now = new Date();
  const [editingTest, setEditingTest] = React.useState(null);

  const getBadgeVariant = (status) => {
    switch (status) {
      case 'open':
        return 'success';
      case 'locked':
        return 'warning';
      case 'expired':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  return (
    <div className={cx('table-responsive')}>
      <Table hover className={cx('management-table')}>
        <thead>
          <tr>
            <th>Tên bài test</th>
            <th>
              <IoTimeOutline className="me-2" />
              Thời gian
            </th>
            <th>Trạng thái</th>
            <th>
              <IoPeopleOutline className="me-2" />
              Tổng lượt làm
            </th>
            <th className="text-center">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {tests.map((test) => {
            const {status, statusLabel} = getTestStatus(test, now, countdowns);
            const variant = getBadgeVariant(status);

            return (
              <tr key={test.testId}>
                <td className={cx('test-title')}>
                  <strong>{test.title || 'Bài tập luyện tập'}</strong>
                </td>
                <td className={cx('test-duration')}>
                  {test.durationMinutes
                    ? `${test.durationMinutes} phút`
                    : 'Không giới hạn'}
                </td>
                <td>
                  <Badge bg={variant} className={cx('status-badge')}>
                    {statusLabel}
                  </Badge>
                </td>
                <td className={cx('test-participants')}>
                  {test.totalAttempts ?? 0}
                </td>
                <td>
                  <div className={cx('action-group')}>
                    {onRefresh && (
                      <OverlayTrigger overlay={<Tooltip>Sửa bài test</Tooltip>}>
                        <Button
                          variant="link"
                          className={cx('btn-action', 'edit')}
                          onClick={() => setEditingTest(test)}
                        >
                          <IoPencilOutline />
                        </Button>
                      </OverlayTrigger>
                    )}

                    {onDelete && (
                      <OverlayTrigger overlay={<Tooltip>Xóa bài test</Tooltip>}>
                        <Button
                          variant="link"
                          className={cx('btn-action', 'delete')}
                          onClick={() => onDelete(test.testId)}
                        >
                          <IoTrashOutline />
                        </Button>
                      </OverlayTrigger>
                    )}

                    <OverlayTrigger
                      overlay={<Tooltip>Xem chi tiết điểm</Tooltip>}
                    >
                      <Button
                        variant="link"
                        className={cx('btn-action', 'stats')}
                        onClick={() =>
                          navigate(`/tests/history/${test.testId}`)
                        }
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

      <EditTestModal
        show={!!editingTest}
        onHide={() => setEditingTest(null)}
        test={editingTest}
        onSuccess={() => {
          setEditingTest(null);
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
};

export default TestManagementTable;
