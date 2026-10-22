'use client';

import { Col } from 'react-bootstrap';
import { IoRocketOutline } from 'react-icons/io5';
import { useTranslations } from 'next-intl';
import { useHasPermission } from '@/app/hooks/usePermission';
import { PermissionCode } from '@/app/enums';

type CoinPriceFieldProps = {
  value?: string | number;
  onChange: (value: string) => void;
  isPublic?: boolean;
  md?: number;
  groupClassName?: string;
  inputClassName?: string;
};

const CoinPriceField = ({
  value,
  onChange,
  isPublic = true,
  md = 4,
  groupClassName,
  inputClassName,
}: CoinPriceFieldProps) => {
  const t = useTranslations('TestCreator');
  const canSetPricing = useHasPermission(PermissionCode.TEST_MANAGE_PRICING);
  if (!canSetPricing || !isPublic) return null;

  return (
    <Col md={md}>
      <div className={groupClassName}>
        <label>
          <IoRocketOutline /> {t('coinPrice.label')}
        </label>
        <input
          type="number"
          min={0}
          className={inputClassName}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={t('coinPrice.ariaLabel')}
        />
      </div>
    </Col>
  );
};

export default CoinPriceField;
