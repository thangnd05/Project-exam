'use client';
import { useMemo, useState } from 'react';
import { CircleAlert, FileText, Search, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import classNames from 'classnames/bind';
import {Container} from 'react-bootstrap';
import {useTranslations} from 'next-intl';

import {getExamTypes} from '@/app/apis/examTypeApi';
import {getAllResources} from '@/app/apis/recoveryResourceApi';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import EmptyState from '@/app/components/EmptyState/EmptyState';
import RecoveryResourceLink from '@/app/features/resources/RecoveryResourceLink/RecoveryResourceLink';
import {examTypeKeys} from '@/app/configs/queryKeys';
import type {ExamTypeResponse} from '@/app/types/exam-type';
import type {RecoveryResourceResponse} from '@/app/types/resource';
import {VENDORS, badgeUrl, parseCode, parseVendor, type Vendor} from '@/app/[locale]/(public)/_lib/certificationMeta';

import styles from './ResourceLibrary.module.scss';

const cx = classNames.bind(styles);

const UNASSIGNED_EXAM = '__unassigned__';
const ALL_PARTS = '__all__';

type ExamGroup = {
  id: string;
  name: string;
  code: string;
  vendor: Vendor | null;
  badge?: string;
  resources: RecoveryResourceResponse[];
};

const asList = (payload: unknown): RecoveryResourceResponse[] =>
  Array.isArray(payload) ? payload : [];

const asExamList = (payload: unknown): ExamTypeResponse[] =>
  Array.isArray(payload) ? payload : [];

const examKeyOf = (resource: RecoveryResourceResponse) => {
  const direct = resource.examTypeId?.trim();
  if (direct) return direct;
  const fromTag = (resource.tags ?? []).find((tag) => tag.examTypeId?.trim())?.examTypeId?.trim();
  return fromTag || UNASSIGNED_EXAM;
};

const examNameOf = (
  resource: RecoveryResourceResponse,
  id: string,
  exams: Map<string, ExamTypeResponse>,
  unassignedLabel: string,
) => resource.examTypeName?.trim() || exams.get(id)?.name?.trim() || unassignedLabel;

const matchesKeyword = (
  resource: RecoveryResourceResponse,
  keyword: string,
  exams: Map<string, ExamTypeResponse>,
  unassignedLabel: string,
) => {
  if (!keyword) return true;
  const haystack = [
    resource.title,
    resource.description,
    examNameOf(resource, examKeyOf(resource), exams, unassignedLabel),
    ...(resource.examPartNames ?? []),
    resource.originalFileName,
    ...(resource.tags ?? []).map((tag) => tag.name),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(keyword);
};

const groupByExam = (
  resources: RecoveryResourceResponse[],
  exams: Map<string, ExamTypeResponse>,
  unassignedLabel: string,
): ExamGroup[] => {
  const groups = new Map<string, ExamGroup>();

  resources.forEach((resource) => {
    const id = examKeyOf(resource);
    let group = groups.get(id);
    if (!group) {
      const name = examNameOf(resource, id, exams, unassignedLabel);
      const code = parseCode(name);
      const exam = exams.get(id) ?? {examTypeId: id, name};
      group = {
        id,
        name,
        code,
        vendor: id === UNASSIGNED_EXAM ? null : parseVendor(exam, code),
        badge: badgeUrl(name, code),
        resources: [],
      };
      groups.set(id, group);
    }
    group.resources.push(resource);
  });

  // Giữ thứ tự tài liệu backend trả về (theo thứ tự phần thi và tag); nhóm chưa gắn kỳ thi xếp cuối.
  return [...groups.values()].sort((a, b) => {
    if (a.id === UNASSIGNED_EXAM) return 1;
    if (b.id === UNASSIGNED_EXAM) return -1;
    return a.name.localeCompare(b.name, 'vi');
  });
};

// Phần thi theo thứ tự xuất hiện đầu tiên (backend đã sắp theo thứ tự phần thi).
const partsOf = (resources: RecoveryResourceResponse[]) => {
  const seen = new Set<string>();
  resources.forEach((resource) => (resource.examPartNames ?? []).forEach((part) => seen.add(part)));
  return [...seen];
};

const fileTypeOf = (resource: RecoveryResourceResponse) => {
  const ext = resource.originalFileName?.split('.').pop();
  return ext && ext !== resource.originalFileName ? ext.toUpperCase() : '';
};

const vendorTag = (group: ExamGroup, otherLabel: string) => {
  if (!group.vendor) return {label: otherLabel, tone: 'other'};
  if (group.vendor !== 'other') {
    return {label: VENDORS.find((v) => v.id === group.vendor)?.tag ?? '', tone: group.vendor};
  }
  return /oracle/i.test(group.name) ? {label: 'Oracle', tone: 'oracle'} : {label: 'Linux', tone: 'linux'};
};

function ResourceLibrary() {
  const t = useTranslations('Resources');
  const tCommon = useTranslations('Common');
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedPart, setSelectedPart] = useState(ALL_PARTS);
  const [keyword, setKeyword] = useState('');

  const {data: resources = [], isLoading: resourcesLoading, isError, refetch} = useQuery({
    queryKey: ['recovery-resources', 'public'],
    queryFn: getAllResources,
    select: asList,
  });

  const {
    data: examTypes = [],
    isFetched: examsFetched,
    isError: examsError,
  } = useQuery({
    queryKey: examTypeKeys.all,
    queryFn: getExamTypes,
    select: asExamList,
  });

  const needsExamNames = resources.some(
    (resource) => !resource.examTypeName?.trim() && examKeyOf(resource) !== UNASSIGNED_EXAM,
  );
  const isLoading = resourcesLoading || (needsExamNames && !examsFetched && !examsError);

  const examsById = useMemo(() => {
    const map = new Map<string, ExamTypeResponse>();
    examTypes.forEach((exam) => {
      if (exam.examTypeId) map.set(exam.examTypeId, exam);
    });
    return map;
  }, [examTypes]);

  const normalizedKeyword = keyword.trim().toLowerCase();
  const unassignedLabel = t('library.unassignedExam');

  const groups = useMemo(
    () =>
      groupByExam(
        resources.filter((resource) =>
          matchesKeyword(resource, normalizedKeyword, examsById, unassignedLabel),
        ),
        examsById,
        unassignedLabel,
      ),
    [resources, normalizedKeyword, examsById, unassignedLabel],
  );

  const activeGroup = groups.find((group) => group.id === selectedExamId) ?? groups[0];
  const parts = activeGroup ? partsOf(activeGroup.resources) : [];
  const activePart = parts.includes(selectedPart) ? selectedPart : ALL_PARTS;
  const visible = (activeGroup?.resources ?? []).filter(
    (resource) => activePart === ALL_PARTS || (resource.examPartNames ?? []).includes(activePart),
  );

  const selectExam = (id: string) => {
    setSelectedExamId(id);
    setSelectedPart(ALL_PARTS);
  };

  const resetFilters = () => {
    setKeyword('');
    setSelectedExamId('');
    setSelectedPart(ALL_PARTS);
  };

  const renderContent = () => {
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
        <EmptyState
          tone="danger"
          icon={CircleAlert}
          title={t('library.loadError.title')}
          description={t('library.loadError.message')}
          action={
            <ButtonPrime variant="outline" onClick={() => refetch()}>
              {tCommon('error.retry')}
            </ButtonPrime>
          }
        />
      );
    }

    if (resources.length === 0) {
      return (
        <EmptyState icon={FileText} title={t('library.empty.title')} description={t('library.empty.message')} />
      );
    }

    if (!activeGroup || visible.length === 0) {
      return (
        <EmptyState
          icon={Search}
          title={t('library.noMatch.title')}
          action={
            <ButtonPrime variant="outline" onClick={resetFilters}>
              {t('library.resetFilters')}
            </ButtonPrime>
          }
        />
      );
    }

    const tag = vendorTag(activeGroup, t('library.otherVendor'));

    return (
      <section aria-labelledby="resource-exam-title">
        <header className={cx('sectionHead')}>
          {activeGroup.badge && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={activeGroup.badge} alt="" className={cx('sectionBadge')} />
          )}
          <div className={cx('sectionText')}>
            {activeGroup.code && <span className={cx('code')}>{activeGroup.code}</span>}
            <h2 id="resource-exam-title">{activeGroup.name.replace(/\s*\([^)]*\)\s*$/, '')}</h2>
          </div>
        </header>

        <div className={cx('grid')}>
          {visible.map((resource) => {
            const partName = resource.examPartNames?.[0];
            const fileType = fileTypeOf(resource);
            // Tag trùng tên tài liệu thì bỏ, tránh lặp chữ.
            const extraTags = (resource.tags ?? [])
              .filter((item) => item.name && item.name !== resource.title)
              .slice(0, 3);

            return (
              <RecoveryResourceLink key={resource.resourceId} resource={resource} className={cx('card')}>
                <div>
                  <div className={cx('cardTop')}>
                    <span className={cx('vendorTag', `tag-${tag.tone}`)}>{tag.label}</span>
                    {partName && <span className={cx('partText')}>{partName}</span>}
                  </div>

                  <div className={cx('cardBody')}>
                    <span className={cx('docIcon')} aria-hidden="true">
                      <FileText size="1em" />
                    </span>
                    <div className={cx('cardText')}>
                      {fileType && <span className={cx('fileType')}>{fileType}</span>}
                      <h3 className={cx('title')}>{resource.title}</h3>
                      {resource.description && <p className={cx('desc')}>{resource.description}</p>}
                    </div>
                  </div>

                  {extraTags.length > 0 && (
                    <div className={cx('tags')}>
                      {extraTags.map((item) => (
                        <span key={item.tagId} className={cx('tag')}>{item.name}</span>
                      ))}
                    </div>
                  )}
                </div>

                <span className={cx('readBtn')}>
                  {t('library.readResource')}
                  <ArrowRight size="1em" aria-hidden="true" />
                </span>
              </RecoveryResourceLink>
            );
          })}
        </div>
      </section>
    );
  };

  return (
    <div className={cx('wrapper')}>
      <Container>
        <h1 className="visually-hidden">{t('library.pageTitle')}</h1>

        <div className={cx('controls')}>
          <div className={cx('searchRow')}>
            <label className={cx('search')}>
              <Search size="1em" className={cx('searchIcon')} aria-hidden="true" />
              <span className="visually-hidden">{t('library.searchLabel')}</span>
              <input
                type="search"
                value={keyword}
                placeholder={t('library.searchPlaceholder')}
                onChange={(event) => setKeyword(event.target.value)}
              />
            </label>
            <div className={cx('counter')}>
              <span>
                {t.rich('library.showing', {
                  count: isLoading ? 0 : visible.length,
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </span>
              <ButtonPrime variant="link" size="sm" onClick={resetFilters}>
                {t('library.resetFilters')}
              </ButtonPrime>
            </div>
          </div>

          {!isLoading && !isError && groups.length > 0 && (
            <>
              <div className={cx('filterRow')} role="group" aria-label={t('library.examFilterLabel')}>
                <span className={cx('filterLabel')}>{t('library.examLabel')}</span>
                {groups.map((group) => (
                  <ButtonPrime
                    key={group.id}
                    variant={activeGroup?.id === group.id ? 'ink' : 'outline'}
                    size="sm"
                    className={cx('tab')}
                    title={group.name}
                    aria-pressed={activeGroup?.id === group.id}
                    onClick={() => selectExam(group.id)}
                  >
                    <span className={cx('dot', `dot-${group.vendor ?? 'other'}`)} aria-hidden="true" />
                    {group.code || group.name} ({group.resources.length})
                  </ButtonPrime>
                ))}
              </div>

              {parts.length > 0 && (
                <div className={cx('filterRow')} role="group" aria-label={t('library.partFilterLabel')}>
                  <span className={cx('filterLabel')}>{t('library.partLabel')}</span>
                  {[ALL_PARTS, ...parts].map((part) => (
                    <ButtonPrime
                      key={part}
                      variant={activePart === part ? 'soft' : 'ghost'}
                      size="sm"
                      className={cx('tab')}
                      aria-pressed={activePart === part}
                      onClick={() => setSelectedPart(part)}
                    >
                      {part === ALL_PARTS ? t('library.allParts') : part}
                    </ButtonPrime>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {renderContent()}
      </Container>
    </div>
  );
}

export default ResourceLibrary;
