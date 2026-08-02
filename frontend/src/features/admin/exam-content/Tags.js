import { useCallback, useEffect, useMemo, useState } from 'react';
import {Button, Form, Spinner} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {ChevronDown, ChevronRight, Edit, Plus, Trash2} from 'lucide-react';

import ConfirmDeleteModal from '~/shared/ui/modal/ConfirmDeleteModal';
import TagFormModal from '../modals/TagFormModal';
import {AdminFieldError, AdminPageHeader, AdminToolbar} from '../components/common';
import {useAdminExamTypesForTags, useTagTree, useTags} from '~/features/admin/exam-content/hooks/useTags';
import styles from './Tags.module.scss';

const cx = classNames.bind(styles);

const emptyForm = {name: '', parentId: null, examTypeId: '', sortOrder: null};

function TagTreeNode({tag, flatTags, level, expandedIds, toggleExpand, onEdit, onDelete, onAddChild, searchTerm}) {
  const hasChildren = tag.children && tag.children.length > 0;
  const isExpanded = expandedIds.has(tag.tagId);
  const keyword = searchTerm.trim().toLowerCase();
  const matchesSearch = !keyword || tag.name.toLowerCase().includes(keyword);
  const childrenMatchSearch = hasChildren && tag.children.some(function checkMatch(c) {
    if (c.name.toLowerCase().includes(keyword)) return true;
    return c.children?.some(checkMatch) || false;
  });

  if (keyword && !matchesSearch && !childrenMatchSearch) return null;

  const nodeContent = (
    <>
      <div className={cx('treeNode', {childConnector: level > 0})}>
        <div className={cx('treeNodeLeft')}>
          {hasChildren ? (
            <button
              className={cx('expandBtn')}
              onClick={() => toggleExpand(tag.tagId)}
            >
              {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
          ) : (
            <span className={cx('expandPlaceholder')} />
          )}
          <span className={cx('tagName', {root: level === 0})}>
            {tag.name}
          </span>
          {hasChildren && (
            <span className={cx('childCount')}>{tag.children.length}</span>
          )}
        </div>
        <div className={cx('treeNodeActions')}>
          <button onClick={() => onAddChild(tag)} title="Thêm tag con">
            <Plus size={16} />
          </button>
          <button onClick={() => onEdit(tag)} title="Sửa">
            <Edit size={16} />
          </button>
          <button onClick={() => onDelete(tag)} title="Xóa">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      {hasChildren && isExpanded && (
        <div className={cx('childrenWrapper')}>
          {tag.children.map((child) => (
            <TagTreeNode
              key={child.tagId}
              tag={child}
              flatTags={flatTags}
              level={level + 1}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              searchTerm={searchTerm}
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

function TagsManagement() {
  const [selectedExamTypeId, setSelectedExamTypeId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTagId, setEditingTagId] = useState(null);
  const [formState, setFormState] = useState(emptyForm);
  const [errorMessage, setErrorMessage] = useState('');
  const [deletingTag, setDeletingTag] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [preserveExpandedOnRefetch, setPreserveExpandedOnRefetch] = useState(false);

  const examTypesQuery = useAdminExamTypesForTags();
  const examTypes = examTypesQuery.data ?? [];

  const {
    tagTree,
    flatTags,
    isLoading: loading,
    isError: tagLoadError,
    refetch: refetchTags,
  } = useTagTree(selectedExamTypeId);

  const {createMutation, updateMutation, deleteMutation} = useTags();
  const submitting =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  useEffect(() => {
    if (examTypes.length > 0 && !selectedExamTypeId) {
      setSelectedExamTypeId(examTypes[0].id);
    }
  }, [examTypes, selectedExamTypeId]);

  useEffect(() => {
    if (tagLoadError) {
      setErrorMessage('Không thể tải danh sách tag.');
    }
  }, [tagLoadError]);

  useEffect(() => {
    if (preserveExpandedOnRefetch || tagTree.length === 0) return;
    setExpandedIds(new Set(tagTree.map((t) => t.tagId)));
  }, [tagTree, preserveExpandedOnRefetch]);

  const fetchTags = useCallback(async (examTypeIdOverride, {preserveExpanded = false} = {}) => {
    const examTypeId = examTypeIdOverride || selectedExamTypeId;
    if (!examTypeId) return;
    setPreserveExpandedOnRefetch(preserveExpanded);
    setErrorMessage('');
    await refetchTags();
    setPreserveExpandedOnRefetch(false);
  }, [refetchTags, selectedExamTypeId]);

  const toggleExpand = useCallback((tagId) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const allIds = new Set();
    const collect = (nodes) => {
      for (const n of nodes) {
        if (n.children?.length > 0) {
          allIds.add(n.tagId);
          collect(n.children);
        }
      }
    };
    collect(tagTree);
    setExpandedIds(allIds);
  }, [tagTree]);

  const collapseAll = useCallback(() => setExpandedIds(new Set()), []);

  const parentOptions = useMemo(
    () => flatTags.filter((t) => t.tagId !== editingTagId),
    [flatTags, editingTagId],
  );

  const resetForm = () => {
    setFormState(emptyForm);
    setEditingTagId(null);
    setErrorMessage('');
  };

  const openCreateModal = () => {
    resetForm();
    setFormState((prev) => ({...prev, examTypeId: selectedExamTypeId}));
    setShowFormModal(true);
  };

  const openCreateChildModal = (parentTag) => {
    resetForm();
    setFormState({
      name: '',
      parentId: parentTag.tagId,
      examTypeId: parentTag.examTypeId || selectedExamTypeId,
      sortOrder: null,
    });
    setShowFormModal(true);
  };

  const openEditModal = (tag) => {
    setEditingTagId(tag.tagId);
    setFormState({
      name: tag.name,
      parentId: tag.parentId || null,
      examTypeId: tag.examTypeId || selectedExamTypeId,
      sortOrder: tag.sortOrder ?? null,
    });
    setShowFormModal(true);
  };

  const handleSubmit = () => {
    const examTypeId = formState.examTypeId || selectedExamTypeId;
    if (!examTypeId) {
      setErrorMessage('Vui lòng chọn loại kỳ thi.');
      return;
    }
    if (!formState.name.trim()) {
      setErrorMessage('Tên tag không được để trống.');
      return;
    }
    setErrorMessage('');
    const payload = {
      name: formState.name.trim(),
      examTypeId,
      parentId: formState.parentId || null,
      sortOrder: formState.sortOrder ?? null,
    };

    const onSuccess = (savedTag) => {
      const targetExamTypeId = savedTag?.examTypeId || examTypeId;
      if (targetExamTypeId !== selectedExamTypeId) {
        setSelectedExamTypeId(targetExamTypeId);
      }
      setSearchTerm('');
      setShowFormModal(false);
      resetForm();
      fetchTags(targetExamTypeId, {preserveExpanded: true});
      if (savedTag?.tagId) {
        setExpandedIds((previous) => {
          const next = new Set(previous);
          next.add(savedTag.tagId);
          if (savedTag.parentId) {
            next.add(savedTag.parentId);
          }
          return next;
        });
      }
    };
    const onError = (error) => {
      const apiMessage = error?.response?.data?.message;
      setErrorMessage(apiMessage || 'Không thể lưu tag. Vui lòng thử lại.');
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
      onSuccess: () => {
        setDeletingTag(null);
        fetchTags(undefined, {preserveExpanded: true});
      },
      onError: () => setErrorMessage('Không thể xóa tag này.'),
    });
  };

  return (
    <div className="d-flex flex-column gap-3">
      <AdminPageHeader
        title="Quản lý Tag câu hỏi"
        description="Phân loại câu hỏi theo chủ đề, kỹ năng chi tiết."
      >
        <Button onClick={openCreateModal} disabled={!selectedExamTypeId}>
          <Plus size={16} className="me-1" />
          Thêm Tag
        </Button>
      </AdminPageHeader>

      <AdminToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Tìm theo tên tag..."
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

      <AdminFieldError message={errorMessage} />

      <div className={cx('treeWrapper')}>
        <div className={cx('treeToolbar')}>
          <span className={cx('treeCount')}>{flatTags.length} tags</span>
          <div className={cx('treeToolbarActions')}>
            <button onClick={expandAll}>Mở tất cả</button>
            <button onClick={collapseAll}>Thu gọn</button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-4">
            <Spinner size="sm" className="me-2" />
            Đang tải...
          </div>
        )}

        {!loading && flatTags.length === 0 && (
          <div className="text-center py-4 text-muted">
            Không có tag nào.
          </div>
        )}

        {!loading && flatTags.length > 0 && tagTree.length === 0 && (
          <div className="text-center py-4 text-muted">
            Có {flatTags.length} tag nhưng không hiển thị được cây. Kiểm tra tag cha hợp lệ.
          </div>
        )}

        {!loading &&
          tagTree.map((tag) => (
            <TagTreeNode
              key={tag.tagId}
              tag={tag}
              flatTags={flatTags}
              level={0}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
              onEdit={openEditModal}
              onDelete={setDeletingTag}
              onAddChild={openCreateChildModal}
              searchTerm={searchTerm}
            />
          ))}
      </div>

      <TagFormModal
        show={showFormModal}
        isEditing={Boolean(editingTagId)}
        formState={formState}
        examTypes={examTypes}
        parentOptions={parentOptions}
        onChangeField={(field, value) =>
          setFormState((prev) => ({...prev, [field]: value}))
        }
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
        title="Xác nhận xóa Tag"
        message={`Bạn có chắc muốn xóa tag "${deletingTag?.name || ''}" không? Tất cả tag con cũng sẽ bị xóa.`}
      />
    </div>
  );
}

export default TagsManagement;
