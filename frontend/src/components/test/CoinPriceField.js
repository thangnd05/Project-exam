import { Col } from 'react-bootstrap';
import { IoRocketOutline } from 'react-icons/io5';
import { useHasPermission } from '~/hooks/usePermission';

// Ô nhập giá xu cho bài kiểm tra.
// Chỉ hiện với người có quyền đặt giá (TEST:MANAGE_PRICING) & bài công khai (isPublic).
// className truyền từ ngoài vào để khớp style sibling của từng form (CSS module file-scoped).
const CoinPriceField = ({
  value,
  onChange,
  isPublic = true,
  md = 4,
  groupClassName,
  inputClassName,
}) => {
  const canSetPricing = useHasPermission('TEST:MANAGE_PRICING');
  if (!canSetPricing || !isPublic) return null;

  return (
    <Col md={md}>
      <div className={groupClassName}>
        <label>
          <IoRocketOutline /> Giá xu (để trống = miễn phí)
        </label>
        <input
          type="number"
          min={0}
          className={inputClassName}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Giá xu"
        />
      </div>
    </Col>
  );
};

export default CoinPriceField;
