import React, {useEffect, useState} from 'react';
import {Button, Form, Spinner} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {Check, Pencil, Plus, Trash2, X} from 'lucide-react';

import ConfirmDeleteModal from '../../components/common/modal/ConfirmDeleteModal';
import useMilestoneScoring from '../../hooks/useMilestoneScoring';
import {
  AdminFieldError,
  AdminPageHeader,
  AdminToolbar,
} from '../components/common';
import {useMilestones} from './hooks/useMilestones';
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
  const [examTypeFilter, setExamTypeFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [deletingMilestone, setDeletingMilestone] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editParts, setEditParts] = useState({});

  // Form state for creating new milestone
  const [newScore, setNewScore] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const {
    milestones,
    examTypes,
    examParts,
    skills,
    scoringConversions,
    isLoading,
    loadErrorText,
    createMilestone,
    updateMilestone,
    deleteMilestone,
  } = useMilestones(examTypeFilter);

  // Chọn sẵn loại kỳ thi đầu tiên khi danh sách vừa tải xong.
  useEffect(() => {
    if (examTypes.length > 0 && !examTypeFilter) {
      setExamTypeFilter(examTypes[0].examTypeId);
    }
  }, [examTypes, examTypeFilter]);

  // Xóa thông báo lỗi cũ mỗi khi đổi loại kỳ thi.
  useEffect(() => {
    setErrorMessage('');
  }, [examTypeFilter]);

  // Đưa lỗi tải dữ liệu ra khối thông báo chung.
  useEffect(() => {
    if (loadErrorText) {
      setErrorMessage(loadErrorText);
    }
  }, [loadErrorText]);

  const filteredParts = sortPartsByNameOrder(
    examParts.filter((p) => p.examTypeId === examTypeFilter),
  );

  const {
    isScaled,
    maxScore,
    getPartName,
    getPartTotal,
    percentToNum,
    numToPercent,
    evenPctForScore,
    estimateScore,
    formatEstimateDetail,
  } = useMilestoneScoring({
    examTypes,
    examParts,
    skills,
    scoringConversions,
    selectedExamTypeId: examTypeFilter,
  });

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
        requiredPercentage: evenPctForScore(newScore),
      }));

      await createMilestone({
        examTypeId: examTypeFilter,
        milestoneScore: Number(newScore),
        description: newDescription || null,
        partRequirements,
      });

      setNewScore('');
      setNewDescription('');
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
    } catch {
      setErrorMessage('Không thể xóa mốc điểm.');
    } finally {
      setSubmitting(false);
    }
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

  // Khối "Điểm ước tính" dùng chung cho cả nhánh xem và chỉnh sửa.
  const renderScoreEstimate = (partsConfig, milestoneScore) => {
    const est = estimateScore(partsConfig);
    if (!est) return null;
    const diff = est.totalScore - milestoneScore;
    return (
      <div className={cx('scoreEstimate', {
        over: diff > 0, under: diff < 0, match: diff === 0,
      })}>
        <span className={cx('scoreEstimateLabel')}>Điểm ước tính:</span>
        <span className={cx('scoreEstimateValue')}>{est.totalScore}</span>
        <span className={cx('scoreEstimateDiff')}>
          ({diff > 0 ? '+' : ''}{diff} so với mốc {milestoneScore})
        </span>
        <span className={cx('scoreEstimateDetail')}>{formatEstimateDetail(est)}</span>
      </div>
    );
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
              min={0}
              max={maxScore}
              placeholder={isScaled ? 'Mốc điểm (VD: 700)' : 'Mốc điểm (VD: 450)'}
              value={newScore}
              onChange={(e) => setNewScore(e.target.value)}
            />
            <span style={{alignSelf: 'center', color: '#6b7280', fontSize: '0.85rem'}}>
              ≈ {newScore ? evenPctForScore(newScore) : 0}%
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

      {isLoading && (
        <div className="text-center py-4">
          <Spinner size="sm" className="me-2" />
          Đang tải...
        </div>
      )}

      {!isLoading && filteredMilestones.length === 0 && examTypeFilter && (
        <div className={cx('emptyState')}>
          Chưa có mốc điểm nào cho loại kỳ thi này.
        </div>
      )}

      {!isLoading &&
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
                {renderScoreEstimate(editParts, m.milestoneScore)}
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
                return renderScoreEstimate(partsConfig, m.milestoneScore);
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
