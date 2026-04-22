import axios from 'axios';

const ADMIN_BASE_URL = '/api/admin/users';

export const getUsers = () => {
  return axios.get(ADMIN_BASE_URL).then((response) => response.data);
};

export const deleteUser = (userId) => {
  return axios.delete(`${ADMIN_BASE_URL}/${userId}`).then(() => {});
};
