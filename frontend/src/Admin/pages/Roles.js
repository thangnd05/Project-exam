import React, {useEffect, useMemo, useState} from 'react';
import {Badge, Button, Form, Modal, Spinner, Table} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {Edit, Plus, Search, Trash2} from 'lucide-react';

import {createRole, deleteRole, getRoles, updateRole} from '../../api/roleApi';
import ConfirmDeleteModal from '../../components/modals/ConfirmDeleteModal';
import styles from './Roles.module.scss';

const cx = classNames.bind(styles);

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

  const loadRoles = async () => {
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
  };

  useEffect(() => {
    loadRoles();
  }, []);

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
    setEditingRoleId(role.roleId);
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
            role.roleId === editingRoleId ? mapRoleFromApi(updatedRole) : role,
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

  return (
    <div className={cx('rolesPage')}>
      <div className={cx('pageHeader')}>
        <div>
          <h1>Quản lý vai trò</h1>
          <p>Quản lý quyền hệ thống cho tài khoản người dùng.</p>
        </div>
        <Button onClick={openCreateModal} className={cx('createBtn')}>
          <Plus size={16} />
          Thêm vai trò
        </Button>
      </div>

      <div className={cx('filterBar')}>
        <div className={cx('searchBox')}>
          <Search size={16} className={cx('searchIcon')} />
          <Form.Control
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Tìm theo tên vai trò hoặc mô tả..."
          />
        </div>
      </div>
      {errorMessage && <p className={cx('errorText')}>{errorMessage}</p>}

      <div className={cx('tableWrapper')}>
        <Table responsive hover>
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên vai trò</th>
              <th>Mô tả</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="text-center py-4">
                  <Spinner size="sm" className="me-2" />
                  Đang tải dữ liệu...
                </td>
              </tr>
            )}
            {!loading &&
              filteredRoles.map((role) => (
              <tr key={role.role_id}>
                <td>{role.role_id}</td>
                <td>
                  <Badge bg="primary">{role.role_name}</Badge>
                </td>
                <td>{role.description || '-'}</td>
                <td>
                  <div className={cx('actions')}>
                    <button onClick={() => openEditModal(role)} title="Sửa vai trò">
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => setDeletingRole(role)}
                      title="Xóa vai trò"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
              ))}
            {!loading && filteredRoles.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-4">
                  Không có dữ liệu.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      <Modal
        show={showFormModal}
        onHide={() => {
          setShowFormModal(false);
          resetForm();
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {editingRoleId ? 'Cập nhật vai trò' : 'Tạo vai trò'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
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
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              if (submitting) {
                return;
              }
              setShowFormModal(false);
              resetForm();
            }}
          >
            Hủy
          </Button>
          <Button onClick={handleSubmit}>
            {editingRoleId ? 'Lưu' : 'Tạo mới'}
          </Button>
        </Modal.Footer>
      </Modal>
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
