import React from 'react';
import { Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface IconSymbolProps {
    name: string;
    size?: number;
    color?: string;
    style?: ViewStyle | TextStyle;
}

/**
 * SF Symbols style icon component
 * For React Native CLI, we use emoji or a simple text as placeholder.
 * You can replace this with react-native-vector-icons or similar.
 */
export function IconSymbol({ name, size = 24, color = '#000', style }: IconSymbolProps) {
    // Map SF Symbol names to emoji or unicode characters
    const iconMap: Record<string, string> = {
        'house.fill': '🏠',
        'person.3.fill': '👥',
        'chart.line.uptrend.xyaxis': '📈',
        'chart.bar.fill': '📊',
        'bell.fill': '🔔',
        'person.circle.fill': '👤',
        'chevron.left': '‹',
        'chevron.right': '›',
        'magnifyingglass': '🔍',
        'xmark.circle.fill': '✕',
        'arrow.up': '↑',
        'arrow.down': '↓',
        'calendar': '📅',
        'person.2.fill': '👥',
        'clock.fill': '🕐',
        'cart.fill': '🛒',
        'arrow.up.circle.fill': '⬆️',
        'person.badge.plus.fill': '➕',
        'heart': '♡',
        'paperplane.fill': '✈️',
        'lock.fill': '🔒',
        'play.circle.fill': '▶️',
        'shield.fill': '🛡️',
        'plus': '+',
        'minus': '−',
        'plus.circle.fill': '⊕',
        'checkmark': '✓',
        'checkmark.circle.fill': '✓',
        'info.circle.fill': 'ℹ️',
        'doc.on.doc.fill': '📋',
        'square.and.arrow.up.fill': '⬆️',
        'crown.fill': '👑',
        'tray': '📥',
    };

    const emoji = iconMap[name] || '●';

    return (
        <Text style={[styles.icon, { fontSize: size, color }, style]}>
            {emoji}
        </Text>
    );
}

const styles = StyleSheet.create({
    icon: {
        fontFamily: 'System',
    },
});
