// Suspense là BẮT BUỘC: Next yêu cầu mọi component dùng useSearchParams() phải nằm trong
// một ranh giới Suspense, nếu không trang sẽ không prerender được.
import { Suspense } from 'react';
import Loading from '@/app/components/Loading/Loading';

// Không khung: trang in tài liệu và trang 404 tự lo bố cục của mình.

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <><Suspense fallback={<Loading />}>{children}</Suspense></>
  );
}
