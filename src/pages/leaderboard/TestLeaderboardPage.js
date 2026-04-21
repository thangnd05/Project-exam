import axios from 'axios';
import {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {Alert, Container, Spinner, Table} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {IoArrowBack, IoPodiumOutline} from 'react-icons/io5';

import PageHeader from '~/components/common/PageHeader/PageHeader';
import styles from './TestLeaderboardPage.module.scss';
import routes from '~/config/Routes';

const cx = classNames.bind(styles);

const TROPHY_COLORS = {
  1: '#f59e0b',
  2: '#94a3b8',
  3: '#b45309',
};

function TrophyIcon({rank}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={TROPHY_COLORS[rank] || 'currentColor'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cx('rankTrophy')}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978" />
      <path d="M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978" />
      <path d="M18 9h1.5a1 1 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z" />
      <path d="M6 9H4.5a1 1 0 0 1 0-5H6" />
    </svg>
  );
}

function TestLeaderboardPage() {
  const {testId} = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [testTitle, setTestTitle] = useState('');
  const [rawRows, setRawRows] = useState([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      setErrorMessage('');

      try {
        const testInfoResponse = await axios.get(`/api/tests/usertest/${testId}`);
        setTestTitle(testInfoResponse.data?.title || '');
      } catch (error) {
        setTestTitle('');
      }

      try {
        const leaderboardResponse = await axios.get(`/api/user-tests/by-test/${testId}`);
        const normalizedRows = Array.isArray(leaderboardResponse.data)
          ? leaderboardResponse.data
          : [];
        setRawRows(normalizedRows);
      } catch (error) {
        setErrorMessage('Không tải được bảng xếp hạng từ hệ thống.');
      } finally {
        setLoading(false);
      }
    };

    if (testId) {
      fetchLeaderboard();
    }
  }, [testId]);

  const rows = rawRows.map((entry, index) => ({
    id: entry.userTestId ?? entry.userId ?? `row-${index}`,
    rank: index + 1,
    displayName:
      entry.fullName ||
      entry.userName ||
      entry.username ||
      entry.displayName ||
      (entry.userId ? `User ${entry.userId}` : 'Người dùng'),
    score: Number(entry.totalScore ?? entry.score ?? 0),
    durationTaken:
      typeof entry.durationTaken === 'number' ? entry.durationTaken : null,
  }));

  return (
    <div className={cx('wrapper')}>
      <Container>
        <div className={cx('headerTop')}>
          <button
            type="button"
            className={cx('btnBack')}
            onClick={() =>
              navigate(routes.testHistory.replace(':testId', String(testId)))
            }
          >
            <IoArrowBack />
            Quay lại lịch sử
          </button>
        </div>

        <PageHeader
          className={cx('leaderboardHeader')}
          title={testTitle || 'Bảng xếp hạng điểm'}
          description="Chỉ hiển thị thông tin tổng hợp: hạng, tên hiển thị, điểm và số lượt làm."
          label="Leaderboard"
          labelClassName={cx('leaderboardLabel')}
          badgeLabel={
            <div className="d-flex align-items-center gap-2">
              <IoPodiumOutline />
              <span>{rows.length} người tham gia</span>
            </div>
          }
        />

        {loading ? (
          <div className={cx('loadingBox')}>
            <Spinner animation="grow" variant="primary" size="lg" />
            <p>Đang tải bảng xếp hạng...</p>
          </div>
        ) : errorMessage ? (
          <Alert variant="warning">{errorMessage}</Alert>
        ) : rows.length === 0 ? (
          <div className={cx('emptyState')}>
            <IoPodiumOutline className={cx('icon')} />
            <h4>Chưa có dữ liệu xếp hạng</h4>
            <p className="text-muted">Hãy làm bài để xuất hiện trên bảng xếp hạng.</p>
          </div>
        ) : (
          <div className={cx('tableContainer')}>
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Hạng</th>
                  <th>Người dùng</th>
                  <th>Điểm</th>
                  <th>Thời gian làm</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((entry) => (
                  <tr key={entry.id}>
                    <td data-label="Hạng">
                      <div className={cx('rankCell')}>
                        {entry.rank <= 3 ? (
                          <TrophyIcon rank={entry.rank} />
                        ) : (
                          <span
                            className={cx('rankNumber', {
                              rankNumberTopTen:
                                entry.rank >= 4 && entry.rank <= 10,
                            })}
                          >
                            #{entry.rank}
                          </span>
                        )}
                      </div>
                    </td>
                    <td data-label="Người dùng">{entry.displayName}</td>
                    <td data-label="Điểm">
                      <span className={cx('scoreBadge')}>
                        {entry.score.toFixed(2)}
                      </span>
                    </td>
                    <td data-label="Thời gian làm">
                      {entry.durationTaken != null
                        ? `${entry.durationTaken}s`
                        : '---'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Container>
    </div>
  );
}

export default TestLeaderboardPage;
