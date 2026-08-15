'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'react-toastify';
import classNames from 'classnames/bind';
import { IoPeopleOutline, IoCheckmarkCircle, IoTimeOutline, IoPersonRemoveOutline, IoSearchOutline, IoRefreshOutline, IoChevronDown, IoChevronUp } from 'react-icons/io5';
import { Spinner, Badge, Table, Tabs, Tab } from 'react-bootstrap';

import styles from './ClassMemberManagementPage.module.scss';
import ConfirmDeleteModal from '@/app/components/modal/ConfirmDeleteModal';
import PageHeader from '@/app/components/PageHeader/PageHeader';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import { useClassMembers } from '@/app/features/classes/members/hooks/useClassMembers';

const cx = classNames.bind(styles);

const ClassMemberManagementPage = () => {
  const { classId } = useParams();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'joinedAt', direction: 'desc' });

  const {
    classInfo,
    allMembers,
    pendingMembers,
    isLoading: loading,
    actionLoading,
    approveMemberMutation,
    approveAllMutation,
    removeMemberMutation,
    refreshMembers,
  } = useClassMembers(classId);

  const handleApproveMember = async (userId) => {
    try {
      await approveMemberMutation.mutateAsync({
        classId: String(classId),
        userId: String(userId),
      });
      toast.success('Duyệt học sinh thành công!');
    } catch (err) {
      console.error('Lỗi duyệt học sinh:', err);
      const msg = err?.response?.data?.error || 'Không thể duyệt học sinh';
      toast.error(msg);
    }
  };

  const handleApproveAll = async () => {
    if (pendingMembers.length === 0) {
      toast.warning('Không có học sinh nào đang chờ duyệt');
      return;
    }
    try {
      const result = await approveAllMutation.mutateAsync(classId);
      toast.success(result.message || 'Đã duyệt tất cả học sinh!');
    } catch (err) {
      console.error('Lỗi duyệt tất cả:', err);
      const msg = err?.response?.data?.error || 'Không thể duyệt tất cả';
      toast.error(msg);
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToDelete) return;
    try {
      await removeMemberMutation.mutateAsync({
        classId: String(classId),
        userId: String(memberToDelete.userId),
      });
      toast.success('Đã xóa học sinh khỏi lớp!');
      setShowDeleteModal(false);
      setMemberToDelete(null);
    } catch (err) {
      console.error('Lỗi xóa học sinh:', err);
      const msg = err?.response?.data?.error || 'Không thể xóa học sinh';
      toast.error(msg);
    }
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const getSortedMembers = (members) => {
    const sorted = [...members];
    sorted.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (sortConfig.key === 'fullName') {
        aVal = String(aVal || '').toLowerCase();
        bVal = String(bVal || '').toLowerCase();
      }
      if (sortConfig.key === 'joinedAt') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  };

  const getFilteredMembers = (members) => {
    const filtered = members.filter((m) =>
      `${m.fullName || ''}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
    return getSortedMembers(filtered);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      APPROVED: { variant: 'success', label: 'Đã duyệt' },
      PENDING: { variant: 'warning', label: 'Chờ duyệt'},
    };
    const s = statusMap[status] || { variant: 'secondary', label: status, icon: null };
    return (
      <Badge bg={s.variant} className={cx('status-badge')}>
        {s.icon} {s.label}
      </Badge>
    );
  };

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <IoChevronUp /> : <IoChevronDown />;
  };

  const renderMemberRow = (member, showActions = false) => (
    <tr key={member.id} className={cx('member-row')}>
      <td className={cx('td-id')}>
        <span className={cx('user-id')}>{member.fullName || 'Chưa cập nhật tên'}</span>
      </td>
      <td className={cx('td-joined')}>{formatDate(member.joinedAt)}</td>
      <td className={cx('td-status')}>{getStatusBadge(member.status)}</td>
      {showActions && (
        <td className={cx('td-actions')}>
          <div className={cx('action-buttons')}>
            {member.status === 'PENDING' && (
              <ButtonPrime
                variant="primary"
                size="sm"
                onClick={() => handleApproveMember(member.userId)}
                disabled={actionLoading}
                title="Duyệt học sinh"
              >
                <IoCheckmarkCircle />
                <span>Duyệt</span>
              </ButtonPrime>
            )}
            <ButtonPrime
              variant="dangerGhost"
              size="sm"
              onClick={() => {
                setMemberToDelete(member);
                setShowDeleteModal(true);
              }}
              disabled={actionLoading}
              title="Xóa khỏi lớp"
            >
              <IoPersonRemoveOutline />
              <span>Xóa</span>
            </ButtonPrime>
          </div>
        </td>
      )}
    </tr>
  );

  const EmptyState = ({ message, icon: Icon }) => (
    <div className={cx('empty-state')}>
      <div className={cx('empty-icon-wrapper')}>
        <Icon />
      </div>
      <p>{message}</p>
    </div>
  );

  if (loading) {
    return (
      <div className={cx('wrapper')}>
        <div className={cx('loading-container')}>
          <Spinner animation="grow" variant="primary" size="lg" />
          <p>Đang tải danh sách học sinh...</p>
        </div>
      </div>
    );
  }

  const approvedMembers = allMembers.filter((m) => m.status === 'APPROVED');
  const filteredApproved = getFilteredMembers(approvedMembers);
  const filteredPending = getFilteredMembers(pendingMembers);

  return (
    <div className={cx('wrapper')}>

      <button className={cx('back-btn')} onClick={() => router.back()}>
        <span>Quay lại</span>
      </button>

      <PageHeader
        title={classInfo?.className || `Lớp #${classId}`}
        label="Quản lý học sinh"
        badgeLabel={classInfo?.classQr ? `Mã lớp: ${classInfo.classQr}` : undefined}
      >
        <div className={cx('header-stats')}>
          <div className={cx('stat-item')}>
            <span className={cx('stat-number')}>{approvedMembers.length}</span>
            <span className={cx('stat-label')}>Đã duyệt</span>
          </div>
          <div className={cx('stat-divider')} />
          <div className={cx('stat-item', 'pending')}>
            <span className={cx('stat-number')}>{pendingMembers.length}</span>
            <span className={cx('stat-label')}>Chờ duyệt</span>
          </div>
          <div className={cx('stat-divider')} />
          <div className={cx('stat-item')}>
            <span className={cx('stat-number')}>{allMembers.length}</span>
            <span className={cx('stat-label')}>Tổng cộng</span>
          </div>
        </div>
      </PageHeader>

      <div className={cx('toolbar')}>
        <div className={cx('search-box')}>
          <IoSearchOutline className={cx('search-icon')} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên học sinh..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cx('search-input')}
          />
        </div>

        <div className={cx('toolbar-actions')}>
          <ButtonPrime
            variant="outline"
            onClick={() =>
              refreshMembers().then(() => toast.success('Đã làm mới!'))
            }
          >
            <IoRefreshOutline />
            <span>Làm mới</span>
          </ButtonPrime>

          {pendingMembers.length > 0 && (
            <ButtonPrime
              variant="primary"
              onClick={handleApproveAll}
              disabled={actionLoading}
            >
              <span>Duyệt tất cả ({pendingMembers.length})</span>
            </ButtonPrime>
          )}
        </div>
      </div>

      <div className={cx('tabs-container')}>
        <Tabs defaultActiveKey="approved" className={cx('custom-tabs')}>

          <Tab
            eventKey="approved"
            title={
              <span className={cx('tab-title')}>
                Đã duyệt
                <Badge bg="success" pill className={cx('tab-badge')}>
                  {approvedMembers.length}
                </Badge>
              </span>
            }
          >
            <div className={cx('tab-content-wrapper')}>
              {filteredApproved.length === 0 ? (
                <EmptyState
                  message={
                    searchTerm
                      ? 'Không tìm thấy học sinh nào'
                      : 'Chưa có học sinh nào được duyệt'
                  }
                  icon={IoPeopleOutline}
                />
              ) : (
                <div className={cx('table-wrapper')}>
                  <Table hover className={cx('members-table')}>
                    <thead>
                      <tr>
                        <th
                          className={cx('th-sortable')}
                          onClick={() => handleSort('fullName')}
                        >
                          Họ và tên học sinh {renderSortIcon('fullName')}
                        </th>
                        <th
                          className={cx('th-sortable')}
                          onClick={() => handleSort('joinedAt')}
                        >
                          Ngày tham gia {renderSortIcon('joinedAt')}
                        </th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>{filteredApproved.map((m) => renderMemberRow(m, true))}</tbody>
                  </Table>
                </div>
              )}
            </div>
          </Tab>

          <Tab
            eventKey="pending"
            title={
              <span className={cx('tab-title')}>
                Chờ duyệt
                {pendingMembers.length > 0 && (
                  <Badge bg="warning" pill className={cx('tab-badge', 'pending')}>
                    {pendingMembers.length}
                  </Badge>
                )}
              </span>
            }
          >
            <div className={cx('tab-content-wrapper')}>
              {filteredPending.length === 0 ? (
                <EmptyState
                  message={
                    searchTerm
                      ? 'Không tìm thấy học sinh nào đang chờ'
                      : 'Không có học sinh nào đang chờ duyệt'
                  }
                  icon={IoTimeOutline}
                />
              ) : (
                <>
                  <div className={cx('pending-notice')}>
                    <IoTimeOutline />
                    <span>
                      Có <strong>{filteredPending.length}</strong> học sinh đang chờ được
                      duyệt
                    </span>
                  </div>
                  <div className={cx('table-wrapper')}>
                    <Table hover className={cx('members-table')}>
                      <thead>
                        <tr>
                          <th
                            className={cx('th-sortable')}
                            onClick={() => handleSort('fullName')}
                          >
                            Họ và tên học sinh {renderSortIcon('fullName')}
                          </th>
                          <th
                            className={cx('th-sortable')}
                            onClick={() => handleSort('joinedAt')}
                          >
                            Ngày yêu cầu {renderSortIcon('joinedAt')}
                          </th>
                          <th>Trạng thái</th>
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>{filteredPending.map((m) => renderMemberRow(m, true))}</tbody>
                    </Table>
                  </div>
                </>
              )}
            </div>
          </Tab>
        </Tabs>
      </div>

      <ConfirmDeleteModal
        show={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setMemberToDelete(null);
        }}
        onConfirm={handleRemoveMember}
        title="Xóa học sinh khỏi lớp"
        message={`Bạn có chắc chắn muốn xóa học sinh "${
          memberToDelete?.fullName || memberToDelete?.userId
        }" khỏi lớp này?`}
      />
    </div>
  );
};

export default ClassMemberManagementPage;
