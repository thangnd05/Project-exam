import BaseModal from './BaseModal';

// Map size cũ (react-bootstrap) -> maxWidth của BaseModal.
const SIZE_MAX_WIDTH = {
  sm: 420,
  md: 550,
  lg: 800,
  xl: 1140,
};

/**
 * Khung form modal dùng chung — nay render qua BaseModal (header gradient chung).
 * Giữ nguyên API cũ (show/onHide/title/icon/footer/size) để không phải sửa nơi gọi.
 */
function CommonFormModal({
  show,
  onHide,
  title,
  icon,
  children,
  footer,
  size = 'md',
}) {
  return (
    <BaseModal
      show={show}
      onClose={onHide}
      title={title}
      icon={icon}
      footer={footer}
      maxWidth={SIZE_MAX_WIDTH[size] || SIZE_MAX_WIDTH.md}
    >
      {children}
    </BaseModal>
  );
}

export default CommonFormModal;
