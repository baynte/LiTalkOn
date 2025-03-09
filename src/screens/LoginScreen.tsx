import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { login } from '../services/auth';
import { LoginCredentials } from '../types';
import LogoPlaceholder from '../components/LogoPlaceholder';

interface LoginScreenProps {
  navigation: any;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const { colors, spacing, borderRadius, shadows } = theme;

  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Prepare login data
      const loginData = {
        username: credentials.username.trim(),
        password: credentials.password
      };
      
      // Double check the login data
      if (!loginData.password || loginData.password.length === 0) {
        throw new Error('Password is empty. Please enter your password.');
      }
      
      const result = await login(loginData);
      
      console.log('Login successful:', result);
      
      // Navigate based on user_group
      if (result.user_group === 'teacher') {
        navigation.replace('TeacherDashboard');
      } else if (result.user_group === 'student') {
        navigation.replace('StudentDashboard');
      } else {
        // Fallback to voice clip list if user_group is not recognized
        navigation.replace('VoiceClipList');
      }
    } catch (err: any) {
      console.error('Login error in component:', err);
      
      // Display a more user-friendly error message
      if (err.message.includes('Invalid username or password') || err.message.includes('not found') || err.message.includes('incorrect')) {
        setError('Invalid username or password. Please try again.');
      } else if (err.message.includes('network') || err.message.includes('Network')) {
        setError('Network error. Please check your internet connection and try again.');
      } else if (err.message.includes('Password is empty')) {
        setError(err.message);
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <LogoPlaceholder size={100} />
          <Text style={[styles.appName, { color: colors.primary }]}>LiTalkOn</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>
            Improve your pronunciation with voice analysis
          </Text>
        </View>

        <View
          style={[
            styles.formContainer,
            {
              backgroundColor: colors.surface,
              borderRadius: borderRadius.lg,
              ...shadows.medium,
            },
          ]}
        >
          <Text style={[styles.title, { color: colors.text }]}>Login</Text>

          {error && (
            <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Username</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Enter your username"
              placeholderTextColor={colors.textLight}
              keyboardType="default"
              autoCapitalize="none"
              value={credentials.username}
              onChangeText={(text) => setCredentials({ ...credentials, username: text })}
              editable={!isLoading}
              textContentType="username"
              autoComplete="username"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Enter your password"
              placeholderTextColor={colors.textLight}
              secureTextEntry
              value={credentials.password}
              onChangeText={(text) => {
                console.log('Password changed, length:', text.length);
                setCredentials({ ...credentials, password: text });
              }}
              editable={!isLoading}
              textContentType="password"
              autoComplete="password"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.forgotPasswordContainer,
              { alignSelf: 'flex-end' }
            ]}
            onPress={() => Alert.alert('Reset Password', 'This feature is not implemented in the demo.')}
          >
            <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
              Forgot Password?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: colors.primary },
              isLoading && { opacity: 0.7 },
            ]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.textOnPrimary} />
            ) : (
              <Text style={[styles.buttonText, { color: colors.textOnPrimary }]}>Login</Text>
            )}
          </TouchableOpacity>

          <View style={styles.registerContainer}>
            <Text style={[styles.registerText, { color: colors.textSecondary }]}>
              Don't have an account?
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={[styles.registerLink, { color: colors.primary }]}>
                {' '}
                Register
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textLight }]}>
            © 2023 LiTalkOn. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  formContainer: {
    padding: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  forgotPasswordContainer: {
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
  },
});

export default LoginScreen; 