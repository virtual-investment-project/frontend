import { ThemedText } from '../components/ThemedText';
import { IconSymbol } from '../components/ui/IconSymbol';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/useColorScheme';
import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Modal } from 'react-native';
import Slider from '@react-native-community/slider';
import { Stock, searchSymbols } from '../types/tradingview';
import { toggleFavorite } from '../services/favoriteService';
import { useFavoritesContext, FavoriteWithPrice } from '../contexts/FavoritesContext';
import { Account } from '../types/account';
import { getAllMyAccounts, getAccountStocks, getPersonalAccount, getBattleAccount } from '../services/accountService';
import { getAllBattles } from '../services/battleService';
import { StockHoldingResponse } from '../types/api';
import { createOrder, getOrdersByAccount, cancelOrder, OrderResponse } from '../services/orderService';
import { getAccountProfitById } from '../services/accountService';
import { getAccountHistory } from '../services/historyService';
import { AccountProfitResponse, AccountHistoryResponse } from '../types/api';

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
  status: 'pending' | 'filled' | 'cancelled';
  orderTime: string;
  accountName: string;
}

const areSameHoldings = (prev: StockHoldingResponse[], next: StockHoldingResponse[]): boolean => {
  if (prev.length !== next.length) return false;
  return prev.every((item, index) => {
    const other = next[index];
    if (!other) return false;
    return (
      item.id === other.id &&
      item.quantity === other.quantity &&
      item.averagePrice === other.averagePrice &&
      item.currentPrice === other.currentPrice
    );
  });
};

const areSameProfit = (
  prev: AccountProfitResponse | null,
  next: AccountProfitResponse | null,
): boolean => {
  if (prev === next) return true;
  if (!prev || !next) return false;
  return (
    prev.accountId === next.accountId &&
    prev.totalAsset === next.totalAsset &&
    prev.returnAmount === next.returnAmount &&
    prev.returnRate === next.returnRate &&
    prev.seedMoney === next.seedMoney
  );
};

export default function InvestScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const cardBg = { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' };
  const pageBg = { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' };
  const inputBg = { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' };
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

  // 포트폴리오 탭용 선택된 계좌 상태 및 보유 종목
  const [portfolioSelectedAccount, setPortfolioSelectedAccount] = useState<Account | null>(null);
  const [portfolioProfit, setPortfolioProfit] = useState<AccountProfitResponse | null>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [portfolioHoldings, setPortfolioHoldings] = useState<StockHoldingResponse[]>([]);
  const [portfolioPendingBuyAmount, setPortfolioPendingBuyAmount] = useState(0);
  const [accountsRefreshing, setAccountsRefreshing] = useState(false);

  // 투자 비율 관련 상태
  const [investmentRatio, setInvestmentRatio] = useState(0); // 0 ~ 100%
  const [investmentAmount, setInvestmentAmount] = useState(0); // 투자 금액 (원화)

  // 주문 중복 제출 방지
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 매도 시 보유 수량 (selectedAccount + selectedStock 조합)
  const [sellableQuantity, setSellableQuantity] = useState(0);
  // 포트폴리오 상세보기에서 직접 매도 시 사용
  const [returnToPortfolio, setReturnToPortfolio] = useState(false); // 바텐시트 닫기/주문완료 후 포트폴리오로 복귀
  const [accountLocked, setAccountLocked] = useState(false);        // 포트폴리오 매도 시 계좌 변경 불가


  // 계좌 정보 조회 - 화면 포커스 시마다 최신 계좌 목록 갱신
  useFocusEffect(
    useCallback(() => {
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
        } catch {
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
                  battleStatus: battle.status,
                  battleStartAt: battle.startAt,
                  battleEndAt: battle.endAt,
                });
              }
            } catch {
              // 해당 배틀에 참여하지 않은 경우 무시
            }
          }
        } catch (error) {
          console.error('계좌 목록 조회 실패:', error);
        }

        setAccounts(allAccounts);
        if (allAccounts.length > 0 && !selectedAccount) {
          setSelectedAccount(allAccounts[0]);
        }
      };

      fetchAccounts();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

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

  // 주문 내역 상태
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderHistory, setOrderHistory] = useState<AccountHistoryResponse[]>([]);

  // 주문 목록 조회
  const fetchOrders = useCallback(async () => {
    if (!selectedAccount) {
      setOrders([]);
      setOrderHistory([]);
      return;
    }

    try {
      const [ordersData, historyData] = await Promise.all([
        getOrdersByAccount(selectedAccount.id),
        getAccountHistory(selectedAccount.id).catch((error) => {
          console.warn('거래 내역 조회 실패:', error);
          return [] as AccountHistoryResponse[];
        }),
      ]);

      const formattedOrders: Order[] = ordersData.map((order: OrderResponse) => ({
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
        status: order.status.toLowerCase() as 'pending' | 'filled' | 'cancelled',
        orderTime: new Date(order.createdAt).toLocaleString('ko-KR'),
        accountName: order.accountName || '',
      }));
      setOrders(formattedOrders);
      setOrderHistory(historyData.filter((item) => item.tradeType !== 'PROFIT_SNAPSHOT'));
    } catch (error) {
      console.error('주문 목록 조회 실패:', error);
    }
  }, [selectedAccount]);

  // 계좌 선택 시 주문 목록 조회
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // 매도 몦어 좌: 계좌 또는 종목이 바뀌면 보유 수량 업데이트
  useEffect(() => {
    const fetchSellableQty = async () => {
      if (!selectedAccount || !selectedStock || orderType !== 'sell') {
        setSellableQuantity(0);
        return;
      }
      try {
        const holdings = await getAccountStocks(selectedAccount.id);
        const stockCode = selectedStock.symbol.includes(':')
          ? selectedStock.symbol.split(':')[1]
          : selectedStock.symbol;
        const holding = holdings.find(h => h.stockCode === stockCode);
        setSellableQuantity(holding ? parseFloat(holding.quantity) : 0);
      } catch {
        setSellableQuantity(0);
      }
    };
    fetchSellableQty();
  }, [selectedAccount, selectedStock, orderType]);

  // 포트폴리오 상세보기 - 5초마다 가격/수익률 중심 폴링
  useEffect(() => {
    if (!portfolioSelectedAccount) return;

    const poll = async () => {
      try {
        const [holdings, pendingOrders, profit] = await Promise.all([
          getAccountStocks(portfolioSelectedAccount.id),
          getOrdersByAccount(portfolioSelectedAccount.id),
          getAccountProfitById(portfolioSelectedAccount.id).catch(() => null as AccountProfitResponse | null),
        ]);

        setPortfolioHoldings((prev) => (areSameHoldings(prev, holdings) ? prev : holdings));

        const pendingBuy = pendingOrders
          .filter(o => o.orderType === 'BUY' && o.status === 'PENDING')
          .reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);

        setPortfolioPendingBuyAmount((prev) => (prev === pendingBuy ? prev : pendingBuy));
        setPortfolioProfit((prev) => (areSameProfit(prev, profit) ? prev : profit));
      } catch {
        // 폴링 실패 시 무시 (화면 유지)
      }
    };

    poll();
    const intervalId = setInterval(poll, 5000); // 5초마다
    return () => clearInterval(intervalId);    // 상세보기 닫히면 정리
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portfolioSelectedAccount?.id]);           // id 기준으로만 재등록


  // 포트폴리오 계좌 선택 시 초기 수익 정보 조회
  useEffect(() => {
    if (!portfolioSelectedAccount) {
      setPortfolioProfit(null);
      return;
    }
    const fetchPortfolioData = async () => {
      setPortfolioLoading(true);
      try {
        // 수익률 조회
        const profit = await getAccountProfitById(portfolioSelectedAccount.id);
        setPortfolioProfit(profit);
      } catch (error: any) {
        console.warn('수익률 조회 실패:', error?.response?.status, error?.message);
      }
      setPortfolioLoading(false);
    };
    fetchPortfolioData();
  }, [portfolioSelectedAccount]);

  // 종목 선택 — Binance API로 실시간 가격 조회
  const handleStockSelect = async (stock: Stock) => {
    const isFav = favorites.some(fav => fav.symbol === stock.symbol);

    // 종목 코드 추출 (BINANCE:BTCUSDT → BTCUSDT, NASDAQ:NVDA → NVDA)
    const rawCode = stock.symbol.includes(':') ? stock.symbol.split(':')[1] : stock.symbol;

    // 먼저 바텀시트 표시 (로딩 중 0.00 표시 후 갱신)
    const stockWithPrice: StockWithPrice = {
      ...stock,
      isFavorite: isFav,
      currentPrice: 0,
      change: 0,
      changePercent: 0,
      marketCap: 'N/A',
    };
    setSelectedStock(stockWithPrice);
    setOrderPrice('');
    setOrderQuantity('');
    setInvestmentRatio(0);
    setInvestmentAmount(0);
    setSearchQuery('');
    setShowSearchResults(false);

    // Binance 공개 API로 실시간 현재가 조회
    try {
      const binanceSymbol = rawCode.replace('/', '').toUpperCase();
      const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`);
      if (response.ok) {
        const data = await response.json();
        const price = parseFloat(data.price);
        setSelectedStock(prev => prev ? { ...prev, currentPrice: price } : prev);
        setOrderPrice(price.toFixed(2));
      }
    } catch (error) {
      console.error('Binance 현재가 조회 실패:', error);
    }
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
      // 매도: 보유 수량 * 현재가 기반
      const curPrice = parseFloat(orderPrice);
      baseAmount = Math.floor(sellableQuantity * curPrice);
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
        baseAmount = Math.floor(sellableQuantity * priceNum);
      }

      if (baseAmount > 0) {
        const ratio = Math.min((amount / baseAmount) * 100, 100);
        setInvestmentRatio(ratio);
      }
    }
  };

  const calculateTotal = () => {
    const price = parseFloat(orderPrice) || 0;
    const quantity = parseFloat(orderQuantity) || 0; // parseInt → parseFloat (소수점 수량 지원)
    return price * quantity;
  };

  const handleOrder = async () => {
    if (isSubmitting) return; // 중복 제출 방지

    if (!selectedStock) {
      Alert.alert('오류', '종목을 선택해주세요.');
      return;
    }
    if (!selectedAccount) {
      Alert.alert('오류', '계좌를 선택해주세요.');
      return;
    }
    // 배틀 시작 전 거래 차단
    if (selectedAccount.battleStatus === 'YET') {
      const startAt = selectedAccount.battleStartAt
        ? new Date(selectedAccount.battleStartAt).toLocaleString('ko-KR')
        : '배틀 시작 시간';
      Alert.alert('거래 불가', `배틀이 아직 시작되지 않았습니다.\n${startAt} 이후에 거래할 수 있습니다.`);
      return;
    }
    if (selectedAccount.battleStatus === 'END') {
      Alert.alert('거래 불가', '종료된 배틀의 계좌로는 거래할 수 없습니다.');
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

    const price = parseFloat(parseFloat(orderPrice).toFixed(8));   // 8자리 반올림으로 부동소수점 오차 제거
    const quantity = parseFloat(parseFloat(orderQuantity).toFixed(8)); // DB scale=8과 일치
    const totalAmount = price * quantity;

    if (orderType === 'buy' && totalAmount > selectedAccount.balance) {
      Alert.alert('오류', '잔액이 부족합니다.');
      return;
    }

    setIsSubmitting(true);
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
        currentPrice: selectedStock.currentPrice ?? price,
        quantity: quantity,
        orderType: orderType.toUpperCase() as 'BUY' | 'SELL',
      });

      // 주문 목록 새로고침
      await fetchOrders();

      Alert.alert(
        '주문 완료',
        `${selectedStock.koreanName || selectedStock.name} ${quantity}주 ${orderType === 'buy' ? '매수' : '매도'} 주문이 접수되었습니다.`,
        [{
          text: '확인', onPress: () => {
            resetOrderForm();
            if (returnToPortfolio) {
              setReturnToPortfolio(false);
              setAccountLocked(false);
              setSelectedStock(null);
            }
          }
        }]
      );
    } catch (error: any) {
      console.error('주문 실패:', error);
      const status = error.response?.status;
      const serverMessage = error.response?.data?.message;

      let errorMessage: string;
      if (serverMessage) {
        // 서버가 보낸 메시지 우선 표시 (비즈니스 오류 포함)
        errorMessage = serverMessage;
      } else if (status === 401) {
        errorMessage = '로그인이 필요합니다. 다시 로그인해 주세요.';
      } else if (status === 403) {
        errorMessage = '권한이 없습니다.';
      } else {
        errorMessage = '주문 처리 중 오류가 발생했습니다.';
      }
      Alert.alert('주문 실패', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetOrderForm = () => {
    setOrderPrice('');
    setOrderQuantity('');
    setInvestmentRatio(0);
    setInvestmentAmount(0);
  };

  // 포트폴리오 상세보기에서 매도 바텐시트를 닫고 복귀
  const handleCloseOrderPanel = () => {
    if (returnToPortfolio) {
      setReturnToPortfolio(false);
      setAccountLocked(false);
      resetOrderForm();
      setSelectedStock(null);
      // 포트폴리오 탭 유지 (상세보기 쪼던 상태는 portfolioSelectedAccount가 유지됨)
    } else {
      setSelectedStock(null);
      resetOrderForm();
    }
  };

  // 즐겨찾기 카드 렌더링
  const renderFavoriteCard = (fav: FavoriteWithPrice) => {
    const favCardBorder = {
      borderColor: selectedStock?.symbol === fav.symbol ? '#6366F1' : 'transparent' as const,
      borderWidth: selectedStock?.symbol === fav.symbol ? 2 : 0,
    };
    const changeColor = { color: fav.change >= 0 ? '#10B981' : '#EF4444' };
    return (
      <TouchableOpacity
        key={fav.symbol}
        style={[
          styles.stockCard,
          styles.shadow,
          cardBg,
          favCardBorder,
        ]}
        onPress={() => handleFavoriteSelect(fav)}>
        <View style={styles.flex1}>
          <Text style={[styles.stockSymbol, { color: colors.text }]}>
            {fav.symbol.includes(':') ? fav.symbol.split(':')[1] : fav.symbol}
          </Text>
          <Text style={[styles.stockName, { color: colors.icon }]}>
            {fav.koreanName || fav.name}
          </Text>
          <Text style={[styles.marketCap, { color: colors.icon }]}>시가총액: {fav.marketCap}</Text>
        </View>
        <View style={styles.alignItemsEnd}>
          <Text style={[styles.stockPrice, { color: colors.text }]}>${fav.currentPrice.toFixed(2)}</Text>
          <View style={styles.stockChangeRow}>
            <IconSymbol
              size={12}
              name={fav.change >= 0 ? 'arrow.up' : 'arrow.down'}
              color={fav.change >= 0 ? '#10B981' : '#EF4444'}
            />
            <Text style={[styles.stockChange, changeColor]}>
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
  };

  // 검색 결과 렌더링
  const renderSearchResult = (stock: Stock) => {
    const isFav = favorites.some(fav => fav.symbol === stock.symbol);

    return (
      <TouchableOpacity
        key={stock.symbol}
        style={[
          styles.searchResultCard,
          cardBg,
        ]}
        onPress={() => handleStockSelect(stock)}>
        <View style={styles.flex1}>
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
    <View style={styles.flex1}>
      {/* 검색 */}
      <View style={[styles.searchContainer, cardBg]}>
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
        <View style={[styles.searchResultsContainer, cardBg]}>
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
        <View style={[styles.searchResultsContainer, cardBg]}>
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
            <View style={styles.flex1}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>즐겨찾기</Text>
                <Text style={[styles.sectionCount, { color: colors.icon }]}>
                  {favorites.length}개
                </Text>
              </View>
              <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false}>
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
        <View style={styles.flex1}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>내 계좌</Text>
            <Text style={[styles.sectionCount, { color: colors.icon }]}>
              {accounts.length}개
            </Text>
          </View>

          <ScrollView
            style={styles.flex1}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={accountsRefreshing}
                onRefresh={async () => {
                  setAccountsRefreshing(true);
                  try {
                    const data = await getAllMyAccounts();
                    setAccounts(data.map(acc => ({
                      id: acc.id,
                      accountName: acc.name,
                      balance: acc.balance,
                      totalAsset: acc.totalAsset,
                    })));
                  } catch (error) {
                    console.error('계좌 새로고침 실패:', error);
                  } finally {
                    setAccountsRefreshing(false);
                  }
                }}
                colors={['#6366F1']}
                tintColor="#6366F1"
              />
            }>
            {accounts.map((account) => (
              <TouchableOpacity
                key={account.id}
                style={[styles.card, styles.shadow, cardBg]}
                onPress={async () => {
                  setPortfolioSelectedAccount(account);
                  setPortfolioHoldings([]);
                  setPortfolioPendingBuyAmount(0);
                  setPortfolioLoading(true);
                  try {
                    const [holdings, accountOrders] = await Promise.all([
                      getAccountStocks(account.id),
                      getOrdersByAccount(account.id),
                    ]);
                    setPortfolioHoldings(holdings);
                    const pendingBuy = accountOrders
                      .filter(o => o.orderType === 'BUY' && o.status === 'PENDING')
                      .reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);
                    setPortfolioPendingBuyAmount(pendingBuy);
                  } catch (error) {
                    console.error('상세 조회 실패:', error);
                  } finally {
                    setPortfolioLoading(false);
                  }
                }}>
                <View style={styles.accountCardHeader}>
                  <Text style={[styles.accountCardName, { color: colors.text }]}>{account.accountName}</Text>
                  <IconSymbol size={20} name="chevron.right" color={colors.icon} />
                </View>

                <View style={styles.accountCardBody}>
                  <View style={styles.accountCardRow}>
                    <Text style={[styles.accountCardLabel, { color: colors.icon }]}>총 평가금액</Text>
                    <Text style={[styles.accountCardValue, { color: colors.text }]}>
                      ${account.totalAsset.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.accountCardRow}>
                    <Text style={[styles.accountCardLabel, { color: colors.icon }]}>사용 가능 금액</Text>
                    <Text style={[styles.accountCardValue, { color: colors.icon }]}>
                      ${account.balance.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      );
    }

    // 백엔드 balance = 사용가능 현금 (예약금 이미 차감)
    const totalStockValue = portfolioHoldings.reduce((sum, holding) => {
      const price = parseFloat(holding.currentPrice ?? holding.averagePrice ?? '0');
      const qty = parseFloat(holding.quantity);
      return sum + price * qty;
    }, 0);
    const totalHoldingValue =
      portfolioProfit?.totalAsset ??
      (portfolioSelectedAccount.balance + portfolioPendingBuyAmount + totalStockValue);

    return (
      <View style={styles.flex1}>
        {/* 뒤로가기 버튼 */}
        <TouchableOpacity
          style={[styles.backButton, cardBg]}
          onPress={handleBackToAccounts}>
          <IconSymbol size={20} name="chevron.left" color={colors.icon} />
          <Text style={[styles.backButtonText, { color: colors.text }]}>계좌 목록</Text>
        </TouchableOpacity>

        <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false}>
          {/* 계좌 수익 정보 */}
          <View style={[styles.card, styles.shadow, cardBg]}>
            <Text style={[styles.accountDetailName, { color: colors.text }]}>{portfolioSelectedAccount.accountName}</Text>
            <Text style={[styles.sectionTitle, styles.marginTop16, { color: colors.text }]}>총 평가금액</Text>
            <Text style={[styles.totalValue, { color: colors.text }]}>
              ${totalHoldingValue.toLocaleString()}
            </Text>
            <View style={styles.accountCardRow}>
              <Text style={[styles.accountCardLabel, { color: colors.icon }]}>사용 가능 현금</Text>
              <Text style={[styles.accountCardValue, { color: colors.text }]}>
                ${portfolioSelectedAccount.balance.toLocaleString()}
              </Text>
            </View>
            {portfolioPendingBuyAmount > 0 && (
              <View style={styles.accountCardRow}>
                <Text style={[styles.accountCardLabel, { color: '#F59E0B' }]}>매수 예약금</Text>
                <Text style={[styles.accountCardValue, { color: '#F59E0B' }]}>
                  ${portfolioPendingBuyAmount.toLocaleString()}
                </Text>
              </View>
            )}
            <View style={styles.accountCardRow}>
              <Text style={[styles.accountCardLabel, { color: colors.icon }]}>보유주식 평가액</Text>
              <Text style={[styles.accountCardValue, { color: colors.text }]}>
                ${totalStockValue.toLocaleString()}
              </Text>
            </View>
            {portfolioProfit && (
              <>
                <View style={styles.profitRow}>
                  <Text style={[styles.profitLabel, { color: colors.icon }]}>평가손익</Text>
                  <Text style={[styles.profitValue, portfolioProfit.returnAmount >= 0 ? styles.colorGreen : styles.colorRed]}>
                    {portfolioProfit.returnAmount >= 0 ? '+$' : '-$'}{Math.abs(portfolioProfit.returnAmount).toLocaleString()}{' '}
                    ({portfolioProfit.returnRate >= 0 ? '+' : ''}{portfolioProfit.returnRate.toFixed(2)}%)
                  </Text>
                </View>
                <View style={styles.profitRow}>
                  <Text style={[styles.profitLabel, { color: colors.icon }]}>시드머니</Text>
                  <Text style={[styles.profitValue, { color: colors.icon }]}>${portfolioProfit.seedMoney.toLocaleString()}</Text>
                </View>
              </>
            )}
          </View>

          {/* 보유 종목 */}
          <View style={[styles.sectionHeader, styles.marginTop8]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>보유 종목</Text>
            <Text style={[styles.sectionCount, { color: colors.icon }]}>{portfolioHoldings.length}개</Text>
          </View>

          {portfolioLoading ? (
            <View style={[styles.card, styles.shadow, cardBg, styles.centerPad24]}>
              <Text style={[styles.detailLabel, { color: colors.icon }]}>보유 종목을 불러오는 중...</Text>
            </View>
          ) : portfolioHoldings.length === 0 ? (
            <View style={[styles.card, styles.shadow, cardBg, styles.centerPad24]}>
              <Text style={[styles.detailLabel, { color: colors.icon }]}>보유 종목이 없습니다</Text>
            </View>
          ) : (
            portfolioHoldings.map((item) => {
              const avgPrice = parseFloat(item.averagePrice);
              const curPrice = parseFloat(item.currentPrice ?? item.averagePrice ?? '0');
              const qty = parseFloat(item.quantity);
              const currentVal = curPrice * qty;
              const profitLoss = (curPrice - avgPrice) * qty;
              const profitPercent = avgPrice > 0 ? ((curPrice - avgPrice) / avgPrice) * 100 : 0;

              return (
                <View
                  key={item.id}
                  style={[styles.card, styles.shadow, cardBg]}>
                  <View style={styles.portfolioHeader}>
                    <View style={styles.flex1}>
                      <Text style={[styles.stockSymbol, { color: colors.text }]}>{item.stockCode}</Text>
                      <Text style={[styles.stockName, { color: colors.icon }]}>{item.stockName}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.tradeButton, { backgroundColor: '#EF4444' }]}
                      onPress={() => {
                        setSelectedAccount(portfolioSelectedAccount);
                        setSelectedStock({
                          symbol: item.stockCode,
                          name: item.stockName,
                          koreanName: item.stockName,
                          currentPrice: curPrice,
                        });
                        setOrderPrice(curPrice.toFixed(2));
                        setOrderQuantity('');
                        setInvestmentRatio(0);
                        setInvestmentAmount(0);
                        setOrderType('sell');
                        setReturnToPortfolio(true);
                        setAccountLocked(true);
                      }}>
                      <Text style={styles.tradeButtonText}>매도</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.portfolioDetail}>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.icon }]}>보유수량</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>{qty.toFixed(4)}주</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.icon }]}>평균단가</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>${avgPrice.toFixed(2)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.icon }]}>현재가</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>${curPrice.toFixed(2)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.icon }]}>평가금액</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>${currentVal.toFixed(2)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.icon }]}>평가손익</Text>
                      <Text style={[styles.detailValue, { color: profitLoss >= 0 ? '#10B981' : '#EF4444' }]}>
                        {profitLoss >= 0 ? '+' : ''}${profitLoss.toFixed(2)} ({profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(2)}%)
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}

        </ScrollView>
      </View>
    );
  };


  const renderOrdersTab = () => (
    <View style={styles.flex1}>
      <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>주문 내역</Text>
          <Text style={[styles.sectionCount, { color: colors.icon }]}>{orders.length}건</Text>
        </View>

        {orders.map((order) => {
          const statusBg = { backgroundColor: order.status === 'filled' ? '#10B981' : order.status === 'cancelled' ? '#94A3B8' : '#F59E0B' };
          const typeBg = { backgroundColor: order.type === 'buy' ? '#10B981' : '#EF4444' };
          return (
            <View
              key={order.id}
              style={[styles.card, styles.shadow, cardBg]}>
              <View style={styles.orderHeader}>
                <View style={styles.flex1}>
                  <View style={styles.orderTitleRow}>
                    <Text style={[styles.stockSymbol, { color: colors.text }]}>
                      {order.stock.symbol.includes(':') ? order.stock.symbol.split(':')[1] : order.stock.symbol}
                    </Text>
                    <View
                      style={[
                        styles.orderStatusBadge,
                        statusBg,
                      ]}>
                      <Text style={styles.orderStatusText}>
                        {order.status === 'filled' ? '체결' : order.status === 'cancelled' ? '취소' : '예약'}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.orderTime, { color: colors.icon }]}>
                    {order.orderTime}  ·  {order.accountName}
                  </Text>
                </View>
                <View
                  style={[styles.orderTypeBadge, typeBg]}>
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
                  <Text style={[styles.detailValue, { color: colors.text }, styles.fontBold]}>
                    ${order.totalAmount.toLocaleString()}
                  </Text>
                </View>
              </View>

              {order.status === 'pending' && (
                <TouchableOpacity
                  style={[styles.cancelButton, pageBg]}
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
                  <Text style={[styles.cancelButtonText, styles.colorRed]}>주문 취소</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {orders.length === 0 && (
          <View style={[styles.card, styles.shadow, cardBg, styles.centerPad24]}>
            <Text style={[styles.detailLabel, { color: colors.icon }]}>주문 내역이 없습니다</Text>
          </View>
        )}

        <View style={[styles.sectionHeader, styles.marginTop8]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>거래 내역</Text>
          <Text style={[styles.sectionCount, { color: colors.icon }]}>{orderHistory.length}건</Text>
        </View>

        {orderHistory.map((item) => {
          const tradeTypeLabel: Record<string, string> = {
            BUY: '매수',
            SELL: '매도',
            SEED_MONEY: '시드머니',
          };
          const isPositive = item.tradeType === 'SELL' || item.tradeType === 'SEED_MONEY';
          const amountColor = isPositive ? '#10B981' : (item.tradeType === 'BUY' ? '#EF4444' : colors.text);
          const tradeTypeBg = {
            backgroundColor:
              item.tradeType === 'BUY' ? '#EF4444' :
                item.tradeType === 'SELL' ? '#10B981' : '#6366F1',
          };
          return (
            <View
              key={item.id}
              style={[styles.card, styles.shadow, cardBg]}>
              <View style={styles.orderHeader}>
                <View style={styles.flex1}>
                  <Text style={[styles.stockSymbol, { color: colors.text }]}>{item.description}</Text>
                  <Text style={[styles.orderTime, { color: colors.icon }]}>
                    {new Date(item.createdAt).toLocaleString('ko-KR')}
                  </Text>
                </View>
                <View style={[styles.orderTypeBadge, tradeTypeBg]}>
                  <Text style={styles.orderTypeText}>{tradeTypeLabel[item.tradeType] ?? item.tradeType}</Text>
                </View>
              </View>
              <View style={styles.portfolioDetail}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.icon }]}>거래 금액</Text>
                  <Text style={[styles.detailValue, { color: amountColor }]}>
                    {isPositive ? '+$' : '-$'}{Math.abs(item.amount).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.icon }]}>거래 후 잔액</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>${item.balanceSnapshot.toLocaleString()}</Text>
                </View>
              </View>
            </View>
          );
        })}

        {orderHistory.length === 0 && (
          <View style={[styles.card, styles.shadow, cardBg, styles.centerPad24]}>
            <Text style={[styles.detailLabel, { color: colors.icon }]}>거래 내역이 없습니다</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  const buyBtnBg = { backgroundColor: orderType === 'buy' ? '#10B981' : pageBg.backgroundColor };
  const sellBtnBg = { backgroundColor: orderType === 'sell' ? '#EF4444' : pageBg.backgroundColor };
  const buyBtnText = { color: orderType === 'buy' ? '#FFFFFF' : colors.text };
  const sellBtnText = { color: orderType === 'sell' ? '#FFFFFF' : colors.text };
  const isBattleNotStarted = selectedAccount?.battleStatus === 'YET';
  const submitBtnBg = isBattleNotStarted
    ? { backgroundColor: '#94A3B8' }
    : { backgroundColor: orderType === 'buy' ? '#10B981' : '#EF4444' };

  return (
    <View style={[styles.container, pageBg]}>
      {/* 고정 헤더 */}
      <View style={[styles.fixedHeader, pageBg]}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>투자하기</ThemedText>
        </View>

        {/* 탭 버튼 */}
        <View style={[styles.tabContainer, cardBg]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'search' && styles.activeTab]}
            onPress={() => setActiveTab('search')}>
            <Text style={[styles.tabText, activeTab === 'search' ? styles.tabActive : { color: colors.icon }]}>
              종목검색
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'portfolio' && styles.activeTab]}
            onPress={() => setActiveTab('portfolio')}>
            <Text style={[styles.tabText, activeTab === 'portfolio' ? styles.tabActive : { color: colors.icon }]}>
              포트폴리오
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'orders' && styles.activeTab]}
            onPress={() => setActiveTab('orders')}>
            <Text style={[styles.tabText, activeTab === 'orders' ? styles.tabActive : { color: colors.icon }]}>
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

      {/* 주문 패널 (선택된 종목이 있을 때만 표시: 종목 검색 or 포트폴리오 매도) */}
      {selectedStock && (activeTab === 'search' || returnToPortfolio) && (
        <View style={[styles.orderPanel, cardBg]}>
          <View style={styles.orderPanelHeader}>
            <View style={styles.flex1}>
              <Text style={[styles.orderStockSymbol, { color: colors.text }]}>
                {selectedStock.symbol.includes(':') ? selectedStock.symbol.split(':')[1] : selectedStock.symbol}
              </Text>
              <Text style={[styles.orderStockPrice, { color: colors.icon }]}>
                현재가: ${selectedStock.currentPrice?.toFixed(2) || '0.00'}
              </Text>
            </View>
            <TouchableOpacity onPress={handleCloseOrderPanel}>
              <IconSymbol size={24} name="xmark.circle.fill" color={colors.icon} />
            </TouchableOpacity>
          </View>

          {/* 매수/매도 선택 */}
          <View style={styles.orderTypeSelector}>
            <TouchableOpacity
              style={[styles.orderTypeButton, buyBtnBg]}
              onPress={() => setOrderType('buy')}>
              <Text style={[styles.orderTypeButtonText, buyBtnText]}>
                매수
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.orderTypeButton, sellBtnBg]}
              onPress={() => setOrderType('sell')}>
              <Text style={[styles.orderTypeButtonText, sellBtnText]}>
                매도
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.orderFormScroll} showsVerticalScrollIndicator={false}>
            {/* 계좌 선택 */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>계좌 선택</Text>
              <TouchableOpacity
                style={[
                  styles.accountSelector,
                  inputBg,
                  accountLocked && styles.lockedOpacity,
                ]}
                onPress={() => { if (!accountLocked) setShowAccountPicker(true); }}
                activeOpacity={accountLocked ? 1 : 0.7}>
                <View style={styles.flex1}>
                  <Text style={[styles.accountName, { color: selectedAccount ? colors.text : colors.icon }]}>
                    {selectedAccount?.accountName || '계좌를 선택하세요'}
                  </Text>
                  {selectedAccount && (
                    <Text style={[styles.balanceSubText, { color: colors.icon }]}>
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
                style={[styles.orderInput, inputBg, { color: colors.text }]}
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
                  ({orderType === 'buy' ? '현재잔액' : '보유수량'}: {orderType === 'buy' ? `$${selectedAccount?.balance.toLocaleString() || '0'}` : `${sellableQuantity}주`})
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
                <Text style={[styles.ratioText, styles.colorGreen]}>{Math.round(investmentRatio)}%</Text>
              </View>
            </View>

            {/* 예상 수량 */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>예상 수량</Text>
              <TextInput
                style={[styles.orderInput, inputBg, { color: colors.text }]}
                placeholder="0"
                placeholderTextColor={colors.icon}
                value={orderQuantity}
                onChangeText={handleQuantityChange}
                keyboardType="decimal-pad"
              />
            </View>

            {/* 총 주문금액 */}
            <View style={[styles.totalContainer, inputBg]}>
              <Text style={[styles.totalLabel, { color: colors.icon }]}>총 주문금액</Text>
              <Text style={[styles.totalAmount, orderType === 'buy' ? styles.colorGreen : styles.colorRed]}>
                ${calculateTotal().toFixed(2)}
              </Text>
            </View>

            {/* 주문하기 버튼 */}
            {isBattleNotStarted && (
              <Text style={{ color: '#F59E0B', fontSize: 12, textAlign: 'center', marginBottom: 6 }}>
                ⏳ 배틀 시작 후 거래 가능
                {selectedAccount?.battleStartAt
                  ? `\n${new Date(selectedAccount.battleStartAt).toLocaleString('ko-KR')}`
                  : ''}
              </Text>
            )}
            <TouchableOpacity
              style={[styles.submitButton, submitBtnBg]}
              disabled={isBattleNotStarted}
              onPress={handleOrder}>
              <Text style={styles.submitButtonText}>
                {isBattleNotStarted ? '배틀 시작 전' : `${orderType === 'buy' ? '매수' : '매도'} 주문하기`}
              style={[styles.submitButton, submitBtnBg, isSubmitting && { opacity: 0.5 }]}
              onPress={handleOrder}
              disabled={isSubmitting}>
              <Text style={styles.submitButtonText}>
                {isSubmitting ? '처리 중...' : (orderType === 'buy' ? '매수' : '매도') + ' 주문하기'}
              </Text>
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
          <View style={[styles.modalContent, cardBg]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>계좌 선택</Text>
              <TouchableOpacity onPress={() => setShowAccountPicker(false)}>
                <IconSymbol size={24} name="xmark.circle.fill" color={colors.icon} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.accountList}>
              {accounts.length === 0 ? (
                <View style={styles.modalEmptyContainer}>
                  <Text style={[styles.emptyText, { color: colors.icon }]}>계좌가 없습니다. 마이페이지에서 개인 계좌를 생성하거나 배틀에 참여하세요.</Text>
                </View>
              ) : (
                accounts.map((account) => (
                  <TouchableOpacity
                    key={account.id}
                    style={[
                      styles.accountItem,
                      pageBg,
                      selectedAccount?.id === account.id && styles.selectedAccountItem,
                    ]}
                    onPress={() => {
                      setSelectedAccount(account);
                      setShowAccountPicker(false);
                      setInvestmentRatio(0);
                      setInvestmentAmount(0);
                      setOrderQuantity('');
                    }}>
                    <View style={styles.flex1}>
                      <Text style={[styles.accountItemName, { color: colors.text }]}>{account.accountName}</Text>
                      <Text style={[styles.balanceSubText, { color: colors.icon }]}>
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
  flex1: { flex: 1 },
  alignItemsEnd: { alignItems: 'flex-end' as const },
  fontBold: { fontWeight: '700' as const },
  marginTop8: { marginTop: 8 },
  marginTop16: { marginTop: 16 },
  centerPad24: { alignItems: 'center' as const, padding: 24 },
  colorRed: { color: '#EF4444' },
  colorGreen: { color: '#10B981' },
  lockedOpacity: { opacity: 0.7 },
  balanceSubText: { fontSize: 12, marginTop: 2 },
  modalEmptyContainer: { padding: 20, alignItems: 'center' as const },
  tabActive: { color: '#6366F1' },
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
