import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Badge, Button, Form} from 'react-bootstrap';
import {Edit, Plus, Trash2} from 'lucide-react';

import {createRole, deleteRole, getRoles, updateRole} from '../../api/roleApi';
import BaseModal from '~/components/common/modal/BaseModal';
import ModalActionFooter from '../../components/common/modal/ModalActionFooter';
import ConfirmDeleteModal from '../../components/common/modal/ConfirmDeleteModal';
import {
  AdminFieldError,
  AdminPageHeader,
  AdminTable,
  AdminToolbar,
} from '../components/common';

const emptyForm = {
  role_name: '',
  description: '',
};

function RolesManagement() {
  const [roleList, setRoleList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [formState, setFormState] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [deletingRole, setDeletingRole] = useState(null);

  const mapRoleFromApi = (role) => ({
    role_id: String(role.roleId),
    role_name: role.roleName || '',
    description: role.description || '',
  });

  const loadRoles = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const roleData = await getRoles();
      setRoleList(roleData.map(mapRoleFromApi));
    } catch (error) {
      setErrorMessage('Không thể tải danh sách vai trò.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const filteredRoles = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) {
      return roleList;
    }
    return roleList.filter((role) => {
      return (
        role.role_name.toLowerCase().includes(keyword) ||
        (role.description || '').toLowerCase().includes(keyword)
      );
    });
  }, [roleList, searchTerm]);

  const resetForm = () => {
    setEditingRoleId(null);
    setFormState(emptyForm);
  };

  const openCreateModal = () => {
    resetForm();
    setShowFormModal(true);
  };

  const openEditModal = (role) => {
    setEditingRoleId(role.role_id);
    setFormState({
      role_name: role.role_name,
      description: role.description || '',
    });
    setShowFormModal(true);
  };

  const handleSubmit = async () => {
    const normalizedRoleName = formState.role_name.trim().toUpperCase();
    const normalizedDescription = formState.description.trim();
    if (!normalizedRoleName) {
      setErrorMessage('Tên vai trò không được để trống.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    try {
      const payload = {
        roleName: normalizedRoleName,
        description: normalizedDescription,
      };

      if (editingRoleId) {
        const updatedRole = await updateRole(editingRoleId, payload);
        setRoleList((previous) =>
          previous.map((role) =>
            role.role_id === editingRoleId ? mapRoleFromApi(updatedRole) : role,
          ),
        );
      } else {
        const createdRole = await createRole(payload);
        setRoleList((previous) => [...previous, mapRoleFromApi(createdRole)]);
      }

      setShowFormModal(false);
      resetForm();
    } catch (error) {
      setErrorMessage('Không thể lưu vai trò.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingRole) {
      return;
    }
    setSubmitting(true);
    setErrorMessage('');
    try {
      await deleteRole(deletingRole.role_id);
      setRoleList((previous) =>
        previous.filter((role) => role.role_id !== deletingRole.role_id),
      );
      setDeletingRole(null);
    } catch (error) {
      setErrorMessage('Không thể xóa vai trò.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'role_name',
      header: 'Tên vai trò',
      render: (role) => <Badge bg="primary">{role.role_name}</Badge>,
    },
    {key: 'description', header: 'Mô tả', render: (role) => role.description || '-'},
  ];

  return (
    <div className="d-flex flex-column gap-3">
      <AdminPageHeader
        title="Quản lý vai trò"
        description="Quản lý quyền hệ thống cho tài khoản người dùng."
      >
        <Button onClick={openCreateModal}>
          <Plus size={16} className="me-1" />
          Thêm vai trò
        </Button>
      </AdminPageHeader>

      <AdminToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Tìm theo tên vai trò hoặc mô tả..."
      />
      <AdminFieldError message={errorMessage} />

      <AdminTable
        showIndex
        paginated
        itemLabel="vai trò"
        columns={columns}
        data={filteredRoles}
        loading={loading}
        getRowKey={(role) => role.role_id}
        rowActions={(role) => (
          <>
            <button onClick={() => openEditModal(role)} title="Sửa vai trò">
              <Edit size={14} />
            </button>
            <button
              className="danger"
              onClick={() => setDeletingRole(role)}
              title="Xóa vai trò"
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      />

      <BaseModal
        show={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          resetForm();
        }}
        title={editingRoleId ? 'Cập nhật vai trò' : 'Tạo vai trò'}
        maxWidth={550}
        footer={
          <ModalActionFooter
            onCancel={() => {
              if (submitting) {
                return;
              }
              setShowFormModal(false);
              resetForm();
            }}
            onSubmit={handleSubmit}
            cancelLabel="Hủy"
            submitLabel={editingRoleId ? 'Lưu' : 'Tạo mới'}
            loading={submitting}
          />
        }
      >
        <Form.Group className="mb-3">
          <Form.Label>Tên vai trò</Form.Label>
          <Form.Control
            value={formState.role_name}
            onChange={(event) =>
              setFormState((previous) => ({
                ...previous,
                role_name: event.target.value,
              }))
            }
            placeholder="Ví dụ: ADMIN, TEACHER"
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
      </BaseModal>
      <ConfirmDeleteModal
        show={Boolean(deletingRole)}
        onClose={() => {
          if (submitting) {
            return;
          }
          setDeletingRole(null);
        }}
        onConfirm={handleDelete}
        title="Xác nhận xóa vai trò"
        message={`Bạn có chắc muốn xóa "${deletingRole?.role_name || ''}" không?`}
      />
    </div>
  );
}

export default RolesManagement;
