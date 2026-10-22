import { getTranslations, setRequestLocale } from 'next-intl/server';
import { localeAlternates } from '@/app/i18n/metadata';
import type { Locale } from '@/app/i18n/routing';
import CertificateVerify from './CertificateVerify';

export async function generateMetadata({ params }: PageProps<'/[locale]/certificates/verify'>) {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: 'Certificates' });
  return {
    title: t('meta.title'),
    description: t('meta.description'),
    alternates: localeAlternates(locale, '/certificates/verify'),
  };
}

export default async function Page({ params }: PageProps<'/[locale]/certificates/verify'>) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  return <CertificateVerify />;
}
