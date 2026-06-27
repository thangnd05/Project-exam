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

export const getProfileOverview = () => {
  return axios.get(`${BASE_URL}/me/profile-overview`).then((response) => response.data);
};

// month dạng "YYYY-MM", year dạng "YYYY"; bỏ trống => backend lấy tháng/năm hiện tại.
export const getMyActivity = ({ month, year } = {}) => {
  const params = new URLSearchParams();
  if (month) params.set('month', month);
  if (year) params.set('year', year);
  const query = params.toString();
  return axios
    .get(`${BASE_URL}/me/activity${query ? `?${query}` : ''}`)
    .then((response) => response.data);
};

export const getMyInfo = () => {
  return axios.get(`${BASE_URL}/me/info-user`).then((response) => response.data);
};

// formData là multipart (kèm avatar) — axios tự set boundary cho FormData.
export const updateUser = (userId, formData) => {
  return axios
    .put(`${BASE_URL}/${userId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((response) => response.data);
};
