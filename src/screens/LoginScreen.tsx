import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/useColorScheme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useState } from 'react';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function LoginScreen() {
  const navigation = useNavigation<NavigationProp>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // TODO: 로그인 로직 구현
    console.log('Login:', email, password);
    // 임시로 메인 페이지로 이동
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled">
        {/* 로그인 폼 */}
        <View
          style={[
            styles.formContainer,
            { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' },
          ]}>
          <View
            style={[
              styles.formCard,
              styles.shadow,
              { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' },
            ]}>
            <Text
              style={[
                styles.formTitle,
                { color: colorScheme === 'dark' ? '#FFFFFF' : '#1E293B' },
              ]}>
              로그인
            </Text>

            {/* 이메일 입력 */}
            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.label,
                  { color: colorScheme === 'dark' ? '#E2E8F0' : '#475569' },
                ]}>
                이메일
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC',
                    color: colorScheme === 'dark' ? '#FFFFFF' : '#1E293B',
                    borderColor: colorScheme === 'dark' ? '#334155' : '#E2E8F0',
                  },
                ]}
                placeholder="example@email.com"
                placeholderTextColor={colorScheme === 'dark' ? '#64748B' : '#94A3B8'}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            {/* 비밀번호 입력 */}
            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.label,
                  { color: colorScheme === 'dark' ? '#E2E8F0' : '#475569' },
                ]}>
                비밀번호
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC',
                    color: colorScheme === 'dark' ? '#FFFFFF' : '#1E293B',
                    borderColor: colorScheme === 'dark' ? '#334155' : '#E2E8F0',
                  },
                ]}
                placeholder="••••••••"
                placeholderTextColor={colorScheme === 'dark' ? '#64748B' : '#94A3B8'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
              />
            </View>

            {/* 로그인 버튼 */}
            <TouchableOpacity
              onPress={handleLogin}
              activeOpacity={0.8}
              style={[styles.loginButton, { backgroundColor: '#6366F1' }]}>
              <Text style={styles.loginButtonText}>로그인</Text>
            </TouchableOpacity>

            {/* 비밀번호 찾기 */}
            <TouchableOpacity style={styles.forgotPassword}>
              <Text
                style={[
                  styles.forgotPasswordText,
                  { color: colorScheme === 'dark' ? '#94A3B8' : '#64748B' },
                ]}>
                비밀번호를 잊으셨나요?
              </Text>
            </TouchableOpacity>

            {/* 구분선 */}
            <View style={styles.dividerContainer}>
              <View
                style={[
                  styles.divider,
                  { backgroundColor: colorScheme === 'dark' ? '#334155' : '#E2E8F0' },
                ]}
              />
              <Text
                style={[
                  styles.dividerText,
                  { color: colorScheme === 'dark' ? '#64748B' : '#94A3B8' },
                ]}>
                또는
              </Text>
              <View
                style={[
                  styles.divider,
                  { backgroundColor: colorScheme === 'dark' ? '#334155' : '#E2E8F0' },
                ]}
              />
            </View>

            {/* 소셜 로그인 */}
            <View style={styles.socialButtons}>
              <TouchableOpacity
                style={[
                  styles.socialButton,
                  {
                    backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC',
                    borderColor: colorScheme === 'dark' ? '#334155' : '#E2E8F0',
                  },
                ]}>
                <Text style={styles.socialIcon}>G</Text>
                <Text
                  style={[
                    styles.socialText,
                    { color: colorScheme === 'dark' ? '#E2E8F0' : '#475569' },
                  ]}>
                  Google
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.socialButton,
                  {
                    backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC',
                    borderColor: colorScheme === 'dark' ? '#334155' : '#E2E8F0',
                  },
                ]}>
                <Text style={styles.socialIcon}>K</Text>
                <Text
                  style={[
                    styles.socialText,
                    { color: colorScheme === 'dark' ? '#E2E8F0' : '#475569' },
                  ]}>
                  Kakao
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 회원가입 링크 */}
          <View style={styles.signupContainer}>
            <Text
              style={[
                styles.signupText,
                { color: colorScheme === 'dark' ? '#94A3B8' : '#64748B' },
              ]}>
              계정이 없으신가요?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.signupLink}>회원가입</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 24,
  },
  formCard: {
    borderRadius: 24,
    padding: 28,
    marginBottom: 24,
  },
  shadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  formTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 28,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  loginButton: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    fontSize: 14,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  socialIcon: {
    fontSize: 20,
    fontWeight: '700',
  },
  socialText: {
    fontSize: 15,
    fontWeight: '600',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  signupText: {
    fontSize: 14,
  },
  signupLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366F1',
  },
});
