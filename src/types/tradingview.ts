// TradingView 관련 타입 정의

export interface CryptoSymbol {
  symbol: string; // 심볼 (예: BTCUSDT)
  name: string; // 영문명 (예: Bitcoin)
  koreanName: string; // 한글명 (예: 비트코인)
  baseAsset: string; // 기본 자산 (예: BTC)
  quoteAsset: string; // 거래 자산 (예: USDT)
}

export interface Stock {
  symbol: string;
  name: string;
  koreanName?: string;
  currentPrice?: number;
  change?: number;
  changePercent?: number;
  isFavorite?: boolean;
}

// 인기 암호화폐 목록
export const CRYPTO_SYMBOLS: CryptoSymbol[] = [
  { symbol: 'BTCUSDT', name: 'Bitcoin', koreanName: '비트코인', baseAsset: 'BTC', quoteAsset: 'USDT' },
  { symbol: 'ETHUSDT', name: 'Ethereum', koreanName: '이더리움', baseAsset: 'ETH', quoteAsset: 'USDT' },
  { symbol: 'BNBUSDT', name: 'Binance Coin', koreanName: '바이낸스코인', baseAsset: 'BNB', quoteAsset: 'USDT' },
  { symbol: 'XRPUSDT', name: 'Ripple', koreanName: '리플', baseAsset: 'XRP', quoteAsset: 'USDT' },
  { symbol: 'ADAUSDT', name: 'Cardano', koreanName: '카르다노', baseAsset: 'ADA', quoteAsset: 'USDT' },
  { symbol: 'SOLUSDT', name: 'Solana', koreanName: '솔라나', baseAsset: 'SOL', quoteAsset: 'USDT' },
  { symbol: 'DOGEUSDT', name: 'Dogecoin', koreanName: '도지코인', baseAsset: 'DOGE', quoteAsset: 'USDT' },
  { symbol: 'DOTUSDT', name: 'Polkadot', koreanName: '폴카닷', baseAsset: 'DOT', quoteAsset: 'USDT' },
  { symbol: 'MATICUSDT', name: 'Polygon', koreanName: '폴리곤', baseAsset: 'MATIC', quoteAsset: 'USDT' },
  { symbol: 'LTCUSDT', name: 'Litecoin', koreanName: '라이트코인', baseAsset: 'LTC', quoteAsset: 'USDT' },
  { symbol: 'AVAXUSDT', name: 'Avalanche', koreanName: '아발란체', baseAsset: 'AVAX', quoteAsset: 'USDT' },
  { symbol: 'LINKUSDT', name: 'Chainlink', koreanName: '체인링크', baseAsset: 'LINK', quoteAsset: 'USDT' },
  { symbol: 'ATOMUSDT', name: 'Cosmos', koreanName: '코스모스', baseAsset: 'ATOM', quoteAsset: 'USDT' },
  { symbol: 'UNIUSDT', name: 'Uniswap', koreanName: '유니스왑', baseAsset: 'UNI', quoteAsset: 'USDT' },
  { symbol: 'ETCUSDT', name: 'Ethereum Classic', koreanName: '이더리움클래식', baseAsset: 'ETC', quoteAsset: 'USDT' },
];

// 주식 목록 (예시)
export const STOCK_SYMBOLS: Stock[] = [
  { symbol: 'NASDAQ:NVDA', name: 'NVIDIA Corporation', koreanName: '엔비디아' },
  { symbol: 'NASDAQ:AMD', name: 'Advanced Micro Devices', koreanName: 'AMD' },
  { symbol: 'NASDAQ:AAPL', name: 'Apple Inc.', koreanName: '애플' },
  { symbol: 'NASDAQ:TSLA', name: 'Tesla, Inc.', koreanName: '테슬라' },
  { symbol: 'NASDAQ:MSFT', name: 'Microsoft Corporation', koreanName: '마이크로소프트' },
  { symbol: 'NASDAQ:GOOGL', name: 'Alphabet Inc.', koreanName: '구글' },
  { symbol: 'NASDAQ:META', name: 'Meta Platforms', koreanName: '메타' },
  { symbol: 'NASDAQ:AMZN', name: 'Amazon.com Inc.', koreanName: '아마존' },
  { symbol: 'NYSE:DIS', name: 'The Walt Disney Company', koreanName: '디즈니' },
  { symbol: 'NASDAQ:NFLX', name: 'Netflix Inc.', koreanName: '넷플릭스' },
];

// 검색 헬퍼 함수
export function searchSymbols(query: string, type: 'crypto' | 'stock' | 'all' = 'all'): Stock[] {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return [];

  const results: Stock[] = [];

  // 암호화폐 검색
  if (type === 'crypto' || type === 'all') {
    CRYPTO_SYMBOLS.forEach(crypto => {
      const matchesSymbol = crypto.symbol.toLowerCase().includes(lowerQuery);
      const matchesName = crypto.name.toLowerCase().includes(lowerQuery);
      const matchesKorean = crypto.koreanName.toLowerCase().includes(lowerQuery);
      const matchesBase = crypto.baseAsset.toLowerCase().includes(lowerQuery);

      if (matchesSymbol || matchesName || matchesKorean || matchesBase) {
        results.push({
          symbol: `BINANCE:${crypto.symbol}`,
          name: crypto.name,
          koreanName: crypto.koreanName,
        });
      }
    });
  }

  // 주식 검색
  if (type === 'stock' || type === 'all') {
    STOCK_SYMBOLS.forEach(stock => {
      const matchesSymbol = stock.symbol.toLowerCase().includes(lowerQuery);
      const matchesName = stock.name.toLowerCase().includes(lowerQuery);
      const matchesKorean = stock.koreanName?.toLowerCase().includes(lowerQuery);

      if (matchesSymbol || matchesName || matchesKorean) {
        results.push(stock);
      }
    });
  }

  return results;
}
