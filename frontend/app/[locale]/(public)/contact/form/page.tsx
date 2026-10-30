import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/app/i18n/routing';
import ContactForm from './ContactForm';

export async function generateMetadata({ params }: PageProps<'/[locale]/contact/form'>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'ContactForm' });
  return {
    title: t('meta.title'),
    description: t('meta.description'),
    // Trang chưa có lối vào và chưa nối API gửi tin nhắn nên không cho index.
    robots: { index: false, follow: true },
  };
}

export default async function Page({ params }: PageProps<'/[locale]/contact/form'>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return <ContactForm />;
}
