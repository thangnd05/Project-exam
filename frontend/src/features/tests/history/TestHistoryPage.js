import { useParams, useNavigate } from 'react-router-dom';
import { useTestHistory } from './hooks/useTestHistory';
import { Container, Table, Spinner } from 'react-bootstrap';
import { motion } from 'framer-motion';
import classNames from 'classnames/bind';
import { IoEyeOutline, IoCalendarOutline, IoStatsChartOutline, IoCheckmarkCircleOutline, IoHourglassOutline, IoCloseCircleOutline, IoDocumentTextOutline } from 'react-icons/io5';

import style from './TestHistory.module.scss';
import PageHeader from '~/shared/ui/PageHeader/PageHeader';

const cx = classNames.bind(style);

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] },
  }),
};

function TestHistoryPage() {
  const { testId } = useParams();
  const navigate = useNavigate();

  const { attempts, testInfo, isLoading } = useTestHistory(testId);

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('vi-VN', {
      hour12: false,
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleViewResult = (userTestId) => {
    navigate(`/tests/result/${userTestId}`);
  };

  if (isLoading) {
    return (
      <div className={cx('loading-box')}>
        <Spinner animation="grow" variant="primary" size="lg" />
        <p>Đang lục lại nhật ký học tập...</p>
      </div>
    );
  }

  return (
    <div className={cx('wrapper')}>
      <Container>

        <div className={cx('header-top')}>
          <button className={cx('btn-back')} onClick={() => navigate(-1)}>
            Quay lại
          </button>
        </div>

        <PageHeader
          className={cx('historyHeader')}
          title={testInfo ? testInfo.title : 'Đang tải thông tin...'}
          description={testInfo?.description}
          label="Lịch sử làm bài kiểm tra"
          labelClassName={cx('historyLabel')}
          badgeLabel={
            <div className="d-flex align-items-center gap-2">
              <IoStatsChartOutline />
              <span>{attempts.length} lượt đã làm</span>
            </div>
          }
        />

        {attempts.length === 0 ? (
          <div className={cx('empty-state')}>
            <IoDocumentTextOutline className={cx('icon')} />
            <h4>Chưa có lần làm bài nào</h4>
            <p className="text-muted">
              Hãy bắt đầu thử sức với bài thi này để xem kết quả tại đây nhé!
            </p>
          </div>
        ) : (
          <div className={cx('table-container')}>
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Lần</th>
                  <th>Thời gian bắt đầu</th>
                  <th>Thời gian nộp</th>
                  <th>Điểm số</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a, i) => (
                  <motion.tr
                    key={a.userTestId}
                    custom={i}
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <td data-label="Lần" className="fw-bold text-muted">
                      #{i + 1}
                    </td>
                    <td data-label="Bắt đầu">
                      <div className="d-flex align-items-center justify-content-center gap-2">
                        <IoCalendarOutline size={16} />
                        {formatDateTime(a.startedAt)}
                      </div>
                    </td>
                    <td data-label="Nộp bài">
                      <div className="d-flex align-items-center justify-content-center gap-2">
                        <IoCheckmarkCircleOutline size={16} />
                        {formatDateTime(a.finishedAt)}
                      </div>
                    </td>
                    <td data-label="Điểm">
                      <div className={cx('score-badge')}>
                        {a.totalScore ?? '--'}
                      </div>
                    </td>
                    <td data-label="Trạng thái">
                      {a.status === 'COMPLETED' ? (
                        <span className={cx('status-pill', 'status-completed')}>
                          <IoCheckmarkCircleOutline /> Hoàn thành
                        </span>
                      ) : a.status === 'IN_PROGRESS' ? (
                        <span
                          className={cx('status-pill', 'status-in-progress')}
                        >
                          <IoHourglassOutline /> Đang làm
                        </span>
                      ) : (
                        <span className={cx('status-pill', 'status-expired')}>
                          <IoCloseCircleOutline /> Hết hạn
                        </span>
                      )}
                    </td>
                    <td data-label="Thao tác">
                      {a.status === 'COMPLETED' ? (
                        <button
                          className={cx('btn-view-modern')}
                          onClick={() => handleViewResult(a.userTestId)}
                        >
                          <IoEyeOutline />
                          Chi tiết
                        </button>
                      ) : (
                        <span className="text-muted small italic">
                          Không khả dụng
                        </span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Container>
    </div>
  );
}

export default TestHistoryPage;
