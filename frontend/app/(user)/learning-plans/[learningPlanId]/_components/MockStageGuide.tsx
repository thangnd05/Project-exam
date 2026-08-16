'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import classNames from 'classnames/bind';
import { formatDateTime24 as formatDate } from '@/app/utils/format-date-time';
import { getMyCompletedUserTests } from '@/app/apis/userTestApi';
import { buildExamTypeDetailPath } from '@/app/configs/Routes';
import { isPracticeAttempt } from '@/app/utils/planLabels';
import type { PlanResponse, UserTestResponse } from '@/app/types';
import styles from '@/app/assets/styles/diagnostic/PersonalizedPlan.module.scss';

const cx = classNames.bind(styles);

function findFreshMock(tests: UserTestResponse[] | undefined, plan: PlanResponse): UserTestResponse | null {
  const planCreatedAt = plan.createdAt ? new Date(plan.createdAt).getTime() : 0;
  const candidates = (tests || []).filter((t) => {
    if (!t.finishedAt || t.userTestId === plan.sourceUserTestId) return false;
    return new Date(t.finishedAt).getTime() > planCreatedAt;
  });
  return candidates.find((t) => !isPracticeAttempt(t)) || candidates[0] || null;
}

type MockStageGuideProps = {
  plan: PlanResponse;
};

function MockStageGuide({ plan }: MockStageGuideProps) {
  const testsQuery = useQuery({
    queryKey: ['completed-user-tests', plan.examTypeId],
    queryFn: () => getMyCompletedUserTests(plan.examTypeId),
    enabled: !!plan.examTypeId,
  });

  const freshMock = findFreshMock(testsQuery.data, plan);
  const mockTestsTo = buildExamTypeDetailPath(plan.examTypeId);
  const generateTo = freshMock
    ? `/learning-plans/generate?userTestId=${freshMock.userTestId}&examTypeId=${plan.examTypeId}`
    : `/learning-plans/generate?examTypeId=${plan.examTypeId}`;

  return (
    <div className={cx('card')}>
      <div className={cx('cardBody')}>
        <h3 className={cx('sectionTitle')} style={{ marginBottom: 4 }}>
          Tiếp theo làm gì?
        </h3>
        <p className={cx('muted')} style={{ marginBottom: '1.2rem' }}>
          Bạn đã xong phần luyện ải. Còn 2 bước nữa để khép vòng lặp học:
        </p>

        <div className={cx('stepsGuide')}>
          <div className={cx('stepItem')}>
            <span className={cx('stepNum')}>1</span>
            <div>
              <div className={cx('stepTitle')}>Làm một bài thi thử trọn đề</div>
              <div className={cx('stepDesc')}>
                Bài Full Mock chấm lại độ sẵn sàng thật sau khi luyện  chính xác hơn luyện lẻ từng Part.
              </div>
              {!freshMock && (
                <Link
                  href={mockTestsTo}
                  className={cx('btn', 'btnPrimary', 'btnSm')}
                  style={{ marginTop: 8 }}
                >
                  Chọn đề thi thử
                </Link>
              )}
            </div>
          </div>
          <div className={cx('stepItem')}>
            <span className={cx('stepNum')}>2</span>
            <div>
              <div className={cx('stepTitle')}>Sinh lộ trình mới từ chính bài đó</div>
              <div className={cx('stepDesc')}>
                Hệ thống chẩn đoán lại điểm yếu từ bài mới và tạo lộ trình tiếp theo. Lặp đến khi đạt mục tiêu.
              </div>
            </div>
          </div>
        </div>

        {freshMock ? (
          <div className={cx('alert', 'alertSuccess')} style={{ marginTop: '1.2rem' }}>
            <span>
              Bạn đã có bài mới hoàn thành:{' '}
              <strong>
                {freshMock.testTitle ? `${freshMock.testTitle}  ` : ''}
                {formatDate(freshMock.finishedAt)}
                {freshMock.totalScore != null ? ` · Điểm ${freshMock.totalScore}` : ''}
              </strong>
              {isPracticeAttempt(freshMock) && (
                <>
                  {' '}
                  <small>(bài luyện theo Part  lộ trình sinh ra chỉ phủ Part đã luyện)</small>
                </>
              )}
            </span>
            <Link href={generateTo} className={cx('btn', 'btnPrimary', 'btnSm')}>
              Sinh lộ trình từ bài này
            </Link>
          </div>
        ) : (
          <p className={cx('muted')} style={{ marginTop: '1.2rem', marginBottom: 0 }}>
            Sau khi nộp bài thi thử, quay lại đây  nút <strong>Sinh lộ trình từ bài này</strong> sẽ
            hiện sẵn để bạn không phải tự tìm.
          </p>
        )}
      </div>
    </div>
  );
}

export default MockStageGuide;
