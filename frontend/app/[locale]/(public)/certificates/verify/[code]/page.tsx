import { getTranslations } from 'next-intl/server';
import CertificateVerify from '@/app/[locale]/(public)/certificates/verify/CertificateVerify';
import { localeAlternates } from '@/app/i18n/metadata';
import type { Locale } from '@/app/i18n/routing';

export async function generateMetadata({ params }: PageProps<'/[locale]/certificates/verify/[code]'>) {
  const { locale: rawLocale, code } = await params;
  const locale = rawLocale as Locale;
  const t = await getTranslations({ locale, namespace: 'Certificates' });
  const title = t('codeMeta.title');
  const description = t('codeMeta.description');

  return {
    title,
    description,
    robots: { index: false, follow: true },
    alternates: localeAlternates(locale, `/certificates/verify/${code}`),
    openGraph: { type: 'website', title, description },
  };
}

export default function Page() {
  return <CertificateVerify />;
}
