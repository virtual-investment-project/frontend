import axiosInstance from '../api/axiosInstance';

export interface NotificationItem {
    id: string;
    type: 'ORDER_FILLED' | 'BATTLE_START' | 'RANK_CHANGE' | 'PRICE_ALERT';
    title: string;
    message: string;
    data: string | null;
    isRead: boolean;
    createdAt: string;
}

export interface UnreadCountResponse {
    count: number;
}

// 알림 목록 조회 (최신 50개)
export const getNotifications = async (): Promise<NotificationItem[]> => {
    const response = await axiosInstance.get<NotificationItem[]>('/api/notifications');
    return response.data;
};

// 안 읽은 알림 수 조회
export const getUnreadCount = async (): Promise<number> => {
    const response = await axiosInstance.get<UnreadCountResponse>('/api/notifications/unread-count');
    return response.data.count;
};

// 개별 알림 읽음 처리
export const markAsRead = async (id: string): Promise<void> => {
    await axiosInstance.patch(`/api/notifications/${id}/read`);
};

// 전체 알림 읽음 처리
export const markAllAsRead = async (): Promise<void> => {
    await axiosInstance.patch('/api/notifications/read-all');
};
