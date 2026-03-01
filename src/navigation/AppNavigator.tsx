import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColorScheme } from '../hooks/useColorScheme';
import { RootStackParamList } from './types';
import { navigationRef } from './navigationRef';
import { initFcm, setupForegroundMessageHandler, setupBackgroundNotificationHandler } from '../services/fcmService';

// Navigators
import TabNavigator from './TabNavigator';

// Screens
import LoginScreen from '../screens/LoginScreen';
import AdditionalInfoScreen from '../screens/AdditionalInfoScreen';
import BattleDetailScreen from '../screens/BattleDetailScreen';
import TeamManageScreen from '../screens/TeamManageScreen';
import CreateBattleScreen from '../screens/CreateBattleScreen';
import MyScreen from '../screens/MyScreen';
import NotificationScreen from '../screens/NotificationScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
    const colorScheme = useColorScheme();

    useEffect(() => {
        // 백그라운드/종료 상태에서 알림 탭 → 화면 이동 핸들러 등록
        setupBackgroundNotificationHandler();

        // FCM 권한 요청 + 토큰 발급 + 백엔드 등록
        initFcm();

        // 포그라운드 메시지 수신 처리
        const unsubscribe = setupForegroundMessageHandler(({ title, body }) => {
            // 포그라운드에서는 OS가 자동으로 알림을 표시하지 않으므로 직접 처리
            Alert.alert(title, body, [
                {
                    text: '확인',
                    style: 'cancel',
                },
                {
                    text: '알림 보기',
                    onPress: () => {
                        if (navigationRef.isReady()) {
                            navigationRef.navigate('Notifications');
                        }
                    },
                },
            ]);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    return (
        <NavigationContainer ref={navigationRef} theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack.Navigator initialRouteName="Main" screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="AdditionalInfo" component={AdditionalInfoScreen} />
                <Stack.Screen name="Main" component={TabNavigator} />
                <Stack.Screen name="BattleDetail" component={BattleDetailScreen} />
                <Stack.Screen name="TeamManage" component={TeamManageScreen} />
                <Stack.Screen name="CreateBattle" component={CreateBattleScreen} />
                <Stack.Screen name="My" component={MyScreen} />
                <Stack.Screen name="Notifications" component={NotificationScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
