import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Badge, Button, Form, Spinner} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {Download, Edit, ExternalLink, Plus, Trash2} from 'lucide-react';

import {getExamTypes} from '../../api/examTypeApi';
import {getTagsFlatByExamType} from '../../api/tagApi';
import {
  getAllResources,
  createResource,
  updateResource,
  deleteResource,
} from '../../api/recoveryResourceApi';
import ConfirmDeleteModal from '../../components/common/modal/ConfirmDeleteModal';
import RecoveryResourceFormModal from '../modals/RecoveryResourceFormModal';
import RecoveryResourceLink from '~/components/resources/RecoveryResourceLink';
import {AdminFieldError, AdminPageHeader, AdminToolbar} from '../components/common';
import {isMarkdownResource} from '~/utils/recoveryResource';
import styles from './RecoveryResources.module.scss';

const cx = classNames.bind(styles);
const API_BASE = (process.env.REACT_APP_API_BASE_URL || '').replace(/\/$/, '');

const emptyForm = {
  title: '',
  description: '',
  url: '',
  tagIds: [],
};

function RecoveryResourcesManagement() {
  const [resources, setResources] = useState([]);
  const [examTypes, setExamTypes] = useState([]);
  const [selectedExamTypeId, setSelectedExamTypeId] = useState('');
  const [availableTags, setAvailableTags] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formState, setFormState] = useState(emptyForm);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [deletingResource, setDeletingResource] = useState(null);

  useEffect(() => {
    getExamTypes()
      .then((list) => {
        const mapped = list.map((item) => ({id: item.examTypeId, name: item.name}));
        setExamTypes(mapped);
        if (mapped.length > 0) setSelectedExamTypeId(mapped[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedExamTypeId) { setAvailableTags([]); return; }
    getTagsFlatByExamType(selectedExamTypeId)
      .then((tags) => setAvailableTags(Array.isArray(tags) ? tags : []))
      .catch(() => setAvailableTags([]));
  }, [selectedExamTypeId]);

  const fetchResources = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const list = await getAllResources();
      setResources(list);
    } catch {
      setErrorMessage('Không thể tải danh sách tài liệu.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchResources(); }, [fetchResources]);

  const filteredResources = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return resources;
    return resources.filter(
      (r) =>
        r.title.toLowerCase().includes(keyword) ||
        (r.description || '').toLowerCase().includes(keyword) ||
        (r.tags || []).some((t) => t.name.toLowerCase().includes(keyword)),
    );
  }, [resources, searchTerm]);

  const resetForm = () => {
    setFormState(emptyForm);
    setEditingId(null);
    setSelectedFile(null);
    setErrorMessage('');
  };

  const openCreateModal = () => {
    resetForm();
    setShowFormModal(true);
  };

  const openEditModal = (resource) => {
    setEditingId(resource.resourceId);
    setFormState({
      title: resource.title,
      description: resource.description || '',
      url: resource.url || '',
      tagIds: (resource.tags || []).map((t) => t.tagId),
    });
    setSelectedFile(null);
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
        tagIds: formState.tagIds,
      };
      if (editingId) {
        await updateResource(editingId, payload, selectedFile);
      } else {
        await createResource(payload, selectedFile);
      }
      setShowFormModal(false);
      resetForm();
      await fetchResources();
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
      await deleteResource(deletingResource.resourceId);
      setDeletingResource(null);
      await fetchResources();
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
      // Fallback: mở tab mới
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
          {examTypes.map((et) => (
            <option key={et.id} value={et.id}>{et.name}</option>
          ))}
        </Form.Select>
      </AdminToolbar>

      <AdminFieldError message={errorMessage} />

      {loading && (
        <div className="text-center py-5">
          <Spinner size="sm" className="me-2" />
          Đang tải...
        </div>
      )}

      {!loading && filteredResources.length === 0 && (
        <div className="text-center py-5 text-muted">Không có tài liệu nào.</div>
      )}

      {!loading && filteredResources.length > 0 && (
        <div className={cx('cardGrid')}>
          {filteredResources.map((r) => (
            <div key={r.resourceId} className={cx('resourceCard')}>
              <div className={cx('cardHeader')}>
                <h3 className={cx('cardTitle')}>{r.title}</h3>
                <div className={cx('cardActions')}>
                  <button onClick={() => openEditModal(r)} title="Sửa">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => setDeletingResource(r)} title="Xóa">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {r.description && (
                <p className={cx('cardDescription')}>{r.description}</p>
              )}

              {r.tags && r.tags.length > 0 && (
                <div className={cx('cardTags')}>
                  {r.tags.map((tag) => (
                    <Badge key={tag.tagId} bg="light" text="dark" className="border">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              )}

              {r.originalFileName && (
                <div className={cx('cardFileName')}>
                  {r.originalFileName}
                  {isMarkdownResource(r) && (
                    <span className={cx('fileTypeBadge')}>Markdown</span>
                  )}
                </div>
              )}

              <div className={cx('cardFooter')}>
                <span>{formatDate(r.createdAt)}</span>
                <div className={cx('footerActions')}>
                  <RecoveryResourceLink resource={r} className={cx('viewLink')}>
                    <ExternalLink size={14} /> Xem
                  </RecoveryResourceLink>
                  {r.url && (
                    <button
                      type="button"
                      className={cx('viewLink')}
                      onClick={() => handleDownload(r.url, r.originalFileName)}
                      title={isMarkdownResource(r) ? 'Tải file markdown gốc (dành cho quản trị)' : 'Tải về'}
                    >
                      <Download size={14} />
                      {isMarkdownResource(r) ? 'Tải file gốc' : 'Tải về'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <RecoveryResourceFormModal
        show={showFormModal}
        isEditing={Boolean(editingId)}
        formState={formState}
        availableTags={availableTags}
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
