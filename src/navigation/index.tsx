import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme, NavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import TeacherNavigator from '../navigation/TeacherNavigator';
import StudentNavigator from '../navigation/StudentNavigator';
import VoiceClipListScreen from '../screens/VoiceClipListScreen';
import colors from '../theme/colors';
import { getAuthToken, getCurrentUser } from '../services/api';

// Define the root stack parameter list
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  TeacherDashboard: undefined;
  StudentDashboard: undefined;
  VoiceClipList: undefined;
};

// Create the stack navigator
const Stack = createStackNavigator<RootStackParamList>();

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

const AppNavigator = () => {
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Login');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = getAuthToken();
        const user = getCurrentUser();

        if (token && user) {
          // User is authenticated, determine initial route based on user_group
          if (user.user_group === 'teacher') {
            setInitialRoute('TeacherDashboard');
          } else if (user.user_group === 'student') {
            setInitialRoute('StudentDashboard');
          } else {
            // Fallback for unknown user_group
            setInitialRoute('VoiceClipList');
          }
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        setIsReady(true);
      }
    };

    checkAuthStatus();
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="TeacherDashboard" component={TeacherNavigator} />
      <Stack.Screen name="StudentDashboard" component={StudentNavigator} />
      <Stack.Screen name="VoiceClipList" component={VoiceClipListScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator; 