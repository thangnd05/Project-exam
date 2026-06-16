import axios from './axiosClient';

const BASE_URL = '/api/permissions';

// Lấy danh mục permission (đã lưu ở DB) để dựng ma trận phân quyền.
export const getPermissions = () => {
  return axios.get(BASE_URL).then((response) => response.data);
};
