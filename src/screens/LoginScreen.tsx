import { useColorScheme } from '../hooks/useColorScheme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import React, { useEffect } from 'react';
import axios from 'axios';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { setTokens } from '../utils/tokenStorage';
import { GOOGLE_WEB_CLIENT_ID, API_BASE_URL } from '@env';
import { GoogleLoginResponse } from '../types/auth';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
import {
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,  
} from 'react-native';

export default function LoginScreen() {
  const navigation = useNavigation<NavigationProp>();
  const colorScheme = useColorScheme();
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    // 1. 구글 로그인 설정
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      offlineAccess: true, 
      forceCodeForRefreshToken: true,
    });
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // 2. 구글 플레이 서비스 확인 및 로그인 시도
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;

      if (!idToken) {
        throw new Error('Google ID Token을 가져오지 못했습니다.');
      }

      // 3. 백엔드로 토큰 전송
      const response = await axios.post<GoogleLoginResponse>(`${API_BASE_URL}/api/auth/google`, {
        idToken: idToken,
      });

      // 4. 백엔드에서 받은 JWT 저장 (Refresh Token도 함께 저장)
      const { accessToken, refreshToken, role } = response.data;

      // Keychain에 토큰 저장 (보안 저장소 사용)
      await setTokens(accessToken, refreshToken, role);
      
      // 5. 역할에 따른 화면 전환
      if (role === 'GUEST') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'AdditionalInfo' }],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      }

    } catch (error: any) {
      console.error('Login Error:', error);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // 유저가 뒤로가기 등으로 로그인을 취소함 (조용히 넘어감)
        console.log('User cancelled the login flow');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        Alert.alert('안내', '이미 로그인이 진행 중입니다.');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('오류', '구글 플레이 서비스를 사용할 수 없습니다.');
      } else {
        Alert.alert('로그인 실패', '서버와 통신 중 오류가 발생했습니다.\n' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#FFFFFF' },
      ]}>
      <View style={styles.content}>
        <View style={styles.topSection}>
          {/* 로고 영역 */}
          <View style={styles.logoContainer}>
            <View
              style={[
                styles.logoCircle,
                { backgroundColor: colorScheme === 'dark' ? '#6366F1' : '#6366F1' },
              ]}>
              <Text style={styles.logoText}>LOGO</Text>
            </View>
          </View>

          {/* 타이틀 */}
          <View style={styles.titleContainer}>
            <Text
              style={[
                styles.title,
                { color: colorScheme === 'dark' ? '#FFFFFF' : '#1E293B' },
              ]}>
              가상 투자로 실력을
            </Text>
            <Text
              style={[
                styles.title,
                { color: colorScheme === 'dark' ? '#FFFFFF' : '#1E293B' },
              ]}>
              겨뤄보세요
            </Text>
          </View>
        </View>

        <View style={styles.bottomSection}>
          {/* Google 로그인 버튼 */}
          <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={handleGoogleLogin}
            activeOpacity={0.8}
            style={[
              styles.socialButton,
              styles.googleButton,
              {
                backgroundColor: colorScheme === 'dark' ? '#FFFFFF' : '#FFFFFF',
                borderColor: colorScheme === 'dark' ? '#E2E8F0' : '#E2E8F0',
              },
            ]}>
            <Text style={styles.googleIcon}>G</Text>
            <Text style={[styles.buttonText, { color: '#1E293B' }]}>
              Google로 계속하기
            </Text>
          </TouchableOpacity>
        </View>

        {/* 구분선 및 약관 동의 */}
        <View style={styles.footer}>
          <View
            style={[
              styles.divider,
              { backgroundColor: colorScheme === 'dark' ? '#334155' : '#E2E8F0' },
            ]}
          />
          <Text
            style={[
              styles.termsText,
              { color: colorScheme === 'dark' ? '#94A3B8' : '#64748B' },
            ]}>
            계속하면 이용약관 및
          </Text>
          <Text
            style={[
              styles.termsText,
              { color: colorScheme === 'dark' ? '#94A3B8' : '#64748B' },
            ]}>
            개인정보 처리방침에
          </Text>
          <Text
            style={[
              styles.termsText,
              { color: colorScheme === 'dark' ? '#94A3B8' : '#64748B' },
            ]}>
            동의한 것으로 간주됩니다
          </Text>
        </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 10,
  },
  topSection: {
    paddingTop: 40,
  },
  bottomSection: {
    paddingBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 32,
  },
  socialButton: {
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  googleButton: {},
  googleIcon: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4285F4',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 24,
  },
  divider: {
    width: '100%',
    height: 1,
    marginBottom: 16,
  },
  termsText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});
