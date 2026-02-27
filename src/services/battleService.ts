import apiClient from '../api/axiosInstance';
import {
  BattleListResponse,
  BattleResponse,
  CreateBattleRequest,
  AccountProfitResponse,
  TeamProfitResponse,
} from '../types/api';

/**
 * Battle API Service
 * Base URL: /api/battles
 */

/**
 * 모든 배틀 목록 조회
 * GET /api/battles
 * 인증: 불필요
 */
export const getAllBattles = async (): Promise<BattleListResponse[]> => {
  const response = await apiClient.get<BattleListResponse[]>('/api/battles');
  return response.data;
};

/**
 * 진행중인 배틀 목록 조회
 * GET /api/battles?status=PROGRESS&limit={limit}
 * 인증: 불필요
 */
export const getProgressBattles = async (
  limit: number = 2
): Promise<BattleListResponse[]> => {
  const response = await apiClient.get<BattleListResponse[]>('/api/battles', {
    params: { status: 'PROGRESS', limit },
  });
  return response.data;
};

/**
 * 배틀 생성
 * POST /api/battles
 * 인증: 필요
 */
export const createBattle = async (
  data: CreateBattleRequest
): Promise<BattleResponse> => {
  const response = await apiClient.post<BattleResponse>('/api/battles', data);
  return response.data;
};

/**
 * 배틀 상세 조회
 * GET /api/battles/{battleId}
 * 인증: 불필요
 */
export const getBattleById = async (
  battleId: string
): Promise<BattleResponse> => {
  const response = await apiClient.get<BattleResponse>(
    `/api/battles/${battleId}`
  );
  return response.data;
};

/**
 * 배틀 계좌별 개인 수익률 조회
 * GET /api/battles/{battleId}/profit/accounts
 * 인증: 불필요
 */
export const getBattleAccountProfits = async (
  battleId: string
): Promise<AccountProfitResponse[]> => {
  const response = await apiClient.get<AccountProfitResponse[]>(`/api/battles/${battleId}/profit/accounts`);
  return response.data;
};

/**
 * 배틀 팀별 합산 수익률 조회
 * GET /api/battles/{battleId}/profit/teams
 * 인증: 불필요
 */
export const getBattleTeamProfits = async (
  battleId: string
): Promise<TeamProfitResponse[]> => {
  const response = await apiClient.get<TeamProfitResponse[]>(`/api/battles/${battleId}/profit/teams`);
  return response.data;
};

export default {
  getAllBattles,
  getProgressBattles,
  createBattle,
  getBattleById,
  getBattleAccountProfits,
  getBattleTeamProfits,
};
