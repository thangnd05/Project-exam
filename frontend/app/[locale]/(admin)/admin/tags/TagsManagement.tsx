'use client';

import { useCallback, useMemo, useState } from 'react';
import {useTranslations} from 'next-intl';
import {Button, Form, Spinner} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {ChevronDown, ChevronRight, Edit, FileText, Plus, Trash2} from 'lucide-react';

import ConfirmDeleteModal from '@/app/components/modal/ConfirmDeleteModal';
import TagFormModal, {type TagFormState} from './_components/TagFormModal';
import {AdminFieldError, AdminPageHeader, AdminToolbar} from '@/app/[locale]/(admin)/_components/common';
import {useAdminExamTypesForTags, useExamPartsForTags, useTagList, useTags, type AdminTag} from './_hooks/useTags';
import type {TagRequest, TagResponse} from '@/app/types';
import {getApiErrorMessage} from '@/app/utils/apiError';
import styles from './TagsManagement.module.scss';

const cx = classNames.bind(styles);

const SHARED_GROUP_KEY = '__shared__';

const emptyForm: TagFormState = {name: '', examPartId: null, examTypeId: '', sortOrder: null};

type PartGroup = {
  key: string;
  examPartId: string | null;
  name: string;
  displayOrder?: number;
  tags: AdminTag[];
};

function nextSortOrder(tags: AdminTag[], examPartId: string | null): number {
  const max = tags.reduce((highest, tag) => {
    if ((tag.examPartId || null) !== examPartId || tag.sortOrder == null) return highest;
    return Math.max(highest, tag.sortOrder);
  }, 0);
  return max + 1;
}

type PartGroupNodeProps = {
  group: PartGroup;
  isExpanded: boolean;
  searchTerm: string;
  onToggle: (key: string) => void;
  onAddToPart: (examPartId: string | null) => void;
  onEdit: (tag: AdminTag) => void;
  onDelete: (tag: AdminTag) => void;
};

function PartGroupNode({group, isExpanded, searchTerm, onToggle, onAddToPart, onEdit, onDelete}: PartGroupNodeProps) {
  const t = useTranslations('AdminContent.tags');
  const keyword = searchTerm.trim().toLowerCase();
  const visibleTags = keyword
    ? group.tags.filter((tag) => tag.name.toLowerCase().includes(keyword))
    : group.tags;
  if (keyword && visibleTags.length === 0) return null;

  const open = isExpanded || Boolean(keyword);
  const hasTags = group.tags.length > 0;

  return (
    <div className={cx('rootGroup')}>
      <div className={cx('treeNode')}>
        <div className={cx('treeNodeLeft')}>
          {hasTags ? (
            <button className={cx('expandBtn')} onClick={() => onToggle(group.key)}>
              {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
          ) : (
            <span className={cx('expandPlaceholder')} />
          )}
          <span className={cx('tagName', 'root', {sharedGroup: !group.examPartId})}>{group.name}</span>
          {group.displayOrder != null && (
            <span className={cx('sortOrder')} title={t('partOrder')}>
              {group.displayOrder}
            </span>
          )}
          <span className={cx('childCount')} title={t('tagCount')}>{group.tags.length}</span>
        </div>
        <div className={cx('treeNodeActions')}>
          <button onClick={() => onAddToPart(group.examPartId)} title={t('addToPart')}>
            <Plus size={16} />
          </button>
        </div>
      </div>
      {hasTags && open && (
        <div className={cx('childrenWrapper')}>
          {visibleTags.map((tag) => (
            <div key={tag.tagId} className={cx('treeNode')}>
              <div className={cx('treeNodeLeft')}>
                <span className={cx('expandPlaceholder')} />
                <span className={cx('tagName')}>{tag.name}</span>
                <span className={cx('sortOrder')} title={t('sortOrder')}>
                  {tag.sortOrder ?? '—'}
                </span>
                <span
                  className={cx('resourceCount', {empty: !tag.resourceCount})}
                  title={tag.resourceCount ? t('resourceCount', {count: tag.resourceCount}) : t('noResources')}
                >
                  <FileText size={12} />
                  {tag.resourceCount ?? 0}
                </span>
              </div>
              <div className={cx('treeNodeActions')}>
                <button onClick={() => onEdit(tag)} title={t('edit')}>
                  <Edit size={16} />
                </button>
                <button onClick={() => onDelete(tag)} title={t('delete')}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TagsManagement() {
  const t = useTranslations('AdminContent.tags');
  const tc = useTranslations('Common');
  const [chosenExamTypeId, setSelectedExamTypeId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [formState, setFormState] = useState<TagFormState>(emptyForm);
  const [errorMessage, setErrorMessage] = useState('');
  const [deletingTag, setDeletingTag] = useState<AdminTag | null>(null);
  // Lưu các nhóm đang thu gọn để nhóm mới luôn mở mặc định.
  const [collapsedKeys, setCollapsedKeys] = useState<Set<string>>(new Set());

  const { examTypes = [] } = useAdminExamTypesForTags();
  // Chưa chọn thì mặc định loại kỳ thi đầu tiên
  const selectedExamTypeId = chosenExamTypeId || examTypes[0]?.id || '';
  const {tags, isLoading: loading, isError: tagLoadError} = useTagList(selectedExamTypeId);
  const {examParts} = useExamPartsForTags(selectedExamTypeId);

  const partGroups = useMemo<PartGroup[]>(() => {
    const groups: PartGroup[] = examParts.map((p) => ({
      key: p.examPartId,
      examPartId: p.examPartId,
      name: p.name || t('unnamedPart'),
      displayOrder: p.displayOrder,
      tags: tags.filter((tag) => tag.examPartId === p.examPartId),
    }));
    const knownPartIds = new Set(examParts.map((p) => p.examPartId));
    const shared = tags.filter((tag) => !tag.examPartId || !knownPartIds.has(tag.examPartId));
    if (shared.length > 0) {
      groups.push({key: SHARED_GROUP_KEY, examPartId: null, name: t('sharedGroup'), tags: shared});
    }
    return groups;
  }, [examParts, tags, t]);

  const {createMutation, updateMutation, deleteMutation} = useTags();
  const submitting =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const toggleGroup = useCallback((key: string) => {
    setCollapsedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => setCollapsedKeys(new Set()), []);
  const collapseAll = useCallback(
    () => setCollapsedKeys(new Set(partGroups.map((g) => g.key))),
    [partGroups],
  );

  const resetForm = () => {
    setFormState(emptyForm);
    setEditingTagId(null);
    setErrorMessage('');
  };

  const openCreateModal = (examPartId: string | null = examParts[0]?.examPartId ?? null) => {
    setEditingTagId(null);
    setErrorMessage('');
    setFormState({
      name: '',
      examPartId,
      examTypeId: selectedExamTypeId,
      sortOrder: nextSortOrder(tags, examPartId),
    });
    setShowFormModal(true);
  };

  const openEditModal = (tag: AdminTag) => {
    setEditingTagId(tag.tagId);
    setFormState({
      name: tag.name,
      examPartId: tag.examPartId || null,
      examTypeId: tag.examTypeId || selectedExamTypeId,
      sortOrder: tag.sortOrder ?? null,
    });
    setShowFormModal(true);
  };

  const handleFormFieldChange = (field: keyof TagFormState, value: string | number | null) => {
    setFormState((prev) => {
      const next = {...prev, [field]: value} as TagFormState;
      if (field === 'examPartId' && !editingTagId) {
        next.sortOrder = nextSortOrder(tags, (value as string | null) || null);
      }
      return next;
    });
  };

  const handleSubmit = () => {
    const examTypeId = formState.examTypeId || selectedExamTypeId;
    if (!examTypeId) {
      setErrorMessage(t('errors.examTypeRequired'));
      return;
    }
    if (!formState.name.trim()) {
      setErrorMessage(t('errors.nameRequired'));
      return;
    }
    setErrorMessage('');
    const payload: TagRequest = {
      name: formState.name.trim(),
      examTypeId,
      examPartId: formState.examPartId || null,
      sortOrder: formState.sortOrder ?? null,
    };

    const onSuccess = (savedTag: TagResponse) => {
      const targetExamTypeId = savedTag?.examTypeId || examTypeId;
      if (targetExamTypeId !== selectedExamTypeId) {
        setSelectedExamTypeId(targetExamTypeId);
      }
      setSearchTerm('');
      setShowFormModal(false);
      resetForm();
      const groupKey = savedTag?.examPartId || SHARED_GROUP_KEY;
      setCollapsedKeys((prev) => {
        const next = new Set(prev);
        next.delete(groupKey);
        return next;
      });
    };
    const onError = (error: unknown) => {
      setErrorMessage(getApiErrorMessage(error, t('errors.saveFailed')));
    };

    if (editingTagId) {
      updateMutation.mutate({tagId: editingTagId, payload}, {onSuccess, onError});
    } else {
      createMutation.mutate(payload, {onSuccess, onError});
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingTag) return;
    setErrorMessage('');
    deleteMutation.mutate(deletingTag.tagId, {
      onSuccess: () => setDeletingTag(null),
      onError: () => setErrorMessage(t('errors.deleteFailed')),
    });
  };

  return (
    <div className="d-flex flex-column gap-3">
      <AdminPageHeader
        title={t('title')}
        description={t('description')}
      >
        <Button onClick={() => openCreateModal()} disabled={!selectedExamTypeId}>
          <Plus size={16} className="me-1" />
          {t('add')}
        </Button>
      </AdminPageHeader>

      <AdminToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t('searchPlaceholder')}
      >
        <Form.Select
          style={{maxWidth: 260}}
          value={selectedExamTypeId}
          onChange={(e) => setSelectedExamTypeId(e.target.value)}
        >
          {examTypes.map((et) => (
            <option key={et.id} value={et.id}>
              {et.name}
            </option>
          ))}
        </Form.Select>
      </AdminToolbar>

      <AdminFieldError message={errorMessage || (tagLoadError ? t('errors.loadFailed') : '')} />

      <div className={cx('treeWrapper')}>
        <div className={cx('treeToolbar')}>
          <span className={cx('treeCount')}>{t('count', {count: tags.length})}</span>
          <div className={cx('treeToolbarActions')}>
            <button onClick={expandAll}>{t('expandAll')}</button>
            <button onClick={collapseAll}>{t('collapseAll')}</button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-4">
            <Spinner size="sm" className="me-2" />
            {tc('loading')}
          </div>
        )}

        {!loading && partGroups.length === 0 && (
          <div className="text-center py-4 text-muted">
            {t('empty')}
          </div>
        )}

        {!loading &&
          partGroups.map((group) => (
            <PartGroupNode
              key={group.key}
              group={group}
              isExpanded={!collapsedKeys.has(group.key)}
              searchTerm={searchTerm}
              onToggle={toggleGroup}
              onAddToPart={openCreateModal}
              onEdit={openEditModal}
              onDelete={setDeletingTag}
            />
          ))}
      </div>

      <TagFormModal
        show={showFormModal}
        isEditing={Boolean(editingTagId)}
        formState={formState}
        examTypes={examTypes}
        examParts={examParts}
        onChangeField={handleFormFieldChange}
        onClose={() => {
          if (submitting) return;
          setShowFormModal(false);
          resetForm();
        }}
        onSubmit={handleSubmit}
      />

      <ConfirmDeleteModal
        show={Boolean(deletingTag)}
        onClose={() => {
          if (submitting) return;
          setDeletingTag(null);
        }}
        onConfirm={handleConfirmDelete}
        title={t('deleteTitle')}
        message={t('deleteMessage', {name: deletingTag?.name || ''})}
      />
    </div>
  );
}

export default TagsManagement;
