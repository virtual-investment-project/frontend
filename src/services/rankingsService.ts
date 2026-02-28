import apiClient from '../api/axiosInstance';
import { AccountRankingResponse } from '../types/api';

/**
 * Rankings API Service
 * Base URL: /api/rankings
 */

/**
 * 개인 계좌 수익률 TOP N 조회
 * GET /api/rankings/accounts/top?limit={limit}
 * 인증: 불필요
 */
export const getTopAccounts = async (
  limit: number = 3
): Promise<AccountRankingResponse[]> => {
  const response = await apiClient.get<AccountRankingResponse[]>(
    '/api/rankings/accounts/top',
    { params: { limit } }
  );
  return response.data;
};

export default { getTopAccounts };
