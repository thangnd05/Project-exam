import NotFound from '@/app/components/NotFound/NotFound';

export const metadata = {
  title: 'Không tìm thấy trang',
  robots: { index: false, follow: false },
};

export default function NotFoundPage() {
  return <NotFound />;
}
