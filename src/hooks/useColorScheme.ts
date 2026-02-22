import { useColorScheme as useRNColorScheme } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Hook to get the current color scheme
 * Uses user preference from ThemeContext if available, otherwise falls back to system setting
 */
export function useColorScheme(): 'light' | 'dark' {
    try {
        // 사용자 설정 우선 사용
        const { darkMode } = useTheme();
        return darkMode ? 'dark' : 'light';
    } catch {
        // ThemeProvider 밖에서 호출된 경우 시스템 설정 사용
        const colorScheme = useRNColorScheme();
        if (colorScheme === 'dark') {
            return 'dark';
        }
        return 'light';
    }
}
