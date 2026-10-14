import axios from './axiosClient';
import type {
  EvaluationRequest,
  EvaluationResponse,
  EvaluationStatusResponse,
  EvaluationTestStats,
  PageResponse,
} from '@/app/types';

const BASE_URL = '/api/evaluations';
const ADMIN_BASE_URL = '/api/admin/evaluations';

/** Giá trị lọc testId để lấy đánh giá chung cũ (không gắn đề). */
export const EVALUATION_GENERAL_FILTER = 'general';

interface EvaluationListParams {
  page?: number;
  size?: number;
  keyword?: string;
  rating?: number | string;
  testId?: string;
}

export const createEvaluation = (payload: EvaluationRequest): Promise<EvaluationResponse> => {
  return axios.post(BASE_URL, payload).then((response) => response.data);
};

export const getEvaluationStatus = (testId: string): Promise<EvaluationStatusResponse> => {
  return axios.get(`${BASE_URL}/status`, { params: { testId } }).then((response) => response.data);
};

export const getAdminEvaluations = ({page = 0, size = 10, keyword, rating, testId}: EvaluationListParams = {}): Promise<PageResponse<EvaluationResponse>> => {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));
  if (keyword && keyword.trim()) {
    params.set('keyword', keyword.trim());
  }
  if (rating && rating !== 'all') {
    params.set('rating', String(rating));
  }
  if (testId && testId !== 'all') {
    params.set('testId', testId);
  }

  return axios
    .get(`${ADMIN_BASE_URL}?${params.toString()}`)
    .then((response) => response.data);
};

export const getEvaluationStatsByTest = (): Promise<EvaluationTestStats[]> => {
  return axios.get(`${ADMIN_BASE_URL}/stats`).then((response) => response.data);
};

export const deleteEvaluation = (evaluationId: string): Promise<void> => {
  return axios.delete(`${ADMIN_BASE_URL}/${evaluationId}`).then(() => {});
};
