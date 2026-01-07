import { ThemedText } from '../components/ThemedText';
import { IconSymbol } from '../components/ui/IconSymbol';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/useColorScheme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useState } from 'react';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Category = '전체' | '미국주식' | '가상화폐' | '국내주식' | '기타';

interface Team {
  name: string;
  profitRate: number;
  rank: number;
}

interface Battle {
  id: string;
  title: string;
  category: Category;
  startDate: string;
  endDate: string;
  status: 'ongoing' | 'ended' | 'upcoming';
  teams: Team[];
  participantCount: number;
}

export default function TeamsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [selectedCategory, setSelectedCategory] = useState<Category>('전체');

  // 임시 대결 데이터
  const battles: Battle[] = [
    {
      id: '1',
      title: 'NVIDIA vs AMD - AI 반도체 대전',
      category: '미국주식',
      startDate: '2026.01.01',
      endDate: '2026.01.31',
      status: 'ongoing',
      teams: [
        { name: 'Team NVIDIA', profitRate: 12.5, rank: 1 },
        { name: 'Team AMD', profitRate: 8.3, rank: 2 },
      ],
      participantCount: 24,
    },
    {
      id: '2',
      title: '비트코인 vs 이더리움 대결',
      category: '가상화폐',
      startDate: '2026.01.02',
      endDate: '2026.01.30',
      status: 'ongoing',
      teams: [
        { name: 'BTC Bulls', profitRate: 15.2, rank: 1 },
        { name: 'ETH Warriors', profitRate: 18.7, rank: 1 },
        { name: 'Crypto Mixers', profitRate: -2.1, rank: 3 },
      ],
      participantCount: 42,
    },
    {
      id: '3',
      title: '삼성전자 vs SK하이닉스',
      category: '국내주식',
      startDate: '2026.01.03',
      endDate: '2026.02.03',
      status: 'ongoing',
      teams: [
        { name: '삼성 투자단', profitRate: 7.1, rank: 1 },
        { name: 'SK 지지자들', profitRate: 9.4, rank: 1 },
      ],
      participantCount: 18,
    },
    {
      id: '4',
      title: 'FAANG 대전 - 누가 최고인가',
      category: '미국주식',
      startDate: '2025.12.20',
      endDate: '2026.01.20',
      status: 'ongoing',
      teams: [
        { name: 'Meta Believers', profitRate: 22.3, rank: 1 },
        { name: 'Apple Fans', profitRate: 14.8, rank: 2 },
        { name: 'Google Gang', profitRate: 11.2, rank: 3 },
        { name: 'Amazon Army', profitRate: 9.5, rank: 4 },
      ],
      participantCount: 67,
    },
    {
      id: '5',
      title: '알트코인 서바이벌',
      category: '가상화폐',
      startDate: '2026.01.15',
      endDate: '2026.02.15',
      status: 'upcoming',
      teams: [
        { name: 'Solana Squad', profitRate: 0, rank: 1 },
        { name: 'Cardano Crew', profitRate: 0, rank: 1 },
        { name: 'Polygon Players', profitRate: 0, rank: 1 },
      ],
      participantCount: 0,
    },
  ];

  const categories: Category[] = ['전체', '미국주식', '가상화폐', '국내주식', '기타'];

  const filteredBattles = selectedCategory === '전체'
    ? battles
    : battles.filter(b => b.category === selectedCategory);

  const getStatusBadge = (status: Battle['status']) => {
    const config = {
      ongoing: { text: '진행중', color: '#10B981' },
      ended: { text: '종료', color: '#6B7280' },
      upcoming: { text: '예정', color: '#F59E0B' },
    };
    return config[status];
  };

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' }]}>
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <ThemedText type="title" style={styles.title}>팀 대결</ThemedText>
              <ThemedText style={styles.subtitle}>실시간 수익률 대결을 확인하세요</ThemedText>
            </View>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: '#6366F1' }]}
              onPress={() => navigation.navigate('CreateBattle')}>
              <IconSymbol size={20} name="plus" color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 카테고리 필터 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterChip,
                {
                  backgroundColor: selectedCategory === category
                    ? '#6366F1'
                    : colorScheme === 'dark' ? '#1E293B' : '#FFFFFF',
                },
                styles.shadow,
              ]}
              onPress={() => setSelectedCategory(category)}>
              <Text style={[
                styles.filterText,
                { color: selectedCategory === category ? '#FFFFFF' : colors.text }
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 대결 목록 */}
        <View style={styles.battlesContainer}>
          {filteredBattles.map((battle) => {
            const statusBadge = getStatusBadge(battle.status);
            const topTeam = battle.teams.sort((a, b) => b.profitRate - a.profitRate)[0];

            return (
              <TouchableOpacity
                key={battle.id}
                style={[
                  styles.battleCard,
                  styles.shadow,
                  { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }
                ]}
                onPress={() => navigation.navigate('BattleDetail', { id: battle.id })}>

                {/* 카드 헤더 */}
                <View style={styles.battleHeader}>
                  <View style={styles.battleTitleRow}>
                    <Text style={[styles.battleTitle, { color: colors.text }]} numberOfLines={2}>
                      {battle.title}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusBadge.color }]}>
                      <Text style={styles.statusText}>{statusBadge.text}</Text>
                    </View>
                  </View>

                  <View style={styles.battleMeta}>
                    <View style={styles.metaItem}>
                      <IconSymbol size={14} name="calendar" color={colors.icon} />
                      <Text style={[styles.metaText, { color: colors.icon }]}>
                        {battle.startDate} - {battle.endDate}
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <IconSymbol size={14} name="person.2.fill" color={colors.icon} />
                      <Text style={[styles.metaText, { color: colors.icon }]}>
                        {battle.participantCount}명 참여
                      </Text>
                    </View>
                  </View>
                </View>

                {/* 팀 순위 */}
                <View style={styles.teamsSection}>
                  {battle.teams
                    .sort((a, b) => b.profitRate - a.profitRate)
                    .slice(0, 3)
                    .map((team, index) => (
                      <View
                        key={index}
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
                          {battle.status !== 'upcoming' && (
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
                                  color: team.profitRate > 0 ? '#10B981' :
                                    team.profitRate < 0 ? '#EF4444' : colors.icon,
                                  fontWeight: index === 0 ? '800' : '600',
                                }
                              ]}>
                                {team.profitRate > 0 ? '+' : ''}{team.profitRate}%
                              </Text>
                            </>
                          )}
                          {battle.status === 'upcoming' && (
                            <Text style={[styles.upcomingText, { color: colors.icon }]}>
                              대기중
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}

                  {battle.teams.length > 3 && (
                    <Text style={[styles.moreTeamsText, { color: colors.icon }]}>
                      +{battle.teams.length - 3}개 팀 더보기
                    </Text>
                  )}
                </View>

                {/* 카드 푸터 */}
                <View style={styles.battleFooter}>
                  <View style={[styles.categoryTag, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' }]}>
                    <Text style={[styles.categoryText, { color: colors.icon }]}>
                      {battle.category}
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

        {filteredBattles.length === 0 && (
          <View style={styles.emptyState}>
            <IconSymbol size={48} name="tray" color={colors.icon} />
            <Text style={[styles.emptyText, { color: colors.icon }]}>
              해당 카테고리에 대결이 없습니다
            </Text>
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
  filterContainer: {
    marginBottom: 20,
  },
  filterContent: {
    gap: 10,
    paddingVertical: 4,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  battlesContainer: {
    gap: 16,
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
});
