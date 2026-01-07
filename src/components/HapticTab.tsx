import React from 'react';
import { TouchableOpacity, Platform, GestureResponderEvent, ViewStyle } from 'react-native';

interface HapticTabProps {
    children: React.ReactNode;
    style?: ViewStyle;
    onPress?: (event: GestureResponderEvent) => void;
    accessibilityRole?: 'button' | 'tab';
    accessibilityState?: { selected?: boolean };
    accessibilityLabel?: string;
    testID?: string;
}

/**
 * Tab button with haptic feedback
 * Note: For actual haptic feedback, install react-native-haptic-feedback
 */
export function HapticTab({ children, style, onPress, ...props }: HapticTabProps) {
    const handlePress = (event: GestureResponderEvent) => {
        // Haptic feedback placeholder - install react-native-haptic-feedback for actual implementation
        if (Platform.OS === 'ios') {
            // You can add: import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
            // ReactNativeHapticFeedback.trigger('selection');
        }
        onPress?.(event);
    };

    return (
        <TouchableOpacity style={style} onPress={handlePress} activeOpacity={0.7} {...props}>
            {children}
        </TouchableOpacity>
    );
}
