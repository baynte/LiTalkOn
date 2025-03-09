import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/ThemeProvider';

// Import teacher screens
import TeacherDashboardScreen from '../screens/teacher/TeacherDashboardScreen';
import PracticeTestListScreen from '../screens/teacher/PracticeTestListScreen';
import CreatePracticeTestScreen from '../screens/teacher/CreatePracticeTestScreen';
import EditPracticeTestScreen from '../screens/teacher/EditPracticeTestScreen';
import ExamTestListScreen from '../screens/teacher/ExamTestListScreen';
import CreateExamTestScreen from '../screens/teacher/CreateExamTestScreen';
import EditExamTestScreen from '../screens/teacher/EditExamTestScreen';
import StudentRankingsScreen from '../screens/teacher/StudentRankingsScreen';

// Define the parameter lists for each navigator
export type TeacherTabParamList = {
  Dashboard: undefined;
  PracticeTests: undefined;
  ExamTests: undefined;
  Rankings: undefined;
};

export type TeacherPracticeTestStackParamList = {
  PracticeTestList: undefined;
  CreatePracticeTest: undefined;
  EditPracticeTest: { testId: string };
};

export type TeacherExamTestStackParamList = {
  ExamTestList: undefined;
  CreateExamTest: undefined;
  EditExamTest: { testId: string };
};

// Create the navigators
const Tab = createBottomTabNavigator<TeacherTabParamList>();
const PracticeTestStack = createStackNavigator<TeacherPracticeTestStackParamList>();
const ExamTestStack = createStackNavigator<TeacherExamTestStackParamList>();

// Practice Test Stack Navigator
const PracticeTestNavigator = () => {
  return (
    <PracticeTestStack.Navigator>
      <PracticeTestStack.Screen 
        name="PracticeTestList" 
        component={PracticeTestListScreen} 
        options={{ title: 'Practice Tests' }}
      />
      <PracticeTestStack.Screen 
        name="CreatePracticeTest" 
        component={CreatePracticeTestScreen} 
        options={{ title: 'Create Practice Test' }}
      />
      <PracticeTestStack.Screen 
        name="EditPracticeTest" 
        component={EditPracticeTestScreen} 
        options={{ title: 'Edit Practice Test' }}
      />
    </PracticeTestStack.Navigator>
  );
};

// Exam Test Stack Navigator
const ExamTestNavigator = () => {
  return (
    <ExamTestStack.Navigator>
      <ExamTestStack.Screen 
        name="ExamTestList" 
        component={ExamTestListScreen} 
        options={{ title: 'Exam Tests' }}
      />
      <ExamTestStack.Screen 
        name="CreateExamTest" 
        component={CreateExamTestScreen} 
        options={{ title: 'Create Exam Test' }}
      />
      <ExamTestStack.Screen 
        name="EditExamTest" 
        component={EditExamTestScreen} 
        options={{ title: 'Edit Exam Test' }}
      />
    </ExamTestStack.Navigator>
  );
};

// Main Teacher Tab Navigator
const TeacherNavigator = () => {
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
          } else if (route.name === 'Rankings') {
            iconName = focused ? 'trophy' : 'trophy-outline';
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
        component={TeacherDashboardScreen} 
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
        name="Rankings" 
        component={StudentRankingsScreen} 
        options={{ title: 'Student Rankings' }}
      />
    </Tab.Navigator>
  );
};

export default TeacherNavigator; 