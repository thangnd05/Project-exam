'use client';
import Link from 'next/link';
import {useRouter, useSearchParams} from 'next/navigation';
import {FaFire} from 'react-icons/fa6';
import {Container} from 'react-bootstrap';
import classNames from 'classnames/bind';

import PageHeader from '@/app/components/PageHeader/PageHeader';
import routes from '@/app/configs/Routes';
import {getFullMediaUrl} from '@/app/utils/mediaUrl';
import {hallOfFameTabLabel, useHallOfFameExams} from '../_components/HeroSection/hooks/useHallOfFameExams';
import {useQuickLeaderboard} from '../_components/HeroSection/hooks/useQuickLeaderboard';
import {useStreakLeaderboard} from '../_components/HeroSection/hooks/useStreakLeaderboard';
import styles from './HallOfFame.module.scss';

const cx = classNames.bind(styles);
const PAGE_LIMIT = 100;

const initials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'K';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`.toUpperCase();
};

const formatDuration = (totalSeconds?: number | null) => {
  if (totalSeconds == null) return '—';
  const sec = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
};

function HallOfFame() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedId = searchParams.get('examTypeId');
  const fireBoard = searchParams.get('board') === 'streak';
  const {exams, isLoading: examsLoading, isError: examsError} = useHallOfFameExams();
  const selected = exams.find((exam) => exam.examTypeId === requestedId) ?? exams[0];
  const selectedId = selected?.examTypeId;
  const examBoard = useQuickLeaderboard(PAGE_LIMIT, fireBoard ? undefined : selectedId);
  const streakBoard = useStreakLeaderboard(PAGE_LIMIT, fireBoard);
  const entries = fireBoard ? streakBoard.entries : examBoard.entries;
  const totalParticipants = fireBoard ? streakBoard.totalParticipants : examBoard.totalParticipants;
  const isLoading = fireBoard ? streakBoard.isLoading : examBoard.isLoading;
  const isPlaceholderData = fireBoard ? streakBoard.isPlaceholderData : examBoard.isPlaceholderData;
  const isError = fireBoard ? streakBoard.isError : examBoard.isError;
  const showLoading = fireBoard
    ? isLoading && !isPlaceholderData
    : (examsLoading || Boolean(selectedId && isLoading)) && !isPlaceholderData;

  const selectExam = (examTypeId: string) => {
    router.replace(`${routes.hallOfFame}?examTypeId=${encodeURIComponent(examTypeId)}`);
  };

  const selectFire = () => {
    router.replace(`${routes.hallOfFame}?board=streak`);
  };

  return (
    <div className={cx('page')}>
      <Container>
        <Link className={cx('back')} href={routes.home}>
          Về trang chủ
        </Link>
        <PageHeader
          label="Vinh danh"
          title={fireBoard ? 'Top người giữ lửa' : selected?.name || 'Bảng xếp hạng bài thi thử'}
          description={
            fireBoard
              ? 'Xếp theo chuỗi ngày học dài nhất mỗi người từng đạt. Chuỗi đang đứt vẫn giữ hạng theo mốc cao nhất đó.'
              : 'Mỗi tab là một kỳ thi AWS không tick Linh hoạt. Chỉ tính bài full mock: điểm cao hơn, thời gian làm ngắn hơn, rồi ai nộp bài trước.'
          }
          badgeLabel={
            totalParticipants > 0
              ? fireBoard
                ? `${totalParticipants} người đã giữ lửa`
                : `${totalParticipants} người đã hoàn thành`
              : undefined
          }
        />

        <div className={cx('tabs')} role="tablist" aria-label="Bảng xếp hạng">
          {exams.map((exam) => {
            const active = !fireBoard && exam.examTypeId === selectedId;
            return (
              <button
                key={exam.examTypeId}
                type="button"
                role="tab"
                aria-selected={active}
                className={cx('tab', {tabActive: active})}
                onClick={() => selectExam(exam.examTypeId)}
              >
                {hallOfFameTabLabel(exam.name)}
              </button>
            );
          })}
          <button
            type="button"
            role="tab"
            aria-selected={fireBoard}
            className={cx('tab', 'tabFire', {tabActive: fireBoard})}
            onClick={selectFire}
          >
            Chuỗi
          </button>
        </div>

        {showLoading ? (
          <p className={cx('status')}>Đang tải bảng vinh danh…</p>
        ) : (!fireBoard && examsError) || isError ? (
          <p className={cx('status')}>Không tải được bảng xếp hạng. Thử lại sau.</p>
        ) : !fireBoard && exams.length === 0 ? (
          <p className={cx('status')}>Chưa có kỳ thi chuẩn để vinh danh.</p>
        ) : entries.length === 0 ? (
          <p className={cx('status')}>
            {fireBoard ? 'Chưa có ai giữ được chuỗi ngày học.' : 'Chưa có ai hoàn thành bài thi thử.'}
          </p>
        ) : fireBoard ? (
          <div className={cx('tableWrap')}>
            {totalParticipants > entries.length && (
              <p className={cx('note')}>
                Hiển thị {entries.length} người chuỗi dài nhất trong {totalParticipants} người.
              </p>
            )}
            <table className={cx('table')}>
              <thead>
                <tr>
                  <th>Hạng</th>
                  <th>Người học</th>
                  <th>Chuỗi dài nhất</th>
                </tr>
              </thead>
              <tbody>
                {streakBoard.entries.map((entry) => {
                  const avatar = getFullMediaUrl(entry.avatarUrl);
                  return (
                    <tr key={entry.rank} className={cx({podium: entry.rank <= 3})}>
                      <td data-label="Hạng">
                        <span className={cx('rank', `rank${entry.rank}`)}>{entry.rank}</span>
                      </td>
                      <td data-label="Người học">
                        <span className={cx('person')}>
                          {avatar ? (
                            <img className={cx('avatar')} src={avatar} alt="" />
                          ) : (
                            <span className={cx('avatar', 'fallback')} aria-hidden="true">
                              {initials(entry.displayName)}
                            </span>
                          )}
                          <span className={cx('name')}>{entry.displayName}</span>
                        </span>
                      </td>
                      <td data-label="Chuỗi dài nhất">
                        <span className={cx('streak')}>
                          <FaFire aria-hidden="true" />
                          {entry.longestStreak ?? 0}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={cx('tableWrap')}>
            {totalParticipants > entries.length && (
              <p className={cx('note')}>
                Hiển thị {entries.length} người điểm cao nhất trong {totalParticipants} người.
              </p>
            )}
            <table className={cx('table')}>
              <thead>
                <tr>
                  <th>Hạng</th>
                  <th>Người làm</th>
                  <th>Kỳ thi</th>
                  <th>Điểm</th>
                  <th>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {examBoard.entries.map((entry) => {
                  const avatar = getFullMediaUrl(entry.avatarUrl);
                  return (
                    <tr key={entry.rank} className={cx({podium: entry.rank <= 3})}>
                      <td data-label="Hạng">
                        <span className={cx('rank', `rank${entry.rank}`)}>{entry.rank}</span>
                      </td>
                      <td data-label="Người làm">
                        <span className={cx('person')}>
                          {avatar ? (
                            <img className={cx('avatar')} src={avatar} alt="" />
                          ) : (
                            <span className={cx('avatar', 'fallback')} aria-hidden="true">
                              {initials(entry.displayName)}
                            </span>
                          )}
                          <span className={cx('name')}>{entry.displayName}</span>
                        </span>
                      </td>
                      <td data-label="Kỳ thi">{entry.examTypeName || '—'}</td>
                      <td data-label="Điểm">
                        <span className={cx('score')}>{entry.totalScore ?? 0}</span>
                      </td>
                      <td data-label="Thời gian">{formatDuration(entry.durationTaken)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Container>
    </div>
  );
}

export default HallOfFame;
