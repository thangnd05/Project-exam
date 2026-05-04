import axios from './axiosClient';

const BASE_URL = '/api/scoring-conversions';

export const getScoringConversions = () => {
  return axios.get(BASE_URL).then((response) => response.data);
};

export const getScoringConversionsBySkill = (skillId, examTypeId) => {
  const params = new URLSearchParams();
  if (skillId) {
    params.set('skillId', skillId);
  }
  if (examTypeId && examTypeId !== 'all') {
    params.set('examTypeId', examTypeId);
  }
  const query = params.toString();
  return axios
    .get(`${BASE_URL}${query ? `?${query}` : ''}`)
    .then((response) => response.data);
};

export const createScoringConversion = (payload) => {
  return axios.post(BASE_URL, payload).then((response) => response.data);
};

export const deleteScoringConversion = (conversionId) => {
  return axios.delete(`${BASE_URL}/${conversionId}`).then(() => {});
};
