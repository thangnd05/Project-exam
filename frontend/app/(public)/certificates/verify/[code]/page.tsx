import CertificateVerify from '../CertificateVerify';

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
