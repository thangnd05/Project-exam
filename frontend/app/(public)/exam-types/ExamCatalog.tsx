'use client';
import {useState} from 'react';
import Link from 'next/link';
import {useQueries, useQuery} from '@tanstack/react-query';
import classNames from 'classnames/bind';
import {Container} from 'react-bootstrap';
import {
  IoAlertCircleOutline,
  IoChevronForward,
  IoDocumentTextOutline,
  IoHelpCircleOutline,
  IoLayersOutline,
  IoTimeOutline,
} from 'react-icons/io5';

import {getExamPartsByExamType} from '@/app/apis/examPartApi';
import {getStandardExamTypes} from '@/app/apis/examTypeApi';
import PageHeader from '@/app/components/PageHeader/PageHeader';
import {buildExamTypeDetailPath} from '@/app/configs/Routes';
import {baseMetaKeys} from '@/app/hooks/useBaseMetaData';
import {examTypeKeys} from '@/app/hooks/examTypeKeys';
import type {ExamTypeResponse} from '@/app/types/exam-type';
import {getScoreScale} from '@/app/utils/scoreScale';
import styles from './ExamCatalog.module.scss';

const cx = classNames.bind(styles);

type ExamMeta = {
  code: string;
  questions: number;
};

const EXAM_META: Record<string, ExamMeta> = {
  'SAA-C03': {
    code: 'SAA-C03',
    questions: 65,
  },
  'SAP-C02': {
    code: 'SAP-C02',
    questions: 75,
  },
  'DOP-C02': {
    code: 'DOP-C02',
    questions: 75,
  },
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

const parseCode = (name?: string) => {
  const match = name?.match(/\(([A-Z]{2,5}-C\d{2})\)/i);
  return match?.[1]?.toUpperCase() ?? '';
};

const LEVELS = ['Foundational', 'Associate', 'Professional', 'Specialty'];

const parseLevel = (name?: string) =>
  LEVELS.find((level) => new RegExp(`\\b${level}\\b`, 'i').test(name ?? '')) ?? '';

const isAwsExam = (exam: ExamTypeResponse) =>
  /aws/i.test(`${exam.name ?? ''} ${exam.parentName ?? ''}`);

const isLeafExam = (exam: ExamTypeResponse) => Number(exam.childCount ?? 0) === 0;

const formatDuration = (minutes?: number | null) => {
  if (!minutes) return 'Theo đề';
  return `${minutes} phút`;
};

const getInitials = (name?: string) => {
  const words = (name ?? '').replace(/\(.*?\)/g, '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

function ExamLogo({url, name}: {url?: string; name?: string}) {
  const [failed, setFailed] = useState(false);

  return (
    <span className={cx('card-icon')} aria-hidden="true">
      {url && !failed ? (
        <img src={url} alt="" onError={() => setFailed(true)} />
      ) : (
        <span className={cx('card-initials')}>{getInitials(name)}</span>
      )}
    </span>
  );
}

function ExamCatalog() {
  const {data: exams = [], isLoading, isError} = useQuery({
    queryKey: examTypeKeys.standard,
    queryFn: getStandardExamTypes,
    select: (payload) =>
      normalizeExamTypes(payload)
        .filter((exam) => isAwsExam(exam) && isLeafExam(exam))
        .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'en')),
  });

  const partQueries = useQueries({
    queries: exams.map((exam) => ({
      queryKey: baseMetaKeys.examParts(exam.examTypeId),
      queryFn: () => getExamPartsByExamType(exam.examTypeId),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const domainCountByExam: Record<string, number> = {};
  exams.forEach((exam, index) => {
    const parts = partQueries[index]?.data ?? [];
    domainCountByExam[exam.examTypeId] = parts.filter((part) => part.name?.trim()).length;
  });

  const scale = getScoreScale(exams[0]?.scoringMethod || 'AWS_SCALE');

  return (
    <div className={cx('wrapper')}>
      <Container>
        <PageHeader
          title="Kỳ thi đang mở"
          label="AWS Certification"
          description="Các chứng chỉ AWS hiện có trên WinDe. Luyện đề sát format, chấm theo thang điểm AWS, xem đáp án và chẩn đoán phần còn yếu."
          badgeLabel={isLoading ? undefined : `${exams.length} kỳ thi · Thang điểm ${scale.min}–${scale.max}`}
        />

        {isLoading ? (
          <div className={cx('grid')} aria-hidden="true">
            <div className={cx('skeleton')} />
            <div className={cx('skeleton')} />
            <div className={cx('skeleton')} />
          </div>
        ) : isError ? (
          <div className={cx('empty-state')}>
            <IoAlertCircleOutline className={cx('icon')} />
            <h4>Không tải được danh sách kỳ thi</h4>
            <p className="text-muted">Thử tải lại trang.</p>
          </div>
        ) : exams.length === 0 ? (
          <div className={cx('empty-state')}>
            <IoDocumentTextOutline className={cx('icon')} />
            <h4>Chưa có kỳ thi AWS để hiển thị</h4>
            <p className="text-muted">Vui lòng quay lại sau.</p>
          </div>
        ) : (
          <div className={cx('grid')}>
            {exams.map((exam) => {
              const code = parseCode(exam.name);
              const meta = code ? EXAM_META[code] : undefined;
              const duration = formatDuration(exam.durationMinutes ?? null);
              const href = buildExamTypeDetailPath(exam.examTypeId);
              const domainCount = domainCountByExam[exam.examTypeId] ?? 0;
              const level = parseLevel(exam.name);

              return (
                <Link
                  key={exam.examTypeId}
                  href={href}
                  className={cx('exam-card')}
                  aria-label={`Mở kho đề ${exam.name}`}
                >
                  <div className={cx('card-head')}>
                    <ExamLogo url={exam.imageUrl} name={exam.name} />
                    <div className={cx('card-tags')}>
                      {code ? <span className={cx('code')}>{code}</span> : null}
                      {level ? <span className={cx('level')}>{level}</span> : null}
                    </div>
                  </div>

                  <h2 className={cx('name')}>{exam.name}</h2>

                  <ul className={cx('meta')}>
                    <li className={cx('meta-item')}>
                      <IoTimeOutline />
                      <span>{duration}</span>
                    </li>
                    {meta?.questions ? (
                      <li className={cx('meta-item')}>
                        <IoHelpCircleOutline />
                        <span>{meta.questions} câu</span>
                      </li>
                    ) : null}
                    {domainCount ? (
                      <li className={cx('meta-item')}>
                        <IoLayersOutline />
                        <span>{domainCount} lĩnh vực</span>
                      </li>
                    ) : null}
                  </ul>

                  <span className={cx('cta')}>
                    Luyện đề
                    <IoChevronForward />
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
}

export default ExamCatalog;
