'use client';

import PageHeader from '@/app/components/PageHeader/PageHeader';

type AdminPageHeaderProps = {
  title: string;
  description?: string;
  children?: React.ReactNode;
};

// Dải gradient (variant band) chỉ dùng ở admin, bản gọn: topbar đã hiện vị trí trang,
// admin cần chỗ cho bảng/form. Mô tả là cả câu nên đặt dưới tiêu đề, không làm nhãn in hoa.
function AdminPageHeader({title, description, children}: AdminPageHeaderProps) {
  return (
    <PageHeader title={title} description={description} compact variant="band">
      {children}
    </PageHeader>
  );
}

export default AdminPageHeader;
