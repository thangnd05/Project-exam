'use client';
import {useMemo, useState} from 'react';
import Link from 'next/link';
import {useQuery} from '@tanstack/react-query';
import classNames from 'classnames/bind';
import {Container} from 'react-bootstrap';
import {IoAlertCircleOutline, IoDocumentTextOutline, IoSearchOutline} from 'react-icons/io5';

import {getStandardExamTypes} from '@/app/apis/examTypeApi';
import {buildExamTypeDetailPath} from '@/app/configs/Routes';
import {examTypeKeys} from '@/app/hooks/examTypeKeys';
import type {ExamTypeResponse} from '@/app/types/exam-type';
import type {QuickChallengeCardResponse} from '@/app/types/test';
import QuickTestConfirmModal from '../_components/HeroSection/QuickTestConfirmModal';
import {useQuickChallengeTests} from '../_components/HeroSection/hooks/useQuickChallengeTests';
import {useQuickTestLauncher} from '../_components/HeroSection/hooks/useQuickTestLauncher';
import {
  LEVELS,
  VENDORS,
  badgeUrl,
  parseCode,
  parseLevel,
  parseVendor,
  type Level,
  type Vendor,
} from '@/app/utils/certificationMeta';
import styles from './ExamCatalog.module.scss';

const cx = classNames.bind(styles);

// Số câu của đề full theo đề thi thật.
const FULL_QUESTIONS: Record<string, number> = {
  'SAA-C03': 65,
  'SAP-C02': 75,
  'DOP-C02': 75,
};

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

const getInitials = (name?: string) => {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

const vendorTag = ({vendor, exam}: CatalogExam) => {
  if (vendor !== 'other') return {label: VENDORS.find((v) => v.id === vendor)?.tag ?? '', tone: vendor};
  return /oracle/i.test(exam.name ?? '') ? {label: 'Oracle', tone: 'oracle'} : {label: 'Linux', tone: 'linux'};
};

const formatQuick = (test?: QuickChallengeCardResponse) => {
  if (!test) return 'Chưa có';
  const minutes = test.durationMinutes ? ` / ${test.durationMinutes}p` : '';
  return `${test.totalQuestions} câu${minutes}`;
};

const formatFull = ({exam, code}: CatalogExam) => {
  const questions = FULL_QUESTIONS[code];
  const minutes = exam.durationMinutes ? `${exam.durationMinutes}p` : 'theo đề';
  return questions ? `${questions} câu / ${minutes}` : minutes;
};

// Ưu tiên huy hiệu có sẵn trong dự án, lỗi thì thử ảnh từ API, cuối cùng là chữ viết tắt.
function ExamBadge({sources, name}: {sources: (string | undefined)[]; name: string}) {
  const candidates = sources.filter(Boolean) as string[];
  const [index, setIndex] = useState(0);
  const src = candidates[index];

  return (
    <span className={cx('badge')} aria-hidden="true">
      {src ? (
        <img src={src} alt="" onError={() => setIndex((i) => i + 1)} />
      ) : (
        <span className={cx('initials')}>{getInitials(name)}</span>
      )}
    </span>
  );
}

function ExamCatalog() {
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
          <h4>Không tải được danh sách kỳ thi</h4>
          <p>Thử tải lại trang.</p>
        </div>
      );
    }

    if (exams.length === 0) {
      return (
        <div className={cx('empty-state')}>
          <IoDocumentTextOutline className={cx('icon')} />
          <h4>Chưa có kỳ thi để hiển thị</h4>
          <p>Vui lòng quay lại sau.</p>
        </div>
      );
    }

    if (visible.length === 0) {
      return (
        <div className={cx('empty-state')}>
          <IoSearchOutline className={cx('icon')} />
          <h4>Không có chứng chỉ nào khớp bộ lọc</h4>
          <button type="button" className={cx('textBtn')} onClick={resetFilters}>
            Đặt lại bộ lọc
          </button>
        </div>
      );
    }

    return (
      <div className={cx('grid')}>
        {visible.map((item) => {
          const {exam, code, title} = item;
          const href = buildExamTypeDetailPath(exam.examTypeId);
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
                    Full: <span>{formatFull(item)}</span>
                  </div>
                </div>
              </div>

              <div className={cx('actions')}>
                <button
                  type="button"
                  className={cx('btnPrimary')}
                  onClick={() => requestStart(quick ?? null)}
                  disabled={!quick}
                  title={quick ? undefined : 'Kỳ thi này chưa có đề kiểm tra nhanh'}
                >
                  Thi nhanh
                </button>
                <Link href={href} className={cx('btnSecondary')}>
                  Full Mock
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
        <h1 className="visually-hidden">Kho đề thi</h1>

        <div className={cx('controls')}>
          <div className={cx('searchRow')}>
            <label className={cx('search')}>
              <IoSearchOutline className={cx('searchIcon')} aria-hidden="true" />
              <span className="visually-hidden">Tìm kỳ thi</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm theo mã kỳ thi (SAA-C03, AZ-104...) hoặc tên chứng chỉ..."
              />
            </label>
            <div className={cx('counter')}>
              <span>
                Hiển thị: <strong>{visible.length}</strong> chứng chỉ
              </span>
              <button type="button" className={cx('textBtn')} onClick={resetFilters}>
                Đặt lại bộ lọc
              </button>
            </div>
          </div>

          <div className={cx('filterRow')} role="group" aria-label="Lọc theo hãng">
            <span className={cx('filterLabel')}>Hãng:</span>
            <button
              type="button"
              className={cx('vendorTab', {active: vendor === 'all'})}
              aria-pressed={vendor === 'all'}
              onClick={() => setVendor('all')}
            >
              Tất cả ({exams.length})
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

          <div className={cx('filterRow')} role="group" aria-label="Lọc theo cấp độ">
            <span className={cx('filterLabel')}>Cấp độ:</span>
            {[{id: 'all' as const, label: 'Tất cả'}, ...LEVELS].map((l) => (
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
