import axios from './axiosClient';
import type {
  CategoryRequest,
  CategoryResponse,
  CommentRequest,
  CommentResponse,
  ImageUploadResponse,
  PageResponse,
  PostResponse,
  PostSummaryResponse,
  ReactRequest,
  ReactSummaryResponse,
  SavedPostStatusResponse,
} from '@/app/types';

const BASE_URL = '/api/posts';

interface PostListParams {
  page?: number;
  size?: number;
  keyword?: string;
  status?: string;
  categoryId?: string;
}

export const getPosts = ({ page = 0, size = 10, keyword, status, categoryId }: PostListParams = {}): Promise<PageResponse<PostSummaryResponse>> => {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));
  if (keyword && keyword.trim()) {
    params.set('keyword', keyword.trim());
  }
  if (status) {
    params.set('status', status);
  }
  if (categoryId) {
    params.set('categoryId', categoryId);
  }

  return axios
    .get(`${BASE_URL}?${params.toString()}`)
    .then((response) => response.data);
};

export const getPostById = (postId: string): Promise<PostResponse> => {
  return axios.get(`${BASE_URL}/${postId}`).then((response) => response.data);
};

export const getMyPosts = ({ page = 0, size = 10, keyword, status }: PostListParams = {}): Promise<PageResponse<PostSummaryResponse>> => {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));
  if (keyword && keyword.trim()) {
    params.set('keyword', keyword.trim());
  }
  if (status) {
    params.set('status', status);
  }
  return axios
    .get(`${BASE_URL}/me?${params.toString()}`)
    .then((response) => response.data);
};

const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' } };

export const uploadPostImage = (formData: FormData): Promise<ImageUploadResponse> => {
  return axios.post(`${BASE_URL}/upload-image`, formData, MULTIPART).then((response) => response.data);
};

export const createPost = (formData: FormData): Promise<PostResponse> => {
  return axios.post(BASE_URL, formData, MULTIPART).then((response) => response.data);
};

export const updatePost = (postId: string, formData: FormData): Promise<PostResponse> => {
  return axios.put(`${BASE_URL}/${postId}`, formData, MULTIPART).then((response) => response.data);
};

export const getCategories = (): Promise<CategoryResponse[]> => {
  return axios.get('/api/categories').then((response) => response.data);
};

export const createCategory = (data: CategoryRequest): Promise<CategoryResponse> => {
  return axios.post('/api/categories', data).then((response) => response.data);
};

export const updateCategory = (categoryId: string, data: CategoryRequest): Promise<CategoryResponse> => {
  return axios.put(`/api/categories/${categoryId}`, data).then((response) => response.data);
};

export const deleteCategory = (categoryId: string): Promise<void> => {
  return axios.delete(`/api/categories/${categoryId}`).then((response) => response.data);
};

export const updatePostStatus = (postId: string, status: string): Promise<PostResponse> => {
  return axios.patch(`${BASE_URL}/${postId}/status`, { status }).then((response) => response.data);
};

export const deletePost = (postId: string): Promise<void> => {
  return axios.delete(`${BASE_URL}/${postId}`).then((response) => response.data);
};

export const getComments = (postId: string): Promise<CommentResponse[]> => {
  return axios.get(`${BASE_URL}/${postId}/comments`).then((response) => response.data);
};

export const addComment = (postId: string, data: CommentRequest): Promise<CommentResponse> => {
  return axios.post(`${BASE_URL}/${postId}/comments`, data).then((response) => response.data);
};

export const deleteComment = (commentId: string): Promise<void> => {
  return axios.delete(`/api/comments/${commentId}`).then(() => {});
};

export const updateComment = (commentId: string, data: CommentRequest): Promise<CommentResponse> => {
  return axios.put(`/api/comments/${commentId}`, data).then((response) => response.data);
};

export const getReacts = (postId: string): Promise<ReactSummaryResponse> => {
  return axios.get(`${BASE_URL}/${postId}/reacts`).then((response) => response.data);
};

export const toggleReact = (postId: string, data: ReactRequest): Promise<ReactSummaryResponse> => {
  return axios.post(`${BASE_URL}/${postId}/reacts`, data).then((response) => response.data);
};

export const toggleSavePost = (postId: string): Promise<SavedPostStatusResponse> => {
  return axios.post(`${BASE_URL}/${postId}/save`).then((response) => response.data);
};

export const getSavedPosts = ({ page = 0, size = 10, keyword }: PostListParams = {}): Promise<PageResponse<PostSummaryResponse>> => {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));
  if (keyword && keyword.trim()) {
    params.set('keyword', keyword.trim());
  }
  return axios
    .get(`${BASE_URL}/saved?${params.toString()}`)
    .then((response) => response.data);
};

export const getSaveStatus = (postId: string): Promise<SavedPostStatusResponse> => {
  return axios.get(`${BASE_URL}/${postId}/save`).then((response) => response.data);
};
