import PageHeader from '~/shared/ui/PageHeader/PageHeader';

// Dùng chung PageHeader hero với Dashboard: mô tả thành eyebrow (IN HOA, mờ, ở trên),
// tiêu đề đậm ở dưới — đồng bộ hệt Dashboard cho toàn bộ trang admin.
function AdminPageHeader({title, description, children}) {
  return (
    <PageHeader title={title} label={description}>
      {children}
    </PageHeader>
  );
}

export default AdminPageHeader;
