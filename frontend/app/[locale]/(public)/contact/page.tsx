import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { localeAlternates } from '@/app/i18n/metadata';
import { routing } from '@/app/i18n/routing';
import routes from '@/app/configs/Routes';
import Contact from './Contact';

export async function generateMetadata({ params }: PageProps<'/[locale]/contact'>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'Contact' });
  return {
    title: t('meta.title'),
    description: t('meta.description'),
    alternates: localeAlternates(locale, routes.contact),
  };
}

export default async function Page({ params }: PageProps<'/[locale]/contact'>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return <Contact />;
}
