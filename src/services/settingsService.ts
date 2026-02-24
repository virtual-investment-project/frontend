import axiosInstance from '../api/axiosInstance';

export interface SettingsResponse {
    darkMode: boolean;
    // 알림 설정
    orderExecution: boolean;
    battleStart: boolean;
    rankChange: boolean;
    stockPriceAlert: boolean;
}

export interface SettingsUpdateRequest {
    darkMode?: boolean;
    // 알림 설정
    orderExecution?: boolean;
    battleStart?: boolean;
    rankChange?: boolean;
    stockPriceAlert?: boolean;
}

export const getSettings = async (): Promise<SettingsResponse> => {
    const response = await axiosInstance.get<SettingsResponse>('/api/mypage/settings');
    return response.data;
};

export const updateSettings = async (request: SettingsUpdateRequest): Promise<SettingsResponse> => {
    const response = await axiosInstance.patch<SettingsResponse>('/api/mypage/settings', request);
    return response.data;
};
