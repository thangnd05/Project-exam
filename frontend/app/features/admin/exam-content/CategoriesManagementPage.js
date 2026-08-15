'use client';

import { useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import BaseModal from '@/app/components/modal/BaseModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';
import ConfirmDeleteModal from '@/app/components/modal/ConfirmDeleteModal';
import {
    AdminPageHeader,
    AdminToolbar,
    AdminTable,
} from '@/app/components/admin/common';
import { useCategories } from '@/app/features/admin/exam-content/hooks/useCategories';

const CategoriesManagementPage = () => {
    const {
        categories,
        isLoading: loading,
        createCategory,
        updateCategory,
        deleteCategory,
    } = useCategories();
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [deletingCategory, setDeletingCategory] = useState(null);
    const [formData, setFormData] = useState({ name: '' });

    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const openCreateModal = () => {
        setEditingCategory(null);
        setFormData({ name: '' });
        setShowModal(true);
    };

    const openEditModal = (category) => {
        setEditingCategory(category);
        setFormData({ name: category.name });
        setShowModal(true);
    };

    const handleDelete = async () => {
        if (!deletingCategory) return;
        try {
            await deleteCategory(deletingCategory.id);
            toast.success('Xóa danh mục thành công');
            setDeletingCategory(null);
        } catch (error) {
            toast.error('Lỗi khi xóa danh mục');
        }
    };

    const handleSubmit = async () => {
        try {
            if (editingCategory) {
                await updateCategory({ id: editingCategory.id, payload: formData });
                toast.success('Cập nhật danh mục thành công');
            } else {
                await createCategory(formData);
                toast.success('Tạo danh mục thành công');
            }
            setShowModal(false);
        } catch (error) {
            toast.error('Lỗi khi lưu danh mục');
        }
    };

    const columns = [
        { key: 'name', header: 'Tên danh mục' },
        { key: 'slug', header: 'Slug', render: (item) => item.slug || '-' },
    ];

    return (
        <div className="d-flex flex-column gap-3">
            <AdminPageHeader
                title="Quản lý danh mục bài viết"
                description="Tạo và quản lý các danh mục blog"
            >
                <Button onClick={openCreateModal}>
                    <Plus size={16} className="me-1" />
                    Thêm danh mục
                </Button>
            </AdminPageHeader>

            <AdminToolbar
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Tìm kiếm danh mục..."
            />

            <AdminTable
                showIndex
                paginated
                itemLabel="danh mục"
                columns={columns}
                data={filteredCategories}
                loading={loading}
                getRowKey={(item) => item.id}
                rowActions={(item) => (
                    <>
                        <button onClick={() => openEditModal(item)} title="Sửa">
                            <Edit size={14} />
                        </button>
                        <button
                            className="danger"
                            onClick={() => setDeletingCategory(item)}
                            title="Xóa"
                        >
                            <Trash2 size={14} />
                        </button>
                    </>
                )}
            />

            <BaseModal
                show={showModal}
                onClose={() => setShowModal(false)}
                title={editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}
                maxWidth={550}
                footer={
                    <ModalActionFooter
                        onCancel={() => setShowModal(false)}
                        onSubmit={handleSubmit}
                        cancelLabel="Hủy"
                        submitLabel="Lưu"
                    />
                }
            >
                <Form.Group>
                    <Form.Label>
                        Tên danh mục <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Nhập tên danh mục..."
                    />
                </Form.Group>
            </BaseModal>

            <ConfirmDeleteModal
                show={Boolean(deletingCategory)}
                onClose={() => setDeletingCategory(null)}
                onConfirm={handleDelete}
                title="Xác nhận xóa danh mục"
                message={`Bạn có chắc chắn muốn xóa danh mục "${deletingCategory?.name}"? Hành động này không thể hoàn tác.`}
            />
        </div>
    );
};

export default CategoriesManagementPage;
