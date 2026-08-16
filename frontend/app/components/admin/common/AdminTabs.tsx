'use client';

import {Nav} from 'react-bootstrap';
import classNames from 'classnames/bind';
import styles from './adminKit.module.scss';

const cx = classNames.bind(styles);

type AdminTabItem = {
  key: string;
  label: React.ReactNode;
};

type AdminTabsProps = {
  items?: AdminTabItem[];
  activeKey?: string;
  onSelect?: (key?: string) => void;
};

function AdminTabs({items = [], activeKey, onSelect}: AdminTabsProps) {
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
