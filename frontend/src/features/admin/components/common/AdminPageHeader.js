import PageHeader from '~/shared/ui/PageHeader/PageHeader';

function AdminPageHeader({title, description, children}) {
  return (
    <PageHeader title={title} label={description}>
      {children}
    </PageHeader>
  );
}

export default AdminPageHeader;
