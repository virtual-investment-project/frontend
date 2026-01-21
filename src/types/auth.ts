// 인증 관련 타입 정의

export interface GoogleLoginRequest {
  idToken: string;
}

export interface GoogleLoginResponse {
  accessToken: string;
  refreshToken: string;
  role: 'GUEST' | 'USER' | 'ADMIN';
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}
