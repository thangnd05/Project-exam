import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import { getMilestones } from '~/api/milestoneApi';
import { getStandardExamTypes } from '~/api/examTypeApi';
import { getExamParts } from '~/api/examPartApi';
import { getSkills } from '~/api/skillApi';
import { getScoringConversions } from '~/api/scoringConversionApi';
import {
  createOrUpdateUserTarget,
  deleteUserTarget,
  getUserTarget,
} from '~/api/userTargetApi';
import planStyles from '../../learning-plan/styles/PersonalizedPlan.module.scss';
import styles from './UserTargetPage.module.scss';
import { sortByPartOrder, sortPartsByLookup } from '~/utils/partOrder';

const cx = classNames.bind(styles);
const planCx = classNames.bind(planStyles);

function UserTargetPage() {
  const [searchParams] = useSearchParams();
  const [examTypes, setExamTypes] = useState([]);
  const [examParts, setExamParts] = useState([]);
  const [skills, setSkills] = useState([]);
  const [scoringConversions, setScoringConversions] = useState([]);
  const [selectedExamTypeId, setSelectedExamTypeId] = useState('');
  const [milestones, setMilestones] = useState([]);
  const [targetScore, setTargetScore] = useState('');
  const [customParts, setCustomParts] = useState({});
  const [currentTarget, setCurrentTarget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    getStandardExamTypes().then(setExamTypes).catch(() => {});
    getExamParts().then((data) => setExamParts(sortByPartOrder(data))).catch(() => {});
    getSkills().then(setSkills).catch(() => {});
    getScoringConversions().then(setScoringConversions).catch(() => {});
  }, []);

  useEffect(() => {
    const examTypeIdFromQuery = searchParams.get('examTypeId');
    if (examTypeIdFromQuery) {
      setSelectedExamTypeId(examTypeIdFromQuery);
    }
  }, [searchParams]);

  const getPartTotal = (examPartId) =>
    examParts.find((p) => p.examPartId === examPartId)?.defaultNumQuestions || 0;
  const getPartName = (examPartId) =>
    examParts.find((p) => p.examPartId === examPartId)?.name || examPartId;
  const percentToNum = (pct, total) => (total > 0 ? Math.round((pct * total) / 100) : 0);
  const numToPercent = (num, total) => (total > 0 ? Math.round((num / total) * 100) : 0);

  // Loại kỳ thi đang chọn + phương thức chấm. AWS_SCALE = thang scaled 100–1000, không có skill.
  const selectedExamType = examTypes.find((t) => String(t.examTypeId) === String(selectedExamTypeId));
  const scoringMethod = (selectedExamType?.scoringMethod || 'DEFAULT').toUpperCase();
  const isScaled = scoringMethod === 'AWS_SCALE';
  const SCALE_MIN = 100; // điểm tối thiểu thang AWS
  const SCALE_SPAN = 900; // 100..1000
  const SCALE_MAX = SCALE_MIN + SCALE_SPAN;
  const maxTargetScore = isScaled ? SCALE_MAX : 990;
  // % cần đạt (chia đều) tương ứng với 1 điểm mục tiêu.
  const evenPctForScore = (score) =>
    isScaled
      ? Math.max(0, Math.min(100, Math.round(((Number(score) - SCALE_MIN) / SCALE_SPAN) * 100)))
      : Math.min(100, Math.round((Number(score) / 990) * 100));

  const estimateScore = (partsConfig, examTypeId) => {
    if (!examTypeId || !partsConfig || Object.keys(partsConfig).length === 0) return null;

    // AWS / thang scaled không có skill → tính thẳng bằng công thức 100 + (đúng/tổng)*900.
    if (isScaled) {
      let totalCorrect = 0;
      let totalQuestions = 0;
      for (const [examPartId, pct] of Object.entries(partsConfig)) {
        const part = examParts.find((p) => p.examPartId === examPartId);
        const tot = part?.defaultNumQuestions || 0;
        totalCorrect += percentToNum(pct, tot);
        totalQuestions += tot;
      }
      const totalScore = totalQuestions > 0
        ? Math.max(SCALE_MIN, Math.min(SCALE_MAX, SCALE_MIN + Math.round((totalCorrect / totalQuestions) * SCALE_SPAN)))
        : SCALE_MIN;
      return { totalScore, scaled: true, totalCorrect, totalQuestions, skillDetails: [] };
    }

    const correctBySkill = {};
    for (const [examPartId, pct] of Object.entries(partsConfig)) {
      const part = examParts.find((p) => p.examPartId === examPartId);
      if (!part) continue;
      const numCorrect = percentToNum(pct, part.defaultNumQuestions || 0);
      correctBySkill[part.skillId] = (correctBySkill[part.skillId] || 0) + numCorrect;
    }
    const relevantConversions = scoringConversions.filter((c) => c.examTypeId === examTypeId);
    if (relevantConversions.length === 0) return null;

    let totalScore = 0;
    const skillDetails = [];
    for (const [skillId, numCorrect] of Object.entries(correctBySkill)) {
      const skillConversions = relevantConversions
        .filter((c) => c.skillId === skillId)
        .sort((a, b) => a.numCorrect - b.numCorrect);
      if (skillConversions.length === 0) continue;
      let matched = skillConversions[0];
      for (const c of skillConversions) {
        if (c.numCorrect <= numCorrect) matched = c;
        else break;
      }
      const skillName = skills.find((s) => s.skillId === skillId)?.name || skillId;
      totalScore += matched.convertedScore;
      skillDetails.push({ skillName, numCorrect, convertedScore: matched.convertedScore });
    }
    return { totalScore, skillDetails };
  };

  const loadMilestones = useCallback(async () => {
    if (!selectedExamTypeId) {
      setMilestones([]);
      return;
    }
    try {
      const data = await getMilestones(selectedExamTypeId);
      setMilestones(data);
    } catch {
      setMilestones([]);
    }
  }, [selectedExamTypeId]);

  useEffect(() => {
    loadMilestones();
  }, [loadMilestones]);

  const loadCurrentTarget = useCallback(async () => {
    if (!selectedExamTypeId) {
      setCurrentTarget(null);
      setTargetScore('');
      setCustomParts({});
      return;
    }
    try {
      const data = await getUserTarget(selectedExamTypeId);
      if (data.hasTarget) {
        setCurrentTarget(data);
        setTargetScore(String(data.targetScore || ''));
        const cp = {};
        (data.partRequirements || []).forEach((p) => {
          cp[p.examPartId] = p.requiredPercentage;
        });
        setCustomParts(cp);
      } else {
        setCurrentTarget(null);
        setTargetScore('');
        setCustomParts({});
      }
    } catch {
      setCurrentTarget(null);
      setTargetScore('');
      setCustomParts({});
    }
  }, [selectedExamTypeId]);

  useEffect(() => {
    loadCurrentTarget();
  }, [loadCurrentTarget]);

  const matchedMilestone = useMemo(() => {
    if (!targetScore) return null;
    return milestones.find((m) => m.milestoneScore === Number(targetScore)) || null;
  }, [targetScore, milestones]);

  const filteredParts = examParts.filter((p) => p.examTypeId === selectedExamTypeId);
  const partRequirements = useMemo(() => {
    if (!targetScore || filteredParts.length === 0) return [];
    if (matchedMilestone && matchedMilestone.partRequirements) {
      const mapped = matchedMilestone.partRequirements.map((pr) => ({
        examPartId: pr.examPartId,
        requiredPercentage: pr.requiredPercentage,
      }));
      return sortPartsByLookup(mapped, filteredParts);
    }
    const evenPct = evenPctForScore(targetScore);
    return filteredParts.map((p) => ({
      examPartId: p.examPartId,
      requiredPercentage: evenPct,
    }));
  }, [targetScore, matchedMilestone, filteredParts]);

  const handleSave = async () => {
    if (!targetScore || !selectedExamTypeId) {
      setMessage('Nhập điểm mục tiêu trước.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const allParts = partRequirements.map((pr) => ({
        examPartId: pr.examPartId,
        customPercentage:
          customParts[pr.examPartId] !== undefined
            ? Number(customParts[pr.examPartId])
            : pr.requiredPercentage,
      }));

      const result = await createOrUpdateUserTarget({
        examTypeId: selectedExamTypeId,
        targetScore: Number(targetScore),
        customParts: allParts,
      });
      setCurrentTarget(result);
      setMessage('Đã lưu mục tiêu thành công!');
    } catch {
      setMessage('Lỗi khi lưu mục tiêu.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedExamTypeId) return;
    setLoading(true);
    setMessage('');
    try {
      await deleteUserTarget(selectedExamTypeId);
      setCurrentTarget(null);
      setTargetScore('');
      setCustomParts({});
      setMessage('Đã xóa mục tiêu.');
    } catch {
      setMessage('Lỗi khi xóa mục tiêu.');
    } finally {
      setLoading(false);
    }
  };

  const handlePartChange = (examPartId, value) => {
    setCustomParts((prev) => ({ ...prev, [examPartId]: value }));
  };

  const handleResetPart = (examPartId) => {
    setCustomParts((prev) => {
      const next = { ...prev };
      delete next[examPartId];
      return next;
    });
  };

  const isSuccess = message.includes('thành công') || message.includes('Đã xóa');
  const hasSavedTarget = Boolean(currentTarget?.hasTarget);

  const scoreEstimateBlock = (() => {
    if (!targetScore || partRequirements.length === 0) return null;
    const partsConfig = {};
    partRequirements.forEach((pr) => {
      partsConfig[pr.examPartId] =
        customParts[pr.examPartId] !== undefined
          ? Number(customParts[pr.examPartId])
          : pr.requiredPercentage;
    });
    const est = estimateScore(partsConfig, selectedExamTypeId);
    if (!est) return null;
    const diff = est.totalScore - Number(targetScore);
    const tone = diff === 0 ? 'neutral' : diff > 0 ? 'above' : 'below';
    const diffColor =
      diff === 0 ? 'var(--success-text)' : 'var(--primary)';

    return (
      <div className={classNames(planCx('alert'), cx('scoreEstimate', tone))}>
        <div className={cx('scoreEstimateMain')}>
          <span className={planCx('muted')}>Điểm ước tính:</span>
          <span className={cx('scoreEstimateValue')}>{est.totalScore}</span>
          <span className={cx('scoreEstimateDiff')} style={{ color: diffColor }}>
            ({diff > 0 ? '+' : ''}
            {diff} so với mục tiêu {targetScore})
          </span>
        </div>
        <div className={cx('scoreEstimateDetail')}>
          {est.scaled
            ? `Tổng ${est.totalCorrect}/${est.totalQuestions} câu đúng → ${est.totalScore} điểm (thang ${SCALE_MIN}–${SCALE_MAX}, cần đạt ≥ ${targetScore})`
            : est.skillDetails
                .map((s) => `${s.skillName}: ${s.numCorrect} câu → ${s.convertedScore} điểm`)
                .join(' | ')}
        </div>
      </div>
    );
  })();

  return (
    <div className={classNames(planCx('wrapper'), cx('pageRoot'))}>
      <div className={planCx('headerBar')}>
        <h2 className={classNames(planCx('title'), cx('pageTitle'))}>Mục tiêu của tôi</h2>
        <div className={planCx('actionBar')}>
          <Link
            to={
              selectedExamTypeId
                ? `/my-target/dashboard?examTypeId=${selectedExamTypeId}`
                : '/my-target/dashboard'
            }
            className={planCx('btn', 'btnOutline', 'btnSm')}
          >
            Dashboard
          </Link>
          <Link
            to={
              selectedExamTypeId
                ? `/learning-plans/generate?examTypeId=${selectedExamTypeId}`
                : '/learning-plans/generate'
            }
            className={planCx('btn', 'btnPrimary', 'btnSm')}
          >
            Sinh lộ trình
          </Link>
        </div>
      </div>

      <p className={classNames(planCx('subtitle'), cx('pageSubtitle'))}>
        Nhập điểm mục tiêu theo từng loại kỳ thi. Nếu trùng mốc admin đã cấu hình, % từng
        phần sẽ được gợi ý tự động. Bạn có thể chỉnh lại yêu cầu từng part cho phù hợp
        với bản thân.
      </p>

      {message && (
        <div
          className={planCx(
            'alert',
            isSuccess ? 'alertSuccess' : 'alertDanger',
          )}
        >
          <span>{message}</span>
        </div>
      )}

      <div className={classNames(planCx('card'), cx('setupCard'))}>
        <div className={classNames(planCx('cardHeader'), cx('compactCardHeader'))}>Thiết lập mục tiêu</div>
        <div className={classNames(planCx('cardBody'), cx('compactCardBody'))}>
          <div className={classNames(planCx('fieldGroup'), cx('fieldFull'))}>
            <label className={cx('fieldLabelLarge')}>Loại kỳ thi</label>
            <select
              className={classNames(planCx('select'), cx('compactSelect'))}
              style={{ width: '100%' }}
              value={selectedExamTypeId}
              onChange={(e) => {
                setSelectedExamTypeId(e.target.value);
                setTargetScore('');
                setCustomParts({});
                setMessage('');
              }}
            >
              <option value="">-- Chọn --</option>
              {examTypes.map((et) => (
                <option key={et.examTypeId} value={et.examTypeId}>
                  {et.name}
                </option>
              ))}
            </select>
          </div>

          {selectedExamTypeId && (
            <div className={classNames(planCx('fieldGroup'), cx('fieldFull'))}>
              <label className={cx('fieldLabelLarge')}>Điểm mục tiêu</label>
              <div className={cx('scoreInputRow')}>
                <input
                  type="number"
                  className={classNames(planCx('select'), cx('scoreInput'))}
                  placeholder={isScaled ? 'VD: 700' : 'VD: 450'}
                  value={targetScore}
                  min={0}
                  max={maxTargetScore}
                  onChange={(e) => {
                    setTargetScore(e.target.value);
                    setCustomParts({});
                  }}
                />
                {targetScore && matchedMilestone && (
                  <span className={cx('milestoneHint', 'matched')}>
                    Trùng mốc &quot;{matchedMilestone.milestoneScore}
                    {matchedMilestone.description && ` — ${matchedMilestone.description}`}
                    &quot; — dùng cấu hình admin
                  </span>
                )}
                {targetScore && !matchedMilestone && (
                  <span className={cx('milestoneHint', 'custom')}>
                    Không trùng mốc nào — chia đều {evenPctForScore(targetScore)}% mỗi part
                  </span>
                )}
              </div>
              {milestones.length > 0 && (
                <div className={cx('milestoneChips')}>
                  <span className={cx('chipsLabel')}>Gợi ý từ admin:</span>
                  {milestones.map((m) => (
                    <button
                      key={m.examTargetMilestoneId}
                      type="button"
                      className={classNames(planCx('badge'), cx('chip', {
                        active: Number(targetScore) === m.milestoneScore,
                      }))}
                      onClick={() => {
                        setTargetScore(String(m.milestoneScore));
                        setCustomParts({});
                      }}
                    >
                      {m.milestoneScore}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {targetScore && partRequirements.length > 0 && (
            <div className={classNames(planCx('card'), cx('partSection'))}>
              <div className={classNames(planCx('cardHeader'), cx('compactCardHeader'))}>
                Yêu cầu từng phần thi
              </div>
              <div className={classNames(planCx('cardBody'), cx('compactCardBody'))}>
                <p className={cx('partSectionHint')}>
                  {matchedMilestone
                    ? 'Giá trị từ cấu hình admin. Sửa ô để tuỳ chỉnh.'
                    : `Chia đều ${evenPctForScore(targetScore)}%. Sửa ô để tuỳ chỉnh.`}
                </p>

                {partRequirements.map((pr) => {
                  const isCustom = customParts[pr.examPartId] !== undefined;
                  const currentPct = Number(
                    isCustom ? customParts[pr.examPartId] : pr.requiredPercentage,
                  );
                  const total = getPartTotal(pr.examPartId);
                  const numCorrect = percentToNum(currentPct, total);

                  return (
                    <div key={pr.examPartId} className={cx('partRow')}>
                      <span className={cx('partName')}>
                        {getPartName(pr.examPartId)}
                        <span className={cx('partTotal')}>({total} câu)</span>
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={total}
                        className={classNames(planCx('select'), cx('partInput', { custom: isCustom }))}
                        value={numCorrect}
                        onChange={(e) => {
                          const newPct = numToPercent(Number(e.target.value), total);
                          handlePartChange(pr.examPartId, newPct);
                        }}
                      />
                      <span className={cx('partUnit')}>câu</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        className={classNames(planCx('select'), cx('partInput', { custom: isCustom }))}
                        value={currentPct}
                        onChange={(e) => {
                          handlePartChange(pr.examPartId, Number(e.target.value));
                        }}
                      />
                      <span className={cx('partUnit')}>%</span>
                      {isCustom && (
                        <button
                          type="button"
                          className={cx('resetBtn')}
                          onClick={() => handleResetPart(pr.examPartId)}
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {scoreEstimateBlock}

          {targetScore && (
            <div className={planCx('actionBar')} style={{ marginTop: '0.8rem' }}>
              <button
                type="button"
                className={planCx('btn', 'btnPrimary', 'btnLg')}
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? 'Đang lưu...' : 'Lưu mục tiêu'}
              </button>
              {hasSavedTarget && (
                <button
                  type="button"
                  className={planCx('btn', 'btnOutline', 'btnLg')}
                  onClick={handleDelete}
                  disabled={loading}
                  style={{ color: 'var(--danger-text)', borderColor: 'var(--danger-border)' }}
                >
                  Xóa mục tiêu
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {hasSavedTarget && (
        <section className={cx('currentTargetCard')} aria-label="Mục tiêu hiện tại">
          <div className={cx('currentTargetHeader')}>
            <span className={cx('currentTargetLabel')}>Mục tiêu hiện tại</span>
            <span className={cx('currentTargetScore')}>{currentTarget.targetScore} điểm</span>
          </div>
          <div className={cx('currentTargetParts')}>
            {sortPartsByLookup(currentTarget.partRequirements || [], examParts).map((p) => {
              const total = getPartTotal(p.examPartId);
              const num = percentToNum(p.requiredPercentage, total);
              return (
                <span key={p.examPartId} className={cx('currentTargetBadge')}>
                  {getPartName(p.examPartId)}: {num}/{total} ({p.requiredPercentage}%)
                </span>
              );
            })}
          </div>
          <div className={planCx('actionBar')} style={{ marginTop: '1rem' }}>
            <Link
              to={
                selectedExamTypeId
                  ? `/learning-plans/generate?examTypeId=${selectedExamTypeId}`
                  : '/learning-plans/generate'
              }
              className={planCx('btn', 'btnPrimary', 'btnSm')}
            >
              Sinh lộ trình vượt ải
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

export default UserTargetPage;
