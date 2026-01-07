import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * Hook to get the current color scheme
 */
export function useColorScheme(): 'light' | 'dark' {
    const colorScheme = useRNColorScheme();
    // Explicitly narrow the type
    if (colorScheme === 'dark') {
        return 'dark';
    }
    return 'light';
}
