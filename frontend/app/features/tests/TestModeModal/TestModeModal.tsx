'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import classNames from 'classnames/bind';
import { ChevronDown } from 'lucide-react';
import { toast } from 'react-toastify';

import BaseModal from '@/app/components/modal/BaseModal';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import RecoveryResourceLink from '@/app/features/resources/RecoveryResourceLink/RecoveryResourceLink';
import { getTestPartsSummary } from '@/app/apis/testApi';
import { getResourcesByParts } from '@/app/apis/recoveryResourceApi';
import type { TestPartSummaryResponse, TestResponse } from '@/app/types';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';
import styles from '@/app/features/tests/TestModeModal/TestModeModal.module.scss';

const cx = classNames.bind(styles);

export const testModeKeys = {
  parts: (testId?: string) => ['test-parts-summary', testId],
  partResources: (testId?: string) => ['test-part-resources', testId],
};

type PartSummary = TestPartSummaryResponse & { examPartId: string };

export type TestModeSelection = {
  mode: 'full' | 'practice';
  examPartIds?: string[];
};

type TestModeModalProps = {
  show?: boolean;
  test?: TestResponse | null;
  onClose?: () => void;
  onStart?: (selection: TestModeSelection) => void;
};

const normalizeParts = <T,>(data: T[] | null | undefined): T[] => (Array.isArray(data) ? data : []);

function TestModeModal({ show, test, onClose, onStart }: TestModeModalProps) {
  const t = useTranslations('Tests');
  const tCommon = useTranslations('Common');
  const [tab, setTab] = useState<'exam' | 'practice'>('exam');
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const partsQuery = useQuery({
    queryKey: testModeKeys.parts(test?.testId),
    queryFn: () => getTestPartsSummary(test?.testId as string),
    enabled: !!show && !!test?.testId,
    select: normalizeParts,
  });

  const parts = (partsQuery.data ?? EMPTY_LIST) as PartSummary[];
  const loading = partsQuery.isLoading;

  const partResourcesQuery = useQuery({
    queryKey: testModeKeys.partResources(test?.testId),
    queryFn: () => getResourcesByParts(parts.map((p) => p.examPartId)),
    enabled: !!show && tab === 'practice' && parts.length > 0,
    select: normalizeParts,
  });
  const partResources = partResourcesQuery.data ?? [];

  // Mở modal (hoặc đổi sang đề khác) thì về tab thi thử và bỏ chọn phần thi; điều chỉnh ngay lúc render.
  const openedFor = show ? (test?.testId ?? null) : null;
  const [resetFor, setResetFor] = useState<string | null>(null);
  if (openedFor !== resetFor) {
    setResetFor(openedFor);
    if (openedFor) {
      setTab('exam');
      setSelected(new Set());
    }
  }

  useEffect(() => {
    if (partsQuery.isError) {
      toast.error(t('mode.loadPartsError'));
    }
  }, [partsQuery.isError, t]);

  const totalQuestions = useMemo(
    () => parts.reduce((sum, p) => sum + (p.questionCount || 0), 0),
    [parts],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, PartSummary[]>();
    parts.forEach((p) => {
      const key = p.skillName || t('mode.otherSkill');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });
    return [...map.entries()];
  }, [parts, t]);

  const selectedCount = useMemo(
    () =>
      parts
        .filter((p) => selected.has(p.examPartId))
        .reduce((sum, p) => sum + (p.questionCount || 0), 0),
    [parts, selected],
  );

  const allSelected = parts.length > 0 && selected.size === parts.length;

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(parts.map((p) => p.examPartId)));
  };

  const togglePart = (examPartId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(examPartId)) next.delete(examPartId);
      else next.add(examPartId);
      return next;
    });
  };

  const durationLabel =
    test?.durationMinutes != null ? t('minutes', { count: test.durationMinutes }) : t('unlimited');

  const handleStartFull = () => {
    onStart?.({ mode: 'full' });
  };

  const handleStartPractice = () => {
    if (selected.size === 0) return;

    const examPartIds = parts
      .filter((p) => selected.has(p.examPartId))
      .map((p) => p.examPartId);
    onStart?.({ mode: 'practice', examPartIds });
  };

  // Nút hành động nằm ở footer chung của BaseModal để luôn hiện, không bị nội dung dài đẩy mất.
  const footer =
    tab === 'exam' ? (
      <>
        <ButtonPrime variant="outline" size="lg" className={cx('footerBtn')} onClick={onClose}>
          {tCommon('cancelShort')}
        </ButtonPrime>
        <ButtonPrime variant="brand" size="lg" className={cx('footerBtn')} onClick={handleStartFull}>
          {t('mode.startExam')}
        </ButtonPrime>
      </>
    ) : (
      <>
        <span className={cx('summary')}>
          {t.rich('mode.selected', {
            count: selectedCount,
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
        </span>
        <ButtonPrime
          variant="brand"
          size="lg"
          onClick={handleStartPractice}
          disabled={selected.size === 0}
        >
          {t('mode.start')}
        </ButtonPrime>
      </>
    );

  return (
    <BaseModal
      show={show}
      onClose={onClose}
      title={t('mode.title')}
      maxWidth={640}
      variant="plain"
      footer={footer}
    >
      <div className={cx('tabs')} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'exam'}
          className={cx('tab', { active: tab === 'exam' })}
          onClick={() => setTab('exam')}
        >
          {t('mode.examTab')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'practice'}
          className={cx('tab', { active: tab === 'practice' })}
          onClick={() => setTab('practice')}
        >
          {t('mode.practiceTab')}
        </button>
      </div>

      <div className={cx('panel')}>
        {tab === 'exam' ? (
          <div className={cx('exam-card')}>
            <h4 className={cx('exam-title')}>{test?.title}</h4>
            <p className={cx('exam-desc')}>{t('mode.examDesc')}</p>

            <div className={cx('pills')}>
              <span className={cx('pill')}>
                {durationLabel}
              </span>
              {totalQuestions > 0 && (
                <span className={cx('pill')}>
                  {t('questions', { count: totalQuestions })}
                </span>
              )}
            </div>

            <ul className={cx('features')}>
              <li>
                <span>{t('mode.features.timed')}</span>
              </li>
              <li>
                <span>{t('mode.features.scoring')}</span>
              </li>
              <li>
                <span>{t('mode.features.leaderboard')}</span>
              </li>
            </ul>
          </div>
        ) : (
          <div className={cx('practice')}>
            <p className={cx('practice-hint')}>
              {t.rich('mode.practiceHint', { strong: (chunks) => <strong>{chunks}</strong> })}
            </p>

            {loading ? (
              <div className={cx('loading')}>{t('mode.loadingParts')}</div>
            ) : parts.length === 0 ? (
              <div className={cx('loading')}>{t('mode.noParts')}</div>
            ) : (
              <div className={cx('part-scroll')}>
                <button
                  type="button"
                  className={cx('part-row', 'select-all', { checked: allSelected })}
                  onClick={toggleAll}
                >
                  <span className={cx('checkbox', { checked: allSelected })} />
                  <span className={cx('part-name')}>
                    {t('mode.selectAll', { count: parts.length })}
                  </span>
                  <span className={cx('part-count')}>{t('questions', { count: totalQuestions })}</span>
                </button>

                {grouped.map(([section, list]) => (
                  <div key={section} className={cx('section')}>
                    {grouped.length > 1 && <div className={cx('section-title')}>{section}</div>}
                    <div className={cx('part-grid')}>
                      {list.map((p) => {
                        const checked = selected.has(p.examPartId);
                        return (
                          <button
                            key={p.examPartId}
                            type="button"
                            className={cx('part-row', { checked })}
                            onClick={() => togglePart(p.examPartId)}
                          >
                            <span className={cx('checkbox', { checked })} />
                            <span className={cx('part-name')}>{p.partName}</span>
                            <span className={cx('part-count')}>
                              {t('questions', { count: p.questionCount || 0 })}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Tài liệu có thể rất nhiều: thu gọn mặc định, mở ra thì hiện dạng chip. */}
                {partResources.length > 0 && (
                  <details className={cx('guide')}>
                    <summary className={cx('guide-summary')}>
                      <span>{t('mode.guideTitle')}</span>
                      <span className={cx('guide-count')}>{partResources.length}</span>
                      <ChevronDown size="1em" className={cx('guide-chevron')} aria-hidden="true" />
                    </summary>
                    <ul className={cx('guide-list')}>
                      {partResources.map((r) => (
                        <li key={r.resourceId}>
                          <RecoveryResourceLink resource={r} className={cx('guide-link')}>
                            {r.title}
                          </RecoveryResourceLink>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </BaseModal>
  );
}

export default TestModeModal;
