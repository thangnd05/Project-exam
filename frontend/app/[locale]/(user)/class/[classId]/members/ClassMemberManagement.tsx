'use client';

import { useParams } from 'next/navigation';
import { useRouter } from '@/app/i18n/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'react-toastify';
import classNames from 'classnames/bind';
import { Users, CircleCheck, Clock, UserMinus, Search, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge, Table, Tabs, Tab } from 'react-bootstrap';

import styles from './ClassMemberManagement.module.scss';
import ConfirmDeleteModal from '@/app/components/modal/ConfirmDeleteModal';
import PageHeader from '@/app/components/PageHeader/PageHeader';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import EmptyState from '@/app/components/EmptyState/EmptyState';
import { useClassMembers } from './_hooks/useClassMembers';
import { ClassMemberStatus } from '@/app/enums';
import type { ClassMemberResponse } from '@/app/types';
import { getApiErrorMessage } from '@/app/utils/apiError';
import Loading from '@/app/components/Loading/Loading';
import { formatDateTime } from '@/app/utils/format-date-time';

const cx = classNames.bind(styles);

type SortKey = 'fullName' | 'joinedAt';
type SortConfig = { key: SortKey; direction: 'asc' | 'desc' };

const ClassMemberManagement = () => {
  const { classId } = useParams<{ classId: string }>();
  const t = useTranslations('Classes');
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<ClassMemberResponse | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'joinedAt', direction: 'desc' });

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

  const handleApproveMember = async (userId?: string) => {
    try {
      await approveMemberMutation.mutateAsync({
        classId: String(classId),
        userId: String(userId),
      });
      toast.success(t('members.approveSuccess'));
    } catch (err) {
      console.error('Lỗi duyệt học sinh:', err);
      const msg = getApiErrorMessage(err, t('members.approveFailed'));
      toast.error(msg);
    }
  };

  const handleApproveAll = async () => {
    if (pendingMembers.length === 0) {
      toast.warning(t('members.noPending'));
      return;
    }
    try {
      const result = await approveAllMutation.mutateAsync(classId);
      toast.success(result.message || t('members.approveAllSuccess'));
    } catch (err) {
      console.error('Lỗi duyệt tất cả:', err);
      const msg = getApiErrorMessage(err, t('members.approveAllFailed'));
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
      toast.success(t('members.removeSuccess'));
      setShowDeleteModal(false);
      setMemberToDelete(null);
    } catch (err) {
      console.error('Lỗi xóa học sinh:', err);
      const msg = getApiErrorMessage(err, t('members.removeFailed'));
      toast.error(msg);
    }
  };

  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const getSortedMembers = (members: ClassMemberResponse[]) => {
    const sortValue = (m: ClassMemberResponse): string | number =>
      sortConfig.key === 'fullName'
        ? String(m.fullName || '').toLowerCase()
        : m.joinedAt ? new Date(m.joinedAt).getTime() : NaN;
    const sorted = [...members];
    sorted.sort((a, b) => {
      const aVal = sortValue(a);
      const bVal = sortValue(b);
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  };

  const getFilteredMembers = (members: ClassMemberResponse[]) => {
    const filtered = members.filter((m) =>
      `${m.fullName || ''}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
    return getSortedMembers(filtered);
  };


  const getStatusBadge = (status?: ClassMemberStatus) => {
    const statusMap: Record<string, { variant: string; label?: React.ReactNode; icon?: React.ReactNode }> = {
      APPROVED: { variant: 'success', label: t('common.approved') },
      PENDING: { variant: 'warning', label: t('common.pending')},
    };
    const s = statusMap[status as string] || { variant: 'secondary', label: status, icon: null };
    return (
      <Badge bg={s.variant} className={cx('status-badge')}>
        {s.icon} {s.label}
      </Badge>
    );
  };

  const renderSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp size="1em" /> : <ChevronDown size="1em" />;
  };

  const renderMemberRow = (member: ClassMemberResponse, showActions = false) => (
    <tr key={member.id} className={cx('member-row')}>
      <td className={cx('td-id')}>
        <span className={cx('user-id')}>{member.fullName || t('members.unnamed')}</span>
      </td>
      <td className={cx('td-joined')}>{formatDateTime(member.joinedAt)}</td>
      <td className={cx('td-status')}>{getStatusBadge(member.status)}</td>
      {showActions && (
        <td className={cx('td-actions')}>
          <div className={cx('action-buttons')}>
            {member.status === ClassMemberStatus.PENDING && (
              <ButtonPrime
                variant="primary"
                size="sm"
                onClick={() => handleApproveMember(member.userId)}
                disabled={actionLoading}
                title={t('members.approveTitle')}
              >
                <CircleCheck size="1em" />
                <span>{t('members.approve')}</span>
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
              title={t('members.removeTitle')}
            >
              <UserMinus size="1em" />
              <span>{t('members.remove')}</span>
            </ButtonPrime>
          </div>
        </td>
      )}
    </tr>
  );


  if (loading) {
    return (
      <div className={cx('wrapper')}>
        <Loading label={t('members.loading')} />
      </div>
    );
  }

  const approvedMembers = allMembers.filter((m) => m.status === ClassMemberStatus.APPROVED);
  const filteredApproved = getFilteredMembers(approvedMembers);
  const filteredPending = getFilteredMembers(pendingMembers);

  return (
    <div className={cx('wrapper')}>

      <ButtonPrime variant="outline" size="sm" className={cx('back-btn')} onClick={() => router.back()}>
        <span>{t('members.back')}</span>
      </ButtonPrime>

      <PageHeader
        title={classInfo?.className || t('members.classFallback', { id: classId })}
        label={t('common.manageStudents')}
        badgeLabel={classInfo?.classQr ? t('members.classCode', { code: classInfo.classQr }) : undefined}
      >
        <div className={cx('header-stats')}>
          <div className={cx('stat-item')}>
            <span className={cx('stat-number')}>{approvedMembers.length}</span>
            <span className={cx('stat-label')}>{t('common.approved')}</span>
          </div>
          <div className={cx('stat-divider')} />
          <div className={cx('stat-item', 'pending')}>
            <span className={cx('stat-number')}>{pendingMembers.length}</span>
            <span className={cx('stat-label')}>{t('common.pending')}</span>
          </div>
          <div className={cx('stat-divider')} />
          <div className={cx('stat-item')}>
            <span className={cx('stat-number')}>{allMembers.length}</span>
            <span className={cx('stat-label')}>{t('members.total')}</span>
          </div>
        </div>
      </PageHeader>

      <div className={cx('toolbar')}>
        <div className={cx('search-box')}>
          <Search size="1em" className={cx('search-icon')} />
          <input
            type="text"
            placeholder={t('members.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cx('search-input')}
          />
        </div>

        <div className={cx('toolbar-actions')}>
          <ButtonPrime
            variant="outline"
            onClick={() =>
              refreshMembers().then(() => toast.success(t('members.refreshed')))
            }
          >
            <RefreshCw size="1em" />
            <span>{t('members.refresh')}</span>
          </ButtonPrime>

          {pendingMembers.length > 0 && (
            <ButtonPrime
              variant="primary"
              onClick={handleApproveAll}
              disabled={actionLoading}
            >
              <span>{t('members.approveAll', { count: pendingMembers.length })}</span>
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
                {t('common.approved')}
                <Badge bg="success" pill className={cx('tab-badge')}>
                  {approvedMembers.length}
                </Badge>
              </span>
            }
          >
            <div className={cx('tab-content-wrapper')}>
              {filteredApproved.length === 0 ? (
                <EmptyState
                  compact
                  icon={searchTerm ? Search : Users}
                  title={searchTerm ? t('members.noMatch') : t('members.noApproved')}
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
                          {t('members.fullName')} {renderSortIcon('fullName')}
                        </th>
                        <th
                          className={cx('th-sortable')}
                          onClick={() => handleSort('joinedAt')}
                        >
                          {t('members.joinedAt')} {renderSortIcon('joinedAt')}
                        </th>
                        <th>{t('members.status')}</th>
                        <th>{t('members.actions')}</th>
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
                {t('common.pending')}
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
                  compact
                  icon={searchTerm ? Search : Clock}
                  title={searchTerm ? t('members.noPendingMatch') : t('members.noPending')}
                />
              ) : (
                <>
                  <div className={cx('pending-notice')}>
                    <Clock size="1em" />
                    <span>
                      {t.rich('members.pendingNotice', {
                        count: filteredPending.length,
                        strong: (chunks) => <strong>{chunks}</strong>,
                      })}
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
                            {t('members.fullName')} {renderSortIcon('fullName')}
                          </th>
                          <th
                            className={cx('th-sortable')}
                            onClick={() => handleSort('joinedAt')}
                          >
                            {t('members.requestedAt')} {renderSortIcon('joinedAt')}
                          </th>
                          <th>{t('members.status')}</th>
                          <th>{t('members.actions')}</th>
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
        title={t('members.removeModalTitle')}
        message={t('members.removeModalMessage', {
          name: String(memberToDelete?.fullName || memberToDelete?.userId),
        })}
      />
    </div>
  );
};

export default ClassMemberManagement;
