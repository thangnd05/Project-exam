import React, { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Search, X } from 'lucide-react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '~/api/postApi';
import { toast } from 'react-toastify';
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

    const handleSearch = (e) => setSearchQuery(e.target.value);

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

    return (
        <div className={cx('wrapper')}>
            <div className={cx('header')}>
                <div>
                    <h1>Quản lý danh mục bài viết</h1>
                    <p>Tạo và quản lý các chuyên mục blog</p>
                </div>
                <button className={cx('createBtn')} onClick={openCreateModal}>
                    <Plus size={18} /> Thêm danh mục
                </button>
            </div>

            <div className={cx('toolbar')}>
                <div className={cx('searchBox')}>
                    <Search size={18} className={cx('searchIcon')} />
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm danh mục..." 
                        value={searchQuery}
                        onChange={handleSearch}
                    />
                </div>
            </div>

            <div className={cx('tableContainer')}>
                {loading ? (
                    <div className={cx('loading')}>Đang tải dữ liệu...</div>
                ) : (
                    <table className={cx('table')}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Tên danh mục</th>
                                <th>Slug</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCategories.length > 0 ? (
                                filteredCategories.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.id}</td>
                                        <td className={cx('nameCell')}>{item.name}</td>
                                        <td>{item.slug}</td>
                                        <td>
                                            <div className={cx('actions')}>
                                                <button className={cx('editBtn')} onClick={() => openEditModal(item)} title="Sửa">
                                                    <Edit size={16} />
                                                </button>
                                                <button className={cx('deleteBtn')} onClick={() => handleDelete(item.id)} title="Xóa">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className={cx('empty')}>Không có dữ liệu</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

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
