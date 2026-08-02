import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import { formatDateTime24 as formatDate } from '~/shared/utils/format-date-time';
import { useTargetAchieved } from '~/features/diagnostic/target/hooks/useTargetAchieved';
import ButtonPrime from '~/shared/ui/Button/ButtonPrime';
import styles from '~/features/diagnostic/styles/PersonalizedPlan.module.scss';

const cx = classNames.bind(styles);

function suggestNextTarget(current) {
  if (current == null) return null;
  const step = 50;
  const next = Math.min(990, Math.round((current + step) / 10) * 10);
  return next > current ? next : current + 10;
}

function TargetAchievedPage() {
  const [searchParams] = useSearchParams();
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
  const nextSuggestion = useMemo(() => {
    if (!target?.targetScore) return null;
    return suggestNextTarget(target.targetScore);
  }, [target]);

  return (
    <div className={cx('wrapper')}>
      <div className={cx('headerBar')}>
        <ButtonPrime as="link" to="/my-target/dashboard" variant="ghost" size="sm">
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
          <ButtonPrime as="link" to={`/my-target?examTypeId=${examTypeId}`} variant="primary" size="sm">
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
            to={`/my-target/dashboard?examTypeId=${examTypeId}`}
            variant="outline"
            size="sm"
          >
            Xem tiến độ
          </ButtonPrime>
        </div>
      )}

      {!loading && isAchieved && (
        <>
          <div className={cx('hero')}>
            <h1 className={cx('heroTitle')}>Bạn đã đạt mục tiêu!</h1>
            <p className={cx('heroSubtitle')}>
              Mục tiêu: <strong>{target.targetScore}</strong>
              {enhancedMatches && enhanced?.totalScore != null && (
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
                : <>Mock đạt mục tiêu: {formatDate(latestMock?.finishedAt)}</>}
            </p>
          </div>

          <div className={cx('card')}>
            <div className={cx('cardHeader')}>Mục tiêu tiếp theo</div>
            <div className={cx('cardBody')}>
              <p className={cx('muted')} style={{ marginBottom: '1.6rem' }}>
                Bạn vừa hoàn thành chặng <strong>{target.targetScore}</strong>. Hãy đặt mục tiêu cao hơn để duy trì phong độ và mở khoá ngưỡng mới.
              </p>

              {nextSuggestion && (
                <div className={cx('suggestGrid')}>
                  <div className={cx('suggestCard')}>
                    <div className={cx('suggestLabel')}>Gợi ý</div>
                    <div className={cx('suggestValue')}>{nextSuggestion}</div>
                    <ButtonPrime
                      as="link"
                      to={`/my-target?examTypeId=${examTypeId}&suggest=${nextSuggestion}`}
                      variant="success"
                      size="sm"
                    >
                      Đặt {nextSuggestion}
                    </ButtonPrime>
                  </div>
                  <div className={cx('suggestCard')}>
                    <div className={cx('suggestLabel')}>Vượt xa hơn</div>
                    <div className={cx('suggestValue')}>{Math.min(990, nextSuggestion + 50)}</div>
                    <ButtonPrime
                      as="link"
                      to={`/my-target?examTypeId=${examTypeId}&suggest=${Math.min(990, nextSuggestion + 50)}`}
                      variant="outline"
                      size="sm"
                    >
                      Thách thức
                    </ButtonPrime>
                  </div>
                  <div className={cx('suggestCard')}>
                    <div className={cx('suggestLabel')}>Tự nhập</div>
                    <div className={cx('suggestValue')} style={{ fontSize: 'var(--font-size-lg)' }}>—</div>
                    <ButtonPrime
                      as="link"
                      to={`/my-target?examTypeId=${examTypeId}`}
                      variant="outline"
                      size="sm"
                    >
                      Vào trang target
                    </ButtonPrime>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={cx('card')}>
            <div className={cx('cardHeader')}>Tiếp theo có thể làm</div>
            <div className={cx('cardBody')}>
              <ul style={{ paddingLeft: '2rem', margin: 0, fontSize: 'var(--font-size-ssm)' }}>
                <li>
                  <Link to={`/my-target?examTypeId=${examTypeId}`}>Đặt mục tiêu mới</Link>
                  {' '}— chỉnh điểm + aim từng Part.
                </li>
                <li>
                  <Link to={`/learning-plans/compare?examTypeId=${examTypeId}`}>
                    Xem hành trình các lộ trình
                  </Link>
                  {' '}— độ sẵn sàng #1 → #N qua từng bài thi thử.
                </li>
                <li>
                  <Link to={`/my-target/dashboard?examTypeId=${examTypeId}`}>
                    Tổng quan mục tiêu
                  </Link>
                  {' '}— biểu đồ độ sẵn sàng theo thời gian và các bài đã làm.
                </li>
                <li>
                  <Link to="/">Làm thêm bài</Link>
                  {' '}— duy trì phong độ, chờ thi thật.
                </li>
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default TargetAchievedPage;
