'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import { formatDateTime24 as formatDate } from '@/app/utils/format-date-time';
import { useTargetAchieved } from '@/app/hooks/useTargetAchieved';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import styles from '@/app/assets/styles/diagnostic/PersonalizedPlan.module.scss';

const cx = classNames.bind(styles);

function TargetAchieved() {
  const searchParams = useSearchParams();
  const [examTypeId, setExamTypeId] = useState(searchParams.get('examTypeId') || '');

  const { examTypes, target, latestMock, enhanced, isLoading: loading, error } =
    useTargetAchieved(examTypeId);

  useEffect(() => {
    if (!examTypeId && examTypes.length > 0) setExamTypeId(examTypes[0].examTypeId);
  }, [examTypes, examTypeId]);

  const enhancedMatches =
    enhanced && (!enhanced.examTypeId || enhanced.examTypeId === examTypeId);
  const isAchieved = Boolean(target?.achievedAt)
    || (enhancedMatches && enhanced?.isTargetMet === true);

  return (
    <div className={cx('wrapper')}>
      <div className={cx('headerBar')}>
        <ButtonPrime as="link" href="/my-target/dashboard" variant="ghost" size="sm">
          ← Tổng quan mục tiêu
        </ButtonPrime>
      </div>

      <div className={cx('filterRow')}>
        <div className={cx('fieldGroup')}>
          <label className={cx('fieldLabel')}>Loại kỳ thi</label>
          <select
            className={cx('select')}
            value={examTypeId}
            onChange={(e) => setExamTypeId(e.target.value)}
          >
            {examTypes.map((et) => (
              <option key={et.examTypeId} value={et.examTypeId}>{et.name}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className={cx('alert', 'alertDanger')}>{error}</div>}
      {loading && <div className={cx('loading')}>Đang tải...</div>}

      {!loading && !target?.hasTarget && (
        <div className={cx('alert', 'alertInfo')}>
          <span>Bạn chưa đặt mục tiêu cho kỳ thi này.</span>
          <ButtonPrime as="link" href={`/my-target?examTypeId=${examTypeId}`} variant="primary" size="sm">
            Đặt mục tiêu
          </ButtonPrime>
        </div>
      )}

      {!loading && target?.hasTarget && !isAchieved && (
        <div className={cx('alert', 'alertWarning')}>
          <span>
            Bài thi thử gần nhất chưa đạt mục tiêu {target.targetScore} điểm.{' '}
            {enhanced?.totalScore != null && (
              <>Điểm gần nhất: <strong>{enhanced.totalScore}</strong>.</>
            )}
          </span>
          <ButtonPrime
            as="link"
            href={`/my-target/dashboard?examTypeId=${examTypeId}`}
            variant="outline"
            size="sm"
          >
            Xem tiến độ
          </ButtonPrime>
        </div>
      )}

      {!loading && isAchieved && target && (
        <>
          <div className={cx('hero')}>
            <h1 className={cx('heroTitle')}>Bạn đã đạt mục tiêu!</h1>
            <p className={cx('heroSubtitle')}>
              Mục tiêu: <strong>{target.targetScore}</strong>
              {enhancedMatches && enhanced?.totalScore != null && target.targetScore != null && (
                <>
                  {' · '}Điểm đạt được:{' '}
                  <strong className={cx('successText')}>{enhanced.totalScore}</strong>
                  {' '}(+{enhanced.totalScore - target.targetScore})
                </>
              )}
            </p>
            <p className={cx('heroMeta')}>
              {target.achievedAt
                ? <>Đạt mục tiêu lúc: {formatDate(target.achievedAt)}</>
                : <>Bài thi thử đạt mục tiêu: {formatDate(latestMock?.finishedAt)}</>}
            </p>
          </div>

          <div className={cx('card')}>
            <div className={cx('cardHeader')}>Mục tiêu tiếp theo</div>
            <div className={cx('cardBody')}>
              {/* Mục tiêu do người dùng tự đặt nên không gợi ý mức điểm. */}
              <p className={cx('muted')} style={{ marginBottom: '1.6rem' }}>
                Bạn vừa hoàn thành chặng <strong>{target.targetScore}</strong>. Muốn đặt mức mới, hãy vào trang Mục tiêu và tự nhập điểm.
              </p>
              <ButtonPrime
                as="link"
                href={`/my-target?examTypeId=${examTypeId}`}
                variant="outline"
                size="sm"
              >
                Vào trang mục tiêu
              </ButtonPrime>
            </div>
          </div>

          <div className={cx('card')}>
            <div className={cx('cardHeader')}>Tiếp theo có thể làm</div>
            <div className={cx('cardBody')}>
              <ul style={{ paddingLeft: '2rem', margin: 0, fontSize: 'var(--font-size-ssm)' }}>
                <li>
                  <Link href={`/my-target?examTypeId=${examTypeId}`}>Đặt mục tiêu mới</Link>
                  {' '}- chỉnh điểm và mục tiêu từng phần.
                </li>
                <li>
                  <Link href={`/learning-plans/compare?examTypeId=${examTypeId}`}>
                    Xem hành trình các lộ trình
                  </Link>
                  {' '}- độ sẵn sàng #1 → #N qua từng bài thi thử.
                </li>
                <li>
                  <Link href={`/my-target/dashboard?examTypeId=${examTypeId}`}>
                    Tổng quan mục tiêu
                  </Link>
                  {' '}- biểu đồ độ sẵn sàng theo thời gian và các bài đã làm.
                </li>
                <li>
                  <Link href="/">Làm thêm bài</Link>
                  {' '}- duy trì phong độ, chờ thi thật.
                </li>
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default TargetAchieved;
