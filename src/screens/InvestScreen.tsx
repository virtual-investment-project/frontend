import { ThemedText } from '../components/ThemedText';
import { IconSymbol } from '../components/ui/IconSymbol';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/useColorScheme';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Stock, searchSymbols } from '../types/tradingview';
import { toggleFavorite } from '../utils/favorites';
import { useFavoritesContext, FavoriteWithPrice } from '../contexts/FavoritesContext';

interface StockWithPrice extends Stock {
  currentPrice?: number;
  change?: number;
  changePercent?: number;
  marketCap?: string;
}

interface Order {
  id: string;
  stock: StockWithPrice;
  type: 'buy' | 'sell';
  price: number;
  quantity: number;
  totalAmount: number;
  status: 'pending' | 'filled';
  orderTime: string;
}

export default function InvestScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { favorites, refreshFavorites } = useFavoritesContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<StockWithPrice | null>(null);
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [orderPrice, setOrderPrice] = useState('');
  const [orderQuantity, setOrderQuantity] = useState('');
  const [activeTab, setActiveTab] = useState<'search' | 'portfolio' | 'orders'>('search');
  const [searchResults, setSearchResults] = useState<Stock[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);



  // 검색어 변경 처리
  useEffect(() => {
    if (searchQuery.trim()) {
      const results = searchSymbols(searchQuery, 'all');
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchQuery]);

  // 즐겨찾기 토글
  const handleToggleFavorite = async (stock: Stock) => {
    const newIsFavorite = await toggleFavorite(stock.symbol, stock.name, stock.koreanName);
    await refreshFavorites();
    
    // 현재 선택된 종목이면 상태 업데이트
    if (selectedStock?.symbol === stock.symbol) {
      setSelectedStock({ ...selectedStock, isFavorite: newIsFavorite });
    }
  };

  // 임시 포트폴리오
  const portfolio = [
    { 
      stock: { 
        symbol: 'NASDAQ:NVDA', 
        name: 'NVIDIA Corporation', 
        koreanName: '엔비디아',
        currentPrice: 525.30,
        change: 12.50,
        changePercent: 2.43,
        marketCap: '$1.29T',
      }, 
      quantity: 10, 
      avgPrice: 500.00, 
      currentValue: 5253.00, 
      profitLoss: 253.00, 
      profitPercent: 5.06 
    },
    { 
      stock: { 
        symbol: 'NASDAQ:AMD', 
        name: 'Advanced Micro Devices', 
        koreanName: 'AMD',
        currentPrice: 142.80,
        change: -1.20,
        changePercent: -0.83,
        marketCap: '$231B',
      }, 
      quantity: 5, 
      avgPrice: 150.00, 
      currentValue: 714.00, 
      profitLoss: -36.00, 
      profitPercent: -4.80 
    },
  ];

  // 임시 주문 내역
  const [orders, setOrders] = useState<Order[]>([
    {
      id: '1',
      stock: {
        symbol: 'NASDAQ:NVDA',
        name: 'NVIDIA Corporation',
        koreanName: '엔비디아',
        currentPrice: 520.00,
        change: 12.50,
        changePercent: 2.43,
      },
      type: 'buy',
      price: 520.00,
      quantity: 2,
      totalAmount: 1040.00,
      status: 'pending',
      orderTime: '2026.01.04 09:30',
    },
  ]);

  const userBalance = 10000000; // 사용 가능 금액

  // 종목 선택
  const handleStockSelect = (stock: Stock) => {
    const isFav = favorites.some(fav => fav.symbol === stock.symbol);
    // 임시로 현재가 설정 (실제로는 API에서 가져와야 함)
    const stockWithPrice: StockWithPrice = {
      ...stock,
      isFavorite: isFav,
      currentPrice: 100.00,
      change: 0,
      changePercent: 0,
      marketCap: 'N/A',
    };
    setSelectedStock(stockWithPrice);
    setOrderPrice(stockWithPrice.currentPrice?.toString() || '100.00');
    setOrderQuantity('');
    setSearchQuery('');
    setShowSearchResults(false);
  };

  // 즐겨찾기에서 종목 선택
  const handleFavoriteSelect = (fav: FavoriteWithPrice) => {
    const stockWithPrice: StockWithPrice = {
      symbol: fav.symbol,
      name: fav.name,
      koreanName: fav.koreanName,
      isFavorite: true,
      currentPrice: fav.currentPrice,
      change: fav.change,
      changePercent: fav.changePercent,
      marketCap: fav.marketCap,
    };
    setSelectedStock(stockWithPrice);
    setOrderPrice(stockWithPrice.currentPrice?.toString() || '100.00');
    setOrderQuantity('');
  };

  const calculateTotal = () => {
    const price = parseFloat(orderPrice) || 0;
    const quantity = parseInt(orderQuantity) || 0;
    return price * quantity;
  };

  const handleOrder = () => {
    if (!selectedStock) {
      Alert.alert('오류', '종목을 선택해주세요.');
      return;
    }
    if (!orderPrice || parseFloat(orderPrice) <= 0) {
      Alert.alert('오류', '주문 가격을 입력해주세요.');
      return;
    }
    if (!orderQuantity || parseInt(orderQuantity) <= 0) {
      Alert.alert('오류', '주문 수량을 입력해주세요.');
      return;
    }

    const price = parseFloat(orderPrice);
    const quantity = parseInt(orderQuantity);
    const totalAmount = price * quantity;

    if (orderType === 'buy' && totalAmount > userBalance) {
      Alert.alert('오류', '잔액이 부족합니다.');
      return;
    }

    // 현재가와 주문가 비교
    const currentPrice = selectedStock.currentPrice || 0;
    const isMarketOrder = price >= currentPrice;

    const newOrder: Order = {
      id: Date.now().toString(),
      stock: selectedStock,
      type: orderType,
      price,
      quantity,
      totalAmount,
      status: isMarketOrder ? 'filled' : 'pending',
      orderTime: new Date().toLocaleString('ko-KR'),
    };

    setOrders([newOrder, ...orders]);

    if (isMarketOrder) {
      Alert.alert(
        '체결 완료',
        `${selectedStock.symbol} ${quantity}주가 $${price.toFixed(2)}에 ${orderType === 'buy' ? '매수' : '매도'} 체결되었습니다.`,
        [{ text: '확인', onPress: () => resetOrderForm() }]
      );
    } else {
      Alert.alert(
        '주문 접수',
        `${selectedStock.symbol} ${quantity}주 ${orderType === 'buy' ? '매수' : '매도'} 주문이 예약되었습니다.\n목표가: $${price.toFixed(2)}\n현재가가 목표가에 도달하면 자동 체결됩니다.`,
        [{ text: '확인', onPress: () => resetOrderForm() }]
      );
    }
  };

  const resetOrderForm = () => {
    setOrderPrice('');
    setOrderQuantity('');
  };

  const handleSetCurrentPrice = () => {
    if (selectedStock && selectedStock.currentPrice) {
      setOrderPrice(selectedStock.currentPrice.toString());
    }
  };

  const handleSetPercentPrice = (percent: number) => {
    if (selectedStock && selectedStock.currentPrice) {
      const newPrice = selectedStock.currentPrice * (1 + percent / 100);
      setOrderPrice(newPrice.toFixed(2));
    }
  };

  // 즐겨찾기 카드 렌더링
  const renderFavoriteCard = (fav: FavoriteWithPrice) => (
    <TouchableOpacity
      key={fav.symbol}
      style={[
        styles.stockCard,
        styles.shadow,
        {
          backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF',
          borderColor: selectedStock?.symbol === fav.symbol ? '#6366F1' : 'transparent',
          borderWidth: selectedStock?.symbol === fav.symbol ? 2 : 0,
        },
      ]}
      onPress={() => handleFavoriteSelect(fav)}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.stockSymbol, { color: colors.text }]}>
          {fav.symbol.includes(':') ? fav.symbol.split(':')[1] : fav.symbol}
        </Text>
        <Text style={[styles.stockName, { color: colors.icon }]}>
          {fav.koreanName || fav.name}
        </Text>
        <Text style={[styles.marketCap, { color: colors.icon }]}>시가총액: {fav.marketCap}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.stockPrice, { color: colors.text }]}>${fav.currentPrice.toFixed(2)}</Text>
        <View style={styles.stockChangeRow}>
          <IconSymbol
            size={12}
            name={fav.change >= 0 ? 'arrow.up' : 'arrow.down'}
            color={fav.change >= 0 ? '#10B981' : '#EF4444'}
          />
          <Text style={[styles.stockChange, { color: fav.change >= 0 ? '#10B981' : '#EF4444' }]}>
            {fav.change >= 0 ? '+' : ''}
            {fav.change.toFixed(2)} ({fav.changePercent >= 0 ? '+' : ''}
            {fav.changePercent.toFixed(2)}%)
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => handleToggleFavorite({ symbol: fav.symbol, name: fav.name, koreanName: fav.koreanName })}
          style={styles.favoriteButtonInCard}>
          <IconSymbol size={20} name="star.fill" color="#FCD34D" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // 검색 결과 렌더링
  const renderSearchResult = (stock: Stock) => {
    const isFav = favorites.some(fav => fav.symbol === stock.symbol);
    
    return (
      <TouchableOpacity
        key={stock.symbol}
        style={[
          styles.searchResultCard,
          {
            backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF',
          },
        ]}
        onPress={() => handleStockSelect(stock)}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.stockSymbol, { color: colors.text }]}>
            {stock.symbol.includes(':') ? stock.symbol.split(':')[1] : stock.symbol}
          </Text>
          <Text style={[styles.stockName, { color: colors.icon }]}>
            {stock.koreanName} · {stock.name}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => handleToggleFavorite(stock)}
          style={styles.favoriteButton}>
          <IconSymbol 
            size={22} 
            name={isFav ? "star.fill" : "star"} 
            color={isFav ? "#FCD34D" : colors.icon} 
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderSearchTab = () => (
    <View>
      {/* 검색 */}
      <View style={[styles.searchContainer, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
        <IconSymbol size={20} name="magnifyingglass" color={colors.icon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="종목명, 티커, 한글명 검색"
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

      {/* 검색 결과 */}
      {showSearchResults && searchResults.length > 0 && (
        <View style={[styles.searchResultsContainer, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
          <Text style={[styles.searchResultsTitle, { color: colors.icon }]}>
            검색 결과 ({searchResults.length})
          </Text>
          <View style={styles.searchResultsList}>
            {searchResults.map(stock => renderSearchResult(stock))}
          </View>
        </View>
      )}

      {/* 검색 결과가 없을 때 */}
      {showSearchResults && searchResults.length === 0 && (
        <View style={[styles.searchResultsContainer, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
          <View style={styles.noResultsContainer}>
            <IconSymbol size={40} name="magnifyingglass" color={colors.icon} />
            <Text style={[styles.noResultsText, { color: colors.icon }]}>
              "{searchQuery}"에 대한 검색 결과가 없습니다
            </Text>
          </View>
        </View>
      )}

      {/* 즐겨찾기 목록 또는 빈 상태 */}
      {!showSearchResults && (
        <>
          {favorites.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol size={64} name="star" color={colors.icon} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                즐겨찾기가 비어있습니다
              </Text>
              <Text style={[styles.emptyText, { color: colors.icon }]}>
                종목을 검색하고 별 아이콘을 눌러{'\n'}
                즐겨찾기에 추가해보세요
              </Text>
            </View>
          ) : (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>즐겨찾기</Text>
                <Text style={[styles.sectionCount, { color: colors.icon }]}>
                  {favorites.length}개
                </Text>
              </View>
              <View style={styles.stocksList}>
                {favorites.map(fav => renderFavoriteCard(fav))}
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );

  const renderPortfolioTab = () => (
    <View>
      <View style={[styles.card, styles.shadow, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>총 평가금액</Text>
        <Text style={[styles.totalValue, { color: colors.text }]}>
          ₩{portfolio.reduce((sum, item) => sum + item.currentValue, 0).toLocaleString()}
        </Text>
        <View style={styles.profitRow}>
          <Text style={[styles.profitLabel, { color: colors.icon }]}>평가손익</Text>
          <Text style={[styles.profitValue, { color: '#10B981' }]}>
            +₩{portfolio.reduce((sum, item) => sum + item.profitLoss, 0).toLocaleString()} (+3.72%)
          </Text>
        </View>
      </View>

      {portfolio.map((item, index) => (
        <View
          key={index}
          style={[styles.card, styles.shadow, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
          <View style={styles.portfolioHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.stockSymbol, { color: colors.text }]}>
                {item.stock.symbol.includes(':') ? item.stock.symbol.split(':')[1] : item.stock.symbol}
              </Text>
              <Text style={[styles.stockName, { color: colors.icon }]}>
                {item.stock.koreanName || item.stock.name}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.tradeButton, { backgroundColor: '#EF4444' }]}
              onPress={() => {
                setSelectedStock(item.stock);
                setOrderType('sell');
                setActiveTab('search');
              }}>
              <Text style={styles.tradeButtonText}>매도</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.portfolioDetail}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.icon }]}>보유수량</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{item.quantity}주</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.icon }]}>평균단가</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>${item.avgPrice.toFixed(2)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.icon }]}>현재가</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                ${item.stock.currentPrice?.toFixed(2) || '0.00'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.icon }]}>평가금액</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>₩{item.currentValue.toLocaleString()}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.icon }]}>평가손익</Text>
              <Text style={[styles.detailValue, { color: item.profitLoss >= 0 ? '#10B981' : '#EF4444' }]}>
                {item.profitLoss >= 0 ? '+' : ''}₩{item.profitLoss.toLocaleString()} ({item.profitPercent >= 0 ? '+' : ''}
                {item.profitPercent.toFixed(2)}%)
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const renderOrdersTab = () => (
    <View>
      {orders.map((order) => (
        <View
          key={order.id}
          style={[styles.card, styles.shadow, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
          <View style={styles.orderHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.orderTitleRow}>
                <Text style={[styles.stockSymbol, { color: colors.text }]}>
                  {order.stock.symbol.includes(':') ? order.stock.symbol.split(':')[1] : order.stock.symbol}
                </Text>
                <View
                  style={[
                    styles.orderStatusBadge,
                    { backgroundColor: order.status === 'filled' ? '#10B981' : '#F59E0B' },
                  ]}>
                  <Text style={styles.orderStatusText}>{order.status === 'filled' ? '체결' : '예약'}</Text>
                </View>
              </View>
              <Text style={[styles.orderTime, { color: colors.icon }]}>{order.orderTime}</Text>
            </View>
            <View
              style={[styles.orderTypeBadge, { backgroundColor: order.type === 'buy' ? '#10B981' : '#EF4444' }]}>
              <Text style={styles.orderTypeText}>{order.type === 'buy' ? '매수' : '매도'}</Text>
            </View>
          </View>

          <View style={styles.orderDetail}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.icon }]}>주문가격</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>${order.price.toFixed(2)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.icon }]}>주문수량</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{order.quantity}주</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.icon }]}>주문금액</Text>
              <Text style={[styles.detailValue, { color: colors.text, fontWeight: '700' }]}>
                ₩{order.totalAmount.toLocaleString()}
              </Text>
            </View>
          </View>

          {order.status === 'pending' && (
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' }]}
              onPress={() => {
                Alert.alert('주문 취소', '정말 이 주문을 취소하시겠습니까?', [
                  { text: '아니오', style: 'cancel' },
                  {
                    text: '예',
                    onPress: () => {
                      setOrders(orders.filter((o) => o.id !== order.id));
                      Alert.alert('완료', '주문이 취소되었습니다.');
                    },
                  },
                ]);
              }}>
              <Text style={[styles.cancelButtonText, { color: '#EF4444' }]}>주문 취소</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {orders.length === 0 && (
        <View style={styles.emptyState}>
          <IconSymbol size={48} name="tray" color={colors.icon} />
          <Text style={[styles.emptyText, { color: colors.icon }]}>주문 내역이 없습니다</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' }]}>
      <View style={styles.scrollContainer}>
        <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer}>
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>투자하기</ThemedText>
            <View style={[styles.balanceCard, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
              <Text style={[styles.balanceLabel, { color: colors.icon }]}>사용 가능 금액</Text>
              <Text style={[styles.balanceAmount, { color: '#6366F1' }]}>₩{userBalance.toLocaleString()}</Text>
            </View>
          </View>

          {/* 탭 버튼 */}
          <View style={[styles.tabContainer, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'search' && styles.activeTab]}
              onPress={() => setActiveTab('search')}>
              <Text style={[styles.tabText, { color: activeTab === 'search' ? '#6366F1' : colors.icon }]}>
                종목검색
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'portfolio' && styles.activeTab]}
              onPress={() => setActiveTab('portfolio')}>
              <Text style={[styles.tabText, { color: activeTab === 'portfolio' ? '#6366F1' : colors.icon }]}>
                포트폴리오
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'orders' && styles.activeTab]}
              onPress={() => setActiveTab('orders')}>
              <Text style={[styles.tabText, { color: activeTab === 'orders' ? '#6366F1' : colors.icon }]}>
                주문내역
              </Text>
            </TouchableOpacity>
          </View>

          {/* 탭 컨텐츠 */}
          {activeTab === 'search' && renderSearchTab()}
          {activeTab === 'portfolio' && renderPortfolioTab()}
          {activeTab === 'orders' && renderOrdersTab()}

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* 주문 패널 (선택된 종목이 있을 때만 표시) */}
        {selectedStock && activeTab === 'search' && (
          <View style={[styles.orderPanel, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
            <View style={styles.orderPanelHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.orderStockSymbol, { color: colors.text }]}>
                  {selectedStock.symbol.includes(':') ? selectedStock.symbol.split(':')[1] : selectedStock.symbol}
                </Text>
                <Text style={[styles.orderStockPrice, { color: colors.icon }]}>
                  현재가: ${selectedStock.currentPrice?.toFixed(2) || '0.00'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedStock(null)}>
                <IconSymbol size={24} name="xmark.circle.fill" color={colors.icon} />
              </TouchableOpacity>
            </View>

            {/* 매수/매도 선택 */}
            <View style={styles.orderTypeSelector}>
              <TouchableOpacity
                style={[
                  styles.orderTypeButton,
                  { backgroundColor: orderType === 'buy' ? '#10B981' : colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' },
                ]}
                onPress={() => setOrderType('buy')}>
                <Text style={[styles.orderTypeButtonText, { color: orderType === 'buy' ? '#FFFFFF' : colors.text }]}>
                  매수
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.orderTypeButton,
                  { backgroundColor: orderType === 'sell' ? '#EF4444' : colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' },
                ]}
                onPress={() => setOrderType('sell')}>
                <Text style={[styles.orderTypeButtonText, { color: orderType === 'sell' ? '#FFFFFF' : colors.text }]}>
                  매도
                </Text>
              </TouchableOpacity>
            </View>

            {/* 가격 입력 */}
            <View style={styles.inputGroup}>
              <View style={styles.inputHeader}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>주문가격 (USD)</Text>
                <View style={styles.pricePresets}>
                  <TouchableOpacity
                    style={[styles.presetButton, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' }]}
                    onPress={handleSetCurrentPrice}>
                    <Text style={[styles.presetButtonText, { color: colors.icon }]}>현재가</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.presetButton, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' }]}
                    onPress={() => handleSetPercentPrice(-5)}>
                    <Text style={[styles.presetButtonText, { color: colors.icon }]}>-5%</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.presetButton, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' }]}
                    onPress={() => handleSetPercentPrice(5)}>
                    <Text style={[styles.presetButtonText, { color: colors.icon }]}>+5%</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TextInput
                style={[styles.orderInput, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC', color: colors.text }]}
                placeholder="0.00"
                placeholderTextColor={colors.icon}
                value={orderPrice}
                onChangeText={setOrderPrice}
                keyboardType="decimal-pad"
              />
            </View>

            {/* 수량 입력 */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>주문수량</Text>
              <TextInput
                style={[styles.orderInput, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC', color: colors.text }]}
                placeholder="0"
                placeholderTextColor={colors.icon}
                value={orderQuantity}
                onChangeText={setOrderQuantity}
                keyboardType="number-pad"
              />
            </View>

            {/* 총 금액 */}
            <View style={[styles.totalContainer, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' }]}>
              <Text style={[styles.totalLabel, { color: colors.icon }]}>총 주문금액</Text>
              <Text style={[styles.totalAmount, { color: orderType === 'buy' ? '#10B981' : '#EF4444' }]}>
                ₩{calculateTotal().toLocaleString()}
              </Text>
            </View>

            {/* 주문하기 버튼 */}
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: orderType === 'buy' ? '#10B981' : '#EF4444' }]}
              onPress={handleOrder}>
              <Text style={styles.submitButtonText}>{orderType === 'buy' ? '매수' : '매도'} 주문하기</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
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
    marginBottom: 16,
  },
  balanceCard: {
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
  },
  balanceAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
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
  searchResultsContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchResultsTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  searchResultsList: {
    gap: 8,
  },
  searchResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  noResultsText: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  favoriteButton: {
    padding: 8,
  },
  favoriteButtonInCard: {
    padding: 6,
    marginTop: 4,
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
    marginBottom: 2,
  },
  marketCap: {
    fontSize: 12,
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
  card: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  totalValue: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  profitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profitLabel: {
    fontSize: 14,
  },
  profitValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  portfolioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  tradeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tradeButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  portfolioDetail: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 13,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  orderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  orderStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  orderStatusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  orderTime: {
    fontSize: 12,
  },
  orderTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  orderTypeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  orderDetail: {
    gap: 8,
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 420,
  },
  orderPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  orderPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderStockSymbol: {
    fontSize: 20,
    fontWeight: '800',
  },
  orderStockPrice: {
    fontSize: 13,
    marginTop: 2,
  },
  orderTypeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  orderTypeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  orderTypeButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  pricePresets: {
    flexDirection: 'row',
    gap: 6,
  },
  presetButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  presetButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  orderInput: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 14,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '800',
  },
  submitButton: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
