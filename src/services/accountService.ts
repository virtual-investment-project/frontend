import apiClient from '../api/axiosInstance';
import { AccountResponse, StockHoldingResponse, TransactionResponse, PendingOrderResponse, AccountProfitResponse, MyPageProfitResponse } from '../types/api';

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
): Promise<AccountResponse | null> => {
  const response = await apiClient.get<AccountResponse>(
    `/api/accounts/battle/${battleId}`
  );
  // 204 No Content인 경우 null 반환
  if (response.status === 204) {
    return null;
  }
  return response.data;
};

/**
 * 보유 종목 조회
 * GET /api/accounts/personal/stocks
 * 인증: 필요
 */
export const getPersonalStocks = async (): Promise<StockHoldingResponse[]> => {
  const response = await apiClient.get<StockHoldingResponse[]>('/api/accounts/personal/stocks');
  return response.data;
};

/**
 * 거래내역 조회
 * GET /api/accounts/personal/transactions
 * 인증: 필요
 */
export const getPersonalTransactions = async (): Promise<TransactionResponse[]> => {
  const response = await apiClient.get<TransactionResponse[]>('/api/accounts/personal/transactions');
  return response.data;
};

/**
 * 미체결 주문 조회
 * GET /api/accounts/personal/orders/pending
 * 인증: 필요
 */
export const getPendingOrders = async (): Promise<PendingOrderResponse[]> => {
  const response = await apiClient.get<PendingOrderResponse[]>('/api/accounts/personal/orders/pending');
  return response.data;
};

/**
 * 내 개인 계좌 수익률 조회
 * GET /api/accounts/personal/profit
 * 인증: 필요
 */
export const getPersonalAccountProfit = async (): Promise<AccountProfitResponse> => {
  const response = await apiClient.get<AccountProfitResponse>('/api/accounts/personal/profit');
  return response.data;
};

/**
 * 내 배틀 계좌 수익률 조회
 * GET /api/accounts/battle/{battleId}/profit
 * 인증: 필요
 */
export const getBattleAccountProfit = async (
  battleId: string
): Promise<AccountProfitResponse> => {
  const response = await apiClient.get<AccountProfitResponse>(`/api/accounts/battle/${battleId}/profit`);
  return response.data;
};

/**
 * 계좌 ID로 수익률 조회
 * GET /api/accounts/{accountId}/profit
 * 인증: 불필요
 */
export const getAccountProfitById = async (
  accountId: string
): Promise<AccountProfitResponse> => {
  const response = await apiClient.get<AccountProfitResponse>(`/api/accounts/${accountId}/profit`);
  return response.data;
};

/**
 * 내 전체 계좌 수익률 조회
 * GET /api/mypage/profit
 * 인증: 필요
 */
export const getMyPageProfit = async (): Promise<MyPageProfitResponse> => {
  const response = await apiClient.get<MyPageProfitResponse>('/api/mypage/profit');
  return response.data;
};

export default {
  createPersonalAccount,
  getPersonalAccount,
  getBattleAccount,
  getPersonalStocks,
  getPersonalTransactions,
  getPendingOrders,
  getPersonalAccountProfit,
  getBattleAccountProfit,
  getAccountProfitById,
  getMyPageProfit,
};
