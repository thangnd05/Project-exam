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
    // Tải luôn khi mở popup: tab luyện theo phần được đo chiều cao ngay cả khi đang ẩn.
    enabled: !!show && parts.length > 0,
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
        <ButtonPrime variant="outline" size="lg" onClick={onClose}>
          {tCommon('cancelShort')}
        </ButtonPrime>
        <ButtonPrime variant="brand" size="lg" onClick={handleStartFull}>
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
      footer={footer}
    >
      {/* Segmented control: tab đang chọn nổi nền trắng trên rãnh nhạt thay vì nền đậm. */}
      <div className={cx('tabs')} role="tablist">
        <ButtonPrime
          variant="ghost"
          role="tab"
          className={cx('tab', { active: tab === 'exam' })}
          aria-selected={tab === 'exam'}
          onClick={() => setTab('exam')}
        >
          {t('mode.examTab')}
        </ButtonPrime>
        <ButtonPrime
          variant="ghost"
          role="tab"
          className={cx('tab', { active: tab === 'practice' })}
          aria-selected={tab === 'practice'}
          onClick={() => setTab('practice')}
        >
          {t('mode.practiceTab')}
        </ButtonPrime>
      </div>

      {/* Hai tab luôn render và chồng lên nhau; tab ẩn chỉ invisible. Chiều cao popup do tab thi thử
          quyết định, tab luyện phủ đúng khung đó và tự cuộn bên trong, nên chuyển tab hay mở tài liệu
          đều không làm popup nhảy kích thước. */}
      <div className={cx('panel')}>
        <div
          role="tabpanel"
          className={cx('pane', 'exam', { inactive: tab !== 'exam' })}
          inert={tab !== 'exam'}
        >
          <h4 className={cx('exam-title')}>{test?.title}</h4>
          <p className={cx('exam-desc')}>{t('mode.examDesc')}</p>

          <dl className={cx('stats')}>
            <div className={cx('stat')}>
              <dt>{t('mode.stats.duration')}</dt>
              <dd>{durationLabel}</dd>
            </div>
            <div className={cx('stat')}>
              <dt>{t('mode.stats.questions')}</dt>
              <dd>{totalQuestions > 0 ? totalQuestions : '—'}</dd>
            </div>
            <div className={cx('stat')}>
              <dt>{t('mode.stats.sections')}</dt>
              <dd>{parts.length > 0 ? parts.length : '—'}</dd>
            </div>
          </dl>

          <ul className={cx('features')}>
            <li>{t('mode.features.timed')}</li>
            <li>{t('mode.features.scoring')}</li>
            <li>{t('mode.features.leaderboard')}</li>
          </ul>
        </div>

        <div
          role="tabpanel"
          className={cx('pane', 'practice', { inactive: tab !== 'practice' })}
          inert={tab !== 'practice'}
        >
          <div className={cx('practice-head')}>
            <p className={cx('practice-hint')}>
              {t.rich('mode.practiceHint', { strong: (chunks) => <strong>{chunks}</strong> })}
            </p>
            {parts.length > 0 && (
              <ButtonPrime variant="link" size="sm" className={cx('select-all')} onClick={toggleAll}>
                {allSelected ? t('mode.clearAll') : t('mode.selectAll')}
              </ButtonPrime>
            )}
          </div>

          {loading ? (
            <div className={cx('loading')}>{t('mode.loadingParts')}</div>
          ) : parts.length === 0 ? (
            <div className={cx('loading')}>{t('mode.noParts')}</div>
          ) : (
            <div className={cx('part-scroll')}>
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
                          aria-pressed={checked}
                          className={cx('part-row', { checked })}
                          onClick={() => togglePart(p.examPartId)}
                        >
                          <span className={cx('checkbox', { checked })} />
                          <span className={cx('part-text')}>
                            <span className={cx('part-name')}>{p.partName}</span>
                            <span className={cx('part-count')}>
                              {t('questions', { count: p.questionCount || 0 })}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Tài liệu có thể rất nhiều: thu gọn mặc định, mở ra thì hiện dạng chip. */}
              {partResources.length > 0 && (
                <details
                  className={cx('guide')}
                  onToggle={(e) => {
                    // Mở ra thì cuộn danh sách tới phần tài liệu, tránh nội dung mới nằm khuất dưới đáy.
                    if (e.currentTarget.open) {
                      e.currentTarget.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                    }
                  }}
                >
                  <summary className={cx('guide-summary')}>
                    <span>{t('mode.resourcesTitle')}</span>
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
      </div>
    </BaseModal>
  );
}

export default TestModeModal;
