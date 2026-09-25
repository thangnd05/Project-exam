'use client';
import { useMemo, useState } from 'react';
import { IoAlertCircleOutline, IoDocumentTextOutline, IoOpenOutline } from 'react-icons/io5';
import { useQuery } from '@tanstack/react-query';
import classNames from 'classnames/bind';
import {Container} from 'react-bootstrap';

import {getExamTypes} from '@/app/apis/examTypeApi';
import {getAllResources} from '@/app/apis/recoveryResourceApi';
import PageHeader from '@/app/components/PageHeader/PageHeader';
import RecoveryResourceLink from '@/app/components/RecoveryResourceLink/RecoveryResourceLink';
import {examTypeKeys} from '@/app/hooks/examTypeKeys';
import type {ExamTypeResponse} from '@/app/types/exam-type';
import type {RecoveryResourceResponse} from '@/app/types/resource';

import styles from './ResourceLibrary.module.scss';

const cx = classNames.bind(styles);

const UNASSIGNED_EXAM = '__unassigned__';

type ExamGroup = {
  id: string;
  name: string;
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

const examNameOf = (resource: RecoveryResourceResponse, id: string, names: Map<string, string>) =>
  resource.examTypeName?.trim() || names.get(id) || 'Chưa gắn kỳ thi';

const matchesKeyword = (
  resource: RecoveryResourceResponse,
  keyword: string,
  names: Map<string, string>,
) => {
  if (!keyword) return true;
  const haystack = [
    resource.title,
    resource.description,
    examNameOf(resource, examKeyOf(resource), names),
    resource.examPartName,
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
  names: Map<string, string>,
): ExamGroup[] => {
  const groups = new Map<string, ExamGroup>();

  resources.forEach((resource) => {
    const id = examKeyOf(resource);
    const current = groups.get(id) ?? {id, name: examNameOf(resource, id, names), resources: []};
    if (current.name === 'Chưa gắn kỳ thi') {
      current.name = examNameOf(resource, id, names);
    }
    current.resources.push(resource);
    groups.set(id, current);
  });

  return [...groups.values()]
    .map((group) => ({
      ...group,
      resources: [...group.resources].sort((a, b) =>
        (a.title ?? '').localeCompare(b.title ?? '', 'vi'),
      ),
    }))
    .sort((a, b) => {
      if (a.id === UNASSIGNED_EXAM) return 1;
      if (b.id === UNASSIGNED_EXAM) return -1;
      return a.name.localeCompare(b.name, 'vi');
    });
};

function ResourceLibrary() {
  const [selectedExamId, setSelectedExamId] = useState('');
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

  const examNames = useMemo(() => {
    const names = new Map<string, string>();
    examTypes.forEach((exam) => {
      if (exam.examTypeId && exam.name?.trim()) {
        names.set(exam.examTypeId, exam.name.trim());
      }
    });
    return names;
  }, [examTypes]);

  const normalizedKeyword = keyword.trim().toLowerCase();

  const groups = useMemo(
    () =>
      groupByExam(
        resources.filter((resource) => matchesKeyword(resource, normalizedKeyword, examNames)),
        examNames,
      ),
    [resources, normalizedKeyword, examNames],
  );

  const examCount = useMemo(
    () => groupByExam(resources, examNames).length,
    [resources, examNames],
  );

  const activeExamId = groups.some((group) => group.id === selectedExamId)
    ? selectedExamId
    : (groups[0]?.id ?? '');

  const visibleGroups = groups.filter((group) => group.id === activeExamId);
  const totalVisible = visibleGroups.reduce((sum, group) => sum + group.resources.length, 0);

  return (
    <div className={cx('wrapper')}>
      <Container>
        <PageHeader
          label="Tài liệu"
          title="Kho tài liệu"
          description="Tài liệu xếp theo từng kỳ thi."
          badgeLabel={isLoading ? undefined : `${resources.length} tài liệu · ${examCount} kỳ thi`}
        />

        <div className={cx('toolbar')}>
          <label className={cx('search')}>
            <input
              type="search"
              value={keyword}
              aria-label="Tìm tài liệu"
              placeholder="Tìm theo tên, phần thi, tag..."
              onChange={(event) => setKeyword(event.target.value)}
            />
          </label>

          {!isLoading && !isError && groups.length > 0 && (
            <div className={cx('pills')} role="tablist" aria-label="Lọc theo kỳ thi">
              {groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  role="tab"
                  aria-selected={activeExamId === group.id}
                  className={cx('pill', {active: activeExamId === group.id})}
                  onClick={() => setSelectedExamId(group.id)}
                >
                  {group.name}
                  <span className={cx('pillCount')}>{group.resources.length}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className={cx('grid')} aria-hidden="true">
            <div className={cx('skeleton')} />
            <div className={cx('skeleton')} />
            <div className={cx('skeleton')} />
          </div>
        ) : isError ? (
          <div className={cx('empty')}>
            <IoAlertCircleOutline className={cx('icon')} />
            <h2>Không tải được tài liệu</h2>
            <p>Thử tải lại trang.</p>
          </div>
        ) : resources.length === 0 ? (
          <div className={cx('empty')}>
            <IoDocumentTextOutline className={cx('icon')} />
            <h2>Chưa có tài liệu</h2>
            <p>Tài liệu sẽ xuất hiện ở đây khi được gắn vào kỳ thi.</p>
          </div>
        ) : totalVisible === 0 ? (
          <div className={cx('empty')}>
            <IoDocumentTextOutline className={cx('icon')} />
            <h2>Không có tài liệu khớp</h2>
            <p>Thử từ khóa khác hoặc chọn kỳ thi khác.</p>
          </div>
        ) : (
          <div className={cx('sections')}>
            {visibleGroups.map((group) => (
              <section key={group.id} className={cx('section')} aria-labelledby={`exam-${group.id}`}>
                <header className={cx('sectionHead')}>
                  <h2 id={`exam-${group.id}`}>{group.name}</h2>
                  <span>{group.resources.length} tài liệu</span>
                </header>
                <div className={cx('grid')}>
                  {group.resources.map((resource) => (
                    <RecoveryResourceLink
                      key={resource.resourceId}
                      resource={resource}
                      className={cx('card')}
                    >
                      <span className={cx('cardIcon')} aria-hidden="true">
                        <IoDocumentTextOutline />
                      </span>
                      <h3>{resource.title}</h3>
                      {resource.description ? <p>{resource.description}</p> : null}
                      <div className={cx('tags')}>
                        {resource.examPartName ? (
                          <span className={cx('tag', 'part')}>{resource.examPartName}</span>
                        ) : null}
                        {(resource.tags ?? []).slice(0, 3).map((tag) => (
                          <span key={tag.tagId} className={cx('tag')}>
                            {tag.name}
                          </span>
                        ))}
                      </div>
                      <span className={cx('open')}>
                        Xem tài liệu
                        <IoOpenOutline />
                      </span>
                    </RecoveryResourceLink>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}

export default ResourceLibrary;
