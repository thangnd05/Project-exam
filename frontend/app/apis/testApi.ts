import axios from './axiosClient';
import type {
  AddQuestionsToTestRequest,
  AddRandomQuestionsResponse,
  AddRandomQuestionsToTestRequest,
  CertificateExamListResponse,
  CreateTestRequest,
  PageResponse,
  QuickChallengeCardResponse,
  TestAdminResponse,
  TestCollectionResponse,
  TestPartSummaryResponse,
  TestResponse,
} from '@/app/types';

const BASE_URL = '/api/tests';

interface TestPagingParams {
  page?: number;
  size?: number;
}

export const getAdminTests = (): Promise<TestAdminResponse[]> => {
  return axios.get(`${BASE_URL}/admin`).then((res) => res.data);
};

export const getMyTests = ({ page = 0, size = 12 }: TestPagingParams = {}): Promise<PageResponse<TestResponse>> => {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));
  return axios
    .get(`${BASE_URL}/my-tests?${params.toString()}`)
    .then((res) => res.data);
};

export const getTestsByExamType = (examTypeId: string, { page = 0, size = 12 }: TestPagingParams = {}): Promise<PageResponse<TestResponse>> => {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));
  return axios
    .get(`${BASE_URL}/user/by-exam-type/${examTypeId}?${params.toString()}`)
    .then((res) => res.data);
};

export const getTestCollectionsByExamType = (examTypeId: string): Promise<TestCollectionResponse[]> => {
  return axios
    .get(`${BASE_URL}/collections/by-exam-type/${examTypeId}`)
    .then((res) => res.data);
};

export const getTestsByCollection = (collectionId: string, { page = 0, size = 12 }: TestPagingParams = {}): Promise<PageResponse<TestResponse>> => {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));
  return axios
    .get(`${BASE_URL}/user/by-collection/${collectionId}?${params.toString()}`)
    .then((res) => res.data);
};

export const getCertificateExamsByExamType = (examTypeId: string): Promise<CertificateExamListResponse> => {
  return axios
    .get(`${BASE_URL}/certificate-exams/by-exam-type/${examTypeId}`)
    .then((res) => res.data);
};

export const getQuickChallengeTests = (): Promise<QuickChallengeCardResponse[]> => {
  return axios.get(`${BASE_URL}/quick-challenge`).then((res) => res.data);
};

export const getAdminTestById = (testId: string): Promise<TestAdminResponse> => {
  return axios.get(`${BASE_URL}/admintest/${testId}`).then((res) => res.data);
};

export const getUserTestInfo = (testId: string): Promise<TestResponse> => {
  return axios.get(`${BASE_URL}/usertest/${testId}`).then((res) => res.data);
};

export const getTestPartsSummary = (testId: string): Promise<TestPartSummaryResponse[]> => {
  return axios.get(`${BASE_URL}/${testId}/parts-summary`).then((res) => res.data);
};

export const createTest = (payload: CreateTestRequest): Promise<TestResponse> => {
  return axios.post(BASE_URL, payload).then((res) => res.data);
};

export const updateTest = (testId: string, payload: CreateTestRequest): Promise<TestResponse> => {
  return axios.put(`${BASE_URL}/${testId}`, payload).then((res) => res.data);
};

export const deleteTest = (testId: string): Promise<void> => {
  return axios.delete(`${BASE_URL}/${testId}`).then(() => {});
};

export const purchaseTestAccess = (testId: string): Promise<TestResponse> => {
  return axios.post(`${BASE_URL}/${testId}/purchase`).then((res) => res.data);
};

export const addRandomQuestionsToPart = (payload: AddRandomQuestionsToTestRequest): Promise<AddRandomQuestionsResponse> => {
  return axios.post(`${BASE_URL}/parts/random-questions`, payload).then((res) => res.data);
};

export const addQuestionsToPart = (payload: AddQuestionsToTestRequest): Promise<void> => {
  return axios.post(`${BASE_URL}/parts/questions`, payload).then((res) => res.data);
};
