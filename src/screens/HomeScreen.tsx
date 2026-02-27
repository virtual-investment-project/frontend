import React, { useCallback, useEffect, useState } from 'react';
import { ThemedText } from '../components/ThemedText';
import { IconSymbol } from '../components/ui/IconSymbol';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/useColorScheme';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { getAllBattles } from '../services/battleService';
import { getTopAccounts } from '../services/rankingsService';
import { AccountRankingResponse, BattleListResponse } from '../types/api';
import { getAccessToken } from '../utils/tokenStorage';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// 개인 계좌 수익률 랭킹 표시용 타입
type AccountRankingItem = AccountRankingResponse & { rank: number };

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  const [battles, setBattles] = useState<BattleListResponse[]>([]);
  const [topAccounts, setTopAccounts] = useState<AccountRankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 배틀 데이터 로드
  const loadData = useCallback(async () => {
    try {
      const [battlesData, rankingData] = await Promise.all([
        getAllBattles(),
        getTopAccounts(3),
      ]);

      setBattles(battlesData);

      const ranked: AccountRankingItem[] = rankingData.map((item, index) => ({
        ...item,
        rank: index + 1,
      }));
      setTopAccounts(ranked);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 로그인 상태 확인
  const checkLoginStatus = useCallback(async () => {
    try {
      const token = await getAccessToken();
      console.log('[HOME] 토큰 확인:', { hasToken: !!token, tokenLength: token?.length });
      setIsLoggedIn(!!token);
    } catch (error) {
      console.error('[HOME] 토큰 확인 중 오류:', error);
      setIsLoggedIn(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    checkLoginStatus();
  }, [loadData, checkLoginStatus]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    await checkLoginStatus();
    setRefreshing(false);
  }, [loadData, checkLoginStatus]);

  // 진행중인 배틀만 필터링 (최대 2개)
  const activeBattles = battles
    .filter((b) => b.status === 'PROGRESS')
    .slice(0, 2);

  // 참여 가능한 배틀 (YET 상태, 최대 3개)
  const availableBattles = battles
    .filter((b) => b.status === 'YET')
    .slice(0, 3);

  // 남은 일수 계산
  const getDaysLeft = (endAt: string) => {
    const end = new Date(endAt);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  // 수익률 포맷팅
  const formatRate = (rate: number) => {
    const sign = rate >= 0 ? '+' : '';
    return `${sign}${rate.toFixed(2)}%`;
  };

  const handleProfilePress = async () => {
    console.log('[PROFILE] 프로필 버튼 클릭:', { isLoggedIn });
    if (isLoggedIn) {
      navigation.navigate('My');
    } else {
      navigation.navigate('Login');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
      {/* 헤더 */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
        <View style={styles.headerRow}>
          <ThemedText style={[styles.logo, { color: colors.tint }]}>💎 InvestBattle</ThemedText>
          <TouchableOpacity onPress={handleProfilePress} style={styles.profileButton}>
            <IconSymbol size={28} name="person.circle.fill" color={colors.tint} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
        }>
        {/* 히어로 배너 */}
        <LinearGradient
          colors={isDark ? ['#4F46E5', '#7C3AED'] : ['#6366F1', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBanner}>
          <ThemedText style={styles.heroTitle}>팀과 함께{'\n'}투자 대결을 시작하세요</ThemedText>
          <ThemedText style={styles.heroSubtitle}>실시간 모의투자 배틀 플랫폼</ThemedText>
        </LinearGradient>

        {/* 개인 계좌 수익률 TOP 3 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={[styles.sectionTitle, { color: isDark ? '#F1F5F9' : '#1E293B' }]}>
              🏆 개인 수익률 TOP 3
            </ThemedText>
          </View>

          {topAccounts.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
              <ThemedText style={[styles.emptyText, { color: colors.icon }]}>
                아직 진행 중인 배틀이 없습니다
              </ThemedText>
            </View>
          ) : (
            topAccounts.map((item) => (
              <View
                key={`${item.accountId}-${item.rank}`}
                style={[styles.rankCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
                <View style={styles.rankLeft}>
                  <View
                    style={[
                      styles.rankBadge,
                      item.rank === 1 && styles.goldBadge,
                      item.rank === 2 && styles.silverBadge,
                      item.rank === 3 && styles.bronzeBadge,
                    ]}>
                    <ThemedText style={styles.rankNumber}>{item.rank}</ThemedText>
                  </View>
                  <View style={styles.rankInfo}>
                    <ThemedText style={[styles.teamNameText, { color: isDark ? '#F1F5F9' : '#1E293B' }]}>
                      {item.userName}
                    </ThemedText>
                    <ThemedText style={[styles.battleNameText, { color: colors.icon }]}>
                      {item.accountName}
                    </ThemedText>
                  </View>
                </View>
                <View style={[styles.rateContainer, { backgroundColor: item.returnRate >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
                  <ThemedText style={[styles.rateText, { color: item.returnRate >= 0 ? '#10B981' : '#EF4444' }]}>
                    {formatRate(item.returnRate)}
                  </ThemedText>
                </View>
              </View>
            ))
          )}
        </View>

        {/* 진행중인 대결 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={[styles.sectionTitle, { color: isDark ? '#F1F5F9' : '#1E293B' }]}>
              ⚔️ 진행중인 대결
            </ThemedText>
          </View>

          {activeBattles.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
              <ThemedText style={[styles.emptyText, { color: colors.icon }]}>
                진행 중인 대결이 없습니다
              </ThemedText>
            </View>
          ) : (
            activeBattles.map((battle) => (
              <TouchableOpacity
                key={battle.id}
                style={[styles.battleCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}
                onPress={() => navigation.navigate('BattleDetail', { battleId: battle.id })}
                activeOpacity={0.7}>
                <View style={styles.battleHeader}>
                  <ThemedText style={[styles.battleTitle, { color: isDark ? '#F1F5F9' : '#1E293B' }]}>
                    {battle.name}
                  </ThemedText>
                  <View style={styles.statusBadge}>
                    <ThemedText style={styles.statusText}>진행중</ThemedText>
                  </View>
                </View>

                <View style={styles.battleInfo}>
                  <View style={styles.battleInfoItem}>
                    <ThemedText style={[styles.infoLabel, { color: colors.icon }]}>종목</ThemedText>
                    <ThemedText style={[styles.infoValue, { color: isDark ? '#E2E8F0' : '#334155' }]}>
                      {battle.ticker}
                    </ThemedText>
                  </View>
                  <View style={styles.battleInfoItem}>
                    <ThemedText style={[styles.infoLabel, { color: colors.icon }]}>팀 수</ThemedText>
                    <ThemedText style={[styles.infoValue, { color: isDark ? '#E2E8F0' : '#334155' }]}>
                      {battle.teams.length}팀
                    </ThemedText>
                  </View>
                  <View style={styles.battleInfoItem}>
                    <ThemedText style={[styles.infoLabel, { color: colors.icon }]}>남은 기간</ThemedText>
                    <ThemedText style={[styles.infoValue, { color: colors.tint }]}>
                      D-{getDaysLeft(battle.endAt)}
                    </ThemedText>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* 참여 가능한 배틀 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={[styles.sectionTitle, { color: isDark ? '#F1F5F9' : '#1E293B' }]}>
              🎯 참여 가능한 배틀
            </ThemedText>
            <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'Teams' })}>
              <ThemedText style={[styles.seeAllText, { color: colors.tint }]}>전체보기</ThemedText>
            </TouchableOpacity>
          </View>

          {availableBattles.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
              <ThemedText style={[styles.emptyText, { color: colors.icon }]}>
                참여 가능한 배틀이 없습니다
              </ThemedText>
            </View>
          ) : (
            availableBattles.map((battle) => (
              <TouchableOpacity
                key={battle.id}
                style={[styles.battleCard, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}
                onPress={() => navigation.navigate('BattleDetail', { battleId: battle.id })}
                activeOpacity={0.7}>
                <View style={styles.battleHeader}>
                  <ThemedText style={[styles.battleTitle, { color: isDark ? '#F1F5F9' : '#1E293B' }]}>
                    {battle.name}
                  </ThemedText>
                  <View style={[styles.statusBadge, { backgroundColor: '#10B981' }]}>
                    <ThemedText style={styles.statusText}>모집중</ThemedText>
                  </View>
                </View>

                <View style={styles.battleInfo}>
                  <View style={styles.battleInfoItem}>
                    <ThemedText style={[styles.infoLabel, { color: colors.icon }]}>종목</ThemedText>
                    <ThemedText style={[styles.infoValue, { color: isDark ? '#E2E8F0' : '#334155' }]}>
                      {battle.ticker}
                    </ThemedText>
                  </View>
                  <View style={styles.battleInfoItem}>
                    <ThemedText style={[styles.infoLabel, { color: colors.icon }]}>시작일</ThemedText>
                    <ThemedText style={[styles.infoValue, { color: isDark ? '#E2E8F0' : '#334155' }]}>
                      {new Date(battle.startAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                    </ThemedText>
                  </View>
                  <View style={styles.battleInfoItem}>
                    <ThemedText style={[styles.infoLabel, { color: colors.icon }]}>팀 수</ThemedText>
                    <ThemedText style={[styles.infoValue, { color: colors.tint }]}>
                      {battle.teams.length}팀
                    </ThemedText>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
    paddingBottom: 12,
    paddingHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  profileButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  heroBanner: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 28,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 34,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyCard: {
    borderRadius: 14,
    padding: 32,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  emptyText: {
    fontSize: 14,
  },
  rankCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  rankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goldBadge: {
    backgroundColor: '#F59E0B',
  },
  silverBadge: {
    backgroundColor: '#9CA3AF',
  },
  bronzeBadge: {
    backgroundColor: '#B45309',
  },
  rankNumber: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  rankInfo: {
    flex: 1,
    gap: 2,
  },
  teamNameText: {
    fontSize: 15,
    fontWeight: '600',
  },
  battleNameText: {
    fontSize: 12,
  },
  rateContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  rateText: {
    fontSize: 14,
    fontWeight: '700',
  },
  battleCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  battleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  battleTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  statusBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  battleInfo: {
    flexDirection: 'row',
    gap: 16,
  },
  battleInfoItem: {
    gap: 2,
  },
  infoLabel: {
    fontSize: 11,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 20,
  },
});
