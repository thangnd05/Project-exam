import React, {useMemo, useState} from 'react';
import {Badge, Button, Form, Modal, Table} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {Edit, Plus, Search, Trash2} from 'lucide-react';

import {roles as roleSeedData} from '../data/fakeData';
import styles from './Roles.module.scss';

const cx = classNames.bind(styles);

const emptyForm = {
  role_name: '',
  description: '',
};

function RolesManagement() {
  const [roleList, setRoleList] = useState(roleSeedData);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [formState, setFormState] = useState(emptyForm);

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

  const handleSubmit = () => {
    const normalizedRoleName = formState.role_name.trim().toUpperCase();
    const normalizedDescription = formState.description.trim();
    if (!normalizedRoleName) {
      return;
    }

    if (editingRoleId) {
      setRoleList((previous) =>
        previous.map((role) =>
          role.role_id === editingRoleId
            ? {
                ...role,
                role_name: normalizedRoleName,
                description: normalizedDescription,
              }
            : role,
        ),
      );
    } else {
      const nextRoleId =
        roleList.reduce((maxId, role) => Math.max(maxId, role.role_id), 0) + 1;
      setRoleList((previous) => [
        ...previous,
        {
          role_id: nextRoleId,
          role_name: normalizedRoleName,
          description: normalizedDescription,
        },
      ]);
    }

    setShowFormModal(false);
    resetForm();
  };

  const handleDelete = (roleId) => {
    setRoleList((previous) => previous.filter((role) => role.role_id !== roleId));
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
            {filteredRoles.map((role) => (
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
                      onClick={() => handleDelete(role.role_id)}
                      title="Xóa vai trò"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
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
    </div>
  );
}

export default RolesManagement;
