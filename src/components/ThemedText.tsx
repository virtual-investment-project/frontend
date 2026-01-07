import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import { useColorScheme } from '../hooks/useColorScheme';
import { Colors } from '../constants/theme';

interface ThemedTextProps {
    children: React.ReactNode;
    type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
    style?: TextStyle | TextStyle[];
}

export function ThemedText({ children, type = 'default', style }: ThemedTextProps) {
    const colorScheme = useColorScheme();
    const color = Colors[colorScheme].text;

    return (
        <Text
            style={[
                styles.default,
                type === 'title' && styles.title,
                type === 'defaultSemiBold' && styles.defaultSemiBold,
                type === 'subtitle' && styles.subtitle,
                type === 'link' && styles.link,
                { color },
                style,
            ]}>
            {children}
        </Text>
    );
}

const styles = StyleSheet.create({
    default: {
        fontSize: 16,
        lineHeight: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        lineHeight: 40,
    },
    defaultSemiBold: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 24,
    },
    subtitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    link: {
        fontSize: 16,
        lineHeight: 24,
        color: '#6366F1',
    },
});
