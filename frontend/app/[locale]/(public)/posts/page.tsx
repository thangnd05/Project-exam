import { getTranslations, setRequestLocale } from 'next-intl/server';
import { localeAlternates } from '@/app/i18n/metadata';
import type { Locale } from '@/app/i18n/routing';
import Posts from './Posts';

export async function generateMetadata({ params }: PageProps<'/[locale]/posts'>) {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: 'Posts' });
  return {
    title: t('meta.title'),
    description: t('meta.description'),
    alternates: localeAlternates(locale, '/posts'),
  };
}

export default async function Page({ params }: PageProps<'/[locale]/posts'>) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  return <Posts />;
}
