import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@env';

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request 인터셉터: 모든 요청에 Access Token 자동 추가
apiClient.interceptors.request.use(
  async (config) => {
    // AsyncStorage에서 Access Token 가져오기
    const accessToken = await AsyncStorage.getItem('accessToken');
    
    if (accessToken) {
      // Authorization 헤더에 Bearer Token 추가
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
