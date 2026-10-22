import { BadgeCheck, Clock, ShieldAlert, ShieldX, type LucideIcon } from 'lucide-react';

import { CertificateVerifyState } from '@/app/enums';

// heading/message là key trong namespace Certificates, component tự dịch bằng t().
export type CertificateStateMessageKey =
  | `state.${CertificateVerifyState}.heading`
  | `state.${CertificateVerifyState}.message`;

export type CertificateStateView = {
  icon: LucideIcon;
  tone: string;
  heading: CertificateStateMessageKey;
  message: CertificateStateMessageKey;
  watermark?: string;
};

export const CERTIFICATE_STATE_VIEW: Record<CertificateVerifyState, CertificateStateView> = {
  VALID: {
    icon: BadgeCheck,
    tone: 'valid',
    heading: 'state.VALID.heading',
    message: 'state.VALID.message',
  },
  REVOKED: {
    icon: ShieldX,
    tone: 'invalid',
    heading: 'state.REVOKED.heading',
    message: 'state.REVOKED.message',
    watermark: 'REVOKED',
  },
  EXPIRED: {
    icon: Clock,
    tone: 'warning',
    heading: 'state.EXPIRED.heading',
    message: 'state.EXPIRED.message',
    watermark: 'EXPIRED',
  },
  NOT_FOUND: {
    icon: ShieldAlert,
    tone: 'invalid',
    heading: 'state.NOT_FOUND.heading',
    message: 'state.NOT_FOUND.message',
  },
};

export const getCertificateStateView = (state?: CertificateVerifyState): CertificateStateView =>
  (state && CERTIFICATE_STATE_VIEW[state]) || CERTIFICATE_STATE_VIEW.NOT_FOUND;
