'use client';

import { useMemo, useState } from 'react';
import {Form} from 'react-bootstrap';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import {useTranslations} from 'next-intl';
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
} from '@/app/[locale]/(admin)/_components/common';

const defaultFormState = {
  name: '',
  description: '',
};

function SkillsManagement() {
  const t = useTranslations('AdminContent.skills');
  const tc = useTranslations('Common');
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
    errorMessage || (isError ? t('errors.loadFailed') : '');

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
      setErrorMessage(t('errors.nameRequired'));
      return;
    }

    if (hasDuplicateSkillName(normalizedName)) {
      setErrorMessage(t('errors.nameDuplicate'));
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
    } catch {
      setErrorMessage(t('errors.saveFailed'));
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
    } catch {
      setErrorMessage(t('errors.deleteFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {key: 'name', header: t('name')},
    {key: 'description', header: t('description'), render: (skill: SkillItem) => skill.description || '-'},
  ];

  return (
    <div className="d-flex flex-column gap-3">
      <AdminPageHeader
        title={t('title')}
        description={t('pageDescription')}
      >
        <ButtonPrime onClick={openCreateModal}>
          <Plus size={16} />
          {t('add')}
        </ButtonPrime>
      </AdminPageHeader>

      <AdminToolbar
        searchValue={keyword}
        onSearchChange={setKeyword}
        searchPlaceholder={t('searchPlaceholder')}
      />
      <AdminFieldError message={displayError} />

      <AdminTable
        showIndex
        paginated
        itemLabel={t('itemLabel')}
        columns={columns}
        data={filteredSkills}
        loading={loading}
        getRowKey={(skill: SkillItem) => skill.skill_id}
        rowActions={(skill: SkillItem) => (
          <>
            <ButtonPrime size="icon" variant="ghost" title={t('edit')} onClick={() => openEditModal(skill)}>
              <Edit size={14} />
            </ButtonPrime>
            <ButtonPrime size="icon" variant="dangerGhost"
              title={t('delete')}
              onClick={() => setDeletingSkill(skill)}
            >
              <Trash2 size={14} />
            </ButtonPrime>
          </>
        )}
      />

      <BaseModal
        show={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingSkillId ? t('editTitle') : t('createTitle')}
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
            cancelLabel={tc('cancelShort')}
            submitLabel={editingSkillId ? tc('save') : t('create')}
            loading={submitting}
          />
        }
      >
        <Form.Group className="mb-3">
          <Form.Label>{t('name')}</Form.Label>
          <Form.Control
            value={formState.name}
            onChange={(event) =>
              setFormState((previous) => ({...previous, name: event.target.value}))
            }
          />
        </Form.Group>
        <Form.Group>
          <Form.Label>{t('description')}</Form.Label>
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
        title={t('deleteTitle')}
        message={t('deleteMessage', {name: deletingSkill?.name || ''})}
      />
    </div>
  );
}

export default SkillsManagement;
