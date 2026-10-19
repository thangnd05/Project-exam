'use client';

import { useQuery } from '@tanstack/react-query';
import { Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import classNames from 'classnames/bind';
import { CircleDollarSign, Check } from 'lucide-react';

import { getCosmeticShop } from '@/app/apis/cosmeticApi';
import { useCoins } from '@/app/features/gamification/coin/hooks/useCoins';
import {
  COSMETIC_SHOP_QUERY_KEY,
  useBuyCosmetic,
  useEquipCosmetic,
  useUnequipCosmetic,
} from '@/app/features/gamification/cosmetic/hooks/useCosmeticShop';
import { useAuth } from '@/app/hooks/useAuth';
import AvatarWithCosmetic from '@/app/features/gamification/cosmetic/AvatarWithCosmetic';
import images from '@/app/assets/images';
import { CosmeticType } from '@/app/enums';
import type { CosmeticResponse } from '@/app/types';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';
import styles from '@/app/features/gamification/cosmetic/CosmeticShop.module.scss';

const cx = classNames.bind(styles);

const TYPE_ORDER: CosmeticType[] = [CosmeticType.FRAME, CosmeticType.BADGE];

type CosmeticGroup = {
  type: CosmeticResponse['type'];
  typeLabel?: string;
  items: CosmeticResponse[];
};

function groupByType(items: CosmeticResponse[]): CosmeticGroup[] {
  const groups = new Map<CosmeticResponse['type'], CosmeticGroup>();
  items.forEach((item) => {
    if (!groups.has(item.type)) {
      groups.set(item.type, { type: item.type, typeLabel: item.typeLabel, items: [] });
    }
    groups.get(item.type)!.items.push(item);
  });
  return Array.from(groups.values()).sort(
    (a, b) => TYPE_ORDER.indexOf(a.type!) - TYPE_ORDER.indexOf(b.type!),
  );
}

type CosmeticPreviewProps = {
  item: CosmeticResponse;
  size?: number;
};

export function CosmeticPreview({ item, size = 60 }: CosmeticPreviewProps) {
  const isBadge = item.type === CosmeticType.BADGE;
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
  const { balance } = useCoins();
  const { user } = useAuth();
  const buyMutation = useBuyCosmetic();
  const equipMutation = useEquipCosmetic();
  const unequipMutation = useUnequipCosmetic();
  const busyId =
    (buyMutation.isPending && buyMutation.variables) ||
    (equipMutation.isPending && equipMutation.variables) ||
    (unequipMutation.isPending && unequipMutation.variables) ||
    null;

  // Mua/đeo/tháo xong, các mutation tự invalidate COSMETIC_SHOP_QUERY_KEY để tải lại danh sách.
  const { data, isLoading: loading } = useQuery({
    queryKey: [...COSMETIC_SHOP_QUERY_KEY, user?.userId],
    queryFn: async () => {
      try {
        return await getCosmeticShop();
      } catch (error) {
        toast.error('Không thể tải cửa hàng.');
        throw error;
      }
    },
    retry: false,
    staleTime: 0,
  });
  const items: CosmeticResponse[] = Array.isArray(data) ? data : EMPTY_LIST;

  const handleBuy = (item: CosmeticResponse) => {
    buyMutation.mutate(item.cosmeticId, {
      onSuccess: () => {
        toast.success(`Đã mua "${item.name}"!`);
      },
      onError: (error) => {
        toast.error(error?.response?.data?.message || 'Mua thất bại. Vui lòng thử lại.');
      },
    });
  };

  const handleEquip = (item: CosmeticResponse) => {
    equipMutation.mutate(item.cosmeticId, {
      onError: (error) => {
        toast.error(error?.response?.data?.message || 'Không thể đeo vật phẩm.');
      },
    });
  };

  const handleUnequip = (item: CosmeticResponse) => {
    unequipMutation.mutate(item.cosmeticId, {
      onError: () => {
        toast.error('Không thể tháo vật phẩm.');
      },
    });
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

  const renderCard = (item: CosmeticResponse) => {
    const busy = busyId === item.cosmeticId;
    const canAfford = balance >= item.costCoins!;

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
