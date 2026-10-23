'use client';

import { useMemo, useState } from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {Badge, Button, Spinner} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {Download, Edit, ExternalLink, Plus, Trash2} from 'lucide-react';

import ConfirmDeleteModal from '@/app/components/modal/ConfirmDeleteModal';
import RecoveryResourceFormModal, {
  type RecoveryResourceFormState,
} from './_components/RecoveryResourceFormModal';
import RecoveryResourceLink from '@/app/features/resources/RecoveryResourceLink/RecoveryResourceLink';
import {
  AdminExamTypePicker,
  AdminFieldError,
  AdminPageHeader,
  AdminToolbar,
} from '@/app/[locale]/(admin)/_components/common';
import {isMarkdownResource} from '@/app/features/resources/recoveryResource';
import type {RecoveryResourceRequest, RecoveryResourceResponse, TagResponse} from '@/app/types';
import {getApiErrorMessage} from '@/app/utils/apiError';
import {useRecoveryResources, useTagsByExamType} from './_hooks/useRecoveryResources';
import styles from './RecoveryResourcesManagement.module.scss';

const cx = classNames.bind(styles);

const emptyForm: RecoveryResourceFormState = {
  title: '',
  description: '',
  url: '',
  tagIds: [],
};

const SHARED_PART_KEY = '__shared__';

interface ResourceCardProps {
  resource: RecoveryResourceResponse;
  onEdit: (resource: RecoveryResourceResponse) => void;
  onDelete: (resource: RecoveryResourceResponse) => void;
  onDownload: (url: string, originalFileName?: string) => void;
  formatDate: (dateStr?: string) => string;
  cx: typeof cx;
}

function ResourceCard({
  resource,
  onEdit,
  onDelete,
  onDownload,
  formatDate,
  cx,
}: ResourceCardProps) {
  const t = useTranslations('AdminUsers');

  return (
    <div className={cx('resourceCard')}>
      <div className={cx('cardHeader')}>
        <h3 className={cx('cardTitle')}>{resource.title}</h3>
        <div className={cx('cardActions')}>
          <button type="button" onClick={() => onEdit(resource)} title={t('shared.edit')}>
            <Edit size={16} />
          </button>
          <button type="button" onClick={() => onDelete(resource)} title={t('shared.delete')}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {resource.description && (
        <p className={cx('cardDescription')}>{resource.description}</p>
      )}

      {resource.tags && resource.tags.length > 0 && (
        <div className={cx('cardTags')}>
          {resource.tags.map((tag) => (
            <Badge key={tag.tagId} bg="light" text="dark" className="border">
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

      {resource.originalFileName && (
        <div className={cx('cardFileName')}>
          {resource.originalFileName}
          {isMarkdownResource(resource) && (
            <span className={cx('fileTypeBadge')}>Markdown</span>
          )}
        </div>
      )}

      <div className={cx('cardFooter')}>
        <span>{formatDate(resource.createdAt)}</span>
        <div className={cx('footerActions')}>
          <RecoveryResourceLink resource={resource} className={cx('viewLink')}>
            <ExternalLink size={14} /> {t('recoveryResources.view')}
          </RecoveryResourceLink>
          {resource.url && (
            <button
              type="button"
              className={cx('viewLink')}
              onClick={() => onDownload(resource.url as string, resource.originalFileName)}
              title={isMarkdownResource(resource) ? t('recoveryResources.downloadOriginalTitle') : t('recoveryResources.download')}
            >
              <Download size={14} />
              {isMarkdownResource(resource) ? t('recoveryResources.downloadOriginal') : t('recoveryResources.download')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function RecoveryResourcesManagement() {
  const t = useTranslations('AdminUsers');
  const tCommon = useTranslations('Common');
  const locale = useLocale();
  const [selectedExamTypeId, setSelectedExamTypeId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<RecoveryResourceFormState>(emptyForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [deletingResource, setDeletingResource] = useState<RecoveryResourceResponse | null>(null);
  const [selectedParentTagId, setSelectedParentTagId] = useState('');
  const [formExamTypeId, setFormExamTypeId] = useState('');

  const {
    resources,
    isLoading: loading,
    isError: resourcesError,
    examTypes,
    createMutation,
    updateMutation,
    deleteMutation,
  } = useRecoveryResources();

  const availableTags = useTagsByExamType(selectedExamTypeId);
  const formAvailableTags = useTagsByExamType(formExamTypeId);

  const fetchError = resourcesError ? t('recoveryResources.errors.load') : '';

  // Đổi kỳ thi hoặc danh sách tag thì chọn lại nhóm tag đầu tiên
  const [prevTagSource, setPrevTagSource] = useState({examTypeId: selectedExamTypeId, tags: availableTags});
  if (prevTagSource.examTypeId !== selectedExamTypeId || prevTagSource.tags !== availableTags) {
    setPrevTagSource({examTypeId: selectedExamTypeId, tags: availableTags});
    if (!selectedExamTypeId) {
      setSelectedParentTagId('');
    } else {
      const firstGroupKey = availableTags.length ? availableTags[0].examPartId || SHARED_PART_KEY : '';
      setSelectedParentTagId(firstGroupKey);
    }
  }

  const filteredResources = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return resources.filter((resource) => {
      const resourceTags = resource.tags || [];

      if (selectedExamTypeId) {
        const matchesExamType =
          String(resource.examTypeId || '') === String(selectedExamTypeId) ||
          resourceTags.some(
            (tag) => String(tag.examTypeId) === String(selectedExamTypeId),
          );
        if (!matchesExamType) {
          return false;
        }
      }

      if (!keyword) {
        return true;
      }

      return (
        resource.title!.toLowerCase().includes(keyword) ||
        (resource.description || '').toLowerCase().includes(keyword) ||
        resourceTags.some((tag) => tag.name!.toLowerCase().includes(keyword))
      );
    });
  }, [resources, searchTerm, selectedExamTypeId]);

  const parentTagGroups = useMemo(() => {
    if (!selectedExamTypeId) {
      return null;
    }

    // Nhóm theo phần thi của tag (danh sách tag đã được backend sắp theo thứ tự phần thi).
    const tagById = new Map(availableTags.map((tag): [string, TagResponse] => [tag.tagId, tag]));
    const groupKeyOf = (tag: TagResponse) => (tag.examPartId ?? tagById.get(tag.tagId)?.examPartId) || SHARED_PART_KEY;
    const groupMap = new Map<string, {parentTag: {tagId: string; name: string}; resources: RecoveryResourceResponse[]}>();
    availableTags.forEach((tag) => {
      const key = groupKeyOf(tag);
      if (!groupMap.has(key)) {
        const name = key === SHARED_PART_KEY ? t('recoveryResources.sharedGroup') : tag.examPartName || t('recoveryResources.partFallback');
        groupMap.set(key, {parentTag: {tagId: key, name}, resources: []});
      }
    });
    const groups = Array.from(groupMap.values());
    const ungrouped: RecoveryResourceResponse[] = [];
    const ungroupedIds = new Set<string>();

    const pushUngrouped = (resource: RecoveryResourceResponse) => {
      if (ungroupedIds.has(resource.resourceId)) {
        return;
      }
      ungroupedIds.add(resource.resourceId);
      ungrouped.push(resource);
    };

    filteredResources.forEach((resource) => {
      const examTags = (resource.tags || []).filter(
        (tag) => String(tag.examTypeId) === String(selectedExamTypeId),
      );

      if (examTags.length === 0) {
        pushUngrouped(resource);
        return;
      }

      const parentIds = new Set<string>();
      examTags.forEach((tag) => parentIds.add(groupKeyOf(tag)));

      if (parentIds.size === 0) {
        pushUngrouped(resource);
        return;
      }

      let placed = false;
      parentIds.forEach((parentId) => {
        const group = groupMap.get(parentId);
        if (group) {
          group.resources.push(resource);
          placed = true;
        }
      });

      if (!placed) {
        pushUngrouped(resource);
      }
    });

    // Trong mỗi phần thi, xếp tài liệu theo tag đứng đầu của nó trong phần thi đó
    // (vị trí trong availableTags = thứ tự tag), rồi theo tiêu đề.
    const tagRank = new Map(availableTags.map((tag, index): [string, number] => [tag.tagId, index]));
    groupMap.forEach((group, key) => {
      const rankOf = (resource: RecoveryResourceResponse) => Math.min(
        ...(resource.tags || [])
          .filter((tag) => groupKeyOf(tag) === key)
          .map((tag) => tagRank.get(tag.tagId) ?? Number.MAX_SAFE_INTEGER),
      );
      group.resources.sort((a, b) =>
        rankOf(a) - rankOf(b) || (a.title ?? '').localeCompare(b.title ?? '', 'vi'));
    });

    return {groups, ungrouped};
  }, [selectedExamTypeId, availableTags, filteredResources, t]);

  const activeParentGroup = useMemo(() => {
    if (!parentTagGroups || !selectedParentTagId) {
      return null;
    }

    if (selectedParentTagId === '__ungrouped__') {
      return {
        title: t('recoveryResources.ungrouped'),
        resources: parentTagGroups.ungrouped,
      };
    }

    const group = parentTagGroups.groups.find(
      (item) => item.parentTag.tagId === selectedParentTagId,
    );

    if (!group) {
      return null;
    }

    return {
      title: group.parentTag.name,
      resources: group.resources,
    };
  }, [parentTagGroups, selectedParentTagId, t]);

  const renderResourceCard = (resource: RecoveryResourceResponse) => (
    <ResourceCard
      key={resource.resourceId}
      resource={resource}
      onEdit={openEditModal}
      onDelete={setDeletingResource}
      onDownload={handleDownload}
      formatDate={formatDate}
      cx={cx}
    />
  );

  const resetForm = () => {
    setFormState(emptyForm);
    setEditingId(null);
    setSelectedFile(null);
    setFormExamTypeId('');
    setErrorMessage('');
  };

  const openCreateModal = () => {
    resetForm();
    setFormExamTypeId(selectedExamTypeId || '');
    setShowFormModal(true);
  };

  const openEditModal = (resource: RecoveryResourceResponse) => {
    const tagExamTypeId = (resource.tags || []).find((t) => t.examTypeId)?.examTypeId;
    setEditingId(resource.resourceId);
    setFormState({
      title: resource.title as string,
      description: resource.description || '',
      url: resource.url || '',
      tagIds: (resource.tags || []).map((t) => t.tagId),
    });
    setSelectedFile(null);
    setFormExamTypeId(
      resource.examTypeId
        ? String(resource.examTypeId)
        : tagExamTypeId
          ? String(tagExamTypeId)
          : selectedExamTypeId || '',
    );
    setShowFormModal(true);
  };

  const handleFormExamTypeChange = (examTypeId: string) => {
    setFormExamTypeId(examTypeId);
    // Tag phải cùng kỳ thi với tài liệu nên bỏ các tag của kỳ thi cũ.
    setFormState((prev) => ({...prev, tagIds: []}));
  };

  const handleToggleTag = (tagId: string) => {
    setFormState((prev) => {
      const ids = prev.tagIds || [];
      const next = ids.includes(tagId) ? ids.filter((id) => id !== tagId) : [...ids, tagId];
      return {...prev, tagIds: next};
    });
  };

  const handleSubmit = async () => {
    if (!formState.title.trim()) {
      setErrorMessage(t('recoveryResources.errors.titleRequired'));
      return;
    }
    if (!selectedFile && !formState.url.trim() && !editingId) {
      setErrorMessage(t('recoveryResources.errors.fileOrUrlRequired'));
      return;
    }
    setSubmitting(true);
    setErrorMessage('');
    try {
      const payload: RecoveryResourceRequest = {
        title: formState.title.trim(),
        description: formState.description.trim(),
        url: formState.url.trim() || undefined,
        tagIds: [...new Set(formState.tagIds || [])],
        examTypeId: formExamTypeId || '',
      };
      if (editingId) {
        await updateMutation.mutateAsync({id: editingId, payload, file: selectedFile});
      } else {
        await createMutation.mutateAsync({payload, file: selectedFile});
      }
      setShowFormModal(false);
      resetForm();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t('recoveryResources.errors.save')));
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingResource) return;
    setSubmitting(true);
    setErrorMessage('');
    try {
      await deleteMutation.mutateAsync(deletingResource.resourceId);
      setDeletingResource(null);
    } catch {
      setErrorMessage(t('recoveryResources.errors.delete'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async (url: string, originalFileName?: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = originalFileName || 'download';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch {

      window.open(url, '_blank');
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(locale === 'en' ? 'en-US' : 'vi-VN');
  };

  return (
    <div className={cx('resourcesPage')}>
      <AdminPageHeader
        title={t('recoveryResources.title')}
        description={t('recoveryResources.description')}
      >
        <Button onClick={openCreateModal}>
          <Plus size={16} className="me-1" />
          {t('recoveryResources.add')}
        </Button>
      </AdminPageHeader>

      <AdminToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t('recoveryResources.searchPlaceholder')}
        filters={
          <AdminExamTypePicker
            value={selectedExamTypeId}
            onChange={setSelectedExamTypeId}
            clearable
          />
        }
      />

      <AdminFieldError message={errorMessage || fetchError} />

      {loading && (
        <div className="text-center py-5">
          <Spinner size="sm" className="me-2" />
          {tCommon('loading')}
        </div>
      )}

      {!loading && !parentTagGroups && filteredResources.length === 0 && (
        <div className="text-center py-5 text-muted">{t('recoveryResources.empty')}</div>
      )}

      {!loading && filteredResources.length > 0 && !parentTagGroups && (
        <div className={cx('cardGrid')}>
          {filteredResources.map((resource) => renderResourceCard(resource))}
        </div>
      )}

      {!loading && parentTagGroups && (
        <div className={cx('groupWrapper')}>
          <div className={cx('parentTabList')}>
            {parentTagGroups.groups.map((group) => (
              <button
                key={group.parentTag.tagId}
                type="button"
                className={cx('parentTab', {
                  active: selectedParentTagId === group.parentTag.tagId,
                })}
                onClick={() => setSelectedParentTagId(group.parentTag.tagId)}
              >
                <span className={cx('parentTabTitle')}>{group.parentTag.name}</span>
                <span className={cx('parentTabCount')}>{group.resources.length}</span>
              </button>
            ))}
            {parentTagGroups.ungrouped.length > 0 && (
              <button
                type="button"
                className={cx('parentTab', {
                  active: selectedParentTagId === '__ungrouped__',
                })}
                onClick={() => setSelectedParentTagId('__ungrouped__')}
              >
                <span className={cx('parentTabTitle')}>{t('recoveryResources.ungrouped')}</span>
                <span className={cx('parentTabCount')}>{parentTagGroups.ungrouped.length}</span>
              </button>
            )}
          </div>

          {activeParentGroup && (
            <div className={cx('parentTabPanel')}>
              {activeParentGroup.resources.length > 0 ? (
                <div className={cx('cardGrid')}>
                  {activeParentGroup.resources.map((resource) => renderResourceCard(resource))}
                </div>
              ) : (
                <div className={cx('emptyGroup')}>
                  {t('recoveryResources.emptyGroup', {group: activeParentGroup.title})}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <RecoveryResourceFormModal
        show={showFormModal}
        isEditing={Boolean(editingId)}
        formState={formState}
        examTypes={examTypes}
        formExamTypeId={formExamTypeId}
        onExamTypeChange={handleFormExamTypeChange}
        availableTags={formAvailableTags}
        selectedFile={selectedFile}
        onChangeField={(field, value) =>
          setFormState((prev) => ({...prev, [field]: value}))
        }
        onFileChange={setSelectedFile}
        onToggleTag={handleToggleTag}
        onClose={() => {
          if (submitting) return;
          setShowFormModal(false);
          resetForm();
        }}
        onSubmit={handleSubmit}
        submitting={submitting}
      />

      <ConfirmDeleteModal
        show={Boolean(deletingResource)}
        onClose={() => {
          if (submitting) return;
          setDeletingResource(null);
        }}
        onConfirm={handleConfirmDelete}
        title={t('recoveryResources.confirmDelete.title')}
        message={t('recoveryResources.confirmDelete.message', {title: deletingResource?.title || ''})}
      />
    </div>
  );
}

export default RecoveryResourcesManagement;
