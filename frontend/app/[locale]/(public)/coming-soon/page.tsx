import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/app/i18n/routing';
import { findProvider } from '../_lib/providers';
import ComingSoon from './ComingSoon';

type ComingSoonPageProps = PageProps<'/[locale]/coming-soon'>;

const providerOf = async (searchParams: ComingSoonPageProps['searchParams']) => {
  const { provider } = await searchParams;
  return findProvider(typeof provider === 'string' ? provider : undefined);
};

// Trang giữ chỗ cho đề chưa có nên không cho lập chỉ mục; tiêu đề cố định, không đổi theo ?provider=.
export async function generateMetadata({ params }: ComingSoonPageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'Common.comingSoon' });
  return {
    title: t('pageTitle'),
    robots: { index: false, follow: true },
  };
}

export default async function Page({ params, searchParams }: ComingSoonPageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const provider = await providerOf(searchParams);
  return <ComingSoon provider={provider} />;
}
