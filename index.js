/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import messaging from '@react-native-firebase/messaging';

// 백그라운드/종료 상태에서 FCM 메시지를 수신했을 때의 핸들러
// React 컴포넌트 외부에서 반드시 등록해야 함
messaging().setBackgroundMessageHandler(async remoteMessage => {
    // 백그라운드 수신은 OS가 자동으로 알림을 표시함
    // 별도 처리가 필요한 경우 여기에 추가 (예: 뱃지 카운트 업데이트)
    console.log('[FCM] 백그라운드 메시지 수신:', remoteMessage);
});

AppRegistry.registerComponent(appName, () => App);
