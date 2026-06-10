import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Button, Form, Spinner, Table} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {Edit, Plus, Search, Trash2} from 'lucide-react';

import {
  createCosmetic,
  deleteCosmetic,
  getCosmetics,
  updateCosmetic,
} from '../../api/cosmeticApi';
import BaseModal from '~/components/common/modal/BaseModal';
import ConfirmDeleteModal from '../../components/common/modal/ConfirmDeleteModal';
import AvatarWithCosmetic from '~/components/cosmetic/AvatarWithCosmetic';
import images from '~/assets/images';
import styles from './Cosmetics.module.scss';

const cx = classNames.bind(styles);

const TYPES = [
  {value: 'FRAME', label: 'Khung avatar'},
  {value: 'BADGE', label: 'Huy hiệu'},
];

const TYPE_ORDER = TYPES.map((t) => t.value);

// Gom vật phẩm theo loại, giữ thứ tự nhóm cố định (Khung avatar trước, Huy hiệu sau).
function groupByType(items) {
  const groups = new Map();
  items.forEach((item) => {
    if (!groups.has(item.type)) {
      groups.set(item.type, {type: item.type, typeLabel: item.typeLabel, items: []});
    }
    groups.get(item.type).items.push(item);
  });
  return Array.from(groups.values()).sort(
    (a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type),
  );
}

const FRAME_STYLES = [
  {value: 'COLOR', label: 'Màu / gradient'},
  {value: 'EFFECT', label: 'Hiệu ứng CSS'},
  {value: 'IMAGE', label: 'Ảnh overlay'},
];

const EFFECT_PRESETS = [
  {value: 'glow', label: 'Glow (phát sáng vàng)'},
  {value: 'pulse', label: 'Pulse (nhịp xanh)'},
  {value: 'rotate', label: 'Rotate (viền xoay)'},
  {value: 'rainbow', label: 'Rainbow (cầu vồng xoay)'},
];

const defaultFormState = {
  name: '',
  description: '',
  type: 'FRAME',
  frameStyle: 'COLOR',
  costCoins: 0,
  assetValue: '',
  imageUrl: '',
  active: true,
  displayOrder: 0,
};

// Xem trước trên avatar mẫu (đúng cách hiển thị thật).
function CosmeticPreview({item, size = 56}) {
  const isBadge = item.type === 'BADGE';
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
  const [items, setItems] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formState, setFormState] = useState(defaultFormState);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await getCosmetics();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      setErrorMessage('Không thể tải danh sách vật phẩm.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) => (item.name || '').toLowerCase().includes(normalized));
  }, [items, keyword]);

  const resetForm = () => {
    setFormState(defaultFormState);
    setEditingId(null);
    setErrorMessage('');
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.cosmeticId);
    setFormState({
      name: item.name || '',
      description: item.description || '',
      type: item.type || 'FRAME',
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
      setErrorMessage('Tên không được để trống.');
      return;
    }
    const cost = Number(formState.costCoins);
    if (Number.isNaN(cost) || cost < 0) {
      setErrorMessage('Giá xu phải là số không âm.');
      return;
    }

    const payload = {
      name: formState.name.trim(),
      description: formState.description.trim(),
      type: formState.type,
      frameStyle: formState.type === 'FRAME' ? formState.frameStyle : null,
      costCoins: cost,
      assetValue: formState.assetValue.trim(),
      imageUrl: formState.imageUrl.trim(),
      active: formState.active,
      displayOrder: Number(formState.displayOrder) || 0,
    };

    setSubmitting(true);
    setErrorMessage('');
    try {
      if (editingId) {
        const updated = await updateCosmetic(editingId, payload);
        setItems((prev) => prev.map((it) => (it.cosmeticId === editingId ? updated : it)));
      } else {
        const created = await createCosmetic(payload);
        setItems((prev) => [...prev, created]);
      }
      setShowModal(false);
      resetForm();
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Không thể lưu vật phẩm.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setSubmitting(true);
    try {
      await deleteCosmetic(deleting.cosmeticId);
      setItems((prev) => prev.filter((it) => it.cosmeticId !== deleting.cosmeticId));
      setDeleting(null);
    } catch (error) {
      setErrorMessage('Không thể xóa vật phẩm.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={cx('page')}>
      <div className={cx('pageHeader')}>
        <div>
          <h1>Cửa hàng xu — Trang trí</h1>
          <p>Quản lý khung avatar & huy hiệu user đổi bằng xu.</p>
        </div>
        <Button className={cx('createButton')} onClick={openCreateModal}>
          <Plus size={16} />
          Thêm vật phẩm
        </Button>
      </div>

      <div className={cx('searchContainer')}>
        <Search size={16} className={cx('searchIcon')} />
        <Form.Control
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tìm theo tên..."
        />
      </div>
      {errorMessage && !showModal && <p className={cx('errorText')}>{errorMessage}</p>}

      <div className={cx('tableWrapper')}>
        <Table responsive hover>
          <thead>
            <tr>
              <th>Xem trước</th>
              <th>Tên</th>
              <th>Loại</th>
              <th>Giá xu</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="text-center py-4">
                  <Spinner size="sm" className="me-2" />
                  Đang tải dữ liệu...
                </td>
              </tr>
            )}
            {!loading &&
              groupByType(filtered).map((group) => (
                <React.Fragment key={group.type}>
                  <tr className={cx('groupRow')}>
                    <td colSpan={6}>
                      {group.typeLabel} ({group.items.length})
                    </td>
                  </tr>
                  {group.items.map((item) => (
                    <tr key={item.cosmeticId}>
                      <td>
                        <CosmeticPreview item={item} />
                      </td>
                      <td>{item.name}</td>
                      <td>{item.typeLabel}</td>
                      <td className={cx('coin')}>{item.costCoins}</td>
                      <td>
                        <span className={cx('status', item.active ? 'active' : 'inactive')}>
                          {item.active ? 'Đang bán' : 'Tắt'}
                        </span>
                      </td>
                      <td>
                        <div className={cx('actionButtons')}>
                          <button title="Sửa" onClick={() => openEditModal(item)}>
                            <Edit size={14} />
                          </button>
                          <button title="Xóa" onClick={() => setDeleting(item)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-4">
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
          if (submitting) return;
          setShowModal(false);
          resetForm();
        }}
        title={editingId ? 'Cập nhật vật phẩm' : 'Thêm vật phẩm'}
        maxWidth={550}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                if (submitting) return;
                setShowModal(false);
                resetForm();
              }}
            >
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {editingId ? 'Lưu' : 'Tạo mới'}
            </Button>
          </>
        }
      >
        <div className={cx('previewRow')}>
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
          <Form.Label>Tên</Form.Label>
          <Form.Control
            value={formState.name}
            onChange={(e) => setFormState((p) => ({...p, name: e.target.value}))}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Mô tả</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            value={formState.description}
            onChange={(e) => setFormState((p) => ({...p, description: e.target.value}))}
          />
        </Form.Group>
        <div className="d-flex gap-2 mb-3">
          <Form.Group className="flex-fill">
            <Form.Label>Loại</Form.Label>
            <Form.Select
              value={formState.type}
              onChange={(e) => setFormState((p) => ({...p, type: e.target.value}))}
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          {formState.type === 'FRAME' && (
            <Form.Group className="flex-fill">
              <Form.Label>Kiểu khung</Form.Label>
              <Form.Select
                value={formState.frameStyle}
                onChange={(e) => setFormState((p) => ({...p, frameStyle: e.target.value}))}
              >
                {FRAME_STYLES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          )}
        </div>

        {formState.type === 'BADGE' && (
          <>
            <Form.Group className="mb-3">
              <Form.Label>URL ảnh huy hiệu (PNG/GIF)</Form.Label>
              <Form.Control
                value={formState.imageUrl}
                onChange={(e) => setFormState((p) => ({...p, imageUrl: e.target.value}))}
                placeholder="https://.../badge.gif — để trống nếu dùng emoji"
              />
              <Form.Text muted>Có URL ảnh thì dùng ảnh; bỏ trống thì dùng emoji bên dưới.</Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Icon / emoji</Form.Label>
              <Form.Control
                value={formState.assetValue}
                onChange={(e) => setFormState((p) => ({...p, assetValue: e.target.value}))}
                placeholder="vd: 👑 🏆 ⭐ 🔥"
              />
            </Form.Group>
          </>
        )}

        {formState.type === 'FRAME' && formState.frameStyle === 'COLOR' && (
          <Form.Group className="mb-3">
            <Form.Label>Màu / gradient</Form.Label>
            <Form.Control
              value={formState.assetValue}
              onChange={(e) => setFormState((p) => ({...p, assetValue: e.target.value}))}
              placeholder="vd: linear-gradient(135deg,#f59f00,#f08c00) hoặc #ff5252"
            />
          </Form.Group>
        )}

        {formState.type === 'FRAME' && formState.frameStyle === 'EFFECT' && (
          <Form.Group className="mb-3">
            <Form.Label>Hiệu ứng</Form.Label>
            <Form.Select
              value={formState.assetValue}
              onChange={(e) => setFormState((p) => ({...p, assetValue: e.target.value}))}
            >
              <option value="">-- Chọn hiệu ứng --</option>
              {EFFECT_PRESETS.map((ef) => (
                <option key={ef.value} value={ef.value}>
                  {ef.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        )}

        {formState.type === 'FRAME' && formState.frameStyle === 'IMAGE' && (
          <Form.Group className="mb-3">
            <Form.Label>URL ảnh khung (PNG/GIF trong suốt)</Form.Label>
            <Form.Control
              value={formState.imageUrl}
              onChange={(e) => setFormState((p) => ({...p, imageUrl: e.target.value}))}
              placeholder="https://.../frame.png"
            />
            <Form.Text muted>Ảnh nên có nền trong suốt, giữa rỗng để lộ avatar.</Form.Text>
          </Form.Group>
        )}
        <div className="d-flex gap-2 mb-3">
          <Form.Group className="flex-fill">
            <Form.Label>Giá xu</Form.Label>
            <Form.Control
              type="number"
              min={0}
              value={formState.costCoins}
              onChange={(e) => setFormState((p) => ({...p, costCoins: e.target.value}))}
            />
          </Form.Group>
          <Form.Group className="flex-fill">
            <Form.Label>Thứ tự hiển thị</Form.Label>
            <Form.Control
              type="number"
              value={formState.displayOrder}
              onChange={(e) => setFormState((p) => ({...p, displayOrder: e.target.value}))}
            />
          </Form.Group>
        </div>
        <Form.Check
          type="switch"
          label="Đang bán"
          checked={formState.active}
          onChange={(e) => setFormState((p) => ({...p, active: e.target.checked}))}
        />
        {errorMessage && <p className={cx('errorText')}>{errorMessage}</p>}
      </BaseModal>

      <ConfirmDeleteModal
        show={Boolean(deleting)}
        onClose={() => {
          if (submitting) return;
          setDeleting(null);
        }}
        onConfirm={handleDelete}
        title="Xác nhận xóa vật phẩm"
        message={`Bạn có chắc muốn xóa "${deleting?.name || ''}" không?`}
      />
    </div>
  );
}

export default CosmeticsManagement;
