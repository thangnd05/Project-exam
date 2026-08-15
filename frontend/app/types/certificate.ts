import { AttemptCertificateState, CertificateStatus, CertificateVerifyState } from '@/app/enums';

export interface CertificateDesign {
  title?: string;
  subtitle?: string;
  footerNote?: string;
  logoUrl?: string;
  backgroundUrl?: string;
  accentColor?: string;
  issuerName?: string;
  signatureName?: string;
  signatureTitle?: string;
  signatureImageUrl?: string;
  examTypeName?: string;
}

export interface CertificateResponse {
  certificateId: string;
  certificateCode?: string;
  recipientName?: string;
  examTypeId?: string;
  testTitle?: string;
  score?: number;
  status?: CertificateStatus;
  issuedAt?: string;
  expiresAt?: string;
  expired: boolean;
  design?: CertificateDesign;
  userId?: string;
  userTestId?: string;
  revokedReason?: string;
  revokedAt?: string;
}

export interface AttemptCertificateResponse {
  state?: AttemptCertificateState;
  score?: number;
  passScore?: number;
  pointsToPass?: number;
  certificate?: CertificateResponse;
}

export interface CertificateTemplateRequest {
  examTypeId: string;
  passScore: number;
  title: string;
  subtitle?: string;
  footerNote?: string;
  logoUrl?: string;
  backgroundUrl?: string;
  accentColor?: string;
  issuerName?: string;
  signatureName?: string;
  signatureTitle?: string;
  signatureImageUrl?: string;
  validMonths?: number;
  active?: boolean;
}

export interface CertificateTemplateResponse {
  templateId: string;
  examTypeId?: string;
  examTypeName?: string;
  active?: boolean;
  passScore?: number;
  title?: string;
  subtitle?: string;
  footerNote?: string;
  logoUrl?: string;
  backgroundUrl?: string;
  accentColor?: string;
  issuerName?: string;
  signatureName?: string;
  signatureTitle?: string;
  signatureImageUrl?: string;
  validMonths?: number;
  issuedCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CertificateVerifyResponse {
  valid: boolean;
  state?: CertificateVerifyState;
  certificateCode?: string;
  recipientName?: string;
  title?: string;
  examTypeName?: string;
  issuerName?: string;
  issuedAt?: string;
  expiresAt?: string;
  design?: CertificateDesign;
}

export interface RevokeCertificateRequest {
  reason?: string;
}
