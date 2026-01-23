import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@chart_favorites';

export interface FavoriteSymbol {
  symbol: string;
  name: string;
  koreanName?: string;
  addedAt: number;
}

// 즐겨찾기 목록 가져오기
export async function getFavorites(): Promise<FavoriteSymbol[]> {
  try {
    const data = await AsyncStorage.getItem(FAVORITES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load favorites:', error);
    return [];
  }
}

// 즐겨찾기 추가
export async function addFavorite(symbol: string, name: string, koreanName?: string): Promise<boolean> {
  try {
    const favorites = await getFavorites();
    
    // 이미 즐겨찾기에 있는지 확인
    if (favorites.some(fav => fav.symbol === symbol)) {
      return false;
    }

    const newFavorite: FavoriteSymbol = {
      symbol,
      name,
      koreanName,
      addedAt: Date.now(),
    };

    favorites.push(newFavorite);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    return true;
  } catch (error) {
    console.error('Failed to add favorite:', error);
    return false;
  }
}

// 즐겨찾기 제거
export async function removeFavorite(symbol: string): Promise<boolean> {
  try {
    const favorites = await getFavorites();
    const filtered = favorites.filter(fav => fav.symbol !== symbol);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Failed to remove favorite:', error);
    return false;
  }
}

// 즐겨찾기 여부 확인
export async function isFavorite(symbol: string): Promise<boolean> {
  try {
    const favorites = await getFavorites();
    return favorites.some(fav => fav.symbol === symbol);
  } catch (error) {
    console.error('Failed to check favorite:', error);
    return false;
  }
}

// 즐겨찾기 토글
export async function toggleFavorite(symbol: string, name: string, koreanName?: string): Promise<boolean> {
  const isCurrentlyFavorite = await isFavorite(symbol);
  
  if (isCurrentlyFavorite) {
    await removeFavorite(symbol);
    return false;
  } else {
    await addFavorite(symbol, name, koreanName);
    return true;
  }
}
