import axios from './axiosClient';
import type { TestPartRequest, TestPartSimpleResponse } from '@/app/types';

const BASE_URL = '/api/test-parts';

export const createTestPart = (payload: TestPartRequest): Promise<TestPartSimpleResponse> => {
  return axios.post(BASE_URL, payload).then((res) => res.data);
};
