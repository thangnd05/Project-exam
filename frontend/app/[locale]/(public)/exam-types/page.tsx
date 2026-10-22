import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { localeAlternates } from '@/app/i18n/metadata';
import { routing } from '@/app/i18n/routing';
import ExamCatalog from './ExamCatalog';

export async function generateMetadata({ params }: PageProps<'/[locale]/exam-types'>) {
  const { locale: raw } = await params;
  const locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: 'ExamTypes' });
  return {
    title: t('meta.title'),
    description: t('meta.description'),
    alternates: localeAlternates(locale, '/exam-types'),
  };
}

export default function Page() {
  return <ExamCatalog />;
}
