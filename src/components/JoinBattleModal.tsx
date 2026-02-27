import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { IconSymbol } from './ui/IconSymbol';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/useColorScheme';
import { TeamResponse } from '../types/api';
import { joinTeam, createTeam } from '../services/teamService';

interface JoinBattleModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    battleId: string;
    teams: TeamResponse[];
}

type TabType = 'select' | 'create';

const TEAM_COLORS = ['#10B981', '#EF4444', '#6366F1', '#F59E0B', '#8B5CF6', '#EC4899'];

export default function JoinBattleModal({
    visible,
    onClose,
    onSuccess,
    battleId,
    teams,
}: JoinBattleModalProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const [activeTab, setActiveTab] = useState<TabType>('select');
    const [loading, setLoading] = useState(false);

    // 팀 선택 후 초대 코드 입력
    const [selectedTeam, setSelectedTeam] = useState<TeamResponse | null>(null);
    const [selectInviteCode, setSelectInviteCode] = useState('');

    // 팀 생성
    const [newTeamName, setNewTeamName] = useState('');
    const [newTeamDescription, setNewTeamDescription] = useState('');

    const resetForm = () => {
        setSelectedTeam(null);
        setSelectInviteCode('');
        setNewTeamName('');
        setNewTeamDescription('');
        setActiveTab('select');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    // 팀 선택 후 초대 코드로 참가
    const handleJoinSelectedTeam = async () => {
        const code = selectInviteCode.trim();
        if (!selectedTeam) {
            Alert.alert('오류', '참가할 팀을 선택해주세요.');
            return;
        }
        if (!code) {
            Alert.alert('오류', '초대 코드를 입력해주세요.');
            return;
        }
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(code)) {
            Alert.alert('오류', '올바른 초대 코드 형식이 아닙니다.\n(예: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)');
            return;
        }
        try {
            setLoading(true);
            const team = await joinTeam({ inviteCode: code });
            Alert.alert('참가 완료', `${team.name}에 참가했습니다!`, [
                { text: '확인', onPress: () => { handleClose(); onSuccess(); } }
            ]);
        } catch (err: any) {
            console.error('팀 참가 오류:', err);
            let errorMessage = '팀 참가에 실패했습니다.';
            if (err.response?.status === 403) {
                errorMessage = err.response?.data?.message || '이미 이 배틀에서 팀에 가입되어 있거나, 참가가 제한되었습니다.';
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            }
            Alert.alert('오류', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // 새 팀 생성
    const handleCreateTeam = async () => {
        if (!newTeamName.trim()) {
            Alert.alert('오류', '팀 이름을 입력해주세요.');
            return;
        }

        try {
            setLoading(true);
            console.log('팀 생성 요청:', { name: newTeamName.trim(), description: newTeamDescription.trim() || undefined });
            const team = await createTeam(battleId, {
                name: newTeamName.trim(),
                description: newTeamDescription.trim() || undefined,
            });
            Alert.alert('팀 생성 완료', `${team.name} 팀을 생성하고 참가했습니다!`, [
                { text: '확인', onPress: () => { handleClose(); onSuccess(); } }
            ]);
        } catch (err: any) {
            console.error('팀 생성 오류:', err);
            console.error('에러 상세:', {
                status: err.response?.status,
                statusText: err.response?.statusText,
                message: err.response?.data?.message,
                data: err.response?.data
            });
            
            // 사용자 친화적인 에러 메시지 표시
            let errorMessage = '팀 생성에 실패했습니다.';
            if (err.response?.status === 403) {
                errorMessage = '이미 이 배틀에서 팀에 가입되어 있습니다. 한 배틀에는 하나의 팀에만 참가할 수 있습니다.';
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            }
            
            Alert.alert('팀 생성 불가', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'select':
                return (
                    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
                        {teams.length === 0 ? (
                            <View style={styles.emptyState}>
                                <IconSymbol size={32} name="person.2.slash" color={colors.icon} />
                                <Text style={[styles.emptyText, { color: colors.icon }]}>
                                    참여 가능한 팀이 없습니다.{'\n'}새 팀을 만들어보세요!
                                </Text>
                            </View>
                        ) : (
                            <>
                                <Text style={[styles.inputLabel, { color: colors.text, marginBottom: 12 }]}>
                                    참가할 팀 선택
                                </Text>
                                {teams.map((team, index) => {
                                    const teamColor = TEAM_COLORS[index % TEAM_COLORS.length];
                                    const isSelected = selectedTeam?.id === team.id;
                                    return (
                                        <TouchableOpacity
                                            key={team.id}
                                            style={[
                                                styles.teamCard,
                                                {
                                                    backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC',
                                                    borderWidth: 2,
                                                    borderColor: isSelected ? '#6366F1' : 'transparent',
                                                }
                                            ]}
                                            onPress={() => {
                                                setSelectedTeam(isSelected ? null : team);
                                                setSelectInviteCode('');
                                            }}
                                            disabled={loading}
                                        >
                                            <View style={styles.teamCardContent}>
                                                <View style={[styles.teamColorDot, { backgroundColor: teamColor }]} />
                                                <View style={{ flex: 1 }}>
                                                    <Text style={[styles.teamCardName, { color: colors.text }]}>
                                                        {team.name}
                                                    </Text>
                                                    <Text style={[styles.teamCardMeta, { color: colors.icon }]}>
                                                        {team.memberCount}명 참가중
                                                        {team.rate !== 0 && ` • 수익률 ${team.rate >= 0 ? '+' : ''}${team.rate.toFixed(1)}%`}
                                                    </Text>
                                                    {team.description && (
                                                        <Text style={[styles.teamCardDescription, { color: colors.icon }]} numberOfLines={1}>
                                                            {team.description}
                                                        </Text>
                                                    )}
                                                </View>
                                                <IconSymbol
                                                    size={20}
                                                    name={isSelected ? 'checkmark.circle.fill' : 'circle'}
                                                    color={isSelected ? '#6366F1' : colors.icon}
                                                />
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}

                                {selectedTeam && (
                                    <>
                                        <Text style={[styles.inputLabel, { color: colors.text, marginTop: 20, marginBottom: 8 }]}>
                                            {selectedTeam.name} 초대 코드
                                        </Text>
                                        <TextInput
                                            style={[
                                                styles.input,
                                                {
                                                    backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC',
                                                    color: colors.text,
                                                    borderWidth: 1,
                                                    borderColor: '#6366F1',
                                                }
                                            ]}
                                            placeholder="팀 리더에게 받은 초대 코드 입력"
                                            placeholderTextColor={colors.icon}
                                            value={selectInviteCode}
                                            onChangeText={setSelectInviteCode}
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                            editable={!loading}
                                        />
                                        <Text style={[styles.helperText, { color: colors.icon }]}>
                                            UUID 형식 (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
                                        </Text>
                                        <TouchableOpacity
                                            style={[styles.submitButton, { backgroundColor: '#6366F1', opacity: loading ? 0.6 : 1 }]}
                                            onPress={handleJoinSelectedTeam}
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <ActivityIndicator size="small" color="#FFFFFF" />
                                            ) : (
                                                <Text style={styles.submitButtonText}>참가하기</Text>
                                            )}
                                        </TouchableOpacity>
                                    </>
                                )}
                            </>
                        )}
                    </ScrollView>
                );

            case 'create':
                return (
                    <View style={styles.tabContent}>
                        <Text style={[styles.inputLabel, { color: colors.text }]}>팀 이름 *</Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC',
                                    color: colors.text,
                                }
                            ]}
                            placeholder="팀 이름을 입력하세요"
                            placeholderTextColor={colors.icon}
                            value={newTeamName}
                            onChangeText={setNewTeamName}
                            editable={!loading}
                        />

                        <Text style={[styles.inputLabel, { color: colors.text, marginTop: 16 }]}>팀 설명 (선택)</Text>
                        <TextInput
                            style={[
                                styles.input,
                                styles.textArea,
                                {
                                    backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC',
                                    color: colors.text,
                                }
                            ]}
                            placeholder="팀 설명을 입력하세요"
                            placeholderTextColor={colors.icon}
                            value={newTeamDescription}
                            onChangeText={setNewTeamDescription}
                            multiline
                            numberOfLines={3}
                            editable={!loading}
                        />

                        <TouchableOpacity
                            style={[styles.submitButton, { backgroundColor: '#10B981', opacity: loading ? 0.6 : 1 }]}
                            onPress={handleCreateTeam}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.submitButtonText}>팀 생성하기</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                );
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <View style={[
                    styles.container,
                    { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }
                ]}>
                    {/* 헤더 */}
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: colors.text }]}>대결 참가하기</Text>
                        <TouchableOpacity onPress={handleClose} disabled={loading}>
                            <IconSymbol size={24} name="xmark.circle.fill" color={colors.icon} />
                        </TouchableOpacity>
                    </View>

                    {/* 탭 */}
                    <View style={[styles.tabs, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F1F5F9' }]}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'select' && styles.activeTab]}
                            onPress={() => setActiveTab('select')}
                            disabled={loading}
                        >
                            <Text style={[styles.tabText, { color: activeTab === 'select' ? '#6366F1' : colors.icon }]}>
                                초대 코드 입력
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'create' && styles.activeTab]}
                            onPress={() => setActiveTab('create')}
                            disabled={loading}
                        >
                            <Text style={[styles.tabText, { color: activeTab === 'create' ? '#6366F1' : colors.icon }]}>
                                팀 생성
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* 탭 컨텐츠 */}
                    {renderTabContent()}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
        paddingBottom: 34, // Safe area
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(148, 163, 184, 0.1)',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
    },
    tabs: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginTop: 16,
        padding: 4,
        borderRadius: 12,
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
    tabContent: {
        padding: 20,
        minHeight: 200,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
        gap: 12,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    teamCard: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    teamCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    teamColorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    teamCardName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    teamCardMeta: {
        fontSize: 13,
    },
    teamCardDescription: {
        fontSize: 12,
        marginTop: 4,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        height: 48,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 15,
    },
    textArea: {
        height: 80,
        paddingTop: 12,
        textAlignVertical: 'top',
    },
    helperText: {
        fontSize: 12,
        marginTop: 8,
    },
    submitButton: {
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
