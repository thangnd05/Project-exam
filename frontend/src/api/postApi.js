import axios from './axiosClient';

const BASE_URL = '/api/posts';

export const getPosts = ({ page = 0, size = 10, keyword, status, categoryId } = {}) => {
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

export const getPostById = (postId) => {
  return axios.get(`${BASE_URL}/${postId}`).then((response) => response.data);
};

export const getMyPosts = () => {
  return axios.get(`${BASE_URL}/me`).then((response) => response.data);
};

// --- Create / Update (multipart: kèm thumbnail/ảnh) ---
const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' } };

export const uploadPostImage = (formData) => {
  return axios.post(`${BASE_URL}/upload-image`, formData, MULTIPART).then((response) => response.data);
};

export const createPost = (formData) => {
  return axios.post(BASE_URL, formData, MULTIPART).then((response) => response.data);
};

export const updatePost = (postId, formData) => {
  return axios.put(`${BASE_URL}/${postId}`, formData, MULTIPART).then((response) => response.data);
};

// --- Categories ---
export const getCategories = () => {
  return axios.get('/api/categories').then((response) => response.data);
};

export const createCategory = (data) => {
  return axios.post('/api/categories', data).then((response) => response.data);
};

export const updateCategory = (categoryId, data) => {
  return axios.put(`/api/categories/${categoryId}`, data).then((response) => response.data);
};

export const deleteCategory = (categoryId) => {
  return axios.delete(`/api/categories/${categoryId}`).then((response) => response.data);
};

export const updatePostStatus = (postId, status) => {
  return axios.patch(`${BASE_URL}/${postId}/status`, { status }).then((response) => response.data);
};

export const deletePost = (postId) => {
  return axios.delete(`${BASE_URL}/${postId}`).then((response) => response.data);
};

// --- Comments ---
export const getComments = (postId) => {
  return axios.get(`${BASE_URL}/${postId}/comments`).then((response) => response.data);
};

export const addComment = (postId, data) => {
  return axios.post(`${BASE_URL}/${postId}/comments`, data).then((response) => response.data);
};

export const deleteComment = (commentId) => {
  return axios.delete(`/api/comments/${commentId}`).then(() => {});
};

export const updateComment = (commentId, data) => {
  return axios.put(`/api/comments/${commentId}`, data).then((response) => response.data);
};

// --- Reacts ---
export const getReacts = (postId) => {
  return axios.get(`${BASE_URL}/${postId}/reacts`).then((response) => response.data);
};

export const toggleReact = (postId, data) => {
  return axios.post(`${BASE_URL}/${postId}/reacts`, data).then((response) => response.data);
};

// --- Saved posts ---
export const toggleSavePost = (postId) => {
  return axios.post(`${BASE_URL}/${postId}/save`).then((response) => response.data);
};

export const getSavedPosts = () => {
  return axios.get(`${BASE_URL}/saved`).then((response) => response.data);
};

export const getSaveStatus = (postId) => {
  return axios.get(`${BASE_URL}/${postId}/save`).then((response) => response.data);
};

