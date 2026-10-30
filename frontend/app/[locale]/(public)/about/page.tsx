import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { localeAlternates } from '@/app/i18n/metadata';
import { routing } from '@/app/i18n/routing';
import routes from '@/app/configs/Routes';
import { SITE_NAME } from '@/app/constants/site';
import About from './About';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

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
  const t = await getTranslations({ locale, namespace: 'About' });
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/favicons/frostscope-512.png`,
    description: t('schema.description'),
    slogan: t('schema.slogan'),
    contactPoint: [
      { '@type': 'ContactPoint', email: 'contact@frostscope.com', contactType: 'customer support' },
      { '@type': 'ContactPoint', email: 'legal@frostscope.com', contactType: 'legal' },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization).replace(/</g, '\\u003c') }}
      />
      <About />
    </>
  );
}
