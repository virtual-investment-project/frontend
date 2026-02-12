import axios from 'axios';
import { API_BASE_URL } from '@env';
import { getAccessToken, getRefreshToken, setAccessToken, setRefreshToken, clearAllTokens } from '../utils/tokenStorage';

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Refresh Token 갱신 중인지 추적
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

// 대기 중인 요청들을 처리
const processQueue = (error: any = null, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// Request 인터셉터: 모든 요청에 Access Token 자동 추가
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Keychain에서 Access Token 가져오기
      const accessToken = await getAccessToken();
      
      console.log('📤 API 요청:', config.method?.toUpperCase(), config.url);
      
      if (accessToken) {
        // Authorization 헤더에 Bearer Token 추가
        config.headers.Authorization = `Bearer ${accessToken}`;
        console.log('🔑 토큰 추가 완료 (앞 20자):', accessToken.substring(0, 20) + '...');
      } else {
        console.warn('⚠️ Access Token이 없습니다! 로그인이 필요합니다.');
      }
      
      console.log('📋 전송 헤더:', {
        'Content-Type': config.headers['Content-Type'],
        'Authorization': config.headers.Authorization ? '있음' : '없음'
      });
    } catch (error) {
      // Keychain 에러 발생 시 토큰 없이 요청 진행
      console.error('❌ Keychain 에러:', error);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response 인터셉터: 401 에러 시 자동으로 토큰 갱신
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // 401 에러이고, 재시도하지 않은 요청인 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Refresh 엔드포인트에서 실패한 경우는 로그아웃 처리
      if (originalRequest.url?.includes('/api/auth/refresh')) {
        isRefreshing = false;
        processQueue(error, null);
        
        // 토큰 삭제 및 로그인 화면으로 이동 (앱에서 처리하도록 에러 전파)
        await clearAllTokens();
        return Promise.reject(error);
      }

      // 이미 토큰 갱신 중인 경우, 큐에 추가하고 대기
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await getRefreshToken();

        if (!refreshToken) {
          throw new Error('Refresh Token이 없습니다.');
        }

        // Refresh Token으로 새로운 토큰 요청
        const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
          refreshToken: refreshToken,
        });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

        // 새로운 토큰들을 저장 (Refresh Token도 갱신됨!)
        await setAccessToken(newAccessToken);
        await setRefreshToken(newRefreshToken);

        // 대기 중인 요청들에게 새 토큰 전달
        processQueue(null, newAccessToken);

        // 원래 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        
        // 토큰 갱신 실패 시 로그아웃 처리
        await clearAllTokens();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
