import React, { useCallback, useEffect, useState } from 'react';
import {
    FlatList,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    RefreshControl,
} from 'react-native';
import { ThemedText } from '../components/ThemedText';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/useColorScheme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import {
    NotificationItem,
    getNotifications,
    markAsRead,
    markAllAsRead,
} from '../services/notificationService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// 알림 타입별 아이콘/색상
const NOTIFICATION_CONFIG = {
    ORDER_FILLED: { icon: '💰', label: '주문 체결', color: '#10B981' },
    BATTLE_START: { icon: '⚔️', label: '팀전', color: '#6366F1' },
    RANK_CHANGE: { icon: '📊', label: '순위 변동', color: '#F59E0B' },
    PRICE_ALERT: { icon: '📈', label: '가격 알림', color: '#EF4444' },
};

export default function NotificationScreen() {
    const navigation = useNavigation<NavigationProp>();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const isDark = colorScheme === 'dark';

    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const loadNotifications = useCallback(async () => {
        try {
            const data = await getNotifications();
            setNotifications(data);
        } catch (error) {
            console.error('알림 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadNotifications();
        setRefreshing(false);
    }, [loadNotifications]);

    // 개별 알림 터치 → 읽음 처리
    const handleNotificationPress = async (item: NotificationItem) => {
        if (!item.isRead) {
            try {
                await markAsRead(item.id);
                setNotifications(prev =>
                    prev.map(n => (n.id === item.id ? { ...n, isRead: true } : n)),
                );
            } catch (error) {
                console.error('읽음 처리 실패:', error);
            }
        }
    };

    // 전체 읽음 처리
    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('전체 읽음 처리 실패:', error);
        }
    };

    // 시간 포맷팅
    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        const diffHour = Math.floor(diffMs / 3600000);
        const diffDay = Math.floor(diffMs / 86400000);

        if (diffMin < 1) return '방금 전';
        if (diffMin < 60) return `${diffMin}분 전`;
        if (diffHour < 24) return `${diffHour}시간 전`;
        if (diffDay < 7) return `${diffDay}일 전`;
        return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const renderNotification = ({ item }: { item: NotificationItem }) => {
        const config = NOTIFICATION_CONFIG[item.type];

        return (
            <TouchableOpacity
                style={[
                    styles.notificationCard,
                    {
                        backgroundColor: isDark
                            ? item.isRead ? '#1E293B' : '#1E3A5F'
                            : item.isRead ? '#FFFFFF' : '#EEF2FF',
                    },
                ]}
                onPress={() => handleNotificationPress(item)}
                activeOpacity={0.7}>
                {/* 아이콘 */}
                <View style={[styles.iconContainer, { backgroundColor: config.color + '20' }]}>
                    <ThemedText style={styles.iconText}>{config.icon}</ThemedText>
                </View>

                {/* 내용 */}
                <View style={styles.contentContainer}>
                    <View style={styles.titleRow}>
                        <ThemedText
                            style={[
                                styles.notificationTitle,
                                { color: isDark ? '#F1F5F9' : '#1E293B' },
                                item.isRead ? {} : styles.unreadTitle,
                            ]}>
                            {item.title}
                        </ThemedText>
                        {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: config.color }]} />}
                    </View>
                    <Text
                        style={[styles.notificationMessage, { color: isDark ? '#94A3B8' : '#64748B' }]}
                        numberOfLines={2}>
                        {item.message}
                    </Text>
                    <ThemedText style={[styles.timeText, { color: isDark ? '#64748B' : '#94A3B8' }]}>
                        {formatTime(item.createdAt)}
                    </ThemedText>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
            {/* 헤더 */}
            <View style={[styles.header, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ThemedText style={[styles.backText, { color: colors.tint }]}>←</ThemedText>
                    </TouchableOpacity>
                    <ThemedText style={[styles.headerTitle, { color: isDark ? '#F1F5F9' : '#1E293B' }]}>
                        알림
                    </ThemedText>
                    {unreadCount > 0 ? (
                        <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.readAllButton}>
                            <ThemedText style={[styles.readAllText, { color: colors.tint }]}>
                                전체 읽음
                            </ThemedText>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.readAllButton} />
                    )}
                </View>
            </View>

            {/* 알림 목록 */}
            <FlatList
                data={notifications}
                renderItem={renderNotification}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <ThemedText style={styles.emptyIcon}>🔔</ThemedText>
                        <ThemedText style={[styles.emptyText, { color: isDark ? '#64748B' : '#94A3B8' }]}>
                            {loading ? '알림을 불러오는 중...' : '알림이 없습니다'}
                        </ThemedText>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 50 : 12,
        paddingBottom: 12,
        paddingHorizontal: 20,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    backButton: {
        padding: 4,
        width: 60,
    },
    backText: {
        fontSize: 24,
        fontWeight: '600',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    readAllButton: {
        width: 60,
        alignItems: 'flex-end',
    },
    readAllText: {
        fontSize: 13,
        fontWeight: '600',
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    notificationCard: {
        flexDirection: 'row',
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    iconText: {
        fontSize: 20,
    },
    contentContainer: {
        flex: 1,
        gap: 4,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    notificationTitle: {
        fontSize: 15,
        fontWeight: '500',
        flex: 1,
    },
    unreadTitle: {
        fontWeight: '700',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    notificationMessage: {
        fontSize: 13,
        lineHeight: 18,
    },
    timeText: {
        fontSize: 11,
        marginTop: 2,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 80,
        gap: 12,
    },
    emptyIcon: {
        fontSize: 48,
    },
    emptyText: {
        fontSize: 15,
    },
});
