import { ThemedText } from '../components/ThemedText';
import { IconSymbol } from '../components/ui/IconSymbol';
import { TradingViewChart } from '../components/TradingViewChart';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/useColorScheme';
import { Stock, searchSymbols } from '../types/tradingview';
import { toggleFavorite } from '../services/favoriteService';
import { useFavoritesContext } from '../contexts/FavoritesContext';
import { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert
} from 'react-native';

export default function ChartScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { favorites, refreshFavorites } = useFavoritesContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
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
      setSelectedStock({ ...stock, isFavorite: newIsFavorite });
    }
  };

  // 종목 선택
  const handleStockSelect = (stock: Stock) => {
    const isFav = favorites.some(fav => fav.symbol === stock.symbol);
    setSelectedStock({ ...stock, isFavorite: isFav });
    setSearchQuery('');
    setShowSearchResults(false);
  };

  // 즐겨찾기에서 종목 선택
  const handleFavoriteSelect = (fav: { symbol: string; name: string; koreanName?: string }) => {
    const stock: Stock = {
      symbol: fav.symbol,
      name: fav.name,
      koreanName: fav.koreanName,
      isFavorite: true,
    };
    setSelectedStock(stock);
  };

  // 즐겨찾기 카드 렌더링
  const renderFavoriteCard = (fav: { symbol: string; name: string; koreanName?: string }) => (
    <TouchableOpacity
      key={fav.symbol}
      style={[
        styles.favoriteCard,
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
      </View>
      <TouchableOpacity
        onPress={() => handleToggleFavorite({ symbol: fav.symbol, name: fav.name, koreanName: fav.koreanName })}
        style={styles.favoriteButton}>
        <IconSymbol size={22} name="star.fill" color="#FCD34D" />
      </TouchableOpacity>
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

  // 메인 화면 (즐겨찾기 목록 또는 빈 상태)
  const renderMainView = () => {
    if (favorites.length === 0) {
      return (
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
      );
    }

    return (
      <View>
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            즐겨찾기
          </ThemedText>
          <Text style={[styles.sectionCount, { color: colors.icon }]}>
            {favorites.length}개
          </Text>
        </View>
        <View style={styles.favoritesList}>
          {favorites.map(fav => renderFavoriteCard(fav))}
        </View>
      </View>
    );
  };

  // 차트 렌더링
  const renderChart = () => {
    if (!selectedStock) return null;

    return (
      <View>
        {/* 종목 정보 헤더 */}
        <View style={[styles.card, styles.shadow, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
          <View style={styles.stockHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.chartStockSymbol, { color: colors.text }]}>
                {selectedStock.symbol.includes(':') ? selectedStock.symbol.split(':')[1] : selectedStock.symbol}
              </Text>
              <Text style={[styles.chartStockName, { color: colors.icon }]}>
                {selectedStock.koreanName} · {selectedStock.name}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => handleToggleFavorite(selectedStock)}
              style={styles.favoriteButtonLarge}>
              <IconSymbol
                size={28}
                name={selectedStock.isFavorite ? "star.fill" : "star"}
                color={selectedStock.isFavorite ? "#FCD34D" : colors.icon}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* TradingView 차트 */}
        <View style={[styles.card, styles.shadow, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF', padding: 0, overflow: 'hidden' }]}>
          <TradingViewChart
            symbol={selectedStock.symbol}
            height={400}
          />
        </View>

        {/* 안내 정보 */}
        <View style={[styles.card, styles.shadow, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
          <View style={styles.infoRow}>
            <IconSymbol size={20} name="info.circle" color="#6366F1" />
            <Text style={[styles.infoText, { color: colors.icon }]}>
              실시간 차트를 확인하고 있습니다
            </Text>
          </View>
          <Text style={[styles.infoDetail, { color: colors.icon }]}>
            · 차트를 핀치하여 확대/축소할 수 있습니다{'\n'}
            · 좌우로 드래그하여 기간을 이동할 수 있습니다{'\n'}
            · 상단 도구를 사용하여 기술적 분석이 가능합니다
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC' }]}>
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        keyboardShouldPersistTaps="handled">

        {/* 헤더 */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>차트</ThemedText>
          <Text style={[styles.subtitle, { color: colors.icon }]}>
            {selectedStock
              ? `${selectedStock.koreanName || selectedStock.name} 차트 분석`
              : '종목을 검색하거나 즐겨찾기에서 선택하세요'}
          </Text>
        </View>

        {/* 검색 */}
        <View style={[styles.searchContainer, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
          <IconSymbol size={20} name="magnifyingglass" color={colors.icon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="종목명, 티커, 한글명 검색 (예: 비트코인, BTC)"
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

        {/* 선택된 종목이 없으면 메인 화면, 있으면 차트 */}
        {!selectedStock ? renderMainView() : renderChart()}

        {/* 목록으로 돌아가기 버튼 */}
        {selectedStock && (
          <TouchableOpacity
            style={[styles.backToListButton, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}
            onPress={() => setSelectedStock(null)}>
            <IconSymbol size={18} name="chevron.left" color="#6366F1" />
            <Text style={[styles.backToListText, { color: '#6366F1' }]}>목록으로</Text>
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
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
  favoritesList: {
    gap: 12,
  },
  favoriteCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  favoriteButton: {
    padding: 8,
  },
  favoriteButtonLarge: {
    padding: 8,
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
    fontWeight: '600',
  },
  infoDetail: {
    fontSize: 13,
    lineHeight: 20,
  },
  backToListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  backToListText: {
    fontSize: 15,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 20,
  },
});
