import { ThemedText } from '../components/ThemedText';
import { IconSymbol } from '../components/ui/IconSymbol';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/useColorScheme';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useState } from 'react';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type BattleDetailRouteProp = RouteProp<RootStackParamList, 'BattleDetail'>;
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface TeamMember {
  id: string;
  username: string;
  profitRate: number;
  portfolioValue: number;
  rank: number;
}

interface Team {
  id: string;
  name: string;
  color: string;
  totalProfitRate: number;
  members: TeamMember[];
  averageReturn: number;
}

interface Stock {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  delayMinutes: number;
}

interface Comment {
  id: string;
  username: string;
  content: string;
  timestamp: string;
  likes: number;
}

export default function BattleDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<BattleDetailRouteProp>();
  const { id } = route.params;
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [chartView, setChartView] = useState<'teams' | 'stock'>('teams');
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      username: '투자왕123',
      content: 'NVIDIA가 더 오를 것 같은데요!',
      timestamp: '2026.01.04 10:30',
      likes: 5,
    },
    {
      id: '2',
      username: 'AI투자자',
      content: 'AMD도 좋은 선택이라고 봅니다. 가격 대비 성능이 좋아요.',
      timestamp: '2026.01.04 09:15',
      likes: 3,
    },
  ]);

  // 임시 대결 데이터
  const battle = {
    id: id,
    title: 'NVIDIA vs AMD - AI 반도체 대전',
    category: '미국주식',
    startDate: '2026.01.01',
    endDate: '2026.01.31',
    status: 'ongoing' as const,
    description: 'AI 반도체 시장을 선도하는 두 기업의 대결! 어느 팀이 더 높은 수익을 낼까요?',
    participantCount: 24,
  };

  const teams: Team[] = [
    {
      id: '1',
      name: 'Team NVIDIA',
      color: '#10B981',
      totalProfitRate: 12.5,
      averageReturn: 12.5,
      members: [
        { id: '1', username: 'GPU_Master', profitRate: 18.3, portfolioValue: 11830000, rank: 1 },
        { id: '2', username: 'ChipInvestor', profitRate: 15.2, portfolioValue: 11520000, rank: 2 },
        { id: '3', username: 'TechBull', profitRate: 12.1, portfolioValue: 11210000, rank: 3 },
        { id: '4', username: 'AIBeliever', profitRate: 9.4, portfolioValue: 10940000, rank: 4 },
        { id: '5', username: 'NvidiaFan', profitRate: 7.5, portfolioValue: 10750000, rank: 5 },
      ],
    },
    {
      id: '2',
      name: 'Team AMD',
      color: '#EF4444',
      totalProfitRate: 8.3,
      averageReturn: 8.3,
      members: [
        { id: '6', username: 'RedTeamWin', profitRate: 14.7, portfolioValue: 11470000, rank: 1 },
        { id: '7', username: 'AMDLover', profitRate: 11.2, portfolioValue: 11120000, rank: 2 },
        { id: '8', username: 'RyzenKing', profitRate: 8.5, portfolioValue: 10850000, rank: 3 },
        { id: '9', username: 'ChipWarrior', profitRate: 5.1, portfolioValue: 10510000, rank: 4 },
        { id: '10', username: 'ValueInvest', profitRate: 2.0, portfolioValue: 10200000, rank: 5 },
      ],
    },
  ];

  const stocks: Stock[] = [
    {
      symbol: 'NVDA',
      name: 'NVIDIA Corporation',
      currentPrice: 525.30,
      change: 12.50,
      changePercent: 2.43,
      delayMinutes: 15,
    },
    {
      symbol: 'AMD',
      name: 'Advanced Micro Devices',
      currentPrice: 142.80,
      change: -1.20,
      changePercent: -0.83,
      delayMinutes: 15,
    },
  ];

  const isParticipating = true; // 임시로 참여 중인 것으로 설정

  const handleTrade = () => {
    navigation.navigate('Main');
  };

  const handleJoinBattle = () => {
    Alert.alert('팀 선택', '어느 팀에 참여하시겠습니까?', [
      { text: teams[0].name, onPress: () => Alert.alert('참여 완료', `${teams[0].name}에 참여했습니다!`) },
      { text: teams[1].name, onPress: () => Alert.alert('참여 완료', `${teams[1].name}에 참여했습니다!`) },
      { text: '취소', style: 'cancel' },
    ]);
  };

  const handlePostComment = () => {
    if (commentText.trim()) {
      const newComment: Comment = {
        id: Date.now().toString(),
        username: 'investor123',
        content: commentText.trim(),
        timestamp: new Date().toLocaleString('ko-KR'),
        likes: 0,
      };
      setComments([newComment, ...comments]);
      setCommentText('');
    }
  };

  const totalParticipants = teams.reduce((sum, team) => sum + team.members.length, 0);
  const maxRate = Math.max(...teams.map(t => Math.abs(t.totalProfitRate)));

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
              <Text style={[styles.title, { color: colors.text }]}>{battle.title}</Text>
              <View style={[styles.statusBadge, { backgroundColor: '#10B981' }]}>
                <Text style={styles.statusText}>진행중</Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <IconSymbol size={14} name="calendar" color={colors.icon} />
                <Text style={[styles.metaText, { color: colors.icon }]}>
                  {battle.startDate} - {battle.endDate}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <IconSymbol size={14} name="person.2.fill" color={colors.icon} />
                <Text style={[styles.metaText, { color: colors.icon }]}>
                  {totalParticipants}명 참여
                </Text>
              </View>
            </View>

            <Text style={[styles.description, { color: colors.icon }]}>
              {battle.description}
            </Text>
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

            <View style={styles.barChartContainer}>
              {teams.map((team, index) => {
                const barWidth = (Math.abs(team.totalProfitRate) / maxRate) * 100;
                const isPositive = team.totalProfitRate >= 0;

                return (
                  <View key={team.id} style={styles.barChartRow}>
                    <View style={styles.teamInfo}>
                      <View style={[styles.teamColorDot, { backgroundColor: team.color }]} />
                      <Text style={[styles.teamBarName, { color: colors.text }]}>
                        {team.name}
                      </Text>
                    </View>

                    <View style={styles.barContainer}>
                      <View style={[
                        styles.barFill,
                        {
                          width: `${barWidth}%`,
                          backgroundColor: team.color,
                        }
                      ]} />
                    </View>

                    <Text style={[
                      styles.barValue,
                      { color: isPositive ? '#10B981' : '#EF4444' }
                    ]}>
                      {isPositive ? '+' : ''}{team.totalProfitRate.toFixed(1)}%
                    </Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.chartLegend}>
              <Text style={[styles.legendText, { color: colors.icon }]}>
                {teams[0].totalProfitRate > teams[1].totalProfitRate ? teams[0].name : teams[1].name}이(가){' '}
                <Text style={{ fontWeight: '700', color: colors.text }}>
                  {Math.abs(teams[0].totalProfitRate - teams[1].totalProfitRate).toFixed(1)}%p
                </Text>
                {' '}앞서고 있습니다
              </Text>
            </View>
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
        {teams.map((team) => (
          <View
            key={team.id}
            style={[styles.card, styles.shadow, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>

            <View style={styles.teamHeader}>
              <View style={styles.teamHeaderLeft}>
                <View style={[styles.teamColorDot, { backgroundColor: team.color }]} />
                <ThemedText type="subtitle" style={styles.teamName}>
                  {team.name}
                </ThemedText>
              </View>
              <View style={styles.teamStats}>
                <Text style={[styles.teamStatLabel, { color: colors.icon }]}>평균 수익률</Text>
                <Text style={[
                  styles.teamStatValue,
                  { color: team.averageReturn >= 0 ? '#10B981' : '#EF4444' }
                ]}>
                  {team.averageReturn >= 0 ? '+' : ''}{team.averageReturn.toFixed(1)}%
                </Text>
              </View>
            </View>

            {/* 팀원 목록 */}
            <View style={styles.membersContainer}>
              {team.members.map((member, index) => (
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
                    <Text style={[styles.memberUsername, { color: colors.text }]}>
                      {member.username}
                    </Text>
                    <Text style={[styles.memberValue, { color: colors.icon }]}>
                      ₩{member.portfolioValue.toLocaleString()}
                    </Text>
                  </View>

                  <Text style={[
                    styles.memberProfit,
                    { color: member.profitRate >= 0 ? '#10B981' : '#EF4444' }
                  ]}>
                    {member.profitRate >= 0 ? '+' : ''}{member.profitRate.toFixed(1)}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* 참여/매매 버튼 */}
        <View style={styles.actionButtons}>
          {isParticipating ? (
            <>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#10B981', flex: 1 }]}
                onPress={handleTrade}>
                <IconSymbol size={20} name="cart.fill" color="#FFFFFF" />
                <Text style={styles.actionButtonText}>매수하기</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#EF4444', flex: 1 }]}
                onPress={handleTrade}>
                <IconSymbol size={20} name="arrow.up.circle.fill" color="#FFFFFF" />
                <Text style={styles.actionButtonText}>매도하기</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#6366F1' }]}
              onPress={handleJoinBattle}>
              <IconSymbol size={20} name="person.badge.plus.fill" color="#FFFFFF" />
              <Text style={styles.actionButtonText}>대결 참여하기</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 댓글 섹션 */}
        <View style={[styles.card, styles.shadow, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
          <View style={styles.commentsHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              댓글 {comments.length}
            </ThemedText>
          </View>

          {/* 댓글 입력 */}
          <View style={[styles.commentInputContainer, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' }]}>
            <TextInput
              style={[styles.commentInput, { color: colors.text }]}
              placeholder="댓글을 입력하세요..."
              placeholderTextColor={colors.icon}
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <TouchableOpacity
              style={[styles.commentButton, { backgroundColor: '#6366F1' }]}
              onPress={handlePostComment}>
              <IconSymbol size={18} name="paperplane.fill" color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* 댓글 목록 */}
          <View style={styles.commentsList}>
            {comments.map((comment, index) => (
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
                    {comment.username}
                  </Text>
                  <Text style={[styles.commentTimestamp, { color: colors.icon }]}>
                    {comment.timestamp}
                  </Text>
                </View>
                <Text style={[styles.commentContent, { color: colors.text }]}>
                  {comment.content}
                </Text>
                <TouchableOpacity style={styles.likeButton}>
                  <IconSymbol size={14} name="heart" color={colors.icon} />
                  <Text style={[styles.likeCount, { color: colors.icon }]}>
                    {comment.likes}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
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
