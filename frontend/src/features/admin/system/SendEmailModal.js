'use client';

import {useEffect, useMemo, useState} from 'react';
import {Form, Spinner} from 'react-bootstrap';
import {toast} from 'react-toastify';

import BaseModal from '~/shared/ui/modal/BaseModal';
import ModalActionFooter from '~/shared/ui/modal/ModalActionFooter';
import {AdminFieldError} from '../components/common';
import {useEmailAudience, useEmailMutations} from './hooks/useAdminEmails';

const PREMIUM_FILTERS = [
  {value: 'ALL', label: 'Tất cả'},
  {value: 'PREMIUM', label: 'Premium'},
  {value: 'NORMAL', label: 'Thường'},
];

/**
 * Chọn người nhận rồi gửi. Backend chỉ nhận danh sách userId  mọi cách lọc (vai trò,
 * premium, từ khóa) làm ngay tại đây nên thêm tiêu chí lọc mới không phải đụng backend.
 */
function SendEmailModal({show, email, onClose}) {
  const [keyword, setKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [premiumFilter, setPremiumFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {users, isLoading} = useEmailAudience(show);
  const {sendEmail} = useEmailMutations();

  useEffect(() => {
    if (show) {
      setKeyword('');
      setRoleFilter('ALL');
      setPremiumFilter('ALL');
      setSelectedIds([]);
      setErrorMessage('');
    }
  }, [show]);

  const roles = useMemo(() => {
    const names = new Set(users.map((user) => user.roleName).filter(Boolean));
    return Array.from(names);
  }, [users]);

  const filteredUsers = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    return users.filter((user) => {
      if (roleFilter !== 'ALL' && user.roleName !== roleFilter) {
        return false;
      }
      if (premiumFilter === 'PREMIUM' && !user.isPremium) {
        return false;
      }
      if (premiumFilter === 'NORMAL' && user.isPremium) {
        return false;
      }
      if (!normalized) {
        return true;
      }
      return (
        (user.fullName || '').toLowerCase().includes(normalized) ||
        (user.userName || '').toLowerCase().includes(normalized) ||
        (user.email || '').toLowerCase().includes(normalized)
      );
    });
  }, [users, keyword, roleFilter, premiumFilter]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allFilteredSelected =
    filteredUsers.length > 0 && filteredUsers.every((user) => selectedSet.has(user.userId));

  const toggleUser = (userId) => {
    setSelectedIds((previous) =>
      previous.includes(userId)
        ? previous.filter((id) => id !== userId)
        : [...previous, userId],
    );
  };

  const toggleAllFiltered = () => {
    const filteredIds = filteredUsers.map((user) => user.userId);
    setSelectedIds((previous) => {
      if (allFilteredSelected) {
        return previous.filter((id) => !filteredIds.includes(id));
      }
      return Array.from(new Set([...previous, ...filteredIds]));
    });
  };

  const handleSubmit = async () => {
    setErrorMessage('');
    if (selectedIds.length === 0) {
      setErrorMessage('Hãy chọn ít nhất một người nhận.');
      return;
    }
    setSubmitting(true);
    try {
      await sendEmail({emailId: email.emailId, userIds: selectedIds});
      toast.success(`Đã đưa ${selectedIds.length} email vào hàng gửi.`);
      onClose();
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Không gửi được email.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BaseModal
      show={show}
      onClose={submitting ? undefined : onClose}
      title={`Gửi email: ${email?.name || email?.subject || ''}`}
      maxWidth={760}
      footer={
        <ModalActionFooter
          onCancel={onClose}
          onSubmit={handleSubmit}
          cancelLabel="Hủy"
          submitLabel={`Gửi cho ${selectedIds.length} người`}
          loading={submitting}
        />
      }
    >
      <div className="d-flex flex-wrap gap-2 mb-3">
        <Form.Control
          className="flex-fill"
          style={{minWidth: '18rem'}}
          placeholder="Tìm theo tên, tài khoản hoặc email..."
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
        <Form.Select
          style={{maxWidth: '16rem'}}
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value)}
        >
          <option value="ALL">Mọi vai trò</option>
          {roles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </Form.Select>
        <Form.Select
          style={{maxWidth: '12rem'}}
          value={premiumFilter}
          onChange={(event) => setPremiumFilter(event.target.value)}
        >
          {PREMIUM_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Form.Select>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-2">
        <Form.Check
          type="checkbox"
          label={`Chọn tất cả ${filteredUsers.length} người đang lọc`}
          checked={allFilteredSelected}
          onChange={toggleAllFiltered}
          disabled={filteredUsers.length === 0}
        />
        <span className="small text-muted">Đã chọn: {selectedIds.length}</span>
      </div>

      <div
        style={{
          maxHeight: '32rem',
          overflowY: 'auto',
          border: '1px solid var(--border-color)',
          borderRadius: '0.8rem',
        }}
      >
        {isLoading && (
          <div className="text-center py-4">
            <Spinner animation="border" size="sm" /> Đang tải danh sách người dùng...
          </div>
        )}
        {!isLoading && filteredUsers.length === 0 && (
          <div className="text-center text-muted py-4">Không có người dùng nào khớp bộ lọc.</div>
        )}
        {!isLoading &&
          filteredUsers.map((user) => (
            <label
              key={user.userId}
              className="d-flex align-items-center gap-2 px-3 py-2 border-bottom"
              style={{cursor: 'pointer'}}
            >
              <input
                type="checkbox"
                checked={selectedSet.has(user.userId)}
                onChange={() => toggleUser(user.userId)}
              />
              <span className="d-flex flex-column">
                <span className="fw-semibold">
                  {user.fullName || user.userName}
                  {user.isPremium && <span className="badge bg-warning text-dark ms-2">Premium</span>}
                </span>
                <span className="small text-muted">
                  {user.email} · {user.roleName}
                </span>
              </span>
            </label>
          ))}
      </div>

      <AdminFieldError message={errorMessage} />
    </BaseModal>
  );
}

export default SendEmailModal;
