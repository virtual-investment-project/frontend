// 계좌 관련 타입 정의

export interface Account {
  id: string;
  accountName: string;
  balance: number; // 잔액 (원화)
  totalAsset: number; // 총 자산 (원화)
  // 배틀 계좌인 경우에만 존재
  battleStatus?: 'YET' | 'PROGRESS' | 'END';
  battleStartAt?: string;
  battleEndAt?: string;
}

export interface CreateOrderRequest {
  accountId: string;
  stockCode: string;
  stockName: string;
  orderPrice: number;
  currentPrice: number;
  quantity: number;
  orderType: 'BUY' | 'SELL';
}
