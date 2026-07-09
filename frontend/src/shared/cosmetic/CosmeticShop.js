import { useCallback, useEffect, useState } from 'react';
import { Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import classNames from 'classnames/bind';
import { CircleDollarSign, Check } from 'lucide-react';

import { buyCosmetic, equipCosmetic, getCosmeticShop, unequipCosmetic } from '~/shared/api/cosmeticApi';
import { useCoins } from '~/shared/hooks/useCoins';
import { useCosmetics } from '~/shared/hooks/useCosmetics';
import AvatarWithCosmetic from './AvatarWithCosmetic';
import images from '~/shared/assets/images';
import styles from './CosmeticShop.module.scss';

const cx = classNames.bind(styles);

const TYPE_ORDER = ['FRAME', 'BADGE'];

function groupByType(items) {
  const groups = new Map();
  items.forEach((item) => {
    if (!groups.has(item.type)) {
      groups.set(item.type, { type: item.type, typeLabel: item.typeLabel, items: [] });
    }
    groups.get(item.type).items.push(item);
  });
  return Array.from(groups.values()).sort(
    (a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type),
  );
}

export function CosmeticPreview({ item, size = 60 }) {
  const isBadge = item.type === 'BADGE';
  return (
    <div className={cx('preview')}>
      <AvatarWithCosmetic
        src={images.avtImage}
        fallbackSrc={images.avtImage}
        size={size}
        frame={isBadge ? null : item}
        badge={isBadge ? item : null}
      />
    </div>
  );
}

function CosmeticShop() {
  const { balance, refreshCoins } = useCoins();
  const { refreshCosmetics } = useCosmetics();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCosmeticShop();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Không thể tải cửa hàng.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleBuy = async (item) => {
    setBusyId(item.cosmeticId);
    try {
      await buyCosmetic(item.cosmeticId);
      toast.success(`Đã mua "${item.name}"!`);
      await refreshCoins();
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Mua thất bại. Vui lòng thử lại.');
    } finally {
      setBusyId(null);
    }
  };

  const handleEquip = async (item) => {
    setBusyId(item.cosmeticId);
    try {
      await equipCosmetic(item.cosmeticId);
      await refreshCosmetics();
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Không thể đeo vật phẩm.');
    } finally {
      setBusyId(null);
    }
  };

  const handleUnequip = async (item) => {
    setBusyId(item.cosmeticId);
    try {
      await unequipCosmetic(item.cosmeticId);
      await refreshCosmetics();
      await load();
    } catch (error) {
      toast.error('Không thể tháo vật phẩm.');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className={cx('placeholder')}>
        <Spinner size="sm" className="me-2" />
        Đang tải cửa hàng...
      </div>
    );
  }

  if (items.length === 0) {
    return <div className={cx('placeholder')}>Cửa hàng chưa có vật phẩm nào.</div>;
  }

  const renderCard = (item) => {
    const busy = busyId === item.cosmeticId;
    const canAfford = balance >= item.costCoins;

    return (
      <div key={item.cosmeticId} className={cx('card', { equipped: item.equipped })}>
        <CosmeticPreview item={item} />
        <div className={cx('name')}>{item.name}</div>
        <div className={cx('typeLabel')}>{item.typeLabel}</div>

        {!item.owned ? (
          <>
            <div className={cx('cost')}>
              <CircleDollarSign size={14} />
              {item.costCoins}
            </div>
            <button
              type="button"
              className={cx('buyBtn')}
              disabled={busy || !canAfford}
              onClick={() => handleBuy(item)}
            >
              {busy ? 'Đang mua...' : canAfford ? 'Mua' : 'Không đủ xu'}
            </button>
          </>
        ) : item.equipped ? (
          <>
            <div className={cx('ownedTag')}>
              <Check size={14} />
              Đang đeo
            </div>
            <button
              type="button"
              className={cx('unequipBtn')}
              disabled={busy}
              onClick={() => handleUnequip(item)}
            >
              Tháo
            </button>
          </>
        ) : (
          <>
            <div className={cx('ownedTag')}>Đã sở hữu</div>
            <button
              type="button"
              className={cx('equipBtn')}
              disabled={busy}
              onClick={() => handleEquip(item)}
            >
              {busy ? '...' : 'Đeo'}
            </button>
          </>
        )}
      </div>
    );
  };

  return (
    <div className={cx('groups')}>
      {groupByType(items).map((group) => (
        <section key={group.type} className={cx('group')}>
          <h3 className={cx('groupTitle')}>{group.typeLabel}</h3>
          <div className={cx('grid')}>{group.items.map(renderCard)}</div>
        </section>
      ))}
    </div>
  );
}

export default CosmeticShop;
