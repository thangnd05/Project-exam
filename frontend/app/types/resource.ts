import type { TagResponse } from './question';

export interface RecoveryResourceRequest {
  title?: string;
  description?: string;
  url?: string;
  tagIds?: string[];
  examTypeId?: string;
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
  /** Suy ra từ tag, theo thứ tự phần thi */
  examPartIds?: string[];
  examPartNames?: string[];
}
