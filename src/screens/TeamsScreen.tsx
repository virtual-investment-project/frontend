import { ThemedText } from '../components/ThemedText';
import { IconSymbol } from '../components/ui/IconSymbol';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/useColorScheme';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useState, useCallback } from 'react';
import { getAllBattles } from '../services/battleService';
import { BattleListResponse, BattleStatus } from '../types/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, RefreshControl } from 'react-native';

export default function TeamsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [battles, setBattles] = useState<BattleListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 배틀 목록 불러오기
  const fetchBattles = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const data = await getAllBattles();
      console.log('배틀 목록 조회 성공:', data);
      setBattles(data);
    } catch (err: any) {
      console.error('배틀 목록 조회 오류:', err);
      console.error('오류 상세:', err.code, err.message);
      
      // 에러 메시지를 더 상세하게 표시
      let errorMsg = '배틀 목록을 불러오는데 실패했습니다.';
      if (err.message === 'Network Error') {
        errorMsg = '네트워크 오류: 서버에 연결할 수 없습니다.\n\n백엔드가 실행 중인지 확인하세요.';
      } else if (err.code === 'ECONNABORTED') {
        errorMsg = '연결 시간 초과: 서버 응답이 너무 느립니다.';
      } else if (err.response) {
        errorMsg = `서버 오류: ${err.response.status}`;
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // 화면 포커스될 때마다 데이터 새로고침
  useFocusEffect(
    useCallback(() => {
      fetchBattles();
    }, [fetchBattles])
  );

  // 상태 배지 설정
  const getStatusBadge = (status: BattleStatus) => {
    const config = {
      YET: { text: '예정', color: '#F59E0B' },
      PROGRESS: { text: '진행중', color: '#10B981' },
      END: { text: '종료', color: '#6B7280' },
    };
    return config[status];
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  // 총 참가자 수 계산
  const getTotalParticipants = (teams: BattleListResponse['teams']) => {
    return teams.reduce((sum, team) => sum + team.memberCount, 0);
  };

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' }]}>
      <ScrollView 
        style={styles.scrollContent} 
        contentContainerStyle={styles.scrollContentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchBattles(true)}
            tintColor={colors.icon}
          />
        }>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <ThemedText type="title" style={styles.title}>배틀</ThemedText>
              <ThemedText style={styles.subtitle}>실시간 수익률 대결을 확인하세요</ThemedText>
            </View>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: '#6366F1' }]}
              onPress={() => navigation.navigate('CreateBattle')}>
              <IconSymbol size={20} name="plus" color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 로딩 상태 */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={[styles.loadingText, { color: colors.icon }]}>
              배틀 목록을 불러오는 중...
            </Text>
          </View>
        )}

        {/* 에러 상태 */}
        {error && !loading && (
          <View style={styles.errorContainer}>
            <IconSymbol size={48} name="exclamationmark.triangle" color="#EF4444" />
            <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => fetchBattles()}>
              <Text style={styles.retryButtonText}>다시 시도</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 대결 목록 */}
        {!loading && !error && (
          <View style={styles.battlesContainer}>
            {battles.map((battle) => {
              const statusBadge = getStatusBadge(battle.status);
              const sortedTeams = [...battle.teams].sort((a, b) => b.rate - a.rate);
              const participantCount = getTotalParticipants(battle.teams);

              return (
                <TouchableOpacity
                  key={battle.id}
                  style={[
                    styles.battleCard,
                    styles.shadow,
                    { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }
                  ]}
                  onPress={() => navigation.navigate('BattleDetail', { battleId: battle.id })}>

                  {/* 카드 헤더 */}
                  <View style={styles.battleHeader}>
                    <View style={styles.battleTitleRow}>
                      <Text style={[styles.battleTitle, { color: colors.text }]} numberOfLines={2}>
                        {battle.name || '이름 없는 배틀'}
                      </Text>
                      <View style={[styles.statusBadge, { backgroundColor: statusBadge.color }]}>
                        <Text style={styles.statusText}>{statusBadge.text}</Text>
                      </View>
                    </View>

                    <View style={styles.battleMeta}>
                      <View style={styles.metaItem}>
                        <IconSymbol size={14} name="calendar" color={colors.icon} />
                        <Text style={[styles.metaText, { color: colors.icon }]}>
                          {formatDate(battle.startAt)} - {formatDate(battle.endAt)}
                        </Text>
                      </View>
                      <View style={styles.metaItem}>
                        <IconSymbol size={14} name="person.2.fill" color={colors.icon} />
                        <Text style={[styles.metaText, { color: colors.icon }]}>
                          {participantCount}명 참여
                        </Text>
                      </View>
                      {battle.ticker && (
                        <View style={styles.metaItem}>
                          <IconSymbol size={14} name="chart.line.uptrend.xyaxis" color={colors.icon} />
                          <Text style={[styles.metaText, { color: colors.icon }]}>
                            {battle.ticker}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* 팀 순위 */}
                  <View style={styles.teamsSection}>
                    {sortedTeams.length > 0 ? (
                      sortedTeams
                        .slice(0, 3)
                        .map((team, index) => (
                          <View
                            key={team.id}
                            style={[
                              styles.teamRow,
                              index === 0 && styles.topTeamRow,
                              index > 0 && {
                                borderTopWidth: 1,
                                borderTopColor: colorScheme === 'dark' ? '#334155' : '#E5E7EB'
                              }
                            ]}>

                            {/* 순위 배지 */}
                            <View style={[
                              styles.rankBadge,
                              {
                                backgroundColor: index === 0
                                  ? 'rgba(99, 102, 241, 0.1)'
                                  : colorScheme === 'dark' ? '#0F172A' : '#F8FAFC'
                              }
                            ]}>
                              <Text style={[
                                styles.rankText,
                                { color: index === 0 ? '#6366F1' : colors.icon }
                              ]}>
                                {index + 1}
                              </Text>
                            </View>

                            {/* 팀 이름 */}
                            <Text style={[
                              styles.teamName,
                              { color: colors.text },
                              index === 0 && { fontWeight: '700' }
                            ]}>
                              {team.name}
                            </Text>

                            {/* 수익률 */}
                            <View style={styles.profitContainer}>
                              {battle.status !== 'YET' && (
                                <>
                                  {index === 0 && (
                                    <IconSymbol
                                      size={16}
                                      name="crown.fill"
                                      color="#F59E0B"
                                      style={{ marginRight: 4 }}
                                    />
                                  )}
                                  <Text style={[
                                    styles.profitRate,
                                    {
                                      color: team.rate > 0 ? '#10B981' :
                                        team.rate < 0 ? '#EF4444' : colors.icon,
                                      fontWeight: index === 0 ? '800' : '600',
                                    }
                                  ]}>
                                    {team.rate > 0 ? '+' : ''}{team.rate.toFixed(1)}%
                                  </Text>
                                </>
                              )}
                              {battle.status === 'YET' && (
                                <Text style={[styles.upcomingText, { color: colors.icon }]}>
                                  대기중
                                </Text>
                              )}
                            </View>
                          </View>
                        ))
                    ) : (
                      <View style={styles.noTeamsContainer}>
                        <Text style={[styles.noTeamsText, { color: colors.icon }]}>
                          아직 참가한 팀이 없습니다
                        </Text>
                      </View>
                    )}

                    {sortedTeams.length > 3 && (
                      <Text style={[styles.moreTeamsText, { color: colors.icon }]}>
                        +{sortedTeams.length - 3}개 팀 더보기
                      </Text>
                    )}
                  </View>

                  {/* 카드 푸터 */}
                  <View style={styles.battleFooter}>
                    <View style={[styles.categoryTag, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' }]}>
                      <Text style={[styles.categoryText, { color: colors.icon }]}>
                        {battle.type === 'ALL' ? '전체 대결' : '일반 대결'}
                      </Text>
                    </View>
                    <View style={styles.viewDetailsButton}>
                      <Text style={[styles.viewDetailsText, { color: '#6366F1' }]}>
                        상세보기
                      </Text>
                      <IconSymbol size={14} name="chevron.right" color="#6366F1" />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {!loading && !error && battles.length === 0 && (
          <View style={styles.emptyState}>
            <IconSymbol size={48} name="tray" color={colors.icon} />
            <Text style={[styles.emptyText, { color: colors.icon }]}>
              아직 배틀이 없습니다
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('CreateBattle')}>
              <Text style={styles.createButtonText}>새 배틀 만들기</Text>
            </TouchableOpacity>
          </View>
        )}

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
    paddingTop: 105,
    paddingHorizontal: 20,
  },
  header: {
    paddingVertical: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  battlesContainer: {
    gap: 16,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  battleCard: {
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  battleHeader: {
    gap: 12,
  },
  battleTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  battleTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    lineHeight: 24,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  battleMeta: {
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
  },
  teamsSection: {
    gap: 0,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  topTeamRow: {
    paddingVertical: 14,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 13,
    fontWeight: '700',
  },
  teamName: {
    flex: 1,
    fontSize: 15,
  },
  profitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profitRate: {
    fontSize: 16,
  },
  upcomingText: {
    fontSize: 13,
  },
  moreTeamsText: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 8,
  },
  battleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.1)',
  },
  categoryTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
  },
  bottomSpacer: {
    height: 40,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  errorText: {
    fontSize: 15,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  noTeamsContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  noTeamsText: {
    fontSize: 14,
  },
});
