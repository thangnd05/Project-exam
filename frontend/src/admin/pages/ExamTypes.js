import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Badge, Button, Spinner} from 'react-bootstrap';
import {ChevronDown, ChevronRight, Edit, FolderTree, Library, Paintbrush, Plus, Trash2} from 'lucide-react';
import classNames from 'classnames/bind';

import routes from '~/shared/config/Routes';

import ConfirmDeleteModal from '~/shared/ui/modal/ConfirmDeleteModal';
import ExamTypeFormModal from '../modals/ExamTypeFormModal';
import {AdminFieldError, AdminPageHeader, AdminToolbar} from '../components/common';
import {useExamTypes} from './hooks/useExamTypes';

import styles from './QuestionCollections.module.scss';

const cx = classNames.bind(styles);

const emptyForm = {
  name: '',
  description: '',
  duration_minutes: '',
  scoring_method: 'DEFAULT',
  flexible: false,
  parent_id: '',
};

const mapExamTypeFromApi = (item) => ({
  exam_type_id: String(item.examTypeId),
  name: item.name || '',
  description: item.description || '',
  duration_minutes: item.durationMinutes ?? '',
  scoring_method: item.scoringMethod || 'DEFAULT',
  flexible: Boolean(item.flexible),
  parent_id: item.parentId ? String(item.parentId) : '',
  parent_name: item.parentName || '',
  child_count: typeof item.childCount === 'number' ? item.childCount : 0,
});

const buildExamTypePayload = (formState, {hasChildren} = {}) => {
  const durationValue = String(formState.duration_minutes).trim();
  const durationMinutes = durationValue ? Number(durationValue) : null;

  return {
    name: formState.name.trim(),
    description: formState.description.trim(),
    durationMinutes,
    scoringMethod: formState.scoring_method,
    flexible: Boolean(formState.flexible),

    parentId: hasChildren ? '' : (formState.parent_id || ''),
  };
};

function ExamTypeTreeNode({node, level, expandedIds, toggleExpand, onEdit, onEditLayout, onDelete, onAddChild, keyword}) {
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
    node.children.some(
      (c) => c.name.toLowerCase().includes(kw) || (c.description || '').toLowerCase().includes(kw),
    );

  if (kw && !matchesSearch && !childrenMatchSearch) return null;

  const nodeContent = (
    <>
      <div className={cx('treeNode')}>
        <div className={cx('treeNodeLeft')}>
          {hasChildren ? (
            <button className={cx('expandBtn')} onClick={() => toggleExpand(node.exam_type_id)}>
              {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
          ) : (
            <span className={cx('expandPlaceholder')} />
          )}
          <span className={cx('nodeIcon')}>
            {level === 0 ? <FolderTree size={16} /> : <Library size={15} />}
          </span>
          <span className={cx('collectionName', {root: level === 0})}>{node.name}</span>
          {hasChildren && <span className={cx('childCount')}>{node.children.length} loại con</span>}
          {node.flexible && <Badge bg="info">Linh hoạt</Badge>}
          <Badge bg="primary">{node.scoring_method}</Badge>
          {node.duration_minutes !== '' && node.duration_minutes != null && (
            <span className={cx('description')}>{node.duration_minutes} phút</span>
          )}
          {node.description && <span className={cx('description')}>— {node.description}</span>}
        </div>
        <div className={cx('treeNodeActions')}>
          {level === 0 && (
            <button className={cx('addBtn')} onClick={() => onAddChild(node)} title="Thêm loại con">
              <Plus size={16} />
            </button>
          )}
          <button onClick={() => onEditLayout(node)} title="Thiết kế giao diện làm bài">
            <Paintbrush size={16} />
          </button>
          <button onClick={() => onEdit(node)} title="Sửa">
            <Edit size={16} />
          </button>
          <button className={cx('deleteBtn')} onClick={() => onDelete(node)} title="Xóa">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      {hasChildren && (isExpanded || Boolean(kw)) && (
        <div className={cx('childrenWrapper')}>
          {node.children.map((child) => (
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
  const navigate = useNavigate();
  const {examTypeList, isLoading: loading, isError, createMutation, updateMutation, deleteMutation} =
    useExamTypes();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTypeId, setEditingTypeId] = useState(null);
  const [formState, setFormState] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [deletingExamType, setDeletingExamType] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());

  const examTypes = useMemo(() => examTypeList.map(mapExamTypeFromApi), [examTypeList]);

  useEffect(() => {
    setExpandedIds(new Set(examTypes.filter((t) => t.child_count > 0).map((t) => t.exam_type_id)));
  }, [examTypes]);

  const examTypeTree = useMemo(() => {
    const byId = new Map(examTypes.map((t) => [t.exam_type_id, t]));
    const childrenOf = new Map();
    const roots = [];
    examTypes.forEach((t) => {
      if (t.parent_id && byId.has(t.parent_id)) {
        if (!childrenOf.has(t.parent_id)) childrenOf.set(t.parent_id, []);
        childrenOf.get(t.parent_id).push(t);
      } else {
        roots.push(t);
      }
    });
    const byName = (a, b) => a.name.localeCompare(b.name);
    return roots
      .sort(byName)
      .map((root) => ({...root, children: (childrenOf.get(root.exam_type_id) || []).sort(byName)}));
  }, [examTypes]);

  const toggleExpand = useCallback((id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(
    () => setExpandedIds(new Set(examTypes.filter((t) => t.child_count > 0).map((t) => t.exam_type_id))),
    [examTypes],
  );
  const collapseAll = useCallback(() => setExpandedIds(new Set()), []);

  const parentOptions = useMemo(
    () => examTypes.filter((t) => !t.parent_id && t.exam_type_id !== editingTypeId),
    [examTypes, editingTypeId],
  );
  const editingHasChildren = useMemo(
    () => Boolean(editingTypeId) && examTypes.some((t) => t.parent_id === editingTypeId),
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

  const openCreateChildModal = (parent) => {
    resetForm();
    setFormState({...emptyForm, parent_id: parent.exam_type_id});
    setShowFormModal(true);
  };

  const openLayoutEditor = (examType) => {
    navigate(routes.adminExamTypeLayout.replace(':examTypeId', examType.exam_type_id));
  };

  const openEditModal = (examType) => {
    setEditingTypeId(examType.exam_type_id);
    setFormState({
      name: examType.name,
      description: examType.description || '',
      duration_minutes: examType.duration_minutes ?? '',
      scoring_method: examType.scoring_method || 'DEFAULT',
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
      setErrorMessage('Tên loại kỳ thi không được để trống.');
      return;
    }
    if (durationValue && (!Number.isFinite(parsedDuration) || parsedDuration <= 0)) {
      setErrorMessage('Thời lượng phải là số lớn hơn 0 hoặc để trống.');
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
        setExpandedIds((prev) => new Set(prev).add(payload.parentId));
      }
      setShowFormModal(false);
      resetForm();
    } catch (error) {
      setErrorMessage(
        error?.response?.data?.message || 'Không thể lưu loại kỳ thi. Vui lòng thử lại.',
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
        error?.response?.data?.message || 'Không thể xóa loại kỳ thi này.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const deleteMessage = deletingExamType?.child_count > 0
    ? `Loại "${deletingExamType?.name}" đang chứa ${deletingExamType.child_count} loại con — backend sẽ chặn xoá. Hãy xoá/tách loại con trước.`
    : `Bạn có chắc muốn xóa "${deletingExamType?.name || ''}" không?`;

  return (
    <div className="d-flex flex-column gap-3">
      <AdminPageHeader
        title="Quản lý loại kỳ thi"
        description='Cấu hình loại kỳ thi; hỗ trợ 2 cấp gom nhóm (vd "AWS" chứa các chứng chỉ con).'
      >
        <Button onClick={openCreateModal}>
          <Plus size={16} className="me-1" />
          Thêm loại kỳ thi
        </Button>
      </AdminPageHeader>

      <AdminToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Tìm theo tên, mô tả, phương thức chấm..."
      />
      <AdminFieldError
        message={errorMessage || (isError ? 'Không thể tải danh sách loại kỳ thi.' : '')}
      />

      <div className={cx('treeWrapper')}>
        <div className={cx('treeToolbar')}>
          <span className={cx('treeCount')}>{examTypes.length} loại kỳ thi</span>
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

        {!loading && examTypes.length === 0 && (
          <div className="text-center py-4 text-muted">Chưa có loại kỳ thi nào.</div>
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
          setFormState((previous) => ({...previous, [fieldName]: value}))
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
        title="Xác nhận xóa loại kỳ thi"
        message={deleteMessage}
      />
    </div>
  );
}

export default ExamTypesManagement;
