import { ThemedText } from '../components/ThemedText';
import { IconSymbol } from '../components/ui/IconSymbol';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/useColorScheme';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useState, useCallback } from 'react';
import apiClient from '../api/axiosInstance';
import { getBattleById, getBattleTeamProfits, getBattleAccountProfits } from '../services/battleService';
import { getTeamsByBattleId, getTeamMembers } from '../services/teamService';
import { getCommentsByBattleId, createComment, deleteComment } from '../services/commentService';
import { getBattleAccount, getPersonalAccountProfit, getBattleAccountProfit } from '../services/accountService';
import { getRole, getMyUserId } from '../utils/tokenStorage';
import { BattleResponse, BattleStatus, TeamResponse, TeamMemberResponse, TeamProfitResponse, CommentResponse, AccountProfitResponse } from '../types/api';
import JoinBattleModal from '../components/JoinBattleModal';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type BattleDetailRouteProp = RouteProp<RootStackParamList, 'BattleDetail'>;
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';

// 팀 색상 배열
const TEAM_COLORS = ['#10B981', '#EF4444', '#6366F1', '#F59E0B', '#8B5CF6', '#EC4899'];

// 상태 텍스트 및 색상 헬퍼
const getStatusText = (status: BattleStatus): string => {
  switch (status) {
    case 'YET': return '대기중';
    case 'PROGRESS': return '진행중';
    case 'END': return '종료';
    default: return '알수없음';
  }
};

const getStatusColor = (status: BattleStatus): string => {
  switch (status) {
    case 'YET': return '#F59E0B';
    case 'PROGRESS': return '#10B981';
    case 'END': return '#6B7280';
    default: return '#6B7280';
  }
};

// 날짜 포맷 헬퍼 (ISO 8601 -> YYYY.MM.DD)
const formatDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
};

const isUuidLike = (value: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
};

interface MyProfileResponse {
  id?: string;
  userId?: string;
  nickname?: string;
}

export default function BattleDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<BattleDetailRouteProp>();
  const { battleId: id } = route.params;
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // API 상태
  const [battle, setBattle] = useState<BattleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [chartView, setChartView] = useState<'teams' | 'stock'>('teams');
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [teams, setTeams] = useState<TeamResponse[]>([]);
  const [teamMembers, setTeamMembers] = useState<{ [teamId: number]: TeamMemberResponse[] }>({});
  const [teamProfits, setTeamProfits] = useState<TeamProfitResponse[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [isParticipating, setIsParticipating] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: number; nickname: string } | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [myNickname, setMyNickname] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<string | null>(null);

  // 내 정보 로드 (JWT sub 우선, 실패 시 계좌 API fallback)
  const fetchMyInfo = useCallback(async () => {
    console.log('[AUTH] fetchMyInfo 시작');

    // Step 1: JWT에서 role + userId(sub) 조회
    try {
      const [role, jwtUserId] = await Promise.all([getRole(), getMyUserId()]);
      setMyRole(role);
      console.log('[AUTH] JWT에서 role 추출:', role);

      if (jwtUserId && isUuidLike(jwtUserId)) {
        console.log('[AUTH] JWT에서 userId(sub) 추출 성공:', jwtUserId);
        setMyUserId(jwtUserId);
        return;
      }

      if (jwtUserId) {
        console.warn('[AUTH] JWT userId(sub)가 UUID 형식이 아님, 계좌 API fallback 진행:', jwtUserId);
      } else {
        console.warn('[AUTH] JWT userId(sub) 없음, 계좌 API fallback 진행');
      }
    } catch (e) {
      console.warn('[AUTH] JWT 정보(role/userId) 추출 실패:', e);
    }

    // Step 2: 내 프로필에서 nickname + userId 조회 (fallback)
    try {
      const profileResponse = await apiClient.get<MyProfileResponse>('/api/mypage/profile');
      const profile = profileResponse.data;

      if (profile.nickname) {
        setMyNickname(profile.nickname);
        console.log('[AUTH] 프로필 조회 성공, nickname:', profile.nickname);
      }

      const profileUserId = typeof profile.userId === 'string'
        ? profile.userId
        : typeof profile.id === 'string'
          ? profile.id
          : null;

      if (profileUserId && isUuidLike(profileUserId)) {
        console.log('[AUTH] 프로필 조회 성공, userId(UUID):', profileUserId);
        setMyUserId(profileUserId);
        return;
      }

      if (profileUserId) {
        console.warn('[AUTH] 프로필 userId가 UUID 형식이 아님:', profileUserId);
      } else {
        console.warn('[AUTH] 프로필 응답에 userId/id 없음');
      }
    } catch (e) {
      console.warn('[AUTH] 프로필 API 실패:', e);
    }

    // Step 3: 계좌 API로 userId 조회 (fallback)
    try {
      console.log('[AUTH] 개인 계좌 API로 userId(UUID) 조회 시도');
      const profit = await getPersonalAccountProfit();
      console.log('[AUTH] 개인 계좌 조회 성공, userId(UUID):', profit.userId);
      setMyUserId(profit.userId);
      return;
    } catch (e) {
      console.warn('[AUTH] 개인 계좌 API 실패:', e);
      // 배틀 계좌로 시도 (참여 중인 배틀이 있다면)
      if (id) {
        try {
          console.log('[AUTH] 배틀 계좌 API로 userId 조회 시도');
          const battleProfit = await getBattleAccountProfit(id);
          console.log('[AUTH] 배틀 계좌 조회 성공, userId(UUID):', battleProfit.userId);
          setMyUserId(battleProfit.userId);
          return;
        } catch (e2) {
          console.warn('[AUTH] 배틀 계좌 API 실패:', e2);
        }
      }
    }

    console.warn('[AUTH] 모든 userId 조회 방법 실패');
    setMyUserId(null);
  }, [id]);

  // 배틀 상세 조회
  const fetchBattleDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getBattleById(id);
      setBattle(data);
    } catch (err: any) {
      console.error('배틀 상세 조회 오류:', err);
      setError(err.message || '배틀 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // 팀 목록 조회
  const fetchTeams = useCallback(async () => {
    try {
      setLoadingTeams(true);

      // 팀 메타 + 수익률 병렬 조회
      const [teamsData, teamProfitsData, accountProfitsData] = await Promise.all([
        getTeamsByBattleId(id),
        getBattleTeamProfits(id).catch((err) => {
          console.error('팀 수익률 조회 오류:', err);
          return null;
        }),
        getBattleAccountProfits(id).catch((err) => {
          console.error('개인 수익률 조회 오류:', err);
          return [] as AccountProfitResponse[];
        }),
      ]);

      const normalizeMembers = (members: AccountProfitResponse[] | undefined): AccountProfitResponse[] => {
        return Array.isArray(members) ? members : [];
      };

      const toTeamProfitMapFromAccounts = (accounts: AccountProfitResponse[]): TeamProfitResponse[] => {
        const byTeam = new Map<number, AccountProfitResponse[]>();

        accounts.forEach((account) => {
          if (account.teamId == null) return;
          const teamIdNum = Number(account.teamId);
          if (!Number.isFinite(teamIdNum)) return;

          const list = byTeam.get(teamIdNum) ?? [];
          list.push(account);
          byTeam.set(teamIdNum, list);
        });

        const aggregated = Array.from(byTeam.entries()).map(([teamIdNum, members]) => {
          const totalSeedMoney = members.reduce((sum, m) => sum + (m.seedMoney ?? 0), 0);
          const totalAsset = members.reduce((sum, m) => sum + (m.totalAsset ?? 0), 0);
          const returnAmount = members.reduce((sum, m) => sum + (m.returnAmount ?? 0), 0);
          const returnRate = totalSeedMoney > 0 ? (returnAmount / totalSeedMoney) * 100 : 0;
          const teamMeta = teamsData.find((team) => team.id === teamIdNum);

          return {
            teamId: teamIdNum,
            teamName: teamMeta?.name ?? members[0]?.teamName ?? `팀 ${teamIdNum}`,
            battleId: id,
            totalSeedMoney,
            totalAsset,
            returnAmount,
            returnRate,
            memberCount: members.length,
            rank: 0,
            members,
          } as TeamProfitResponse;
        });

        aggregated.sort((a, b) => b.returnRate - a.returnRate);
        return aggregated.map((item, index) => ({ ...item, rank: index + 1 }));
      };

      const normalizedTeamProfits = (teamProfitsData ?? []).map((profit) => ({
        ...profit,
        teamId: Number(profit.teamId),
        members: normalizeMembers(profit.members),
      }));

      const fallbackTeamProfits = toTeamProfitMapFromAccounts(accountProfitsData);
      const profitsData = normalizedTeamProfits.length > 0 ? normalizedTeamProfits : fallbackTeamProfits;

      const profitsWithMembers = profitsData.map((teamProfit) => {
        if (teamProfit.members.length > 0) {
          return teamProfit;
        }

        const fallbackMembers = accountProfitsData.filter((account) => {
          if (account.teamId == null) return false;
          return Number(account.teamId) === Number(teamProfit.teamId);
        });

        return {
          ...teamProfit,
          members: fallbackMembers,
          memberCount: teamProfit.memberCount || fallbackMembers.length,
        };
      });

      console.log('[PROFIT] 팀 메타:', teamsData.length, '팀 수익률:', normalizedTeamProfits.length, '개인 수익률:', accountProfitsData.length, '최종 팀수익률:', profitsWithMembers.length);

      setTeams(teamsData);
      setTeamProfits(profitsWithMembers);

      // 각 팀의 멤버 역할/상태 조회
      const membersMap: { [teamId: number]: TeamMemberResponse[] } = {};
      await Promise.all(
        teamsData.map(async (team) => {
          try {
            membersMap[team.id] = await getTeamMembers(team.id);
          } catch (err) {
            console.error(`팀 ${team.id} 멤버 조회 오류:`, err);
            membersMap[team.id] = [];
          }
        })
      );
      setTeamMembers(membersMap);
    } catch (err: any) {
      console.error('팀 목록 조회 오류:', err);
    } finally {
      setLoadingTeams(false);
    }
  }, [id]);

  // 참여 여부 확인
  const checkParticipation = useCallback(async () => {
    try {
      const account = await getBattleAccount(id);
      if (account) {
        setIsParticipating(true);
      } else {
        setIsParticipating(false);
      }
    } catch {
      setIsParticipating(false);
    }
  }, [id]);

  // 댓글 목록 조회
  const fetchComments = useCallback(async () => {
    try {
      setLoadingComments(true);
      const commentsData = await getCommentsByBattleId(id);
      setComments(commentsData);
    } catch (err: any) {
      console.error('댓글 조회 오류:', err);
    } finally {
      setLoadingComments(false);
    }
  }, [id]);

  // 화면 포커스 시 데이터 새로고침
  useFocusEffect(
    useCallback(() => {
      fetchMyInfo();
      fetchBattleDetail();
      fetchTeams();
      fetchComments();
      checkParticipation();
    }, [fetchMyInfo, fetchBattleDetail, fetchTeams, fetchComments, checkParticipation])
  );

  const handleJoinBattle = () => {
    setShowJoinModal(true);
  };

  const handleJoinSuccess = () => {
    // 팀 목록 및 참여 상태 새로고침
    fetchTeams();
    checkParticipation();
  };

  const handlePostComment = async () => {
    if (!commentText.trim() || postingComment) return;

    try {
      setPostingComment(true);
      await createComment(id, {
        battleId: id,
        content: commentText.trim(),
        parentId: replyingTo?.id ?? null,
      });
      setCommentText('');
      setReplyingTo(null);
      // 댓글 목록 새로고침
      await fetchComments();
    } catch (err: any) {
      console.error('댓글 작성 오류:', err);
      Alert.alert('오류', '댓글 작성에 실패했습니다.');
    } finally {
      setPostingComment(false);
    }
  };

  // 댓글/대댓글 삭제 권한 판단
  const canDeleteComment = (commentUserId: string, commentNickname?: string): boolean => {
    console.log('[DELETE] 권한 체크 시작 - myUserId:', myUserId, 'myNickname:', myNickname, 'commentUserId:', commentUserId, 'commentNickname:', commentNickname, 'myRole:', myRole);

    // 1. ADMIN 권한 체크 (userId 없이도 가능)
    if (myRole === 'ADMIN') {
      console.log('[DELETE] ADMIN 권한으로 삭제 가능');
      return true;
    }

    // 2. 본인 댓글 체크
    if (myUserId && myUserId === commentUserId) {
      console.log('[DELETE] 본인 댓글이므로 삭제 가능');
      return true;
    }

    // 2-1. userId 미확보 시 nickname으로 본인 여부 보조 체크
    if (!myUserId && myNickname && commentNickname && myNickname === commentNickname) {
      console.log('[DELETE] userId 미확보 - nickname 일치로 본인 댓글 삭제 허용');
      return true;
    }

    // 3. 팀 리더 권한 체크
    console.log('[DELETE] 팀 리더 권한 체크 시작, teamMembers:', Object.keys(teamMembers));
    const isTeamLeader = Object.values(teamMembers).some((members) => {
      return members.some((m) => {
        const isLeaderByUserId = !!myUserId && m.userId === myUserId;
        const isLeaderByNickname = !myUserId && !!myNickname && m.userNickname === myNickname;
        const isLeader = (isLeaderByUserId || isLeaderByNickname) && m.role === 'LEADER' && m.status === 'ACTIVE';
        if (isLeader) {
          console.log('[DELETE] 팀 리더 권한 확인됨 - teamId:', m.id, 'userId:', m.userId, 'nickname:', m.userNickname);
        }
        return isLeader;
      });
    });

    if (isTeamLeader) {
      console.log('[DELETE] 팀 리더 권한으로 삭제 가능');
      return true;
    }

    console.log('[DELETE] 삭제 권한 없음');
    return false;
  };

  const handleDeleteComment = (commentId: number) => {
    Alert.alert(
      '댓글 삭제',
      '댓글을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteComment(id, commentId);
              await fetchComments();
            } catch (err: any) {
              const msg = err.response?.data?.message || '댓글 삭제에 실패했습니다.';
              Alert.alert('삭제 실패', msg);
            }
          },
        },
      ]
    );
  };

  // 날짜 포맷 헬퍼
  const formatCommentDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 수익률 챠트용 최대값 (teamProfits 기준)
  const maxRate = teamProfits.length > 0
    ? Math.max(...teamProfits.map(tp => Math.abs(tp.returnRate)))
    : 0;

  // 동적 스타일 변수 (react-native/no-inline-styles 린트 규칙 대응)
  const isDark = colorScheme === 'dark';
  const dy = {
    pageBg:         { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' },
    cardBg:         { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
    badgeBg:        { backgroundColor: isDark ? '#0F172A' : '#F1F5F9' },
    replyingBg:     { backgroundColor: isDark ? '#1E293B' : '#EEF2FF' },
    borderTop:      { borderTopWidth: 1 as const, borderTopColor: isDark ? '#334155' : '#E5E7EB' },
    textColor:      { color: colors.text },
    iconColor:      { color: colors.icon },
    iconMt8:        { color: colors.icon, marginTop: 8 },
    textMt12:       { color: colors.text, marginTop: 12 },
    boldText:       { fontWeight: '700' as const, color: colors.text },
    iconFs13:       { color: colors.icon, fontSize: 13 },
    toggleTeamsTxt: { color: chartView === 'teams' ? '#6366F1' : colors.icon },
    toggleStockTxt: { color: chartView === 'stock' ? '#6366F1' : colors.icon },
    commentBtn:     { backgroundColor: postingComment ? '#94A3B8' : '#6366F1' },
    rankBadge:      { backgroundColor: '#6366F1' },
  };

  // 로딩 상태
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, dy.pageBg]}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={dy.textMt12}>로딩 중...</Text>
      </View>
    );
  }

  // 에러 상태
  if (error || !battle) {
    return (
      <View style={[styles.container, styles.centerContent, dy.pageBg]}>
        <IconSymbol size={48} name="exclamationmark.triangle.fill" color="#EF4444" />
        <Text style={[styles.errorText, dy.textColor]}>{error || '배틀 정보를 찾을 수 없습니다.'}</Text>
        <TouchableOpacity
          style={[styles.retryButton, styles.accentBg]}
          onPress={fetchBattleDetail}>
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.mt12}
          onPress={() => navigation.goBack()}>
          <Text style={styles.accentText}>뒤로 가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, dy.pageBg]}>
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer}>

        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <IconSymbol size={24} name="chevron.left" color={colors.text} />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, dy.textColor]}>{battle.name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(battle.status) }]}>
                <Text style={styles.statusText}>{getStatusText(battle.status)}</Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <IconSymbol size={14} name="calendar" color={colors.icon} />
                <Text style={[styles.metaText, dy.iconColor]}>
                  {formatDate(battle.startAt)} - {formatDate(battle.endAt)}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <IconSymbol size={14} name="person.2.fill" color={colors.icon} />
                <Text style={[styles.metaText, dy.iconColor]}>
                  최대 {battle.memberCount}명 × {battle.teamCount}팀
                </Text>
              </View>
            </View>

            <View style={styles.battleInfoRow}>
              <View style={[styles.infoBadge, dy.badgeBg]}>
                <Text style={[styles.infoBadgeText, dy.iconColor]}>
                  티커: {battle.ticker}
                </Text>
              </View>
              <View style={[styles.infoBadge, dy.badgeBg]}>
                <Text style={[styles.infoBadgeText, dy.iconColor]}>
                  초기자본: ${battle.initialCapital.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 차트 토글 */}
        <View style={[styles.chartToggle, dy.cardBg]}>
          <TouchableOpacity
            style={[styles.toggleButton, chartView === 'teams' && styles.activeToggle]}
            onPress={() => setChartView('teams')}>
            <Text style={[styles.toggleText, dy.toggleTeamsTxt]}>
              팀 격차
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, chartView === 'stock' && styles.activeToggle]}
            onPress={() => setChartView('stock')}>
            <Text style={[styles.toggleText, dy.toggleStockTxt]}>
              종목 차트
            </Text>
          </TouchableOpacity>
        </View>

        {/* 팀 격차 막대 그래프 */}
        {chartView === 'teams' && (
          <View style={[styles.card, styles.shadow, dy.cardBg]}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>수익률 비교</ThemedText>

            {loadingTeams ? (
              <View style={styles.paddedCenter}>
                <ActivityIndicator size="small" color="#6366F1" />
                <Text style={dy.iconMt8}>팀 정보 로딩 중...</Text>
              </View>
            ) : teamProfits.length === 0 ? (
              <View style={styles.paddedCenter}>
                <IconSymbol size={32} name="person.2.slash" color={colors.icon} />
                <Text style={dy.iconMt8}>아직 수익률 데이터가 없습니다</Text>
              </View>
            ) : (
              <>
                <View style={styles.barChartContainer}>
                  {teamProfits.map((tp, index) => {
                    const barWidth = maxRate > 0 ? (Math.abs(tp.returnRate) / maxRate) * 100 : 0;
                    const isPositive = tp.returnRate >= 0;
                    const teamColor = TEAM_COLORS[index % TEAM_COLORS.length];
                    const barValueStyle = isPositive ? styles.profitPositive : styles.profitNegative;

                    return (
                      <View key={tp.teamId} style={styles.barChartRow}>
                        <View style={styles.teamInfo}>
                          <View style={[styles.teamColorDot, { backgroundColor: teamColor }]} />
                          <Text style={[styles.teamBarName, dy.textColor]}>
                            {tp.teamName}
                          </Text>
                        </View>

                        <View style={styles.barContainer}>
                          <View style={[
                            styles.barFill,
                            {
                              width: `${Math.max(barWidth, 5)}%`,
                              backgroundColor: teamColor,
                            }
                          ]} />
                        </View>

                        <Text style={[styles.barValue, barValueStyle]}>
                          {isPositive ? '+' : ''}{tp.returnRate.toFixed(2)}%
                        </Text>
                      </View>
                    );
                  })}
                </View>

                {teamProfits.length >= 2 && (
                  <View style={styles.chartLegend}>
                    <Text style={[styles.legendText, dy.iconColor]}>
                      {teamProfits[0].teamName}이(가){' '}
                      <Text style={dy.boldText}>
                        {Math.abs(teamProfits[0].returnRate - teamProfits[1].returnRate).toFixed(2)}%p
                      </Text>
                      {' '}앞서고 있습니다
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* 종목 정보 */}
        {chartView === 'stock' && (
          <View style={[styles.card, styles.shadow, dy.cardBg]}>
            <View style={styles.stockHeader}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>대결 종목</ThemedText>
            </View>
            <View style={styles.stockItem}>
              <View style={styles.flex1}>
                <Text style={[styles.stockSymbol, dy.textColor]}>{battle.ticker}</Text>
                <Text style={[styles.stockName, dy.iconColor]}>티커 코드</Text>
              </View>
            </View>
          </View>
        )}

        {/* 팀별 상세 정보 */}
        {teams.map((team, teamIndex) => {
          const metaMembers = teamMembers[team.id] || [];
          const profit = teamProfits.find(tp => tp.teamId === team.id);
          const profitMembers = profit?.members ?? [];
          const teamColor = TEAM_COLORS[teamIndex % TEAM_COLORS.length];
          const myTeamMember = metaMembers.find((m) => {
            if (m.status !== 'ACTIVE') return false;
            if (myUserId) return m.userId === myUserId;
            if (myNickname) return m.userNickname === myNickname;
            return false;
          });
          const canManageTeam = !!myTeamMember && myTeamMember.role === 'LEADER';
          const teamReturnStyle = profit
            ? (profit.returnRate >= 0 ? styles.profitPositive : styles.profitNegative)
            : null;

          return (
            <View
              key={team.id}
              style={[styles.card, styles.shadow, dy.cardBg]}>

              <View style={styles.teamHeader}>
                <View style={styles.teamHeaderLeft}>
                  <View style={[styles.teamColorDot, { backgroundColor: teamColor }]} />
                  <ThemedText type="subtitle" style={styles.teamName}>
                    {team.name}
                  </ThemedText>
                  {profit && (
                    <View style={[styles.memberCountBadge, styles.accentBg]}>
                      <Text style={[styles.memberCountText, styles.whiteText]}>
                        {profit.rank}위
                      </Text>
                    </View>
                  )}
                  <View style={[styles.memberCountBadge, dy.badgeBg]}>
                    <Text style={[styles.memberCountText, dy.iconColor]}>
                      {team.memberCount}명
                    </Text>
                  </View>
                </View>
                <View style={styles.teamStats}>
                  {profit ? (
                    <>
                      <Text style={[styles.teamStatValue, teamReturnStyle]}>
                        {profit.returnRate >= 0 ? '+' : ''}{profit.returnRate.toFixed(2)}%
                      </Text>
                      <Text style={[styles.teamStatLabel, dy.iconColor]}>
                        {profit.returnAmount >= 0 ? '+' : ''}{profit.returnAmount.toLocaleString()}원
                      </Text>
                    </>
                  ) : (
                    <Text style={[styles.teamStatLabel, dy.iconColor]}>데이터 없음</Text>
                  )}
                </View>
              </View>

              {team.description && (
                <Text style={[styles.teamDescription, dy.iconColor]}>
                  {team.description}
                </Text>
              )}

              {/* 초대 코드 표시 (본인 팀이고 inviteCode가 있을 때만) */}
              {isParticipating && team.inviteCode && (
                <View style={[styles.inviteCodeContainer, dy.pageBg]}>
                  <Text style={[styles.inviteCodeLabel, dy.iconColor]}>초대 코드</Text>
                  <View style={styles.inviteCodeRow}>
                    <Text style={[styles.inviteCodeText, styles.accentText]} selectable={true}>
                      {team.inviteCode}
                    </Text>
                    <TouchableOpacity 
                      style={styles.copyButton}
                      onPress={() => {
                        Alert.alert('복사 완료', '초대 코드가 클립보드에 복사되었습니다.');
                        // 실제 클립보드 복사 로직은 Clipboard API 사용 필요
                      }}>
                      <IconSymbol size={16} name="doc.on.doc" color="#6366F1" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {canManageTeam && (
                <TouchableOpacity
                  style={styles.manageTeamButton}
                  onPress={() => navigation.navigate('TeamManage', {
                    battleId: id,
                    teamId: team.id,
                    teamName: team.name,
                  })}
                >
                  <IconSymbol size={14} name="person.3.fill" color="#6366F1" />
                  <Text style={styles.manageTeamButtonText}>팀 관리</Text>
                </TouchableOpacity>
              )}

              {/* 팀원 목록 */}
              <View style={styles.membersContainer}>
                {profitMembers.length === 0 && metaMembers.length === 0 ? (
                  <View style={styles.paddedCenter16}>
                    <Text style={dy.iconColor}>팀원 정보가 없습니다</Text>
                  </View>
                ) : profitMembers.length > 0 ? (
                  // 수익률 API 데이터 우선 표시 (rank 기준 정렬)
                  profitMembers.map((pm, index) => {
                    const meta = metaMembers.find(m => m.userId === pm.userId);
                    const displayName = meta?.userNickname || pm.userName;
                    return (
                      <View
                        key={pm.accountId}
                        style={[
                          styles.memberRow,
                          index > 0 && dy.borderTop
                        ]}>

                        <View style={[styles.memberRank, dy.pageBg]}>
                          <Text style={[styles.memberRankText, dy.iconColor]}>
                            {index + 1}
                          </Text>
                        </View>

                        <View style={styles.flex1}>
                          <View style={styles.rowCenter6}>
                            <Text style={[styles.memberUsername, dy.textColor]}>
                              {displayName}
                            </Text>
                            {meta?.role === 'LEADER' && (
                              <View style={[styles.leaderBadge, styles.accentBg]}>
                                <Text style={styles.leaderBadgeText}>리더</Text>
                              </View>
                            )}
                          </View>
                          <Text style={[styles.memberValue, dy.iconColor]}>
                            {pm.returnAmount >= 0 ? '+' : ''}{pm.returnAmount.toLocaleString()}원
                          </Text>
                        </View>

                        <Text style={[styles.memberProfit, pm.returnRate >= 0 ? styles.profitPositive : styles.profitNegative]}>
                          {pm.returnRate >= 0 ? '+' : ''}{pm.returnRate.toFixed(2)}%
                        </Text>
                      </View>
                    );
                  })
                ) : (
                  // 수익률 데이터 없을 때 역할/상태 정보만 표시
                  metaMembers.map((member, index) => (
                    <View
                      key={member.id}
                      style={[
                        styles.memberRow,
                        index > 0 && dy.borderTop
                      ]}>

                      <View style={[styles.memberRank, dy.pageBg]}>
                        <Text style={[styles.memberRankText, dy.iconColor]}>
                          {index + 1}
                        </Text>
                      </View>

                      <View style={styles.flex1}>
                        <View style={styles.rowCenter6}>
                          <Text style={[styles.memberUsername, dy.textColor]}>
                            {member.userNickname}
                          </Text>
                          {member.role === 'LEADER' && (
                            <View style={[styles.leaderBadge, styles.accentBg]}>
                              <Text style={styles.leaderBadgeText}>리더</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.memberValue, dy.iconColor]}>
                          {member.status === 'ACTIVE' ? '활동중' : member.status === 'LEFT' ? '탈퇴' : '강퇴'}
                        </Text>
                      </View>

                      <Text style={[styles.memberProfit, dy.iconColor]}>
                        -
                      </Text>
                    </View>
                  ))
                )}
              </View>
            </View>
          );
        })}

        {/* 참여 버튼 - 이미 참여한 경우 숨김 */}
        {!isParticipating && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.accentBg]}
              onPress={handleJoinBattle}>
              <IconSymbol size={20} name="person.badge.plus.fill" color="#FFFFFF" />
              <Text style={styles.actionButtonText}>대결 참여하기</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 댓글 섹션 */}
        <View style={[styles.card, styles.shadow, dy.cardBg]}>
          <View style={styles.commentsHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              댓글 {comments.length}
            </ThemedText>
          </View>

          {/* 대댓글 표시 */}
          {isParticipating && replyingTo && (
            <View style={[styles.replyingIndicator, dy.replyingBg]}>
              <Text style={[styles.replyingText, dy.iconColor]}>
                <Text style={styles.boldAccent}>{replyingTo.nickname}</Text>님에게 답글 작성 중
              </Text>
              <TouchableOpacity onPress={() => { setReplyingTo(null); setCommentText(''); }}>
                <IconSymbol size={16} name="xmark.circle.fill" color={colors.icon} />
              </TouchableOpacity>
            </View>
          )}

          {/* 댓글 입력 - 참여자만 */}
          {isParticipating ? (
            <View style={[styles.commentInputContainer, dy.pageBg]}>
              <TextInput
                style={[styles.commentInput, dy.textColor]}
                placeholder={replyingTo ? `${replyingTo.nickname}님에게 답글...` : '댓글을 입력하세요...'}
                placeholderTextColor={colors.icon}
                value={commentText}
                onChangeText={setCommentText}
                multiline
                editable={!postingComment}
              />
              <TouchableOpacity
                style={[styles.commentButton, dy.commentBtn]}
                onPress={handlePostComment}
                disabled={postingComment}>
                {postingComment ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <IconSymbol size={18} name="paperplane.fill" color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.commentInputContainer, dy.pageBg, styles.commentInputNone]}>
              <Text style={dy.iconFs13}>배틀에 참여해야 댓글을 작성할 수 있습니다.</Text>
            </View>
          )}

          {/* 댓글 목록 */}
          <View style={styles.commentsList}>
            {loadingComments ? (
              <View style={styles.paddedCenter}>
                <ActivityIndicator size="small" color="#6366F1" />
              </View>
            ) : comments.length === 0 ? (
              <View style={styles.paddedCenter}>
                <Text style={dy.iconColor}>아직 댓글이 없습니다. 첫 댓글을 남겨보세요!</Text>
              </View>
            ) : (
              comments.map((comment, index) => (
                <View
                  key={comment.id}
                  style={[
                    styles.commentItem,
                    index > 0 && dy.borderTop
                  ]}>
                  <View style={styles.commentHeader}>
                    <Text style={[styles.commentUsername, dy.textColor]}>
                      {comment.userNickname}
                    </Text>
                    <Text style={[styles.commentTimestamp, dy.iconColor]}>
                      {formatCommentDate(comment.createdAt)}
                    </Text>
                  </View>
                  <Text style={[styles.commentContent, comment.isDeleted ? dy.iconColor : dy.textColor]}>
                    {comment.isDeleted ? '삭제된 댓글입니다.' : comment.content}
                  </Text>

                  {/* 답글 버튼 + 삭제 버튼 */}
                  <View style={styles.commentActions}>
                    {!comment.isDeleted && isParticipating && (
                      <TouchableOpacity
                        style={styles.replyButton}
                        onPress={() => {
                          setReplyingTo({ id: comment.id, nickname: comment.userNickname });
                          setCommentText('');
                        }}>
                        <IconSymbol size={14} name="arrowshape.turn.up.left.fill" color={colors.icon} />
                        <Text style={[styles.replyButtonText, dy.iconColor]}>답글</Text>
                      </TouchableOpacity>
                    )}
                    {!comment.isDeleted && canDeleteComment(comment.userId, comment.userNickname) && (
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteComment(comment.id)}>
                        <IconSymbol size={14} name="trash" color="#EF4444" />
                        <Text style={[styles.replyButtonText, styles.redText]}>삭제</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* 대댓글 표시 */}
                  {comment.replies && comment.replies.length > 0 && (
                    <View style={styles.repliesContainer}>
                      {comment.replies.map((reply) => (
                        <View key={reply.id} style={styles.replyItem}>
                          <View style={styles.commentHeader}>
                            <Text style={[styles.commentUsername, dy.textColor, styles.textFs13]}>
                              ↳ {reply.userNickname}
                            </Text>
                            <Text style={[styles.commentTimestamp, dy.iconColor]}>
                              {formatCommentDate(reply.createdAt)}
                            </Text>
                          </View>
                          <Text style={[styles.commentContent, reply.isDeleted ? dy.iconColor : dy.textColor, styles.textFs13]}>
                            {reply.isDeleted ? '삭제된 댓글입니다.' : reply.content}
                          </Text>
                          {!reply.isDeleted && canDeleteComment(reply.userId, reply.userNickname) && (
                            <TouchableOpacity
                              style={[styles.deleteButton, styles.mt4]}
                              onPress={() => handleDeleteComment(reply.id)}>
                              <IconSymbol size={12} name="trash" color="#EF4444" />
                              <Text style={[styles.replyButtonText, styles.redFs11]}>삭제</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* 배틀 참가 모달 */}
      <JoinBattleModal
        visible={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onSuccess={handleJoinSuccess}
        battleId={id}
        teams={teams}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: 12,
  },
  headerContent: {
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    flex: 1,
    lineHeight: 32,
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
  metaRow: {
    flexDirection: 'row',
    gap: 16,
  },
  battleInfoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  infoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  infoBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  chartToggle: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 4,
    borderRadius: 12,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeToggle: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  barChartContainer: {
    gap: 16,
  },
  barChartRow: {
    gap: 12,
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  teamBarName: {
    fontSize: 15,
    fontWeight: '600',
  },
  barContainer: {
    height: 32,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 8,
  },
  barValue: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'right',
  },
  chartLegend: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.1)',
  },
  legendText: {
    fontSize: 14,
    textAlign: 'center',
  },
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  delayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  delayText: {
    fontSize: 11,
    fontWeight: '600',
  },
  stockItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  stockSymbol: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  stockName: {
    fontSize: 13,
  },
  stockPrice: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  stockChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockChangeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  teamHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  teamName: {
    fontSize: 18,
    fontWeight: '700',
  },
  teamDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  memberCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  memberCountText: {
    fontSize: 11,
    fontWeight: '600',
  },
  leaderBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  leaderBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  teamStats: {
    alignItems: 'flex-end',
  },
  teamStatLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  teamStatValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  membersContainer: {
    gap: 0,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  memberRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberRankText: {
    fontSize: 13,
    fontWeight: '700',
  },
  memberUsername: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  memberValue: {
    fontSize: 12,
  },
  memberProfit: {
    fontSize: 16,
    fontWeight: '700',
  },
  inviteCodeContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inviteCodeLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  inviteCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inviteCodeText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  copyButton: {
    padding: 8,
  },
  manageTeamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    borderWidth: 1,
    borderColor: '#6366F1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
  },
  manageTeamButtonText: {
    color: '#6366F1',
    fontSize: 12,
    fontWeight: '700',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  commentsHeader: {
    marginBottom: 16,
  },
  commentInputContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    maxHeight: 100,
  },
  commentButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentsList: {
    gap: 0,
  },
  commentItem: {
    paddingVertical: 16,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentTimestamp: {
    fontSize: 12,
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  repliesContainer: {
    marginTop: 8,
    marginLeft: 16,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#E5E7EB',
  },
  replyItem: {
    paddingVertical: 8,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    marginBottom: 4,
  },
  replyButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 2,
    marginBottom: 4,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  replyingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  replyingText: {
    fontSize: 13,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  likeCount: {
    fontSize: 12,
  },
  bottomSpacer: {
    height: 40,
  },
  // 동적 스타일 대응 정적 스타일
  flex1:            { flex: 1 },
  rowCenter6:       { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6 },
  paddedCenter:     { padding: 20, alignItems: 'center' as const },
  paddedCenter16:   { padding: 16, alignItems: 'center' as const },
  mt12:             { marginTop: 12 },
  mt4:              { marginTop: 4 },
  accentBg:         { backgroundColor: '#6366F1' },
  accentText:       { color: '#6366F1' },
  whiteText:        { color: '#FFFFFF' },
  bold700:          { fontWeight: '700' as const },
  boldAccent:       { fontWeight: '700' as const, color: '#6366F1' },
  redText:          { color: '#EF4444' },
  redFs11:          { color: '#EF4444', fontSize: 11 },
  textFs13:         { fontSize: 13 },
  profitPositive:   { color: '#10B981' },
  profitNegative:   { color: '#EF4444' },
  commentInputNone: { justifyContent: 'center' as const, alignItems: 'center' as const, paddingVertical: 14 },
});
