import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from 'react-bootstrap';
import classNames from 'classnames/bind';
import { Eye, CheckCircle, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getPosts, updatePostStatus, deletePost } from '~/api/postApi';
import { toast } from 'react-toastify';
import styles from './Posts.module.scss';
import routes from '~/config/Routes';
import { AdminPageHeader, AdminTable, AdminToolbar } from '../components/common';

const cx = classNames.bind(styles);

const STATUS_VARIANT = { APPROVED: 'success', PENDING: 'warning' };

const Posts = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('PENDING');
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    const PAGE_SIZE = 10;

    const fetchPosts = useCallback(async (page = 0) => {
        setLoading(true);
        try {
            const data = await getPosts({
                page,
                size: PAGE_SIZE,
                status: statusFilter === 'ALL' ? undefined : statusFilter,
                keyword: searchQuery
            });
            setPosts(data.content || []);
            setCurrentPage(data.currentPage || 0);
            setTotalPages(data.totalPages || 0);
            setTotalElements(data.totalElements || 0);
        } catch (error) {
            toast.error('Lỗi khi tải danh sách bài viết');
        } finally {
            setLoading(false);
        }
    }, [statusFilter, searchQuery]);

    useEffect(() => {
        fetchPosts(0);
    }, [fetchPosts]);

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

    const columns = [
        {
            key: 'title',
            header: 'Tiêu đề',
            render: (post) => (
                <div className={cx('titleCell')}>
                    <div className={cx('postTitle')}>{post.title}</div>
                    <div className={cx('postCategory')}>
                        {post.categories?.[0]?.name || 'Không có danh mục'}
                    </div>
                </div>
            ),
        },
        { key: 'authorName', header: 'Tác giả' },
        {
            key: 'createdAt',
            header: 'Ngày tạo',
            render: (post) => new Date(post.createdAt).toLocaleDateString('vi-VN'),
        },
        {
            key: 'status',
            header: 'Trạng thái',
            render: (post) => (
                <Badge bg={STATUS_VARIANT[post.status] || 'secondary'}>{post.status}</Badge>
            ),
        },
    ];

    return (
        <div className={cx('wrapper')}>
            <AdminPageHeader
                title="Duyệt bài viết"
                description="Duyệt bài chờ duyệt hoặc xóa bài không phù hợp. Bài bị xóa sẽ biến mất khỏi danh sách của tác giả."
            />

            <AdminToolbar
                searchValue={searchQuery}
                onSearchChange={(value) => setSearchQuery(value)}
                searchPlaceholder="Tìm kiếm bài viết..."
            >
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
            </AdminToolbar>

            <AdminTable
                showIndex
                columns={columns}
                data={posts}
                loading={loading}
                emptyText="Không có dữ liệu bài viết"
                getRowKey={(post) => post.id}
                rowActions={(post) => (
                    <>
                        <button
                            title="Xem chi tiết"
                            onClick={() =>
                                window.open(
                                    routes.postDetail.replace(':postId', post.id),
                                    '_blank',
                                )
                            }
                        >
                            <Eye size={14} />
                        </button>
                        {post.status !== 'APPROVED' && (
                            <button title="Duyệt" onClick={() => handleApprove(post.id)}>
                                <CheckCircle size={14} />
                            </button>
                        )}
                        <button
                            className="danger"
                            title="Xóa bài viết"
                            onClick={() => handleDelete(post.id)}
                        >
                            <Trash2 size={14} />
                        </button>
                    </>
                )}
            />

            {!loading && totalElements > 0 && (
                <div className={cx('pagination')}>
                    <span className={cx('paginationInfo')}>
                        Hiển thị {currentPage * PAGE_SIZE + 1}-
                        {Math.min(currentPage * PAGE_SIZE + posts.length, totalElements)} trong {totalElements} bài viết
                    </span>
                    <div className={cx('paginationBtns')}>
                        <button
                            className={cx('pageBtn')}
                            disabled={currentPage <= 0}
                            onClick={() => fetchPosts(currentPage - 1)}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className={cx('pageNumber')}>
                            {currentPage + 1}/{totalPages}
                        </span>
                        <button
                            className={cx('pageBtn')}
                            disabled={currentPage >= totalPages - 1}
                            onClick={() => fetchPosts(currentPage + 1)}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Posts;
