'use client';

import { useState } from 'react';
import {useTranslations} from 'next-intl';
import {Form, Spinner} from 'react-bootstrap';
import classNames from 'classnames/bind';
import { Pencil, Plus, Trash2 } from 'lucide-react';

import ButtonPrime from '@/app/components/Button/ButtonPrime';
import ConfirmDeleteModal from '@/app/components/modal/ConfirmDeleteModal';
import useMilestoneScoring from '@/app/features/my-target/hooks/useMilestoneScoring';
import {
  AdminExamTypePicker,
  AdminFieldError,
  AdminPageHeader,
  AdminToolbar,
} from '@/app/[locale]/(admin)/_components/common';
import type {ExamPartResponse, MilestoneResponse, PartRequirementResponse} from '@/app/types';
import {useExamTypeGroups} from '@/app/[locale]/(admin)/_hooks/useExamTypeGroups';
import {useMilestones} from './_hooks/useMilestones';
import styles from './MilestonesManagement.module.scss';

const cx = classNames.bind(styles);

const extractPartOrder = (partName?: string | null) => {
  const normalizedName = String(partName || '').trim();
  const matchedNumber = normalizedName.match(/\d+/);
  return matchedNumber ? Number(matchedNumber[0]) : Number.MAX_SAFE_INTEGER;
};

const sortPartsByNameOrder = (parts: ExamPartResponse[]) => {
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
  const t = useTranslations('AdminUsers');
  const tCommon = useTranslations('Common');
  const [examTypeFilter, setExamTypeFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [deletingMilestone, setDeletingMilestone] = useState<MilestoneResponse | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editParts, setEditParts] = useState<Record<string, number>>({});

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

  // Mặc định chọn kỳ thi lá đầu tiên (đúng thứ tự bộ chọn) khi danh sách đã tải
  const {firstExamId} = useExamTypeGroups('standard');
  if (firstExamId && !examTypeFilter) {
    setExamTypeFilter(firstExamId);
  }

  // Đổi loại kỳ thi thì xoá lỗi cũ
  const [prevExamTypeFilter, setPrevExamTypeFilter] = useState(examTypeFilter);
  if (examTypeFilter !== prevExamTypeFilter) {
    setPrevExamTypeFilter(examTypeFilter);
    setErrorMessage('');
  }

  const displayedError = errorMessage || loadErrorText;

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
    // API luôn trả đủ các trường mà ConversionLike của hook bắt buộc
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
      setErrorMessage(t('milestones.errors.required'));
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
        description: newDescription || undefined,
        partRequirements,
      });

      setNewScore('');
      setNewDescription('');
    } catch {
      setErrorMessage(t('milestones.errors.create'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (milestone: MilestoneResponse) => {
    setEditingId(milestone.examTargetMilestoneId);
    const partsMap: Record<string, number> = {};
    (milestone.partRequirements || []).forEach((p) => {
      partsMap[p.examPartId as string] = p.requiredPercentage as number;
    });

    filteredParts.forEach((p) => {
      if (partsMap[p.examPartId] === undefined) {
        partsMap[p.examPartId] = 0;
      }
    });
    setEditParts(partsMap);
  };

  const handleSaveEdit = async (milestone: MilestoneResponse) => {
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
        milestoneScore: milestone.milestoneScore as number,
        description: milestone.description,
        partRequirements,
      });

      setEditingId(null);
      setEditParts({});
    } catch {
      setErrorMessage(t('milestones.errors.update'));
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
      setErrorMessage(t('milestones.errors.delete'));
    } finally {
      setSubmitting(false);
    }
  };

  const sortPartRequirements = (partRequirements?: PartRequirementResponse[]) => {
    return [...(partRequirements || [])].sort((partRequirementA, partRequirementB) => {
      const partNameA = getPartName(partRequirementA.examPartId as string);
      const partNameB = getPartName(partRequirementB.examPartId as string);
      const orderA = extractPartOrder(partNameA);
      const orderB = extractPartOrder(partNameB);
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return String(partNameA).localeCompare(String(partNameB), 'vi');
    });
  };

  const renderScoreEstimate = (partsConfig: Record<string, number | string>, milestoneScore: number) => {
    const est = estimateScore(partsConfig);
    if (!est) return null;
    const diff = est.totalScore - milestoneScore;
    return (
      <div className={cx('scoreEstimate', {
        over: diff > 0, under: diff < 0, match: diff === 0,
      })}>
        <span className={cx('scoreEstimateLabel')}>{t('milestones.estimateLabel')}</span>
        <span className={cx('scoreEstimateValue')}>{est.totalScore}</span>
        <span className={cx('scoreEstimateDiff')}>
          {t('milestones.estimateDiff', {diff: `${diff > 0 ? '+' : ''}${diff}`, score: milestoneScore})}
        </span>
        <span className={cx('scoreEstimateDetail')}>{formatEstimateDetail(est)}</span>
      </div>
    );
  };

  return (
    <div className={cx('milestonePage')}>
      <AdminPageHeader
        title={t('milestones.title')}
        description={t('milestones.description')}
      />

      <AdminToolbar
        searchValue={keyword}
        onSearchChange={setKeyword}
        searchPlaceholder={t('milestones.searchPlaceholder')}
        filters={
          <AdminExamTypePicker
            value={examTypeFilter}
            onChange={setExamTypeFilter}
            source="standard"
          />
        }
      />

      {examTypeFilter && (
        <div className={cx('createBox')}>
          <h5>{t('milestones.createHeading')}</h5>
          <div className={cx('createGrid')}>
            <Form.Control
              type="number"
              min={0}
              max={maxScore}
              placeholder={isScaled ? t('milestones.scorePlaceholderScaled') : t('milestones.scorePlaceholder')}
              value={newScore}
              onChange={(e) => setNewScore(e.target.value)}
            />
            <span style={{alignSelf: 'center', color: 'var(--gray-500)', fontSize: '0.85rem'}}>
              {t('milestones.perPart', {percent: newScore ? evenPctForScore(newScore) : 0})}
            </span>
            <Form.Control
              placeholder={t('milestones.descriptionPlaceholder')}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
            <ButtonPrime onClick={handleCreate} disabled={submitting}>
              <Plus size={16} />
              {t('milestones.add')}
            </ButtonPrime>
          </div>
          <AdminFieldError message={displayedError} />
        </div>
      )}

      {isLoading && (
        <div className="text-center py-4">
          <Spinner size="sm" className="me-2" />
          {tCommon('loading')}
        </div>
      )}

      {!isLoading && filteredMilestones.length === 0 && examTypeFilter && (
        <div className={cx('emptyState')}>
          {t('milestones.empty')}
        </div>
      )}

      {!isLoading &&
        filteredMilestones.map((m) => (
          <div key={m.examTargetMilestoneId} className={cx('milestoneCard')}>
            <div className={cx('milestoneHeader')}>
              <div>
                <h5>
                  {t('milestones.points', {score: m.milestoneScore as number})}
                  {m.description && (
                    <span style={{marginLeft: 8}}>- {m.description}</span>
                  )}
                </h5>
              </div>
              <div className={cx('milestoneActions')}>
                {editingId !== m.examTargetMilestoneId && (
                  <>
                    <ButtonPrime
                      size="icon"
                      variant="outline"
                      title={t('milestones.editPartsTitle')}
                      onClick={() => handleStartEdit(m)}
                    >
                      <Pencil size={14} />
                    </ButtonPrime>
                    <ButtonPrime
                      size="icon"
                      variant="dangerGhost"
                      title={t('shared.delete')}
                      onClick={() => setDeletingMilestone(m)}
                    >
                      <Trash2 size={14} />
                    </ButtonPrime>
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
                        <label>{t('milestones.partQuestionCount', {name: p.name ?? '', total})}</label>
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
                        <span>{t('milestones.questionUnit')}</span>
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
                {renderScoreEstimate(editParts, m.milestoneScore as number)}
                <div className={cx('editActions')}>
                  <ButtonPrime
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingId(null);
                      setEditParts({});
                    }}
                  >
                    {tCommon('cancelShort')}
                  </ButtonPrime>
                  <ButtonPrime
                    size="sm"
                    onClick={() => handleSaveEdit(m)}
                    disabled={submitting}
                  >
                    {tCommon('save')}
                  </ButtonPrime>
                </div>
              </>
            ) : (
              <>
              <div className={cx('partGrid')}>
                {sortPartRequirements(m.partRequirements).map((pr) => {
                  const total = getPartTotal(pr.examPartId as string);
                  const numCorrect = percentToNum(pr.requiredPercentage as number, total);
                  return (
                    <div key={pr.examPartId} className={cx('partItem')}>
                      <span className={cx('partName')}>
                        {getPartName(pr.examPartId as string)}
                      </span>
                      <span className={cx('partPercent')}>
                        {t('milestones.partProgress', {correct: numCorrect, total, percent: pr.requiredPercentage as number})}
                      </span>
                    </div>
                  );
                })}
                {(!m.partRequirements || m.partRequirements.length === 0) && (
                  <span style={{color: 'var(--gray-400)', fontSize: '0.85rem', padding: 16}}>
                    {t('milestones.noPartConfig')}
                  </span>
                )}
              </div>
              {(() => {
                const partsConfig: Record<string, number> = {};
                (m.partRequirements || []).forEach((pr) => {
                  partsConfig[pr.examPartId as string] = pr.requiredPercentage as number;
                });
                return renderScoreEstimate(partsConfig, m.milestoneScore as number);
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
        title={t('milestones.confirmDelete.title')}
        message={t('milestones.confirmDelete.message', {score: deletingMilestone?.milestoneScore ?? ''})}
      />
    </div>
  );
}

export default MilestonesManagement;
