import React, { useCallback, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames/bind';
import { getMilestones } from '../../api/milestoneApi';
import { getExamTypes } from '../../api/examTypeApi';
import { getExamParts } from '../../api/examPartApi';
import { getSkills } from '../../api/skillApi';
import { getScoringConversions } from '../../api/scoringConversionApi';
import {
  createOrUpdateUserTarget,
  deleteUserTarget,
  getUserTarget,
} from '../../api/userTargetApi';
import styles from './UserTargetTestPage.module.scss';

const cx = classNames.bind(styles);

function UserTargetTestPage() {
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
    getExamTypes().then(setExamTypes).catch(() => { });
    getExamParts().then(setExamParts).catch(() => { });
    getSkills().then(setSkills).catch(() => { });
    getScoringConversions().then(setScoringConversions).catch(() => { });
  }, []);

  const getPartTotal = (examPartId) =>
    examParts.find((p) => p.examPartId === examPartId)?.defaultNumQuestions || 0;
  const getPartName = (examPartId) =>
    examParts.find((p) => p.examPartId === examPartId)?.name || examPartId;
  const percentToNum = (pct, total) => (total > 0 ? Math.round((pct * total) / 100) : 0);
  const numToPercent = (num, total) => (total > 0 ? Math.round((num / total) * 100) : 0);

  const estimateScore = (partsConfig, examTypeId) => {
    if (!examTypeId || !partsConfig || Object.keys(partsConfig).length === 0) return null;
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
      return;
    }
    try {
      const data = await getUserTarget(selectedExamTypeId);
      setCurrentTarget(data);
      setTargetScore(String(data.targetScore || ''));
      const cp = {};
      (data.partRequirements || []).forEach((p) => {
        if (p.customized) {
          cp[p.examPartId] = p.requiredPercentage;
        }
      });
      setCustomParts(cp);
    } catch {
      setCurrentTarget(null);
      setTargetScore('');
      setCustomParts({});
    }
  }, [selectedExamTypeId]);

  useEffect(() => {
    loadCurrentTarget();
  }, [loadCurrentTarget]);

  // Match milestone from typed score
  const matchedMilestone = useMemo(() => {
    if (!targetScore) return null;
    return milestones.find((m) => m.milestoneScore === Number(targetScore)) || null;
  }, [targetScore, milestones]);

  // Part requirements: from milestone if matched, else even split
  const filteredParts = examParts.filter((p) => p.examTypeId === selectedExamTypeId);
  const partRequirements = useMemo(() => {
    if (!targetScore || filteredParts.length === 0) return [];
    if (matchedMilestone && matchedMilestone.partRequirements) {
      return matchedMilestone.partRequirements.map((pr) => ({
        examPartId: pr.examPartId,
        requiredPercentage: pr.requiredPercentage,
      }));
    }
    // Even split
    const evenPct = Math.min(100, Math.round((Number(targetScore) / 990) * 100));
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
      const customPartsArray = Object.entries(customParts)
        .filter(([, val]) => val !== '' && val !== undefined)
        .map(([examPartId, customPercentage]) => ({
          examPartId,
          customPercentage: Number(customPercentage),
        }));

      const result = await createOrUpdateUserTarget({
        examTypeId: selectedExamTypeId,
        targetScore: Number(targetScore),
        examTargetMilestoneId: matchedMilestone?.examTargetMilestoneId || null,
        customParts: customPartsArray.length > 0 ? customPartsArray : null,
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

  return (
    <div className={cx('wrapper')}>
      <h2 className={cx('title')}>Đặt mục tiêu cá nhân</h2>
      <p className={cx('subtitle')}>
        Nhập điểm mục tiêu. Nếu trùng mốc admin đã cấu hình, % từng phần sẽ được gợi ý
        tự động. Nếu không, hệ thống chia đều % và khuyến khích người dùng tìm hiểu kỹ
        mục tiêu bản thân sau đó chỉnh lại số câu.
      </p>

      {/* Chọn exam type */}
      <div className={cx('fieldGroup')}>
        <label className={cx('fieldLabel')}>Loại kỳ thi</label>
        <select
          className={cx('select')}
          value={selectedExamTypeId}
          onChange={(e) => {
            setSelectedExamTypeId(e.target.value);
            setTargetScore('');
            setCustomParts({});
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

      {/* Nhập target score */}
      {selectedExamTypeId && (
        <div className={cx('fieldGroup')}>
          <label className={cx('fieldLabel')}>Điểm mục tiêu</label>
          <div className={cx('scoreInputRow')}>
            <input
              type="number"
              className={cx('scoreInput')}
              placeholder="VD: 450"
              value={targetScore}
              min={0}
              max={990}
              onChange={(e) => {
                setTargetScore(e.target.value);
                setCustomParts({});
              }}
            />
            {targetScore && matchedMilestone && (
              <span className={cx('milestoneHint', 'matched')}>
                Trùng mốc "{matchedMilestone.milestoneScore}
                {matchedMilestone.description && ` — ${matchedMilestone.description}`}" — dùng cấu hình admin
              </span>
            )}
            {targetScore && !matchedMilestone && (
              <span className={cx('milestoneHint', 'custom')}>
                Không trùng mốc nào — chia đều {Math.min(100, Math.round((Number(targetScore) / 990) * 100))}% mỗi part
              </span>
            )}
          </div>
          {milestones.length > 0 && (
            <div className={cx('milestoneChips')}>
              <span className={cx('chipsLabel')}>Gợi ý:</span>
              {milestones.map((m) => (
                <button
                  key={m.examTargetMilestoneId}
                  className={cx('chip', { active: Number(targetScore) === m.milestoneScore })}
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

      {/* Part requirements */}
      {targetScore && partRequirements.length > 0 && (
        <div className={cx('partCard')}>
          <h4 className={cx('partCardTitle')}>Yêu cầu từng phần thi</h4>
          <p className={cx('partCardHint')}>
            {matchedMilestone
              ? 'Giá trị từ cấu hình admin. Sửa ô để tuỳ chỉnh.'
              : `Chia đều ${Math.min(100, Math.round((Number(targetScore) / 990) * 100))}%. Sửa ô để tuỳ chỉnh.`}
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
                  className={cx('partInput', { custom: isCustom })}
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
                  className={cx('partInput', { custom: isCustom })}
                  value={currentPct}
                  onChange={(e) => {
                    handlePartChange(pr.examPartId, Number(e.target.value));
                  }}
                />
                <span className={cx('partUnit')}>%</span>
                {isCustom && (
                  <button
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
      )}

      {/* Score estimate */}
      {targetScore && partRequirements.length > 0 && (() => {
        const partsConfig = {};
        partRequirements.forEach((pr) => {
          partsConfig[pr.examPartId] = customParts[pr.examPartId] !== undefined
            ? Number(customParts[pr.examPartId])
            : pr.requiredPercentage;
        });
        const est = estimateScore(partsConfig, selectedExamTypeId);
        if (!est) return null;
        const diff = est.totalScore - Number(targetScore);
        const color = diff === 0 ? 'var(--success-text)' : diff > 0 ? 'var(--primary)' : '#d97706';
        const bg = diff === 0 ? 'var(--success-bg)' : diff > 0 ? '#eff6ff' : '#fffbeb';
        return (
          <div className={cx('scoreEstimate')} style={{ background: bg }}>
            <span className={cx('scoreEstimateLabel')}>Điểm ước tính:</span>
            <span className={cx('scoreEstimateValue')}>{est.totalScore}</span>
            <span style={{ color, fontSize: 'var(--font-size-sm)' }}>
              ({diff > 0 ? '+' : ''}{diff} so với mục tiêu {targetScore})
            </span>
            <div className={cx('scoreEstimateDetail')}>
              {est.skillDetails.map((s) =>
                `${s.skillName}: ${s.numCorrect} câu → ${s.convertedScore} điểm`
              ).join(' | ')}
            </div>
          </div>
        );
      })()}

      {/* Actions */}
      {targetScore && (
        <div className={cx('actions')}>
          <button
            className={cx('saveBtn')}
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Đang lưu...' : 'Lưu mục tiêu'}
          </button>
          {currentTarget && (
            <button
              className={cx('deleteBtn')}
              onClick={handleDelete}
              disabled={loading}
            >
              Xóa mục tiêu
            </button>
          )}
        </div>
      )}

      {/* Current target */}
      {currentTarget && (
        <div className={cx('currentTarget')}>
          <p className={cx('currentTargetTitle')}>
            Mục tiêu hiện tại: {currentTarget.targetScore} điểm
            {currentTarget.milestoneMatched && currentTarget.milestoneDescription &&
              ` — ${currentTarget.milestoneDescription}`}
            {!currentTarget.milestoneMatched && ' (tự do)'}
          </p>
          <div className={cx('currentTargetParts')}>
            {(currentTarget.partRequirements || []).map((p) => {
              const total = getPartTotal(p.examPartId);
              const num = percentToNum(p.requiredPercentage, total);
              return (
                <span
                  key={p.examPartId}
                  className={cx('partBadge', { customized: p.customized })}
                >
                  {getPartName(p.examPartId)}: {num}/{total} ({p.requiredPercentage}%)
                </span>
              );
            })}
          </div>
        </div>
      )}

      {message && (
        <p className={cx('message', { success: isSuccess, error: !isSuccess })}>
          {message}
        </p>
      )}
    </div>
  );
}

export default UserTargetTestPage;
