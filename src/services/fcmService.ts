/**
 * FCM (Firebase Cloud Messaging) 서비스
 *
 * 역할:
 * - 앱 시작 시 알림 권한 요청
 * - FCM 디바이스 토큰 발급 및 백엔드 등록
 * - 포그라운드 메시지 수신 처리 (알림 표시)
 * - 백그라운드/종료 상태 알림 탭으로 화면 이동 처리
 */

import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { registerFcmToken } from './notificationService';
import { navigationRef } from '../navigation/navigationRef';

// ─────────────────────────────────────────────
// 권한 요청 + 토큰 발급 + 백엔드 등록
// AppNavigator 마운트 후 로그인 완료 시점에 호출
// ─────────────────────────────────────────────
export async function initFcm(): Promise<void> {
    try {
        // iOS는 명시적 권한 요청 필요 (Android 13+ 도 필요)
        const authStatus = await messaging().requestPermission();
        const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (!enabled) {
            console.log('[FCM] 알림 권한 거부됨');
            return;
        }

        // APNs 토큰 준비 대기 (iOS only)
        if (Platform.OS === 'ios') {
            await messaging().registerDeviceForRemoteMessages();
        }

        // FCM 토큰 발급
        const token = await messaging().getToken();
        console.log('[FCM] 토큰 발급:', token);

        // 백엔드에 토큰 저장
        await registerFcmToken(token);

        // 토큰 갱신 시 자동으로 백엔드에도 업데이트
        messaging().onTokenRefresh(async (newToken) => {
            console.log('[FCM] 토큰 갱신:', newToken);
            await registerFcmToken(newToken);
        });

    } catch (error) {
        // FCM 실패해도 앱은 정상 동작 (폴링 방식으로 폴백)
        console.warn('[FCM] 초기화 실패 (폴링 폴백):', error);
    }
}

// ─────────────────────────────────────────────
// 포그라운드 메시지 리스너
// AppNavigator 마운트 시 등록 → 언마운트 시 해제
// ─────────────────────────────────────────────
export function setupForegroundMessageHandler(
    onMessage: (notification: { title: string; body: string; type: string }) => void,
): () => void {
    const unsubscribe = messaging().onMessage(async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
        const title = remoteMessage.notification?.title ?? '';
        const body = remoteMessage.notification?.body ?? '';
        const type = String(remoteMessage.data?.type ?? '');

        console.log('[FCM] 포그라운드 메시지:', { title, body, type });
        onMessage({ title, body, type });
    });

    return unsubscribe; // cleanup 함수 반환
}

// ─────────────────────────────────────────────
// 백그라운드/종료 상태에서 알림 탭 → 특정 화면 이동
// index.js 또는 App.tsx 최상단에서 한 번만 등록
// ─────────────────────────────────────────────
export function setupBackgroundNotificationHandler(): void {
    // 백그라운드 상태에서 알림 탭
    messaging().onNotificationOpenedApp((remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
        console.log('[FCM] 백그라운드 알림 탭:', remoteMessage);
        navigateFromPush(remoteMessage);
    });

    // 앱 종료 상태에서 알림 탭으로 앱 실행
    messaging()
        .getInitialNotification()
        .then((remoteMessage: FirebaseMessagingTypes.RemoteMessage | null) => {
            if (remoteMessage) {
                console.log('[FCM] 종료 상태 알림 탭:', remoteMessage);
                // navigationRef가 준비될 때까지 약간 대기
                setTimeout(() => navigateFromPush(remoteMessage), 1000);
            }
        });
}

// 알림 타입에 따라 화면 이동
function navigateFromPush(remoteMessage: FirebaseMessagingTypes.RemoteMessage): void {
    if (!navigationRef.isReady()) return;
    navigationRef.navigate('Notifications');
}
