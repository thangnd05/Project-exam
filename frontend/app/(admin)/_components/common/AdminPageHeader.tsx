'use client';

import PageHeader from '@/app/components/PageHeader/PageHeader';

type AdminPageHeaderProps = {
  title: string;
  description?: string;
  children?: React.ReactNode;
};

function AdminPageHeader({title, description, children}: AdminPageHeaderProps) {
  return (
    <PageHeader title={title} label={description}>
      {children}
    </PageHeader>
  );
}

export default AdminPageHeader;
