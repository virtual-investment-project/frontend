import { useColorScheme } from '../hooks/useColorScheme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useState } from 'react';
import apiClient from '../api/axiosInstance';
import { setRole } from '../utils/tokenStorage';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
} from 'react-native';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AdditionalInfoScreen() {
  const navigation = useNavigation<NavigationProp>();
  const colorScheme = useColorScheme();
  
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('');
  const [school, setSchool] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!isFormValid) return;

    setLoading(true);
    try {
      // 백엔드로 추가 정보 전송
      await apiClient.post('/api/users/additional-info', {
        nickname: nickname.trim(),
        age: parseInt(age, 10),
        school: school.trim() || null,
        company: company.trim() || null,
      });

      // Role을 USER로 업데이트
      await setRole('USER');

      Alert.alert('성공', '정보가 저장되었습니다!', [
        {
          text: '확인',
          onPress: () => {
            // 메인 화면으로 이동
            navigation.reset({
              index: 0,
              routes: [{ name: 'Main' }],
            });
          },
        },
      ]);
    } catch (error: any) {
      console.error('Additional Info Error:', error);
      Alert.alert(
        '오류',
        error.response?.data?.message || '정보 저장에 실패했습니다. 다시 시도해주세요.'
      );
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = nickname.trim() !== '' && age.trim() !== '';

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#FFFFFF' },
      ]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
                추가 정보 입력
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  { color: colorScheme === 'dark' ? '#94A3B8' : '#64748B' },
                ]}>
                서비스 이용을 위해 정보를 입력해주세요
              </Text>
            </View>
          </View>

          <View style={styles.formSection}>
            {/* 닉네임 입력 */}
            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.label,
                  { color: colorScheme === 'dark' ? '#E2E8F0' : '#475569' },
                ]}>
                닉네임 <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#F8FAFC',
                    color: colorScheme === 'dark' ? '#FFFFFF' : '#1E293B',
                    borderColor: colorScheme === 'dark' ? '#334155' : '#E2E8F0',
                  },
                ]}
                placeholder="닉네임을 입력하세요"
                placeholderTextColor={colorScheme === 'dark' ? '#64748B' : '#94A3B8'}
                value={nickname}
                onChangeText={setNickname}
                autoCapitalize="none"
              />
            </View>

            {/* 나이 입력 */}
            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.label,
                  { color: colorScheme === 'dark' ? '#E2E8F0' : '#475569' },
                ]}>
                나이 <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#F8FAFC',
                    color: colorScheme === 'dark' ? '#FFFFFF' : '#1E293B',
                    borderColor: colorScheme === 'dark' ? '#334155' : '#E2E8F0',
                  },
                ]}
                placeholder="나이를 입력하세요"
                placeholderTextColor={colorScheme === 'dark' ? '#64748B' : '#94A3B8'}
                value={age}
                onChangeText={setAge}
                keyboardType="number-pad"
              />
            </View>

            {/* 학교 입력 */}
            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.label,
                  { color: colorScheme === 'dark' ? '#E2E8F0' : '#475569' },
                ]}>
                학교
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#F8FAFC',
                    color: colorScheme === 'dark' ? '#FFFFFF' : '#1E293B',
                    borderColor: colorScheme === 'dark' ? '#334155' : '#E2E8F0',
                  },
                ]}
                placeholder="학교명을 입력하세요 (선택)"
                placeholderTextColor={colorScheme === 'dark' ? '#64748B' : '#94A3B8'}
                value={school}
                onChangeText={setSchool}
              />
            </View>

            {/* 회사 입력 */}
            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.label,
                  { color: colorScheme === 'dark' ? '#E2E8F0' : '#475569' },
                ]}>
                회사
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#F8FAFC',
                    color: colorScheme === 'dark' ? '#FFFFFF' : '#1E293B',
                    borderColor: colorScheme === 'dark' ? '#334155' : '#E2E8F0',
                  },
                ]}
                placeholder="회사명을 입력하세요 (선택)"
                placeholderTextColor={colorScheme === 'dark' ? '#64748B' : '#94A3B8'}
                value={company}
                onChangeText={setCompany}
              />
            </View>

            {/* 제출 버튼 */}
            <TouchableOpacity
              onPress={handleSubmit}
              activeOpacity={0.8}
              disabled={!isFormValid || loading}
              style={[
                styles.submitButton,
                {
                  backgroundColor: isFormValid && !loading ? '#6366F1' : colorScheme === 'dark' ? '#334155' : '#E2E8F0',
                },
              ]}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text
                  style={[
                    styles.submitButtonText,
                    { color: isFormValid ? '#FFFFFF' : colorScheme === 'dark' ? '#64748B' : '#94A3B8' },
                  ]}>
                  시작하기
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
    paddingTop: 40,
    paddingBottom: 40,
  },
  topSection: {
    paddingTop: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  formSection: {
    paddingBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  submitButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
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
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
