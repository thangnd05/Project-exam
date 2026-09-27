'use client';
import Link from 'next/link';
import {useState} from 'react';
import {FaFire} from 'react-icons/fa6';
import classNames from 'classnames/bind';

import AvatarWithCosmetic from '@/app/components/gamification/cosmetic/AvatarWithCosmetic';
import routes from '@/app/configs/Routes';
import {getFullMediaUrl} from '@/app/utils/mediaUrl';
import {hallOfFameTabLabel, useHallOfFameExams} from './hooks/useHallOfFameExams';
import {useQuickLeaderboard} from './hooks/useQuickLeaderboard';
import {useStreakLeaderboard} from './hooks/useStreakLeaderboard';
import styles from './QuickLeaderboard.module.scss';

const cx = classNames.bind(styles);
const HERO_LIMIT = 5;

type BoardRow = {
  rank: number;
  displayName: string;
  userName?: string | null;
  avatarUrl?: string | null;
  value: number;
  unit: string;
  fire?: boolean;
};

function QuickLeaderboard() {
  const {exams, isLoading: examsLoading, isError: examsError} = useHallOfFameExams();
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [fireBoard, setFireBoard] = useState(false);
  const selected = exams.find((exam) => exam.examTypeId === pickedId) ?? exams[0];
  const selectedId = selected?.examTypeId;
  const examBoard = useQuickLeaderboard(HERO_LIMIT, fireBoard ? undefined : selectedId);
  const streakBoard = useStreakLeaderboard(HERO_LIMIT, fireBoard);

  const entries: BoardRow[] = fireBoard
    ? streakBoard.entries.map((entry) => ({
        rank: entry.rank,
        displayName: entry.displayName,
        userName: entry.userName,
        avatarUrl: entry.avatarUrl,
        value: entry.longestStreak ?? 0,
        unit: '',
        fire: true,
      }))
    : examBoard.entries.map((entry) => ({
        rank: entry.rank,
        displayName: entry.displayName,
        userName: entry.userName,
        avatarUrl: entry.avatarUrl,
        value: entry.totalScore ?? 0,
        unit: 'điểm',
      }));
  const totalParticipants = fireBoard ? streakBoard.totalParticipants : examBoard.totalParticipants;
  const boardLoading = fireBoard ? streakBoard.isLoading : examBoard.isLoading;
  const boardPlaceholder = fireBoard ? streakBoard.isPlaceholderData : examBoard.isPlaceholderData;
  const boardError = fireBoard ? streakBoard.isError : examBoard.isError;
  const showSkeleton = fireBoard
    ? boardLoading && !boardPlaceholder
    : (examsLoading || Boolean(selectedId && boardLoading)) && !boardPlaceholder;
  const moreHref = fireBoard
    ? `${routes.hallOfFame}?board=streak`
    : selectedId
      ? `${routes.hallOfFame}?examTypeId=${encodeURIComponent(selectedId)}`
      : routes.hallOfFame;

  return (
    <aside className={cx('board')} aria-label={fireBoard ? 'Bảng vinh danh người giữ lửa' : 'Bảng vinh danh bài thi thử'}>
      <header className={cx('head')}>
        <div className={cx('headRow')}>
          <p className={cx('kicker')}>Vinh danh</p>
          <span className={cx('count')}>Top {HERO_LIMIT}</span>
        </div>
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
                onClick={() => {
                  setFireBoard(false);
                  setPickedId(exam.examTypeId);
                }}
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
            onClick={() => setFireBoard(true)}
          >
            Streak
          </button>
        </div>
        {(fireBoard || selected?.name) && (
          <p className={cx('examTitle')}>
            {fireBoard ? 'Chuỗi ngày học liên tiếp dài nhất' : selected?.name}
          </p>
        )}
      </header>

      {showSkeleton ? (
        <ul className={cx('list')} aria-hidden="true">
          {Array.from({length: HERO_LIMIT}, (_, index) => (
            <li key={index} className={cx('row', 'skeleton')} />
          ))}
        </ul>
      ) : (!fireBoard && examsError) || boardError ? (
        <p className={cx('slot', 'empty')}>Chưa tải được bảng vinh danh.</p>
      ) : !fireBoard && exams.length === 0 ? (
        <p className={cx('slot', 'empty')}>Chưa có kỳ thi chuẩn để vinh danh.</p>
      ) : (
        <ol className={cx('list')}>
          {Array.from({length: HERO_LIMIT}, (_, index) => {
            const entry = entries[index];
            const rank = index + 1;
            if (!entry) {
              return (
                <li key={rank} className={cx('row', 'vacant')} aria-label={`Hạng ${rank}, chưa có người`}>
                  <span className={cx('rank')} aria-hidden="true">
                    {rank}
                  </span>
                  <span className={cx('avatar', 'seat')} aria-hidden="true" />
                  <span className={cx('who')} aria-hidden="true">
                    <span className={cx('ghost')} />
                  </span>
                  <span className={cx('vacantScore')} aria-hidden="true">
                    —
                  </span>
                </li>
              );
            }
            return (
              <li key={entry.rank} className={cx('row', `rank${entry.rank}`)}>
                <span className={cx('rank')} aria-label={`Hạng ${entry.rank}`}>
                  {entry.rank}
                </span>
                <AvatarWithCosmetic
                  src={getFullMediaUrl(entry.avatarUrl)}
                  name={entry.userName || (/ui-avatars\.com/i.test(entry.avatarUrl || '') ? undefined : entry.displayName)}
                  alt=""
                  size={36}
                />
                <span className={cx('who')}>
                  <span className={cx('name')}>{entry.userName || entry.displayName}</span>
                </span>
                <span className={cx('score', {fire: entry.fire})}>
                  {entry.fire && <FaFire className={cx('flame')} aria-hidden="true" />}
                  <span className={cx('scoreValue')}>
                    {entry.value}
                    {entry.unit ? <small>{entry.unit}</small> : null}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <Link className={cx('more')} href={moreHref}>
        Xem tất cả{totalParticipants > 0 ? ` · ${totalParticipants} người` : ''}
      </Link>
    </aside>
  );
}

export default QuickLeaderboard;
