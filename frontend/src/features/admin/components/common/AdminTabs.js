import {Nav} from 'react-bootstrap';
import classNames from 'classnames/bind';
import styles from './adminKit.module.scss';

const cx = classNames.bind(styles);

/**
 * Tab chuyển khu vực trong một trang quản trị. Bọc Nav của bootstrap để mọi trang dùng
 * chung một kiểu: tab chưa chọn màu chữ phụ, tab đang chọn màu thương hiệu kèm gạch chân
 * — mặc định của bootstrap là chữ xanh link, lạc hẳn với phần còn lại của admin.
 *
 * items: [{ key, label }]
 */
function AdminTabs({items = [], activeKey, onSelect}) {
  return (
    <Nav
      variant="tabs"
      activeKey={activeKey}
      onSelect={(key) => onSelect?.(key || items[0]?.key)}
      className={cx('tabs')}
    >
      {items.map((item) => (
        <Nav.Item key={item.key}>
          <Nav.Link eventKey={item.key}>{item.label}</Nav.Link>
        </Nav.Item>
      ))}
    </Nav>
  );
}

export default AdminTabs;
