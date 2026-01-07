import { ThemedText } from '../components/ThemedText';
import { IconSymbol } from '../components/ui/IconSymbol';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/useColorScheme';
import { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

interface Stock {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
}

interface TradePoint {
  date: string;
  price: number;
  type: 'buy' | 'sell';
  quantity: number;
}

interface ChartDataPoint {
  date: string;
  price: number;
  timestamp: number;
}

export default function ChartScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [timeRange, setTimeRange] = useState<'1D' | '1W' | '1M' | '3M' | '1Y'>('1M');

  const screenWidth = Dimensions.get('window').width;

  // 임시 주식 데이터
  const stocks: Stock[] = [
    {
      symbol: 'NVDA',
      name: 'NVIDIA Corporation',
      currentPrice: 525.30,
      change: 12.50,
      changePercent: 2.43,
    },
    {
      symbol: 'AMD',
      name: 'Advanced Micro Devices',
      currentPrice: 142.80,
      change: -1.20,
      changePercent: -0.83,
    },
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      currentPrice: 185.64,
      change: 2.34,
      changePercent: 1.28,
    },
    {
      symbol: 'TSLA',
      name: 'Tesla, Inc.',
      currentPrice: 238.45,
      change: -5.23,
      changePercent: -2.15,
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      currentPrice: 378.91,
      change: 4.12,
      changePercent: 1.10,
    },
  ];

  const filteredStocks = stocks.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 임시 차트 데이터 생성 함수
  const generateChartData = (stock: Stock, range: string): ChartDataPoint[] => {
    const basePrice = stock.currentPrice;
    const dataPoints: ChartDataPoint[] = [];
    let days = 30;

    switch (range) {
      case '1D':
        days = 1;
        break;
      case '1W':
        days = 7;
        break;
      case '1M':
        days = 30;
        break;
      case '3M':
        days = 90;
        break;
      case '1Y':
        days = 365;
        break;
    }

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const randomVariation = (Math.random() - 0.5) * basePrice * 0.05;
      const price = basePrice + randomVariation;

      dataPoints.push({
        date: date.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }),
        price: parseFloat(price.toFixed(2)),
        timestamp: date.getTime(),
      });
    }

    return dataPoints;
  };

  // 임시 매매 포인트 데이터
  const getTradePoints = (stock: Stock): TradePoint[] => {
    if (!stock) return [];

    return [
      {
        date: '2025-12-15',
        price: stock.currentPrice * 0.95,
        type: 'buy',
        quantity: 5,
      },
      {
        date: '2025-12-28',
        price: stock.currentPrice * 0.92,
        type: 'buy',
        quantity: 3,
      },
      {
        date: '2026-01-03',
        price: stock.currentPrice * 1.02,
        type: 'sell',
        quantity: 2,
      },
    ];
  };

  const handleStockSelect = (stock: Stock) => {
    setSelectedStock(stock);
  };

  const renderStockList = () => (
    <View>
      {/* 검색 */}
      <View style={[styles.searchContainer, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
        <IconSymbol size={20} name="magnifyingglass" color={colors.icon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="종목명 또는 티커 검색"
          placeholderTextColor={colors.icon}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <IconSymbol size={18} name="xmark.circle.fill" color={colors.icon} />
          </TouchableOpacity>
        )}
      </View>

      {/* 종목 리스트 */}
      <View style={styles.stocksList}>
        {filteredStocks.map((stock) => (
          <TouchableOpacity
            key={stock.symbol}
            style={[
              styles.stockCard,
              styles.shadow,
              {
                backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF',
                borderColor: selectedStock?.symbol === stock.symbol ? '#6366F1' : 'transparent',
                borderWidth: selectedStock?.symbol === stock.symbol ? 2 : 0,
              },
            ]}
            onPress={() => handleStockSelect(stock)}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.stockSymbol, { color: colors.text }]}>{stock.symbol}</Text>
              <Text style={[styles.stockName, { color: colors.icon }]}>{stock.name}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.stockPrice, { color: colors.text }]}>${stock.currentPrice.toFixed(2)}</Text>
              <View style={styles.stockChangeRow}>
                <IconSymbol
                  size={12}
                  name={stock.change >= 0 ? 'arrow.up' : 'arrow.down'}
                  color={stock.change >= 0 ? '#10B981' : '#EF4444'}
                />
                <Text style={[styles.stockChange, { color: stock.change >= 0 ? '#10B981' : '#EF4444' }]}>
                  {stock.change >= 0 ? '+' : ''}
                  {stock.change.toFixed(2)} ({stock.changePercent >= 0 ? '+' : ''}
                  {stock.changePercent.toFixed(2)}%)
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderChart = () => {
    if (!selectedStock) {
      return (
        <View style={styles.emptyState}>
          <IconSymbol size={48} name="chart.line.uptrend.xyaxis" color={colors.icon} />
          <Text style={[styles.emptyText, { color: colors.icon }]}>
            종목을 선택하여 차트를 확인하세요
          </Text>
        </View>
      );
    }

    const chartData = generateChartData(selectedStock, timeRange);
    const tradePoints = getTradePoints(selectedStock);

    return (
      <View>
        {/* 종목 정보 헤더 */}
        <View style={[styles.card, styles.shadow, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
          <View style={styles.stockHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.chartStockSymbol, { color: colors.text }]}>
                {selectedStock.symbol}
              </Text>
              <Text style={[styles.chartStockName, { color: colors.icon }]}>
                {selectedStock.name}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.chartStockPrice, { color: colors.text }]}>
                ${selectedStock.currentPrice.toFixed(2)}
              </Text>
              <View style={styles.stockChangeRow}>
                <IconSymbol
                  size={14}
                  name={selectedStock.change >= 0 ? 'arrow.up' : 'arrow.down'}
                  color={selectedStock.change >= 0 ? '#10B981' : '#EF4444'}
                />
                <Text style={[styles.chartStockChange, { color: selectedStock.change >= 0 ? '#10B981' : '#EF4444' }]}>
                  {selectedStock.change >= 0 ? '+' : ''}
                  {selectedStock.change.toFixed(2)} ({selectedStock.changePercent >= 0 ? '+' : ''}
                  {selectedStock.changePercent.toFixed(2)}%)
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 기간 선택 */}
        <View style={[styles.timeRangeContainer, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
          {(['1D', '1W', '1M', '3M', '1Y'] as const).map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.timeRangeButton,
                timeRange === range && { backgroundColor: '#6366F1' },
              ]}
              onPress={() => setTimeRange(range)}>
              <Text style={[styles.timeRangeText, { color: timeRange === range ? '#FFFFFF' : colors.icon }]}>
                {range}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 차트 */}
        <View style={[styles.card, styles.shadow, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
          <LineChart
            data={{
              labels: chartData.filter((_, i) => i % Math.ceil(chartData.length / 6) === 0).map(d => d.date),
              datasets: [
                {
                  data: chartData.map(d => d.price),
                  color: (opacity = 1) => selectedStock.change >= 0 ? `rgba(16, 185, 129, ${opacity})` : `rgba(239, 68, 68, ${opacity})`,
                  strokeWidth: 2,
                },
              ],
            }}
            width={screenWidth - 80}
            height={220}
            chartConfig={{
              backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF',
              backgroundGradientFrom: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF',
              backgroundGradientTo: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF',
              decimalPlaces: 2,
              color: (opacity = 1) => colorScheme === 'dark' ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
              labelColor: (opacity = 1) => colorScheme === 'dark' ? `rgba(148, 163, 184, ${opacity})` : `rgba(100, 116, 139, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '0',
              },
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        </View>

        {/* 매매 포인트 */}
        <View style={[styles.card, styles.shadow, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
          <View style={styles.tradePointsHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              내 매매 기록
            </ThemedText>
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                <Text style={[styles.legendText, { color: colors.icon }]}>매수</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                <Text style={[styles.legendText, { color: colors.icon }]}>매도</Text>
              </View>
            </View>
          </View>

          {tradePoints.length > 0 ? (
            <View style={styles.tradePointsList}>
              {tradePoints.map((point, index) => (
                <View
                  key={index}
                  style={[
                    styles.tradePointItem,
                    index > 0 && {
                      borderTopWidth: 1,
                      borderTopColor: colorScheme === 'dark' ? '#334155' : '#E5E7EB',
                    },
                  ]}>
                  <View style={[styles.tradeTypeBadge, { backgroundColor: point.type === 'buy' ? '#10B981' : '#EF4444' }]}>
                    <IconSymbol
                      size={14}
                      name={point.type === 'buy' ? 'arrow.down' : 'arrow.up'}
                      color="#FFFFFF"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.tradeDate, { color: colors.text }]}>{point.date}</Text>
                    <Text style={[styles.tradeDetail, { color: colors.icon }]}>
                      {point.quantity}주 @ ${point.price.toFixed(2)}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.tradeType, { color: point.type === 'buy' ? '#10B981' : '#EF4444' }]}>
                      {point.type === 'buy' ? '매수' : '매도'}
                    </Text>
                    <Text style={[styles.tradeAmount, { color: colors.text }]}>
                      ${(point.price * point.quantity).toFixed(2)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyTradePoints}>
              <Text style={[styles.emptyText, { color: colors.icon }]}>
                매매 기록이 없습니다
              </Text>
            </View>
          )}
        </View>

        {/* 통계 정보 */}
        <View style={[styles.card, styles.shadow, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            거래 통계
          </ThemedText>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.icon }]}>평균 매수가</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                ${((tradePoints.filter(p => p.type === 'buy').reduce((sum, p) => sum + p.price, 0) / tradePoints.filter(p => p.type === 'buy').length) || 0).toFixed(2)}
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.icon }]}>평균 매도가</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                ${((tradePoints.filter(p => p.type === 'sell').reduce((sum, p) => sum + p.price, 0) / tradePoints.filter(p => p.type === 'sell').length) || 0).toFixed(2)}
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.icon }]}>총 매수량</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {tradePoints.filter(p => p.type === 'buy').reduce((sum, p) => sum + p.quantity, 0)}주
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.icon }]}>총 매도량</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {tradePoints.filter(p => p.type === 'sell').reduce((sum, p) => sum + p.quantity, 0)}주
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' }]}>
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>차트</ThemedText>
          <Text style={[styles.subtitle, { color: colors.icon }]}>
            {selectedStock ? `${selectedStock.symbol} 차트 분석` : '종목을 선택하여 차트를 확인하세요'}
          </Text>
        </View>

        {!selectedStock ? renderStockList() : renderChart()}

        {selectedStock && (
          <TouchableOpacity
            style={[styles.backToListButton, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}
            onPress={() => setSelectedStock(null)}>
            <IconSymbol size={18} name="chevron.left" color="#6366F1" />
            <Text style={[styles.backToListText, { color: '#6366F1' }]}>종목 목록으로</Text>
          </TouchableOpacity>
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
    paddingBottom: 40,
  },
  header: {
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  stocksList: {
    gap: 12,
  },
  stockCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
  stockChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockChange: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  chartStockSymbol: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  chartStockName: {
    fontSize: 14,
  },
  chartStockPrice: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  chartStockChange: {
    fontSize: 14,
    fontWeight: '700',
  },
  timeRangeContainer: {
    flexDirection: 'row',
    gap: 8,
    padding: 8,
    borderRadius: 12,
    marginBottom: 16,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  timeRangeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  tradePointsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  legendContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
  },
  tradePointsList: {
    gap: 0,
  },
  tradePointItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  tradeTypeBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tradeDate: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  tradeDetail: {
    fontSize: 12,
  },
  tradeType: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  tradeAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyTradePoints: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    borderRadius: 12,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  backToListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  backToListText: {
    fontSize: 15,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 20,
  },
});
