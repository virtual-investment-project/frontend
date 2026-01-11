import React from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColorScheme } from '../hooks/useColorScheme';
import { RootStackParamList } from './types';

// Navigators
import TabNavigator from './TabNavigator';

// Screens
import LoginScreen from '../screens/LoginScreen';
import AdditionalInfoScreen from '../screens/AdditionalInfoScreen';
import BattleDetailScreen from '../screens/BattleDetailScreen';
import CreateBattleScreen from '../screens/CreateBattleScreen';
import MyScreen from '../screens/MyScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
    const colorScheme = useColorScheme();

    return (
        <NavigationContainer theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack.Navigator initialRouteName="Main" screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="AdditionalInfo" component={AdditionalInfoScreen} />
                <Stack.Screen name="Main" component={TabNavigator} />
                <Stack.Screen name="BattleDetail" component={BattleDetailScreen} />
                <Stack.Screen name="CreateBattle" component={CreateBattleScreen} />
                <Stack.Screen name="My" component={MyScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
