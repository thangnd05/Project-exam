import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Form, Button, Spinner} from 'react-bootstrap';
import {ChevronDown, ChevronRight, Edit, FolderTree, Library, Plus, Trash2} from 'lucide-react';
import classNames from 'classnames/bind';

import BaseModal from '~/components/common/modal/BaseModal';
import ModalActionFooter from '../../components/common/modal/ModalActionFooter';
import {
  createQuestionCollection,
  deleteQuestionCollection,
  getQuestionCollections,
  updateQuestionCollection,
} from '../../api/questionCollectionApi';
import ConfirmDeleteModal from '../../components/common/modal/ConfirmDeleteModal';
import {AdminFieldError, AdminPageHeader, AdminToolbar} from '../components/common';
import {getExamTypes} from '../../api/examTypeApi';
import styles from './QuestionCollections.module.scss';

const cx = classNames.bind(styles);

const defaultFormState = {
  name: '',
  description: '',
  parentId: '',
  examTypeId: '',
  displayOrder: '',
};

const mapCollectionFromApi = (collection) => ({
  collection_id: String(collection.collectionId),
  name: collection.name || '',
  description: collection.description || '',
  question_count: typeof collection.questionCount === 'number' ? collection.questionCount : 0,
  parent_id: collection.parentId ? String(collection.parentId) : '',
  parent_name: collection.parentName || '',
  child_count: typeof collection.childCount === 'number' ? collection.childCount : 0,
  total_question_count:
    typeof collection.totalQuestionCount === 'number'
      ? collection.totalQuestionCount
      : (typeof collection.questionCount === 'number' ? collection.questionCount : 0),
  exam_type_id: collection.examTypeId ? String(collection.examTypeId) : '',
  display_order: typeof collection.displayOrder === 'number' ? collection.displayOrder : null,
});

const extractApiErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback;

// ==================== Tree Node ====================
function CollectionTreeNode({node, level, expandedIds, toggleExpand, onEdit, onDelete, onAddChild, keyword, examTypeName}) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedIds.has(node.collection_id);
  const kw = keyword.trim().toLowerCase();
  const matchesSearch =
    !kw || node.name.toLowerCase().includes(kw) || (node.description || '').toLowerCase().includes(kw);
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
            <button className={cx('expandBtn')} onClick={() => toggleExpand(node.collection_id)}>
              {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
          ) : (
            <span className={cx('expandPlaceholder')} />
          )}
          <span className={cx('nodeIcon')}>
            {level === 0 ? <FolderTree size={16} /> : <Library size={15} />}
          </span>
          <span className={cx('collectionName', {root: level === 0})}>{node.name}</span>
          {level === 0 && node.exam_type_id && examTypeName(node.exam_type_id) && (
            <span className={cx('examTypeBadge')}>{examTypeName(node.exam_type_id)}</span>
          )}
          {hasChildren && (
            <span className={cx('childCount')}>{node.children.length} nhóm con</span>
          )}
          <span
            className={cx('questionCount', {empty: !node.question_count})}
            title="Số câu hỏi gắn trực tiếp vào nhóm này"
          >
            {node.question_count} câu
            {hasChildren && node.total_question_count > node.question_count
              ? ` · ${node.total_question_count} gộp con`
              : ''}
          </span>
          {node.description && <span className={cx('description')}>— {node.description}</span>}
        </div>
        <div className={cx('treeNodeActions')}>
          {level === 0 && (
            <button className={cx('addBtn')} onClick={() => onAddChild(node)} title="Thêm nhóm con">
              <Plus size={16} />
            </button>
          )}
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
            <CollectionTreeNode
              key={child.collection_id}
              node={child}
              level={level + 1}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              keyword={keyword}
              examTypeName={examTypeName}
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

// ==================== Main Page ====================
function QuestionCollectionsManagement() {
  const [collectionList, setCollectionList] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formState, setFormState] = useState(defaultFormState);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [examTypes, setExamTypes] = useState([]);

  const loadCollections = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await getQuestionCollections();
      const mapped = (Array.isArray(data) ? data : []).map(mapCollectionFromApi);
      setCollectionList(mapped);
      // Mặc định mở tất cả nhóm cha có con.
      setExpandedIds(new Set(mapped.filter((c) => c.child_count > 0).map((c) => c.collection_id)));
    } catch (error) {
      setErrorMessage(extractApiErrorMessage(error, 'Không thể tải danh sách bộ sưu tập.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  useEffect(() => {
    getExamTypes()
      .then((data) => setExamTypes(Array.isArray(data) ? data : (data?.data || data?.content || [])))
      .catch(() => setExamTypes([]));
  }, []);

  const examTypeName = useCallback(
    (id) => examTypes.find((t) => String(t.examTypeId) === String(id))?.name || '',
    [examTypes],
  );

  // Dựng cây 2 cấp từ danh sách phẳng.
  const collectionTree = useMemo(() => {
    const byId = new Map(collectionList.map((c) => [c.collection_id, c]));
    const childrenOf = new Map();
    const roots = [];
    collectionList.forEach((c) => {
      if (c.parent_id && byId.has(c.parent_id)) {
        if (!childrenOf.has(c.parent_id)) childrenOf.set(c.parent_id, []);
        childrenOf.get(c.parent_id).push(c);
      } else {
        roots.push(c);
      }
    });
    // Sắp theo vị trí (display_order) đặt tay trước; chưa đặt (null) xuống cuối và
    // sắp theo tên numeric-aware nên "ETS 2026 2" đứng trước "ETS 2026 10".
    const byOrder = (a, b) => {
      const ao = a.display_order == null ? Number.MAX_SAFE_INTEGER : a.display_order;
      const bo = b.display_order == null ? Number.MAX_SAFE_INTEGER : b.display_order;
      if (ao !== bo) return ao - bo;
      return a.name.localeCompare(b.name, 'vi', {numeric: true});
    };
    return roots
      .sort(byOrder)
      .map((root) => ({...root, children: (childrenOf.get(root.collection_id) || []).sort(byOrder)}));
  }, [collectionList]);

  const toggleExpand = useCallback((id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(
    () => setExpandedIds(new Set(collectionList.filter((c) => c.child_count > 0).map((c) => c.collection_id))),
    [collectionList],
  );
  const collapseAll = useCallback(() => setExpandedIds(new Set()), []);

  // Chỉ collection cấp 1 mới được chọn làm cha; loại chính nó khi đang sửa.
  const parentOptions = useMemo(
    () => collectionList.filter((c) => !c.parent_id && c.collection_id !== editingId),
    [collectionList, editingId],
  );
  const editingHasChildren = useMemo(
    () => Boolean(editingId) && collectionList.some((c) => c.parent_id === editingId),
    [collectionList, editingId],
  );

  const resetForm = () => {
    setFormState(defaultFormState);
    setEditingId(null);
    setErrorMessage('');
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openCreateChildModal = (parent) => {
    resetForm();
    // Con kế thừa examType của cha — set sẵn để hiển thị (BE cũng tự ép theo cha).
    setFormState({name: '', description: '', parentId: parent.collection_id, examTypeId: parent.exam_type_id || '', displayOrder: ''});
    setShowModal(true);
  };

  const openEditModal = (collection) => {
    setEditingId(collection.collection_id);
    setFormState({
      name: collection.name,
      description: collection.description || '',
      parentId: collection.parent_id || '',
      examTypeId: collection.exam_type_id || '',
      displayOrder: collection.display_order == null ? '' : String(collection.display_order),
    });
    setErrorMessage('');
    setShowModal(true);
  };

  const handleSubmit = async () => {
    const normalizedName = formState.name.trim();
    if (!normalizedName) {
      setErrorMessage('Tên bộ sưu tập không được để trống.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    try {
      // Luôn gửi parentId (chuỗi rỗng = gỡ cha / cấp 1) để backend cập nhật đúng.
      const payloadParentId = editingId && editingHasChildren ? '' : (formState.parentId || '');
      // Vị trí sắp xếp: để trống = null (không đặt / không đổi). Chỉ gửi số hợp lệ.
      const trimmedOrder = String(formState.displayOrder).trim();
      const parsedOrder = trimmedOrder === '' ? null : Number.parseInt(trimmedOrder, 10);
      const payload = {
        name: normalizedName,
        description: formState.description.trim(),
        parentId: payloadParentId,
        // examTypeId chỉ ý nghĩa với collection cha; con để BE tự kế thừa.
        examTypeId: payloadParentId ? '' : (formState.examTypeId || ''),
        displayOrder: Number.isNaN(parsedOrder) ? null : parsedOrder,
      };

      if (editingId) {
        await updateQuestionCollection(editingId, payload);
      } else {
        await createQuestionCollection(payload);
      }
      // Tải lại để số đếm gộp con-cháu và quan hệ cha-con luôn chính xác.
      await loadCollections();
      if (payload.parentId) {
        setExpandedIds((prev) => new Set(prev).add(payload.parentId));
      }
      setShowModal(false);
      resetForm();
    } catch (error) {
      setErrorMessage(extractApiErrorMessage(error, 'Không thể lưu bộ sưu tập.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setSubmitting(true);
    setErrorMessage('');
    try {
      await deleteQuestionCollection(deletingItem.collection_id);
      setDeletingItem(null);
      await loadCollections();
    } catch (error) {
      setErrorMessage(extractApiErrorMessage(error, 'Không thể xoá bộ sưu tập.'));
    } finally {
      setSubmitting(false);
    }
  };

  const deleteBlockReason = (() => {
    if (!deletingItem) return '';
    if (deletingItem.question_count > 0) {
      return `Bộ sưu tập "${deletingItem.name}" đang chứa ${deletingItem.question_count} câu hỏi — backend sẽ chặn xoá. Hãy bỏ liên kết các câu hỏi trước.`;
    }
    if (deletingItem.child_count > 0) {
      return `Bộ sưu tập "${deletingItem.name}" đang chứa ${deletingItem.child_count} nhóm con — backend sẽ chặn xoá. Hãy xoá/tách nhóm con trước.`;
    }
    return `Bạn có chắc muốn xóa "${deletingItem.name || ''}" không?`;
  })();

  return (
    <div className="d-flex flex-column gap-3">
      <AdminPageHeader
        title="Quản lý bộ sưu tập câu hỏi"
        description='Gom nhóm câu hỏi theo nguồn, hỗ trợ 2 cấp (vd "ETS 2026" chứa "ETS 2026 1").'
      >
        <Button onClick={openCreateModal}>
          <Plus size={16} className="me-1" />
          Thêm bộ sưu tập
        </Button>
      </AdminPageHeader>

      <AdminToolbar
        searchValue={keyword}
        onSearchChange={setKeyword}
        searchPlaceholder="Tìm theo tên bộ sưu tập hoặc mô tả..."
      />
      <AdminFieldError message={errorMessage} />

      <div className={cx('treeWrapper')}>
        <div className={cx('treeToolbar')}>
          <span className={cx('treeCount')}>{collectionList.length} bộ sưu tập</span>
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

        {!loading && collectionList.length === 0 && (
          <div className="text-center py-4 text-muted">Chưa có bộ sưu tập nào.</div>
        )}

        {!loading &&
          collectionTree.map((node) => (
            <CollectionTreeNode
              key={node.collection_id}
              node={node}
              level={0}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
              onEdit={openEditModal}
              onDelete={setDeletingItem}
              onAddChild={openCreateChildModal}
              keyword={keyword}
              examTypeName={examTypeName}
            />
          ))}
      </div>

      <BaseModal
        show={showModal}
        onClose={() => {
          if (submitting) return;
          setShowModal(false);
          resetForm();
        }}
        title={editingId ? 'Cập nhật bộ sưu tập' : 'Tạo bộ sưu tập'}
        footer={
          <ModalActionFooter
            onCancel={() => {
              if (submitting) return;
              setShowModal(false);
              resetForm();
            }}
            onSubmit={handleSubmit}
            cancelLabel="Hủy"
            submitLabel={editingId ? 'Lưu' : 'Tạo mới'}
            loadingLabel="Đang lưu..."
            loading={submitting}
          />
        }
      >
        <Form.Group className="mb-3">
          <Form.Label>Tên bộ sưu tập</Form.Label>
          <Form.Control
            value={formState.name}
            onChange={(event) => setFormState((prev) => ({...prev, name: event.target.value}))}
            placeholder="VD: ETS 2026, ETS 2026 1, Cambridge 16..."
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Vị trí sắp xếp (tùy chọn)</Form.Label>
          <Form.Control
            type="number"
            value={formState.displayOrder}
            onChange={(event) => setFormState((prev) => ({...prev, displayOrder: event.target.value}))}
            placeholder="VD: 1, 2, 3... (số nhỏ lên trước)"
          />
          <Form.Text muted>
            Đặt số để ghim thứ tự hiển thị. Để trống thì tự sắp theo tên (ví dụ "ETS 2026 2" đứng trước "ETS 2026 10").
          </Form.Text>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Thuộc nhóm cha (tùy chọn)</Form.Label>
          <Form.Select
            value={editingHasChildren ? '' : formState.parentId}
            disabled={editingHasChildren}
            onChange={(event) => setFormState((prev) => ({...prev, parentId: event.target.value}))}
          >
            <option value="">-- Không có (là nhóm cấp 1) --</option>
            {parentOptions.map((c) => (
              <option key={c.collection_id} value={c.collection_id}>
                {c.name}
              </option>
            ))}
          </Form.Select>
          <Form.Text muted>
            {editingHasChildren
              ? 'Nhóm này đang chứa nhóm con nên không thể trở thành nhóm con của bộ khác.'
              : 'Chọn nhóm cha để gom vào, ví dụ "ETS 2026" chứa "ETS 2026 1". Chỉ hỗ trợ 2 cấp.'}
          </Form.Text>
        </Form.Group>
        {/* examType chỉ gắn cho nhóm cấp 1; nhóm con tự kế thừa từ cha. */}
        {!(editingHasChildren ? false : Boolean(formState.parentId)) ? (
          <Form.Group className="mb-3">
            <Form.Label>Loại kỳ thi (cho bộ đề)</Form.Label>
            <Form.Select
              value={formState.examTypeId}
              onChange={(event) => setFormState((prev) => ({...prev, examTypeId: event.target.value}))}
            >
              <option value="">-- Chưa gắn loại kỳ thi --</option>
              {examTypes.map((t) => (
                <option key={t.examTypeId} value={t.examTypeId}>
                  {t.name}
                </option>
              ))}
            </Form.Select>
            <Form.Text muted>
              Gắn loại kỳ thi để bộ đề này xuất hiện như một folder ở trang "Khám phá bộ đề".
            </Form.Text>
          </Form.Group>
        ) : (
          <Form.Group className="mb-3">
            <Form.Label>Loại kỳ thi</Form.Label>
            <Form.Control plaintext readOnly value={examTypeName(formState.examTypeId) || 'Kế thừa từ nhóm cha'} />
          </Form.Group>
        )}
        <Form.Group>
          <Form.Label>Mô tả</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={formState.description}
            onChange={(event) => setFormState((prev) => ({...prev, description: event.target.value}))}
            placeholder="Mô tả ngắn về bộ sưu tập (tùy chọn)"
          />
        </Form.Group>
        <AdminFieldError message={errorMessage} />
      </BaseModal>

      <ConfirmDeleteModal
        show={Boolean(deletingItem)}
        onClose={() => {
          if (submitting) return;
          setDeletingItem(null);
        }}
        onConfirm={handleDelete}
        title="Xác nhận xóa bộ sưu tập"
        message={deleteBlockReason}
      />
    </div>
  );
}

export default QuestionCollectionsManagement;
