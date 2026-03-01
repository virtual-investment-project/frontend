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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isUuidLike = (value: unknown): value is string => {
  return typeof value === 'string' && UUID_REGEX.test(value);
};

/**
 * base64url 문자열 → UTF-8 문자열 (React Native 환경에서 atob 미지원 대응)
 */
const decodeBase64Url = (input: string): string => {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  let i = 0;
  while (i < padded.length) {
    const e1 = chars.indexOf(padded[i++]);
    const e2 = chars.indexOf(padded[i++]);
    const e3 = chars.indexOf(padded[i++]);
    const e4 = chars.indexOf(padded[i++]);
    const c1 = (e1 << 2) | (e2 >> 4);
    const c2 = ((e2 & 15) << 4) | (e3 >> 2);
    const c3 = ((e3 & 3) << 6) | e4;
    output += String.fromCharCode(c1);
    if (e3 !== 64) output += String.fromCharCode(c2);
    if (e4 !== 64) output += String.fromCharCode(c3);
  }
  
  try {
    // UTF-8 디코딩 (한글 등 다국어 지원)
    return decodeURIComponent(escape(output));
  } catch {
    return output;
  }
};

/**
 * JWT 페이로드 디코딩 (서명 검증 없이 클라이언트 용으로만 사용)
 * @returns { sub: string (userId), role: string } 또는 null
 */
export const decodeJwtPayload = (token: string): { sub: string; role: string } | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('[AUTH] JWT 형식 오류: 3부분이 아님');
      return null;
    }
    const decoded = JSON.parse(decodeBase64Url(parts[1]));
    // 서버마다 userId 클레임 이름이 다를 수 있으므로 UUID 형식 클레임을 우선 채택
    const rawCandidates: unknown[] = [decoded.userId, decoded.id, decoded.sub];
    const uuidCandidate = rawCandidates.find(isUuidLike);
    const firstStringCandidate = rawCandidates.find((value) => typeof value === 'string' && value.trim().length > 0) as string | undefined;
    const sub: string = uuidCandidate ?? firstStringCandidate ?? '';
    const role: string = decoded.role ?? '';
    console.log('[AUTH] JWT 디코딩 성공:', { sub, role });
    return { sub, role };
  } catch (e) {
    console.warn('[AUTH] JWT 디코딩 실패:', e);
    return null;
  }
};

/**
 * 현재 로그인된 사용자 ID (JWT sub) 조회
 * JWT 디코딩이 실패하면 null 반환 (폴백은 호출단 담당)
 */
export const getMyUserId = async (): Promise<string | null> => {
  try {
    const token = await EncryptedStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    console.log('[AUTH] ACCESS_TOKEN 조회:', { hasToken: !!token, length: token?.length });
    if (!token) {
      console.warn('[AUTH] ACCESS_TOKEN이 없습니다.');
      return null;
    }
    const payload = decodeJwtPayload(token);
    if (payload?.sub) {
      console.log('[AUTH] JWT에서 userId 추출:', payload.sub);
      return payload.sub;
    }
    console.warn('[AUTH] JWT payload에 sub 클레임 없음');
    return null;
  } catch (e) {
    console.warn('[AUTH] getMyUserId 조회 실패:', e);
    return null;
  }
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
  // console.log('[TOKEN] Access Token 조회:', { hasToken: !!token, length: token?.length });
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
