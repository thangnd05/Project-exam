'use client';

import BaseModal from './BaseModal';

const SIZE_MAX_WIDTH = {
  sm: 420,
  md: 550,
  lg: 800,
  xl: 1140,
};

type CommonFormModalProps = {
  show?: boolean;
  onHide?: () => void;
  title?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
};

function CommonFormModal({
  show,
  onHide,
  title,
  children,
  footer,
  size = 'md',
}: CommonFormModalProps) {
  return (
    <BaseModal
      show={show}
      onClose={onHide}
      title={title}
      footer={footer}
      maxWidth={SIZE_MAX_WIDTH[size] || SIZE_MAX_WIDTH.md}
    >
      {children}
    </BaseModal>
  );
}

export default CommonFormModal;
