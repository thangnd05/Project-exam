import { Inter, JetBrains_Mono, Playfair_Display } from 'next/font/google';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import '@/app/assets/styles/GlobalStyles/GlobalStyles.scss';
import '@/app/assets/styles/global-overrides.scss';
import Providers from '@/app/providers';
import BrowserSupportScript from '@/app/components/layouts/BrowserSupportScript';
import ThemeInitScript from '@/app/components/layouts/ThemeInitScript';
import { routing } from '@/app/i18n/routing';
import { OG_LOCALES } from '@/app/i18n/metadata';
import { DEFAULT_PALETTE } from '@/app/constants/theme';
import { SITE_NAME } from '@/app/constants/site';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-inter',
});

// Ba font, mỗi font một vai: Inter cho giao diện, JetBrains Mono cho mã/nhãn kỹ thuật,
// Playfair cho chứng chỉ và tiêu đề bài viết. Token tương ứng: --font-family, --font-mono, --font-serif.
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
});

const playfair = Playfair_Display({
  subsets: ['latin', 'vietnamese'],
  weight: ['600', '700'],
  display: 'swap',
  variable: '--font-playfair',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  const title = t('title');
  const description = t('description');

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      template: `%s | ${SITE_NAME}`,
    },
    description,
    applicationName: SITE_NAME,
    manifest: '/site.webmanifest',
    icons: {
      icon: [
        { url: '/favicons/frostscope-32.png', sizes: '32x32', type: 'image/png' },
        { url: '/favicons/frostscope-192.png', sizes: '192x192', type: 'image/png' },
      ],
      apple: { url: '/favicons/frostscope-180.png', sizes: '180x180', type: 'image/png' },
    },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: OG_LOCALES[locale],
      alternateLocale: routing.locales.filter((l) => l !== locale).map((l) => OG_LOCALES[l]),
      url: locale === routing.defaultLocale ? SITE_URL : `${SITE_URL}/${locale}`,
      title,
      description,
      images: [{ url: '/favicons/frostscope-512.png', width: 512, height: 512, alt: SITE_NAME }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/favicons/frostscope-512.png'],
    },
  };
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#101820',
};

// Layout gốc thật nằm ở đây (không phải app/layout.tsx) để <html lang> đổi theo ngôn ngữ của URL.
export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  // Cho next-intl biết ngôn ngữ từ params thay vì đọc header, nhờ vậy trang vẫn render tĩnh được.
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${jetbrainsMono.variable} ${playfair.variable}`}
      data-palette={DEFAULT_PALETTE}
      // Bootstrap reboot bật scroll-behavior: smooth trên :root; thuộc tính này để Next tắt cuộn mượt khi chuyển trang.
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <BrowserSupportScript />
        <ThemeInitScript />
      </head>
      <body>
        <noscript>{t('noscript')}</noscript>
        <div id="root">
          <NextIntlClientProvider>
            <Providers>{children}</Providers>
          </NextIntlClientProvider>
        </div>
      </body>
    </html>
  );
}
