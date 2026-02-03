import apiClient from '../api/axiosInstance';
import { AccountResponse } from '../types/api';

/**
 * Account API Service
 * Base URL: /api/accounts
 */

/**
 * 개인 계좌 생성
 * POST /api/accounts/personal
 * 인증: 필요
 */
export const createPersonalAccount = async (): Promise<string> => {
  const response = await apiClient.post<string>('/api/accounts/personal');
  return response.data;
};

/**
 * 개인 계좌 조회
 * GET /api/accounts/personal
 * 인증: 필요
 */
export const getPersonalAccount = async (): Promise<AccountResponse> => {
  const response = await apiClient.get<AccountResponse>('/api/accounts/personal');
  return response.data;
};

/**
 * 배틀 계좌 조회
 * GET /api/accounts/battle/{battleId}
 * 인증: 필요
 */
export const getBattleAccount = async (
  battleId: string
): Promise<AccountResponse> => {
  const response = await apiClient.get<AccountResponse>(
    `/api/accounts/battle/${battleId}`
  );
  return response.data;
};

export default {
  createPersonalAccount,
  getPersonalAccount,
  getBattleAccount,
};
