// <html> nằm ở app/[locale]/layout.tsx để lang đổi theo ngôn ngữ của URL. File này vẫn cần cho
// app/not-found.tsx (đường dẫn proxy không xử lý, vd tệp tĩnh không tồn tại).
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
