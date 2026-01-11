import { useColorScheme } from '../hooks/useColorScheme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
import {
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function LoginScreen() {
  const navigation = useNavigation<NavigationProp>();
  const colorScheme = useColorScheme();

  const handleGoogleLogin = () => {
    // TODO: Google OAuth 로그인 로직 구현
    console.log('Google Login');
    // 처음 로그인 시 추가 정보 입력 화면으로 이동
    // TODO: 실제로는 서버에서 사용자 정보 확인 후 분기 처리
    navigation.navigate('AdditionalInfo');
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
