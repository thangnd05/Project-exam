import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/app/i18n/routing';
import ForgotPassword from '@/app/[locale]/(auth)/_components/auth/ForgotPassword';

export async function generateMetadata({ params }: PageProps<'/[locale]/forgot-password'>) {
  const { locale: raw } = await params;
  const locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: 'Auth' });
  return {
    title: t('meta.forgotTitle'),
    description: t('meta.forgotDescription'),
    // Như trang đăng nhập: noindex, follow và không chặn trong robots.txt.
    robots: { index: false, follow: true },
  };
}

export default function Page() {
  return <ForgotPassword />;
}
