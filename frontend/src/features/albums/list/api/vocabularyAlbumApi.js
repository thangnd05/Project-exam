import axios from '~/shared/api/axiosClient';

const BASE_URL = '/api/vocabulary-albums';

export const getMyAlbums = () => {
  return axios.get(`${BASE_URL}/my-albums`).then((res) => res.data);
};

export const createAlbum = (payload) => {
  return axios.post(BASE_URL, payload).then((res) => res.data);
};

export const updateAlbum = (albumId, payload) => {
  return axios.put(`${BASE_URL}/${albumId}`, payload).then((res) => res.data);
};

export const deleteAlbum = (albumId) => {
  return axios.delete(`${BASE_URL}/${albumId}`).then(() => {});
};
