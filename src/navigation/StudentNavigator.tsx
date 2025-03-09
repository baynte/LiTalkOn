import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/ThemeProvider';

// Import student screens
import StudentDashboardScreen from '../screens/student/StudentDashboardScreen';
import PracticeTestsScreen from '../screens/student/PracticeTestsScreen';
import PracticeTestDetailScreen from '../screens/student/PracticeTestDetailScreen';
import ExamTestsScreen from '../screens/student/ExamTestsScreen';
import ExamTestDetailScreen from '../screens/student/ExamTestDetailScreen';
import StudentProfileScreen from '../screens/student/StudentProfileScreen';

// Define the parameter lists for each navigator
export type StudentTabParamList = {
  Dashboard: undefined;
  PracticeTests: undefined;
  ExamTests: undefined;
  Profile: undefined;
};

export type StudentPracticeTestStackParamList = {
  PracticeTestsList: undefined;
  PracticeTestDetail: { testId: string };
};

export type StudentExamTestStackParamList = {
  ExamTestsList: undefined;
  ExamTestDetail: { testId: string };
};

// Create the navigators
const Tab = createBottomTabNavigator<StudentTabParamList>();
const PracticeTestStack = createStackNavigator<StudentPracticeTestStackParamList>();
const ExamTestStack = createStackNavigator<StudentExamTestStackParamList>();

// Practice Test Stack Navigator
const PracticeTestNavigator = () => {
  return (
    <PracticeTestStack.Navigator>
      <PracticeTestStack.Screen 
        name="PracticeTestsList" 
        component={PracticeTestsScreen} 
        options={{ title: 'Practice Tests' }}
      />
      <PracticeTestStack.Screen 
        name="PracticeTestDetail" 
        component={PracticeTestDetailScreen} 
        options={{ title: 'Practice Test' }}
      />
    </PracticeTestStack.Navigator>
  );
};

// Exam Test Stack Navigator
const ExamTestNavigator = () => {
  return (
    <ExamTestStack.Navigator>
      <ExamTestStack.Screen 
        name="ExamTestsList" 
        component={ExamTestsScreen} 
        options={{ title: 'Exam Tests' }}
      />
      <ExamTestStack.Screen 
        name="ExamTestDetail" 
        component={ExamTestDetailScreen} 
        options={{ title: 'Exam Test' }}
      />
    </ExamTestStack.Navigator>
  );
};

// Main Student Tab Navigator
const StudentNavigator = () => {
  const theme = useTheme();
  const { colors } = theme;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
          } else if (route.name === 'PracticeTests') {
            iconName = focused ? 'book-open-variant' : 'book-open-outline';
          } else if (route.name === 'ExamTests') {
            iconName = focused ? 'clipboard-text' : 'clipboard-text-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'account' : 'account-outline';
          }

          return <Icon name={iconName || 'help'} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text,
        tabBarStyle: {
          backgroundColor: colors.card,
        },
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.text,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={StudentDashboardScreen} 
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen 
        name="PracticeTests" 
        component={PracticeTestNavigator} 
        options={{ title: 'Practice Tests', headerShown: false }}
      />
      <Tab.Screen 
        name="ExamTests" 
        component={ExamTestNavigator} 
        options={{ title: 'Exam Tests', headerShown: false }}
      />
      <Tab.Screen 
        name="Profile" 
        component={StudentProfileScreen} 
        options={{ title: 'My Profile' }}
      />
    </Tab.Navigator>
  );
};

export default StudentNavigator; 