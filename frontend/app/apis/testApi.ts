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
  TestJsonImportPreviewResponse,
  TestPartSummaryResponse,
  TestResponse,
} from '@/app/types';

const BASE_URL = '/api/tests';

interface TestPagingParams {
  page?: number;
  size?: number;
}

export const getAdminTests = (): Promise<TestAdminResponse[]> => {
  return axios.get('/api/admin/tests').then((res) => res.data);
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

/**
 * Đề để làm bài. Đề bật xáo theo lượt: truyền `userTestId` (và `guestSessionId` nếu là guest)
 * để nhận đúng thứ tự câu của lượt làm đó.
 */
export const getUserTestInfo = (
  testId: string,
  attempt?: { userTestId?: string | null; guestSessionId?: string | null },
): Promise<TestResponse> => {
  const params = attempt?.userTestId ? { userTestId: attempt.userTestId } : undefined;
  const headers = attempt?.guestSessionId ? { 'X-Guest-Session': attempt.guestSessionId } : undefined;
  return axios.get(`${BASE_URL}/usertest/${testId}`, { params, headers }).then((res) => res.data);
};

/** Xáo một lần thứ tự câu trong đề (lưu lại, mọi người làm đều thấy thứ tự mới). */
export const shuffleTestQuestions = (testId: string): Promise<void> => {
  return axios.post(`${BASE_URL}/${testId}/shuffle-questions`).then(() => undefined);
};

export const getTestPartsSummary = (testId: string): Promise<TestPartSummaryResponse[]> => {
  return axios.get(`${BASE_URL}/${testId}/parts-summary`).then((res) => res.data);
};

export const createTest = (payload: CreateTestRequest): Promise<TestResponse> => {
  return axios.post(BASE_URL, payload).then((res) => res.data);
};

const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' } };

/** Dry-run: chia câu trong file JSON vào các phần thi của loại kỳ thi, không ghi database. */
export const previewTestJson = (file: File, examTypeId: string): Promise<TestJsonImportPreviewResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  return axios
    .post(`${BASE_URL}/import/json/preview?examTypeId=${encodeURIComponent(examTypeId)}`, formData, MULTIPART)
    .then((res) => res.data);
};

/** Tạo trọn đề từ file JSON: mỗi phần thi có câu trong file thành một part của đề. */
export const importTestJson = (
  file: File,
  payload: CreateTestRequest,
  usageScope?: string,
): Promise<TestResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('request', JSON.stringify(payload));
  const query = usageScope ? `?usageScope=${encodeURIComponent(usageScope)}` : '';
  return axios.post(`${BASE_URL}/import/json${query}`, formData, MULTIPART).then((res) => res.data);
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
