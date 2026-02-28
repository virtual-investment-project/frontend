import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useColorScheme } from '../hooks/useColorScheme';
import { Colors } from '../constants/theme';
import { IconSymbol } from '../components/ui/IconSymbol';
import { ThemedText } from '../components/ThemedText';
import { getBattleAccountProfits } from '../services/battleService';
import { getTeamMembers, kickTeamMember } from '../services/teamService';
import { getBattleAccountProfit, getPersonalAccountProfit } from '../services/accountService';
import { AccountProfitResponse, TeamMemberResponse } from '../types/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type TeamManageRouteProp = RouteProp<RootStackParamList, 'TeamManage'>;

type MemberRow = {
  teamUserId: number;
  userId: string;
  nickname: string;
  role: TeamMemberResponse['role'];
  status: TeamMemberResponse['status'];
  returnRate: number | null;
  returnAmount: number | null;
};

export default function TeamManageScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<TeamManageRouteProp>();
  const { battleId, teamId, teamName } = route.params;
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  const [loading, setLoading] = useState(true);
  const [canManage, setCanManage] = useState(false);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [kickingId, setKickingId] = useState<number | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);

  const dy = {
    pageBg: { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' },
    cardBg: { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
    textColor: { color: colors.text },
    iconColor: { color: colors.icon },
    borderTop: { borderTopWidth: 1 as const, borderTopColor: isDark ? '#334155' : '#E5E7EB' },
    mutedBg: { backgroundColor: isDark ? '#0F172A' : '#F1F5F9' },
  };

  const loadMyUserId = useCallback(async (): Promise<string | null> => {
    try {
      const myProfit = await getPersonalAccountProfit();
      return myProfit.userId;
    } catch {
      try {
        const battleProfit = await getBattleAccountProfit(battleId);
        return battleProfit.userId;
      } catch {
        return null;
      }
    }
  }, [battleId]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [membersData, accountProfits, me] = await Promise.all([
        getTeamMembers(teamId),
        getBattleAccountProfits(battleId).catch(() => [] as AccountProfitResponse[]),
        loadMyUserId(),
      ]);

      setMyUserId(me);

      const myMembership = membersData.find((member) => member.userId === me && member.status === 'ACTIVE');
      const isLeader = !!myMembership && myMembership.role === 'LEADER';
      setCanManage(isLeader);

      if (!isLeader) {
        Alert.alert('권한 없음', '팀장만 팀 관리 페이지에 접근할 수 있습니다.', [
          { text: '확인', onPress: () => navigation.goBack() },
        ]);
        return;
      }

      const profitsByUserId = new Map(accountProfits.map((item) => [item.userId, item]));

      const rows: MemberRow[] = membersData.map((member) => {
        const profit = profitsByUserId.get(member.userId);
        return {
          teamUserId: member.id,
          userId: member.userId,
          nickname: member.userNickname,
          role: member.role,
          status: member.status,
          returnRate: profit?.returnRate ?? null,
          returnAmount: profit?.returnAmount ?? null,
        };
      });

      rows.sort((a, b) => {
        if (a.role === 'LEADER' && b.role !== 'LEADER') return -1;
        if (a.role !== 'LEADER' && b.role === 'LEADER') return 1;
        if (a.returnRate == null && b.returnRate == null) return 0;
        if (a.returnRate == null) return 1;
        if (b.returnRate == null) return -1;
        return b.returnRate - a.returnRate;
      });

      setMembers(rows);
    } catch (error: any) {
      console.error('팀 관리 데이터 조회 오류:', error);
      Alert.alert('오류', error?.response?.data?.message || '팀 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [battleId, teamId, navigation, loadMyUserId]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const activeMembers = useMemo(
    () => members.filter((member) => member.status === 'ACTIVE'),
    [members]
  );

  const handleKick = useCallback((member: MemberRow) => {
    Alert.alert(
      '팀원 추방',
      `${member.nickname}님을 팀에서 추방하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '추방',
          style: 'destructive',
          onPress: async () => {
            try {
              setKickingId(member.teamUserId);
              await kickTeamMember(teamId, member.teamUserId);
              Alert.alert('완료', '팀원을 추방했습니다.');
              await fetchData();
            } catch (error: any) {
              console.error('팀원 추방 실패:', error);
              Alert.alert('실패', error?.response?.data?.message || '팀원 추방에 실패했습니다.');
            } finally {
              setKickingId(null);
            }
          },
        },
      ]
    );
  }, [teamId, fetchData]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center, dy.pageBg]}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={[styles.loadingText, dy.iconColor]}>팀 정보를 불러오는 중...</Text>
      </View>
    );
  }

  if (!canManage) {
    return (
      <View style={[styles.container, styles.center, dy.pageBg]}>
        <IconSymbol size={32} name="lock.fill" color="#EF4444" />
        <Text style={[styles.loadingText, dy.iconColor]}>팀장 권한이 필요합니다.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, dy.pageBg]}>
      <View style={[styles.header, dy.pageBg]}>
        <TouchableOpacity style={[styles.backButton, dy.cardBg]} onPress={() => navigation.goBack()}>
          <IconSymbol size={18} name="chevron.left" color={colors.icon} />
          <Text style={[styles.backText, dy.textColor]}>배틀 상세</Text>
        </TouchableOpacity>

        <ThemedText type="title" style={styles.title}>팀 관리</ThemedText>
        <Text style={[styles.subtitle, dy.iconColor]}>{teamName} · {activeMembers.length}명</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, dy.cardBg]}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>팀원 수익률</ThemedText>

          {members.map((member, index) => {
            const returnRateStyle =
              member.returnRate == null
                ? dy.iconColor
                : member.returnRate >= 0
                  ? styles.profitPositive
                  : styles.profitNegative;

            const canKick = member.status === 'ACTIVE' && member.role !== 'LEADER' && member.userId !== myUserId;

            return (
              <View key={member.teamUserId} style={[styles.memberRow, index > 0 && dy.borderTop]}>
                <View style={styles.memberLeft}>
                  <View style={[styles.rankCircle, dy.mutedBg]}>
                    <Text style={[styles.rankText, dy.iconColor]}>{index + 1}</Text>
                  </View>

                  <View style={styles.memberInfo}>
                    <View style={styles.nameRow}>
                      <Text style={[styles.memberName, dy.textColor]}>{member.nickname}</Text>
                      {member.role === 'LEADER' && (
                        <View style={styles.leaderBadge}>
                          <Text style={styles.leaderBadgeText}>리더</Text>
                        </View>
                      )}
                      {member.status !== 'ACTIVE' && (
                        <View style={[styles.statusBadge, dy.mutedBg]}>
                          <Text style={[styles.statusText, dy.iconColor]}>
                            {member.status === 'LEFT' ? '탈퇴' : '강퇴'}
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text style={[styles.amountText, dy.iconColor]}>
                      {member.returnAmount == null
                        ? '수익 데이터 없음'
                        : `${member.returnAmount >= 0 ? '+' : ''}${member.returnAmount.toLocaleString()}원`}
                    </Text>
                  </View>
                </View>

                <View style={styles.memberRight}>
                  <Text style={[styles.rateText, returnRateStyle]}>
                    {member.returnRate == null
                      ? '-'
                      : `${member.returnRate >= 0 ? '+' : ''}${member.returnRate.toFixed(2)}%`}
                  </Text>

                  {canKick && (
                    <TouchableOpacity
                      style={styles.kickButton}
                      onPress={() => handleKick(member)}
                      disabled={kickingId === member.teamUserId}
                    >
                      {kickingId === member.teamUserId ? (
                        <ActivityIndicator size="small" color="#EF4444" />
                      ) : (
                        <Text style={styles.kickText}>추방</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 12,
  },
  backText: {
    fontSize: 13,
    fontWeight: '600',
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  card: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    marginBottom: 14,
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  rankCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
  },
  memberInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  memberName: {
    fontSize: 15,
    fontWeight: '700',
  },
  leaderBadge: {
    backgroundColor: '#6366F1',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  leaderBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  amountText: {
    fontSize: 12,
  },
  memberRight: {
    alignItems: 'flex-end',
    minWidth: 90,
  },
  rateText: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  kickButton: {
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 8,
    minWidth: 54,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  kickText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
  },
  profitPositive: {
    color: '#10B981',
  },
  profitNegative: {
    color: '#EF4444',
  },
});
