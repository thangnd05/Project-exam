import { AttemptCertificateState, CertificateStatus, CertificateVerifyState } from '@/app/enums';

export interface CertificateDesign {
  title?: string;
  subtitle?: string;
  /** Câu mô tả giữa chứng chỉ; bỏ trống thì dùng câu mặc định theo tên loại đề. */
  bodyText?: string;
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
  bodyText?: string;
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
  bodyText?: string;
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

/** Một dòng bảng vinh danh công khai — không kèm certificateId/điểm số, link đi qua mã tra cứu. */
export interface PublicCertificateResponse {
  certificateCode?: string;
  recipientName?: string;
  title?: string;
  examTypeId?: string;
  examTypeName?: string;
  issuedAt?: string;
  expiresAt?: string;
  logoUrl?: string;
  accentColor?: string;
  /** Phần trình bày chụp lúc cấp, để danh sách vẽ bản thu nhỏ của chính tấm chứng chỉ. */
  design?: CertificateDesign;
}

export interface RevokeCertificateRequest {
  reason?: string;
}
