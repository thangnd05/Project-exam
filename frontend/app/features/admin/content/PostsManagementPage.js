'use client';

import { useState, useEffect } from 'react';
import { Badge, Button } from 'react-bootstrap';
import { Eye, CheckCircle, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import classNames from 'classnames/bind';

import routes from '@/app/configs/Routes';
import useDebouncedValue from '@/app/hooks/useDebouncedValue';
import ConfirmDeleteModal from '@/app/components/modal/ConfirmDeleteModal';
import ConfirmModal from '@/app/components/modal/ConfirmModal';
import { AdminPageHeader, AdminTable, AdminToolbar } from '@/app/components/admin/common';
import styles from '@/app/components/admin/common/adminKit.module.scss';

const cx = classNames.bind(styles);
import { useAdminPosts, useApprovePost, useDeletePost } from '@/app/features/admin/content/hooks/useAdminPosts';

const STATUS_VARIANT = { APPROVED: 'success', PENDING: 'warning' };

const STATUS_FILTERS = [
    { value: 'PENDING', label: 'Chờ duyệt' },
    { value: 'APPROVED', label: 'Đã duyệt' },
    { value: 'ALL', label: 'Tất cả' },
];

const PostsManagementPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('PENDING');
    const [currentPage, setCurrentPage] = useState(0);
    const [approvingPost, setApprovingPost] = useState(null);
    const [deletingPost, setDeletingPost] = useState(null);

    const PAGE_SIZE = 10;
    const debouncedSearch = useDebouncedValue(searchQuery, 300);

    const {
        posts,
        totalPages,
        totalElements,
        isLoading: loading,
        isError,
    } = useAdminPosts({
        page: currentPage,
        size: PAGE_SIZE,
        status: statusFilter,
        keyword: debouncedSearch,
    });
    const approvePost = useApprovePost();
    const deletePostMutation = useDeletePost();

    useEffect(() => {
        setCurrentPage(0);
    }, [statusFilter, debouncedSearch]);

    useEffect(() => {
        if (isError) {
            toast.error('Lỗi khi tải danh sách bài viết');
        }
    }, [isError]);

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
                            className={cx('pillBtn', {active: statusFilter === item.value})}
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

            <ConfirmModal
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

export default PostsManagementPage;
