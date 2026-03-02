import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSettings, updateSettings } from '../services/settingsService';
import { getAccessToken } from '../utils/tokenStorage';

interface ThemeContextType {
    darkMode: boolean;
    setDarkMode: (darkMode: boolean) => void;
    toggleDarkMode: () => Promise<void>;
    reloadSettings: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
    children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    const [darkMode, setDarkMode] = useState(false);

    // 앱 시작 시 백엔드에서 설정 로드 (로그인 상태일 때만)
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            // 토큰이 없으면 API 호출 생략 (흰 화면 방지)
            const token = await getAccessToken();
            if (!token) return;

            const settings = await getSettings();
            setDarkMode(settings.darkMode);
        } catch (error) {
            console.error('Failed to load theme settings:', error);
            // 실패 시 기본값(false) 유지
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
        reloadSettings: loadSettings, // 로그인 후 호출용
    };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
