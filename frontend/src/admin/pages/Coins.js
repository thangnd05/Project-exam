import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Button, Form, Modal, Spinner, Table} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {Coins, Edit, Plus, Search, Trash2} from 'lucide-react';

import {
  createCoinWallet,
  deleteCoinWallet,
  getCoinWallets,
  updateCoinBalance,
} from '../../api/coinApi';
import {getUsers} from '../../api/userApi';
import ConfirmDeleteModal from '../../components/common/modal/ConfirmDeleteModal';
import styles from './Coins.module.scss';

const cx = classNames.bind(styles);

const defaultFormState = {
  userId: '',
  balance: 0,
};

function CoinsManagement() {
  const [wallets, setWallets] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingWallet, setEditingWallet] = useState(null); // null = đang tạo mới
  const [formState, setFormState] = useState(defaultFormState);
  const [userOptions, setUserOptions] = useState([]); // user chưa có ví (để tạo mới)
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingWallet, setDeletingWallet] = useState(null);

  const loadWallets = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await getCoinWallets();
      setWallets(Array.isArray(data) ? data : []);
    } catch (error) {
      setErrorMessage('Không thể tải danh sách ví xu.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWallets();
  }, [loadWallets]);

  const filteredWallets = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) {
      return wallets;
    }
    return wallets.filter((wallet) => {
      return (
        (wallet.userName || '').toLowerCase().includes(normalized) ||
        (wallet.fullName || '').toLowerCase().includes(normalized) ||
        (wallet.email || '').toLowerCase().includes(normalized)
      );
    });
  }, [wallets, keyword]);

  const resetForm = () => {
    setFormState(defaultFormState);
    setEditingWallet(null);
    setErrorMessage('');
  };

  const openCreateModal = async () => {
    resetForm();
    setShowModal(true);
    // Lấy danh sách user để chọn; loại bỏ user đã có ví.
    try {
      const response = await getUsers({page: 0, size: 100});
      const existingUserIds = new Set(wallets.map((wallet) => wallet.userId));
      const available = (response?.content || []).filter(
        (user) => !existingUserIds.has(user.id),
      );
      setUserOptions(available);
    } catch (error) {
      setUserOptions([]);
    }
  };

  const openEditModal = (wallet) => {
    setEditingWallet(wallet);
    setFormState({userId: wallet.userId, balance: wallet.balance ?? 0});
    setErrorMessage('');
    setShowModal(true);
  };

  const handleSubmit = async () => {
    const balanceNumber = Number(formState.balance);
    if (Number.isNaN(balanceNumber) || balanceNumber < 0) {
      setErrorMessage('Số xu phải là số không âm.');
      return;
    }
    if (!editingWallet && !formState.userId) {
      setErrorMessage('Vui lòng chọn người dùng.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    try {
      if (editingWallet) {
        const updated = await updateCoinBalance(editingWallet.userId, {
          balance: balanceNumber,
        });
        setWallets((previous) =>
          previous.map((wallet) =>
            wallet.userId === editingWallet.userId ? updated : wallet,
          ),
        );
      } else {
        const created = await createCoinWallet({
          userId: formState.userId,
          balance: balanceNumber,
        });
        setWallets((previous) => [...previous, created]);
      }
      setShowModal(false);
      resetForm();
    } catch (error) {
      setErrorMessage(
        error?.response?.data?.message || 'Không thể lưu ví xu. Vui lòng thử lại.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingWallet) {
      return;
    }
    setSubmitting(true);
    setErrorMessage('');
    try {
      await deleteCoinWallet(deletingWallet.userId);
      setWallets((previous) =>
        previous.filter((wallet) => wallet.userId !== deletingWallet.userId),
      );
      setDeletingWallet(null);
    } catch (error) {
      setErrorMessage('Không thể xóa ví xu.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={cx('coinsPage')}>
      <div className={cx('pageHeader')}>
        <div>
          <h1>Quản lý xu</h1>
          <p>Xem và điều chỉnh số xu của người dùng.</p>
        </div>
        <Button className={cx('createButton')} onClick={openCreateModal}>
          <Plus size={16} />
          Thêm ví xu
        </Button>
      </div>

      <div className={cx('searchContainer')}>
        <Search size={16} className={cx('searchIcon')} />
        <Form.Control
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Tìm theo tên đăng nhập, họ tên hoặc email..."
        />
      </div>
      {errorMessage && !showModal && <p className={cx('errorText')}>{errorMessage}</p>}

      <div className={cx('tableWrapper')}>
        <Table responsive hover>
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Email</th>
              <th>Số xu</th>
              <th>Cập nhật</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="text-center py-4">
                  <Spinner size="sm" className="me-2" />
                  Đang tải dữ liệu...
                </td>
              </tr>
            )}
            {!loading &&
              filteredWallets.map((wallet) => (
                <tr key={wallet.userId}>
                  <td>
                    <div className={cx('userCell')}>
                      <span className={cx('userName')}>{wallet.userName || '-'}</span>
                      {wallet.fullName && (
                        <span className={cx('fullName')}>{wallet.fullName}</span>
                      )}
                    </div>
                  </td>
                  <td>{wallet.email || '-'}</td>
                  <td>
                    <span className={cx('coinValue')}>
                      <Coins size={14} />
                      {wallet.balance}
                    </span>
                  </td>
                  <td>
                    {wallet.updatedAt
                      ? new Date(wallet.updatedAt).toLocaleString('vi-VN')
                      : '-'}
                  </td>
                  <td>
                    <div className={cx('actionButtons')}>
                      <button title="Sửa" onClick={() => openEditModal(wallet)}>
                        <Edit size={14} />
                      </button>
                      <button title="Xóa" onClick={() => setDeletingWallet(wallet)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            {!loading && filteredWallets.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-4">
                  Không có dữ liệu.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      <Modal
        show={showModal}
        onHide={() => {
          if (submitting) {
            return;
          }
          setShowModal(false);
          resetForm();
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>{editingWallet ? 'Cập nhật số xu' : 'Thêm ví xu'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Người dùng</Form.Label>
            {editingWallet ? (
              <Form.Control value={editingWallet.userName || editingWallet.userId} disabled />
            ) : (
              <Form.Select
                value={formState.userId}
                onChange={(event) =>
                  setFormState((previous) => ({...previous, userId: event.target.value}))
                }
              >
                <option value="">-- Chọn người dùng --</option>
                {userOptions.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.userName} {user.email ? `(${user.email})` : ''}
                  </option>
                ))}
              </Form.Select>
            )}
          </Form.Group>
          <Form.Group>
            <Form.Label>Số xu</Form.Label>
            <Form.Control
              type="number"
              min={0}
              value={formState.balance}
              onChange={(event) =>
                setFormState((previous) => ({...previous, balance: event.target.value}))
              }
            />
          </Form.Group>
          {errorMessage && <p className={cx('errorText')}>{errorMessage}</p>}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              if (submitting) {
                return;
              }
              setShowModal(false);
              resetForm();
            }}
          >
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {editingWallet ? 'Lưu' : 'Tạo mới'}
          </Button>
        </Modal.Footer>
      </Modal>

      <ConfirmDeleteModal
        show={Boolean(deletingWallet)}
        onClose={() => {
          if (submitting) {
            return;
          }
          setDeletingWallet(null);
        }}
        onConfirm={handleDelete}
        title="Xác nhận xóa ví xu"
        message={`Bạn có chắc muốn xóa ví xu của "${
          deletingWallet?.userName || ''
        }" không?`}
      />
    </div>
  );
}

export default CoinsManagement;
