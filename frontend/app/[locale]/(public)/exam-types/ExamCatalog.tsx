'use client';
import {useMemo, useState} from 'react';
import Link from '@/app/i18n/navigation';
import {useQuery} from '@tanstack/react-query';
import {useTranslations} from 'next-intl';
import classNames from 'classnames/bind';
import {Container} from 'react-bootstrap';
import {FiArrowRight} from 'react-icons/fi';
import {IoAlertCircleOutline, IoDocumentTextOutline, IoSearchOutline} from 'react-icons/io5';

import {getStandardExamTypes} from '@/app/apis/examTypeApi';
import {buildExamTypeDetailPath} from '@/app/configs/Routes';
import {examTypeKeys} from '@/app/configs/queryKeys';
import type {ExamTypeResponse} from '@/app/types/exam-type';
import type {QuickChallengeCardResponse} from '@/app/types/test';
import QuickTestConfirmModal from '@/app/[locale]/(public)/_components/HeroSection/QuickTestConfirmModal';
import {useQuickChallengeTests} from '@/app/[locale]/(public)/_components/HeroSection/hooks/useQuickChallengeTests';
import {useQuickTestLauncher} from '@/app/[locale]/(public)/_components/HeroSection/hooks/useQuickTestLauncher';
import {
  LEVELS,
  VENDORS,
  badgeUrl,
  parseCode,
  parseLevel,
  parseVendor,
  useFormatFullSpec,
  type Level,
  type Vendor,
} from '@/app/[locale]/(public)/_lib/certificationMeta';
import ExamBadge from '@/app/[locale]/(public)/_components/ExamBadge/ExamBadge';
import styles from './ExamCatalog.module.scss';

const cx = classNames.bind(styles);

type CatalogExam = {
  exam: ExamTypeResponse;
  code: string;
  title: string;
  vendor: Vendor;
  level: Level | null;
  badge?: string;
  keywords: string;
};

const normalizeExamTypes = (payload: unknown): ExamTypeResponse[] => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object' && Array.isArray((payload as {data?: unknown}).data)) {
    return (payload as {data: ExamTypeResponse[]}).data;
  }
  if (payload && typeof payload === 'object' && Array.isArray((payload as {content?: unknown}).content)) {
    return (payload as {content: ExamTypeResponse[]}).content;
  }
  return [];
};

const isLeafExam = (exam: ExamTypeResponse) => Number(exam.childCount ?? 0) === 0;

const VENDOR_ORDER = VENDORS.map((v) => v.id);

// Chỉ giữ các kỳ thi nhận diện được hãng chứng chỉ; mã kỳ thi đã hiện riêng nên bỏ khỏi tên.
const toCatalog = (payload: unknown): CatalogExam[] =>
  normalizeExamTypes(payload)
    .filter(isLeafExam)
    .flatMap((exam) => {
      const code = parseCode(exam.name);
      const vendor = parseVendor(exam, code);
      if (!vendor) return [];
      const title = (exam.name ?? '').replace(/\s*\([^)]*\)\s*$/, '') || code;
      return [{
        exam,
        code,
        title,
        vendor,
        level: parseLevel(exam.name, code),
        badge: badgeUrl(exam.name, code),
        keywords: `${exam.name ?? ''} ${code} ${exam.parentName ?? ''}`.toLowerCase(),
      }];
    })
    .sort((a, b) =>
      VENDOR_ORDER.indexOf(a.vendor) - VENDOR_ORDER.indexOf(b.vendor)
      || a.title.localeCompare(b.title, 'en'),
    );

const vendorTag = ({vendor, exam}: CatalogExam) => {
  if (vendor !== 'other') return {label: VENDORS.find((v) => v.id === vendor)?.tag ?? '', tone: vendor};
  return /oracle/i.test(exam.name ?? '') ? {label: 'Oracle', tone: 'oracle'} : {label: 'Linux', tone: 'linux'};
};

function ExamCatalog() {
  const t = useTranslations('ExamTypes');
  const formatFullSpec = useFormatFullSpec();

  const formatQuick = (test?: QuickChallengeCardResponse) => {
    if (!test) return t('spec.none');
    const minutes = test.durationMinutes ? ` / ${t('spec.minutes', {count: test.durationMinutes})}` : '';
    return `${t('spec.questions', {count: test.totalQuestions})}${minutes}`;
  };

  const {data: exams = [], isLoading, isError} = useQuery({
    queryKey: examTypeKeys.standard,
    queryFn: getStandardExamTypes,
    select: toCatalog,
  });
  const {quickTests} = useQuickChallengeTests();
  const {pendingTest, requestStart, closeConfirm, confirmStart, startSyllabusPlan, isGuest} =
    useQuickTestLauncher();

  const [query, setQuery] = useState('');
  const [vendor, setVendor] = useState<Vendor | 'all'>('all');
  const [level, setLevel] = useState<Level | 'all'>('all');

  const quickByExam = useMemo(() => {
    const map = new Map<string, QuickChallengeCardResponse>();
    quickTests.forEach((test) => {
      if (test.examTypeId && !map.has(test.examTypeId)) map.set(test.examTypeId, test);
    });
    return map;
  }, [quickTests]);

  const vendorTabs = useMemo(
    () =>
      VENDORS.map((v) => ({...v, count: exams.filter((e) => e.vendor === v.id).length}))
        .filter((v) => v.count > 0),
    [exams],
  );

  const keyword = query.trim().toLowerCase();
  const visible = exams.filter(
    (e) =>
      (vendor === 'all' || e.vendor === vendor)
      && (level === 'all' || e.level === level)
      && (!keyword || e.keywords.includes(keyword)),
  );

  const resetFilters = () => {
    setQuery('');
    setVendor('all');
    setLevel('all');
  };

  const renderGrid = () => {
    if (isLoading) {
      return (
        <div className={cx('grid')} aria-hidden="true">
          <div className={cx('skeleton')} />
          <div className={cx('skeleton')} />
          <div className={cx('skeleton')} />
        </div>
      );
    }

    if (isError) {
      return (
        <div className={cx('empty-state')}>
          <IoAlertCircleOutline className={cx('icon')} />
          <h4>{t('catalog.loadError.title')}</h4>
          <p>{t('catalog.loadError.hint')}</p>
        </div>
      );
    }

    if (exams.length === 0) {
      return (
        <div className={cx('empty-state')}>
          <IoDocumentTextOutline className={cx('icon')} />
          <h4>{t('catalog.empty.title')}</h4>
          <p>{t('catalog.empty.hint')}</p>
        </div>
      );
    }

    if (visible.length === 0) {
      return (
        <div className={cx('empty-state')}>
          <IoSearchOutline className={cx('icon')} />
          <h4>{t('catalog.noMatch')}</h4>
          <button type="button" className={cx('textBtn')} onClick={resetFilters}>
            {t('catalog.resetFilters')}
          </button>
        </div>
      );
    }

    return (
      <div className={cx('grid')}>
        {visible.map((item) => {
          const {exam, code, title} = item;
          const href = buildExamTypeDetailPath(exam);
          const quick = quickByExam.get(exam.examTypeId);
          const tag = vendorTag(item);
          const levelLabel = LEVELS.find((l) => l.id === item.level)?.label;

          return (
            <article key={exam.examTypeId} className={cx('card')}>
              <div>
                <div className={cx('cardTop')}>
                  <span className={cx('vendorTag', `tag-${tag.tone}`)}>{tag.label}</span>
                  {levelLabel && <span className={cx('levelText')}>{levelLabel}</span>}
                </div>

                <div className={cx('cardBody')}>
                  <ExamBadge sources={[item.badge, exam.imageUrl]} name={title} />
                  <div className={cx('cardText')}>
                    {code && <span className={cx('code')}>{code}</span>}
                    <h2 className={cx('name')}>
                      <Link href={href}>{title}</Link>
                    </h2>
                    {exam.description && <p className={cx('desc')}>{exam.description}</p>}
                  </div>
                </div>

                <div className={cx('stats')}>
                  <div>
                    Quick: <span>{formatQuick(quick)}</span>
                  </div>
                  <div>
                    Full: <span>{formatFullSpec(exam.durationMinutes, code)}</span>
                  </div>
                </div>
              </div>

              <div className={cx('actions')}>
                <button
                  type="button"
                  className={cx('btnPrimary')}
                  onClick={() => requestStart(quick ?? null)}
                  disabled={!quick}
                  title={quick ? undefined : t('noQuick')}
                >
                  {t('quickStart')}
                </button>
                <Link href={href} className={cx('btnSecondary')} title={t('catalog.viewFullMock', {name: code || title})}>
                  {t('fullMock')}
                  <FiArrowRight aria-hidden="true" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    );
  };

  return (
    <div className={cx('wrapper')}>
      <Container>
        <h1 className="visually-hidden">{t('catalog.title')}</h1>

        <div className={cx('controls')}>
          <div className={cx('searchRow')}>
            <label className={cx('search')}>
              <IoSearchOutline className={cx('searchIcon')} aria-hidden="true" />
              <span className="visually-hidden">{t('catalog.searchLabel')}</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('catalog.searchPlaceholder')}
              />
            </label>
            <div className={cx('counter')}>
              <span>
                {t.rich('catalog.showing', {
                  count: visible.length,
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </span>
              <button type="button" className={cx('textBtn')} onClick={resetFilters}>
                {t('catalog.resetFilters')}
              </button>
            </div>
          </div>

          <div className={cx('filterRow')} role="group" aria-label={t('catalog.vendorFilter')}>
            <span className={cx('filterLabel')}>{t('catalog.vendorLabel')}</span>
            <button
              type="button"
              className={cx('vendorTab', {active: vendor === 'all'})}
              aria-pressed={vendor === 'all'}
              onClick={() => setVendor('all')}
            >
              {t('catalog.allCount', {count: exams.length})}
            </button>
            {vendorTabs.map((v) => (
              <button
                key={v.id}
                type="button"
                className={cx('vendorTab', {active: vendor === v.id})}
                aria-pressed={vendor === v.id}
                onClick={() => setVendor(v.id)}
              >
                <span className={cx('dot', `dot-${v.id}`)} aria-hidden="true" />
                {v.label} ({v.count})
              </button>
            ))}
          </div>

          <div className={cx('filterRow')} role="group" aria-label={t('catalog.levelFilter')}>
            <span className={cx('filterLabel')}>{t('catalog.levelLabel')}</span>
            {[{id: 'all' as const, label: t('catalog.all')}, ...LEVELS].map((l) => (
              <button
                key={l.id}
                type="button"
                className={cx('levelTab', {active: level === l.id})}
                aria-pressed={level === l.id}
                onClick={() => setLevel(l.id)}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {renderGrid()}
      </Container>

      <QuickTestConfirmModal
        show={Boolean(pendingTest)}
        test={pendingTest}
        onClose={closeConfirm}
        onConfirm={confirmStart}
        onStartSyllabusPlan={startSyllabusPlan}
        isGuest={isGuest}
      />
    </div>
  );
}

export default ExamCatalog;
