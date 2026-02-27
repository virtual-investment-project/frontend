import apiClient from '../api/axiosInstance';
import { AccountHistoryResponse } from '../types/api';

/**
 * History API Service
 * Base URL: /api/history
 */

/**
 * 계좌별 거래 내역 조회
 * GET /api/history/account/{accountId}
 * 인증: 필요
 */
export const getAccountHistory = async (
  accountId: string
): Promise<AccountHistoryResponse[]> => {
  const response = await apiClient.get<AccountHistoryResponse[]>(
    `/api/history/account/${accountId}`
  );
  return response.data;
};

export default { getAccountHistory };
