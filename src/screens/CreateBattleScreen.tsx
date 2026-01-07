import { ThemedText } from '../components/ThemedText';
import { IconSymbol } from '../components/ui/IconSymbol';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/useColorScheme';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useState } from 'react';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type Category = '미국주식' | '가상화폐' | '국내주식' | '기타';

export default function CreateBattleScreen() {
  const navigation = useNavigation<NavigationProp>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [step, setStep] = useState(1);
  const [battleData, setBattleData] = useState({
    title: '',
    description: '',
    category: '미국주식' as Category,
    startDate: '',
    endDate: '',
    teams: [
      { name: '', slots: 10 },
      { name: '', slots: 10 },
    ],
  });
  const [inviteCode, setInviteCode] = useState('');

  const categories: Category[] = ['미국주식', '가상화폐', '국내주식', '기타'];

  const generateInviteCode = () => {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    setInviteCode(code);
  };

  const handleAddTeam = () => {
    if (battleData.teams.length < 4) {
      setBattleData({
        ...battleData,
        teams: [...battleData.teams, { name: '', slots: 10 }],
      });
    } else {
      Alert.alert('알림', '최대 4개 팀까지 생성할 수 있습니다.');
    }
  };

  const handleRemoveTeam = (index: number) => {
    if (battleData.teams.length > 2) {
      const newTeams = battleData.teams.filter((_, i) => i !== index);
      setBattleData({ ...battleData, teams: newTeams });
    } else {
      Alert.alert('알림', '최소 2개 팀이 필요합니다.');
    }
  };

  const handleUpdateTeam = (index: number, field: 'name' | 'slots', value: string | number) => {
    const newTeams = [...battleData.teams];
    newTeams[index] = { ...newTeams[index], [field]: value };
    setBattleData({ ...battleData, teams: newTeams });
  };

  const validateStep1 = () => {
    if (!battleData.title.trim()) {
      Alert.alert('오류', '대결 제목을 입력해주세요.');
      return false;
    }
    if (!battleData.description.trim()) {
      Alert.alert('오류', '대결 설명을 입력해주세요.');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!battleData.startDate || !battleData.endDate) {
      Alert.alert('오류', '대결 기간을 입력해주세요.');
      return false;
    }
    const start = new Date(battleData.startDate);
    const end = new Date(battleData.endDate);
    if (end <= start) {
      Alert.alert('오류', '종료일은 시작일보다 뒤여야 합니다.');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    for (let i = 0; i < battleData.teams.length; i++) {
      if (!battleData.teams[i].name.trim()) {
        Alert.alert('오류', `팀 ${i + 1}의 이름을 입력해주세요.`);
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    } else if (step === 3 && validateStep3()) {
      setStep(4);
      generateInviteCode();
    }
  };

  const handleComplete = () => {
    Alert.alert(
      '대결 생성 완료',
      '대결이 성공적으로 생성되었습니다!\n초대 코드를 공유하여 친구들을 초대하세요.',
      [
        {
          text: '확인',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  const copyInviteCode = () => {
    Alert.alert('복사 완료', `초대 코드 "${inviteCode}"가 클립보드에 복사되었습니다.`);
  };

  const shareInviteCode = () => {
    Alert.alert('공유하기', `초대 코드: ${inviteCode}\n\n친구에게 공유할 방법을 선택하세요.`);
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      {[1, 2, 3, 4].map((num) => (
        <View key={num} style={styles.progressStep}>
          <View style={[
            styles.progressDot,
            {
              backgroundColor: step >= num ? '#6366F1' : colorScheme === 'dark' ? '#334155' : '#E5E7EB',
            },
          ]}>
            {step > num ? (
              <IconSymbol size={14} name="checkmark" color="#FFFFFF" />
            ) : (
              <Text style={[styles.progressNumber, { color: step >= num ? '#FFFFFF' : colors.icon }]}>
                {num}
              </Text>
            )}
          </View>
          {num < 4 && (
            <View style={[
              styles.progressLine,
              {
                backgroundColor: step > num ? '#6366F1' : colorScheme === 'dark' ? '#334155' : '#E5E7EB',
              },
            ]} />
          )}
        </View>
      ))}
    </View>
  );

  const renderStepIndicator = () => {
    const stepTitles = ['대결 정보', '대결 기간', '팀 설정', '초대 코드'];
    return (
      <View style={styles.stepIndicator}>
        <Text style={[styles.stepTitle, { color: colors.text }]}>
          {stepTitles[step - 1]}
        </Text>
        <Text style={[styles.stepDescription, { color: colors.icon }]}>
          {step}/4 단계
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' }]}>
      {/* 헤더 */}
      <View style={[styles.header, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (step === 1) {
              navigation.goBack();
            } else {
              setStep(step - 1);
            }
          }}>
          <IconSymbol size={24} name="chevron.left" color={colors.text} />
        </TouchableOpacity>
        <ThemedText type="subtitle" style={styles.headerTitle}>
          대결 만들기
        </ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer}>
        {renderProgressBar()}
        {renderStepIndicator()}

        {/* Step 1: 대결 정보 */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <View style={[styles.card, styles.shadow, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  대결 제목 <Text style={{ color: '#EF4444' }}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC', color: colors.text }]}
                  placeholder="예: NVIDIA vs AMD - AI 반도체 대전"
                  placeholderTextColor={colors.icon}
                  value={battleData.title}
                  onChangeText={(text) => setBattleData({ ...battleData, title: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  대결 설명 <Text style={{ color: '#EF4444' }}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC', color: colors.text }
                  ]}
                  placeholder="대결에 대한 설명을 입력하세요"
                  placeholderTextColor={colors.icon}
                  value={battleData.description}
                  onChangeText={(text) => setBattleData({ ...battleData, description: text })}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  카테고리 <Text style={{ color: '#EF4444' }}>*</Text>
                </Text>
                <View style={[styles.pickerContainer, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' }]}>
                  <Picker
                    selectedValue={battleData.category}
                    onValueChange={(value) => setBattleData({ ...battleData, category: value as Category })}
                    style={{ color: colors.text }}>
                    {categories.map((cat) => (
                      <Picker.Item key={cat} label={cat} value={cat} />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Step 2: 대결 기간 */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <View style={[styles.card, styles.shadow, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  시작일 <Text style={{ color: '#EF4444' }}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC', color: colors.text }]}
                  placeholder="YYYY-MM-DD (예: 2026-01-05)"
                  placeholderTextColor={colors.icon}
                  value={battleData.startDate}
                  onChangeText={(text) => setBattleData({ ...battleData, startDate: text })}
                />
                <Text style={[styles.helperText, { color: colors.icon }]}>
                  형식: YYYY-MM-DD
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  종료일 <Text style={{ color: '#EF4444' }}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC', color: colors.text }]}
                  placeholder="YYYY-MM-DD (예: 2026-02-05)"
                  placeholderTextColor={colors.icon}
                  value={battleData.endDate}
                  onChangeText={(text) => setBattleData({ ...battleData, endDate: text })}
                />
                <Text style={[styles.helperText, { color: colors.icon }]}>
                  형식: YYYY-MM-DD
                </Text>
              </View>

              <View style={[styles.infoBox, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F1F5F9' }]}>
                <IconSymbol size={20} name="info.circle.fill" color="#6366F1" />
                <Text style={[styles.infoText, { color: colors.icon }]}>
                  대결 기간은 최소 7일, 최대 90일까지 설정할 수 있습니다.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Step 3: 팀 설정 */}
        {step === 3 && (
          <View style={styles.stepContent}>
            {battleData.teams.map((team, index) => (
              <View
                key={index}
                style={[styles.card, styles.shadow, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
                <View style={styles.teamCardHeader}>
                  <Text style={[styles.teamCardTitle, { color: colors.text }]}>
                    팀 {index + 1}
                  </Text>
                  {battleData.teams.length > 2 && (
                    <TouchableOpacity
                      style={styles.removeTeamButton}
                      onPress={() => handleRemoveTeam(index)}>
                      <IconSymbol size={18} name="xmark.circle.fill" color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    팀 이름 <Text style={{ color: '#EF4444' }}>*</Text>
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC', color: colors.text }]}
                    placeholder={`예: Team ${index === 0 ? 'NVIDIA' : 'AMD'}`}
                    placeholderTextColor={colors.icon}
                    value={team.name}
                    onChangeText={(text) => handleUpdateTeam(index, 'name', text)}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    최대 인원
                  </Text>
                  <View style={styles.slotSelector}>
                    <TouchableOpacity
                      style={[styles.slotButton, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' }]}
                      onPress={() => handleUpdateTeam(index, 'slots', Math.max(2, team.slots - 1))}>
                      <IconSymbol size={16} name="minus" color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.slotValue, { color: colors.text }]}>
                      {team.slots}명
                    </Text>
                    <TouchableOpacity
                      style={[styles.slotButton, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' }]}
                      onPress={() => handleUpdateTeam(index, 'slots', Math.min(50, team.slots + 1))}>
                      <IconSymbol size={16} name="plus" color={colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}

            {battleData.teams.length < 4 && (
              <TouchableOpacity
                style={[styles.addTeamButton, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}
                onPress={handleAddTeam}>
                <IconSymbol size={20} name="plus.circle.fill" color="#6366F1" />
                <Text style={[styles.addTeamText, { color: '#6366F1' }]}>
                  팀 추가하기
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Step 4: 초대 코드 */}
        {step === 4 && (
          <View style={styles.stepContent}>
            <View style={[styles.card, styles.shadow, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
              <View style={styles.successIcon}>
                <IconSymbol size={48} name="checkmark.circle.fill" color="#10B981" />
              </View>

              <Text style={[styles.successTitle, { color: colors.text }]}>
                대결 생성 완료!
              </Text>
              <Text style={[styles.successDescription, { color: colors.icon }]}>
                아래 초대 코드를 친구들에게 공유하세요
              </Text>

              <View style={[styles.inviteCodeContainer, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' }]}>
                <Text style={[styles.inviteCode, { color: '#6366F1' }]}>
                  {inviteCode}
                </Text>
              </View>

              <View style={styles.shareButtons}>
                <TouchableOpacity
                  style={[styles.shareButton, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' }]}
                  onPress={copyInviteCode}>
                  <IconSymbol size={20} name="doc.on.doc.fill" color="#6366F1" />
                  <Text style={[styles.shareButtonText, { color: '#6366F1' }]}>
                    복사
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.shareButton, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' }]}
                  onPress={shareInviteCode}>
                  <IconSymbol size={20} name="square.and.arrow.up.fill" color="#6366F1" />
                  <Text style={[styles.shareButtonText, { color: '#6366F1' }]}>
                    공유
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.infoBox, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F1F5F9' }]}>
                <IconSymbol size={20} name="info.circle.fill" color="#6366F1" />
                <Text style={[styles.infoText, { color: colors.icon }]}>
                  초대 코드는 대결 시작 전까지만 사용할 수 있습니다. 코드를 잘 보관하세요!
                </Text>
              </View>
            </View>

            <View style={[styles.battleSummary, styles.card, styles.shadow, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
              <Text style={[styles.summaryTitle, { color: colors.text }]}>
                대결 요약
              </Text>

              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.icon }]}>제목</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>{battleData.title}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.icon }]}>카테고리</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>{battleData.category}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.icon }]}>기간</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {battleData.startDate} ~ {battleData.endDate}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.icon }]}>팀 수</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {battleData.teams.length}개 팀
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={[styles.footer, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
        {step < 4 ? (
          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: '#6366F1' }]}
            onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {step === 3 ? '대결 생성하기' : '다음'}
            </Text>
            <IconSymbol size={18} name="chevron.right" color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: '#10B981' }]}
            onPress={handleComplete}>
            <Text style={styles.nextButtonText}>완료</Text>
            <IconSymbol size={18} name="checkmark" color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressNumber: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressLine: {
    width: 40,
    height: 2,
    marginHorizontal: 4,
  },
  stepIndicator: {
    marginBottom: 24,
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
  },
  stepContent: {
    gap: 16,
  },
  card: {
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
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
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
    height: 100,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    marginTop: 6,
  },
  pickerContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  infoBox: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  teamCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  teamCardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  removeTeamButton: {
    padding: 4,
  },
  slotSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  slotButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotValue: {
    fontSize: 18,
    fontWeight: '700',
    minWidth: 60,
    textAlign: 'center',
  },
  addTeamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#6366F1',
    borderStyle: 'dashed',
  },
  addTeamText: {
    fontSize: 15,
    fontWeight: '700',
  },
  successIcon: {
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  successDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  inviteCodeContainer: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  inviteCode: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 4,
  },
  shareButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 12,
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  battleSummary: {
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.1)',
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  footer: {
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 12,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
