import axios from './axiosClient';
import type { ScoringConversionRequest, ScoringConversionResponse } from '@/app/types';

const BASE_URL = '/api/scoring-conversions';

export const getScoringConversions = (): Promise<ScoringConversionResponse[]> => {
  return axios.get(BASE_URL).then((response) => response.data);
};

export const getScoringConversionsBySkill = (skillId?: string, examTypeId?: string): Promise<ScoringConversionResponse[]> => {
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

export const createScoringConversion = (payload: ScoringConversionRequest): Promise<ScoringConversionResponse> => {
  return axios.post(BASE_URL, payload).then((response) => response.data);
};

export const createScoringConversionsBulk = (payload: ScoringConversionRequest[]): Promise<ScoringConversionResponse[]> => {
  return axios.post(`${BASE_URL}/bulk`, payload).then((response) => response.data);
};

export const deleteScoringConversion = (conversionId: string): Promise<void> => {
  return axios.delete(`${BASE_URL}/${conversionId}`).then(() => {});
};
