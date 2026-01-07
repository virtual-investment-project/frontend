import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/useColorScheme';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useState } from 'react';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SignupScreen() {
  const navigation = useNavigation<NavigationProp>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // 폼 상태
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [age, setAge] = useState('');
  const [job, setJob] = useState('');
  const [favoriteAnimal, setFavoriteAnimal] = useState('');

  // 중복확인 상태
  const [usernameChecked, setUsernameChecked] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);
  const [nicknameChecked, setNicknameChecked] = useState(false);

  const handleCheckUsername = () => {
    // TODO: 실제 API 호출
    if (username.length >= 4) {
      setUsernameChecked(true);
      Alert.alert('확인', '사용 가능한 아이디입니다.');
    } else {
      Alert.alert('오류', '아이디는 4자 이상이어야 합니다.');
    }
  };

  const handleCheckEmail = () => {
    // TODO: 실제 API 호출
    if (email.includes('@')) {
      setEmailChecked(true);
      Alert.alert('확인', '사용 가능한 이메일입니다.');
    } else {
      Alert.alert('오류', '올바른 이메일 형식이 아닙니다.');
    }
  };

  const handleCheckNickname = () => {
    // TODO: 실제 API 호출
    if (nickname.length >= 2) {
      setNicknameChecked(true);
      Alert.alert('확인', '사용 가능한 닉네임입니다.');
    } else {
      Alert.alert('오류', '닉네임은 2자 이상이어야 합니다.');
    }
  };

  const handleBirthDateChange = (text: string) => {
    setBirthDate(text);
    // 생년월일로부터 나이 자동 계산
    if (text.length === 8) {
      const year = parseInt(text.substring(0, 4));
      const currentYear = new Date().getFullYear();
      const calculatedAge = currentYear - year;
      setAge(calculatedAge.toString());
    }
  };

  const handleSocialSignup = (provider: string) => {
    Alert.alert(`${provider} 회원가입`, `${provider} 소셜 로그인 연동 (준비 중)`);
  };

  const handleSignup = () => {
    // TODO: 유효성 검사 및 회원가입 로직
    if (!usernameChecked || !emailChecked || !nicknameChecked) {
      Alert.alert('오류', '중복확인을 모두 완료해주세요.');
      return;
    }
    console.log('Signup:', { username, email, nickname, /* ... */ });
    Alert.alert('성공', '회원가입이 완료되었습니다!', [
      { text: '확인', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }) }
    ]);
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled">
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
              회원가입
            </Text>

            {/* 소셜 회원가입 */}
            <View style={styles.socialSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                간편 회원가입
              </Text>
              <View style={styles.socialButtons}>
                <TouchableOpacity
                  style={[styles.socialButton, { backgroundColor: '#03C75A', borderColor: '#03C75A' }]}
                  onPress={() => handleSocialSignup('네이버')}>
                  <Text style={styles.socialButtonText}>N 네이버</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.socialButton, { backgroundColor: '#FEE500', borderColor: '#FEE500' }]}
                  onPress={() => handleSocialSignup('카카오')}>
                  <Text style={[styles.socialButtonText, { color: '#000000' }]}>K 카카오</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.socialButton, {
                    backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#FFFFFF',
                    borderColor: colorScheme === 'dark' ? '#334155' : '#E2E8F0',
                  }]}
                  onPress={() => handleSocialSignup('구글')}>
                  <Text style={[styles.socialButtonText, { color: colors.text }]}>G 구글</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 구분선 */}
            <View style={styles.dividerContainer}>
              <View style={[styles.divider, { backgroundColor: colorScheme === 'dark' ? '#334155' : '#E2E8F0' }]} />
              <Text style={[styles.dividerText, { color: colorScheme === 'dark' ? '#64748B' : '#94A3B8' }]}>
                또는 직접 입력
              </Text>
              <View style={[styles.divider, { backgroundColor: colorScheme === 'dark' ? '#334155' : '#E2E8F0' }]} />
            </View>

            {/* 아이디 */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colorScheme === 'dark' ? '#E2E8F0' : '#475569' }]}>
                아이디 <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputWithButton}>
                <TextInput
                  style={[
                    styles.input,
                    styles.inputFlex,
                    {
                      backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC',
                      color: colorScheme === 'dark' ? '#FFFFFF' : '#1E293B',
                      borderColor: usernameChecked ? '#10B981' : (colorScheme === 'dark' ? '#334155' : '#E2E8F0'),
                    },
                  ]}
                  placeholder="4자 이상"
                  placeholderTextColor={colorScheme === 'dark' ? '#64748B' : '#94A3B8'}
                  value={username}
                  onChangeText={(text) => {
                    setUsername(text);
                    setUsernameChecked(false);
                  }}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={[styles.checkButton, { backgroundColor: '#6366F1' }]}
                  onPress={handleCheckUsername}>
                  <Text style={styles.checkButtonText}>중복확인</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 비밀번호 */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colorScheme === 'dark' ? '#E2E8F0' : '#475569' }]}>
                비밀번호 <Text style={styles.required}>*</Text>
                <Text style={styles.hint}> (특수문자, 대소문자, 숫자 포함)</Text>
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
              />
            </View>

            {/* 이메일 */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colorScheme === 'dark' ? '#E2E8F0' : '#475569' }]}>
                이메일 <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputWithButton}>
                <TextInput
                  style={[
                    styles.input,
                    styles.inputFlex,
                    {
                      backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC',
                      color: colorScheme === 'dark' ? '#FFFFFF' : '#1E293B',
                      borderColor: emailChecked ? '#10B981' : (colorScheme === 'dark' ? '#334155' : '#E2E8F0'),
                    },
                  ]}
                  placeholder="example@email.com"
                  placeholderTextColor={colorScheme === 'dark' ? '#64748B' : '#94A3B8'}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setEmailChecked(false);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={[styles.checkButton, { backgroundColor: '#6366F1' }]}
                  onPress={handleCheckEmail}>
                  <Text style={styles.checkButtonText}>중복확인</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 닉네임 */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colorScheme === 'dark' ? '#E2E8F0' : '#475569' }]}>
                닉네임 <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputWithButton}>
                <TextInput
                  style={[
                    styles.input,
                    styles.inputFlex,
                    {
                      backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC',
                      color: colorScheme === 'dark' ? '#FFFFFF' : '#1E293B',
                      borderColor: nicknameChecked ? '#10B981' : (colorScheme === 'dark' ? '#334155' : '#E2E8F0'),
                    },
                  ]}
                  placeholder="2자 이상"
                  placeholderTextColor={colorScheme === 'dark' ? '#64748B' : '#94A3B8'}
                  value={nickname}
                  onChangeText={(text) => {
                    setNickname(text);
                    setNicknameChecked(false);
                  }}
                />
                <TouchableOpacity
                  style={[styles.checkButton, { backgroundColor: '#6366F1' }]}
                  onPress={handleCheckNickname}>
                  <Text style={styles.checkButtonText}>중복확인</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 성/이름 */}
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={[styles.label, { color: colorScheme === 'dark' ? '#E2E8F0' : '#475569' }]}>
                  성 <Text style={styles.required}>*</Text>
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
                  placeholder="김"
                  placeholderTextColor={colorScheme === 'dark' ? '#64748B' : '#94A3B8'}
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={[styles.label, { color: colorScheme === 'dark' ? '#E2E8F0' : '#475569' }]}>
                  이름 <Text style={styles.required}>*</Text>
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
                  placeholder="철수"
                  placeholderTextColor={colorScheme === 'dark' ? '#64748B' : '#94A3B8'}
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
            </View>

            {/* 성별 */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colorScheme === 'dark' ? '#E2E8F0' : '#475569' }]}>
                성별 <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.genderButtons}>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    {
                      backgroundColor: gender === '남성' ? '#6366F1' : (colorScheme === 'dark' ? '#0F172A' : '#F8FAFC'),
                      borderColor: gender === '남성' ? '#6366F1' : (colorScheme === 'dark' ? '#334155' : '#E2E8F0'),
                    },
                  ]}
                  onPress={() => setGender('남성')}>
                  <Text style={[
                    styles.genderButtonText,
                    { color: gender === '남성' ? '#FFFFFF' : colors.text }
                  ]}>남성</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    {
                      backgroundColor: gender === '여성' ? '#6366F1' : (colorScheme === 'dark' ? '#0F172A' : '#F8FAFC'),
                      borderColor: gender === '여성' ? '#6366F1' : (colorScheme === 'dark' ? '#334155' : '#E2E8F0'),
                    },
                  ]}
                  onPress={() => setGender('여성')}>
                  <Text style={[
                    styles.genderButtonText,
                    { color: gender === '여성' ? '#FFFFFF' : colors.text }
                  ]}>여성</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 생년월일/나이 */}
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 2 }]}>
                <Text style={[styles.label, { color: colorScheme === 'dark' ? '#E2E8F0' : '#475569' }]}>
                  생년월일 <Text style={styles.required}>*</Text>
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
                  placeholder="YYYYMMDD"
                  placeholderTextColor={colorScheme === 'dark' ? '#64748B' : '#94A3B8'}
                  value={birthDate}
                  onChangeText={handleBirthDateChange}
                  keyboardType="number-pad"
                  maxLength={8}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colorScheme === 'dark' ? '#E2E8F0' : '#475569' }]}>
                  나이
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#E5E7EB',
                      color: colorScheme === 'dark' ? '#94A3B8' : '#6B7280',
                      borderColor: colorScheme === 'dark' ? '#334155' : '#E2E8F0',
                    },
                  ]}
                  placeholder="자동"
                  placeholderTextColor={colorScheme === 'dark' ? '#64748B' : '#94A3B8'}
                  value={age}
                  editable={false}
                />
              </View>
            </View>

            {/* 직업 */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colorScheme === 'dark' ? '#E2E8F0' : '#475569' }]}>
                직업 <Text style={styles.required}>*</Text>
              </Text>
              <View style={[
                styles.pickerContainer,
                {
                  backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC',
                  borderColor: colorScheme === 'dark' ? '#334155' : '#E2E8F0',
                },
              ]}>
                <Picker
                  selectedValue={job}
                  onValueChange={setJob}
                  style={[styles.picker, { color: colorScheme === 'dark' ? '#FFFFFF' : '#1E293B' }]}>
                  <Picker.Item label="선택하세요" value="" />
                  <Picker.Item label="학생" value="학생" />
                  <Picker.Item label="직장인" value="직장인" />
                  <Picker.Item label="사업" value="사업" />
                  <Picker.Item label="전업주부" value="전업주부" />
                  <Picker.Item label="프리렌서" value="프리렌서" />
                  <Picker.Item label="기타" value="기타" />
                </Picker>
              </View>
            </View>

            {/* 가장 좋아하는 동물 */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colorScheme === 'dark' ? '#E2E8F0' : '#475569' }]}>
                가장 좋아하는 동물은? <Text style={styles.required}>*</Text>
                <Text style={styles.hint}> (비밀번호 찾기용, 수정 불가)</Text>
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
                placeholder="예: 강아지"
                placeholderTextColor={colorScheme === 'dark' ? '#64748B' : '#94A3B8'}
                value={favoriteAnimal}
                onChangeText={setFavoriteAnimal}
              />
            </View>

            {/* 버튼 */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton, {
                  backgroundColor: colorScheme === 'dark' ? '#334155' : '#E5E7EB'
                }]}
                onPress={handleCancel}>
                <Text style={[styles.buttonText, { color: colorScheme === 'dark' ? '#E2E8F0' : '#475569' }]}>
                  취소
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.signupButton, { backgroundColor: '#6366F1' }]}
                onPress={handleSignup}>
                <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                  회원가입
                </Text>
              </TouchableOpacity>
            </View>
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
    paddingTop: 60,
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
    marginBottom: 24,
    textAlign: 'center',
  },
  socialSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  socialButtons: {
    gap: 10,
  },
  socialButton: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
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
    fontSize: 13,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  hint: {
    fontSize: 12,
    fontWeight: '400',
    opacity: 0.7,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  inputWithButton: {
    flexDirection: 'row',
    gap: 8,
  },
  inputFlex: {
    flex: 1,
  },
  checkButton: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  genderButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  genderButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 48,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {},
  signupButton: {},
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
