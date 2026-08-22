import { BadgeCheck, Clock, ShieldAlert, ShieldX, type LucideIcon } from 'lucide-react';

import { CertificateVerifyState } from '@/app/enums';

export type CertificateStateView = {
  icon: LucideIcon;
  tone: string;
  heading: string;
  message: string;
  watermark?: string;
};

export const CERTIFICATE_STATE_VIEW: Record<CertificateVerifyState, CertificateStateView> = {
  VALID: {
    icon: BadgeCheck,
    tone: 'valid',
    heading: 'Chứng chỉ hợp lệ',
    message: 'Chứng chỉ này do hệ thống cấp và đang còn hiệu lực.',
  },
  REVOKED: {
    icon: ShieldX,
    tone: 'invalid',
    heading: 'Chứng chỉ đã bị thu hồi',
    message: 'Chứng chỉ từng được cấp nhưng đã bị thu hồi, không còn giá trị sử dụng.',
    watermark: 'REVOKED',
  },
  EXPIRED: {
    icon: Clock,
    tone: 'warning',
    heading: 'Chứng chỉ đã hết hạn',
    message: 'Chứng chỉ này đã quá thời hạn hiệu lực.',
    watermark: 'EXPIRED',
  },
  NOT_FOUND: {
    icon: ShieldAlert,
    tone: 'invalid',
    heading: 'Không tìm thấy chứng chỉ',
    message: 'Không có chứng chỉ nào mang mã này. Hãy kiểm tra lại mã tra cứu.',
  },
};

export const getCertificateStateView = (state?: CertificateVerifyState): CertificateStateView =>
  (state && CERTIFICATE_STATE_VIEW[state]) || CERTIFICATE_STATE_VIEW.NOT_FOUND;
