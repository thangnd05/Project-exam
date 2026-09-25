'use client';
import Link from 'next/link';
import {useState} from 'react';
import classNames from 'classnames/bind';

import routes from '@/app/configs/Routes';
import {getFullMediaUrl} from '@/app/utils/mediaUrl';
import {hallOfFameTabLabel, useHallOfFameExams} from './hooks/useHallOfFameExams';
import {useQuickLeaderboard} from './hooks/useQuickLeaderboard';
import styles from './QuickLeaderboard.module.scss';

const cx = classNames.bind(styles);
const HERO_LIMIT = 10;

const initials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'K';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`.toUpperCase();
};

function QuickLeaderboard() {
  const {exams, isLoading: examsLoading, isError: examsError} = useHallOfFameExams();
  const [pickedId, setPickedId] = useState<string | null>(null);
  const selected = exams.find((exam) => exam.examTypeId === pickedId) ?? exams[0];
  const selectedId = selected?.examTypeId;
  const {entries, totalParticipants, isLoading, isPlaceholderData, isError} = useQuickLeaderboard(
    HERO_LIMIT,
    selectedId,
  );
  const showSkeleton = (examsLoading || Boolean(selectedId && isLoading)) && !isPlaceholderData;

  return (
    <aside className={cx('board')} aria-label="Bảng vinh danh bài thi thử">
      <header className={cx('head')}>
        <div className={cx('headRow')}>
          <p className={cx('kicker')}>Vinh danh</p>
          <span className={cx('count')}>Top {HERO_LIMIT}</span>
        </div>
        {exams.length > 0 && (
          <div className={cx('tabs')} role="tablist" aria-label="Kỳ thi">
            {exams.map((exam) => {
              const active = exam.examTypeId === selectedId;
              return (
                <button
                  key={exam.examTypeId}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={cx('tab', {tabActive: active})}
                  onClick={() => setPickedId(exam.examTypeId)}
                >
                  {hallOfFameTabLabel(exam.name)}
                </button>
              );
            })}
          </div>
        )}
        {selected?.name && <p className={cx('examTitle')}>{selected.name}</p>}
      </header>

      {showSkeleton ? (
        <ul className={cx('list')} aria-hidden="true">
          {Array.from({length: 6}, (_, index) => (
            <li key={index} className={cx('row', 'skeleton')} />
          ))}
        </ul>
      ) : examsError || isError ? (
        <p className={cx('empty')}>Chưa tải được bảng vinh danh.</p>
      ) : exams.length === 0 ? (
        <p className={cx('empty')}>Chưa có kỳ thi chuẩn để vinh danh.</p>
      ) : entries.length === 0 ? (
        <p className={cx('empty')}>Chưa có ai hoàn thành bài thi thử kỳ này.</p>
      ) : (
        <ol className={cx('list')}>
          {entries.map((entry) => {
            const avatar = getFullMediaUrl(entry.avatarUrl);
            return (
              <li key={entry.rank} className={cx('row', `rank${entry.rank}`)}>
                <span className={cx('rank')} aria-label={`Hạng ${entry.rank}`}>
                  {entry.rank}
                </span>
                {avatar ? (
                  <img className={cx('avatar')} src={avatar} alt="" />
                ) : (
                  <span className={cx('avatar', 'fallback')} aria-hidden="true">
                    {initials(entry.displayName)}
                  </span>
                )}
                <span className={cx('who')}>
                  <span className={cx('name')}>{entry.displayName}</span>
                </span>
                <span className={cx('score')}>
                  {entry.totalScore ?? 0}
                  <small>điểm</small>
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <Link
        className={cx('more')}
        href={selectedId ? `${routes.hallOfFame}?examTypeId=${encodeURIComponent(selectedId)}` : routes.hallOfFame}
      >
        Xem tất cả{totalParticipants > 0 ? ` · ${totalParticipants} người` : ''}
      </Link>
    </aside>
  );
}

export default QuickLeaderboard;
