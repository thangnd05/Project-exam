'use client';

import React, {useMemo, useState} from 'react';
import {useTranslations} from 'next-intl';
import {Badge, Form, Spinner, Table} from 'react-bootstrap';
import {Save, ShieldCheck} from 'lucide-react';
import {toast} from 'react-toastify';
import classNames from 'classnames/bind';

import {AdminFieldError, AdminPageHeader} from '@/app/[locale]/(admin)/_components/common';
import {usePermissionsMatrix, type PermissionMatrix} from './_hooks/usePermissionsMatrix';
import type {PermissionResponse, RoleResponse} from '@/app/types';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import styles from '@/app/[locale]/(admin)/_components/common/adminKit.module.scss';

const cx = classNames.bind(styles);

const PROTECTED_ROLE = 'ADMIN';

const buildMatrix = (roleList: RoleResponse[]): PermissionMatrix => {
  const next: PermissionMatrix = {};
  roleList.forEach((role) => {
    next[role.roleId] = new Set(role.permissions || []);
  });
  return next;
};

function PermissionsManagement() {
  const t = useTranslations('AdminUsers');
  const {roles, permissions, isLoading, isError, saveMutation} = usePermissionsMatrix();
  const loading = isLoading;
  const saving = saveMutation.isPending;

  const [errorMessage, setErrorMessage] = useState('');

  const [matrix, setMatrix] = useState<PermissionMatrix>(() => buildMatrix(roles));
  const [original, setOriginal] = useState<PermissionMatrix>(() => buildMatrix(roles));

  // Dựng lại ma trận mỗi khi danh sách vai trò từ server thay đổi
  const [prevRoles, setPrevRoles] = useState(roles);
  if (roles !== prevRoles) {
    setPrevRoles(roles);
    setMatrix(buildMatrix(roles));
    setOriginal(buildMatrix(roles));
  }

  const displayError = errorMessage || (isError ? t('permissions.errors.load') : '');

  const permissionGroups = useMemo(() => {
    const groups = new Map<string, PermissionResponse[]>();
    permissions.forEach((permission) => {
      const groupName = permission.groupName || t('shared.other');
      if (!groups.has(groupName)) {
        groups.set(groupName, []);
      }
      groups.get(groupName)!.push(permission);
    });
    return Array.from(groups.entries());
  }, [permissions, t]);

  const isProtected = (role: RoleResponse) => role.roleName === PROTECTED_ROLE;

  const hasCode = (roleId: string, code: string) => Boolean(matrix[roleId]?.has(code));

  const toggleCell = (roleId: string, code: string) => {
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

  const toggleGroupForRole = (roleId: string, codes: string[], allChecked: boolean) => {
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
        const snapshot: PermissionMatrix = {};
        Object.keys(matrix).forEach((roleId) => {
          snapshot[roleId] = new Set(matrix[roleId]);
        });
        return snapshot;
      });
      toast.success(t('permissions.saved', {count: dirtyRoleIds.length}));
    } catch {
      setErrorMessage(t('permissions.errors.save'));
    }
  };

  if (loading) {
    return (
      <div className="d-flex align-items-center gap-2 text-muted p-4">
        <Spinner animation="border" size="sm" /> {t('permissions.loading')}
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-3">
      <AdminPageHeader
        title={t('permissions.title')}
        description={t('permissions.description')}
      >
        <ButtonPrime onClick={handleSave} disabled={saving || dirtyRoleIds.length === 0}>
          {saving ? (
            <Spinner animation="border" size="sm" />
          ) : (
            <Save size={16} />
          )}
          {t('permissions.saveChanges')}
          {dirtyRoleIds.length > 0 && (
            <Badge bg="light" text="dark">
              {dirtyRoleIds.length}
            </Badge>
          )}
        </ButtonPrime>
      </AdminPageHeader>

      <AdminFieldError message={displayError} />

      <div className={cx('tableWrapper')} style={{overflowX: 'auto'}}>
        <Table hover responsive className="align-middle mb-0">
          <thead>
            <tr>
              <th style={{minWidth: 280}}>{t('permissions.actionColumn')}</th>
              {roles.map((role) => (
                <th key={role.roleId} className="text-center" style={{minWidth: 120}}>
                  <div className="d-flex flex-column align-items-center">
                    <span>{role.roleName}</span>
                    {isProtected(role) ? (
                      <Badge bg="warning" text="dark" className="mt-1">
                        <ShieldCheck size={12} className="me-1" />
                        {t('permissions.fullAccess')}
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
              const codes = items.map((item) => item.code!);
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
                              checked={locked ? true : hasCode(role.roleId, permission.code!)}
                              disabled={locked || saving}
                              onChange={() => toggleCell(role.roleId, permission.code!)}
                              aria-label={`${role.roleName} - ${permission.code}`}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr>
                    <td className="text-end text-muted small">{t('permissions.selectGroup', {group: groupName})}</td>
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
                            aria-label={t('permissions.selectGroupAria', {role: role.roleName ?? '', group: groupName})}
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

export default PermissionsManagement;
