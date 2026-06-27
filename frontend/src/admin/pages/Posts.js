import React, { useState, useEffect, useCallback } from 'react';
import { Badge, Button } from 'react-bootstrap';
import { Eye, CheckCircle, Trash2 } from 'lucide-react';
import { getPosts, updatePostStatus, deletePost } from '~/api/postApi';
import { toast } from 'react-toastify';
import routes from '~/config/Routes';
import ConfirmDeleteModal from '~/components/common/modal/ConfirmDeleteModal';
import ConfirmActionModal from '~/components/common/modal/ConfirmActionModal';
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
    const [approvingPost, setApprovingPost] = useState(null);
    const [deletingPost, setDeletingPost] = useState(null);

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

    const handleApprove = async () => {
        if (!approvingPost) return;
        try {
            await updatePostStatus(approvingPost.id, 'APPROVED');
            toast.success('Đã duyệt bài viết');
            setApprovingPost(null);
            fetchPosts(currentPage);
        } catch (error) {
            toast.error('Lỗi khi duyệt bài viết');
        }
    };

    const handleDelete = async () => {
        if (!deletingPost) return;
        try {
            await deletePost(deletingPost.id);
            toast.success('Đã xóa bài viết');
            setDeletingPost(null);
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
                page={currentPage}
                totalPages={totalPages}
                totalElements={totalElements}
                pageSize={PAGE_SIZE}
                itemLabel="bài viết"
                onPageChange={fetchPosts}
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
                            <button title="Duyệt" onClick={() => setApprovingPost(post)}>
                                <CheckCircle size={14} />
                            </button>
                        )}
                        <button
                            className="danger"
                            title="Xóa bài viết"
                            onClick={() => setDeletingPost(post)}
                        >
                            <Trash2 size={14} />
                        </button>
                    </>
                )}
            />

            <ConfirmActionModal
                show={Boolean(approvingPost)}
                onClose={() => setApprovingPost(null)}
                onConfirm={handleApprove}
                icon={CheckCircle}
                title="Duyệt bài viết"
                message={`Duyệt bài viết "${approvingPost?.title}"?`}
                confirmText="Duyệt"
            />

            <ConfirmDeleteModal
                show={Boolean(deletingPost)}
                onClose={() => setDeletingPost(null)}
                onConfirm={handleDelete}
                title="Xác nhận xóa bài viết"
                message={`Xóa bài viết "${deletingPost?.title}"? Hành động này không thể hoàn tác.`}
            />
        </div>
    );
};

export default Posts;
