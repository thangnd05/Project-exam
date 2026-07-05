import React, { useState, useEffect } from 'react';
import { Badge, Button } from 'react-bootstrap';
import { Eye, CheckCircle, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import routes from '~/config/Routes';
import ConfirmDeleteModal from '~/components/common/modal/ConfirmDeleteModal';
import ConfirmActionModal from '~/components/common/modal/ConfirmActionModal';
import { AdminPageHeader, AdminTable, AdminToolbar } from '../components/common';
import { usePosts, useApprovePost, useDeletePost } from './hooks/usePosts';

const STATUS_VARIANT = { APPROVED: 'success', PENDING: 'warning' };

const STATUS_FILTERS = [
    { value: 'PENDING', label: 'Chờ duyệt' },
    { value: 'APPROVED', label: 'Đã duyệt' },
    { value: 'ALL', label: 'Tất cả' },
];

const Posts = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('PENDING');
    const [currentPage, setCurrentPage] = useState(0);
    const [approvingPost, setApprovingPost] = useState(null);
    const [deletingPost, setDeletingPost] = useState(null);

    const PAGE_SIZE = 10;

    const postsQuery = usePosts({
        page: currentPage,
        size: PAGE_SIZE,
        status: statusFilter,
        keyword: searchQuery,
    });
    const approvePost = useApprovePost();
    const deletePostMutation = useDeletePost();

    const posts = postsQuery.data?.content || [];
    const totalPages = postsQuery.data?.totalPages || 0;
    const totalElements = postsQuery.data?.totalElements || 0;
    const loading = postsQuery.isLoading;

    // Reset về trang đầu khi đổi bộ lọc/từ khoá
    useEffect(() => {
        setCurrentPage(0);
    }, [statusFilter, searchQuery]);

    useEffect(() => {
        if (postsQuery.isError) {
            toast.error('Lỗi khi tải danh sách bài viết');
        }
    }, [postsQuery.isError]);

    const handleApprove = () => {
        if (!approvingPost) return;
        approvePost.mutate(approvingPost.id, {
            onSuccess: () => {
                toast.success('Đã duyệt bài viết');
                setApprovingPost(null);
            },
            onError: () => {
                toast.error('Lỗi khi duyệt bài viết');
            },
        });
    };

    const handleDelete = () => {
        if (!deletingPost) return;
        deletePostMutation.mutate(deletingPost.id, {
            onSuccess: () => {
                toast.success('Đã xóa bài viết');
                setDeletingPost(null);
            },
            onError: () => {
                toast.error('Lỗi khi xóa bài viết');
            },
        });
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
                onPageChange={setCurrentPage}
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
