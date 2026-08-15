import axios from './axiosClient';
import type { EvaluationRequest, EvaluationResponse, PageResponse } from '@/app/types';

const BASE_URL = '/api/evaluations';

interface EvaluationListParams {
  page?: number;
  size?: number;
  keyword?: string;
  rating?: number | string;
}

export const getEvaluations = ({page = 0, size = 10, keyword, rating}: EvaluationListParams = {}): Promise<PageResponse<EvaluationResponse>> => {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));
  if (keyword && keyword.trim()) {
    params.set('keyword', keyword.trim());
  }
  if (rating && rating !== 'all') {
    params.set('rating', String(rating));
  }

  return axios
    .get(`${BASE_URL}/paged?${params.toString()}`)
    .then((response) => response.data);
};

export const getAllEvaluations = (): Promise<EvaluationResponse[]> => {
  return axios.get(BASE_URL).then((response) => response.data);
};

export const getMyEvaluations = (): Promise<EvaluationResponse[]> => {
  return axios.get(`${BASE_URL}/me`).then((response) => response.data);
};

export const createEvaluation = (payload: EvaluationRequest): Promise<EvaluationResponse> => {
  return axios.post(BASE_URL, payload).then((response) => response.data);
};

export const updateEvaluation = (evaluationId: string, payload: EvaluationRequest): Promise<EvaluationResponse> => {
  return axios
    .put(`${BASE_URL}/${evaluationId}`, payload)
    .then((response) => response.data);
};

export const deleteEvaluation = (evaluationId: string): Promise<void> => {
  return axios.delete(`${BASE_URL}/${evaluationId}`).then(() => {});
};
