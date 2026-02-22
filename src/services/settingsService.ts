import axiosInstance from '../api/axiosInstance';

export interface SettingsResponse {
    darkMode: boolean;
}

export interface SettingsUpdateRequest {
    darkMode?: boolean;
}

export const getSettings = async (): Promise<SettingsResponse> => {
    const response = await axiosInstance.get<SettingsResponse>('/api/mypage/settings');
    return response.data;
};

export const updateSettings = async (request: SettingsUpdateRequest): Promise<SettingsResponse> => {
    const response = await axiosInstance.patch<SettingsResponse>('/api/mypage/settings', request);
    return response.data;
};
