import axios from 'axios';

const BASE_URL = '/api/scoring-conversions';

export const getScoringConversions = () => {
  return axios.get(BASE_URL).then((response) => response.data);
};

export const createScoringConversion = (payload) => {
  return axios.post(BASE_URL, payload).then((response) => response.data);
};

export const deleteScoringConversion = (conversionId) => {
  return axios.delete(`${BASE_URL}/${conversionId}`).then(() => {});
};
