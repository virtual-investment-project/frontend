import * as Keychain from 'react-native-keychain';

/**
 * Keychain을 사용한 보안 토큰 저장소
 * iOS: Keychain, Android: Keystore에 암호화되어 저장됩니다.
 */

const SERVICES = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  ROLE: 'role',
};

const KEYCHAIN_OPTIONS = {
  accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
};

/**
 * Access Token 저장
 */
export const setAccessToken = async (token: string): Promise<void> => {
  await Keychain.setGenericPassword('accessToken', token, {
    service: SERVICES.ACCESS_TOKEN,
    ...KEYCHAIN_OPTIONS,
  });
};

/**
 * Access Token 조회
 */
export const getAccessToken = async (): Promise<string | null> => {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: SERVICES.ACCESS_TOKEN,
    });
    return credentials ? credentials.password : null;
  } catch (error) {
    console.error('Failed to get access token:', error);
    return null;
  }
};

/**
 * Refresh Token 저장
 */
export const setRefreshToken = async (token: string): Promise<void> => {
  await Keychain.setGenericPassword('refreshToken', token, {
    service: SERVICES.REFRESH_TOKEN,
    ...KEYCHAIN_OPTIONS,
  });
};

/**
 * Refresh Token 조회
 */
export const getRefreshToken = async (): Promise<string | null> => {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: SERVICES.REFRESH_TOKEN,
    });
    return credentials ? credentials.password : null;
  } catch (error) {
    console.error('Failed to get refresh token:', error);
    return null;
  }
};

/**
 * Role 저장
 */
export const setRole = async (role: string): Promise<void> => {
  await Keychain.setGenericPassword('role', role, {
    service: SERVICES.ROLE,
    ...KEYCHAIN_OPTIONS,
  });
};

/**
 * Role 조회
 */
export const getRole = async (): Promise<string | null> => {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: SERVICES.ROLE,
    });
    return credentials ? credentials.password : null;
  } catch (error) {
    console.error('Failed to get role:', error);
    return null;
  }
};

/**
 * 모든 토큰 및 정보 삭제 (로그아웃 시 사용)
 */
export const clearAllTokens = async (): Promise<void> => {
  try {
    await Promise.all([
      Keychain.resetGenericPassword({ service: SERVICES.ACCESS_TOKEN }),
      Keychain.resetGenericPassword({ service: SERVICES.REFRESH_TOKEN }),
      Keychain.resetGenericPassword({ service: SERVICES.ROLE }),
    ]);
  } catch (error) {
    console.error('Failed to clear tokens:', error);
  }
};

/**
 * 모든 토큰 한번에 저장
 */
export const setTokens = async (
  accessToken: string,
  refreshToken: string,
  role: string
): Promise<void> => {
  await Promise.all([
    setAccessToken(accessToken),
    setRefreshToken(refreshToken),
    setRole(role),
  ]);
};
