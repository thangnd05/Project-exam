import axios from 'axios';

const BASE_URL = '/api/roles';
const ADMIN_BASE_URL = '/api/admin/roles';

export const getRoles = () => {
  return axios.get(BASE_URL).then((response) => response.data);
};

export const createRole = (payload) => {
  return axios.post(ADMIN_BASE_URL, payload).then((response) => response.data);
};

export const updateRole = (roleId, payload) => {
  return axios
    .put(`${ADMIN_BASE_URL}/${roleId}`, payload)
    .then((response) => response.data);
};

export const deleteRole = (roleId) => {
  return axios.delete(`${ADMIN_BASE_URL}/${roleId}`).then(() => {});
};
