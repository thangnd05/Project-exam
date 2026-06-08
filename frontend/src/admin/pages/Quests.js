import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Button, Form, Spinner, Table} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {Edit, Plus, Search, Trash2} from 'lucide-react';

import {createQuest, deleteQuest, getQuests, updateQuest} from '../../api/questApi';
import BaseModal from '~/components/common/modal/BaseModal';
import ConfirmDeleteModal from '../../components/common/modal/ConfirmDeleteModal';
import styles from './Quests.module.scss';

const cx = classNames.bind(styles);

const CONDITION_TYPES = [
  {value: 'NONE', label: 'Không cần điều kiện (tặng xu)'},
  {value: 'COMPLETE_TEST', label: 'Hoàn thành bài thi'},
  {value: 'STREAK_DAYS', label: 'Đạt chuỗi ngày học'},
  {value: 'CREATE_LEARNING_PLAN', label: 'Tạo lộ trình học'},
  {value: 'COMPLETE_LEARNING_PLAN', label: 'Hoàn thành lộ trình học'},
];

const defaultFormState = {
  title: '',
  description: '',
  rewardCoins: 0,
  conditionType: 'NONE',
  conditionTarget: 1,
  startAt: '',
  endAt: '',
  active: true,
};

// Backend trả ISO (có thể kèm giây) -> cắt còn 'YYYY-MM-DDTHH:mm' cho input datetime-local.
const toInputDateTime = (value) => (value ? String(value).slice(0, 16) : '');

function QuestsManagement() {
  const [quests, setQuests] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingQuestId, setEditingQuestId] = useState(null);
  const [formState, setFormState] = useState(defaultFormState);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingQuest, setDeletingQuest] = useState(null);

  const loadQuests = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await getQuests();
      setQuests(Array.isArray(data) ? data : []);
    } catch (error) {
      setErrorMessage('Không thể tải danh sách nhiệm vụ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuests();
  }, [loadQuests]);

  const filteredQuests = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) {
      return quests;
    }
    return quests.filter((quest) =>
      (quest.title || '').toLowerCase().includes(normalized),
    );
  }, [quests, keyword]);

  const resetForm = () => {
    setFormState(defaultFormState);
    setEditingQuestId(null);
    setErrorMessage('');
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (quest) => {
    setEditingQuestId(quest.questId);
    setFormState({
      title: quest.title || '',
      description: quest.description || '',
      rewardCoins: quest.rewardCoins ?? 0,
      conditionType: quest.conditionType || 'NONE',
      conditionTarget: quest.conditionTarget ?? 1,
      startAt: toInputDateTime(quest.startAt),
      endAt: toInputDateTime(quest.endAt),
      active: quest.active !== false,
    });
    setErrorMessage('');
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formState.title.trim()) {
      setErrorMessage('Tiêu đề không được để trống.');
      return;
    }
    const reward = Number(formState.rewardCoins);
    if (Number.isNaN(reward) || reward < 0) {
      setErrorMessage('Số xu thưởng phải là số không âm.');
      return;
    }

    const payload = {
      title: formState.title.trim(),
      description: formState.description.trim(),
      rewardCoins: reward,
      conditionType: formState.conditionType,
      conditionTarget:
        formState.conditionType === 'NONE' ? 1 : Number(formState.conditionTarget) || 1,
      startAt: formState.startAt || null,
      endAt: formState.endAt || null,
      active: formState.active,
    };

    setSubmitting(true);
    setErrorMessage('');
    try {
      if (editingQuestId) {
        const updated = await updateQuest(editingQuestId, payload);
        setQuests((previous) =>
          previous.map((quest) => (quest.questId === editingQuestId ? updated : quest)),
        );
      } else {
        const created = await createQuest(payload);
        setQuests((previous) => [created, ...previous]);
      }
      setShowModal(false);
      resetForm();
    } catch (error) {
      setErrorMessage(
        error?.response?.data?.message || 'Không thể lưu nhiệm vụ. Vui lòng thử lại.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingQuest) {
      return;
    }
    setSubmitting(true);
    setErrorMessage('');
    try {
      await deleteQuest(deletingQuest.questId);
      setQuests((previous) =>
        previous.filter((quest) => quest.questId !== deletingQuest.questId),
      );
      setDeletingQuest(null);
    } catch (error) {
      setErrorMessage('Không thể xóa nhiệm vụ.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (value) =>
    value ? new Date(value).toLocaleString('vi-VN') : '—';

  return (
    <div className={cx('questsPage')}>
      <div className={cx('pageHeader')}>
        <div>
          <h1>Quản lý nhiệm vụ</h1>
          <p>Tạo nhiệm vụ thưởng xu theo sự kiện hoặc theo thời gian.</p>
        </div>
        <Button className={cx('createButton')} onClick={openCreateModal}>
          <Plus size={16} />
          Thêm nhiệm vụ
        </Button>
      </div>

      <div className={cx('searchContainer')}>
        <Search size={16} className={cx('searchIcon')} />
        <Form.Control
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Tìm theo tiêu đề..."
        />
      </div>
      {errorMessage && !showModal && <p className={cx('errorText')}>{errorMessage}</p>}

      <div className={cx('tableWrapper')}>
        <Table responsive hover>
          <thead>
            <tr>
              <th>Tiêu đề</th>
              <th>Điều kiện</th>
              <th>Xu</th>
              <th>Thời gian</th>
              <th>Đã nhận</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="text-center py-4">
                  <Spinner size="sm" className="me-2" />
                  Đang tải dữ liệu...
                </td>
              </tr>
            )}
            {!loading &&
              filteredQuests.map((quest) => (
                <tr key={quest.questId}>
                  <td>
                    <div className={cx('titleCell')}>
                      <span className={cx('title')}>{quest.title}</span>
                      {quest.description && (
                        <span className={cx('desc')}>{quest.description}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    {quest.conditionLabel}
                    {quest.conditionType !== 'NONE' && ` (x${quest.conditionTarget})`}
                  </td>
                  <td className={cx('coin')}>{quest.rewardCoins}</td>
                  <td className={cx('timeCell')}>
                    <span>Từ: {formatDate(quest.startAt)}</span>
                    <span>Đến: {formatDate(quest.endAt)}</span>
                  </td>
                  <td>{quest.claimCount ?? 0}</td>
                  <td>
                    <span
                      className={cx('status', quest.active ? 'active' : 'inactive')}
                    >
                      {quest.active ? 'Đang bật' : 'Tắt'}
                    </span>
                  </td>
                  <td>
                    <div className={cx('actionButtons')}>
                      <button title="Sửa" onClick={() => openEditModal(quest)}>
                        <Edit size={14} />
                      </button>
                      <button title="Xóa" onClick={() => setDeletingQuest(quest)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            {!loading && filteredQuests.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-4">
                  Không có dữ liệu.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      <BaseModal
        show={showModal}
        onClose={() => {
          if (submitting) {
            return;
          }
          setShowModal(false);
          resetForm();
        }}
        title={editingQuestId ? 'Cập nhật nhiệm vụ' : 'Tạo nhiệm vụ'}
        maxWidth={550}
        footer={
          <>
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
              {editingQuestId ? 'Lưu' : 'Tạo mới'}
            </Button>
          </>
        }
      >
        <Form.Group className="mb-3">
          <Form.Label>Tiêu đề</Form.Label>
          <Form.Control
            value={formState.title}
            onChange={(event) =>
              setFormState((previous) => ({...previous, title: event.target.value}))
            }
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Mô tả</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            value={formState.description}
            onChange={(event) =>
              setFormState((previous) => ({
                ...previous,
                description: event.target.value,
              }))
            }
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Số xu thưởng</Form.Label>
          <Form.Control
            type="number"
            min={0}
            value={formState.rewardCoins}
            onChange={(event) =>
              setFormState((previous) => ({...previous, rewardCoins: event.target.value}))
            }
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Điều kiện</Form.Label>
          <Form.Select
            value={formState.conditionType}
            onChange={(event) =>
              setFormState((previous) => ({
                ...previous,
                conditionType: event.target.value,
              }))
            }
          >
            {CONDITION_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
        {formState.conditionType !== 'NONE' && (
          <Form.Group className="mb-3">
            <Form.Label>Số lần cần đạt</Form.Label>
            <Form.Control
              type="number"
              min={1}
              value={formState.conditionTarget}
              onChange={(event) =>
                setFormState((previous) => ({
                  ...previous,
                  conditionTarget: event.target.value,
                }))
              }
            />
          </Form.Group>
        )}
        <div className="d-flex gap-2 mb-3">
          <Form.Group className="flex-fill">
            <Form.Label>Bắt đầu</Form.Label>
            <Form.Control
              type="datetime-local"
              value={formState.startAt}
              onChange={(event) =>
                setFormState((previous) => ({...previous, startAt: event.target.value}))
              }
            />
          </Form.Group>
          <Form.Group className="flex-fill">
            <Form.Label>Kết thúc</Form.Label>
            <Form.Control
              type="datetime-local"
              value={formState.endAt}
              onChange={(event) =>
                setFormState((previous) => ({...previous, endAt: event.target.value}))
              }
            />
          </Form.Group>
        </div>
        <Form.Check
          type="switch"
          label="Đang bật"
          checked={formState.active}
          onChange={(event) =>
            setFormState((previous) => ({...previous, active: event.target.checked}))
          }
        />
        {errorMessage && <p className={cx('errorText')}>{errorMessage}</p>}
      </BaseModal>

      <ConfirmDeleteModal
        show={Boolean(deletingQuest)}
        onClose={() => {
          if (submitting) {
            return;
          }
          setDeletingQuest(null);
        }}
        onConfirm={handleDelete}
        title="Xác nhận xóa nhiệm vụ"
        message={`Bạn có chắc muốn xóa "${deletingQuest?.title || ''}" không?`}
      />
    </div>
  );
}

export default QuestsManagement;
