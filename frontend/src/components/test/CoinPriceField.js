import { Col } from 'react-bootstrap';
import { IoRocketOutline } from 'react-icons/io5';
import { useIsAdmin } from '~/hooks/useIsAdmin';

// Ô nhập giá xu cho bài kiểm tra.
// Chỉ hiện với admin & bài công khai (isPublic) — gom 1 chỗ cho 3 luồng tạo đề.
// className truyền từ ngoài vào để khớp style sibling của từng form (CSS module file-scoped).
const CoinPriceField = ({
  value,
  onChange,
  isPublic = true,
  md = 4,
  groupClassName,
  inputClassName,
}) => {
  const isAdmin = useIsAdmin();
  if (!isAdmin || !isPublic) return null;

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
