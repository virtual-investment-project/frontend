import apiClient from '../api/axiosInstance';
import { CreateOrderRequest } from '../types/account';

/**
 * Order API Service
 * Base URL: /api/orders
 */

export interface OrderResponse {
    id: string;
    accountId: string;
    stockCode: string;
    stockName: string;
    orderPrice: string;
    quantity: string;
    totalAmount: string;
    orderType: 'BUY' | 'SELL';
    status: 'PENDING' | 'FILLED' | 'CANCELLED';
    createdAt: string;
}

/**
 * 주문 생성
 * POST /api/orders
 * 인증: 필요
 */
export const createOrder = async (
    data: CreateOrderRequest
): Promise<OrderResponse> => {
    const response = await apiClient.post<OrderResponse>('/api/orders', data);
    return response.data;
};

/**
 * 계좌별 주문 목록 조회
 * GET /api/orders/account/{accountId}
 * 인증: 필요
 */
export const getOrdersByAccount = async (
    accountId: string
): Promise<OrderResponse[]> => {
    const response = await apiClient.get<OrderResponse[]>(
        `/api/orders/account/${accountId}`
    );
    return response.data;
};

/**
 * 주문 취소
 * POST /api/orders/{orderId}/cancel
 * 인증: 필요
 */
export const cancelOrder = async (orderId: string): Promise<string> => {
    const response = await apiClient.post<string>(
        `/api/orders/${orderId}/cancel`
    );
    return response.data;
};

/**
 * 주문 수동 체결 (테스트용)
 * POST /api/orders/{orderId}/fill
 * 인증: 필요
 */
export const fillOrder = async (orderId: string): Promise<string> => {
    const response = await apiClient.post<string>(`/api/orders/${orderId}/fill`);
    return response.data;
};

export default {
    createOrder,
    getOrdersByAccount,
    cancelOrder,
    fillOrder,
};
