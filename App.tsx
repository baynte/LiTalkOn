/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import VoiceClipListScreen from './src/screens/VoiceClipListScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import { ThemeProvider } from './src/theme/ThemeProvider';
import colors from './src/theme/colors';
import { View, ActivityIndicator } from 'react-native';

// Create the stack navigator
const Stack = createStackNavigator();

// Create a custom navigation theme
const navigationTheme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.card,
    text: colors.text,
    border: colors.border,
    notification: colors.error,
  },
};

function App(): React.JSX.Element {
  // For demo purposes, we'll start with the login screen
  // In a real app, you would check if the user is already logged in
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate checking for existing login
  useEffect(() => {
    const checkLoginStatus = async () => {
      // In a real app, you would check for a stored token
      // For demo purposes, we'll just set isLoggedIn to false
      setTimeout(() => {
        setIsLoggedIn(false);
        setIsLoading(false);
      }, 1000);
    };

    checkLoginStatus();
  }, []);

  if (isLoading) {
    // In a real app, you would show a splash screen here
    return (
      <ThemeProvider>
        <SafeAreaProvider>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </SafeAreaProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <NavigationContainer theme={navigationTheme}>
          <Stack.Navigator
            initialRouteName={isLoggedIn ? "VoiceClipList" : "Login"}
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="VoiceClipList" component={VoiceClipListScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

export default App;
