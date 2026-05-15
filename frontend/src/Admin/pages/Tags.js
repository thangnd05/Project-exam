import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Badge, Button, Form, Spinner, Table} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {ChevronRight, Edit, Plus, Search, Trash2} from 'lucide-react';

import {getExamTypes} from '../../api/examTypeApi';
import {
  getTagTreeByExamType,
  getTagsFlatByExamType,
  createTag,
  updateTag,
  deleteTag,
} from '../../api/tagApi';
import ConfirmDeleteModal from '../../components/modals/ConfirmDeleteModal';
import TagFormModal from '../../components/modals/TagFormModal';
import styles from './Tags.module.scss';

const cx = classNames.bind(styles);

const emptyForm = {name: '', parentId: null, examTypeId: ''};

/**
 * Flatten cây tag thành danh sách phẳng kèm level (để render thụt đầu dòng).
 */
function flattenTree(nodes, level = 0) {
  const result = [];
  for (const node of nodes) {
    result.push({...node, level});
    if (node.children && node.children.length > 0) {
      result.push(...flattenTree(node.children, level + 1));
    }
  }
  return result;
}

function TagsManagement() {
  const [examTypes, setExamTypes] = useState([]);
  const [selectedExamTypeId, setSelectedExamTypeId] = useState('');
  const [tagTree, setTagTree] = useState([]);
  const [flatTags, setFlatTags] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTagId, setEditingTagId] = useState(null);
  const [formState, setFormState] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [deletingTag, setDeletingTag] = useState(null);

  // Lấy danh sách exam types
  useEffect(() => {
    getExamTypes()
      .then((list) => {
        const mapped = list.map((item) => ({
          id: item.examTypeId,
          name: item.name,
        }));
        setExamTypes(mapped);
        if (mapped.length > 0) {
          setSelectedExamTypeId(mapped[0].id);
        }
      })
      .catch(() => {});
  }, []);

  // Lấy tags khi đổi exam type
  const fetchTags = useCallback(async () => {
    if (!selectedExamTypeId) return;
    setLoading(true);
    setErrorMessage('');
    try {
      const [tree, flat] = await Promise.all([
        getTagTreeByExamType(selectedExamTypeId),
        getTagsFlatByExamType(selectedExamTypeId),
      ]);
      setTagTree(tree);
      setFlatTags(flat);
    } catch {
      setErrorMessage('Không thể tải danh sách tag.');
    } finally {
      setLoading(false);
    }
  }, [selectedExamTypeId]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  // Flatten tree để render table
  const flattenedRows = useMemo(() => flattenTree(tagTree), [tagTree]);

  // Filter theo search
  const filteredRows = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return flattenedRows;
    return flattenedRows.filter((tag) => tag.name.toLowerCase().includes(keyword));
  }, [flattenedRows, searchTerm]);

  // Parent options cho form (flat list, loại trừ tag đang edit)
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

  const openEditModal = (tag) => {
    setEditingTagId(tag.tagId);
    setFormState({
      name: tag.name,
      parentId: tag.parentId || null,
      examTypeId: tag.examTypeId || selectedExamTypeId,
    });
    setShowFormModal(true);
  };

  const handleSubmit = async () => {
    if (!formState.name.trim()) {
      setErrorMessage('Tên tag không được để trống.');
      return;
    }
    setSubmitting(true);
    setErrorMessage('');
    try {
      const payload = {
        name: formState.name.trim(),
        examTypeId: formState.examTypeId || selectedExamTypeId,
        parentId: formState.parentId || null,
      };
      if (editingTagId) {
        await updateTag(editingTagId, payload);
      } else {
        await createTag(payload);
      }
      setShowFormModal(false);
      resetForm();
      await fetchTags();
    } catch {
      setErrorMessage('Không thể lưu tag. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTag) return;
    setSubmitting(true);
    setErrorMessage('');
    try {
      await deleteTag(deletingTag.tagId);
      setDeletingTag(null);
      await fetchTags();
    } catch {
      setErrorMessage('Không thể xóa tag này.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={cx('tagsPage')}>
      <div className={cx('pageHeader')}>
        <div>
          <h1>Quản lý Tag câu hỏi</h1>
          <p>Phân loại câu hỏi theo chủ đề, kỹ năng chi tiết.</p>
        </div>
        <Button
          onClick={openCreateModal}
          className={cx('createBtn')}
          disabled={!selectedExamTypeId}
        >
          <Plus size={16} />
          Thêm Tag
        </Button>
      </div>

      <div className={cx('filterBar')}>
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
        <div className={cx('searchBox')}>
          <Search size={16} className={cx('searchIcon')} />
          <Form.Control
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên tag..."
          />
        </div>
      </div>

      {errorMessage && <p className={cx('errorText')}>{errorMessage}</p>}

      <div className={cx('tableWrapper')}>
        <Table responsive hover>
          <thead>
            <tr>
              <th>Tên Tag</th>
              <th>Tag cha</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={3} className="text-center py-4">
                  <Spinner size="sm" className="me-2" />
                  Đang tải...
                </td>
              </tr>
            )}
            {!loading &&
              filteredRows.map((tag) => (
                <tr key={tag.tagId} className={cx({childRow: tag.level > 0})}>
                  <td>
                    {tag.level > 0 && (
                      <span className={cx('indent')}>
                        {'  '.repeat(tag.level)}
                        <ChevronRight size={14} />
                      </span>
                    )}
                    {tag.name}
                  </td>
                  <td>
                    {tag.parentId ? (
                      <Badge bg="secondary">
                        {flatTags.find((t) => t.tagId === tag.parentId)?.name || tag.parentId}
                      </Badge>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    <div className={cx('actions')}>
                      <button onClick={() => openEditModal(tag)} title="Sửa">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => setDeletingTag(tag)} title="Xóa">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            {!loading && filteredRows.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center py-4">
                  Không có tag nào.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
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
