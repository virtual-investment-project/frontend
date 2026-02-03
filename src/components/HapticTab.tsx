import React from 'react';
import { Pressable, Platform, StyleSheet } from 'react-native';
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';

export type HapticTabProps = BottomTabBarButtonProps;

/**
 * Tab button with haptic feedback
 * Note: For actual haptic feedback, install react-native-haptic-feedback
 */
export function HapticTab(props: HapticTabProps) {
    const { style, children, accessibilityState, ...rest } = props;

    const handlePress = () => {
        // Haptic feedback placeholder - install react-native-haptic-feedback for actual implementation
        if (Platform.OS === 'ios') {
            // You can add: import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
            // ReactNativeHapticFeedback.trigger('selection');
        }
        props.onPress?.({} as any);
    };

    return (
        <Pressable
            style={[styles.button, style as any]}
            onPress={handlePress}
            accessibilityRole="button"
            accessibilityState={accessibilityState}
        >
            {children}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
