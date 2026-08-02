import { useMemo, useState } from 'react';
import {Badge, Button, Form, Spinner} from 'react-bootstrap';
import {Edit, Plus, ShieldCheck, Trash2} from 'lucide-react';

import {useRoles} from '~/features/admin/access/hooks/useRoles';
import BaseModal from '~/shared/ui/modal/BaseModal';
import ModalActionFooter from '~/shared/ui/modal/ModalActionFooter';
import ConfirmDeleteModal from '~/shared/ui/modal/ConfirmDeleteModal';
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

function RolesManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [formState, setFormState] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [deletingRole, setDeletingRole] = useState(null);

  const [permRole, setPermRole] = useState(null);
  const [permSelected, setPermSelected] = useState(() => new Set());
  const [permSaving, setPermSaving] = useState(false);

  const {
    roleList,
    permissionCatalog,
    isLoading: loading,
    createRoleMutation,
    updateRoleMutation,
    deleteRoleMutation,
    updatePermissionsMutation,
  } = useRoles();

  const permissionGroups = useMemo(() => {
    const groups = new Map();
    permissionCatalog.forEach((permission) => {
      const groupName = permission.groupName || 'Khác';
      if (!groups.has(groupName)) {
        groups.set(groupName, []);
      }
      groups.get(groupName).push(permission);
    });
    return Array.from(groups.entries());
  }, [permissionCatalog]);

  const openPermissionModal = (role) => {
    setPermRole(role);
    setPermSelected(new Set(role.permissions || []));
  };

  const togglePermission = (code) => {
    setPermSelected((previous) => {
      const next = new Set(previous);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const toggleGroup = (codes, allChecked) => {
    setPermSelected((previous) => {
      const next = new Set(previous);
      codes.forEach((code) => (allChecked ? next.delete(code) : next.add(code)));
      return next;
    });
  };

  const handleSavePermissions = async () => {
    if (!permRole) {
      return;
    }
    setPermSaving(true);
    setErrorMessage('');
    try {
      const codes = Array.from(permSelected);
      await updatePermissionsMutation.mutateAsync({
        id: permRole.role_id,
        codes,
      });
      setPermRole(null);
    } catch (error) {
      setErrorMessage('Không thể lưu phân quyền.');
    } finally {
      setPermSaving(false);
    }
  };

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
        await updateRoleMutation.mutateAsync({id: editingRoleId, payload});
      } else {
        await createRoleMutation.mutateAsync(payload);
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
      await deleteRoleMutation.mutateAsync(deletingRole.role_id);
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
    {
      key: 'permissions',
      header: 'Số quyền',
      render: (role) => (
        <Badge bg={role.permissions?.length ? 'success' : 'secondary'}>
          {role.permissions?.length || 0}
        </Badge>
      ),
    },
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
            <button
              onClick={() => openPermissionModal(role)}
              title="Phân quyền"
            >
              <ShieldCheck size={14} />
            </button>
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
      <BaseModal
        show={Boolean(permRole)}
        onClose={() => {
          if (permSaving) {
            return;
          }
          setPermRole(null);
        }}
        title={`Phân quyền cho vai trò: ${permRole?.role_name || ''}`}
        maxWidth={680}
        footer={
          <ModalActionFooter
            onCancel={() => {
              if (permSaving) {
                return;
              }
              setPermRole(null);
            }}
            onSubmit={handleSavePermissions}
            cancelLabel="Hủy"
            submitLabel="Lưu phân quyền"
            loading={permSaving}
          />
        }
      >
        {permissionCatalog.length === 0 ? (
          <div className="d-flex align-items-center gap-2 text-muted">
            <Spinner animation="border" size="sm" /> Đang tải danh mục quyền...
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            <p className="text-muted mb-0">
              Tích vào hành động mà vai trò này được phép thực hiện.
            </p>
            {permissionGroups.map(([groupName, items]) => {
              const codes = items.map((item) => item.code);
              const allChecked = codes.every((code) => permSelected.has(code));
              return (
                <div key={groupName} className="border rounded p-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <strong>{groupName}</strong>
                    <Form.Check
                      type="checkbox"
                      id={`group-${groupName}`}
                      label="Chọn tất cả"
                      checked={allChecked}
                      onChange={() => toggleGroup(codes, allChecked)}
                    />
                  </div>
                  <div className="d-flex flex-column gap-2">
                    {items.map((permission) => (
                      <Form.Check
                        key={permission.code}
                        type="checkbox"
                        id={`perm-${permission.code}`}
                        checked={permSelected.has(permission.code)}
                        onChange={() => togglePermission(permission.code)}
                        label={
                          <span>
                            {permission.description || permission.code}{' '}
                            <code className="text-muted small">{permission.code}</code>
                          </span>
                        }
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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

export default RolesManagementPage;
