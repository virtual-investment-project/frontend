import { ThemedText } from '../components/ThemedText';
import { IconSymbol } from '../components/ui/IconSymbol';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/useColorScheme';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useState, useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import apiClient from '../api/axiosInstance';
import { clearAllTokens } from '../utils/tokenStorage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

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

  // 탭 상태
  const [activeTab, setActiveTab] = useState<'info' | 'account' | 'deposit'>('info');

  // 로딩 상태
  const [loading, setLoading] = useState(true);

  // 임시 어드민 상태
  const isAdmin = false;

  // 내 정보 상태
  const [userInfo, setUserInfo] = useState<UserProfile | null>(null);

  const [isEditMode, setIsEditMode] = useState(false);
  const [editedInfo, setEditedInfo] = useState({
    school: '',
    company: '',
  });

  // 컴포넌트 마운트 시 사용자 정보 로드
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<UserProfile>('/api/mypage/profile');
      setUserInfo(response.data);
      setEditedInfo({
        school: response.data.school || '',
        company: response.data.company || '',
      });
    } catch (error: any) {
      console.error('Profile Fetch Error:', error);
      Alert.alert('오류', '사용자 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 내 계좌 임시 데이터
  const accountData = {
    deposit: 5000000,
    totalValue: 7850000,
    totalAssets: 12850000,
    stocks: [
      { name: '삼성전자', quantity: 10, avgPrice: 70000, currentPrice: 75000, profitRate: 7.14, profit: 50000 },
      { name: 'SK하이닉스', quantity: 5, avgPrice: 120000, currentPrice: 135000, profitRate: 12.5, profit: 75000 },
    ],
    transactions: [
      { date: '2026-01-04 14:30', type: '매수', stock: '삼성전자', quantity: 5, price: 70000, total: -350000 },
      { date: '2026-01-03 10:15', type: '입금', stock: '-', quantity: 0, price: 0, total: 5000000 },
    ],
    pendingOrders: [
      { id: 1, type: '매수', stock: 'NAVER', quantity: 3, price: 200000, status: '미체결' },
    ],
    battles: [
      { name: 'Alpha Team vs Beta Squad', profitRate: 15.2, rank: 1 },
      { name: 'Team C vs Team D', profitRate: -3.5, rank: 4 },
    ],
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

              // Keychain의 토큰 및 사용자 정보 삭제
              await clearAllTokens();

              // Google Sign-In 세션 종료
              await GoogleSignin.signOut();

              // 로그인 화면으로 이동
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });

              Alert.alert('로그아웃 완료', '다시 로그인해주세요.');
            } catch (error: any) {
              console.error('Logout Error:', error);
              
              // 백엔드 요청 실패해도 로컬 데이터는 삭제하고 로그아웃 처리
              await clearAllTokens();
              await GoogleSignin.signOut();
              
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
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
        school: userInfo.school || '',
        company: userInfo.company || '',
      });
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('ko-KR');
  };

  const renderInfoTab = () => {
    if (loading) {
      return (
        <View style={[styles.card, styles.shadow, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF', alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }]}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={[{ color: colors.text, marginTop: 16 }]}>로딩 중...</Text>
        </View>
      );
    }

    if (!userInfo) {
      return (
        <View style={[styles.card, styles.shadow, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF', alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }]}>
          <Text style={[{ color: colors.text }]}>사용자 정보를 불러올 수 없습니다.</Text>
        </View>
      );
    }

    return (
    <View>
      <View style={[styles.card, styles.shadow, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
        <ThemedText type="subtitle" style={styles.cardTitle}>내 정보</ThemedText>

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.icon }]}>이메일</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{userInfo.email}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.icon }]}>닉네임</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{userInfo.nickname}</Text>
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
              style={[styles.infoInput, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC', color: colors.text }]}
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
              style={[styles.infoInput, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC', color: colors.text }]}
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
                style={[styles.button, { backgroundColor: colorScheme === 'dark' ? '#334155' : '#E5E7EB' }]}
                onPress={handleCancelEdit}>
                <Text style={[styles.buttonText, { color: colors.text }]}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#6366F1' }]}
                onPress={handleEditProfile}>
                <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>저장</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#6366F1' }]}
              onPress={handleEditProfile}>
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>프로필 수정</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.logoutButton, {
          backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF',
          borderColor: '#EF4444'
        }]}
        onPress={handleLogout}>
        <Text style={{ color: '#EF4444', fontSize: 16, fontWeight: '600' }}>로그아웃</Text>
      </TouchableOpacity>
    </View>
  );
};

  const renderAccountTab = () => (
    <View>
      {/* 계좌 요약 */}
      <View style={[styles.card, styles.shadow, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
        <ThemedText type="subtitle" style={styles.cardTitle}>계좌 요약</ThemedText>
        <View style={styles.accountSummary}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.icon }]}>예수금</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>₩{formatNumber(accountData.deposit)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.icon }]}>평가금액</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>₩{formatNumber(accountData.totalValue)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.icon }]}>총 보유자산</Text>
            <Text style={[styles.summaryValue, { color: '#6366F1', fontWeight: '700' }]}>
              ₩{formatNumber(accountData.totalAssets)}
            </Text>
          </View>
        </View>
      </View>

      {/* 보유 종목 */}
      <View style={[styles.card, styles.shadow, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
        <ThemedText type="subtitle" style={styles.cardTitle}>보유 종목</ThemedText>
        {accountData.stocks.map((stock, index) => (
          <View key={index} style={[styles.stockItem, index > 0 && { borderTopWidth: 1, borderTopColor: colorScheme === 'dark' ? '#334155' : '#E5E7EB' }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.stockName, { color: colors.text }]}>{stock.name}</Text>
              <Text style={[styles.stockDetail, { color: colors.icon }]}>
                {stock.quantity}주 • 평균 ₩{formatNumber(stock.avgPrice)}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.stockProfit, { color: stock.profitRate > 0 ? '#10B981' : '#EF4444' }]}>
                {stock.profitRate > 0 ? '+' : ''}{stock.profitRate}%
              </Text>
              <Text style={[styles.stockDetail, { color: stock.profitRate > 0 ? '#10B981' : '#EF4444' }]}>
                {stock.profit > 0 ? '+' : ''}₩{formatNumber(stock.profit)}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* 거래내역 */}
      <View style={[styles.card, styles.shadow, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
        <ThemedText type="subtitle" style={styles.cardTitle}>거래내역</ThemedText>
        {accountData.transactions.map((tx, index) => (
          <View key={index} style={[styles.transactionItem, index > 0 && { borderTopWidth: 1, borderTopColor: colorScheme === 'dark' ? '#334155' : '#E5E7EB' }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.transactionType, { color: tx.type === '매수' ? '#EF4444' : '#10B981' }]}>
                {tx.type}
              </Text>
              <Text style={[styles.transactionDetail, { color: colors.icon }]}>{tx.date}</Text>
              {tx.stock !== '-' && (
                <Text style={[styles.transactionDetail, { color: colors.text }]}>
                  {tx.stock} {tx.quantity}주 @₩{formatNumber(tx.price)}
                </Text>
              )}
            </View>
            <Text style={[styles.transactionAmount, { color: tx.total > 0 ? '#10B981' : colors.text }]}>
              {tx.total > 0 ? '+' : ''}₩{formatNumber(Math.abs(tx.total))}
            </Text>
          </View>
        ))}
      </View>

      {/* 미체결 주문 */}
      <View style={[styles.card, styles.shadow, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
        <ThemedText type="subtitle" style={styles.cardTitle}>미체결 주문</ThemedText>
        {accountData.pendingOrders.map((order, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.pendingItem, index > 0 && { borderTopWidth: 1, borderTopColor: colorScheme === 'dark' ? '#334155' : '#E5E7EB' }]}
            onPress={() => Alert.alert('미체결 주문', '투자 페이지로 이동')}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.stockName, { color: colors.text }]}>{order.stock}</Text>
              <Text style={[styles.stockDetail, { color: colors.icon }]}>
                {order.type} {order.quantity}주 @₩{formatNumber(order.price)}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: '#F59E0B' }]}>
              <Text style={styles.statusText}>{order.status}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* 대결별 수익률 */}
      <View style={[styles.card, styles.shadow, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
        <ThemedText type="subtitle" style={styles.cardTitle}>대결별 수익률</ThemedText>
        {accountData.battles.map((battle, index) => (
          <View key={index} style={[styles.battleItem, index > 0 && { borderTopWidth: 1, borderTopColor: colorScheme === 'dark' ? '#334155' : '#E5E7EB' }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.stockName, { color: colors.text }]}>{battle.name}</Text>
              <Text style={[styles.stockDetail, { color: colors.icon }]}>순위: {battle.rank}위</Text>
            </View>
            <Text style={[styles.stockProfit, { color: battle.profitRate > 0 ? '#10B981' : '#EF4444' }]}>
              {battle.profitRate > 0 ? '+' : ''}{battle.profitRate}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderDepositTab = () => (
    <View>
      <View style={[styles.card, styles.shadow, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
        <ThemedText type="subtitle" style={styles.cardTitle}>계좌에 돈 추가</ThemedText>
        <Text style={[styles.description, { color: colors.icon }]}>
          광고를 시청하거나 결제를 통해 가상 자산을 추가할 수 있습니다.
        </Text>

        <TouchableOpacity style={[styles.depositButton, { backgroundColor: '#10B981' }]}>
          <IconSymbol size={20} name="play.circle.fill" color="#FFFFFF" />
          <Text style={styles.depositButtonText}>광고 보고 ₩100,000 받기</Text>
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: colorScheme === 'dark' ? '#334155' : '#E5E7EB', marginVertical: 20 }]} />

        <Text style={[styles.sectionTitle, { color: colors.text }]}>결제하기</Text>

        <TouchableOpacity style={[styles.paymentOption, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' }]}>
          <View>
            <Text style={[styles.paymentAmount, { color: colors.text }]}>₩1,000,000</Text>
            <Text style={[styles.paymentPrice, { color: colors.icon }]}>₩1,000</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.paymentOption, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' }]}>
          <View>
            <Text style={[styles.paymentAmount, { color: colors.text }]}>₩5,000,000</Text>
            <Text style={[styles.paymentPrice, { color: colors.icon }]}>₩5,000</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: '#6366F1' }]}>
            <Text style={styles.badgeText}>인기</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.paymentOption, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' }]}>
          <View>
            <Text style={[styles.paymentAmount, { color: colors.text }]}>₩10,000,000</Text>
            <Text style={[styles.paymentPrice, { color: colors.icon }]}>₩10,000</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' }]}>
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>마이페이지</ThemedText>
          {isAdmin && (
            <TouchableOpacity
              style={[styles.adminButton, { backgroundColor: '#8B5CF6' }]}
              onPress={() => Alert.alert('어드민', '어드민 페이지로 이동 (웹)')}>
              <IconSymbol size={16} name="shield.fill" color="#FFFFFF" />
              <Text style={styles.adminButtonText}>어드민 대시보드</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 탭 버튼 */}
        <View style={[styles.tabContainer, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'info' && styles.activeTab]}
            onPress={() => setActiveTab('info')}>
            <Text style={[styles.tabText, { color: activeTab === 'info' ? '#6366F1' : colors.icon }]}>내 정보</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'account' && styles.activeTab]}
            onPress={() => setActiveTab('account')}>
            <Text style={[styles.tabText, { color: activeTab === 'account' ? '#6366F1' : colors.icon }]}>내 계좌</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'deposit' && styles.activeTab]}
            onPress={() => setActiveTab('deposit')}>
            <Text style={[styles.tabText, { color: activeTab === 'deposit' ? '#6366F1' : colors.icon }]}>돈 추가</Text>
          </TouchableOpacity>
        </View>

        {/* 탭 컨텐츠 */}
        {activeTab === 'info' && renderInfoTab()}
        {activeTab === 'account' && renderAccountTab()}
        {activeTab === 'deposit' && renderDepositTab()}

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
});
