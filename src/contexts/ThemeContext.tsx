import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSettings, updateSettings } from '../services/settingsService';

interface ThemeContextType {
    darkMode: boolean;
    setDarkMode: (darkMode: boolean) => void;
    toggleDarkMode: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
    children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    const [darkMode, setDarkMode] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // 앱 시작 시 백엔드에서 설정 로드
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const settings = await getSettings();
            setDarkMode(settings.darkMode);
        } catch (error) {
            console.error('Failed to load theme settings:', error);
            // 실패 시 시스템 설정 사용
            setDarkMode(false);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleDarkMode = async () => {
        try {
            const newDarkMode = !darkMode;
            await updateSettings({ darkMode: newDarkMode });
            setDarkMode(newDarkMode);
        } catch (error) {
            console.error('Failed to update theme settings:', error);
            throw error;
        }
    };

    const value = {
        darkMode,
        setDarkMode,
        toggleDarkMode,
    };

    // 로딩 중에는 빈 화면 표시 (또는 스플래시 스크린)
    if (isLoading) {
        return null;
    }

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
