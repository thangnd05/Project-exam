import React, {useCallback, useEffect, useState} from 'react';
import {Button, Form, Spinner} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {Check, Pencil, Plus, Trash2, X} from 'lucide-react';

import {getStandardExamTypes} from '../../api/examTypeApi';
import {getExamParts} from '../../api/examPartApi';
import {getSkills} from '../../api/skillApi';
import {getScoringConversions} from '../../api/scoringConversionApi';
import {
  createMilestone,
  deleteMilestone,
  getMilestones,
  updateMilestone,
} from '../../api/milestoneApi';
import ConfirmDeleteModal from '../../components/common/modal/ConfirmDeleteModal';
import {
  AdminFieldError,
  AdminPageHeader,
  AdminToolbar,
} from '../components/common';
import styles from './Milestones.module.scss';

const cx = classNames.bind(styles);

const extractPartOrder = (partName) => {
  const normalizedName = String(partName || '').trim();
  const matchedNumber = normalizedName.match(/\d+/);
  return matchedNumber ? Number(matchedNumber[0]) : Number.MAX_SAFE_INTEGER;
};

const sortPartsByNameOrder = (parts) => {
  return [...parts].sort((partA, partB) => {
    const orderA = extractPartOrder(partA.name);
    const orderB = extractPartOrder(partB.name);
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return String(partA.name || '').localeCompare(String(partB.name || ''), 'vi');
  });
};

function MilestonesManagement() {
  const [milestones, setMilestones] = useState([]);
  const [examTypes, setExamTypes] = useState([]);
  const [examParts, setExamParts] = useState([]);
  const [skills, setSkills] = useState([]);
  const [scoringConversions, setScoringConversions] = useState([]);
  const [examTypeFilter, setExamTypeFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [deletingMilestone, setDeletingMilestone] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editParts, setEditParts] = useState({});

  // Form state for creating new milestone
  const [newScore, setNewScore] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const loadExamTypes = useCallback(async () => {
    try {
      const data = await getStandardExamTypes();
      setExamTypes(data);
      if (data.length > 0 && !examTypeFilter) {
        setExamTypeFilter(data[0].examTypeId);
      }
    } catch {
      setErrorMessage('Không thể tải danh sách loại kỳ thi.');
    }
  }, []);

  const loadExamParts = useCallback(async () => {
    try {
      const data = await getExamParts();
      setExamParts(data);
    } catch {
      setErrorMessage('Không thể tải danh sách phần thi.');
    }
  }, []);

  useEffect(() => {
    loadExamTypes();
    loadExamParts();
    getSkills().then(setSkills).catch(() => {});
    getScoringConversions().then(setScoringConversions).catch(() => {});
  }, [loadExamTypes, loadExamParts]);

  const loadMilestones = useCallback(async () => {
    if (!examTypeFilter) return;
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await getMilestones(examTypeFilter);
      setMilestones(data);
    } catch {
      setErrorMessage('Không thể tải danh sách mốc điểm.');
    } finally {
      setLoading(false);
    }
  }, [examTypeFilter]);

  useEffect(() => {
    loadMilestones();
  }, [loadMilestones]);

  const filteredParts = sortPartsByNameOrder(
    examParts.filter((p) => p.examTypeId === examTypeFilter),
  );

  const filteredMilestones = milestones.filter((m) => {
    if (!keyword.trim()) return true;
    const k = keyword.trim().toLowerCase();
    return (
      String(m.milestoneScore).includes(k) ||
      (m.description || '').toLowerCase().includes(k)
    );
  });

  const handleCreate = async () => {
    if (!examTypeFilter || !newScore) {
      setErrorMessage('Vui lòng chọn loại kỳ thi và nhập mốc điểm.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    try {
      const partRequirements = filteredParts.map((p) => ({
        examPartId: p.examPartId,
        requiredPercentage: Math.round((Number(newScore) / 990) * 100),
      }));

      await createMilestone({
        examTypeId: examTypeFilter,
        milestoneScore: Number(newScore),
        description: newDescription || null,
        partRequirements,
      });

      setNewScore('');
      setNewDescription('');
      loadMilestones();
    } catch {
      setErrorMessage('Không thể tạo mốc điểm. Có thể mốc này đã tồn tại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (milestone) => {
    setEditingId(milestone.examTargetMilestoneId);
    const partsMap = {};
    (milestone.partRequirements || []).forEach((p) => {
      partsMap[p.examPartId] = p.requiredPercentage;
    });
    // Fill in missing parts with 0
    filteredParts.forEach((p) => {
      if (partsMap[p.examPartId] === undefined) {
        partsMap[p.examPartId] = 0;
      }
    });
    setEditParts(partsMap);
  };

  const handleSaveEdit = async (milestone) => {
    setSubmitting(true);
    setErrorMessage('');
    try {
      const partRequirements = Object.entries(editParts).map(
        ([examPartId, requiredPercentage]) => ({
          examPartId,
          requiredPercentage: Number(requiredPercentage),
        }),
      );

      await updateMilestone(milestone.examTargetMilestoneId, {
        examTypeId: examTypeFilter,
        milestoneScore: milestone.milestoneScore,
        description: milestone.description,
        partRequirements,
      });

      setEditingId(null);
      setEditParts({});
      loadMilestones();
    } catch {
      setErrorMessage('Không thể cập nhật cấu hình.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingMilestone) return;
    setSubmitting(true);
    setErrorMessage('');
    try {
      await deleteMilestone(deletingMilestone.examTargetMilestoneId);
      setDeletingMilestone(null);
      loadMilestones();
    } catch {
      setErrorMessage('Không thể xóa mốc điểm.');
    } finally {
      setSubmitting(false);
    }
  };

  const getPartName = (examPartId) => {
    return examParts.find((p) => p.examPartId === examPartId)?.name || examPartId;
  };

  const getPartTotal = (examPartId) => {
    return examParts.find((p) => p.examPartId === examPartId)?.defaultNumQuestions || 0;
  };

  const sortPartRequirements = (partRequirements) => {
    return [...(partRequirements || [])].sort((partRequirementA, partRequirementB) => {
      const partNameA = getPartName(partRequirementA.examPartId);
      const partNameB = getPartName(partRequirementB.examPartId);
      const orderA = extractPartOrder(partNameA);
      const orderB = extractPartOrder(partNameB);
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return String(partNameA).localeCompare(String(partNameB), 'vi');
    });
  };

  const percentToNum = (percent, total) => (total > 0 ? Math.round((percent * total) / 100) : 0);
  const numToPercent = (num, total) => (total > 0 ? Math.round((num / total) * 100) : 0);

  // Tính điểm ước tính từ % các part qua bảng scoring conversion
  const estimateScore = (partsConfig) => {
    // partsConfig: { examPartId: requiredPercentage }
    if (!examTypeFilter || !partsConfig || Object.keys(partsConfig).length === 0) return null;

    // Gom số câu đúng theo skill
    const correctBySkill = {};
    for (const [examPartId, pct] of Object.entries(partsConfig)) {
      const part = examParts.find((p) => p.examPartId === examPartId);
      if (!part) continue;
      const numCorrect = percentToNum(pct, part.defaultNumQuestions || 0);
      correctBySkill[part.skillId] = (correctBySkill[part.skillId] || 0) + numCorrect;
    }

    // Tra bảng scoring conversion cho mỗi skill
    const relevantConversions = scoringConversions.filter(
      (c) => c.examTypeId === examTypeFilter,
    );
    if (relevantConversions.length === 0) return null;

    let totalScore = 0;
    const skillDetails = [];
    for (const [skillId, numCorrect] of Object.entries(correctBySkill)) {
      const skillConversions = relevantConversions
        .filter((c) => c.skillId === skillId)
        .sort((a, b) => a.numCorrect - b.numCorrect);
      if (skillConversions.length === 0) continue;

      // Tìm convertedScore gần nhất (<=)
      let matched = skillConversions[0];
      for (const c of skillConversions) {
        if (c.numCorrect <= numCorrect) matched = c;
        else break;
      }

      const skillName = skills.find((s) => s.skillId === skillId)?.name || skillId;
      totalScore += matched.convertedScore;
      skillDetails.push({skillName, numCorrect, convertedScore: matched.convertedScore});
    }

    return {totalScore, skillDetails};
  };

  return (
    <div className={cx('milestonePage')}>
      <AdminPageHeader
        title="Cấu hình mốc điểm mục tiêu"
        description="Thiết lập các mốc điểm và % yêu cầu từng phần thi để đánh giá readiness của người dùng."
      />

      <AdminToolbar
        searchValue={keyword}
        onSearchChange={setKeyword}
        searchPlaceholder="Tìm theo mốc điểm hoặc mô tả..."
      >
        <Form.Select
          value={examTypeFilter}
          onChange={(e) => setExamTypeFilter(e.target.value)}
        >
          <option value="">Chọn loại kỳ thi</option>
          {examTypes.map((et) => (
            <option key={et.examTypeId} value={et.examTypeId}>
              {et.name}
            </option>
          ))}
        </Form.Select>
      </AdminToolbar>

      {examTypeFilter && (
        <div className={cx('createBox')}>
          <h5>Thêm mốc điểm mới</h5>
          <div className={cx('createGrid')}>
            <Form.Control
              type="number"
              placeholder="Mốc điểm (VD: 450)"
              value={newScore}
              onChange={(e) => setNewScore(e.target.value)}
            />
            <span style={{alignSelf: 'center', color: '#6b7280', fontSize: '0.85rem'}}>
              ≈ {newScore ? Math.round((Number(newScore) / 990) * 100) : 0}%
              mỗi part
            </span>
            <Form.Control
              placeholder="Mô tả (VD: Mức cơ bản)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
            <Button onClick={handleCreate} disabled={submitting}>
              <Plus size={16} />
              Thêm
            </Button>
          </div>
          <AdminFieldError message={errorMessage} />
        </div>
      )}

      {loading && (
        <div className="text-center py-4">
          <Spinner size="sm" className="me-2" />
          Đang tải...
        </div>
      )}

      {!loading && filteredMilestones.length === 0 && examTypeFilter && (
        <div className={cx('emptyState')}>
          Chưa có mốc điểm nào cho loại kỳ thi này.
        </div>
      )}

      {!loading &&
        filteredMilestones.map((m) => (
          <div key={m.examTargetMilestoneId} className={cx('milestoneCard')}>
            <div className={cx('milestoneHeader')}>
              <div>
                <h5>
                  {m.milestoneScore} điểm
                  {m.description && (
                    <span style={{marginLeft: 8}}>— {m.description}</span>
                  )}
                </h5>
              </div>
              <div className={cx('milestoneActions')}>
                {editingId !== m.examTargetMilestoneId && (
                  <>
                    <button
                      className={cx('iconButton')}
                      title="Chỉnh sửa % từng part"
                      onClick={() => handleStartEdit(m)}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className={cx('iconButton', 'danger')}
                      title="Xóa"
                      onClick={() => setDeletingMilestone(m)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {editingId === m.examTargetMilestoneId ? (
              <>
                <div className={cx('editPartGrid')}>
                  {filteredParts.map((p) => {
                    const total = getPartTotal(p.examPartId);
                    const pct = Number(editParts[p.examPartId] ?? 0);
                    const numCorrect = percentToNum(pct, total);
                    return (
                      <div key={p.examPartId} className={cx('editPartItem')}>
                        <label>{p.name} ({total} câu)</label>
                        <Form.Control
                          type="number"
                          min={0}
                          max={total}
                          value={numCorrect}
                          onChange={(e) => {
                            const newPct = numToPercent(Number(e.target.value), total);
                            setEditParts((prev) => ({...prev, [p.examPartId]: newPct}));
                          }}
                        />
                        <span>câu</span>
                        <Form.Control
                          type="number"
                          min={0}
                          max={100}
                          value={pct}
                          onChange={(e) => {
                            setEditParts((prev) => ({...prev, [p.examPartId]: Number(e.target.value)}));
                          }}
                        />
                        <span>%</span>
                      </div>
                    );
                  })}
                </div>
                {(() => {
                  const est = estimateScore(editParts);
                  if (!est) return null;
                  const diff = est.totalScore - m.milestoneScore;
                  return (
                    <div className={cx('scoreEstimate', {
                      over: diff > 0, under: diff < 0, match: diff === 0,
                    })}>
                      <span className={cx('scoreEstimateLabel')}>Điểm ước tính:</span>
                      <span className={cx('scoreEstimateValue')}>{est.totalScore}</span>
                      <span className={cx('scoreEstimateDiff')}>
                        ({diff > 0 ? '+' : ''}{diff} so với mốc {m.milestoneScore})
                      </span>
                      <span className={cx('scoreEstimateDetail')}>
                        {est.skillDetails.map((s) =>
                          `${s.skillName}: ${s.numCorrect} câu → ${s.convertedScore} điểm`
                        ).join(' | ')}
                      </span>
                    </div>
                  );
                })()}
                <div className={cx('editActions')}>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => {
                      setEditingId(null);
                      setEditParts({});
                    }}
                  >
                    <X size={14} /> Hủy
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSaveEdit(m)}
                    disabled={submitting}
                  >
                    <Check size={14} /> Lưu
                  </Button>
                </div>
              </>
            ) : (
              <>
              <div className={cx('partGrid')}>
                {sortPartRequirements(m.partRequirements).map((pr) => {
                  const total = getPartTotal(pr.examPartId);
                  const numCorrect = percentToNum(pr.requiredPercentage, total);
                  return (
                    <div key={pr.examPartId} className={cx('partItem')}>
                      <span className={cx('partName')}>
                        {getPartName(pr.examPartId)}
                      </span>
                      <span className={cx('partPercent')}>
                        {numCorrect}/{total} câu ({pr.requiredPercentage}%)
                      </span>
                    </div>
                  );
                })}
                {(!m.partRequirements || m.partRequirements.length === 0) && (
                  <span style={{color: '#9ca3af', fontSize: '0.85rem', padding: 16}}>
                    Chưa cấu hình % từng part
                  </span>
                )}
              </div>
              {(() => {
                const partsConfig = {};
                (m.partRequirements || []).forEach((pr) => {
                  partsConfig[pr.examPartId] = pr.requiredPercentage;
                });
                const est = estimateScore(partsConfig);
                if (!est) return null;
                const diff = est.totalScore - m.milestoneScore;
                return (
                  <div className={cx('scoreEstimate', {
                    over: diff > 0, under: diff < 0, match: diff === 0,
                  })}>
                    <span className={cx('scoreEstimateLabel')}>Điểm ước tính:</span>
                    <span className={cx('scoreEstimateValue')}>{est.totalScore}</span>
                    <span className={cx('scoreEstimateDiff')}>
                      ({diff > 0 ? '+' : ''}{diff} so với mốc {m.milestoneScore})
                    </span>
                    <span className={cx('scoreEstimateDetail')}>
                      {est.skillDetails.map((s) =>
                        `${s.skillName}: ${s.numCorrect} câu → ${s.convertedScore} điểm`
                      ).join(' | ')}
                    </span>
                  </div>
                );
              })()}
              </>
            )}
          </div>
        ))}

      <ConfirmDeleteModal
        show={Boolean(deletingMilestone)}
        onClose={() => {
          if (submitting) return;
          setDeletingMilestone(null);
        }}
        onConfirm={handleDelete}
        title="Xác nhận xóa mốc điểm"
        message={`Bạn có chắc muốn xóa mốc ${deletingMilestone?.milestoneScore} điểm không? Tất cả cấu hình part sẽ bị xóa theo.`}
      />
    </div>
  );
}

export default MilestonesManagement;
