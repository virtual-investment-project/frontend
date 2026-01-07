import { ThemedText } from '../components/ThemedText';
import { IconSymbol } from '../components/ui/IconSymbol';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/useColorScheme';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Alert, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// 임시 데이터 - 추후 API로 대체
const topRankings = {
  profitRate: [
    { rank: 1, name: '투자의 신', value: '+45.2%', team: 'Alpha Team' },
    { rank: 2, name: '수익마스터', value: '+38.7%', team: 'Beta Squad' },
    { rank: 3, name: '투자왕', value: '+32.1%', team: 'Gamma Group' },
  ],
  profitAmount: [
    { rank: 1, name: '대박투자', value: '₩12,450,000', team: 'Delta Team' },
    { rank: 2, name: '수익왕', value: '₩9,870,000', team: 'Epsilon Force' },
    { rank: 3, name: '투자고수', value: '₩7,230,000', team: 'Zeta Club' },
  ],
};

const recentBattles = [
  { id: 1, team1: 'Alpha Team', team2: 'Beta Squad', status: '진행중', daysLeft: 5 },
  { id: 2, team1: 'Gamma Group', team2: 'Delta Team', status: '진행중', daysLeft: 3 },
  { id: 3, team1: 'Epsilon Force', team2: 'Zeta Club', status: '종료', winner: 'Epsilon Force' },
];

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  // TODO: 실제 로그인 상태 관리로 대체
  const isLoggedIn = false; // 임시로 false로 설정

  const handleProfilePress = () => {
    if (isLoggedIn) {
      // 로그인 되어 있으면 마이페이지로
      navigation.navigate('My');
    } else {
      // 로그인 안 되어 있으면 로그인 페이지로
      navigation.navigate('Login');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' }]}>
      {/* 고정 네비게이션 바 */}
      <View style={[styles.fixedNavBar, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
        <View style={styles.navBar}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => Alert.alert('알림', '알림 목록')}>
            <View style={styles.notificationIcon}>
              <IconSymbol
                size={24}
                name="bell.fill"
                color={colorScheme === 'dark' ? '#FFFFFF' : '#334155'}
              />
              {/* 알림 배지 */}
              <View style={styles.notificationBadge}>
                <ThemedText style={styles.badgeText}>3</ThemedText>
              </View>
            </View>
          </TouchableOpacity>

          {/* 가운데 마이페이지 버튼 (임시) */}
          <TouchableOpacity
            style={styles.centerButton}
            onPress={() => navigation.navigate('My')}>
            <ThemedText style={[styles.centerButtonText, { color: colorScheme === 'dark' ? '#FFFFFF' : '#6366F1' }]}>
              마이페이지
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={handleProfilePress}>
            <View style={styles.profileIconContainer}>
              <IconSymbol
                size={24}
                name="person.circle.fill"
                color={colorScheme === 'dark' ? '#FFFFFF' : '#6366F1'}
              />
            </View>
          </TouchableOpacity>
        </View>
        {/* 구분선 */}
        <View style={[styles.navBarDivider, {
          backgroundColor: colorScheme === 'dark' ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.15)'
        }]} />
      </View>

      {/* 스크롤 가능한 컨텐츠 */}
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer}>
        {/* 헤더 타이틀 섹션 */}
        <View style={styles.headerWrapper}>
          <LinearGradient
            colors={colorScheme === 'dark' ? ['#1E293B', '#334155'] : ['#6366F1', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}>
            <View style={styles.headerContent}>
              <ThemedText type="title" style={styles.headerTitle}>
                💎 InvestBattle
              </ThemedText>
              <ThemedText style={styles.headerSubtitle}>
                그룹 대결 모의투자 플랫폼
              </ThemedText>
            </View>
          </LinearGradient>
        </View>

        {/* 앱 설명 섹션 */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            💡 앱 소개
          </ThemedText>
          <View style={[styles.card, styles.shadow, {
            backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF'
          }]}>
            <ThemedText style={styles.description}>
              InvestBattle은 친구들과 함께 팀을 만들어{'\n'}
              실시간 모의투자 대결을 즐길 수 있는 플랫폼입니다.
            </ThemedText>
            <View style={styles.featureGrid}>
              <View style={styles.featureItem}>
                <ThemedText style={styles.featureIcon}>📈</ThemedText>
                <ThemedText style={styles.featureText}>실시간 시뮬레이션</ThemedText>
              </View>
              <View style={styles.featureItem}>
                <ThemedText style={styles.featureIcon}>👥</ThemedText>
                <ThemedText style={styles.featureText}>팀별 대결</ThemedText>
              </View>
              <View style={styles.featureItem}>
                <ThemedText style={styles.featureIcon}>🏆</ThemedText>
                <ThemedText style={styles.featureText}>실시간 랭킹</ThemedText>
              </View>
              <View style={styles.featureItem}>
                <ThemedText style={styles.featureIcon}>💰</ThemedText>
                <ThemedText style={styles.featureText}>1억원 시작</ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* 수익률 TOP 3 */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            🏆 수익률 TOP 3
          </ThemedText>
          {topRankings.profitRate.map((item) => (
            <View
              key={item.rank}
              style={[
                styles.rankCard,
                styles.shadow,
                { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' },
              ]}>
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
                  <ThemedText type="defaultSemiBold" style={styles.userName}>{item.name}</ThemedText>
                  <ThemedText style={[styles.teamText, { color: colors.icon }]}>
                    {item.team}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.profitRateContainer}>
                <ThemedText type="defaultSemiBold" style={styles.profitRate}>
                  {item.value}
                </ThemedText>
              </View>
            </View>
          ))}
        </View>

        {/* 수익금 TOP 3 */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            💰 수익금 TOP 3
          </ThemedText>
          {topRankings.profitAmount.map((item) => (
            <View
              key={item.rank}
              style={[
                styles.rankCard,
                styles.shadow,
                { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' },
              ]}>
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
                  <ThemedText type="defaultSemiBold" style={styles.userName}>{item.name}</ThemedText>
                  <ThemedText style={[styles.teamText, { color: colors.icon }]}>
                    {item.team}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.profitAmountContainer}>
                <ThemedText type="defaultSemiBold" style={styles.profitAmount}>
                  {item.value}
                </ThemedText>
              </View>
            </View>
          ))}
        </View>

        {/* 대결 정보 */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            ⚔️ 진행중인 대결
          </ThemedText>
          {recentBattles.map((battle) => (
            <View
              key={battle.id}
              style={[
                styles.battleCard,
                styles.shadow,
                { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' },
              ]}>
              <View style={styles.battleTeams}>
                <ThemedText type="defaultSemiBold" style={styles.teamName}>
                  {battle.team1}
                </ThemedText>
                <View style={styles.vsContainer}>
                  <ThemedText style={styles.vsText}>VS</ThemedText>
                </View>
                <ThemedText type="defaultSemiBold" style={styles.teamName}>
                  {battle.team2}
                </ThemedText>
              </View>
              <View style={styles.battleStatus}>
                {battle.status === '진행중' ? (
                  <>
                    <View style={[styles.statusBadge, styles.ongoingBadge]}>
                      <ThemedText style={styles.statusText}>⏱ 진행중</ThemedText>
                    </View>
                    <ThemedText style={[styles.daysLeft, { color: colors.icon }]}>
                      {battle.daysLeft}일 남음
                    </ThemedText>
                  </>
                ) : (
                  <>
                    <View style={[styles.statusBadge, styles.endedBadge]}>
                      <ThemedText style={styles.statusText}>✓ 종료</ThemedText>
                    </View>
                    <ThemedText style={[styles.winner, { color: '#10B981' }]}>
                      🎉 {battle.winner}
                    </ThemedText>
                  </>
                )}
              </View>
            </View>
          ))}
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
  fixedNavBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: Platform.OS === 'ios' ? 44 : 0,
    paddingBottom: 8,
    paddingHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    height: 44,
  },
  centerButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  navBarDivider: {
    height: 1,
    width: '100%',
    marginTop: 8,
    opacity: 0.6,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingTop: Platform.OS === 'ios' ? 105 : 61,
  },
  headerWrapper: {
    marginBottom: 24,
  },
  headerGradient: {
    paddingTop: 30,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  navButton: {
    padding: 6,
  },
  notificationIcon: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  profileIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 8,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 8,
  },
  shadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  description: {
    lineHeight: 26,
    fontSize: 16,
    marginBottom: 20,
    opacity: 0.8,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  featureIcon: {
    fontSize: 28,
  },
  featureText: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.8,
  },
  rankCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
  },
  rankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  rankBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  goldBadge: {
    backgroundColor: '#FFD700',
  },
  silverBadge: {
    backgroundColor: '#E8E8E8',
  },
  bronzeBadge: {
    backgroundColor: '#CD7F32',
  },
  rankNumber: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
  },
  rankInfo: {
    gap: 5,
    flex: 1,
  },
  userName: {
    fontSize: 16,
  },
  teamText: {
    fontSize: 13,
    opacity: 0.7,
  },
  profitRateContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  profitRate: {
    color: '#10B981',
    fontSize: 17,
    fontWeight: '700',
  },
  profitAmountContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  profitAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  battleCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    gap: 16,
  },
  battleTeams: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  teamName: {
    fontSize: 16,
  },
  vsContainer: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  vsText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#6366F1',
    letterSpacing: 1,
  },
  battleStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.2)',
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  ongoingBadge: {
    backgroundColor: '#3B82F6',
  },
  endedBadge: {
    backgroundColor: '#10B981',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  daysLeft: {
    fontSize: 14,
    fontWeight: '600',
  },
  winner: {
    fontSize: 14,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 50,
  },
});
