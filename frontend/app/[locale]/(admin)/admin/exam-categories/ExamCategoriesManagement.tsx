'use client';

import { useMemo, useState } from 'react';
import {Badge} from 'react-bootstrap';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import {useTranslations} from 'next-intl';
import {Edit, Plus, Trash2} from 'lucide-react';

import ConfirmDeleteModal from '@/app/components/modal/ConfirmDeleteModal';
import ExamCategoryFormModal, {type ExamCategoryFormState} from './_components/ExamCategoryFormModal';
import {
  AdminFieldError,
  AdminPageHeader,
  AdminTable,
  AdminToolbar,
} from '@/app/[locale]/(admin)/_components/common';
import {useExamCategories, type ExamCategoryItem} from './_hooks/useExamCategories';
import type {ExamCategoryRequest} from '@/app/types';
import {getApiErrorMessage} from '@/app/utils/apiError';

const emptyForm: ExamCategoryFormState = {
  code: '',
  name: '',
  description: '',
  guestAllowed: false,
  certificateEligible: false,
  displayOrder: 0,
};

const buildPayload = (formState: ExamCategoryFormState): ExamCategoryRequest => ({
  code: formState.code.trim(),
  name: formState.name.trim(),
  description: formState.description?.trim() || undefined,
  guestAllowed: !!formState.guestAllowed,
  certificateEligible: !!formState.certificateEligible,
  displayOrder: Number(formState.displayOrder) || 0,
});

function ExamCategoriesManagement() {
  const t = useTranslations('AdminContent.examCategories');
  const {
    categories,
    isLoading: loading,
    isError,
    createMutation,
    updateMutation,
    deleteMutation,
  } = useExamCategories();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<ExamCategoryFormState>(emptyForm);
  const [errorMessage, setErrorMessage] = useState('');
  const [deletingItem, setDeletingItem] = useState<ExamCategoryItem | null>(null);

  const submitting =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  const filtered = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return categories;
    return categories.filter(
      (c) =>
        c.code.toLowerCase().includes(keyword) ||
        c.name.toLowerCase().includes(keyword) ||
        (c.description || '').toLowerCase().includes(keyword),
    );
  }, [categories, searchTerm]);

  const resetForm = () => {
    setFormState(emptyForm);
    setEditingId(null);
    setErrorMessage('');
  };

  const openCreateModal = () => {
    resetForm();
    setShowFormModal(true);
  };

  const openEditModal = (item: ExamCategoryItem) => {
    setEditingId(item.examCategoryId);
    setFormState({
      code: item.code,
      name: item.name,
      description: item.description || '',
      guestAllowed: !!item.guestAllowed,
      certificateEligible: !!item.certificateEligible,
      displayOrder: item.displayOrder ?? 0,
    });
    setShowFormModal(true);
  };

  const handleSubmit = async () => {
    const normalizedCode = formState.code.trim();
    const normalizedName = formState.name.trim();
    if (!normalizedCode) {
      setErrorMessage(t('errors.codeRequired'));
      return;
    }
    if (!normalizedName) {
      setErrorMessage(t('errors.nameRequired'));
      return;
    }

    setErrorMessage('');
    try {
      const payload = buildPayload(formState);
      if (editingId) {
        await updateMutation.mutateAsync({id: editingId, payload});
      } else {
        await createMutation.mutateAsync(payload);
      }
      setShowFormModal(false);
      resetForm();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t('errors.saveFailed')));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setErrorMessage('');
    try {
      await deleteMutation.mutateAsync(deletingItem.examCategoryId);
      setDeletingItem(null);
    } catch {
      setErrorMessage(t('errors.deleteFailed'));
    }
  };

  const columns = [
    {
      key: 'code',
      header: 'Code',
      render: (item: ExamCategoryItem) => <Badge bg="primary">{item.code}</Badge>,
    },
    {key: 'name', header: t('columns.name')},
    {
      key: 'guestAllowed',
      header: 'Guest',
      render: (item: ExamCategoryItem) =>
        item.guestAllowed ? (
          <Badge bg="success">{t('allowed')}</Badge>
        ) : (
          <Badge bg="secondary">{t('no')}</Badge>
        ),
    },
    {
      key: 'certificateEligible',
      header: t('columns.certificate'),
      render: (item: ExamCategoryItem) =>
        item.certificateEligible ? (
          <Badge bg="warning" text="dark">{t('issued')}</Badge>
        ) : (
          <Badge bg="secondary">{t('no')}</Badge>
        ),
    },
    {key: 'displayOrder', header: t('columns.order')},
    {key: 'description', header: t('columns.description'), render: (item: ExamCategoryItem) => item.description || '-'},
  ];

  return (
    <div className="d-flex flex-column gap-3">
      <AdminPageHeader
        title={t('title')}
        description={t('description')}
      >
        <ButtonPrime onClick={openCreateModal}>
          <Plus size={16} />
          {t('add')}
        </ButtonPrime>
      </AdminPageHeader>

      <AdminToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t('searchPlaceholder')}
      />
      <AdminFieldError
        message={
          errorMessage ||
          (isError ? t('errors.loadFailed') : '')
        }
      />

      <AdminTable
        showIndex
        paginated
        itemLabel={t('itemLabel')}
        columns={columns}
        data={filtered}
        loading={loading}
        getRowKey={(item: ExamCategoryItem) => item.examCategoryId}
        rowActions={(item: ExamCategoryItem) => (
          <>
            <ButtonPrime size="icon" variant="ghost" onClick={() => openEditModal(item)} title={t('edit')}>
              <Edit size={14} />
            </ButtonPrime>
            <ButtonPrime size="icon" variant="dangerGhost"
              onClick={() => setDeletingItem(item)}
              title={t('delete')}
            >
              <Trash2 size={14} />
            </ButtonPrime>
          </>
        )}
      />

      <ExamCategoryFormModal
        show={showFormModal}
        isEditing={Boolean(editingId)}
        formState={formState}
        onChangeField={(fieldName, value) =>
          setFormState((previous) => ({...previous, [fieldName]: value}))
        }
        onClose={() => {
          if (submitting) return;
          setShowFormModal(false);
          resetForm();
        }}
        onSubmit={handleSubmit}
      />
      <ConfirmDeleteModal
        show={Boolean(deletingItem)}
        onClose={() => {
          if (submitting) return;
          setDeletingItem(null);
        }}
        onConfirm={handleConfirmDelete}
        title={t('deleteTitle')}
        message={t('deleteMessage', {name: deletingItem?.name || ''})}
      />
    </div>
  );
}

export default ExamCategoriesManagement;
