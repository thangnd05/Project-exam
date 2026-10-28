'use client';

import { useMemo, useState } from 'react';
import {useTranslations} from 'next-intl';
import {Form} from 'react-bootstrap';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import {Edit, Plus, Trash2} from 'lucide-react';
import {toast} from 'react-toastify';

import {useQuests} from './_hooks/useQuests';
import { toDateTimeLocalInput, fromDateTimeLocalInput, formatDateTime } from '@/app/utils/format-date-time';
import BaseModal from '@/app/components/modal/BaseModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';
import ConfirmDeleteModal from '@/app/components/modal/ConfirmDeleteModal';
import {
  AdminFieldError,
  AdminPageHeader,
  AdminTable,
  AdminToolbar,
} from '@/app/[locale]/(admin)/_components/common';
import type {AdminTableColumn} from '@/app/[locale]/(admin)/_components/common/AdminTable';
import {QuestConditionType} from '@/app/enums';
import type {QuestRequest, QuestResponse} from '@/app/types';
import {getApiErrorMessage} from '@/app/utils/apiError';

const CONDITION_TYPES = [
  {value: QuestConditionType.NONE, labelKey: 'none'},
  {value: QuestConditionType.COMPLETE_TEST, labelKey: 'completeTest'},
  {value: QuestConditionType.STREAK_DAYS, labelKey: 'streakDays'},
  {value: QuestConditionType.CREATE_LEARNING_PLAN, labelKey: 'createLearningPlan'},
  {value: QuestConditionType.COMPLETE_LEARNING_PLAN, labelKey: 'completeLearningPlan'},
  {value: QuestConditionType.SET_TARGET, labelKey: 'setTarget'},
  {value: QuestConditionType.COMPLETE_PLAN_TASK, labelKey: 'completePlanTask'},
] as const;

interface QuestFormState {
  title: string;
  description: string;
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
  const t = useTranslations('AdminUsers');
  const tCommon = useTranslations('Common');
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
      setErrorMessage(t('quests.errors.titleRequired'));
      return;
    }
    const reward = Number(formState.rewardCoins);
    if (Number.isNaN(reward) || reward < 0) {
      setErrorMessage(t('quests.errors.rewardInvalid'));
      return;
    }

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
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, t('quests.errors.save')),
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
    try {
      await removeQuest(deletingQuest.questId);
      toast.success(t('quests.deleted'));
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('quests.errors.delete')));
    } finally {
      setDeletingQuest(null);
      setSubmitting(false);
    }
  };

  // conditionLabel của backend là tiếng Việt cố định nên dịch theo conditionType khi biết
  const conditionLabelOf = (quest: QuestResponse) => {
    if (quest.conditionType === QuestConditionType.NONE) {
      return t('quests.conditionNone');
    }
    const type = CONDITION_TYPES.find((item) => item.value === quest.conditionType);
    return type ? t(`quests.conditions.${type.labelKey}`) : quest.conditionLabel;
  };


  const columns: AdminTableColumn[] = [
    {
      key: 'title',
      header: t('quests.columns.title'),
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
      header: t('quests.columns.condition'),
      render: (quest: QuestResponse) => (
        <>
          {conditionLabelOf(quest)}
          {quest.conditionType !== QuestConditionType.NONE && ` (x${quest.conditionTarget})`}
        </>
      ),
    },
    {key: 'rewardCoins', header: t('quests.columns.coins'), render: (quest: QuestResponse) => quest.rewardCoins},
    {
      key: 'time',
      header: t('quests.columns.time'),
      render: (quest: QuestResponse) => (
        <div className="d-flex flex-column">
          <span>{t('quests.from', {date: formatDateTime(quest.startAt)})}</span>
          <span>{t('quests.to', {date: formatDateTime(quest.endAt)})}</span>
        </div>
      ),
    },
    {key: 'claimCount', header: t('quests.columns.claimed'), render: (quest: QuestResponse) => quest.claimCount ?? 0},
    {
      key: 'active',
      header: t('quests.columns.status'),
      render: (quest: QuestResponse) => (quest.active ? t('quests.active') : t('quests.inactive')),
    },
  ];

  return (
    <div className="d-flex flex-column gap-3">
      <AdminPageHeader
        title={t('quests.title')}
        description={t('quests.description')}
      >
        <ButtonPrime onClick={openCreateModal}>
          <Plus size={16} />
          {t('quests.add')}
        </ButtonPrime>
      </AdminPageHeader>

      <AdminToolbar
        searchValue={keyword}
        onSearchChange={setKeyword}
        searchPlaceholder={t('quests.searchPlaceholder')}
      />
      {!showModal && (
        <AdminFieldError message={errorMessage || (isError ? t('quests.errors.load') : '')} />
      )}

      <AdminTable
        showIndex
        paginated
        itemLabel={t('quests.itemLabel')}
        columns={columns}
        data={filteredQuests}
        loading={loading}
        getRowKey={(quest: QuestResponse) => quest.questId}
        rowActions={(quest: QuestResponse) => (
          <>
            <ButtonPrime size="icon" variant="ghost" title={t('shared.edit')} onClick={() => openEditModal(quest)}>
              <Edit size={14} />
            </ButtonPrime>
            <ButtonPrime size="icon" variant="dangerGhost"
              title={t('shared.delete')}
              onClick={() => setDeletingQuest(quest)}
            >
              <Trash2 size={14} />
            </ButtonPrime>
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
        title={editingQuestId ? t('quests.modal.editTitle') : t('quests.modal.createTitle')}
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
            cancelLabel={tCommon('cancelShort')}
            submitLabel={editingQuestId ? tCommon('save') : t('shared.createNew')}
            loading={submitting}
          />
        }
      >
        <Form.Group className="mb-3">
          <Form.Label>{t('quests.form.title')}</Form.Label>
          <Form.Control
            value={formState.title}
            onChange={(event) =>
              setFormState((previous) => ({...previous, title: event.target.value}))
            }
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>{t('quests.form.description')}</Form.Label>
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
          <Form.Label>{t('quests.form.rewardCoins')}</Form.Label>
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
          <Form.Label>{t('quests.form.condition')}</Form.Label>
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
                {t(`quests.conditions.${type.labelKey}`)}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
        {formState.conditionType !== QuestConditionType.NONE && (
          <Form.Group className="mb-3">
            <Form.Label>{t('quests.form.conditionTarget')}</Form.Label>
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
            <Form.Label>{t('quests.form.startAt')}</Form.Label>
            <Form.Control
              type="datetime-local"
              value={formState.startAt}
              onChange={(event) =>
                setFormState((previous) => ({...previous, startAt: event.target.value}))
              }
            />
          </Form.Group>
          <Form.Group className="flex-fill">
            <Form.Label>{t('quests.form.endAt')}</Form.Label>
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
          label={t('quests.form.active')}
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
        title={t('quests.confirmDelete.title')}
        message={t('quests.confirmDelete.message', {title: deletingQuest?.title || ''})}
      />
    </div>
  );
}

export default QuestsManagement;
