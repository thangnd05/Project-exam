import { getTranslations } from 'next-intl/server';
import NotFound from '@/app/components/NotFound/NotFound';

// not-found không nhận params; trang 404 vốn render động nên lấy ngôn ngữ từ request (proxy đã ghép sẵn).
export async function generateMetadata() {
  const t = await getTranslations('Common.notFound');
  return {
    title: t('pageTitle'),
    robots: { index: false, follow: false },
  };
}

export default function NotFoundPage() {
  return <NotFound />;
}
