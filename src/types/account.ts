// 계좌 관련 타입 정의

export interface Account {
  id: string;
  accountName: string;
  balance: number; // 잔액 (원화)
  totalAsset: number; // 총 자산 (원화)
}

export interface CreateOrderRequest {
  accountId: string;
  stockCode: string;
  stockName: string;
  orderPrice: number;
  quantity: number;
  orderType: 'BUY' | 'SELL';
}
