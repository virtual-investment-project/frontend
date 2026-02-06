import apiClient from '../api/axiosInstance';
import {
  TeamResponse,
  TeamMemberResponse,
  CreateTeamRequest,
  JoinTeamRequest,
} from '../types/api';

/**
 * Team API Service
 */

/**
 * 배틀의 팀 목록 조회
 * GET /api/battles/{battleId}/teams
 * 인증: 불필요
 */
export const getTeamsByBattleId = async (
  battleId: string
): Promise<TeamResponse[]> => {
  const response = await apiClient.get<TeamResponse[]>(
    `/api/battles/${battleId}/teams`
  );
  return response.data;
};

/**
 * 팀 생성
 * POST /api/battles/{battleId}/teams
 * 인증: 필요
 */
export const createTeam = async (
  battleId: string,
  data: CreateTeamRequest
): Promise<TeamResponse> => {
  const response = await apiClient.post<TeamResponse>(
    `/api/battles/${battleId}/teams`,
    data
  );
  return response.data;
};

/**
 * 팀원 목록 및 순위 조회
 * GET /api/teams/{teamId}/members
 * 인증: 불필요
 */
export const getTeamMembers = async (
  teamId: number
): Promise<TeamMemberResponse[]> => {
  const response = await apiClient.get<TeamMemberResponse[]>(
    `/api/teams/${teamId}/members`
  );
  return response.data;
};

/**
 * 팀 가입 (초대 코드)
 * POST /api/teams/join
 * 인증: 필요
 */
export const joinTeam = async (
  data: JoinTeamRequest
): Promise<TeamResponse> => {
  const response = await apiClient.post<TeamResponse>('/api/teams/join', data);
  return response.data;
};

/**
 * 팀 탈퇴
 * DELETE /api/teams/{teamId}/leave
 * 인증: 필요
 */
export const leaveTeam = async (teamId: number): Promise<void> => {
  await apiClient.delete(`/api/teams/${teamId}/leave`);
};

export default {
  getTeamsByBattleId,
  createTeam,
  getTeamMembers,
  joinTeam,
  leaveTeam,
};
