import axios from 'axios';

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

// --- Categories ---
export const getCategories = () => {
  return axios.get('/api/categories').then((response) => response.data);
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

// --- Reacts ---
export const getReacts = (postId) => {
  return axios.get(`${BASE_URL}/${postId}/reacts`).then((response) => response.data);
};

export const toggleReact = (postId, data) => {
  return axios.post(`${BASE_URL}/${postId}/reacts`, data).then((response) => response.data);
};

