import CertificateVerify from '../CertificateVerify';

// Trang tra cứu theo mã: cố tình KHÔNG fetch dữ liệu chứng chỉ vào metadata và đặt
// noindex — kết quả tra cứu chứa tên người học, không nên để lộ trong thẻ OG hay lọt
// vào chỉ mục tìm kiếm. Trang gốc /certificates/verify vẫn được index bình thường.
export function generateMetadata() {
  const title = 'Xác thực chứng chỉ';
  const description =
    'Kiểm tra tính hợp lệ của chứng chỉ do WinDe Exam cấp bằng mã chứng chỉ in trên bản chứng chỉ.';

  return {
    title,
    description,
    robots: { index: false, follow: true },
    openGraph: { type: 'website', title, description },
  };
}

export default function Page() {
  return <CertificateVerify />;
}
