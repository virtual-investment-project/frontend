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

// 주식 가격 정보 가져오기 (Finnhub API 사용)
const fetchStockPrice = async (symbol: string): Promise<{
  currentPrice: number;
  change: number;
  changePercent: number;
} | null> => {
  try {
    // NASDAQ:AAPL 형식에서 AAPL 추출
    const cleanSymbol = symbol.includes(':') ? symbol.split(':')[1] : symbol;
    
    // Finnhub API 무료 티어 사용 (API 키: demo)
    // 실제 사용 시 https://finnhub.io/ 에서 무료 API 키 발급 받으세요
    const apiKey = 'demo'; // TODO: 실제 API 키로 교체
    
    // 현재 가격 조회
    const quoteResponse = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${cleanSymbol}&token=${apiKey}`
    );
    
    if (!quoteResponse.ok) {
      throw new Error('Failed to fetch stock quote');
    }
    
    const quoteData = await quoteResponse.json();
    
    // c: 현재가, d: 변동폭, dp: 변동률
    if (quoteData.c && quoteData.c > 0) {
      return {
        currentPrice: parseFloat(quoteData.c.toFixed(2)),
        change: parseFloat(quoteData.d.toFixed(2)),
        changePercent: parseFloat(quoteData.dp.toFixed(2)),
      };
    }
    
    // Finnhub API가 데이터를 반환하지 않는 경우 대체 데이터
    return fetchStockPriceFallback(symbol);
  } catch (error) {
    console.error(`Failed to fetch price for ${symbol}:`, error);
    return fetchStockPriceFallback(symbol);
  }
};

// 주식 가격 대체 데이터 (API 실패 시)
const fetchStockPriceFallback = (symbol: string): {
  currentPrice: number;
  change: number;
  changePercent: number;
} | null => {
  const mockStockPrices: { [key: string]: { price: number; change: number; changePercent: number } } = {
    'NASDAQ:NVDA': { price: 525.30, change: 12.50, changePercent: 2.43 },
    'NASDAQ:AMD': { price: 142.80, change: -1.20, changePercent: -0.83 },
    'NASDAQ:AAPL': { price: 185.64, change: 2.34, changePercent: 1.28 },
    'NASDAQ:TSLA': { price: 238.45, change: -5.23, changePercent: -2.15 },
    'NASDAQ:MSFT': { price: 378.91, change: 4.12, changePercent: 1.10 },
    'NASDAQ:GOOGL': { price: 142.85, change: 1.75, changePercent: 1.24 },
    'NASDAQ:META': { price: 389.20, change: -3.45, changePercent: -0.88 },
    'NASDAQ:AMZN': { price: 178.35, change: 2.15, changePercent: 1.22 },
    'NYSE:DIS': { price: 92.45, change: -0.85, changePercent: -0.91 },
    'NASDAQ:NFLX': { price: 485.70, change: 8.30, changePercent: 1.74 },
  };
  
  const stockData = mockStockPrices[symbol];
  if (stockData) {
    return {
      currentPrice: stockData.price,
      change: stockData.change,
      changePercent: stockData.changePercent,
    };
  }
  
  return null;
};

// 시가총액 계산 (간단한 추정)
const estimateMarketCap = (price: number, symbol: string): string => {
  // 암호화폐
  if (symbol.includes('BINANCE:')) {
    if (symbol.includes('BTC')) return `$${(price * 19.5).toFixed(0)}B`;
    if (symbol.includes('ETH')) return `$${(price * 120).toFixed(0)}B`;
    if (symbol.includes('BNB')) return `$${(price * 0.15).toFixed(0)}B`;
    return `$${(Math.random() * 50 + 10).toFixed(0)}B`;
  }
  
  // 주식
  const marketCaps: { [key: string]: string } = {
    'NASDAQ:NVDA': '$1.29T',
    'NASDAQ:AMD': '$231B',
    'NASDAQ:AAPL': '$2.85T',
    'NASDAQ:TSLA': '$756B',
    'NASDAQ:MSFT': '$2.82T',
    'NASDAQ:GOOGL': '$1.78T',
    'NASDAQ:META': '$989B',
    'NASDAQ:AMZN': '$1.82T',
    'NYSE:DIS': '$168B',
    'NASDAQ:NFLX': '$215B',
  };
  
  return marketCaps[symbol] || 'N/A';
};

// 실시간 가격 정보 가져오기
const fetchPriceInfo = async (symbol: string): Promise<{
  currentPrice: number;
  change: number;
  changePercent: number;
  marketCap: string;
}> => {
  // 암호화폐인 경우
  if (symbol.includes('BINANCE:')) {
    const cryptoPrice = await fetchCryptoPrice(symbol);
    if (cryptoPrice) {
      return {
        ...cryptoPrice,
        marketCap: estimateMarketCap(cryptoPrice.currentPrice, symbol),
      };
    }
  }
  
  // 주식인 경우
  if (symbol.includes('NASDAQ:') || symbol.includes('NYSE:')) {
    const stockPrice = await fetchStockPrice(symbol);
    if (stockPrice) {
      return {
        ...stockPrice,
        marketCap: estimateMarketCap(stockPrice.currentPrice, symbol),
      };
    }
  }
  
  // 기본값 (가격 정보를 가져오지 못한 경우)
  return {
    currentPrice: 0,
    change: 0,
    changePercent: 0,
    marketCap: 'N/A',
  };
};

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<FavoriteWithPrice[]>([]);

  const refreshFavorites = useCallback(async () => {
    const favs = await getFavorites();
    
    // 각 즐겨찾기에 실시간 가격 정보 추가
    const favsWithPrice = await Promise.all(
      favs.map(async (fav) => {
        const priceInfo = await fetchPriceInfo(fav.symbol);
        return {
          ...fav,
          ...priceInfo,
        };
      })
    );
    
    setFavorites(favsWithPrice);
  }, []);

  useEffect(() => {
    refreshFavorites();
    
    // 30초마다 가격 정보 업데이트
    const interval = setInterval(() => {
      refreshFavorites();
    }, 30000);
    
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
