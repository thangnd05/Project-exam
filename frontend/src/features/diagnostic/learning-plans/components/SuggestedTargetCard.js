import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import classNames from 'classnames/bind';
import ButtonPrime from '~/shared/ui/Button/ButtonPrime';
import useMilestoneScoring from '~/shared/hooks/useMilestoneScoring';
import { useUserTargetData } from '~/features/diagnostic/target/hooks/useUserTargetData';
import { useSaveUserTarget } from '~/features/diagnostic/target/hooks/useUserTargetMutations';
import styles from '~/features/diagnostic/styles/PersonalizedPlan.module.scss';

const cx = classNames.bind(styles);

/**
 * Khối "mục tiêu gợi ý 1-click" hiển thị trong GeneratePlanPage khi user chưa có target.
 * Không tự tạo target ngầm: user bấm xác nhận → lưu target thật (API sẵn có) → form sinh
 * plan tự mở khoá nhờ invalidation trong useSaveUserTarget.
 */
function SuggestedTargetCard({ examTypeId, examTypeName }) {
  const { examTypes, examParts, milestones } = useUserTargetData(examTypeId);
  const { evenPctForScore, maxScore } = useMilestoneScoring({
    examTypes,
    examParts,
    selectedExamTypeId: examTypeId,
  });

  const sortedMilestones = useMemo(
    () => [...milestones].sort((a, b) => a.milestoneScore - b.milestoneScore),
    [milestones],
  );

  const [selectedScore, setSelectedScore] = useState(null);

  // Mặc định: mốc "giữa" trong các milestone admin; không có milestone thì lấy ~nửa thang điểm.
  const defaultMilestone =
    sortedMilestones[Math.floor((sortedMilestones.length - 1) / 2)] || null;
  const fallbackScore = Math.round(maxScore / 2 / 50) * 50;
  const suggestedScore =
    selectedScore ?? defaultMilestone?.milestoneScore ?? fallbackScore;
  const matchedMilestone =
    sortedMilestones.find((m) => m.milestoneScore === suggestedScore) || null;

  const filteredParts = useMemo(
    () => examParts.filter((p) => p.examTypeId === examTypeId),
    [examParts, examTypeId],
  );

  const saveMutation = useSaveUserTarget();
  const evenPct = evenPctForScore(suggestedScore);
  const hasPartConfig =
    Boolean(matchedMilestone?.partRequirements?.length) || filteredParts.length > 0;

  const handleConfirm = () => {
    // Build payload giống UserTargetPage: milestone trùng → % admin, không thì chia đều.
    const customParts = matchedMilestone?.partRequirements?.length
      ? matchedMilestone.partRequirements.map((pr) => ({
          examPartId: pr.examPartId,
          customPercentage: pr.requiredPercentage,
        }))
      : filteredParts.map((p) => ({
          examPartId: p.examPartId,
          customPercentage: evenPct,
        }));

    saveMutation.mutate(
      { examTypeId, targetScore: Number(suggestedScore), customParts },
      {
        onSuccess: () =>
          toast.success(
            `Đã lưu mục tiêu ${suggestedScore} điểm — chọn bài thi bên dưới để sinh lộ trình!`,
          ),
        onError: () => toast.error('Lỗi khi lưu mục tiêu.'),
      },
    );
  };

  return (
    <div className={cx('card', 'cardPrimary')}>
      <div className={cx('cardHeader')}>Mục tiêu gợi ý — bắt đầu chỉ với 1 chạm</div>
      <div className={cx('cardBody')}>
        <p style={{ marginBottom: '1rem' }}>
          Bạn chưa đặt mục tiêu cho &quot;{examTypeName || 'kỳ thi này'}&quot;. Dùng
          mục tiêu gợi ý bên dưới để sinh lộ trình ngay — có thể tùy chỉnh chi tiết sau.
        </p>

        <p style={{ marginBottom: '0.6rem' }}>
          Mục tiêu gợi ý: <strong>{suggestedScore} điểm</strong>
          {matchedMilestone
            ? ' · % từng Part theo cấu hình đề xuất'
            : ` · chia đều ${evenPct}% mỗi Part`}
          {matchedMilestone?.description ? ` (${matchedMilestone.description})` : ''}
        </p>

        {sortedMilestones.length > 1 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '0.6rem',
              marginBottom: '1.2rem',
            }}
          >
            <span className={cx('muted', 'small')}>Chọn mốc khác:</span>
            {sortedMilestones.map((m) => (
              <button
                key={m.examTargetMilestoneId}
                type="button"
                className={cx(
                  'badge',
                  m.milestoneScore === suggestedScore ? 'badgePrimary' : 'badgeMuted',
                )}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedScore(m.milestoneScore)}
              >
                {m.milestoneScore}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', flexWrap: 'wrap' }}>
          <ButtonPrime
            variant="primary"
            loading={saveMutation.isPending}
            disabled={!hasPartConfig}
            onClick={handleConfirm}
          >
            Dùng mục tiêu này
          </ButtonPrime>
          <Link
            to={`/my-target?examTypeId=${encodeURIComponent(examTypeId)}`}
            className={cx('btn', 'btnOutline', 'btnSm')}
          >
            Tùy chỉnh chi tiết
          </Link>
        </div>
      </div>
    </div>
  );
}

export default SuggestedTargetCard;
