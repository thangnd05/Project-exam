import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Badge, Button, Form, Spinner} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {Edit, ExternalLink, FileText, Film, Link2, Plus, Search, Trash2} from 'lucide-react';

import {getExamTypes} from '../../api/examTypeApi';
import {getTagsFlatByExamType} from '../../api/tagApi';
import {
  getAllResources,
  createResource,
  updateResource,
  deleteResource,
} from '../../api/recoveryResourceApi';
import ConfirmDeleteModal from '../../components/modals/ConfirmDeleteModal';
import RecoveryResourceFormModal from '../../components/modals/RecoveryResourceFormModal';
import styles from './RecoveryResources.module.scss';

const cx = classNames.bind(styles);

const emptyForm = {
  title: '',
  description: '',
  resourceType: 'LINK',
  url: '',
  tagIds: [],
};

const TYPE_ICON = {
  VIDEO: <Film size={16} />,
  DOCUMENT: <FileText size={16} />,
  LINK: <Link2 size={16} />,
};

const TYPE_LABEL = {
  VIDEO: 'Video',
  DOCUMENT: 'Tài liệu',
  LINK: 'Link',
};

function RecoveryResourcesManagement() {
  const [resources, setResources] = useState([]);
  const [examTypes, setExamTypes] = useState([]);
  const [selectedExamTypeId, setSelectedExamTypeId] = useState('');
  const [availableTags, setAvailableTags] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formState, setFormState] = useState(emptyForm);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [deletingResource, setDeletingResource] = useState(null);

  // Load exam types
  useEffect(() => {
    getExamTypes()
      .then((list) => {
        const mapped = list.map((item) => ({id: item.examTypeId, name: item.name}));
        setExamTypes(mapped);
        if (mapped.length > 0) setSelectedExamTypeId(mapped[0].id);
      })
      .catch(() => {});
  }, []);

  // Load tags khi đổi exam type
  useEffect(() => {
    if (!selectedExamTypeId) { setAvailableTags([]); return; }
    getTagsFlatByExamType(selectedExamTypeId)
      .then((tags) => setAvailableTags(Array.isArray(tags) ? tags : []))
      .catch(() => setAvailableTags([]));
  }, [selectedExamTypeId]);

  // Load resources
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

  // Filter
  const filteredResources = useMemo(() => {
    let list = resources;
    if (filterType) {
      list = list.filter((r) => r.resourceType === filterType);
    }
    const keyword = searchTerm.trim().toLowerCase();
    if (keyword) {
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(keyword) ||
          (r.description || '').toLowerCase().includes(keyword) ||
          (r.tags || []).some((t) => t.name.toLowerCase().includes(keyword)),
      );
    }
    return list;
  }, [resources, filterType, searchTerm]);

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
      resourceType: resource.resourceType,
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
    if (formState.resourceType !== 'LINK' && !selectedFile && !formState.url.trim()) {
      if (!editingId) {
        setErrorMessage('Vui lòng upload file hoặc cung cấp URL.');
        return;
      }
    }
    setSubmitting(true);
    setErrorMessage('');
    try {
      const payload = {
        title: formState.title.trim(),
        description: formState.description.trim(),
        resourceType: formState.resourceType,
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

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  return (
    <div className={cx('resourcesPage')}>
      <div className={cx('pageHeader')}>
        <div>
          <h1>Kho tài liệu ôn tập</h1>
          <p>Quản lý bài giảng, video, tài liệu gắn với các Tag kiến thức.</p>
        </div>
        <Button onClick={openCreateModal} className={cx('createBtn')}>
          <Plus size={16} />
          Thêm tài liệu
        </Button>
      </div>

      <div className={cx('filterBar')}>
        <Form.Select
          style={{maxWidth: 200}}
          value={selectedExamTypeId}
          onChange={(e) => setSelectedExamTypeId(e.target.value)}
        >
          {examTypes.map((et) => (
            <option key={et.id} value={et.id}>{et.name}</option>
          ))}
        </Form.Select>
        <Form.Select
          style={{maxWidth: 180}}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">Tất cả loại</option>
          <option value="VIDEO">Video</option>
          <option value="DOCUMENT">Tài liệu</option>
          <option value="LINK">Link</option>
        </Form.Select>
        <div className={cx('searchBox')}>
          <Search size={16} className={cx('searchIcon')} />
          <Form.Control
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tiêu đề, mô tả, tag..."
          />
        </div>
      </div>

      {errorMessage && <p className={cx('errorText')}>{errorMessage}</p>}

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

              <div className={cx('cardMeta')}>
                <Badge bg="info" className="d-inline-flex align-items-center gap-1">
                  {TYPE_ICON[r.resourceType]} {TYPE_LABEL[r.resourceType]}
                </Badge>
              </div>

              {r.tags && r.tags.length > 0 && (
                <div className={cx('cardTags')}>
                  {r.tags.map((tag) => (
                    <Badge key={tag.tagId} bg="light" text="dark" className="border">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              )}

              <div className={cx('cardFooter')}>
                <span>{formatDate(r.createdAt)}</span>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className={cx('viewLink')}
                >
                  Mở tài liệu <ExternalLink size={14} />
                </a>
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
