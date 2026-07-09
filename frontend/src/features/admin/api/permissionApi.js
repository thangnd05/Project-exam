import axios from '~/shared/api/axiosClient';

const BASE_URL = '/api/permissions';

export const getPermissions = () => {
  return axios.get(BASE_URL).then((response) => response.data);
};
