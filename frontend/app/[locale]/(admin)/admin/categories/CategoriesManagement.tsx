'use client';

import { useState } from 'react';
import { Form } from 'react-bootstrap';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useTranslations } from 'next-intl';
import BaseModal from '@/app/components/modal/BaseModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';
import ConfirmDeleteModal from '@/app/components/modal/ConfirmDeleteModal';
import {
    AdminPageHeader,
    AdminToolbar,
    AdminTable,
} from '@/app/[locale]/(admin)/_components/common';
import { useCategories, type AdminCategory } from './_hooks/useCategories';

const CategoriesManagement = () => {
    const t = useTranslations('AdminSystem.categories');
    const tAdmin = useTranslations('AdminCommon');
    const tCommon = useTranslations('Common');
    const {
        categories,
        isLoading: loading,
        createCategory,
        updateCategory,
        deleteCategory,
    } = useCategories();
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);
    const [deletingCategory, setDeletingCategory] = useState<AdminCategory | null>(null);
    const [formData, setFormData] = useState({ name: '' });

    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const openCreateModal = () => {
        setEditingCategory(null);
        setFormData({ name: '' });
        setShowModal(true);
    };

    const openEditModal = (category: AdminCategory) => {
        setEditingCategory(category);
        setFormData({ name: category.name });
        setShowModal(true);
    };

    const handleDelete = async () => {
        if (!deletingCategory) return;
        try {
            await deleteCategory(deletingCategory.id);
            toast.success(t('toast.deleted'));
            setDeletingCategory(null);
        } catch {
            toast.error(t('toast.deleteError'));
        }
    };

    const handleSubmit = async () => {
        try {
            if (editingCategory) {
                await updateCategory({ id: editingCategory.id, payload: formData });
                toast.success(t('toast.updated'));
            } else {
                await createCategory(formData);
                toast.success(t('toast.created'));
            }
            setShowModal(false);
        } catch {
            toast.error(t('toast.saveError'));
        }
    };

    const columns = [
        { key: 'name', header: t('name') },
        { key: 'slug', header: 'Slug', render: (item: AdminCategory) => item.slug || '-' },
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
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder={t('searchPlaceholder')}
            />

            <AdminTable
                showIndex
                paginated
                itemLabel={t('itemLabel')}
                columns={columns}
                data={filteredCategories}
                loading={loading}
                getRowKey={(item: AdminCategory) => item.id}
                rowActions={(item: AdminCategory) => (
                    <>
                        <ButtonPrime size="icon" variant="ghost" onClick={() => openEditModal(item)} title={tAdmin('actions.edit')}>
                            <Edit size={14} />
                        </ButtonPrime>
                        <ButtonPrime size="icon" variant="dangerGhost"
                            onClick={() => setDeletingCategory(item)}
                            title={tAdmin('actions.delete')}
                        >
                            <Trash2 size={14} />
                        </ButtonPrime>
                    </>
                )}
            />

            <BaseModal
                show={showModal}
                onClose={() => setShowModal(false)}
                title={editingCategory ? t('editTitle') : t('createTitle')}
                maxWidth={550}
                footer={
                    <ModalActionFooter
                        onCancel={() => setShowModal(false)}
                        onSubmit={handleSubmit}
                        cancelLabel={tCommon('cancelShort')}
                        submitLabel={tCommon('save')}
                    />
                }
            >
                <Form.Group>
                    <Form.Label>
                        {t('name')} <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder={t('namePlaceholder')}
                    />
                </Form.Group>
            </BaseModal>

            <ConfirmDeleteModal
                show={Boolean(deletingCategory)}
                onClose={() => setDeletingCategory(null)}
                onConfirm={handleDelete}
                title={t('deleteTitle')}
                message={t('deleteMessage', { name: deletingCategory?.name ?? '' })}
            />
        </div>
    );
};

export default CategoriesManagement;
