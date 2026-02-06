import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useColorScheme } from '../hooks/useColorScheme';
import { Colors } from '../constants/theme';
import { TabParamList } from './types';

// Screens
import HomeScreen from '../screens/HomeScreen';
import TeamsScreen from '../screens/TeamsScreen';
import InvestScreen from '../screens/InvestScreen';
import ChartScreen from '../screens/ChartScreen';

// Components
import { IconSymbol } from '../components/ui/IconSymbol';
import { HapticTab } from '../components/HapticTab';

const Tab = createBottomTabNavigator<TabParamList>();

export default function TabNavigator() {
    const colorScheme = useColorScheme();

    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
                headerShown: false,
                tabBarButton: HapticTab,
                tabBarStyle: {
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 8,
                },
            }}>
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    title: '홈',
                    tabBarIcon: ({ color }) => <IconSymbol size={26} name="house.fill" color={color} />,
                }}
            />
            <Tab.Screen
                name="Teams"
                component={TeamsScreen}
                options={{
                    title: '배틀',
                    tabBarIcon: ({ color }) => <IconSymbol size={26} name="person.3.fill" color={color} />,
                }}
            />
            <Tab.Screen
                name="Invest"
                component={InvestScreen}
                options={{
                    title: '투자',
                    tabBarIcon: ({ color }) => <IconSymbol size={26} name="chart.line.uptrend.xyaxis" color={color} />,
                }}
            />
            <Tab.Screen
                name="Chart"
                component={ChartScreen}
                options={{
                    title: '차트',
                    tabBarIcon: ({ color }) => <IconSymbol size={26} name="chart.bar.fill" color={color} />,
                }}
            />
        </Tab.Navigator>
    );
}
