'use client';

import { useEffect, useMemo, useState } from 'react';
import {Button, Form} from 'react-bootstrap';
import {Edit, Plus, Trash2} from 'lucide-react';

import {useQuests} from './_hooks/useQuests';
import {toDateTimeLocalInput, fromDateTimeLocalInput} from '@/app/utils/format-date-time';
import BaseModal from '@/app/components/modal/BaseModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';
import ConfirmDeleteModal from '@/app/components/modal/ConfirmDeleteModal';
import {
  AdminFieldError,
  AdminPageHeader,
  AdminTable,
  AdminToolbar,
} from '@/app/components/admin/common';
import type {AdminTableColumn} from '@/app/components/admin/common/AdminTable';
import {QuestConditionType} from '@/app/enums';
import type {QuestRequest, QuestResponse} from '@/app/types';

const CONDITION_TYPES = [
  {value: QuestConditionType.NONE, label: 'Không cần điều kiện (tặng xu)'},
  {value: QuestConditionType.COMPLETE_TEST, label: 'Hoàn thành bài thi'},
  {value: QuestConditionType.STREAK_DAYS, label: 'Đạt chuỗi ngày học'},
  {value: QuestConditionType.CREATE_LEARNING_PLAN, label: 'Tạo lộ trình học'},
  {value: QuestConditionType.COMPLETE_LEARNING_PLAN, label: 'Hoàn thành lộ trình học'},
];

interface QuestFormState {
  title: string;
  description: string;
  // rewardCoins/conditionTarget giữ number | string: input number trả string khi gõ
  rewardCoins: number | string;
  conditionType: QuestConditionType;
  conditionTarget: number | string;
  startAt: string;
  endAt: string;
  active: boolean;
}

const defaultFormState: QuestFormState = {
  title: '',
  description: '',
  rewardCoins: 0,
  conditionType: QuestConditionType.NONE,
  conditionTarget: 1,
  startAt: '',
  endAt: '',
  active: true,
};

const toInputDateTime = (value?: string) => toDateTimeLocalInput(value);

function QuestsManagement() {
  const [keyword, setKeyword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingQuestId, setEditingQuestId] = useState<string | null>(null);
  const [formState, setFormState] = useState<QuestFormState>(defaultFormState);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingQuest, setDeletingQuest] = useState<QuestResponse | null>(null);

  const {
    quests,
    isLoading: loading,
    isError,
    createQuest,
    updateQuest,
    removeQuest,
  } = useQuests();

  useEffect(() => {
    if (isError) {
      setErrorMessage('Không thể tải danh sách nhiệm vụ.');
    }
  }, [isError]);

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

  const openEditModal = (quest: QuestResponse) => {
    setEditingQuestId(quest.questId);
    setFormState({
      title: quest.title || '',
      description: quest.description || '',
      rewardCoins: quest.rewardCoins ?? 0,
      conditionType: quest.conditionType || QuestConditionType.NONE,
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

    // Cast QuestRequest: fromDateTimeLocalInput trả string | null (giữ nguyên hành vi gửi null lên API)
    const payload = {
      title: formState.title.trim(),
      description: formState.description.trim(),
      rewardCoins: reward,
      conditionType: formState.conditionType,
      conditionTarget:
        formState.conditionType === QuestConditionType.NONE ? 1 : Number(formState.conditionTarget) || 1,
      startAt: fromDateTimeLocalInput(formState.startAt),
      endAt: fromDateTimeLocalInput(formState.endAt),
      active: formState.active,
    } as QuestRequest;

    setSubmitting(true);
    setErrorMessage('');
    try {
      if (editingQuestId) {
        await updateQuest({id: editingQuestId, payload});
      } else {
        await createQuest(payload);
      }
      setShowModal(false);
      resetForm();
    } catch (error: any) {
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
      await removeQuest(deletingQuest.questId);
      setDeletingQuest(null);
    } catch (error) {
      setErrorMessage('Không thể xóa nhiệm vụ.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (value?: string) =>
    value ? new Date(value).toLocaleString('vi-VN') : '—';

  const columns: AdminTableColumn[] = [
    {
      key: 'title',
      header: 'Tiêu đề',
      render: (quest: QuestResponse) => (
        <div className="d-flex flex-column">
          <span className="fw-semibold">{quest.title}</span>
          {quest.description && (
            <span className="text-muted small">{quest.description}</span>
          )}
        </div>
      ),
    },
    {
      key: 'condition',
      header: 'Điều kiện',
      render: (quest: QuestResponse) => (
        <>
          {quest.conditionLabel}
          {quest.conditionType !== QuestConditionType.NONE && ` (x${quest.conditionTarget})`}
        </>
      ),
    },
    {key: 'rewardCoins', header: 'Xu', render: (quest: QuestResponse) => quest.rewardCoins},
    {
      key: 'time',
      header: 'Thời gian',
      render: (quest: QuestResponse) => (
        <div className="d-flex flex-column">
          <span>Từ: {formatDate(quest.startAt)}</span>
          <span>Đến: {formatDate(quest.endAt)}</span>
        </div>
      ),
    },
    {key: 'claimCount', header: 'Đã nhận', render: (quest: QuestResponse) => quest.claimCount ?? 0},
    {
      key: 'active',
      header: 'Trạng thái',
      render: (quest: QuestResponse) => (quest.active ? 'Đang bật' : 'Tắt'),
    },
  ];

  return (
    <div className="d-flex flex-column gap-3">
      <AdminPageHeader
        title="Quản lý nhiệm vụ"
        description="Tạo nhiệm vụ thưởng xu theo sự kiện hoặc theo thời gian."
      >
        <Button onClick={openCreateModal}>
          <Plus size={16} className="me-1" />
          Thêm nhiệm vụ
        </Button>
      </AdminPageHeader>

      <AdminToolbar
        searchValue={keyword}
        onSearchChange={setKeyword}
        searchPlaceholder="Tìm theo tiêu đề..."
      />
      {!showModal && <AdminFieldError message={errorMessage} />}

      <AdminTable
        showIndex
        paginated
        itemLabel="nhiệm vụ"
        columns={columns}
        data={filteredQuests}
        loading={loading}
        getRowKey={(quest: QuestResponse) => quest.questId}
        rowActions={(quest: QuestResponse) => (
          <>
            <button title="Sửa" onClick={() => openEditModal(quest)}>
              <Edit size={14} />
            </button>
            <button
              className="danger"
              title="Xóa"
              onClick={() => setDeletingQuest(quest)}
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      />

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
          <ModalActionFooter
            onCancel={() => {
              if (submitting) {
                return;
              }
              setShowModal(false);
              resetForm();
            }}
            onSubmit={handleSubmit}
            cancelLabel="Hủy"
            submitLabel={editingQuestId ? 'Lưu' : 'Tạo mới'}
            loading={submitting}
          />
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
                conditionType: event.target.value as QuestConditionType,
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
        {formState.conditionType !== QuestConditionType.NONE && (
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
        <AdminFieldError message={errorMessage} />
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
