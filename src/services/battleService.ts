import apiClient from '../api/axiosInstance';
import {
  BattleListResponse,
  BattleResponse,
  CreateBattleRequest,
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

export default {
  getAllBattles,
  createBattle,
  getBattleById,
};
