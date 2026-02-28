import { ThemedText } from '../components/ThemedText';
import { IconSymbol } from '../components/ui/IconSymbol';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/useColorScheme';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useState, useEffect } from 'react';
import { createBattle } from '../services/battleService';
import { BattleType, MetricType } from '../types/api';
import { Stock, searchSymbols } from '../types/tradingview';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// 날짜 자동 포맷팅 (YYYYMMDD → YYYY-MM-DD)
const formatDateInput = (text: string): string => {
  // 숫자만 추출
  const numbers = text.replace(/[^0-9]/g, '');

  // 최대 8자리로 제한
  const limited = numbers.slice(0, 8);

  // 포맷팅
  if (limited.length <= 4) {
    return limited;
  } else if (limited.length <= 6) {
    return `${limited.slice(0, 4)}-${limited.slice(4)}`;
  } else {
    return `${limited.slice(0, 4)}-${limited.slice(4, 6)}-${limited.slice(6)}`;
  }
};

// 시간 자동 포맷팅 (HHmmss → HH:mm:ss)
const formatTimeInput = (text: string): string => {
  // 숫자만 추출
  const numbers = text.replace(/[^0-9]/g, '');

  // 최대 6자리로 제한
  const limited = numbers.slice(0, 6);

  // 포맷팅
  if (limited.length <= 2) {
    return limited;
  } else if (limited.length <= 4) {
    return `${limited.slice(0, 2)}:${limited.slice(2)}`;
  } else {
    return `${limited.slice(0, 2)}:${limited.slice(2, 4)}:${limited.slice(4)}`;
  }
};

export default function CreateBattleScreen() {
  const navigation = useNavigation<NavigationProp>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [step, setStep] = useState(1);
  const [battleData, setBattleData] = useState({
    name: '',
    ticker: '',
    tickerName: '',
    type: 'NORMAL' as BattleType,
    startAt: '',
    endAt: '',
    startTime: '09:00:00',
    endTime: '18:00:00',
    metricType: 'RATE' as MetricType,
    valuationTime: '15:30:00',
    initialCapital: 1000000,
    memberCount: 20,
    teamCount: 2,
  });
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tickerQuery, setTickerQuery] = useState('');
  const [tickerResults, setTickerResults] = useState<Stock[]>([]);
  const [showTickerResults, setShowTickerResults] = useState(false);

  // 종목 검색
  useEffect(() => {
    if (tickerQuery.trim()) {
      const results = searchSymbols(tickerQuery, 'all');
      setTickerResults(results);
      setShowTickerResults(true);
    } else {
      setTickerResults([]);
      setShowTickerResults(false);
    }
  }, [tickerQuery]);

  const generateInviteCode = () => {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    setInviteCode(code);
  };

  const validateStep1 = () => {
    if (!battleData.name.trim()) {
      Alert.alert('오류', '대결 이름을 입력해주세요.');
      return false;
    }
    if (!battleData.ticker.trim()) {
      Alert.alert('오류', '종목 티커를 입력해주세요.');
      return false;
    }
    if (battleData.initialCapital < 1) {
      Alert.alert('오류', '초기 자금은 최소 $1 이상이어야 합니다.');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!battleData.startAt || !battleData.endAt || !battleData.startTime || !battleData.endTime) {
      Alert.alert('오류', '대결 기간과 시간을 모두 입력해주세요.');
      return false;
    }
    const start = new Date(`${battleData.startAt}T${battleData.startTime}`);
    const end = new Date(`${battleData.endAt}T${battleData.endTime}`);
    if (end <= start) {
      Alert.alert('오류', '종료 일시는 시작 일시보다 뒤여야 합니다.');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (battleData.teamCount < 2) {
      Alert.alert('오류', '최소 2개 팀이 필요합니다.');
      return false;
    }
    if (battleData.memberCount < battleData.teamCount) {
      Alert.alert('오류', '참가자 수는 팀 수보다 많아야 합니다.');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    } else if (step === 3 && validateStep3()) {
      handleCreateBattle();
    }
  };

  const handleCreateBattle = async () => {
    try {
      setIsSubmitting(true);

      const requestData = {
        name: battleData.name,
        ticker: battleData.ticker,
        type: battleData.type,
        startAt: `${battleData.startAt}T${battleData.startTime}`,
        endAt: `${battleData.endAt}T${battleData.endTime}`,
        metricType: battleData.metricType,
        valuationTime: battleData.valuationTime,
        initialCapital: battleData.initialCapital,
        memberCount: battleData.memberCount,
        teamCount: battleData.teamCount,
      };

      const response = await createBattle(requestData);

      // 백엔드에서 생성된 배틀 정보를 받아옴 (초대 코드는 팀 생성 시 발급되므로 여기서는 배틀 ID만 저장)
      // 배틀 생성 직후에는 아직 팀이 없으므로 초대 코드를 보여줄 수 없음
      // 사용자가 배틀 상세 페이지로 이동해서 팀을 만들면 그때 초대 코드가 발급됨
      setStep(4);
    } catch (error: any) {

      let errorMessage = '대결 생성에 실패했습니다.';
      if (error.response?.status === 403) {
        errorMessage = '권한이 없습니다. 로그인이 필요합니다.';
        Alert.alert(
          '로그인 필요',
          '대결을 생성하려면 로그인이 필요합니다.',
          [
            { text: '취소', style: 'cancel' },
            {
              text: '로그인하기',
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' as never }],
                });
              }
            }
          ]
        );
        return;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message === 'Network Error') {
        errorMessage = '서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인하세요.';
      } else if (error.response?.status === 401) {
        errorMessage = '로그인이 필요합니다.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('오류', errorMessage);
    } finally {
      setIsSubmitting(false);
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
    const stepTitles = ['기본 정보', '대결 기간', '설정', '초대 코드'];
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

        {/* Step 1: 기본 정보 */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <View style={[styles.card, styles.shadow, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  대결 이름 <Text style={{ color: '#EF4444' }}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC', color: colors.text }]}
                  placeholder="예: NVIDIA vs AMD 대결"
                  placeholderTextColor={colors.icon}
                  value={battleData.name}
                  onChangeText={(text) => setBattleData({ ...battleData, name: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  종목 티커 <Text style={{ color: '#EF4444' }}>*</Text>
                </Text>
                {battleData.ticker ? (
                  <View style={[styles.selectedTickerContainer, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.selectedTickerSymbol, { color: colors.text }]}>
                        {battleData.ticker}
                      </Text>
                      {battleData.tickerName ? (
                        <Text style={[styles.selectedTickerName, { color: colors.icon }]}>
                          {battleData.tickerName}
                        </Text>
                      ) : null}
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setBattleData({ ...battleData, ticker: '', tickerName: '' });
                        setTickerQuery('');
                      }}
                      style={styles.clearTickerButton}>
                      <IconSymbol size={18} name="xmark.circle.fill" color={colors.icon} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <View style={[styles.searchInputContainer, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' }]}>
                      <IconSymbol size={18} name="magnifyingglass" color={colors.icon} />
                      <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="종목명 또는 티커를 검색하세요"
                        placeholderTextColor={colors.icon}
                        value={tickerQuery}
                        onChangeText={setTickerQuery}
                        autoCapitalize="none"
                      />
                      {tickerQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setTickerQuery('')}>
                          <IconSymbol size={18} name="xmark.circle.fill" color={colors.icon} />
                        </TouchableOpacity>
                      )}
                    </View>
                    {showTickerResults && (
                      <View style={[styles.tickerResultsContainer, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' }]}>
                        {tickerResults.length > 0 ? (
                          tickerResults.map((stock) => {
                            const displaySymbol = stock.symbol.includes(':') ? stock.symbol.split(':')[1] : stock.symbol;
                            return (
                              <TouchableOpacity
                                key={stock.symbol}
                                style={[styles.tickerResultItem, { borderBottomColor: colorScheme === 'dark' ? '#334155' : '#E5E7EB' }]}
                                onPress={() => {
                                  setBattleData({
                                    ...battleData,
                                    ticker: displaySymbol,
                                    tickerName: stock.koreanName ? `${stock.koreanName} · ${stock.name}` : stock.name,
                                  });
                                  setTickerQuery('');
                                  setShowTickerResults(false);
                                }}>
                                <View style={{ flex: 1 }}>
                                  <Text style={[styles.tickerResultSymbol, { color: colors.text }]}>
                                    {displaySymbol}
                                  </Text>
                                  <Text style={[styles.tickerResultName, { color: colors.icon }]}>
                                    {stock.koreanName ? `${stock.koreanName} · ${stock.name}` : stock.name}
                                  </Text>
                                </View>
                                <IconSymbol size={16} name="chevron.right" color={colors.icon} />
                              </TouchableOpacity>
                            );
                          })
                        ) : (
                          <View style={styles.noResultContainer}>
                            <Text style={{ color: colors.icon, fontSize: 13 }}>검색 결과가 없습니다</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  대결 유형
                </Text>
                <View style={[styles.pickerContainer, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' }]}>
                  <Picker
                    selectedValue={battleData.type}
                    onValueChange={(value) => setBattleData({ ...battleData, type: value as BattleType })}
                    style={{ color: colors.text }}>
                    <Picker.Item label="일반 대결" value="NORMAL" />
                    <Picker.Item label="전체 대결" value="ALL" />
                  </Picker>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  초기 자금 <Text style={{ color: '#EF4444' }}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC', color: colors.text }]}
                  placeholder="1000000"
                  placeholderTextColor={colors.icon}
                  value={String(battleData.initialCapital)}
                  onChangeText={(text) => setBattleData({ ...battleData, initialCapital: Number(text) || 0 })}
                  keyboardType="number-pad"
                />
                <Text style={[styles.helperText, { color: colors.icon }]}>
                  달러($) 단위로 입력하세요
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  평가 기준
                </Text>
                <View style={[styles.pickerContainer, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' }]}>
                  <Picker
                    selectedValue={battleData.metricType}
                    onValueChange={(value) => setBattleData({ ...battleData, metricType: value as MetricType })}
                    style={{ color: colors.text }}>
                    <Picker.Item label="수익률 (%)" value="RATE" />
                    <Picker.Item label="수익금 ($)" value="PROCEED" />
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
                  placeholder="YYYY-MM-DD (예: 20260201)"
                  placeholderTextColor={colors.icon}
                  value={battleData.startAt}
                  onChangeText={(text) => setBattleData({ ...battleData, startAt: formatDateInput(text) })}
                  keyboardType="number-pad"
                  maxLength={10}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  시작 시간 <Text style={{ color: '#EF4444' }}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC', color: colors.text }]}
                  placeholder="HH:mm:ss (예: 090000)"
                  placeholderTextColor={colors.icon}
                  value={battleData.startTime}
                  onChangeText={(text) => setBattleData({ ...battleData, startTime: formatTimeInput(text) })}
                  keyboardType="number-pad"
                  maxLength={8}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  종료일 <Text style={{ color: '#EF4444' }}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC', color: colors.text }]}
                  placeholder="YYYY-MM-DD (예: 20260228)"
                  placeholderTextColor={colors.icon}
                  value={battleData.endAt}
                  onChangeText={(text) => setBattleData({ ...battleData, endAt: formatDateInput(text) })}
                  keyboardType="number-pad"
                  maxLength={10}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  종료 시간 <Text style={{ color: '#EF4444' }}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC', color: colors.text }]}
                  placeholder="HH:mm:ss (예: 180000)"
                  placeholderTextColor={colors.icon}
                  value={battleData.endTime}
                  onChangeText={(text) => setBattleData({ ...battleData, endTime: formatTimeInput(text) })}
                  keyboardType="number-pad"
                  maxLength={8}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  평가 시간
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC', color: colors.text }]}
                  placeholder="HH:mm:ss (예: 153000)"
                  placeholderTextColor={colors.icon}
                  value={battleData.valuationTime}
                  onChangeText={(text) => setBattleData({ ...battleData, valuationTime: formatTimeInput(text) })}
                  keyboardType="number-pad"
                  maxLength={8}
                />
                <Text style={[styles.helperText, { color: colors.icon }]}>
                  매일 수익률을 평가할 시간
                </Text>
              </View>

              <View style={[styles.infoBox, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F1F5F9' }]}>
                <IconSymbol size={20} name="info.circle.fill" color="#6366F1" />
                <Text style={[styles.infoText, { color: colors.icon }]}>
                  숫자만 입력하면 자동으로 형식이 맞춰집니다
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Step 3: 설정 */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <View style={[styles.card, styles.shadow, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  팀 수
                </Text>
                <View style={styles.slotSelector}>
                  <TouchableOpacity
                    style={[styles.slotButton, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' }]}
                    onPress={() => setBattleData({ ...battleData, teamCount: Math.max(2, battleData.teamCount - 1) })}>
                    <IconSymbol size={16} name="minus" color={colors.text} />
                  </TouchableOpacity>
                  <Text style={[styles.slotValue, { color: colors.text }]}>
                    {battleData.teamCount}개
                  </Text>
                  <TouchableOpacity
                    style={[styles.slotButton, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' }]}
                    onPress={() => setBattleData({ ...battleData, teamCount: Math.min(10, battleData.teamCount + 1) })}>
                    <IconSymbol size={16} name="plus" color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  최대 참가자 수
                </Text>
                <View style={styles.slotSelector}>
                  <TouchableOpacity
                    style={[styles.slotButton, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' }]}
                    onPress={() => setBattleData({ ...battleData, memberCount: Math.max(battleData.teamCount, battleData.memberCount - 1) })}>
                    <IconSymbol size={16} name="minus" color={colors.text} />
                  </TouchableOpacity>
                  <Text style={[styles.slotValue, { color: colors.text }]}>
                    {battleData.memberCount}명
                  </Text>
                  <TouchableOpacity
                    style={[styles.slotButton, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' }]}
                    onPress={() => setBattleData({ ...battleData, memberCount: Math.min(100, battleData.memberCount + 1) })}>
                    <IconSymbol size={16} name="plus" color={colors.text} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.helperText, { color: colors.icon }]}>
                  팀 수보다 많아야 합니다
                </Text>
              </View>

              <View style={[styles.infoBox, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F1F5F9' }]}>
                <IconSymbol size={20} name="info.circle.fill" color="#6366F1" />
                <Text style={[styles.infoText, { color: colors.icon }]}>
                  팀 수와 참가자 수를 설정하세요. 실제 팀 생성은 참가자들이 배틀에 참여하면서 자동으로 이루어집니다.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Step 4: 완료 화면 */}
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
                대결이 성공적으로 생성되었습니다.
              </Text>

              <View style={[styles.infoBox, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F1F5F9', marginTop: 20 }]}>
                <IconSymbol size={20} name="info.circle.fill" color="#6366F1" />
                <Text style={[styles.infoText, { color: colors.icon }]}>
                  대결 상세 페이지에서 팀을 생성하면 친구들을 초대할 수 있는 초대 코드가 발급됩니다.
                </Text>
              </View>
            </View>

            <View style={[styles.battleSummary, styles.card, styles.shadow, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
              <Text style={[styles.summaryTitle, { color: colors.text }]}>
                대결 요약
              </Text>

              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.icon }]}>대결 이름</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>{battleData.name}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.icon }]}>종목</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>{battleData.ticker}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.icon }]}>기간</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {battleData.startAt} ~ {battleData.endAt}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.icon }]}>초기 자금</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  ${battleData.initialCapital.toLocaleString()}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.icon }]}>팀 수</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {battleData.teamCount}개
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.icon }]}>최대 참가자</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {battleData.memberCount}명
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
            style={[styles.nextButton, { backgroundColor: isSubmitting ? '#9CA3AF' : '#6366F1' }]}
            onPress={handleNext}
            disabled={isSubmitting}>
            <Text style={styles.nextButtonText}>
              {isSubmitting ? '생성 중...' : step === 3 ? '대결 생성하기' : '다음'}
            </Text>
            {!isSubmitting && <IconSymbol size={18} name="chevron.right" color="#FFFFFF" />}
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
  selectedTickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  selectedTickerSymbol: {
    fontSize: 16,
    fontWeight: '700',
  },
  selectedTickerName: {
    fontSize: 13,
    marginTop: 2,
  },
  clearTickerButton: {
    padding: 4,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    height: 48,
  },
  tickerResultsContainer: {
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 240,
    overflow: 'hidden',
  },
  tickerResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
  tickerResultSymbol: {
    fontSize: 15,
    fontWeight: '700',
  },
  tickerResultName: {
    fontSize: 12,
    marginTop: 2,
  },
  noResultContainer: {
    padding: 20,
    alignItems: 'center',
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
