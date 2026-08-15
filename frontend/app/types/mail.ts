import { EmailStatus, EmailType } from '@/app/enums';

export interface EmailResponse {
  emailId: string;
  type?: EmailType;
  typeLabel?: string;
  code?: string;
  name?: string;
  description?: string;
  subject?: string;
  bodyHtml?: string;
  availableVars?: string[];
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  totalCount: number;
  sentCount: number;
  failedCount: number;
  pendingCount: number;
}

export interface EmailRecipientResponse {
  recipientId: string;
  userId?: string;
  fullName?: string;
  toEmail?: string;
  status?: EmailStatus;
  statusLabel?: string;
  errorMessage?: string;
  createdAt?: string;
  sentAt?: string;
}

export interface EmailSaveRequest {
  name?: string;
  description?: string;
  subject: string;
  bodyHtml: string;
  active?: boolean;
}

export interface EmailSendRequest {
  userIds: string[];
}

export interface EmailPreviewRequest {
  subject: string;
  bodyHtml: string;
  toEmail?: string;
}

export interface EmailPreviewResponse {
  subject?: string;
  bodyHtml?: string;
}

export interface MailAudienceOptionResponse {
  userId: string;
  userName?: string;
  fullName?: string;
  email?: string;
  roleId?: string;
  roleName?: string;
  isPremium?: boolean;
}
