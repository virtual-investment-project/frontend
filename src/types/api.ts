// Battle API 타입 정의

export type BattleType = 'ALL' | 'NORMAL';
export type BattleStatus = 'YET' | 'PROGRESS' | 'END';
export type MetricType = 'RATE' | 'PROCEED';

export interface TeamSummary {
  id: number;
  name: string;
  rate: number;
  proceed: number;
  memberCount: number;
}

export interface BattleListResponse {
  id: string;
  type: BattleType;
  name: string;
  ticker: string;
  startAt: string;
  endAt: string;
  status: BattleStatus;
  createdAt: string;
  teams: TeamSummary[];
}

export interface BattleResponse {
  id: string;
  type: BattleType;
  name: string;
  ticker: string;
  startAt: string;
  endAt: string;
  status: BattleStatus;
  metricType: MetricType;
  valuationTime: string;
  initialCapital: number;
  memberCount: number;
  teamCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBattleRequest {
  type?: BattleType;
  name?: string;
  ticker?: string;
  startAt: string;
  endAt: string;
  metricType?: MetricType;
  valuationTime?: string;
  initialCapital: number;
  memberCount?: number;
  teamCount?: number;
}

// Account API 타입 정의

export interface AccountResponse {
  id: string;
  name: string;
  balance: number;
  seedMoney: number;
  totalAsset: number;
}

export interface AccountProfitResponse {
  accountId: string;
  userId: string;
  userName: string;
  teamId: number | null;
  teamName: string | null;
  seedMoney: number;
  totalAsset: number;
  returnAmount: number;
  returnRate: number;
}

// 보유 종목
export interface StockHoldingResponse {
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  profitRate: number;
  profit: number;
}

// 거래내역
export interface TransactionResponse {
  date: string;
  type: string;
  stock: string;
  quantity: number;
  price: number;
  total: number;
}

// 미체결 주문
export interface PendingOrderResponse {
  id: number;
  type: string;
  stock: string;
  quantity: number;
  price: number;
  status: string;
}

// 대결별 수익률
export interface TeamProfitResponse {
  teamId: number;
  teamName: string;
  battleId: string;
  totalSeedMoney: number;
  totalAsset: number;
  returnAmount: number;
  returnRate: number;
  memberCount: number;
  rank: number;
  members: AccountProfitResponse[];
}

export interface MyPageProfitResponse {
  personalAccount: AccountProfitResponse | null;
  battleAccounts: AccountProfitResponse[];
}

// Team API 타입 정의

export type TeamUserRole = 'LEADER' | 'MEMBER';
export type TeamUserStatus = 'ACTIVE' | 'LEFT' | 'KICKED';

export interface TeamResponse {
  id: number;
  battleId: string;
  name: string;
  inviteCode: string;
  description: string;
  rate: number;
  proceed: number;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMemberResponse {
  id: number;
  userId: string;
  userNickname: string;
  role: TeamUserRole;
  rank: number;
  rate: number;
  status: TeamUserStatus;
  joinedAt: string;
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
}

export interface JoinTeamRequest {
  inviteCode: string;
}

// Comment API 타입 정의

export interface CommentResponse {
  id: number;
  battleId: string;
  userId: string;
  userNickname: string;
  parentId: number | null;
  content: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  replies: CommentResponse[] | null;
}

export interface CreateCommentRequest {
  battleId: string;
  content: string;
  parentId?: number | null;
}

// 공통 에러 응답
export interface ErrorResponse {
  status: number;
  message: string;
  errors?: {
    field: string;
    message: string;
  }[];
}
