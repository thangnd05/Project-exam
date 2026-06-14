import React, { useState, useEffect, useCallback } from 'react';
import { Badge, Button } from 'react-bootstrap';
import { Eye, CheckCircle, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getPosts, updatePostStatus, deletePost } from '~/api/postApi';
import { toast } from 'react-toastify';
import routes from '~/config/Routes';
import { AdminPageHeader, AdminTable, AdminToolbar } from '../components/common';

const STATUS_VARIANT = { APPROVED: 'success', PENDING: 'warning' };

const STATUS_FILTERS = [
    { value: 'PENDING', label: 'Chờ duyệt' },
    { value: 'APPROVED', label: 'Đã duyệt' },
    { value: 'ALL', label: 'Tất cả' },
];

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
                <div>
                    <div className="fw-semibold">{post.title}</div>
                    <div className="small text-secondary">
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
        <div className="d-flex flex-column gap-3">
            <AdminPageHeader
                title="Duyệt bài viết"
                description="Duyệt bài chờ duyệt hoặc xóa bài không phù hợp. Bài bị xóa sẽ biến mất khỏi danh sách của tác giả."
            />

            <AdminToolbar
                searchValue={searchQuery}
                onSearchChange={(value) => setSearchQuery(value)}
                searchPlaceholder="Tìm kiếm bài viết..."
            >
                <div className="d-flex gap-2">
                    {STATUS_FILTERS.map((item) => (
                        <Button
                            key={item.value}
                            size="sm"
                            className="rounded-pill"
                            variant={statusFilter === item.value ? 'primary' : 'outline-secondary'}
                            onClick={() => setStatusFilter(item.value)}
                        >
                            {item.label}
                        </Button>
                    ))}
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
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <span className="text-secondary small">
                        Hiển thị {currentPage * PAGE_SIZE + 1}-
                        {Math.min(currentPage * PAGE_SIZE + posts.length, totalElements)} trong {totalElements} bài viết
                    </span>
                    <div className="d-flex align-items-center gap-2">
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            disabled={currentPage <= 0}
                            onClick={() => fetchPosts(currentPage - 1)}
                        >
                            <ChevronLeft size={16} />
                        </Button>
                        <span className="small fw-semibold">
                            {currentPage + 1}/{totalPages}
                        </span>
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            disabled={currentPage >= totalPages - 1}
                            onClick={() => fetchPosts(currentPage + 1)}
                        >
                            <ChevronRight size={16} />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Posts;
