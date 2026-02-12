import EncryptedStorage from 'react-native-encrypted-storage';

/**
 * 토큰 저장소
 * EncryptedStorage를 사용하여 토큰을 안전하게 암호화하여 저장합니다.
 * iOS: Keychain, Android: Keystore를 자동으로 사용합니다.
 */

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  ROLE: 'role',
};

/**
 * Access Token 저장
 */
export const setAccessToken = async (token: string): Promise<void> => {
  console.log('[TOKEN] Access Token 저장 시도:', { length: token?.length });
  await EncryptedStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  console.log('[TOKEN] Access Token 저장 완료');
};

/**
 * Access Token 조회
 */
export const getAccessToken = async (): Promise<string | null> => {
  const token = await EncryptedStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  console.log('[TOKEN] Access Token 조회:', { hasToken: !!token, length: token?.length });
  return token;
};

/**
 * Refresh Token 저장
 */
export const setRefreshToken = async (token: string): Promise<void> => {
  await EncryptedStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
};

/**
 * Refresh Token 조회
 */
export const getRefreshToken = async (): Promise<string | null> => {
  return await EncryptedStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
};

/**
 * Role 저장
 */
export const setRole = async (role: string): Promise<void> => {
  await EncryptedStorage.setItem(STORAGE_KEYS.ROLE, role);
};

/**
 * Role 조회
 */
export const getRole = async (): Promise<string | null> => {
  return await EncryptedStorage.getItem(STORAGE_KEYS.ROLE);
};

/**
 * 모든 토큰 및 정보 삭제 (로그아웃 시 사용)
 */
export const clearAllTokens = async (): Promise<void> => {
  await Promise.all([
    EncryptedStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
    EncryptedStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
    EncryptedStorage.removeItem(STORAGE_KEYS.ROLE),
  ]);
};

/**
 * 모든 토큰 한번에 저장
 */
export const setTokens = async (
  accessToken: string,
  refreshToken: string,
  role: string
): Promise<void> => {
  console.log('[TOKEN] 모든 토큰 저장 시작:', { role, hasAccessToken: !!accessToken, hasRefreshToken: !!refreshToken });
  await Promise.all([
    setAccessToken(accessToken),
    setRefreshToken(refreshToken),
    setRole(role),
  ]);
  console.log('[TOKEN] 모든 토큰 저장 완료');
};
