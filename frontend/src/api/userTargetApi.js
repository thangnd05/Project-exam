import axios from './axiosClient';

const BASE_URL = '/api/user-targets';

export const getUserTarget = (examTypeId) => {
  return axios.get(BASE_URL, { params: { examTypeId } }).then((res) => res.data);
};

export const createOrUpdateUserTarget = (payload) => {
  return axios.post(BASE_URL, payload).then((res) => res.data);
};

export const deleteUserTarget = (examTypeId) => {
  return axios.delete(BASE_URL, { params: { examTypeId } }).then(() => {});
};
