import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/app/i18n/routing';
import Login from './Login';

export async function generateMetadata({ params }: PageProps<'/[locale]/login'>) {
  const { locale: raw } = await params;
  const locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: 'Auth' });
  return {
    title: t('meta.loginTitle'),
    description: t('meta.loginDescription'),
    // Không đưa vào kết quả tìm kiếm nhưng vẫn cho đi theo link. robots.txt không được chặn trang này,
    // nếu không Googlebot không đọc được chỉ thị noindex.
    robots: { index: false, follow: true },
  };
}

export default function Page() {
  return <Login />;
}
