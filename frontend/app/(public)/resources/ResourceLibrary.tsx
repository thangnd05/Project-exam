'use client';
import { useMemo, useState } from 'react';
import { IoAlertCircleOutline, IoDocumentTextOutline, IoSearchOutline } from 'react-icons/io5';
import { FiArrowRight } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import classNames from 'classnames/bind';
import {Container} from 'react-bootstrap';

import {getExamTypes} from '@/app/apis/examTypeApi';
import {getAllResources} from '@/app/apis/recoveryResourceApi';
import RecoveryResourceLink from '@/app/components/RecoveryResourceLink/RecoveryResourceLink';
import {examTypeKeys} from '@/app/hooks/examTypeKeys';
import type {ExamTypeResponse} from '@/app/types/exam-type';
import type {RecoveryResourceResponse} from '@/app/types/resource';
import {VENDORS, badgeUrl, parseCode, parseVendor, type Vendor} from '@/app/utils/certificationMeta';

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

const examNameOf = (resource: RecoveryResourceResponse, id: string, exams: Map<string, ExamTypeResponse>) =>
  resource.examTypeName?.trim() || exams.get(id)?.name?.trim() || 'Chưa gắn kỳ thi';

const matchesKeyword = (
  resource: RecoveryResourceResponse,
  keyword: string,
  exams: Map<string, ExamTypeResponse>,
) => {
  if (!keyword) return true;
  const haystack = [
    resource.title,
    resource.description,
    examNameOf(resource, examKeyOf(resource), exams),
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
): ExamGroup[] => {
  const groups = new Map<string, ExamGroup>();

  resources.forEach((resource) => {
    const id = examKeyOf(resource);
    let group = groups.get(id);
    if (!group) {
      const name = examNameOf(resource, id, exams);
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

const vendorTag = (group: ExamGroup) => {
  if (!group.vendor) return {label: 'Khác', tone: 'other'};
  if (group.vendor !== 'other') {
    return {label: VENDORS.find((v) => v.id === group.vendor)?.tag ?? '', tone: group.vendor};
  }
  return /oracle/i.test(group.name) ? {label: 'Oracle', tone: 'oracle'} : {label: 'Linux', tone: 'linux'};
};

function ResourceLibrary() {
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedPart, setSelectedPart] = useState(ALL_PARTS);
  const [keyword, setKeyword] = useState('');

  const {data: resources = [], isLoading: resourcesLoading, isError} = useQuery({
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

  const groups = useMemo(
    () =>
      groupByExam(
        resources.filter((resource) => matchesKeyword(resource, normalizedKeyword, examsById)),
        examsById,
      ),
    [resources, normalizedKeyword, examsById],
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
        <div className={cx('empty')}>
          <IoAlertCircleOutline className={cx('icon')} />
          <h2>Không tải được tài liệu</h2>
          <p>Thử tải lại trang.</p>
        </div>
      );
    }

    if (resources.length === 0) {
      return (
        <div className={cx('empty')}>
          <IoDocumentTextOutline className={cx('icon')} />
          <h2>Chưa có tài liệu</h2>
          <p>Tài liệu sẽ xuất hiện ở đây khi được gắn vào kỳ thi.</p>
        </div>
      );
    }

    if (!activeGroup || visible.length === 0) {
      return (
        <div className={cx('empty')}>
          <IoSearchOutline className={cx('icon')} />
          <h2>Không có tài liệu khớp</h2>
          <button type="button" className={cx('textBtn')} onClick={resetFilters}>
            Đặt lại bộ lọc
          </button>
        </div>
      );
    }

    const tag = vendorTag(activeGroup);

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
              .filter((t) => t.name && t.name !== resource.title)
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
                      <IoDocumentTextOutline />
                    </span>
                    <div className={cx('cardText')}>
                      {fileType && <span className={cx('fileType')}>{fileType}</span>}
                      <h3 className={cx('title')}>{resource.title}</h3>
                      {resource.description && <p className={cx('desc')}>{resource.description}</p>}
                    </div>
                  </div>

                  {extraTags.length > 0 && (
                    <div className={cx('tags')}>
                      {extraTags.map((t) => (
                        <span key={t.tagId} className={cx('tag')}>{t.name}</span>
                      ))}
                    </div>
                  )}
                </div>

                <span className={cx('readBtn')}>
                  Đọc tài liệu
                  <FiArrowRight aria-hidden="true" />
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
        <h1 className="visually-hidden">Kho tài liệu</h1>

        <div className={cx('controls')}>
          <div className={cx('searchRow')}>
            <label className={cx('search')}>
              <IoSearchOutline className={cx('searchIcon')} aria-hidden="true" />
              <span className="visually-hidden">Tìm tài liệu</span>
              <input
                type="search"
                value={keyword}
                placeholder="Tìm theo tên tài liệu, phần thi, dịch vụ (CodePipeline, VPC...)"
                onChange={(event) => setKeyword(event.target.value)}
              />
            </label>
            <div className={cx('counter')}>
              <span>
                Hiển thị: <strong>{isLoading ? 0 : visible.length}</strong> tài liệu
              </span>
              <button type="button" className={cx('textBtn')} onClick={resetFilters}>
                Đặt lại bộ lọc
              </button>
            </div>
          </div>

          {!isLoading && !isError && groups.length > 0 && (
            <>
              <div className={cx('filterRow')} role="group" aria-label="Lọc theo kỳ thi">
                <span className={cx('filterLabel')}>Kỳ thi:</span>
                {groups.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    title={group.name}
                    aria-pressed={activeGroup?.id === group.id}
                    className={cx('examTab', {active: activeGroup?.id === group.id})}
                    onClick={() => selectExam(group.id)}
                  >
                    <span className={cx('dot', `dot-${group.vendor ?? 'other'}`)} aria-hidden="true" />
                    {group.code || group.name} ({group.resources.length})
                  </button>
                ))}
              </div>

              {parts.length > 0 && (
                <div className={cx('filterRow')} role="group" aria-label="Lọc theo phần thi">
                  <span className={cx('filterLabel')}>Phần thi:</span>
                  {[ALL_PARTS, ...parts].map((part) => (
                    <button
                      key={part}
                      type="button"
                      aria-pressed={activePart === part}
                      className={cx('partTab', {active: activePart === part})}
                      onClick={() => setSelectedPart(part)}
                    >
                      {part === ALL_PARTS ? 'Tất cả' : part}
                    </button>
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
