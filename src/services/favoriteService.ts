import axiosInstance from '../api/axiosInstance';

export interface FavoriteStockItem {
    id: number;
    symbol: string;
    name: string;
    koreanName?: string;
    createdAt: string;
}

// 즐겨찾기 목록 조회
export const getFavorites = async (): Promise<FavoriteStockItem[]> => {
    const response = await axiosInstance.get<FavoriteStockItem[]>('/api/favorites');
    return response.data;
};

// 즐겨찾기 추가
export const addFavorite = async (symbol: string, name: string, koreanName?: string): Promise<FavoriteStockItem> => {
    const response = await axiosInstance.post<FavoriteStockItem>('/api/favorites', {
        symbol,
        name,
        koreanName,
    });
    return response.data;
};

// 즐겨찾기 제거
export const removeFavorite = async (symbol: string): Promise<void> => {
    await axiosInstance.delete(`/api/favorites/${encodeURIComponent(symbol)}`);
};

// 즐겨찾기 여부 확인
export const checkIsFavorite = async (symbol: string): Promise<boolean> => {
    const response = await axiosInstance.get<{ isFavorite: boolean }>(`/api/favorites/${encodeURIComponent(symbol)}/check`);
    return response.data.isFavorite;
};

// 즐겨찾기 토글 (추가/제거)
export const toggleFavorite = async (symbol: string, name: string, koreanName?: string): Promise<boolean> => {
    try {
        const isFav = await checkIsFavorite(symbol);
        if (isFav) {
            await removeFavorite(symbol);
            return false;
        } else {
            await addFavorite(symbol, name, koreanName);
            return true;
        }
    } catch (error) {
        console.error('즐겨찾기 토글 실패:', error);
        return false;
    }
};
