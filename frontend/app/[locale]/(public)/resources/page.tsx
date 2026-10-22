import { getTranslations, setRequestLocale } from 'next-intl/server';
import { localeAlternates } from '@/app/i18n/metadata';
import type { Locale } from '@/app/i18n/routing';
import ResourceLibrary from './ResourceLibrary';

export async function generateMetadata({ params }: PageProps<'/[locale]/resources'>) {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: 'Resources' });
  return {
    title: t('meta.title'),
    description: t('meta.description'),
    alternates: localeAlternates(locale, '/resources'),
  };
}

export default async function Page({ params }: PageProps<'/[locale]/resources'>) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  return <ResourceLibrary />;
}
