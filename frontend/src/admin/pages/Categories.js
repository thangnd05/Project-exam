import React, { useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import classNames from 'classnames/bind';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '~/api/postApi';
import { toast } from 'react-toastify';
import {
    AdminPageHeader,
    AdminToolbar,
    AdminTable,
} from '../components/common';
import styles from './Categories.module.scss';

const cx = classNames.bind(styles);

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({ name: '' });

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const data = await getCategories();
            setCategories(data);
        } catch (error) {
            toast.error('Lỗi khi tải danh mục');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

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

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
        try {
            await deleteCategory(id);
            toast.success('Xóa danh mục thành công');
            fetchCategories();
        } catch (error) {
            toast.error('Lỗi khi xóa danh mục');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                await updateCategory(editingCategory.id, formData);
                toast.success('Cập nhật danh mục thành công');
            } else {
                await createCategory(formData);
                toast.success('Tạo danh mục thành công');
            }
            setShowModal(false);
            fetchCategories();
        } catch (error) {
            toast.error('Lỗi khi lưu danh mục');
        }
    };

    const columns = [
        { key: 'id', header: 'ID', width: 80 },
        {
            key: 'name',
            header: 'Tên danh mục',
            render: (item) => <span className={cx('nameCell')}>{item.name}</span>,
        },
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
                            onClick={() => handleDelete(item.id)}
                            title="Xóa"
                        >
                            <Trash2 size={14} />
                        </button>
                    </>
                )}
            />

            {/* Modal */}
            {showModal && (
                <div className={cx('modalOverlay')}>
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={cx('modalContent')}
                    >
                        <div className={cx('modalHeader')}>
                            <h2>{editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}</h2>
                            <button className={cx('closeBtn')} onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className={cx('modalForm')}>
                            <div className={cx('formGroup')}>
                                <label>Tên danh mục <span className={cx('required')}>*</span></label>
                                <input 
                                    type="text" 
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required 
                                    placeholder="Nhập tên danh mục..."
                                />
                            </div>
                            <div className={cx('modalFooter')}>
                                <button type="button" className={cx('cancelBtn')} onClick={() => setShowModal(false)}>Hủy</button>
                                <button type="submit" className={cx('submitBtn')}>Lưu</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default Categories;
