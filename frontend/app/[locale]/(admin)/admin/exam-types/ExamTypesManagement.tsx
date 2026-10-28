'use client';

import { useRouter } from '@/app/i18n/navigation';
import { useCallback, useMemo, useState } from 'react';
import {Badge, Spinner} from 'react-bootstrap';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import {useTranslations} from 'next-intl';
import {ChevronDown, ChevronRight, Edit, FolderTree, Library, Paintbrush, Plus, Trash2} from 'lucide-react';
import classNames from 'classnames/bind';

import routes from '@/app/configs/Routes';

import ConfirmDeleteModal from '@/app/components/modal/ConfirmDeleteModal';
import ExamTypeFormModal, {type ExamTypeFormState} from './_components/ExamTypeFormModal';
import {AdminFieldError, AdminPageHeader, AdminToolbar} from '@/app/[locale]/(admin)/_components/common';
import {useAdminExamTypes} from '@/app/[locale]/(admin)/admin/exam-types/_hooks/useAdminExamTypes';
import type {ExamTypeRequest, ExamTypeResponse} from '@/app/types';
import {getApiErrorMessage} from '@/app/utils/apiError';

import styles from '@/app/[locale]/(admin)/_components/common/adminTree.module.scss';

const cx = classNames.bind(styles);

const emptyForm: ExamTypeFormState = {
  name: '',
  slug: '',
  description: '',
  image_url: '',
  duration_minutes: '',
  scoring_method: 'DEFAULT',
  score_min: '0',
  score_max: '100',
  flexible: false,
  parent_id: '',
};

type ExamTypeItem = {
  exam_type_id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  duration_minutes: number | '';
  scoring_method: string;
  score_min: number;
  score_max: number;
  flexible: boolean;
  parent_id: string;
  parent_name: string;
  child_count: number;
};

type ExamTypeNode = ExamTypeItem & {children?: ExamTypeNode[]};

const mapExamTypeFromApi = (item: ExamTypeResponse): ExamTypeItem => ({
  exam_type_id: String(item.examTypeId),
  name: item.name || '',
  slug: item.slug || '',
  description: item.description || '',
  image_url: item.imageUrl || '',
  duration_minutes: item.durationMinutes ?? '',
  scoring_method: item.scoringMethod || 'DEFAULT',
  score_min: item.scoreMin ?? 0,
  score_max: item.scoreMax ?? 100,
  flexible: Boolean(item.flexible),
  parent_id: item.parentId ? String(item.parentId) : '',
  parent_name: item.parentName || '',
  child_count: typeof item.childCount === 'number' ? item.childCount : 0,
});

const buildExamTypePayload = (
  formState: ExamTypeFormState,
  {hasChildren}: {hasChildren?: boolean} = {},
): ExamTypeRequest => {
  const durationValue = String(formState.duration_minutes).trim();
  const durationMinutes = durationValue ? Number(durationValue) : undefined;

  return {
    name: formState.name.trim(),
    slug: formState.slug.trim(),
    description: formState.description.trim(),
    imageUrl: formState.image_url.trim(),
    durationMinutes,
    scoringMethod: formState.scoring_method,
    scoreMin: Number(formState.score_min),
    scoreMax: Number(formState.score_max),
    flexible: Boolean(formState.flexible),

    parentId: hasChildren ? '' : (formState.parent_id || ''),
  };
};

type ExamTypeTreeNodeProps = {
  node: ExamTypeNode;
  level: number;
  expandedIds: Set<string>;
  toggleExpand: (id: string) => void;
  onEdit: (node: ExamTypeNode) => void;
  onEditLayout: (node: ExamTypeNode) => void;
  onDelete: (node: ExamTypeNode) => void;
  onAddChild: (node: ExamTypeNode) => void;
  keyword: string;
};

function ExamTypeTreeNode({node, level, expandedIds, toggleExpand, onEdit, onEditLayout, onDelete, onAddChild, keyword}: ExamTypeTreeNodeProps) {
  const t = useTranslations('AdminContent.examTypes');
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedIds.has(node.exam_type_id);
  const kw = keyword.trim().toLowerCase();
  const matchesSearch =
    !kw ||
    node.name.toLowerCase().includes(kw) ||
    (node.description || '').toLowerCase().includes(kw) ||
    node.scoring_method.toLowerCase().includes(kw);
  const childrenMatchSearch =
    hasChildren &&
    node.children!.some(
      (c) => c.name.toLowerCase().includes(kw) || (c.description || '').toLowerCase().includes(kw),
    );

  if (kw && !matchesSearch && !childrenMatchSearch) return null;

  const nodeContent = (
    <>
      <div className={cx('treeNode')}>
        <div className={cx('treeNodeLeft')}>
          {hasChildren ? (
            <ButtonPrime size="icon" variant="ghost" className={cx('expandBtn')} onClick={() => toggleExpand(node.exam_type_id)}>
              {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </ButtonPrime>
          ) : (
            <span className={cx('expandPlaceholder')} />
          )}
          <span className={cx('nodeIcon')}>
            {level === 0 ? <FolderTree size={16} /> : <Library size={15} />}
          </span>
          <span className={cx('collectionName', {root: level === 0})}>{node.name}</span>
          {node.slug && <code className={cx('description')}>/{node.slug}</code>}
          {hasChildren &&<span className={cx('childCount')}>{t('childCount', {count: node.children!.length})}</span>}
          {node.flexible && <Badge bg="info">{t('flexible')}</Badge>}
          <Badge bg="primary">{node.scoring_method} · {node.score_min}–{node.score_max}</Badge>
          {node.duration_minutes !== '' && node.duration_minutes != null && (
            <span className={cx('description')}>{t('minutes', {count: Number(node.duration_minutes)})}</span>
          )}
          {node.description && <span className={cx('description')}>- {node.description}</span>}
        </div>
        <div className={cx('treeNodeActions')}>
          {level === 0 && (
            <ButtonPrime size="icon" variant="ghost" onClick={() => onAddChild(node)} title={t('addChild')}>
              <Plus size={16} />
            </ButtonPrime>
          )}
          <ButtonPrime size="icon" variant="ghost" onClick={() => onEditLayout(node)} title={t('editLayout')}>
            <Paintbrush size={16} />
          </ButtonPrime>
          <ButtonPrime size="icon" variant="ghost" onClick={() => onEdit(node)} title={t('edit')}>
            <Edit size={16} />
          </ButtonPrime>
          <ButtonPrime size="icon" variant="dangerGhost" onClick={() => onDelete(node)} title={t('delete')}>
            <Trash2 size={16} />
          </ButtonPrime>
        </div>
      </div>
      {hasChildren && (isExpanded || Boolean(kw)) && (
        <div className={cx('childrenWrapper')}>
          {node.children!.map((child) => (
            <ExamTypeTreeNode
              key={child.exam_type_id}
              node={child}
              level={level + 1}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
              onEdit={onEdit}
              onEditLayout={onEditLayout}
              onDelete={onDelete}
              onAddChild={onAddChild}
              keyword={keyword}
            />
          ))}
        </div>
      )}
    </>
  );

  if (level === 0) {
    return <div className={cx('rootGroup')}>{nodeContent}</div>;
  }
  return nodeContent;
}

function ExamTypesManagement() {
  const t = useTranslations('AdminContent.examTypes');
  const tc = useTranslations('Common');
  const router = useRouter();
  const {examTypeList, isLoading: loading, isError, createMutation, updateMutation, deleteMutation} =
    useAdminExamTypes();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [formState, setFormState] = useState<ExamTypeFormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [deletingExamType, setDeletingExamType] = useState<ExamTypeItem | null>(null);
  // Lưu node bị thu gọn thay vì node đang mở: mặc định mọi node cha đều mở, và tải lại danh sách
  // (sau thêm/sửa/xoá) không bung lại những node admin đã thu gọn.
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  const examTypes = useMemo(() => examTypeList.map(mapExamTypeFromApi), [examTypeList]);

  const expandedIds = useMemo(
    () =>
      new Set(
        examTypes
          .filter((item) => item.child_count > 0 && !collapsedIds.has(item.exam_type_id))
          .map((item) => item.exam_type_id),
      ),
    [examTypes, collapsedIds],
  );

  const examTypeTree = useMemo(() => {
    const byId = new Map(examTypes.map((item) => [item.exam_type_id, item]));
    const childrenOf = new Map<string, ExamTypeItem[]>();
    const roots: ExamTypeItem[] = [];
    examTypes.forEach((item) => {
      if (item.parent_id && byId.has(item.parent_id)) {
        if (!childrenOf.has(item.parent_id)) childrenOf.set(item.parent_id, []);
        childrenOf.get(item.parent_id)!.push(item);
      } else {
        roots.push(item);
      }
    });
    const byName = (a: ExamTypeItem, b: ExamTypeItem) => a.name.localeCompare(b.name);
    return roots
      .sort(byName)
      .map((root) => ({...root, children: (childrenOf.get(root.exam_type_id) || []).sort(byName)}));
  }, [examTypes]);

  const toggleExpand = useCallback((id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => setCollapsedIds(new Set()), []);
  const collapseAll = useCallback(
    () => setCollapsedIds(new Set(examTypes.filter((item) => item.child_count > 0).map((item) => item.exam_type_id))),
    [examTypes],
  );

  const parentOptions = useMemo(
    () => examTypes.filter((item) => !item.parent_id && item.exam_type_id !== editingTypeId),
    [examTypes, editingTypeId],
  );
  const editingHasChildren = useMemo(
    () => Boolean(editingTypeId) && examTypes.some((item) => item.parent_id === editingTypeId),
    [examTypes, editingTypeId],
  );

  const resetForm = () => {
    setFormState(emptyForm);
    setEditingTypeId(null);
    setErrorMessage('');
  };

  const openCreateModal = () => {
    resetForm();
    setShowFormModal(true);
  };

  const openCreateChildModal = (parent: ExamTypeNode) => {
    resetForm();
    setFormState({...emptyForm, parent_id: parent.exam_type_id});
    setShowFormModal(true);
  };

  const openLayoutEditor = (examType: ExamTypeNode) => {
    router.push(routes.adminExamTypeLayout.replace(':examTypeId', examType.exam_type_id));
  };

  const openEditModal = (examType: ExamTypeNode) => {
    setEditingTypeId(examType.exam_type_id);
    setFormState({
      name: examType.name,
      slug: examType.slug || '',
      description: examType.description || '',
      image_url: examType.image_url || '',
      duration_minutes: examType.duration_minutes ?? '',
      scoring_method: examType.scoring_method || 'DEFAULT',
      score_min: String(examType.score_min),
      score_max: String(examType.score_max),
      flexible: Boolean(examType.flexible),
      parent_id: examType.parent_id || '',
    });
    setShowFormModal(true);
  };

  const handleSubmit = async () => {
    const normalizedName = formState.name.trim();
    const durationValue = String(formState.duration_minutes).trim();
    const parsedDuration = durationValue ? Number(durationValue) : null;

    if (!normalizedName) {
      setErrorMessage(t('errors.nameRequired'));
      return;
    }
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(formState.slug.trim())) {
      setErrorMessage(t('errors.slugInvalid'));
      return;
    }
    if (durationValue && (!Number.isFinite(parsedDuration) || (parsedDuration as number) <= 0)) {
      setErrorMessage(t('errors.durationInvalid'));
      return;
    }
    const scoreMin = Number(String(formState.score_min).trim());
    const scoreMax = Number(String(formState.score_max).trim());
    if (!Number.isInteger(scoreMin) || !Number.isInteger(scoreMax) || scoreMin < 0 || scoreMin >= scoreMax) {
      setErrorMessage(t('errors.scoreRangeInvalid'));
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    try {
      const payload = buildExamTypePayload(formState, {hasChildren: editingHasChildren});
      if (editingTypeId) {
        await updateMutation.mutateAsync({id: editingTypeId, payload});
      } else {
        await createMutation.mutateAsync(payload);
      }

      if (payload.parentId) {
        const parentId = payload.parentId;
        setCollapsedIds((prev) => {
          const next = new Set(prev);
          next.delete(parentId);
          return next;
        });
      }
      setShowFormModal(false);
      resetForm();
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, t('errors.saveFailed')),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingExamType) return;
    setSubmitting(true);
    setErrorMessage('');
    try {
      await deleteMutation.mutateAsync(deletingExamType.exam_type_id);
      setDeletingExamType(null);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, t('errors.deleteFailed')),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const deleteMessage = deletingExamType && deletingExamType.child_count > 0
    ? t('deleteBlockedMessage', {name: deletingExamType?.name, count: deletingExamType.child_count})
    : t('deleteMessage', {name: deletingExamType?.name || ''});

  return (
    <div className="d-flex flex-column gap-3">
      <AdminPageHeader
        title={t('title')}
        description={t('description')}
      >
        <ButtonPrime onClick={openCreateModal}>
          <Plus size={16} />
          {t('add')}
        </ButtonPrime>
      </AdminPageHeader>

      <AdminToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t('searchPlaceholder')}
      />
      <AdminFieldError
        message={errorMessage || (isError ? t('errors.loadFailed') : '')}
      />

      <div className={cx('treeWrapper')}>
        <div className={cx('treeToolbar')}>
          <span className={cx('treeCount')}>{t('count', {count: examTypes.length})}</span>
          <div className={cx('treeToolbarActions')}>
            <ButtonPrime variant="link" size="sm" onClick={expandAll}>{t('expandAll')}</ButtonPrime>
            <ButtonPrime variant="link" size="sm" onClick={collapseAll}>{t('collapseAll')}</ButtonPrime>
          </div>
        </div>

        {loading && (
          <div className="text-center py-4">
            <Spinner size="sm" className="me-2" />
            {tc('loading')}
          </div>
        )}

        {!loading && examTypes.length === 0 && (
          <div className="text-center py-4 text-muted">{t('empty')}</div>
        )}

        {!loading &&
          examTypeTree.map((node) => (
            <ExamTypeTreeNode
              key={node.exam_type_id}
              node={node}
              level={0}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
              onEdit={openEditModal}
              onEditLayout={openLayoutEditor}
              onDelete={setDeletingExamType}
              onAddChild={openCreateChildModal}
              keyword={searchTerm}
            />
          ))}
      </div>

      <ExamTypeFormModal
        show={showFormModal}
        isEditing={Boolean(editingTypeId)}
        formState={formState}
        parentOptions={parentOptions}
        editingHasChildren={editingHasChildren}
        onChangeField={(fieldName, value) =>
          setFormState((previous) => ({...previous, [fieldName]: value} as ExamTypeFormState))
        }
        onClose={() => {
          if (submitting) return;
          setShowFormModal(false);
          resetForm();
        }}
        onSubmit={handleSubmit}
      />
      <ConfirmDeleteModal
        show={Boolean(deletingExamType)}
        onClose={() => {
          if (submitting) return;
          setDeletingExamType(null);
        }}
        onConfirm={handleConfirmDelete}
        title={t('deleteTitle')}
        message={deleteMessage}
      />
    </div>
  );
}

export default ExamTypesManagement;
