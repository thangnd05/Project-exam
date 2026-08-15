import { PostStatus, ReactType } from '@/app/enums';
import type { CosmeticResponse } from './gamification';

export interface CategoryRequest {
  name?: string;
  slug?: string;
}

export interface CategoryResponse {
  id: string;
  name?: string;
  slug?: string;
}

export interface PostUpsertRequest {
  title?: string;
  content?: string;
  thumbnailUrl?: string;
  status?: PostStatus;
  categoryIds?: string[];
}

export interface UpdatePostStatusRequest {
  status?: PostStatus;
}

export interface PostResponse {
  id: string;
  userId?: string;
  authorName?: string;
  authorAvatar?: string;
  equippedFrame?: CosmeticResponse;
  equippedBadge?: CosmeticResponse;
  title?: string;
  content?: string;
  status?: PostStatus;
  createdAt?: string;
  thumbnailUrl?: string;
  categories?: CategoryResponse[];
  reactCounts?: Record<string, number>;
  currentUserReactType?: string;
  commentCount: number;
  viewCount: number;
  saveCount: number;
  currentUserSaved: boolean;
}

export interface PostSummaryResponse {
  id: string;
  userId?: string;
  authorName?: string;
  authorAvatar?: string;
  equippedFrame?: CosmeticResponse;
  equippedBadge?: CosmeticResponse;
  title?: string;
  status?: PostStatus;
  createdAt?: string;
  thumbnailUrl?: string;
  categories?: CategoryResponse[];
  commentCount: number;
  totalReacts: number;
  viewCount: number;
  saveCount: number;
}

export interface CommentRequest {
  content?: string;
  parentId?: string;
}

export interface CommentResponse {
  id: string;
  postId?: string;
  userId?: string;
  parentId?: string;
  content?: string;
  createdAt?: string;
  authorName?: string;
  authorAvatar?: string;
  equippedFrame?: CosmeticResponse;
  equippedBadge?: CosmeticResponse;
  replies?: CommentResponse[];
}

export interface ReactRequest {
  type?: ReactType;
}

export interface ReactSummaryResponse {
  counts?: Record<string, number>;
  currentUserReactType?: string;
  total: number;
}

export interface SavedPostStatusResponse {
  saved: boolean;
  saveCount: number;
}

export interface ImageUploadResponse {
  url?: string;
}
