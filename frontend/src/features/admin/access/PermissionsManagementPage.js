import React, {useEffect, useMemo, useState} from 'react';
import {Badge, Button, Form, Spinner, Table} from 'react-bootstrap';
import {Save, ShieldCheck} from 'lucide-react';
import {toast} from 'react-toastify';
import classNames from 'classnames/bind';

import {AdminFieldError, AdminPageHeader} from '../components/common';
import {usePermissionsMatrix} from '~/features/admin/access/hooks/usePermissionsMatrix';
import styles from '../components/common/adminKit.module.scss';

const cx = classNames.bind(styles);

const PROTECTED_ROLE = 'ADMIN';

const buildMatrix = (roleList) => {
  const next = {};
  roleList.forEach((role) => {
    next[role.roleId] = new Set(role.permissions || []);
  });
  return next;
};

function PermissionsManagementPage() {
  const {roles, permissions, isLoading, isError, saveMutation} = usePermissionsMatrix();
  const loading = isLoading;
  const saving = saveMutation.isPending;

  const [errorMessage, setErrorMessage] = useState('');

  const [matrix, setMatrix] = useState({});
  const [original, setOriginal] = useState({});

  useEffect(() => {
    setMatrix(buildMatrix(roles));
    setOriginal(buildMatrix(roles));
  }, [roles]);

  const displayError = errorMessage || (isError ? 'Không thể tải dữ liệu phân quyền.' : '');

  const permissionGroups = useMemo(() => {
    const groups = new Map();
    permissions.forEach((permission) => {
      const groupName = permission.groupName || 'Khác';
      if (!groups.has(groupName)) {
        groups.set(groupName, []);
      }
      groups.get(groupName).push(permission);
    });
    return Array.from(groups.entries());
  }, [permissions]);

  const isProtected = (role) => role.roleName === PROTECTED_ROLE;

  const hasCode = (roleId, code) => Boolean(matrix[roleId]?.has(code));

  const toggleCell = (roleId, code) => {
    setMatrix((previous) => {
      const next = {...previous};
      const set = new Set(next[roleId] || []);
      if (set.has(code)) {
        set.delete(code);
      } else {
        set.add(code);
      }
      next[roleId] = set;
      return next;
    });
  };

  const toggleGroupForRole = (roleId, codes, allChecked) => {
    setMatrix((previous) => {
      const next = {...previous};
      const set = new Set(next[roleId] || []);
      codes.forEach((code) => (allChecked ? set.delete(code) : set.add(code)));
      next[roleId] = set;
      return next;
    });
  };

  const dirtyRoleIds = useMemo(() => {
    return roles
      .filter((role) => !isProtected(role))
      .filter((role) => {
        const now = matrix[role.roleId] || new Set();
        const before = original[role.roleId] || new Set();
        if (now.size !== before.size) return true;
        for (const code of now) {
          if (!before.has(code)) return true;
        }
        return false;
      })
      .map((role) => role.roleId);
  }, [roles, matrix, original]);

  const handleSave = async () => {
    if (dirtyRoleIds.length === 0) return;
    setErrorMessage('');
    try {
      await saveMutation.mutateAsync({dirtyRoleIds, matrix});

      setOriginal(() => {
        const snapshot = {};
        Object.keys(matrix).forEach((roleId) => {
          snapshot[roleId] = new Set(matrix[roleId]);
        });
        return snapshot;
      });
      toast.success(`Đã lưu phân quyền cho ${dirtyRoleIds.length} vai trò.`);
    } catch (error) {
      setErrorMessage('Không thể lưu phân quyền.');
    }
  };

  if (loading) {
    return (
      <div className="d-flex align-items-center gap-2 text-muted p-4">
        <Spinner animation="border" size="sm" /> Đang tải ma trận phân quyền...
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-3">
      <AdminPageHeader
        title="Phân quyền (RBAC)"
        description="Tích vào hành động mà mỗi vai trò được phép thực hiện. Đổi quyền có hiệu lực ngay cho người dùng."
      >
        <Button onClick={handleSave} disabled={saving || dirtyRoleIds.length === 0}>
          {saving ? (
            <Spinner animation="border" size="sm" className="me-1" />
          ) : (
            <Save size={16} className="me-1" />
          )}
          Lưu thay đổi
          {dirtyRoleIds.length > 0 && (
            <Badge bg="light" text="dark" className="ms-2">
              {dirtyRoleIds.length}
            </Badge>
          )}
        </Button>
      </AdminPageHeader>

      <AdminFieldError message={displayError} />

      <div className={cx('tableWrapper')} style={{overflowX: 'auto'}}>
        <Table hover responsive className="align-middle mb-0">
          <thead>
            <tr>
              <th style={{minWidth: 280}}>Hành động</th>
              {roles.map((role) => (
                <th key={role.roleId} className="text-center" style={{minWidth: 120}}>
                  <div className="d-flex flex-column align-items-center">
                    <span>{role.roleName}</span>
                    {isProtected(role) ? (
                      <Badge bg="warning" text="dark" className="mt-1">
                        <ShieldCheck size={12} className="me-1" />
                        Toàn quyền
                      </Badge>
                    ) : (
                      <Badge bg="secondary" className="mt-1">
                        {matrix[role.roleId]?.size || 0}
                      </Badge>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {permissionGroups.map(([groupName, items]) => {
              const codes = items.map((item) => item.code);
              return (
                <React.Fragment key={groupName}>
                  <tr className="table-light">
                    <td colSpan={roles.length + 1}>
                      <strong>{groupName}</strong>
                    </td>
                  </tr>
                  {items.map((permission) => (
                    <tr key={permission.code}>
                      <td>
                        <div className="d-flex flex-column">
                          <span>{permission.description || permission.code}</span>
                          <code className="text-muted small">{permission.code}</code>
                        </div>
                      </td>
                      {roles.map((role) => {
                        const locked = isProtected(role);
                        return (
                          <td key={role.roleId} className="text-center">
                            <Form.Check
                              type="checkbox"
                              className="d-flex justify-content-center"
                              checked={locked ? true : hasCode(role.roleId, permission.code)}
                              disabled={locked || saving}
                              onChange={() => toggleCell(role.roleId, permission.code)}
                              aria-label={`${role.roleName} - ${permission.code}`}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr>
                    <td className="text-end text-muted small">Chọn cả nhóm “{groupName}”</td>
                    {roles.map((role) => {
                      const locked = isProtected(role);
                      const allChecked = codes.every((code) => hasCode(role.roleId, code));
                      return (
                        <td key={role.roleId} className="text-center">
                          <Form.Check
                            type="checkbox"
                            className="d-flex justify-content-center"
                            checked={locked ? true : allChecked}
                            disabled={locked || saving}
                            onChange={() => toggleGroupForRole(role.roleId, codes, allChecked)}
                            aria-label={`${role.roleName} - chọn nhóm ${groupName}`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </Table>
      </div>
    </div>
  );
}

export default PermissionsManagementPage;
