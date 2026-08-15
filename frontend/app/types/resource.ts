import type { TagResponse } from './question';

export interface RecoveryResourceRequest {
  title?: string;
  description?: string;
  url?: string;
  tagIds?: string[];
  examPartId?: string;
}

export interface RecoveryResourceResponse {
  resourceId: string;
  title?: string;
  description?: string;
  url?: string;
  originalFileName?: string;
  createdBy?: string;
  createdAt?: string;
  tags?: TagResponse[];
  examTypeId?: string;
  examTypeName?: string;
  examPartId?: string;
  examPartName?: string;
}
