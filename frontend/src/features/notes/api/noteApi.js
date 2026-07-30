import axios from '~/shared/api/axiosClient';

const BASE_URL = '/api/notes';

export const getMyNotes = () => {
  return axios.get(BASE_URL).then((res) => res.data);
};

export const createNote = (payload) => {
  return axios.post(BASE_URL, payload).then((res) => res.data);
};

export const updateNote = (noteId, payload) => {
  return axios.put(`${BASE_URL}/${noteId}`, payload).then((res) => res.data);
};

export const deleteNote = (noteId) => {
  return axios.delete(`${BASE_URL}/${noteId}`).then(() => {});
};
