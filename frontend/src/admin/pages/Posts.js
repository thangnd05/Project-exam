import React, { useState, useEffect, useCallback } from 'react';
import classNames from 'classnames/bind';
import { Search, Eye, CheckCircle, Trash2 } from 'lucide-react';
import { getPosts, updatePostStatus, deletePost } from '~/api/postApi';
import { toast } from 'react-toastify';
import styles from './Posts.module.scss';
import { Link } from 'react-router-dom';
import routes from '~/config/Routes';

const cx = classNames.bind(styles);

const Posts = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('PENDING');
    const [currentPage, setCurrentPage] = useState(0);

    const fetchPosts = useCallback(async (page = 0) => {
        setLoading(true);
        try {
            const data = await getPosts({
                page,
                size: 10,
                status: statusFilter === 'ALL' ? undefined : statusFilter,
                keyword: searchQuery
            });
            setPosts(data.content || []);
            setCurrentPage(data.currentPage || 0);
        } catch (error) {
            toast.error('Lỗi khi tải danh sách bài viết');
        } finally {
            setLoading(false);
        }
    }, [statusFilter, searchQuery]);

    useEffect(() => {
        fetchPosts(0);
    }, [fetchPosts]);

    const handleSearch = (e) => setSearchQuery(e.target.value);

    const handleApprove = async (postId) => {
        if (!window.confirm('Duyệt bài viết này?')) return;
        try {
            await updatePostStatus(postId, 'APPROVED');
            toast.success('Đã duyệt bài viết');
            fetchPosts(currentPage);
        } catch (error) {
            toast.error('Lỗi khi duyệt bài viết');
        }
    };

    const handleDelete = async (postId) => {
        if (!window.confirm('Xóa bài viết này? Hành động không thể hoàn tác.')) return;
        try {
            await deletePost(postId);
            toast.success('Đã xóa bài viết');
            fetchPosts(currentPage);
        } catch (error) {
            toast.error('Lỗi khi xóa bài viết');
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'APPROVED': return cx('statusBadge', 'approved');
            case 'PENDING': return cx('statusBadge', 'pending');
            default: return cx('statusBadge');
        }
    };

    return (
        <div className={cx('wrapper')}>
            <div className={cx('header')}>
                <div>
                    <h1>Duyệt bài viết</h1>
                    <p>Duyệt bài chờ duyệt hoặc xóa bài không phù hợp. Bài bị xóa sẽ biến mất khỏi danh sách của tác giả.</p>
                </div>
            </div>

            <div className={cx('toolbar')}>
                <div className={cx('searchBox')}>
                    <Search size={18} className={cx('searchIcon')} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm bài viết..."
                        value={searchQuery}
                        onChange={handleSearch}
                    />
                </div>
                <div className={cx('filterPills')}>
                    <button
                        className={cx('pill', { active: statusFilter === 'PENDING' })}
                        onClick={() => setStatusFilter('PENDING')}
                    >
                        Chờ duyệt
                    </button>
                    <button
                        className={cx('pill', { active: statusFilter === 'APPROVED' })}
                        onClick={() => setStatusFilter('APPROVED')}
                    >
                        Đã duyệt
                    </button>
                    <button
                        className={cx('pill', { active: statusFilter === 'ALL' })}
                        onClick={() => setStatusFilter('ALL')}
                    >
                        Tất cả
                    </button>
                </div>
            </div>

            <div className={cx('tableContainer')}>
                {loading ? (
                    <div className={cx('loading')}>Đang tải dữ liệu...</div>
                ) : (
                    <table className={cx('table')}>
                        <thead>
                            <tr>
                                <th>Tiêu đề</th>
                                <th>Tác giả</th>
                                <th>Ngày tạo</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {posts.length > 0 ? (
                                posts.map((post) => (
                                    <tr key={post.id}>
                                        <td className={cx('titleCell')}>
                                            <div className={cx('postTitle')}>{post.title}</div>
                                            <div className={cx('postCategory')}>{post.categories?.[0]?.name || 'Không có danh mục'}</div>
                                        </td>
                                        <td>{post.authorName}</td>
                                        <td>{new Date(post.createdAt).toLocaleDateString('vi-VN')}</td>
                                        <td>
                                            <span className={getStatusStyle(post.status)}>{post.status}</span>
                                        </td>
                                        <td>
                                            <div className={cx('actions')}>
                                                <Link
                                                    to={routes.postDetail.replace(':postId', post.id)}
                                                    className={cx('viewBtn')}
                                                    target="_blank"
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye size={16} />
                                                </Link>
                                                {post.status !== 'APPROVED' && (
                                                    <button
                                                        className={cx('approveBtn')}
                                                        onClick={() => handleApprove(post.id)}
                                                        title="Duyệt"
                                                    >
                                                        <CheckCircle size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    className={cx('rejectBtn')}
                                                    onClick={() => handleDelete(post.id)}
                                                    title="Xóa bài viết"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className={cx('empty')}>Không có dữ liệu bài viết</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination Controls can go here */}
        </div>
    );
};

export default Posts;
