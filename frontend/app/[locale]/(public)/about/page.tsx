import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { localeAlternates } from '@/app/i18n/metadata';
import { routing } from '@/app/i18n/routing';
import routes from '@/app/configs/Routes';
import About from './About';

export async function generateMetadata({ params }: PageProps<'/[locale]/about'>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'About' });
  return {
    // Tiêu đề đã có tên thương hiệu ở đầu nên bỏ mẫu "%s | FrostScope" của layout.
    title: { absolute: t('meta.title') },
    description: t('meta.description'),
    alternates: localeAlternates(locale, routes.about),
  };
}

export default async function Page({ params }: PageProps<'/[locale]/about'>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return <About />;
}
