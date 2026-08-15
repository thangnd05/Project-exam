'use client';

import { useMemo, useState } from 'react';
import {Button, Form} from 'react-bootstrap';
import {Edit, Plus, Trash2} from 'lucide-react';

import {useSkills, type SkillItem} from './_hooks/useSkills';
import BaseModal from '@/app/components/modal/BaseModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';
import ConfirmDeleteModal from '@/app/components/modal/ConfirmDeleteModal';
import {
  AdminFieldError,
  AdminPageHeader,
  AdminTable,
  AdminToolbar,
} from '@/app/components/admin/common';

const defaultFormState = {
  name: '',
  description: '',
};

function SkillsManagement() {
  const {
    skillList,
    isLoading: loading,
    isError,
    createSkill,
    updateSkill,
    deleteSkill,
  } = useSkills();
  const [keyword, setKeyword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [formState, setFormState] = useState(defaultFormState);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingSkill, setDeletingSkill] = useState<SkillItem | null>(null);

  const displayError =
    errorMessage || (isError ? 'Không thể tải danh sách kỹ năng.' : '');

  const filteredSkills = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) {
      return skillList;
    }
    return skillList.filter((skill) => {
      return (
        skill.name.toLowerCase().includes(normalizedKeyword) ||
        (skill.description || '').toLowerCase().includes(normalizedKeyword)
      );
    });
  }, [skillList, keyword]);

  const resetForm = () => {
    setFormState(defaultFormState);
    setEditingSkillId(null);
    setErrorMessage('');
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (skill: SkillItem) => {
    setEditingSkillId(skill.skill_id);
    setFormState({
      name: skill.name,
      description: skill.description || '',
    });
    setErrorMessage('');
    setShowModal(true);
  };

  const hasDuplicateSkillName = (skillName: string) => {
    const normalizedName = skillName.trim().toLowerCase();
    return skillList.some((skill) => {
      if (editingSkillId && skill.skill_id === editingSkillId) {
        return false;
      }
      return skill.name.trim().toLowerCase() === normalizedName;
    });
  };

  const handleSubmit = async () => {
    const normalizedName = formState.name.trim();
    if (!normalizedName) {
      setErrorMessage('Tên kỹ năng không được để trống.');
      return;
    }

    if (hasDuplicateSkillName(normalizedName)) {
      setErrorMessage('Tên kỹ năng đã tồn tại, vui lòng chọn tên khác.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    try {
      const payload = {
        name: normalizedName,
        description: formState.description.trim(),
      };

      if (editingSkillId) {
        await updateSkill({skillId: editingSkillId, payload});
      } else {
        await createSkill(payload);
      }

      setShowModal(false);
      resetForm();
    } catch (error) {
      setErrorMessage('Không thể lưu kỹ năng. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingSkill) {
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    try {
      await deleteSkill(deletingSkill.skill_id);
      setDeletingSkill(null);
    } catch (error) {
      setErrorMessage('Không thể xóa kỹ năng.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {key: 'name', header: 'Tên kỹ năng'},
    {key: 'description', header: 'Mô tả', render: (skill: SkillItem) => skill.description || '-'},
  ];

  return (
    <div className="d-flex flex-column gap-3">
      <AdminPageHeader
        title="Quản lý kỹ năng"
        description="Quản lý danh mục kỹ năng dùng cho phần thi và quy đổi điểm."
      >
        <Button onClick={openCreateModal}>
          <Plus size={16} className="me-1" />
          Thêm kỹ năng
        </Button>
      </AdminPageHeader>

      <AdminToolbar
        searchValue={keyword}
        onSearchChange={setKeyword}
        searchPlaceholder="Tìm theo tên kỹ năng hoặc mô tả..."
      />
      <AdminFieldError message={displayError} />

      <AdminTable
        showIndex
        paginated
        itemLabel="kỹ năng"
        columns={columns}
        data={filteredSkills}
        loading={loading}
        getRowKey={(skill: SkillItem) => skill.skill_id}
        rowActions={(skill: SkillItem) => (
          <>
            <button title="Sửa" onClick={() => openEditModal(skill)}>
              <Edit size={14} />
            </button>
            <button
              className="danger"
              title="Xóa"
              onClick={() => setDeletingSkill(skill)}
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      />

      <BaseModal
        show={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingSkillId ? 'Cập nhật kỹ năng' : 'Tạo kỹ năng'}
        maxWidth={550}
        footer={
          <ModalActionFooter
            onCancel={() => {
              if (submitting) {
                return;
              }
              setShowModal(false);
              resetForm();
            }}
            onSubmit={handleSubmit}
            cancelLabel="Hủy"
            submitLabel={editingSkillId ? 'Lưu' : 'Tạo mới'}
            loading={submitting}
          />
        }
      >
        <Form.Group className="mb-3">
          <Form.Label>Tên kỹ năng</Form.Label>
          <Form.Control
            value={formState.name}
            onChange={(event) =>
              setFormState((previous) => ({...previous, name: event.target.value}))
            }
          />
        </Form.Group>
        <Form.Group>
          <Form.Label>Mô tả</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={formState.description}
            onChange={(event) =>
              setFormState((previous) => ({
                ...previous,
                description: event.target.value,
              }))
            }
          />
        </Form.Group>
        <AdminFieldError message={errorMessage} />
      </BaseModal>
      <ConfirmDeleteModal
        show={Boolean(deletingSkill)}
        onClose={() => {
          if (submitting) {
            return;
          }
          setDeletingSkill(null);
        }}
        onConfirm={handleDelete}
        title="Xác nhận xóa kỹ năng"
        message={`Bạn có chắc muốn xóa "${deletingSkill?.name || ''}" không?`}
      />
    </div>
  );
}

export default SkillsManagement;
