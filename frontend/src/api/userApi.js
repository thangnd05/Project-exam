import axios from './axiosClient';

const BASE_URL = '/api/users';

export const getUsers = ({page = 0, size = 10, keyword, roleId, verified} = {}) => {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));
  if (keyword && keyword.trim()) {
    params.set('keyword', keyword.trim());
  }
  if (roleId && roleId !== 'all') {
    params.set('roleId', roleId);
  }
  if (verified === true || verified === false) {
    params.set('verified', String(verified));
  }

  return axios
    .get(`${BASE_URL}/paged?${params.toString()}`)
    .then((response) => response.data);
};

export const deleteUser = (userId) => {
  return axios.delete(`${BASE_URL}/${userId}`).then(() => {});
};
