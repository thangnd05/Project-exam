'use client';

import { useMemo, useState } from 'react';
import {useTranslations} from 'next-intl';
import {Badge, Form, Spinner} from 'react-bootstrap';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import {Edit, Plus, ShieldCheck, Trash2} from 'lucide-react';

import {useRoles, type AdminRoleRow} from './_hooks/useRoles';
import BaseModal from '@/app/components/modal/BaseModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';
import ConfirmDeleteModal from '@/app/components/modal/ConfirmDeleteModal';
import {
  AdminFieldError,
  AdminPageHeader,
  AdminTable,
  AdminToolbar,
} from '@/app/[locale]/(admin)/_components/common';
import type {AdminTableColumn} from '@/app/[locale]/(admin)/_components/common/AdminTable';
import type {PermissionResponse} from '@/app/types';

type RoleFormState = {
  role_name: string;
  description: string;
};

const emptyForm: RoleFormState = {
  role_name: '',
  description: '',
};

function RolesManagement() {
  const t = useTranslations('AdminUsers');
  const tCommon = useTranslations('Common');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [formState, setFormState] = useState<RoleFormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [deletingRole, setDeletingRole] = useState<AdminRoleRow | null>(null);

  const [permRole, setPermRole] = useState<AdminRoleRow | null>(null);
  const [permSelected, setPermSelected] = useState<Set<string>>(() => new Set());
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
    const groups = new Map<string, PermissionResponse[]>();
    permissionCatalog.forEach((permission) => {
      const groupName = permission.groupName || t('shared.other');
      if (!groups.has(groupName)) {
        groups.set(groupName, []);
      }
      groups.get(groupName)!.push(permission);
    });
    return Array.from(groups.entries());
  }, [permissionCatalog, t]);

  const openPermissionModal = (role: AdminRoleRow) => {
    setPermRole(role);
    setPermSelected(new Set(role.permissions || []));
  };

  const togglePermission = (code: string) => {
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

  const toggleGroup = (codes: string[], allChecked: boolean) => {
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
    } catch {
      setErrorMessage(t('roles.errors.savePermissions'));
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

  const openEditModal = (role: AdminRoleRow) => {
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
      setErrorMessage(t('roles.errors.nameRequired'));
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
    } catch {
      setErrorMessage(t('roles.errors.save'));
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
    } catch {
      setErrorMessage(t('roles.errors.delete'));
    } finally {
      setSubmitting(false);
    }
  };

  const columns: AdminTableColumn[] = [
    {
      key: 'role_name',
      header: t('roles.columns.name'),
      render: (role: AdminRoleRow) => <Badge bg="primary">{role.role_name}</Badge>,
    },
    {key: 'description', header: t('roles.columns.description'), render: (role: AdminRoleRow) => role.description || '-'},
    {
      key: 'permissions',
      header: t('roles.columns.permissionCount'),
      render: (role: AdminRoleRow) => (
        <Badge bg={role.permissions?.length ? 'success' : 'secondary'}>
          {role.permissions?.length || 0}
        </Badge>
      ),
    },
  ];

  return (
    <div className="d-flex flex-column gap-3">
      <AdminPageHeader
        title={t('roles.title')}
        description={t('roles.description')}
      >
        <ButtonPrime onClick={openCreateModal}>
          <Plus size={16} />
          {t('roles.add')}
        </ButtonPrime>
      </AdminPageHeader>

      <AdminToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t('roles.searchPlaceholder')}
      />
      <AdminFieldError message={errorMessage} />

      <AdminTable
        showIndex
        paginated
        itemLabel={t('roles.itemLabel')}
        columns={columns}
        data={filteredRoles}
        loading={loading}
        getRowKey={(role: AdminRoleRow) => role.role_id}
        rowActions={(role: AdminRoleRow) => (
          <>
            <ButtonPrime size="icon" variant="ghost"
              onClick={() => openPermissionModal(role)}
              title={t('roles.actions.permissions')}
            >
              <ShieldCheck size={14} />
            </ButtonPrime>
            <ButtonPrime size="icon" variant="ghost" onClick={() => openEditModal(role)} title={t('roles.actions.edit')}>
              <Edit size={14} />
            </ButtonPrime>
            <ButtonPrime size="icon" variant="dangerGhost"
              onClick={() => setDeletingRole(role)}
              title={t('roles.actions.delete')}
            >
              <Trash2 size={14} />
            </ButtonPrime>
          </>
        )}
      />

      <BaseModal
        show={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          resetForm();
        }}
        title={editingRoleId ? t('roles.modal.editTitle') : t('roles.modal.createTitle')}
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
            cancelLabel={tCommon('cancelShort')}
            submitLabel={editingRoleId ? tCommon('save') : t('shared.createNew')}
            loading={submitting}
          />
        }
      >
        <Form.Group className="mb-3">
          <Form.Label>{t('roles.modal.name')}</Form.Label>
          <Form.Control
            value={formState.role_name}
            onChange={(event) =>
              setFormState((previous) => ({
                ...previous,
                role_name: event.target.value,
              }))
            }
            placeholder={t('roles.modal.namePlaceholder')}
          />
        </Form.Group>
        <Form.Group>
          <Form.Label>{t('roles.modal.description')}</Form.Label>
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
        title={t('roles.permissionModal.title', {role: permRole?.role_name || ''})}
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
            cancelLabel={tCommon('cancelShort')}
            submitLabel={t('roles.permissionModal.save')}
            loading={permSaving}
          />
        }
      >
        {permissionCatalog.length === 0 ? (
          <div className="d-flex align-items-center gap-2 text-muted">
            <Spinner animation="border" size="sm" /> {t('roles.permissionModal.loading')}
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            <p className="text-muted mb-0">
              {t('roles.permissionModal.hint')}
            </p>
            {permissionGroups.map(([groupName, items]) => {
              const codes = items.map((item) => item.code!);
              const allChecked = codes.every((code) => permSelected.has(code));
              return (
                <div key={groupName} className="border rounded p-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <strong>{groupName}</strong>
                    <Form.Check
                      type="checkbox"
                      id={`group-${groupName}`}
                      label={t('roles.permissionModal.selectAll')}
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
                        checked={permSelected.has(permission.code!)}
                        onChange={() => togglePermission(permission.code!)}
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
        title={t('roles.confirmDelete.title')}
        message={t('roles.confirmDelete.message', {name: deletingRole?.role_name || ''})}
      />
    </div>
  );
}

export default RolesManagement;
