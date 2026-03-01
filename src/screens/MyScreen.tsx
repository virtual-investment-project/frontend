import { ThemedText } from '../components/ThemedText';
import { IconSymbol } from '../components/ui/IconSymbol';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/useColorScheme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useState, useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import apiClient from '../api/axiosInstance';
import { clearAllTokens } from '../utils/tokenStorage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GOOGLE_WEB_CLIENT_ID } from '@env';
import { useTheme } from '../contexts/ThemeContext';
import { getSettings, updateSettings } from '../services/settingsService';


type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface UserProfile {
  email: string;
  name: string;
  nickname: string;
  age: number;
  school: string;
  company: string;
}

export default function MyScreen() {
  const navigation = useNavigation<NavigationProp>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const cardBg = isDark ? '#1E293B' : '#FFFFFF';
  const pageBg = isDark ? '#0F172A' : '#F8FAFC';
  const inputBg = isDark ? '#0F172A' : '#F8FAFC';
  const dividerBg = isDark ? '#334155' : '#E5E7EB';
  const cancelBtnBg = isDark ? '#334155' : '#E5E7EB';

  // 탭 상태
  const [activeTab, setActiveTab] = useState<'info' | 'deposit' | 'settings'>('info');
  const tabInfoColor = activeTab === 'info' ? '#6366F1' : colors.icon;
  const tabDepositColor = activeTab === 'deposit' ? '#6366F1' : colors.icon;
  const tabSettingsColor = activeTab === 'settings' ? '#6366F1' : colors.icon;

  // 로딩 상태
  const [loading, setLoading] = useState(true);

  // 임시 어드민 상태
  const isAdmin = false;

  // 내 정보 상태
  const [userInfo, setUserInfo] = useState<UserProfile | null>(null);

  const [isEditMode, setIsEditMode] = useState(false);
  const [editedInfo, setEditedInfo] = useState({
    nickname: '',
    school: '',
    company: '',
  });

  // 설정 상태
  const [notificationSettings, setNotificationSettings] = useState({
    orderExecution: true,
    battleStart: true,
    rankChange: true,
    stockPriceAlert: false,
  });

  // ThemeContext에서 다크모드 상태 가져오기
  const { darkMode, toggleDarkMode } = useTheme();

  // 컴포넌트 마운트 시 사용자 정보 로드
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });
    fetchUserProfile();
    loadNotificationSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 알림 설정 로드
  const loadNotificationSettings = async () => {
    try {
      const settings = await getSettings();
      setNotificationSettings({
        orderExecution: settings.orderExecution,
        battleStart: settings.battleStart,
        rankChange: settings.rankChange,
        stockPriceAlert: settings.stockPriceAlert,
      });
    } catch (error) {
      console.error('알림 설정 로드 실패:', error);
    }
  };

  // 알림 설정 토글
  const handleToggleNotification = async (key: keyof typeof notificationSettings) => {
    const newValue = !notificationSettings[key];
    setNotificationSettings({ ...notificationSettings, [key]: newValue });
    try {
      await updateSettings({ [key]: newValue });
    } catch (error) {
      console.error('알림 설정 변경 실패:', error);
      setNotificationSettings({ ...notificationSettings, [key]: !newValue });
      Alert.alert('오류', '알림 설정 변경에 실패했습니다.');
    }
  };

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<UserProfile>('/api/mypage/profile');
      setUserInfo(response.data);
      setEditedInfo({
        nickname: response.data.nickname || '',
        school: response.data.school || '',
        company: response.data.company || '',
      });
    } catch (error: any) {
      console.error('Profile Fetch Error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);

      // 인증 오류인 경우 로그인 화면으로
      if (error.response?.status === 401 || error.response?.status === 403) {
        Alert.alert('로그인 필요', '로그인이 필요합니다.', [
          {
            text: '확인',
            onPress: () => {
              clearAllTokens();
              navigation.navigate('Login');
            },
          },
        ]);
      } else {
        Alert.alert(
          '오류',
          `사용자 정보를 불러오는데 실패했습니다.\n${error.response?.data?.message || error.message || '네트워크 오류'}`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃 하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            try {
              // 백엔드에 로그아웃 요청 (Refresh Token 무효화)
              await apiClient.post('/api/mypage/logout');
            } catch (error: any) {
              console.warn('로그아웃 API 요청 실패 (무시):', error.message);
            } finally {
              // 로컬 토큰 삭제
              await clearAllTokens();

              // Google Sign-In 세션 종료 (configure 안 된 경우 대비)
              try {
                await GoogleSignin.signOut();
              } catch (e) {
                console.warn('GoogleSignin.signOut 실패 (무시):', e);
              }

              // 로그인 화면으로 이동
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });

              Alert.alert('로그아웃 완료', '다시 로그인해주세요.');
            }
          },
        },
      ]
    );
  };

  const handleEditProfile = async () => {
    if (isEditMode) {
      try {
        // 백엔드에 프로필 업데이트 요청
        const response = await apiClient.patch<UserProfile>('/api/mypage/profile', {
          nickname: editedInfo.nickname.trim() || null,
          school: editedInfo.school.trim() || null,
          company: editedInfo.company.trim() || null,
        });

        // 서버에서 받은 최신 정보로 업데이트
        setUserInfo(response.data);
        Alert.alert('성공', '프로필이 업데이트되었습니다.');
        setIsEditMode(false);
      } catch (error: any) {
        console.error('Profile Update Error:', error);
        Alert.alert('오류', '프로필 업데이트에 실패했습니다.');
      }
    } else {
      setIsEditMode(true);
      if (userInfo) {
        setEditedInfo({
          nickname: userInfo.nickname || '',
          school: userInfo.school || '',
          company: userInfo.company || '',
        });
      }
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    if (userInfo) {
      setEditedInfo({
        nickname: userInfo.nickname || '',
        school: userInfo.school || '',
        company: userInfo.company || '',
      });
    }
  };

  const renderInfoTab = () => {
    if (loading) {
      return (
        <View style={[styles.card, styles.shadow, styles.centered, { backgroundColor: cardBg }]}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={[styles.marginTop16, { color: colors.text }]}>로딩 중...</Text>
        </View>
      );
    }

    if (!userInfo) {
      return (
        <View style={[styles.card, styles.shadow, styles.centered, { backgroundColor: cardBg }]}>
          <Text style={{ color: colors.text }}>사용자 정보를 불러올 수 없습니다.</Text>
        </View>
      );
    }

    return (
      <View>
        <View style={[styles.card, styles.shadow, { backgroundColor: cardBg }]}>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.icon }]}>이메일</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{userInfo.email}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.icon }]}>닉네임</Text>
            {isEditMode ? (
              <TextInput
                style={[styles.infoInput, { backgroundColor: inputBg, color: colors.text }]}
                value={editedInfo.nickname}
                onChangeText={(text) => setEditedInfo({ ...editedInfo, nickname: text })}
                placeholder="닉네임을 입력하세요"
                placeholderTextColor={colors.icon}
              />
            ) : (
              <Text style={[styles.infoValue, { color: colors.text }]}>{userInfo.nickname || '-'}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.icon }]}>이름</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{userInfo.name}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.icon }]}>나이</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{userInfo.age}세</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.icon }]}>학교</Text>
            {isEditMode ? (
              <TextInput
                style={[styles.infoInput, { backgroundColor: inputBg, color: colors.text }]}
                value={editedInfo.school}
                onChangeText={(text) => setEditedInfo({ ...editedInfo, school: text })}
                placeholder="학교명을 입력하세요"
                placeholderTextColor={colors.icon}
              />
            ) : (
              <Text style={[styles.infoValue, { color: colors.text }]}>{userInfo.school || '-'}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.icon }]}>회사</Text>
            {isEditMode ? (
              <TextInput
                style={[styles.infoInput, { backgroundColor: inputBg, color: colors.text }]}
                value={editedInfo.company}
                onChangeText={(text) => setEditedInfo({ ...editedInfo, company: text })}
                placeholder="회사명을 입력하세요"
                placeholderTextColor={colors.icon}
              />
            ) : (
              <Text style={[styles.infoValue, { color: colors.text }]}>{userInfo.company || '-'}</Text>
            )}
          </View>

          <View style={styles.buttonRow}>
            {isEditMode ? (
              <>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: cancelBtnBg }]}
                  onPress={handleCancelEdit}>
                  <Text style={[styles.buttonText, { color: colors.text }]}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.btnPrimary]}
                  onPress={handleEditProfile}>
                  <Text style={[styles.buttonText, styles.colorWhite]}>저장</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.button, styles.btnPrimary]}
                onPress={handleEditProfile}>
                <Text style={[styles.buttonText, styles.colorWhite]}>프로필 수정</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.logoutButton, styles.borderRed, { backgroundColor: cardBg }]}
          onPress={handleLogout}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderDepositTab = () => (
    <View>
      <View style={[styles.card, styles.shadow, { backgroundColor: cardBg }]}>
        <ThemedText type="subtitle" style={styles.cardTitle}>계좌에 돈 추가</ThemedText>
        <Text style={[styles.description, { color: colors.icon }]}>
          광고를 시청해 가상 자산을 추가할 수 있습니다.
        </Text>

        <TouchableOpacity style={[styles.depositButton, styles.depositBtnGreen]}>
          <IconSymbol size={20} name="play.circle.fill" color="#FFFFFF" />
          <Text style={styles.depositButtonText}>광고 보고 ₩100,000 받기(개발중)</Text>
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: dividerBg }, styles.dividerMargin]} />
      </View>
    </View>
  );

  const renderSettingsTab = () => (
    <View>
      {/* 알림 설정 */}
      <View style={[styles.card, styles.shadow, { backgroundColor: cardBg }]}>
        <View style={styles.settingsSectionHeader}>
          <Text style={[styles.settingsSectionIcon]}>🔔</Text>
          <ThemedText type="subtitle" style={styles.cardTitle}>알림 설정</ThemedText>
        </View>

        <View style={styles.settingItem}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>주문 체결 알림</Text>
          <TouchableOpacity
            style={[styles.toggle, notificationSettings.orderExecution && styles.toggleActive]}
            onPress={() => handleToggleNotification('orderExecution')}>
            <View style={[styles.toggleThumb, notificationSettings.orderExecution && styles.toggleThumbActive]} />
          </TouchableOpacity>
        </View>

        <View style={styles.settingItem}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>팀전 시작 알림</Text>
          <TouchableOpacity
            style={[styles.toggle, notificationSettings.battleStart && styles.toggleActive]}
            onPress={() => handleToggleNotification('battleStart')}>
            <View style={[styles.toggleThumb, notificationSettings.battleStart && styles.toggleThumbActive]} />
          </TouchableOpacity>
        </View>

        <View style={styles.settingItem}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>순위 변동 알림</Text>
          <TouchableOpacity
            style={[styles.toggle, notificationSettings.rankChange && styles.toggleActive]}
            onPress={() => handleToggleNotification('rankChange')}>
            <View style={[styles.toggleThumb, notificationSettings.rankChange && styles.toggleThumbActive]} />
          </TouchableOpacity>
        </View>

        <View style={styles.settingItem}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>관심 종목 가격 알림</Text>
          <TouchableOpacity
            style={[styles.toggle, notificationSettings.stockPriceAlert && styles.toggleActive]}
            onPress={() => handleToggleNotification('stockPriceAlert')}>
            <View style={[styles.toggleThumb, notificationSettings.stockPriceAlert && styles.toggleThumbActive]} />
          </TouchableOpacity>
        </View>
      </View>

      {/* UI/환경 설정 */}
      <View style={[styles.card, styles.shadow, { backgroundColor: cardBg }]}>
        <View style={styles.settingsSectionHeader}>
          <Text style={[styles.settingsSectionIcon]}>🎨</Text>
          <ThemedText type="subtitle" style={styles.cardTitle}>UI/환경 설정</ThemedText>
        </View>

        <View style={styles.settingItem}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>다크모드</Text>
          <TouchableOpacity
            style={[styles.toggle, darkMode && styles.toggleActive]}
            onPress={async () => {
              try {
                await toggleDarkMode();
                Alert.alert('다크모드', `다크모드가 ${!darkMode ? '켜졌' : '꺼졌'}습니다.`);
              } catch (error) {
                console.error('Settings Update Error:', error);
                Alert.alert('오류', '설정 업데이트에 실패했습니다.');
              }
            }}>
            <View style={[styles.toggleThumb, darkMode && styles.toggleThumbActive]} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: pageBg }]}>
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>마이페이지</ThemedText>
          {isAdmin && (
            <TouchableOpacity
              style={[styles.adminButton, styles.adminBtnBg]}
              onPress={() => Alert.alert('어드민', '어드민 페이지로 이동 (웹)')}>
              <IconSymbol size={16} name="shield.fill" color="#FFFFFF" />
              <Text style={styles.adminButtonText}>어드민 대시보드</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 탭 버튼 */}
        <View style={[styles.tabContainer, { backgroundColor: cardBg }]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'info' && styles.activeTab]}
            onPress={() => setActiveTab('info')}>
            <Text style={[styles.tabText, { color: tabInfoColor }]}>내 정보</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'deposit' && styles.activeTab]}
            onPress={() => setActiveTab('deposit')}>
            <Text style={[styles.tabText, { color: tabDepositColor }]}>돈 추가</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
            onPress={() => setActiveTab('settings')}>
            <Text style={[styles.tabText, { color: tabSettingsColor }]}>설정</Text>
          </TouchableOpacity>
        </View>

        {/* 탭 컨텐츠 */}
        {activeTab === 'info' && renderInfoTab()}
        {activeTab === 'deposit' && renderDepositTab()}
        {activeTab === 'settings' && renderSettingsTab()}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  adminButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.15)',
  },
  infoLabel: {
    fontSize: 14,
    width: 80,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  infoInput: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  pickerContainer: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
  },
  logoutButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 8,
  },
  accountSummary: {
    gap: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  stockItem: {
    flexDirection: 'row',
    paddingVertical: 16,
  },
  stockName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  stockDetail: {
    fontSize: 13,
  },
  stockProfit: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  transactionItem: {
    flexDirection: 'row',
    paddingVertical: 16,
  },
  transactionType: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  transactionDetail: {
    fontSize: 12,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  pendingItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  battleItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    alignItems: 'center',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  depositButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 12,
  },
  depositButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    height: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  paymentOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  paymentPrice: {
    fontSize: 14,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 40,
  },
  settingsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  settingsSectionIcon: {
    fontSize: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.15)',
  },
  settingItemLink: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.15)',
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#CBD5E1',
    padding: 2,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  marginTop16: {
    marginTop: 16,
  },
  btnPrimary: {
    backgroundColor: '#6366F1',
  },
  colorWhite: {
    color: '#FFFFFF',
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  depositBtnGreen: {
    backgroundColor: '#10B981',
  },
  dividerMargin: {
    marginVertical: 20,
  },
  badgePrimary: {
    backgroundColor: '#6366F1',
  },
  toggleActive: {
    backgroundColor: '#6366F1',
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  adminBtnBg: {
    backgroundColor: '#8B5CF6',
  },
  borderRed: {
    borderColor: '#EF4444',
  },
});
