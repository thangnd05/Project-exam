'use client';

import {useMemo, useState} from 'react';
import {Button, Form} from 'react-bootstrap';
import {Edit, Plus, Trash2} from 'lucide-react';
import {useTranslations} from 'next-intl';

import {useAdminCosmetics} from './_hooks/useAdminCosmetics';
import BaseModal from '@/app/components/modal/BaseModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';
import ConfirmDeleteModal from '@/app/components/modal/ConfirmDeleteModal';
import AvatarWithCosmetic from '@/app/features/gamification/cosmetic/AvatarWithCosmetic';
import images from '@/app/assets/images';
import {
  AdminFieldError,
  AdminPageHeader,
  AdminTable,
  AdminToolbar,
} from '@/app/[locale]/(admin)/_components/common';
import type {AdminTableColumn} from '@/app/[locale]/(admin)/_components/common/AdminTable';
import {CosmeticType} from '@/app/enums';
import type {CosmeticRequest, CosmeticResponse} from '@/app/types';
import {getApiErrorMessage} from '@/app/utils/apiError';

const TYPES = [
  {value: CosmeticType.FRAME, label: 'frame'},
  {value: CosmeticType.BADGE, label: 'badge'},
] as const;

const TYPE_ORDER: CosmeticType[] = TYPES.map((type) => type.value);

interface CosmeticGroup {
  type?: CosmeticType;
  typeLabel?: string;
  items: CosmeticResponse[];
}

function groupByType(items: CosmeticResponse[]): CosmeticGroup[] {
  const groups = new Map<CosmeticType | undefined, CosmeticGroup>();
  items.forEach((item) => {
    if (!groups.has(item.type)) {
      groups.set(item.type, {
        type: item.type,
        typeLabel: item.typeLabel,
        items: [],
      });
    }
    groups.get(item.type)!.items.push(item);
  });
  return Array.from(groups.values()).sort(
    (a, b) =>
      TYPE_ORDER.indexOf(a.type as CosmeticType) -
      TYPE_ORDER.indexOf(b.type as CosmeticType),
  );
}

const FRAME_STYLES = [
  {value: 'COLOR', label: 'color'},
  {value: 'EFFECT', label: 'effect'},
  {value: 'IMAGE', label: 'image'},
] as const;

const EFFECT_PRESETS = [
  {value: 'glow', label: 'glow'},
  {value: 'pulse', label: 'pulse'},
  {value: 'rotate', label: 'rotate'},
  {value: 'rainbow', label: 'rainbow'},
] as const;

interface CosmeticFormState {
  name: string;
  description: string;
  type: CosmeticType;
  frameStyle: string;
  costCoins: number | string;
  assetValue: string;
  imageUrl: string;
  active: boolean;
  displayOrder: number | string;
}

const defaultFormState: CosmeticFormState = {
  name: '',
  description: '',
  type: CosmeticType.FRAME,
  frameStyle: 'COLOR',
  costCoins: 0,
  assetValue: '',
  imageUrl: '',
  active: true,
  displayOrder: 0,
};

function CosmeticPreview({
  item,
  size = 56,
}: {
  item: Partial<CosmeticResponse>;
  size?: number;
}) {
  const isBadge = item.type === CosmeticType.BADGE;
  return (
    <AvatarWithCosmetic
      src={images.avtImage}
      fallbackSrc={images.avtImage}
      size={size}
      frame={isBadge ? null : item}
      badge={isBadge ? item : null}
    />
  );
}

function CosmeticsManagement() {
  const t = useTranslations('AdminSystem.cosmetics');
  const tAdmin = useTranslations('AdminCommon');
  const tCommon = useTranslations('Common');
  const {
    items,
    isLoading: loading,
    isError,
    createCosmetic,
    updateCosmetic,
    deleteCosmetic,
    isSubmitting,
    isDeleting,
  } = useAdminCosmetics();

  const [keyword, setKeyword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] =
    useState<CosmeticFormState>(defaultFormState);
  const [errorMessage, setErrorMessage] = useState('');
  const [deleting, setDeleting] = useState<CosmeticResponse | null>(null);

  const submitting = isSubmitting || isDeleting;
  const listErrorMessage = isError ? t('errors.loadFailed') : '';

  const filtered = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) =>
      (item.name || '').toLowerCase().includes(normalized),
    );
  }, [items, keyword]);

  const orderedItems = useMemo(
    () => groupByType(filtered).flatMap((group) => group.items),
    [filtered],
  );

  const resetForm = () => {
    setFormState(defaultFormState);
    setEditingId(null);
    setErrorMessage('');
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (item: CosmeticResponse) => {
    setEditingId(item.cosmeticId);
    setFormState({
      name: item.name || '',
      description: item.description || '',
      type: item.type || CosmeticType.FRAME,
      frameStyle: item.frameStyle || 'COLOR',
      costCoins: item.costCoins ?? 0,
      assetValue: item.assetValue || '',
      imageUrl: item.imageUrl || '',
      active: item.active !== false,
      displayOrder: item.displayOrder ?? 0,
    });
    setErrorMessage('');
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formState.name.trim()) {
      setErrorMessage(t('errors.nameRequired'));
      return;
    }
    const cost = Number(formState.costCoins);
    if (Number.isNaN(cost) || cost < 0) {
      setErrorMessage(t('errors.costInvalid'));
      return;
    }

    const payload: CosmeticRequest = {
      name: formState.name.trim(),
      description: formState.description.trim(),
      type: formState.type,
      frameStyle:
        formState.type === CosmeticType.FRAME ? formState.frameStyle : undefined,
      costCoins: cost,
      assetValue: formState.assetValue.trim(),
      imageUrl: formState.imageUrl.trim(),
      active: formState.active,
      displayOrder: Number(formState.displayOrder) || 0,
    };

    setErrorMessage('');
    try {
      if (editingId) {
        await updateCosmetic({id: editingId, payload});
      } else {
        await createCosmetic(payload);
      }
      setShowModal(false);
      resetForm();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t('errors.saveFailed')));
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteCosmetic(deleting.cosmeticId);
      setDeleting(null);
    } catch {
      setErrorMessage(t('errors.deleteFailed'));
    }
  };

  const columns: AdminTableColumn[] = [
    {
      key: 'preview',
      header: t('preview'),
      render: (item: CosmeticResponse) => <CosmeticPreview item={item} />,
    },
    {key: 'name', header: t('name')},
    {
      key: 'typeLabel',
      header: t('type'),
      render: (item: CosmeticResponse) => {
        const type = TYPES.find((option) => option.value === item.type);
        return type ? t(`types.${type.label}`) : item.typeLabel;
      },
    },
    {key: 'costCoins', header: t('cost')},
    {
      key: 'status',
      header: t('status'),
      render: (item: CosmeticResponse) => (item.active ? t('onSale') : t('off')),
    },
  ];

  return (
    <div className="d-flex flex-column gap-3">
      <AdminPageHeader
        title={t('title')}
        description={t('description')}
      >
        <Button onClick={openCreateModal}>
          <Plus size={16} className="me-1" />
          {t('add')}
        </Button>
      </AdminPageHeader>

      <AdminToolbar
        searchValue={keyword}
        onSearchChange={setKeyword}
        searchPlaceholder={t('searchPlaceholder')}
      />
      <AdminFieldError
        message={!showModal ? errorMessage || listErrorMessage : ''}
      />

      <AdminTable
        showIndex
        paginated
        itemLabel={t('itemLabel')}
        columns={columns}
        data={orderedItems}
        loading={loading}
        getRowKey={(item: CosmeticResponse) => item.cosmeticId}
        rowActions={(item: CosmeticResponse) => (
          <>
            <button title={tAdmin('actions.edit')} onClick={() => openEditModal(item)}>
              <Edit size={14} />
            </button>
            <button
              className="danger"
              title={tAdmin('actions.delete')}
              onClick={() => setDeleting(item)}
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      />

      <BaseModal
        show={showModal}
        onClose={() => {
          if (submitting) return;
          setShowModal(false);
          resetForm();
        }}
        title={editingId ? t('editTitle') : t('add')}
        maxWidth={550}
        footer={
          <ModalActionFooter
            onCancel={() => {
              if (submitting) return;
              setShowModal(false);
              resetForm();
            }}
            onSubmit={handleSubmit}
            cancelLabel={tCommon('cancelShort')}
            submitLabel={editingId ? tCommon('save') : tAdmin('actions.create')}
            loadingLabel={tAdmin('saving')}
            loading={submitting}
          />
        }
      >
        <div className="d-flex justify-content-center mb-3">
          <CosmeticPreview
            item={{
              type: formState.type,
              assetValue: formState.assetValue,
              frameStyle: formState.frameStyle,
              imageUrl: formState.imageUrl,
            }}
          />
        </div>
        <Form.Group className="mb-3">
          <Form.Label>{t('name')}</Form.Label>
          <Form.Control
            value={formState.name}
            onChange={(e) =>
              setFormState((p) => ({...p, name: e.target.value}))
            }
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>{t('fieldDescription')}</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            value={formState.description}
            onChange={(e) =>
              setFormState((p) => ({...p, description: e.target.value}))
            }
          />
        </Form.Group>
        <div className="d-flex gap-2 mb-3">
          <Form.Group className="flex-fill">
            <Form.Label>{t('type')}</Form.Label>
            <Form.Select
              value={formState.type}
              onChange={(e) =>
                setFormState((p) => ({
                  ...p,
                  type: e.target.value as CosmeticType,
                }))
              }
            >
              {TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {t(`types.${type.label}`)}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          {formState.type === CosmeticType.FRAME && (
            <Form.Group className="flex-fill">
              <Form.Label>{t('frameStyle')}</Form.Label>
              <Form.Select
                value={formState.frameStyle}
                onChange={(e) =>
                  setFormState((p) => ({...p, frameStyle: e.target.value}))
                }
              >
                {FRAME_STYLES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {t(`frameStyles.${s.label}`)}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          )}
        </div>

        {formState.type === CosmeticType.BADGE && (
          <>
            <Form.Group className="mb-3">
              <Form.Label>{t('badgeImageUrl')}</Form.Label>
              <Form.Control
                value={formState.imageUrl}
                onChange={(e) =>
                  setFormState((p) => ({...p, imageUrl: e.target.value}))
                }
                placeholder={t('badgeImagePlaceholder')}
              />
              <Form.Text muted>
                {t('badgeImageHelp')}
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Icon / emoji</Form.Label>
              <Form.Control
                value={formState.assetValue}
                onChange={(e) =>
                  setFormState((p) => ({...p, assetValue: e.target.value}))
                }
                placeholder={t('emojiPlaceholder')}
              />
            </Form.Group>
          </>
        )}

        {formState.type === CosmeticType.FRAME &&
          formState.frameStyle === 'COLOR' && (
            <Form.Group className="mb-3">
              <Form.Label>{t('frameStyles.color')}</Form.Label>
              <Form.Control
                value={formState.assetValue}
                onChange={(e) =>
                  setFormState((p) => ({...p, assetValue: e.target.value}))
                }
                placeholder={t('colorPlaceholder')}
              />
            </Form.Group>
          )}

        {formState.type === CosmeticType.FRAME &&
          formState.frameStyle === 'EFFECT' && (
            <Form.Group className="mb-3">
              <Form.Label>{t('effect')}</Form.Label>
              <Form.Select
                value={formState.assetValue}
                onChange={(e) =>
                  setFormState((p) => ({...p, assetValue: e.target.value}))
                }
              >
                <option value="">{t('selectEffect')}</option>
                {EFFECT_PRESETS.map((ef) => (
                  <option key={ef.value} value={ef.value}>
                    {t(`effects.${ef.label}`)}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          )}

        {formState.type === CosmeticType.FRAME &&
          formState.frameStyle === 'IMAGE' && (
            <Form.Group className="mb-3">
              <Form.Label>{t('frameImageUrl')}</Form.Label>
              <Form.Control
                value={formState.imageUrl}
                onChange={(e) =>
                  setFormState((p) => ({...p, imageUrl: e.target.value}))
                }
                placeholder="https://.../frame.png"
              />
              <Form.Text muted>
                {t('frameImageHelp')}
              </Form.Text>
            </Form.Group>
          )}
        <div className="d-flex gap-2 mb-3">
          <Form.Group className="flex-fill">
            <Form.Label>{t('cost')}</Form.Label>
            <Form.Control
              type="number"
              min={0}
              value={formState.costCoins}
              onChange={(e) =>
                setFormState((p) => ({...p, costCoins: e.target.value}))
              }
            />
          </Form.Group>
          <Form.Group className="flex-fill">
            <Form.Label>{t('displayOrder')}</Form.Label>
            <Form.Control
              type="number"
              value={formState.displayOrder}
              onChange={(e) =>
                setFormState((p) => ({...p, displayOrder: e.target.value}))
              }
            />
          </Form.Group>
        </div>
        <Form.Check
          type="switch"
          label={t('onSale')}
          checked={formState.active}
          onChange={(e) =>
            setFormState((p) => ({...p, active: e.target.checked}))
          }
        />
        <AdminFieldError message={errorMessage} />
      </BaseModal>

      <ConfirmDeleteModal
        show={Boolean(deleting)}
        onClose={() => {
          if (submitting) return;
          setDeleting(null);
        }}
        onConfirm={handleDelete}
        title={t('deleteTitle')}
        message={t('deleteMessage', {name: deleting?.name || ''})}
      />
    </div>
  );
}

export default CosmeticsManagement;
