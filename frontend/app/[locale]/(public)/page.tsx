import { localeAlternates } from '@/app/i18n/metadata';
import Home from './Home';

// Tiêu đề/mô tả lấy mặc định từ layout gốc; trang chủ chỉ thêm canonical + hreflang.
export async function generateMetadata({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params;
  return { alternates: localeAlternates(locale, '/') };
}

export default function Page() {
  return <Home />;
}
