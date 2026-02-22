import { ThemedText } from '../components/ThemedText';
import { IconSymbol } from '../components/ui/IconSymbol';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/useColorScheme';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Modal } from 'react-native';
import Slider from '@react-native-community/slider';
import { Stock, searchSymbols } from '../types/tradingview';
import { toggleFavorite } from '../utils/favorites';
import { useFavoritesContext, FavoriteWithPrice } from '../contexts/FavoritesContext';
import { Account } from '../types/account';
import { getPersonalAccount, getBattleAccount } from '../services/accountService';
import { getAllBattles } from '../services/battleService';
import { createOrder, getOrdersByAccount, cancelOrder, OrderResponse } from '../services/orderService';

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

  // 계좌 관련 상태
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showAccountPicker, setShowAccountPicker] = useState(false);

  // 포트폴리오 탭용 선택된 계좌 상태
  const [portfolioSelectedAccount, setPortfolioSelectedAccount] = useState<Account | null>(null);

  // 투자 비율 관련 상태
  const [investmentRatio, setInvestmentRatio] = useState(0); // 0 ~ 100%
  const [investmentAmount, setInvestmentAmount] = useState(0); // 투자 금액 (원화)


  // 계좌 정보 조회 (개인 + 배틀 계좌)
  useEffect(() => {
    const fetchAccounts = async () => {
      const allAccounts: Account[] = [];

      // 1. 개인 계좌 조회
      try {
        const data = await getPersonalAccount();
        allAccounts.push({
          id: data.id,
          accountName: data.name,
          balance: data.balance,
          totalAsset: data.totalAsset,
        });
      } catch (error) {
        console.log('개인 계좌 없음 또는 조회 실패');
      }

      // 2. 배틀 계좌 조회 (참여 중인 배틀들)
      try {
        const battles = await getAllBattles();
        for (const battle of battles) {
          if (battle.status === 'END') continue; // 종료된 배틀 제외
          try {
            const data = await getBattleAccount(battle.id);
            if (data) {
              allAccounts.push({
                id: data.id,
                accountName: data.name,
                balance: data.balance,
                totalAsset: data.totalAsset,
              });
            }
          } catch {
            // 해당 배틀에 참여하지 않은 경우 무시
          }
        }
      } catch (error) {
        console.error('배틀 목록 조회 실패:', error);
      }

      setAccounts(allAccounts);
      if (allAccounts.length > 0 && !selectedAccount) {
        setSelectedAccount(allAccounts[0]);
      }
    };

    fetchAccounts();
  }, []);

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
  const [orders, setOrders] = useState<Order[]>([]);

  // 주문 목록 조회
  const fetchOrders = useCallback(async () => {
    if (!selectedAccount) return;

    try {
      const data = await getOrdersByAccount(selectedAccount.id);
      const formattedOrders: Order[] = data.map((order: OrderResponse) => ({
        id: order.id,
        stock: {
          symbol: order.stockCode,
          name: order.stockName,
          koreanName: order.stockName,
        },
        type: order.orderType.toLowerCase() as 'buy' | 'sell',
        price: parseFloat(order.orderPrice),
        quantity: parseFloat(order.quantity),
        totalAmount: parseFloat(order.totalAmount),
        status: order.status.toLowerCase() as 'pending' | 'filled',
        orderTime: new Date(order.createdAt).toLocaleString('ko-KR'),
      }));
      setOrders(formattedOrders);
    } catch (error) {
      console.error('주문 목록 조회 실패:', error);
    }
  }, [selectedAccount]);

  // 계좌 선택 시 주문 목록 조회
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);


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
    setInvestmentRatio(0);
    setInvestmentAmount(0);
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
    setInvestmentRatio(0);
    setInvestmentAmount(0);
  };

  // 투자 비율 변경 시 금액 및 수량 자동 계산
  const handleInvestmentRatioChange = (ratio: number) => {
    setInvestmentRatio(ratio);

    if (!selectedAccount || !orderPrice) return;

    let baseAmount = 0;
    if (orderType === 'buy') {
      // 매수: 잔액 기반
      baseAmount = selectedAccount.balance;
    } else {
      // 매도: 보유 수량 기반 (임시로 0으로 설정, 추후 포트폴리오 데이터 연동)
      baseAmount = 0; // TODO: 실제 보유 수량 * 현재가
    }

    const amount = Math.floor((baseAmount * ratio) / 100);
    setInvestmentAmount(amount);

    // 수량 자동 계산: 투자금액 / 주문가격
    const price = parseFloat(orderPrice);
    if (price > 0) {
      const quantity = amount / price;
      setOrderQuantity(quantity.toFixed(8)); // 소수점 8자리까지
    }
  };

  // 주문가격 변경 시 수량 재계산
  const handleOrderPriceChange = (price: string) => {
    setOrderPrice(price);

    const priceNum = parseFloat(price);
    if (priceNum > 0 && investmentAmount > 0) {
      const quantity = investmentAmount / priceNum;
      setOrderQuantity(quantity.toFixed(8));
    }
  };

  // 수량 직접 입력 시 투자금액, 비율 역계산
  const handleQuantityChange = (quantity: string) => {
    setOrderQuantity(quantity);

    const quantityNum = parseFloat(quantity);
    const priceNum = parseFloat(orderPrice);

    if (quantityNum > 0 && priceNum > 0 && selectedAccount) {
      const amount = Math.floor(quantityNum * priceNum);
      setInvestmentAmount(amount);

      let baseAmount = 0;
      if (orderType === 'buy') {
        baseAmount = selectedAccount.balance;
      } else {
        baseAmount = 0; // TODO: 실제 보유 수량 * 현재가
      }

      if (baseAmount > 0) {
        const ratio = Math.min((amount / baseAmount) * 100, 100);
        setInvestmentRatio(ratio);
      }
    }
  };

  const calculateTotal = () => {
    const price = parseFloat(orderPrice) || 0;
    const quantity = parseInt(orderQuantity) || 0;
    return price * quantity;
  };

  const handleOrder = async () => {
    if (!selectedStock) {
      Alert.alert('오류', '종목을 선택해주세요.');
      return;
    }
    if (!selectedAccount) {
      Alert.alert('오류', '계좌를 선택해주세요.');
      return;
    }
    if (!orderPrice || parseFloat(orderPrice) <= 0) {
      Alert.alert('오류', '주문 가격을 입력해주세요.');
      return;
    }
    if (!orderQuantity || parseFloat(orderQuantity) <= 0) {
      Alert.alert('오류', '주문 수량을 입력해주세요.');
      return;
    }

    const price = parseFloat(orderPrice);
    const quantity = parseFloat(orderQuantity);
    const totalAmount = price * quantity;

    if (orderType === 'buy' && totalAmount > selectedAccount.balance) {
      Alert.alert('오류', '잔액이 부족합니다.');
      return;
    }

    try {
      // 종목 코드 추출 (NASDAQ:NVDA -> NVDA)
      const stockCode = selectedStock.symbol.includes(':')
        ? selectedStock.symbol.split(':')[1]
        : selectedStock.symbol;

      await createOrder({
        accountId: selectedAccount.id,
        stockCode: stockCode,
        stockName: selectedStock.koreanName || selectedStock.name,
        orderPrice: price,
        quantity: quantity,
        orderType: orderType.toUpperCase() as 'BUY' | 'SELL',
      });

      // 주문 목록 새로고침
      await fetchOrders();

      Alert.alert(
        '주문 완료',
        `${selectedStock.koreanName || selectedStock.name} ${quantity}주 ${orderType === 'buy' ? '매수' : '매도'} 주문이 접수되었습니다.`,
        [{ text: '확인', onPress: () => resetOrderForm() }]
      );
    } catch (error: any) {
      console.error('주문 실패:', error);
      const errorMessage = error.response?.data?.message || '주문 처리 중 오류가 발생했습니다.';
      Alert.alert('주문 실패', errorMessage);
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
    <View style={{ flex: 1 }}>
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
            <View style={{ flex: 1 }}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>즐겨찾기</Text>
                <Text style={[styles.sectionCount, { color: colors.icon }]}>
                  {favorites.length}개
                </Text>
              </View>
              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                <View style={styles.stocksList}>
                  {favorites.map(fav => renderFavoriteCard(fav))}
                </View>
              </ScrollView>
            </View>
          )}
        </>
      )}
    </View>
  );

  const renderPortfolioTab = () => {
    // 계좌 선택 해제
    const handleBackToAccounts = () => {
      setPortfolioSelectedAccount(null);
    };

    // 계좌 목록 렌더링
    if (!portfolioSelectedAccount) {
      return (
        <View style={{ flex: 1 }}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>내 계좌</Text>
            <Text style={[styles.sectionCount, { color: colors.icon }]}>
              {accounts.length}개
            </Text>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {accounts.map((account) => (
              <TouchableOpacity
                key={account.id}
                style={[styles.card, styles.shadow, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}
                onPress={() => setPortfolioSelectedAccount(account)}>
                <View style={styles.accountCardHeader}>
                  <Text style={[styles.accountCardName, { color: colors.text }]}>{account.accountName}</Text>
                  <IconSymbol size={20} name="chevron.right" color={colors.icon} />
                </View>

                <View style={styles.accountCardBody}>
                  <View style={styles.accountCardRow}>
                    <Text style={[styles.accountCardLabel, { color: colors.icon }]}>총 평가금액</Text>
                    <Text style={[styles.accountCardValue, { color: colors.text }]}>
                      ₩{account.totalAsset.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.accountCardRow}>
                    <Text style={[styles.accountCardLabel, { color: colors.icon }]}>사용 가능 금액</Text>
                    <Text style={[styles.accountCardValue, { color: colors.icon }]}>
                      ₩{account.balance.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      );
    }

    // 선택된 계좌의 상세 정보 렌더링
    return (
      <View style={{ flex: 1 }}>
        {/* 뒤로가기 버튼 */}
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}
          onPress={handleBackToAccounts}>
          <IconSymbol size={20} name="chevron.left" color={colors.icon} />
          <Text style={[styles.backButtonText, { color: colors.text }]}>계좌 목록</Text>
        </TouchableOpacity>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {/* 계좌 정보 */}
          <View style={[styles.card, styles.shadow, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
            <Text style={[styles.accountDetailName, { color: colors.text }]}>{portfolioSelectedAccount.accountName}</Text>
            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 16 }]}>총 평가금액</Text>
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

          {/* 보유 종목 목록 */}
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
        </ScrollView>
      </View>
    );
  };


  const renderOrdersTab = () => (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
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
                onPress={async () => {
                  Alert.alert('주문 취소', '정말 이 주문을 취소하시겠습니까?', [
                    { text: '아니오', style: 'cancel' },
                    {
                      text: '예',
                      onPress: async () => {
                        try {
                          await cancelOrder(order.id);
                          Alert.alert('완료', '주문이 취소되었습니다.');
                          await fetchOrders(); // 주문 목록 새로고침
                        } catch (error: any) {
                          console.error('주문 취소 실패:', error);
                          const errorMessage = error.response?.data?.message || '주문 취소 중 오류가 발생했습니다.';
                          Alert.alert('오류', errorMessage);
                        }
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
      </ScrollView>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' }]}>
      {/* 고정 헤더 */}
      <View style={[styles.fixedHeader, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' }]}>
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
      </View>

      {/* 탭 컨텐츠 */}
      <View style={styles.tabContent}>
        {activeTab === 'search' && renderSearchTab()}
        {activeTab === 'portfolio' && renderPortfolioTab()}
        {activeTab === 'orders' && renderOrdersTab()}
      </View>

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

          <ScrollView style={styles.orderFormScroll} showsVerticalScrollIndicator={false}>
            {/* 계좌 선택 */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>계좌 선택</Text>
              <TouchableOpacity
                style={[styles.accountSelector, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' }]}
                onPress={() => setShowAccountPicker(true)}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.accountName, { color: selectedAccount ? colors.text : colors.icon }]}>
                    {selectedAccount?.accountName || '계좌를 선택하세요'}
                  </Text>
                  {selectedAccount && (
                    <Text style={{ fontSize: 12, color: colors.icon, marginTop: 2 }}>
                      잔액: ${selectedAccount.balance.toLocaleString()}
                    </Text>
                  )}
                </View>
                <IconSymbol size={16} name="chevron.down" color={colors.icon} />
              </TouchableOpacity>
            </View>

            {/* 주문가격 입력 */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>주문가격</Text>
              <TextInput
                style={[styles.orderInput, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC', color: colors.text }]}
                placeholder="0.00"
                placeholderTextColor={colors.icon}
                value={orderPrice}
                onChangeText={handleOrderPriceChange}
                keyboardType="decimal-pad"
              />
            </View>

            {/* 투자 비율 슬라이더 */}
            <View style={styles.inputGroup}>
              <View style={styles.sliderHeader}>
                <Text style={[styles.inputLabelInline, { color: colors.text }]}>투자 비율</Text>
                <Text style={[styles.currentBalance, { color: colors.icon }]}>
                  ({orderType === 'buy' ? '현재잔액' : '보유 수량'}: {orderType === 'buy' ? `₩${selectedAccount?.balance.toLocaleString() || '0'}` : '0'})
                </Text>
              </View>
              <View style={styles.sliderContainer}>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={100}
                  step={1}
                  value={investmentRatio}
                  onValueChange={handleInvestmentRatioChange}
                  minimumTrackTintColor="#10B981"
                  maximumTrackTintColor={colorScheme === 'dark' ? '#334155' : '#E2E8F0'}
                  thumbTintColor="#10B981"
                />
                <Text style={[styles.ratioText, { color: '#10B981' }]}>{Math.round(investmentRatio)}%</Text>
              </View>
            </View>

            {/* 예상 수량 */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>예상 수량</Text>
              <TextInput
                style={[styles.orderInput, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC', color: colors.text }]}
                placeholder="0"
                placeholderTextColor={colors.icon}
                value={orderQuantity}
                onChangeText={handleQuantityChange}
                keyboardType="decimal-pad"
              />
            </View>

            {/* 총 주문금액 */}
            <View style={[styles.totalContainer, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' }]}>
              <Text style={[styles.totalLabel, { color: colors.icon }]}>총 주문금액</Text>
              <Text style={[styles.totalAmount, { color: orderType === 'buy' ? '#10B981' : '#EF4444' }]}>
                ₩{investmentAmount.toLocaleString()}
              </Text>
            </View>

            {/* 주문하기 버튼 */}
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: orderType === 'buy' ? '#10B981' : '#EF4444' }]}
              onPress={handleOrder}>
              <Text style={styles.submitButtonText}>{orderType === 'buy' ? '매수' : '매도'} 주문하기</Text>
            </TouchableOpacity>

          </ScrollView>
        </View>
      )}

      {/* 계좌 선택 모달 */}
      <Modal
        visible={showAccountPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAccountPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>계좌 선택</Text>
              <TouchableOpacity onPress={() => setShowAccountPicker(false)}>
                <IconSymbol size={24} name="xmark.circle.fill" color={colors.icon} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.accountList}>
              {accounts.length === 0 ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: colors.icon }}>계좌가 없습니다. 마이페이지에서 개인 계좌를 생성하거나 배틀에 참여하세요.</Text>
                </View>
              ) : (
                accounts.map((account) => (
                  <TouchableOpacity
                    key={account.id}
                    style={[
                      styles.accountItem,
                      { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' },
                      selectedAccount?.id === account.id && styles.selectedAccountItem,
                    ]}
                    onPress={() => {
                      setSelectedAccount(account);
                      setShowAccountPicker(false);
                      setInvestmentRatio(0);
                      setInvestmentAmount(0);
                      setOrderQuantity('');
                    }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.accountItemName, { color: colors.text }]}>{account.accountName}</Text>
                      <Text style={{ fontSize: 13, color: colors.icon, marginTop: 4 }}>
                        잔액: ${account.balance.toLocaleString()}
                      </Text>
                    </View>
                    {selectedAccount?.id === account.id && (
                      <IconSymbol size={20} name="checkmark.circle.fill" color="#6366F1" />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fixedHeader: {
    paddingTop: 105,
    paddingHorizontal: 20,
  },
  header: {
    paddingVertical: 20,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
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
    height: 500,
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
    maxHeight: '85%',
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
    borderRadius: 12,
    alignItems: 'center',
  },
  orderTypeButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputLabelInline: {
    fontSize: 14,
    fontWeight: '600',
  },
  accountSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  accountName: {
    fontSize: 15,
    fontWeight: '600',
  },
  orderFormScroll: {
    maxHeight: 400,
  },
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 8,
  },
  currentBalance: {
    fontSize: 13,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  ratioText: {
    fontSize: 16,
    fontWeight: '700',
    width: 50,
    textAlign: 'right',
  },
  orderInput: {
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
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
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '800',
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  accountList: {
    maxHeight: 400,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  selectedAccountItem: {
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  accountItemName: {
    fontSize: 15,
    fontWeight: '600',
  },
  // 계좌 카드 스타일
  accountCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  accountCardName: {
    fontSize: 18,
    fontWeight: '700',
  },
  accountCardBody: {
    gap: 8,
  },
  accountCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountCardLabel: {
    fontSize: 13,
  },
  accountCardValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  // 뒤로가기 버튼
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  // 계좌 상세 이름
  accountDetailName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
});
