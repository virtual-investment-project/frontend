import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getFavorites, FavoriteSymbol } from '../utils/favorites';

export interface FavoriteWithPrice extends FavoriteSymbol {
  currentPrice: number;
  change: number;
  changePercent: number;
  marketCap: string;
}

interface FavoritesContextType {
  favorites: FavoriteWithPrice[];
  refreshFavorites: () => Promise<void>;
}

// Binance API를 통한 실시간 가격 정보 가져오기
const fetchCryptoPrice = async (symbol: string): Promise<{
  currentPrice: number;
  change: number;
  changePercent: number;
} | null> => {
  try {
    // BINANCE:BTCUSDT 형식에서 BTCUSDT 추출
    const cleanSymbol = symbol.includes(':') ? symbol.split(':')[1] : symbol;
    
    // Binance API를 통한 24시간 가격 변동 정보 가져오기
    const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${cleanSymbol}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch crypto price');
    }
    
    const data = await response.json();
    
    return {
      currentPrice: parseFloat(data.lastPrice),
      change: parseFloat(data.priceChange),
      changePercent: parseFloat(data.priceChangePercent),
    };
  } catch (error) {
    console.error(`Failed to fetch price for ${symbol}:`, error);
    return null;
  }
};

// 시가총액 계산 (간단한 추정)
const estimateMarketCap = (price: number, symbol: string): string => {
  if (symbol.includes('BTC')) return `$${(price * 19.5).toFixed(0)}B`;
  if (symbol.includes('ETH')) return `$${(price * 120).toFixed(0)}B`;
  if (symbol.includes('BNB')) return `$${(price * 0.15).toFixed(0)}B`;
  if (symbol.includes('SOL')) return `$${(price * 0.45).toFixed(0)}B`;
  if (symbol.includes('XRP')) return `$${(price * 50).toFixed(0)}B`;
  return `$${(Math.random() * 50 + 10).toFixed(0)}B`;
};

// 실시간 가격 정보 가져오기
const fetchPriceInfo = async (symbol: string): Promise<{
  currentPrice: number;
  change: number;
  changePercent: number;
  marketCap: string;
} | null> => {
  // 암호화폐(BINANCE:)만 처리
  if (!symbol.includes('BINANCE:')) {
    console.warn(`Skipping non-crypto symbol: ${symbol}`);
    return null;
  }
  
  // 암호화폐 가격 정보 가져오기
  const cryptoPrice = await fetchCryptoPrice(symbol);
  if (cryptoPrice) {
    return {
      ...cryptoPrice,
      marketCap: estimateMarketCap(cryptoPrice.currentPrice, symbol),
    };
  }
  
  // 기본값 (가격 정보를 가져오지 못한 경우)
  return null;
};

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<FavoriteWithPrice[]>([]);

  const refreshFavorites = useCallback(async () => {
    const favs = await getFavorites();
    
    // 각 즐겨찾기에 실시간 가격 정보 추가 (암호화폐만)
    const favsWithPricePromises = favs.map(async (fav) => {
      const priceInfo = await fetchPriceInfo(fav.symbol);
      if (priceInfo) {
        return {
          ...fav,
          ...priceInfo,
        };
      }
      return null;
    });
    
    const results = await Promise.all(favsWithPricePromises);
    const favsWithPrice = results.filter((item): item is FavoriteWithPrice => item !== null);
    
    setFavorites(favsWithPrice);
  }, []);

  useEffect(() => {
    refreshFavorites();
    
    // 30초마다 가격 정보 업데이트
    const interval = setInterval(() => {
      refreshFavorites();
    }, 1000);
    
    return () => clearInterval(interval);
  }, [refreshFavorites]);

  return (
    <FavoritesContext.Provider value={{ favorites, refreshFavorites }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavoritesContext = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavoritesContext must be used within FavoritesProvider');
  }
  return context;
};
