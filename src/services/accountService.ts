import apiClient from '../api/axiosInstance';
import { AccountResponse, StockHoldingResponse, TransactionResponse, PendingOrderResponse, BattleProfitResponse } from '../types/api';

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
 * 대결별 수익률 조회
 * GET /api/accounts/personal/battles
 * 인증: 필요
 */
export const getPersonalBattleProfits = async (): Promise<BattleProfitResponse[]> => {
  const response = await apiClient.get<BattleProfitResponse[]>('/api/accounts/personal/battles');
  return response.data;
};

export default {
  createPersonalAccount,
  getPersonalAccount,
  getBattleAccount,
  getPersonalStocks,
  getPersonalTransactions,
  getPendingOrders,
  getPersonalBattleProfits,
};
