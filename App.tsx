/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import VoiceClipListScreen from './src/screens/VoiceClipListScreen';
import { ThemeProvider } from './src/theme/ThemeProvider';
import colors from './src/theme/colors';

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
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <NavigationContainer theme={navigationTheme}>
          <Stack.Navigator
            initialRouteName="VoiceClipList"
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="VoiceClipList" component={VoiceClipListScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

export default App;
