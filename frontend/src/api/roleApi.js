import axios from './axiosClient';

const BASE_URL = '/api/roles';

export const getRoles = () => {
  return axios.get(BASE_URL).then((response) => response.data);
};

export const createRole = (payload) => {
  return axios.post(BASE_URL, payload).then((response) => response.data);
};

export const updateRole = (roleId, payload) => {
  return axios
    .put(`${BASE_URL}/${roleId}`, payload)
    .then((response) => response.data);
};

export const deleteRole = (roleId) => {
  return axios.delete(`${BASE_URL}/${roleId}`).then(() => {});
};
