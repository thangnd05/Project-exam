import CertificateVerify from './CertificateVerify';

export const metadata = {
  title: 'Tra cứu chứng chỉ',
  description:
    'Xác thực chứng chỉ do WinDe Exam cấp bằng mã tra cứu, xem danh mục chứng chỉ đang cấp và các chứng chỉ vừa được cấp.',
};

export default function Page() {
  return <CertificateVerify />;
}
