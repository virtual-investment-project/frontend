import { ThemedText } from '../components/ThemedText';
import { IconSymbol } from '../components/ui/IconSymbol';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/useColorScheme';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useState, useCallback } from 'react';
import { getBattleById } from '../services/battleService';
import { getTeamsByBattleId, getTeamMembers } from '../services/teamService';
import { getCommentsByBattleId, createComment } from '../services/commentService';
import { getBattleAccount } from '../services/accountService';
import { BattleResponse, BattleStatus, TeamResponse, TeamMemberResponse, CommentResponse } from '../types/api';
import JoinBattleModal from '../components/JoinBattleModal';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type BattleDetailRouteProp = RouteProp<RootStackParamList, 'BattleDetail'>;
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';

interface Stock {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  delayMinutes: number;
}

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
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [isParticipating, setIsParticipating] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: number; nickname: string } | null>(null);

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
      const teamsData = await getTeamsByBattleId(id);
      setTeams(teamsData);

      // 각 팀의 멤버 조회
      const membersMap: { [teamId: number]: TeamMemberResponse[] } = {};
      for (const team of teamsData) {
        try {
          const members = await getTeamMembers(team.id);
          membersMap[team.id] = members;
        } catch (err) {
          console.error(`팀 ${team.id} 멤버 조회 오류:`, err);
          membersMap[team.id] = [];
        }
      }
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
      await getBattleAccount(id);
      setIsParticipating(true);
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
      fetchBattleDetail();
      fetchTeams();
      fetchComments();
      checkParticipation();
    }, [fetchBattleDetail, fetchTeams, fetchComments, checkParticipation])
  );

  const stocks: Stock[] = battle?.ticker ? [
    {
      symbol: battle.ticker,
      name: battle.ticker,
      currentPrice: 0,
      change: 0,
      changePercent: 0,
      delayMinutes: 15,
    },
  ] : [];

  const handleTrade = () => {
    navigation.navigate('Main');
  };

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

  const totalParticipants = teams.reduce((sum, team) => sum + team.memberCount, 0);
  const maxRate = teams.length > 0 ? Math.max(...teams.map(t => Math.abs(t.rate))) : 0;

  // 로딩 상태
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' }]}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={{ color: colors.text, marginTop: 12 }}>로딩 중...</Text>
      </View>
    );
  }

  // 에러 상태
  if (error || !battle) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' }]}>
        <IconSymbol size={48} name="exclamationmark.triangle.fill" color="#EF4444" />
        <Text style={[styles.errorText, { color: colors.text }]}>{error || '배틀 정보를 찾을 수 없습니다.'}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: '#6366F1' }]}
          onPress={fetchBattleDetail}>
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ marginTop: 12 }}
          onPress={() => navigation.goBack()}>
          <Text style={{ color: '#6366F1' }}>뒤로 가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' }]}>
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
              <Text style={[styles.title, { color: colors.text }]}>{battle.name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(battle.status) }]}>
                <Text style={styles.statusText}>{getStatusText(battle.status)}</Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <IconSymbol size={14} name="calendar" color={colors.icon} />
                <Text style={[styles.metaText, { color: colors.icon }]}>
                  {formatDate(battle.startAt)} - {formatDate(battle.endAt)}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <IconSymbol size={14} name="person.2.fill" color={colors.icon} />
                <Text style={[styles.metaText, { color: colors.icon }]}>
                  최대 {battle.memberCount}명 × {battle.teamCount}팀
                </Text>
              </View>
            </View>

            <View style={styles.battleInfoRow}>
              <View style={[styles.infoBadge, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F1F5F9' }]}>
                <Text style={[styles.infoBadgeText, { color: colors.icon }]}>
                  티커: {battle.ticker}
                </Text>
              </View>
              <View style={[styles.infoBadge, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F1F5F9' }]}>
                <Text style={[styles.infoBadgeText, { color: colors.icon }]}>
                  초기자본: ${battle.initialCapital.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 차트 토글 */}
        <View style={[styles.chartToggle, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
          <TouchableOpacity
            style={[styles.toggleButton, chartView === 'teams' && styles.activeToggle]}
            onPress={() => setChartView('teams')}>
            <Text style={[styles.toggleText, { color: chartView === 'teams' ? '#6366F1' : colors.icon }]}>
              팀 격차
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, chartView === 'stock' && styles.activeToggle]}
            onPress={() => setChartView('stock')}>
            <Text style={[styles.toggleText, { color: chartView === 'stock' ? '#6366F1' : colors.icon }]}>
              종목 차트
            </Text>
          </TouchableOpacity>
        </View>

        {/* 팀 격차 막대 그래프 */}
        {chartView === 'teams' && (
          <View style={[styles.card, styles.shadow, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>수익률 비교</ThemedText>

            {loadingTeams ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#6366F1" />
                <Text style={{ color: colors.icon, marginTop: 8 }}>팀 정보 로딩 중...</Text>
              </View>
            ) : teams.length === 0 ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <IconSymbol size={32} name="person.2.slash" color={colors.icon} />
                <Text style={{ color: colors.icon, marginTop: 8 }}>아직 참여 팀이 없습니다</Text>
              </View>
            ) : (
              <>
                <View style={styles.barChartContainer}>
                  {teams.map((team, index) => {
                    const barWidth = maxRate > 0 ? (Math.abs(team.rate) / maxRate) * 100 : 0;
                    const isPositive = team.rate >= 0;
                    const teamColor = TEAM_COLORS[index % TEAM_COLORS.length];

                    return (
                      <View key={team.id} style={styles.barChartRow}>
                        <View style={styles.teamInfo}>
                          <View style={[styles.teamColorDot, { backgroundColor: teamColor }]} />
                          <Text style={[styles.teamBarName, { color: colors.text }]}>
                            {team.name}
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

                        <Text style={[
                          styles.barValue,
                          { color: isPositive ? '#10B981' : '#EF4444' }
                        ]}>
                          {isPositive ? '+' : ''}{team.rate.toFixed(1)}%
                        </Text>
                      </View>
                    );
                  })}
                </View>

                {teams.length >= 2 && (
                  <View style={styles.chartLegend}>
                    <Text style={[styles.legendText, { color: colors.icon }]}>
                      {teams.sort((a, b) => b.rate - a.rate)[0].name}이(가){' '}
                      <Text style={{ fontWeight: '700', color: colors.text }}>
                        {Math.abs(teams[0].rate - teams[1].rate).toFixed(1)}%p
                      </Text>
                      {' '}앞서고 있습니다
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* 종목 현재가 */}
        {chartView === 'stock' && (
          <View style={[styles.card, styles.shadow, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
            <View style={styles.stockHeader}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>대결 종목</ThemedText>
              <View style={[styles.delayBadge, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' }]}>
                <IconSymbol size={12} name="clock.fill" color="#F59E0B" />
                <Text style={[styles.delayText, { color: '#F59E0B' }]}>15분 지연</Text>
              </View>
            </View>

            {stocks.map((stock, index) => (
              <View
                key={stock.symbol}
                style={[
                  styles.stockItem,
                  index > 0 && {
                    borderTopWidth: 1,
                    borderTopColor: colorScheme === 'dark' ? '#334155' : '#E5E7EB'
                  }
                ]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.stockSymbol, { color: colors.text }]}>
                    {stock.symbol}
                  </Text>
                  <Text style={[styles.stockName, { color: colors.icon }]}>
                    {stock.name}
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.stockPrice, { color: colors.text }]}>
                    ${stock.currentPrice.toFixed(2)}
                  </Text>
                  <View style={styles.stockChange}>
                    <IconSymbol
                      size={12}
                      name={stock.change >= 0 ? 'arrow.up' : 'arrow.down'}
                      color={stock.change >= 0 ? '#10B981' : '#EF4444'}
                    />
                    <Text style={[
                      styles.stockChangeText,
                      { color: stock.change >= 0 ? '#10B981' : '#EF4444' }
                    ]}>
                      {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 팀별 상세 정보 */}
        {teams.map((team, teamIndex) => {
          const members = teamMembers[team.id] || [];
          const teamColor = TEAM_COLORS[teamIndex % TEAM_COLORS.length];

          return (
            <View
              key={team.id}
              style={[styles.card, styles.shadow, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>

              <View style={styles.teamHeader}>
                <View style={styles.teamHeaderLeft}>
                  <View style={[styles.teamColorDot, { backgroundColor: teamColor }]} />
                  <ThemedText type="subtitle" style={styles.teamName}>
                    {team.name}
                  </ThemedText>
                  <View style={[styles.memberCountBadge, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F1F5F9' }]}>
                    <Text style={[styles.memberCountText, { color: colors.icon }]}>
                      {team.memberCount}명
                    </Text>
                  </View>
                </View>
                <View style={styles.teamStats}>
                  <Text style={[styles.teamStatLabel, { color: colors.icon }]}>수익률</Text>
                  <Text style={[
                    styles.teamStatValue,
                    { color: team.rate >= 0 ? '#10B981' : '#EF4444' }
                  ]}>
                    {team.rate >= 0 ? '+' : ''}{team.rate.toFixed(1)}%
                  </Text>
                </View>
              </View>

              {team.description && (
                <Text style={[styles.teamDescription, { color: colors.icon }]}>
                  {team.description}
                </Text>
              )}

              {/* 팀원 목록 */}
              <View style={styles.membersContainer}>
                {members.length === 0 ? (
                  <View style={{ padding: 16, alignItems: 'center' }}>
                    <Text style={{ color: colors.icon }}>팀원 정보가 없습니다</Text>
                  </View>
                ) : (
                  members.map((member, index) => (
                    <View
                      key={member.id}
                      style={[
                        styles.memberRow,
                        index > 0 && {
                          borderTopWidth: 1,
                          borderTopColor: colorScheme === 'dark' ? '#334155' : '#E5E7EB'
                        }
                      ]}>

                      <View style={[
                        styles.memberRank,
                        { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' }
                      ]}>
                        <Text style={[styles.memberRankText, { color: colors.icon }]}>
                          {member.rank}
                        </Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[styles.memberUsername, { color: colors.text }]}>
                            {member.userNickname}
                          </Text>
                          {member.role === 'LEADER' && (
                            <View style={[styles.leaderBadge, { backgroundColor: '#6366F1' }]}>
                              <Text style={styles.leaderBadgeText}>리더</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.memberValue, { color: colors.icon }]}>
                          {member.status === 'ACTIVE' ? '활동중' : '비활성'}
                        </Text>
                      </View>

                      <Text style={[
                        styles.memberProfit,
                        { color: member.rate >= 0 ? '#10B981' : '#EF4444' }
                      ]}>
                        {member.rate >= 0 ? '+' : ''}{member.rate.toFixed(1)}%
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
              style={[styles.actionButton, { backgroundColor: '#6366F1' }]}
              onPress={handleJoinBattle}>
              <IconSymbol size={20} name="person.badge.plus.fill" color="#FFFFFF" />
              <Text style={styles.actionButtonText}>대결 참여하기</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 댓글 섹션 */}
        <View style={[styles.card, styles.shadow, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
          <View style={styles.commentsHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              댓글 {comments.length}
            </ThemedText>
          </View>

          {/* 대댓글 표시 */}
          {isParticipating && replyingTo && (
            <View style={[styles.replyingIndicator, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#EEF2FF' }]}>
              <Text style={[styles.replyingText, { color: colors.icon }]}>
                <Text style={{ fontWeight: '700', color: '#6366F1' }}>{replyingTo.nickname}</Text>님에게 답글 작성 중
              </Text>
              <TouchableOpacity onPress={() => { setReplyingTo(null); setCommentText(''); }}>
                <IconSymbol size={16} name="xmark.circle.fill" color={colors.icon} />
              </TouchableOpacity>
            </View>
          )}

          {/* 댓글 입력 - 참여자만 */}
          {isParticipating ? (
            <View style={[styles.commentInputContainer, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' }]}>
              <TextInput
                style={[styles.commentInput, { color: colors.text }]}
                placeholder={replyingTo ? `${replyingTo.nickname}님에게 답글...` : '댓글을 입력하세요...'}
                placeholderTextColor={colors.icon}
                value={commentText}
                onChangeText={setCommentText}
                multiline
                editable={!postingComment}
              />
              <TouchableOpacity
                style={[styles.commentButton, { backgroundColor: postingComment ? '#94A3B8' : '#6366F1' }]}
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
            <View style={[styles.commentInputContainer, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC', justifyContent: 'center', alignItems: 'center', paddingVertical: 14 }]}>
              <Text style={{ color: colors.icon, fontSize: 13 }}>배틀에 참여해야 댓글을 작성할 수 있습니다.</Text>
            </View>
          )}

          {/* 댓글 목록 */}
          <View style={styles.commentsList}>
            {loadingComments ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#6366F1" />
              </View>
            ) : comments.length === 0 ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: colors.icon }}>아직 댓글이 없습니다. 첫 댓글을 남겨보세요!</Text>
              </View>
            ) : (
              comments.map((comment, index) => (
                <View
                  key={comment.id}
                  style={[
                    styles.commentItem,
                    index > 0 && {
                      borderTopWidth: 1,
                      borderTopColor: colorScheme === 'dark' ? '#334155' : '#E5E7EB'
                    }
                  ]}>
                  <View style={styles.commentHeader}>
                    <Text style={[styles.commentUsername, { color: colors.text }]}>
                      {comment.userNickname}
                    </Text>
                    <Text style={[styles.commentTimestamp, { color: colors.icon }]}>
                      {formatCommentDate(comment.createdAt)}
                    </Text>
                  </View>
                  <Text style={[styles.commentContent, { color: comment.isDeleted ? colors.icon : colors.text }]}>
                    {comment.isDeleted ? '삭제된 댓글입니다.' : comment.content}
                  </Text>

                  {/* 답글 버튼 - 참여자만 */}
                  {!comment.isDeleted && isParticipating && (
                    <TouchableOpacity
                      style={styles.replyButton}
                      onPress={() => {
                        setReplyingTo({ id: comment.id, nickname: comment.userNickname });
                        setCommentText('');
                      }}>
                      <IconSymbol size={14} name="arrowshape.turn.up.left.fill" color={colors.icon} />
                      <Text style={[styles.replyButtonText, { color: colors.icon }]}>답글</Text>
                    </TouchableOpacity>
                  )}

                  {/* 대댓글 표시 */}
                  {comment.replies && comment.replies.length > 0 && (
                    <View style={styles.repliesContainer}>
                      {comment.replies.map((reply) => (
                        <View key={reply.id} style={styles.replyItem}>
                          <View style={styles.commentHeader}>
                            <Text style={[styles.commentUsername, { color: colors.text, fontSize: 13 }]}>
                              ↳ {reply.userNickname}
                            </Text>
                            <Text style={[styles.commentTimestamp, { color: colors.icon }]}>
                              {formatCommentDate(reply.createdAt)}
                            </Text>
                          </View>
                          <Text style={[styles.commentContent, { color: reply.isDeleted ? colors.icon : colors.text, fontSize: 13 }]}>
                            {reply.isDeleted ? '삭제된 댓글입니다.' : reply.content}
                          </Text>
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
});
