/**
 * React Native App - Migrated from Expo
 * 
 * @format
 */

import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { FavoritesProvider } from './src/contexts/FavoritesContext';
import { ThemeProvider } from './src/contexts/ThemeContext';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <FavoritesProvider>
          <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
          <AppNavigator />
        </FavoritesProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

export default App;
