import apiClient from '../api/axiosInstance';
import { CommentResponse, CreateCommentRequest } from '../types/api';

/**
 * Comment API Service
 * Base URL: /api/battles/{battleId}/comments
 */

/**
 * 배틀의 댓글 목록 조회
 * GET /api/battles/{battleId}/comments
 * 인증: 불필요
 */
export const getCommentsByBattleId = async (
  battleId: string
): Promise<CommentResponse[]> => {
  const response = await apiClient.get<CommentResponse[]>(
    `/api/battles/${battleId}/comments`
  );
  return response.data;
};

/**
 * 댓글 작성
 * POST /api/battles/{battleId}/comments
 * 인증: 필요
 */
export const createComment = async (
  battleId: string,
  data: CreateCommentRequest
): Promise<CommentResponse> => {
  const response = await apiClient.post<CommentResponse>(
    `/api/battles/${battleId}/comments`,
    data
  );
  return response.data;
};

/**
 * 댓글 삭제 (Soft Delete)
 * DELETE /api/battles/{battleId}/comments/{commentId}
 * 인증: 필요
 */
export const deleteComment = async (
  battleId: string,
  commentId: number
): Promise<void> => {
  await apiClient.delete(`/api/battles/${battleId}/comments/${commentId}`);
};

export default {
  getCommentsByBattleId,
  createComment,
  deleteComment,
};
