'use client';

import PageHeader from '@/app/components/PageHeader/PageHeader';

function AdminPageHeader({title, description, children}) {
  return (
    <PageHeader title={title} label={description}>
      {children}
    </PageHeader>
  );
}

export default AdminPageHeader;
