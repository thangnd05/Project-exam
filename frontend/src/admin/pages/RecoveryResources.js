import React, {useEffect, useMemo, useState} from 'react';
import {Badge, Button, Form, Spinner} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {Download, Edit, ExternalLink, Plus, Trash2} from 'lucide-react';

import ConfirmDeleteModal from '../../components/common/modal/ConfirmDeleteModal';
import RecoveryResourceFormModal from '../modals/RecoveryResourceFormModal';
import RecoveryResourceLink from '~/components/resources/RecoveryResourceLink';
import {AdminFieldError, AdminPageHeader, AdminToolbar} from '../components/common';
import {isMarkdownResource} from '~/utils/recoveryResource';
import {useRecoveryResources, useTagsByExamType} from './hooks/useRecoveryResources';
import styles from './RecoveryResources.module.scss';

const cx = classNames.bind(styles);
const API_BASE = (process.env.REACT_APP_API_BASE_URL || '').replace(/\/$/, '');

const emptyForm = {
  title: '',
  description: '',
  url: '',
  tagIds: [],
};

const getRootTagId = (tag, tagById) => {
  let current = tag;
  let depth = 0;

  while (current?.parentId && depth < 20) {
    const parent = tagById.get(current.parentId);
    if (!parent) {
      break;
    }
    current = parent;
    depth += 1;
  }

  return current?.tagId || null;
};

function ResourceCard({
  resource,
  onEdit,
  onDelete,
  onDownload,
  formatDate,
  cx,
}) {
  return (
    <div className={cx('resourceCard')}>
      <div className={cx('cardHeader')}>
        <h3 className={cx('cardTitle')}>{resource.title}</h3>
        <div className={cx('cardActions')}>
          <button type="button" onClick={() => onEdit(resource)} title="Sửa">
            <Edit size={16} />
          </button>
          <button type="button" onClick={() => onDelete(resource)} title="Xóa">
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
            <ExternalLink size={14} /> Xem
          </RecoveryResourceLink>
          {resource.url && (
            <button
              type="button"
              className={cx('viewLink')}
              onClick={() => onDownload(resource.url, resource.originalFileName)}
              title={isMarkdownResource(resource) ? 'Tải file markdown gốc (dành cho quản trị)' : 'Tải về'}
            >
              <Download size={14} />
              {isMarkdownResource(resource) ? 'Tải file gốc' : 'Tải về'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function RecoveryResourcesManagement() {
  const [selectedExamTypeId, setSelectedExamTypeId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formState, setFormState] = useState(emptyForm);
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [deletingResource, setDeletingResource] = useState(null);
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

  const fetchError = resourcesError ? 'Không thể tải danh sách tài liệu.' : '';

  useEffect(() => {
    if (!selectedExamTypeId) {
      setSelectedParentTagId('');
      return;
    }
    const firstRootId = availableTags.find((tag) => !tag.parentId)?.tagId || '';
    setSelectedParentTagId(firstRootId);
  }, [selectedExamTypeId, availableTags]);

  const filteredResources = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return resources.filter((resource) => {
      const resourceTags = resource.tags || [];

      if (selectedExamTypeId) {
        const matchesExamType = resourceTags.some(
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
        resource.title.toLowerCase().includes(keyword) ||
        (resource.description || '').toLowerCase().includes(keyword) ||
        resourceTags.some((tag) => tag.name.toLowerCase().includes(keyword))
      );
    });
  }, [resources, searchTerm, selectedExamTypeId]);

  const parentTagGroups = useMemo(() => {
    if (!selectedExamTypeId) {
      return null;
    }

    const tagById = new Map(availableTags.map((tag) => [tag.tagId, tag]));
    const rootTags = availableTags.filter((tag) => !tag.parentId);
    const groups = rootTags.map((parentTag) => ({
      parentTag,
      resources: [],
    }));
    const groupMap = new Map(groups.map((group) => [group.parentTag.tagId, group]));
    const ungrouped = [];
    const ungroupedIds = new Set();

    const pushUngrouped = (resource) => {
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

      const parentIds = new Set();
      examTags.forEach((tag) => {
        const rootId = tag.parentId ? getRootTagId(tag, tagById) : tag.tagId;
        if (rootId) {
          parentIds.add(rootId);
        }
      });

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

    return {groups, ungrouped};
  }, [selectedExamTypeId, availableTags, filteredResources]);

  const activeParentGroup = useMemo(() => {
    if (!parentTagGroups || !selectedParentTagId) {
      return null;
    }

    if (selectedParentTagId === '__ungrouped__') {
      return {
        title: 'Chưa gán tag cha',
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
  }, [parentTagGroups, selectedParentTagId]);

  const renderResourceCard = (resource) => (
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

  const openEditModal = (resource) => {
    const tagExamTypeId = (resource.tags || []).find((t) => t.examTypeId)?.examTypeId;
    setEditingId(resource.resourceId);
    setFormState({
      title: resource.title,
      description: resource.description || '',
      url: resource.url || '',
      tagIds: (resource.tags || []).map((t) => t.tagId),
    });
    setSelectedFile(null);
    setFormExamTypeId(
      tagExamTypeId ? String(tagExamTypeId) : selectedExamTypeId || '',
    );
    setShowFormModal(true);
  };

  const handleToggleTag = (tagId) => {
    setFormState((prev) => {
      const ids = prev.tagIds || [];
      const next = ids.includes(tagId) ? ids.filter((id) => id !== tagId) : [...ids, tagId];
      return {...prev, tagIds: next};
    });
  };

  const handleSubmit = async () => {
    if (!formState.title.trim()) {
      setErrorMessage('Tiêu đề không được để trống.');
      return;
    }
    if (!selectedFile && !formState.url.trim() && !editingId) {
      setErrorMessage('Vui lòng upload file hoặc cung cấp URL.');
      return;
    }
    setSubmitting(true);
    setErrorMessage('');
    try {
      const payload = {
        title: formState.title.trim(),
        description: formState.description.trim(),
        url: formState.url.trim() || null,
        tagIds: [...new Set(formState.tagIds || [])],
      };
      if (editingId) {
        await updateMutation.mutateAsync({id: editingId, payload, file: selectedFile});
      } else {
        await createMutation.mutateAsync({payload, file: selectedFile});
      }
      setShowFormModal(false);
      resetForm();
    } catch {
      setErrorMessage('Không thể lưu tài liệu. Vui lòng thử lại.');
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
      setErrorMessage('Không thể xóa tài liệu.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async (url, originalFileName) => {
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

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  return (
    <div className={cx('resourcesPage')}>
      <AdminPageHeader
        title="Kho tài liệu ôn tập"
        description="Quản lý bài giảng, video, tài liệu gắn với các Tag kiến thức."
      >
        <Button onClick={openCreateModal}>
          <Plus size={16} className="me-1" />
          Thêm tài liệu
        </Button>
      </AdminPageHeader>

      <AdminToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Tìm theo tiêu đề, mô tả, tag..."
      >
        <Form.Select
          style={{maxWidth: 200}}
          value={selectedExamTypeId}
          onChange={(e) => setSelectedExamTypeId(e.target.value)}
        >
          <option value="">Tất cả loại kỳ thi</option>
          {examTypes.map((et) => (
            <option key={et.id} value={et.id}>{et.name}</option>
          ))}
        </Form.Select>
      </AdminToolbar>

      <AdminFieldError message={errorMessage || fetchError} />

      {loading && (
        <div className="text-center py-5">
          <Spinner size="sm" className="me-2" />
          Đang tải...
        </div>
      )}

      {!loading && !parentTagGroups && filteredResources.length === 0 && (
        <div className="text-center py-5 text-muted">Không có tài liệu nào.</div>
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
                <span className={cx('parentTabTitle')}>Chưa gán tag cha</span>
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
                  Chưa có tài liệu trong nhóm &quot;{activeParentGroup.title}&quot;.
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
        onExamTypeChange={setFormExamTypeId}
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
        title="Xác nhận xóa tài liệu"
        message={`Bạn có chắc muốn xóa "${deletingResource?.title || ''}" không? File trên Cloudinary cũng sẽ bị xóa.`}
      />
    </div>
  );
}

export default RecoveryResourcesManagement;
